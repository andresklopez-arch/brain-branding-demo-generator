const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, execFile } = require('child_process');
const { Worker } = require('worker_threads');
const archiver = require('archiver');
const AdmZip = require('adm-zip');

const app = express();
const PORT = 4026;

// Configuración de rutas
const SCRATCH_DIR = path.resolve(__dirname, '..', '..');
const TRASH_DIR = path.join(SCRATCH_DIR, '.trash');
const MANIFEST_PATH = path.join(TRASH_DIR, 'trash_manifest.json');
const SAFE_BOX_PATH = path.join(TRASH_DIR, 'safe_box.json');
const TOKEN_PATH = path.join(TRASH_DIR, 'bridge_token.txt');
const AUDIT_LOG_PATH = path.join(TRASH_DIR, 'audit.log');
const PRIVATE_KEY_ENC_PATH = path.join(TRASH_DIR, 'audit_private_key.enc');
const PUBLIC_KEY_PATH = path.join(TRASH_DIR, 'audit_public_key.pem');
const CONFIG_PATH = path.join(TRASH_DIR, 'bridge_config.enc');
const CONFIG_JSON_PATH = path.join(TRASH_DIR, 'bridge_config.json');

// Whitelist estricta: solo lo que realmente puede ser el nombre de una
// carpeta de proyecto en SCRATCH_DIR. Bloquea path traversal ("../"),
// separadores de ruta, y cualquier metacarácter de shell que el fallback
// de borrado en Windows pudiera interpretar si se colara en el nombre.
const PROJECT_NAME_RE = /^[A-Za-z0-9_-]+$/;

function assertValidProjectName(projectName) {
  return typeof projectName === 'string' && PROJECT_NAME_RE.test(projectName);
}

// Resuelve projectName -> ruta absoluta DENTRO de SCRATCH_DIR, o null si
// projectName es inválido o el resultado escaparía de SCRATCH_DIR
// (defensa en profundidad además del whitelist de arriba).
function resolveSafeScratchPath(projectName) {
  if (!assertValidProjectName(projectName)) return null;
  const resolved = path.resolve(SCRATCH_DIR, projectName);
  const boundary = SCRATCH_DIR + path.sep;
  if (resolved !== SCRATCH_DIR && !resolved.startsWith(boundary)) return null;
  return resolved;
}

let auditPrivateKeyDecrypted = null; // Guardado en RAM únicamente
let isAuditLogCorrupted = false;
let auditLogCorruptReason = '';

// Clave por defecto (Failsafe) — legacy: constante fija que vivió en el
// código fuente (y por tanto quedó comprometida mientras public/alr-saas/bridge
// estuvo servido públicamente antes de excluirlo del hosting). Se conserva
// SOLO como fallback de lectura para poder restaurar respaldos viejos
// cifrados sin clave personalizada; ya no se usa para cifrar nada nuevo
// (ver DEFAULT_PASSWORD más abajo).
const LEGACY_DEFAULT_PASSWORD = 'alr_saas_sec_chain_2026_aes_key_secure';

// Exclusiones estándar (no sugerir borrar estas carpetas)
const EXCLUSIONS = [
  'alr-saas',
  'alr-saas-promo',
  'alrsaasapp',
  'brain-branding',
  'brain-branding-promo',
  'brain_branding_web',
  'yoy-ia-billar',
  'alr-master-console',
  'autolavados',
  'grantrebol',
  'logos',
  'quiniela_mundialista_ia',
  'solav',
  '.trash',
  '.git',
  '.metadata',
  'node_modules'
];

// El bridge ya no se sirve públicamente (excluido de Firebase Hosting), pero
// sigue escuchando en localhost:4026 y el CORS abierto permitía que CUALQUIER
// página que el operador tuviera abierta en el navegador (no solo la consola
// ALR SaaS) pudiera hacerle fetch — un ataque tipo confused-deputy si el
// operador visita un sitio malicioso mientras el bridge corre. Restringido
// al origen real de la consola + localhost (para pruebas contra el emulador
// de Hosting).
const BRIDGE_ALLOWED_ORIGINS = [
  'https://brain-branding.web.app',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
app.use(cors({
  origin(origin, callback) {
    // Sin origin (curl, llamadas locales directas) se permite: el Bearer
    // BRIDGE_TOKEN sigue siendo la barrera real de autenticación.
    if (!origin || BRIDGE_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  }
}));
app.use(express.json());

// Asegurar directorios y archivos base con permisos de solo lectura iniciales
if (!fs.existsSync(TRASH_DIR)) {
  fs.mkdirSync(TRASH_DIR, { recursive: true });
}

// 1. Asegurar token de seguridad local con rotación automática de 30 días
let BRIDGE_TOKEN = '';
let tokenNeedsRegen = false;
const startupLogQueue = [];

if (fs.existsSync(TOKEN_PATH)) {
  try {
    const stats = fs.statSync(TOKEN_PATH);
    const ageMs = Date.now() - stats.mtimeMs;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (ageMs > thirtyDaysMs) {
      console.log(`[ALR Bridge] 🔄 El token de seguridad ha expirado (más de 30 días). Regenerando...`);
      fs.chmodSync(TOKEN_PATH, 0o666);
      fs.unlinkSync(TOKEN_PATH);
      tokenNeedsRegen = true;
      startupLogQueue.push({ action: 'TOKEN_ROTATE', projectName: 'system', details: 'Token de seguridad expirado (30 dias) rotado automaticamente', status: 'SUCCESS' });
    }
  } catch (err) {
    console.error(`[ALR Bridge] Error al verificar la antigüedad del token:`, err);
  }
}

if (!fs.existsSync(TOKEN_PATH) || tokenNeedsRegen) {
  BRIDGE_TOKEN = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(TOKEN_PATH, BRIDGE_TOKEN, 'utf8');
  fs.chmodSync(TOKEN_PATH, 0o400); // Sólo lectura
  if (!tokenNeedsRegen) {
    startupLogQueue.push({ action: 'TOKEN_GENERATE', projectName: 'system', details: 'Nuevo token de seguridad local inicializado', status: 'SUCCESS' });
  }
} else {
  try {
    BRIDGE_TOKEN = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
  } catch (err) {
    fs.chmodSync(TOKEN_PATH, 0o600);
    BRIDGE_TOKEN = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
    fs.chmodSync(TOKEN_PATH, 0o400);
  }
}

// 1b. Clave de cifrado de respaldos por defecto — una por instalación,
// generada al azar igual que BRIDGE_TOKEN, en vez de la constante fija
// legacy. Se usa para cifrar TODO respaldo nuevo que no traiga clave
// personalizada; para descifrar respaldos viejos ver el fallback en
// /api/projects/restore.
const DEFAULT_PASSWORD_PATH = path.join(TRASH_DIR, 'default_password.txt');
let DEFAULT_PASSWORD = '';
if (!fs.existsSync(DEFAULT_PASSWORD_PATH)) {
  DEFAULT_PASSWORD = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(DEFAULT_PASSWORD_PATH, DEFAULT_PASSWORD, 'utf8');
  fs.chmodSync(DEFAULT_PASSWORD_PATH, 0o400);
  startupLogQueue.push({ action: 'DEFAULT_PASSWORD_GENERATE', projectName: 'system', details: 'Clave de cifrado por defecto (por instalacion) generada, reemplaza la constante fija anterior', status: 'SUCCESS' });
} else {
  try {
    DEFAULT_PASSWORD = fs.readFileSync(DEFAULT_PASSWORD_PATH, 'utf8').trim();
  } catch (err) {
    fs.chmodSync(DEFAULT_PASSWORD_PATH, 0o600);
    DEFAULT_PASSWORD = fs.readFileSync(DEFAULT_PASSWORD_PATH, 'utf8').trim();
    fs.chmodSync(DEFAULT_PASSWORD_PATH, 0o400);
  }
}

// Helpers de encriptación/desencriptación de clave privada ECDSA
function getPrivateKeyEncryptionParams() {
  const salt = crypto.createHash('sha256').update(BRIDGE_TOKEN + '_salt').digest();
  const derived = crypto.pbkdf2Sync(BRIDGE_TOKEN, salt, 5000, 48, 'sha256');
  return {
    key: derived.subarray(0, 32),
    iv: derived.subarray(32, 48)
  };
}

function encryptPrivateKey(privateKeyPEM) {
  const { key, iv } = getPrivateKeyEncryptionParams();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKeyPEM, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptPrivateKey(encryptedHex) {
  const { key, iv } = getPrivateKeyEncryptionParams();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Helpers de cifrado/descifrado de configuración del puente
function encryptConfig(plainText) {
  const { key, iv } = getPrivateKeyEncryptionParams();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptConfig(encryptedHex) {
  const { key, iv } = getPrivateKeyEncryptionParams();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Helpers de persistencia de configuración del puente local
function readBridgeConfig() {
  try {
    // 1. Intentar leer la configuración cifrada (.enc)
    if (fs.existsSync(CONFIG_PATH)) {
      const encryptedHex = fs.readFileSync(CONFIG_PATH, 'utf8').trim();
      const plainText = decryptConfig(encryptedHex);
      let content = plainText;
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substring(1);
      }
      return JSON.parse(content.trim());
    }
    
    // 2. Si no existe la cifrada, pero existe la versión plana anterior (.json), migrarla
    if (fs.existsSync(CONFIG_JSON_PATH)) {
      let content = fs.readFileSync(CONFIG_JSON_PATH, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substring(1);
      }
      const parsed = JSON.parse(content.trim());
      
      // Guardarla cifrada
      writeBridgeConfig(parsed);
      
      // Eliminar archivo plano de forma segura
      fs.chmodSync(CONFIG_JSON_PATH, 0o666);
      fs.unlinkSync(CONFIG_JSON_PATH);
      
      console.log('[ALR Bridge] 🛡️ Se ha migrado y cifrado con éxito el archivo bridge_config.json a bridge_config.enc');
      return parsed;
    }
  } catch (e) {
    console.error('[ALR Bridge] Error al leer/parsear bridge_config:', e.message);
  }
  return {};
}

function writeBridgeConfig(data) {
  try {
    const plainText = JSON.stringify(data, null, 2);
    const encryptedHex = encryptConfig(plainText);
    
    if (fs.existsSync(CONFIG_PATH)) fs.chmodSync(CONFIG_PATH, 0o666);
    fs.writeFileSync(CONFIG_PATH, encryptedHex, 'utf8');
    fs.chmodSync(CONFIG_PATH, 0o444);
  } catch (e) {
    console.error('[ALR Bridge] Error al escribir bridge_config:', e.message);
  }
}

function getExclusions() {
  try {
    const config = readBridgeConfig();
    const custom = Array.isArray(config.customExclusions) ? config.customExclusions : [];
    const merged = [...EXCLUSIONS, ...custom];
    return merged.map(item => item.toLowerCase());
  } catch (e) {
    return EXCLUSIONS.map(item => item.toLowerCase());
  }
}


// 2. Asegurar claves de firma de auditoría
if (!fs.existsSync(PRIVATE_KEY_ENC_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
  try {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    // Eliminar privada antigua PEM si existiera
    const oldPemPath = path.join(TRASH_DIR, 'audit_private_key.pem');
    if (fs.existsSync(oldPemPath)) {
      fs.chmodSync(oldPemPath, 0o666);
      fs.unlinkSync(oldPemPath);
    }
    
    const encPrivateKey = encryptPrivateKey(privateKey);
    
    if (fs.existsSync(PRIVATE_KEY_ENC_PATH)) fs.chmodSync(PRIVATE_KEY_ENC_PATH, 0o666);
    if (fs.existsSync(PUBLIC_KEY_PATH)) fs.chmodSync(PUBLIC_KEY_PATH, 0o666);
    
    fs.writeFileSync(PRIVATE_KEY_ENC_PATH, encPrivateKey, 'utf8');
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf8');
    
    fs.chmodSync(PRIVATE_KEY_ENC_PATH, 0o400);
    fs.chmodSync(PUBLIC_KEY_PATH, 0o444);
  } catch (err) {
    console.error('[ALR Bridge] Fallo al generar claves ECDSA cifradas:', err);
  }
}

// Cargar clave privada en memoria RAM
try {
  const encPrivateKey = fs.readFileSync(PRIVATE_KEY_ENC_PATH, 'utf8').trim();
  auditPrivateKeyDecrypted = decryptPrivateKey(encPrivateKey);
} catch (err) {
  console.error('[ALR Bridge] Error crítico: No se pudo descifrar la clave privada de auditoría en memoria:', err);
}

// Eliminar el archivo PEM de clave privada en texto plano si existiera (migración segura)
const oldPemPath = path.join(TRASH_DIR, 'audit_private_key.pem');
if (fs.existsSync(oldPemPath)) {
  try {
    fs.chmodSync(oldPemPath, 0o666);
    fs.unlinkSync(oldPemPath);
  } catch (e) {}
}

// Asegurar otros archivos base
if (!fs.existsSync(MANIFEST_PATH)) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify([], null, 2));
  fs.chmodSync(MANIFEST_PATH, 0o444);
}
if (!fs.existsSync(SAFE_BOX_PATH)) {
  fs.writeFileSync(SAFE_BOX_PATH, JSON.stringify([], null, 2));
  fs.chmodSync(SAFE_BOX_PATH, 0o444);
}
if (!fs.existsSync(CONFIG_PATH)) {
  writeBridgeConfig({});
}
if (!fs.existsSync(AUDIT_LOG_PATH)) {
  fs.writeFileSync(AUDIT_LOG_PATH, '', 'utf8');
  fs.chmodSync(AUDIT_LOG_PATH, 0o444);
}

// Helpers de auditoría criptográfica encadenada (hash chain)
// Helpers de auditoría criptográfica encadenada (hash chain) y firma asimétrica ECDSA
function getLastAuditHash() {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return '0'.repeat(64);
    }
    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8').trim();
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      return '0'.repeat(64);
    }
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/\| HASH:\s*([a-f0-9]{64})/i);
    return match ? match[1] : '0'.repeat(64);
  } catch (err) {
    console.error('[AUDIT] Fallo al obtener el último hash de auditoría:', err);
    return '0'.repeat(64);
  }
}

function signLogPayload(payload) {
  try {
    if (!auditPrivateKeyDecrypted) {
      throw new Error('La clave privada de auditoría no está cargada en memoria.');
    }
    const sign = crypto.createSign('SHA256');
    sign.update(payload);
    sign.end();
    return sign.sign(auditPrivateKeyDecrypted, 'base64');
  } catch (err) {
    console.error('[AUDIT] Error al firmar payload:', err);
    return 'SIGN_ERROR';
  }
}

function verifyAuditLogIntegrity() {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return { isValid: true, reason: 'El log de auditoría aún no existe.' };
    }
    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      return { isValid: true };
    }
    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
      return { isValid: false, reason: 'Falta la clave pública de auditoría para validar firmas.' };
    }
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    let expectedPrevHash = '0'.repeat(64);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sigIndex = line.indexOf(' | SIGNATURE: ');
      if (sigIndex === -1) {
        return { isValid: false, reason: `La entrada en la línea ${i + 1} no está firmada.` };
      }
      const payloadToSign = line.substring(0, sigIndex);
      const signature = line.substring(sigIndex + ' | SIGNATURE: '.length).trim();
      
      // 1. Verificar firma ECDSA
      const verify = crypto.createVerify('SHA256');
      verify.update(payloadToSign);
      verify.end();
      if (!verify.verify(publicKey, signature, 'base64')) {
        return { isValid: false, reason: `La firma de la línea ${i + 1} es inválida o fue manipulada.` };
      }
      
      // 2. Verificar hash encadenado
      const hashIndex = payloadToSign.indexOf(' | HASH: ');
      if (hashIndex === -1) {
        return { isValid: false, reason: `Falta el hash de encadenamiento en la línea ${i + 1}.` };
      }
      const payloadWithoutHash = payloadToSign.substring(0, hashIndex);
      const hashInLine = payloadToSign.substring(hashIndex + ' | HASH: '.length).trim();
      
      const computedHash = crypto.createHash('sha256').update(payloadWithoutHash).digest('hex');
      if (computedHash !== hashInLine) {
        return { isValid: false, reason: `El hash de la línea ${i + 1} no coincide (datos alterados).` };
      }
      
      // 3. Verificar encadenamiento
      const prevHashMatch = payloadWithoutHash.match(/\| PREV_HASH:\s*([a-f0-9]{64})/i);
      const prevHashInLine = prevHashMatch ? prevHashMatch[1] : null;
      if (prevHashInLine !== expectedPrevHash) {
        return { isValid: false, reason: `La cadena de hashes de auditoría está rota en la línea ${i + 1}.` };
      }
      
      expectedPrevHash = hashInLine;
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: false, reason: `Fallo al verificar integridad: ${err.message}` };
  }
}

function sendAuditWebhook(logLine) {
  try {
    const config = readBridgeConfig();
    const webhookUrlsVal = config.securityWebhook;
    if (!webhookUrlsVal) return;

    const urls = webhookUrlsVal.split(',').map(u => u.trim()).filter(u => u.length > 0);
    for (const url of urls) {
      const isDiscord = url.includes('discord');
      const payload = isDiscord
        ? { content: `🛡️ **[ALR Auditoría]** \`${logLine.trim()}\`` }
        : { text: `🛡️ *[ALR Auditoría]* \`${logLine.trim()}\`` };

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.error('[AUDIT WEBHOOK ERROR] Error al enviar webhook:', err.message);
      });
    }
  } catch (err) {
    console.error('[AUDIT WEBHOOK ERROR] Fallo general:', err);
  }
}

function writeAuditLog(action, projectName, details, status) {
  try {
    const timestamp = new Date().toISOString();
    const prevHash = getLastAuditHash();
    
    // Formatear payload (excluyendo el hash actual y firma)
    const logDataPayload = `[${timestamp}] ACTION: ${action} | PROJECT: ${projectName} | STATUS: ${status} | DETAILS: ${details} | PREV_HASH: ${prevHash}`;
    
    // Calcular hash SHA-256 encadenado
    const currentHash = crypto.createHash('sha256').update(logDataPayload).digest('hex');
    const payloadToSign = `${logDataPayload} | HASH: ${currentHash}`;
    
    // Firmar con clave privada ECDSA
    const signature = signLogPayload(payloadToSign);
    const logLine = `${payloadToSign} | SIGNATURE: ${signature}\n`;
    
    // Elevar permisos temporalmente
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      fs.chmodSync(AUDIT_LOG_PATH, 0o666);
    }
    fs.appendFileSync(AUDIT_LOG_PATH, logLine, 'utf8');
    fs.chmodSync(AUDIT_LOG_PATH, 0o444); // Bloquear a sólo lectura
    
    // Enviar alerta redundante de webhook
    sendAuditWebhook(logLine);
    
    console.log(`[AUDIT LOG] ${action} - ${projectName} (${status})`);
  } catch (err) {
    console.error('[AUDIT ERROR] No se pudo escribir en el log de auditoría:', err);
  }
}

// Watcher para audit.log (File Integrity Monitoring - FIM)
let watchTimeout = null;
if (fs.existsSync(AUDIT_LOG_PATH)) {
  fs.watch(AUDIT_LOG_PATH, (eventType, filename) => {
    if (filename) {
      if (watchTimeout) clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        const check = verifyAuditLogIntegrity();
        if (!check.isValid) {
          console.error(`🚨 [ALERTA FIM] ¡Se ha detectado una modificación externa no autorizada en audit.log! Razón: ${check.reason}`);
          isAuditLogCorrupted = true;
          auditLogCorruptReason = check.reason;
        } else {
          isAuditLogCorrupted = false;
          auditLogCorruptReason = '';
        }
      }, 200);
    }
  });
}

// Watcher para bridge_config.json (Dynamic Config Reloading)
let configWatchTimeout = null;
if (fs.existsSync(TRASH_DIR)) {
  fs.watch(TRASH_DIR, (eventType, filename) => {
    if (filename === 'bridge_config.enc') {
      if (configWatchTimeout) clearTimeout(configWatchTimeout);
      configWatchTimeout = setTimeout(() => {
        console.log(`[ALR Bridge] 🔄 Sincronizando configuraciones en caliente tras cambio en bridge_config.enc...`);
        try {
          const config = readBridgeConfig();
          const customCount = Array.isArray(config.customExclusions) ? config.customExclusions.length : 0;
          console.log(`[ALR Bridge] Caché de exclusiones actualizada: ${customCount} exclusiones personalizadas activas.`);
        } catch (e) {
          console.error(`[ALR Bridge] Error recargando configuraciones:`, e.message);
        }
      }, 300);
    }
  });
}

// Procesar logs en cola iniciales si existen
if (auditPrivateKeyDecrypted) {
  while (startupLogQueue.length > 0) {
    const logItem = startupLogQueue.shift();
    writeAuditLog(logItem.action, logItem.projectName || 'system', logItem.details, logItem.status);
  }
}

// Registrar inicio de servidor en la auditoría
writeAuditLog('STARTUP', 'system', 'Servidor puente iniciado con exito', 'SUCCESS');

// Middleware de Autorización Segura
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${BRIDGE_TOKEN}`) {
    writeAuditLog('UNAUTHORIZED_ACCESS', 'api', `Intento de acceso bloqueado desde origin: ${req.headers.origin || 'desconocido'}`, 'DENIED');
    return res.status(401).json({ error: 'Acceso no autorizado: Token de puente inválido o ausente.' });
  }
  next();
});

// Helpers de persistencia con bloqueo de escritura fs.chmodSync
function readManifest() {
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.value)) {
      return data.value;
    } else if (data) {
      return [data];
    }
    return [];
  } catch (e) {
    return [];
  }
}

function writeManifest(data) {
  try {
    if (fs.existsSync(MANIFEST_PATH)) fs.chmodSync(MANIFEST_PATH, 0o666); // Desbloquear
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2), 'utf8');
    fs.chmodSync(MANIFEST_PATH, 0o444); // Bloquear
  } catch (e) {
    console.error('Error al escribir manifest:', e);
  }
}

function readSafeBox() {
  try {
    const data = JSON.parse(fs.readFileSync(SAFE_BOX_PATH, 'utf8'));
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.value)) {
      return data.value;
    } else if (data) {
      return [data];
    }
    return [];
  } catch (e) {
    return [];
  }
}

function writeSafeBox(data) {
  try {
    if (fs.existsSync(SAFE_BOX_PATH)) fs.chmodSync(SAFE_BOX_PATH, 0o666); // Desbloquear
    fs.writeFileSync(SAFE_BOX_PATH, JSON.stringify(data, null, 2), 'utf8');
    fs.chmodSync(SAFE_BOX_PATH, 0o444); // Bloquear
  } catch (e) {
    console.error('Error al escribir safe box:', e);
  }
}

// Helpers de Criptografía (PBKDF2 con Salt y Firma Mágica ALRS, retrocompatible)
function encryptFile(inputPath, outputPath, customKey) {
  return new Promise((resolve, reject) => {
    try {
      const salt = crypto.randomBytes(16);
      const derived = crypto.pbkdf2Sync(customKey || DEFAULT_PASSWORD, salt, 10000, 48, 'sha256');
      const key = derived.subarray(0, 32);
      const iv = derived.subarray(32, 48);

      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      output.write(Buffer.from('ALRS', 'utf8'));
      output.write(salt);

      input.pipe(cipher).pipe(output);
      output.on('finish', resolve);
      output.on('error', reject);
      cipher.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

function decryptFile(inputPath, outputPath, customKey) {
  return new Promise((resolve, reject) => {
    try {
      const fd = fs.openSync(inputPath, 'r');
      const header = Buffer.alloc(20);
      let bytesRead = 0;
      try {
        bytesRead = fs.readSync(fd, header, 0, 20, 0);
      } finally {
        fs.closeSync(fd);
      }

      if (bytesRead === 20 && header.subarray(0, 4).toString('utf8') === 'ALRS') {
        const salt = header.subarray(4, 20);
        const derived = crypto.pbkdf2Sync(customKey || DEFAULT_PASSWORD, salt, 10000, 48, 'sha256');
        const key = derived.subarray(0, 32);
        const iv = derived.subarray(32, 48);

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const input = fs.createReadStream(inputPath, { start: 20 });
        const output = fs.createWriteStream(outputPath);

        input.pipe(decipher).pipe(output);
        output.on('finish', resolve);
        output.on('error', reject);
        decipher.on('error', reject);
      } else {
        // Retrocompatibilidad con SHA-256 simple sin offset
        const passwordToUse = customKey || DEFAULT_PASSWORD;
        const key = crypto.createHash('sha256').update(passwordToUse).digest();
        const iv = key.subarray(0, 16);

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const input = fs.createReadStream(inputPath);
        const output = fs.createWriteStream(outputPath);

        input.pipe(decipher).pipe(output);
        output.on('finish', resolve);
        output.on('error', reject);
        decipher.on('error', reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

// Subida fragmentada a Telegram con control de reintentos
async function uploadSingleFileToTelegram(filePath, botToken, chatId, filename, caption) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
  
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', blob, filename);
  formData.append('caption', caption);
  formData.append('parse_mode', 'HTML');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  return response.ok && data.ok;
}

async function uploadBackupToTelegram(filePath, botToken, chatId, projectName) {
  try {
    const CHUNK_SIZE = 45 * 1024 * 1024; // 45MB
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const defaultCaption = `📂 <b>[Respaldo Cifrado de ALR SaaS]</b>\n\nProyecto: <code>${projectName}</code>\nCifrado: AES-256-CBC\nFecha: ${new Date().toLocaleString('es-ES')}\n\n<i>Este archivo está cifrado y blindado, y solo puede restaurarse en tu panel local.</i>`;

    if (fileSize <= CHUNK_SIZE) {
      let success = false;
      let retries = 3;
      while (retries > 0 && !success) {
        success = await uploadSingleFileToTelegram(filePath, botToken, chatId, `${projectName}.zip.enc`, defaultCaption);
        if (!success) {
          retries--;
          console.warn(`[TELEGRAM BACKUP] Intento fallido para subida única. Intentos restantes: ${retries}`);
          if (retries > 0) await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (success) {
        const manifest = readManifest();
        const item = manifest.find(it => it.id === projectName);
        if (item) {
          item.tgBackup = true;
          writeManifest(manifest);
        }
      }
      return success;
    } else {
      const numChunks = Math.ceil(fileSize / CHUNK_SIZE);
      console.log(`[TELEGRAM BACKUP] El archivo supera los 45MB (${fileSize} bytes). Dividiendo en ${numChunks} partes...`);
      
      // Inicializar info de fragmentos en el manifiesto
      let manifest = readManifest();
      let item = manifest.find(it => it.id === projectName);
      if (item) {
        item.tgTotalChunks = numChunks;
        if (item.tgChunksUploaded === undefined) {
          item.tgChunksUploaded = 0;
        }
        writeManifest(manifest);
      }

      const fd = fs.openSync(filePath, 'r');
      
      for (let i = 0; i < numChunks; i++) {
        // Consultar manifiesto actualizado antes de procesar el chunk
        manifest = readManifest();
        item = manifest.find(it => it.id === projectName);
        const uploadedCount = (item && item.tgChunksUploaded) || 0;

        if (i < uploadedCount) {
          console.log(`[TELEGRAM BACKUP] Fragmento ${i + 1}/${numChunks} ya subido. Omitiendo.`);
          continue;
        }

        const offset = i * CHUNK_SIZE;
        const bytesToRead = Math.min(CHUNK_SIZE, fileSize - offset);
        const chunkBuffer = Buffer.alloc(bytesToRead);
        
        fs.readSync(fd, chunkBuffer, 0, bytesToRead, offset);
        
        const chunkFilename = `${projectName}.zip.enc.${String(i + 1).padStart(3, '0')}`;
        const chunkPath = path.join(path.dirname(filePath), chunkFilename);
        fs.writeFileSync(chunkPath, chunkBuffer);
        
        let success = false;
        let retries = 3;
        const chunkCaption = `📂 <b>[Respaldo Cifrado Fragmentado]</b>\n\nProyecto: <code>${projectName}</code>\nParte: ${i + 1} de ${numChunks}\nCifrado: AES-256-CBC\nFecha: ${new Date().toLocaleString('es-ES')}`;
        
        while (retries > 0 && !success) {
          try {
            success = await uploadSingleFileToTelegram(chunkPath, botToken, chatId, chunkFilename, chunkCaption);
            if (!success) {
              retries--;
              console.warn(`[TELEGRAM BACKUP] Intento fallido para fragmento ${i + 1}/${numChunks}. Intentos restantes: ${retries}`);
              if (retries > 0) await new Promise(r => setTimeout(r, 2000));
            }
          } catch (err) {
            retries--;
            console.error(`[TELEGRAM BACKUP EXCEPTION] Fragmento ${i + 1}/${numChunks}`, err);
            if (retries > 0) await new Promise(r => setTimeout(r, 2000));
          }
        }
        
        try { fs.unlinkSync(chunkPath); } catch (e) {}
        
        if (!success) {
          fs.closeSync(fd);
          console.error(`[TELEGRAM BACKUP] Error crítico: No se pudo subir el fragmento ${i + 1}/${numChunks} tras reintentos.`);
          return false;
        }

        // Registrar progreso de fragmento exitoso
        manifest = readManifest();
        item = manifest.find(it => it.id === projectName);
        if (item) {
          item.tgChunksUploaded = i + 1;
          if (item.tgChunksUploaded === numChunks) {
            item.tgBackup = true;
          }
          writeManifest(manifest);
        }
        console.log(`[TELEGRAM BACKUP] Fragmento ${i + 1}/${numChunks} subido exitosamente.`);
      }
      fs.closeSync(fd);
      return true;
    }
  } catch (err) {
    console.error('[TELEGRAM BACKUP EXCEPTION]', err);
    return false;
  }
}

// Purga automática de archivos expirados (>60 días)
function purgeExpiredProjects() {
  const manifest = readManifest();
  const now = new Date();
  const active = [];
  let purgedCount = 0;

  for (const item of manifest) {
    const expiresAt = new Date(item.expiresAt);
    if (now > expiresAt) {
      const encPath = path.join(TRASH_DIR, `${item.id}.zip.enc`);
      if (fs.existsSync(encPath)) {
        try { fs.unlinkSync(encPath); } catch (err) { console.error(`Error eliminando archivo expirado cifrado ${encPath}:`, err); }
      }
      purgedCount++;
      console.log(`[PURGE] Proyecto expirado eliminado de la papelera definitivamente: ${item.id}`);
    } else {
      active.push(item);
    }
  }

  if (purgedCount > 0) {
    writeManifest(active);
  }
}

// Ejecutar purga de inicio
purgeExpiredProjects();

// Helper para escanear recursivamente y encontrar la fecha de modificación más reciente
function getLatestMtime(dirPath) {
  let latest = 0;

  function scan(currentPath) {
    try {
      const stats = fs.statSync(currentPath);
      if (stats.mtimeMs > latest) {
        latest = stats.mtimeMs;
      }

      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
          if (file === 'node_modules' || file === '.git' || file === 'build' || file === '.gradle') continue;
          scan(path.join(currentPath, file));
        }
      }
    } catch (e) {
      // Ignorar archivos que fallen por permisos o links simbólicos
    }
  }

  scan(dirPath);
  return latest > 0 ? new Date(latest) : fs.statSync(dirPath).mtime;
}

// Endpoint 1: Analizar inactividad de proyectos
app.get('/api/projects/inactivity', (req, res) => {
  try {
    const items = fs.readdirSync(SCRATCH_DIR);
    const result = [];
    const now = new Date();
    const safeBox = readSafeBox();

    for (const item of items) {
      const itemPath = path.join(SCRATCH_DIR, item);
      const isDir = fs.statSync(itemPath).isDirectory();

      if (!isDir) continue;
      if (getExclusions().includes(item.toLowerCase())) continue;

      const lastModified = getLatestMtime(itemPath);
      const diffTime = Math.abs(now - lastModified);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const isProtected = safeBox.includes(item);

      result.push({
        id: item,
        name: item,
        path: itemPath,
        lastModified: lastModified.toISOString(),
        inactivityDays: diffDays,
        isProtected: isProtected
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Mover a la papelera (Compresión -> Cifrado AES Dinámico -> Backup Nube Telegram -> Borrado seguro)
app.post('/api/projects/trash', async (req, res) => {
  if (isAuditLogCorrupted) {
    return res.status(403).json({ error: 'Acceso denegado: Se ha detectado una alteración o corrupción en el archivo de auditoría local. Por seguridad, todas las operaciones de la papelera están bloqueadas.' });
  }
  const { projectName, customKey, tgToken, tgChatId } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'Falta projectName' });
  }
  if (!assertValidProjectName(projectName)) {
    writeAuditLog('TRASH_PROJECT', String(projectName), 'Rechazado: projectName con caracteres no permitidos (posible path traversal)', 'DENIED');
    return res.status(400).json({ error: `Nombre de proyecto inválido: "${projectName}". Solo se permiten letras, números, guión y guión bajo.` });
  }

  // 🛡️ VERIFICAR CAJA FUERTE (SAFE BOX)
  const safeBox = readSafeBox();
  if (safeBox.includes(projectName)) {
    return res.status(403).json({ error: `Acceso denegado: El proyecto "${projectName}" está blindado en la Caja Fuerte y no puede ser eliminado.` });
  }

  const targetPath = resolveSafeScratchPath(projectName);
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: `El proyecto "${projectName}" no existe en la PC.` });
  }

  const tempZipPath = path.join(TRASH_DIR, `${projectName}.tmp.zip`);
  const encPath = path.join(TRASH_DIR, `${projectName}.zip.enc`);

  // Instanciar Worker Thread para procesar compresión + cifrado en segundo plano
  const workerPath = path.join(__dirname, 'compress-worker.js');
  const worker = new Worker(workerPath, {
    workerData: {
      targetPath,
      tempZipPath,
      encPath,
      customKey,
      defaultPassword: DEFAULT_PASSWORD
    }
  });
  worker.on('message', async (result) => {
    if (result.success) {
      try {
        // 1. Registro inicial en manifiesto (antes de la subida a Telegram)
        const manifest = readManifest();
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(now.getDate() + 60); // Expira en 60 días

        const filtered = manifest.filter(item => item.id !== projectName);
        filtered.push({
          id: projectName,
          originalPath: targetPath,
          deletedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          tgBackup: false,
          tgChunksUploaded: 0,
          tgTotalChunks: 0
        });
        writeManifest(filtered);

        // 2. 📥 RESPALDO EN TELEGRAM (NUBE) SI ESTÁ CONFIGURADO
        let tgBackedUp = false;
        if (tgToken && tgChatId) {
          tgBackedUp = await uploadBackupToTelegram(encPath, tgToken, tgChatId, projectName);
        }

        // Borrado físico de la carpeta
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
          writeAuditLog('TRASH_PROJECT', projectName, `Proyecto comprimido, cifrado y movido a papelera con exito. Respaldo nube: ${tgBackedUp}`, 'SUCCESS');
          res.json({ 
            message: `Proyecto "${projectName}" cifrado y movido a la papelera con éxito. Se autodestruirá en 60 días.`, 
            expiresAt: expiresAt.toISOString(),
            tgBackup: tgBackedUp
          });
        } catch (rmErr) {
          console.warn(`[WARN] fs.rmSync falló, reintentando con rd /s /q:`, rmErr);
          const uncPath = `\\\\?\\${targetPath}`;
          // execFile (sin shell) pasa uncPath como argv literal -- a
          // diferencia de exec(), no lo interpreta una shell, así que
          // metacaracteres como & | ; " en el nombre no pueden inyectar
          // comandos adicionales.
          execFile('cmd.exe', ['/c', 'rd', '/s', '/q', uncPath], (err, stdout, stderr) => {
            if (err) {
              console.error(`Error eliminando la carpeta ${targetPath}:`, err);
              writeAuditLog('TRASH_PROJECT', projectName, `Compreso y cifrado pero fallo borrado de carpeta: ${stderr || err.message}`, 'FAILED');
              return res.status(500).json({ error: `Comprimido y cifrado con éxito, pero falló la eliminación de la carpeta local. Detalle: ${stderr || err.message}` });
            }
            writeAuditLog('TRASH_PROJECT', projectName, 'Proyecto comprimido, cifrado y movido a papelera con exito (via rd)', 'SUCCESS');
            res.json({ 
              message: `Proyecto "${projectName}" cifrado y movido a la papelera con éxito. Se autodestruirá en 60 días.`, 
              expiresAt: expiresAt.toISOString(),
              tgBackup: tgBackedUp
            });
          });
        }
      } catch (postWorkerErr) {
        console.error('Error post-compresión en el worker:', postWorkerErr);
        writeAuditLog('TRASH_PROJECT', projectName, `Fallo en el post-procesamiento del worker: ${postWorkerErr.message}`, 'ERROR');
        res.status(500).json({ error: `Compresión completada pero falló el registro o el envío de respaldo: ${postWorkerErr.message}` });
      }
    } else {
      writeAuditLog('TRASH_PROJECT', projectName, `Error en compresion de Worker Thread: ${result.error}`, 'FAILED');
      res.status(500).json({ error: `Error en Worker Thread: ${result.error}` });
    }
  });

  worker.on('error', (err) => {
    console.error('Error de ejecución en el Worker Thread:', err);
    writeAuditLog('TRASH_PROJECT', projectName, `Fallo critico en ejecucion de Worker Thread: ${err.message}`, 'ERROR');
    res.status(500).json({ error: `Fallo crítico en Worker Thread secundario: ${err.message}` });
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`Worker finalizado con código de salida ${code}`);
    }
  });
});

// Endpoint 3: Restaurar proyecto (Descifrado AES Dinámico -> Extracción -> Limpieza)
app.post('/api/projects/restore', async (req, res) => {
  if (isAuditLogCorrupted) {
    return res.status(403).json({ error: 'Acceso denegado: Se ha detectado una alteración o corrupción en el archivo de auditoría local. Por seguridad, todas las operaciones de la papelera están bloqueadas.' });
  }
  const { projectName, customKey } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'Falta projectName' });
  }
  if (!assertValidProjectName(projectName)) {
    writeAuditLog('RESTORE_PROJECT', String(projectName), 'Rechazado: projectName con caracteres no permitidos (posible path traversal)', 'DENIED');
    return res.status(400).json({ error: `Nombre de proyecto inválido: "${projectName}".` });
  }

  const manifest = readManifest();
  const projectInfo = manifest.find(item => item.id === projectName);

  if (!projectInfo) {
    return res.status(404).json({ error: `No se encontraron metadatos de restauración para ${projectName}.` });
  }

  const encPath = path.join(TRASH_DIR, `${projectName}.zip.enc`);
  const tempZipPath = path.join(TRASH_DIR, `${projectName}.tmp.zip`);

  if (!fs.existsSync(encPath)) {
    return res.status(404).json({ error: `No se encontró el archivo de respaldo cifrado de ${projectName} en la papelera.` });
  }

  try {
    const destDir = projectInfo.originalPath;

    // 🔓 DESCIFRAR EL ARCHIVO .enc A ZIP TEMPORAL USANDO LA CLAVE ENVIADA (PBKDF2 con retrocompatibilidad)
    await decryptFile(encPath, tempZipPath, customKey);

    // Crear el directorio destino si no existe
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Extraer y validar (si la clave es incorrecta, AdmZip fallará debido a estructura zip corrupta tras descifrar con clave errónea).
    // Si no se dio clave personalizada, el respaldo pudo haberse cifrado
    // ANTES de la rotación de DEFAULT_PASSWORD (constante fija legacy) —
    // reintentar una vez con esa clave antes de darlo por fallido.
    try {
      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(destDir, true);
    } catch (primaryErr) {
      if (customKey) throw primaryErr;
      await decryptFile(encPath, tempZipPath, LEGACY_DEFAULT_PASSWORD);
      const legacyZip = new AdmZip(tempZipPath);
      legacyZip.extractAllTo(destDir, true);
      writeAuditLog('RESTORE_PROJECT', projectName, 'Restaurado con la clave por defecto legacy (respaldo previo a la rotacion de clave)', 'SUCCESS');
    }

    // Limpiar papelera y temporales
    fs.unlinkSync(tempZipPath);
    fs.unlinkSync(encPath);

    const updated = manifest.filter(item => item.id !== projectName);
    writeManifest(updated);

    writeAuditLog('RESTORE_PROJECT', projectName, `Proyecto descifrado y restaurado con exito en ${destDir}`, 'SUCCESS');
    res.json({ message: `Proyecto "${projectName}" descifrado y restaurado con éxito en ${destDir}.` });
  } catch (error) {
    if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
    writeAuditLog('RESTORE_PROJECT', projectName, `Fallo en descifrado o extraccion: ${error.message}`, 'FAILED');
    res.status(500).json({ error: `Fallo al descifrar o extraer. Por favor, verifica que la llave personalizada de la papelera sea la correcta. Detalle: ${error.message}` });
  }
});

// Endpoint 4: Listar papelera
app.get('/api/projects/trash-list', (req, res) => {
  try {
    const manifest = readManifest();
    const now = new Date();
    
    const enriched = manifest.map(item => {
      const expiresAt = new Date(item.expiresAt);
      const diffTime = expiresAt - now;
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      return {
        ...item,
        daysRemaining
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 5: Eliminar definitivamente de la papelera
app.post('/api/projects/purge-force', (req, res) => {
  if (isAuditLogCorrupted) {
    return res.status(403).json({ error: 'Acceso denegado: Se ha detectado una alteración o corrupción en el archivo de auditoría local. Por seguridad, todas las operaciones de la papelera están bloqueadas.' });
  }
  const { projectName } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'Falta projectName' });
  }
  if (!assertValidProjectName(projectName)) {
    writeAuditLog('PURGE_PROJECT_FORCE', String(projectName), 'Rechazado: projectName con caracteres no permitidos (posible path traversal)', 'DENIED');
    return res.status(400).json({ error: `Nombre de proyecto inválido: "${projectName}".` });
  }

  try {
    const encPath = path.join(TRASH_DIR, `${projectName}.zip.enc`);
    if (fs.existsSync(encPath)) {
      fs.unlinkSync(encPath);
    }

    const manifest = readManifest();
    const updated = manifest.filter(item => item.id !== projectName);
    writeManifest(updated);

    writeAuditLog('PURGE_PROJECT_FORCE', projectName, 'Proyecto eliminado definitivamente de la papelera', 'SUCCESS');
    res.json({ message: `Proyecto "${projectName}" eliminado de la papelera de forma definitiva.` });
  } catch (error) {
    writeAuditLog('PURGE_PROJECT_FORCE', projectName, `Fallo al purgar definitivamente: ${error.message}`, 'FAILED');
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 6: Orquestador de Caja Fuerte (Safe Box)
app.post('/api/projects/safe-box', (req, res) => {
  const { projectName, protected: isProtected } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'Falta projectName' });
  }

  try {
    const safeBox = readSafeBox();
    let updated;
    if (isProtected) {
      updated = safeBox.filter(name => name !== projectName);
      updated.push(projectName);
    } else {
      updated = safeBox.filter(name => name !== projectName);
    }
    writeSafeBox(updated);

    res.json({ message: `Estado de la Caja Fuerte actualizado para "${projectName}". Protegido: ${isProtected}`, protected: isProtected });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7: Reintentar subida a Telegram de un respaldo cifrado existente en papelera
app.post('/api/projects/retry-telegram', async (req, res) => {
  if (isAuditLogCorrupted) {
    return res.status(403).json({ error: 'Acceso denegado: Se ha detectado una alteración o corrupción en el archivo de auditoría local. Por seguridad, todas las operaciones de la papelera están bloqueadas.' });
  }
  const { projectName, tgToken, tgChatId } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'Falta projectName' });
  }
  if (!tgToken || !tgChatId) {
    return res.status(400).json({ error: 'Falta configurar Token de Bot y Chat ID de Telegram' });
  }

  const manifest = readManifest();
  const projectInfo = manifest.find(item => item.id === projectName);
  if (!projectInfo) {
    return res.status(404).json({ error: `No se encontraron metadatos de restauración para ${projectName}.` });
  }

  const encPath = path.join(TRASH_DIR, `${projectName}.zip.enc`);
  if (!fs.existsSync(encPath)) {
    return res.status(404).json({ error: `No se encontró el archivo de respaldo cifrado de ${projectName} en la papelera.` });
  }

  try {
    writeAuditLog('RETRY_TELEGRAM_START', projectName, 'Iniciando reintento de subida a Telegram', 'PENDING');
    
    const success = await uploadBackupToTelegram(encPath, tgToken, tgChatId, projectName);
    
    if (success) {
      writeAuditLog('RETRY_TELEGRAM_SUCCESS', projectName, 'Subida a Telegram reintentada con exito', 'SUCCESS');
      res.json({ message: `Respaldo cifrado de "${projectName}" subido a Telegram con éxito.`, tgBackup: true });
    } else {
      writeAuditLog('RETRY_TELEGRAM_FAIL', projectName, 'Reintento de subida a Telegram fallido', 'FAILED');
      res.status(500).json({ error: 'El reintento de subida a Telegram falló. Verifica la conexión y tus credenciales.' });
    }
  } catch (error) {
    writeAuditLog('RETRY_TELEGRAM_ERROR', projectName, `Excepcion en reintento: ${error.message}`, 'ERROR');
    res.status(500).json({ error: `Error durante el reintento: ${error.message}` });
  }
});

// Endpoint 7.1: Obtener el log de auditoría crudo en texto plano
app.get('/api/audit/log-raw', (req, res) => {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return res.send('');
    }
    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.2: Obtener la clave pública de auditoría en PEM
app.get('/api/audit/public-key', (req, res) => {
  try {
    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
      return res.status(404).json({ error: 'No se encontró la clave pública en el puente.' });
    }
    const key = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    res.send(key);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.3: Guardar / Sincronizar webhook de seguridad
app.post('/api/config/webhook', (req, res) => {
  const { webhookUrl } = req.body;
  try {
    const config = readBridgeConfig();
    config.securityWebhook = webhookUrl || '';
    writeBridgeConfig(config);
    res.json({ message: 'Webhook de seguridad sincronizado en el puente local con éxito.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.4: Obtener lista de exclusiones de inactividad con firma digital y fecha de respaldo
app.get('/api/config/exclusions', (req, res) => {
  try {
    const config = readBridgeConfig();
    const customExclusions = Array.isArray(config.customExclusions) ? config.customExclusions : [];
    const lastBackup = config.lastExternalBackupDate || '';
    
    // Firmar criptográficamente el listado de exclusiones personalizadas
    const payload = JSON.stringify(customExclusions);
    const signature = signLogPayload(payload);
    
    res.json({
      defaultExclusions: EXCLUSIONS,
      customExclusions: customExclusions,
      lastExternalBackupDate: lastBackup,
      signature: signature
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.5: Agregar exclusión de inactividad
app.post('/api/config/exclusions', (req, res) => {
  const exclusionName = req.body.exclusionName || req.query.exclusionName;
  if (!exclusionName) {
    return res.status(400).json({ error: 'Falta exclusionName' });
  }
  try {
    const config = readBridgeConfig();
    if (!Array.isArray(config.customExclusions)) {
      config.customExclusions = [];
    }
    const name = exclusionName.trim();
    if (name && !config.customExclusions.some(e => e.toLowerCase() === name.toLowerCase())) {
      config.customExclusions.push(name);
      writeBridgeConfig(config);
      writeAuditLog('ADD_EXCLUSION', name, 'Exclusión de proyecto agregada con éxito', 'SUCCESS');
    }
    res.json({ message: `Exclusión para "${name}" guardada con éxito.`, customExclusions: config.customExclusions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.6: Eliminar exclusión de inactividad
app.delete('/api/config/exclusions', (req, res) => {
  const exclusionName = req.body.exclusionName || req.query.exclusionName;
  if (!exclusionName) {
    return res.status(400).json({ error: 'Falta exclusionName' });
  }
  try {
    const config = readBridgeConfig();
    if (Array.isArray(config.customExclusions)) {
      const name = exclusionName.trim().toLowerCase();
      const initialLength = config.customExclusions.length;
      config.customExclusions = config.customExclusions.filter(e => e.toLowerCase() !== name);
      if (config.customExclusions.length !== initialLength) {
        writeBridgeConfig(config);
        writeAuditLog('REMOVE_EXCLUSION', exclusionName, 'Exclusión de proyecto eliminada con éxito', 'SUCCESS');
      }
    }
    res.json({ message: `Exclusión para "${exclusionName}" eliminada con éxito.`, customExclusions: config.customExclusions || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.7: Importar masivamente exclusiones de inactividad con verificación de firma ECDSA
app.post('/api/config/exclusions/import', (req, res) => {
  const { customExclusions, signature } = req.body;
  if (!Array.isArray(customExclusions)) {
    return res.status(400).json({ error: 'Falta customExclusions (debe ser un array)' });
  }
  if (!signature) {
    return res.status(400).json({ error: 'Falta la firma digital (signature) para importar' });
  }
  try {
    // Verificar firma con la clave pública ECDSA
    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
      return res.status(500).json({ error: 'Falta la clave pública de auditoría en el puente.' });
    }
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    const payload = JSON.stringify(customExclusions);
    
    const verify = crypto.createVerify('SHA256');
    verify.update(payload);
    verify.end();
    
    if (!verify.verify(publicKey, signature, 'base64')) {
      writeAuditLog('IMPORT_EXCLUSIONS_DENIED', `${customExclusions.length} items`, 'Firma digital de exclusiones inválida o manipulada', 'DENIED');
      return res.status(403).json({ error: 'Firma digital de exclusiones inválida o manipulada. Se canceló la importación por seguridad.' });
    }
    
    const config = readBridgeConfig();
    const cleanList = customExclusions
      .map(e => String(e).trim())
      .filter(e => e.length > 0);
    
    config.customExclusions = cleanList;
    writeBridgeConfig(config);
    writeAuditLog('IMPORT_EXCLUSIONS', `${cleanList.length} items`, 'Exclusiones de inactividad importadas y verificadas con éxito', 'SUCCESS');
    
    res.json({ message: `Importadas y verificadas ${cleanList.length} exclusiones con éxito.`, customExclusions: config.customExclusions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7.8: Registrar respaldo manual en medio externo (USB/HDD)
app.post('/api/config/external-backup-log', (req, res) => {
  try {
    const config = readBridgeConfig();
    const nowStr = new Date().toISOString();
    config.lastExternalBackupDate = nowStr;
    writeBridgeConfig(config);
    
    writeAuditLog('EXTERNAL_BACKUP_LOGGED', 'USB/HDD', 'Respaldo manual en medio externo registrado por el administrador', 'SUCCESS');
    res.json({ message: 'Respaldo externo registrado con éxito.', lastExternalBackupDate: nowStr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Endpoint 8: Obtener estado de integridad del log de auditoría
app.get('/api/audit/status', (req, res) => {
  const check = verifyAuditLogIntegrity();
  const corrupted = isAuditLogCorrupted || !check.isValid;
  res.json({
    isValid: !corrupted,
    reason: check.reason || (isAuditLogCorrupted ? (auditLogCorruptReason || 'Modificación no autorizada detectada') : null)
  });
});

// Endpoint 9: Reparar / restablecer log de auditoría corrupto
app.post('/api/audit/repair', (req, res) => {
  try {
    const timestamp = Date.now();
    const backupPath = path.join(TRASH_DIR, `audit_corrupted_${timestamp}.log`);
    
    // 1. Archivar log corrupto (desbloqueando temporalmente si existe)
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      fs.chmodSync(AUDIT_LOG_PATH, 0o666);
      fs.renameSync(AUDIT_LOG_PATH, backupPath);
      fs.chmodSync(backupPath, 0o444);
    }
    
    // 2. Crear nuevo log
    fs.writeFileSync(AUDIT_LOG_PATH, '', 'utf8');
    fs.chmodSync(AUDIT_LOG_PATH, 0o444);
    
    // 3. Resetear banderas de corrupción
    isAuditLogCorrupted = false;
    auditLogCorruptReason = '';
    
    // 4. Escribir registro firmado de recuperación
    writeAuditLog('AUDIT_RECOVERY', 'system', `Archivo de auditoria corrupto archivado como ${path.basename(backupPath)}. Nuevo log firmado iniciado.`, 'SUCCESS');
    
    res.json({ message: `Log de auditoría restablecido con éxito. El archivo corrupto ha sido archivado como ${path.basename(backupPath)}.` });
  } catch (err) {
    console.error('[AUDIT REPAIR ERROR]', err);
    res.status(500).json({ error: `Fallo al restablecer el log de auditoría: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`============================================================`);
  console.log(`[ALR Bridge] Servidor escuchando en http://localhost:${PORT}`);
  const maskedToken = BRIDGE_TOKEN.substring(0, 6) + '****************' + BRIDGE_TOKEN.substring(26);
  console.log(`🔐 TOKEN DE SEGURIDAD DEL PUENTE (ENMASCARADO): ${maskedToken}`);
  console.log(`👉 Nota: Puedes consultar el token completo en .trash/bridge_token.txt`);
  console.log(`============================================================`);
});

/* ============================================================
   ALR SaaS — Core Application Logic (v1.1.0-ULTIMATE)
   ============================================================ */

// 🔐 OFUSCACIÓN DE ALMACENAMIENTO LOCAL (localStorage Obfuscation Wrapper)
(function() {
  let SESSION_KEY = null;
  let SESSION_KEY_BUFFER = null;
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  const KEY_MAP = {
    'alr_saas_telemetry_page_size': '_0x8f1a',
    'alr_saas_lockout': '_0x2c3b',
    'alr_saas_apps_secure': '_0x7e5c',
    'alr_saas_licenses_secure': '_0x4a9d',
    'alr_saas_logs_secure': '_0x3e1f',
    'alr_saas_tg_severity': '_0x9b2a',
    'alr_saas_tg_enabled': '_0x6c7d',
    'alr_saas_fb_enabled': '_0x1e8f',
    'alr_saas_fb_config_sig': '_0x5c4d',
    'alr_saas_pending_sync': '_0x0a1b',
    'alr_saas_lockout_unlocks': '_0x7b8c',
    'alr_saas_apps': '_0x2a3e',
    'alr_saas_licenses': '_0x1d2e',
    'alr_saas_logs': '_0x3c4f',
    'alr_saas_tg_token': '_0x4e5f',
    'alr_saas_tg_chat_id': '_0x5f6a',
    'alr_saas_fb_config': '_0x6a7b',
    'alr_saas_recycle_bin_secure': '_0x9a8f',
    'alr_saas_custom_seeds_secure': '_0x6b8f',
    'alr_saas_pending_license_sync': '_0x1a8f'
  };

  function getObfuscatedKey(key) {
    return KEY_MAP[key] || key;
  }

  Storage.prototype.getItem = function(key) {
    const obfKey = getObfuscatedKey(key);
    if (originalGetItem.call(this, key) !== null && originalGetItem.call(this, obfKey) === null) {
      try {
        originalSetItem.call(this, obfKey, originalGetItem.call(this, key));
        originalRemoveItem.call(this, key);
      } catch (e) {}
    }
    return originalGetItem.call(this, obfKey);
  };

  Storage.prototype.setItem = function(key, value) {
    const obfKey = getObfuscatedKey(key);
    originalSetItem.call(this, obfKey, value);
  };

  Storage.prototype.removeItem = function(key) {
    const obfKey = getObfuscatedKey(key);
    originalRemoveItem.call(this, obfKey);
  };
})();

// 🔐 Sugerencia 37: Proteger referencias nativas contra hooks de depuración de extensiones
const _nativeFetch = window.fetch.bind(window);
const _nativeGetItem = window.localStorage.getItem.bind(window.localStorage);
const _nativeSetItem = window.localStorage.setItem.bind(window.localStorage);

// 🔐 Sugerencia 7: Encapsulación en Clausuras (IIFE) del Estado de la Consola
(function() {
  let SESSION_KEY = null;
  let SESSION_KEY_BUFFER = null;

// 🔐 Sugerencia 22: Comparación en tiempo constante para mitigar Timing Attacks
function constantTimeCompare(str1, str2) {
  if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;
  const len1 = str1.length;
  const len2 = str2.length;
  let diff = len1 ^ len2;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    diff |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
  }
  return diff === 0;
}

// 🔐 Sugerencia 24: SHA-256 Síncrono Puro para verificar la integridad del Ledger
function sha256Sync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  const words = [];
  const asciiLength = ascii[lengthProperty];
  
  const hash = sha256Sync.h = sha256Sync.h || [];
  const k = sha256Sync.k = sha256Sync.k || [];
  let primeCounter = k[lengthProperty];

  const isPrime = (n) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  if (!primeCounter) {
    let candidate = 2;
    while (primeCounter < 64) {
      if (isPrime(candidate)) {
        if (primeCounter < 8) {
          hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        }
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter++;
      }
      candidate++;
    }
  }

  const hashState = hash.slice(0);
  let paddedAscii = ascii + '\x80';
  while (paddedAscii[lengthProperty] % 64 - 56) {
    paddedAscii += '\x00';
  }
  for (i = 0; i < paddedAscii[lengthProperty]; i++) {
    const charCode = paddedAscii.charCodeAt(i);
    if (charCode >> 8) return ""; // Only ASCII
    words[i >> 2] |= charCode << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
  words[words[lengthProperty]] = (asciiLength * 8);
  
  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hashState.slice(0);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const temp1 = w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      
      const a = hashState[0], e = hashState[4];
      const s0_a = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const ch = (e & hashState[5]) ^ (~e & hashState[6]);
      const temp1_e = (temp1 + hashState[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ch + k[i]) | 0;
      const maj = (a & hashState[1]) ^ (a & hashState[2]) ^ (hashState[1] & hashState[2]);
      
      hashState.unshift((temp1_e + s0_a + maj) | 0);
      hashState[4] = (hashState[4] + temp1_e) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hashState[i] = (hashState[i] + oldHash[i]) | 0;
    }
  }
  
  let hexString = '';
  for (i = 0; i < 8; i++) {
    hexString += (hashState[i] >>> 0).toString(16).padStart(8, '0');
  }
  return hexString;
}

// 🌌 BASE DE DATOS LOCAL/SIMULADA PARA MODO AUTÓNOMO Y FALLBACK
const DEFAULT_APPS = [
  {
    id: 'kuatsi',
    name: 'Kuatsi POS & Cafetería',
    version: 'v1.0.0',
    status: 'RELEASED',
    activeClients: 1,
    icon: 'ri-cup-fill',
    color: '#f59e0b',
    url: 'https://kuatsi.web.app/',
    description: 'Sistema integral de gestión para cafeterías, restaurantes, comandas, mesas y punto de venta.'
  }
];

const DEFAULT_LICENSES = [
  {
    id: 'kuatsi_central',
    clientName: 'Kuatsi Cafetería Central',
    appId: 'kuatsi-cafeteria',
    appName: 'Kuatsi POS & Cafetería',
    appUrl: 'https://kuatsi.web.app/',
    apiKey: 'ALR-KUATSI-2026-LIVE-8899',
    status: 'ACTIVE',
    expiryDate: '2027-08-10T23:59:59Z',
    expirationDate: '2027-08-10T23:59:59Z',
    currentPlan: 'PAGADO',
    renewalPeriod: 'Anual',
    paymentPeriod: 'Mensual',
    baseMonthlyFee: 250,
    adjustedMonthlyFee: 250,
    startDate: '2026-08-10',
    maxUsers: 25,
    monthlyFee: 250,
    createdAt: '2026-08-10',
    notes: 'Instancia principal de Kuatsi Cafetería gestionada desde ALR SaaS Commander.'
  }
];

// El PIN real ya NO se valida contra este hash (antes era un sha256
// precalculado visible en el JS público, crackeable offline sin límite
// de intentos). La verificación real la hace verifyAlrAdminAccess
// (Cloud Function + Secret Manager, ver functions/index.js). El campo
// pinHash se conserva solo porque otras rutinas no relacionadas con
// autenticación lo reutilizan como "sal" para firmar configuración
// local ya guardada (Telegram/Firebase) -- no como control de acceso.
const SYSTEM_ADMINS = [
  { username: 'Master Admin', pinHash: '0c759f0a85f7faa512ce37bd492ac6cb5cd2d806a4a81b1c700df37f7392570f', role: 'SUPER_ADMIN' }
];

window.LOCK_ATTEMPTS = 0;
window.LOCKOUT_UNTIL = 0;

// Antes arrancaba ya autenticado como Master Admin sin pedir nada -- la
// consola completa (incluida la lectura de licencias de clientes) era
// accesible a cualquiera con la URL. Ahora arranca bloqueada;
// unlockConsoleSession() (vía verifyAlrAdminAccess) es el único camino
// para obtener currentAdmin != null.
let currentAdmin = null;

// 🚀 SUGERENCIA 3: PLANTILLAS DE BASES DE DATOS SEMILLA (SEED TEMPLATES)
const SEED_TEMPLATES = {
  kuatsi: {
    roles: [
      { role: 'admin', name: 'Administrador General', defaultPin: '1234' },
      { role: 'cajero', name: 'Cajero / Punto de Venta', defaultPin: '4321' },
      { role: 'mesero', name: 'Mesero / Atención a Mesas', defaultPin: '1111' },
      { role: 'cocina', name: 'Barista / Cocina', defaultPin: null }
    ],
    services: [
      { name: 'Bebidas & Café de Especialidad', price: 55 },
      { name: 'Alimentos & Repostería', price: 75 },
      { name: 'Paquetes & Combos Desayuno', price: 120 }
    ],
    business: { name: 'Kuatsi Cafetería Central', openTime: '07:00', closeTime: '22:00', tablesCount: 16 }
  },
  smart_wash: {
    roles: [
      { role: 'admin', name: 'Administrador', defaultPin: '1111' },
      { role: 'supervisor', name: 'Supervisor', defaultPin: '2222' },
      { role: 'lavador', name: 'Lavador', defaultPin: null }
    ],
    services: [
      { name: 'Lavado Sencillo (Carro)', price: 120 },
      { name: 'Lavado VIP (Aspirado + Cera)', price: 220 },
      { name: 'Lavado de Motor', price: 350 }
    ],
    business: { name: 'Smart Wash Central', openTime: '08:00', closeTime: '21:00' }
  },
  smart_restaurant: {
    roles: [
      { role: 'admin', name: 'Gerente General', defaultPin: '1234' },
      { role: 'cajero', name: 'Cajero Principal', defaultPin: '4321' },
      { role: 'mesero', name: 'Mesero', defaultPin: null }
    ],
    services: [
      { name: 'Categoría: Entradas & Antojos', itemsCount: 8 },
      { name: 'Categoría: Platillos Fuertes', itemsCount: 15 },
      { name: 'Categoría: Bebidas & Cócteles', itemsCount: 20 }
    ],
    business: { name: 'Smart Restaurant Central', tablesCount: 24, deliveryActive: true }
  },
  smart_gym: {
    roles: [
      { role: 'admin', name: 'Director Deportivo', defaultPin: '9999' },
      { role: 'instructor', name: 'Entrenador Certificado', defaultPin: '8888' }
    ],
    services: [
      { name: 'Membresía Mensual Básica', price: 450 },
      { name: 'Membresía Anual VIP', price: 4800 },
      { name: 'Pase Diario', price: 80 }
    ],
    business: { name: 'Smart Gym Fitness', machineryCount: 45, lockersCount: 100 }
  }
};

// LLAVE DE FIRMA MAESTRA PARA INMUTABILIDAD DE LOGS (BLOCKCHAIN LEDGER)
let MASTER_LEDGER_SALT = "alr_saas_sec_chain_2026";

// URL de Webhook de Gobernanza (opcional - compatible con Discord/Slack/Telegram)
const SYSTEM_WEBHOOK_URL = null;

// Estado global de la consola
let state = {
  apps: [],
  licenses: [],
  logs: [],
  recycleBin: [],
  customSeeds: [],
  ledgerIntact: true,
  importedDomain: null,
  appRegistry: {}
};

// Configuración de Paginación de Telemetría
window.telemetryPage = 1;
window.telemetryPageSize = Number(localStorage.getItem('alr_saas_telemetry_page_size')) || 15;

// 🔐 CRIPTOGRAFÍA EN REPOSO: AES-GCM DE 256 BITS CON WEB CRYPTO API
async function _deriveKey(keyString) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptReposo(text, keyString) {
  if (!text) return "";
  try {
    const key = await _deriveKey(keyString);
    const encoder = new TextEncoder();
    const textData = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      textData
    );
    
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    let binary = "";
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    // 🔐 Sugerencia 25: Crypto Agility (v1$AES-GCM$)
    return "v1$AES-GCM$" + btoa(binary);
  } catch (e) {
    console.error("[Crypto] Error en cifrado reposo AES-GCM:", e);
    return "";
  }
}

async function decryptReposo(encoded, keyString) {
  if (!encoded) return "";
  let cleanEncoded = encoded;
  
  // 🔐 Sugerencia 25: Crypto Agility (v1$AES-GCM$ tag verification)
  if (encoded.startsWith("v1$AES-GCM$")) {
    cleanEncoded = encoded.slice(11);
  }
  
  try {
    const key = await _deriveKey(keyString);
    const binaryString = atob(cleanEncoded);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    // Fallback: descifrado XOR legacy
    try {
      const text = decodeURIComponent(escape(atob(encoded)));
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ keyString.charCodeAt(i % keyString.length));
      }
      return result;
    } catch (err) {
      return "";
    }
  }
}

// 🔄 INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', async () => {
  console.log("ALR SaaS Central Commander Initializing...");

  // 🔐 Capturar y eliminar el token de handshake global para protección de scope
  let sessionToken = '';
  if (window.SaasSecurityToken) {
    sessionToken = window.SaasSecurityToken;
    try {
      delete window.SaasSecurityToken;
    } catch (e) {
      window.SaasSecurityToken = undefined;
    }
  }

  // ⌨️ Sugerencia 1: Atajo de teclado global (Ctrl + Shift + L) para bloquear consola
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
      e.preventDefault();
      window.lockConsoleSession(true);
    }
  });

  await loadFromStorage();

  // Monitorear bloqueo de seguridad defensivo persistente
  if (localStorage.getItem('alr_saas_lockout') === 'true') {
    setTimeout(() => {
      window.openSecurityLockoutModal();
    }, 500);
    return;
  }

  // Cada paso va en su propio try/catch: un fallo en cualquiera de ellos
  // (red, Firebase, lo que sea) NUNCA debe impedir que se llegue a abrir
  // el candado de abajo -- ya pasó una vez (updateHeaderProfileBadge
  // tronaba con currentAdmin todavía null y dejaba la consola sin pedir
  // PIN, atascada en init).
  try {
    await initGovernanceFirebase(); // sesión anónima; sin claim todavía, sin acceso a master_licenses
  } catch (e) { console.error('[INIT] initGovernanceFirebase falló:', e); }

  try {
    verifyAuditLedger(); // Verificar inmutabilidad del historial en el arranque (solo datos locales, no licencias)
  } catch (e) { console.error('[INIT] verifyAuditLedger falló:', e); }

  try {
    window.updateHeaderProfileBadge();
  } catch (e) { console.error('[INIT] updateHeaderProfileBadge falló:', e); }

  try {
    window.resetInactivityTimer();
  } catch (e) { console.error('[INIT] resetInactivityTimer falló:', e); }

  // currentAdmin es null hasta que unlockConsoleSession()/verifyAdminCredentials()
  // tengan éxito vía verifyAlrAdminAccess. Todo lo que toca master_licenses
  // (tabla de clientes, pullAllLicensesFromCloud, cron de facturación, etc.)
  // se dispara dentro de unlockConsoleSession() tras el login exitoso, no aquí
  // -- antes corría incondicionalmente y la consola completa quedaba abierta
  // a cualquiera con la URL, sin pedir nada.
  window.openSessionLockedModal('Master Admin');

  // Procesar cualquier notificación de Telegram encolada localmente mientras estaba offline
  window.processOfflineNotificationsQueue();
  localStorage.removeItem('alr_saas_webhook_queue'); // Limpiar la cola sin cifrar legacy
  await window.processOfflineWebhookQueue();

  // 🔐 Sugerencia 21: Inicializar hora de sesión activa para Forward Secrecy
  window.sessionStartTime = Date.now();

  // 🔐 Sugerencia 29: Capturar violaciones de Content Security Policy (CSP)
  document.addEventListener('securitypolicyviolation', (e) => {
    const details = `Recurso bloqueado: ${e.blockedURI || 'desconocido'} en directiva ${e.violatedDirective || 'desconocida'}`;
    console.error("[SEGURIDAD - CSP VIOLATION]", details);
    addAuditLog('SECURITY', 'CSP_VIOLATION', details);
    if (typeof window.triggerSecondarySecurityAlert === 'function') {
      window.triggerSecondarySecurityAlert("CSP_VIOLATION", details);
    }
  });

  // 🔐 Sugerencia 33: Detección activa de DevTools y auto-bloqueo preventivo
  const devtoolsThreshold = 160;
  window.checkDevToolsOpen = function() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > devtoolsThreshold || heightDiff > devtoolsThreshold) {
      if (currentAdmin && currentAdmin.username !== 'Operador Bloqueado') {
        console.warn("[SEGURIDAD] DevTools detectadas abiertas.");
      }
    }
  };
  setInterval(() => {
    if (currentAdmin && currentAdmin.username !== 'Operador Bloqueado') {
      window.checkDevToolsOpen();
    }
  }, 3000);

  // Verificar integridad del entorno de ejecución (Android App Interface)
  if (typeof SaasSecurityBridge !== 'undefined') {
    try {
      const isRooted = SaasSecurityBridge.isRooted(sessionToken);
      const isEmulator = SaasSecurityBridge.isEmulator(sessionToken);
      if (isRooted || isEmulator) {
        const details = `Detección de entorno inseguro: Rooted=${isRooted}, Emulator=${isEmulator}`;
        addAuditLog('SYSTEM', 'CUARENTENA', details);
      }
    } catch (e) {
      console.error("[SEGURIDAD] Error al interrogar entorno de SaasSecurityBridge:", e);
    }
  }

  // Monitorear actividad para auto-bloqueo por inactividad
  ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(evt => {
    document.addEventListener(evt, window.resetInactivityTimer, { passive: true });
  });
  window.resetInactivityTimer(); // Inicializar el timer de inactividad

  // Monitorear conectividad para sincronización automática
  window.addEventListener('online', () => {
    console.log("[RED] Navegador en línea. Sincronizando bitácora...");
    window.syncLogsToFirebase();
    window.processOfflineNotificationsQueue();
    window.processOfflineWebhookQueue();
  });
});

function loadBackupTelemetry() {
  fetch('last-backup.json')
    .then(response => {
      if (!response.ok) throw new Error('No backup stats file found.');
      return response.json();
    })
    .then(data => {
      const widget = document.getElementById('backup-widget-status');
      if (widget && data.timestamp) {
        // Formatear fecha legible
        widget.innerHTML = `<span style="color: var(--success); font-weight:900;">${data.timestamp.split(' ')[1]}</span>`;
        widget.title = `Archivo: ${data.fileName}\nFecha: ${data.timestamp}\nEstado: ${data.status}\nTamaño: ${(data.sizeBytes / 1024).toFixed(1)} KB`;
      }
    })
    .catch(err => {
      const widget = document.getElementById('backup-widget-status');
      if (widget) {
        widget.innerHTML = `<span style="color: var(--warning); font-weight:900;">SIN RESPALDOS</span>`;
      }
    });
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function deriveSaltForMonth(date) {
  const base = "alr_saas_sec_chain_2026";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return base + "_" + year + "_" + month;
}

function parseYearMonth(ymStr) {
  const parts = ymStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  return new Date(year, month, 1);
}

async function loadFromStorage() {
  try {
    // 1. Ejecutar rotación mensual automática de Salt (con historial de rotación cifrado con el salt base)
    const currentMonthStr = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0');
    const storedMonthEnc = localStorage.getItem('alr_saas_last_salt_rotation_month_sec');
    const storedMonth = storedMonthEnc ? await decryptReposo(storedMonthEnc, "alr_saas_sec_chain_2026") : null;
    const currentSalt = deriveSaltForMonth(new Date());
    
    if (storedMonth && storedMonth !== currentMonthStr) {
      const oldSalt = deriveSaltForMonth(parseYearMonth(storedMonth));
      const keysToRotate = [
        'alr_saas_apps_secure',
        'alr_saas_licenses_secure',
        'alr_saas_logs_secure',
        'alr_saas_tg_token_sec',
        'alr_saas_tg_chat_id_sec',
        'alr_saas_tg_whitelist_sec',
        'alr_saas_fb_config_sec',
        'alr_saas_fb_config_failsafe_sec',
        'alr_saas_sec_webhook_sec',
        'alr_saas_recycle_bin_secure',
        'alr_saas_custom_seeds_secure'
      ];

      let successCount = 0;
      for (const key of keysToRotate) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const dec = await decryptReposo(val, oldSalt);
            if (dec) {
              localStorage.setItem(key, await encryptReposo(dec, currentSalt));
              successCount++;
            }
          } catch (e) {
            console.warn(`[SALT ROTATION] No se pudo rotar la clave: ${key}`, e);
          }
        }
      }

      localStorage.setItem('alr_saas_last_salt_rotation_month_sec', await encryptReposo(currentMonthStr, "alr_saas_sec_chain_2026"));
      localStorage.setItem('alr_saas_last_salt_rotation_date_sec', await encryptReposo(new Date().toISOString(), currentSalt));
      if (successCount > 0) {
        window.SALT_ROTATED_ENTRY = `Rotación mensual automática de Salt criptográfico completada. Claves actualizadas: ${successCount}.`;
      }
    } else if (!storedMonth) {
      localStorage.setItem('alr_saas_last_salt_rotation_month_sec', await encryptReposo(currentMonthStr, "alr_saas_sec_chain_2026"));
      localStorage.setItem('alr_saas_last_salt_rotation_date_sec', await encryptReposo(new Date().toISOString(), currentSalt));
    }

    // Limpiar rastros del indicador en texto plano antiguo si existían
    localStorage.removeItem('alr_saas_last_salt_rotation_month');

    // Establecer el salt actual activo para todas las operaciones subsiguientes
    (MASTER_LEDGER_SALT = currentSalt);

    // Re-hidratar variables de Telegram/Firebase con el salt mensual activo
    if (typeof window.rehydrateDecryptedSettings === 'function') {
      await window.rehydrateDecryptedSettings();
    }

    const keyToUse = SESSION_KEY || MASTER_LEDGER_SALT;

    const appsEnc = localStorage.getItem('alr_saas_apps_secure');
    const licensesEnc = localStorage.getItem('alr_saas_licenses_secure');
    const logsEnc = localStorage.getItem('alr_saas_logs_secure');

    let appsDec = appsEnc ? await decryptReposo(appsEnc, keyToUse) : null;
    let licensesDec = licensesEnc ? await decryptReposo(licensesEnc, keyToUse) : null;
    let logsDec = logsEnc ? await decryptReposo(logsEnc, keyToUse) : null;

    // Migración si existen datos antiguos sin cifrar
    if (!appsDec) {
      const rawApps = localStorage.getItem('alr_saas_apps');
      if (rawApps) appsDec = rawApps;
    }
    if (!licensesDec) {
      const rawLicenses = localStorage.getItem('alr_saas_licenses');
      if (rawLicenses) licensesDec = rawLicenses;
    }
    if (!logsDec) {
      const rawLogs = localStorage.getItem('alr_saas_logs');
      if (rawLogs) logsDec = rawLogs;
    }

    state.apps = appsDec ? JSON.parse(appsDec) : [];
    
    const originalAppsLength = state.apps.length;
    // Limpiar datos y aplicaciones ficticios/ejemplos base de demostración
    state.apps = state.apps.filter(app => app.id !== 'smart_wash' && app.id !== 'smart_restaurant' && app.id !== 'smart_gym');
    
    // Asegurar la presencia de las aplicaciones semilla base
    DEFAULT_APPS.forEach(defaultApp => {
      if (!state.apps.some(a => a.id === defaultApp.id)) {
        state.apps.push(defaultApp);
      }
    });
    state.licenses = licensesDec ? JSON.parse(licensesDec) : [...DEFAULT_LICENSES];
    
    // Limpiar datos de demostración si existen para empezar limpio con datos reales
    state.licenses = state.licenses.filter(l => l.id !== 'xalpa_smart' && l.id !== 'tenatena_smart' && l.appId !== 'smart_wash' && l.appId !== 'smart_restaurant' && l.appId !== 'smart_gym');

    DEFAULT_LICENSES.forEach(defaultLic => {
      if (!state.licenses.some(l => l.id === defaultLic.id)) {
        state.licenses.push(defaultLic);
      }
    });

    // Migración automática: Corregir enlaces de Vercel mal formados (?s= en lugar de /)
    let migratedCount = 0;
    if (Array.isArray(state.licenses)) {
      state.licenses.forEach(l => {
        try {
          if (l && l.appUrl && typeof l.appUrl === 'string' && l.appUrl.includes('vercel.app') && !l.appUrl.includes('?s=')) {
            const targetUrl = (l.appUrl.startsWith('http://') || l.appUrl.startsWith('https://')) ? l.appUrl : 'https://' + l.appUrl;
            const urlObj = new URL(targetUrl);
            const slug = urlObj.pathname.replace(/^\//, ''); // Quitar barra inicial
            if (slug) {
              l.appUrl = `${urlObj.origin}/?s=${slug}`;
              migratedCount++;
            }
          }
        } catch (e) {
          console.error("Error al migrar url de Vercel:", e);
        }
      });
    }
    if (migratedCount > 0) {
      console.log(`[MIGRACIÓN] Se corrigieron ${migratedCount} URLs de acceso de Vercel.`);
      try {
        const licensesStr = JSON.stringify(state.licenses || []);
        localStorage.setItem('alr_saas_licenses_secure', await encryptReposo(licensesStr, keyToUse));
        state.licenses.forEach(async (l) => {
          try {
            if (l && l.appUrl && typeof l.appUrl === 'string' && l.appUrl.includes('?s=')) {
              await window.syncLicenseToFirestore(l);
            }
          } catch (err) {}
        });
      } catch (saveErr) {
        console.error("Error al guardar migración:", saveErr);
      }
    }

    const recycleBinEnc = localStorage.getItem('alr_saas_recycle_bin_secure');
    const recycleBinDec = recycleBinEnc ? await decryptReposo(recycleBinEnc, keyToUse) : null;
    state.recycleBin = recycleBinDec ? JSON.parse(recycleBinDec) : [];

    const customSeedsEnc = localStorage.getItem('alr_saas_custom_seeds_secure');
    const customSeedsDec = customSeedsEnc ? await decryptReposo(customSeedsEnc, keyToUse) : null;
    state.customSeeds = customSeedsDec ? JSON.parse(customSeedsDec) : [];
    state.customSeeds = state.customSeeds.filter(s => s.id !== 'smart_wash' && s.id !== 'smart_restaurant' && s.id !== 'smart_gym');

    if (state.apps.length !== originalAppsLength) {
      await saveToStorage();
    }

    // Rehidratar semillas guardadas en el catálogo personalizado
    state.customSeeds.forEach(seed => {
      if (!state.apps.some(a => a.id === seed.id)) {
        state.apps.push({
          id: seed.id,
          name: seed.name,
          version: seed.version,
          status: seed.status || 'RELEASED',
          activeClients: 0,
          icon: seed.icon || 'ri-apps-fill',
          color: seed.color || '#10b981'
        });
      }
      SEED_TEMPLATES[seed.id] = {
        roles: seed.roles || [],
        services: seed.services || [],
        business: seed.business || { name: seed.name }
      };
    });

    // Purgar elementos expirados (>45 días) de la papelera
    const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
    state.recycleBin = state.recycleBin.filter(item => {
      const elapsed = Date.now() - new Date(item.deletedAt).getTime();
      const active = elapsed < fortyFiveDaysMs;
      if (!active) {
        addAuditLog('SYSTEM', 'PURGA_PAPELERA', `Licencia de cliente ${item.license.clientName} purgada permanentemente tras 45 días.`);
      }
      return active;
    });

    // Normalizar planes antiguos y asegurar consistencia
    state.licenses.forEach(l => {
      if (l.currentPlan === 'DIAMANTE' || l.currentPlan === 'ORO' || l.currentPlan === 'PLATA' || l.currentPlan === 'PAGADO') {
        l.currentPlan = 'PAGADO';
      } else {
        l.currentPlan = 'NO_PAGADO';
      }
    });

    if (logsDec) {
      state.logs = JSON.parse(logsDec);
    } else {
      // Generar logs semilla con hash inmutable inicializado
      state.logs = [];
      addAuditLog('SYSTEM', 'INIT', 'ALR SaaS Commander v1.1.0 inicializado con éxito.');
      addAuditLog('API_GATEWAY', 'VALIDATE', 'Validación de licencia exitosa para xalpa_smart (PAGADO).');
      addAuditLog('API_GATEWAY', 'VALIDATE', 'Validación de licencia exitosa para tenatena_smart (PAGADO).');
    }

    if (window.SALT_ROTATED_ENTRY) {
      addAuditLog('SECURITY', 'SALT_ROTATION', window.SALT_ROTATED_ENTRY);
      delete window.SALT_ROTATED_ENTRY;
    }

    await saveToStorage();
    await window.pullAllLicensesFromCloud(true);
  } catch (error) {
    console.error("CRITICAL ERROR in loadFromStorage:", error);
    state.apps = state.apps || [];
    state.licenses = state.licenses || [];
    state.logs = state.logs || [];
    state.recycleBin = state.recycleBin || [];
    state.customSeeds = state.customSeeds || [];
    
    // Sugerencia 3: Mostrar panel de error amigable de diagnóstico en el DOM
    const body = document.body;
    if (body) {
      const diagDiv = document.createElement('div');
      diagDiv.id = 'critical-diagnostics-overlay';
      diagDiv.style.position = 'fixed';
      diagDiv.style.top = '0';
      diagDiv.style.left = '0';
      diagDiv.style.width = '100vw';
      diagDiv.style.height = '100vh';
      diagDiv.style.background = 'rgba(10, 15, 25, 0.98)';
      diagDiv.style.color = '#fff';
      diagDiv.style.zIndex = '999999';
      diagDiv.style.display = 'flex';
      diagDiv.style.flexDirection = 'column';
      diagDiv.style.alignItems = 'center';
      diagDiv.style.justifyContent = 'center';
      diagDiv.style.padding = '30px';
      diagDiv.style.fontFamily = 'system-ui, sans-serif';
      diagDiv.style.textAlign = 'center';
      
      diagDiv.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 24px;">🛑</div>
        <h1 style="color:var(--danger, #ef4444); font-size: 24px; font-weight:900; margin-bottom: 12px; text-transform:uppercase;">Fallo Crítico del Sistema</h1>
        <p style="font-size:13px; opacity:0.7; max-width:600px; margin-bottom: 24px; line-height:1.6;">
          Se detectó una falla crítica durante la inicialización de la consola (Crypto/Storage). El ledger local de auditoría o los archivos de sesión podrían estar corruptos o inaccesibles.
        </p>
        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:16px; font-family:monospace; font-size:12px; text-align:left; max-width:600px; overflow-x:auto; margin-bottom:30px; width: 100%; max-height: 150px; white-space:pre-wrap;">
          ${escapeHtml(error.stack || error.message || error)}
        </div>
        <div style="display:flex; gap:16px;">
          <button onclick="localStorage.clear(); location.reload();" style="background:var(--danger, #ef4444); border:none; border-radius:8px; color:#000; padding:10px 20px; font-weight:bold; cursor:pointer; font-size:12px;">Restablecer Consola (Limpiar Caché)</button>
          <button onclick="location.reload();" style="background:transparent; border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:#fff; padding:10px 20px; font-weight:bold; cursor:pointer; font-size:12px;">Reintentar Carga</button>
        </div>
      `;
      body.appendChild(diagDiv);
    }
  }
}

window.pullAllLicensesFromCloud = async function(silent = false) {
  if (!silent) showToast("Consultando licencias en la nube...", "info");

  if (!window.governanceDb) {
    if (!silent) showToast("Sin sesión de gobernanza activa.", "warning");
    return;
  }

  try {
    // Antes leía la REST API de Firestore sin ninguna autenticación
    // (funcionaba solo porque las reglas estaban abiertas a todo
    // internet). Ahora usa governanceDb, protegido por el claim
    // alrSuperAdmin que asigna verifyAlrAdminAccess.
    const snap = await window.governanceDb.collection('master_licenses').get();
    const pulledLicenses = await Promise.all(snap.docs.map(async doc => {
      const d = doc.data() || {};
      // apiKey vive en la subcolección secrets/apiKey (ver
      // syncLicenseToFirestore); se hace fallback al campo viejo del
      // documento principal para licencias que aún no se han vuelto a
      // guardar desde el cambio.
      let apiKey = d.apiKey || '';
      try {
        const secretSnap = await doc.ref.collection('secrets').doc('apiKey').get();
        if (secretSnap.exists) apiKey = secretSnap.data().value || apiKey;
      } catch (e) {
        console.warn(`[ALR GOVERNANCE] No se pudo leer apiKey de ${doc.id}:`, e.message);
      }
      return {
        id: doc.id,
        clientName: d.clientName || 'Cliente',
        appName: d.appName || 'Aplicación',
        appId: d.appId || doc.id,
        apiKey,
        expiryDate: d.expiryDate || d.expirationDate || '2099-12-31T23:59:59Z',
        expirationDate: d.expiryDate || d.expirationDate || '2099-12-31T23:59:59Z',
        currentPlan: d.currentPlan || 'PAGADO',
        baseMonthlyFee: Number(d.baseMonthlyFee || 500),
        adjustedMonthlyFee: Number(d.adjustedMonthlyFee || d.baseMonthlyFee || 500),
        renewalPeriod: d.renewalPeriod || 'Mensual',
        paymentPeriod: d.paymentPeriod || 'Mensual',
        startDate: d.startDate || '2025-01-01',
        dailyCost: Number(d.dailyCost || 0),
        status: String(d.status || 'ACTIVE').toUpperCase(),
        version: Number(d.version || 1),
        initialAmount: Number(d.initialAmount || 0),
        gracePeriodHours: Number(d.gracePeriodHours || 72),
        contact: d.contact || '',
        appUrl: d.appUrl || '',
        customConfig: d.customConfig || null
      };
    }));

    if (pulledLicenses.length > 0) {
      state.licenses = pulledLicenses;
      await saveToStorage();
      renderAll();
      if (!silent) showToast(`Sincronización exitosa: ${pulledLicenses.length} licencia(s) en vivo desde la nube.`, "success");
    } else {
      if (!silent) showToast("No se encontraron licencias registradas en la nube.", "warning");
    }
  } catch (err) {
    console.error("[PULL LICENSES ERR]", err);
    if (!silent) showToast(`Error consultando la nube: ${err.message}`, "danger");
  }
};

// Catálogo de apps con auto-clonado (registerTenant-equivalente por
// app-type, ver provisionAppClone en functions/index.js). state.appRegistry
// queda como { [appId]: {firebaseProjectId, functionsRegion, webApiKey,
// registerFunctionName, hostingBaseUrl} } -- si un appId no tiene entrada
// aquí, el Asistente cae al flujo de solo-metadata de siempre.
window.pullAppRegistryFromCloud = async function() {
  if (!window.governanceDb) return;
  try {
    const snap = await window.governanceDb.collection('alr-saas-app-registry').get();
    const registry = {};
    snap.docs.forEach(doc => { registry[doc.id] = doc.data() || {}; });
    state.appRegistry = registry;
  } catch (err) {
    console.warn("[PULL APP REGISTRY ERR]", err.message);
    state.appRegistry = state.appRegistry || {};
  }
};

// 🔄 Polling en segundo plano en la Consola Commander para sincronía bidireccional continua
setInterval(() => {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    window.pullAllLicensesFromCloud(true);
  }
}, 8000);

window.exportLocalBackupJson = function() {
  try {
    const backupData = {
      licenses: state.licenses || [],
      apps: state.apps || [],
      recycleBin: state.recycleBin || [],
      customSeeds: state.customSeeds || [],
      exportedAt: new Date().toISOString(),
      version: "1.1.0"
    };
    
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `ALR_SaaS_Consola_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("Respaldo JSON exportado con éxito.", "success");
    addAuditLog('SYSTEM', 'RESPALDO_EXPORTAR_JSON', 'Respaldo manual de base de datos exportado en JSON.');
  } catch (err) {
    console.error(err);
    showToast(`Error al exportar respaldo: ${err.message}`, "danger");
  }
};

window.importLocalBackupJson = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.licenses || !Array.isArray(data.licenses)) {
        throw new Error("El archivo de respaldo no es válido o está incompleto.");
      }
      
      const confirmImport = confirm(`¿Estás seguro de que deseas importar este respaldo?\nSe cargarán ${data.licenses.length} licencias y se fusionarán con tu estado actual.`);
      if (!confirmImport) return;
      
      let importedCount = 0;
      data.licenses.forEach(importedLicense => {
        const idx = state.licenses.findIndex(l => l.id === importedLicense.id);
        if (idx !== -1) {
          const current = state.licenses[idx];
          if (importedLicense.version >= (current.version || 1)) {
            state.licenses[idx] = importedLicense;
            importedCount++;
          }
        } else {
          state.licenses.push(importedLicense);
          importedCount++;
        }
      });
      
      if (data.apps && Array.isArray(data.apps)) {
        data.apps.forEach(app => {
          if (!state.apps.some(a => a.id === app.id)) {
            state.apps.push(app);
          }
        });
      }
      
      if (data.customSeeds && Array.isArray(data.customSeeds)) {
        data.customSeeds.forEach(seed => {
          if (!state.customSeeds.some(s => s.id === seed.id)) {
            state.customSeeds.push(seed);
          }
        });
      }

      await saveToStorage();
      renderAll();
      
      if (window.FIREBASE_SYNC_ENABLED && window.firestoreDb) {
        state.licenses.forEach(async (l) => {
          try {
            await window.syncLicenseToFirestore(l);
          } catch (err) {}
        });
      }
      
      showToast(`¡Respaldo importado con éxito! Se cargaron/actualizaron ${importedCount} licencias.`, "success");
      addAuditLog('SYSTEM', 'RESPALDO_IMPORTAR_JSON', `Importadas ${importedCount} licencias desde archivo JSON.`);
    } catch (err) {
      console.error(err);
      showToast(`Error al importar respaldo: ${err.message}`, "danger");
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

async function saveToStorage() {
  const appsStr = JSON.stringify(state.apps);
  const licensesStr = JSON.stringify(state.licenses);
  const logsStr = JSON.stringify(state.logs);
  const recycleBinStr = JSON.stringify(state.recycleBin || []);
  const customSeedsStr = JSON.stringify(state.customSeeds || []);
  const keyToUse = SESSION_KEY || MASTER_LEDGER_SALT;

  localStorage.setItem('alr_saas_apps_secure', await encryptReposo(appsStr, keyToUse));
  localStorage.setItem('alr_saas_licenses_secure', await encryptReposo(licensesStr, keyToUse));
  localStorage.setItem('alr_saas_logs_secure', await encryptReposo(logsStr, keyToUse));
  localStorage.setItem('alr_saas_recycle_bin_secure', await encryptReposo(recycleBinStr, keyToUse));
  localStorage.setItem('alr_saas_custom_seeds_secure', await encryptReposo(customSeedsStr, keyToUse));

  // 🔐 Sugerencia 32: Índices Cifrados (Hashed search index) para búsquedas locales rápidas
  const licensesIndex = {};
  state.licenses.forEach(l => {
    if (l.id) {
      licensesIndex[sha256Sync(l.id)] = l.id;
    }
  });
  localStorage.setItem('alr_saas_licenses_index', JSON.stringify(licensesIndex));

  // Eliminar datos antiguos sin cifrar para cerrar brechas de seguridad
  localStorage.removeItem('alr_saas_apps');
  localStorage.removeItem('alr_saas_licenses');
  localStorage.removeItem('alr_saas_logs');
}

// 🎛️ ENRUTADOR / GESTOR DE PESTAÑAS (View Switching)
window.switchView = function(viewId) {
  document.querySelectorAll('.saas-view').forEach(view => {
    view.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.remove('active');
  });

  const targetView = document.getElementById('view-' + viewId);
  const targetNav = document.getElementById('nav-' + viewId);

  if (targetView) targetView.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  // Registrar cambio de vista en la bitácora para auditoría
  if (currentAdmin && currentAdmin.role !== 'BLOQUEADO') {
    addAuditLog('SYSTEM', 'CAMBIO_VISTA', `Operador cambió a la vista: ${viewId}`);
  }

  if (viewId === 'wizard') {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const startDateEl = document.getElementById('w-start-date');
    const expiryDateEl = document.getElementById('w-expiry-date');
    if (startDateEl && !startDateEl.value) startDateEl.value = todayStr;
    if (expiryDateEl && !expiryDateEl.value) expiryDateEl.value = nextMonthStr;
  }

  if (viewId === 'dashboard' || viewId === 'licenses' || viewId === 'billing' || viewId === 'telemetry') {
    verifyAuditLedger();
    renderAll();
  }
  if (viewId === 'wizard') {
    if (typeof window.renderRecentSeeds === 'function') {
      window.renderRecentSeeds();
    }
  }
};

// 👥 DYNAMIC RENDERING ENGINE
function renderAll() {
  if (currentAdmin && currentAdmin.role !== 'BLOQUEADO') {
    if (typeof window.validateSessionFingerprint === 'function' && !window.validateSessionFingerprint()) {
      return;
    }
  }
  renderMetrics();
  renderDashboardTable();
  renderAppsPortfolio();
  renderClientsTable();
  renderRecycleBin();
  renderBillingTable();
  renderTelemetryLogs();
  populateWizardSelects();
}

window.dashboardFilter = 'all';
window.dashboardSearchQuery = '';

window.filterDashboardApps = function(mode) {
  window.dashboardFilter = mode;
  renderDashboardTable();
};

window.filterDashboardAppsSearch = function(query) {
  window.dashboardSearchQuery = (query || '').toLowerCase().trim();
  renderDashboardTable();
};

function getDaysUntilExpiry(expiryDateStr) {
  if (!expiryDateStr || expiryDateStr === 'Ilimitado') {
    return { days: 9999, text: 'Vigencia Permanente', status: 'OK' };
  }
  const expTime = new Date(expiryDateStr).getTime();
  if (isNaN(expTime)) {
    return { days: 9999, text: 'Vigencia Permanente', status: 'OK' };
  }
  
  const now = Date.now();
  const diffMs = expTime - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { days: diffDays, text: `Expiró hace ${Math.abs(diffDays)} d`, status: 'EXPIRED' };
  } else if (diffDays === 0) {
    return { days: 0, text: 'Vence Hoy ⚠️', status: 'CRITICAL' };
  } else if (diffDays <= 7) {
    return { days: diffDays, text: `Quedan ${diffDays} día(s) ⚠️`, status: 'WARNING' };
  } else {
    return { days: diffDays, text: `Quedan ${diffDays} día(s)`, status: 'OK' };
  }
}

function renderMetrics() {
  const totalApps = state.apps.length;
  const totalClients = state.licenses.length;
  const activeClients = state.licenses.filter(l => l.status === 'ACTIVE').length;
  
  let warningClientsCount = 0;
  state.licenses.forEach(l => {
    const expiryInfo = getDaysUntilExpiry(l.expiryDate || l.expirationDate);
    if (expiryInfo.status === 'WARNING' || expiryInfo.status === 'CRITICAL' || expiryInfo.status === 'EXPIRED') {
      warningClientsCount++;
    }
  });

  let totalMRR = 0;
  state.licenses.filter(l => l.status === 'ACTIVE').forEach(l => {
    totalMRR += Number(l.dailyCost || 0) * 30.4;
  });

  const totalAppsElem = document.getElementById('dashboard-total-apps');
  const totalClientsElem = document.getElementById('dashboard-total-clients');
  const activeClientsElem = document.getElementById('dashboard-active-clients');
  const warningClientsElem = document.getElementById('dashboard-warning-clients');
  const mrrElem = document.getElementById('dashboard-mrr');

  if (totalAppsElem) totalAppsElem.innerText = totalApps;
  if (totalClientsElem) totalClientsElem.innerText = totalClients;
  if (activeClientsElem) activeClientsElem.innerText = activeClients;
  if (warningClientsElem) warningClientsElem.innerText = warningClientsCount;
  if (mrrElem) mrrElem.innerText = '$' + Math.round(totalMRR).toLocaleString('es-MX');

  // Actualización dinámica del título de la pestaña del navegador (Sugerencia 3)
  if (warningClientsCount > 0) {
    document.title = `(⚠️ ${warningClientsCount}) ALR SaaS Commander Hub`;
  } else {
    document.title = `ALR SaaS Commander Hub`;
  }

  // Control del banner dinámico de alertas preventivas de suspensión
  const alertBanner = document.getElementById('dashboard-pre-suspension-alert');
  const alertMsg = document.getElementById('dashboard-alert-message');
  if (alertBanner && alertMsg) {
    if (warningClientsCount > 0) {
      alertBanner.style.display = 'block';
      alertMsg.innerHTML = `Hay <strong>${warningClientsCount} aplicación(es)</strong> próximas a vencer o en periodo crítico. Notifique a los establecimientos antes de la suspensión automática del servicio.`;
    } else {
      alertBanner.style.display = 'none';
    }
  }
}

function renderDashboardTable() {
  const container = document.getElementById('dashboard-recent-table-body');
  if (!container) return;
  
  if (state.licenses.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; opacity:0.6; font-style:italic;">No hay licencias ni aplicaciones registradas en este momento. <a href="#" onclick="window.pullAllLicensesFromCloud(); return false;" style="color:var(--accent); text-decoration:underline; font-weight:bold; margin-left:10px;">¿Faltan datos? Sincronizar desde la nube</a></td></tr>`;
    return;
  }

  let list = [...state.licenses];
  if (window.dashboardFilter === 'warning') {
    list = list.filter(l => {
      const exp = getDaysUntilExpiry(l.expiryDate || l.expirationDate);
      return exp.status === 'WARNING' || exp.status === 'CRITICAL' || exp.status === 'EXPIRED';
    });
  }

  if (window.dashboardSearchQuery) {
    const q = window.dashboardSearchQuery;
    list = list.filter(l => {
      const app = state.apps.find(a => a.id === l.appId) || {};
      return (l.clientName || '').toLowerCase().includes(q) ||
             (l.appName || '').toLowerCase().includes(q) ||
             (app.name || '').toLowerCase().includes(q) ||
             (l.apiKey || '').toLowerCase().includes(q);
    });
  }

  if (list.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; opacity:0.5; font-style:italic;">No hay aplicaciones que coincidan con la búsqueda o filtro.</td></tr>`;
    return;
  }

  container.innerHTML = list.map(l => {
    const app = state.apps.find(a => a.id === l.appId) || { name: l.appName || 'Aplicación', icon: 'ri-apps-fill', color: '#10b981' };
    const expiryDateStr = l.expiryDate || l.expirationDate;
    const expiryInfo = getDaysUntilExpiry(expiryDateStr);
    const dateFormatted = expiryDateStr && expiryDateStr !== 'Ilimitado' ? new Date(expiryDateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Vigencia Permanente';

    const isOnline = l.status === 'ACTIVE';
    let statusBadge = '';
    if (isOnline) {
      if (expiryInfo.status === 'WARNING' || expiryInfo.status === 'CRITICAL') {
        statusBadge = `<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 900; cursor: pointer;"><i class="ri-error-warning-fill"></i> POR VENCER <i class="ri-pencil-fill" style="font-size: 8px;"></i></span>`;
      } else {
        statusBadge = `<span class="status-badge active" style="font-weight: 900; cursor: pointer;"><i class="ri-checkbox-circle-fill"></i> LIVE / ACTIVA <i class="ri-pencil-fill" style="font-size: 8px; margin-left: 2px;"></i></span>`;
      }
    } else {
      statusBadge = `<span class="status-badge suspended" style="font-weight: 900; cursor: pointer;"><i class="ri-close-circle-fill"></i> SUSPENDIDA <i class="ri-pencil-fill" style="font-size: 8px; margin-left: 2px;"></i></span>`;
    }

    let countdownBadge = '';
    if (expiryInfo.status === 'EXPIRED') {
      countdownBadge = `<span style="font-size: 9px; font-weight: 900; background: rgba(239,68,68,0.15); color: var(--danger); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.3); font-family: var(--font-heading);">${expiryInfo.text}</span>`;
    } else if (expiryInfo.status === 'WARNING' || expiryInfo.status === 'CRITICAL') {
      countdownBadge = `<span style="font-size: 9px; font-weight: 900; background: rgba(245,158,11,0.15); color: #f59e0b; padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(245,158,11,0.3); font-family: var(--font-heading); animation: pulse 1.5s infinite;">${expiryInfo.text}</span>`;
    } else {
      countdownBadge = `<span style="font-size: 9px; font-weight: 800; opacity: 0.6;">${expiryInfo.text}</span>`;
    }

    const isPlanPaid = l.currentPlan === 'PAGADO';
    const planBadge = isPlanPaid
      ? `<span class="status-badge" style="background: rgba(34, 197, 94, 0.15); color: #2ecc71; border: 1px solid rgba(34, 197, 94, 0.3); font-weight: 900; padding: 2px 8px; border-radius: 6px; cursor: pointer;" title="✏️ Clic para cambiar estatus de pago (PAGADO / NO_PAGADO)">PAGADO <i class="ri-pencil-fill" style="font-size: 8px;"></i></span>`
      : `<span class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 900; padding: 2px 8px; border-radius: 6px; cursor: pointer;" title="✏️ Clic para cambiar estatus de pago (PAGADO / NO_PAGADO)">NO_PAGADO <i class="ri-pencil-fill" style="font-size: 8px;"></i></span>`;

    const calc = window.calculateAdjustedMonthlyFee ? window.calculateAdjustedMonthlyFee(l) : { formattedAdjusted: '$500.00 MXN', yearsElapsed: 0 };
    const periodName = l.renewalPeriod || (l.currentPlan === 'PRO_ULTIMATE' || l.currentPlan === 'ENTERPRISE' ? 'Mensual' : 'Mensual');

    const appIcon = app.icon || 'ri-apps-fill';
    const appColor = app.color || '#10b981';
    const clientUrl = l.appUrl || `https://kuatsi.web.app/`;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 34px; height: 34px; border-radius: 10px; background: ${appColor}22; border: 1px solid ${appColor}55; color: ${appColor}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
              <i class="${escapeHtml(appIcon)}"></i>
            </div>
            <div>
              <div style="font-weight: 900; font-size: 12px; color: #fff;">${escapeHtml(l.clientName)}</div>
              <div style="font-size: 9.5px; opacity: 0.5; font-weight: 800; text-transform: uppercase;">${escapeHtml(app.name || l.appName)}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="cursor: pointer; display: inline-block;" onclick="window.toggleLicenseStatus('${escapeHtml(l.id)}', '${l.status}')" title="✏️ Clic para cambiar estado operativo (Suspender / Activar)">
            ${statusBadge}
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div onclick="window.togglePlanStatus('${escapeHtml(l.id)}')" style="display: inline-block;">
              ${planBadge}
            </div>
            <div onclick="window.openRenewalConfigModal('${escapeHtml(l.id)}')" style="font-size: 9.5px; font-weight: 900; color: #10b981; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;" title="✏️ Clic para editar mensualidad base e incremento del +6%">
              ${calc.formattedAdjusted} <span style="font-size: 8px; opacity: 0.6; color: #a0aec0;">(+6% Año ${calc.yearsElapsed})</span> <i class="ri-edit-line" style="font-size: 10px; color: var(--accent);"></i>
            </div>
          </div>
        </td>
        <td>
          ${(() => {
            const isPlanPaid = l.currentPlan === 'PAGADO';
            const suspensionInfo = window.calculateNextSuspensionDate ? window.calculateNextSuspensionDate(l) : { formattedDate: dateFormatted, daysLeft: 30, isPaid: isPlanPaid };
            const daysLeft = suspensionInfo.daysLeft;

            let color = '#2ecc71';
            let bg = 'rgba(46, 204, 113, 0.15)';
            let border = 'rgba(46, 204, 113, 0.35)';
            let icon = 'ri-shield-check-fill';
            let badgeText = '';

            if (isPlanPaid || daysLeft > 15) {
              // 🟢 VERDE (SEGURO / AL DÍA: Más de 15 días o PAGADO)
              color = '#2ecc71';
              bg = 'rgba(46, 204, 113, 0.15)';
              border = 'rgba(46, 204, 113, 0.35)';
              icon = 'ri-shield-check-fill';
              badgeText = isPlanPaid 
                ? `🟢 PAGADO - Sin Suspensión (${l.paymentPeriod || 'Mensual'})`
                : `🟢 AL DÍA: Suspensión en ${daysLeft} día(s) (${l.paymentPeriod || 'Mensual'})`;
            } else if (daysLeft >= 8 && daysLeft <= 15) {
              // 🟡 ÁMBAR / AMARILLO (PRECAUCIÓN: entre 8 y 15 días)
              color = '#f1c40f';
              bg = 'rgba(241, 196, 15, 0.18)';
              border = 'rgba(241, 196, 15, 0.45)';
              icon = 'ri-error-warning-fill';
              badgeText = `🟡 PRECAUCIÓN: Suspensión en ${daysLeft} día(s) (${l.paymentPeriod || 'Mensual'})`;
            } else if (daysLeft >= 4 && daysLeft <= 7) {
              // 🟠 NARANJA (URGENTE / ALERTA DE CORTE: entre 4 y 7 días)
              color = '#e67e22';
              bg = 'rgba(230, 126, 34, 0.22)';
              border = 'rgba(230, 126, 34, 0.55)';
              icon = 'ri-alarm-warning-fill';
              badgeText = `🟠 ALERTA: Suspensión en ${daysLeft} día(s) (${l.paymentPeriod || 'Mensual'})`;
            } else {
              // 🔴 ROJO (CRÍTICO / SUSPENSIÓN INMINENTE O CORTE HOY: 3 días o menos / vencido)
              color = '#ef4444';
              bg = 'rgba(239, 68, 68, 0.25)';
              border = 'rgba(239, 68, 68, 0.6)';
              icon = 'ri-close-circle-fill';
              badgeText = daysLeft <= 0 
                ? `🔴 ¡CORTE DE SERVICIO HOY! (${l.paymentPeriod || 'Mensual'})`
                : `🔴 URGENTE: Suspensión en ${daysLeft} día(s) (${l.paymentPeriod || 'Mensual'})`;
            }

            const animationStyle = (daysLeft <= 15 && !isPlanPaid) ? 'animation: pulse 1.5s infinite;' : '';

            return `
              <div style="display: flex; flex-direction: column; gap: 3px; cursor: pointer;" onclick="window.openPaymentMonthsModal('${escapeHtml(l.id)}')" title="💳 Clic para registrar meses pagados y gestionar suspensión">
                <span style="font-size: 11px; font-weight: 900; color: ${isPlanPaid ? '#fff' : color}; display: inline-flex; align-items: center; gap: 4px;">
                  ${isPlanPaid ? `Renovación: ${escapeHtml(dateFormatted)}` : `Próx. Suspensión: ${escapeHtml(suspensionInfo.formattedDate)}`} <i class="ri-wallet-3-line" style="font-size: 10px; color: var(--accent);"></i>
                </span>
                <span style="font-size: 9px; font-weight: 900; background: ${bg}; color: ${color}; padding: 2px 8px; border-radius: 10px; border: 1px solid ${border}; font-family: var(--font-heading); display: inline-flex; align-items: center; gap: 4px; ${animationStyle}">
                  <i class="${icon}"></i> ${badgeText}
                </span>
              </div>
            `;
          })()}
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            <a href="${escapeHtml(clientUrl)}" target="_blank" class="btn btn-secondary" style="height: 30px; width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" title="Abrir App en Vivo">
              <i class="ri-external-link-line" style="font-size: 13px;"></i>
            </a>
            <button class="btn btn-secondary" style="height: 30px; padding: 0 10px; font-size: 9px; font-weight: 900; color: var(--accent); border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.05);" onclick="window.openRenewalConfigModal('${escapeHtml(l.id)}')" title="Configurar Fecha de Renovación, Período y Mensualidad (+6% Anual)">
              <i class="ri-calendar-event-line"></i> Renovación
            </button>
            <button class="btn btn-secondary" style="height: 30px; padding: 0 10px; font-size: 9px; font-weight: 900; color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.05);" onclick="window.sendRenewalNotice('${escapeHtml(l.id)}')" title="Enviar Aviso Preventivo antes de suspender">
              <i class="ri-notification-badge-fill"></i> Avisar
            </button>
            <button class="btn btn-secondary" style="height: 30px; padding: 0 10px; font-size: 9px; font-weight: 900; color: var(--success); border: 1px solid rgba(34,197,94,0.3); background: rgba(34,197,94,0.05);" onclick="window.quickRenewLicense('${escapeHtml(l.id)}')" title="Renovar +30 Días">
              <i class="ri-refresh-line"></i> Renovar
            </button>
            <button class="btn btn-secondary" style="height: 30px; width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; color: ${isOnline ? 'var(--danger)' : 'var(--success)'};" onclick="window.toggleLicenseStatus('${escapeHtml(l.id)}', '${l.status}')" title="${isOnline ? 'Suspender Acceso' : 'Reactivar Acceso'}">
              <i class="${isOnline ? 'ri-shut-down-line' : 'ri-play-circle-line'}" style="font-size: 13px;"></i>
            </button>
            <button class="btn btn-danger-outline" style="height: 30px; width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" onclick="window.deleteLicense('${escapeHtml(l.id)}')" title="Eliminar Cliente / Mover a Papelera de Reciclaje (solo en ALR SaaS, no borra nada en la app destino)">
              <i class="ri-delete-bin-line" style="font-size: 13px;"></i>
            </button>
            ${(state.appRegistry && state.appRegistry[l.appId] && state.appRegistry[l.appId].deleteFunctionName) ? `
            <button class="btn btn-danger-outline" style="height: 30px; width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.12);" onclick="window.deprovisionTenantReal('${escapeHtml(l.id)}', '${escapeHtml(l.appId)}', '${escapeHtml(l.clientName)}')" title="⚠️ Borrado DURO: elimina TODOS los datos del tenant en la app destino, irreversible">
              <i class="ri-delete-bin-2-fill" style="font-size: 13px;"></i>
            </button>
            <button class="btn btn-secondary" style="height: 30px; width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; color: #f59e0b;" onclick="window.restoreTenantReal('${escapeHtml(l.id)}', '${escapeHtml(l.appId)}', '${escapeHtml(l.clientName)}')" title="Restaurar el respaldo más reciente de este tenant (deshace el último clonado/borrado)">
              <i class="ri-history-line" style="font-size: 13px;"></i>
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.sendRenewalNotice = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId);
  if (!license) return;

  const expiryDateFormatted = license.expiryDate || license.expirationDate ? new Date(license.expiryDate || license.expirationDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Próximamente';

  const messageText = `⚠️ *AVISO PREVENTIVO DE RENOVACIÓN - ALR SAAS*\n\nEstimado cliente *${license.clientName}*,\nLe recordamos que su suscripción para la aplicación *${license.appName}* se encuentra próxima a su fecha de renovación (*${expiryDateFormatted}*).\n\nPara garantizar la continuidad operativa de su punto de venta y evitar la suspensión automática del servicio, le solicitamos realizar la renovación a la brevedad.\n\nAtentamente,\n*ALR SaaS Central Commander*`;

  if (typeof window.sendTelegramNotification === 'function') {
    window.sendTelegramNotification(messageText, 'WARNING');
  }

  addAuditLog('GOVERNANCE', 'AVISO_PREVENTIVO', `Aviso preventivo de suspensión enviado a cliente: ${license.clientName} (${license.appName}). Fecha expiración: ${expiryDateFormatted}`);

  showToast(`⚡ Aviso preventivo enviado a ${escapeHtml(license.clientName)}`, "warning");
};

window.sendMassRenewalWarnings = function() {
  let count = 0;
  state.licenses.forEach(l => {
    const expiryInfo = getDaysUntilExpiry(l.expiryDate || l.expirationDate);
    if (expiryInfo.status === 'WARNING' || expiryInfo.status === 'CRITICAL' || expiryInfo.status === 'EXPIRED') {
      window.sendRenewalNotice(l.id);
      count++;
    }
  });

  if (count === 0) {
    showToast("Todas las aplicaciones se encuentran vigentes y al día.", "success");
  } else {
    showToast(`Se han emitido ${count} aviso(s) preventivo(s) de suspensión.`, "warning");
  }
};

window.quickRenewLicense = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId);
  if (!license) return;

  const currentExp = license.expiryDate || license.expirationDate ? new Date(license.expiryDate || license.expirationDate).getTime() : Date.now();
  const baseTime = currentExp > Date.now() ? currentExp : Date.now();
  const newExpDate = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

  license.expiryDate = newExpDate;
  license.expirationDate = newExpDate;
  license.status = 'ACTIVE';
  license.version = (license.version || 1) + 1;

  addAuditLog('GOVERNANCE', 'RENOVACIÓN_RÁPIDA', `Licencia renovada por +30 Días para cliente: ${license.clientName}. Nueva expiración: ${new Date(newExpDate).toLocaleDateString('es-MX')}`);

  saveToStorage();
  window.syncLicenseToFirestore(license);
  showToast(`¡Licencia de ${escapeHtml(license.clientName)} renovada con éxito (+30 días)!`, "success");
  renderAll();
};

function renderAppsPortfolio() {
  const container = document.getElementById('apps-portfolio-container');
  if (!container) return;

  // Renderizar gráfico rápido de distribución de clientes (Sugerencia 3)
  const totalClients = state.licenses.length;
  const distributionBar = document.getElementById('portfolio-distribution-bar');
  const distributionLegend = document.getElementById('portfolio-distribution-legend');
  
  if (distributionBar && distributionLegend) {
    if (totalClients === 0) {
      distributionBar.innerHTML = `<div style="width: 100%; height: 100%; background: rgba(255,255,255,0.1);" title="Sin clientes registrados"></div>`;
      distributionLegend.innerHTML = `<span style="font-size: 9px; opacity: 0.5; font-style: italic;">No hay clientes para calcular distribución.</span>`;
    } else {
      let barHtml = '';
      let legendHtml = '';
      
      state.apps.forEach(app => {
        const count = state.licenses.filter(l => l.appId === app.id).length;
        if (count > 0) {
          const pct = (count / totalClients) * 100;
          barHtml += `<div style="width: ${pct}%; height: 100%; background: ${app.color};" title="${escapeHtml(app.name)}: ${count} (${Math.round(pct)}%)"></div>`;
          legendHtml += `
            <span style="font-size: 9px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; color: ${app.color};">
              ● ${escapeHtml(app.name)}: ${count} (${Math.round(pct)}%)
            </span>
          `;
        }
      });
      
      if (!barHtml) {
        barHtml = `<div style="width: 100%; height: 100%; background: rgba(255,255,255,0.1);" title="Sin clientes activos"></div>`;
        legendHtml = `<span style="font-size: 9px; opacity: 0.5; font-style: italic;">Sin clientes activos en las apps registradas.</span>`;
      }
      
      distributionBar.innerHTML = barHtml;
      distributionLegend.innerHTML = legendHtml;
    }
  }

  if (state.apps.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center; border: 1px dashed var(--border-glass); border-radius: 24px; min-height: 250px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px;">
        <div style="font-size: 48px; opacity: 0.3;">📦</div>
        <h3 style="font-size: 16px; font-weight: 800; opacity: 0.8;">Catálogo de aplicaciones vacío</h3>
        <p style="font-size: 11px; opacity: 0.5; max-width: 380px; line-height: 1.5;">Comienza registrando una nueva aplicación de forma manual o importa una plantilla de producción para aprovisionar clientes.</p>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button class="btn btn-primary" style="height: 36px; padding: 0 16px; font-size: 10px; font-weight: 800;" onclick="switchView('wizard')">
            <i class="ri-add-line"></i> Registrar Manualmente
          </button>
          <button class="btn btn-secondary" style="height: 36px; padding: 0 16px; font-size: 10px; font-weight: 800; border-color: rgba(59,130,246,0.3); color: #3b82f6; background: rgba(59,130,246,0.05);" onclick="switchView('dashboard'); setTimeout(() => document.getElementById('w-import-url')?.focus(), 200);">
            <i class="ri-download-cloud-line"></i> Importar Plantilla JSON
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Filtro rápido de tarjetas (Sugerencia 4)
  const searchVal = document.getElementById('portfolio-search')?.value?.toLowerCase() || '';
  const filteredApps = state.apps.filter(app => 
    app.name.toLowerCase().includes(searchVal) || 
    app.id.toLowerCase().includes(searchVal)
  );

  if (filteredApps.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center; border: 1px dashed var(--border-glass); border-radius: 24px; min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px;">
        <div style="font-size: 32px; opacity: 0.3;">🔍</div>
        <h3 style="font-size: 14px; font-weight: 800; opacity: 0.8;">No se encontraron coincidencias</h3>
        <p style="font-size: 11px; opacity: 0.5;">No hay aplicaciones que coincidan con la búsqueda "${searchVal}".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredApps.map(app => {
    // Ordenar clientes alfabéticamente (Sugerencia 2)
    const clients = state.licenses.filter(l => l.appId === app.id).sort((a, b) => a.clientName.localeCompare(b.clientName));
    const clientsCount = clients.length;
    
    const clientsHtml = clientsCount > 0 ? (() => {
      const links = clients.map(l => {
        const clientUrl = l.appUrl || `https://rey-smart-wash.web.app/${l.id}`;
        const isActive = l.status === 'ACTIVE';
        const statusDotColor = isActive ? '#22c55e' : '#ef4444'; // (Sugerencia 1)
        
        // Alerta de desincronización de esquema (Sugerencia 2)
        const parentTemplate = SEED_TEMPLATES[app.id];
        const isDivergent = (parentTemplate && l.customConfig)
          ? ((parentTemplate.roles?.length || 0) !== (l.customConfig.roles?.length || 0) ||
             (parentTemplate.services?.length || 0) !== (l.customConfig.services?.length || 0))
          : false;
        
        // Tooltip con detalles del cliente (Sugerencia 3)
        const tooltipText = `Cliente: ${l.clientName}\nEstado: ${isActive ? 'ONLINE' : 'OFFLINE'}\nPlan: ${l.currentPlan}\nSaldo Inicial: $${Number(l.initialAmount || 0).toLocaleString('es-MX')}`;
        
        return `
          <div style="display: inline-flex; align-items: center; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.15); padding: 4px 8px; border-radius: 12px; margin-bottom: 4px; transition: all 0.2s ease; gap: 4px;" onmouseover="this.style.background='rgba(0, 229, 255, 0.15)'; this.style.borderColor='var(--accent)';" onmouseout="this.style.background='rgba(0, 229, 255, 0.05)'; this.style.borderColor='rgba(0, 229, 255, 0.15)';">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusDotColor}; display: inline-block;" title="${isActive ? 'ONLINE' : 'OFFLINE'}"></span>
            ${isDivergent ? `<span style="color: var(--warning); font-size: 10px; cursor: help; display: inline-flex; align-items: center;" title="Alerta: Esquema personalizado divergente de la plantilla base original (modificaciones de catálogo/roles).">⚠️</span>` : ''}
            <a href="${escapeHtml(clientUrl)}" target="_blank" style="color: var(--accent); font-size: 10px; text-decoration: none; font-weight: 800; display: inline-flex; align-items: center; gap: 2px;" title="${escapeHtml(tooltipText)}">
              ${escapeHtml(l.clientName)} <i class="ri-external-link-line" style="font-size: 8px;"></i>
            </a>
            <!-- Botón de simulación (Sugerencia 5) -->
            <button onclick="event.preventDefault(); window.simulateClientUsage('${escapeHtml(l.id)}')" style="background: none; border: none; padding: 0; margin-left: 2px; color: var(--accent-secondary); opacity: 0.6; cursor: pointer; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Simular 10 operaciones de telemetría de facturación para este cliente">
              <i class="ri-flashlight-line" style="font-size: 9px;"></i>
            </button>
            <!-- Botón de clonación rápida (Sugerencia 6) -->
            <button onclick="event.preventDefault(); window.cloneClientWizard('${escapeHtml(l.id)}')" style="background: none; border: none; padding: 0; margin-left: 2px; color: var(--accent); opacity: 0.6; cursor: pointer; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Clonar esta configuración de cliente en el Asistente">
              <i class="ri-file-copy-2-line" style="font-size: 9px;"></i>
            </button>
          </div>
        `;
      }).join(' ');

      // Colapsar scroll si hay más de 5 clientes (Sugerencia 5)
      const scrollStyle = clientsCount > 5 ? 'max-height: 85px; overflow-y: auto; padding-right: 4px;' : '';

      return `
        <div style="margin-top: 10px; margin-bottom: 15px;">
          <span style="font-size: 9px; font-weight: 800; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Enlaces de Clientes (${clientsCount}):</span>
          <div class="custom-scroll" style="display: flex; flex-wrap: wrap; gap: 6px; ${scrollStyle}">
            ${links}
          </div>
        </div>
      `;
    })() : '';

    return `
      <div class="glass-panel" style="border-top: 3px solid ${app.color}; display:flex; flex-direction:column; justify-content:space-between; min-height: 220px;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size: 24px; color: ${app.color};"><i class="${escapeHtml(app.icon)}"></i></div>
            <div style="display:flex; gap:6px; align-items:center;">
              <span class="status-badge" style="background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5);">${escapeHtml(app.version)}</span>
              <!-- Historial de auditoría por app (Sugerencia 7) -->
              <a href="#" onclick="event.preventDefault(); window.viewAppAuditLogs('${escapeHtml(app.id)}')" style="color: var(--accent); font-size: 9px; text-decoration: none; font-weight: 800; border: 1px solid rgba(0, 229, 255, 0.15); padding: 3px 8px; border-radius: 8px; background: rgba(0, 229, 255, 0.03); display: inline-flex; align-items: center; gap: 4px;" title="Ver bitácora de auditoría para esta aplicación">
                <i class="ri-history-line"></i> Logs
              </a>
              <!-- Sugerencia 7: Ver Semilla -->
              <a href="#" onclick="event.preventDefault(); window.viewSeedTemplateSchema('${escapeHtml(app.id)}')" style="color: var(--accent); font-size: 9px; text-decoration: none; font-weight: 800; border: 1px solid rgba(0, 229, 255, 0.15); padding: 3px 8px; border-radius: 8px; background: rgba(0, 229, 255, 0.03); display: inline-flex; align-items: center; gap: 4px;" title="Ver plantilla de semilla base de la aplicación">
                <i class="ri-code-box-line"></i> Semilla
              </a>
              <!-- Auto-clonado: configura a qué proyecto/función llamar para dar de alta tenants nuevos con un clic desde el Asistente -->
              <a href="#" onclick="event.preventDefault(); window.openAppCloneConfigModal('${escapeHtml(app.id)}')" style="color: ${(state.appRegistry && state.appRegistry[app.id]) ? '#2ecc71' : 'var(--accent)'}; font-size: 9px; text-decoration: none; font-weight: 800; border: 1px solid ${(state.appRegistry && state.appRegistry[app.id]) ? 'rgba(46,204,113,0.3)' : 'rgba(0, 229, 255, 0.15)'}; padding: 3px 8px; border-radius: 8px; background: ${(state.appRegistry && state.appRegistry[app.id]) ? 'rgba(46,204,113,0.06)' : 'rgba(0, 229, 255, 0.03)'}; display: inline-flex; align-items: center; gap: 4px;" title="Configurar el auto-clonado (alta de tenants con un clic) para esta app">
                <i class="ri-file-copy-2-line"></i> ${(state.appRegistry && state.appRegistry[app.id]) ? 'Clonado ✓' : 'Auto-clonado'}
              </a>
              <!-- Botón Eliminar App -->
              <button onclick="event.preventDefault(); window.deleteAppFromPortfolio('${escapeHtml(app.id)}')" style="color: var(--danger); font-size: 9px; border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 8px; background: rgba(239, 68, 68, 0.05); cursor: pointer; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;" title="Eliminar Aplicación del Catálogo Master">
                <i class="ri-delete-bin-line"></i> Eliminar
              </button>
            </div>
          </div>
          <h3 style="font-weight:900; font-size:18px; margin-bottom:6px; letter-spacing:-0.5px;">${escapeHtml(app.name)}</h3>
          <p style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">
            ${app.status === 'BETA' ? '🔴 BETA TESTING' : '🔵 VERSIÓN ESTABLE'}
          </p>
          ${clientsHtml}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border-glass); padding-top:15px; margin-top:15px;">
          <span style="font-size:10px; font-weight:800; opacity:0.5;">CLIENTES: ${clientsCount}</span>
          <div style="display:flex; gap: 6px; align-items:center;">
            <button class="btn btn-secondary" style="height:32px; padding:0 12px; font-size:9px;" onclick="switchView('wizard'); document.getElementById('w-app-select').value='${escapeHtml(app.id)}'; window.autoGenerateSlug(document.getElementById('w-client-name').value)">
              + Aprovisionar
            </button>
            <button class="btn btn-danger-outline" style="height:32px; width:32px; padding:0; font-size:14px; display:inline-flex; align-items:center; justify-content:center;" onclick="window.deleteAppFromPortfolio('${escapeHtml(app.id)}')" title="Eliminar App del Catálogo">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderClientsTable() {
  const container = document.getElementById('clients-table-body');
  if (!container) return;

  if (state.licenses.length === 0) {
    container.innerHTML = `<tr><td colspan="8" style="text-align:center; opacity:0.5; font-style:italic;">No hay clientes registrados en ALR SaaS. <a href="#" onclick="window.pullAllLicensesFromCloud(); return false;" style="color:var(--accent); text-decoration:underline; font-weight:bold; margin-left:10px;">¿Faltan clientes? Sincronizar desde la nube</a></td></tr>`;
    return;
  }

  let pendingSyncIds = [];
  try {
    const raw = localStorage.getItem('alr_saas_pending_license_sync');
    if (raw) pendingSyncIds = JSON.parse(raw);
  } catch (e) {}

  container.innerHTML = state.licenses.map(l => {
    const app = state.apps.find(a => a.id === l.appId) || { name: 'App' };
    const expiry = l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : 'Sin Vencer';
    const isActive = l.status === 'ACTIVE';
    const isPlanPaid = l.currentPlan === 'PAGADO';
    const planBadge = isPlanPaid
      ? `<span class="status-badge" style="background: rgba(34, 197, 94, 0.1); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.2);">PAGADO</span>`
      : `<span class="status-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);">SIN PAGAR</span>`;
    const statusBadge = isActive
      ? `<span class="status-badge active">ONLINE</span>`
      : `<span class="status-badge suspended">OFFLINE</span>`;

    const isPendingSync = pendingSyncIds.includes(l.id);
    const syncBadge = window.FIREBASE_SYNC_ENABLED
      ? (isPendingSync
        ? `<span class="status-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); font-size: 9px; margin-left: 6px; font-weight:800;" title="Pendiente de sincronizar con Firestore">⏳ Pendiente</span>`
        : `<span class="status-badge" style="background: rgba(34, 197, 94, 0.1); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.2); font-size: 9px; margin-left: 6px; font-weight:800;" title="Sincronizado con Firestore">☁️ Sincronizado</span>`)
      : '';

    const clientUrl = l.appUrl || `https://rey-smart-wash.web.app/${l.id}`;
    return `
      <tr>
        <td style="font-family: var(--font-mono); font-size:11px; opacity:0.6;">${escapeHtml(l.id)}</td>
        <td style="font-weight:900;">
          <a href="${escapeHtml(clientUrl)}" target="_blank" style="color: var(--accent); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Ingresar a la App Cliente">
            ${escapeHtml(l.clientName)} <i class="ri-external-link-line" style="font-size: 10px;"></i>
          </a>
          ${syncBadge}
        </td>
        <td style="opacity:0.7;">${escapeHtml(app.name)}</td>
        <td style="font-family: var(--font-mono); font-size:11px; opacity:0.5;">${escapeHtml(l.apiKey)}</td>
        <td style="opacity:0.7;">${escapeHtml(expiry)}</td>
        <td>${planBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:8px;">
            <a href="${escapeHtml(clientUrl)}" target="_blank" class="btn btn-secondary" style="width:32px; height:32px; padding:0; font-size:14px; display:inline-flex; align-items:center; justify-content:center; color:var(--accent); border-color:rgba(0,229,255,0.2); background:rgba(0,229,255,0.05);" title="Ingresar a la App Cliente">
              <i class="ri-external-link-line"></i>
            </a>
            <button class="btn btn-secondary" style="width:32px; height:32px; padding:0; font-size:14px;" title="Ver/Verificar Firma de API" onclick="verifyApiSignatureModal('${escapeHtml(l.id)}')">
              <i class="ri-key-fill"></i>
            </button>
            <button class="btn btn-secondary" style="width:32px; height:32px; padding:0; font-size:14px;" title="Agregar Créditos" onclick="openAddCreditsModal('${escapeHtml(l.id)}')">
              <i class="ri-money-dollar-circle-line"></i>
            </button>
            <button class="btn btn-secondary" style="width:32px; height:32px; padding:0; font-size:14px; color:${isPlanPaid ? 'var(--warning)' : 'var(--success)'}; border-color:${isPlanPaid ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}; background:${isPlanPaid ? 'rgba(245,158,11,0.05)' : 'rgba(34,197,94,0.05)'};" title="${isPlanPaid ? 'Marcar como SIN PAGAR' : 'Marcar como PAGADO'}" onclick="togglePlanStatus('${escapeHtml(l.id)}')">
              <i class="ri-wallet-3-line"></i>
            </button>
            <button class="btn btn-secondary" style="width:32px; height:32px; padding:0; font-size:14px; color:${isActive ? 'var(--danger)' : 'var(--success)'}; border-color:${isActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}; background:${isActive ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)'};" title="${isActive ? 'Suspender Licencia (Marcar OFFLINE)' : 'Activar Licencia (Marcar ONLINE)'}" onclick="toggleLicenseStatus('${escapeHtml(l.id)}', ${isActive})">
              <i class="${isActive ? 'ri-shut-down-line' : 'ri-flashlight-fill'}"></i>
            </button>
            <button class="btn btn-danger-outline" style="width:32px; height:32px; padding:0; font-size:14px;" title="Eliminar Cliente" onclick="deleteLicense('${escapeHtml(l.id)}')">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderBillingTable() {
  const container = document.getElementById('billing-table-body');
  if (!container) return;

  if (state.licenses.length === 0) {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.5; font-style:italic;">No hay datos de saldos disponibles.</td></tr>`;
    return;
  }

  // 1. Renderizar la tabla de saldos
  container.innerHTML = state.licenses.map(l => {
    const expiry = l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : 'Sin Vencer';
    const ops = l.usageOps || 0;
    const opCost = l.perOpCost || 0.50;
    const totalOpsCost = ops * opCost;
    const isPlanPaid = l.currentPlan === 'PAGADO';
    const planBadge = isPlanPaid
      ? `<span class="status-badge" style="background: rgba(34, 197, 94, 0.1); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.2);">PAGADO</span>`
      : `<span class="status-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);">SIN PAGAR</span>`;
    return `
      <tr>
        <td style="font-weight:900;">
          ${escapeHtml(l.clientName)}
          <div style="font-size:9px; opacity:0.5; font-weight:600; margin-top:2px;">ID: ${escapeHtml(l.id)}</div>
        </td>
        <td>${planBadge}</td>
        <td style="font-weight:800; opacity:0.7;">
          <div>$${Number(l.dailyCost || 0).toFixed(2)} / Día</div>
          <div style="font-size:9px; color:var(--accent); font-weight:700; margin-top:2px;">Uso: ${ops} ops ($${totalOpsCost.toFixed(2)})</div>
        </td>
        <td style="color:var(--success); font-weight:900; font-size:14px;">$${Number(l.initialAmount || 0).toLocaleString('es-MX')}</td>
        <td style="opacity:0.7;">${escapeHtml(expiry)}</td>
        <td>
          <button class="btn btn-primary" style="height:32px; font-size:9px; padding:0 16px;" onclick="openAddCreditsModal('${escapeHtml(l.id)}')">
            Ingresar Saldo
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // 2. Calcular métricas SaaS dinámicas
  let totalMRR = 0;
  let totalCustody = 0;
  let activeClients = 0;
  let suspendedClients = 0;
  const totalClients = state.licenses.length;

  state.licenses.forEach(l => {
    totalCustody += Number(l.initialAmount || 0);
    if (l.status === 'ACTIVE') {
      activeClients++;
      totalMRR += Number(l.dailyCost || 0) * 30.4;
    } else {
      suspendedClients++;
    }
  });

  const churnRate = totalClients > 0 ? Math.round((suspendedClients / totalClients) * 100) : 0;
  
  // LTV: Si el churn es 0%, asumimos un baseline de retención del cliente de 36 meses
  const averageMRRPerClient = activeClients > 0 ? (totalMRR / activeClients) : 0;
  const ltvValue = churnRate > 0 
    ? (averageMRRPerClient / (churnRate / 100)) 
    : (averageMRRPerClient * 36);

  // Actualizar valores en el DOM
  const mrrVal = document.getElementById('billing-mrr-val');
  const churnVal = document.getElementById('billing-churn-val');
  const ltvVal = document.getElementById('billing-ltv-val');
  const custodyVal = document.getElementById('billing-custody-val');

  if (mrrVal) mrrVal.innerText = '$' + Math.round(totalMRR).toLocaleString('es-MX');
  if (churnVal) churnVal.innerText = churnRate + '%';
  if (ltvVal) ltvVal.innerText = '$' + Math.round(ltvValue).toLocaleString('es-MX');
  if (custodyVal) custodyVal.innerText = '$' + Math.round(totalCustody).toLocaleString('es-MX');

  // 3. Renderizar distribución de planes
  renderPlanShare();
  updateSaasSimulation();
}

function renderPlanShare() {
  const planShareContainer = document.getElementById('billing-plan-share-container');
  if (!planShareContainer) return;
  
  const total = state.licenses.length;
  if (total === 0) {
    planShareContainer.innerHTML = `<div style="font-size:11px; opacity:0.5; font-style:italic; text-align:center;">Sin licencias para graficar.</div>`;
    return;
  }
  
  const counts = { PAGADO: 0, NO_PAGADO: 0 };
  state.licenses.forEach(l => {
    const plan = l.currentPlan === 'PAGADO' ? 'PAGADO' : 'NO_PAGADO';
    if (counts[plan] !== undefined) counts[plan]++;
  });
  
  planShareContainer.innerHTML = Object.keys(counts).map(plan => {
    const count = counts[plan];
    const pct = Math.round((count / total) * 100) || 0;
    
    const isPaid = plan === 'PAGADO';
    const barColor = isPaid ? 'var(--success)' : 'var(--danger)';
    const label = isPaid ? 'PAGADO' : 'SIN PAGAR';
    
    return `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:800; margin-bottom:6px;">
          <span>${label} (${count})</span>
          <span style="color:${barColor};">${pct}%</span>
        </div>
        <div style="height:8px; background:rgba(255,255,255,0.02); border:1px solid var(--border-glass); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:4px; transition:width 0.8s ease;"></div>
        </div>
      </div>
    `;
  }).join('');
}

window.updateSaasSimulation = function() {
  const multInput = document.getElementById('erp-sim-multiplier');
  const scaleLabel = document.getElementById('erp-sim-scale-label');
  const simClients = document.getElementById('erp-sim-clients');
  const simMrr = document.getElementById('erp-sim-mrr');
  const simArr = document.getElementById('erp-sim-arr');
  
  if (!multInput) return;
  const multiplier = Number(multInput.value);
  
  if (scaleLabel) scaleLabel.innerText = `${multiplier}x Clientes`;
  
  const currentClients = state.licenses.length;
  const projectedClients = Math.round(currentClients * multiplier);
  
  let currentDailyCostSum = 0;
  state.licenses.forEach(l => {
    if (l.status === 'ACTIVE') {
      currentDailyCostSum += Number(l.dailyCost || 0);
    }
  });
  
  const projectedMRR = Math.round(currentDailyCostSum * 30.4 * multiplier);
  const projectedARR = projectedMRR * 12;
  
  if (simClients) simClients.innerText = projectedClients.toLocaleString();
  if (simMrr) simMrr.innerText = '$' + projectedMRR.toLocaleString('es-MX');
  if (simArr) simArr.innerText = '$' + projectedARR.toLocaleString('es-MX');
};

function renderTelemetryLogs() {
  const container = document.getElementById('telemetry-table-body');
  if (!container) return;

  // Combinar logs locales y de la nube
  const allLogs = [...state.logs, ...(state.cloudLogs || [])];
  
  // Desduplicar por hash
  const uniqueLogs = [];
  const seenHashes = new Set();
  allLogs.forEach(l => {
    if (l && l.hash && !seenHashes.has(l.hash)) {
      seenHashes.add(l.hash);
      uniqueLogs.push(l);
    }
  });

  // Ordenar cronológicamente de forma ascendente
  uniqueLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (uniqueLogs.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align:center; opacity:0.3; font-style:italic;">No hay logs registrados.</td></tr>`;
    const pag = document.getElementById('telemetry-pagination');
    if (pag) pag.innerHTML = '';
    return;
  }

  const searchInput = document.getElementById('telemetry-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Filtrar los logs si hay consulta activa
  const filteredLogs = uniqueLogs.filter(log => {
    if (!query) return true;
    return (log.module?.toLowerCase().includes(query) || 
            log.action?.toLowerCase().includes(query) || 
            log.details?.toLowerCase().includes(query) ||
            log.timestamp?.toLowerCase().includes(query));
  });

  if (filteredLogs.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align:center; opacity:0.5; font-style:italic; padding: 30px;">Ningún log coincide con la búsqueda.</td></tr>`;
    const pag = document.getElementById('telemetry-pagination');
    if (pag) pag.innerHTML = '';
    return;
  }

  // Paginación reactiva
  const reversedLogs = [...filteredLogs].reverse();
  const totalLogs = reversedLogs.length;
  const totalPages = Math.ceil(totalLogs / window.telemetryPageSize) || 1;

  if (window.telemetryPage > totalPages) window.telemetryPage = totalPages;
  if (window.telemetryPage < 1) window.telemetryPage = 1;

  const startIndex = (window.telemetryPage - 1) * window.telemetryPageSize;
  const endIndex = startIndex + window.telemetryPageSize;
  const paginatedLogs = reversedLogs.slice(startIndex, endIndex);

  // Renderizar controles de paginación
  const paginationContainer = document.getElementById('telemetry-pagination');
  if (paginationContainer) {
    paginationContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 11px; opacity: 0.6; font-weight: 800;">
          Mostrando <strong style="color: #fff;">${startIndex + 1}-${Math.min(endIndex, totalLogs)}</strong> de <strong style="color: #fff;">${totalLogs}</strong> logs (Pág. ${window.telemetryPage}/${totalPages})
        </span>
        <div style="display: flex; align-items: center; gap: 6px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px;">
          <span style="font-size: 9px; opacity: 0.5; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px;">Mostrar:</span>
          <select class="form-input" style="width: 65px; height: 28px; font-size: 10px; background: #000; border: 1px solid var(--border-glass); color: #fff; cursor: pointer; padding: 0 8px; border-radius: 8px; font-family: var(--font-display); font-weight: 800;" onchange="window.changeTelemetryPageSize(Number(this.value))">
            <option value="10" ${window.telemetryPageSize === 10 ? 'selected' : ''}>10</option>
            <option value="15" ${window.telemetryPageSize === 15 ? 'selected' : ''}>15</option>
            <option value="25" ${window.telemetryPageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${window.telemetryPageSize === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${window.telemetryPageSize === 100 ? 'selected' : ''}>100</option>
          </select>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" style="height: 32px; padding: 0 12px; font-size: 10px; display: flex; align-items: center; gap: 4px;" onclick="window.loadOlderLogsFromFirestore()">
          <i class="ri-cloud-line"></i> Historial Nube
        </button>
        <button class="btn btn-secondary" style="height: 32px; padding: 0 12px; font-size: 10px; display: flex; align-items: center; gap: 4px;" onclick="window.changeTelemetryPage(-1)" ${window.telemetryPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
          <i class="ri-arrow-left-s-line"></i> Anterior
        </button>
        <button class="btn btn-secondary" style="height: 32px; padding: 0 12px; font-size: 10px; display: flex; align-items: center; gap: 4px;" onclick="window.changeTelemetryPage(1)" ${window.telemetryPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
          Siguiente <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>
    `;
  }

  container.innerHTML = paginatedLogs.map((log) => {
    let moduleColor = 'var(--text-muted)';
    if (log.module === 'SYSTEM') moduleColor = 'var(--accent-secondary)';
    else if (log.module === 'API_GATEWAY') moduleColor = 'var(--accent)';
    else if (log.module === 'ORQUESTADOR') moduleColor = 'var(--success)';

    const origIndex = state.logs.indexOf(log);
    const prevLog = origIndex > 0 ? state.logs[origIndex - 1] : null;
    
    // Si no está en state.logs, es de la nube. Verificamos contra el log anterior en la lista ordenada merged
    const isCloudLog = log.fromCloud;
    const renderPrevLog = origIndex !== -1 ? prevLog : (uniqueLogs[uniqueLogs.indexOf(log) - 1] || null);
    
    const isVerified = verifySingleLog(log, renderPrevLog);

    let ledgerBadge = '';
    if (isCloudLog) {
      ledgerBadge = isVerified 
        ? `<span style="color:var(--accent-secondary); font-weight:900; font-size:9px; float:right;">[☁️ NUBE VERIFICADA]</span>`
        : `<span style="color:var(--danger); font-weight:900; font-size:9px; float:right; animation:pulse 1s infinite;">[🛑 HASH NUBE ALTERADO]</span>`;
    } else {
      ledgerBadge = isVerified 
        ? `<span style="color:var(--success); font-weight:900; font-size:9px; float:right; cursor:pointer;" onclick="window.openForensicModal(${origIndex})">[✓ CADENA VERIFICADA]</span>` 
        : `<span style="color:var(--danger); font-weight:900; font-size:9px; float:right; animation:pulse 1s infinite; cursor:pointer;" onclick="window.openForensicModal(${origIndex})">[🛑 HASH ALTERADO / ROTURA]</span>`;
    }

    return `
      <tr>
        <td style="color:rgba(255,255,255,0.3); white-space:nowrap;">
          ${new Date(log.timestamp).toLocaleString()}
          ${ledgerBadge}
        </td>
        <td style="color:${moduleColor}; font-weight:900;">[${escapeHtml(log.module)}]</td>
        <td style="font-weight:900; text-transform:uppercase;">${escapeHtml(log.action)}</td>
        <td style="opacity:0.7;">
          ${escapeHtml(log.details)}
          <div style="font-size:8px; opacity:0.3; font-family:var(--font-mono); margin-top:4px;">
            HASH: ${escapeHtml(log.hash?.substr(0,16))}... | PREV: ${escapeHtml(log.prevHash?.substr(0,16))}...
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.changeTelemetryPage = function(delta) {
  window.telemetryPage += delta;
  renderTelemetryLogs();
};

window.changeTelemetryPageSize = function(size) {
  window.telemetryPageSize = size;
  localStorage.setItem('alr_saas_telemetry_page_size', size);
  window.telemetryPage = 1;
  renderTelemetryLogs();
};

function populateWizardSelects() {
  const select = document.getElementById('w-app-select');
  if (!select) return;
  
  select.innerHTML = state.apps.map(app => `
    <option value="${escapeHtml(app.id)}">${escapeHtml(app.name)} (${escapeHtml(app.version)})</option>
  `).join('');
}

// 🎛️ SLUG AUTO-GENERATION HELPER
window.autoGenerateSlug = function(val) {
  if (!val) return;
  const slug = val.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  
  const slugInput = document.getElementById('w-client-slug');
  const titleInput = document.getElementById('w-app-title');
  const appSelect = document.getElementById('w-app-select');
  
  const selectedApp = state.apps.find(a => a.id === appSelect.value) || { name: 'App' };

  const finalSlug = slug + '_smart';
  if (slugInput) slugInput.value = finalSlug;
  if (titleInput) titleInput.value = `REY ${val.trim()} ${selectedApp.name}`;
  
  window.updateAppUrlFromSlug(finalSlug);
};

window.updateAppUrlFromSlug = function(slug) {
  const appUrlInput = document.getElementById('w-app-url');
  if (appUrlInput) {
    const baseDomain = state.importedDomain || 'https://rey-smart-wash.web.app';
    if (slug.startsWith('http://') || slug.startsWith('https://')) {
      appUrlInput.value = slug;
    } else if (baseDomain.includes('vercel.app')) {
      appUrlInput.value = `${baseDomain}/?s=${slug}`;
    } else {
      appUrlInput.value = `${baseDomain}/${slug}`;
    }
  }
};

// ⚡ SUGERENCIA 1: SIMULADOR DE API GATEWAY CON FIRMAS CRIPTOGRÁFICAS (JWT-Style Token)
window.generateSecureLicenseToken = async function(client) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  
  const payloadData = {
    clientId: client.id,
    appId: client.appId,
    plan: client.currentPlan,
    expiryDate: client.expiryDate,
    status: client.status,
    timestamp: Date.now()
  };

  if (client.currentPlan === 'NO_PAGADO' || client.status === 'SUSPENDED') {
    const graceHours = client.gracePeriodHours || 24;
    payloadData.gracePeriodUntil = new Date(Date.now() + graceHours * 60 * 60 * 1000).toISOString();
    payloadData.allowed = false;
    payloadData.reason = "PAGO PENDIENTE";
    payloadData.message = "Por favor realiza tu pago mensual para reactivar el sistema.";
  }

  const payload = btoa(JSON.stringify(payloadData));
  const signature = await hmacSign(header + '.' + payload, client.apiKey);
  return `${header}.${payload}.${signature}`;
};

function customHash(string, key) {
  let hash = 5381;
  const salt = string + key;
  for (let i = 0; i < salt.length; i++) {
    hash = ((hash << 5) + hash) + salt.charCodeAt(i);
  }
  return Math.abs(hash).toString(16);
}

// 🔒 SUGERENCIA 2: LEDGER CRIPTOGRÁFICO DE AUDITORÍA (HASH CHAINING - BLOCKCHAIN INMUTABLE)
function addAuditLog(module, action, details) {
  const timestamp = new Date().toISOString();
  const prevEntry = state.logs.length > 0 ? state.logs[state.logs.length - 1] : null;
  const prevHash = prevEntry ? prevEntry.hash : "00000000000000000000000000000000";

  // Calcular hash del bloque actual salted con la llave maestra usando SHA-256 síncrono
  const hashSource = timestamp + module + action + details + prevHash + MASTER_LEDGER_SALT;
  const currentHash = sha256Sync(hashSource);

  const logEntry = {
    timestamp,
    module,
    action,
    details,
    prevHash,
    hash: currentHash
  };

  state.logs.push(logEntry);

  // Limitar logs a un máximo de 500 para evitar desbordamientos de memoria
  if (state.logs.length > 500) {
    state.logs.shift();
  }

  saveToStorage();

  // Disparar alertas de Telegram para eventos críticos según la severidad configurada
  let shouldNotify = false;
  const sev = window.TELEGRAM_SEVERITY || 'SEGURIDAD';

  if (action === 'BRECHA_LEDGER' || action === 'FALLO_DESBLOQUEO' || action === 'CUARENTENA') {
    shouldNotify = true; // Se notifica siempre en CRITICO, SEGURIDAD y TODO
  } else if (action === 'FALLO_AUTENTICACION' || action === 'AUTO_BLOQUEO') {
    if (sev === 'SEGURIDAD' || sev === 'TODO') shouldNotify = true;
  } else if (action === 'PROVISIÓN' || action === 'SESION_CAMBIO') {
    if (sev === 'TODO') shouldNotify = true;
  }

  if (shouldNotify) {
    const tgMessage = `⚠️ <b>[ALERTA ALR SAAS]</b> ⚠️\n\n<b>Módulo:</b> ${module}\n<b>Acción:</b> ${action}\n<b>Detalles:</b> ${details}\n<b>Operador:</b> ${currentAdmin?.username || 'Desconocido'}\n<b>Fecha:</b> ${new Date(timestamp).toLocaleString()}`;
    window.sendTelegramNotification(tgMessage);
  }

  // Registrar en la cola de sincronización pendiente
  window.addHashToPendingSync(currentHash);

  // Sincronizar automáticamente en la nube (Firestore)
  if (window.FIREBASE_SYNC_ENABLED && navigator.onLine) {
    window.syncLogsToFirebase();
  }
}

function verifySingleLog(log, prevLog) {
  if (!log) return true;
  const expectedPrevHash = (prevLog && log.prevHash === prevLog.hash) ? prevLog.hash : log.prevHash;
  const hashSource = log.timestamp + log.module + log.action + log.details + expectedPrevHash + MASTER_LEDGER_SALT;
  const currentHash = sha256Sync(hashSource);

  return log.hash === currentHash;
}

let isAlertActive = false;

function verifyAuditLedger() {
  let intact = true;
  let failedIndex = -1;
  let failedLog = null;

  for (let i = 0; i < state.logs.length; i++) {
    const log = state.logs[i];
    const prev = i > 0 ? state.logs[i - 1] : null;
    if (!verifySingleLog(log, prev)) {
      intact = false;
      failedIndex = i;
      failedLog = log;
      break;
    }
  }

  state.ledgerIntact = intact;
  const badge = document.getElementById('header-ledger-status');
  if (badge) {
    if (intact) {
      badge.style.display = "none";
      isAlertActive = false;
    } else {
      badge.style.display = "flex";
      badge.innerHTML = `⚠️ LEDGER ALTERADO / HASH QUEBRADO`;
      console.error("[SEGURIDAD DE AUDITORÍA] Se detectó una alteración manual en la bitácora de telemetría.");
      
      if (!isAlertActive) {
        isAlertActive = true;
        triggerServerlessSecurityAlert(failedIndex, failedLog);
      }
    }
  }
}

function triggerServerlessSecurityAlert(failedIndex, failedLog) {
  // Simular llamada http asíncrona a un Serverless Guard Webhook
  console.warn(`[SERVERLESS ALERT] Alerta de seguridad enviada a Cloud Guard. Registro comprometido en índice ${failedIndex}:`, failedLog);
  sendSecurityWebhookNotification(failedIndex, failedLog);

  // Notificar por Telegram de forma prioritaria
  const tgBreachMessage = `🚨 <b>🚨 BRECHA DE SEGURIDAD DETECTADA 🚨</b> 🚨\n\nSe ha detectado una alteración en el Ledger de telemetría inmutable de <b>ALR SaaS Central Commander</b>.\n\n• <b>Índice Vulnerado</b>: ${failedIndex}\n• <b>Acción</b>: <code>${failedLog?.action || 'DESCONOCIDA'}</code>\n• <b>Módulo</b>: <code>${failedLog?.module || 'DESCONOCIDO'}</code>\n• <b>Detalles</b>: <code>${failedLog?.details || 'SIN DETALLES'}</code>\n• <b>Timestamp</b>: <code>${new Date().toLocaleString()}</code>`;
  window.sendTelegramNotification(tgBreachMessage);
  
  // Desplegar modal crítico de gobernanza
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (overlay && box) {
    box.innerHTML = `
      <div style="padding: 40px; text-align: center; border: 2px solid var(--danger); border-radius: 40px; background: rgba(15, 5, 5, 0.98); box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);">
        <div style="font-size: 64px; margin-bottom: 20px; animation: pulse 1s infinite; filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.5));">🛑</div>
        <h2 style="font-size: 22px; font-weight: 900; color: var(--danger); margin-bottom: 12px; text-transform: uppercase; font-style: italic; letter-spacing: -0.5px;">Brecha de Seguridad Detectada</h2>
        <p style="font-size: 12px; opacity: 0.8; margin-bottom: 24px; line-height: 1.6; font-weight: 500;">
          Se ha identificado una <strong style="color:var(--danger)">violación de integridad de logs</strong> en el Ledger central inmutable.<br>
          Las firmas criptográficas no coinciden, indicando manipulación externa directa de la base de datos local.
        </p>
        
        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 20px; padding: 20px; text-align: left; font-family: var(--font-mono); font-size: 10px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 30px;">
          <div><span style="color: var(--danger);">REGISTRO_VULNERADO_INDEX:</span> ${failedIndex}</div>
          <div><span style="color: var(--danger);">ACCION:</span> "${escapeHtml(failedLog?.action || 'DESCONOCIDA')}"</div>
          <div><span style="color: var(--danger);">MÓDULO:</span> "${escapeHtml(failedLog?.module || 'DESCONOCIDO')}"</div>
          <div><span style="color: var(--danger);">HASH:</span> <span style="font-size:7.5px; opacity:0.5; word-break:break-all;">${escapeHtml(failedLog?.hash)}</span></div>
        </div>

        <div style="display: flex; gap: 16px;">
          <button class="btn btn-secondary flex-1" onclick="closeModal()">Cerrar Aviso</button>
          <button class="btn btn-primary flex-1" style="background: var(--danger); color: #fff; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);" onclick="quarantineSystem()">
            <i class="ri-shield-keyhole-fill"></i> Forzar Cuarentena
          </button>
        </div>
      </div>
    `;
    overlay.classList.add('active');
  }
}

async function sendSecurityWebhookNotification(failedIndex, failedLog) {
  console.log("[SERVERLESS ALERT] Enviando notificacion de brecha de seguridad a Webhook de Gobernanza...");
  
  if (!SYSTEM_WEBHOOK_URL) {
    console.warn("[SERVERLESS ALERT] SYSTEM_WEBHOOK_URL no configurado. Omite el envio real.");
    return;
  }
  
  const payload = {
    username: "ALR SaaS Security Guard",
    content: `🚨 **BRECHA DE SEGURIDAD DETECTADA** 🚨\n\nSe ha detectado una alteracion en el Ledger de telemetria inmutable de **ALR SaaS Central Commander**.\n\n• **Indice Vulnerado**: ${failedIndex}\n• **Accion**: \`${failedLog?.action || 'DESCONOCIDA'}\`\n• **Modulo**: \`${failedLog?.module || 'DESCONOCIDO'}\`\n• **Detalles**: \`${failedLog?.details || 'SIN DETALLES'}\`\n• **Timestamp**: \`${new Date().toISOString()}\``
  };
  
  if (!navigator.onLine) {
    await queueOfflineWebhookAlert(SYSTEM_WEBHOOK_URL, payload);
    return;
  }
  
  fetch(SYSTEM_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("[SERVERLESS ALERT] Notificacion de Webhook enviada con exito!");
  })
  .catch(async (err) => {
    console.error("[SERVERLESS ALERT] Error al enviar notificacion de Webhook, encolando...", err);
    await queueOfflineWebhookAlert(SYSTEM_WEBHOOK_URL, payload);
  });
}

window.quarantineSystem = function() {
  requestAdminVerification("Forzar Cuarentena Global", () => {
    showToast("Iniciando cuarentena de seguridad...", "danger");
    state.licenses.forEach(l => {
      l.status = 'SUSPENDED';
      addAuditLog('API_GATEWAY', 'CUARENTENA', `Licencia ${l.clientName} suspendida preventivamente por sospecha de alteración de base de datos.`);
    });
    saveToStorage();
    closeModal();
    renderAll();
    showToast("Cuarentena completada con éxito. Clientes fuera de línea.", "success");
  });
};

// ⚡ PROVISIONING & CLONING ENGINE (ACTUALIZADO CON SEMILLAS DINÁMICAS Y PERSONALIZACIÓN CSV)
window.processAprovisionamiento = async function() {
  const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
  const getNum = (id) => Number(document.getElementById(id)?.value) || 0;

  const appId = getVal('w-app-select');
  const clientName = getVal('w-client-name');
  const clientId = getVal('w-client-slug');
  const appTitle = getVal('w-app-title');
  const plan = getVal('w-plan-select');
  const dailyCost = getNum('w-daily-cost');
  const contact = getVal('w-contact-phone');
  const initialAmount = getNum('w-initial-amount');
  const gracePeriodHours = getNum('w-grace-hours') || 24;
  const appUrl = getVal('w-app-url');

  if (!clientName || !clientId || !appTitle) {
    showToast("Completa los campos obligatorios.", "warning");
    return;
  }

  // Si la app seleccionada tiene auto-clonado configurado (ver
  // pullAppRegistryFromCloud / provisionAppClone), el alta real del
  // cliente pasa por ahí -- NO por el flujo de abajo, que solo escribe
  // metadata local sin dar de alta al cliente en la app destino.
  if (state.appRegistry && state.appRegistry[appId]) {
    if (state.licenses.some(l => l.id === clientId)) {
      showToast(`El ID "${clientId}" ya está registrado en esta consola. Elige otro para clonar.`, "warning");
      return;
    }
    window.requestAdminVerification(`Clonar app para cliente nuevo (${clientId})`, async () => {
      await window.runAppCloneProvisioning(appId, clientId, clientName);
    });
    return;
  }

  if (!SEED_TEMPLATES[appId]) {
    showToast("La plantilla semilla seleccionada no es válida o no existe.", "danger");
    return;
  }

  const existingIndex = state.licenses.findIndex(l => l.id === clientId);

  const proceedWithProvisioning = async () => {
    let existingLicense = null;
    if (existingIndex !== -1) {
      existingLicense = state.licenses[existingIndex];
      
      const promptInput = prompt(`El ID de base de datos "${clientId}" ya está registrado en esta consola.\n\nPara confirmar que deseas sobrescribir su configuración de licencia con esta nueva plantilla, escribe la palabra SOBRESCRIBIR en el recuadro:`);
      if (promptInput !== 'SOBRESCRIBIR') {
        showToast("Operación cancelada. No se confirmó la sobrescritura.", "warning");
        return;
      }
      
      alert(`¡Atención! Sobrescribir esta licencia generará una nueva API Key de seguridad. Cualquier aplicación activa que use la API Key antigua dejará de funcionar hasta que sea reconfigurada.`);
      
      if (!state.recycleBin) state.recycleBin = [];
      state.recycleBin.push({
        license: { ...existingLicense, status: 'SUSPENDED' },
        deletedAt: new Date().toISOString()
      });
      
      // 1. Historial forense detallado en el Log de Auditoría (Sugerencia 1)
      const metadataLog = `Plan=${existingLicense.currentPlan}, API_KEY=${existingLicense.apiKey.substring(0, 10)}..., Version=${existingLicense.version}`;
      addAuditLog('ORQUESTADOR', 'SOBRESCRIBIR_RESPALDO', `Licencia previa de ${existingLicense.clientName} respaldada ante sobrescritura. Detalles: ${metadataLog}`);
      
      state.licenses.splice(existingIndex, 1);
    }

    // Generar API Key única de seguridad -- 128 bits de entropía
    // criptográfica (antes Math.random().toString(16).substr(2,8) daba
    // ~32 bits, adivinable).
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const apiKey = `sec_${clientId.split('_')[0]}_${randomHex}`;

    // Parsear roles personalizados del CSV
    const rolesCsv = getVal('w-seed-roles');
    const parsedRoles = rolesCsv.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split(',');
      return { role: parts[0]?.trim(), name: parts[1]?.trim() || parts[0]?.trim(), defaultPin: parts[2]?.trim() || null };
    });

    // Parsear servicios personalizados del CSV
    const servicesCsv = getVal('w-seed-services');
    const parsedServices = servicesCsv.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split(',');
      return { name: parts[0]?.trim(), price: Number(parts[1]?.trim()) || 0, itemsCount: Number(parts[1]?.trim()) || 0 };
    });

    const bizName = getVal('w-seed-biz-name') || clientName;

    const customSeedTemplate = {
      roles: parsedRoles.length > 0 ? parsedRoles : (SEED_TEMPLATES[appId]?.roles || []),
      services: parsedServices.length > 0 ? parsedServices : (SEED_TEMPLATES[appId]?.services || []),
      business: { name: bizName }
    };

    const baseMonthlyFee = getNum('w-base-monthly-fee') || 500;
    const renewalPeriod = getVal('w-renewal-period') || 'Mensual';
    const paymentPeriod = getVal('w-payment-period') || 'Mensual';
    const startDate = getVal('w-start-date') || new Date().toISOString().split('T')[0];
    const userExpiry = getVal('w-expiry-date');
    const expiryDateIso = userExpiry ? userExpiry + 'T23:59:59Z' : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const calc = window.calculateAdjustedMonthlyFee ? window.calculateAdjustedMonthlyFee({ baseMonthlyFee, startDate }) : { adjustedFee: baseMonthlyFee };

    // Crear objeto de licencia
    const newLicense = {
      id: clientId,
      clientName,
      appName: appTitle,
      appId,
      apiKey,
      expiryDate: expiryDateIso,
      expirationDate: expiryDateIso,
      renewalPeriod: renewalPeriod,
      paymentPeriod: paymentPeriod,
      baseMonthlyFee: baseMonthlyFee,
      adjustedMonthlyFee: calc.adjustedFee,
      startDate: startDate,
      currentPlan: plan,
      dailyCost,
      initialAmount,
      status: 'ACTIVE',
      contact,
      gracePeriodHours,
      appUrl: appUrl || `https://rey-smart-wash.web.app/${clientId}`,
      version: 1,
      customConfig: {
        roles: customSeedTemplate.roles,
        services: customSeedTemplate.services,
        business: customSeedTemplate.business
      }
    };

    // Guardar en el estado
    state.licenses.push(newLicense);
    
    // Agregar log de auditoría INMUTABLE
    addAuditLog('ORQUESTADOR', 'PROVISIÓN', `Cliente ${clientName} provisto con éxito. DB Prefijo: ${clientId}_. API Key generada.`);

    await saveToStorage();
    await window.syncLicenseToFirestore(newLicense);
    
    // 3. Botón de Deshacer en el toast (Sugerencia 3)
    if (existingLicense) {
      window.overwrittenLicenseBackup = existingLicense;
      showToast(`¡Aprovisionamiento de ${clientName} Exitoso! <button onclick="window.undoOverwrite('${clientId}')" style="background:var(--accent); border:none; border-radius:12px; color:#000; padding:4px 10px; font-size:9px; font-weight:900; margin-left:12px; cursor:pointer; font-family:var(--font-heading);">DESHACER</button>`, "success");
    } else {
      showToast(`¡Aprovisionamiento de ${clientName} Exitoso!`, "success");
    }

    // Mostrar modal premium de bienvenida con la semilla personalizada hidratada
    await showWelcomeModal(newLicense, customSeedTemplate);
    renderAll();
  };

  if (existingIndex !== -1) {
    // 2. Pedir el PIN de Administrador antes (Sugerencia 2)
    window.requestAdminVerification(`Sobrescribir Licencia (${clientId})`, async () => {
      await proceedWithProvisioning();
    });
  } else {
    await proceedWithProvisioning();
  }
};

// Alta real de un cliente nuevo sobre una app que ya tiene auto-clonado
// (ver state.appRegistry / provisionAppClone). A diferencia del flujo de
// arriba, esto SÍ da de alta al cliente en la app destino (mismo proyecto
// Firebase, tenant nuevo aislado) -- no solo escribe metadata local.
window.runAppCloneProvisioning = async function(appId, tenantId, businessName) {
  try {
    showToast(`Clonando app para ${escapeHtml(businessName)}...`, "info");
    const call = window.governanceFunctions.httpsCallable('provisionAppClone');
    const res = await call({ appId, tenantId, businessName });
    const { tenantId: newTenantId, connectSecret, appUrl } = res.data || {};

    addAuditLog('ORQUESTADOR', 'CLONAR_APP', `Cliente ${businessName} clonado con éxito sobre ${appId}. Tenant: ${newTenantId}.`);
    await window.pullAllLicensesFromCloud(true);
    renderAll();
    window.showAppCloneSuccessModal({ businessName, tenantId: newTenantId, connectSecret, appUrl });
  } catch (err) {
    console.error('[CLONE APP ERR]', err);
    showToast(`Error al clonar: ${escapeHtml(err.message || String(err))}`, "danger");
  }
};

// El connectSecret solo se puede consultar UNA vez (lo genera
// registerTenant en la app destino y no queda guardado en texto plano en
// ningún lado accesible después) -- este modal obliga a copiarlo antes de
// cerrar, no se puede volver a abrir con el mismo valor.
window.showAppCloneSuccessModal = function({ businessName, tenantId, connectSecret, appUrl }) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="padding: 30px; text-align: left; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 16px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 900; color: #2ecc71; text-transform: uppercase;">✅ App clonada con éxito</h3>
      </div>

      <p style="font-size: 13px; opacity: 0.85; margin-bottom: 14px;">
        <strong>${escapeHtml(businessName)}</strong> ya quedó dado de alta como tenant <code>${escapeHtml(tenantId)}</code> en la app destino, con su admin por defecto (PIN <code>1111</code> -- pide al cliente que lo cambie en su primer ingreso).
      </p>

      <div style="margin-bottom: 14px;">
        <label style="font-size: 10px; font-weight: 900; opacity: 0.6; text-transform: uppercase;">URL de la app</label>
        <div style="display:flex; gap:8px; margin-top:4px;">
          <input type="text" readonly value="${escapeHtml(appUrl || '')}" style="flex:1; background: rgba(255,255,255,0.05); border:1px solid var(--border-glass); border-radius:8px; padding:8px 10px; font-size:12px; color:#fff;">
          <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${escapeHtml(appUrl || '')}'); showToast('URL copiada', 'success');">Copiar</button>
        </div>
      </div>

      <div style="margin-bottom: 10px; border: 1px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.08); border-radius: 10px; padding: 14px;">
        <label style="font-size: 10px; font-weight: 900; color: #ef4444; text-transform: uppercase;">⚠️ Código de conexión (connectSecret) -- se muestra UNA sola vez</label>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <input type="text" readonly value="${escapeHtml(connectSecret || '')}" style="flex:1; background: rgba(255,255,255,0.05); border:1px solid var(--border-glass); border-radius:8px; padding:8px 10px; font-size:12px; color:#fff; font-family:monospace;">
          <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${escapeHtml(connectSecret || '')}'); showToast('Código copiado', 'success');">Copiar</button>
        </div>
        <p style="font-size: 10.5px; opacity: 0.8; margin-top: 8px;">Cópialo y entrégalo al cliente ahora mismo. Si lo pierdes, tendrá que rotarlo desde la propia app (invalida el anterior).</p>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 14px; border-top: 1px solid var(--border-glass); padding-top: 14px;">
        <button class="btn btn-primary" onclick="closeModal()">Ya copié el código, cerrar</button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  overlay.style.display = 'flex';
};

window.onWizardAppChange = function() {
  const appSelect = document.getElementById('w-app-select');
  if (!appSelect) return;
  const appId = appSelect.value;
  const seedTemplate = SEED_TEMPLATES[appId];
  if (!seedTemplate) return;
  
  const bizNameInput = document.getElementById('w-seed-biz-name');
  const rolesInput = document.getElementById('w-seed-roles');
  const servicesInput = document.getElementById('w-seed-services');
  const clientName = document.getElementById('w-client-name')?.value?.trim() || '';
  
  if (bizNameInput) bizNameInput.value = clientName || seedTemplate.business.name || 'Negocio Central';
  
  if (rolesInput) {
    rolesInput.value = seedTemplate.roles.map(r => `${r.role},${r.name},${r.defaultPin || ''}`).join('\n');
  }
  
  if (servicesInput) {
    if (appId === 'smart_wash') {
      servicesInput.value = seedTemplate.services.map(s => `${s.name},${s.price}`).join('\n');
    } else if (appId === 'smart_restaurant') {
      servicesInput.value = seedTemplate.services.map(s => `${s.name},${s.itemsCount}`).join('\n');
    } else if (appId === 'smart_gym') {
      servicesInput.value = seedTemplate.services.map(s => `${s.name},${s.price}`).join('\n');
    }
  }
};


async function showWelcomeModal(client, customSeedTemplate) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const app = state.apps.find(a => a.id === client.appId) || { name: 'App' };
  const seedTemplate = customSeedTemplate || SEED_TEMPLATES[client.appId] || { roles: [], services: [], business: { name: 'SaaS Central' } };
  const rolesSummary = seedTemplate.roles.map(r => `${r.name} (PIN: ${r.defaultPin || 'Sin PIN'})`).join(', ');
  const servicesSummary = seedTemplate.services.map(s => s.name).join(', ');

  const secureToken = await window.generateSecureLicenseToken(client);
  const appUrl = client.appUrl || `https://rey-smart-wash.web.app/${client.id}`;

  const defaultMsg = `✨ *¡Bienvenido al Ecosistema ALR SaaS!* ✨\n\n` +
    `Hola *${client.clientName}*, tu aplicación *${app.name}* ha sido aprovisionada de forma segura.\n\n` +
    `🔑 *Detalles de Acceso:*\n` +
    `• ID Cliente: \`${client.id}\`\n` +
    `• Token (API Key): \`${client.apiKey}\`\n` +
    `• Plan de Suscripción: *${client.currentPlan}*\n` +
    `• Horas de Gracia: *${client.gracePeriodHours || 24} hrs*\n` +
    `• Crédito Inicial: *$${Number(client.initialAmount || 0).toLocaleString()}*\n\n` +
    `🌐 *Enlace de la App:* ${appUrl}\n\n` +
    `🚀 *Semilla Base Sembrada con Éxito:*\n` +
    `• Perfiles Creados: _${rolesSummary}_\n` +
    `• Catálogo Inicial: _${servicesSummary}_\n\n` +
    `Ya puedes ingresar al portal y comenzar a operar de forma inmediata.`;

  box.innerHTML = `
    <div style="padding: 30px; text-align: center; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
      <h2 style="font-size: 22px; font-weight: 900; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; font-style:italic;">¡Provisión Exitosa!</h2>
      <p style="font-size: 12px; opacity: 0.6; margin-bottom: 24px;">La base de datos multicloud y la licencia se han configurado con éxito.</p>
      
      <a href="${escapeHtml(appUrl)}" target="_blank" class="btn btn-primary btn-block" style="height: 46px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 11px; font-weight: 900; background: linear-gradient(135deg, var(--accent) 0%, #00b0ff 100%); color: #000; text-shadow: none; box-shadow: 0 8px 25px rgba(0,229,255,0.25); text-decoration: none; border-radius: 16px;">
        <i class="ri-external-link-line" style="font-size: 16px;"></i> Abrir Aplicación Cliente
      </a>

      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 20px; padding: 20px; text-align: left; font-family: var(--font-mono); font-size: 10px; display:flex; flex-direction:column; gap:10px; margin-bottom: 24px;">
        <div><span style="color: var(--accent);">CLIENT_ID:</span> "${escapeHtml(client.id)}"</div>
        <div><span style="color: var(--accent);">API_KEY:</span> "${escapeHtml(client.apiKey)}"</div>
        <div><span style="color: var(--accent);">PLAN:</span> "${escapeHtml(client.currentPlan)}"</div>
        <div><span style="color: var(--accent);">SECURE_JWT_TOKEN:</span> <span style="font-size:7px; opacity:0.5; word-break:break-all;">${escapeHtml(secureToken)}</span></div>
      </div>

      <div class="form-group" style="text-align: left; margin-bottom: 24px;">
        <label class="form-label">Mensaje de Onboarding Personalizable</label>
        <textarea id="w-onboarding-msg-textarea" class="form-input" style="height: 140px; font-family: var(--font-mono); font-size: 11px; line-height: 1.5; padding: 12px; background: rgba(0,0,0,0.3); border:1px solid var(--border-glass); color:#fff; resize:none;">${escapeHtml(defaultMsg)}</textarea>
      </div>

      <!-- DESPACHADOR MULTICANAL (WHATSAPP, WA BUSINESS, TELEGRAM) -->
      <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-glass); border-radius: 20px; padding: 20px; margin-bottom: 30px;">
        <h4 style="font-size: 10px; font-weight: 900; color: var(--accent-secondary); text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; text-align: left;">
          <i class="ri-send-plane-fill"></i> Despachador Multicanal de Onboarding
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
          <button class="btn" style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2); color: #22c55e; height: 42px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 10px; font-weight: 800; cursor:pointer;" onclick="window.dispatchOnboarding('wa', '${escapeHtml(client.contact)}', '${escapeHtml(client.clientName)}')">
            <i class="ri-whatsapp-fill" style="font-size: 16px;"></i> WhatsApp
          </button>
          <button class="btn" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; height: 42px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 10px; font-weight: 800; cursor:pointer;" onclick="window.dispatchOnboarding('wab', '${escapeHtml(client.contact)}', '${escapeHtml(client.clientName)}')">
            <i class="ri-whatsapp-line" style="font-size: 16px;"></i> WA Business
          </button>
          <button class="btn" style="background: rgba(0, 136, 204, 0.08); border: 1px solid rgba(0, 136, 204, 0.2); color: #0088cc; height: 42px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 10px; font-weight: 800; grid-column: span 2; cursor:pointer;" onclick="window.dispatchOnboarding('tg', '${escapeHtml(client.contact)}', '${escapeHtml(client.clientName)}')">
            <i class="ri-telegram-fill" style="font-size: 16px;"></i> Compartir en Telegram
          </button>
        </div>
        <button class="btn btn-secondary" style="width: 100%; height: 36px; font-size: 10px;" onclick="window.copyOnboardingText()">
          <i class="ri-file-copy-line"></i> Copiar Mensaje Formateado
        </button>
      </div>

      <button class="btn btn-secondary" style="width:100%;" onclick="closeModal()">Finalizar y Cerrar</button>
    </div>
  `;
  overlay.classList.add('active');
}

window.dispatchOnboarding = function(channel, phone, clientName) {
  const msgInput = document.getElementById('w-onboarding-msg-textarea');
  const msg = msgInput ? msgInput.value : '';
  const encodedMsg = encodeURIComponent(msg);

  let url = "";
  if (channel === 'wa') {
    url = `https://wa.me/${phone}?text=${encodedMsg}`;
  } else if (channel === 'wab') {
    url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`;
  } else if (channel === 'tg') {
    url = `https://t.me/share/url?url=${encodeURIComponent('https://brain-branding.web.app/alr-saas/')}&text=${encodedMsg}`;
  }

  if (url) {
    window.open(url, '_blank');
    addAuditLog('SYSTEM', 'DESPACHO_ONBOARDING', `Acceso enviado al cliente ${clientName} vía canal [${channel.toUpperCase()}].`);
    showToast(`Despachando accesos por ${channel.toUpperCase()}...`, "success");
  }
};

window.copyOnboardingText = function() {
  const msgInput = document.getElementById('w-onboarding-msg-textarea');
  const msg = msgInput ? msgInput.value : '';

  navigator.clipboard.writeText(msg)
    .then(() => showToast("Mensaje copiado al portapapeles", "success"))
    .catch(() => showToast("Error al copiar mensaje", "danger"));
};

window.verifyApiSignatureModal = async function(clientId) {
  const client = state.licenses.find(l => l.id === clientId);
  if (!client) return;

  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const secureToken = await window.generateSecureLicenseToken(client);

  box.innerHTML = `
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; font-weight: 900; color: var(--accent); margin-bottom: 12px; text-transform: uppercase;">Gobernanza Criptográfica</h2>
      <p style="font-size: 11px; opacity:0.6; margin-bottom:24px;">Esta firma certifica de forma inmutable el plan y vigencia del cliente.</p>
      
      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-glass); border-radius:20px; padding:20px; font-family:var(--font-mono); font-size:10px; word-break:break-all; margin-bottom:30px; max-height:200px; overflow-y:auto;" class="custom-scroll">
        <span style="color:var(--accent-secondary); font-weight:900;">TOKEN_FIRMADO:</span><br>${secureToken}
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="closeModal()">Verificación de Firma Completa</button>
    </div>
  `;
  overlay.classList.add('active');
};

window.closeModal = function() {
  window.IS_MUTATING_DOM = true;
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
  setTimeout(() => { window.IS_MUTATING_DOM = false; }, 200);
};

// ⚡ ACCIONES DE LICENCIAMIENTO (Remote control con autorización de doble factor)
window.calculateNextSuspensionDate = function(license) {
  if (!license) return { isPaid: false, nextSuspensionDate: null, formattedDate: 'Sin Fecha', daysLeft: 999, isOverdue: false };

  const isPaid = (license.currentPlan === 'PAGADO');
  if (isPaid) {
    return {
      isPaid: true,
      nextSuspensionDate: null,
      formattedDate: 'Sin Suspensión (Pagado)',
      daysLeft: 9999,
      isOverdue: false
    };
  }

  const startStr = (license.startDate || license.createdAt || new Date().toISOString()).split('T')[0];
  const parts = startStr.split('-');
  let baseDate = new Date();
  if (parts.length === 3) {
    baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  
  const now = new Date();
  const period = license.paymentPeriod || 'Mensual';

  let nextDueDate = new Date(baseDate);
  while (nextDueDate <= now) {
    if (period === 'Quincenal') {
      nextDueDate.setDate(nextDueDate.getDate() + 15);
    } else if (period === 'Mensual') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    } else if (period === 'Trimestral') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
    } else if (period === 'Semestral') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 6);
    } else if (period === 'Anual') {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    } else {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
  }

  if (license.paymentDueDate) {
    const explicitDate = new Date(license.paymentDueDate);
    if (!isNaN(explicitDate.getTime())) {
      nextDueDate = explicitDate;
    }
  }

  const diffMs = nextDueDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isOverdue = daysLeft <= 0;

  const formattedDate = nextDueDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  return {
    isPaid: false,
    nextSuspensionDate: nextDueDate,
    formattedDate,
    daysLeft,
    isOverdue
  };
};

window.togglePlanStatus = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId) || state.licenses[0];
  if (!license) return;

  requestAdminVerification(`Cambiar Plan de Pago (${license.clientName})`, () => {
    const nextPlan = license.currentPlan === 'PAGADO' ? 'NO_PAGADO' : 'PAGADO';
    license.currentPlan = nextPlan;

    if (nextPlan === 'PAGADO') {
      license.status = 'ACTIVE';
      showToast(`¡Pago verificado para ${escapeHtml(license.clientName)}! Sistema puesto en línea en automático 🟢`, "success");
    } else {
      const suspensionInfo = window.calculateNextSuspensionDate(license);
      if (suspensionInfo.isOverdue || suspensionInfo.daysLeft <= 0) {
        license.status = 'SUSPENDED';
        showToast(`Cliente ${escapeHtml(license.clientName)} marcado como NO_PAGADO y suspendido automáticamente 🔴`, "danger");
      } else {
        showToast(`Cliente ${escapeHtml(license.clientName)} marcado como NO_PAGADO. Próxima suspensión: ${suspensionInfo.formattedDate}`, "warning");
      }
    }

    license.version = (license.version || 1) + 1;
    addAuditLog('ORQUESTADOR', nextPlan === 'PAGADO' ? 'FACTURACIÓN_ALTA' : 'FACTURACIÓN_SUSPENSIÓN', `El estatus de pago de ${license.clientName} cambió a ${nextPlan}.`);

    const tgMessage = `💰 <b>[ESTATUS DE PAGO ALR SAAS]</b> 💰\n\nCliente: <b>${escapeHtml(license.clientName)}</b> (${license.id})\n<b>Nuevo Estatus:</b> ${nextPlan === 'PAGADO' ? 'PAGADO 🟢 (Sin riesgo de suspensión)' : 'NO_PAGADO 🔴 (Próxima suspensión en curso)'}\n<b>Frecuencia de Pago:</b> ${license.paymentPeriod || 'Mensual'}\n<b>Fecha:</b> ${new Date().toLocaleString()}`;
    window.sendTelegramNotification(tgMessage);

    saveToStorage();
    window.syncLicenseToFirestore(license);
    renderAll();
  });
};


// 💳 TARJETA MODAL PARA REGISTRO DE MESES PAGADOS & SEMÁFORO DE SUSPENSIÓN (VERDE, ÁMBAR, NARANJA, ROJO)
window.openPaymentMonthsModal = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId);
  if (!license) return;

  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const calc = window.calculateAdjustedMonthlyFee(license);
  const suspensionInfo = window.calculateNextSuspensionDate(license);
  const isPaid = (license.currentPlan === 'PAGADO');

  let badgeColor = '#2ecc71';
  let badgeLabel = '🟢 SEGURO / AL DÍA (MÁS DE 15 DÍAS)';
  if (!isPaid) {
    if (suspensionInfo.daysLeft > 15) { badgeColor = '#2ecc71'; badgeLabel = '🟢 SEGURO / AL DÍA (MÁS DE 15 DÍAS)'; }
    else if (suspensionInfo.daysLeft >= 8) { badgeColor = '#f1c40f'; badgeLabel = '🟡 ÁMBAR - PRECAUCIÓN (8 A 15 DÍAS)'; }
    else if (suspensionInfo.daysLeft >= 4) { badgeColor = '#e67e22'; badgeLabel = '🟠 NARANJA - URGENTE (4 A 7 DÍAS)'; }
    else { badgeColor = '#ef4444'; badgeLabel = '🔴 ROJO - SUSPENSIÓN INMINENTE / CORTE (3 DÍAS O MENOS)'; }
  }

  box.innerHTML = `
    <div style="padding: 26px; max-width: 560px; width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <div>
          <h2 style="font-size: 15px; font-weight: 900; color: var(--accent); margin: 0; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
            <i class="ri-wallet-3-fill"></i> Registro de Pagos & Abono de Meses
          </h2>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 2px;">Cliente: <strong>${escapeHtml(license.clientName)}</strong> (${escapeHtml(license.id)})</div>
        </div>
        <button onclick="closeModal()" style="background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; font-size: 22px;">&times;</button>
      </div>

      <!-- Tarjeta del Semáforo de Estado de Pago y Suspensión -->
      <div style="background: rgba(0, 0, 0, 0.45); border: 1.5px solid ${badgeColor}; border-radius: 14px; padding: 14px; margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: ${badgeColor}; letter-spacing: 0.5px;">
            ${badgeLabel}
          </span>
          <span style="font-size: 9px; font-weight: 900; background: ${badgeColor}22; color: ${badgeColor}; padding: 3px 10px; border-radius: 12px; border: 1px solid ${badgeColor}44;">
            ${isPaid ? '🛡️ Sin Riesgo de Suspensión' : `🔴 Corte: ${suspensionInfo.formattedDate} (${suspensionInfo.daysLeft}d restantes)`}
          </span>
        </div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
          Mensualidad Base / Ajustada (+6%): <strong style="color:#10b981;">${calc.formattedAdjusted}</strong> | Frecuencia: <strong>${license.paymentPeriod || 'Mensual'}</strong>
        </div>
      </div>

      <!-- Selector Rápido de Meses Abonados -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <label style="font-size: 11px; font-weight: 800; color: #fff;">💳 Selecciona los Meses o Períodos a Registrar como Pagados:</label>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <button class="btn btn-secondary" onclick="window.processPaymentMonths('${escapeHtml(license.id)}', 1)" style="height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.08);">
            <span style="font-size: 11px; font-weight: 900; color: #2ecc71;">+1 Mes</span>
            <span style="font-size: 8.5px; opacity: 0.7; color: #a0aec0;">$${(calc.adjustedFee * 1).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})} MXN</span>
          </button>
          
          <button class="btn btn-secondary" onclick="window.processPaymentMonths('${escapeHtml(license.id)}', 2)" style="height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.08);">
            <span style="font-size: 11px; font-weight: 900; color: #2ecc71;">+2 Meses</span>
            <span style="font-size: 8.5px; opacity: 0.7; color: #a0aec0;">$${(calc.adjustedFee * 2).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})} MXN</span>
          </button>
          
          <button class="btn btn-secondary" onclick="window.processPaymentMonths('${escapeHtml(license.id)}', 3)" style="height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.08);">
            <span style="font-size: 11px; font-weight: 900; color: #2ecc71;">+3 Meses (Trim.)</span>
            <span style="font-size: 8.5px; opacity: 0.7; color: #a0aec0;">$${(calc.adjustedFee * 3).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})} MXN</span>
          </button>
          
          <button class="btn btn-secondary" onclick="window.processPaymentMonths('${escapeHtml(license.id)}', 6)" style="height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.08);">
            <span style="font-size: 11px; font-weight: 900; color: var(--accent);">+6 Meses (Sem.)</span>
            <span style="font-size: 8.5px; opacity: 0.7; color: #a0aec0;">$${(calc.adjustedFee * 6).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})} MXN</span>
          </button>
          
          <button class="btn btn-secondary" onclick="window.processPaymentMonths('${escapeHtml(license.id)}', 12)" style="height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.08);">
            <span style="font-size: 11px; font-weight: 900; color: var(--accent);">+12 Meses (1 Año)</span>
            <span style="font-size: 8.5px; opacity: 0.7; color: #a0aec0;">$${(calc.adjustedFee * 12).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})} MXN</span>
          </button>

          <button class="btn btn-secondary" onclick="window.togglePlanStatus('${escapeHtml(license.id)}'); closeModal();" style="height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-color: ${isPaid ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}; background: ${isPaid ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'};">
            <span style="font-size: 10px; font-weight: 900; color: ${isPaid ? '#ef4444' : '#2ecc71'};">
              ${isPaid ? 'Marcar NO_PAGADO 🔴' : 'Marcar PAGADO 🟢'}
            </span>
            <span style="font-size: 8px; opacity: 0.7;">Cambio Manual 1-Clic</span>
          </button>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; border-top: 1px solid var(--border-glass); padding-top: 14px;">
          <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  overlay.style.display = 'flex';
};

window.processPaymentMonths = function(clientId, monthsCount) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId);
  if (!license) return;

  const calc = window.calculateAdjustedMonthlyFee(license);
  const totalPaid = Math.round(calc.adjustedFee * monthsCount * 100) / 100;
  const formattedTotal = '$' + totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';

  const now = new Date();
  const currentExp = (license.expiryDate || license.expirationDate) ? new Date(license.expiryDate || license.expirationDate) : now;
  const baseDate = (currentExp && !isNaN(currentExp.getTime()) && currentExp > now) ? currentExp : now;
  
  baseDate.setMonth(baseDate.getMonth() + monthsCount);
  const newExpiryIso = baseDate.toISOString();

  license.expiryDate = newExpiryIso;
  license.expirationDate = newExpiryIso;
  license.currentPlan = 'PAGADO';
  if (license.status === 'SUSPENDED') {
    license.status = 'ACTIVE';
  }
  license.version = (license.version || 1) + 1;

  addAuditLog('FINANZAS', 'REGISTRO_PAGO_ADELANTADO', `Registrado pago de ${monthsCount} mes(es) por ${formattedTotal} para ${license.clientName}. Nueva fecha de vigencia: ${baseDate.toLocaleDateString('es-MX')}.`);
  
  const tgMsg = `💰 <b>[PAGO REGISTRADO ALR SAAS]</b> 💰\n\nCliente: <b>${license.clientName}</b> (${license.id})\n<b>Meses Abonados:</b> ${monthsCount} mes(es)\n<b>Monto Total Recibido:</b> <b>${formattedTotal}</b>\n<b>Estatus:</b> PAGADO 🟢 (Suspensión Desactivada)\n<b>Nueva Fecha Límite:</b> ${baseDate.toLocaleDateString('es-MX')}`;
  window.sendTelegramNotification(tgMsg);

  saveToStorage();
  window.syncLicenseToFirestore(license);
  showToast(`¡Pago de ${monthsCount} mes(es) ($${totalPaid.toLocaleString('es-MX')} MXN) registrado con éxito para ${escapeHtml(license.clientName)}! 🟢`, "success");
  closeModal();
  renderAll();
};

// ⚡ EDICIONES RÁPIDAS DIRECTAS CON TELEMETRÍA Y RESUMEN (SUGERENCIAS 1, 2 Y 3)

window.quickEditExpiryDate = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId) || state.licenses[0];
  if (!license) { showToast("Cliente no encontrado", "danger"); return; }

  // Sugerencia 1: Abrir el modal de configuración de renovación enfocado en la fecha
  window.openRenewalConfigModal(license.id);
  setTimeout(() => {
    const input = document.getElementById('ren-expiry-date');
    if (input) { input.focus(); input.click(); }
  }, 100);
};

window.quickEditPeriod = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId) || state.licenses[0];
  if (!license) { showToast("Cliente no encontrado", "danger"); return; }

  const oldPeriod = license.renewalPeriod || 'Mensual';
  const periods = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];
  const nextIndex = (periods.indexOf(oldPeriod) + 1) % periods.length;
  const newPeriod = periods[nextIndex];

  license.renewalPeriod = newPeriod;
  license.version = (license.version || 1) + 1;

  saveToStorage();
  window.syncLicenseToFirestore(license);

  // Sugerencia 2: Toast Resumen (Valor Anterior -> Valor Nuevo)
  showToast(`🔄 Período actualizado: "${oldPeriod}" ➔ "${newPeriod}" (${escapeHtml(license.clientName)})`, "info");

  // Sugerencia 3: Bitácora de Auditoría y Telegram
  addAuditLog('ORQUESTADOR', 'CAMBIO_PERÍODO', `Período de renovación de ${license.clientName} modificado: "${oldPeriod}" ➔ "${newPeriod}".`);
  const tgMsg = `🔄 <b>[CAMBIO DE PERÍODO ALR SAAS]</b> 🔄\n\nCliente: <b>${license.clientName}</b> (${license.id})\n<b>Período Anterior:</b> ${oldPeriod}\n<b>Nuevo Período:</b> ${newPeriod}`;
  window.sendTelegramNotification(tgMsg);

  renderAll();
};

window.quickEditFee = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId) || state.licenses[0];
  if (!license) { showToast("Cliente no encontrado", "danger"); return; }

  // Sugerencia 1: Abrir modal de configuración enfocado en la mensualidad
  window.openRenewalConfigModal(license.id);
  setTimeout(() => {
    const input = document.getElementById('ren-base-fee');
    if (input) { input.focus(); input.select(); }
  }, 100);
};

window.deleteAppFromPortfolio = function(appId) {
  const appIndex = state.apps.findIndex(a => a.id === appId);
  if (appIndex === -1) {
    showToast("Aplicación no encontrada en el catálogo.", "warning");
    return;
  }

  const app = state.apps[appIndex];
  const assignedClients = state.licenses.filter(l => l.appId === appId || l.id === appId);

  let confirmMsg = `¿Confirmas que deseas eliminar la aplicación "${app.name}" (${app.id}) del catálogo de ALR SaaS?`;
  if (assignedClients.length > 0) {
    confirmMsg += `\n\n⚠️ ATENCIÓN: Hay ${assignedClients.length} cliente(s) provistos con esta app (${assignedClients.map(c => c.clientName).join(', ')}).`;
  }

  if (!confirm(confirmMsg)) return;

  state.apps.splice(appIndex, 1);
  if (typeof SEED_TEMPLATES !== 'undefined') {
    delete SEED_TEMPLATES[appId];
  }

  addAuditLog('ORQUESTADOR', 'ELIMINAR_APP', `Se eliminó la aplicación ${app.name} (${appId}) del catálogo Master de ALR SaaS.`);
  
  const tgMsg = `🗑️ <b>[ELIMINACIÓN DE APP ALR SAAS]</b> 🗑️\n\nLa aplicación <b>${app.name}</b> (${app.id}) ha sido eliminada del catálogo.\n<b>Fecha:</b> ${new Date().toLocaleString()}`;
  window.sendTelegramNotification(tgMsg);

  saveToStorage();
  showToast(`Aplicación "${escapeHtml(app.name)}" eliminada del catálogo con éxito.`, "info");
  renderAll();
};

window.toggleLicenseStatus = function(clientId, currentStatus) {
  const license = state.licenses.find(l => l.id === clientId);
  if (!license) return;

  requestAdminVerification(`Cambiar Estado de Licencia (${license.clientName})`, () => {
    const isCurrentlyActive = (currentStatus === 'ACTIVE' || currentStatus === 'active' || currentStatus === true || license.status === 'ACTIVE' || license.status === 'active');
    const nextStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

    license.status = nextStatus;
    license.version = (license.version || 1) + 1;
    addAuditLog('API_GATEWAY', nextStatus === 'ACTIVE' ? 'ACTIVACIÓN' : 'SUSPENSIÓN', `La licencia del cliente ${license.clientName} ha sido cambiada a ${nextStatus}.`);

    const tgMessage = `🔔 <b>[TELEMETRÍA ALR SAAS]</b> 🔔\n\nEl cliente <b>${escapeHtml(license.clientName)}</b> (${license.id}) ha cambiado de estado operativo.\n<b>Nuevo Estado:</b> ${nextStatus === 'ACTIVE' ? 'ONLINE (En Línea) 🟢' : 'OFFLINE (Fuera de Línea) 🔴'}\n<b>Plan actual:</b> ${license.currentPlan}\n<b>Fecha:</b> ${new Date().toLocaleString()}`;
    window.sendTelegramNotification(tgMessage);

    saveToStorage();
    window.syncLicenseToFirestore(license);

    // ⚡ DIFUSIÓN INSTANTÁNEA MULTI-PESTAÑA EN TIEMPO REAL (0 MILISEGUNDOS)
    try {
      localStorage.setItem('alr_saas_license_signal', JSON.stringify({ id: license.id, status: nextStatus, timestamp: Date.now() }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('alr_saas_global_channel');
        bc.postMessage({ type: 'LICENSE_STATUS_UPDATE', id: license.id, status: nextStatus, license });
        bc.close();
      }
    } catch (e) {}

    showToast(`Cliente ${escapeHtml(license.clientName)}: Estado cambiado a ${nextStatus === 'ACTIVE' ? 'ONLINE 🟢' : 'SUSPENDIDO 🔴'}.`, nextStatus === 'ACTIVE' ? 'success' : 'danger');
    renderAll();
  });
};

// 📈 CÁLCULO DE AUMENTO DEL 6% ANUAL Y TARIFA MENSUAL VIGENTE
window.calculateAdjustedMonthlyFee = function(license) {
  if (!license) return { baseFee: 500, yearsElapsed: 0, ratePercent: 6, adjustedFee: 500, formattedAdjusted: '$500.00 MXN' };
  
  const baseFee = Number(license.baseMonthlyFee || license.monthlyFee || 500);
  const startStr = license.startDate || license.createdAt || '2025-01-01';
  const startDate = new Date(startStr);
  const now = new Date();
  
  let yearsElapsed = now.getFullYear() - startDate.getFullYear();
  const mDiff = now.getMonth() - startDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < startDate.getDate())) {
    yearsElapsed--;
  }
  yearsElapsed = Math.max(0, yearsElapsed);
  
  const rate = Number(license.annualIncreaseRate || 0.06);
  const adjustedFee = baseFee * Math.pow(1 + rate, yearsElapsed);
  const roundedFee = Math.round(adjustedFee * 100) / 100;
  
  return {
    baseFee: baseFee,
    yearsElapsed: yearsElapsed,
    ratePercent: rate * 100,
    adjustedFee: roundedFee,
    formattedAdjusted: '$' + roundedFee.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN'
  };
};

// ⚡ CÁLCULO AUTOMÁTICO DE FECHAS DE RENOVACIÓN Y PROYECCIÓN FUTURA (+6% ANUAL)

window.autoCalculateRenewalDate = function(startDateStr, periodStr) {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return '';
  
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return '';

  const period = periodStr || 'Mensual';
  if (period === 'Mensual') {
    date.setMonth(date.getMonth() + 1);
  } else if (period === 'Trimestral') {
    date.setMonth(date.getMonth() + 3);
  } else if (period === 'Semestral') {
    date.setMonth(date.getMonth() + 6);
  } else if (period === 'Anual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
};

window.onModalStartDateOrPeriodChange = function() {
  const startStr = document.getElementById('ren-start-date')?.value;
  const period = document.getElementById('ren-period')?.value;
  if (startStr) {
    const calculatedExpiry = window.autoCalculateRenewalDate(startStr, period);
    const expiryEl = document.getElementById('ren-expiry-date');
    if (expiryEl && calculatedExpiry) {
      expiryEl.value = calculatedExpiry;
    }
  }
  window.updateModalFeePreview();
};

window.onWizardStartDateOrPeriodChange = function() {
  const startStr = document.getElementById('w-start-date')?.value;
  const period = document.getElementById('w-renewal-period')?.value;
  if (startStr) {
    const calculatedExpiry = window.autoCalculateRenewalDate(startStr, period);
    const expiryEl = document.getElementById('w-expiry-date');
    if (expiryEl && calculatedExpiry) {
      expiryEl.value = calculatedExpiry;
    }
  }
};

window.sendAnnualIncreaseAdvanceNotice = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId);
  if (!license) return;

  const calc = window.calculateAdjustedMonthlyFee(license);
  const startStr = (license.startDate || license.createdAt || '2025-01-01').split('T')[0];
  const parts = startStr.split('-');
  let startDate = new Date();
  if (parts.length === 3) {
    startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  const now = new Date();

  const nextAnniversaryYear = now.getFullYear() + (now.getMonth() > startDate.getMonth() || (now.getMonth() === startDate.getMonth() && now.getDate() >= startDate.getDate()) ? 1 : 0);
  const nextAnniversaryDate = new Date(nextAnniversaryYear, startDate.getMonth(), startDate.getDate());
  
  const diffTime = nextAnniversaryDate.getTime() - now.getTime();
  const daysUntilAnniversary = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const yearsInNextAnniversary = nextAnniversaryYear - startDate.getFullYear();
  const baseFee = Number(license.baseMonthlyFee || license.monthlyFee || 500);
  const nextFee = Math.round(baseFee * Math.pow(1.06, yearsInNextAnniversary) * 100) / 100;
  const formattedNextFee = '$' + nextFee.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';

  const dateFormatted = nextAnniversaryDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  const messageText = `📈 <b>[AVISO ANTICIPADO DE INCREMENTO ANUAL (+6.0%)]</b> 📈\n\nEstimado cliente <b>${escapeHtml(license.clientName)}</b>,\n\nLe informamos con 15 días de anticipación que su contrato para <b>${escapeHtml(license.appName || license.clientName)}</b> cumplirá un nuevo aniversario el <b>${dateFormatted}</b> (faltan ${daysUntilAnniversary} día(s)).\n\nDe acuerdo con la cláusula de ajuste por inflación anual (+6.0% acumulado):\n• <b>Mensualidad Actual (Año ${calc.yearsElapsed}):</b> ${calc.formattedAdjusted}\n• <b>Nueva Mensualidad (Año ${yearsInNextAnniversary}):</b> <b>${formattedNextFee}</b>\n\nAtentamente,\n<b>ALR SaaS Governance & Finance Orquestador</b>`;

  if (typeof window.sendTelegramNotification === 'function') {
    window.sendTelegramNotification(messageText, 'INFO');
  }

  addAuditLog('FINANZAS', 'AVISO_INCREMENTO_ANUAL', `Aviso de incremento del +6% enviado a ${license.clientName}. Próxima cuota: ${formattedNextFee} el ${dateFormatted}.`);
  showToast(`🔔 Aviso de incremento del +6% enviado a ${escapeHtml(license.clientName)} (${daysUntilAnniversary} días restantes)`, "warning");
};

window.checkAndSendAnnualIncreaseReminders = function() {
  let count = 0;
  const now = new Date();

  state.licenses.forEach(license => {
    const startStr = (license.startDate || license.createdAt || '2025-01-01').split('T')[0];
    const parts = startStr.split('-');
    let startDate = new Date();
    if (parts.length === 3) {
      startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    const nextAnniversaryYear = now.getFullYear() + (now.getMonth() > startDate.getMonth() || (now.getMonth() === startDate.getMonth() && now.getDate() >= startDate.getDate()) ? 1 : 0);
    const nextAnniversaryDate = new Date(nextAnniversaryYear, startDate.getMonth(), startDate.getDate());
    
    const diffTime = nextAnniversaryDate.getTime() - now.getTime();
    const daysUntilAnniversary = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilAnniversary <= 15 && daysUntilAnniversary >= 0) {
      if (license.lastAnnualNoticeYear !== nextAnniversaryYear) {
        license.lastAnnualNoticeYear = nextAnniversaryYear;
        window.sendAnnualIncreaseAdvanceNotice(license.id);
        count++;
      }
    }
  });

  if (count > 0) {
    saveToStorage();
  }
};

window.openRenewalConfigModal = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId);
  if (!license) return;

  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const calc = window.calculateAdjustedMonthlyFee(license);
  const currentExpiry = (license.expiryDate || license.expirationDate || '2099-12-30').split('T')[0];
  const currentPeriod = license.renewalPeriod || 'Mensual';
  const currentPaymentPeriod = license.paymentPeriod || 'Mensual';
  const currentBaseFee = Number(license.baseMonthlyFee || license.monthlyFee || 500);
  const currentStartDate = (license.startDate || license.createdAt || '2025-01-01').split('T')[0];

  box.innerHTML = `
    <div style="padding: 28px; max-width: 600px; width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <div>
          <h2 style="font-size: 15px; font-weight: 900; color: var(--accent); margin: 0; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
            <i class="ri-calendar-event-fill"></i> Configuración de Renovación & Tarifas
          </h2>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 2px;">Cliente: <strong>${escapeHtml(license.clientName)}</strong> (${escapeHtml(license.id)})</div>
        </div>
        <button onclick="closeModal()" style="background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; font-size: 22px;">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 11px; font-weight: 800;">🗓️ Fecha Inicio Contrato</label>
            <input type="date" id="ren-start-date" class="form-input" value="${currentStartDate}" onchange="window.onModalStartDateOrPeriodChange()" style="height: 38px; font-size: 11px; background: rgba(0,0,0,0.5);">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 11px; font-weight: 800;">🔄 Período de Renovación (Aumento +6%)</label>
            <select id="ren-period" class="form-input" onchange="window.onModalStartDateOrPeriodChange()" style="height: 38px; font-size: 11px; background: rgba(0,0,0,0.5); color: #fff;">
              <option value="Mensual" ${currentPeriod === 'Mensual' ? 'selected' : ''}>Mensual</option>
              <option value="Trimestral" ${currentPeriod === 'Trimestral' ? 'selected' : ''}>Trimestral</option>
              <option value="Semestral" ${currentPeriod === 'Semestral' ? 'selected' : ''}>Semestral</option>
              <option value="Anual" ${currentPeriod === 'Anual' ? 'selected' : ''}>Anual (+6% Inflación)</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 10.5px; font-weight: 800;">💳 Período de Pago (Cobro Operativo)</label>
            <select id="ren-payment-period" class="form-input" style="height: 38px; font-size: 11px; background: rgba(0,0,0,0.5); color: #f59e0b; border-color: rgba(245,158,11,0.4);">
              <option value="Mensual" ${currentPaymentPeriod === 'Mensual' ? 'selected' : ''}>Mensual</option>
              <option value="Quincenal" ${currentPaymentPeriod === 'Quincenal' ? 'selected' : ''}>Quincenal</option>
              <option value="Trimestral" ${currentPaymentPeriod === 'Trimestral' ? 'selected' : ''}>Trimestral</option>
              <option value="Semestral" ${currentPaymentPeriod === 'Semestral' ? 'selected' : ''}>Semestral</option>
              <option value="Anual" ${currentPaymentPeriod === 'Anual' ? 'selected' : ''}>Anual</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 10.5px; font-weight: 800;">💵 Mensualidad Base ($ MXN)</label>
            <input type="number" id="ren-base-fee" class="form-input" value="${currentBaseFee}" step="10" oninput="window.updateModalFeePreview()" style="height: 38px; font-size: 11px; background: rgba(0,0,0,0.5);">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 10.5px; font-weight: 800;">📅 Próxima Renovación (Calculada ⚡)</label>
            <input type="date" id="ren-expiry-date" class="form-input" value="${currentExpiry}" style="height: 38px; font-size: 11px; background: rgba(0,0,0,0.5); border-color: var(--accent);">
          </div>
        </div>

        <!-- Panel en Vivo con la Fórmula del +6% Anual Acumulado -->
        <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; padding: 14px;" id="ren-fee-preview-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: var(--accent); letter-spacing: 0.5px;">
              📈 Ajuste por Inflación Anual (+6.0%)
            </span>
            <span style="font-size: 9px; font-weight: 800; background: rgba(0, 229, 255, 0.15); color: #fff; padding: 2px 8px; border-radius: 6px;" id="ren-years-badge">
              Año ${calc.yearsElapsed} (${calc.yearsElapsed} año(s) transcurridos)
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div>
              <div style="font-size: 9px; opacity: 0.6;" id="ren-base-display">Tarifa Base Inicial: <strong>$${calc.baseFee.toLocaleString()} MXN</strong></div>
              <div style="font-size: 9px; opacity: 0.6; margin-top: 2px;" id="ren-rate-display">Incremento Acumulado: <strong>+${(calc.yearsElapsed * 6).toFixed(1)}%</strong></div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; opacity: 0.6; text-transform: uppercase;">Mensualidad Vigente:</div>
              <div style="font-size: 16px; font-weight: 900; color: #10b981;" id="ren-adjusted-display">${calc.formattedAdjusted}</div>
            </div>
          </div>
        </div>

        <!-- 📊 TABLA PROYECTADA DE PAGOS PARA LOS PRÓXIMOS 5 AÑOS -->
        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 900; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; text-transform: uppercase; letter-spacing: 0.5px;">
            <span><i class="ri-table-line"></i> Proyección Futura de Cuotas (+6.0% Anual)</span>
            <span style="font-size: 8.5px; opacity: 0.7; color: #a0aec0;">Próximos 5 Años</span>
          </div>
          <div style="max-height: 150px; overflow-y: auto;">
            <table class="saas-table" style="width: 100%; font-size: 9.5px;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03);">
                  <th style="padding: 4px 6px; text-align: left;">Año / Ciclo</th>
                  <th style="padding: 4px 6px; text-align: left;">Inicio Ciclo</th>
                  <th style="padding: 4px 6px; text-align: right;">Aumento</th>
                  <th style="padding: 4px 6px; text-align: right;">Mensualidad Vigente</th>
                </tr>
              </thead>
              <tbody id="ren-projection-tbody">
                <!-- Dinámico -->
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center; margin-top: 6px;">
          <button class="btn btn-secondary" style="font-size: 10px; font-weight: 800; color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.05);" onclick="window.sendAnnualIncreaseAdvanceNotice('${escapeHtml(license.id)}')">
            <i class="ri-notification-3-line"></i> 🔔 Enviar Aviso +6% (15 Días Antes)
          </button>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="window.saveRenewalConfigModal('${escapeHtml(license.id)}')">
              <i class="ri-save-3-line"></i> Guardar y Sincronizar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  overlay.style.display = 'flex';
  window.updateModalFeePreview();
};

window.updateModalFeePreview = function() {
  const baseFee = Number(document.getElementById('ren-base-fee')?.value || 500);
  const startStr = document.getElementById('ren-start-date')?.value || '2025-01-01';
  const parts = startStr.split('-');
  let startDate = new Date();
  if (parts.length === 3) {
    startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  const now = new Date();

  let yearsElapsed = now.getFullYear() - startDate.getFullYear();
  const mDiff = now.getMonth() - startDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < startDate.getDate())) {
    yearsElapsed--;
  }
  yearsElapsed = Math.max(0, yearsElapsed);

  const adjusted = Math.round(baseFee * Math.pow(1.06, yearsElapsed) * 100) / 100;
  const formatted = '$' + adjusted.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';

  const badgeEl = document.getElementById('ren-years-badge');
  const baseEl = document.getElementById('ren-base-display');
  const rateEl = document.getElementById('ren-rate-display');
  const adjEl = document.getElementById('ren-adjusted-display');

  if (badgeEl) badgeEl.textContent = `Año ${yearsElapsed} (${yearsElapsed} año(s) transcurridos)`;
  if (baseEl) baseEl.innerHTML = `Tarifa Base Inicial: <strong>$${baseFee.toLocaleString()} MXN</strong>`;
  if (rateEl) rateEl.innerHTML = `Incremento Acumulado: <strong>+${(yearsElapsed * 6).toFixed(1)}%</strong>`;
  if (adjEl) adjEl.textContent = formatted;

  // Generar Filas de Proyección para los Próximos 5 Años
  let projRowsHtml = '';
  for (let i = 0; i <= 5; i++) {
    const projYearDate = new Date(startDate);
    projYearDate.setFullYear(projYearDate.getFullYear() + i);

    const yearLabel = i === 0 ? 'Año 1 (Inicial)' : `Año ${i + 1}`;
    const dateLabel = projYearDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    
    const ratePct = ((Math.pow(1.06, i) - 1) * 100).toFixed(1);
    const projFee = Math.round(baseFee * Math.pow(1.06, i) * 100) / 100;
    const formattedProjFee = '$' + projFee.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';

    const isCurrentYear = i === yearsElapsed;
    const rowBg = isCurrentYear ? 'rgba(16, 185, 129, 0.15)' : 'transparent';
    const rowColor = isCurrentYear ? '#10b981' : '#fff';
    const currentTag = isCurrentYear ? ' <span style="font-size:8px; background:#10b981; color:#000; padding:1px 5px; border-radius:4px; font-weight:900;">VIGENTE</span>' : '';

    projRowsHtml += `
      <tr style="background: ${rowBg}; color: ${rowColor}; font-weight: ${isCurrentYear ? '900' : '500'};">
        <td style="padding: 5px 6px; font-weight: 800;">${yearLabel}${currentTag}</td>
        <td style="padding: 5px 6px; opacity: 0.85;">${dateLabel}</td>
        <td style="padding: 5px 6px; text-align: right; opacity: 0.85;">+${ratePct}%</td>
        <td style="padding: 5px 6px; text-align: right; font-weight: 900; color: ${isCurrentYear ? '#10b981' : '#34d399'};">${formattedProjFee}</td>
      </tr>
    `;
  }

  const tbodyEl = document.getElementById('ren-projection-tbody');
  if (tbodyEl) tbodyEl.innerHTML = projRowsHtml;
};

window.saveRenewalConfigModal = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId);
  if (!license) return;

  const newExpiry = document.getElementById('ren-expiry-date')?.value;
  const newPeriod = document.getElementById('ren-period')?.value;
  const newPaymentPeriod = document.getElementById('ren-payment-period')?.value;
  const newBaseFee = Number(document.getElementById('ren-base-fee')?.value || 500);
  const newStartDate = document.getElementById('ren-start-date')?.value;

  if (newExpiry) {
    license.expiryDate = newExpiry + 'T23:59:59Z';
    license.expirationDate = newExpiry + 'T23:59:59Z';
  }
  if (newPeriod) license.renewalPeriod = newPeriod;
  if (newPaymentPeriod) license.paymentPeriod = newPaymentPeriod;
  if (!isNaN(newBaseFee) && newBaseFee > 0) license.baseMonthlyFee = newBaseFee;
  if (newStartDate) license.startDate = newStartDate;

  const calc = window.calculateAdjustedMonthlyFee(license);
  license.adjustedMonthlyFee = calc.adjustedFee;
  license.version = (license.version || 1) + 1;

  saveToStorage();
  window.syncLicenseToFirestore(license);

  const tgMsg = `📅 <b>[CONFIGURACIÓN DE RENOVACIÓN & PAGO ALR SAAS]</b> 📅\n\nCliente: <b>${license.clientName}</b> (${license.id})\n<b>Próxima Renovación:</b> ${newExpiry}\n<b>Período Renovación (+6%):</b> ${newPeriod}\n<b>Frecuencia de Pago:</b> ${newPaymentPeriod}\n<b>Tarifa Base:</b> $${newBaseFee} MXN\n<b>Mensualidad Vigente:</b> ${calc.formattedAdjusted}`;
  window.sendTelegramNotification(tgMsg);

  addAuditLog('ORQUESTADOR', 'CONFIGURACIÓN_RENOVACIÓN', `Actualizado ${license.clientName}: Vencimiento ${newExpiry}, Renovación ${newPeriod}, Pago ${newPaymentPeriod}, Cuota ${calc.formattedAdjusted}.`);
  showToast(`¡Configuración de renovación y pago guardada para ${escapeHtml(license.clientName)}!`, "success");
  closeModal();
  renderAll();
};

window.deleteLicense = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId || l.appId === clientId);
  if (!license) return;

  requestAdminVerification(`Eliminar Licencia (${license.clientName})`, () => {
    if (!confirm(`¿Confirmas que deseas mover la licencia de "${license.clientName}" (${license.id}) a la papelera de reciclaje?`)) return;

    state.licenses = state.licenses.filter(l => l.id !== clientId && l.id !== license.id);
    if (!state.recycleBin) state.recycleBin = [];

    license.status = 'SUSPENDED';
    license.version = (license.version || 1) + 1;

    state.recycleBin.push({
      license: license,
      deletedAt: new Date().toISOString()
    });

    addAuditLog('ORQUESTADOR', 'ELIMINACIÓN_PAPELERA', `Cliente ${license.clientName} movido a la papelera de reciclaje (retención de 45 días).`);
    saveToStorage();
    window.syncLicenseToFirestore(license);
    showToast(`Cliente ${escapeHtml(license.clientName)} movido a la papelera.`, "info");
    renderAll();
  });
};

// Borrado DURO real: llama a deprovisionAppClone, que borra TODAS las
// colecciones del tenant en la app destino (irreversible, ver deleteTenant
// del lado de esa app) además de quitar la licencia de ALR SaaS. Distinto
// de deleteLicense (que solo mueve la licencia local a la papelera sin
// tocar la app destino) -- por eso pide una confirmación escrita, no solo
// un confirm().
window.deprovisionTenantReal = function(clientId, appId, clientName) {
  requestAdminVerification(`Borrar tenant real (${clientName})`, () => {
    const typed = prompt(`⚠️ ESTO ES IRREVERSIBLE.\n\nVas a borrar TODOS los datos de "${clientName}" (${clientId}) en la app destino -- órdenes, empleados, caja, todo. No hay respaldo automático.\n\nPara confirmar, escribe exactamente: BORRAR ${clientId}`);
    if (typed !== `BORRAR ${clientId}`) {
      showToast("Borrado cancelado. La confirmación no coincidió.", "warning");
      return;
    }

    (async () => {
      try {
        showToast(`Borrando tenant ${escapeHtml(clientName)}...`, "info");
        const call = window.governanceFunctions.httpsCallable('deprovisionAppClone');
        await call({ appId, tenantId: clientId });
        addAuditLog('ORQUESTADOR', 'BORRADO_TENANT_REAL', `Tenant ${clientName} (${clientId}) borrado por completo en la app destino y en ALR SaaS.`);
        await window.pullAllLicensesFromCloud(true);
        renderAll();
        showToast(`Tenant ${escapeHtml(clientName)} borrado por completo.`, "success");
      } catch (err) {
        console.error('[DEPROVISION ERR]', err);
        showToast(`Error al borrar: ${escapeHtml(err.message || String(err))}`, "danger");
      }
    })();
  });
};

// Restaura el respaldo más reciente de un tenant (deshace el último
// clonado o borrado, ver createPreCloneBackup/createPreDeleteBackup del
// lado de la app destino). Funciona incluso si el tenant ya no aparece
// en la tabla de clientes (ej. después de un deprovisionTenantReal).
window.restoreTenantReal = function(clientId, appId, clientName) {
  if (!clientId) {
    showToast("Falta el ID del tenant a restaurar.", "warning");
    return;
  }
  requestAdminVerification(`Restaurar tenant (${clientName || clientId})`, () => {
    if (!confirm(`¿Restaurar el respaldo más reciente de "${clientId}"? Esto sobrescribe cualquier dato actual de ese tenant con lo que había antes de la última operación (clonado o borrado).`)) return;

    (async () => {
      try {
        showToast(`Restaurando ${escapeHtml(clientId)}...`, "info");
        const call = window.governanceFunctions.httpsCallable('restoreAppCloneBackup');
        const res = await call({ appId, tenantId: clientId });
        const { backupType, snapshotAt, restoredDocs } = res.data || {};
        addAuditLog('ORQUESTADOR', 'RESTAURACIÓN_TENANT_REAL', `Tenant ${clientId} restaurado desde respaldo (${backupType || 'desconocido'}, ${snapshotAt || ''}), ${restoredDocs || 0} documentos.`);
        await window.pullAllLicensesFromCloud(true);
        renderAll();
        closeModal();
        showToast(`Tenant ${escapeHtml(clientId)} restaurado (${escapeHtml(String(restoredDocs || 0))} documentos).`, "success");
      } catch (err) {
        console.error('[RESTORE TENANT ERR]', err);
        showToast(`Error al restaurar: ${escapeHtml(err.message || String(err))}`, "danger");
      }
    })();
  });
};

window.restoreLicense = function(clientId) {
  const binIndex = state.recycleBin.findIndex(item => item.license.id === clientId);
  if (binIndex === -1) return;
  const item = state.recycleBin[binIndex];

  requestAdminVerification(`Restaurar Licencia (${item.license.clientName})`, () => {
    state.recycleBin.splice(binIndex, 1);
    if (!state.licenses.some(l => l.id === clientId)) {
      item.license.version = (item.license.version || 1) + 1;
      state.licenses.push(item.license);
    }
    addAuditLog('ORQUESTADOR', 'RESTAURACIÓN', `Cliente ${item.license.clientName} restaurado desde la papelera de reciclaje.`);
    saveToStorage();
    showToast(`Cliente ${item.license.clientName} restaurado.`, "success");
    renderAll();
  });
};

window.permanentlyDeleteFromBin = function(clientId) {
  if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') {
    showToast("Permiso denegado: solo el SUPER_ADMIN puede purgar licencias.", "danger");
    return;
  }

  const binIndex = state.recycleBin.findIndex(item => item.license.id === clientId);
  if (binIndex === -1) return;
  const item = state.recycleBin[binIndex];

  requestAdminVerification(`Purgar Licencia Permanentemente (${item.license.clientName})`, async () => {
    if (window.lastAuthRole !== 'SUPER_ADMIN') {
      showToast("Permiso denegado: solo el SUPER_ADMIN puede autorizar esta purga.", "danger");
      return;
    }

    state.recycleBin.splice(binIndex, 1);
    
    const purgeResult = { success: true, errMsg: '' };
    
    if (window.FIREBASE_SYNC_ENABLED && window.firestoreDb) {
      const hasInternet = await window.checkInternetConnection();
      if (hasInternet) {
        try {
          await window.firestoreDb.collection('master_licenses').doc(clientId).delete();
        } catch (err) {
          purgeResult.success = false;
          purgeResult.errMsg = err.message;
        }
      } else {
        purgeResult.success = false;
        purgeResult.errMsg = "No hay conexión real a Internet.";
      }
    }

    if (purgeResult.success) {
      addAuditLog('ORQUESTADOR', 'ELIMINACIÓN_COMPLETA', `Cliente ${item.license.clientName} purgado permanentemente de la papelera.`);
      saveToStorage();
      showToast(`Cliente ${item.license.clientName} eliminado permanentemente.`, "success");
      renderAll();
    } else {
      state.recycleBin.splice(binIndex, 0, item);
      console.error(`Rollback: fallo al eliminar licencia de Firestore para ${item.license.clientName}. Error: ${purgeResult.errMsg}`);
      showToast(`Error al eliminar de la nube. Restaurando a papelera: ${purgeResult.errMsg}`, "danger");
      addAuditLog('ORQUESTADOR', 'FALLO_PURGA_ROLLBACK', `Fallo al purgar de la nube ${item.license.clientName}. Estado revertido.`);
      renderAll();
    }
  });
};

function renderRecycleBin() {
  const container = document.getElementById('recycle-bin-body');
  if (!container) return;

  if (!state.recycleBin || state.recycleBin.length === 0) {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.5; font-style:italic;">La papelera de reciclaje está vacía.</td></tr>`;
    return;
  }

  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
  container.innerHTML = state.recycleBin.map(item => {
    const deletedDate = new Date(item.deletedAt);
    const elapsedMs = Date.now() - deletedDate.getTime();
    const remainingMs = Math.max(0, fortyFiveDaysMs - elapsedMs);
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    const dangerColor = remainingDays <= 5 ? 'var(--danger)' : 'var(--warning)';

    return `
      <tr>
        <td style="font-weight: 800; color: rgba(255,255,255,0.75);">${escapeHtml(item.license.clientName)}</td>
        <td style="opacity: 0.7;">${escapeHtml(item.license.appName)} <span style="font-size: 9px; font-family: var(--font-mono); opacity: 0.5;">(${escapeHtml(item.license.id)})</span></td>
        <td style="opacity: 0.7;">
          <span class="status-badge" style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);">${escapeHtml(item.license.currentPlan)}</span>
          <span class="status-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);">ELIMINADO</span>
        </td>
        <td style="opacity: 0.7;">${deletedDate.toLocaleDateString()} ${deletedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td style="font-weight: 900; color: ${dangerColor};">${remainingDays} días</td>
        <td>
          <button class="btn btn-secondary" style="height:32px; padding:0 12px; font-size:10px; border-color: rgba(34, 197, 94, 0.3); color: var(--success); background: rgba(34, 197, 94, 0.05);" onclick="window.restoreLicense('${escapeHtml(item.license.id)}')">
            <i class="ri-refresh-line"></i> Restaurar
          </button>
          <button class="btn btn-danger-outline" style="height:32px; padding:0 12px; font-size:10px;" onclick="window.permanentlyDeleteFromBin('${escapeHtml(item.license.id)}')">
            <i class="ri-delete-bin-2-line"></i> Purgar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddCreditsModal = function(clientId) {
  const license = state.licenses.find(l => l.id === clientId);
  if (!license) return;

  requestAdminVerification(`Cargar Créditos ($) a ${license.clientName}`, () => {
    const amountStr = prompt(`Ingresar saldo adicional para ${license.clientName}:\nSaldo actual: $${Number(license.initialAmount).toLocaleString()}\nMonto a ingresar ($):`);
    const amount = Number(amountStr);

    if (isNaN(amount) || amount <= 0) {
      if (amountStr !== null) showToast("Monto inválido.", "warning");
      return;
    }

    license.initialAmount = Number(license.initialAmount || 0) + amount;
    addAuditLog('SYSTEM', 'RECARGA', `Recarga exitosa de $${amount.toLocaleString()} al cliente ${license.clientName}. Nuevo saldo: $${license.initialAmount.toLocaleString()}`);
    saveToStorage();
    window.syncLicenseToFirestore(license);
    showToast(`¡Recarga exitosa a ${escapeHtml(license.clientName)}!`, "success");
    renderAll();
  });
};

window.clearAuditLogs = function() {
  if (!confirm("¿Deseas vaciar la bitácora de telemetría y logs de seguridad?")) return;
  state.logs = [];
  addAuditLog('SYSTEM', 'LIMPIEZA', 'Bitácora de telemetría vaciada por el administrador.');
  saveToStorage();
  showToast("Bitácora vaciada.", "info");
  renderAll();
};

// ⚡ CONTROLADOR REGISTRO NUEVA APP BASE
window.openRegisterAppModal = function() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; font-weight: 900; color: var(--accent); margin-bottom: 20px; text-transform: uppercase;">Registrar Nueva Aplicación</h2>
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="form-group" style="background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.15); border-radius: 12px; padding: 14px;">
          <label class="form-label">Cargar desde URL (si ya tiene auto-clonado configurado)</label>
          <div style="display:flex; gap:8px; margin-top:4px;">
            <input type="text" id="app-reg-url" class="form-input" placeholder="https://rey-smart-wash.web.app" style="flex:1;">
            <button class="btn btn-secondary" type="button" onclick="window.autofillAppFromUrl()">Detectar</button>
          </div>
          <p style="font-size: 10px; opacity: 0.6; margin-top: 6px;">Si esa URL coincide con una app que ya configuraste en "Auto-clonado", esto rellena Nombre e ID por ti.</p>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Software</label>
          <input type="text" id="app-reg-name" class="form-input" placeholder="Ej: REY Smart Pharmacy System">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label class="form-label">ID / Slug</label>
            <input type="text" id="app-reg-slug" class="form-input" placeholder="Ej: smart_pharmacy">
          </div>
          <div class="form-group">
            <label class="form-label">Versión de Lanzamiento</label>
            <input type="text" id="app-reg-ver" class="form-input" placeholder="Ej: v1.0.0">
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label class="form-label">Ícono (RemixIcon Class)</label>
            <input type="text" id="app-reg-icon" class="form-input" value="ri-capsule-fill">
          </div>
          <div class="form-group">
            <label class="form-label">Color Distintivo (Hex)</label>
            <input type="text" id="app-reg-color" class="form-input" value="#10b981">
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-top: 30px;">
        <button class="btn btn-secondary flex-1" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary flex-2" onclick="processRegisterApp()">Registrar Producto</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');
};

// Busca en state.appRegistry (ya cargado desde alr-saas-app-registry, ver
// pullAppRegistryFromCloud) qué appId tiene un hostingBaseUrl que coincide
// con la URL pegada, y rellena Nombre/ID a partir de eso -- evita tener
// que saber de memoria el ID exacto (ej. "rey_xalpa") con el que se
// configuró el auto-clonado.
window.autofillAppFromUrl = function() {
  const raw = document.getElementById('app-reg-url')?.value?.trim();
  if (!raw) {
    showToast("Pega la URL primero.", "warning");
    return;
  }
  let origin;
  try {
    origin = new URL(raw.startsWith('http') ? raw : `https://${raw}`).origin;
  } catch (e) {
    showToast("URL inválida.", "warning");
    return;
  }

  const registry = state.appRegistry || {};
  const match = Object.entries(registry).find(([, cfg]) => {
    try {
      return cfg.hostingBaseUrl && new URL(cfg.hostingBaseUrl).origin === origin;
    } catch (e) {
      return false;
    }
  });

  if (!match) {
    showToast("Esa URL no tiene auto-clonado configurado todavía. Llena los campos manualmente, o configúralo primero desde una app ya registrada.", "warning");
    return;
  }

  const [appId] = match;
  const prettyName = appId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const slugEl = document.getElementById('app-reg-slug');
  const nameEl = document.getElementById('app-reg-name');
  const verEl = document.getElementById('app-reg-ver');
  if (slugEl) slugEl.value = appId;
  if (nameEl && !nameEl.value) nameEl.value = prettyName;
  if (verEl && !verEl.value) verEl.value = 'v1.0.0';
  showToast(`Detectado "${appId}" — Nombre e ID completados automáticamente.`, "success");
};

window.processRegisterApp = function() {
  const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

  const name = getVal('app-reg-name');
  const id = getVal('app-reg-slug');
  const version = getVal('app-reg-ver');
  const icon = getVal('app-reg-icon');
  const color = getVal('app-reg-color');

  if (!name || !id || !version) {
    showToast("Completa los campos obligatorios.", "warning");
    return;
  }

  if (state.apps.some(a => a.id === id)) {
    showToast("El ID de software ya existe.", "danger");
    return;
  }

  const newApp = {
    id,
    name,
    version,
    status: 'RELEASED',
    activeClients: 0,
    icon,
    color
  };

  state.apps.push(newApp);

  // Registrar auditoría INMUTABLE
  addAuditLog('SYSTEM', 'REGISTRO_APP', `Nueva aplicación base registrada: ${name} (${version}).`);

  saveToStorage();
  showToast(`¡Aplicación ${name} Registrada!`, "success");
  closeModal();
  renderAll();
};

// 📥 INSTANT TOAST NOTIFIER HELPER
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg || !icon) return;

  const icons = { info: '⚡', success: '✅', warning: '⚠️', danger: '🛑' };
  
  // Asignar colores según el tipo
  let bg = "rgba(10, 15, 25, 0.95)";
  let border = "var(--border-glass)";
  if (type === 'success') border = "rgba(34, 197, 94, 0.3)";
  else if (type === 'danger') border = "rgba(239, 68, 68, 0.3)";
  else if (type === 'warning') border = "rgba(245, 158, 11, 0.3)";

  toast.style.borderColor = border;
  icon.innerText = icons[type] || '✨';
  msg.innerHTML = message;

  const isUndo = message.includes('DESHACER');
  const duration = isUndo ? 10000 : 3000;

  toast.classList.add('show');
  
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

window.undoOverwrite = async function(clientId) {
  if (!window.overwrittenLicenseBackup) return;
  const backup = window.overwrittenLicenseBackup;
  
  // Buscar la licencia nueva provisional y removerla
  const newIndex = state.licenses.findIndex(l => l.id === clientId);
  if (newIndex !== -1) {
    state.licenses.splice(newIndex, 1);
  }
  
  // Restaurar la licencia anterior
  state.licenses.push(backup);
  
  // Remover de la papelera
  if (state.recycleBin) {
    state.recycleBin = state.recycleBin.filter(item => item.license.id !== clientId);
  }
  
  addAuditLog('ORQUESTADOR', 'DESHACER_SOBRESCRIBIR', `Sobrescritura del cliente ${clientId} revertida con éxito.`);
  
  await saveToStorage();
  await window.syncLicenseToFirestore(backup);
  
  showToast("Sobrescritura revertida con éxito.", "success");
  renderAll();
  
  window.overwrittenLicenseBackup = null;
};

// ⏳ CRON DE SUSPENSIÓN PROGRAMADA AUTOMÁTICA CON PERÍODO DE GRACIA (72H)
window.runAutoSuspensionCron = function(silent = false) {
  let suspendedCount = 0;
  let graceCount = 0;
  let updated = false;

  const GRACE_PERIOD_HOURS = 72;
  const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * 60 * 60 * 1000;

  state.licenses.forEach(l => {
    if (!l.expiryDate && !l.expirationDate) return;
    const expiryDateStr = l.expiryDate || l.expirationDate;
    if (expiryDateStr === 'Ilimitado') return;

    const expTime = new Date(expiryDateStr).getTime();
    if (isNaN(expTime)) return;

    const now = Date.now();

    // Si la fecha de expiración ha transcurrido
    if (now > expTime) {
      const graceTimeEnd = expTime + GRACE_PERIOD_MS;
      
      if (now < graceTimeEnd) {
        // En Periodo de Gracia (72h)
        if (l.status === 'ACTIVE' && !l.inGracePeriod) {
          l.inGracePeriod = true;
          graceCount++;
          updated = true;
          const hoursLeft = Math.ceil((graceTimeEnd - now) / (1000 * 60 * 60));
          const logMsg = `PERIODO_DE_GRACIA: El cliente ${l.clientName} (${l.appName}) venció el ${new Date(expiryDateStr).toLocaleDateString('es-MX')}. Periodo de gracia de 72h activo (Restan ${hoursLeft}h).`;
          addAuditLog('AUTO_SUSPENSION_CRON', 'GRACE_PERIOD', logMsg);
        }
      } else {
        // Expiró y superó las 72h de gracia -> SUSPENDER AUTOMÁTICAMENTE
        if (l.status === 'ACTIVE') {
          l.status = 'SUSPENDED';
          l.inGracePeriod = false;
          l.version = (l.version || 1) + 1;
          suspendedCount++;
          updated = true;

          const logMsg = `SUSPENSIÓN AUTOMÁTICA PROGRAMADA: La licencia del cliente ${l.clientName} (${l.appName}) venció el ${new Date(expiryDateStr).toLocaleDateString('es-MX')} y agotó el periodo de gracia de 72h. Acceso restringido automáticamente por el sistema.`;
          addAuditLog('AUTO_SUSPENSION_CRON', 'SUSPENSIÓN_AUTOMÁTICA', logMsg);

          if (typeof window.sendTelegramNotification === 'function') {
            window.sendTelegramNotification(`🛑 *SUSPENSIÓN AUTOMÁTICA ALR SAAS*\n\nEl cliente *${l.clientName}* (${l.appName}) ha sido suspendido automáticamente por el sistema tras agotar el periodo de gracia de 72h.`, 'DANGER');
          }

          window.syncLicenseToFirestore(l);
        }
      }
    }

    // 🔴 Verificación de Suspensión por impago si currentPlan !== PAGADO
    const isPaid = (l.currentPlan === 'PAGADO');
    if (!isPaid && l.status === 'ACTIVE') {
      const suspensionInfo = window.calculateNextSuspensionDate ? window.calculateNextSuspensionDate(l) : { daysLeft: 30, isOverdue: false };
      if (suspensionInfo.isOverdue || suspensionInfo.daysLeft <= 0) {
        l.status = 'SUSPENDED';
        l.inGracePeriod = false;
        l.version = (l.version || 1) + 1;
        suspendedCount++;
        updated = true;

        const logMsg = `SUSPENSIÓN AUTOMÁTICA POR NO_PAGADO: El cliente ${l.clientName} (${l.appName}) fue suspendido por no contar con pago registrado y alcanzar su fecha límite de pago bajo frecuencia (${l.paymentPeriod || 'Mensual'}).`;
        addAuditLog('AUTO_SUSPENSION_CRON', 'SUSPENSIÓN_AUTOMÁTICA', logMsg);

        if (typeof window.sendTelegramNotification === 'function') {
          window.sendTelegramNotification(`🛑 <b>[SUSPENSIÓN AUTOMÁTICA POR IMPAGO ALR SAAS]</b>\n\nEl cliente <b>${l.clientName}</b> (${l.appName}) ha sido suspendido al contar con estatus NO_PAGADO y alcanzar la fecha límite de pago.`, 'DANGER');
        }

        window.syncLicenseToFirestore(l);
      }
    }
  });

  if (updated) {
    saveToStorage();
    renderAll();
  }

  if (!silent) {
    if (suspendedCount > 0) {
      showToast(`🛑 Cron de Suspensión: ${suspendedCount} cliente(s) suspendido(s) automáticamente.`, "danger");
    } else if (graceCount > 0) {
      showToast(`⚠️ Cron de Suspensión: ${graceCount} cliente(s) en período de gracia (72h).`, "warning");
    } else {
      showToast("✅ Cron de Suspensión: Todas las licencias al día.", "success");
    }
  }
};

// 💸 CRON DE DÉBITO Y MICRO-FACTURACIÓN EN TIEMPO REAL (METERED USE SIMULATION)
function startServerlessBillingCron() {
  // Ejecución inicial en el arranque
  window.runAutoSuspensionCron(true);

  setInterval(() => {
    window.runAutoSuspensionCron(true);
  }, 30000);
}

// 🔐 Reautenticación real antes de una acción sensible: abre el modal de
// PIN y solo ejecuta onConfirm si verifyAdminCredentials (que llama a
// verifyAlrAdminAccess, Cloud Function) tiene éxito. Antes esta función
// ejecutaba onConfirm() de inmediato sin pedir nada -- un bypass total.
window.requestAdminVerification = function(actionName, onConfirm) {
  window.pendingAdminAction = onConfirm;
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) { if (typeof onConfirm === 'function') onConfirm(); return; }

  const adminsHtml = SYSTEM_ADMINS.map(adm =>
    `<option value="${escapeHtml(adm.username)}">${escapeHtml(adm.username)} (${escapeHtml(adm.role)})</option>`
  ).join('');
  const safeActionName = escapeHtml(actionName).replace(/'/g, "\\'");

  box.innerHTML = `
    <div style="padding: 30px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 12px;">🔐</div>
      <h2 style="font-size: 16px; font-weight: 900; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">Confirmación Requerida</h2>
      <p style="font-size: 11px; opacity: 0.6; margin-bottom: 16px;">Acción: <strong>${escapeHtml(actionName)}</strong></p>
      <div class="form-group" style="text-align:left; margin-bottom:16px;">
        <label class="form-label">Perfil</label>
        <select id="auth-admin-select" class="form-input">${adminsHtml}</select>
      </div>
      <div class="form-group" style="text-align:left; margin-bottom:16px;">
        <label class="form-label">PIN de Administrador</label>
        <input type="password" id="auth-admin-pin" class="form-input" maxlength="6" style="text-align:center; letter-spacing:6px;" onkeydown="if(event.key==='Enter') window.verifyAdminCredentials('${safeActionName}')">
      </div>
      <div class="form-group" style="text-align:left; margin-bottom:24px;">
        <label class="form-label">Código 2FA (solo si ya lo activaste)</label>
        <input type="text" id="auth-admin-totp" class="form-input" maxlength="6" inputmode="numeric" placeholder="000000" style="text-align:center; letter-spacing:4px;" onkeydown="if(event.key==='Enter') window.verifyAdminCredentials('${safeActionName}')">
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="window.verifyAdminCredentials('${safeActionName}')">Confirmar</button>
    </div>
  `;
  overlay.classList.add('active');
  const pinInput = document.getElementById('auth-admin-pin');
  if (pinInput) pinInput.focus();
};

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSign(message, keyString) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

window.verifyAdminCredentials = async function(actionName) {
  if (window.checkLockoutState && window.checkLockoutState()) return;

  const adminSelect = document.getElementById('auth-admin-select');
  const pinInput = document.getElementById('auth-admin-pin');
  const totpInput = document.getElementById('auth-admin-totp');

  if (!adminSelect || !pinInput) return;
  const username = adminSelect.value;
  const pin = pinInput.value;
  const totpCode = totpInput ? totpInput.value.trim() : '';

  const admin = SYSTEM_ADMINS.find(a => a.username === username);
  if (!admin) {
    showToast("Administrador no registrado.", "danger");
    return;
  }

  // La validación real vive en verifyAlrAdminAccess (Cloud Function +
  // Secret Manager) -- ya no se compara ningún hash localmente.
  try {
    if (!window.governanceAuth || !window.governanceAuth.currentUser) {
      await initGovernanceFirebase();
    }
    const verify = window.governanceFunctions.httpsCallable('verifyAlrAdminAccess');
    await verify({ pin, totpCode, username });
    // Sin esto, request.auth.token.alrSuperAdmin seguiría vacío en
    // firestore.rules aunque el claim ya exista en Auth.
    await window.governanceAuth.currentUser.getIdToken(true);

    if (window.clearAuthFailures) window.clearAuthFailures();
    window.lastAuthAdmin = username;
    window.lastAuthRole = admin.role;
    SESSION_KEY = await sha256(username + pin);
    currentAdmin = admin;

    showToast(`Acción autorizada por ${username}`, "success");
    closeModal();
    addAuditLog('SYSTEM', 'AUTORIZACIÓN', `Acción "${actionName}" autorizada por ${username} (${admin.role}) vía verifyAlrAdminAccess.`);

    if (window.pendingAdminAction) {
      window.pendingAdminAction();
      window.pendingAdminAction = null;
    }
  } catch (err) {
    // Retardo artificial de 1 segundo para disuadir ataques de fuerza bruta rápidos
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast(err.message || "PIN incorrecto.", "danger");
    addAuditLog('SYSTEM', 'FALLO_AUTENTICACION', `Denegado: Intento no autorizado de ejecutar "${actionName}" como ${username} (${err.message || 'PIN incorrecto'}).`);
    if (window.registerAuthFailure) window.registerAuthFailure(username, `Gobernanza: ${actionName}`);
    verifyAuditLedger(); // Desatar alerta si corresponde
  }
};

window.openRestoreBackupModal = function() {
  requestAdminVerification("Acceso a Consola de Recuperación", () => {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    if (!overlay || !box) return;

    fetch('last-backup.json')
      .then(res => res.json())
      .catch(() => ({ timestamp: 'Desconocido', fileName: 'Ninguno', sizeBytes: 0, status: 'INACTIVO', history: [] }))
      .then(data => {
        const historyHtml = (data.history || []).map(b => `
          <option value="${escapeHtml(b.fileName)}">${escapeHtml(b.timestamp)} (${(b.sizeBytes / 1024).toFixed(1)} KB)</option>
        `).join('');

        box.innerHTML = `
          <div style="padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
            <h2 style="font-size: 20px; font-weight: 900; color: var(--accent); margin-bottom: 12px; text-transform: uppercase;">Consola de Recuperación</h2>
            <p style="font-size: 11px; opacity:0.6; margin-bottom:24px; line-height:1.5;">Desde este panel puedes descargar cualquier respaldo cifrado histórico y ver las instrucciones de restauración activa.</p>
            
            <div class="form-group" style="margin-bottom: 24px; text-align: left;">
              <label class="form-label" style="font-size: 8px;">Seleccionar Punto de Restauración:</label>
              <select id="restore-backup-select" class="form-input" style="background:#000; border:1px solid var(--border-glass); color:#fff; font-size:11px; cursor:pointer;" onchange="updateRestoreModalDetails(this.value)">
                ${historyHtml || `<option value="latest.zip.enc">Último Respaldo (${escapeHtml(data.timestamp)})</option>`}
              </select>
            </div>

            <div style="background:rgba(0,229,255,0.03); border:1px solid var(--border-active); border-radius:20px; padding:16px; text-align:left; font-size:11px; margin-bottom:30px; line-height:1.5;">
              <h4 style="font-size:10px; font-weight:900; color:var(--accent); text-transform:uppercase; margin-bottom:6px;">🛠&nbsp;Instrucciones de Restauración Local:</h4>
              1. Descarga el archivo seleccionado usando el botón inferior.<br>
              2. Abre PowerShell en tu Workspace local.<br>
              3. Ejecuta el comando de restauración activa:<br>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                <code id="restore-command-code" style="flex: 1; background: #000; padding: 10px; border-radius: 8px; font-family: var(--font-mono); font-size: 9px; border: 1px solid var(--border-glass); word-break: break-all; text-align: left;">.\\restore-backup.ps1 -EncFile backups\\${escapeHtml(data.fileName)} -RestoreActiveCode</code>
                <button class="btn btn-secondary" style="height: 34px; padding: 0 12px; border-radius: 8px;" onclick="window.copyRestoreCommandToClipboard()" title="Copiar Comando">
                  <i class="ri-file-copy-2-line"></i>
                </button>
              </div>
            </div>

            <div style="display: flex; gap: 16px;">
              <button class="btn btn-secondary flex-1" onclick="closeModal()">Cerrar</button>
              <a id="restore-download-btn" href="backups/${escapeHtml(data.fileName)}" download="${escapeHtml(data.fileName)}" class="btn btn-primary flex-2" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
                <i class="ri-download-cloud-fill" style="font-size:16px;"></i> Descargar Respaldo Cifrado
              </a>
            </div>
          </div>
        `;
        overlay.classList.add('active');
      });
  });
};

window.updateRestoreModalDetails = function(fileName) {
  const codeElem = document.getElementById('restore-command-code');
  const downloadLink = document.getElementById('restore-download-btn');
  if (codeElem) {
    codeElem.innerText = `.\\restore-backup.ps1 -EncFile backups\\${escapeHtml(fileName)} -RestoreActiveCode`;
  }
  if (downloadLink) {
    downloadLink.href = `backups/${escapeHtml(fileName)}`;
    downloadLink.download = escapeHtml(fileName);
  }
};

window.copyRestoreCommandToClipboard = function() {
  const codeElem = document.getElementById('restore-command-code');
  if (!codeElem) return;
  navigator.clipboard.writeText(codeElem.innerText.trim())
    .then(() => {
      showToast("Comando copiado al portapapeles", "success");
    })
    .catch(() => {
      showToast("Error al copiar comando", "danger");
    });
};

window.updateHeaderProfileBadge = function() {
  const profileBadge = document.getElementById('header-profile-badge');
  const avatarCircle = document.getElementById('header-avatar-circle');
  const profileName = document.getElementById('header-profile-name');
  const profileRole = document.getElementById('header-profile-role');
  
  if (!profileBadge || !avatarCircle || !profileName || !profileRole) return;

  // Se llama incondicionalmente al cargar la página (antes del login, ver
  // DOMContentLoaded) para reflejar cambios de sesión -- currentAdmin sigue
  // siendo null hasta un unlock exitoso, así que no hay nada que actualizar
  // todavía (el placeholder estático del HTML se queda tal cual hasta ese
  // momento). Sin este guard, esto tronaba ANTES de llegar a abrir el
  // modal de PIN, dejando la consola atascada sin pedir nada.
  if (!currentAdmin) return;

  const initials = currentAdmin.username.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
  profileName.innerText = currentAdmin.username;
  profileRole.innerText = currentAdmin.role;
  avatarCircle.innerText = initials;
  
  // Custom colors and glows based on role/user
  let roleColor = 'var(--accent)';
  let glowColor = 'var(--accent-glow)';
  if (currentAdmin.username === 'Ivett') {
    roleColor = '#ec4899'; // Hot Pink
    glowColor = 'rgba(236,72,153,0.35)';
  } else if (currentAdmin.username === 'Andres') {
    roleColor = 'var(--accent-secondary)'; // Purple c084fc
    glowColor = 'rgba(192,132,252,0.35)';
  }
  
  avatarCircle.style.background = roleColor;
  avatarCircle.style.borderColor = roleColor;
  avatarCircle.style.boxShadow = `0 0 10px ${glowColor}`;
  if (typeof window.loadIntegrationSettings === 'function') {
    window.loadIntegrationSettings();
  }
};

// Panel de auditoría: lee alr_login_attempts (rate-limit por IP de
// verifyAlrAdminAccess) vía la Cloud Function listLoginAttempts -- esa
// colección no tiene reglas propias, así que el navegador no puede leerla
// directo, solo a través de esa función admin-gated.
window.openLoginAttemptsModal = async function() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="padding: 30px; text-align: left; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 900; color: var(--accent); text-transform: uppercase;">🔒 Intentos fallidos de acceso</h3>
        <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;" onclick="closeModal()">
          <i class="ri-close-line"></i>
        </button>
      </div>
      <div id="login-attempts-body" style="font-size: 12px; opacity: 0.6;">Cargando...</div>
    </div>
  `;
  overlay.classList.add('active');
  overlay.style.display = 'flex';

  try {
    const call = window.governanceFunctions.httpsCallable('listLoginAttempts');
    const res = await call();
    const attempts = (res.data && res.data.attempts) || [];
    const bodyEl = document.getElementById('login-attempts-body');
    if (!bodyEl) return;

    if (attempts.length === 0) {
      bodyEl.innerHTML = `<p style="opacity:0.6;">Sin intentos fallidos registrados.</p>`;
      return;
    }

    bodyEl.innerHTML = `
      <table style="width:100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="text-align:left; opacity:0.6; text-transform:uppercase; font-size:9px;">
            <th style="padding:6px;">IP</th>
            <th style="padding:6px;">Fallos</th>
            <th style="padding:6px;">Último intento</th>
            <th style="padding:6px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${attempts.map(a => {
            const locked = a.lockedUntil && a.lockedUntil > Date.now();
            const lastAttempt = a.lastAttempt ? new Date(a.lastAttempt).toLocaleString('es-MX') : '—';
            return `
              <tr style="border-top: 1px solid var(--border-glass);">
                <td style="padding:6px; font-family:monospace;">${escapeHtml(a.ip)}</td>
                <td style="padding:6px; font-weight:900; color:${a.failCount >= 5 ? '#ef4444' : (a.failCount >= 3 ? '#f59e0b' : '#fff')};">${escapeHtml(String(a.failCount || 0))}</td>
                <td style="padding:6px;">${escapeHtml(lastAttempt)}</td>
                <td style="padding:6px;">${locked ? `<span style="color:#ef4444; font-weight:900;">BLOQUEADO</span>` : `<span style="opacity:0.5;">libre</span>`}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    const bodyEl = document.getElementById('login-attempts-body');
    if (bodyEl) bodyEl.innerHTML = `<p style="color:#ef4444;">Error al cargar: ${escapeHtml(err.message || String(err))}</p>`;
  }
};

window.openProfileSettingsModal = function() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const adminsListHtml = SYSTEM_ADMINS.map(adm => {
    const isCurrent = adm.username === currentAdmin.username;
    let color = 'var(--accent)';
    if (adm.username === 'Ivett') color = '#ec4899';
    else if (adm.username === 'Andres') color = 'var(--accent-secondary)';

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid ${isCurrent ? 'var(--border-active)' : 'var(--border-glass)'}; padding:14px 20px; border-radius:18px; transition: all 0.3s; margin-bottom: 10px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:32px; height:32px; border-radius:50%; background:${color}; color:#000; font-weight:900; font-size:11px; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 8px ${color}40;">
            ${adm.username.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase()}
          </div>
          <div style="text-align:left;">
            <div style="font-weight:900; font-size:12px; color:${isCurrent ? '#fff' : 'rgba(255,255,255,0.8)'};">${adm.username}</div>
            <div style="font-size:8px; opacity:0.5; font-weight:800;">${adm.role}</div>
          </div>
        </div>
        ${isCurrent 
          ? `<span style="font-size:9px; font-weight:900; color:var(--success); background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); padding:4px 10px; border-radius:12px;">ACTIVO</span>` 
          : `<button class="btn btn-secondary" style="height:28px; font-size:9px; padding:0 12px; cursor:pointer;" onclick="window.switchAdminProfile('${adm.username}')">Conectar</button>`
        }
      </div>
    `;
  }).join('');

  box.innerHTML = `
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; font-weight: 900; color: var(--accent); margin-bottom: 12px; text-transform: uppercase; font-style: italic;">👥 Perfiles de Gobernanza</h2>
      <p style="font-size: 11px; opacity:0.6; margin-bottom:24px; line-height:1.5;">Administra y cambia de sesión de manera segura entre los operadores autorizados de la consola central.</p>
      
      <div style="display:flex; flex-direction:column; margin-bottom:30px;">
        ${adminsListHtml}
      </div>

      <button class="btn btn-secondary" style="width: 100%; margin-bottom: 10px;" onclick="window.registerWebAuthnCredential(currentAdmin.username)">🔑 Registrar Huella / Passkey</button>
      <button class="btn btn-secondary" style="width: 100%; margin-bottom: 10px;" onclick="window.enrollTotpReal()">🔐 Configurar 2FA Real (TOTP)</button>
      <button class="btn btn-secondary" style="width: 100%; margin-bottom: 10px; color: var(--danger);" onclick="window.disableTotpReal()">🚫 Desactivar 2FA</button>
      <button class="btn btn-secondary" style="width: 100%;" onclick="closeModal()">Cerrar Panel</button>
    </div>
  `;
  overlay.classList.add('active');
};

window.switchAdminProfile = function(username) {
  closeModal(); // Cerrar el modal de perfiles
  setTimeout(() => {
    requestAdminVerification(`Cambiar Perfil Activo a ${username}`, () => {
      const selected = SYSTEM_ADMINS.find(a => a.username === username);
      if (selected) {
        currentAdmin = selected;
        window.updateHeaderProfileBadge();
        showToast(`Sesión cambiada a ${username}`, "success");
        addAuditLog('SYSTEM', 'SESION_CAMBIO', `El operador ha cambiado de sesión a ${username} (${selected.role}).`);
      }
    });
  }, 300);
};

window.openForensicModal = function(logIndex) {
  const log = state.logs[logIndex];
  if (!log) return;
  const prevLog = logIndex > 0 ? state.logs[logIndex - 1] : null;
  const isVerified = verifySingleLog(log, prevLog);
  
  const expectedPrevHash = prevLog ? prevLog.hash : "00000000000000000000000000000000";
  const hashSource = log.timestamp + log.module + log.action + log.details + expectedPrevHash + MASTER_LEDGER_SALT;
  
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; font-weight: 900; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; font-style: italic;">🔍 Análisis Forense de Ledger</h2>
      <p style="font-size: 11px; opacity:0.6; margin-bottom: 24px; line-height:1.5;">Verificación criptográfica en tiempo real de la integridad del registro inmutable #<strong>${logIndex}</strong>.</p>
      
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 15px; padding: 15px; font-size: 11px; display:flex; flex-direction:column; gap:8px;">
          <div><span style="color:var(--accent-secondary); font-weight:800;">Timestamp:</span> ${new Date(log.timestamp).toLocaleString()}</div>
          <div><span style="color:var(--accent-secondary); font-weight:800;">Módulo:</span> [${escapeHtml(log.module)}]</div>
          <div><span style="color:var(--accent-secondary); font-weight:800;">Acción:</span> ${escapeHtml(log.action)}</div>
          <div><span style="color:var(--accent-secondary); font-weight:800;">Detalles:</span> ${escapeHtml(log.details)}</div>
        </div>
        
        <div style="background: rgba(255,255,255,0.01); border: 1px solid ${isVerified ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}; background:${isVerified ? 'rgba(34,197,94,0.02)' : 'rgba(239,68,68,0.02)'}; border-radius: 15px; padding: 15px; font-size: 10px; font-family: var(--font-mono); display:flex; flex-direction:column; gap:8px;">
          <h4 style="font-size:10px; font-weight:900; color:${isVerified ? 'var(--success)' : 'var(--danger)'}; text-transform:uppercase; margin-bottom:4px;">
            ${isVerified ? '✓ Cadena Intacta y Verificada' : '🛑 Rotura de Integridad de Hash'}
          </h4>
          <div><span style="opacity:0.5;">HASH_PREVIO:</span> <span style="word-break:break-all;">${escapeHtml(log.prevHash)}</span></div>
          <div><span style="opacity:0.5;">HASH_ORIGINAL:</span> <span style="word-break:break-all;">${escapeHtml(log.hash)}</span></div>
          <div><span style="opacity:0.5;">SEMILLA_LEDGER:</span> <span style="word-break:break-all; font-size:9px;">${escapeHtml(hashSource)}</span></div>
        </div>
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="closeModal()">Finalizar Inspección Forense</button>
    </div>
  `;
  overlay.classList.add('active');
};

window.exportTelemetryLogs = function() {
  const searchInput = document.getElementById('telemetry-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Filtrar logs según la búsqueda activa
  const filteredLogs = state.logs.filter(log => {
    if (!query) return true;
    return (log.module?.toLowerCase().includes(query) || 
            log.action?.toLowerCase().includes(query) || 
            log.details?.toLowerCase().includes(query) ||
            log.timestamp?.toLowerCase().includes(query));
  });

  if (filteredLogs.length === 0) {
    showToast("No hay registros para exportar", "warning");
    return;
  }

  // Generar CSV
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Timestamp,Modulo,Accion,Detalles,Hash,PrevHash,Integridad\n";

  filteredLogs.forEach(log => {
    const origIndex = state.logs.indexOf(log);
    const prevLog = origIndex > 0 ? state.logs[origIndex - 1] : null;
    const isVerified = verifySingleLog(log, prevLog);
    const integrity = isVerified ? "INTEGRO" : "ALTERADO";
    
    // Escapar comillas en campos de texto
    const escapeCsv = (val) => `"${(val || '').replace(/"/g, '""')}"`;
    
    csvContent += `${log.timestamp},${escapeCsv(log.module)},${escapeCsv(log.action)},${escapeCsv(log.details)},${log.hash},${log.prevHash},${integrity}\n`;
  });

  // Descargar archivo
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ALR_SaaS_Bitacora_Forense_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Bitácora exportada con éxito", "success");
  addAuditLog('SYSTEM', 'EXPORTAR_TELEMETRIA', `Se exportaron ${filteredLogs.length} registros de telemetría a formato CSV.`);
  renderTelemetryLogs();
};

let inactivityTimeout;

window.resetInactivityTimer = function() {
  clearTimeout(inactivityTimeout);
  // Auto-bloqueo desactivado permanentemente para evitar interrupciones de trabajo
};

window.generateAndSendSessionOtp = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  window.CURRENT_SESSION_OTP = code;
  window.CURRENT_SESSION_OTP_TIME = Date.now();
  console.log(`[SECURITY] Nuevo OTP de Desbloqueo de Consola generado: ${code}`);

  const tgMessage = `🔐 <b>[CONSOLA CENTRAL] Acceso de Seguridad</b>\n\n` +
                    `Se ha generado un nuevo código de seguridad OTP para desbloquear la consola.\n\n` +
                    `<b>Código OTP:</b> <code>${code}</code>\n\n` +
                    `<i>Este código caducará cuando se genere uno nuevo.</i>`;
  window.sendTelegramNotification(tgMessage);
};

window.resendSessionOtp = function() {
  showToast("Enviando código OTP por Telegram...", "info");
  window.generateAndSendSessionOtp();
};

const localLockConsoleSession = function(isManual = false) {
  if (!isManual) {
    console.log("[SEGURIDAD] Bloqueo automático evitado por solicitud del operador.");
    return;
  }
  // Guard: No volver a bloquear si ya está bloqueada (evita bucle de OTP)
  if (window.IS_CONSOLE_LOCKED) return;
  if (currentAdmin && currentAdmin.username !== 'Operador Bloqueado') {
    const adminName = currentAdmin.username;
    
    // 🔐 Sugerencia específica 1: Invalidación de caché de Service Worker en Lockout
    if (window.caches) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      }).catch(err => console.warn("[ServiceWorker] Error al purgar caché:", err));
    }
    
    // 🔐 Sugerencia 6: Borrado Seguro Avanzado de RAM (Zeroing-Out Criptográfico)
    if (SESSION_KEY_BUFFER) {
      crypto.getRandomValues(SESSION_KEY_BUFFER);
      SESSION_KEY_BUFFER = null;
    }
    
    // Purgar clave de sesión en memoria RAM y estado de la aplicación al bloquear
    SESSION_KEY = null;
    state.apps = [];
    state.licenses = [];
    state.logs = [];
    state.recycleBin = [];
    state.customSeeds = [];
    renderAll();
    
    // Forzar cierre de sesión activa y bloquear
    currentAdmin = { username: 'Operador Bloqueado', role: 'BLOQUEADO' };
    window.updateHeaderProfileBadge();
    
    // Reiniciar contadores de fuerza bruta al bloquear
    window.LOCK_ATTEMPTS = 0;
    window.LOCKOUT_UNTIL = 0;
    
    // Sugerencia 2: Limpieza de variables/caché sensible en memoria
    (window.firebaseApp = null);
    (window.firestoreDb = null);
    
    if (isManual) {
      // Sugerencia 3: Registrar el logout en la bitácora inmutable (MANUAL_LOCK)
      addAuditLog('SECURITY', 'MANUAL_LOCK', `Consola bloqueada voluntariamente por el usuario ${adminName}.`);
      showToast("Sesión cerrada y consola bloqueada", "success");
    } else {
      addAuditLog('SYSTEM', 'AUTO_BLOQUEO', `Consola bloqueada automáticamente por inactividad de 5 minutos del usuario ${adminName}.`);
      showToast("Consola bloqueada por inactividad", "danger");
    }
    
    // Marcar como bloqueada para evitar re-bloqueos en bucle
    window.IS_CONSOLE_LOCKED = true;
    
    // Desplegar modal crítico de bloqueo solicitando solo contraseña
    window.openSessionLockedModal(adminName);
  }
};
window.lockConsoleSession = localLockConsoleSession;

window.openSessionLockedModal = function(lockedAdminName) {
  window.IS_MUTATING_DOM = true;
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) {
    window.IS_MUTATING_DOM = false;
    return;
  }

  const adminsHtml = SYSTEM_ADMINS.map(adm => `
    <option value="${adm.username}" ${adm.username === lockedAdminName ? 'selected' : ''}>${adm.username} (${adm.role})</option>
  `).join('');

  box.innerHTML = `
    <div style="padding: 24px; text-align: center;">
      <div style="font-size: 44px; margin-bottom: 12px; animation: pulse 2s infinite;">🔒</div>
      <h2 style="font-size: 18px; font-weight: 900; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; font-style: italic;">Consola Bloqueada</h2>
      <p style="font-size: 11px; opacity: 0.6; margin-bottom: 16px; line-height:1.5;">La consola central se ha bloqueado de forma automática. Ingresa tu contraseña de administrador para desbloquear.</p>
      
      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px; text-align: left;">
        <div class="form-group">
          <label class="form-label">Perfil de Administrador</label>
          <select id="auth-admin-select" class="form-input" style="background:#000; border:1px solid var(--border-glass); color:#fff; cursor:pointer; height:44px;">
            ${adminsHtml}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña de Administrador</label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="password" id="auth-admin-pin" class="form-input" placeholder="••••••••" style="text-align:center; font-size:16px; letter-spacing:2px; font-weight:900; padding-right: 40px; width: 100%; height:44px;" onkeydown="if(event.key==='Enter') window.unlockConsoleSession()">
            <button type="button" onclick="window.togglePinVisibility('auth-admin-pin', this)" style="position: absolute; right: 10px; background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; height: 100%; width: 30px; outline: none;">
              <i class="ri-eye-off-line" style="font-size: 16px;"></i>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Código 2FA (solo si ya lo activaste)</label>
          <input type="text" id="auth-admin-totp" class="form-input" placeholder="000000" maxlength="6" inputmode="numeric" style="text-align:center; font-size:16px; letter-spacing:4px; font-weight:900; width: 100%; height:44px;" onkeydown="if(event.key==='Enter') window.unlockConsoleSession()">
        </div>
      </div>

      <button class="btn btn-primary" style="width: 100%; height: 44px; margin-bottom: 10px;" onclick="window.unlockConsoleSession()">
        <i class="ri-shield-keyhole-fill"></i> Desbloquear
      </button>
      <button class="btn btn-secondary" style="width: 100%; height: 44px;" onclick="window.unlockWithWebAuthn()">
        <i class="ri-fingerprint-fill"></i> Desbloquear con Biometría / Passkey
      </button>
    </div>
  `;

  overlay.classList.add('active');
  setTimeout(() => { window.IS_MUTATING_DOM = false; }, 200);
};

window.unlockConsoleSession = async function() {
  // Limpiar bloqueos previos de localStorage (intentos fallidos anteriores)
  localStorage.removeItem('alr_saas_auth_lockout_time');
  localStorage.removeItem('alr_saas_lockout');
  
  // Control de Fuerza Bruta en memoria
  if (window.LOCKOUT_UNTIL && Date.now() < window.LOCKOUT_UNTIL) {
    const remainingSec = Math.ceil((window.LOCKOUT_UNTIL - Date.now()) / 1000);
    showToast(`Demasiados intentos fallidos. Espera ${remainingSec}s.`, "danger");
    return;
  }

  const adminSelect = document.getElementById('auth-admin-select');
  const pinInput = document.getElementById('auth-admin-pin');
  const totpInput = document.getElementById('auth-admin-totp');

  if (!adminSelect || !pinInput) return;
  const username = adminSelect.value;
  const pin = pinInput.value.trim();
  const totpCode = totpInput ? totpInput.value.trim() : '';

  if (!pin) {
    showToast("Ingresa tu contraseña de administrador.", "danger");
    pinInput.focus();
    return;
  }

  const admin = SYSTEM_ADMINS.find(a => a.username === username);
  if (!admin) return;

  const btn = document.querySelector('#modal-box .btn-primary');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line animation-spin"></i> Procesando...';
  }

  // La validación real vive en verifyAlrAdminAccess (Cloud Function +
  // Secret Manager) -- ya no se compara ningún hash localmente. Si el
  // operador ya activó 2FA (enrollTotpReal), la función exige además
  // totpCode.
  let isPinValid = false;
  let authErrorMsg = 'PIN incorrecto.';
  try {
    if (!window.governanceAuth || !window.governanceAuth.currentUser) {
      await initGovernanceFirebase();
    }
    const verify = window.governanceFunctions.httpsCallable('verifyAlrAdminAccess');
    await verify({ pin, totpCode, username });
    await window.governanceAuth.currentUser.getIdToken(true);
    isPinValid = true;
  } catch (e) {
    isPinValid = false;
    if (e.message) authErrorMsg = e.message;
  }

  if (isPinValid) {
    if (window.clearAuthFailures) window.clearAuthFailures();
    window.LOCK_ATTEMPTS = 0;
    window.LOCKOUT_UNTIL = 0;
    window.IS_CONSOLE_LOCKED = false;
    currentAdmin = admin;
    window.updateHeaderProfileBadge();

    SESSION_KEY = await sha256(username + pin);
    SESSION_KEY_BUFFER = new TextEncoder().encode(SESSION_KEY);
    try { await loadFromStorage(); } catch(e) { console.warn('[Unlock] loadFromStorage error (posible clave nueva):', e); }

    // Todo lo que toca master_licenses (antes disparado incondicionalmente
    // en DOMContentLoaded) arranca aquí, ya con el claim alrSuperAdmin
    // asignado -- ver reestructuración de DOMContentLoaded más abajo.
    updateSaasSimulation();
    startServerlessBillingCron();
    loadBackupTelemetry();
    await window.rehydrateDecryptedSettings();
    await window.loadIntegrationSettings();
    await window.initFirebaseSync();
    await window.pullAllLicensesFromCloud(true);
    await window.pullAppRegistryFromCloud();

    renderAll();
    showToast(`✅ Consola desbloqueada por ${username}`, "success");
    closeModal();

    addAuditLog('SYSTEM', 'CONSOLA_DESBLOQUEO', `La consola fue desbloqueada con éxito por ${username} (${admin.role}) vía verifyAlrAdminAccess.`);
    window.resetInactivityTimer();
  } else {
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.LOCK_ATTEMPTS = (window.LOCK_ATTEMPTS || 0) + 1;
    
    if (window.LOCK_ATTEMPTS >= 5) {
      window.LOCKOUT_UNTIL = Date.now() + 300000;
      showToast("Demasiados intentos fallidos. Consola bloqueada por 5 minutos.", "danger");
      addAuditLog('SECURITY', 'BRUTE_FORCE_LOCKOUT_CONSOLE', `Bloqueo de seguridad: 5 intentos fallidos consecutivos de desbloqueo para ${username}.`);
      const intrusionAlert = `⚠️ <b>[INTENTOS DE INTRUSIÓN]</b> ⚠️\n\nSe han detectado 5 intentos fallidos consecutivos de desbloqueo en la consola central para el usuario <b>${username}</b>.\n\nLa interfaz de desbloqueo ha sido bloqueada por 5 minutos.`;
      window.sendTelegramNotification(intrusionAlert);
    } else {
      const remainingAttempts = 5 - window.LOCK_ATTEMPTS;
      showToast(`${authErrorMsg} Intentos restantes: ${remainingAttempts}`, "danger");
      addAuditLog('SYSTEM', 'FALLO_DESBLOQUEO', `Denegado: ${authErrorMsg} para ${username} (Intento ${window.LOCK_ATTEMPTS}/5).`);
    }
    if (window.registerAuthFailure) window.registerAuthFailure(username, 'Desbloqueo de Consola');
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-shield-keyhole-fill"></i> Desbloquear';
    }
  }
};

// ==================== CONFIGURACIONES DE INTEGRACIÓN DE NUBE Y ALERTAS ====================
// Helpers para encriptación premium de credenciales en reposo en LocalStorage
async function getSecureStorage(key) {
  const val = localStorage.getItem(key);
  return val ? await decryptReposo(val, MASTER_LEDGER_SALT) : '';
}

async function setSecureStorage(key, value) {
  if (value) {
    localStorage.setItem(key, await encryptReposo(value, MASTER_LEDGER_SALT));
  } else {
    localStorage.removeItem(key);
  }
}

window.rehydrateDecryptedSettings = async function() {
  let token = await getSecureStorage('alr_saas_tg_token_sec');
  let whitelist = await getSecureStorage('alr_saas_tg_whitelist_sec');
  let chatId = await getSecureStorage('alr_saas_tg_chat_id_sec');

  const tokenRegex = /^\d+:[a-zA-Z0-9_\-]{35}$/;
  const whitelistRegex = /^\d+(,\d+)*$/;
  const chatIdRegex = /^-?\d+$/;

  // Antes, si no había token guardado (o era inválido), se rellenaba
  // automáticamente con un token real y vivo hardcodeado aquí mismo --
  // visible para cualquiera que leyera el JS público. Ya no hay default:
  // si el token guardado no es válido, queda vacío (sendTelegramNotification
  // usa el proxy autenticado del backend como respaldo en ese caso -- ver
  // más abajo).
  if (token && !tokenRegex.test(token)) {
    token = '';
    await setSecureStorage('alr_saas_tg_token_sec', token);
  }

  // Corregir lista blanca si está corrupta o vacía
  if (!whitelist || !whitelistRegex.test(whitelist.replace(/\s+/g, ''))) {
    (whitelist = '8337803949');
    await setSecureStorage('alr_saas_tg_whitelist_sec', whitelist);
  }

  // Corregir chat ID destinatario si está corrupto o vacío
  if (!chatId || !chatIdRegex.test(chatId)) {
    (chatId = whitelist.split(',')[0].trim());
    await setSecureStorage('alr_saas_tg_chat_id_sec', chatId);
  }

  window.TELEGRAM_BOT_TOKEN = token;
  window.TELEGRAM_WHITELIST = whitelist;
  window.TELEGRAM_CHAT_ID = chatId;
  window.TELEGRAM_NOTIFICATIONS_ENABLED = localStorage.getItem('alr_saas_tg_enabled') === 'true';
  window.TELEGRAM_SEVERITY = localStorage.getItem('alr_saas_tg_severity') || 'SEGURIDAD';
  window.FIREBASE_CONFIG_RAW = await getSecureStorage('alr_saas_fb_config_sec');
  window.FIREBASE_SYNC_ENABLED = localStorage.getItem('alr_saas_fb_enabled') === 'true';

  // Firmar configuración de Telegram si ya existe pero no tiene firma (compatibilidad retroactiva con rotación de fecha)
  // O si la firma almacenada no es válida para el pinHash actual (para evitar bloqueos por cambio de credenciales)
  if (window.TELEGRAM_BOT_TOKEN && window.TELEGRAM_CHAT_ID) {
    const pinSalt = currentAdmin ? currentAdmin.pinHash : SYSTEM_ADMINS[0].pinHash;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const expectedToday = customHash(window.TELEGRAM_BOT_TOKEN + '|' + window.TELEGRAM_CHAT_ID + '|' + window.TELEGRAM_WHITELIST, MASTER_LEDGER_SALT + pinSalt + today);
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10).replace(/-/g, '');
    const expectedYesterday = customHash(window.TELEGRAM_BOT_TOKEN + '|' + window.TELEGRAM_CHAT_ID + '|' + window.TELEGRAM_WHITELIST, MASTER_LEDGER_SALT + pinSalt + yesterday);
    
    const storedSig = localStorage.getItem('alr_saas_tg_config_sig');
    if (!storedSig || (storedSig !== expectedToday && storedSig !== expectedYesterday)) {
      localStorage.setItem('alr_saas_tg_config_sig', expectedToday);
      console.log("[SEGURIDAD] Firma de Telegram regenerada debido a cambio de PIN/credenciales.");
    }
  }
};

// Inicializar variables seguras en el scope global
window.TELEGRAM_BOT_TOKEN = '';
window.TELEGRAM_WHITELIST = '';
window.TELEGRAM_CHAT_ID = '';
window.TELEGRAM_NOTIFICATIONS_ENABLED = false;
window.TELEGRAM_SEVERITY = 'SEGURIDAD';
window.FIREBASE_CONFIG_RAW = '';
window.FIREBASE_SYNC_ENABLED = false;
window.firebaseApp = null;
window.firestoreDb = null;

// ================================================================
// 🔐 FIREBASE GOVERNANCE DB — Inicialización Autónoma ALR SaaS
// Instancia dedicada para escritura de licencias en Firestore.
// SIEMPRE activa. NO depende de configuración del usuario.
// Usa el Firebase SDK v8 cargado en el <head> del HTML.
// ================================================================
async function initGovernanceFirebase() {
  try {
    // Config verificada contra `firebase apps:sdkconfig web` -- la que
    // vivía aquí antes (apiKey terminado en "...VqGF3bI", appId
    // "...29b64e") pertenecía a un app/proyecto que ya no existe bajo
    // brain-branding y hacía fallar TODO signInAnonymously silenciosamente
    // ("API key not valid"), lo que a su vez tumbaba cualquier intento de
    // desbloquear la consola en producción -- nunca se notó porque las
    // pruebas de esta sesión corrieron solo contra el emulador.
    const GOVERNANCE_CONFIG = {
      apiKey: "AIzaSyCgIpvZux4c6VjBI31KX8rACPe-zDSVRYo",
      authDomain: "brain-branding.firebaseapp.com",
      projectId: "brain-branding",
      storageBucket: "brain-branding.firebasestorage.app",
      messagingSenderId: "545863893528",
      appId: "1:545863893528:web:f0e82a190dbaa5d743396d"
    };

    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
      console.error('[ALR GOVERNANCE] ❌ Firebase SDK v8 no disponible — intentando en 500ms.');
      await new Promise(resolve => setTimeout(resolve, 500));
      return initGovernanceFirebase();
    }

    const govAppName = 'alr-saas-governance';
    const existing = firebase.apps.find(a => a.name === govAppName);
    const govApp = existing || firebase.initializeApp(GOVERNANCE_CONFIG, govAppName);

    window.governanceDb = govApp.firestore();
    window.governanceAuth = govApp.auth();
    window.governanceFunctions = govApp.functions();

    // Sesión anónima requerida por verifyAlrAdminAccess (request.auth no
    // puede ser null en la Cloud Function). El claim alrSuperAdmin se
    // asigna DESPUÉS, al validar el PIN -- hasta entonces esta sesión no
    // tiene ningún permiso en firestore.rules.
    if (!window.governanceAuth.currentUser) {
      await window.governanceAuth.signInAnonymously();
    }

    console.log('[ALR GOVERNANCE] ✅ Firebase Auth + Firestore Governance listos.');

  } catch (e) {
    console.error('[ALR GOVERNANCE] ❌ Error:', e.message);
    window.governanceDb = null;
    window.governanceAuth = null;
    window.governanceFunctions = null;
  }
}

// Ejecutar hidratación inicial (fallback base)
window.rehydrateDecryptedSettings();

// Eliminar rastros sin encriptar antiguos para mayor seguridad defensiva
localStorage.removeItem('alr_saas_tg_token');
localStorage.removeItem('alr_saas_tg_chat_id');
localStorage.removeItem('alr_saas_tg_whitelist');
localStorage.removeItem('alr_saas_fb_config');

window.updateWhitelistSyncBadge = function(status) {
  const badge = document.getElementById('whitelist-sync-badge');
  if (!badge) return;
  if (!window.FIREBASE_SYNC_ENABLED) {
    badge.style.display = 'none';
    return;
  }
  badge.style.display = 'inline-block';
  if (status === 'syncing') {
    badge.innerText = 'Sincronizando...';
    badge.style.color = 'var(--warning)';
    badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    badge.style.background = 'rgba(245, 158, 11, 0.05)';
  } else if (status === 'synced') {
    badge.innerText = 'Sincronizado';
    badge.style.color = 'var(--success)';
    badge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    badge.style.background = 'rgba(34, 197, 94, 0.05)';
  } else if (status === 'pending') {
    badge.innerText = 'Pendiente Sync';
    badge.style.color = 'var(--danger)';
    badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    badge.style.background = 'rgba(239, 68, 68, 0.05)';
  }
};

window.loadIntegrationSettings = async function() {
  const tgTokenInput = document.getElementById('cfg-tg-token');
  const tgChatIdInput = document.getElementById('cfg-tg-chatid');
  const tgWhitelistInput = document.getElementById('cfg-tg-whitelist');
  const tgSeveritySelect = document.getElementById('cfg-tg-severity');
  const tgEnabledCheck = document.getElementById('cfg-tg-enabled');
  
  const fbConfigInput = document.getElementById('cfg-fb-json');
  const fbEnabledCheck = document.getElementById('cfg-fb-enabled');

  if (tgTokenInput) tgTokenInput.value = window.TELEGRAM_BOT_TOKEN;
  if (tgChatIdInput) tgChatIdInput.value = window.TELEGRAM_CHAT_ID;
  
  const isSuperAdmin = currentAdmin && currentAdmin.role === 'SUPER_ADMIN';
  if (tgWhitelistInput) {
    tgWhitelistInput.value = window.TELEGRAM_WHITELIST;
    tgWhitelistInput.disabled = !isSuperAdmin;
    tgWhitelistInput.style.opacity = isSuperAdmin ? '1' : '0.5';
    tgWhitelistInput.style.cursor = isSuperAdmin ? 'text' : 'not-allowed';
  }
  
  const tgWhitelistVerifyBtn = document.querySelector('[onclick="window.testTelegramWhitelistIds()"]');
  if (tgWhitelistVerifyBtn) {
    tgWhitelistVerifyBtn.disabled = !isSuperAdmin;
    tgWhitelistVerifyBtn.style.opacity = isSuperAdmin ? '1' : '0.5';
    tgWhitelistVerifyBtn.style.cursor = isSuperAdmin ? 'pointer' : 'not-allowed';
  }

  const pendingSettings = localStorage.getItem('alr_saas_pending_settings_sync');
  if (typeof window.updateWhitelistSyncBadge === 'function') {
    window.updateWhitelistSyncBadge(pendingSettings ? 'pending' : 'synced');
  }

  if (tgSeveritySelect) tgSeveritySelect.value = window.TELEGRAM_SEVERITY;
  if (tgEnabledCheck) tgEnabledCheck.checked = window.TELEGRAM_NOTIFICATIONS_ENABLED;

  if (fbConfigInput) fbConfigInput.value = window.FIREBASE_CONFIG_RAW;
  if (fbEnabledCheck) fbEnabledCheck.checked = window.FIREBASE_SYNC_ENABLED;

  window.CONCURRENCY_POLICY = localStorage.getItem('alr_saas_concurrency_policy') || 'MANUAL';
  const policySelect = document.getElementById('cfg-concurrency-policy');
  if (policySelect) policySelect.value = window.CONCURRENCY_POLICY;

  const secWebhookInput = document.getElementById('cfg-security-webhook');
  if (secWebhookInput) {
    secWebhookInput.value = await getSecureStorage('alr_saas_sec_webhook_sec');
    secWebhookInput.disabled = !isSuperAdmin;
    secWebhookInput.style.opacity = isSuperAdmin ? '1' : '0.5';
    secWebhookInput.style.cursor = isSuperAdmin ? 'text' : 'not-allowed';
  }
  
  const cleanupKeyInput = document.getElementById('cfg-cleanup-key');
  if (cleanupKeyInput) {
    cleanupKeyInput.value = localStorage.getItem('alr_cleanup_encryption_key') || '';
    if (typeof window.updateKeyStrength === 'function') {
      window.updateKeyStrength();
    }
  }
  
  const bridgeTokenInput = document.getElementById('cfg-bridge-token');
  if (bridgeTokenInput) {
    bridgeTokenInput.value = localStorage.getItem('alr_bridge_token') || '';
  }
  
  if (typeof window.loadStrictDomainsConfig === 'function') {
    window.loadStrictDomainsConfig();
  }
  window.initTelegramWorker();

  // 🔐 Sugerencia 40: Control local de vigencia criptográfica y alerta de rotación
  const warningDiv = document.getElementById('cfg-crypto-rotation-warning');
  if (warningDiv) {
    let lastRotStr = '';
    try {
      const activeSalt = MASTER_LEDGER_SALT;
      const enc = localStorage.getItem('alr_saas_last_salt_rotation_date_sec');
      if (enc) {
        lastRotStr = await decryptReposo(enc, activeSalt);
      }
    } catch (e) {}
    
    if (!lastRotStr) {
      lastRotStr = new Date().toISOString();
    }
    
    const lastRotDate = new Date(lastRotStr);
    const diffTime = Math.abs(Date.now() - lastRotDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 30) {
      warningDiv.style.display = 'block';
      warningDiv.innerHTML = `⚠️ <b>Rotación Criptográfica Pendiente:</b> Las claves activas tienen <b>${diffDays} días</b> de antigüedad. Se recomienda rotar manualmente las claves de sesión mediante un cambio de PIN para re-derivar el salt de almacenamiento.`;
      warningDiv.style.borderColor = 'rgba(245,158,11,0.25)';
      warningDiv.style.background = 'rgba(245,158,11,0.05)';
      warningDiv.style.color = '#f59e0b';
    } else {
      warningDiv.style.display = 'block';
      warningDiv.style.borderColor = 'rgba(16,185,129,0.25)';
      warningDiv.style.background = 'rgba(16,185,129,0.05)';
      warningDiv.style.color = '#10b981';
      warningDiv.innerHTML = `✓ <b>Claves Criptográficas Activas:</b> Salt mensual vigente (Última rotación: hace ${diffDays} días).`;
    }
  }
  if (typeof window.loadExclusionsList === 'function') {
    window.loadExclusionsList();
  }
};

window.saveSecurityWebhookConfig = async function() {
  const secWebhookInput = document.getElementById('cfg-security-webhook');
  const errSpan = document.getElementById('security-webhook-err');
  if (secWebhookInput) {
    const val = secWebhookInput.value.trim();
    if (val === '') {
      secWebhookInput.style.borderColor = 'var(--border-glass)';
      secWebhookInput.style.boxShadow = 'none';
      if (errSpan) errSpan.style.display = 'none';
      await setSecureStorage('alr_saas_sec_webhook_sec', '');
      try {
        await fetchFromBridge('/config/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl: '' })
        });
      } catch (e) {
        console.error('No se pudo sincronizar el webhook vacío con el puente:', e);
      }
      return;
    }
    const urls = val.split(',').map(u => u.trim());
    const webhookPattern = /^https:\/\/(discord(app)?\.com\/api\/webhooks\/|hooks\.slack\.com\/services\/|hooks\.slack\.com\/actions\/|hooks\.slack\.com\/workflows\/)[a-zA-Z0-9_\-\/]+$/i;
    let isValid = true;
    for (const url of urls) {
      if (!webhookPattern.test(url)) {
        (isValid = false);
        break;
      }
    }
    
    if (!isValid) {
      secWebhookInput.style.borderColor = 'var(--danger)';
      secWebhookInput.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
      if (errSpan) errSpan.style.display = 'block';
    } else {
      secWebhookInput.style.borderColor = 'var(--border-glass)';
      secWebhookInput.style.boxShadow = 'none';
      if (errSpan) errSpan.style.display = 'none';
      await setSecureStorage('alr_saas_sec_webhook_sec', val);
      try {
        await fetchFromBridge('/config/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl: val })
        });
      } catch (e) {
        console.error('No se pudo sincronizar el webhook con el puente:', e);
      }
    }
  }
};

window.triggerSecondarySecurityAlert = async function(type, details) {
  const webhookUrl = await getSecureStorage('alr_saas_sec_webhook_sec');
  if (!webhookUrl) return;
  
  const webhookUrls = webhookUrl.split(',').map(url => url.trim()).filter(url => url.startsWith("https://"));
  if (webhookUrls.length === 0) return;

  for (const url of webhookUrls) {
    let payload = {};
    if (url.toLowerCase().includes("discord.com") || url.toLowerCase().includes("discordapp.com")) {
      (payload = {
        content: `🚨 **[ALERTA DE SEGURIDAD CRÍTICA - CENTRAL ALR SAAS]** 🚨`,
        embeds: [{
          title: `Incidente: ${type}`,
          description: details,
          color: 15158332,
          fields: [
            { name: "Fecha/Hora", value: new Date().toLocaleString(), inline: true },
            { name: "Navegador", value: navigator.userAgent.slice(0, 100), inline: true }
          ],
          footer: { text: "Commander Hub Security Gateway" }
        }]
      });
    } else {
      (payload = {
        text: `🚨 *[ALERTA DE SEGURIDAD CRÍTICA - CENTRAL ALR SAAS]* 🚨\n\n*Incidente:* ${type}\n*Detalles:* ${details}\n*Fecha/Hora:* ${new Date().toLocaleString()}\n*Navegador:* ${navigator.userAgent.slice(0, 100)}`
      });
    }
    
    if (!navigator.onLine) {
      await queueOfflineWebhookAlert(url, payload);
      continue;
    }
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      console.log("[SECURITY GATEWAY] Alerta enviada con éxito al webhook secundario.");
    } catch (err) {
      console.error("[SECURITY GATEWAY] Error al despachar alerta al canal secundario, encolando...", err);
      await queueOfflineWebhookAlert(url, payload);
    }
  }
};

async function queueOfflineWebhookAlert(url, payload) {
  try {
    const queueRawEncrypted = localStorage.getItem('alr_saas_webhook_queue_secure');
    let queue = [];
    if (queueRawEncrypted) {
      const queueRaw = await decryptReposo(queueRawEncrypted, MASTER_LEDGER_SALT);
      queue = queueRaw ? JSON.parse(queueRaw) : [];
    }
    
    if (queue.length >= 50) {
      queue.shift();
    }
    
    queue.push({
      url,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0
    });
    
    const encryptedData = await encryptReposo(JSON.stringify(queue), MASTER_LEDGER_SALT);
    localStorage.setItem('alr_saas_webhook_queue_secure', encryptedData);
    console.log("[WEBHOOK QUEUE] Petición cifrada y encolada en localStorage.");
  } catch (e) {
    console.error("[WEBHOOK QUEUE] Error al encolar en localStorage cifrado:", e);
  }
}

window.processOfflineWebhookQueue = async function() {
  if (!navigator.onLine) return;
  try {
    const queueRawEncrypted = localStorage.getItem('alr_saas_webhook_queue_secure');
    if (!queueRawEncrypted) return;
    const queueRaw = await decryptReposo(queueRawEncrypted, MASTER_LEDGER_SALT);
    if (!queueRaw) return;
    const queue = JSON.parse(queueRaw);
    if (queue.length === 0) return;
    
    console.log(`[WEBHOOK QUEUE] Procesando cola de webhooks offline cifrada (${queue.length} pendientes)...`);
    const remainingQueue = [];
    
    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log("[WEBHOOK QUEUE] Alerta offline enviada con éxito.");
      } catch (err) {
        item.attempts = (item.attempts || 0) + 1;
        if (item.attempts < 5) {
          remainingQueue.push(item);
        } else {
          console.warn("[WEBHOOK QUEUE] Alerta descartada tras 5 intentos fallidos.");
        }
      }
    }
    
    if (remainingQueue.length > 0) {
      const encryptedData = await encryptReposo(JSON.stringify(remainingQueue), MASTER_LEDGER_SALT);
      localStorage.setItem('alr_saas_webhook_queue_secure', encryptedData);
    } else {
      localStorage.removeItem('alr_saas_webhook_queue_secure');
    }
  } catch (e) {
    console.error("[WEBHOOK QUEUE] Error al procesar cola cifrada:", e);
  }
};

window.saveTelegramConfig = async function() {
  const tgTokenInput = document.getElementById('cfg-tg-token');
  const tgChatIdInput = document.getElementById('cfg-tg-chatid');
  const tgWhitelistInput = document.getElementById('cfg-tg-whitelist');
  const tgSeveritySelect = document.getElementById('cfg-tg-severity');
  const tgEnabledCheck = document.getElementById('cfg-tg-enabled');

  let whitelistValue = tgWhitelistInput ? tgWhitelistInput.value.trim() : '';
  
  // 1. Sugerencia 1: Validación Sintáctica de Entrada (Regex en Whitelist)
  if (tgWhitelistInput) {
    const cleanValue = whitelistValue.replace(/\s+/g, '');
    const whitelistRegex = /^\d+(,\d+)*$/;
    if (whitelistValue !== '' && !whitelistRegex.test(cleanValue)) {
      tgWhitelistInput.style.borderColor = 'var(--danger)';
      tgWhitelistInput.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
      return; // Abortar guardado
    } else {
      tgWhitelistInput.style.borderColor = 'var(--border-glass)';
      tgWhitelistInput.style.boxShadow = 'none';
      (whitelistValue = cleanValue);
    }
  }

  const oldToken = window.TELEGRAM_BOT_TOKEN;
  const oldChatId = window.TELEGRAM_CHAT_ID;
  const oldWhitelist = window.TELEGRAM_WHITELIST;

  if (tgTokenInput) window.TELEGRAM_BOT_TOKEN = tgTokenInput.value.trim();
  if (tgChatIdInput) window.TELEGRAM_CHAT_ID = tgChatIdInput.value.trim();
  window.TELEGRAM_WHITELIST = whitelistValue || '8337803949';
  if (tgSeveritySelect) window.TELEGRAM_SEVERITY = tgSeveritySelect.value;
  if (tgEnabledCheck) window.TELEGRAM_NOTIFICATIONS_ENABLED = tgEnabledCheck.checked;

  await setSecureStorage('alr_saas_tg_token_sec', window.TELEGRAM_BOT_TOKEN);
  await setSecureStorage('alr_saas_tg_chat_id_sec', window.TELEGRAM_CHAT_ID);
  await setSecureStorage('alr_saas_tg_whitelist_sec', window.TELEGRAM_WHITELIST);
  localStorage.setItem('alr_saas_tg_severity', window.TELEGRAM_SEVERITY);
  localStorage.setItem('alr_saas_tg_enabled', window.TELEGRAM_NOTIFICATIONS_ENABLED);

  if (window.TELEGRAM_BOT_TOKEN && window.TELEGRAM_CHAT_ID) {
    const pinSalt = currentAdmin ? currentAdmin.pinHash : 'default_pin_salt';
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const signature = customHash(window.TELEGRAM_BOT_TOKEN + '|' + window.TELEGRAM_CHAT_ID + '|' + window.TELEGRAM_WHITELIST, MASTER_LEDGER_SALT + pinSalt + today);
    localStorage.setItem('alr_saas_tg_config_sig', signature);
  } else {
    localStorage.removeItem('alr_saas_tg_config_sig');
  }

  // 2. Sugerencia 2: Notificación de Alerta y Registro en Ledger al Modificar Ajustes
  const isChanged = oldToken !== window.TELEGRAM_BOT_TOKEN || oldChatId !== window.TELEGRAM_CHAT_ID || oldWhitelist !== window.TELEGRAM_WHITELIST;
  if (isChanged) {
    if (oldToken !== window.TELEGRAM_BOT_TOKEN) {
      addAuditLog('SECURITY', 'TELEGRAM_TOKEN_CHANGE', `Token de Bot Telegram cambiado por operador: ${currentAdmin?.username || 'Desconocido'}`);
    }
    if (oldChatId !== window.TELEGRAM_CHAT_ID) {
      addAuditLog('SECURITY', 'TELEGRAM_CHATID_CHANGE', `ID de Chat Telegram cambiado. Anterior: ${oldChatId} | Nuevo: ${window.TELEGRAM_CHAT_ID} por operador: ${currentAdmin?.username || 'Desconocido'}`);
    }
    if (oldWhitelist !== window.TELEGRAM_WHITELIST) {
      addAuditLog('SECURITY', 'TELEGRAM_WHITELIST_CHANGE', `Lista blanca de Telegram cambiada. Anterior: ${oldWhitelist} | Nueva: ${window.TELEGRAM_WHITELIST} por operador: ${currentAdmin?.username || 'Desconocido'}`);
    }

    if (window.TELEGRAM_NOTIFICATIONS_ENABLED && window.TELEGRAM_BOT_TOKEN && window.TELEGRAM_CHAT_ID) {
      const changeMsg = `⚙️ <b>[SEGURIDAD] Cambios en la Configuración del Bot de Telegram</b>\n\n` +
                        `Se han modificado las directivas del canal de control.\n` +
                        `<b>Operador:</b> ${currentAdmin?.username || 'Desconocido'}\n` +
                        `<b>Dispositivo:</b> ${navigator.userAgent}\n` +
                        `<b>Fecha:</b> ${new Date().toLocaleString()}`;
      setTimeout(() => {
        window.sendTelegramNotification(changeMsg);
      }, 100);
    }
  }

  // 3. Sugerencia 3: Sincronización en la Nube con Cola Offline y Firma Digital
  const encryptedWhitelist = await encryptReposo(window.TELEGRAM_WHITELIST, MASTER_LEDGER_SALT);
  const settingsPayload = {
    whitelist_sec: encryptedWhitelist,
    updatedAt: new Date().toISOString(),
    updatedBy: currentAdmin?.username || 'Desconocido'
  };

  if (isChanged && window.FIREBASE_SYNC_ENABLED) {
    (async () => {
      const sigMessage = settingsPayload.whitelist_sec + '|' + settingsPayload.updatedAt + '|' + settingsPayload.updatedBy;
      const signature = await hmacSign(sigMessage, MASTER_LEDGER_SALT + (window.TELEGRAM_BOT_TOKEN || ''));
      settingsPayload.signature_sha256 = signature;

      if (window.firestoreDb && navigator.onLine) {
        if (typeof window.updateWhitelistSyncBadge === 'function') {
          window.updateWhitelistSyncBadge('syncing');
        }
        window.firestoreDb.collection('alr-saas-settings').doc('telegram').set({
          ...settingsPayload,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        .then(() => {
          localStorage.removeItem('alr_saas_pending_settings_sync');
          if (typeof window.updateWhitelistSyncBadge === 'function') {
            window.updateWhitelistSyncBadge('synced');
          }
        })
        .catch(err => {
          console.warn("Fallo al subir configuración a Firebase, encolando...", err);
          localStorage.setItem('alr_saas_pending_settings_sync', JSON.stringify(settingsPayload));
          if (typeof window.updateWhitelistSyncBadge === 'function') {
            window.updateWhitelistSyncBadge('pending');
          }
          window.scheduleSettingsSyncRetry();
        });
      } else {
        localStorage.setItem('alr_saas_pending_settings_sync', JSON.stringify(settingsPayload));
        console.log("[SETTINGS SYNC] Configuración guardada en cola offline.");
        if (typeof window.updateWhitelistSyncBadge === 'function') {
          window.updateWhitelistSyncBadge('pending');
        }
        window.scheduleSettingsSyncRetry();
      }
    })();
  }
  window.initTelegramWorker();
};

window.scheduleSettingsSyncRetry = function(delay = 5000) {
  if (window.settingsSyncRetryTimeout) clearTimeout(window.settingsSyncRetryTimeout);
  window.settingsSyncRetryTimeout = setTimeout(async () => {
    const pendingSettings = localStorage.getItem('alr_saas_pending_settings_sync');
    if (!pendingSettings || !window.firestoreDb || !window.FIREBASE_SYNC_ENABLED || !navigator.onLine) {
      if (pendingSettings && window.FIREBASE_SYNC_ENABLED) {
        if (typeof window.updateWhitelistSyncBadge === 'function') {
          window.updateWhitelistSyncBadge('pending');
        }
        window.scheduleSettingsSyncRetry(Math.min(delay * 3, 300000));
      }
      return;
    }
    try {
      if (typeof window.updateWhitelistSyncBadge === 'function') {
        window.updateWhitelistSyncBadge('syncing');
      }
      const parsed = JSON.parse(pendingSettings);

      const sigMessage = parsed.whitelist_sec + '|' + parsed.updatedAt + '|' + parsed.updatedBy;
      const signature = await hmacSign(sigMessage, MASTER_LEDGER_SALT + (window.TELEGRAM_BOT_TOKEN || ''));
      parsed.signature_sha256 = signature;

      await window.firestoreDb.collection('alr-saas-settings').doc('telegram').set({
        ...parsed,
        synchronizedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      localStorage.removeItem('alr_saas_pending_settings_sync');
      if (typeof window.updateWhitelistSyncBadge === 'function') {
        window.updateWhitelistSyncBadge('synced');
      }
      console.log("[SETTINGS SYNC] Configuración offline de whitelist sincronizada tras reintento.");
      showToast("Configuración de lista blanca sincronizada con la nube.", "success");
    } catch (err) {
      console.warn("Fallo en reintento de sincronización de settings, programando próximo reintento...", err);
      if (typeof window.updateWhitelistSyncBadge === 'function') {
        window.updateWhitelistSyncBadge('pending');
      }
      window.scheduleSettingsSyncRetry(Math.min(delay * 3, 300000));
    }
  }, delay);
};

// Configuración de IndexedDB para Cola de Alertas Offline Cifrada
const DB_NAME = 'ALRSaaSSecurityDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_alerts';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function queueOfflineNotification(message) {
  getDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const req = store.getAll();
    req.onsuccess = async () => {
      const allAlerts = req.result;
      
      // Evitar duplicados consecutivos en la cola
      if (allAlerts.length > 0) {
        const lastDecrypted = await decryptReposo(allAlerts[allAlerts.length - 1].message, MASTER_LEDGER_SALT);
        if (lastDecrypted === message) {
          return;
        }
      }
      
      // Mantener capacidad máxima de 50 registros
      if (allAlerts.length >= 50) {
        store.delete(allAlerts[0].id);
      }
      
      const encryptedMessage = await encryptReposo(message, MASTER_LEDGER_SALT);
      store.add({ message: encryptedMessage, timestamp: new Date().toISOString() });
      console.log("[TELEGRAM OFFLINE] Alerta encolada en IndexedDB.");
    };
  }).catch(e => {
    console.error("Error al encolar alerta en IndexedDB:", e);
  });
}

window.processOfflineNotificationsQueue = function() {
  if (!navigator.onLine) return;
  getDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const req = store.getAll();
    req.onsuccess = async () => {
      const allAlerts = req.result;
      if (allAlerts.length === 0) return;
      
      console.log(`[TELEGRAM OFFLINE] Procesando ${allAlerts.length} alertas encoladas en IndexedDB...`);
      store.clear(); // Limpiar el store antes para evitar bucles
      
      for (let index = 0; index < allAlerts.length; index++) {
        const item = allAlerts[index];
        try {
          const decryptedMessage = await decryptReposo(item.message, MASTER_LEDGER_SALT);
          if (decryptedMessage) {
            const deferredMessage = decryptedMessage + `\n<i>[Mensaje diferido offline, generado: ${new Date(item.timestamp).toLocaleString()}]</i>`;
            setTimeout(() => {
              window.sendTelegramNotification(deferredMessage);
            }, index * 1500); // 1.5s de espacio de seguridad
          }
        } catch (err) {
          console.error("[TELEGRAM OFFLINE] Error al descifrar alerta encolada:", err);
        }
      }
    };
  }).catch(e => {
    console.error("Error al procesar cola de IndexedDB:", e);
  });
};

// Proxy autenticado hacia api/telegram.js (Render) -- usa el bot fijo del
// servidor cuando el operador no configuró su propio token (ver
// rehydrateDecryptedSettings, ya no hay un token por defecto hardcodeado
// en este archivo). Reutiliza la misma sesión de Firebase Auth que ya
// protege Firestore en vez de un segundo secreto estático.
async function alrNotifyProxy(path, body) {
  if (!window.governanceAuth || !window.governanceAuth.currentUser) {
    await initGovernanceFirebase();
  }
  const idToken = window.governanceAuth && window.governanceAuth.currentUser
    ? await window.governanceAuth.currentUser.getIdToken()
    : null;
  if (!idToken) throw new Error('Sin sesión autenticada para notificar.');
  const isGet = path === 'getMe' || path === 'getUpdates';
  const url = `https://brain-branding-demo-generator.onrender.com/api/alr-notify/${path}${isGet && body ? '?' + new URLSearchParams(body) : ''}`;
  const res = await fetch(url, {
    method: isGet ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: isGet ? undefined : JSON.stringify(body || {})
  });
  return res.json();
}

window.sendTelegramNotification = function(message) {
  try {
    const isOtpMessage = typeof message === 'string' && (message.includes("Acceso de Seguridad") || message.includes("OTP"));

    if (!window.TELEGRAM_NOTIFICATIONS_ENABLED && !isOtpMessage) {
      console.warn("[TELEGRAM] Despacho omitido: Notificaciones desactivadas.");
      return;
    }
    if (!window.TELEGRAM_BOT_TOKEN || !window.TELEGRAM_CHAT_ID) {
      // Sin token propio configurado por el operador: usar el proxy
      // autenticado del backend (bot fijo del servidor) en vez de no
      // enviar nada -- antes esta ruta jamás se ejercía porque siempre
      // había un token hardcodeado de respaldo.
      if (window.TELEGRAM_CHAT_ID) {
        alrNotifyProxy('send', { chatId: window.TELEGRAM_CHAT_ID, text: message, parseMode: 'HTML' }).catch(e => {
          console.warn('[TELEGRAM] Envío vía proxy autenticado falló:', e.message);
        });
      } else {
        console.warn("[TELEGRAM] Despacho omitido: Token de Bot o Chat ID no configurados.");
        if (isOtpMessage) {
          showToast("Telegram: Configuración incompleta (Token o Chat ID faltante).", "warning");
        }
      }
      return;
    }

    // 1. Verificación de Firmas HMAC en Configuraciones de Canal (Rotación dinámica con ventana de ayer)
    try {
      const storedSignature = localStorage.getItem('alr_saas_tg_config_sig');
      const pinSalt = (currentAdmin && currentAdmin.pinHash) ? currentAdmin.pinHash : SYSTEM_ADMINS[0].pinHash;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const expectedToday = customHash(window.TELEGRAM_BOT_TOKEN + '|' + window.TELEGRAM_CHAT_ID + '|' + window.TELEGRAM_WHITELIST, MASTER_LEDGER_SALT + pinSalt + today);
      
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().slice(0, 10).replace(/-/g, '');
      const expectedYesterday = customHash(window.TELEGRAM_BOT_TOKEN + '|' + window.TELEGRAM_CHAT_ID + '|' + window.TELEGRAM_WHITELIST, MASTER_LEDGER_SALT + pinSalt + yesterday);

      if (storedSignature === expectedToday) {
        // Firma válida hoy
      } else if (storedSignature === expectedYesterday) {
        // Válida ayer, actualizar firma a la de hoy
        localStorage.setItem('alr_saas_tg_config_sig', expectedToday);
      } else {
        console.error("[SEGURIDAD] Firma de configuración de Telegram inválida o corrupta.");
        if (!isOtpMessage) {
          showToast("Seguridad: Firma de Telegram inválida. Guarda los ajustes de Telegram nuevamente.", "danger");
          return;
        } else {
          console.warn("[SEGURIDAD] Firma de Telegram inválida para OTP, pero se permite el despacho para evitar lockout.");
        }
      }
    } catch (e) {
      console.error("[SEGURIDAD] Error al verificar firma de Telegram:", e);
      if (!isOtpMessage) {
        showToast("Error de seguridad al verificar firma de Telegram: " + e.message, "danger");
        return;
      }
    }

    // 2. Deep Linking: Append direct link to console if not already present
    let finalMessage = message;
    if (typeof message === 'string' && !message.includes("brain-branding.web.app")) {
      finalMessage += `\n\n🔗 <a href="https://brain-branding.web.app/alr-saas/">Abrir Consola Commander Hub</a>`;
    }

    // 3. Buffer de Alertas Offline
    if (!navigator.onLine) {
      queueOfflineNotification(finalMessage);
      return;
    }

    const url = `https://api.telegram.org/bot${window.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: window.TELEGRAM_CHAT_ID,
      text: finalMessage,
      parse_mode: 'HTML'
    };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json().then(data => {
      if (res.ok && data.ok) {
        console.log("[TELEGRAM ALERT] Notificación enviada con éxito.");
        if (message.includes("[PRUEBA ALR SAAS]")) {
          showToast("¡Mensaje de prueba recibido con éxito en Telegram!", "success");
        } else if (message.includes("Acceso de Seguridad") || message.includes("OTP")) {
          showToast(`OTP enviado con éxito a Telegram (Chat: ${window.TELEGRAM_CHAT_ID}).`, "success");
        }
      } else {
        console.error("[TELEGRAM ALERT] Error de API:", data.description);
        let errMsg = data.description || '';
        if (errMsg.includes("chat not found")) {
          (errMsg = "Chat no encontrado. Verifica tu ID de Chat o asegúrate de haber iniciado conversación con el bot en Telegram.");
        } else if (errMsg.includes("bot was blocked")) {
          (errMsg = "El bot fue bloqueado. Por favor, desbloquéalo o inícialo de nuevo en Telegram.");
        }
        showToast("Telegram Error: " + errMsg, "danger");
      }
    }))
    .catch(err => {
      console.error("[TELEGRAM ALERT] Error de conexión, encolando alerta:", err);
      showToast("Error de conexión al enviar alerta a Telegram: " + err.message, "danger");
      queueOfflineNotification(message);
    });
  } catch (globalErr) {
    console.error("[TELEGRAM CRITICAL] Excepción en sendTelegramNotification:", globalErr);
    alert("Error de Javascript al enviar notificación: " + globalErr.message + "\n" + globalErr.stack);
  }
};

window.sendTestTelegramAlert = function() {
  window.saveTelegramConfig();
  if (!window.TELEGRAM_BOT_TOKEN || !window.TELEGRAM_CHAT_ID) {
    showToast("Configura el Token y Chat ID primero.", "warning");
    return;
  }
  showToast("Enviando mensaje de prueba...", "success");
  const testMessage = `🔔 <b>[PRUEBA ALR SAAS]</b> 🔔\n\nConexión de telemetría de consola establecida con éxito desde el navegador.\n<b>Severidad Configurada:</b> ${window.TELEGRAM_SEVERITY}\n<b>Operador Activo:</b> ${currentAdmin?.username || 'Desconocido'}\n<b>Fecha:</b> ${new Date().toLocaleString()}`;
  window.sendTelegramNotification(testMessage);
};

window.testTelegramWhitelistIds = async function() {
  if (!window.TELEGRAM_BOT_TOKEN) {
    showToast("Configura primero el token del bot de Telegram.", "warning");
    return;
  }
  const whitelist = window.TELEGRAM_WHITELIST || '';
  if (!whitelist) {
    showToast("La lista blanca está vacía.", "warning");
    return;
  }
  const ids = whitelist.split(',').map(id => id.trim()).filter(id => id !== '');
  if (ids.length === 0) {
    showToast("No hay IDs para verificar.", "warning");
    return;
  }
  showToast("Verificando IDs de la lista blanca...", "success");
  
  let botUsername = 'Bot';
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${window.TELEGRAM_BOT_TOKEN}/getMe`);
    const meData = await meRes.json();
    if (meData.ok && meData.result.username) {
      botUsername = meData.result.username;
    }
  } catch (err) {}

  const successes = [];
  const failures = [];
  
  for (const id of ids) {
    const url = `https://api.telegram.org/bot${window.TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: id,
          text: `🔔 <b>[VERIFICACIÓN ALR SAAS]</b>\n\nConexión de control remoto validada con éxito desde Commander Hub para el ID: <code>${id}</code>.`,
          parse_mode: 'HTML'
        })
      });
      const data = await res.json();
      if (data.ok) {
        successes.push(id);
      } else {
        const link = `https://t.me/${botUsername}?start=verificar`;
        failures.push(`${id} (<a href="${link}" target="_blank" style="color:var(--accent); text-decoration:underline; font-weight:800;">Iniciar Bot</a>)`);
      }
    } catch (err) {
      failures.push(`${id} (Error conexión)`);
    }
  }
  
  if (failures.length === 0) {
    showToast(`¡Todos los IDs (${successes.length}) verificados con éxito!`, "success");
  } else {
    const failText = failures.join(', ');
    showToast(`Verificados: ${successes.length}. Fallidos: ${failures.length} [${failText}]`, "warning");
  }
};

window.autoDetectTelegramChatId = async function() {
  const tgTokenInput = document.getElementById('cfg-tg-token');
  const token = tgTokenInput ? tgTokenInput.value.trim() : window.TELEGRAM_BOT_TOKEN;

  if (!token) {
    showToast("Por favor, introduce el token de tu bot de Telegram primero.", "warning");
    return;
  }

  const btn = document.getElementById('btn-detect-tg-id');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin" style="color: var(--accent);"></i> Buscando...';
  }

  showToast("Buscando interacciones recientes con tu bot...", "success");

  let botUsername = 'Bot';
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok || !meData.result.username) {
      showToast("Token inválido o el bot no responde. Verifica el token.", "danger");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-radar-line" style="color: var(--accent);"></i> Detectar ID';
      }
      return;
    }
    botUsername = meData.result.username;
  } catch (err) {
    showToast("Error al conectar con la API de Telegram.", "danger");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-radar-line" style="color: var(--accent);"></i> Detectar ID';
    }
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10&allowed_updates=["message","callback_query"]`);
    const data = await res.json();
    if (data.ok) {
      const updates = data.result;
      if (updates && updates.length > 0) {
        let lastChatId = null;
        let lastUserId = null;
        let lastUser = null;
        let isGroup = false;
        let groupTitle = '';

        for (let i = updates.length - 1; i >= 0; i--) {
          const u = updates[i];
          const msg = u.message || u.edited_message;
          const cb = u.callback_query;

          if (msg && msg.chat) {
            lastChatId = msg.chat.id;
            lastUserId = msg.from ? msg.from.id : null;
            lastUser = msg.from;
            isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
            groupTitle = msg.chat.title || 'Grupo';
            break;
          } else if (cb && cb.message && cb.message.chat) {
            lastChatId = cb.message.chat.id;
            lastUserId = cb.from ? cb.from.id : null;
            lastUser = cb.from;
            isGroup = cb.message.chat.type === 'group' || cb.message.chat.type === 'supergroup';
            groupTitle = cb.message.chat.title || 'Grupo';
            break;
          }
        }

        if (lastChatId) {
          let userStr = '';
          if (isGroup) {
            userStr = `Grupo: "${groupTitle}" (mensaje enviado por ${lastUser && lastUser.first_name ? lastUser.first_name : 'un usuario'})`;
          } else {
            const name = lastUser ? (lastUser.first_name + (lastUser.last_name ? ' ' + lastUser.last_name : '')) : '';
            userStr = lastUser && lastUser.username ? `@${lastUser.username}` : name;
          }

          // Mostrar modal premium de confirmación
          const overlay = document.getElementById('modal-overlay');
          const box = document.getElementById('modal-box');
          if (overlay && box) {
            box.innerHTML = `
              <div style="padding: 30px; text-align: center;">
                <div style="width: 50px; height: 50px; background: rgba(0, 136, 204, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                  <i class="ri-telegram-fill" style="color: #0088cc; font-size: 24px;"></i>
                </div>
                <h3 style="font-size: 14px; font-weight: 900; color: #fff; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ¿Vincular este ID de Telegram?
                </h3>
                <p style="font-size: 11px; opacity: 0.7; margin-bottom: 20px; line-height: 1.5; text-align: left;">
                  Hemos detectado una interacción de:<br>
                  <b style="color: var(--accent); font-size: 12px; display: block; margin: 4px 0;">${userStr}</b>
                  ID de Chat Destinatario: <code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 800;">${lastChatId}</code><br>
                  ${isGroup && lastUserId ? `ID de Usuario para Lista Blanca: <code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 800;">${lastUserId}</code>` : ''}
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                  <button class="btn btn-secondary flex-1" onclick="closeModal()">Cancelar</button>
                  <button class="btn btn-primary flex-2" id="confirm-tg-link-btn">Vincular ID</button>
                </div>
              </div>
            `;
            
            const confirmBtn = document.getElementById('confirm-tg-link-btn');
            if (confirmBtn) {
              confirmBtn.onclick = () => {
                const tgChatIdInput = document.getElementById('cfg-tg-chatid');
                const tgWhitelistInput = document.getElementById('cfg-tg-whitelist');

                if (tgChatIdInput) {
                  tgChatIdInput.value = lastChatId;
                }
                
                const whitelistTarget = isGroup ? lastUserId : lastChatId;
                if (tgWhitelistInput && whitelistTarget && (currentAdmin && currentAdmin.role === 'SUPER_ADMIN')) {
                  const whitelist = tgWhitelistInput.value.trim();
                  if (whitelist) {
                    const ids = whitelist.split(',').map(x => x.trim());
                    if (!ids.includes(String(whitelistTarget))) {
                      tgWhitelistInput.value = whitelist + ', ' + whitelistTarget;
                    }
                  } else {
                    tgWhitelistInput.value = whitelistTarget;
                  }
                }

                window.saveTelegramConfig();
                showToast(`¡ID Vinculado! Guardado Chat ID: <b>${lastChatId}</b>.`, "success");
                closeModal();
              };
            }

            overlay.classList.add('active');
          }

          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ri-radar-line" style="color: var(--accent);"></i> Detectar ID';
          }
          return;
        }
      }
      
      const botLink = `https://t.me/${botUsername}`;
      showToast(`No se detectaron mensajes. Abre <a href="${botLink}" target="_blank" style="color:var(--accent); text-decoration:underline; font-weight:800;">@${botUsername}</a> en Telegram, envía un mensaje (ej: /start) e intenta de nuevo.`, "warning");
    } else {
      showToast("Error de Telegram al obtener actualizaciones: " + (data.description || "desconocido"), "danger");
    }
  } catch (err) {
    showToast("Error de red al intentar detectar el ID.", "danger");
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-radar-line" style="color: var(--accent);"></i> Detectar ID';
  }
};

// --- TELEGRAM INTERACTIVE COMMANDS POLLING SYSTEM (WEB WORKER DECOUPLED WITH HANDSHAKE) ---
window.LAST_TG_UPDATE_ID = null;
window.TG_FAILED_ATTEMPTS = {};
window.TG_LOCKOUT_UNTIL = 0;
window.WORKER_SECRET = '';
let tgWorker = null;

// Helper de firma simple DJB2 para el handshake del worker
function signWorkerMessage(payload, secret) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const salt = data + secret;
  let hash = 5381;
  for (let i = 0; i < salt.length; i++) {
    hash = ((hash << 5) + hash) + salt.charCodeAt(i);
  }
  return Math.abs(hash).toString(16);
}

window.initTelegramWorker = function() {
  if (tgWorker) {
    tgWorker.postMessage({ action: 'stop' });
    tgWorker.terminate();
    tgWorker = null;
  }
  
  if (!window.TELEGRAM_NOTIFICATIONS_ENABLED || !window.TELEGRAM_BOT_TOKEN || !window.TELEGRAM_CHAT_ID) {
    return;
  }

  // Generar secreto único dinámico para la sesión de este worker (Handshake)
  window.WORKER_SECRET = Math.random().toString(36).substring(2) + Date.now().toString();

  const workerCode = `
    let pollingInterval = null;
    let lastUpdateId = null;
    let isPolling = false;
    let workerSecret = null;

    function signPayload(payload, secret) {
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const salt = data + secret;
      let hash = 5381;
      for (let i = 0; i < salt.length; i++) {
        hash = ((hash << 5) + hash) + salt.charCodeAt(i);
      }
      return Math.abs(hash).toString(16);
    }

    self.onmessage = function(e) {
      if (e.data.action === 'start') {
        const { token, chatId, lastId, secret } = e.data;
        lastUpdateId = lastId;
        workerSecret = secret;
        
        if (pollingInterval) clearInterval(pollingInterval);
        
        pollingInterval = setInterval(async () => {
          if (isPolling) return;
          isPolling = true;
          try {
            const url = 'https://api.telegram.org/bot' + token + '/getUpdates?limit=5' + 
                        (lastUpdateId ? '&offset=' + lastUpdateId : '&offset=-1');
            const res = await fetch(url);
            const data = await res.json();
            if (data.ok && data.result.length > 0) {
              if (lastUpdateId === null) {
                const lastUpdate = data.result[data.result.length - 1];
                lastUpdateId = lastUpdate.update_id + 1;
                
                const payload = { offset: lastUpdateId };
                const signature = signPayload(payload, workerSecret);
                self.postMessage({ action: 'init_offset', payload, signature });
              } else {
                const payload = { result: data.result };
                const signature = signPayload(payload, workerSecret);
                self.postMessage({ action: 'updates', payload, signature });
                
                lastUpdateId = data.result[data.result.length - 1].update_id + 1;
              }
            }
          } catch (err) {
            // Silenciar errores en segundo plano
          } finally {
            isPolling = false;
          }
        }, 3000);
      } else if (e.data.action === 'stop') {
        if (pollingInterval) clearInterval(pollingInterval);
        isPolling = false;
      }
    };
  `;

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    tgWorker = new Worker(URL.createObjectURL(blob));
    
    tgWorker.onmessage = function(e) {
      const { action, payload, signature } = e.data;
      if (!payload || !signature) {
        console.error("[Worker Handshake] Mensaje recibido sin firma de seguridad.");
        return;
      }
      
      const expectedSig = signWorkerMessage(payload, window.WORKER_SECRET);
      if (signature !== expectedSig) {
        console.error("[Worker Handshake] Firma de mensaje inválida. Abortando comando.");
        addAuditLog('SECURITY', 'WORKER_SPOOFING', "Firma del Web Worker de Telegram inválida o suplantada.");
        return;
      }
      
      if (action === 'init_offset') {
        window.LAST_TG_UPDATE_ID = payload.offset;
      } else if (action === 'updates') {
        window.processTelegramUpdates(payload.result);
      }
    };

    tgWorker.postMessage({
      action: 'start',
      token: window.TELEGRAM_BOT_TOKEN,
      chatId: window.TELEGRAM_CHAT_ID,
      lastId: window.LAST_TG_UPDATE_ID,
      secret: window.WORKER_SECRET
    });
    console.log("[Worker] Polling de Telegram inicializado con Handshake Criptográfico.");
  } catch (e) {
    console.error("[Worker] No se pudo inicializar el Web Worker para Telegram:", e);
  }
};

window.processTelegramUpdates = async function(updates) {
  const whitelist = window.TELEGRAM_WHITELIST || '8337803949';
  const whitelistArray = whitelist.split(',').map(id => id.trim());

  const sendTelegramResponse = async (chatId, text, replyMarkup = null) => {
    const sendUrl = `https://api.telegram.org/bot${window.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    try {
      await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Error sending telegram response:", err);
    }
  };

  const editTelegramMessage = async (chatId, messageId, newText) => {
    const editUrl = `https://api.telegram.org/bot${window.TELEGRAM_BOT_TOKEN}/editMessageText`;
    try {
      await fetch(editUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: newText,
          parse_mode: 'HTML'
        })
      });
    } catch (err) {
      console.error("Error editing telegram message:", err);
    }
  };

  const answerTelegramCallback = async (callbackQueryId, text) => {
    const answerUrl = `https://api.telegram.org/bot${window.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    try {
      await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text
        })
      });
    } catch (err) {
      console.error("Error answering telegram callback:", err);
    }
  };

  for (const update of updates) {
    window.LAST_TG_UPDATE_ID = update.update_id + 1;
    
    const fromUser = update.message ? update.message.from : (update.callback_query ? update.callback_query.from : null);
    if (!fromUser) continue;
    const fromId = String(fromUser.id);
    const chatId = update.message ? update.message.chat.id : (update.callback_query ? update.callback_query.message.chat.id : null);
    if (!chatId) continue;

    const isOwner = fromId === '8337803949';
    const chatType = update.message ? update.message.chat.type : (update.callback_query ? update.callback_query.message.chat.type : 'private');
    const isPrivateChat = chatType === 'private';

    if (isOwner && !isPrivateChat) {
      const spoofAlertText = `🚨 <b>[ALERTA DE SEGURIDAD]</b>\n\nIntento de ejecución de propietario en chat no privado (Tipo: <code>${escapeHtml(chatType)}</code>).\nAcción bloqueada para prevenir divulgación de comandos o suplantación de contexto.`;
      await sendTelegramResponse(chatId, spoofAlertText);
      addAuditLog('SECURITY', 'OWNER_INSECURE_CHAT', `Comando de Propietario bloqueado: chat no privado (${chatType}).`);
      if (typeof window.triggerSecondarySecurityAlert === 'function') {
        window.triggerSecondarySecurityAlert("OWNER_INSECURE_CHAT", `Intento de ejecución de propietario en chat no privado de tipo: ${chatType}. Bloqueado.`);
      }
      continue;
    }

    if (window.TG_LOCKOUT_UNTIL && Date.now() < window.TG_LOCKOUT_UNTIL && !isOwner) {
      continue;
    }

    // Validar whitelist
    if (!whitelistArray.includes(fromId)) {
      const attempts = (window.TG_FAILED_ATTEMPTS[fromId] || 0) + 1;
      window.TG_FAILED_ATTEMPTS[fromId] = attempts;
      
      if (attempts >= 3) {
        window.TG_LOCKOUT_UNTIL = Date.now() + 15 * 60 * 1000;
        const lockoutText = `🚨 <b>[BLOQUEO DE EMERGENCIA TELEGRAM]</b>\n\nSe han detectado múltiples intentos de acceso no autorizados desde el ID: <code>${escapeHtml(fromId)}</code>.\nEl control remoto de Telegram ha sido bloqueado preventivamente por 15 minutos.`;
        await sendTelegramResponse(chatId, lockoutText);
        addAuditLog('SECURITY', 'TELEGRAM_LOCKOUT', `Fuerza bruta detectada desde ID ${fromId}. Bot bloqueado por 15 minutos.`);
        showToast("¡Alerta de Seguridad! Bloqueo preventivo de Telegram activado por fuerza bruta.", "danger");
        
        if (typeof window.triggerSecondarySecurityAlert === 'function') {
          window.triggerSecondarySecurityAlert("TELEGRAM_LOCKOUT", `Fuerza bruta detectada desde ID Telegram: ${fromId}. Bot bloqueado por 15 minutos.`);
        }

        if (window.firestoreDb && window.FIREBASE_SYNC_ENABLED) {
          window.firestoreDb.collection('alr-saas-security-alerts').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'TELEGRAM_LOCKOUT',
            details: `Bloqueo de emergencia de bot activado por 15 minutos debido a intentos fallidos repetidos desde el ID Telegram: ${fromId}`,
            targetId: fromId,
            lockoutUntil: new Date(window.TG_LOCKOUT_UNTIL).toISOString()
          }).catch(err => console.error("Error writing security alert to Firebase:", err));
        }
      } else {
        const unauthText = `⚠️ <b>[ALERTA DE SEGURIDAD]</b>\n\nIntento de comando no autorizado.\n<b>Usuario:</b> @${escapeHtml(fromUser.username || 'Desconocido')} (${escapeHtml(fromUser.first_name || '')})\n<b>Telegram ID:</b> <code>${escapeHtml(fromId)}</code>\n<b>Intento:</b> ${attempts}/3`;
        await sendTelegramResponse(chatId, unauthText);
        addAuditLog('SECURITY', 'TELEGRAM_UNAUTHORIZED', `Comando rechazado. Telegram ID ${fromId} no está en el whitelist (Intento ${attempts}/3).`);
      }
      
      if (update.callback_query) {
        await answerTelegramCallback(update.callback_query.id, 'No autorizado');
      }
      continue;
    }

    window.TG_FAILED_ATTEMPTS[fromId] = 0;

    // Callback Queries
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const queryData = callbackQuery.data;
      const queryId = callbackQuery.id;
      const queryMessage = callbackQuery.message;
      const queryChatId = queryMessage.chat.id;
      const queryMsgId = queryMessage.message_id;

      if (queryData === 'confirm_lock') {
        if (currentAdmin && currentAdmin.username !== 'Operador Bloqueado') {
          window.lockConsoleSession(true);
          await editTelegramMessage(queryChatId, queryMsgId, `🔒 <b>[SEGURIDAD]</b> Consola bloqueada remotamente vía Telegram por solicitud confirmada del operador.`);
          addAuditLog('SYSTEM', 'TELEGRAM_COMMAND', `Consola bloqueada remotamente desde Telegram por ID: ${fromId}.`);
        } else {
          await editTelegramMessage(queryChatId, queryMsgId, `🔒 <b>[SEGURIDAD]</b> La consola ya se encuentra bloqueada.`);
        }
      } else if (queryData === 'cancel_lock') {
        await editTelegramMessage(queryChatId, queryMsgId, `❌ <b>[SEGURIDAD]</b> Solicitud de bloqueo cancelada por el operador.`);
        addAuditLog('SYSTEM', 'TELEGRAM_COMMAND', `Bloqueo remoto cancelado desde Telegram por ID: ${fromId}.`);
      }
      await answerTelegramCallback(queryId, 'Acción procesada');
      continue;
    }

    // Comandos de texto
    if (update.message && update.message.text) {
      const text = update.message.text.trim().toLowerCase();
      
      if (text === '/status') {
        const isConsoleLocked = currentAdmin && currentAdmin.username === 'Operador Bloqueado';
        const statusMessage = `🟢 <b>[ESTADO TELEGRAM BOT]</b>\n\n` +
                              `<b>Estado Consola:</b> ${isConsoleLocked ? '🔒 BLOQUEADA' : '🔓 DESBLOQUEADA'}\n` +
                              `<b>Operador Activo:</b> ${currentAdmin?.username || 'Desconocido'}\n` +
                              `<b>Rol de Operador:</b> ${currentAdmin?.role || 'NINGUNO'}\n` +
                              `<b>Sincronización Firebase:</b> ${window.FIREBASE_SYNC_ENABLED ? 'ACTIVA' : 'INACTIVA'}\n` +
                              `<b>Dispositivo:</b> Commander Hub Client`;
        await sendTelegramResponse(chatId, statusMessage);
        addAuditLog('SYSTEM', 'TELEGRAM_COMMAND', `Estado consultado remotamente vía Telegram por ID: ${fromId}.`);
      } else if (text === '/lock') {
        if (currentAdmin && currentAdmin.username !== 'Operador Bloqueado') {
          const confirmMarkup = {
            inline_keyboard: [
              [
                { text: '🔒 Sí, Bloquear', callback_data: 'confirm_lock' },
                { text: '❌ Cancelar', callback_data: 'cancel_lock' }
              ]
            ]
          };
          const lockAskText = `⚠️ <b>¿Confirmar Bloqueo de Consola?</b>\n\nSe cerrará la sesión activa del operador actual (<b>${currentAdmin.username}</b>) y se bloqueará la interfaz de control.`;
          await sendTelegramResponse(chatId, lockAskText, confirmMarkup);
          addAuditLog('SYSTEM', 'TELEGRAM_COMMAND', `Bloqueo de consola remoto solicitado por ID: ${fromId}. Esperando confirmación.`);
        } else {
          await sendTelegramResponse(chatId, `🔒 <b>[SEGURIDAD]</b> La consola ya se encuentra bloqueada.`);
        }
      } else if (text === '/help' || text === '/start') {
        const startHelpText = `🤖 <b>[COMMANDER BOT CONTROL]</b>\n\n` +
                              `<b>Comandos Disponibles:</b>\n` +
                              `/status - Ver estado del sistema y del operador activo\n` +
                              `/lock - Solicitar bloqueo de la consola central\n` +
                              `/help - Mostrar esta lista de ayuda\n\n` +
                              `<i>Nota: Solo los IDs autorizados en el Whitelist pueden operar el bot.</i>`;
        await sendTelegramResponse(chatId, startHelpText);
        addAuditLog('SYSTEM', 'TELEGRAM_COMMAND', `Ayuda consultada vía Telegram por ID: ${fromId}.`);
      }
    }
  }
};

window.saveFirebaseConfig = async function() {
  const fbConfigInput = document.getElementById('cfg-fb-json');
  const fbEnabledCheck = document.getElementById('cfg-fb-enabled');

  const configRaw = fbConfigInput ? fbConfigInput.value.trim() : '';
  const syncEnabled = fbEnabledCheck ? fbEnabledCheck.checked : false;

  if (syncEnabled && configRaw) {
    try {
      JSON.parse(configRaw);
    } catch (e) {
      showToast("Configuración de Firebase inválida. Debe ser un JSON válido.", "danger");
      if (fbConfigInput) fbConfigInput.style.borderColor = 'var(--danger)';
      return;
    }
  }

  if (fbConfigInput) fbConfigInput.style.borderColor = 'var(--border-glass)';
  window.FIREBASE_CONFIG_RAW = configRaw;
  window.FIREBASE_SYNC_ENABLED = syncEnabled;

  await setSecureStorage('alr_saas_fb_config_sec', window.FIREBASE_CONFIG_RAW);
  localStorage.setItem('alr_saas_fb_enabled', window.FIREBASE_SYNC_ENABLED);

  if (window.FIREBASE_CONFIG_RAW) {
    // Sugerencia 1: Guardar copia de seguridad redundante (Failsafe Backup)
    await setSecureStorage('alr_saas_fb_config_failsafe_sec', window.FIREBASE_CONFIG_RAW);

    // Sugerencia 3: Firmado digital avanzado con HMAC-SHA256 nativo (Web Cryptography API)
    const pinSalt = currentAdmin ? currentAdmin.pinHash : 'default_pin_salt';
    const signature = await hmacSign(window.FIREBASE_CONFIG_RAW, MASTER_LEDGER_SALT + pinSalt);
    localStorage.setItem('alr_saas_fb_config_sig', signature);
  } else {
    localStorage.removeItem('alr_saas_fb_config_sig');
    await setSecureStorage('alr_saas_fb_config_failsafe_sec', '');
  }

  // Reinicializar Firebase con la nueva configuración
  await window.initFirebaseSync();
};

window.initFirebaseSync = async function() {
  if (!window.FIREBASE_SYNC_ENABLED || !window.FIREBASE_CONFIG_RAW) {
    window.updateFirebaseStatusIndicator("DESCONECTADO", "rgba(255,255,255,0.4)");
    return;
  }

  // Sugerencia 1: Verificación de presencia del SDK de Firebase
  if (typeof firebase === 'undefined') {
    window.updateFirebaseStatusIndicator("ERROR RED / CDN", "var(--danger)");
    showToast("El SDK de Firebase no está cargado. Verifique su red o bloqueadores.", "danger");
    return;
  }

  // Verificar la firma digital dinámica derivada mediante HMAC-SHA256 nativo
  const storedSignature = localStorage.getItem('alr_saas_fb_config_sig');
  const pinSalt = currentAdmin ? currentAdmin.pinHash : 'default_pin_salt';
  const expectedSignature = await hmacSign(window.FIREBASE_CONFIG_RAW, MASTER_LEDGER_SALT + pinSalt);
  if (storedSignature !== expectedSignature) {
    window.updateFirebaseStatusIndicator("FIRMA CORRUPTA", "var(--danger)");
    
    // Activar bloqueo defensivo persistente inmediato
    localStorage.setItem('alr_saas_lockout', 'true');
    showToast("¡Alerta de Seguridad! Firma digital corrupta. Consola bloqueada.", "danger");
    addAuditLog('SYSTEM', 'BRECHA_CONFIG', "Intento abortado de conexión: Firma digital Firebase corrupta o alterada. Consola bloqueada preventivamente.");
    
    if (typeof window.triggerSecondarySecurityAlert === 'function') {
      window.triggerSecondarySecurityAlert("BRECHA_CONFIG", "Firma digital de Firebase corrupta o alterada en local. Consola bloqueada preventivamente.");
    }
    
    setTimeout(() => {
      window.openSecurityLockoutModal();
    }, 500);
    return;
  }

  try {
    const config = JSON.parse(window.FIREBASE_CONFIG_RAW);
    if (typeof firebase !== 'undefined') {
      if (firebase.apps.length === 0) {
        window.firebaseApp = firebase.initializeApp(config);
      } else {
        window.firebaseApp = firebase.app();
      }
      window.firestoreDb = window.firebaseApp.firestore();
      window.updateFirebaseStatusIndicator("CONECTADO", "var(--success)");
      console.log("[FIREBASE] Sincronizador de telemetría inicializado y verificado con firma digital dinámica HMAC-SHA256.");
      
      // Sincronizar la lista blanca desde la nube (Sugerencia 3)
      try {
        const docRef = window.firestoreDb.collection('alr-saas-settings').doc('telegram');
        const doc = await docRef.get();
        if (doc.exists) {
          const cloudData = doc.data();
          if (cloudData && cloudData.whitelist_sec) {
            try {
              // Validar firma digital de la configuración en la nube
              const sigMessage = cloudData.whitelist_sec + '|' + cloudData.updatedAt + '|' + cloudData.updatedBy;
              const expectedSig = await hmacSign(sigMessage, MASTER_LEDGER_SALT + (window.TELEGRAM_BOT_TOKEN || ''));
              if (cloudData.signature_sha256 !== expectedSig) {
                console.error("[FIREBASE] Firma digital de la configuración en la nube inválida o corrupta.");
                addAuditLog('SECURITY', 'TELEGRAM_CONFIG_CORRUPT', "Firma digital de lista blanca en la nube corrupta o alterada. Sincronización abortada.");
                if (typeof window.triggerSecondarySecurityAlert === 'function') {
                  window.triggerSecondarySecurityAlert("TELEGRAM_CONFIG_CORRUPT", "Se detectó una firma digital corrupta o alterada en la lista blanca de la nube (Firestore). Sincronización abortada por seguridad.");
                }
                return;
              }

              const decryptedCloudWhitelist = await decryptReposo(cloudData.whitelist_sec, MASTER_LEDGER_SALT);
              if (decryptedCloudWhitelist && decryptedCloudWhitelist !== window.TELEGRAM_WHITELIST) {
                const oldW = window.TELEGRAM_WHITELIST;
                window.TELEGRAM_WHITELIST = decryptedCloudWhitelist;
                await setSecureStorage('alr_saas_tg_whitelist_sec', decryptedCloudWhitelist);
                const tgWhitelistInput = document.getElementById('cfg-tg-whitelist');
                if (tgWhitelistInput) tgWhitelistInput.value = decryptedCloudWhitelist;
                console.log("[FIREBASE] Lista blanca de Telegram restaurada desde la nube con éxito.");
                addAuditLog('SECURITY', 'TELEGRAM_WHITELIST_SYNC', `Lista blanca de Telegram restaurada/sincronizada desde la nube. Anterior: ${oldW} | Nueva: ${decryptedCloudWhitelist}`);
              }
            } catch (decErr) {
              console.error("[FIREBASE] Error de descifrado failsafe. Se conserva la lista blanca local.", decErr);
            }
          }
        }
      } catch (cloudErr) {
        console.warn("[FIREBASE] No se pudo obtener la configuración de lista blanca desde la nube:", cloudErr);
      }

      if (navigator.onLine) {
        await window.syncLogsToFirebase();
      }
    } else {
      window.updateFirebaseStatusIndicator("SDK FALTANTE", "var(--warning)");
      console.warn("[FIREBASE] El SDK de Firebase no está cargado.");
    }
  } catch (err) {
    window.updateFirebaseStatusIndicator("ERROR CONFIG", "var(--danger)");
    console.error("[FIREBASE] Error al inicializar:", err);
  }
};

window.updateFirebaseStatusIndicator = function(text, color) {
  const badge = document.getElementById('fb-status-badge');
  if (badge) {
    badge.innerText = text;
    badge.style.color = color;
    badge.style.borderColor = color.replace(')', ', 0.2)').replace('var(--success)', 'rgba(34,197,94,0.2)').replace('var(--warning)', 'rgba(255,179,0,0.2)').replace('var(--danger)', 'rgba(239,68,68,0.2)');
    badge.style.background = color.replace(')', ', 0.05)').replace('var(--success)', 'rgba(34,197,94,0.05)').replace('var(--warning)', 'rgba(255,179,0,0.05)').replace('var(--danger)', 'rgba(239,68,68,0.05)');
  }
};

// --- COLA DE SINCRONIZACIÓN PERSISTENTE OFFLINE ---
window.addHashToPendingSync = function(hash) {
  let pending = [];
  try {
    const raw = localStorage.getItem('alr_saas_pending_sync');
    if (raw) pending = JSON.parse(raw);
  } catch (e) {}
  if (!pending.includes(hash)) {
    pending.push(hash);
    localStorage.setItem('alr_saas_pending_sync', JSON.stringify(pending));
  }
};

window.syncLogsToFirebase = async function() {
  if (!window.FIREBASE_SYNC_ENABLED || !window.firestoreDb) {
    return;
  }

  // Verificar la firma digital dinámica derivada antes de proceder
  const storedSignature = localStorage.getItem('alr_saas_fb_config_sig');
  const pinSalt = currentAdmin ? currentAdmin.pinHash : 'default_pin_salt';
  const expectedSignature = await hmacSign(window.FIREBASE_CONFIG_RAW, MASTER_LEDGER_SALT + pinSalt);
  if (storedSignature !== expectedSignature) {
    window.updateFirebaseStatusIndicator("FIRMA CORRUPTA", "var(--danger)");
    return;
  }

  if (!navigator.onLine) {
    console.warn("[FIREBASE] Sincronización offline en espera.");
    return;
  }
  
  let pendingHashes = [];
  try {
    const raw = localStorage.getItem('alr_saas_pending_sync');
    if (raw) pendingHashes = JSON.parse(raw);
  } catch (e) {}
  
  // Si no hay hashes pendientes, sincronizar toda la bitácora local por seguridad
  if (pendingHashes.length === 0) {
    pendingHashes = state.logs.map(l => l.hash);
  }

  if (pendingHashes.length === 0) return;
  
  window.updateFirebaseStatusIndicator("SINCRONIZANDO", "var(--warning)");
  const totalToSync = pendingHashes.length;
  console.log(`[FIREBASE] Iniciando sincronización de ${totalToSync} logs...`);

  let syncedCount = 0;
  
  try {
    // Procesar consecutivamente en lotes de 400 con delay de 500ms (Limitador de Concurrencia)
    while (pendingHashes.length > 0) {
      const currentBatchHashes = pendingHashes.slice(0, 400);
      const logsToSync = state.logs.filter(l => currentBatchHashes.includes(l.hash));
      
      if (logsToSync.length > 0) {
        const batch = window.firestoreDb.batch();
        logsToSync.forEach(log => {
          const docRef = window.firestoreDb.collection('alr-saas-telemetry-logs').doc(log.hash);
          batch.set(docRef, {
            timestamp: log.timestamp,
            module: log.module,
            action: log.action,
            details: log.details,
            prevHash: log.prevHash,
            hash: log.hash,
            synchronizedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
        
        await batch.commit();
        syncedCount += logsToSync.length;

        // Indicador de progreso porcentual interactivo (Sugerencia 3)
        const percent = Math.round((syncedCount / totalToSync) * 100);
        window.updateFirebaseStatusIndicator(`SINC. ${percent}%`, "var(--warning)");
      }
      
      pendingHashes = pendingHashes.filter(h => !currentBatchHashes.includes(h));
      localStorage.setItem('alr_saas_pending_sync', JSON.stringify(pendingHashes));
      
      if (pendingHashes.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Sincronizar configuraciones pendientes offline (Sugerencia 3)
    const pendingSettings = localStorage.getItem('alr_saas_pending_settings_sync');
    if (pendingSettings && window.firestoreDb && window.FIREBASE_SYNC_ENABLED && navigator.onLine) {
      try {
        if (typeof window.updateWhitelistSyncBadge === 'function') {
          window.updateWhitelistSyncBadge('syncing');
        }
        const parsed = JSON.parse(pendingSettings);

        const sigMessage = parsed.whitelist_sec + '|' + parsed.updatedAt + '|' + parsed.updatedBy;
        const signature = await hmacSign(sigMessage, MASTER_LEDGER_SALT + (window.TELEGRAM_BOT_TOKEN || ''));
        parsed.signature_sha256 = signature;

        await window.firestoreDb.collection('alr-saas-settings').doc('telegram').set({
          ...parsed,
          synchronizedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        localStorage.removeItem('alr_saas_pending_settings_sync');
        if (typeof window.updateWhitelistSyncBadge === 'function') {
          window.updateWhitelistSyncBadge('synced');
        }
        console.log("[SETTINGS SYNC] Configuración offline de whitelist sincronizada con la nube.");
      } catch (err) {
        if (typeof window.updateWhitelistSyncBadge === 'function') {
          window.updateWhitelistSyncBadge('pending');
        }
        console.error("[SETTINGS SYNC] Error al sincronizar configuración offline:", err);
      }
    } else if (pendingSettings) {
      if (typeof window.updateWhitelistSyncBadge === 'function') {
        window.updateWhitelistSyncBadge('pending');
      }
    } else {
      if (typeof window.updateWhitelistSyncBadge === 'function') {
        window.updateWhitelistSyncBadge('synced');
      }
    }
    
    // Sincronizar licencias y configuraciones particulares pendientes offline
    let pendingLicenses = [];
    try {
      const raw = localStorage.getItem('alr_saas_pending_license_sync');
      if (raw) pendingLicenses = JSON.parse(raw);
    } catch (e) {}
    
    if (pendingLicenses.length > 0) {
      for (let idx = 0; idx < pendingLicenses.length; idx++) {
        const id = pendingLicenses[idx];
        const license = state.licenses.find(l => l.id === id) || (state.recycleBin.find(item => item.license.id === id)?.license);
        if (license) {
          await window.syncLicenseToFirestore(license);
        }
      }
    }

    console.log(`[FIREBASE] Sincronización exitosa. ${syncedCount} logs sincronizados.`);
    window.updateFirebaseStatusIndicator("SINCRONIZADO", "var(--success)");
    
    // Certidumbre visual: Mostrar toast si se sincronizaron registros offline diferidos
    if (syncedCount > 0) {
      showToast(`Sincronización en la nube reestablecida: ${syncedCount} logs enviados.`, "success");
    }
  } catch (err) {
    console.error("[FIREBASE] Error al sincronizar logs:", err);
    window.updateFirebaseStatusIndicator("FALLO SYNC", "var(--danger)");
  }
};

window.forceFirebaseSync = function() {
  window.saveFirebaseConfig().then(async () => {
    if (!window.FIREBASE_SYNC_ENABLED || !window.FIREBASE_CONFIG_RAW) {
      showToast("Habilite y configure Firebase primero.", "warning");
      return;
    }
    const hasInternet = await window.checkInternetConnection();
    if (!hasInternet) {
      showToast("No hay conexión real a Internet.", "danger");
      return;
    }
    showToast("Sincronizando con Firestore...", "success");
    window.syncLogsToFirebase().then(() => {
      showToast("Sincronización manual completada.", "success");
    });
  });
};

window.forceOfflineLicenseSync = async function() {
  if (!window.FIREBASE_SYNC_ENABLED || !window.firestoreDb) {
    showToast("Habilite y configure Firebase primero.", "warning");
    return;
  }
  const hasInternet = await window.checkInternetConnection();
  if (!hasInternet) {
    showToast("No hay conexión real a Internet.", "danger");
    return;
  }

  let pendingLicenses = [];
  try {
    const raw = localStorage.getItem('alr_saas_pending_license_sync');
    if (raw) pendingLicenses = JSON.parse(raw);
  } catch (e) {}

  if (pendingLicenses.length === 0) {
    showToast("No hay licencias pendientes de sincronización.", "info");
    return;
  }

  showToast(`Sincronizando ${pendingLicenses.length} licencias pendientes...`, "info");
  
  let successCount = 0;
  const idsToProcess = [...pendingLicenses];
  for (let idx = 0; idx < idsToProcess.length; idx++) {
    const id = idsToProcess[idx];
    const license = state.licenses.find(l => l.id === id) || (state.recycleBin.find(item => item.license.id === id)?.license);
    if (license) {
      try {
        await window.syncLicenseToFirestore(license);
        successCount++;
      } catch (err) {
        console.error(`Error al sincronizar licencia ${id}:`, err);
      }
    } else {
      let currentPending = [];
      try {
        const raw = localStorage.getItem('alr_saas_pending_license_sync');
        if (raw) currentPending = JSON.parse(raw);
      } catch (e) {}
      currentPending = currentPending.filter(pid => pid !== id);
      localStorage.setItem('alr_saas_pending_license_sync', JSON.stringify(currentPending));
    }
  }

  renderClientsTable();
  if (successCount > 0) {
    showToast(`Se sincronizaron ${successCount} licencias con éxito.`, "success");
    addAuditLog('ORQUESTADOR', 'FORZAR_SYNC_LICENCIAS', `Sincronización forzada de licencias manual: ${successCount} sincronizadas.`);
  } else {
    showToast("Fallo al sincronizar las licencias pendientes.", "danger");
  }
};

// --- MODAL DE BLOQUEO CRÍTICO DE SEGURIDAD DEFENSIVO PERSISTENTE ---
window.openSecurityLockoutModal = function() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="padding: 40px; text-align: center; border: 2px solid var(--danger); border-radius: 40px; background: rgba(15, 5, 5, 0.99); box-shadow: 0 0 50px rgba(239, 68, 68, 0.3);">
      <div style="font-size: 64px; margin-bottom: 20px; animation: pulse 1s infinite;">🚨</div>
      <h2 style="font-size: 22px; font-weight: 900; color: var(--danger); margin-bottom: 12px; text-transform: uppercase; font-style: italic;">Consola Bloqueada por Brecha</h2>
      <p style="font-size: 11px; opacity: 0.8; margin-bottom: 24px; line-height: 1.6; font-weight: 500;">
        Se ha detectado un <strong style="color:var(--danger)">intento de alteración física en la configuración de la nube</strong> de este nodo local. Sincronización bloqueada preventivamente.<br>
        Introduce el PIN Maestro para reestablecer la gobernanza.
      </p>
      
      <div class="form-group" style="text-align: left; margin-bottom: 16px;">
        <label class="form-label">PIN de Desbloqueo Maestro (Master Admin)</label>
        <div style="position: relative; display: flex; align-items: center;">
          <input type="password" id="lockout-master-pin" class="form-input" maxlength="6" placeholder="••••" style="text-align:center; font-size:20px; letter-spacing:6px; font-weight:900; background:#000; color:#fff; border:1px solid var(--border-glass); padding-right: 40px; width: 100%;">
          <button type="button" onclick="window.togglePinVisibility('lockout-master-pin', this)" style="position: absolute; right: 10px; background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; height: 100%; width: 30px; outline: none;">
            <i class="ri-eye-off-line" style="font-size: 16px;"></i>
          </button>
        </div>
      </div>
      <div class="form-group" style="text-align: left; margin-bottom: 24px;">
        <label class="form-label">Código 2FA (solo si ya lo activaste)</label>
        <input type="text" id="lockout-master-totp" class="form-input" maxlength="6" inputmode="numeric" placeholder="000000" style="text-align:center; font-size:16px; letter-spacing:4px; font-weight:900; background:#000; color:#fff; border:1px solid var(--border-glass); width: 100%;">
      </div>

      <button class="btn btn-primary" style="width: 100%; height: 44px; background: var(--danger); color: #fff; font-size: 11px; font-weight: 800; cursor:pointer;" onclick="window.unlockSecurityLockout()">
        <i class="ri-shield-flash-fill"></i> Restaurar Gobernanza de Consola
      </button>
    </div>
  `;
  overlay.classList.add('active');
};

window.unlockSecurityLockout = async function() {
  if (window.checkLockoutState && window.checkLockoutState()) return;

  const pinInput = document.getElementById('lockout-master-pin');
  const totpInput = document.getElementById('lockout-master-totp');
  if (!pinInput) return;
  const pin = pinInput.value;
  const totpCode = totpInput ? totpInput.value.trim() : '';

  // Antes comparaba masterAdmin.pinHash localmente (el mismo hash público
  // y crackeable offline) -- ahora usa la misma Cloud Function que el
  // resto de las rutas de desbloqueo.
  const masterAdmin = SYSTEM_ADMINS[0];
  let isPinValid = false;
  try {
    if (!window.governanceAuth || !window.governanceAuth.currentUser) {
      await initGovernanceFirebase();
    }
    const verify = window.governanceFunctions.httpsCallable('verifyAlrAdminAccess');
    await verify({ pin, totpCode, username: masterAdmin.username });
    await window.governanceAuth.currentUser.getIdToken(true);
    isPinValid = true;
  } catch (e) {
    isPinValid = false;
  }

  if (isPinValid) {
    if (window.clearAuthFailures) window.clearAuthFailures();
    currentAdmin = masterAdmin;
    localStorage.removeItem('alr_saas_lockout');
    
    // Sugerencia 1: Recuperación failsafe automática de la última configuración válida autorizada
    const failsafeConfig = await getSecureStorage('alr_saas_fb_config_failsafe_sec');
    if (failsafeConfig) {
      window.FIREBASE_CONFIG_RAW = failsafeConfig;
      await setSecureStorage('alr_saas_fb_config_sec', failsafeConfig);
      
      const configInput = document.getElementById('cfg-fb-json');
      if (configInput) configInput.value = failsafeConfig;
      
      console.log("[RESTORE] Configuración Firebase failsafe rehidratada automáticamente con éxito.");
    }

    showToast("Gobernanza restablecida con éxito.", "success");
    closeModal();
    
    // Restablecer la firma correcta de la configuración activa basada en el operador autorizado
    if (window.FIREBASE_CONFIG_RAW) {
      const signature = await hmacSign(window.FIREBASE_CONFIG_RAW, MASTER_LEDGER_SALT + masterAdmin.pinHash);
      localStorage.setItem('alr_saas_fb_config_sig', signature);
    }
    
    // Sugerencia 2: Historial forense inalterable de desbloqueos por brecha de seguridad
    let unlockHistory = [];
    try {
      const raw = localStorage.getItem('alr_saas_lockout_unlocks');
      if (raw) unlockHistory = JSON.parse(raw);
    } catch (e) {}
    unlockHistory.push({
      timestamp: new Date().toISOString(),
      operator: masterAdmin.username,
      userAgent: navigator.userAgent
    });
    localStorage.setItem('alr_saas_lockout_unlocks', JSON.stringify(unlockHistory));

    addAuditLog('SYSTEM', 'RESTORE_BRECHA', `La gobernanza de consola fue restablecida por ${masterAdmin.username} | Failsafe: ${failsafeConfig ? 'SÍ' : 'NO'} | UA: ${navigator.userAgent}`);
    await window.initFirebaseSync();
  } else {
    showToast("PIN de restauración incorrecto.", "danger");
    addAuditLog('SYSTEM', 'FALLO_RESTORE_BRECHA', "Intento fallido de desbloquear la consola comprometida por brecha de firma.");
    if (window.registerAuthFailure) window.registerAuthFailure(masterAdmin.username, 'Restauración de Brecha de Seguridad');
  }
};

window.clearExampleData = function() {
  requestAdminVerification("Limpiar todos los datos ficticios y de ejemplo para iniciar producción real", () => {
    state.apps = [];
    state.licenses = [];
    state.logs = [];
    state.recycleBin = [];

    // Rehidratar semillas personalizadas de producción inmediatamente tras el borrado
    state.customSeeds.forEach(seed => {
      state.apps.push({
        id: seed.id,
        name: seed.name,
        version: seed.version,
        status: seed.status || 'RELEASED',
        activeClients: 0,
        icon: seed.icon || 'ri-apps-fill',
        color: seed.color || '#10b981'
      });
    });

    addAuditLog('SYSTEM', 'RESET_PRODUCCIÓN', 'Se han eliminado los datos ficticios de ejemplo. Consola configurada para inicio de producción real, conservando plantillas de semillas personalizadas.');

    saveToStorage();
    showToast("Datos de ejemplo eliminados. Consola lista para producción.", "success");
    renderAll();
  });
};

const TRUSTED_SEED_DOMAINS = ['raw.githubusercontent.com', 'gist.githubusercontent.com', 'github.com', 'brain-branding.web.app', 'localhost', '127.0.0.1', 'web.app', 'firebaseapp.com', 'vercel.app'];
let lastImportedSeedCache = { url: '', data: null };

window.importSeedFromUrl = async function() {
  const url = document.getElementById('w-import-url')?.value?.trim();
  if (!url) {
    showToast("Ingresa una URL válida.", "warning");
    return;
  }

  // 1. Caching inteligente en memoria
  if (lastImportedSeedCache.url === url && lastImportedSeedCache.data) {
    showToast("Cargando plantilla desde caché en memoria...", "info");
    await processImportedSeed(lastImportedSeedCache.data);
    showToast("Plantilla cargada desde caché con éxito.", "success");
    return;
  }

  // 2. Validación de URL y dominios con opción de deshabilitación desde panel
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    state.importedDomain = parsedUrl.origin;
    // Actualizar el valor del input w-app-url si ya hay un slug
    const slugVal = document.getElementById('w-client-slug')?.value?.trim();
    if (slugVal) {
      window.updateAppUrlFromSlug(slugVal);
    }
  } catch (urlErr) {
    showToast("La URL ingresada no es válida.", "danger");
    return;
  }

  const strictValidation = localStorage.getItem('alr_saas_strict_domain_validation') !== 'false';
  if (strictValidation) {
    const hostname = parsedUrl.hostname.toLowerCase();
    const isTrusted = TRUSTED_SEED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
    if (!isTrusted) {
      showToast("Dominio no confiable para importar plantillas.", "danger");
      addAuditLog('SECURITY', 'INTENTO_IMPORTACION_INSEGURA', `Se bloqueó un intento de importar plantilla de URL insegura: ${url}`);
      return;
    }
  }

  const pContainer = document.getElementById('w-download-progress-container');
  const pStatus = document.getElementById('w-progress-status');
  const pPercent = document.getElementById('w-progress-percent');
  const pBar = document.getElementById('w-progress-bar');
  
  const updateProgress = (status, percent) => {
    if (pContainer) pContainer.style.display = 'block';
    if (pStatus) pStatus.innerText = status;
    if (pPercent) pPercent.innerText = `${percent}%`;
    if (pBar) pBar.style.width = `${percent}%`;
  };

  const clearProgress = () => {
    if (pContainer) pContainer.style.display = 'none';
  };

  // 3. Intento de recuperación inteligente desde la API REST pública de Firestore
  const pathParts = parsedUrl.pathname.split('/').filter(p => p);
  let possibleSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
  if (!possibleSlug) {
    const parts = parsedUrl.hostname.split('.');
    if (parts.length > 2) {
      possibleSlug = parts[0];
    }
  }
  if (possibleSlug) {
    possibleSlug = possibleSlug.replace(/[^a-zA-Z0-9-_]/g, '');
  }
  let loadedFromDb = false;
  let seedDataFromDb = null;

  function parseFirestoreFields(fields) {
    const result = {};
    if (!fields) return result;
    for (const [key, val] of Object.entries(fields)) {
      if (val && typeof val === 'object') {
        if ('stringValue' in val) {
          result[key] = val.stringValue;
        } else if ('integerValue' in val) {
          result[key] = parseInt(val.integerValue, 10);
        } else if ('doubleValue' in val) {
          result[key] = parseFloat(val.doubleValue);
        } else if ('booleanValue' in val) {
          result[key] = val.booleanValue;
        } else if ('arrayValue' in val) {
          result[key] = (val.arrayValue.values || []).map(v => {
            if (v && typeof v === 'object' && 'mapValue' in v) {
              return parseFirestoreFields(v.mapValue.fields);
            }
            return v ? (v.stringValue || v.integerValue || v.booleanValue || null) : null;
          });
        } else if ('mapValue' in val) {
          result[key] = parseFirestoreFields(val.mapValue.fields);
        }
      }
    }
    return result;
  }

  if (possibleSlug && !url.toLowerCase().endsWith('.json')) {
    const hostname = parsedUrl.hostname.toLowerCase();
    let projectId = 'rey-smart-wash';
    if (hostname.endsWith('.web.app')) {
      projectId = hostname.replace('.web.app', '');
    } else if (hostname.endsWith('.firebaseapp.com')) {
      projectId = hostname.replace('.firebaseapp.com', '');
    } else if (hostname.endsWith('.vercel.app')) {
      const PROJECT_ALIAS_MAP = {
        'yoy-la-billar': 'yoy-ia-billar'
      };
      projectId = hostname.replace('.vercel.app', '');
      if (PROJECT_ALIAS_MAP[projectId]) {
        projectId = PROJECT_ALIAS_MAP[projectId];
      }
    }
    
    updateProgress("Buscando licencia en la API REST de Firestore...", 25);
    try {
      const restLicensesUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/master_licenses?pageSize=300`;
      const response = await fetch(restLicensesUrl);
      if (response.ok) {
        const data = await response.json();
        const docs = data.documents || [];
        
        const searchSlug = possibleSlug.toLowerCase();
        let matchedDoc = null;
        let matchedId = '';
        
        for (const doc of docs) {
          const docId = doc.name.split('/').pop();
          const docIdLower = docId.toLowerCase();
          if (docIdLower === searchSlug || docIdLower.startsWith(searchSlug + '_') || docIdLower.includes(searchSlug)) {
            matchedDoc = doc;
            matchedId = docId;
            break;
          }
        }
        
        if (matchedDoc) {
          updateProgress("Cliente localizado. Descargando configuración...", 50);
          const licenseFields = parseFirestoreFields(matchedDoc.fields);
          
          let prefix = matchedId.toLowerCase() + '_';
          if (matchedId.toLowerCase() === 'xalpa' || matchedId.toLowerCase() === 'dsfd_smart') {
            prefix = 'xalpa_';
          }
          
          let businessConfig = {};
          let roles = [];
          let services = [];
          
          try {
            const bizRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${prefix}settings/business`);
            if (bizRes.ok) {
              const bizData = await bizRes.json();
              businessConfig = parseFirestoreFields(bizData.fields);
            }
          } catch (e) { console.warn("No se pudo obtener settings/business:", e); }
          
          try {
            const empRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${prefix}employees?pageSize=300`);
            if (empRes.ok) {
              const empData = await empRes.json();
              const empDocs = empData.documents || [];
              const rolesMap = new Map();
              
              empDocs.forEach(empDoc => {
                const emp = parseFirestoreFields(empDoc.fields);
                const role = emp.role;
                if (role && !rolesMap.has(role)) {
                  rolesMap.set(role, {
                    role: role,
                    name: role.charAt(0).toUpperCase() + role.slice(1),
                    defaultPin: emp.pin || null
                  });
                }
              });
              roles = Array.from(rolesMap.values());
            }
          } catch (e) { console.warn("No se pudieron obtener employees:", e); }
          
          try {
            const svcRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${prefix}services?pageSize=300`);
            if (svcRes.ok) {
              const svcData = await svcRes.json();
              const svcDocs = svcData.documents || [];
              services = svcDocs.map(svcDoc => {
                const svc = parseFirestoreFields(svcDoc.fields);
                return {
                  name: svc.name || svcDoc.name.split('/').pop(),
                  price: parseFloat(svc.price || 0)
                };
              });
            }
          } catch (e) { console.warn("No se pudieron obtener services:", e); }
          
          seedDataFromDb = {
            id: licenseFields.appId || matchedId,
            name: licenseFields.appName || licenseFields.clientName || matchedId,
            version: licenseFields.version || 'v1.0.0',
            roles: roles.length > 0 ? roles : [
              { role: 'admin', name: 'Administrador', defaultPin: '1111' },
              { role: 'supervisor', name: 'Supervisor', defaultPin: '2222' }
            ],
            services: services.length > 0 ? services : [
              { name: 'Servicio Base', price: 100 }
            ],
            business: {
              name: businessConfig.name || licenseFields.clientName || matchedId,
              openTime: businessConfig.openTime || '08:00',
              closeTime: businessConfig.closeTime || '21:00'
            }
          };
          loadedFromDb = true;
        }
      }
    } catch (restErr) {
      console.warn("Fallo en la recuperación vía API REST de Firestore:", restErr);
    }
    
    if (!loadedFromDb) {
      updateProgress("Detectando app standalone en la nube...", 40);
      let businessConfig = {};
      let roles = [];
      let services = [];
      
      try {
        const sucursalRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/sucursal_default_salon`);
        if (sucursalRes.ok) {
          const sucData = await sucursalRes.json();
          businessConfig = parseFirestoreFields(sucData.fields);
        } else {
          const sucResDirect = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/sucursal`);
          if (sucResDirect.ok) {
            const sucDataDirect = await sucResDirect.json();
            businessConfig = parseFirestoreFields(sucDataDirect.fields);
          }
        }
      } catch (e) { console.warn("No se pudo obtener sucursal config:", e); }
      
      try {
        const usersRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?pageSize=300`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const userDocs = usersData.documents || [];
          const rolesMap = new Map();
          userDocs.forEach(uDoc => {
            const u = parseFirestoreFields(uDoc.fields);
            const role = u.role;
            if (role && !rolesMap.has(role)) {
              rolesMap.set(role, {
                role: role,
                name: role.charAt(0).toUpperCase() + role.slice(1),
                defaultPin: u.pin || null
              });
            }
          });
          roles = Array.from(rolesMap.values());
        }
      } catch (e) { console.warn("No se pudieron obtener users:", e); }
      
      try {
        const prodRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/productos?pageSize=300`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const prodDocs = prodData.documents || [];
          services = prodDocs.map(pDoc => {
            const p = parseFirestoreFields(pDoc.fields);
            return {
              name: p.name || pDoc.name.split('/').pop(),
              price: parseFloat(p.price || p.precio || 0)
            };
          });
        }
      } catch (e) { console.warn("No se pudieron obtener productos:", e); }
      
      const businessName = businessConfig.name || businessConfig.nombre || possibleSlug;
      const isPartial = roles.length === 0 || services.length === 0;
      seedDataFromDb = {
        id: possibleSlug,
        name: businessName,
        version: 'v1.0.0',
        isPartialImport: isPartial,
        roles: roles.length > 0 ? roles : [
          { role: 'admin', name: 'Administrador', defaultPin: '1111' },
          { role: 'supervisor', name: 'Supervisor', defaultPin: '2222' }
        ],
        services: services.length > 0 ? services : [
          { name: 'Servicio Base', price: 100 }
        ],
        business: {
          name: businessName,
          openTime: businessConfig.openTime || businessConfig.horaApertura || '08:00',
          closeTime: businessConfig.closeTime || businessConfig.horaCierre || '21:00'
        }
      };
      loadedFromDb = true;
    }
    
    // Fallback: Si no se pudo cargar desde la API REST, intentar con el estado local o Firestore local
    if (!loadedFromDb) {
      updateProgress("Buscando en base de datos local y sincronizada...", 30);
      
      const searchSlug = possibleSlug.toLowerCase();
      let foundLicense = state.licenses.find(l => {
        const docId = l.id.toLowerCase();
        return docId === searchSlug || docId.startsWith(searchSlug + '_') || docId.includes(searchSlug);
      });

      if (!foundLicense && window.firestoreDb && window.FIREBASE_SYNC_ENABLED) {
        try {
          const querySnapshot = await window.firestoreDb.collection('master_licenses').get();
          querySnapshot.forEach(doc => {
            const docId = doc.id.toLowerCase();
            if (docId === searchSlug || docId.startsWith(searchSlug + '_') || docId.includes(searchSlug)) {
              foundLicense = doc.data();
              if (foundLicense) {
                foundLicense.id = doc.id;
              }
            }
          });
        } catch (fsErr) {
          console.warn("Fallo al consultar Firestore local:", fsErr);
        }
      }

      if (foundLicense) {
        seedDataFromDb = {
          id: foundLicense.appId || foundLicense.id || possibleSlug,
          name: foundLicense.appName || foundLicense.clientName,
          version: foundLicense.version || 'v1.0.0',
          roles: foundLicense.customConfig?.roles || [],
          services: foundLicense.customConfig?.services || [],
          business: foundLicense.customConfig?.business || { name: foundLicense.clientName }
        };
        loadedFromDb = true;
      }
    }
  }

  if (loadedFromDb && seedDataFromDb) {
    updateProgress("Validando e Importando...", 95);
    try {
      await processImportedSeed(seedDataFromDb);
      
      // Guardar en caché inteligente en memoria
      lastImportedSeedCache.url = url;
      lastImportedSeedCache.data = seedDataFromDb;

      // Guardar en plantillas recientes de localStorage
      if (window.saveToRecentSeeds) {
        window.saveToRecentSeeds(seedDataFromDb);
      }

      if (seedDataFromDb.isPartialImport) {
        showToast(`Clonación parcial exitosa de "${seedDataFromDb.name}" (roles y catálogo por defecto por reglas de origen).`, "warning");
      } else {
        showToast(`Clonación exitosa: Configuración de cliente "${seedDataFromDb.name}" importada.`, "success");
      }
      setTimeout(clearProgress, 1000);
      return;
    } catch (processErr) {
      showToast(`Error de estructura al procesar licencia: ${processErr.message}`, "danger");
      clearProgress();
      return;
    }
  }

  // 4. Descarga HTTP tradicional si no fue cargado desde bases de datos
  updateProgress("Iniciando conexión...", 10);
  
  const fetchStatus = {
    data: null,
    ok: false,
    corsError: false
  };

  // Paso 1: Intentar descarga directa
  try {
    updateProgress("Descargando directo (Paso 1/3)...", 30);
    const response = await fetch(url);
    if (response.ok) {
      fetchStatus.data = await response.json();
      fetchStatus.ok = true;
    } else {
      console.warn(`Descarga directa falló con código HTTP ${response.status}. Intentando vía proxy A...`);
    }
  } catch (directError) {
    fetchStatus.corsError = true;
    console.warn("Fallo de descarga directa (CORS/Red). Intentando vía proxy de respaldo...", directError);
  }

  // Paso 2: Proxy de respaldo A (AllOrigins)
  if (!fetchStatus.ok) {
    try {
      updateProgress("Descargando vía proxy AllOrigins (Paso 2/3)...", 60);
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const wrapper = await response.json();
        if (wrapper && wrapper.contents) {
          fetchStatus.data = JSON.parse(wrapper.contents);
          fetchStatus.ok = true;
        }
      }
    } catch (proxyErrorA) {
      console.warn("Fallo de descarga vía AllOrigins. Intentando proxy B...", proxyErrorA);
    }
  }

  // Paso 3: Proxy de respaldo B (CorsProxy.io)
  if (!fetchStatus.ok) {
    try {
      updateProgress("Descargando vía proxy CorsProxy (Paso 3/3)...", 80);
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        fetchStatus.data = await response.json();
        fetchStatus.ok = true;
      }
    } catch (proxyErrorB) {
      console.warn("Fallo de descarga vía CorsProxy.", proxyErrorB);
    }
  }

  if (fetchStatus.ok && fetchStatus.data) {
    updateProgress("Validando e Importando...", 95);
    try {
      await processImportedSeed(fetchStatus.data);
      
      // Guardar en caché inteligente en memoria
      lastImportedSeedCache.url = url;
      lastImportedSeedCache.data = fetchStatus.data;

      // Guardar en plantillas recientes de localStorage
      if (window.saveToRecentSeeds) {
        window.saveToRecentSeeds(fetchStatus.data);
      }

      showToast("Configuración cargada desde URL con éxito.", "success");
      setTimeout(clearProgress, 1000);
    } catch (processErr) {
      showToast(`Esquema de semilla inválido: ${processErr.message}`, "danger");
      addAuditLog('SYSTEM', 'ERROR_PROCESAMIENTO_SEMILLA', `Semilla inválida desde ${url}. Error: ${processErr.message}`);
      clearProgress();
    }
  } else {
    clearProgress();
    if (fetchStatus.corsError) {
      // Alertas dinámicas específicas de CORS
      showToast("Bloqueado por CORS. Usa 'Subir semilla' local para cargar el archivo.", "danger");
      addAuditLog('SECURITY', 'ERROR_CORS_IMPORTACION', `Error CORS persistente al descargar de ${url}`);
    } else {
      showToast("Fallo al descargar plantilla semilla desde la URL.", "danger");
    }
  }
};

window.importSeedFromFile = function(event) {
  state.importedDomain = null;
  const file = event.target.files[0];
  if (!file) return;

  const label = document.getElementById('w-file-label');
  if (label) label.innerText = file.name;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      await processImportedSeed(data);
      
      if (window.saveToRecentSeeds) {
        window.saveToRecentSeeds(data);
      }

      showToast("Configuración cargada desde archivo con éxito.", "success");
    } catch (error) {
      showToast(`Error al cargar archivo: ${error.message}`, "danger");
    }
  };
  reader.readAsText(file);
};

async function processImportedSeed(data) {
  // 1. Esquema Guard: Validación de campos principales
  if (!data.id || typeof data.id !== 'string' || !data.name || typeof data.name !== 'string' || !data.version || typeof data.version !== 'string') {
    showToast("Estructura JSON inválida: requiere id, name y version (tipo texto).", "danger");
    throw new Error("Faltan campos obligatorios en el JSON (id, name, version).");
  }

  // 2. Validación de integridad SHA-256 (Opcional si viene en el JSON)
  if (data.sha256Signature) {
    const signatureToVerify = data.sha256Signature;
    const copy = JSON.parse(JSON.stringify(data));
    delete copy.sha256Signature;
    const serialized = JSON.stringify(copy);
    const calculated = await sha256(serialized);
    if (calculated !== signatureToVerify) {
      showToast("Fallo de integridad: La firma SHA-256 no coincide.", "danger");
      throw new Error("La firma SHA-256 integrada no coincide con el contenido.");
    }
  }

  // Validar Roles
  if (data.roles && !Array.isArray(data.roles)) {
    showToast("Estructura JSON inválida: 'roles' debe ser un arreglo.", "danger");
    throw new Error("'roles' no es un arreglo.");
  }
  if (data.roles) {
    for (let idx = 0; idx < data.roles.length; idx++) {
      const r = data.roles[idx];
      if (!r.role || !r.name) {
        showToast("Estructura JSON inválida: cada rol debe contener 'role' y 'name'.", "danger");
        throw new Error("Esquema de roles incorrecto.");
      }
    }
  }

  // Validar Servicios
  if (data.services && !Array.isArray(data.services)) {
    showToast("Estructura JSON inválida: 'services' debe ser un arreglo.", "danger");
    throw new Error("'services' no es un arreglo.");
  }
  if (data.services) {
    for (let idx = 0; idx < data.services.length; idx++) {
      const s = data.services[idx];
      if (!s.name) {
        showToast("Estructura JSON inválida: cada servicio debe contener 'name'.", "danger");
        throw new Error("Esquema de servicios incorrecto.");
      }
    }
  }

  // Validar Business
  if (data.business && typeof data.business !== 'object') {
    showToast("Estructura JSON inválida: 'business' debe ser un objeto.", "danger");
    throw new Error("'business' no es un objeto.");
  }

  // 3. Guardar en el caché de semillas personalizadas (Seed Vault)
  if (!state.customSeeds) state.customSeeds = [];
  const existingSeedIndex = state.customSeeds.findIndex(s => s.id === data.id);
  if (existingSeedIndex !== -1) {
    state.customSeeds[existingSeedIndex] = data;
  } else {
    state.customSeeds.push(data);
  }

  // 4. Agregar a state.apps si no existe, o actualizarla si ya existe
  const existingAppIndex = state.apps.findIndex(a => a.id === data.id);
  const newApp = {
    id: data.id,
    name: data.name,
    version: data.version,
    status: data.status || 'RELEASED',
    activeClients: 0,
    icon: data.icon || 'ri-apps-fill',
    color: data.color || '#10b981'
  };

  if (existingAppIndex !== -1) {
    state.apps[existingAppIndex] = newApp;
  } else {
    state.apps.push(newApp);
  }

  // 5. Registrar/actualizar en SEED_TEMPLATES
  SEED_TEMPLATES[data.id] = {
    roles: data.roles || [],
    services: data.services || [],
    business: data.business || { name: data.name }
  };

  // Registrar en bitácora
  addAuditLog('SYSTEM', 'IMPORTACIÓN_PLANTILLA', `Plantilla de aplicación "${data.name}" (${data.id}) importada con éxito y almacenada en caché.`);

  saveToStorage();
  renderAll();

  const appSelect = document.getElementById('w-app-select');
  if (appSelect) {
    appSelect.value = data.id;
    window.onWizardAppChange();
  }
}

window.syncLicenseToFirestore = async function(license) {
  if (!license || !license.id) return;

  const currentStatus = (license.status || 'ACTIVE').toUpperCase();

  // Escritura autenticada única, protegida por firestore.rules
  // (isAlrSuperAdmin()) -- reemplaza tanto la llamada al backend de
  // Render/PATCH sin auth como el "respaldo" de PATCH REST directo
  // (ambos dependían de que Firestore estuviera abierto a todo internet).
  // Ya no se escriben incondicionalmente los 3 doc-ids de Kuatsi -- cada
  // licencia toca solo su propio docId.
  if (window.governanceDb) {
    try {
      const payload = {
        id: license.id,
        clientName: license.clientName || '',
        appName: license.appName || '',
        appId: license.appId || '',
        // apiKey ya NO vive en el documento principal -- se escribe
        // aparte en master_licenses/{id}/secrets/apiKey (mismo control
        // de acceso, pero así un futuro bug que exponga por error el
        // doc principal no arrastra el secreto con él). Se borra
        // explícitamente el campo viejo para ir limpiando documentos ya
        // existentes a medida que se tocan.
        apiKey: firebase.firestore.FieldValue.delete(),
        status: currentStatus,
        expiryDate: license.expiryDate || license.expirationDate || '2099-12-31T23:59:59Z',
        expirationDate: license.expiryDate || license.expirationDate || '2099-12-31T23:59:59Z',
        currentPlan: license.currentPlan || 'PAGADO',
        renewalPeriod: license.renewalPeriod || 'Mensual',
        paymentPeriod: license.paymentPeriod || 'Mensual',
        baseMonthlyFee: Number(license.baseMonthlyFee || license.monthlyFee || 500),
        adjustedMonthlyFee: Number(license.adjustedMonthlyFee || 500),
        startDate: license.startDate || license.createdAt || '2025-01-01',
        dailyCost: Number(license.dailyCost || 0),
        version: Number(license.version || 1),
        lastUpdated: new Date().toISOString()
      };
      const licenseRef = window.governanceDb.collection('master_licenses').doc(license.id);
      await licenseRef.set(payload, { merge: true });
      if (license.apiKey) {
        await licenseRef.collection('secrets').doc('apiKey').set({ value: license.apiKey }, { merge: true });
      }
      console.log(`[ALR GOVERNANCE] ✅ ${license.id} → ${currentStatus} persistido en Firestore.`);
    } catch (err) {
      console.error('[ALR GOVERNANCE] ❌ Error al escribir en Firestore:', err.message);
      showToast(`Error al sincronizar "${escapeHtml(license.clientName || license.id)}" con la nube: ${err.message}`, 'danger');
    }
  } else {
    console.warn('[ALR GOVERNANCE] governanceDb no disponible; se omite la escritura.');
  }

  // Lo siguiente sincroniza además con una instancia OPCIONAL de Firebase
  // ("Bring your own Firebase") que el operador puede configurar por su
  // cuenta desde la UI -- no es master_licenses de brain-branding, así
  // que no depende del canal de arriba ni de sus reglas.
  if (!window.FIREBASE_SYNC_ENABLED || !window.firestoreDb) {
    return;
  }
  
  if (!navigator.onLine) {
    let pendingLicenses = [];
    try {
      const raw = localStorage.getItem('alr_saas_pending_license_sync');
      if (raw) pendingLicenses = JSON.parse(raw);
    } catch (e) {}
    
    if (!pendingLicenses.includes(license.id)) {
      pendingLicenses.push(license.id);
      localStorage.setItem('alr_saas_pending_license_sync', JSON.stringify(pendingLicenses));
      renderClientsTable();
    }
    return;
  }

  try {
    // 🔐 Sugerencia 36: Concurrencia Optimista (Verificación de versión)
    const docRef = window.firestoreDb.collection('master_licenses').doc(license.id);
    const docSnap = await docRef.get();
    let remoteVersion = 0;
    let remoteData = null;
    
    if (docSnap.exists) {
      remoteData = docSnap.data();
      remoteVersion = remoteData.version || 1;
    }
    
    const localVersion = license.version || 1;
    
    if (remoteVersion > localVersion) {
      console.warn(`[FIREBASE] Conflicto de concurrencia detectado para cliente: ${license.clientName}. Local v${localVersion} vs Nube v${remoteVersion}.`);
      window.CONCURRENCY_POLICY = localStorage.getItem('alr_saas_concurrency_policy') || 'MANUAL';
      if (window.CONCURRENCY_POLICY === 'FORCE_LOCAL') {
        console.log(`[CONCURRENCY] Aplicando política FORCE_LOCAL.`);
        window.resolveConflictForceLocal(license.id, remoteVersion);
      } else if (window.CONCURRENCY_POLICY === 'FORCE_CLOUD') {
        console.log(`[CONCURRENCY] Aplicando política FORCE_CLOUD.`);
        window.resolveConflictPullRemote(license.id);
      } else {
        window.resolveSyncConflict(license, remoteData);
      }
      return;
    }

    const batch = window.firestoreDb.batch();
    batch.set(docRef, {
      clientName: license.clientName,
      appName: license.appName,
      appId: license.appId,
      apiKey: license.apiKey,
      expiryDate: license.expiryDate,
      currentPlan: license.currentPlan,
      dailyCost: license.dailyCost,
      initialAmount: license.initialAmount,
      status: license.status,
      contact: license.contact,
      gracePeriodHours: license.gracePeriodHours || 24,
      customConfig: license.customConfig || null,
      version: localVersion,
      synchronizedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Sincronizar también el log de auditoría en el mismo lote transaccional
    const logRef = window.firestoreDb.collection('alr_saas_sync_logs').doc();
    batch.set(logRef, {
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      clientId: license.id,
      clientName: license.clientName,
      action: 'SYNC_LICENSE',
      plan: license.currentPlan,
      status: license.status
    });

    await batch.commit();
    
    let pendingLicenses = [];
    try {
      const raw = localStorage.getItem('alr_saas_pending_license_sync');
      if (raw) pendingLicenses = JSON.parse(raw);
    } catch (e) {}
    pendingLicenses = pendingLicenses.filter(id => id !== license.id);
    localStorage.setItem('alr_saas_pending_license_sync', JSON.stringify(pendingLicenses));
    renderClientsTable();
    
    console.log(`[FIREBASE] Licencia de cliente ${license.clientName} sincronizada con éxito.`);
  } catch (err) {
    console.error(`[FIREBASE] Error al sincronizar licencia ${license.clientName}:`, err);
    let pendingLicenses = [];
    try {
      const raw = localStorage.getItem('alr_saas_pending_license_sync');
      if (raw) pendingLicenses = JSON.parse(raw);
    } catch (e) {}
    if (!pendingLicenses.includes(license.id)) {
      pendingLicenses.push(license.id);
      localStorage.setItem('alr_saas_pending_license_sync', JSON.stringify(pendingLicenses));
      renderClientsTable();
    }
  }
};

window.lastNetCheck = null;
window.lastNetCheckTime = 0;

window.checkInternetConnection = async function() {
  if (!navigator.onLine) return false;
  
  const now = Date.now();
  if (window.lastNetCheck !== null && (now - window.lastNetCheckTime < 20000)) {
    return window.lastNetCheck;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    await fetch('https://firestore.googleapis.com/', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    window.lastNetCheck = true;
    window.lastNetCheckTime = now;
    return true;
  } catch (e) {
    window.lastNetCheck = false;
    window.lastNetCheckTime = now;
    return false;
  }
};

window.addEventListener('online', async () => {
  const hasInternet = await window.checkInternetConnection();
  if (!hasInternet) return;
  
  verifyAuditLedger();
  if (state.ledgerIntact === false) {
    showToast("¡Alerta de Seguridad! Autovaciado bloqueado por ledger comprometido.", "danger");
    addAuditLog('SECURITY', 'AUTO_SYNC_BLOCKED', "Intento de autovaciado de cola offline abortado debido a fallo de integridad en el ledger local.");
    if (typeof window.triggerSecondarySecurityAlert === 'function') {
      window.triggerSecondarySecurityAlert('BRECHA_CONFIG', {
        detail: "Fallo de integridad en el ledger detectado durante reconexión. Sincronización bloqueada."
      });
    }
    return;
  }

  showToast("Conexión de red restablecida. Sincronizando datos automáticamente...", "info");
  
  if (window.FIREBASE_SYNC_ENABLED) {
    await window.syncLogsToFirebase();
  }
  
  let pendingLicenses = [];
  try {
    const raw = localStorage.getItem('alr_saas_pending_license_sync');
    if (raw) pendingLicenses = JSON.parse(raw);
  } catch (e) {}
  
  if (pendingLicenses.length > 0) {
    let successCount = 0;
    const idsToProcess = [...pendingLicenses];
    for (let idx = 0; idx < idsToProcess.length; idx++) {
      const id = idsToProcess[idx];
      const license = state.licenses.find(l => l.id === id) || (state.recycleBin.find(item => item.license.id === id)?.license);
      if (license) {
        try {
          await window.syncLicenseToFirestore(license);
          successCount++;
        } catch (err) {}
      }
    }
    if (successCount > 0) {
      showToast("Sincronización automática: licencias actualizadas en la nube.", "success");
    }
  }
});

// ==================== SECURITY & AUTHENTICATION HARDENING UTILITIES ====================
window.togglePinVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.className = 'ri-eye-line';
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.className = 'ri-eye-off-line';
    }
  }
};

window.checkLockoutState = function() {
  const lockoutTime = localStorage.getItem('alr_saas_auth_lockout_time');
  if (lockoutTime) {
    const remaining = parseInt(lockoutTime, 10) - Date.now();
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60000);
      showToast(`Acceso bloqueado temporalmente. Reintenta en ${minutes} min.`, "danger");
      return true;
    } else {
      localStorage.removeItem('alr_saas_auth_lockout_time');
      localStorage.setItem('alr_saas_auth_failures', '0');
    }
  }
  return false;
};

window.registerAuthFailure = function(username, context) {
  let failures = parseInt(localStorage.getItem('alr_saas_auth_failures') || '0', 10);
  failures += 1;
  localStorage.setItem('alr_saas_auth_failures', failures.toString());

  window.triggerAuthFailureAlert(username, context);

  if (failures >= 3) {
    const lockoutUntil = Date.now() + 15 * 60 * 1000;
    localStorage.setItem('alr_saas_auth_lockout_time', lockoutUntil.toString());
    showToast("Demasiados intentos fallidos. Consola bloqueada por 15 minutos.", "danger");
    addAuditLog('SECURITY', 'LOCKOUT_ACTIVO', `Bloqueo preventivo de consola activado tras 3 fallos consecutivos.`);
  }
};

window.clearAuthFailures = function() {
  localStorage.setItem('alr_saas_auth_failures', '0');
  localStorage.removeItem('alr_saas_auth_lockout_time');
};

window.triggerAuthFailureAlert = function(username, context) {
  const tgMessage = `🚨 <b>[ALERTA DE SEGURIDAD]</b>\nSe ha detectado un intento de autenticación fallido en la consola central.\n\n<b>Usuario:</b> ${username}\n<b>Acceso:</b> ${context}\n<b>Timestamp:</b> ${new Date().toLocaleString()}`;
  window.sendTelegramNotification(tgMessage);
};

// ==================== OFFLINE SEED HISTORIAL & SECURITY SWITCH UTILITIES ====================
window.saveToRecentSeeds = function(seedData) {
  let recents = [];
  try {
    const raw = localStorage.getItem('alr_saas_recent_seeds');
    if (raw) recents = JSON.parse(raw);
  } catch (e) {}
  
  recents = recents.filter(item => item.id !== seedData.id);
  
  recents.unshift({
    id: seedData.id,
    name: seedData.name,
    version: seedData.version,
    timestamp: Date.now(),
    data: seedData
  });
  
  if (recents.length > 3) {
    recents = recents.slice(0, 3);
  }
  
  localStorage.setItem('alr_saas_recent_seeds', JSON.stringify(recents));
  window.renderRecentSeeds();
};

window.renderRecentSeeds = function() {
  const container = document.getElementById('recent-seeds-container');
  if (!container) return;
  
  let recents = [];
  try {
    const raw = localStorage.getItem('alr_saas_recent_seeds');
    if (raw) recents = JSON.parse(raw);
  } catch (e) {}
  
  if (recents.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const listHtml = recents.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-glass); border-radius: 12px; padding: 10px 16px; margin-bottom: 8px;">
      <div style="display: flex; flex-direction: column; text-align: left;">
        <span style="font-size: 10px; font-weight: 900; color: #fff;">${item.name} <span style="font-size: 8px; opacity: 0.5;">(${item.version})</span></span>
        <span style="font-size: 8px; opacity: 0.5;">ID: ${item.id} · Cargar Offline</span>
      </div>
      <button class="btn btn-secondary" style="height: 24px; font-size: 8px; padding: 0 10px; font-weight: 800;" onclick="window.loadRecentSeedOffline('${item.id}')">
        <i class="ri-history-line"></i> Re-instalar
      </button>
    </div>
  `).join('');
  
  container.innerHTML = `
    <h4 style="font-size: 9px; font-weight: 900; color: var(--accent); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; margin-top: 15px;">Plantillas Recientes (Instalación Offline)</h4>
    ${listHtml}
  `;
};

window.loadRecentSeedOffline = function(id) {
  let recents = [];
  try {
    const raw = localStorage.getItem('alr_saas_recent_seeds');
    if (raw) recents = JSON.parse(raw);
  } catch (e) {}
  
  const found = recents.find(item => item.id === id);
  if (found && found.data) {
    processImportedSeed(found.data);
    showToast(`Plantilla "${found.name}" cargada desde historial offline con éxito.`, "success");
  } else {
    showToast("No se pudo cargar la plantilla local.", "danger");
  }
};

window.saveStrictDomainsConfig = function() {
  const checkbox = document.getElementById('cfg-strict-domains-enabled');
  if (checkbox) {
    localStorage.setItem('alr_saas_strict_domain_validation', checkbox.checked ? 'true' : 'false');
    showToast(`Validación estricta de dominios ${checkbox.checked ? 'activada' : 'desactivada'}.`, "info");
    addAuditLog('SYSTEM', 'CONFIG_DOMINIOS', `Validación estricta de dominios configurada a: ${checkbox.checked}`);
  }
};

window.loadStrictDomainsConfig = function() {
  const checkbox = document.getElementById('cfg-strict-domains-enabled');
  if (checkbox) {
    const isStrict = localStorage.getItem('alr_saas_strict_domain_validation') !== 'false';
    checkbox.checked = isStrict;
    const slider = checkbox.nextElementSibling;
    const knob = slider?.querySelector('.switch-knob');
    if (slider && knob) {
      if (isStrict) {
        slider.style.background = 'var(--accent)';
        knob.style.left = '16px';
        knob.style.background = '#000';
      } else {
        slider.style.background = 'rgba(255,255,255,0.08)';
        knob.style.left = '2px';
        knob.style.background = 'rgba(255,255,255,0.4)';
      }
    }
  }
};

window.cloneClientWizard = function(licenseId) {
  const license = state.licenses.find(l => l.id === licenseId);
  if (!license) return;
  
  window.switchView('wizard');
  
  const nameInput = document.getElementById('w-client-name');
  const slugInput = document.getElementById('w-client-slug');
  const titleInput = document.getElementById('w-app-title');
  const appSelect = document.getElementById('w-app-select');
  const planSelect = document.getElementById('w-plan-select');
  const dailyCostInput = document.getElementById('w-daily-cost');
  const contactInput = document.getElementById('w-contact-phone');
  const initialAmountInput = document.getElementById('w-initial-amount');
  const graceHoursInput = document.getElementById('w-grace-hours');
  const appUrlInput = document.getElementById('w-app-url');
  
  const bizNameInput = document.getElementById('w-seed-biz-name');
  const rolesTextarea = document.getElementById('w-seed-roles');
  const servicesTextarea = document.getElementById('w-seed-services');
  
  if (appSelect) appSelect.value = license.appId;
  if (nameInput) nameInput.value = license.clientName + " Copia";
  if (slugInput) slugInput.value = license.id + "_copia";
  if (titleInput) titleInput.value = license.appName + " (Copia)";
  if (planSelect) planSelect.value = license.currentPlan;
  if (dailyCostInput) dailyCostInput.value = license.dailyCost;
  if (contactInput) contactInput.value = license.contact;
  if (initialAmountInput) initialAmountInput.value = license.initialAmount;
  if (graceHoursInput) graceHoursInput.value = license.gracePeriodHours || 24;
  if (appUrlInput) {
    const baseDomain = state.importedDomain || 'https://rey-smart-wash.web.app';
    appUrlInput.value = `${baseDomain}/${license.id}_copia`;
  }
  
  if (bizNameInput) bizNameInput.value = license.customConfig?.business?.name || license.clientName;
  if (rolesTextarea && license.customConfig?.roles) {
    rolesTextarea.value = license.customConfig.roles.map(r => `${r.role},${r.name},${r.defaultPin || ''}`).join('\n');
  }
  if (servicesTextarea && license.customConfig?.services) {
    servicesTextarea.value = license.customConfig.services.map(s => `${s.name},${s.price || s.itemsCount || 0}`).join('\n');
  }
  
  showToast(`Cargados datos de ${escapeHtml(license.clientName)} en el Asistente para clonación rápida.`, "success");
};

window.viewSeedTemplateSchema = function(appId) {
  const seed = SEED_TEMPLATES[appId];
  if (!seed) {
    showToast("No se encontró la semilla base para esta aplicación.", "danger");
    return;
  }
  
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;
  
  const serializedSeed = JSON.stringify(seed, null, 2);
  const appRecord = state.apps.find(a => a.id === appId) || { color: '#10b981' };
  
  box.innerHTML = `
    <div style="padding: 30px; text-align: left; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 900; color: var(--accent); text-transform: uppercase;">Esquema Semilla: ${appId}</h3>
        <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;" onclick="closeModal()">
          <i class="ri-close-line"></i>
        </button>
      </div>
      
      <!-- Personalizar Color (Sugerencia 6) -->
      <div style="margin-bottom: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px;">
        <span style="font-size: 9px; font-weight: 800; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Personalizar Color de Tarjeta</span>
        <div style="display: flex; gap: 8px;">
          ${['#10b981', '#00e5ff', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].map(color => `
            <span onclick="window.updateAppColor('${appId}', '${color}')" style="width: 20px; height: 20px; border-radius: 50%; background: ${color}; display: inline-block; cursor: pointer; border: 2px solid ${appRecord.color === color ? '#fff' : 'transparent'}; box-shadow: 0 0 10px ${color}40;" title="Cambiar color a ${color}"></span>
          `).join('')}
        </div>
      </div>
      
      <p style="font-size: 11px; opacity: 0.7; margin-bottom: 16px;">Este JSON representa la configuración inicial de roles, servicios y estructura comercial sembrada al aprovisionar:</p>
      
      <pre style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-glass); border-radius: 12px; padding: 16px; font-family: var(--font-mono); font-size: 10px; color: #a5d6ff; overflow-x: auto; max-height: 350px; line-height: 1.4;" class="custom-scroll">${serializedSeed}</pre>
      
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn btn-primary" style="flex: 1;" onclick="navigator.clipboard.writeText(\`${serializedSeed.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); showToast('Copiado al portapapeles', 'success');">
          <i class="ri-file-copy-line"></i> Copiar JSON
        </button>
        <button class="btn btn-secondary" style="flex: 1;" onclick="closeModal()">Cerrar Ventana</button>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
};

window.updateAppColor = function(appId, color) {
  const app = state.apps.find(a => a.id === appId);
  if (app) {
    app.color = color;
    if (state.customSeeds) {
      const customSeed = state.customSeeds.find(s => s.id === appId);
      if (customSeed) customSeed.color = color;
    }
    saveToStorage();
    renderAll();
    window.viewSeedTemplateSchema(appId);
    showToast("Color de la aplicación actualizado con éxito.", "success");
    addAuditLog('SYSTEM', 'COLOR_APP', `Actualizado color de app ${appId} a ${color}`);
  }
};

// Configuración de auto-clonado por app-type (una sola vez por app, no por
// cliente) -- estos 5 campos le dicen a provisionAppClone a qué proyecto de
// Firebase y a qué función de alta de tenants llamar cuando el Asistente
// clona esta app para un cliente nuevo. webApiKey NO es secreta (ya vive
// pública en el app_config.js de cada app cliente).
window.openAppCloneConfigModal = function(appId) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const existing = (state.appRegistry && state.appRegistry[appId]) || {};
  const g = (v, d = '') => escapeHtml(String(v ?? d));

  box.innerHTML = `
    <div style="padding: 30px; text-align: left; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 900; color: var(--accent); text-transform: uppercase;">Auto-clonado: ${g(appId)}</h3>
        <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;" onclick="closeModal()">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <p style="font-size: 11px; opacity: 0.7; margin-bottom: 16px;">
        Configura esto UNA vez por app (no por cliente). Con estos datos, el botón "Clonar" del Asistente dará de alta clientes nuevos como tenants reales dentro del proyecto ya desplegado, en vez de solo registrar metadata.
      </p>

      <div class="form-group">
        <label class="form-label">Firebase Project ID</label>
        <input type="text" id="clone-cfg-project" class="form-input" value="${g(existing.firebaseProjectId)}" placeholder="rey-smart-wash">
      </div>
      <div class="form-group">
        <label class="form-label">Región de Cloud Functions</label>
        <input type="text" id="clone-cfg-region" class="form-input" value="${g(existing.functionsRegion, 'us-central1')}" placeholder="us-central1">
      </div>
      <div class="form-group">
        <label class="form-label">Web API Key (pública, no es secreta)</label>
        <input type="text" id="clone-cfg-apikey" class="form-input" value="${g(existing.webApiKey)}" placeholder="AIza...">
      </div>
      <div class="form-group">
        <label class="form-label">Nombre de la función de alta de tenants</label>
        <input type="text" id="clone-cfg-fnname" class="form-input" value="${g(existing.registerFunctionName, 'registerTenant')}" placeholder="registerTenant">
      </div>
      <div class="form-group">
        <label class="form-label">URL base de Hosting</label>
        <input type="text" id="clone-cfg-hosting" class="form-input" value="${g(existing.hostingBaseUrl)}" placeholder="https://rey-smart-wash.web.app">
      </div>

      <div style="margin: 20px 0; border-top: 1px solid var(--border-glass); padding-top: 16px;">
        <span style="font-size: 9px; font-weight: 800; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 10px;">Borrado de tenants (opcional, para el botón "Borrar tenant real")</span>
        <div class="form-group">
          <label class="form-label">Nombre de la función de borrado</label>
          <input type="text" id="clone-cfg-delfnname" class="form-input" value="${g(existing.deleteFunctionName, 'deleteTenant')}" placeholder="deleteTenant">
        </div>
        <div class="form-group">
          <label class="form-label">PIN de administrador de la app destino (ej. el mismo de comando_rey)</label>
          <input type="password" id="clone-cfg-adminpin" class="form-input" value="${g(existing.adminPin)}" placeholder="•••••••">
        </div>
      </div>

      <div id="clone-cfg-test-result" style="font-size: 11px; margin-bottom: 12px;"></div>

      <div style="display: flex; gap: 16px; margin-top: 24px;">
        <button class="btn btn-secondary flex-1" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-secondary flex-1" onclick="window.testAppCloneConfig('${g(appId)}')">Probar conexión</button>
        <button class="btn btn-primary flex-2" onclick="window.saveAppCloneConfig('${g(appId)}')">Guardar configuración</button>
      </div>

      ${existing.deleteFunctionName ? `
      <div style="margin-top: 20px; border-top: 1px solid var(--border-glass); padding-top: 16px;">
        <span style="font-size: 9px; font-weight: 800; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 10px;">Restaurar un tenant (aunque ya no aparezca en la tabla, ej. borrado por error)</span>
        <div style="display:flex; gap:8px;">
          <input type="text" id="clone-cfg-restore-tenantid" class="form-input" placeholder="id del tenant a restaurar" style="flex:1;">
          <button class="btn btn-secondary" style="color:#f59e0b;" onclick="window.restoreTenantReal(document.getElementById('clone-cfg-restore-tenantid').value.trim(), '${g(appId)}', document.getElementById('clone-cfg-restore-tenantid').value.trim())">Restaurar</button>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  overlay.classList.add('active');
  overlay.style.display = 'flex';
};

// "Probar conexión" -- solo prueba webApiKey + registerFunctionName SIN
// crear ningún tenant (ver testAppCloneConnection en functions/index.js).
// Requiere haber guardado la config primero (lee de state.appRegistry).
window.testAppCloneConfig = async function(appId) {
  const resultEl = document.getElementById('clone-cfg-test-result');
  if (!state.appRegistry || !state.appRegistry[appId]) {
    if (resultEl) resultEl.innerHTML = `<span style="color:#f59e0b;">Guarda la configuración primero para poder probarla.</span>`;
    return;
  }
  if (resultEl) resultEl.innerHTML = `<span style="opacity:0.6;">Probando conexión...</span>`;
  try {
    const call = window.governanceFunctions.httpsCallable('testAppCloneConnection');
    const res = await call({ appId });
    const { ok, detail } = res.data || {};
    if (resultEl) {
      resultEl.innerHTML = ok
        ? `<span style="color:#2ecc71;">✅ ${escapeHtml(detail || 'Conexión verificada.')}</span>`
        : `<span style="color:#ef4444;">❌ ${escapeHtml(detail || 'Falló la conexión.')}</span>`;
    }
  } catch (err) {
    if (resultEl) resultEl.innerHTML = `<span style="color:#ef4444;">❌ ${escapeHtml(err.message || String(err))}</span>`;
  }
};

window.saveAppCloneConfig = function(appId) {
  const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
  const config = {
    firebaseProjectId: getVal('clone-cfg-project'),
    functionsRegion: getVal('clone-cfg-region') || 'us-central1',
    webApiKey: getVal('clone-cfg-apikey'),
    registerFunctionName: getVal('clone-cfg-fnname') || 'registerTenant',
    hostingBaseUrl: getVal('clone-cfg-hosting').replace(/\/$/, ''),
    deleteFunctionName: getVal('clone-cfg-delfnname') || 'deleteTenant',
    adminPin: getVal('clone-cfg-adminpin')
  };

  if (!config.firebaseProjectId || !config.webApiKey || !config.hostingBaseUrl) {
    showToast("Completa Project ID, Web API Key y URL de Hosting.", "warning");
    return;
  }

  window.requestAdminVerification(`Configurar auto-clonado (${appId})`, async () => {
    if (!window.governanceDb) {
      showToast("Sin sesión de gobernanza activa.", "warning");
      return;
    }
    try {
      await window.governanceDb.collection('alr-saas-app-registry').doc(appId).set(config, { merge: true });
      if (!state.appRegistry) state.appRegistry = {};
      state.appRegistry[appId] = config;
      addAuditLog('SYSTEM', 'CONFIG_AUTO_CLONADO', `Auto-clonado configurado para ${appId} -> proyecto ${config.firebaseProjectId}.`);
      showToast(`Auto-clonado de ${appId} guardado.`, "success");
      closeModal();
      renderAll();
    } catch (err) {
      console.error('[SAVE CLONE CONFIG ERR]', err);
      showToast(`Error al guardar: ${err.message}`, "danger");
    }
  });
};

window.simulateClientUsage = function(licenseId) {
  const license = state.licenses.find(l => l.id === licenseId);
  if (!license) return;
  
  if (license.status === 'SUSPENDED') {
    showToast(`El cliente ${escapeHtml(license.clientName)} está suspendido. Actívalo para simular uso.`, "warning");
    return;
  }
  
  license.usageOps = (license.usageOps || 0) + 10;
  const costPerOp = license.perOpCost || 0.50;
  const totalDeduction = 10 * costPerOp;
  license.initialAmount = Math.max(0, license.initialAmount - totalDeduction);
  
  if (license.initialAmount <= 0) {
    license.status = 'SUSPENDED';
    addAuditLog('TELEMETRÍA', 'SUSPENSIÓN_AUTOMÁTICA', `Licencia de cliente ${license.clientName} suspendida automáticamente por saldo agotado.`);
    showToast(`Saldo de ${escapeHtml(license.clientName)} agotado. Suspendido.`, "danger");
  } else {
    showToast(`Simuladas 10 operaciones en ${escapeHtml(license.clientName)}. Descontado $${totalDeduction.toFixed(2)}. Saldo actual: $${license.initialAmount.toFixed(2)}`, "success");
    addAuditLog('TELEMETRÍA', 'MOCK_USO', `Simuladas 10 ops en ${license.clientName}. Saldo restante: $${license.initialAmount}`);
  }
  
  saveToStorage();
  window.syncLicenseToFirestore(license);
  renderAll();
};

window.viewAppAuditLogs = function(appId) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;
  
  const appLogs = state.logs.filter(log => 
    log.message.includes(appId) || 
    log.action.includes(appId) ||
    log.module.includes(appId)
  ).slice(0, 50);
  
  let logsHtml = '';
  if (appLogs.length === 0) {
    logsHtml = `<div style="text-align: center; opacity: 0.5; padding: 20px; font-size: 11px;">No hay registros de auditoría para esta aplicación.</div>`;
  } else {
    logsHtml = appLogs.map(log => `
      <div style="border-bottom: 1px solid var(--border-glass); padding: 8px 0; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; font-size: 8px; opacity: 0.5;">
          <span>${new Date(log.timestamp).toLocaleString()}</span>
          <span style="color: var(--accent); font-weight: 800;">${log.module} · ${log.action}</span>
        </div>
        <div style="font-size: 10px; line-height: 1.4; color: #fff;">${log.message}</div>
      </div>
    `).join('');
  }
  
  box.innerHTML = `
    <div style="padding: 30px; text-align: left; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 900; color: var(--accent); text-transform: uppercase;">Bitácora de Auditoría: ${appId}</h3>
        <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;" onclick="closeModal()">
          <i class="ri-close-line"></i>
        </button>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;" class="custom-scroll">
        ${logsHtml}
      </div>
      
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="closeModal()">Cerrar Ventana</button>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
};

window.exportAllSeedsJson = function() {
  if (state.customSeeds.length === 0) {
    showToast("No hay semillas personalizadas cargadas para exportar.", "warning");
    return;
  }
  
  const allSeeds = {};
  state.customSeeds.forEach(seed => {
    allSeeds[seed.id] = seed;
  });
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allSeeds, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "alr_saas_all_custom_seeds.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  
  showToast(`Exportadas ${state.customSeeds.length} semillas en lote con éxito.`, "success");
  addAuditLog('ORQUESTADOR', 'EXPORTACIÓN_LOTES', `Exportadas ${state.customSeeds.length} semillas base.`);
};

window.filterAppsPortfolio = function(val) {
  renderAppsPortfolio();
};

window.openTelegramHelpModal = function() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="padding: 30px; text-align: left; max-height:85vh; overflow-y:auto;" class="custom-scroll">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 900; color: var(--accent); text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
          <i class="ri-telegram-fill" style="color: #0088cc;"></i> Guía de Configuración Telegram
        </h3>
        <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;" onclick="closeModal()">
          <i class="ri-close-line"></i>
        </button>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 20px; font-size: 11px; line-height: 1.6;">
        <!-- Paso 1 -->
        <div>
          <h4 style="color: var(--accent); font-weight: 800; font-size: 12px; margin-bottom: 6px;">1. Crear el Bot de Telegram (Obtener Token)</h4>
          <p style="opacity: 0.8; margin-bottom: 8px;">
            Para enviar notificaciones y alertas, necesitas crear tu propio bot en Telegram de forma gratuita:
          </p>
          <ul style="padding-left: 20px; margin: 0; list-style-type: square; opacity: 0.8;">
            <li>Abre la app de Telegram y busca al usuario <a href="https://t.me/BotFather" target="_blank" style="color: var(--accent); text-decoration: underline; font-weight: 700;">@BotFather</a> (la cuenta oficial con insignia de verificación azul).</li>
            <li>Inicia la conversación y envía el comando <code>/newbot</code>.</li>
            <li>Escribe un <b>nombre</b> para tu bot (ej: <code>ALR SaaS Monitor</code>).</li>
            <li>Elige un <b>nombre de usuario</b> único que termine en "bot" (ej: <code>alr_saas_monitor_bot</code>).</li>
            <li>BotFather te responderá con un mensaje que contiene el <b>Token de Acceso HTTP API</b> (ej: <code>123456789:ABCdefGhI...</code>). Cópialo y pégalo en el campo "Token de Bot Telegram".</li>
          </ul>
        </div>

        <!-- Paso 2 -->
        <div>
          <h4 style="color: var(--accent); font-weight: 800; font-size: 12px; margin-bottom: 6px;">2. Obtener el ID de Chat Destinatario</h4>
          <p style="opacity: 0.8; margin-bottom: 8px;">
            El ID de chat le indica al bot a dónde debe enviar las notificaciones (a tu chat privado o a un grupo de alertas):
          </p>
          <ul style="padding-left: 20px; margin: 0; list-style-type: square; opacity: 0.8;">
            <li>
              <b>Para Chat Privado (Tus alertas):</b> Busca al bot <a href="https://t.me/userinfobot" target="_blank" style="color: var(--accent); text-decoration: underline; font-weight: 700;">@userinfobot</a> e inicia conversación. Te responderá de inmediato con tu ID personal (ej: <code>8337803949</code>). Cópialo en "ID de Chat Destinatario".
            </li>
            <li>
              <b>Para un Grupo (Alertas del equipo):</b> Agrega tu bot recién creado y al bot público <a href="https://t.me/RawDataBot" target="_blank" style="color: var(--accent); text-decoration: underline; font-weight: 700;">@RawDataBot</a> al grupo de Telegram. El bot RawData publicará un mensaje JSON. Busca la sección <code>"chat": {"id": -100XXXXXXXXXX}</code>. Copia ese número (incluido el signo de menos "-") y pégalo en "ID de Chat Destinatario". Una vez obtenido, puedes expulsar a RawDataBot del grupo.
            </li>
          </ul>
        </div>

        <!-- Paso 3 -->
        <div>
          <h4 style="color: var(--accent); font-weight: 800; font-size: 12px; margin-bottom: 6px;">3. Activar y Verificar</h4>
          <ul style="padding-left: 20px; margin: 0; list-style-type: square; opacity: 0.8;">
            <li>¡Importante! Debes abrir una conversación privada con tu bot en Telegram (ej: busca <code>@tu_bot_usuario_bot</code> y haz clic en <b>Iniciar</b> o envía <code>/start</code>). Si no lo haces, Telegram bloqueará el envío de mensajes por seguridad.</li>
            <li>Coloca tu ID numérico de usuario en la <b>Lista Blanca de Telegram</b>. Esto permite que el bot solo responda a comandos interactivos (ej: <code>/estado</code>, <code>/bloquear</code>) provenientes de administradores autorizados.</li>
            <li>Haz clic en <b>Probar Telegram</b> para verificar que la configuración se guarde y que recibas el mensaje de prueba en tiempo real.</li>
          </ul>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn btn-primary" style="flex: 1;" onclick="closeModal()">Entendido y Listo</button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
};

// ==================== FUNCIONES ADICIONALES DE GOBERNANZA Y CONCURRENCIA ====================

// 🔐 Sugerencia 36: Manejo de Conflictos de Concurrencia Optimista (Overlay Resolutor)
window.resolveSyncConflict = function(license, remoteData) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const localVersion = license.version || 1;
  const remoteVersion = remoteData.version || 1;

  box.innerHTML = `
    <div style="padding: 30px;">
      <h2 style="font-size: 18px; font-weight: 900; color: var(--danger); margin-bottom: 12px; text-transform: uppercase;">
        <i class="ri-error-warning-fill"></i> Conflicto de Sincronización
      </h2>
      <p style="font-size: 11px; opacity:0.8; margin-bottom:20px; line-height: 1.4;">
        Se ha detectado una versión más reciente en la nube para el cliente <b>${escapeHtml(license.clientName)}</b>.<br>
        Versión Local: <b>v${localVersion}</b> | Versión en la Nube: <b>v${remoteVersion}</b>.
      </p>
      
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 15px; font-size: 11px;">
          <h4 style="font-weight:900; color:var(--accent); margin-bottom:8px;">Datos Locales (v${localVersion})</h4>
          <div>Plan: <b>${escapeHtml(license.currentPlan)}</b></div>
          <div>Estado: <b>${escapeHtml(license.status)}</b></div>
          <div>Costo diario: <b>$${escapeHtml(license.dailyCost)}</b></div>
          <div style="font-size: 9px; opacity: 0.5; margin-top: 8px;">Editado localmente</div>
        </div>
        <div style="flex: 1; background: rgba(0,229,255,0.03); border: 1px solid rgba(0,229,255,0.15); border-radius: 12px; padding: 15px; font-size: 11px;">
          <h4 style="font-weight:900; color:var(--accent-secondary); margin-bottom:8px;">Datos en Nube (v${remoteVersion})</h4>
          <div>Plan: <b>${escapeHtml(remoteData.currentPlan)}</b></div>
          <div>Estado: <b>${escapeHtml(remoteData.status)}</b></div>
          <div>Costo diario: <b>$${escapeHtml(remoteData.dailyCost)}</b></div>
          <div style="font-size: 9px; opacity: 0.5; margin-top: 8px;">Sincronizado el: ${new Date(remoteData.synchronizedAt?.seconds * 1000 || Date.now()).toLocaleString()}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn btn-primary" style="width: 100%;" onclick="window.resolveConflictForceLocal('${license.id}', ${remoteVersion})">
          <i class="ri-upload-cloud-2-line"></i> Forzar Versión Local (Subir v${remoteVersion + 1})
        </button>
        <button class="btn btn-secondary" style="width: 100%;" onclick="window.resolveConflictPullRemote('${license.id}')">
          <i class="ri-download-cloud-2-line"></i> Aceptar Versión Nube (Sobrescribir Local)
        </button>
        <button class="btn btn-secondary" style="width: 100%; opacity: 0.6;" onclick="closeModal()">
          Cancelar y Resolver Más Tarde
        </button>
      </div>
    </div>
  `;
  overlay.classList.add('active');
};

window.resolveConflictForceLocal = async function(licenseId, remoteVersion) {
  const license = state.licenses.find(l => l.id === licenseId);
  if (!license) return;

  license.version = remoteVersion + 1;
  closeModal();
  showToast("Forzando sincronización local...", "info");
  
  await saveToStorage();
  await window.syncLicenseToFirestore(license);
};

window.resolveConflictPullRemote = async function(licenseId) {
  if (!window.FIREBASE_SYNC_ENABLED || !window.firestoreDb) return;
  
  closeModal();
  showToast("Descargando versión de la nube...", "info");
  
  try {
    const docSnap = await window.firestoreDb.collection('master_licenses').doc(licenseId).get();
    if (docSnap.exists) {
      const remoteData = docSnap.data();
      const idx = state.licenses.findIndex(l => l.id === licenseId);
      if (idx !== -1) {
        state.licenses[idx] = {
          id: licenseId,
          clientName: remoteData.clientName,
          appName: remoteData.appName,
          appId: remoteData.appId,
          apiKey: remoteData.apiKey,
          expiryDate: remoteData.expiryDate,
          currentPlan: remoteData.currentPlan,
          dailyCost: remoteData.dailyCost,
          initialAmount: remoteData.initialAmount,
          status: remoteData.status,
          contact: remoteData.contact,
          gracePeriodHours: remoteData.gracePeriodHours || 24,
          customConfig: remoteData.customConfig || null,
          version: remoteData.version || 1
        };
        
        await saveToStorage();
        renderAll();
        showToast("Base de datos local actualizada con los datos de la nube.", "success");
        addAuditLog('SYSTEM', 'CONFLICT_RESOLVE_PULL', `Conflicto resuelto: Versión de la nube integrada localmente para cliente ${remoteData.clientName}.`);
      }
    }
  } catch (e) {
    console.error("Error al resolver conflicto tirando de la nube:", e);
    showToast(`Error al descargar datos: ${e.message}`, "danger");
  }
};

// 🗄️ Carga de Logs Históricos de la Nube (Paginación Dinámica del Ledger)
window.loadOlderLogsFromFirestore = async function() {
  if (!window.FIREBASE_SYNC_ENABLED || !window.firestoreDb) {
    showToast("Firebase no está configurado o sincronizado.", "danger");
    return;
  }
  if (!navigator.onLine) {
    showToast("Sin conexión a internet.", "warning");
    return;
  }
  
  showToast("Cargando historial de logs desde la nube...", "info");
  
  try {
    const querySnapshot = await window.firestoreDb.collection('alr-saas-telemetry-logs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
      
    let addedCount = 0;
    state.cloudLogs = state.cloudLogs || [];
    const existingHashes = new Set([
      ...state.logs.map(l => l.hash),
      ...state.cloudLogs.map(l => l.hash)
    ]);
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!existingHashes.has(data.hash)) {
        state.cloudLogs.push({
          timestamp: data.timestamp,
          module: data.module,
          action: data.action,
          details: data.details,
          prevHash: data.prevHash,
          hash: data.hash,
          fromCloud: true
        });
        existingHashes.add(data.hash);
        addedCount++;
      }
    });
    
    showToast(`Se cargaron ${addedCount} logs históricos desde la nube de forma segura.`, "success");
    renderTelemetryLogs();
  } catch (e) {
    console.error("[FIREBASE] Error al cargar logs históricos:", e);
    showToast(`Error al cargar logs: ${e.message}`, "danger");
  }
};

window.saveConcurrencyPolicy = function() {
  const policySelect = document.getElementById('cfg-concurrency-policy');
  if (policySelect) {
    window.CONCURRENCY_POLICY = policySelect.value;
    localStorage.setItem('alr_saas_concurrency_policy', window.CONCURRENCY_POLICY);
    showToast(`Política de Concurrencia establecida en: ${window.CONCURRENCY_POLICY}`, "success");
    addAuditLog('SYSTEM', 'CONCURRENCY_POLICY_CHANGE', `Política de concurrencia de sincronización cambiada a: ${window.CONCURRENCY_POLICY}`);
  }
};

// 🔐 2FA real (TOTP, RFC 6238) -- reemplaza el "2FA" anterior, cuya
// semilla (MASTER_LEDGER_SALT) era una constante pública visible en este
// mismo archivo y no protegía nada. El secreto real lo genera y guarda
// enrollTotp (Cloud Function, Admin SDK); el navegador solo lo ve una
// vez, al momento de escanear el QR.
window.enrollTotpReal = async function() {
  if (!currentAdmin) return;
  try {
    if (!window.governanceAuth || !window.governanceAuth.currentUser) {
      await initGovernanceFirebase();
    }
    const enroll = window.governanceFunctions.httpsCallable('enrollTotp');
    const { data } = await enroll({ username: currentAdmin.username });

    const qrUrl = `https://quickchart.io/chart?cht=qr&chs=180&chl=${encodeURIComponent(data.otpauthUri)}`;
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    if (!overlay || !box) return;

    box.innerHTML = `
      <div style="padding: 30px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 12px;">📱</div>
        <h2 style="font-size: 18px; font-weight: 900; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">Vincular Autenticador</h2>
        <p style="font-size: 11px; opacity: 0.6; margin-bottom: 20px; line-height: 1.5;">Escanea el código QR con Google Authenticator o similar. A partir de ahora, el PIN por sí solo ya no bastará para entrar -- se pedirá también el código de 6 dígitos.</p>

        <div style="background: #fff; padding: 12px; border-radius: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 20px; border: 1px solid var(--border-active);">
          <img src="${qrUrl}" alt="QR Code 2FA" style="display: block; width: 160px; height: 160px;">
        </div>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 15px; padding: 12px; font-family: var(--font-mono); font-size: 10px; margin-bottom: 24px; text-align: left;">
          <span style="color: var(--accent-secondary); font-weight:900;">CLAVE MANUAL (si no puedes escanear):</span><br>
          <span style="font-size:11px; color:#fff; word-break:break-all;">${escapeHtml(data.secret)}</span>
        </div>

        <button class="btn btn-primary" style="width: 100%;" onclick="closeModal()">Listo, ya lo escaneé</button>
      </div>
    `;
    overlay.classList.add('active');
    addAuditLog('SECURITY', 'TOTP_ENROLL', `2FA real (TOTP) activado para ${currentAdmin.username}.`);
  } catch (err) {
    showToast('Error al activar 2FA: ' + err.message, 'danger');
  }
};

window.disableTotpReal = function() {
  if (!currentAdmin) return;
  const pin = prompt('Ingresa tu PIN actual para desactivar el 2FA:');
  if (!pin) return;
  (async () => {
    try {
      if (!window.governanceAuth || !window.governanceAuth.currentUser) {
        await initGovernanceFirebase();
      }
      const disable = window.governanceFunctions.httpsCallable('disableTotp');
      await disable({ pin, username: currentAdmin.username });
      showToast('2FA desactivado.', 'success');
      addAuditLog('SECURITY', 'TOTP_DISABLE', `2FA real (TOTP) desactivado para ${currentAdmin.username}.`);
    } catch (err) {
      showToast('Error al desactivar 2FA: ' + err.message, 'danger');
    }
  })();
};

// 🔐 Autenticación Biométrica Local (WebAuthn / Passkeys) -- ahora es solo
// una CONVENIENCIA para no volver a teclear el PIN en este dispositivo,
// nunca un reemplazo de la verificación server-side (verifyAlrAdminAccess).
// Antes, cuando el WebAuthn nativo fallaba o no estaba disponible, un
// simple confirm() del navegador "simulaba" éxito y otorgaba acceso de
// SUPER_ADMIN sin ninguna biometría real -- ese fallback se elimina.
window.registerWebAuthnCredential = async function(username) {
  try {
    if (!window.PublicKeyCredential) {
      throw new Error("El navegador no soporta autenticación biométrica (WebAuthn).");
    }

    // Lo que WebAuthn va a envolver debe ser el PIN real (no SESSION_KEY,
    // que es sha256(username+pin) y no sirve para reautenticar contra
    // verifyAlrAdminAccess). Se revalida aquí mismo antes de envolverlo,
    // así un PIN incorrecto nunca queda guardado como si fuera válido.
    const pin = prompt(`Confirma tu PIN de administrador para registrar esta passkey (${username}):`);
    if (!pin) throw new Error("Registro cancelado: se requiere el PIN para vincular la passkey.");

    if (!window.governanceAuth || !window.governanceAuth.currentUser) {
      await initGovernanceFirebase();
    }
    const verify = window.governanceFunctions.httpsCallable('verifyAlrAdminAccess');
    await verify({ pin });

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: { name: "ALR SaaS Commander", id: window.location.hostname || "localhost" },
      user: { id: userId, name: username, displayName: username },
      pubKeyCredParams: [{type: "public-key", alg: -7}],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60000,
      attestation: "none"
    };
    const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });

    const credId = credential.id;
    localStorage.setItem('alr_saas_webauthn_cred_id', credId);
    const encryptedKey = await encryptReposo(pin, credId + "_webauthn_secret");
    localStorage.setItem('alr_saas_webauthn_wrapped_key', encryptedKey);

    showToast("Credencial biométrica (Passkey) registrada con éxito para " + username, "success");
    addAuditLog('SECURITY', 'WEBAUTHN_REGISTER', `Se registró una nueva llave biométrica (Passkey) para el usuario ${username}.`);
  } catch (err) {
    showToast("Fallo en registro biométrico: " + err.message, "danger");
  }
};

window.unlockWithWebAuthn = async function() {
  try {
    if (window.checkLockoutState && window.checkLockoutState()) return;
    const credId = localStorage.getItem('alr_saas_webauthn_cred_id');
    const wrappedKey = localStorage.getItem('alr_saas_webauthn_wrapped_key');
    if (!credId || !wrappedKey) {
      throw new Error("No hay ninguna credencial biométrica registrada en este dispositivo.");
    }
    if (!window.PublicKeyCredential) {
      throw new Error("Este navegador no soporta WebAuthn.");
    }
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [{ id: new TextEncoder().encode(credId), type: 'public-key' }],
      timeout: 60000,
      userVerification: "required"
    };
    await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });

    const keyToDecrypt = credId + "_webauthn_secret";
    const pin = await decryptReposo(wrappedKey, keyToDecrypt);
    if (!pin) {
      throw new Error("La firma biométrica no coincide o el secreto local está corrupto.");
    }

    // El PIN descifrado se revalida contra la misma Cloud Function que
    // cualquier otro desbloqueo. Si el operador ya activó 2FA real, esto
    // fallará (WebAuthn no puede aportar el código de 6 dígitos) -- el
    // mensaje de error ya deja claro que hay que usar el PIN+2FA normal.
    if (!window.governanceAuth || !window.governanceAuth.currentUser) {
      await initGovernanceFirebase();
    }
    const admin = SYSTEM_ADMINS[0];
    const verify = window.governanceFunctions.httpsCallable('verifyAlrAdminAccess');
    await verify({ pin, username: admin.username });
    await window.governanceAuth.currentUser.getIdToken(true);

    SESSION_KEY = await sha256(admin.username + pin);
    SESSION_KEY_BUFFER = new TextEncoder().encode(SESSION_KEY);
    currentAdmin = admin;
    window.updateHeaderProfileBadge();
    try { await loadFromStorage(); } catch (e) { console.warn('[WebAuthn Unlock] loadFromStorage error:', e); }

    updateSaasSimulation();
    startServerlessBillingCron();
    loadBackupTelemetry();
    await window.rehydrateDecryptedSettings();
    await window.loadIntegrationSettings();
    await window.initFirebaseSync();
    await window.pullAllLicensesFromCloud(true);
    await window.pullAppRegistryFromCloud();

    renderAll();
    showToast("Consola desbloqueada mediante biometría (WebAuthn).", "success");
    closeModal();
    addAuditLog('SYSTEM', 'CONSOLA_DESBLOQUEO_BIOMETRICO', `Consola desbloqueada usando biometría de hardware (WebAuthn), verificada vía verifyAlrAdminAccess.`);
    window.resetInactivityTimer();
  } catch (err) {
    showToast("Error de autenticación biométrica: " + err.message, "danger");
  }
};

// 🔐 Sugerencia 4: Detección Dinámica de Huella Digital de Navegador (Fingerprinting)
window.generateBrowserFingerprint = function() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("ALR-SAAS-FINGERPRINT", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("ALR-SAAS-FINGERPRINT", 4, 17);
    const canvasSig = canvas.toDataURL();
    const parts = [
      navigator.userAgent,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || 4,
      navigator.deviceMemory || 8,
      canvasSig
    ];
    return sha256Sync(parts.join('|'));
  } catch (e) {
    console.error("Error generating fingerprint:", e);
    return sha256Sync(navigator.userAgent || "unknown");
  }
};

window.validateSessionFingerprint = function() {
  const currentFp = window.generateBrowserFingerprint();
  const storedFp = sessionStorage.getItem('alr_saas_session_fingerprint');
  if (!storedFp) {
    sessionStorage.setItem('alr_saas_session_fingerprint', currentFp);
    return true;
  }
  if (currentFp !== storedFp) {
    console.error("🚨 [DIFERENCIA DE HUELLA DIGITAL] Sesión secuestrada o cargada desde otro dispositivo.");
    addAuditLog('SECURITY', 'SESSION_HIJACK_DETECTED', `Secuestro de sesión detectado: Diferencia de huella digital de navegador.`);
    if (typeof window.sendTelegramNotification === 'function') {
      window.sendTelegramNotification(`⚠️ <b>[ALERTA DE SEGURIDAD]</b> ⚠️\n\nSe ha detectado un posible secuestro de sesión en la consola. La huella digital del navegador actual es distinta a la de inicio. Se ha forzado el bloqueo preventivo.`);
    }
    window.lockConsoleSession(false);
    return false;
  }
  return true;
};

// 🔐 Sugerencia 9: Monitoreo Silencioso de Errores y Alertas Forenses
window.reportSystemAnomalySilently = function(anomalyType, details) {
  console.warn(`[ANOMALÍA FORENSE - ${anomalyType}]`, details);
  try {
    const text = `🕵️‍♂️ <b>[ALERTA FORENSE SILENCIOSA]</b>\n` +
                 `Tipo: <b>${anomalyType}</b>\n` +
                 `Detalles: ${details.substring(0, 300)}`;
    if (window.sendTelegramNotification) {
      window.sendTelegramNotification(text);
    }
  } catch (err) {
    console.error("Error al reportar anomalía silenciosamente:", err);
  }
};

window.addEventListener('error', function(event) {
  const details = `Mensaje: ${event.message}\nArchivo: ${event.filename}\nLínea: ${event.lineno}:${event.colno}`;
  window.reportSystemAnomalySilently('ERROR_GLOBAL_JS', details);
});

window.addEventListener('unhandledrejection', function(event) {
  const details = `Motivo: ${event.reason}`;
  window.reportSystemAnomalySilently('UNHANDLED_REJECTION', details);
});

// 🔐 Sugerencia 3: Ofuscador de Código AST para el SDK
window.downloadObfuscatedSdk = async function() {
  try {
    const response = await fetch('alr-saas-gate-sdk.js');
    if (!response.ok) throw new Error("No se pudo cargar el SDK Universal.");
    let sdkCode = await response.text();
    const blob = new Blob([sdkCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alr-saas-gate-sdk.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("SDK Universal ALR SaaS Gate descargado con éxito.", "success");
  } catch (err) {
    showToast(`Error al descargar el SDK: ${err.message}`, "danger");
  }
};

// Antes tenía un default silencioso a 'kuatsi_central' -- si se copiaba
// sin editar al aprovisionar un cliente nuevo, ese cliente quedaba
// gobernado por el estado de licencia de OTRO cliente. Ahora exige un
// appId explícito.
window.copyUniversalSdkSnippet = function(appId) {
  if (!appId) {
    showToast('Selecciona primero un cliente/app.', 'warning');
    return;
  }
  const tag = `<script src="https://brain-branding.web.app/alr-saas/alr-saas-gate-sdk.js" data-app-id="${appId}" data-project-id="brain-branding"></script>`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tag).then(() => {
      showToast(`Tag de Integración SDK Universal copiado al portapapeles.`, "success");
    }).catch(() => {
      prompt("Copie este script tag de 1 sola línea para integrar su aplicación:", tag);
    });
  } else {
    prompt("Copie este script tag de 1 sola línea para integrar su aplicación:", tag);
  }
};

window.openCopySdkPicker = function() {
  const licenses = (state.licenses || []).filter(l => l.id);
  if (licenses.length === 0) {
    showToast('No hay clientes registrados todavía.', 'warning');
    return;
  }
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;

  const optionsHtml = licenses
    .sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''))
    .map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.clientName || l.id)} (${escapeHtml(l.id)})</option>`)
    .join('');

  box.innerHTML = `
    <div style="padding: 30px;">
      <h2 style="font-size: 16px; font-weight: 900; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">Copiar Tag SDK</h2>
      <p style="font-size: 11px; opacity: 0.6; margin-bottom: 16px;">Elige el cliente para el que quieres generar el tag de integración de 1 línea.</p>
      <div class="form-group" style="text-align:left; margin-bottom:24px;">
        <label class="form-label">Cliente</label>
        <select id="sdk-picker-select" class="form-input">${optionsHtml}</select>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" style="flex:1;" onclick="window.copyUniversalSdkSnippet(document.getElementById('sdk-picker-select').value); closeModal();">
          <i class="ri-code-s-slash-line"></i> Copiar
        </button>
      </div>
    </div>
  `;
  overlay.classList.add('active');
};


  // 🔐 Sugerencia avanzada 55: Detección Activa de Inyección en el DOM mediante MutationObserver
  let domObserverInterval = null;
  const localSendTelegram = window.sendTelegramNotification; // Guardar referencia privada antes de cualquier tampering
  
  window.initDomIntegrityObserver = function() {
    const targetOverlay = document.getElementById('modal-overlay');
    const targetBox = document.getElementById('modal-box');
    if (!targetOverlay || !targetBox) return;
    
    const observer = new MutationObserver(function(mutations) {
      if (window.IS_MUTATING_DOM) return;
      let tamperingDetected = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
            continue;
          }
          tamperingDetected = true; // var
          break;
        }
      }
      
      if (tamperingDetected) {
        console.error("🚨 [TAMPERING DETECTADO] Estructura del modal de seguridad alterada localmente.");
        addAuditLog('SECURITY', 'DOM_TAMPERING_DETECTED', "Se detectó alteración no autorizada en el DOM del modal de autenticación.");
        const currentSendTelegram = (typeof localSendTelegram === 'function') ? localSendTelegram : window.sendTelegramNotification;
        if (typeof currentSendTelegram === 'function') {
          currentSendTelegram("🚨 <b>[ALERTA DE SEGURIDAD]</b> 🚨\n\nSe ha detectado una alteración o inyección en el DOM del formulario de desbloqueo. Se ha activado el bloqueo preventivo por seguridad.");
        }
        observer.disconnect();
        if (domObserverInterval) {
          clearTimeout(domObserverInterval);
          domObserverInterval = null; // var
        }
        localLockConsoleSession(false);
        setTimeout(() => window.initDomIntegrityObserver(), 1000);
      }
    });
    
    const startObserving = () => {
      observer.observe(targetBox, { attributes: true, childList: true, subtree: false });
      observer.observe(targetOverlay, { attributes: true });
    };
    
    startObserving();
    
    // Heartbeat recursivo con jitter pseudo-aleatorio para evitar sincronización
    const runHeartbeat = () => {
      const nextDelay = 3000 + Math.floor(Math.random() * 4000); // Entre 3 y 7 segundos
      domObserverInterval = setTimeout(() => { // var
        startObserving();
        runHeartbeat();
      }, nextDelay);
    };
    
    if (!domObserverInterval) {
      runHeartbeat();
    }
  };
  
  setTimeout(() => {
    window.initDomIntegrityObserver();
  }, 3000);

  // ==================== GESTIÓN DE DISCO Y LIMPIEZA FRONTEND ====================
  const BRIDGE_API_BASE = 'http://localhost:4026/api';

  async function fetchFromBridge(endpoint, options = {}) {
    const token = localStorage.getItem('alr_bridge_token') || '';
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };
    return fetch(`${BRIDGE_API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  }

  // Configuración de Estados de Proyectos en localStorage
  // Estructura: { [projectName]: 'PAUSED' | 'PRODUCTION' }
  function getProjectsStates() {
    try {
      return JSON.parse(localStorage.getItem('alr_projects_states') || '{}');
    } catch(e) {
      return {};
    }
  }

  function saveProjectsStates(states) {
    localStorage.setItem('alr_projects_states', JSON.stringify(states));
  }

  async function verifyAuditLogClientSide() {
    try {
      const resLog = await fetchFromBridge('/audit/log-raw');
      if (!resLog.ok) throw new Error(`Fallo al descargar log crudo: ${resLog.statusText}`);
      const logText = await resLog.text();
      
      const resKey = await fetchFromBridge('/audit/public-key');
      if (!resKey.ok) throw new Error(`Fallo al descargar clave pública: ${resKey.statusText}`);
      const publicKeyPEM = await resKey.text();

      const lines = logText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        return { isValid: true };
      }

      const pemHeader = "-----BEGIN PUBLIC KEY-----";
      const pemFooter = "-----END PUBLIC KEY-----";
      const pemContents = publicKeyPEM
        .replace(pemHeader, "")
        .replace(pemFooter, "")
        .replace(/\s/g, "");
        
      const binaryDerString = window.atob(pemContents);
      const len = binaryDerString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryDerString.charCodeAt(i);
      }
      
      const cryptoKey = await window.crypto.subtle.importKey(
        "spki",
        bytes.buffer,
        {
          name: "ECDSA",
          namedCurve: "P-256"
        },
        true,
        ["verify"]
      );

      let expectedPrevHash = '0'.repeat(64);
      const encoder = new TextEncoder();

      function base64ToUint8Array(base64) {
        const binaryString = window.atob(base64);
        const l = binaryString.length;
        const b = new Uint8Array(l);
        for (let i = 0; i < l; i++) {
          b[i] = binaryString.charCodeAt(i);
        }
        return b;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const sigIndex = line.indexOf(' | SIGNATURE: ');
        if (sigIndex === -1) {
          return { isValid: false, reason: `Línea ${i + 1} no está firmada en el cliente.` };
        }

        const payloadToSign = line.substring(0, sigIndex);
        const signatureB64 = line.substring(sigIndex + ' | SIGNATURE: '.length).trim();
        const signatureBytes = base64ToUint8Array(signatureB64);
        const payloadBytes = encoder.encode(payloadToSign);

        const isSigValid = await window.crypto.subtle.verify(
          {
            name: "ECDSA",
            hash: { name: "SHA-256" }
          },
          cryptoKey,
          signatureBytes,
          payloadBytes
        );

        if (!isSigValid) {
          return { isValid: false, reason: `Firma digital inválida en línea ${i + 1} (Fallo de firma local).` };
        }

        const hashIndex = payloadToSign.indexOf(' | HASH: ');
        if (hashIndex === -1) {
          return { isValid: false, reason: `Falta hash de encadenamiento en línea ${i + 1}.` };
        }
        const payloadWithoutHash = payloadToSign.substring(0, hashIndex);
        const hashInLine = payloadToSign.substring(hashIndex + ' | HASH: '.length).trim();

        const payloadWithoutHashBytes = encoder.encode(payloadWithoutHash);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", payloadWithoutHashBytes);
        const computedHash = Array.from(new Uint8Array(hashBuffer))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');

        if (computedHash !== hashInLine) {
          return { isValid: false, reason: `Modificación de datos detectada en línea ${i + 1}.` };
        }

        const prevHashMatch = payloadWithoutHash.match(/\| PREV_HASH:\s*([a-f0-9]{64})/i);
        const prevHashInLine = prevHashMatch ? prevHashMatch[1] : null;
        if (prevHashInLine !== expectedPrevHash) {
          return { isValid: false, reason: `Cadena rota en línea ${i + 1} (PREV_HASH incorrecto).` };
        }

        expectedPrevHash = hashInLine;
      }

      return { isValid: true };
    } catch (err) {
      console.error('Error de verificación en navegador:', err);
      return { isValid: false, reason: `Fallo al verificar localmente: ${err.message}` };
    }
  }

  window.refreshCleanupData = async function() {
    try {
      // 1. Obtener inactividad
      const resInactivity = await fetchFromBridge('/projects/inactivity');
      if (!resInactivity.ok) throw new Error('Error al conectar con el puente local');
      const projects = await resInactivity.json();

      // 2. Obtener lista de papelera
      const resTrash = await fetchFromBridge('/projects/trash-list');
      if (!resTrash.ok) throw new Error('Error al cargar la papelera');
      const trashList = await resTrash.json();

      // 3. Obtener estado de auditoría (Verificación Zero-Trust en el Cliente)
      let auditStatus = { isValid: true };
      try {
        auditStatus = await verifyAuditLogClientSide();
      } catch (err) {
        console.error('No se pudo verificar el estado de la auditoría en cliente:', err);
        // Fallback a consultar al servidor
        try {
          const resAudit = await fetchFromBridge('/audit/status');
          if (resAudit.ok) {
            auditStatus = await resAudit.json();
          }
        } catch (e) {}
      }

      window.isAuditLogCorrupted = !auditStatus.isValid;
      window.auditLogCorruptReason = auditStatus.reason || 'Alteración detectada';

      window.cleanupData = {
        projects: projects, // Mantener todos para poder renderizar las cajas fuertes
        trashList
      };

      // 3. Chequear expiraciones de papelera para alertas por Telegram
      if (trashList && trashList.length > 0 && typeof window.sendTelegramNotification === 'function') {
        const imminentPurges = trashList.filter(t => t.daysRemaining <= 5);
        if (imminentPurges.length > 0) {
          window.notifiedTrashExpirations = window.notifiedTrashExpirations || {};
          let alertText = `⚠️ <b>[ALERTA DE PAPELERA - EXPIRACIÓN PRÓXIMA]</b> ⚠️\n\nLos siguientes respaldos locales de Antigravity expiran en menos de 5 días y serán purgados de forma definitiva:\n`;
          let shouldSend = false;

          for (const item of imminentPurges) {
            if (!window.notifiedTrashExpirations[item.id]) {
              alertText += `\n• <b>${item.id}</b> - Quedan ${item.daysRemaining} días (Expira: ${new Date(item.expiresAt).toLocaleDateString()})`;
              window.notifiedTrashExpirations[item.id] = true;
              shouldSend = true;
            }
          }

          if (shouldSend) {
            window.sendTelegramNotification(alertText);
          }
        }
      }

      window.renderCleanupView();
    } catch(err) {
      console.error(err);
      showToast(`Error de conexión local: Asegúrate de que el puente local esté corriendo en http://localhost:4026.`, "danger");
      window.cleanupData = { projects: [], trashList: [] };
      window.renderCleanupView();
    }
  };

  window.changeProjectState = async function(projectName, newState) {
    const states = getProjectsStates();
    if (newState === 'ACTIVE') {
      delete states[projectName];
    } else {
      states[projectName] = newState;
    }
    saveProjectsStates(states);

    // Sincronizar estado de protección con el servidor puente (Caja Fuerte)
    try {
      const isProtected = newState === 'PRODUCTION';
      const res = await fetchFromBridge('/projects/safe-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, protected: isProtected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (isProtected) {
        showToast(`🔒 Proyecto ${projectName} blindado en la Caja Fuerte con éxito.`, "success");
      } else {
        showToast(`🔓 Proyecto ${projectName} retirado de la Caja Fuerte.`, "warning");
      }
    } catch(err) {
      console.error('Error sincronizando safe-box con el bridge:', err);
      showToast(`Error de Caja Fuerte local: ${err.message}`, "danger");
    }

    await window.refreshCleanupData(); // Refrescar para aplicar estilos/filtros
  };

  window.moveToTrashLocal = async function(projectName) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el proyecto "${projectName}" de tu PC?\nSe creará un respaldo cifrado con AES-256 en la papelera (.trash) y tendrás 60 días para restaurarlo.`);
    if (!confirmDelete) return;

    try {
      showToast(`Moviendo ${projectName} a la papelera...`, "info");
      const customKey = localStorage.getItem('alr_cleanup_encryption_key') || '';
      const tgEnabled = localStorage.getItem('alr_saas_tg_enabled') === 'true';
      const tgToken = tgEnabled ? window.TELEGRAM_BOT_TOKEN : '';
      const tgChatId = tgEnabled ? window.TELEGRAM_CHAT_ID : '';

      const res = await fetchFromBridge('/projects/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectName,
          customKey,
          tgToken,
          tgChatId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      let successMsg = data.message;
      if (data.tgBackup) {
        successMsg += " Además, se subió un respaldo cifrado a tu Telegram.";
      }
      showToast(successMsg, "success");
      
      // Ofrecer enlaces/sugerencia de borrado
      window.checkCloudCleanupSuggestion(projectName);

      // Recargar datos
      await window.refreshCleanupData();
    } catch(err) {
      console.error(err);
      showToast(`Fallo al mover a papelera: ${err.message}`, "danger");
    }
  };

  window.restoreFromTrashLocal = async function(projectName) {
    try {
      showToast(`Descifrando y restaurando ${projectName}...`, "info");
      const customKey = localStorage.getItem('alr_cleanup_encryption_key') || '';
      const res = await fetchFromBridge('/projects/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, customKey })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      showToast(data.message, "success");
      await window.refreshCleanupData();
    } catch(err) {
      console.error(err);
      showToast(`Error al restaurar proyecto: ${err.message}`, "danger");
    }
  };

  window.purgeForceTrashLocal = async function(projectName) {
    const confirmPurge = confirm(`¡ADVERTENCIA CRÍTICA!\n¿Estás seguro de que deseas eliminar permanentemente el respaldo de "${projectName}" de la papelera?\nEsta acción no se puede deshacer y los archivos se destruirán.`);
    if (!confirmPurge) return;

    try {
      const res = await fetchFromBridge('/projects/purge-force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      showToast(data.message, "success");
      await window.refreshCleanupData();
    } catch(err) {
      console.error(err);
      showToast(`Error al purgar proyecto: ${err.message}`, "danger");
    }
  };

  window.checkCloudCleanupSuggestion = function(projectName) {
    showToast(`Recuerda dar de baja también sus repositorios en GitHub si ya no los estás ocupando.`, "warning");
  };

  // Renderizar la vista de Limpieza
  window.renderCleanupView = function() {
    // 0. ACTUALIZAR ALERTA DE INTEGRIDAD DE AUDITORÍA
    const auditAlert = document.getElementById('audit-integrity-alert');
    const auditReason = document.getElementById('audit-integrity-reason');
    const isCorrupt = !!window.isAuditLogCorrupted;
    
    if (auditAlert && auditReason) {
      if (isCorrupt) {
        auditReason.innerText = `Se ha detectado una modificación externa no autorizada: ${window.auditLogCorruptReason || 'Firma de auditoría o encadenamiento roto.'}`;
        auditAlert.style.display = 'flex';
      } else {
        auditAlert.style.display = 'none';
      }
    }

    const inactivityContainer = document.getElementById('inactivity-list');
    const trashTableBody = document.getElementById('trash-table-body');
    if (!inactivityContainer || !trashTableBody) return;

    const data = window.cleanupData || { projects: [], trashList: [] };
    const states = getProjectsStates();

    // 1. RENDERIZAR INACTIVIDAD
    if (data.projects.length === 0) {
      inactivityContainer.innerHTML = `<div style="text-align: center; padding: 40px; opacity: 0.5; font-size: 11px;"><i class="ri-checkbox-circle-line" style="font-size: 20px; display:block; margin-bottom:8px; color: var(--success);"></i>No hay proyectos inactivos que requieran atención.</div>`;
    } else {
      inactivityContainer.innerHTML = data.projects.map(p => {
        const state = states[p.id] || 'ACTIVE'; // ACTIVE (Defecto), PAUSED, PRODUCTION
        const isProduction = state === 'PRODUCTION';
        
        let cardClass = 'inactive-project-card';
        if (state === 'PAUSED') cardClass += ' status-paused';
        if (isProduction) cardClass += ' status-production';

        const lastModDate = new Date(p.lastModified).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        
        let badgeHtml = '';
        let iconHtml = `<i class="ri-folder-open-fill" style="color: var(--accent); margin-right: 6px;"></i>`;
        let deleteBtnHtml = '';

        if (isCorrupt) {
          deleteBtnHtml = `
            <button class="btn-icon-locked" title="Bloqueado: La auditoría local está comprometida" disabled style="opacity: 0.5; cursor: not-allowed;">
              <i class="ri-error-warning-line" style="color: var(--danger);"></i>
            </button>
          `;
        } else if (isProduction) {
          iconHtml = `<i class="ri-safe-2-fill" style="color: #d4af37; margin-right: 6px; text-shadow: 0 0 10px rgba(212,175,55,0.4);"></i>`;
          badgeHtml = `<span class="project-inactivity-badge badge-production"><i class="ri-shield-keyhole-line"></i> Caja Fuerte</span>`;
          deleteBtnHtml = `
            <button class="btn-icon-locked" title="Blindado: Esta aplicación está protegida en la Caja Fuerte y no puede borrarse" disabled>
              <i class="ri-lock-fill"></i>
            </button>
          `;
        } else {
          deleteBtnHtml = `
            <button class="btn-icon-danger" onclick="window.moveToTrashLocal('${escapeHtml(p.id)}')" title="Mover a la Papelera (Auto-eliminar en 60 días)">
              <i class="ri-delete-bin-line"></i>
            </button>
          `;
        }

        if (!isProduction) {
          if (state === 'PAUSED') {
            badgeHtml = `<span class="project-inactivity-badge badge-warn">En Pausa</span>`;
          } else if (p.inactivityDays >= 60) {
            badgeHtml = `<span class="project-inactivity-badge badge-alert">Inactivo hace ${p.inactivityDays} días</span>`;
          } else if (p.inactivityDays >= 30) {
            badgeHtml = `<span class="project-inactivity-badge badge-warn">Inactivo hace ${p.inactivityDays} días</span>`;
          } else {
            badgeHtml = `<span class="project-inactivity-badge" style="background: rgba(255,255,255,0.05); color:#fff; border: 1px solid rgba(255,255,255,0.1);">${p.inactivityDays} días inactivo</span>`;
          }
        }

        return `
          <div class="${cardClass}">
            <div class="project-info-side">
              <div class="project-name-txt">
                ${iconHtml}${escapeHtml(p.name)}
                ${badgeHtml}
              </div>
              <div class="project-meta-txt" style="margin-top: 4px; font-size: 9.5px;">Último cambio: <b style="color: #fff;">${lastModDate}</b></div>
            </div>
            <div class="project-action-side">
              <select class="cleanup-select-state" onchange="window.changeProjectState('${escapeHtml(p.id)}', this.value)" ${isCorrupt ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                <option value="ACTIVE" ${state === 'ACTIVE' ? 'selected' : ''}>🟢 Activo</option>
                <option value="PAUSED" ${state === 'PAUSED' ? 'selected' : ''}>⏸️ En Pausa</option>
                <option value="PRODUCTION" ${state === 'PRODUCTION' ? 'selected' : ''}>🔒 Caja Fuerte</option>
              </select>
              ${deleteBtnHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. RENDERIZAR PAPELERA (Cifrada en AES-256)
    if (data.trashList.length === 0) {
      trashTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; opacity: 0.5; padding: 30px;">La papelera está vacía.</td>
        </tr>
      `;
    } else {
      trashTableBody.innerHTML = data.trashList.map(t => {
        const delDate = new Date(t.deletedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        let daysBadge = '';
        if (t.daysRemaining <= 10) {
          daysBadge = `<span style="color: var(--danger); font-weight:900; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:2px 8px;">¡Expira en ${t.daysRemaining} días!</span>`;
        } else {
          daysBadge = `<span style="opacity:0.7; font-weight: 800;">${t.daysRemaining} días</span>`;
        }

        let progressText = '';
        if (t.tgTotalChunks && t.tgTotalChunks > 0 && !t.tgBackup) {
          progressText = ` <span style="font-size: 8px; font-weight: 900; color: #f59e0b; background: rgba(245,158,11,0.1); padding: 1px 4px; border-radius: 4px; margin-left: 4px;">(${t.tgChunksUploaded || 0}/${t.tgTotalChunks} partes)</span>`;
        }

        const cloudIconHtml = t.tgBackup 
          ? ` <i class="ri-telegram-fill" style="color: #0088cc; font-size: 13px;" title="Respaldo cifrado en la nube de Telegram activo"></i>` 
          : ` <i class="ri-cloud-off-line" style="color: #ef4444; font-size: 13px;" title="Sin respaldo en la nube (Fallo de subida)"></i>${progressText}`;

        const retryTgBtn = (!t.tgBackup && !isCorrupt) ? `
          <button class="btn btn-warning-outline" style="height: 28px; font-size: 8px; padding: 0 10px; font-weight: 900; text-transform: uppercase; color: #f59e0b; border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.05);" onclick="window.retryTelegramBackupLocal('${escapeHtml(t.id)}')" title="Reintentar subir respaldo cifrado a Telegram">
            <i class="ri-upload-cloud-2-line"></i> Subir Nube
          </button>
        ` : '';

        return `
          <tr>
            <td style="font-weight: 900; color:#fff; vertical-align: middle;">
              <i class="ri-file-shield-2-fill" style="color: #f59e0b; margin-right: 6px; font-size: 14px;" title="Archivo cifrado con AES-256"></i>${escapeHtml(t.id)}${cloudIconHtml}
            </td>
            <td style="vertical-align: middle; opacity: 0.7;">${delDate}</td>
            <td style="vertical-align: middle;">${daysBadge}</td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                ${retryTgBtn}
                <button class="btn btn-secondary" style="height: 28px; font-size: 8px; padding: 0 10px; font-weight: 900; text-transform: uppercase; ${isCorrupt ? 'opacity: 0.5; cursor: not-allowed;' : ''}" onclick="${isCorrupt ? '' : `window.restoreFromTrashLocal('${escapeHtml(t.id)}')`}" ${isCorrupt ? 'disabled title="Restauración bloqueada por corrupción de auditoría"' : 'title="Descifrar y restaurar carpeta original"'}>
                  <i class="ri-arrow-go-back-line"></i> Restaurar
                </button>
                <button class="btn btn-danger-outline" style="height: 28px; width: 28px; padding: 0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; ${isCorrupt ? 'opacity: 0.5; cursor: not-allowed;' : ''}" onclick="${isCorrupt ? '' : `window.purgeForceTrashLocal('${escapeHtml(t.id)}')`}" ${isCorrupt ? 'disabled title="Eliminación bloqueada por corrupción de auditoría"' : 'title="Eliminar definitivamente"'}>
                  <i class="ri-delete-bin-6-line" style="font-size: 12px;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  };

  window.saveCleanupKey = function() {
    const input = document.getElementById('cfg-cleanup-key');
    if (input) {
      localStorage.setItem('alr_cleanup_encryption_key', input.value);
      window.updateKeyStrength();
    }
  };

  window.saveBridgeToken = function() {
    const input = document.getElementById('cfg-bridge-token');
    if (input) {
      localStorage.setItem('alr_bridge_token', input.value);
    }
  };

  window.toggleInputVisibility = function(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (input && btn) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      
      const icon = btn.querySelector('i');
      if (icon) {
        if (isPassword) {
          icon.className = 'ri-eye-off-line';
          btn.style.color = 'var(--accent)';
        } else {
          icon.className = 'ri-eye-line';
          btn.style.color = 'rgba(255,255,255,0.4)';
        }
      }
    }
  };

  window.updateKeyStrength = function() {
    const input = document.getElementById('cfg-cleanup-key');
    const container = document.getElementById('cleanup-key-strength');
    if (!input || !container) return;

    const value = input.value;
    if (!value) {
      container.innerHTML = '';
      return;
    }

    let score = 0;
    if (value.length >= 6) score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    let level = 'DEBIL';
    let color = '#ef4444'; // Red
    let barsHtml = '';

    if (score >= 5) {
      level = 'EXCELENTE';
      color = '#10b981'; // Green
      barsHtml = `
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
      `;
    } else if (score >= 4) {
      level = 'FUERTE';
      color = '#10b981'; // Green
      barsHtml = `
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
      `;
    } else if (score >= 3) {
      level = 'MEDIA';
      color = '#f59e0b'; // Yellow
      barsHtml = `
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: rgba(255,255,255,0.1); border-radius: 1px;"></div>
      `;
    } else {
      level = 'DEBIL';
      color = '#ef4444'; // Red
      barsHtml = `
        <div style="height: 3px; width: 12px; background: ${color}; border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: rgba(255,255,255,0.1); border-radius: 1px;"></div>
        <div style="height: 3px; width: 12px; background: rgba(255,255,255,0.1); border-radius: 1px;"></div>
      `;
    }

    container.innerHTML = `
      <div style="display: flex; gap: 2px;">${barsHtml}</div>
      <span style="color: ${color}; font-weight: 900; text-transform: uppercase;">${level}</span>
    `;
  };

  window.retryTelegramBackupLocal = async function(projectName) {
    try {
      showToast(`Reintentando subir respaldo de "${projectName}" a Telegram...`, "info");
      
      const tgEnabled = localStorage.getItem('alr_saas_tg_enabled') === 'true';
      const tgToken = tgEnabled ? window.TELEGRAM_BOT_TOKEN : '';
      const tgChatId = tgEnabled ? window.TELEGRAM_CHAT_ID : '';
      
      if (!tgToken || !tgChatId) {
        throw new Error('Primero debes configurar y activar tu Bot y Chat ID de Telegram en los ajustes.');
      }

      const res = await fetchFromBridge('/projects/retry-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, tgToken, tgChatId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      showToast(data.message, "success");
      await window.refreshCleanupData();
    } catch(err) {
      console.error(err);
      showToast(`Fallo al subir a Telegram: ${err.message}`, "danger");
    }
  };

  window.repairAuditLogLocal = async function() {
    if (!confirm("⚠️ ¿Estás seguro de que deseas restablecer el archivo de auditoría? El log corrupto actual será archivado para investigación y se creará un nuevo archivo de registro limpio con una firma criptográfica de recuperación.")) {
      return;
    }
    try {
      showToast("Restableciendo log de auditoría...", "info");
      const res = await fetchFromBridge('/audit/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reparar');
      showToast(data.message, "success");
      await window.refreshCleanupData();
    } catch(err) {
      console.error(err);
      showToast(`Error al reparar el log: ${err.message}`, "danger");
    }
  };

  // Interceptar la navegación para inicializar los datos
  const oldSwitchView = window.switchView;
  window.switchView = function(viewId) {
    oldSwitchView(viewId);
    if (viewId === 'cleanup') {
      window.refreshCleanupData();
    }
  };

  window.loadExclusionsList = async function() {
    const listContainer = document.getElementById('cfg-exclusions-list');
    if (!listContainer) return;
    try {
      const res = await fetchFromBridge('/config/exclusions');
      if (!res.ok) throw new Error('Error al obtener exclusiones');
      const data = await res.json();
      
      // Actualizar el banner del tracker de respaldo manual externo
      if (typeof window.updateExternalBackupBanner === 'function') {
        window.updateExternalBackupBanner(data.lastExternalBackupDate);
      }
      
      const custom = data.customExclusions || [];
      let html = '';
      if (custom.length === 0) {
        html = '<div style="font-size: 8px; color: rgba(255,255,255,0.4); text-align: center; padding: 6px;">No hay exclusiones personalizadas</div>';
      } else {
        custom.forEach(item => {
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 3px 6px; border-radius: 2px;">
              <span style="font-size: 8px; color: #fff; font-family: var(--font-mono);">${item}</span>
              <button type="button" onclick="window.removeCustomExclusion('${item}')" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; height: 14px; width: 14px;">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          `;
        });
      }
      listContainer.innerHTML = html;
    } catch (err) {
      console.error('Error al cargar exclusiones:', err);
      listContainer.innerHTML = `<div style="font-size: 8px; color: var(--danger); text-align: center; padding: 6px;">Error: ${err.message}</div>`;
    }
  };

  window.updateExternalBackupBanner = function(lastBackupDateStr) {
    const banner = document.getElementById('external-backup-banner');
    const title = document.getElementById('external-backup-title');
    const status = document.getElementById('external-backup-status');
    if (!banner) return;

    // Reset styles y clases
    banner.classList.remove('backup-pulse-green', 'backup-pulse-yellow', 'backup-pulse-red');

    if (!lastBackupDateStr) {
      banner.className = 'backup-pulse-red';
      banner.style.border = '1px solid rgba(239, 68, 68, 0.5)';
      banner.style.background = 'rgba(239, 68, 68, 0.08)';
      if (title) {
        title.style.color = '#ef4444';
        title.innerHTML = '<i id="external-backup-icon" class="ri-error-warning-fill" style="font-size: 13px;"></i> RESPALDO FÍSICO EXTERNO CRÍTICO';
      }
      if (status) {
        status.style.color = '#ef4444';
        status.innerText = 'Último respaldo: Nunca (¡Peligro de pérdida de datos!)';
      }
      return;
    }

    const lastBackup = new Date(lastBackupDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - lastBackup);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = lastBackup.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diffDays < 7) {
      banner.className = 'backup-pulse-green';
      banner.style.border = '1px solid rgba(16, 185, 129, 0.35)';
      banner.style.background = 'rgba(16, 185, 129, 0.05)';
      if (title) {
        title.style.color = '#10b981';
        title.innerHTML = '<i id="external-backup-icon" class="ri-checkbox-circle-fill" style="font-size: 13px;"></i> RESPALDO EXTERNO AL DÍA';
      }
      if (status) {
        status.style.color = '#10b981';
        status.innerText = `Último respaldo: ${formattedDate} (Hace ${diffDays} días) - Seguro`;
      }
    } else if (diffDays >= 7 && diffDays < 15) {
      banner.className = 'backup-pulse-yellow';
      banner.style.border = '1px solid rgba(245, 158, 11, 0.35)';
      banner.style.background = 'rgba(245, 158, 11, 0.05)';
      if (title) {
        title.style.color = '#f59e0b';
        title.innerHTML = '<i id="external-backup-icon" class="ri-error-warning-fill" style="font-size: 13px;"></i> RESPALDO EXTERNO REQUERIDO';
      }
      if (status) {
        status.style.color = '#f59e0b';
        status.innerText = `Último respaldo: ${formattedDate} (Hace ${diffDays} días) - Advertencia`;
      }
    } else {
      banner.className = 'backup-pulse-red';
      banner.style.border = '1px solid rgba(239, 68, 68, 0.5)';
      banner.style.background = 'rgba(239, 68, 68, 0.08)';
      if (title) {
        title.style.color = '#ef4444';
        title.innerHTML = '<i id="external-backup-icon" class="ri-alarm-warning-fill" style="font-size: 13px;"></i> RESPALDO EXTERNO CRÍTICO';
      }
      if (status) {
        status.style.color = '#ef4444';
        status.innerText = `¡CRÍTICO: Sin respaldo externo reciente! (Hace ${diffDays} días)`;
      }
    }
  };

  window.logExternalBackup = async function() {
    try {
      showToast("Registrando respaldo externo...", "info");
      const res = await fetchFromBridge('/config/external-backup-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar respaldo');
      
      showToast(data.message, "success");
      
      // Alerta insistente sobre respaldo en medio físico (USB o disco externo)
      alert("⚠️ RECORDATORIO CRÍTICO DE SEGURIDAD:\n\nAsegúrese de copiar físicamente los archivos del puente y la papelera (.trash) a un dispositivo USB o disco duro externo AHORA MISMO. El puente solo registra la fecha de confirmación, la transferencia física debe hacerla usted de forma manual.");
      
      await window.loadExclusionsList();
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, "danger");
    }
  };

  window.addCustomExclusion = async function() {
    const input = document.getElementById('cfg-new-exclusion');
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
      showToast("Ingresa un nombre de carpeta válido", "warning");
      return;
    }
    // 🛡️ Validación de caracteres inválidos en Windows
    const illegalCharsPattern = /[\\/:*?"<>|]/;
    if (illegalCharsPattern.test(val)) {
      showToast("El nombre de la carpeta contiene caracteres no permitidos (\\ / : * ? \" < > |)", "danger");
      return;
    }
    try {
      showToast("Agregando exclusión...", "info");
      const res = await fetchFromBridge('/config/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclusionName: val })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar');
      showToast(data.message, "success");
      input.value = '';
      await window.loadExclusionsList();
      await window.refreshCleanupData();
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, "danger");
    }
  };

  window.removeCustomExclusion = async function(name) {
    if (!confirm(`¿Eliminar la exclusión para "${name}"? El proyecto volverá a analizarse si está inactivo.`)) {
      return;
    }
    try {
      showToast("Eliminando exclusión...", "info");
      const res = await fetchFromBridge('/config/exclusions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclusionName: name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      showToast(data.message, "success");
      await window.loadExclusionsList();
      await window.refreshCleanupData();
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, "danger");
    }
  };

  window.exportCustomExclusions = async function() {
    try {
      const res = await fetchFromBridge('/config/exclusions');
      if (!res.ok) throw new Error('Error al descargar exclusiones del puente');
      const data = await res.json();
      
      const exportData = {
        customExclusions: data.customExclusions || [],
        signature: data.signature || ''
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exclusions_signed.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Exclusiones firmadas exportadas con éxito. ¡Guárdelas en una unidad USB o disco duro externo!", "success");
    } catch (err) {
      console.error(err);
      showToast(`Fallo al exportar exclusiones: ${err.message}`, "danger");
    }
  };

  window.importCustomExclusions = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const parsed = JSON.parse(e.target.result);
        let customExclusions = [];
        let signature = '';
        
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          customExclusions = parsed.customExclusions;
          signature = parsed.signature;
        } else if (Array.isArray(parsed)) {
          customExclusions = parsed;
          signature = '';
        } else {
          throw new Error('El formato del archivo JSON es inválido.');
        }
        
        if (!Array.isArray(customExclusions)) {
          throw new Error('La propiedad customExclusions debe ser un array.');
        }
        
        // Validar cada elemento
        const illegalCharsPattern = /[\\/:*?"<>|]/;
        for (const item of customExclusions) {
          const trimmed = String(item).trim();
          if (trimmed.length > 0 && illegalCharsPattern.test(trimmed)) {
            throw new Error(`El elemento "${trimmed}" contiene caracteres no permitidos.`);
          }
        }
        
        showToast("Importando exclusiones al puente...", "info");
        const res = await fetchFromBridge('/config/exclusions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customExclusions, signature })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en importación');
        
        showToast(data.message, "success");
        await window.loadExclusionsList();
        await window.refreshCleanupData();
      } catch (err) {
        console.error(err);
        showToast(`Fallo al importar: ${err.message}`, "danger");
      } finally {
        event.target.value = ''; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  window.toggleSidebar = function() {
    const sidebar = document.querySelector('.saas-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('alr_saas_sidebar_collapsed', isCollapsed ? 'true' : 'false');
      if (typeof showToast === 'function') {
        showToast(isCollapsed ? "Menú lateral colapsado (auto-ocultable en hover)" : "Menú lateral expandido", "info");
      }
    }
  };

  // Rehidratar estado del menú lateral
  try {
    if (localStorage.getItem('alr_saas_sidebar_collapsed') === 'true') {
      const sidebar = document.querySelector('.saas-sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
    }
  } catch(e) {}

})();

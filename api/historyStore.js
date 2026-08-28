/**
 * BRAIN BRANDING PERSISTENT CONVERSATION HISTORY STORE
 * AES-256 Encrypted storage for Telegram & WhatsApp conversation turns
 * Features: AES-256-CBC Encryption, Auto-Purge of inactive sessions (>30 days)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// El disco de Render es efímero (cualquier `git push` lo reinicia desde
// el repo) -- prospects_db.json y appointments_db.json vivían SOLO ahí,
// así que cada despliegue borraba en silencio leads y citas reales. Con
// FIREBASE_SERVICE_ACCOUNT_JSON configurada en Render (credencial real
// de service account, no la sesión anónima que usa SERO LAB -- estos
// datos sí son sensibles), Firestore pasa a ser la fuente de verdad:
// se hidrata desde ahí al arrancar y cada escritura se replica ahí
// también (además del archivo de disco, que se conserva como respaldo
// rápido dentro de la misma vida del proceso). Si la credencial no está
// configurada, `db` queda `null` y todo sigue funcionando exactamente
// como antes (solo disco), sin romper nada.
const admin = require('firebase-admin');
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'brain-branding' });
    console.log('[FIRESTORE] Admin SDK inicializado con credencial de service account.');
  } catch (e) {
    console.error('[FIRESTORE] FIREBASE_SERVICE_ACCOUNT_JSON inválida, cae a modo solo-disco:', e.message);
  }
}
const db = admin.apps.length ? admin.firestore() : null;

const DATA_DIR = path.join(__dirname, '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'conversation_history.enc');
const LEGACY_FILE = path.join(DATA_DIR, 'conversation_history.json');

const SECRET_KEY_STR = process.env.HMAC_SECRET || process.env.ENCRYPTION_KEY || 'BRAIN_BRANDING_MASTER_SAAS_HMAC_KEY_2026_SECRET';
// Derive 32-byte key for AES-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_KEY_STR).digest();
const ALGORITHM = 'aes-256-cbc';

let inMemoryStore = {};

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

function purgeOldSessions(maxDays = 30) {
  const cutoffTime = Date.now() - (maxDays * 24 * 60 * 60 * 1000);
  let purgedCount = 0;

  for (const key of Object.keys(inMemoryStore)) {
    const turns = inMemoryStore[key];
    if (Array.isArray(turns) && turns.length > 0) {
      const lastTurn = turns[turns.length - 1];
      const lastTime = lastTurn.timestamp ? new Date(lastTurn.timestamp).getTime() : 0;
      if (lastTime > 0 && lastTime < cutoffTime) {
        delete inMemoryStore[key];
        purgedCount++;
      }
    }
  }

  if (purgedCount > 0) {
    console.log(`[HISTORY STORE PURGE] Removed ${purgedCount} inactive conversation sessions older than ${maxDays} days.`);
  }
}

// Initialize storage directory and file with backward-compatibility
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(HISTORY_FILE)) {
    const rawEncrypted = fs.readFileSync(HISTORY_FILE, 'utf8');
    const decryptedJson = decrypt(rawEncrypted);
    if (decryptedJson) {
      inMemoryStore = JSON.parse(decryptedJson) || {};
    }
  } else if (fs.existsSync(LEGACY_FILE)) {
    // Migrate legacy plain JSON file to encrypted store
    const legacyRaw = fs.readFileSync(LEGACY_FILE, 'utf8');
    inMemoryStore = JSON.parse(legacyRaw) || {};
    saveToDisk();
    try { fs.unlinkSync(LEGACY_FILE); } catch (e) {}
  } else {
    saveToDisk();
  }

  purgeOldSessions(30);
} catch (e) {
  console.warn('[HISTORY STORE] Initialized with fallback store:', e.message);
  inMemoryStore = {};
}

function saveToDisk() {
  try {
    const jsonStr = JSON.stringify(inMemoryStore);
    const encryptedData = encrypt(jsonStr);
    fs.writeFileSync(HISTORY_FILE, encryptedData, 'utf8');
  } catch (e) {
    console.warn('[HISTORY STORE WARN] Failed to save encrypted conversation history:', e.message);
  }
}

function getHistory(key) {
  return inMemoryStore[key] || [];
}

function addTurn(key, role, text) {
  if (!key) return;
  if (!inMemoryStore[key]) inMemoryStore[key] = [];
  inMemoryStore[key].push({ role, text, timestamp: new Date().toISOString() });
  
  if (inMemoryStore[key].length > 20) {
    inMemoryStore[key] = inMemoryStore[key].slice(-20);
  }
  saveToDisk();
}

function clearHistory(key) {
  if (key && inMemoryStore[key]) {
    delete inMemoryStore[key];
    saveToDisk();
  }
}

// Periodic purge once every 24 hours
setInterval(() => {
  purgeOldSessions(30);
  saveToDisk();
}, 24 * 60 * 60 * 1000);

const PROSPECTS_FILE = path.join(DATA_DIR, 'prospects_db.json');
const METRICS_FILE = path.join(DATA_DIR, 'metrics_db.json');

function loadProspectsFromDisk() {
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8')) || [];
    }
  } catch (e) {}
  return [];
}

function saveProspectsToDisk(logs) {
  try {
    fs.writeFileSync(PROSPECTS_FILE, JSON.stringify(logs.slice(-500), null, 2), 'utf8');
  } catch (e) {}
}

const PROSPECTS_COLLECTION = 'bot_prospects';

// Devuelve null (no undefined/[]) cuando Firestore no está disponible o
// falla, para que quien llama pueda distinguir "sin datos" de "no se
// pudo consultar" y decida quedarse con lo que ya tenía en memoria/disco
// en vez de vaciarlo por error.
async function loadProspectsFromFirestore() {
  if (!db) return null;
  try {
    const snap = await db.collection(PROSPECTS_COLLECTION).orderBy('lastActiveMs', 'asc').limit(500).get();
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.warn('[FIRESTORE] Error leyendo prospectos:', e.message);
    return null;
  }
}

// No bloqueante a propósito: quien llama no espera esta promesa (la
// respuesta al usuario/webhook no debe depender de la latencia de
// Firestore). Un doc por chatId -- reenviar el mismo chatId actualiza en
// vez de duplicar.
function syncProspectToFirestore(entry) {
  if (!db || !entry || !entry.chatId) return;
  db.collection(PROSPECTS_COLLECTION).doc(String(entry.chatId)).set(entry, { merge: true })
    .catch((e) => console.warn('[FIRESTORE] Error guardando prospecto:', e.message));
}

// contractsDB es un objeto plano { [code]: contract }, no un arreglo --
// contracts.json guarda la facturación real de clientes SaaS, así que
// esta es la migración más delicada de las tres. Mismo patrón: se
// hidrata al arrancar (Firestore gana sobre el disco para los folios
// que ya tenga; el disco solo aporta lo que Firestore aún no vio) y cada
// escritura se replica ahí, sin bloquear la respuesta al cliente.
const CONTRACTS_COLLECTION = 'bot_contracts';

async function loadContractsFromFirestore() {
  if (!db) return null;
  try {
    const snap = await db.collection(CONTRACTS_COLLECTION).get();
    const out = {};
    snap.docs.forEach((d) => { out[d.id] = d.data(); });
    return out;
  } catch (e) {
    console.warn('[FIRESTORE] Error leyendo contratos:', e.message);
    return null;
  }
}

function syncContractToFirestore(contract) {
  if (!db || !contract || !contract.code) return;
  db.collection(CONTRACTS_COLLECTION).doc(String(contract.code)).set(contract, { merge: true })
    .catch((e) => console.warn('[FIRESTORE] Error guardando contrato:', e.message));
}

function deleteContractFromFirestore(code) {
  if (!db || !code) return;
  db.collection(CONTRACTS_COLLECTION).doc(String(code)).delete()
    .catch((e) => console.warn('[FIRESTORE] Error borrando contrato:', e.message));
}

function loadMetricsFromDisk() {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function saveMetricsToDisk(metrics) {
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf8');
  } catch (e) {}
}

const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments_db.json');

function loadAppointmentsFromDisk() {
  try {
    if (fs.existsSync(APPOINTMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8')) || [];
    }
  } catch (e) {}
  return [];
}

function saveAppointmentsToDisk(appointments) {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments.slice(-500), null, 2), 'utf8');
  } catch (e) {}
}

const APPOINTMENTS_COLLECTION = 'bot_appointments';

async function loadAppointmentsFromFirestore() {
  if (!db) return null;
  try {
    const snap = await db.collection(APPOINTMENTS_COLLECTION).orderBy('createdAt', 'asc').limit(500).get();
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.warn('[FIRESTORE] Error leyendo citas:', e.message);
    return null;
  }
}

function syncAppointmentToFirestore(entry) {
  if (!db || !entry || !entry.id) return;
  db.collection(APPOINTMENTS_COLLECTION).doc(String(entry.id)).set(entry, { merge: true })
    .catch((e) => console.warn('[FIRESTORE] Error guardando cita:', e.message));
}

const VISITS_FILE = path.join(DATA_DIR, 'visits_db.json');

function loadVisitsFromDisk() {
  try {
    if (fs.existsSync(VISITS_FILE)) {
      return JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8')) || [];
    }
  } catch (e) {}
  return [];
}

function saveVisitsToDisk(logs) {
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify(logs.slice(-1000), null, 2), 'utf8');
  } catch (e) {}
}

function purgeOldVisits(maxDays = 30) {
  try {
    const visits = loadVisitsFromDisk();
    if (!Array.isArray(visits) || visits.length === 0) return;
    
    const cutoffMs = Date.now() - (maxDays * 24 * 60 * 60 * 1000);
    const recent = [];
    const archived = [];

    visits.forEach(v => {
      let vTime = v.timestamp ? new Date(v.timestamp).getTime() : 0;
      if (isNaN(vTime) || vTime <= 0) {
        recent.push(v);
      } else if (vTime < cutoffMs) {
        archived.push(v);
      } else {
        recent.push(v);
      }
    });

    if (archived.length > 0) {
      const ARCHIVE_FILE = path.join(DATA_DIR, 'visits_archive.json');
      let existingArchive = [];
      try {
        if (fs.existsSync(ARCHIVE_FILE)) {
          existingArchive = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')) || [];
        }
      } catch (e) {}

      const updatedArchive = [...existingArchive, ...archived].slice(-5000);
      fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(updatedArchive, null, 2), 'utf8');
      saveVisitsToDisk(recent);
      console.log(`[VISITS PURGE] Archived ${archived.length} visits older than ${maxDays} days to visits_archive.json.`);
    }
  } catch (e) {
    console.error('[PURGE VISITS ERROR]', e);
  }
}

function createDailyVisitsBackup() {
  try {
    const visits = loadVisitsFromDisk();
    if (!Array.isArray(visits) || visits.length === 0) return;
    
    const cdmxDateStr = new Date().toISOString().split('T')[0];
    const BACKUP_DIR = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const backupFile = path.join(BACKUP_DIR, `visits_backup_${cdmxDateStr}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(visits, null, 2), 'utf8');
    console.log(`[BACKUP] Saved daily visits snapshot to ${backupFile}`);
  } catch (e) {
    console.error('[BACKUP ERROR]', e.message);
  }
}

const IGNORED_IPS_FILE = path.join(DATA_DIR, 'ignored_ips.json');

function loadIgnoredIpsFromDisk() {
  try {
    if (fs.existsSync(IGNORED_IPS_FILE)) {
      return JSON.parse(fs.readFileSync(IGNORED_IPS_FILE, 'utf8')) || [];
    }
  } catch (e) {}
  return [];
}

function saveIgnoredIpsToDisk(ips) {
  try {
    fs.writeFileSync(IGNORED_IPS_FILE, JSON.stringify(ips, null, 2), 'utf8');
  } catch (e) {}
}

// Run visits purge and daily backup check every 12 hours
setInterval(() => {
  purgeOldVisits(30);
  createDailyVisitsBackup();
}, 12 * 60 * 60 * 1000);

// Also run backup on startup
setTimeout(createDailyVisitsBackup, 10000);

module.exports = {
  getHistory,
  addTurn,
  clearHistory,
  purgeOldSessions,
  inMemoryStore,
  loadProspectsFromDisk,
  saveProspectsToDisk,
  loadProspectsFromFirestore,
  syncProspectToFirestore,
  loadAppointmentsFromDisk,
  saveAppointmentsToDisk,
  loadAppointmentsFromFirestore,
  syncAppointmentToFirestore,
  loadContractsFromFirestore,
  syncContractToFirestore,
  deleteContractFromFirestore,
  loadMetricsFromDisk,
  saveMetricsToDisk,
  loadVisitsFromDisk,
  saveVisitsToDisk,
  loadIgnoredIpsFromDisk,
  saveIgnoredIpsToDisk,
  purgeOldVisits,
  createDailyVisitsBackup
};


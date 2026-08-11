/**
 * BRAIN BRANDING PERSISTENT CONVERSATION HISTORY STORE
 * AES-256 Encrypted storage for Telegram & WhatsApp conversation turns
 * Features: AES-256-CBC Encryption, Auto-Purge of inactive sessions (>30 days)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

module.exports = {
  getHistory,
  addTurn,
  clearHistory,
  purgeOldSessions,
  inMemoryStore,
  loadProspectsFromDisk,
  saveProspectsToDisk,
  loadMetricsFromDisk,
  saveMetricsToDisk
};

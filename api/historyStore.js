/**
 * BRAIN BRANDING PERSISTENT CONVERSATION HISTORY STORE
 * Saves and loads Telegram & WhatsApp conversation turns to disk
 * Prevents loss of context when Render backend restarts or spins down
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'conversation_history.json');

let inMemoryStore = {};

// Initialize storage directory and file
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(HISTORY_FILE)) {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    inMemoryStore = JSON.parse(raw) || {};
  } else {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
} catch (e) {
  console.warn('[HISTORY STORE] Using in-memory fallback store:', e.message);
  inMemoryStore = {};
}

function saveToDisk() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf8');
  } catch (e) {
    console.warn('[HISTORY STORE WARN] Failed to save conversation history to disk:', e.message);
  }
}

function getHistory(key) {
  return inMemoryStore[key] || [];
}

function addTurn(key, role, text) {
  if (!key) return;
  if (!inMemoryStore[key]) inMemoryStore[key] = [];
  inMemoryStore[key].push({ role, text, timestamp: new Date().toISOString() });
  
  // Maintain max 20 turns per conversation
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

module.exports = {
  getHistory,
  addTurn,
  clearHistory,
  inMemoryStore
};

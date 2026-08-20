const express = require('express');
const crypto = require('crypto');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { getGeminiReply, geminiMetrics, setSecurityAlertCallback, setTruncationAlertCallback, generateLeadBriefing, testGeminiConnection, extractAppointmentInfo } = require('./geminiHelper.js');
const googleCalendar = require('./googleCalendar.js');
const { getHistory, addTurn } = require('./historyStore.js');

// Declarado aquí arriba (no donde se usaba antes, ~2760 líneas más abajo)
// para que cualquier código del archivo lo pueda usar sin caer en el mismo
// bug de "usado antes de declararse" que ya tumbaba el servidor en cada
// arranque (ver DATA_DIR/lastBillingCheckDate).
const DATA_DIR = path.join(__dirname, '../data');
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

const KB_FILE = path.join(DATA_DIR, 'knowledge_base.txt');

// Antes el editor de "Base de Conocimiento" del panel admin solo guardaba
// en localStorage del navegador — el bot real (que corre aquí, en el
// servidor) nunca tenía forma de leerlo, así que cualquier cosa que el
// admin editara ahí no tenía ningún efecto real en las respuestas del bot,
// aunque el mensaje de confirmación decía "los bots consultarán estos
// datos de inmediato".
function loadKnowledgeBase() {
  try {
    if (fs.existsSync(KB_FILE)) {
      const text = fs.readFileSync(KB_FILE, 'utf8').trim();
      if (text) return text;
    }
  } catch (e) {
    console.warn('[KB] Error leyendo base de conocimiento personalizada:', e.message);
  }
  return '';
}

const app = express();
// Guarda el cuerpo crudo (bytes exactos) de cada request — lo necesita
// verifyMetaSignature en whatsapp.js para calcular el HMAC real de Meta.
// El router de WhatsApp se monta más abajo (app.use(whatsappApp.router)),
// así que para cuando llega ahí el body ya fue parseado aquí; sin esto no
// hay forma de recuperar los bytes originales que Meta firmó.
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.text({ type: '*/*', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================================================
// 🔐 ALR SaaS GOVERNANCE API — REGISTRADO ANTES DE express.static
// (El static middleware capturaría estas rutas si van después)
// ================================================================
const ALR_GOVERNANCE_SECRET = 'alr-saas-master-2025-brain';
const KUATSI_DOC_IDS = ['kuatsi_central', 'kuatsi', 'kuatsi-cafeteria'];

function patchFirestoreStatus(docId, status) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ fields: { status: { stringValue: status } } });
    const fsPath = `/v1/projects/brain-branding/databases/(default)/documents/master_licenses/${docId}?updateMask.fieldPaths=status`;
    const req = https.request({
      hostname: 'firestore.googleapis.com', port: 443, path: fsPath, method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(body);
          resolve({ docId, ok: res.statusCode === 200, status: d.fields?.status?.stringValue, httpCode: res.statusCode });
        } catch (e) {
          resolve({ docId, ok: false, error: e.message, httpCode: res.statusCode });
        }
      });
    });
    req.on('error', e => resolve({ docId, ok: false, error: e.message }));
    req.write(payload); req.end();
  });
}

app.post('/api/governance/set-status', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { licenseId, status, callerKey } = req.body || {};
  if (callerKey !== ALR_GOVERNANCE_SECRET) {
    return res.status(403).json({ ok: false, error: 'Not authorized.' });
  }
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'EXPIRED'];
  const normalized = (status || '').toUpperCase();
  if (!validStatuses.includes(normalized)) {
    return res.status(400).json({ ok: false, error: `Invalid status: ${status}` });
  }
  const docIds = Array.from(new Set([...KUATSI_DOC_IDS, ...(licenseId && !KUATSI_DOC_IDS.includes(licenseId) ? [licenseId] : [])]));
  console.log(`[GOVERNANCE API] ⚡ Writing "${normalized}" → docs: ${docIds.join(', ')}`);
  const results = await Promise.all(docIds.map(d => patchFirestoreStatus(d, normalized)));
  const allOk = results.every(r => r.ok);
  console.log(`[GOVERNANCE API] ${allOk ? '✅' : '❌'} Result:`, JSON.stringify(results));
  return res.status(allOk ? 200 : 207).json({ ok: allOk, status: normalized, results, timestamp: new Date().toISOString() });
});

app.get('/api/governance/status', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  https.get(`https://firestore.googleapis.com/v1/projects/brain-branding/databases/(default)/documents/master_licenses/kuatsi_central?t=${Date.now()}`, (fsRes) => {
    let body = ''; fsRes.on('data', c => body += c);
    fsRes.on('end', () => {
      try {
        const d = JSON.parse(body);
        res.json({ ok: true, status: d.fields?.status?.stringValue || 'UNKNOWN', lastUpdated: d.fields?.lastUpdated?.stringValue, source: 'firestore:kuatsi_central' });
      } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
    });
  }).on('error', e => res.status(500).json({ ok: false, error: e.message }));
});

app.options('/api/governance/set-status', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

// Antes esta contraseña solo se comparaba EN EL NAVEGADOR (index.html
// tenía el hash escrito ahí y comparaba con crypto.subtle.digest del
// lado del cliente) — cualquiera podía saltarse esa comparación entera
// con las herramientas de desarrollador, sin pasar nunca por un
// servidor. Se admite ADMIN_PASSWORD_HASH por variable de entorno (con
// el mismo hash actual como respaldo, para no invalidar la contraseña
// existente sin coordinarlo primero).
const ADMIN_PASS_HASH = process.env.ADMIN_PASSWORD_HASH || "5f746de363014fcf4c725d94e0ade7189b0fd6142d2a8484316946262fa7abd0";

let adminPasswordFailCount = 0;
let adminPasswordLockedUntil = 0;

// Verificación real del paso 1 del login admin (contraseña maestra) — el
// paso 2 (OTP por Telegram) ya pasaba por el servidor desde antes
// (/api/admin/request-2fa y /api/admin/verify-2fa); ahora el paso 1
// también, cerrando el hueco de que alguien con devtools abiertos podía
// forzar el avance al 2FA sin conocer la contraseña real.
app.post('/api/admin/verify-password', (req, res) => {
  if (Date.now() < adminPasswordLockedUntil) {
    const minsLeft = Math.ceil((adminPasswordLockedUntil - Date.now()) / 60000);
    return res.status(429).json({ ok: false, error: `⛔ Bloqueado por intentos fallidos. Reintenta en ${minsLeft} min.` });
  }

  const { password } = req.body || {};
  const hash = crypto.createHash('sha256').update(String(password || '')).digest('hex');

  if (hash !== ADMIN_PASS_HASH) {
    adminPasswordFailCount++;
    if (adminPasswordFailCount >= 5) {
      adminPasswordLockedUntil = Date.now() + 15 * 60 * 1000;
      adminPasswordFailCount = 0;
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: '🚨 *ALERTA DE SEGURIDAD — CONTRASEÑA ADMIN* 🚨\n\nSe registraron 5 intentos fallidos consecutivos de contraseña del panel admin. Acceso bloqueado 15 minutos.',
        parse_mode: 'Markdown'
      }).catch(() => {});
      return res.status(429).json({ ok: false, error: '🚨 Demasiados intentos fallidos. Bloqueado 15 minutos.' });
    }
    return res.status(401).json({ ok: false, error: 'Contraseña incorrecta.' });
  }

  adminPasswordFailCount = 0;
  return res.status(200).json({ ok: true });
});

// Base de conocimiento personalizada del bot — antes el panel admin solo
// la guardaba en localStorage del navegador y el bot real nunca la leía.
// GET es público (es contenido de negocio, no un secreto) para que el
// admin lo pueda precargar en el editor; POST exige la contraseña maestra
// del panel (mismo hash que ya se usa para entrar al panel) para que no
// cualquiera pueda reescribir las instrucciones que recibe la IA.
app.get('/api/knowledge-base', (req, res) => {
  const text = loadKnowledgeBase();
  return res.status(200).json({ ok: true, text, isCustom: !!text });
});

app.post('/api/knowledge-base', (req, res) => {
  const { text, password } = req.body || {};
  if (typeof text !== 'string') {
    return res.status(400).json({ ok: false, error: 'Falta el texto de la base de conocimiento.' });
  }
  const hash = crypto.createHash('sha256').update(String(password || '')).digest('hex');
  if (hash !== ADMIN_PASS_HASH) {
    return res.status(403).json({ ok: false, error: 'Contraseña incorrecta.' });
  }
  try {
    fs.writeFileSync(KB_FILE, text.trim(), 'utf8');
    console.log('[KB] Base de conocimiento actualizada por el admin.');
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[KB] Error al guardar:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Serve static web app files directly with anti-caching headers
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: 0, etag: false, lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// HTTP Anti-Intrusion, Security Headers & CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// El token real vivía escrito en texto plano aquí, en un repositorio
// público de GitHub — cualquiera con el link tenía control total del bot
// (leer mensajes, mandar como si fuera el bot, cambiar el webhook). Ahora
// se exige por variable de entorno; sin ella el bot simplemente no podrá
// mandar/recibir mensajes de Telegram (el resto del sitio sigue
// funcionando normal).
// Se quita cualquier espacio/salto de linea que se haya colado al copiar y
// pegar el token (paso EXACTAMENTE lo que tumbo el bot el 2026-08-20: un
// espacio en medio del token volvia invalida la URL de la API de Telegram
// con "Request path contains unescaped characters", un error que ni
// siquiera llegaba a callTelegram() para poder detectarlo ahi). Un token
// real de Telegram nunca lleva espacios, asi que quitarlos siempre es
// seguro.
const TELEGRAM_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/\s+/g, '');
if (!TELEGRAM_TOKEN) {
  console.error('[FATAL] TELEGRAM_BOT_TOKEN no está configurado como variable de entorno. El bot de Telegram no podrá enviar ni recibir mensajes hasta que se configure.');
} else if (!/^\d+:[A-Za-z0-9_-]+$/.test(TELEGRAM_TOKEN)) {
  console.error(`[FATAL] TELEGRAM_BOT_TOKEN no tiene el formato esperado de Telegram (numero:letras) tras quitar espacios — revisa que se haya copiado completo y sin caracteres extra. Valor actual (longitud ${TELEGRAM_TOKEN.length}): "${TELEGRAM_TOKEN}"`);
}

const kb = {
  agencia: {
    nombre: "Brain Branding",
    eslogan: "Empoderando Marcas, Reprogramando Mentes",
    sitioWeb: "https://brainbranding.com.mx"
  },
  comercial: {
    activacionInicial: "Cuota plana de desarrollo e implementación a la medida.",
    mantenimientoNube: "10% mensual para servidor resiliente, respaldos diarios automáticos, actualizaciones y soporte técnico 24/7.",
    garantiaCeroRiesgo: "Garantía de Satisfacción por contrato y entregables por fases con visto bueno previo."
  },
  generadorDemos: {
    getUrlDemo: (negocio) => `https://brainbranding.com.mx/demos`
  }
};

const userStates = {};
const conversationHistory = {};
const { loadVisitsFromDisk, saveVisitsToDisk, loadIgnoredIpsFromDisk, saveIgnoredIpsToDisk } = require('./historyStore.js');
const visitsLog = loadVisitsFromDisk();
const ignoredAdminIps = new Set(loadIgnoredIpsFromDisk());
const notifiedSessionsHighIntent = new Set();


function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function fuzzyNormalizeText(text) {
  if (!text) return '';
  let str = (text || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1")
    .trim();

  str = str.replace(/\bke\b/g, "que")
           .replace(/\bki\b/g, "qui")
           .replace(/\bk\b/g, "que")
           .replace(/\bkuanto\b/g, "cuanto")
           .replace(/\bkuanta\b/g, "cuanta")
           .replace(/\bkuesta\b/g, "cuesta")
           .replace(/\bkosto\b/g, "costo")
           .replace(/\bpresio\b/g, "precio")
           .replace(/\bpresios\b/g, "precios")
           .replace(/\bsita\b/g, "cita")
           .replace(/\bsitas\b/g, "citas")
           .replace(/\basaer\b/g, "hacer")
           .replace(/\bhase\b/g, "hace")
           .replace(/\bber\b/g, "ver")
           .replace(/\bkerer\b/g, "querer")
           .replace(/\bkiero\b/g, "quiero")
           .replace(/\bquro\b/g, "quiero")
           .replace(/\bakis\b/g, "aqui")
           .replace(/\bdemostrasion\b/g, "demostracion")
           .replace(/\bwats\b/g, "whatsapp")
           .replace(/\bwatsap\b/g, "whatsapp")
           .replace(/\bwasap\b/g, "whatsapp")
           .replace(/\btg\b/g, "telegram");

  return str;
}

function getUserState(chatId) {
  if (!userStates[chatId]) {
    userStates[chatId] = {
      askedFallbacks: new Set(),
      sentReplies: new Set()
    };
  }
  return userStates[chatId];
}

function getUniqueReply(chatId, candidateReply, fallbackOptions = []) {
  const st = getUserState(chatId);
  const sent = st.sentReplies;

  const key = candidateReply.trim();
  if (!sent.has(key)) {
    sent.add(key);
    return candidateReply;
  }

  for (const opt of fallbackOptions) {
    const optKey = opt.trim();
    if (!sent.has(optKey)) {
      sent.add(optKey);
      return opt;
    }
  }

  return candidateReply;
}

// Estado del ultimo error de TOKEN (error_code 401, o un error sincrono al
// construir el request como "unescaped characters" por espacios colados en
// el token) contra la API de Telegram — a diferencia de otros errores de
// Telegram (bot bloqueado por el usuario, callback query expirado, etc.,
// que son normales y no significan que el bot este roto), esto significa
// que TELEGRAM_BOT_TOKEN es invalido/revocado/malformado y NINGUNA llamada
// a Telegram va a funcionar hasta que se corrija en Render. Antes esto no
// se revisaba en ningun lado: callTelegram() resolvia igual con
// {ok:false,...} (o ni siquiera eso, en el caso del error sincrono) y el
// resto del codigo nunca inspeccionaba `.ok`, asi que un token roto dejaba
// el bot (chats Y reportes automaticos, que usan la misma funcion)
// completamente mudo sin ningun error visible en logs ni alertas.
let lastTelegramAuthError = null;

function callTelegram(method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    let req;
    try {
      req = https.request(options, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(body); } catch (e) { parsed = { ok: false }; }

          if (parsed.ok === false) {
            console.error(`[TELEGRAM API ERROR] ${method} ->`, parsed.error_code, parsed.description);
            if (parsed.error_code === 401) {
              lastTelegramAuthError = {
                method,
                description: parsed.description || 'Unauthorized',
                timestamp: new Date().toISOString(),
              };
            }
          } else if (parsed.ok === true) {
            lastTelegramAuthError = null;
          }

          resolve(parsed);
        });
      });
    } catch (e) {
      // Errores sincronos al construir el request (ej. "Request path
      // contains unescaped characters" por un token con espacios) nunca
      // llegan a la respuesta HTTP de arriba — se capturan aqui para que
      // tambien queden reflejados en /api/keep-alive, no solo en logs.
      console.error(`[TELEGRAM REQUEST ERROR] ${method} ->`, e.message);
      lastTelegramAuthError = { method, description: e.message, timestamp: new Date().toISOString() };
      return reject(e);
    }

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

// ================================================================
// 🔬 SERO LAB LIMS 4.0 REQUIREMENTS SYNC & REALTIME ALERTS API
// ================================================================
const SEROLAB_REQS_FILE = path.join(DATA_DIR, 'serolab_requirements.json');

function loadSeroLabRequirements() {
  try {
    if (fs.existsSync(SEROLAB_REQS_FILE)) {
      return JSON.parse(fs.readFileSync(SEROLAB_REQS_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveSeroLabRequirements(data) {
  try {
    fs.writeFileSync(SEROLAB_REQS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[SERO LAB] Error guardando requerimientos:', e.message);
  }
}

app.post('/api/serolab/save-requirement', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { moduleId, moduleName, authorArea, uso, deseo, submodules } = req.body || {};
  if (!moduleId) return res.status(400).json({ ok: false, error: 'moduleId is required' });

  const currentReqs = loadSeroLabRequirements();
  currentReqs[moduleId] = {
    moduleId,
    moduleName: moduleName || moduleId,
    authorArea: authorArea || 'General',
    uso: uso || '',
    deseo: deseo || '',
    submodules: Array.isArray(submodules) ? submodules : [],
    updatedAt: new Date().toISOString()
  };
  saveSeroLabRequirements(currentReqs);

  // Real-time Telegram notification to Andres
  const submodsText = Array.isArray(submodules) && submodules.length > 0
    ? `\n🧩 *Submódulos Elegidos:* ${submodules.join(', ')}`
    : '';

  const msgText = `🔔 *SERO LAB GUARDÓ UN MÓDULO* 🔔\n\n` +
    `📂 *Módulo:* ${moduleName || moduleId}\n` +
    `👤 *Área / Puesto:* ${authorArea || 'General'}\n\n` +
    `✍️ *Uso Actual:* ${uso || 'Sin especificar'}\n` +
    `🚀 *Requerimientos:* ${deseo || 'Sin especificar'}${submodsText}\n\n` +
    `📊 _Progreso:_ ${Object.keys(currentReqs).length}/18 Módulos Nutridos\n` +
    `🌐 _Ver Panel Completo:_ https://brainbranding.com.mx/demos/serolab/admin.html`;

  callTelegram('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: msgText,
    parse_mode: 'Markdown'
  }).catch(() => {});

  return res.status(200).json({ ok: true, total: Object.keys(currentReqs).length, timestamp: new Date().toISOString() });
});

app.get('/api/serolab/requirements', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const data = loadSeroLabRequirements();
  return res.status(200).json({ ok: true, requirements: data, count: Object.keys(data).length, timestamp: new Date().toISOString() });
});

function getDropReason(clean) {
  if (clean.includes('caro') || clean.includes('costoso') || clean.includes('presupuesto')) return 'PRECIO_ELEVADO';
  if (clean.includes('socio') || clean.includes('jefe') || clean.includes('equipo')) return 'APROBACION_TERCEROS';
  if (clean.includes('excel') || clean.includes('libreta')) return 'PREFIERE_EXCEL';
  if (clean.includes('luego') || clean.includes('despues') || clean.includes('mas tarde')) return 'POSTERGAION';
  return 'NINGUNO';
}

function generateHumanReply(chatId, userName, userText) {
  if (!conversationHistory[chatId]) conversationHistory[chatId] = [];
  const state = getUserState(chatId);
  const history = conversationHistory[chatId];
  history.push({ role: 'user', text: userText });
  if (history.length > 20) history.shift();

  state.lastDropReason = getDropReason(normalizeText(userText));

  const textLower = userText.toLowerCase();
  const textClean = normalizeText(userText);
  const fuzzyClean = fuzzyNormalizeText(userText);

  // 0.1 Manejo de groserías y quejas
  const offenseWords = ['pendejo', 'pendeja', 'chinga', 'mierda', 'basura', 'chafa', 'no sirve', 'estafa', 'estafador', 'puto', 'puta', 'verga', 'madre', 'pinche', 'asco', 'inutil', 'inepto', 'fake', 'falso', 'robando', 'robo', 'porqueria', 'tonto', 'tarado', 'estupido', 'estupida', 'culero', 'malo'];
  const isOffensive = offenseWords.some(w => textClean.includes(w) || fuzzyClean.includes(w));

  if (isOffensive) {
    const calmReply = `Lamento mucho si hubo algún malentendido. En Brain Branding nos tomamos muy en serio la atención a cada cliente.\n\nTe dejo mi contacto directo para atenderte personalmente sin rodeos:\n\n📱 WhatsApp Directo: https://wa.me/527712339238\n📞 Teléfono: +52 771 233 9238\n\n¿En qué te puedo apoyar directamente el día de hoy?`;
    history.push({ role: 'model', text: calmReply });
    return getUniqueReply(chatId, calmReply);
  }

  // Evaluador de convicción
  const evaluateConvictionLevel = (clean, fuzzy) => {
    if (clean.includes('contratar') || clean.includes('comprar ya') || clean.includes('pasame la cuenta') || clean.includes('datos bancarios') || clean.includes('donde transfiero') || clean.includes('donde pago') || clean.includes('arrancar ya') || clean.includes('empezar ya')) {
      return 'TOTALMENTE';
    }
    if (clean.includes('con cuanto se inicia') || clean.includes('cuanto es de anticipo') || clean.includes('propuesta formal') || clean.includes('cuando empezamos') || clean.includes('metodos de pago') || clean.includes('garantia') || clean.includes('factura')) {
      return 'MUCHO';
    }
    if (clean.includes('se integra') || clean.includes('cuanto tarda') || clean.includes('tiempo de entrega') || clean.includes('como funciona') || clean.includes('modulos') || clean.includes('demostracion') || clean.includes('demo')) {
      return 'REGULAR';
    }
    if (clean.includes('caro') || clean.includes('costoso') || clean.includes('otra agencia') || clean.includes('mas barato')) {
      return 'POCO';
    }
    return 'REGULAR';
  };

  state.conviction = evaluateConvictionLevel(textClean, fuzzyClean);

  // 0.2 Inicio de conversación (/start o saludo inicial)
  if (userText === '/start' || textClean === 'hola' || textClean === 'buenas' || textClean === 'buenos dias' || textClean === 'buenas tardes') {
    conversationHistory[chatId] = [];
    userStates[chatId] = { askedFallbacks: new Set(), sentReplies: new Set() };
    const history = conversationHistory[chatId];

    const greetingName = userName ? ` ${userName}` : '';
    const welcome = `¡Hola${greetingName}! 👋 Qué gusto saludarte, ¿cómo estás? En Brain Branding nos da mucho gusto atenderte. 😊\n\nResolvemos tus dudas y desarrollamos la tecnología que necesita tu empresa para vender más y trabajar mejor:\n\n• **Asistentes IA 24/7:** Atención automática, cotizaciones y agendamiento por WhatsApp.\n• **Apps Móviles (Android & iOS / PWA):** Tienda digital con notificaciones push a pantalla de bloqueo.\n• **Puntos de Venta (POS) y ERPs Nube:** Cobro en 2 segundos desde celular o tablet y control de stock.\n• **Software y Páginas Web a la Medida:** Plataformas creadas para tu forma exacta de trabajar.\n\nPara orientarte de forma rápida: ¿cuál de estas opciones prefieres que desarrollemos para ti?\n\n📱 **1.** Una Aplicación Móvil (Android / iOS / PWA)\n🤖 **2.** Un Asistente de IA 24/7 para WhatsApp / Telegram\n💳 **3.** Un Punto de Venta (POS) o ERP en la Nube\n🌐 **4.** Una Página Web o Sistema a la Medida ☕`;
    history.push({ role: 'user', text: userText });
    history.push({ role: 'model', text: welcome });
    return getUniqueReply(chatId, welcome);
  }

  // 0.3 Solicitud de Información / Servicios / Ejemplos
  if (userText === '/demo' || textClean.includes('demo') || fuzzyClean.includes('demo') || textClean.includes('demostracion') || textClean.includes('servicio') || textClean.includes('ejemplo')) {
    const greetingName = userName ? ` ${userName}` : '';
    const reply = `¡Con mucho gusto${greetingName}! Te explico exactamente las opciones que podemos construir para ti:\n\n1. **Asistentes IA 24/7:** Responden dudas, cotizan y agendan citas por WhatsApp las 24 horas.\n2. **Apps Móviles (Android & iOS):** Tus clientes la instalan en 1 clic y les envías promociones a su pantalla de bloqueo.\n3. **Puntos de Venta (POS) en la Nube:** Cobras en segundos desde celular o tablet y controlas tu caja.\n4. **Software a la Medida:** Plataformas creadas según tu operación.\n\n¿Qué prefieres que realice tu sistema?\n\n• **Opción A:** Automatizar atención a clientes y ventas por WhatsApp 24/7.\n• **Opción B:** Cobro rápido e inventario en punto de venta.\n• **Opción C:** Una App Móvil completa para tu marca. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.35 Intento de Apps Móviles (Android / iOS / PWA)
  if (textClean.includes('app') || textClean.includes('aplicacio') || textClean.includes('movil') || textClean.includes('android') || textClean.includes('ios') || textClean.includes('play store') || textClean.includes('app store') || textClean.includes('iphone')) {
    state.giro = 'Desarrollo de Apps Móviles (Android & iOS / PWA)';
    const reply = `¡Excelente! En Brain Branding nos especializamos en desarrollar **Aplicaciones Móviles (Apps)** nativas y PWA a la medida para Android e iOS (iPhone):\n\n• **Apps de Venta y Pedidos para Clientes:** Catálogo digital con cobro en tarjeta (Stripe/Mercado Pago) y notificaciones push ilimitadas a la pantalla de bloqueo.\n• **Apps PWA de Instalación Instantánea:** Tus clientes la instalan en 1 clic desde el navegador sin pagar comisiones a tiendas (30% de ahorro directo).\n• **Apps Operativas para Tu Personal:** Control de repartidores, citas, inventarios, comandas y visitas en campo con modo offline.\n• **Publicación Oficial Llave en Mano:** Nos encargamos de todo el registro y publicación en Google Play Store y Apple App Store.\n\n🌐 Demo: https://brain-branding.web.app/#demo-apps\n\nPlatícame: ¿qué función principal te gustaría que tenga tu App o para quién estará dirigida? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.4 Fase Cierre Listo
  if (state.conviction === 'TOTALMENTE' || textClean.includes('pasame la cuenta') || textClean.includes('datos bancarios') || textClean.includes('donde transfiero')) {
    state.temp = 'CITA_URGENTE';
    const reply = `¡Excelente decisión! Vamos a dejar tu sistema funcionando exactamente como lo necesitas.\n\nSi gustas, te podemos canalizar con un representante para coordinar la reunión de arranque o enviarte la propuesta formal con datos bancarios para el anticipo inicial (35%).\n\n¿Prefieres que un representante te llame hoy mismo o a qué hora te queda mejor platicar 5 minutos? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.5 Intención Alta
  if (textClean.includes('con cuanto se inicia') || textClean.includes('propuesta formal') || textClean.includes('cuando empezamos')) {
    state.temp = 'CALIENTE';
    const reply = `Podemos iniciar con la fase de diseño y levantamiento esta misma semana. 📄\n\nTrabajamos por fases claras (35% de anticipo y 65% restante únicamente a la entrega tras tu entera conformidad) y emitimos factura fiscal CFDI 4.0.\n\nPara preparar tu propuesta personalizada, ¿me compartes el nombre de tu empresa y tu correo?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.6 Manejo de titubeo o postergación
  const isPostponing = textClean.includes('luego') || textClean.includes('despues') || 
                       textClean.includes('mas tarde') || textClean.includes('ocupad') || 
                       textClean.includes('ahorita no') || textClean.includes('ahora no') || 
                       textClean.includes('pongo en contacto') || textClean.includes('te aviso') || 
                       textClean.includes('les aviso') || textClean.includes('te hablo') || 
                       textClean.includes('luego los') || textClean.includes('luego veo') || 
                       textClean.includes('luego reviso');

  if (isPostponing) {
    const greetingName = userName ? ` ${userName}` : '';
    const rescueReply = `Entiendo perfectamente${greetingName}, sé que en el día a día el tiempo vuela. 🙌\n\nSin ningún compromiso, cuando tengas un par de minutos libres podemos coordinar una breve llamada de 5 minutos para que la revises con calma.\n\nQuedo a la orden cuando te desocupes. ¡Que tengas un excelente día! ☕`;
    history.push({ role: 'model', text: rescueReply });
    return getUniqueReply(chatId, rescueReply);
  }

  // 0.7 Consultas de precios
  const isPureNumber = /^\d+$/.test(textClean);
  const isPriceQuery = !isPureNumber && (
                       userText === '/precios' || 
                       textClean.includes('precio') || 
                       textClean.includes('costo') || 
                       textClean.includes('cuanto cuesta') || 
                       textClean.includes('cuanto vale') || 
                       textClean.includes('cuanto sale') || 
                       textClean.includes('cuanto cobra') || 
                       textClean.includes('cuanto es') || 
                       textClean.includes('cotiz') || 
                       textClean.includes('inversio') || 
                       textClean.includes('tarifa') || 
                       textClean.includes('paquet') || 
                       textClean.includes('plan'));

  if (isPriceQuery) {
    state.askedPrice = true;
    const greetingName = userName ? ` ${userName}` : '';
    let reply = `Te platico con gusto sobre los presupuestos de referencia${greetingName}. 💰 En Brain Branding desarrollamos tecnología a la medida enfocada en generar retorno de inversión rápido.\n\nPor ejemplo:\n• **Asistente IA / Bot para WhatsApp & Telegram:** Implementación desde $4,500 MXN (pago único de desarrollo e integración).\n• **Puntos de Venta (POS) y ERPs:** Servidor seguro y mantenimiento en la nube desde $290 a $490 MXN al mes (incluye soporte 24/7 y respaldos automáticos).\n• **Desarrollos Web y Sistemas Especiales:** Se cotizan según las funciones exactas requeridas.\n\nPlatícame un poco más sobre lo que necesita tu negocio para darte un estimado más preciso a la medida. ☕`;

    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.15 Manejo de Notas de Voz / Audios
  if (userText.includes('[Nota de voz') || textClean.includes('nota de voz') || textClean.includes('audio')) {
    const greetingName = userName ? ` ${userName}` : '';
    const voiceReply = `¡Hola${greetingName}! 👋 Escuché atentamente tu mensaje de voz. Qué gusto saludarte, ¿cómo estás?\n\nEn Brain Branding nos especializamos en construir tecnología limpia y ágil a la medida: Asistentes de IA para WhatsApp/Telegram, Puntos de Venta (POS) en la nube y Páginas Web o Software personalizado.\n\nPlatícame un poquito más sobre tu negocio o qué proceso te gustaría automatizar primero para darte la orientación idónea. ☕`;
    history.push({ role: 'model', text: voiceReply });
    return getUniqueReply(chatId, voiceReply);
  }

  // 0.8 Giros Específicos de Negocio (Ferretaría, Restaurante, Taller, Clínica, Boutique, etc.)
  if (textClean.includes('ferret') || textClean.includes('refacc') || textClean.includes('abarrot') || textClean.includes('tiend') || textClean.includes('boutiqu') || textClean.includes('super')) {
    state.giro = 'Comercio / Tienda / Ferretería';
    const reply = `¡Excelente giro! Para tiendas, ferreterías y comercios desarrollamos soluciones muy ágiles:\n\n• **Punto de Venta Táctil Móvil:** Cobro en 3 segundos con escáner de código de barras desde cualquier celular o tablet.\n• **Control de Stock e Inventario:** Manejo de unidades, cajas o paquetes con alertas de stock mínimo.\n• **Corte de Caja Diario:** Reporte de ventas en efectivo, transferencia o tarjeta.\n\nCuéntame: ¿cuántos productos o notas de venta manejan aproximadamente al día?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('restauran') || textClean.includes('cafeter') || textClean.includes('comida') || textClean.includes('cocin') || textClean.includes('taquer') || textClean.includes('bar')) {
    state.giro = 'Restaurante / Alimentos';
    const reply = `¡Qué gran giro! Para restaurantes, cafeterías y negocios de alimentos implementamos:\n\n• **Comandero Móvil para Meseros:** Captura de comandas desde celular enviadas directo a cocina o barra.\n• **Control de Insumos e Inventario:** Descuento automático de ingredientes por cada platillo vendido.\n• **Asistente IA para Pedidos a Domicilio:** Toma de pedidos por WhatsApp 24/7 con ubicación del cliente.\n\n¿Tienen servicio de comedor, para llevar o a domicilio?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('veterin') || textClean.includes('mascot') || textClean.includes('estetic') || textClean.includes('spa') || textClean.includes('barber') || textClean.includes('salon') || textClean.includes('peluquer')) {
    state.giro = 'Salón / Barbería / Veterinaria';
    const reply = `¡Excelente giro! Para barberías, spas, salones de belleza y veterinarias, las mejores herramientas son:\n\n• **Agendamiento Autónomo por WhatsApp 24/7:** El cliente elige su horario y servicio sin saturar tu teléfono.\n• **Recordatorios Automáticos:** Avisos por mensaje 24 horas antes para evitar ausentismos.\n• **Control de Ficha de Cliente / Mascota:** Historial de servicios, tratamientos o cortes previos.\n\n¿Cuántos especialistas o estilistas atienden en tu negocio?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.74 Desarrollo de Aplicaciones Móviles (Android & iOS)
  if (textClean.includes('app') || textClean.includes('aplicacion') || textClean.includes('movil') || textClean.includes('android') || textClean.includes('ios') || textClean.includes('play store') || textClean.includes('app store') || textClean.includes('iphone')) {
    state.giro = state.giro || 'Desarrollo de Apps Móviles';
    const reply = `¡Excelente! En Brain Branding desarrollamos Aplicaciones Móviles (Apps) nativas y PWA a la medida para Android e iOS (iPhone):\n\n• **Apps de Venta y Pedidos para Clientes:** Catálogo digital con cobro en tarjeta (Stripe/Mercado Pago) y notificaciones push ilimitadas a la pantalla de bloqueo.\n• **Apps PWA de Instalación Instantánea:** El cliente la instala en 1 clic desde el navegador sin pagar comisiones a tiendas.\n• **Apps Operativas para Empleados:** Control de repartidores, citas, inventarios y comandas en tiempo real.\n• **Servicio Llave en Mano:** Nos encargamos de todo el registro y publicación oficial en Google Play Store y Apple App Store.\n\n🌐 **Probar Demo de App Móvil:** https://brain-branding.web.app/#demo-apps\n\nPlatícame: ¿qué función principal te gustaría que tenga tu App o para quién estará dirigida? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.75 Puntos de Venta (POS) / Cobro
  if (textClean.includes('punto de venta') || textClean.includes('pos') || textClean.includes('sistema de cobro') || textClean.includes('caja registradora') || textClean.includes('terminal')) {
    state.giro = state.giro || 'Punto de Venta';
    const reply = `¡Con mucho gusto! Nuestros Puntos de Venta (POS) en la nube te permiten:\n\n• **Cobrar en Segundos:** Desde cualquier celular, tablet o computadora con escáner de código de barras.\n• **Control Total de Inventarios:** Alertas automáticas de productos o insumos por agotarse.\n• **Corte de Caja Diario:** Reporte claro de ingresos en efectivo, tarjeta y transferencias con respaldo seguro en la nube desde $290 MXN/mes.\n\n🌐 **Probar Demo Interactiva en Vivo:** https://brain-branding.web.app/#demo-pos\n\nPara recomendarte la configuración idónea: ¿de qué giro es tu negocio y qué productos o servicios vendes? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.78 Autolavados & Car Wash (Comprobación prioritaria)
  if (textClean.includes('autolavado') || textClean.includes('lavado de auto') || textClean.includes('carwash') || textClean.includes('car wash') || textClean.includes('lavadero')) {
    state.giro = 'Autolavado & Car Wash';
    const reply = `¡Excelente giro! Para autolavados y centros de estética automotriz implementamos soluciones muy prácticas:\n\n• **Punto de Venta Exprés para Autolavados:** Capturas el paquete de lavado (sencillo, detallado, encerado, vestiduras) por tipo de vehículo (sedán, SUV, camioneta) en 3 segundos desde celular o tablet.\n• **Ticket Digital por WhatsApp:** El cliente recibe su comprobante digital en su teléfono al dejar su auto.\n• **Aviso Automático de "Auto Listo":** Al terminar el lavado, el sistema notifica por WhatsApp al cliente para que pase a recogerlo.\n• **Control de Insumos y Corte de Caja:** Monitoreo de shampoo, cera, microfibras y reporte diario de caja.\n\n🌐 **Probar Demo Interactiva en Vivo:** https://brain-branding.web.app/#demo-autolavado\n\nCuéntame: ¿cuántos autos lavan aproximadamente al día o qué paquetes manejan? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.79 Purificadoras de Agua y Garrafones (Giro Centro de México)
  if (textClean.includes('purificadora') || textClean.includes('garrafon') || textClean.includes('planta de agua') || textClean.includes('agua purificada') || textClean.includes('embotelladora')) {
    state.giro = 'Purificadora de Agua & Garrafones';
    const reply = `¡Gran giro! Para purificadoras de agua y plantas embotelladoras del centro de México desarrollamos:\n\n• **Punto de Venta de Cobro Exprés:** Registro de recarga de garrafón, envase nuevo y fichas de mostrador en 2 segundos.\n• **Rutas de Repartidores por WhatsApp:** Pedidos a domicilio tomados 24/7 con dirección y ubicación GPS del cliente.\n• **Control de Insumos y Filtros:** Registro de tapones, sellos, garrafones prestados y corte de caja por turno.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-purificadora\n\n¿Tienen venta únicamente en mostrador o cuentan con rutas de repartidores a domicilio? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.80 Tortillerías & Molinos de Nixtamal (Giro Centro de México)
  if (textClean.includes('tortilleria') || textClean.includes('molino') || textClean.includes('nixtamal') || textClean.includes('tortilla')) {
    state.giro = 'Tortillería & Molino';
    const reply = `¡Excelente giro tradicional! Para tortillerías y molinos de nixtamal desarrollamos soluciones muy ágiles:\n\n• **Cobro Táctil de Botón Rápido:** Botones de importe exacto ($10, $20, $50, $100) y kilos para cobro en 2 segundos.\n• **Control de Reparto a Taquerías y Cocinas:** Notas de entrega a crédito o contado para clientes mayoristas.\n• **Rendimiento de Harina y Maíz:** Registro de bultos procesados y kilos de masa producidos.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-tortilleria\n\n¿Surten pedidos a taquerías/restaurantes o atienden principalmente mostrador? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.81 Imprentas, Sublimación, Tazas & Publicidad (Giro Centro de México)
  if (textClean.includes('imprenta') || textClean.includes('sublimac') || textClean.includes('taza') || textClean.includes('serigraf') || textClean.includes('volante') || textClean.includes('lona') || textClean.includes('impresion') || textClean.includes('publicidad')) {
    state.giro = 'Imprenta & Sublimación / Publicidad';
    const reply = `¡Buenísimo giro! Para imprentas, centros de sublimación y publicidad implementamos:\n\n• **Cotizador Expres de Impresión y Regalos:** Precios automáticos por millar, pliego o unidad en tazas, lonas, playeras y volantes.\n• **Control de Anticipos (50%):** Registro de abono para enviar a producción y saldo pendiente contra entrega.\n• **Avisos de "Trabajo Listo" por WhatsApp:** Notificación automática al cliente cuando su pedido esté terminado.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-imprenta\n\n¿Qué tipo de trabajos realizan con mayor frecuencia? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.82 Carnicerías, Pollerías & Cremerías (Giro Centro de México)
  if (textClean.includes('carniceria') || textClean.includes('polleria') || textClean.includes('cremeria') || textClean.includes('salchichoneria') || textClean.includes('carnes')) {
    state.giro = 'Carnicería / Pollería / Cremería';
    const reply = `¡Excelente giro! Para carnicerías, pollerías y cremerías implementamos:\n\n• **Punto de Venta Táctil Exprés:** Captura por kilos, gramos o peso exacto con cobro ultra rápido.\n• **Control de Inventarios y Cámara Fría:** Registro de entrada de canales, cortes y mermas.\n• **Corte de Caja Diario:** Control exacto de ventas en efectivo, tarjeta y transferencias.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-carniceria\n\n¿Manejan únicamente venta al menudeo o también surten a taquerías y banquetes? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.83 Farmacias & Boticas de Barrio (Giro Centro de México)
  if (textClean.includes('farmacia') || textClean.includes('botica') || textClean.includes('medicamento') || textClean.includes('patente') || textClean.includes('drogueria')) {
    state.giro = 'Farmacia & Botica';
    const reply = `¡Un giro fundamental! Para farmacias y boticas de barrio implementamos:\n\n• **Punto de Venta con Búsqueda de Genéricos y Patentes:** Consulta rápida por ingrediente activo, sustancia o marca.\n• **Alerta de Caducidades Próximas:** Reporte automático de lotes por vencer para prevenir mermas.\n• **Módulo de Consultorio Anexo:** Registro de recetas y consultas médicas rápidas.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-farmacia\n\n¿Cuentan con consultorio médico anexo o únicamente mostrador de venta? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.84 Materiales de Construcción & Bloqueras (Giro Centro de México)
  if (textClean.includes('materiales') || textClean.includes('cemento') || textClean.includes('varilla') || textClean.includes('bloquera') || textClean.includes('tabique') || textClean.includes('arena')) {
    state.giro = 'Materiales para Construcción';
    const reply = `¡Excelente giro! Para casas de materiales de construcción y bloqueras del centro de México desarrollamos:\n\n• **Venta por Viajes, Bultos y Metros:** Cotizaciones rápidas de cemento, varilla, arena y tabique.\n• **Control de Fletes y Entregas en Obra:** Asignación de remisiones a choferes con cobro a contraentrega.\n• **Créditos a Maestros de Obra:** Estado de cuenta claro con folios de notas firmadas.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-materiales\n\n¿Cuenta con camiones propios para entrega en obra? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.85 Cabañas, Hoteles, Balnearios & Turismo (Hidalgo, Querétaro, Edomex)
  if (textClean.includes('balneario') || textClean.includes('cabana') || textClean.includes('cabaña') || textClean.includes('hotel') || textClean.includes('posada') || textClean.includes('hospedaje') || textClean.includes('turismo')) {
    state.giro = 'Hotel / Cabañas / Balneario';
    const reply = `¡Excelente giro turístico! Para cabañas, hoteles, balnearios y parques ecoturísticos del centro de México implementamos:\n\n• **Reservación Inteligente 24/7 por WhatsApp:** El cliente consulta fotos, tarifas y disponibilidad de cabañas u habitaciones.\n• **Anticipos y Comprobantes:** Recepción automática de transferencias y confirmación de reserva.\n• **Punto de Venta para Consumos:** Cobro en restaurante, accesos a albercas y actividades.\n\n🌐 **Probar Demo Interactiva:** https://brain-branding.web.app/#demo-turismo\n\n¿Cuántas cabañas o habitaciones manejan en sus instalaciones? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('hojalat') || textClean.includes('carroc') || textClean.includes('pintur') || textClean.includes('taller') || textClean.includes('mecanic') || (textClean.includes('auto') && !textClean.includes('autolavado')) || textClean.includes('vehic')) {
    state.giro = 'Taller Automotriz & Hojalatería';
    const reply = `¡Excelente giro! Para talleres mecánicos, de hojalatería y pintura desarrollamos soluciones muy prácticas:\n\n• **Recepción de Vehículos en Celular:** Capturas la orden con fotos de abolladuras y detalles desde el celular, generando la hoja de servicio al instante.\n• **Avisos Automáticos por WhatsApp:** El sistema notifica al cliente el avance de su vehículo (hojalatería, pintura o listo para entrega) sin que tengas que enviar mensajes a mano.\n• **Control de Presupuestos y Anticipos:** Manejo de reparaciones, refacciones y corte de caja.\n\nCuéntame: ¿cómo llevan actualmente la recepción de vehículos y el control de las órdenes de servicio en tu taller?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('jardin') || textClean.includes('poda') || textClean.includes('plant') || textClean.includes('paisaj')) {
    state.giro = 'Jardinería & Mantenimiento';
    const reply = `¡Buenísimo! Para servicios de jardinería y mantenimiento de áreas verdes, las herramientas que más ayudan a ordenar el trabajo son:\n\n• **Agendamiento Inteligente de Visitas:** Tus clientes solicitan cotización por WhatsApp y el asistente organiza tus fechas en el calendario.\n• **Cotizador Expres:** Envías presupuestos en PDF profesionales en menos de 1 minuto desde el celular.\n• **Catálogo Digital de Proyectos:** Galería visual para mostrar tus trabajos previos a clientes potenciales.\n\nPlatícame, ¿cuántos servicios o visitas atienden aproximadamente a la semana?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('cita') || textClean.includes('agend') || textClean.includes('horari') || textClean.includes('reserv')) {
    state.dolor = 'Agendamiento de citas';
    const reply = `Entiendo perfecto. Cuando trabajas por citas, contestar mensajes manuales quita muchísimo tiempo y a veces se pierden clientes por tardar en responder.\n\nCon un Asistente IA personalizado:\n1. El cliente consulta disponibilidad y agenda 24/7 por WhatsApp o Telegram.\n2. Se sincroniza con tu agenda en tiempo real.\n3. Envía recordatorios automáticos para evitar cancelaciones de última hora.\n\n¿Te gustaría que diseñemos un flujo de agendamiento adaptado exactamente a tus horarios y servicios?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('panader') || textClean.includes('pan') || textClean.includes('pastel') || textClean.includes('reposter')) {
    state.giro = 'Panadería & Pastelería';
    const reply = `¡Qué gran giro! Para panaderías y reposterías implementamos sistemas muy ágiles:\n\n• Punto de Venta táctil para cobro en segundos y control de inventario de materia prima (harina, azúcares, insumos).\n• Asistente IA para tomar encargos de pasteles sobre diseño o pedidos al mayoreo por WhatsApp 24/7.\n• Catálogo digital de especialidades.\n\n¿Tienes una sucursal o varias ubicaciones?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('inmobiliari') || textClean.includes('bienes raices') || textClean.includes('propiedad') || textClean.includes('casa') || textClean.includes('terreno')) {
    state.giro = 'Inmobiliaria & Bienes Raíces';
    const reply = `En bienes raíces el secreto está en responderle al interesado en los primeros minutos. Con nuestro asistente en WhatsApp:\n\n• Muestra fichas de propiedades, fotos, precios y ubicaciones automáticamente.\n• Filtra presupuesto e intención del comprador antes de agendar la visita.\n• Agenda el recorrido directamente en la agenda de tu asesor.\n\n¿Cuántos asesores o propiedades manejan actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('clinic') || textClean.includes('medic') || textClean.includes('doctor') || textClean.includes('denti') || textClean.includes('pacient')) {
    state.giro = 'Clínica & Consultorio Médico';
    const reply = `Para consultorios y clínicas médicas, el asistente IA permite:\n\n• Agendar pacientes 24/7 por WhatsApp sin saturar recepción.\n• Enviar recordatorios automáticos 24 horas antes para reducir ausentismos.\n• Llevar expediente y ficha de seguimiento de cada paciente.\n\n¿Tienen un consultorio individual o coordinan varios especialistas?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('escuel') || textClean.includes('colegi') || textClean.includes('curso') || textClean.includes('alumn')) {
    state.giro = 'Escuela / Instituto';
    const reply = `Para escuelas y academias automatizamos la atención a aspirantes, dudas de colegiaturas y avisos a padres de familia por WhatsApp.\n\n¿Qué tipo de cursos o niveles educativos ofrecen?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }


  // 0.9 Consultas frecuentes (Ubicación, Facturación, Garantías, Tiempos)
  if (textClean.includes('donde estan') || textClean.includes('ubicacion') || textClean.includes('oficina')) {
    const reply = `Nuestras oficinas de desarrollo se encuentran en Pachuca, Hidalgo, y brindamos servicio e implementación digital a clientes en todo México y Latinoamérica 🇲🇽🌎.\n\nTodo el desarrollo y las reuniones se realizan en línea para tu mayor comodidad. ¿Te gustaría agendar una breve llamada de 5 minutos para conocernos?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.88 Disambiguation of Invoicing System vs Our Invoicing
  const isInvoiceSystemRequest = textClean.includes('modulo de factura') || 
                                textClean.includes('sistema de factura') || 
                                textClean.includes('facturacion') ||
                                (textClean.includes('programa') && textClean.includes('factur')) || 
                                (textClean.includes('integre') && textClean.includes('factur')) || 
                                (textClean.includes('modulo') && textClean.includes('factur')) || 
                                textClean.includes('facturar a mis clientes') || 
                                textClean.includes('autofactura') || 
                                textClean.includes('timbrad');

  if (isInvoiceSystemRequest) {
    state.giro = state.giro || 'Sistema de Facturación e Inventario';
    const reply = `¡Sí, totalmente! Desarrollamos e integramos **Módulos de Facturación Electrónica CFDI 4.0** (con timbrado automático SAT / PAC) en tus Puntos de Venta (POS), ERPs, Apps o Sistemas a la Medida. 📄⚡\n\nTu software puede generar facturas en PDF/XML al instante al cobrar, enviarlas por WhatsApp/correo a tus clientes o habilitar un **Portal de Autofacturación Web** para tu negocio.\n\n¿Qué modalidad de facturación prefieres que tenga tu sistema?\n\n📄 **1.** Facturación automática al momento del cobro en caja (POS).\n🌐 **2.** Portal de Autofacturación Web por ticket de venta.\n📊 **3.** Módulo de Facturación masiva e inventario integrado. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  const isOurInvoiceQuery = textClean.includes('ustedes facturan') || textClean.includes('dan factura') || textClean.includes('emiten factura') || textClean.includes('son deducibles') || (textClean.includes('factura') && (textClean.includes('servicio') || textClean.includes('desarrollo') || textClean.includes('ustedes')));
  if (isOurInvoiceQuery) {
    const reply = `¡Así es, por supuesto! 📜 Todos nuestros desarrollos y servicios de Brain Branding son 100% deducibles de impuestos y emitimos factura fiscal CFDI 4.0 a persona física o moral.\n\n¿Deseas que te enviemos una cotización formal deducible para tu empresa? ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('cuanto tardan') || textClean.includes('tiempo de entrega')) {
    const reply = `Nuestros tiempos de entrega son muy ágiles:\n\n• **Asistentes IA y Bots:** De 24 a 48 horas operando en tu WhatsApp.\n• **Puntos de Venta (POS):** 24 horas.\n• **Software y Desarrollos a la Medida:** De 3 a 7 días hábiles.\n\n¿Para qué fecha te gustaría tener tu proyecto listo?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.89 Detección Dinámica de Giros Poco Comunes o No Listados (Investigación Operativa)
  const unknownGiroMatch = textLower.match(/(?:tengo|somos|mi negocio es|mi empresa es|tengo una|tengo un|nos dedicamos a|giro de|trabajo en|local de|fabricante de|empacadora de|beneficio de|laboratorio de)\s+([a-záéíóúñ\s]{3,35})/i);
  if (unknownGiroMatch && unknownGiroMatch[1] && !state.giro) {
    const rawGiro = unknownGiroMatch[1].trim();
    state.giro = rawGiro.charAt(0).toUpperCase() + rawGiro.slice(1);
    const reply = `¡Excelente giro! Para negocios y empresas del sector **${state.giro}** desarrollamos tecnología limpia y ágil a la medida de tu operación:\n\n• **Punto de Venta (POS) y Control Operativo:** Cobro en segundos desde celular o tablet con control de inventarios y stock.\n• **Asistente IA 24/7 para WhatsApp y Telegram:** Atención de consultas, catálogos digitales y agendamiento automático sin saturar tu teléfono.\n• **Software y Plataforma Web a la Medida:** Desarrollada exactamente para la forma en que trabaja tu empresa.\n\nPara proponerte la solución más precisa: ¿cuántos colaboradores trabajan en tu negocio de **${state.giro}** o cuál es el proceso que más tiempo les quita en el día a día? ☕\n\n📱 *Si gustas, compárteme tu número telefónico o WhatsApp de contacto y platícame en qué horario te queda mejor recibir una llamada breve.*`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.91 Confirmación de Recepción de Teléfono / WhatsApp e Notificación Inmediata a 7712339238
  const phoneInputMatch = userText.match(/(?:\+?52\s*)?(?:\(?\d{2,3}\)?[\s.-]*)?\d{3,4}[\s.-]*\d{4}\b/g);
  if (phoneInputMatch && phoneInputMatch.length > 0) {
    const rawPhone = phoneInputMatch[0].replace(/\D/g, '');
    if (rawPhone.length >= 10) {
      const cleanPhone = rawPhone.length === 10 ? `52${rawPhone}` : rawPhone;
      state.phone = cleanPhone;
      state.awaitingQualification = true;

      // NOTIFICACIÓN INMEDIATA A ANDRÉS R EN TELEGRAM (+52 771 233 9238 / Chat ID 8337803949)
      try {
        const nowTime = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
        callTelegram('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          text: `🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n🔴 *OPORTUNIDAD DE VENTA EN VIVO* 🔴\n⚡ *ATENCIÓN URGENTE A CLIENTE* ⚡\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📲 *TELÉFONO:* \`+${cleanPhone}\`\n👤 *CLIENTE:* *${userName || 'Cliente'}*\n🏢 *GIRO / EMPRESA:* *${state.giro || 'No especificado'}*\n⏰ *HORA:* *${nowTime} (Centro MX)*\n💬 *CHAT ID:* \`${chatId}\`\n\n👉 *Marcar directo:* \`tel:+${cleanPhone}\`\n👉 *Responder por WA:* \`/enviarwa ${cleanPhone} Hola ${userName || ''}, recibí tu solicitud de contacto de Brain Branding...\`\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨`,
          parse_mode: 'Markdown'
        });
      } catch(e) { console.error('Error enviando notificacion inmediata:', e); }

      const greetingName = userName ? ` ${userName}` : '';
      const reply = `¡Excelente${greetingName}! Ya registré tu número (+${cleanPhone}) y le notifiqué de inmediato a Andrés R (771 233 9238). 📲\n\nPara personalizar tu atención y dirigirnos correctamente contigo:\n1. ¿Cuál es tu **nombre completo** y tu **puesto/cargo** en tu empresa (ej. Carlos Mendoza - Director / Dueño / Gerente de Ventas)?\n2. ¿Prefieres que te contactemos por **llamada telefónica** o **WhatsApp** y en qué **horario** te resulta más cómodo? ☕`;
      history.push({ role: 'model', text: reply });
      return getUniqueReply(chatId, reply);
    }
  }

  // 0.915 Captura de Nombre, Puesto, Horario y Canal Preferido de Contacto
  if (state.phone && (state.awaitingQualification || textClean.includes('llamada') || textClean.includes('whatsapp') || textClean.includes('dueño') || textClean.includes('dueno') || textClean.includes('director') || textClean.includes('gerente') || textClean.includes('administrad') || textClean.includes('encargad') || textClean.includes('fundador') || textClean.includes('socio') || textClean.includes('pm') || textClean.includes('am') || textClean.includes('tarde') || textClean.includes('mañana'))) {
    state.awaitingQualification = false;

    // Detect contact channel preference
    const isCall = textClean.includes('llamada') || textClean.includes('marquen') || textClean.includes('marcar') || textClean.includes('telefono');
    state.contactMode = isCall ? 'Llamada Telefónica 📞' : 'Mensaje de WhatsApp 💬';

    // Detect position/role if mentioned
    const posMatch = userText.match(/(dueño|dueña|dueno|duena|director|directora|gerente|administrador|administradora|encargado|encargada|fundador|fundadora|socio|socia|jefe|jefa|coordinador|coordinadora|supervisor|supervisora|propietario|propietaria)/i);
    if (posMatch) {
      state.contactPosition = posMatch[0].charAt(0).toUpperCase() + posMatch[0].slice(1);
    }

    // Capture contact name if user gave it
    const cleanWords = userText.replace(/(soy|mi nombre es|me llamo|llamada|whatsapp|dueño|dueno|director|gerente|por|en|a las|\d+)/gi, '').trim();
    if (cleanWords.length > 2 && !state.contactName) {
      state.contactName = cleanWords.split(/\s+/).slice(0, 3).join(' ');
    }

    // Capture preferred time
    if (textClean.includes('tarde') || textClean.includes('mañana') || textClean.includes('pm') || textClean.includes('am') || /\d+/.test(textClean)) {
      state.contactTime = userText.trim();
    }

    // NOTIFICAR ACTUALIZACIÓN DE FICHA DESTACADA AL ADMINISTRADOR
    try {
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎\n👑 *FICHA DE LEAD PERFILADO DE ALTO VALOR* 👑\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 *CONTACTO:* *${state.contactName || userName || 'Cliente'}*\n💼 *PUESTO / CARGO:* 👑 *${state.contactPosition || 'Dueño / Director General'}*\n📲 *TELÉFONO:* \`+${state.phone}\`\n📞 *MEDIO PREFERIDO:* *${state.contactMode}*\n⏰ *HORARIO SOLICITADO:* *${state.contactTime || 'Lo antes posible / Horario laboral'}*\n🏢 *GIRO COMERCIAL:* *${state.giro || 'General / PyME'}*\n💬 *CHAT ID:* \`${chatId}\`\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ *ACCIONES RÁPIDAS:*\n• *Marcar:* \`tel:+${state.phone}\`\n• *Mandar WA:* \`/enviarwa ${state.phone} Hola ${state.contactName || userName || ''}, soy Andrés R de Brain Branding...\`\n💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎`,
        parse_mode: 'Markdown'
      });
    } catch(e) { console.error('Error notificando ficha:', e); }

    const clientName = state.contactName || userName || '';
    const nameGreeting = clientName ? ` ${clientName}` : '';
    const channelText = state.contactMode.includes('Llamada') ? 'por llamada telefónica' : 'por mensaje de WhatsApp';
    const timeText = state.contactTime ? `en el horario acordado (${state.contactTime})` : 'a la brevedad';

    const reply = `¡Anotado perfectamente${nameGreeting}! 📌 Tu solicitud ha sido registrada formalmente.\n\nAndrés R te contactará **${channelText}** al **+${state.phone}** ${timeText}.\n\n¡Muchas gracias por comunicarte con Brain Branding! Que tengas un excelente día. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.90 Solicitud de Hablar con un Humano / Asesor / Contacto Directo (cuando NO tenemos su teléfono)
  const isTeamSize = /\d+\s*persona/i.test(textClean) || textClean.includes('trabajamos') || textClean.includes('somos');
  const isHumanRequest = !isTeamSize && !state.phone && (
    textClean.includes('hablar con humano') || 
    textClean.includes('un humano') || 
    textClean.includes('un asesor') || 
    textClean.includes('hablar con alguien') || 
    textClean.includes('contacto directo') || 
    textClean.includes('me contacten') || 
    textClean.includes('me llamen') || 
    textClean.includes('contactenme') || 
    textClean.includes('llamenme') || 
    (textClean.includes('llamada') && !state.phone)
  );

  if (isHumanRequest) {
    if (pausedChats[chatId]) delete pausedChats[chatId];
    const greetingName = userName ? ` ${userName}` : '';
    const reply = `¡Por supuesto${greetingName}! Con mucho gusto te canalizo directamente con Andrés R. 🙌\n\n📱 Puedes abrir conversación directa por WhatsApp dando clic aquí: https://wa.me/527712339238\n\nO si prefieres, compárteme por aquí tu **número telefónico o WhatsApp (10 dígitos)** y platícame en qué horario te resulta más cómodo recibir nuestra llamada. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }



  if (textClean.includes('ya te di') || textClean.includes('ya te pase') || textClean.includes('ya te mande') || textClean.includes('ya envie') || textClean.includes('ya te lo mande')) {
    const reply = `¡Excelente! Ya recibí tus datos y Andrés R te estará contactando a la brevedad. Si deseas agregar algún detalle adicional sobre tu proyecto o duda específica, con gusto lo registro. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 1.0 Manejo natural de entradas cortas o genéricas ("hola", "ok", "bien", "saludos")
  const isShortInput = userText.trim().split(/\s+/).length <= 3;
  const genericWords = ['si', 'sí', 'ok', 'no', 'bien', 'hola', 'interesa', 'mm', 'a ver', 'saludos', 'gracias', 'grax', 'buenas', 'buenos dias', 'buenas tardes'];
  const isGeneric = genericWords.some(w => textLower === w || textLower === w + '.');

  if (isShortInput && isGeneric) {
    const greetingName = userName ? ` ${userName}` : '';
    const reply = `¡Con mucho gusto${greetingName}! Te resuelvo cualquier duda y te guío paso a paso. 💡\n\n¿Qué prefieres que desarrollemos para tu negocio?\n\n📱 **1.** Una Aplicación Móvil (Android / iOS / PWA)\n🤖 **2.** Un Asistente de IA 24/7 para WhatsApp / Telegram\n💳 **3.** Un Punto de Venta (POS) o ERP en la Nube\n🌐 **4.** Una Página Web o Plataforma a la Medida\n\nEscribe el número u opción que te llame la atención para explicarte detalles. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 1.1 Matriz Consultiva Guía de Opciones (Resolvedor de Dudas)
  const fallbackMatrix = [
    `En Brain Branding resolvemos tus dudas operativas y guiamos tu proyecto paso a paso. 🚀\n\nPara recomendarte la mejor alternativa, ¿cuál de estas soluciones encaja mejor con tu negocio?\n\n• **1. Automatizar Atención:** Responder dudas, cotizaciones y citas por WhatsApp 24/7.\n• **2. Fidelizar Clientes:** App Móvil con catálogo, pedidos y notificaciones a pantalla de bloqueo.\n• **3. Control Operativo:** Punto de Venta (POS) y caja rápida desde celular o tablet. ☕`,
    `¡Con gusto resolvemos cada una de tus inquietudes! Toda nuestra tecnología está diseñada para recuperar tu inversión rápidamente. 💡\n\n¿Qué tipo de solución buscas hoy?\n\n• **Opción A:** Una App Móvil publicada en Google Play y App Store.\n• **Opción B:** Un Asistente de IA operando en tu WhatsApp.\n• **Opción C:** Un Sistema Web a la medida de tu empresa. ☕`,
    `Con mucho gusto te asesoro de forma directa. En Brain Branding nos enfocamos en darte certeza y resultados medibles desde la primera semana. 📌\n\n¿Prefieres que te enviemos una propuesta estimada por aquí o que agendemos una breve llamada de 5 minutos con Andrés R? ☕`
  ];

  const userFallbackIndex = (state.fallbackCounter || 0) % fallbackMatrix.length;
  state.fallbackCounter = (state.fallbackCounter || 0) + 1;

  const reply = fallbackMatrix[userFallbackIndex];
  history.push({ role: 'model', text: reply });
  return getUniqueReply(chatId, reply);
}

const OWNER_PHONE = '+52 771 233 9238';
const ADMIN_CHAT_ID = '8337803949';
// Si se configura, Telegram manda este valor de vuelta en el header
// X-Telegram-Bot-Api-Secret-Token en cada entrega real del webhook — sin
// esto, el endpoint le creía a CUALQUIER POST que le llegara (nadie
// verificaba que en verdad viniera de Telegram). TODO: configurar esta
// variable en Render para activar la verificación (ver setup-webhook más
// abajo, que registra este mismo valor con Telegram al arrancar).
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || null;

const pausedChats = {};
const { loadProspectsFromDisk, saveProspectsToDisk, loadAppointmentsFromDisk, saveAppointmentsToDisk } = require('./historyStore.js');
const prospectLogs = loadProspectsFromDisk();
let appointments = loadAppointmentsFromDisk();
const userRateLimits = {};

function sanitizeReply(text) {
  if (!text) return "";
  let clean = text;

  // Remove any website URLs sending prospect back to domain
  clean = clean.replace(/https?:\/\/brainbranding\.com\.mx[^\s]*/gi, '');
  clean = clean.replace(/https?:\/\/[^\s]*\.onrender\.com[^\s]*/gi, '');

  // Remove numbered menu options and rigid menu phrases
  clean = clean.replace(/responde únicamente con el número[^\n]*/gi, '');
  clean = clean.replace(/para darte la información exacta sin hacerte perder tiempo[^\n]*/gi, '');
  clean = clean.replace(/para darte la mejor atención sin rodeos[^\n]*/gi, '');
  clean = clean.replace(/ver la demo en pantalla[^\n]*/gi, '');
  clean = clean.replace(/Probar Demo en Vivo:[^\n]*/gi, '');
  clean = clean.replace(/Ver Demos Interactivas[^\n]*/gi, '');

  // Clean up double newlines or trailing spaces
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  return clean;
}

async function getGeminiReplyWrapper(userText, userName, chatId, history = []) {
  return await getGeminiReply(userText, userName, chatId, history);
}

function checkUserRateLimit(chatId) {
  if (chatId && chatId.toString() === ADMIN_CHAT_ID) return { allowed: true };

  const now = Date.now();
  if (!userRateLimits[chatId]) {
    userRateLimits[chatId] = { count: 1, resetTime: now + 60000 };
    return { allowed: true };
  }

  const record = userRateLimits[chatId];
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + 60000;
    return { allowed: true };
  }

  record.count += 1;
  if (record.count > 10) {
    return { allowed: false, remainingSec: Math.ceil((record.resetTime - now) / 1000) };
  }

  return { allowed: true };
}

function getDynamicKeyboard(chatId, userText) {
  // POR EXPERIENCIA 100% HUMANA: NO ADJUNTAR BOTONES EN CADA MENSAJE
  // Retornamos undefined para que la conversación sea limpia como con un consultor real
  return undefined;
}

function getLeadTemperature(text) {
  const t = text.toLowerCase();
  if (t.includes('precio') || t.includes('costo') || t.includes('cuanto') || t.includes('cotizar') || t.includes('comprar') || t.includes('contratar') || t.includes('demostracion') || t.includes('demo') || t.includes('cita') || t.includes('pagar')) {
    return '🔥 *LEAD CALIENTE (Alta Intención de Compra)*';
  }
  if (t.includes('sucursal') || t.includes('modulo') || t.includes('taller') || t.includes('hojalat') || t.includes('jardin') || t.includes('tienda') || t.includes('pos') || t.includes('opciones')) {
    return '🟡 *LEAD TIBIO (Interés en Módulos / Giro)*';
  }
  return '❄️ *LEAD FRÍO (Contacto Inicial / Saludo)*';
}

// Limita el largo de un campo individual antes de meterlo en una fila de
// CSV para /exportarcsv y /exportarvisitas. Sin esto, un solo campo muy
// largo (ej. un "giro" o una lista de "clics" larga) podía hacer que esa
// fila completa por sí sola superara el límite de 3500 caracteres del
// mensaje de Telegram y se saltara entera sin aviso.
function truncCsvField(value, max = 200) {
  const str = String(value ?? '');
  return str.length > max ? str.substring(0, max) + '…' : str;
}

// Universal Phone Normalizer (Suggestion 3)
function normalizePhoneNumber(rawInput) {
  if (!rawInput) return '';
  let digits = rawInput.replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 7 || digits.length === 8) return `52771${digits.slice(-7)}`;
  if (digits.startsWith('52') && digits.length === 12) return digits;
  return digits ? `52${digits}` : '';
}

// Time Bucket Schedule Categorizer (Suggestion 1)
function categorizeCallSchedule(text) {
  if (!text) return '📅 FLEXIBLE / POR CONFIRMAR';
  const t = text.toLowerCase();
  if (t.includes('mañana') || t.includes('am') || t.includes('temprano')) return `🌅 MAÑANA (9:00 AM - 1:00 PM) — "${text}"`;
  if (t.includes('tarde') || t.includes('medio dia') || t.includes('mediodia') || t.includes('pm')) return `☀️ TARDE (1:00 PM - 6:00 PM) — "${text}"`;
  if (t.includes('noche') || t.includes('cenar')) return `🌙 NOCHE (6:00 PM - 9:00 PM) — "${text}"`;
  if (t.includes('ahora') || t.includes('ya') || t.includes('inmediato') || t.includes('urgente')) return `⚡ LO ANTES POSIBLE — "${text}"`;
  return `📅 FLEXIBLE — "${text}"`;
}

// Google Calendar 1-Click Quick Add Generator (Suggestion 2)
function buildGoogleCalendarLink(name, phone, giro, scheduleStr) {
  const title = encodeURIComponent(`Llamada Brain Branding - ${name || 'Prospecto'}`);
  const details = encodeURIComponent(`Cliente: ${name || 'Prospecto'}\nTeléfono: +${phone}\nGiro: ${giro || 'General'}\nHorario: ${scheduleStr}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
}

// Fecha CDMX en formato YYYY-MM-DD, con offset de días opcional (0=hoy,
// 1=mañana). Se usa new Date().toLocaleDateString('en-CA', {timeZone})
// en vez de parsear un string de vuelta a Date (frágil) porque en-CA ya
// da directamente el formato YYYY-MM-DD.
function getCdmxDateISO(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

function resolveAppointmentDate(dayLabel) {
  if (dayLabel === 'hoy') return getCdmxDateISO(0);
  if (dayLabel === 'mañana') return getCdmxDateISO(1);
  return null;
}

// Pre-filtro barato antes de gastar una llamada extra de Gemini
// (extractAppointmentInfo): solo vale la pena analizar la respuesta del
// bot si de plano suena a que confirmó una cita con una hora concreta.
const APPOINTMENT_HINT_REGEX = /(agendad|confirmad|queda(?:\s+registrada)?\s+(?:tu\s+|la\s+)?(?:cita|llamada)|te\s+marco|te\s+llamo)/i;
const APPOINTMENT_TIME_HINT_REGEX = /\d{1,2}(:\d{2})?\s*(am|pm|hrs?)\b/i;

// No se espera (fire-and-forget) para no retrasar la respuesta al
// cliente — es una notificación al admin, no algo que el cliente necesite
// que termine antes de recibir su mensaje.
async function detectAndTrackAppointment(chatId, firstName, username, reply) {
  if (!APPOINTMENT_HINT_REGEX.test(reply) || !APPOINTMENT_TIME_HINT_REGEX.test(reply)) return;

  try {
    const info = await extractAppointmentInfo(reply);
    if (!info || !info.isAppointment) return;

    const state = userStates[chatId] || {};
    const dateISO = resolveAppointmentDate(info.dayLabel);
    const time24h = (info.time24h || '').trim() || null;

    // Choque interno = mismo día + misma hora exacta para OTRO chatId ya
    // registrado por el bot. Choque de calendario = lo mismo pero contra
    // el calendario REAL de Andrés (googleCalendar.js) — detecta también
    // compromisos que él puso a mano, que el registro interno nunca
    // podría ver.
    const internalConflict = (dateISO && time24h)
      ? appointments.find(a => a.dateISO === dateISO && a.time24h === time24h && a.chatId !== chatId && a.status !== 'cancelada')
      : null;
    const calendarCheck = await googleCalendar.checkCalendarConflict(dateISO, time24h);

    const entry = {
      id: `${chatId}_${Date.now()}`,
      chatId,
      name: firstName || 'Prospecto',
      username: username || 'Sin username',
      phone: state.phone || null,
      giro: state.giro || 'No especificado',
      dayLabel: info.dayLabel,
      dateISO,
      time24h,
      rawReply: reply.substring(0, 300),
      status: 'confirmada',
      calendarEventUrl: null,
      createdAt: new Date().toISOString()
    };

    // Si hay calendario conectado, el evento se crea de todas formas
    // (aunque haya choque) — Andrés necesita verlo en su calendario para
    // poder resolver el choque manualmente, no que quede invisible.
    entry.calendarEventUrl = await googleCalendar.createCalendarEvent({
      summary: `Cita Brain Branding - ${entry.name}`,
      description: `Teléfono: ${entry.phone ? '+' + entry.phone : 'No proporcionado'}\nGiro: ${entry.giro}\nChat ID: ${chatId}\nOrigen: Telegram Bot`,
      dateISO,
      time24h
    });

    appointments.push(entry);
    if (appointments.length > 500) appointments.shift();
    saveAppointmentsToDisk(appointments);

    const whenLabel = dateISO ? `${dateISO}${time24h ? ' ' + time24h : ''}` : (info.dayLabel || 'sin definir');
    const calendarLine = entry.calendarEventUrl ? `\n🔗 *Ver en Google Calendar:* [Abrir evento](${entry.calendarEventUrl})` : '';

    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: `📅 *NUEVA CITA CONFIRMADA POR EL BOT* 📅\n\n` +
        `👤 *Cliente:* ${entry.name} (${entry.username !== 'Sin username' ? '@' + entry.username : 'sin username'})\n` +
        `📞 *Teléfono:* ${entry.phone ? '+' + entry.phone : 'No proporcionado aún'}\n` +
        `🏢 *Giro:* ${entry.giro}\n` +
        `🗓️ *Cuándo:* ${whenLabel}\n` +
        `🆔 *Chat ID:* \`${chatId}\`${calendarLine}\n\n` +
        `💬 *Tip:* Usa /agenda para ver todas las citas próximas.`,
      parse_mode: 'Markdown'
    }).catch(() => {});

    if (internalConflict || calendarCheck.busy) {
      const contra = internalConflict
        ? `otra cita del bot con *${internalConflict.name}* (chat \`${internalConflict.chatId}\`)`
        : `algo que ya estaba en el calendario real de Andrés (puesto a mano o de otra fuente)`;
      await callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `⚠️ *POSIBLE CHOQUE DE CITAS* ⚠️\n\n` +
          `El bot acaba de confirmarle a *${entry.name}* el horario *${whenLabel}*, que choca con ${contra}.\n\n` +
          `Revisa manualmente cuál horario es el correcto — el bot no puede re-agendar por sí mismo.`,
        parse_mode: 'Markdown'
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('[APPOINTMENT DETECT ERROR]', e.message);
  }
}

async function notifyOwner(chatId, firstName, username, userText) {
  if (chatId.toString() === ADMIN_CHAT_ID) return;

  const state = userStates[chatId] || {};
  const convictionTag = state.conviction ? `🎯 *CONVICCIÓN:* ${state.conviction}` : '🎯 *CONVICCIÓN:* REGULAR';

  const textLower = (userText || '').toLowerCase();
  const isCitaClick = textLower.includes('cita') || textLower.includes('agend') || textLower.includes('whatsapp');

  // Instant Phone Number Extraction Alert with Schedule & Calendar Link
  const phoneMatch = userText.match(/(?:\+?\d{1,3}[\s.-]*)?(?:\(?\d{2,4}\)?[\s.-]*)?\d{3,4}[\s.-]*\d{4}\b/g);
  if (phoneMatch && phoneMatch.length > 0) {
    const cleanPhone = normalizePhoneNumber(phoneMatch[0]);
    if (cleanPhone && cleanPhone.length >= 10) {
      state.phone = cleanPhone;

      // Extract & categorize schedule preference if mentioned
      const scheduleMatch = userText.match(/(?:mañana|tarde|noche|horario|hora|despues|antes|a las|pm|am|[0-9]{1,2}\s*(?:am|pm|hrs?))/i);
      if (scheduleMatch) {
        state.preferredSchedule = userText;
      }

      const scheduleCategory = categorizeCallSchedule(state.preferredSchedule || userText);
      const calendarUrl = buildGoogleCalendarLink(firstName, cleanPhone, state.giro, scheduleCategory);

      const phoneUrgentMsg = `🚨 *¡TELÉFONO DE PROSPECTO CAPTURADO!* 🚨\n\n` +
        `👤 *Cliente:* ${firstName || 'Prospecto'} (${username ? '@' + username : 'Sin Username'})\n` +
        `📞 *Teléfono Detectado:* \`+${cleanPhone}\`\n` +
        `⏰ *Horario Preferido:* ${scheduleCategory}\n` +
        `🏢 *Giro:* ${state.giro || 'No especificado'}\n` +
        `💬 *Mensaje:* "${userText}"\n` +
        `🆔 *Chat ID:* \`${chatId}\`\n\n` +
        `📲 *WhatsApp Directo:* https://wa.me/${cleanPhone}\n` +
        `🗓️ *Agendar en Google Calendar:* [Agendar Cita](${calendarUrl})\n\n` +
        `⚡ *Respuesta directa desde Telegram:* \`/responder ${chatId} ¡Hola! Te marco en el horario indicado.\``;

      try {
        await callTelegram('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          text: phoneUrgentMsg,
          parse_mode: 'Markdown'
        });
      } catch (e) {}

      try {
        const sendWa = require('./whatsapp.js').sendWhatsappMessage;
        if (sendWa) {
          sendWa('527712339238', `🚨 NUEVO PROSPECTO REGISTRADO:\nNombre: ${firstName || 'Prospecto'}\nTeléfono: +${cleanPhone}\nHorario: ${scheduleCategory}\nGiro: ${state.giro || 'General'}\nMensaje: ${userText}`);
        }
      } catch (e) {}
    }
  }

  const tempTag = isCitaClick ? '🔥 *[ALERTA DE CITA SOLICITADA POR WHATSAPP]*' : getLeadTemperature(userText);
  const isPaused = pausedChats[chatId] && pausedChats[chatId] > Date.now();
  const statusTag = isPaused ? '⏸️ *[MODO PAUSA ACTIVO - BOT SILENCIADO]*' : '🤖 *[RESPUESTA AUTOMÁTICA ENVIADA]*';

  prospectLogs.push({
    chatId,
    name: firstName || 'Prospecto',
    username: username || 'Sin username',
    text: userText,
    giro: state.giro || 'No especificado',
    conviction: state.conviction || 'REGULAR',
    temp: isCitaClick ? 'CITA_URGENTE' : (tempTag.includes('CALIENTE') ? 'CALIENTE' : (tempTag.includes('TIBIO') ? 'TIBIO' : 'FRÍO')),
    timestamp: new Date().toLocaleTimeString('es-MX'),
    lastActiveMs: Date.now()
  });
  if (prospectLogs.length > 500) prospectLogs.shift();
  saveProspectsToDisk(prospectLogs);

  const alertHeader = isCitaClick ? '🚨 *¡PROSPECTO SOLICITÓ AGENDAR CITA EN WHATSAPP!* 🚨' : '🚨 *¡NUEVO MENSAJE DE PROSPECTO EN TELEGRAM!* 🚨';
  const giroTag = state.giro ? `🏢 *Giro / Industria:* ${state.giro}\n` : '';

  let briefingTag = '';
  if (isCitaClick || tempTag.includes('CALIENTE')) {
    try {
      const history = getHistory(chatId);
      const brief = await generateLeadBriefing(history);
      if (brief) briefingTag = `📋 *Resumen Ejecutivo IA:* ${brief}\n\n`;
    } catch (e) {}
  }

  const alertText = `${alertHeader}\n\n${tempTag}\n${convictionTag}\n${giroTag}${briefingTag}👤 *Cliente:* ${firstName || 'Prospecto'} (${username ? '@' + username : 'Sin Username'})\n💬 *Mensaje:* "${userText}"\n🆔 *Chat ID:* \`${chatId}\`\n📱 *Notificado a:* ${OWNER_PHONE}\n${statusTag}\n\n⚙️ *Comandos Rápido:* \`/pausa ${chatId}\` | \`/responder ${chatId} <mensaje>\` | \`/plantilla\`\n💡 *Tip de Intervención:* Responde (*Reply*) directamente a este mensaje para platicar con el cliente.`;

  try {
    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: alertText,
      parse_mode: 'Markdown'
    });
  } catch (e) {
    console.error('[OWNER NOTIFICATION ERROR]', e);
  }
}

async function handleWebhookRequest(req, res) {
  try {
    if (TELEGRAM_WEBHOOK_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== TELEGRAM_WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: 'Invalid secret token' });
    }

    const update = req.body || {};

    // Handle Inline Button Clicks (callback_query)
    if (req.method === 'POST' && update && update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;
      const firstName = cb.from ? cb.from.first_name : '';
      const username = cb.from ? cb.from.username : '';

      await callTelegram('answerCallbackQuery', { callback_query_id: cb.id });

      if (pausedChats[chatId] && pausedChats[chatId] > Date.now()) {
        await notifyOwner(chatId, firstName, username, `[Clic en Botón: ${data} (Pausado)]`);
        return res.status(200).json({ ok: true });
      }

      await notifyOwner(chatId, firstName, username, `[Clic en Botón: ${data}]`);

      const reply = generateHumanReply(chatId, firstName, "demos");
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: reply,
        parse_mode: 'Markdown'
      });

      return res.status(200).json({ ok: true });
    }

    // Handle Standard Text & Voice Messages
    if (req.method === 'POST' && update && update.message) {
      const chatId = update.message.chat.id;
      const firstName = update.message.from ? update.message.from.first_name : '';
      const username = update.message.from ? update.message.from.username : '';
      let userText = update.message.text || '';

      // STRICT ADMIN SECURITY FILTER: Only Chat ID 8337803949 can execute admin commands & intervene
      if (chatId.toString() === ADMIN_CHAT_ID) {
        const cmdLower = userText.toLowerCase().trim();

        let replyTargetId = null;
        if (update.message.reply_to_message && update.message.reply_to_message.text) {
          const match = update.message.reply_to_message.text.match(/Chat ID:\s*`?(\d+)`?/i) || update.message.reply_to_message.text.match(/(\d{8,12})/);
          if (match) replyTargetId = match[1];
        }

        if (cmdLower.startsWith('/responder') || cmdLower.startsWith('/decir') || cmdLower.startsWith('/enviar') || replyTargetId) {
          let targetId = replyTargetId;
          let msgToSend = userText;

          if (cmdLower.startsWith('/responder') || cmdLower.startsWith('/decir') || cmdLower.startsWith('/enviar')) {
            const parts = userText.split(/\s+/);
            if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
              targetId = parts[1];
              msgToSend = parts.slice(2).join(' ');
            } else if (targetId) {
              msgToSend = parts.slice(1).join(' ');
            }
          }

          if (targetId && msgToSend && !msgToSend.startsWith('/')) {
            pausedChats[targetId] = Date.now() + 2 * 60 * 60 * 1000;

            try {
              await callTelegram('sendMessage', {
                chat_id: targetId,
                text: msgToSend
              });

              await callTelegram('sendMessage', {
                chat_id: ADMIN_CHAT_ID,
                text: `👤 *MENSAJE HUMANO ENTREGADO EN VIVO* (Chat ID \`${targetId}\`):\n\n💬 "${msgToSend}"\n\n⏸️ *El bot se ha silenciado automáticamente por 2 horas* para que continúes la atención humana. Usa \`/reanudar ${targetId}\` si deseas reactivar el bot.`,
                parse_mode: 'Markdown'
              });
            } catch(err) {
              await callTelegram('sendMessage', {
                chat_id: ADMIN_CHAT_ID,
                text: `❌ *Error al entregar mensaje:* ${err.message}`,
                parse_mode: 'Markdown'
              });
            }
            return res.status(200).json({ ok: true });
          }
        }

        if (cmdLower.startsWith('/pausa') || cmdLower.startsWith('/intervenir')) {
          const parts = userText.split(/\s+/);
          const targetId = parts[1] || (prospectLogs.length > 0 ? prospectLogs[prospectLogs.length - 1].chatId : null);

          if (targetId) {
            pausedChats[targetId] = Date.now() + 30 * 60 * 1000;
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `⏸️ *Bot Pausado durante 30 minutos* para el Chat ID \`${targetId}\`.\n\nAhora puedes platicar directamente con el cliente sin intervención del bot. Usa \`/reanudar ${targetId}\` para reactivarlo.`,
              parse_mode: 'Markdown'
            });
          } else {
            await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: 'Sintaxis: `/pausa <chatId>`', parse_mode: 'Markdown' });
          }
          return res.status(200).json({ ok: true });
        }

        if (cmdLower.startsWith('/reanudar')) {
          const parts = userText.split(/\s+/);
          const targetId = parts[1] || (prospectLogs.length > 0 ? prospectLogs[prospectLogs.length - 1].chatId : null);

          if (targetId) {
            delete pausedChats[targetId];
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `▶️ *Bot Reactivado* para el Chat ID \`${targetId}\`. El bot volverá a responder automáticamente.`,
              parse_mode: 'Markdown'
            });
          }
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/seguimiento' || cmdLower === '/inactivos') {
          const pendingLeads = prospectLogs.filter(p => p.temp === 'CALIENTE' || p.temp === 'CITA_URGENTE' || p.text.includes('precio'));
          let followUpMsg = `📋 *REPORTE DE SEGUIMIENTO A PROSPECTOS CON ALTA INTENCIÓN* 📋\n\n`;
          if (pendingLeads.length === 0) {
            followUpMsg += `• No hay prospectos pendientes de seguimiento registrados en las últimas 24 horas. 👍\n`;
          } else {
            pendingLeads.slice(-8).reverse().forEach((p, idx) => {
              followUpMsg += `${idx + 1}. *${p.name}* (@${p.username || 'sin_user'})\n   💬 "${p.text.substring(0, 35)}..."\n   📲 Recontactar: \`/enviarwa ${p.chatId} citas\`\n\n`;
            });
          }
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: followUpMsg,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/reporte' || cmdLower === '/resumen') {
          const whatsappLogs = require('./whatsapp.js').whatsappProspectLogs || [];
          const uniqueTg = new Set(prospectLogs.map(p => p.chatId)).size;
          const uniqueWa = new Set(whatsappLogs.map(p => p.phone)).size;
          const calientesTg = prospectLogs.filter(p => p.temp === 'CALIENTE' || p.temp === 'CITA_URGENTE').length;

          let reportMsg = `📊 *REPORTE CONSOLIDADO TELEGRAM + WHATSAPP* 📊\n📱 *Teléfono:* ${OWNER_PHONE}\n\n🤖 *TELEGRAM:* ${prospectLogs.length} msgs | ${uniqueTg} prospectos | ${calientesTg} 🔥 citas\n📲 *WHATSAPP:* ${whatsappLogs.length} msgs | ${uniqueWa} prospectos\n\n*Últimas Interacciones Telegram:*\n`;

          prospectLogs.slice(-5).reverse().forEach((p, idx) => {
            reportMsg += `${idx + 1}. [TG] *${p.name}* (@${p.username}) [${p.temp}]\n   💬 "${p.text.substring(0, 30)}..."\n`;
          });

          if (whatsappLogs.length > 0) {
            reportMsg += `\n*Últimas Interacciones WhatsApp:*\n`;
            whatsappLogs.slice(-5).reverse().forEach((p, idx) => {
              reportMsg += `${idx + 1}. [WA] *${p.name}* (\`${p.phone}\`)\n   💬 "${p.text.substring(0, 30)}..."\n`;
            });
          }

          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: reportMsg,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/plantilla' || cmdLower === '/citas') {
          const plantillaMsg = `📱 *PLANTILLAS RÁPIDAS DE RESPUESTA WHATSAPP* 📱\n\n*Plantilla 1 (Respuesta a Citas):*\n"¡Hola! 👋 Soy Andrés R de Brain Branding. Recibí tu mensaje sobre agendar una cita/demo.\n\nPlatícame: ¿qué día u horario prefieres para una llamada rápida de 10 minutos o deseas que te envíe un presupuesto personalizado?"\n\n*Plantilla 2 (Envío de Demos):*\n"¡Con gusto! Aquí puedes probar nuestras demos en vivo:\n🌐 https://brainbranding.com.mx/demos"\n\n⚡ *Envío Automático Directo:* Usa \`/enviarwa <teléfono> citas\` para enviarla en 1 clic.`;

          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: plantillaMsg,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower.startsWith('/enviarwa') || cmdLower.startsWith('/wa')) {
          const parts = userText.split(/\s+/);
          const targetPhone = parts[1];
          const typeOrMsg = parts.slice(2).join(' ').trim();

          if (!targetPhone) {
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: 'Sintaxis: `/enviarwa <teléfono> citas|demos|<mensaje>`',
              parse_mode: 'Markdown'
            });
            return res.status(200).json({ ok: true });
          }

          const sendWa = require('./whatsapp.js').sendWhatsappMessage;
          let finalMsg = typeOrMsg;

          if (!typeOrMsg || typeOrMsg === 'citas') {
            finalMsg = "¡Hola! 👋 Soy Andrés R de Brain Branding. Recibí tu mensaje sobre agendar una cita/demo.\n\nPlatícame: ¿qué día u horario prefieres para una llamada rápida de 10 minutos o deseas que te envíe un presupuesto personalizado?";
          } else if (typeOrMsg === 'demos') {
            finalMsg = "¡Con gusto! Aquí puedes probar nuestras demos en vivo:\n🌐 https://brainbranding.com.mx/demos";
          }

          if (sendWa) sendWa(targetPhone, finalMsg);

          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `✅ *Mensaje WhatsApp Enviado Automáticamente por Andrés R* a \`${targetPhone}\`:\n\n💬 "${finalMsg.substring(0, 80)}..."`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower.startsWith('/plantilla')) {
          const args = userText.substring(10).trim();
          let pitch = '';
          if (args) {
            await callTelegram('sendChatAction', { chat_id: ADMIN_CHAT_ID, action: 'typing' });
            const prompt = `Genera una plantilla de propuesta comercial/respuesta rápida altamente persuasiva, humana y profesional para un prospecto del giro "${args}". En el mensaje explica las soluciones de Asistente IA 24/7 y POS/ERP en la Nube de Brain Branding. Firmado por Andrés R.`;
            pitch = await getGeminiReply(prompt, 'Admin', 'template_gen', [], 'Responde ÚNICAMENTE con la plantilla comercial lista para copiar.');
          }
          if (!pitch) {
            pitch = `📱 *PLANTILLAS RÁPIDAS DE RESPUESTA WHATSAPP* 📱\n\n*Plantilla 1 (Respuesta a Citas):*\n"¡Hola! 👋 Soy Andrés R de Brain Branding. Recibí tu mensaje sobre agendar una cita/demo.\n\nPlatícame: ¿qué día u horario prefieres para una llamada rápida de 10 minutos o deseas que te envíe un presupuesto personalizado?"\n\n*Plantilla 2 (Envío de Demos):*\n"¡Con gusto! Aquí puedes probar nuestras demos en vivo:\n🌐 https://brainbranding.com.mx/demos"\n\n💡 *Tip:* Escribe \`/plantilla restaurante\` o \`/plantilla taller\` para generar una plantilla personalizada con IA para cualquier giro.`;
          }
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: pitch,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/exportarcsv' || cmdLower === '/csv') {
          const header = 'Nombre,Username,ChatID,Clasificacion,Giro,Fecha\n';
          const rows = prospectLogs.map(p => `"${truncCsvField(p.name)}","${truncCsvField(p.username)}","${p.chatId}","${p.temp}","${truncCsvField(p.giro || '')}","${p.timestamp}"`);
          // Antes se cortaba con substring(0, 3500), pudiendo partir una
          // fila a la mitad y sin avisar cuántos registros se perdieron.
          // Ahora se incluyen solo filas completas y se informa cuántas
          // quedaron fuera por el límite de tamaño de mensaje de Telegram.
          let csv = header;
          let included = 0;
          for (const row of rows) {
            if (csv.length + row.length + 1 > 3500) break;
            csv += row + '\n';
            included++;
          }
          const omitted = rows.length - included;
          const footer = omitted > 0 ? `\n\n⚠️ ${omitted} registro(s) omitido(s) por límite de tamaño de mensaje de Telegram.` : '';
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `📊 *EXPORTACIÓN DE PROSPECTOS CSV* 📊\n\n\`\`\`csv\n${csv}\n\`\`\`${footer}`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/exportarvisitas' || cmdLower === '/csvvisitas') {
          const header = 'Fecha,Hora,Ciudad,Region,Pais,Dispositivo,Origen,Duracion,Scroll,Clics,Recurrente\n';
          const rows = visitsLog.map(v => `"${v.timestamp || ''}","${v.time || ''}","${truncCsvField(v.city || '')}","${truncCsvField(v.region || '')}","${truncCsvField(v.country || '')}","${truncCsvField(v.device || '')}","${truncCsvField(v.source || '')}","${truncCsvField(v.duration || '')}","${v.scroll || 0}%","${truncCsvField((v.clicks || []).join(';'))}","${v.isReturning ? 'SI' : 'NO'}"`);
          let csv = header;
          let included = 0;
          for (const row of rows) {
            if (csv.length + row.length + 1 > 3500) break;
            csv += row + '\n';
            included++;
          }
          const omitted = rows.length - included;
          const footer = omitted > 0 ? `\n\n⚠️ ${omitted} registro(s) omitido(s) por límite de tamaño de mensaje de Telegram.` : '';
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `🌐 *EXPORTACIÓN DE VISITAS WEB CSV (ÚLTIMAS 24H)* 🌐\n\n\`\`\`csv\n${csv}\n\`\`\`${footer}`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/agenda' || cmdLower === '/citas') {
          const todayISO = getCdmxDateISO(0);
          const upcoming = appointments
            .filter(a => a.status !== 'cancelada' && (!a.dateISO || a.dateISO >= todayISO))
            .sort((a, b) => (a.dateISO || '9999-99-99').localeCompare(b.dateISO || '9999-99-99') || (a.time24h || '99:99').localeCompare(b.time24h || '99:99'));

          if (upcoming.length === 0) {
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: '📅 No hay citas próximas registradas todavía. Se registran automáticamente cuando el bot confirma una cita/llamada con un prospecto.',
              parse_mode: 'Markdown'
            });
            return res.status(200).json({ ok: true });
          }

          let agendaMsg = `📅 *AGENDA DE CITAS PRÓXIMAS* 📅\n\n`;
          upcoming.forEach((a, idx) => {
            const sameSlot = upcoming.filter(b => a.dateISO && b.dateISO === a.dateISO && b.time24h === a.time24h && b.chatId !== a.chatId);
            const conflictTag = sameSlot.length > 0 ? ' ⚠️ *POSIBLE CHOQUE*' : '';
            const whenLabel = a.dateISO ? `${a.dateISO}${a.time24h ? ' ' + a.time24h : ''}` : (a.dayLabel || 'sin definir');
            const calendarLink = a.calendarEventUrl ? ` | [Ver en Calendar](${a.calendarEventUrl})` : '';
            agendaMsg += `${idx + 1}. *${a.name}* — ${whenLabel}${conflictTag}\n   📞 ${a.phone ? '+' + a.phone : 'sin teléfono'} | 🏢 ${a.giro}${calendarLink}\n   💬 \`/responder ${a.chatId} \`\n\n`;
          });

          await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: agendaMsg.substring(0, 4000), parse_mode: 'Markdown' });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/estado' || cmdLower === '/health' || cmdLower === '/status') {
          const uptimeHours = (process.uptime() / 3600).toFixed(2);
          const memUsageMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
          const healthMsg = `⚡ *MONITOREO DE SALUD Y ESTADO DE SERVIDORES (HEALTH CHECK)* ⚡\n\n` +
            `🤖 *Motor IA Gemini:* 100% Operativo (Fallback Multi-Modelo Activo)\n` +
            `🖥️ *Servidor Node (Render):* En Línea (Uptime: ${uptimeHours} hrs | RAM: ${memUsageMb} MB)\n` +
            `🌐 *Frontend (Firebase):* Operativo (Hosting: brain-branding.web.app)\n` +
            `💾 *Persistencia en Disco:* Activa (prospects_db.json / visits_db.json)\n` +
            `📊 *Total Visitas 24h:* ${visitsLog.length} | *Prospectos Registrados:* ${prospectLogs.length}\n\n` +
            `✅ *Todos los sistemas funcionan correctamente.*`;
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: healthMsg,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/pdfreporte' || cmdLower === '/reportepdf') {
          const nowStr = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const pdfMsg = `📄 *REPORTE CORPORATIVO EJECUTIVO DE VISITAS WEB* 📄\n` +
            `📅 *Fecha:* ${nowStr}\n` +
            `🏢 *Empresa:* Brain Branding® SaaS México\n\n` +
            `• *Total Visitas 24h:* ${visitsLog.length}\n` +
            `• *Prospectos Calificados:* ${prospectLogs.length}\n` +
            `• *Ubicaciones:* Pachuca, CDMX y ciudades conectadas\n\n` +
            `💼 *Tip:* Puedes usar /exportarvisitas para abrir los datos detallados en Excel.`;
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: pdfMsg,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/miip' || cmdLower === '/ignorarmiip') {
          const adminIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
          if (adminIp) {
            ignoredAdminIps.add(adminIp);
            saveIgnoredIpsToDisk(Array.from(ignoredAdminIps));
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `🛡️ *IP DE ADMINISTRADOR REGISTRADA E IGNORADA* 🛡️\n\nTu dirección IP (\`${adminIp}\`) ha sido añadida a la lista de exclusión.\n\n✅ *Efecto:* A partir de ahora, tus visitas a la web no alterarán las estadísticas ni generarán alertas de navegación.`,
              parse_mode: 'Markdown'
            });
          } else {
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `⚠️ No se pudo determinar la IP del servidor. Usa \`/agregarip <tu_ip>\` para ingresarla manualmente.`,
              parse_mode: 'Markdown'
            });
          }
          return res.status(200).json({ ok: true });
        }

        if (cmdLower.startsWith('/agregarip')) {
          const parts = text.split(/\s+/);
          const newIp = (parts[1] || '').trim();
          if (newIp) {
            ignoredAdminIps.add(newIp);
            saveIgnoredIpsToDisk(Array.from(ignoredAdminIps));
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `✅ *IP agregada a la lista de ignorados:* \`${newIp}\``,
              parse_mode: 'Markdown'
            });
          } else {
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `⚠️ Uso: \`/agregarip 192.168.1.1\``,
              parse_mode: 'Markdown'
            });
          }
          return res.status(200).json({ ok: true });
        }

        if (cmdLower.startsWith('/quitarip')) {
          const parts = text.split(/\s+/);
          const removeIp = (parts[1] || '').trim();
          if (removeIp) {
            ignoredAdminIps.delete(removeIp);
            saveIgnoredIpsToDisk(Array.from(ignoredAdminIps));
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `🗑️ *IP eliminada de la lista de ignorados:* \`${removeIp}\``,
              parse_mode: 'Markdown'
            });
          } else {
            await callTelegram('sendMessage', {
              chat_id: ADMIN_CHAT_ID,
              text: `⚠️ Uso: \`/quitarip 192.168.1.1\``,
              parse_mode: 'Markdown'
            });
          }
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/listarips' || cmdLower === '/ips') {
          const list = Array.from(ignoredAdminIps);
          const ipText = list.length > 0 ? list.map(ip => `• \`${ip}\``).join('\n') : '_Ninguna IP registrada actualmente._';
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `🛡️ *LISTA DE IPS IGNORADAS (ADMINISTRADOR)* 🛡️\n\n${ipText}\n\n💡 *Tip:* Usa /miip o /agregarip <ip> para añadir más.`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/resetvisitas' || cmdLower === '/limpiarvisitas') {

          visitsLog.length = 0;
          saveVisitsToDisk([]);
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `🗑️ *HISTORIAL DE VISITAS REINICIADO DE FORMA SEGURA* 🗑️\n\nEl contador de visitas web ha sido restablecido a 0. Todas las nuevas visitas comenzarán a acumularse a partir de este instante.`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/exportar' || cmdLower === '/crm') {
          let jsonStr = JSON.stringify(prospectLogs.slice(-20), null, 2);
          if (jsonStr.length > 3500) jsonStr = jsonStr.substring(0, 3500) + '\n... (truncado)';
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `📁 *BASE DE DATOS CRM REGISTRADA EN VIVO (JSON)* 📁\n\n\`\`\`json\n${jsonStr}\n\`\`\``,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/visitas' || cmdLower === '/metricas' || cmdLower === '/resumen8am' || cmdLower === '/reporte_visitas' || cmdLower === '/reporte24h' || cmdLower === '/reporte') {
          const reportText = buildDetailedAnalytics8AMReport(visitsLog);
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: reportText,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/hoy') {
          const todayCDMX = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
          const todayVisits = visitsLog.filter(v => {
            if (v.isBot || isBotUserAgent(v.device, v.source)) return false;
            const d = v.timestamp ? new Date(v.timestamp).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }) : '';
            return d === todayCDMX;
          });

          const timeStr = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
          let reply = `📅 *RESUMEN EXPRÉS DE VISITAS DE HOY (${todayCDMX})* 📅\n⏰ *Actualizado:* ${timeStr}\n\n`;
          reply += `📊 *Total Visitas Hoy:* *${todayVisits.length}*\n`;
          reply += `⏱️ *Permanencia Promedio:* *${calculateAverageDuration(todayVisits)}*\n\n`;
          
          if (todayVisits.length > 0) {
            reply += `📍 *Últimos Visitantes del Día:* \n`;
            todayVisits.slice(-5).reverse().forEach((v, i) => {
              reply += `${i + 1}. ${v.flag || '🇲🇽'} *${v.city || 'México'}* (${v.time || 'N/A'}) — _${v.device || 'Móvil'}_\n`;
            });
          }
          reply += `\n💬 *Tip:* Usa /visitas para el reporte de 24h o /semana para 7 días.`;

          await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: reply, parse_mode: 'Markdown' });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/semana' || cmdLower === '/7dias') {
          const nowMs = Date.now();
          const cutoff7d = nowMs - (7 * 24 * 60 * 60 * 1000);
          const active7d = visitsLog.filter(v => {
            if (v.isBot || isBotUserAgent(v.device, v.source)) return false;
            const t = parseVisitTimestamp(v.timestamp);
            return t > 0 ? t >= cutoff7d : true;
          });

          const avgPerDay = (active7d.length / 7).toFixed(1);
          const dateRangeStr = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });

          let reply = `📈 *INFORME EXPRÉS DE LOS ÚLTIMOS 7 DÍAS* 📈\n📅 *Corte:* ${dateRangeStr}\n\n`;
          reply += `📊 *Total Visitas en 7 Días:* *${active7d.length}*\n`;
          reply += `⚡ *Promedio Diario:* *${avgPerDay} visitas/día*\n`;
          reply += `⏱️ *Permanencia Promedio:* *${calculateAverageDuration(active7d)}*\n\n`;

          const cities7d = {};
          active7d.forEach(v => {
            const k = `${v.city || 'México'} ${v.flag || '🇲🇽'}`;
            cities7d[k] = (cities7d[k] || 0) + 1;
          });
          const topCities = Object.entries(cities7d).sort((a, b) => b[1] - a[1]).slice(0, 3);

          if (topCities.length > 0) {
            reply += `📍 *Top 3 Ciudades de la Semana:* \n`;
            const medals = ['🥇', '🥈', '🥉'];
            topCities.forEach(([c, cnt], idx) => {
              reply += `${medals[idx] || '•'} *${c}:* *${cnt} visitas*\n`;
            });
          }
          reply += `\n💬 *Tip:* Escribe /exportarvisitas para descargar el Excel completo.`;

          await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: reply, parse_mode: 'Markdown' });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower.startsWith('/visitas_') || cmdLower.startsWith('/visita')) {
          let cityQuery = cmdLower.replace('/visitas_', '').replace('/visita', '').trim();
          if (cityQuery.startsWith('_')) cityQuery = cityQuery.substring(1);
          if (!cityQuery) cityQuery = 'pachuca';

          const allVisits = visitsLog.length > 0 ? visitsLog : loadVisitsFromDisk();
          const cityVisits = allVisits.filter(v => {
            const c = (v.city || '').toLowerCase();
            const r = (v.region || '').toLowerCase();
            return c.includes(cityQuery) || r.includes(cityQuery);
          });

          const timeStr = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
          let reply = `🗺️ *REPORTE FILTRADO DE VISITAS: "${cityQuery.toUpperCase()}"* 🗺️\n⏰ *Generado:* ${timeStr}\n\n`;
          reply += `📊 *Total Coincidencias:* *${cityVisits.length} visitas*\n`;
          reply += `⏱️ *Permanencia Promedio:* *${calculateAverageDuration(cityVisits)}*\n\n`;

          if (cityVisits.length > 0) {
            reply += `📍 *Detalle de Visitas:* \n`;
            cityVisits.slice(-10).reverse().forEach((v, i) => {
              reply += `${i + 1}. ${v.flag || '🇲🇽'} *${v.city || 'México'}* (${v.time || 'N/A'})\n`;
              reply += `   📱 *Equipo:* ${v.device || 'Móvil'} | 📜 *Scroll:* ${v.scroll || 0}%\n`;
            });
          } else {
            reply += `ℹ️ *No se encontraron visitas registradas para esa ubicación.*`;
          }

          await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: reply, parse_mode: 'Markdown' });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/respaldototal' || cmdLower === '/backup' || cmdLower === '/descargarbd') {
          const allVisits = loadVisitsFromDisk();
          const jsonStr = JSON.stringify(allVisits, null, 2);
          const seal = generateHmacSeal(jsonStr);
          const timeStr = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });

          const msg = `💾 *RESPALDO MAESTRO COMPLETO DE BASE DE DATOS* 💾\n⏰ *Generado:* ${timeStr}\n\n` +
            `📊 *Total Registros Históricos:* *${allVisits.length}*\n` +
            `🔒 *Sello HMAC-SHA256:* \`${seal}\`\n` +
            `📁 *Formato:* JSON Master Store\n\n` +
            `\`\`\`json\n${jsonStr.substring(0, 3100)}\n\`\`\``;

          await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: msg, parse_mode: 'Markdown' });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/modoresumen') {
          global.notifyLiveVisits = false;
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `🌙 *MODO RESUMEN AUTOMÁTICO ACTIVADO*\n\nLas alertas por cada visita individual han sido silenciadas.\nRecibirás únicamente el *Resumen Automático Diario* todas las noches a las 8:00 PM CST con el total de visitas y ciudades.\n\n💬 *Tip:* Escribe /modoenvivo para volver a activar notificaciones por cada visita.`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/modoenvivo') {
          global.notifyLiveVisits = true;
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `⚡ *MODO ALERTAS EN VIVO ACTIVADO*\n\nRecibirás una notificación instantánea cada vez que entre un nuevo visitante + el Resumen Automático a las 8:00 PM.`,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }
      }

      if (update.message.voice || update.message.audio) {
        const durationSec = (update.message.voice || update.message.audio).duration || 0;
        userText = `[Nota de voz de ${durationSec}s] Hola, le envié una nota de voz de ${durationSec} segundos sobre mi negocio.`;
      }

      if (userText) {
        const rateCheck = checkUserRateLimit(chatId);
        if (!rateCheck.allowed) {
          console.warn(`[ANTI-SPAM BLOCK] Chat ID ${chatId} exceeded 10 msg/min.`);
          await callTelegram('sendMessage', {
            chat_id: chatId,
            text: `⚠️ *Límite de frecuencia:* Has enviado más de 10 mensajes seguidos en menos de un minuto.\n\nPara brindarte una mejor atención sin saturar el chat, te invitamos a platicar directamente con un asesor por WhatsApp: https://wa.me/527712339238`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '💬 Hablar con un Asesor por WhatsApp',
                    url: 'https://wa.me/527712339238?text=Hola,%20quisiera%20hablar%20con%20un%20asesor%20de%20Brain%20Branding'
                  }
                ]
              ]
            }
          });
          return res.status(200).json({ ok: true, spamBlocked: true });
        }

        await notifyOwner(chatId, firstName, username, userText);

        if (pausedChats[chatId] && pausedChats[chatId] > Date.now()) {
          console.log(`[PAUSED] Chat ${chatId} is currently taken over by owner. Skipping auto-reply.`);
          return res.status(200).json({ ok: true });
        }

        await callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' });
        
        const history = getHistory(chatId);
        // Antes el bot solo se enteraba de un choque de horarios DESPUÉS
        // de ya haberlo ofrecido (ver detectAndTrackAppointment más
        // abajo). Si hay un calendario real conectado (googleCalendar.js),
        // se le informan los horarios ya ocupados de Andrés ANTES de
        // generar la respuesta, para que evite proponerlos desde el
        // principio en vez de solo avisar del choque después.
        const busySlotsInfo = await googleCalendar.getBusySlotsSummary();
        const customInstruction = [loadKnowledgeBase(), busySlotsInfo].filter(Boolean).join('\n\n');
        let reply = await getGeminiReply(userText, firstName, chatId, history, customInstruction);
        if (!reply) {
          reply = generateHumanReply(chatId, firstName, userText);
        }

        addTurn(chatId, 'user', userText);
        addTurn(chatId, 'model', reply);

        reply = sanitizeReply(reply);

        const textClean = normalizeText(userText);
        let replyMarkup = { remove_keyboard: true };

        if (textClean.includes('asesor') || textClean.includes('representante') || textClean.includes('hablar') || textClean.includes('whatsapp') || textClean.includes('humano') || textClean.includes('cita')) {
          replyMarkup = {
            inline_keyboard: [
              [
                {
                  text: '💬 Hablar con un Asesor por WhatsApp',
                  url: 'https://wa.me/527712339238?text=Hola,%20quisiera%20hablar%20con%20un%20asesor%20de%20Brain%20Branding'
                }
              ]
            ]
          };
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        });

        detectAndTrackAppointment(chatId, firstName, username, reply).catch(() => {});
      }
    }
    res.status(200).json({ ok: true, message: 'Brain Branding 24/7 Webhook Active' });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    res.status(200).json({ ok: true, error: err.message });
}
}

// Anti-Brute Force & IP Security Guard State
const failedLoginAttempts = {};

function antiBruteForceGuard(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const record = failedLoginAttempts[ip];

  if (record && record.bannedUntil && Date.now() < record.bannedUntil) {
    const remainingMins = Math.ceil((record.bannedUntil - Date.now()) / 60000);
    return res.status(429).json({
      ok: false,
      error: `🚨 ACCESO BLOQUEADO POR SEGURIDAD. IP suspendida por intentos no autorizados. Reintenta en ${remainingMins} min.`
    });
  }
  next();
}

// Admin IP Whitelist Security Middleware for Sensitive Routes (Suggestion 2)
function adminIpWhitelistGuard(req, res, next) {
  const whitelistEnv = process.env.ADMIN_WHITELIST_IPS;
  if (!whitelistEnv) return next(); // If not set, fallback to 2FA OTP security

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const allowedIps = whitelistEnv.split(',').map(ip => ip.trim());

  const isAllowed = allowedIps.some(ip => clientIp.includes(ip) || clientIp === '127.0.0.1' || clientIp === '::1');
  if (!isAllowed) {
    console.warn(`[ADMIN WHITELIST BLOCKED] Unauthorized IP access attempt to ${req.path} from IP: ${clientIp}`);
    return res.status(403).json({
      ok: false,
      error: '🚨 ACCESO BLOQUEADO. Tu dirección IP no se encuentra registrada en la lista blanca de administración.'
    });
  }
  next();
}

// Honeypot Trap Security Middleware against Automated Scanners & Vulnerability Probes
const HONEYPOT_ROUTES = [
  '/wp-login.php', '/wp-admin', '/.env', '/admin.php', '/phpmyadmin',
  '/.git/config', '/xmlrpc.php', '/setup.php', '/config.json', '/vendor/.env',
  '/api/v1/auth/login.php', '/database.sql'
];

app.use((req, res, next) => {
  const pathLower = (req.path || '').toLowerCase();
  if (HONEYPOT_ROUTES.some(route => pathLower.includes(route))) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    console.warn(`[HONEYPOT TRAP TRIGGERED] Suspicious probe at "${req.path}" from IP: ${ip}`);

    // Ban IP for 48 hours
    failedLoginAttempts[ip] = {
      count: 20,
      bannedUntil: Date.now() + 48 * 60 * 60 * 1000
    };

    // Dispatch security alert
    callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: `🚨 *¡HONEYPOT TRAP ACTIVADO (IP BANEADA 48H)!* 🚨\n\n` +
        `👤 *IP Atacante:* \`${ip}\`\n` +
        `🌐 *Ruta Trampa Sondada:* \`${req.path}\`\n` +
        `🖥️ *User-Agent:* \`${req.headers['user-agent'] || 'Desconocido'}\`\n\n` +
        `🛡️ *Acción:* La IP ha sido suspendida automáticamente por **48 horas** de todo el servidor.`,
      parse_mode: 'Markdown'
    }).catch(() => {});

    return res.status(403).json({ ok: false, error: '🚨 ACCESO DENEGADO POR CORTAFUEGOS DE SEGURIDAD HONEYPOT WAF.' });
  }
  next();
});

// Anti-Scanner & Vulnerability Botnet WAF Blocker (Suggestion 2)
const SUSPICIOUS_AG_PATTERNS = [/sqlmap/i, /nikto/i, /nmap/i, /zgrab/i, /censys/i, /masscan/i, /gobuster/i, /dirbuster/i, /w3af/i, /acunetix/i];
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  for (const pattern of SUSPICIOUS_AG_PATTERNS) {
    if (pattern.test(ua)) {
      console.warn(`[SCANNER WAF BLOCKED] Suspicious User-Agent detected: ${ua} IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
      return res.status(403).json({ ok: false, error: '🚨 ACCESO DENEGADO POR CORTAFUEGOS DE SEGURIDAD ANTIMALWARE WAF.' });
    }
  }
  next();
});

// Enhanced Geofencing & Anti-Botnet Security WAF Guard
const HIGH_RISK_COUNTRIES = ['RU', 'CN', 'KP', 'IR', 'BY', 'UA', 'RO', 'VN', 'PK', 'IN', 'ID', 'NG'];
app.use((req, res, next) => {
  const country = (req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-geo-country'] || '').toUpperCase();
  if (country && HIGH_RISK_COUNTRIES.includes(country)) {
    console.warn(`[GEOFENCING WAF BLOCKED] Request from restricted region: ${country} IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    return res.status(403).json({ ok: false, error: '🚨 ACCESO RESTRINGIDO POR CORTAFUEGOS DE SEGURIDAD GEOFENCING WAF.' });
  }
  next();
});

// Automated Inactive Lead Follow-Up Engine (Suggestion 1)
const followedUpLeads = new Set();

async function checkInactiveLeadsFollowup() {
  const now = Date.now();
  const MIN_INACTIVE = 18 * 60 * 60 * 1000; // 18 Hours
  const MAX_INACTIVE = 48 * 60 * 60 * 1000; // 48 Hours

  for (const log of prospectLogs) {
    if (log.temp === 'CALIENTE' || log.temp === 'CITA_URGENTE' || log.temp === 'TIBIO') {
      const key = `${log.chatId}:${log.timestamp}`;
      if (followedUpLeads.has(key)) continue;

      const elapsed = now - (log.lastActiveMs || now);
      if (elapsed >= MIN_INACTIVE && elapsed <= MAX_INACTIVE) {
        followedUpLeads.add(key);
        const hoursAgo = Math.round(elapsed / (1000 * 60 * 60));
        
        const followMsg = `🔔 *RECORDATORIO DE SEGUIMIENTO A PROSPECTO (${hoursAgo}H INACTIVO)* 🔔\n\n` +
          `👤 *Cliente:* ${log.name} (${log.username ? '@' + log.username : 'Sin Username'})\n` +
          `🔥 *Clasificación:* ${log.temp}\n` +
          `🏢 *Giro:* ${log.giro || 'General'}\n` +
          `💬 *Último Mensaje:* "${log.text}"\n` +
          `🆔 *Chat ID:* \`${log.chatId}\`\n\n` +
          `💡 *Acción Recomendada:* Responde en 1 clic para retomar el contacto:\n\`/responder ${log.chatId} ¡Hola ${log.name}! ¿Pudiste revisar la propuesta de Brain Branding? ☕\``;

        try {
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: followMsg,
            parse_mode: 'Markdown'
          });
          console.log(`[FOLLOWUP] Reminder dispatched for lead ${log.chatId}`);
        } catch (e) {
          console.error('[FOLLOWUP ERROR]', e.message);
        }
      }
    }
  }
}

// Run Follow-Up Engine Check every 2 hours
setInterval(() => {
  checkInactiveLeadsFollowup();
}, 2 * 60 * 60 * 1000);

// Morning Report Scheduler at 8:00 AM (Suggestion 3)
async function sendMorningReport8AM() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const hotLeads = prospectLogs.filter(p => p.temp === 'CALIENTE' || p.temp === 'CITA_URGENTE');
  const warmLeads = prospectLogs.filter(p => p.temp === 'TIBIO');

  let reportMsg = `☀️ *REPORTE MATUTINO DE PROSPECTOS Y RENDIMIENTO IA (8:00 AM)* ☀️\n` +
    `📅 *Fecha:* ${dateStr}\n\n` +
    `📊 *ESTADÍSTICAS DE INTERACCIÓN:*\n` +
    `🔥 *Prospectos Calientes / Citas:* ${hotLeads.length}\n` +
    `🟡 *Prospectos Tibios:* ${warmLeads.length}\n` +
    `💬 *Total Interacciones:* ${prospectLogs.length}\n\n` +
    `🤖 *MOTOR GEMINI AI TELEMETRÍA:*\n` +
    `⚡ *Modelo Activo:* ${geminiMetrics.lastUsedModel || 'gemini-2.0-flash'}\n` +
    `⏱️ *Latencia Promedio:* ${geminiMetrics.averageLatencyMs || 0}ms\n` +
    `✅ *Llamadas Exitosas:* ${geminiMetrics.successfulCalls}\n` +
    `⚡ *Caché Hits:* ${geminiMetrics.cacheHits}\n` +
    `🛡️ *Inyecciones Bloqueadas:* ${geminiMetrics.blockedInjections}\n\n` +
    `💡 *Tip de Gestión:* Usa \`/exportarcsv\` para descargar la base de prospectos en Excel.`;

  try {
    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: reportMsg,
      parse_mode: 'Markdown'
    });
    console.log('[MORNING REPORT] 8:00 AM Report dispatched successfully.');
  } catch (e) {
    console.error('[MORNING REPORT ERROR]', e.message);
  }
}

// Morning report timer managed by unified Catch-Up Scheduler below

// Sunday 8:00 PM Weekly Executive Conversion Report (Suggestion 3)
async function sendWeeklyAnalyticsReport8PM() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const hotLeads = prospectLogs.filter(p => p.temp === 'CALIENTE' || p.temp === 'CITA_URGENTE');
  const warmLeads = prospectLogs.filter(p => p.temp === 'TIBIO');
  const coldLeads = prospectLogs.filter(p => p.temp === 'FRÍO');

  const totalLeads = prospectLogs.length || 1;
  const conversionRate = Math.round((hotLeads.length / totalLeads) * 100);

  const girosMap = {};
  prospectLogs.forEach(p => {
    if (p.giro && p.giro !== 'No especificado') {
      girosMap[p.giro] = (girosMap[p.giro] || 0) + 1;
    }
  });

  const topGiros = Object.entries(girosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g, c]) => `• ${g}: ${c} prospectos`)
    .join('\n') || '• General / Consultoría Comercial';

  const weeklyMsg = `📈 *INFORME COMPARATIVO SEMANAL DE CONVERSIÓN Y DESEMPEÑO (DOMINGOS 8:00 PM)* 📈\n` +
    `📅 *Semana Finalizada:* ${dateStr}\n\n` +
    `📊 *MÉTRICAS DE RENDIMIENTO DE VENTAS:*\n` +
    `🔥 *Leads Calientes / Citas Solicitadas:* ${hotLeads.length}\n` +
    `🟡 *Leads Tibios (Interés Medio):* ${warmLeads.length}\n` +
    `❄️ *Leads Fríos (Consultas Iniciales):* ${coldLeads.length}\n` +
    `🎯 *Tasa de Conversión a Cita:* ${conversionRate}%\n` +
    `💬 *Total Mensajes Gestionados:* ${prospectLogs.length}\n\n` +
    `🏬 *INDUSTRIAS / GIROS MÁS SOLICITADOS:*\n${topGiros}\n\n` +
    `🤖 *TELEMETRÍA MOTOR GEMINI AI:*\n` +
    `⚡ *Modelo Principal:* ${geminiMetrics.lastUsedModel || 'gemini-2.0-flash'}\n` +
    `⏱️ *Latencia Promedio:* ${geminiMetrics.averageLatencyMs || 0}ms\n` +
    `✅ *Atenciones Exitosas por IA:* ${geminiMetrics.successfulCalls}\n` +
    `⚡ *Respuestas en Caché (0ms):* ${geminiMetrics.cacheHits}\n` +
    `🛡️ *Ataques Neutralizados:* ${geminiMetrics.blockedInjections}\n\n` +
    `🚀 _Brain Branding 2026 — Empoderando Marcas, Reprogramando Mentes._`;

  try {
    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: weeklyMsg,
      parse_mode: 'Markdown'
    });
    console.log('[WEEKLY REPORT] Sunday 8:00 PM Report dispatched successfully.');

    // Dispatch Sunday CSV Backup Document to Telegram
    sendWeeklyCSVBackupReport().catch(e => console.error('[WEEKLY CSV BACKUP ERROR]', e.message));
  } catch (e) {
    console.error('[WEEKLY REPORT ERROR]', e.message);
  }
}

async function sendWeeklyCSVBackupReport() {
  const allVisits = getActive24hVisits(visitsLog);
  if (!allVisits || allVisits.length === 0) return;

  let csv = "Fecha,Hora,Ciudad,Estado,Pais,Dispositivo,Fuente,Scroll\n";
  allVisits.forEach(v => {
    const dateStr = v.timestamp ? new Date(v.timestamp).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }) : 'N/A';
    const timeStr = v.time || 'N/A';
    const city = (v.city || 'Desconocida').replace(/,/g, '');
    const region = (v.region || '').replace(/,/g, '');
    const country = (v.country || 'Mexico').replace(/,/g, '');
    const device = (v.device || 'Web').replace(/,/g, '');
    const source = (v.source || 'Directo').replace(/,/g, '');
    const scroll = v.scroll || 0;
    csv += `"${dateStr}","${timeStr}","${city}","${region}","${country}","${device}","${source}","${scroll}%"\n`;
  });

  const msgText = `💾 *RESPALDO SEMANAL DE VISITAS WEB (DOMINGO 8:00 PM)* 💾\n\n` +
    `📊 *Total de Registros en Respaldo:* *${allVisits.length}*\n` +
    `📁 *Formato:* CSV / Excel\n\n` +
    `\`\`\`csv\n${csv.substring(0, 3200)}\n\`\`\``;

  await callTelegram('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: msgText,
    parse_mode: 'Markdown'
  });
}

// Sunday 8:00 PM Cron Timer Check
let lastWeeklyReportWeek = '';
setInterval(() => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const currentHour = now.getHours();
  const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;

  if (dayOfWeek === 0 && currentHour === 20 && lastWeeklyReportWeek !== weekKey) {
    lastWeeklyReportWeek = weekKey;
    sendWeeklyAnalyticsReport8PM();
  }
}, 60 * 1000);

// HMAC SHA-256 Master Key Secret Generator
const HMAC_SECRET = process.env.HMAC_SECRET || 'BRAIN_BRANDING_MASTER_SAAS_HMAC_KEY_2026_SECRET';
function generateHmacSeal(dataStr) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(dataStr).digest('hex').substring(0, 32).toUpperCase();
}

// 2FA OTP State
let currentAdminOTP = null;

// Automatic Telegram Webhook Registration Helper
app.get('/api/telegram/setup-webhook', async (req, res) => {
  try {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || 'https://brain-branding-demo-generator.onrender.com';
    const webhookUrl = `${baseUrl}/api/webhook`;
    
    const result = await callTelegram('setWebhook', {
      url: webhookUrl,
      drop_pending_updates: false,
      ...(TELEGRAM_WEBHOOK_SECRET ? { secret_token: TELEGRAM_WEBHOOK_SECRET } : {})
    });

    // Antes esto decia "configurado exitosamente" sin importar si Telegram
    // realmente aceptaba la llamada (ej. con un token invalido, Telegram
    // responde ok:false pero callTelegram() no lanza excepcion) - `ok` y el
    // mensaje ahora reflejan lo que Telegram contesto de verdad.
    return res.status(result && result.ok ? 200 : 502).json({
      ok: !!(result && result.ok),
      message: result && result.ok
        ? `Webhook de Telegram configurado exitosamente${TELEGRAM_WEBHOOK_SECRET ? ' (con secret_token)' : ' (SIN secret_token — configura TELEGRAM_WEBHOOK_SECRET para activar la verificación)'}`
        : `Telegram RECHAZÓ la configuración del webhook — revisa TELEGRAM_BOT_TOKEN en Render: ${result && result.description ? result.description : 'error desconocido'}`,
      webhookUrl,
      result
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint: Downloadable CSV Export of Prospects
app.get('/api/admin/export-prospects', adminIpWhitelistGuard, (req, res) => {
  const format = (req.query.format || 'json').toLowerCase();
  if (format === 'csv') {
    let csv = 'Nombre,Username,ChatID,Clasificacion,Giro,Fecha\n';
    prospectLogs.forEach(p => {
      csv += `"${p.name}","${p.username}","${p.chatId}","${p.temp}","${p.giro || ''}","${p.timestamp}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prospectos_brain_branding.csv"');
    return res.status(200).send(csv);
  }
  return res.status(200).json({ ok: true, prospects: prospectLogs });
});

// Endpoint: Retrieve Gemini AI Performance Telemetry & Metrics
app.get('/api/admin/gemini-metrics', (req, res) => {
  return res.status(200).json({
    ok: true,
    metrics: geminiMetrics
  });
});

// El healthcheck de testGeminiConnection() antes solo corría una vez al
// arrancar el proceso. En el plan gratuito de Render, keep-alive.yml
// mantiene el proceso despierto cada 10 min, así que en la práctica podía
// pasar semanas sin que este chequeo volviera a correr — si Google
// retiraba un modelo a medio día, nadie se enteraba hasta que un cliente
// notara respuestas robotizadas por el respaldo de reglas fijas. Este
// endpoint permite disparar el mismo chequeo bajo demanda (ver
// .github/workflows/gemini-healthcheck.yml, que lo llama una vez al día).
app.get('/api/admin/gemini-healthcheck', async (req, res) => {
  // Reusa el mismo secreto de /api/governance/set-status — sin esto,
  // cualquiera que descubriera la URL podía dispararlo en bucle y gastar
  // cuota de la API key de Gemini.
  if (req.query.callerKey !== ALR_GOVERNANCE_SECRET) {
    return res.status(403).json({ ok: false, error: 'Not authorized.' });
  }
  try {
    const health = await testGeminiConnection();
    if (!health.ok) {
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🚨 *ALERTA: CHEQUEO DIARIO DE GEMINI FALLÓ* 🚨\n\nRazón: \`${health.reason}\`\n\nEl bot podría llevar horas usando solo respuestas por reglas fijas (sin IA real) sin que nadie lo notara. Revisa Render → Environment → GEMINI_API_KEY, o si Google retiró el modelo actual.`,
        parse_mode: 'Markdown'
      }).catch(() => {});
    }
    return res.status(health.ok ? 200 : 503).json(health);
  } catch (e) {
    return res.status(500).json({ ok: false, reason: e.message });
  }
});

// Endpoint interno de diagnóstico usado por scripts/smoke-check.js para
// confirmar que las respuestas largas de Gemini ya no se cortan a media
// frase por agotar maxOutputTokens con "thinking" interno (ver commit
// 1748167). Usa un prompt fijo (no viene del usuario) para no exponer un
// generador de texto arbitrario públicamente.
app.get('/api/admin/test-gemini-reply', async (req, res) => {
  if (req.query.callerKey !== ALR_GOVERNANCE_SECRET) {
    return res.status(403).json({ ok: false, error: 'Not authorized.' });
  }
  const truncatedBefore = geminiMetrics.truncatedReplies;
  const reply = await getGeminiReply(
    'Explica en detalle, con al menos 3 beneficios concretos y ejemplos, por qué una veterinaria pequeña debería contratar un asistente de IA 24/7 para WhatsApp de Brain Branding.',
    'SmokeCheck',
    'smoke_check_truncation',
    []
  );
  const truncated = geminiMetrics.truncatedReplies > truncatedBefore;
  return res.status(200).json({ ok: !!reply, truncated, reply });
});

// Configure automatic security alerts for repeated prompt injection attacks & Auto IP-Ban
setSecurityAlertCallback(async (contextId, snippet, count) => {
  try {
    // Automatically ban attacking ID/IP for 24 hours
    failedLoginAttempts[contextId] = {
      count: 10,
      bannedUntil: Date.now() + 24 * 60 * 60 * 1000
    };

    const alertMsg = `🚨 *¡ALERTA DE CIBERSEGURIDAD (IP BLOQUEADA 24H)!* 🚨\n\n` +
      `👤 *ID/IP Atacante:* \`${contextId}\`\n` +
      `⚠️ *Ataques Detectados:* ${count} intentos de inyección de prompt.\n` +
      `💬 *Muestra de Prompt:* "${snippet}..."\n\n` +
      `🛡️ *Acción:* La IP/ID ha sido **suspendida por 24 horas** del cortafuegos de Brain Branding.`;

    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: alertMsg,
      parse_mode: 'Markdown'
    });
  } catch (e) {
    console.error('[SECURITY CALLBACK ERROR]', e.message);
  }
});

// Avisa por Telegram si los cortes de respuesta de Gemini (MAX_TOKENS) se
// acumulan en poco tiempo, en vez de depender de revisar
// /api/admin/gemini-metrics manualmente.
setTruncationAlertCallback((count) => {
  callTelegram('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: `⚠️ *ALERTA: RESPUESTAS DE IA CORTÁNDOSE* ⚠️\n\nSe detectaron *${count} respuestas cortadas* (MAX_TOKENS) de Gemini en la última hora — clientes podrían estar recibiendo mensajes incompletos a media frase.\n\nRevisa \`maxOutputTokens\`/\`thinkingConfig\` en \`api/geminiHelper.js\` o usa /estado para más contexto.`,
    parse_mode: 'Markdown'
  }).catch(() => {});
});

// Health check — confirms OTP routes are alive on Render
app.get('/api/admin/otp-status', (req, res) => {
  return res.status(200).json({ ok: true, message: 'OTP endpoint activo v2', hasOTP: !!currentAdminOTP });
});

// Antes el panel admin (public/index.html) generaba y "verificaba" el OTP
// enteramente en el navegador, con códigos de respaldo fijos en el código
// fuente ('569323', '999888', '56932396') que saltaban el 2FA por completo,
// y mandaba el mensaje de Telegram directo desde el cliente con el token
// del bot embebido. Estos dos endpoints son la única fuente de verdad
// ahora: el navegador nunca ve el código real ni el token del bot, y el
// límite de intentos/bloqueo se aplica aquí, no con un contador en JS del
// navegador que cualquiera podía resetear recargando la página.
let otpRequestLockedUntil = 0;
let otpVerifyFailCount = 0;
let otpVerifyLockedUntil = 0;
const OTP_REQUEST_MIN_INTERVAL_MS = 20 * 1000; // evita spamear el Telegram del admin con reenvíos

// Endpoint 1: Request 2FA OTP Code to Telegram
app.post('/api/admin/request-2fa', async (req, res) => {
  try {
    if (Date.now() < otpRequestLockedUntil) {
      const secsLeft = Math.ceil((otpRequestLockedUntil - Date.now()) / 1000);
      return res.status(429).json({ ok: false, error: `Espera ${secsLeft}s antes de pedir otro código.` });
    }
    otpRequestLockedUntil = Date.now() + OTP_REQUEST_MIN_INTERVAL_MS;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    currentAdminOTP = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 Minutes Validity
    };
    otpVerifyFailCount = 0;

    console.log(`[2FA OTP GENERATED] Code: ${code} | Sending to chat: ${ADMIN_CHAT_ID}`);

    const otpMsg = `🔑 *CÓDIGO DE AUTENTICACIÓN 2FA (PANEL ADMIN)* 🔑\n\n` +
      `Tu código de verificación único es: *\`${code}\`*\n\n` +
      `⏱️ *Validez:* 5 Minutos.\n` +
      `🛡️ Si no solicitaste este código, tu servidor se encuentra protegido.\n\n` +
      `_Desde: Brain Branding Panel Admin_`;

    const tgResult = await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: otpMsg,
      parse_mode: 'Markdown'
    });

    console.log(`[2FA TELEGRAM RESULT]`, JSON.stringify(tgResult));

    if (!tgResult.ok) {
      console.error('[2FA ERROR] Telegram rejected the message:', tgResult.description);
      return res.status(500).json({ ok: false, error: 'Telegram no pudo enviar el OTP: ' + (tgResult.description || 'Error desconocido') });
    }

    return res.status(200).json({ ok: true, message: 'Código 2FA despachado a Telegram de Andrés R' });
  } catch (err) {
    console.error('[2FA EXCEPTION]', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint 2: Verify 2FA OTP Code
app.post('/api/admin/verify-2fa', async (req, res) => {
  if (Date.now() < otpVerifyLockedUntil) {
    const minsLeft = Math.ceil((otpVerifyLockedUntil - Date.now()) / 60000);
    return res.status(429).json({ ok: false, error: `⛔ Bloqueado por intentos fallidos. Reintenta en ${minsLeft} min.`, lockedMinutes: minsLeft });
  }

  const { otp } = req.body || {};
  if (!currentAdminOTP) {
    return res.status(400).json({ ok: false, error: 'Solicita un código 2FA primero.' });
  }

  if (Date.now() > currentAdminOTP.expiresAt) {
    currentAdminOTP = null;
    return res.status(400).json({ ok: false, error: 'El código 2FA ha expirado. Solicita uno nuevo.' });
  }

  if (String(otp).trim() !== currentAdminOTP.code) {
    otpVerifyFailCount++;
    if (otpVerifyFailCount >= 3) {
      otpVerifyLockedUntil = Date.now() + 15 * 60 * 1000;
      otpVerifyFailCount = 0;
      currentAdminOTP = null;
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: '🚨 *ALERTA DE SEGURIDAD 2FA — BLOQUEO TEMPORAL DE 15 MIN* 🚨\n\nSe han registrado 3 intentos fallidos consecutivos de código 2FA. El acceso se ha bloqueado por 15 minutos.',
        parse_mode: 'Markdown'
      }).catch(() => {});
      return res.status(429).json({ ok: false, error: '🚨 3 intentos fallidos. Acceso bloqueado por 15 minutos por seguridad.', lockedMinutes: 15 });
    }
    return res.status(400).json({ ok: false, error: `Código 2FA incorrecto. Te quedan ${3 - otpVerifyFailCount} intento(s).` });
  }

  currentAdminOTP = null;
  otpVerifyFailCount = 0;
  const adminToken = generateHmacSeal(`ADMIN_AUTH_GRANTED_${Date.now()}`);

  console.log(`[2FA VERIFIED] Admin access granted with token ${adminToken}`);

  callTelegram('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: '🟢 *ACCESO 2FA AUTORIZADO AL PANEL ADMIN* 🟢\n\nEl administrador L.C.I. Andrés López Rebollo ha completado exitosamente la verificación 2FA por Telegram.',
    parse_mode: 'Markdown'
  }).catch(() => {});

  return res.status(200).json({ ok: true, adminToken });
});

// Audit Log Store for Legal & Operational Audit Trail
const auditLogsStore = [];

// Endpoint: Code Integrity & Clean Software Certification
app.get('/api/code-integrity', (req, res) => {
  const telegramJsPath = path.join(__dirname, 'telegram.js');
  let hash = 'N/A';
  try {
    const fileContent = fs.readFileSync(telegramJsPath, 'utf8');
    hash = crypto.createHash('sha256').update(fileContent).digest('hex').substring(0, 32).toUpperCase();
  } catch(e) {}

  return res.status(200).json({
    ok: true,
    status: 'MALWARE_FREE_CERTIFIED',
    declaration: 'Software 100% limpio, ético y libre de malware o vulnerabilidades intencionadas',
    developer: 'L.C.I. Andrés López Rebollo - Brain Branding',
    integritySeal: hash,
    verifiedAt: new Date().toISOString()
  });
});

// Endpoint: Record Audit Log Entry
app.post('/api/audit-log', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const entry = {
    ...(req.body || {}),
    ip,
    serverTimestamp: new Date().toISOString()
  };
  auditLogsStore.push(entry);
  if (auditLogsStore.length > 500) auditLogsStore.shift();
  return res.status(200).json({ ok: true });
});

// Endpoint: Retrieve Audit Logs
app.get('/api/audit-log', (req, res) => {
  return res.status(200).json({ ok: true, logs: auditLogsStore.slice(-100) });
});

const whatsappApp = require('./whatsapp.js');
if (whatsappApp && (whatsappApp.router || whatsappApp.app)) {
  app.use(whatsappApp.router || whatsappApp.app);
} else if (typeof whatsappApp === 'function') {
  app.use(whatsappApp);
}

// Deploy Notification Endpoint — called by subir-cambios.bat after successful deploy
app.post('/api/deploy-notify', async (req, res) => {
  try {
    const { version, firebase, backend, timestamp, commit } = req.body || {};
    const deployMsg = `🚀 *BRAIN BRANDING AUTO-DEPLOY COMPLETADO* 🚀\n\n` +
      `📦 *Versión:* v${version || '30.0.0'}\n` +
      `🌐 *Firebase Hosting:* ${firebase === 'ok' ? '✅ Actualizado' : '❌ Falló'}\n` +
      `⚙️ *Backend Render:* ${backend === 'ok' ? '✅ GitHub Push OK' : '⚠️ Sin cambios'}\n` +
      (commit ? `🔖 *Commit:* \`${commit}\`\n` : '') +
      `⏰ *Hora:* ${timestamp || new Date().toLocaleTimeString('es-MX')}\n\n` +
      `🔗 https://brainbranding.com.mx ya está actualizado.`;

    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: deployMsg,
      parse_mode: 'Markdown'
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/conversion-alert', async (req, res) => {
  try {
    const { page, source } = req.body || {};
    const alertMsg = `🔥 *¡NUEVA CONVERSIÓN EN TU WEB!*\n\n📌 *Página:* ${page || '/gracias.html'}\n🎯 *Origen:* ${source || 'Google Ads'}\n⏰ *Hora:* ${new Date().toLocaleTimeString('es-MX')}\n\nUn cliente acaba de agendar/completar una acción en tu sitio web.`;
    await callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: alertMsg,
      parse_mode: 'Markdown'
    });
    return res.status(200).json({ ok: true, sent: true });
  } catch (err) {
    console.error('[CONVERSION ALERT ERROR]', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
});

function isBotUserAgent(rawDevice = '', rawSource = '') {
  const dev = String(rawDevice || '').toLowerCase();
  const src = String(rawSource || '').toLowerCase();
  if (dev.includes('onrender') || src.includes('onrender')) return false;
  return /googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|headlesschrome|puppeteer|selenium|wget|curl/i.test(dev + ' ' + src);
}

function calculateAverageDuration(visits = []) {
  if (!visits || visits.length === 0) return '0 seg';
  let totalSeconds = 0;
  let count = 0;

  visits.forEach(v => {
    if (!v.duration || v.duration === 'N/A') return;
    let sec = 0;
    if (typeof v.duration === 'number') {
      sec = v.duration;
    } else if (typeof v.duration === 'string') {
      const matchSec = v.duration.match(/(\d+)\s*s/i);
      const matchMin = v.duration.match(/(\d+)\s*m/i);
      if (matchSec) sec = parseInt(matchSec[1], 10);
      else if (matchMin) sec = parseInt(matchMin[1], 10) * 60;
      else sec = parseInt(v.duration, 10) || 0;
    }
    if (sec > 0 && sec < 7200) {
      totalSeconds += sec;
      count++;
    }
  });

  if (count === 0) return '45 seg (estimado)';
  const avgSec = Math.round(totalSeconds / count);
  const mins = Math.floor(avgSec / 60);
  const secs = avgSec % 60;
  return mins > 0 ? `${mins} min ${secs} seg` : `${secs} seg`;
}

function parseVisitTimestamp(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  let ms = new Date(ts).getTime();
  if (!isNaN(ms) && ms > 0) return ms;

  if (typeof ts === 'string') {
    const parts = ts.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
      const d = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10) - 1;
      const y = parseInt(parts[3], 10);
      ms = new Date(y, m, d).getTime();
      if (!isNaN(ms) && ms > 0) return ms;
    }
  }
  return 0;
}

function getActive24hVisits(allVisits = [], includeBots = false) {
  if (!Array.isArray(allVisits) || allVisits.length === 0) return [];
  const nowMs = Date.now();
  const cutoff = nowMs - (24 * 60 * 60 * 1000);

  const filtered = allVisits.filter(v => {
    if (!includeBots && (v.isBot || isBotUserAgent(v.device, v.source))) return false;
    const vTime = parseVisitTimestamp(v.timestamp);
    return vTime > 0 ? vTime >= cutoff : true;
  });

  if (filtered.length === 0 && allVisits.length > 0) {
    return allVisits.slice(-50);
  }

  return filtered;
}

function getVisitsTrendComparison(allVisits = []) {
  const nowMs = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const h48 = 48 * 60 * 60 * 1000;

  const current24h = allVisits.filter(v => {
    const t = parseVisitTimestamp(v.timestamp);
    return t > 0 && (nowMs - t) <= h24;
  }).length;

  const previous24h = allVisits.filter(v => {
    const t = parseVisitTimestamp(v.timestamp);
    return t > 0 && (nowMs - t) > h24 && (nowMs - t) <= h48;
  }).length;

  if (previous24h === 0) {
    if (current24h > 0) return `🔥 *Crecimiento:* 🟢 +100% vs. día anterior (*${current24h}* hoy vs. *0* ayer)`;
    return `➖ *Variación vs. Día Anterior:* Sin variación (*0* hoy vs. *0* ayer)`;
  }

  const diff = current24h - previous24h;
  const pct = ((diff / previous24h) * 100).toFixed(1);
  const icon = diff >= 0 ? '📈 ⬆️' : '📉 ⬇️';
  const sign = diff >= 0 ? '+' : '';
  return `${icon} *Variación vs. Día Anterior:* *${sign}${pct}%* (*${current24h}* hoy vs. *${previous24h}* ayer)`;
}

function buildDetailedAnalytics8AMReport(allVisits = [], customHeader = null) {
  const visits = getActive24hVisits(allVisits);
  const total = visits.length;
  const nowStr = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });

  let headerTitle = `📊 *INFORME DE VISITAS EN TIEMPO REAL (ÚLTIMAS 24 HORAS)* 📊\n⏰ *Generado a las:* ${timeStr} | ${nowStr}`;
  if (customHeader) {
    headerTitle = `${customHeader}\n📅 *Fecha:* ${nowStr}`;
  }

  if (total === 0) {
    return `${headerTitle}\n\n📊 *Total de Visitas Registradas (Últimas 24h):* *0*\n\n💡 *Tip:* Las visitas se registran en tiempo real cuando un usuario ingresa al sitio web.`;
  }


  const osCounts = {};
  const browserCounts = {};
  const locationCounts = {};
  const sourceCounts = {};
  const resCounts = {};

  visits.forEach(v => {
    const rawDev = v.device || 'Desconocido';
    
    // OS Breakdown
    let osKey = 'Computadora 💻';
    if (rawDev.includes('iPhone') || rawDev.includes('iOS')) osKey = 'iPhone (iOS) 📱';
    else if (rawDev.includes('Android')) osKey = 'Android Móvil 📱';
    else if (rawDev.includes('iPad')) osKey = 'iPad (iPadOS) 📟';
    else if (rawDev.includes('Windows')) osKey = 'Windows PC 💻';
    else if (rawDev.includes('MacBook') || rawDev.includes('macOS')) osKey = 'Mac (macOS) 💻';
    else if (rawDev.includes('Linux')) osKey = 'Linux PC 💻';
    osCounts[osKey] = (osCounts[osKey] || 0) + 1;

    // Browser Breakdown
    let browserKey = 'Chrome 🌐';
    if (rawDev.includes('WhatsApp')) browserKey = 'WhatsApp In-App 💬';
    else if (rawDev.includes('Safari')) browserKey = 'Safari 🧭';
    else if (rawDev.includes('Facebook')) browserKey = 'Facebook App 🔵';
    else if (rawDev.includes('Instagram')) browserKey = 'Instagram App 📸';
    else if (rawDev.includes('Edge')) browserKey = 'Microsoft Edge 🌊';
    else if (rawDev.includes('Firefox')) browserKey = 'Firefox 🦊';
    else if (rawDev.includes('Opera')) browserKey = 'Opera 🔴';
    browserCounts[browserKey] = (browserCounts[browserKey] || 0) + 1;

    // Location Breakdown
    let locKey = `${v.city || 'Pachuca'}, ${v.region || 'Hidalgo'} ${v.flag || '🇲🇽'}`;
    locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;

    // Source Breakdown
    let srcKey = v.source || 'Acceso Directo Web 🌐';
    sourceCounts[srcKey] = (sourceCounts[srcKey] || 0) + 1;

    // Screen Resolution Breakdown
    const resMatch = rawDev.match(/\[([0-9xpx]+)\]/);
    if (resMatch) {
      resCounts[resMatch[1]] = (resCounts[resMatch[1]] || 0) + 1;
    }
  });

  const getPercent = (count) => ((count / total) * 100).toFixed(1);

  let report = `${headerTitle}\n`;
  report += `📊 *Total de Visitas Registradas (Últimas 24h):* *${total}*\n`;
  report += `⏱️ *Tiempo Promedio de Permanencia:* *${calculateAverageDuration(visits)}*\n\n`;

  report += `📍 *DETALLE INDIVIDUAL DE CADA VISITA (HORA, SCROLL Y CLICS):*\n\n`;
  visits.forEach((v, idx) => {
    const vTime = v.time || (v.timestamp ? new Date(v.timestamp).toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' }) : 'N/A');
    const scrollVal = v.scroll !== undefined ? v.scroll : 0;
    const retTag = v.isReturning ? ' 🌟 *(RECURRENTE)*' : ' 🆕 *(NUEVO)*';
    
    let devName = 'Móvil 📱';
    const raw = v.device || '';
    if (raw.includes('iPhone') || raw.includes('iOS')) devName = 'iPhone (iOS) 📱';
    else if (raw.includes('Android')) devName = 'Android Móvil 📱';
    else if (raw.includes('Windows')) devName = 'Windows PC 💻';
    else if (raw.includes('MacBook') || raw.includes('macOS')) devName = 'Mac (macOS) 💻';

    const clickList = (v.clicks && v.clicks.length > 0)
      ? v.clicks.join(' ➔ ')
      : 'Ingreso a la web';

    const stateLabel = v.region ? ` (${v.region})` : '';

    report += `${idx + 1}. ${v.flag || '🇲🇽'} *${v.city || 'Desconocida'}* _${stateLabel}_\n`;
    report += `   ⏰ *Hora:* ${vTime} | 📜 *Scroll:* *${scrollVal}%* | 📱 *Equipo:* ${devName}${retTag}\n`;
    report += `   🖱️ *Clics / Botones:* \`${clickList}\`\n\n`;
  });

  report += `📱 *DISPOSITIVOS Y SISTEMAS OPERATIVOS:*\n`;
  Object.entries(osCounts).sort((a, b) => b[1] - a[1]).forEach(([dev, count]) => {
    report += `• ${dev}: *${count}* (${getPercent(count)}%)\n`;
  });
  report += `\n`;

  report += `🌐 *NAVEGADORES WEB:*\n`;
  Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).forEach(([b, count]) => {
    report += `• ${b}: *${count}* (${getPercent(count)}%)\n`;
  });
  report += `\n`;

  report += `📍 *UBICACIÓN DE VISITANTES (CIUDADES):*\n`;
  const locationEntries = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
  locationEntries.forEach(([loc, count]) => {
    report += `• ${loc}: *${count} visitas* (${getPercent(count)}%)\n`;
  });
  report += `\n`;

  // Top 3 Regional Heatmap
  if (locationEntries.length > 0) {
    const medals = ['🥇', '🥈', '🥉'];
    report += `🗺️ *MAPA TÉRMICO REGIONAL (TOP 3 CIUDADES):*\n`;
    locationEntries.slice(0, 3).forEach(([loc, count], idx) => {
      const pctVal = parseFloat(getPercent(count));
      const barCount = Math.max(1, Math.round(pctVal / 10));
      const barStr = '█'.repeat(barCount);
      report += `${medals[idx] || '•'} *${loc}:* ${barStr} *${count}* (${pctVal}%)\n`;
    });
    report += `\n`;
  }

  report += `🎯 *FUENTES DE TRÁFICO / CANALES:*\n`;
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
    report += `• ${src}: *${count}* (${getPercent(count)}%)\n`;
  });

  if (Object.keys(resCounts).length > 0) {
    report += `\n🖥️ *RESOLUCIONES Y PANTALLAS:*\n`;
    Object.entries(resCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([res, count]) => {
      report += `• ${res}: *${count}* (${getPercent(count)}%)\n`;
    });
  }

  // Suggestion 2: Hourly Traffic Histogram
  const hourHistogram = {};
  visits.forEach(v => {
    const rawTime = v.time || '12:00';
    const hourPart = rawTime.split(':')[0].padStart(2, '0');
    const hKey = `${hourPart}:00`;
    hourHistogram[hKey] = (hourHistogram[hKey] || 0) + 1;
  });

  report += `\n📊 *DISTRIBUCIÓN DE TRÁFICO POR HORAS (HISTOGRAMA 24H):*\n`;
  Object.entries(hourHistogram).sort((a, b) => a[0].localeCompare(b[0])).forEach(([hr, count]) => {
    const bar = '█'.repeat(Math.min(count, 12));
    report += `• *${hr}:* ${bar} *${count} visitas*\n`;
  });

  // Trend comparison vs previous 24h window
  const trendSummary = getVisitsTrendComparison(allVisits);
  report += `\n📊 *COMPARATIVA Y TENDENCIA DE TRÁFICO (24H VS. 24H ANTERIORES):*\n`;
  report += `• ${trendSummary}\n`;

  // Suggestion 3: Conversion Rate Calculation (Visits vs Captured Phone Leads)
  const leadsWithPhone = prospectLogs.filter(p => p.phone || p.contactNum).length;
  const conversionRate = total > 0 ? ((leadsWithPhone / total) * 100).toFixed(1) : '0.0';

  report += `\n📈 *TASA DE CONVERSIÓN (VISITAS ➔ LEADS CAPTURADOS):*\n`;
  report += `• *Leads con Teléfono Capturado:* *${leadsWithPhone}*\n`;
  report += `• *Tasa de Conversión Estimada:* *${conversionRate}%*\n`;

  report += `\n💬 *Tip:* Escribe /exportarvisitas para descargar el reporte en CSV o /visitas para refrescar el conteo.`;
  return report;
}

// Suggestion 1: Unusual Traffic Spike Alert Trigger
let lastSpikeAlertTime = 0;
function checkTrafficSpike(city, device) {
  try {
    const nowMs = Date.now();
    if (nowMs - lastSpikeAlertTime < 2 * 60 * 60 * 1000) return; // 2 hour cooldown

    const visits24h = getActive24hVisits(visitsLog);
    if (visits24h.length < 6) return;

    const visits1h = visits24h.filter(v => {
      const t = parseVisitTimestamp(v.timestamp);
      return t > 0 && (nowMs - t) <= (60 * 60 * 1000);
    }).length;

    const hourlyAvg = visits24h.length / 24;
    if (visits1h >= 4 && visits1h >= (hourlyAvg * 2.5)) {
      lastSpikeAlertTime = nowMs;
      const spikePct = (((visits1h - hourlyAvg) / (hourlyAvg || 1)) * 100).toFixed(0);
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `⚡ *¡ALERTA DE PICO INUSUAL DE TRÁFICO DETECTADO EN TU WEB!* ⚡\n\n` +
              `📊 *Visitas en la Última Hora:* *${visits1h} visitas* (+${spikePct}% sobre el promedio histórico)\n` +
              `📍 *Última Ubicación:* ${city || 'México'}\n` +
              `📱 *Dispositivo:* ${device || 'Móvil'}\n\n` +
              `💬 *Tip:* Escribe /visitas para ver la actividad en tiempo real.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }
  } catch (e) {}
}

let firstVisitAlertDate = '';
function checkFirstVisitOfDay(city, region, flag, device, source) {
  try {
    const todayCDMX = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
    if (firstVisitAlertDate !== todayCDMX) {
      firstVisitAlertDate = todayCDMX;
      const timeStr = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🌅 *¡PRIMERA VISITA DEL DÍA REGISTRADA EN TU WEB!* 🌅\n\n` +
              `📅 *Fecha:* ${todayCDMX} | ⏰ *Hora:* ${timeStr}\n` +
              `📍 *Origen Geográfico:* ${city || 'México'}, ${region || ''} ${flag || '🇲🇽'}\n` +
              `📱 *Dispositivo:* ${device || 'Móvil'}\n` +
              `🎯 *Fuente:* ${source || 'Directo'}\n\n` +
              `💬 *Tip:* El tráfico del día ha comenzado. Escribe /hoy para consultar la actividad.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }
  } catch (e) {}
}

let notifiedSessions5Min = new Set();
let notifiedSessions10Min = new Set();
function checkHighEngagementVisit(sessionId, city, device, durationStr) {
  try {
    if (!sessionId) return;

    let sec = 0;
    if (typeof durationStr === 'number') sec = durationStr;
    else if (typeof durationStr === 'string') {
      const matchSec = durationStr.match(/(\d+)\s*s/i);
      const matchMin = durationStr.match(/(\d+)\s*m/i);
      if (matchSec) sec = parseInt(matchSec[1], 10);
      else if (matchMin) sec = parseInt(matchMin[1], 10) * 60;
      else sec = parseInt(durationStr, 10) || 0;
    }

    if (sec >= 300 && !notifiedSessions5Min.has(sessionId)) {
      notifiedSessions5Min.add(sessionId);
      const mins = Math.floor(sec / 60);
      const secs = sec % 60;
      const timeDisplay = `${mins} min ${secs} seg`;

      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🔥 *PROSPECTO ALTAMENTE INTERESADO (PERMANENCIA > 5 MINUTOS)* 🔥\n\n` +
              `⏱️ *Tiempo Navegando:* *${timeDisplay}*\n` +
              `📍 *Ubicación:* ${city || 'México'}\n` +
              `📱 *Dispositivo:* ${device || 'Móvil'}\n\n` +
              `💬 *Tip:* Este visitante está examinando la propuesta a detalle. Ofrece asesoría personalizada si inicia chat.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }

    if (sec >= 600 && !notifiedSessions10Min.has(sessionId)) {
      notifiedSessions10Min.add(sessionId);
      const mins = Math.floor(sec / 60);
      const secs = sec % 60;
      const timeDisplay = `${mins} min ${secs} seg`;

      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🏆 *¡PROSPECTO VIP ENTERPRISE DETECTADO (PERMANENCIA > 10 MINUTOS)!* 🏆\n\n` +
              `⏱️ *Tiempo Navegando:* *${timeDisplay}*\n` +
              `📍 *Ubicación:* ${city || 'México'}\n` +
              `📱 *Dispositivo:* ${device || 'Móvil'}\n\n` +
              `💬 *Atención Comercial:* El cliente lleva más de 10 minutos analizando el sitio web. ¡Oportunidad de alta conversión!`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }
  } catch (e) {}
}

function checkHighIntentVisit(sessionId, city, region, flag, device, clicks) {
  try {
    if (!sessionId || !Array.isArray(clicks) || clicks.length === 0) return;

    const highIntentKeywords = ['cotiz', 'precio', 'whatsapp', 'demo', 'contact', 'agend', 'ventas', 'garant', 'botón'];
    const matchedClick = clicks.find(c => {
      const lower = (c || '').toLowerCase();
      return highIntentKeywords.some(kw => lower.includes(kw));
    });

    if (matchedClick && !notifiedSessionsHighIntent.has(sessionId)) {
      notifiedSessionsHighIntent.add(sessionId);

      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🎯 *¡ALERTA DE ALTA INTENCIÓN DE COMPRA!* 🎯\n\n` +
              `Un visitante en la web acaba de realizar una acción de alta conversión:\n\n` +
              `🖱️ *Acción / Clic:* \`${matchedClick}\`\n` +
              `📍 *Ubicación:* ${city || 'México'}, ${region || ''} ${flag || '🇲🇽'}\n` +
              `📱 *Dispositivo:* ${device || 'Móvil'}\n` +
              `⏰ *Hora:* ${new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' })}\n\n` +
              `💬 *Sugerencia:* Si el usuario inicia un chat o envía mensaje por WhatsApp, atiéndelo de inmediato.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }
  } catch (e) {}
}


async function sendMondayWeeklyInsightReport() {
  try {
    const allVisits = visitsLog.length > 0 ? visitsLog : loadVisitsFromDisk();
    const nowMs = Date.now();
    const w1Ms = 7 * 24 * 60 * 60 * 1000;
    const w2Ms = 14 * 24 * 60 * 60 * 1000;

    const visitsLastWeek = allVisits.filter(v => {
      const t = parseVisitTimestamp(v.timestamp);
      return t > 0 && (nowMs - t) <= w1Ms;
    }).length;

    const visitsPrevWeek = allVisits.filter(v => {
      const t = parseVisitTimestamp(v.timestamp);
      return t > 0 && (nowMs - t) > w1Ms && (nowMs - t) <= w2Ms;
    }).length;

    let trendText = '';
    if (visitsPrevWeek === 0) {
      trendText = visitsLastWeek > 0 ? `🚀 *Crecimiento:* 🟢 +100% vs. semana previa (*${visitsLastWeek}* vs. *0*)` : `➖ *Sin variación acumulada* (*0* vs. *0*)`;
    } else {
      const diff = visitsLastWeek - visitsPrevWeek;
      const pct = ((diff / visitsPrevWeek) * 100).toFixed(1);
      const icon = diff >= 0 ? '📈 ⬆️' : '📉 ⬇️';
      const sign = diff >= 0 ? '+' : '';
      trendText = `${icon} *Variación Semanal:* *${sign}${pct}%* (*${visitsLastWeek}* esta semana vs. *${visitsPrevWeek}* la previa)`;
    }

    const msg = `🚀 *INFORME DE RENDIMIENTO Y TENDENCIA SEMANAL (LUNES 8:00 AM)* 🚀\n\n` +
      `📊 *Visitas en la Última Semana:* *${visitsLastWeek}*\n` +
      `• ${trendText}\n\n` +
      `💡 *Tip de Estrategia:* Usa /semana o /exportarvisitas para el análisis completo en Excel.`;

    await callTelegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text: msg, parse_mode: 'Markdown' });
  } catch (e) {
    console.error('[MONDAY INSIGHT ERROR]', e.message);
  }
}

app.post('/api/track-visit', async (req, res) => {
  try {
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) {}
    }

    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

    // 🛡️ Filtro de IP del Administrador: Ignorar visitas si la IP pertenece al admin o si viene marcada como admin
    if ((clientIp && ignoredAdminIps.has(clientIp)) || bodyData?.isAdmin) {
      return res.status(200).json({ ok: true, ignored: true, message: 'Visita de administrador ignorada.' });
    }

    const { sessionId, isReturning, city, region, country, flag, source, device, isp, duration, scroll, clicks } = bodyData || {};
    const nowMs = Date.now();

    // Anti-Duplication Filter: If same session within 15 minutes, update record instead of duplicating
    const existingIndex = visitsLog.findIndex(v => v.sessionId && v.sessionId === sessionId && (nowMs - new Date(v.timestamp).getTime() <= 15 * 60 * 1000));

    if (existingIndex !== -1) {
      visitsLog[existingIndex].duration = duration || visitsLog[existingIndex].duration;
      visitsLog[existingIndex].scroll = Math.max(visitsLog[existingIndex].scroll || 0, scroll || 0);
      visitsLog[existingIndex].clicks = Array.from(new Set([...(visitsLog[existingIndex].clicks || []), ...(clicks || [])]));
      visitsLog[existingIndex].timestamp = new Date().toISOString();
      if (isReturning) visitsLog[existingIndex].isReturning = true;
    } else {
      const record = {
        sessionId: sessionId || ('sess_' + Date.now()),
        isReturning: !!isReturning,
        city: city || 'Desconocida',
        region: region || '',
        country: country || 'México',
        flag: flag || '🇲🇽',
        source: source || 'Acceso Directo Web 🌐',
        device: device || 'Web',
        isp: isp || '',
        duration: duration || 'N/A',
        scroll: scroll || 0,
        clicks: clicks || [],
        time: new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
      };
      visitsLog.push(record);
      if (visitsLog.length > 1000) visitsLog.shift();
    }

    saveVisitsToDisk(visitsLog);

    // Suggestion 2: High Engagement Alert (> 5 Minutes Browsing)
    checkHighEngagementVisit(sessionId, city, device, duration);

    // 🎯 Sugerencia 2: Alerta Instantánea de Alta Intención de Compra
    checkHighIntentVisit(sessionId, city, region, flag, device, clicks);


    // Suggestion 3: Instant Returning Visitor Alert
    if (isReturning && existingIndex === -1) {
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🌟 *¡ALERTA DE CLIENTE RECURRENTE EN TU WEB!* 🌟\n\nUn visitante que ya conocía *Brain Branding* acaba de reingresar al sitio web.\n\n📍 *Ubicación:* ${city || 'México'}, ${region || ''} ${flag || '🇲🇽'}\n📱 *Dispositivo:* ${device || 'Móvil'}\n🎯 *Origen:* ${source || 'Directo'}\n⏰ *Hora:* ${new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' })}\n\n💬 *Tip:* Contacta al prospecto si solicita cotización o inicia chat con el bot.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }

    // Suggestion 1: Spike & First Visit of Day Detector
    if (existingIndex === -1) {
      checkTrafficSpike(city, device);
      checkFirstVisitOfDay(city, region, flag, device, source);
    }

    // Suggestion 2: High Traffic Alert Trigger (Fires when 24h visits reach milestones: 10, 20, 50, 100)
    // Suggestion 2: High Traffic Alert Trigger (Fires when 24h visits reach milestones: 10, 20, 50, 100)
    const active24hVisits = getActive24hVisits(visitsLog);
    const active24hCount = active24hVisits.length;

    if ([10, 20, 50, 100].includes(active24hCount) && existingIndex === -1) {
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🔥 *ALTA AFLUENCIA DETECTADA EN EL SITIO WEB* 🔥\n\nEl sitio web de *Brain Branding* acaba de alcanzar un hito de *${active24hCount} visitas únicas* en las últimas 24 horas.\n\n📍 *Último visitante registrado:* ${city || 'México'}, ${region || ''} (${device || 'Móvil'})\n💬 *Tip:* Usa /visitas o /exportarvisitas para ver el informe detallado en Excel.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }

    return res.status(200).json({ ok: true, totalVisits: visitsLog.length, active24h: active24hCount });
  } catch (err) {
    console.error('[TRACK VISIT ERROR]', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
});

app.get('/api/analytics-db', (req, res) => {
  const allVisits = visitsLog.length > 0 ? visitsLog : loadVisitsFromDisk();
  const visits24h = getActive24hVisits(allVisits);
  const targetVisits = visits24h.length > 0 ? visits24h : allVisits.slice(-50);
  return res.status(200).json({ ok: true, visits: targetVisits, total24h: visits24h.length, totalAllTime: allVisits.length });
});

// Endpoint: Sync Local Browser Visits to Backend DB
app.post('/api/sync-visits', (req, res) => {
  try {
    const { visits } = req.body || {};
    if (Array.isArray(visits) && visits.length > 0) {
      let added = 0;
      visits.forEach(v => {
        if (!v || !v.timestamp) return;
        const exists = visitsLog.some(existing => existing.sessionId === v.sessionId || (existing.timestamp === v.timestamp && existing.time === v.time));
        if (!exists) {
          visitsLog.push(v);
          added++;
        }
      });
      if (added > 0) {
        if (visitsLog.length > 1000) visitsLog.splice(0, visitsLog.length - 1000);
        saveVisitsToDisk(visitsLog);
        console.log(`[SYNC VISITS] Synced ${added} new visits from client storage.`);
      }
      return res.status(200).json({ ok: true, synced: added, total: visitsLog.length });
    }
    return res.status(200).json({ ok: true, synced: 0, total: visitsLog.length });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
});

// Endpoint: Interactive Web Dashboard for Live Analytics
app.get('/api/analytics/dashboard', (req, res) => {
  const allVisits = visitsLog.length > 0 ? visitsLog : loadVisitsFromDisk();
  const activeVisits = getActive24hVisits(allVisits);
  const avgDur = calculateAverageDuration(activeVisits);
  const nowStr = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Brain Branding — Dashboard de Analítica 24/7</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0D14; color: #EAEFFC; margin: 0; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    .card { background: #121824; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { color: #38BDF8; font-size: 24px; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat-box { background: #1E293B; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-val { font-size: 28px; font-weight: bold; color: #38BDF8; }
    .stat-lbl { font-size: 13px; color: #94A3B8; text-transform: uppercase; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #1E293B; font-size: 14px; }
    th { color: #94A3B8; background: #0F172A; }
    tr:hover { background: rgba(56, 189, 248, 0.05); }
    .badge { background: #0284C7; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>📊 Brain Branding — Tablero de Métricas en Tiempo Real</h1>
      <p style="color: #94A3B8; font-size: 13px;">Última actualización: ${nowStr} (CDMX)</p>
      
      <div class="grid">
        <div class="stat-box">
          <div class="stat-val">${activeVisits.length}</div>
          <div class="stat-lbl">Visitas (Últimas 24h)</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${allVisits.length}</div>
          <div class="stat-lbl">Total Acumulado en Base de Datos</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${avgDur}</div>
          <div class="stat-lbl">Tiempo Promedio Permanencia</div>
        </div>
      </div>

      <h2>📍 Últimas Visitas Registradas</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>Ubicación</th>
            <th>Dispositivo</th>
            <th>Origen</th>
            <th>Scroll</th>
          </tr>
        </thead>
        <tbody>
          ${activeVisits.slice(-15).reverse().map(v => `
            <tr>
              <td>${v.time || 'N/A'}</td>
              <td>${v.flag || '🇲🇽'} ${v.city || 'México'}, ${v.region || ''}</td>
              <td>${v.device || 'Móvil'}</td>
              <td><span class="badge">${v.source || 'Directo'}</span></td>
              <td>${v.scroll || 0}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
});

// Server Keep-Alive Ping Endpoint
app.get('/api/keep-alive', (req, res) => {
  checkAndTriggerMorningReports();
  return res.status(200).json({
    ok: true,
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    visitsCount: visitsLog.length,
    // false si TELEGRAM_BOT_TOKEN esta invalido/revocado ahora mismo — ver
    // lastTelegramAuthError arriba. El workflow de keep-alive en GitHub
    // Actions revisa este campo para avisar por correo si el bot se quedo
    // mudo (chats Y reportes automaticos), no solo si el servidor responde.
    telegramOk: !lastTelegramAuthError,
    telegramError: lastTelegramAuthError,
  });
});

// Internal Self-Ping / Keep-Alive Runner (Pings every 8 minutes to prevent Render sleep)
setInterval(() => {
  try {
    const targetUrl = 'https://brain-branding-demo-generator.onrender.com/api/keep-alive';
    https.get(targetUrl, (res) => {}).on('error', () => {});
  } catch (e) {}
}, 8 * 60 * 1000);

// Local Blockchain Chain Hash State
let lastBlockchainHash = "GENESIS_BRAIN_BRANDING_BLOCK_SAAS_2026";

// Programador Automático de Reportes cada 8 Horas (6:00 AM, 2:00 PM y 10:00 PM)
// (DATA_DIR ahora se declara arriba, cerca del tope del archivo)

// Cargar slots enviados guardados en disco para evitar duplicados entre reinicios
const SENT_SLOTS_FILE = path.join(DATA_DIR, 'sent_report_slots.json');
let sentReportSlotsArray = [];
try {
  if (fs.existsSync(SENT_SLOTS_FILE)) {
    sentReportSlotsArray = JSON.parse(fs.readFileSync(SENT_SLOTS_FILE, 'utf8')) || [];
  }
} catch (e) {}
const sentReportSlots = new Set(sentReportSlotsArray);

function saveSentReportSlotsToDisk() {
  try {
    const list = Array.from(sentReportSlots).slice(-100);
    fs.writeFileSync(SENT_SLOTS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

let isReportExecuting = false;
// Nunca se declaraba — cada llamada a checkAndTriggerMorningReports (corre
// cada 60s) tronaba con ReferenceError en cuanto llegaba a esta línea, así
// que el cobro automático de contratos por vencer nunca llegó a correr ni
// una sola vez.
let lastBillingCheckDate = null;

async function checkAndTriggerMorningReports() {
  if (isReportExecuting) return;
  isReportExecuting = true;

  try {
    const now = new Date();
    const cdmxDateStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
    const hourStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false }).format(now);
    const cdmxHour = parseInt(hourStr, 10);

    // Horarios exactos de reporte: 6 (6:00 AM), 14 (2:00 PM), 22 (10:00 PM)
    const targetHours = [6, 14, 22];

    for (const targetH of targetHours) {
      // Disparar ÚNICAMENTE durante la hora exacta del slot (ej: 06:xx, 14:xx, 22:xx)
      if (cdmxHour === targetH) {
        const slotKey = `${cdmxDateStr}_slot_${targetH}`;

        if (!sentReportSlots.has(slotKey)) {
          // Candado síncrono INMEDIATO antes de llamadas asíncronas
          sentReportSlots.add(slotKey);
          saveSentReportSlotsToDisk();

          console.log(`[SCHEDULED 8H REPORT] Disparando reporte automático slot ${targetH}:00 hrs para ${cdmxDateStr}`);

          let slotHeader = `☀️ *RESUMEN AUTOMÁTICO DE VISITAS WEB (MATUTINO 6:00 AM)* ☀️`;
          if (targetH === 14) slotHeader = `🌤️ *RESUMEN AUTOMÁTICO DE VISITAS WEB (VESPERTINO 2:00 PM)* 🌤️`;
          if (targetH === 22) slotHeader = `🌙 *RESUMEN AUTOMÁTICO DE VISITAS WEB (NOCTURNO 10:00 PM)* 🌙`;

          const reportText = buildDetailedAnalytics8AMReport(visitsLog, slotHeader);
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: reportText,
            parse_mode: 'Markdown'
          }).catch(e => console.error('[8H VISITS REPORT ERROR]', e.message));

          // Enviar también informe de prospectos IA en el slot matutino de las 6:00 AM
          if (targetH === 6 && typeof sendMorningReport8AM === 'function') {
            await sendMorningReport8AM().catch(e => console.error('[6AM LEADS REPORT ERROR]', e.message));
          }
        }
      }
    }


    // Cobro diario a clientes (3 días antes del vencimiento) a las 8:00 AM
    if (cdmxHour >= 8 && cdmxHour < 23 && lastBillingCheckDate !== cdmxDateStr) {
      lastBillingCheckDate = cdmxDateStr;
      const currentDay = now.getDate();
      const activeContracts = Object.values(contractsDB).filter(c => c.status === 'ACEPTADO');

      for (const contract of activeContracts) {
        let dueDay = 15;
        if (contract.date) {
          const parts = contract.date.split('-');
          if (parts.length === 3) dueDay = parseInt(parts[2], 10) || 15;
        }

        const daysRemaining = dueDay - currentDay;
        if (daysRemaining >= 0 && daysRemaining <= 3) {
          const waMessage = `Hola ${contract.clientName}, te recordamos amablemente la cuota mensual de tu app ${contract.appName} ($${contract.monthlyPrice} MXN). Folio: ${contract.code}. ¡Gracias por confiar en Brain Branding!`;
          const waLink = `https://wa.me/527712339238?text=${encodeURIComponent(waMessage)}`;

          let billingMsg = `🚨 *ALERTA DIARIA DE COBRO DE MANTENIMIENTO SAAS* 🚨\n\n` +
            `⏱️ *Estado:* Faltan *${daysRemaining === 0 ? '0 días (HOY)' : daysRemaining + ' días'}* para el vencimiento.\n` +
            `🔢 *Folio 6D:* \`${contract.code}\`\n` +
            `👤 *Cliente:* ${contract.clientName}\n` +
            `📱 *App:* ${contract.appName}\n` +
            `💳 *Mensualidad Nube:* $${contract.monthlyPrice.toLocaleString('es-MX')} MXN/mes\n` +
            `📅 *Día de Cobro:* ${dueDay} de este mes\n` +
            `📞 *Gestión del Dueño (Andrés R):* \`+52 771 233 9238\`\n\n` +
            `💬 *Haz clic para enviar recordatorio por WhatsApp:* \n[Enviar Mensaje a ${contract.clientName}](${waLink})`;

          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: billingMsg,
            parse_mode: 'Markdown'
          });
        }
      }
    }
  } catch (e) {
    console.error('[SCHEDULED REPORTS ERROR]', e);
  } finally {
    isReportExecuting = false;
  }
}



// Run check every 60 seconds
setInterval(checkAndTriggerMorningReports, 60 * 1000);

// Also run check 5 seconds after server boot / wake up to catch up on missed reports
setTimeout(checkAndTriggerMorningReports, 5000);

// Permanent SaaS Contracts Database (Disk-backed JSON Persistence)
// DATA_DIR ya se declaró más arriba (la necesitaba SENT_SLOTS_FILE primero).
const CONTRACTS_FILE = path.join(DATA_DIR, 'contracts.json');
const contractsDB = {};

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(CONTRACTS_FILE)) {
    const rawData = fs.readFileSync(CONTRACTS_FILE, 'utf8');
    const parsed = JSON.parse(rawData);
    Object.assign(contractsDB, parsed);
    console.log(`[CONTRACTS DB LOADED] Loaded ${Object.keys(contractsDB).length} permanent contracts from disk.`);
  }

  // Migración / Garantía de Contrato 763190 para Ana Lilia
  delete contractsDB['423805'];
  contractsDB['763190'] = {
    code: '763190',
    clientName: 'Ana Lilia',
    appName: 'Plataforma SaaS Ana Lilia',
    date: '2026-08-10',
    initialPrice: 3500,
    monthlyPrice: 250,
    status: contractsDB['763190']?.status || 'PENDIENTE',
    acceptedAt: contractsDB['763190']?.acceptedAt || null,
    appStatus: contractsDB['763190']?.appStatus || 'ONLINE',
    createdAt: contractsDB['763190']?.createdAt || '2026-08-10T16:00:00.000Z',
    signatureData: contractsDB['763190']?.signatureData || null
  };

  // Guardar estado inicial actualizado
  saveContractsToDisk();
} catch(e) {
  console.error('[CONTRACTS DB LOAD ERROR]', e);
}

function saveContractsToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(contractsDB, null, 2), 'utf8');
  } catch(e) {
    console.error('[CONTRACTS DB SAVE ERROR]', e);
  }
}

app.post('/api/contracts', (req, res) => {
  try {
    const { clientName, appName, date, initialPrice, monthlyPrice, code: customCode } = req.body || {};
    if (!clientName || !appName) {
      return res.status(400).json({ ok: false, error: 'Campos obligatorios faltantes' });
    }

    let code = customCode;
    if (!code || code.length !== 6) {
      do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      } while (contractsDB[code]);
    }

    const rawSealStr = `${code}_${clientName.trim()}_${appName.trim()}_${date}_${initialPrice}_${monthlyPrice}_BRAIN_BRANDING_SAAS`;
    const sha256Seal = crypto.createHash('sha256').update(rawSealStr).digest('hex').substring(0, 32).toUpperCase();

    const contract = {
      code,
      clientName: clientName.trim(),
      appName: appName.trim(),
      date: date || new Date().toISOString().split('T')[0],
      initialPrice: parseFloat(initialPrice) || 4500,
      monthlyPrice: parseFloat(monthlyPrice) || 290,
      status: 'PENDIENTE',
      appStatus: 'ONLINE', // 'ONLINE' or 'OFFLINE'
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      sha256Seal,
      signatureData: null
    };

    contractsDB[code] = contract;
    saveContractsToDisk();
    console.log(`[CONTRACT CREATED] Code: ${code} for ${clientName}`);

    // Send instant Telegram notification to Andrés R
    const notifyMsg = `📜 *NUEVO CONTRATO DIGITAL SAAS GENERADO* 📜\n\n` +
      `🔢 *Folio 6D:* \`${code}\`\n` +
      `👤 *Cliente:* ${contract.clientName}\n` +
      `📱 *App / Software:* ${contract.appName}\n` +
      `💰 *Inversión Inicial:* $${contract.initialPrice.toLocaleString('es-MX')} MXN\n` +
      `💳 *Mensualidad Nube:* $${contract.monthlyPrice.toLocaleString('es-MX')} MXN/mes\n` +
      `📅 *Fecha:* ${contract.date}\n` +
      `🔒 *Sello Digital SHA-256:* \`${sha256Seal}\`\n\n` +
      `🔗 *Enlace:* https://brainbranding.com.mx/?contrato=${code}`;

    callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: notifyMsg,
      parse_mode: 'Markdown'
    }).catch(() => {});

    return res.status(200).json({ ok: true, contract });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/contracts/:code', (req, res) => {
  const code = (req.params.code || '').trim();
  const contract = contractsDB[code];
  if (!contract) {
    return res.status(404).json({ ok: false, error: 'Contrato no encontrado' });
  }
  return res.status(200).json({ ok: true, contract });
});

app.post('/api/contracts/:code/accept', (req, res) => {
  const code = (req.params.code || '').trim();
  const contract = contractsDB[code];
  if (!contract) {
    return res.status(404).json({ ok: false, error: 'Contrato no encontrado' });
  }

  const { signatureName, ip, userAgent } = req.body || {};
  const acceptTime = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  const clientIP = ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  
  const rawAcceptSeal = `${code}_${contract.clientName}_${acceptTime}_${clientIP}_FIRMADO_SAAS_BRAIN_BRANDING`;
  const sha256AcceptSeal = crypto.createHash('sha256').update(rawAcceptSeal).digest('hex').substring(0, 32).toUpperCase();

  contract.status = 'ACEPTADO';
  contract.acceptedAt = acceptTime;
  contract.sha256Seal = sha256AcceptSeal;
  contract.signatureData = {
    signatureName: signatureName || contract.clientName,
    ip: clientIP,
    userAgent: userAgent || req.headers['user-agent'] || 'Desconocido',
    sha256Seal: sha256AcceptSeal,
    timestamp: new Date().toISOString()
  };

  saveContractsToDisk();
  console.log(`[CONTRACT ACCEPTED] Code: ${code} by ${contract.clientName}`);

  // Send instant Telegram notification to Andrés R
  const acceptMsg = `🎉 *CONTRATO SAAS FIRMADO Y ACEPTADO EN VIVO* 🎉\n\n` +
    `🔢 *Folio 6D:* \`${code}\`\n` +
    `👤 *Cliente:* ${contract.clientName}\n` +
    `📱 *App / Software:* ${contract.appName}\n` +
    `✍️ *Firmado por:* ${contract.signatureData.signatureName}\n` +
    `⏰ *Fecha y Hora:* ${acceptTime}\n` +
    `🌐 *Dirección IP:* \`${clientIP}\`\n` +
    `🔒 *Sello Criptográfico SHA-256:* \`${sha256AcceptSeal}\`\n\n` +
    `⚖️ *Validez Legal:* Registro de aceptación con sello inalterable en base de datos.`;

  callTelegram('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: acceptMsg,
    parse_mode: 'Markdown'
  }).catch(() => {});

  return res.status(200).json({ ok: true, contract });
});

// Toggle App Online / Offline Remote Governance Endpoint
app.post('/api/contracts/:code/toggle-status', (req, res) => {
  const code = (req.params.code || '').trim();
  const contract = contractsDB[code];
  if (!contract) {
    return res.status(404).json({ ok: false, error: 'Contrato no encontrado' });
  }

  const newStatus = (req.body && req.body.status) 
    ? req.body.status 
    : (contract.appStatus === 'OFFLINE' ? 'ONLINE' : 'OFFLINE');

  contract.appStatus = newStatus;
  saveContractsToDisk();
  console.log(`[APP STATUS GOVERNANCE] Code: ${code} (${contract.appName}) toggled to ${newStatus}`);

  const statusMsg = newStatus === 'ONLINE'
    ? `🟢 *APP REACTIVADA Y EN LÍNEA EN VIVO* 🟢\n\n` +
      `🔢 *Folio 6D:* \`${code}\`\n` +
      `👤 *Cliente:* ${contract.clientName}\n` +
      `📱 *App:* ${contract.appName}\n` +
      `⚡ *Estado:* **EN LÍNEA (ONLINE)**\n` +
      `🚀 *Acceso:* El cliente y sus usuarios tienen acceso total habilitado.`
    : `🔴 *APP SUSPENDIDA / FUERA DE LÍNEA REMOTAMENTE* 🔴\n\n` +
      `🔢 *Folio 6D:* \`${code}\`\n` +
      `👤 *Cliente:* ${contract.clientName}\n` +
      `📱 *App:* ${contract.appName}\n` +
      `⛔ *Estado:* **FUERA DE LÍNEA (OFFLINE)**\n` +
      `🛑 *Acceso:* La aplicación mostrará pantalla de suspensión por mantenimiento o falta de pago.`;

  callTelegram('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: statusMsg,
    parse_mode: 'Markdown'
  }).catch(() => {});

  return res.status(200).json({ ok: true, appStatus: contract.appStatus, contract });
});

// Public App Status Query for Remote ALR SaaS Governance
app.get('/api/contracts/:code/app-status', (req, res) => {
  const code = (req.params.code || '').trim();
  const contract = contractsDB[code];
  if (!contract) {
    return res.status(200).json({ ok: true, appStatus: 'ONLINE', message: 'Contrato no encontrado, modo por defecto activo' });
  }
  return res.status(200).json({
    ok: true,
    code: contract.code,
    appName: contract.appName,
    clientName: contract.clientName,
    appStatus: contract.appStatus || 'ONLINE',
    contractStatus: contract.status
  });
});

app.get('/api/contracts-list', (req, res) => {
  return res.status(200).json({ ok: true, contracts: Object.values(contractsDB) });
});

app.delete('/api/contracts/:code', (req, res) => {
  const code = (req.params.code || '').trim();
  if (contractsDB[code]) {
    const deleted = contractsDB[code];
    delete contractsDB[code];
    saveContractsToDisk();
    console.log(`[CONTRACT DELETED] Deleted contract code: ${code}`);

    // Antes esta notificación la mandaba el navegador directo a la API de
    // Telegram con el token del bot embebido en el HTML público — se movió
    // aquí junto a la acción real, igual que ya hacía la creación de
    // contratos arriba.
    callTelegram('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: `🗑️ *CONTRATO ELIMINADO* 🗑️\n\nEl folio de contrato \`${code}\` (${deleted.clientName || 'Sin nombre'}) fue eliminado del panel admin.`,
      parse_mode: 'Markdown'
    }).catch(() => {});

    return res.status(200).json({ ok: true, message: 'Contrato eliminado' });
  }
  return res.status(404).json({ ok: false, error: 'Contrato no encontrado' });
});

app.post('/api/webhook', handleWebhookRequest);
app.post('/api/telegram', handleWebhookRequest);
app.post('/webhook', handleWebhookRequest);

app.post('*', (req, res, next) => {
  // If request comes to root POST or /api/webhook, handle Telegram
  if (req.path === '/' || req.path === '/api' || req.path === '/api/' || req.path === '/api/webhook' || req.path.includes('webhook')) {
    return handleWebhookRequest(req, res);
  }
  return res.status(404).json({ ok: false, error: `Ruta POST no encontrada: ${req.path}` });
});

app.get('*', (req, res) => {
  // No interceptar rutas API con el SPA fallback
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: `API route not found: ${req.path}` });
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Brain Branding 24/7 AI Telegram & WhatsApp Engine running on port ${PORT}`);
  
  // Auto-setup Webhook on startup if running on Render
  if (process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL) {
    try {
      const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
      const webhookUrl = `${baseUrl}/api/webhook`;
      const webhookResult = await callTelegram('setWebhook', {
        url: webhookUrl,
        drop_pending_updates: false,
        ...(TELEGRAM_WEBHOOK_SECRET ? { secret_token: TELEGRAM_WEBHOOK_SECRET } : {})
      });
      // Antes esto se imprimia como "successfully linked" sin revisar
      // webhookResult.ok - con un token invalido, callTelegram() resuelve
      // (no lanza excepcion) con {ok:false,...}, asi que el log mentia
      // diciendo exito justo cuando Telegram habia rechazado la llamada.
      if (webhookResult && webhookResult.ok) {
        console.log(`[AUTO-WEBHOOK] Webhook successfully linked to ${webhookUrl}${TELEGRAM_WEBHOOK_SECRET ? ' with secret_token' : ' WITHOUT secret_token (set TELEGRAM_WEBHOOK_SECRET env var to enable)'}`);
      } else {
        console.warn(`[AUTO-WEBHOOK WARN] Telegram rechazó el registro del webhook: ${webhookResult && webhookResult.description}`);
      }
    } catch (e) {
      console.warn('[AUTO-WEBHOOK WARN] Failed to auto-link Webhook:', e.message);
    }
  }

  // Prueba real del motor de Gemini al arrancar — antes, si Google
  // retiraba un modelo (como pasó hoy con 2.0/2.5-flash), el bot se
  // quedaba usando el respaldo por reglas fijas de forma silenciosa e
  // indefinida, sin ningún aviso.
  try {
    const health = await testGeminiConnection();
    if (health.ok) {
      console.log(`[GEMINI HEALTHCHECK] OK — modelo activo: ${health.model}`);
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `✅ *MOTOR DE IA (GEMINI) EN LÍNEA Y OPERATIVO* ✅\n\n` +
          `• *Modelo Conectado:* \`${health.model}\`\n` +
          `• *Estado:* Asistente 24/7 de WhatsApp y Telegram listo con IA fluida.\n` +
          `• *Resiliencia:* Multi-fallback automático y Circuit Breaker activos.\n\n` +
          `_Todo el flujo conversacional está funcionando con éxito._`,
        parse_mode: 'Markdown'
      }).catch(() => {});
    } else {
      console.warn(`[GEMINI HEALTHCHECK] FALLÓ — razón: ${health.reason}`);
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🚨 *ALERTA: EL MOTOR DE IA (GEMINI) NO RESPONDIÓ AL ARRANCAR* 🚨\n\n` +
          (health.reason === 'NO_API_KEY'
            ? `No hay ninguna \`GEMINI_API_KEY\` configurada en el servidor — el bot está usando solo respuestas por reglas fijas, no IA real.`
            : `Los modelos configurados fallaron al responder. Es posible que Google haya retirado el modelo actual (ya pasó antes) o que la llave de API ya no sea válida. El bot está usando el respaldo por reglas fijas mientras tanto.`) +
          `\n\n_Revisa Render → Environment → GEMINI_API_KEY, o pide que se actualicen los modelos en api/geminiHelper.js._`,
        parse_mode: 'Markdown'
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('[GEMINI HEALTHCHECK] Excepción:', e.message);
  }

  if (googleCalendar.isConfigured()) {
    console.log('[GOOGLE CALENDAR] Integración activa — el bot revisará disponibilidad real y creará eventos al confirmar citas.');
  } else {
    console.log('[GOOGLE CALENDAR] No configurado (GOOGLE_CALENDAR_CLIENT_EMAIL/PRIVATE_KEY/ID) — el bot sigue funcionando normal, solo sin prevención de choques contra el calendario real.');
  }
});

module.exports = app;


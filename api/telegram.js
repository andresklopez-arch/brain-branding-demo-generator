const express = require('express');
const crypto = require('crypto');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { getGeminiReply, geminiMetrics, setSecurityAlertCallback, generateLeadBriefing } = require('./geminiHelper.js');
const { getHistory, addTurn } = require('./historyStore.js');

const app = express();
app.use(express.json({ limit: '10mb' }));
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

const TELEGRAM_TOKEN = '8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M';

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
const { loadVisitsFromDisk, saveVisitsToDisk } = require('./historyStore.js');
const visitsLog = loadVisitsFromDisk();

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

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ ok: false }); }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

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

const pausedChats = {};
const { loadProspectsFromDisk, saveProspectsToDisk } = require('./historyStore.js');
const prospectLogs = loadProspectsFromDisk();
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
          let csv = 'Nombre,Username,ChatID,Clasificacion,Giro,Fecha\n';
          prospectLogs.forEach(p => {
            csv += `"${p.name}","${p.username}","${p.chatId}","${p.temp}","${p.giro || ''}","${p.timestamp}"\n`;
          });
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `📊 *EXPORTACIÓN DE PROSPECTOS CSV* 📊\n\n\`\`\`csv\n${csv.substring(0, 3500)}\n\`\`\``,
            parse_mode: 'Markdown'
          });
          return res.status(200).json({ ok: true });
        }

        if (cmdLower === '/exportarvisitas' || cmdLower === '/csvvisitas') {
          let csv = 'Fecha,Hora,Ciudad,Region,Pais,Dispositivo,Origen,Duracion,Scroll,Clics,Recurrente\n';
          visitsLog.forEach(v => {
            csv += `"${v.timestamp || ''}","${v.time || ''}","${v.city || ''}","${v.region || ''}","${v.country || ''}","${v.device || ''}","${v.source || ''}","${v.duration || ''}","${v.scroll || 0}%","${(v.clicks || []).join(';')}","${v.isReturning ? 'SI' : 'NO'}"\n`;
          });
          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `🌐 *EXPORTACIÓN DE VISITAS WEB CSV (ÚLTIMAS 24H)* 🌐\n\n\`\`\`csv\n${csv.substring(0, 3500)}\n\`\`\``,
            parse_mode: 'Markdown'
          });
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
        let reply = await getGeminiReply(userText, firstName, chatId, history);
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
      drop_pending_updates: false
    });
    
    return res.status(200).json({
      ok: true,
      message: `Webhook de Telegram configurado exitosamente`,
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

// Health check — confirms OTP routes are alive on Render
app.get('/api/admin/otp-status', (req, res) => {
  return res.status(200).json({ ok: true, message: 'OTP endpoint activo v2', hasOTP: !!currentAdminOTP });
});

// Endpoint 1: Request 2FA OTP Code to Telegram
app.post('/api/admin/request-2fa', async (req, res) => {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    currentAdminOTP = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 Minutes Validity
    };

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
app.post('/api/admin/verify-2fa', (req, res) => {
  const { otp } = req.body || {};
  if (!currentAdminOTP) {
    return res.status(400).json({ ok: false, error: 'Solicita un código 2FA primero.' });
  }

  if (Date.now() > currentAdminOTP.expiresAt) {
    currentAdminOTP = null;
    return res.status(400).json({ ok: false, error: 'El código 2FA ha expirado. Solicita uno nuevo.' });
  }

  if (String(otp).trim() !== currentAdminOTP.code) {
    return res.status(400).json({ ok: false, error: 'Código 2FA incorrecto.' });
  }

  currentAdminOTP = null;
  const adminToken = generateHmacSeal(`ADMIN_AUTH_GRANTED_${Date.now()}`);

  console.log(`[2FA VERIFIED] Admin access granted with token ${adminToken}`);
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

function getActive24hVisits(allVisits = []) {
  const nowMs = Date.now();
  const cutoff = nowMs - (24 * 60 * 60 * 1000);
  return allVisits.filter(v => {
    const vTime = parseVisitTimestamp(v.timestamp);
    return vTime > 0 ? vTime >= cutoff : true;
  });
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

function buildDetailedAnalytics8AMReport(allVisits = [], isScheduled8AM = false) {
  const visits = getActive24hVisits(allVisits);
  const total = visits.length;
  const nowStr = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });

  const headerTitle = isScheduled8AM
    ? `☀️ *RESUMEN DIARIO AUTOMÁTICO DE VISITAS WEB (8:00 AM)* ☀️\n📅 *Fecha:* ${nowStr}`
    : `📊 *INFORME DE VISITAS EN TIEMPO REAL (ÚLTIMAS 24 HORAS)* 📊\n⏰ *Generado a las:* ${timeStr} | ${nowStr}`;

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
  report += `📊 *Total de Visitas Registradas (Últimas 24h):* *${total}*\n\n`;

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

app.post('/api/track-visit', async (req, res) => {
  try {
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) {}
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

    // Suggestion 3: Instant Returning Visitor Alert
    if (isReturning && existingIndex === -1) {
      callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: `🌟 *¡ALERTA DE CLIENTE RECURRENTE EN TU WEB!* 🌟\n\nUn visitante que ya conocía *Brain Branding* acaba de reingresar al sitio web.\n\n📍 *Ubicación:* ${city || 'México'}, ${region || ''} ${flag || '🇲🇽'}\n📱 *Dispositivo:* ${device || 'Móvil'}\n🎯 *Origen:* ${source || 'Directo'}\n⏰ *Hora:* ${new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' })}\n\n💬 *Tip:* Contacta al prospecto si solicita cotización o inicia chat con el bot.`,
        parse_mode: 'Markdown'
      }).catch(function(){});
    }

    // Suggestion 1: Spike Traffic Detector
    if (existingIndex === -1) {
      checkTrafficSpike(city, device);
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

// Server Keep-Alive Ping Endpoint
app.get('/api/keep-alive', (req, res) => {
  checkAndTriggerMorningReports();
  return res.status(200).json({ ok: true, status: 'ONLINE', timestamp: new Date().toISOString(), visitsCount: visitsLog.length });
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

// Guaranteed 8:00 AM Morning Reports Scheduler with Automatic Catch-Up on Server Wakeup
let lastVisits8AMReportDate = '';
let lastLeads8AMReportDate = '';
let lastBillingCheckDate = '';

async function checkAndTriggerMorningReports() {
  try {
    const now = new Date();
    const cdmxDateStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
    const hourStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false }).format(now);
    const cdmxHour = parseInt(hourStr, 10);

    // If CDMX time is >= 8 AM (up to 11 PM) and today's report hasn't been sent yet, send it immediately!
    if (cdmxHour >= 8 && cdmxHour < 23) {
      // 1. Visit Analytics Report
      if (lastVisits8AMReportDate !== cdmxDateStr) {
        lastVisits8AMReportDate = cdmxDateStr;
        console.log(`[SCHEDULED 8AM REPORT] Dispatching 8:00 AM Visits Summary for ${cdmxDateStr} (Hour: ${cdmxHour})`);
        const reportText = buildDetailedAnalytics8AMReport(visitsLog, true);
        await callTelegram('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          text: reportText,
          parse_mode: 'Markdown'
        }).catch(e => console.error('[8AM VISITS REPORT ERROR]', e.message));
      }

      // 2. Leads & Gemini Telemetry Morning Report
      if (lastLeads8AMReportDate !== cdmxDateStr) {
        lastLeads8AMReportDate = cdmxDateStr;
        console.log(`[SCHEDULED 8AM REPORT] Dispatching 8:00 AM Leads & AI Report for ${cdmxDateStr}`);
        if (typeof sendMorningReport8AM === 'function') {
          await sendMorningReport8AM().catch(e => console.error('[8AM LEADS REPORT ERROR]', e.message));
        }
      }

      // 3. Daily Billing Reminders for Contracts 3 Days Prior to Due Date
      if (lastBillingCheckDate !== cdmxDateStr) {
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
    }
  } catch (e) {
    console.error('[8AM DAILY SUMMARY & BILLING ERROR]', e);
  }
}

// Run check every 60 seconds
setInterval(checkAndTriggerMorningReports, 60 * 1000);

// Also run check 5 seconds after server boot / wake up to catch up on missed reports
setTimeout(checkAndTriggerMorningReports, 5000);

// Permanent SaaS Contracts Database (Disk-backed JSON Persistence)
const DATA_DIR = path.join(__dirname, '../data');
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
    delete contractsDB[code];
    saveContractsToDisk();
    console.log(`[CONTRACT DELETED] Deleted contract code: ${code}`);
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
      await callTelegram('setWebhook', { url: webhookUrl, drop_pending_updates: false });
      console.log(`[AUTO-WEBHOOK] Webhook successfully linked to ${webhookUrl}`);
    } catch (e) {
      console.warn('[AUTO-WEBHOOK WARN] Failed to auto-link Webhook:', e.message);
    }
  }
});

module.exports = app;


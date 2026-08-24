const functions = require('firebase-functions');
const https = require('https');
const kb = require('./knowledge_base');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const nodeCrypto = require('crypto');

// Ver la misma nota en api/telegram.js — el token ya no vive en texto
// plano en el código. Esta función de Firebase parece no recibir tráfico
// real hoy (api/telegram.js re-registra el webhook hacia Render en cada
// arranque, apuntando el bot para allá), pero se corrige igual por
// higiene del repositorio.
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// In-memory conversation state per chat
const conversationHistory = {};
const userStates = {};

function getUserState(chatId) {
  if (!userStates[chatId]) {
    userStates[chatId] = {
      giro: '',
      dolor: '',
      cobro: '',
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

  const dynamicVariation = `${candidateReply}\n\n*Nota:* Además, si gustas podemos agendar una llamada rápida de 10 minutos para mostrarte la plataforma en vivo. 📲`;
  sent.add(dynamicVariation.trim());
  return dynamicVariation;
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

async function generateHumanReply(chatId, userName, userText) {
  if (!conversationHistory[chatId]) conversationHistory[chatId] = [];
  const state = getUserState(chatId);
  const history = conversationHistory[chatId];
  history.push({ role: 'user', text: userText });
  if (history.length > 12) history.shift();

  const textLower = userText.toLowerCase();

  if (userText === '/start') {
    const greetingName = userName ? ` ${userName}` : '';
    const welcome = `¡Hola${greetingName}! 👋 Qué gusto saludarte.\n\nSoy Alejandro de Brain Branding. Desarrollamos Asistentes con Inteligencia Artificial, Software a la Medida y Páginas Web de alta conversión.\n\nPlatícame, ¿qué área de tu negocio o empresa te gustaría automatizar hoy?`;
    history.push({ role: 'model', text: welcome });
    return getUniqueReply(chatId, welcome);
  }

  if (userText === '/demo' || textLower.includes('demo')) {
    const reply = `Con mucho gusto te muestro nuestras demos en vivo. 📱\n\nPuedes probar nuestras plataformas interactivas directamente en el navegador:\n🌐 ${kb.agencia.sitioWeb}\n\nVerás cómo opera un Punto de Venta, CRM y Asistente IA en tiempo real. ¿Qué tipo de solución buscas?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (userText === '/precios' || textLower.includes('precio') || textLower.includes('costo')) {
    const reply = `Te platico nuestro esquema de inversión transparente:\n\n• *Activación Inicial:* ${kb.comercial.activacionInicial}\n• *Mantenimiento Nube:* ${kb.comercial.mantenimientoNube}\n\nNuestra Garantía de Cero Riesgo: ${kb.comercial.garantiaCeroRiesgo} 😊\n\n¿Tienes una idea o proyecto específico a cotizar?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 1. Specific Business & Service Triggers
  if (textLower.includes('jardinero') || textLower.includes('jardineria') || textLower.includes('jardinería') || textLower.includes('jardin') || textLower.includes('poda') || textLower.includes('plantas')) {
    state.giro = 'Jardinería & Mantenimiento de Áreas Verdes';
    const demoUrl = kb.generadorDemos.getUrlDemo('Jardinería & Paisajismo');
    const reply = `¡Excelente giro! 🌿 Para servicios de jardinería, paisajismo y mantenimiento, las mejores soluciones que implementamos son:\n\n• *Asistente IA para Agendar Citas:* Tus clientes solicitan visitas o cotizaciones por WhatsApp/Telegram y el bot organiza tu agenda automáticamente.\n• *Cotizador Móvil Rápido:* Envías presupuestos profesionales en PDF desde tu celular en 10 segundos.\n• *Catálogo Web de Trabajos:* Galería interactiva con tus proyectos realizados para transmitir máxima confianza.\n\n🌐 *Ver Demo para Jardinería:*\n${demoUrl}\n\nPlatícame: ¿Cómo agendan las citas o cotizan los servicios con tus clientes actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('cita') || textLower.includes('citas') || textLower.includes('agendar') || textLower.includes('agenda') || textLower.includes('horario') || textLower.includes('reserva')) {
    state.dolor = 'Agendamiento y gestión de citas';
    const reply = `¡Justo lo que automatizamos a la perfección! 📅 Cuando operas por citas, atender mensajes a mano quita tiempo valioso y provoca cancelaciones de último momento.\n\nCon nuestro **Asistente IA de Citas por WhatsApp/Telegram**:\n1. El cliente consulta tus horarios disponibles 24/7.\n2. El bot agenda la cita en tu calendario automáticamente.\n3. Envía un recordatorio 24 horas antes para confirmar la asistencia.\n\n¿Te gustaría probar una demo en vivo de cómo tus clientes agendarían su cita por WhatsApp?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('alimento') || textLower.includes('perro') || textLower.includes('perros') || textLower.includes('gato') || textLower.includes('mascota') || textLower.includes('croqueta')) {
    state.giro = 'Venta de Alimentos para Mascotas / Pet Shop';
    const demoUrl = kb.generadorDemos.getUrlDemo('Venta de Alimentos para Mascotas');
    const reply = `¡Excelente giro! 🐾 Para venta de alimentos y artículos para mascotas, los retos principales son controlar inventario por bulto/kilo y agilizar el cobro en mostrador.\n\nNuestras soluciones clave son:\n• *POS con Integración de Báscula:* Pesa y calcula el precio por kilo al instante.\n• *Control de Inventario de Bultos:* Descuento automático de kilos del costal al vender a granel.\n• *Asistente IA por WhatsApp:* Atiende pedidos a domicilio y envía ubicación.\n\n🌐 *Ver Demo para Alimento de Mascotas:*\n${demoUrl}\n\nPlatícame: ¿Cómo registran el pesaje o las ventas en mostrador actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('pesar') || textLower.includes('pesado') || textLower.includes('bascula') || textLower.includes('báscula') || textLower.includes('kilo')) {
    state.dolor = 'Pesaje manual a granel';
    const reply = `Entiendo perfecto. Pesar a mano y calcular precios por kilo quita mucho tiempo en mostrador y provoca errores en las cuentas. ⚖️\n\nJusto para eso conectamos el **Módulo de Pesaje con Báscula Electrónica Integrada**: al poner el producto en la báscula, el sistema lee el peso exacto en milisegundos y calcula el total sin fallas.\n\n¿Cómo realizan el cobro y registro de notas en caja actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('papel') || textLower.includes('lapiz') || textLower.includes('lápiz') || textLower.includes('cuaderno') || textLower.includes('libreta')) {
    state.cobro = 'Papel y lápiz / Libreta manual';
    const reply = `¡Nombre, con toda razón! Cobrar con papel y lápiz es un dolor de cabeza diario: las notas se traspapelan, toma minutos con cada cliente y al final del día el corte de caja nunca cuadra. 📄✏️\n\nCon nuestro **Brain POS Móvil**, registras la venta en 3 segundos desde una tablet o tu celular, emites el ticket y ves tu ganancia neta en vivo sin volver a tocar lápiz ni calculadora.\n\n¿Te gustaría que te preparemos una propuesta sin compromiso o ver una demostración en vivo?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('panaderia') || textLower.includes('panadería') || textLower.includes('pan') || textLower.includes('pasteleria')) {
    state.giro = 'Panadería & Pastelería';
    const demoUrl = kb.generadorDemos.getUrlDemo('Panadería & Pastelería');
    const reply = `¡Qué excelente giro! 🍞 Para panaderías y reposterías, las soluciones con mayor impacto son:\n\n• *Punto de Venta (POS) Táctil:* Registro rápido de pan dulce/blanco, corte de caja y control de inventario de insumos.\n• *Asistente IA por WhatsApp:* Toma pedidos de pasteles sobre diseño o encargos de pan mayoreo 24/7.\n• *Página Web Catálogo:* Folleto digital interactivo para mostrar tus especialidades.\n\n🌐 *Ver Demo en Vivo para Panadería:*\n${demoUrl}\n\nPlatícame: ¿Tienes una sola sucursal o varias? ¿O cuántos clientes/pedidos atienden al día aprox?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('modernizar') || textLower.includes('modernizarme') || textLower.includes('innovar') || textLower.includes('crecer') || textLower.includes('actualizar')) {
    const reply = `¡Extraordinaria visión! Modernizar la operación es la clave para liberar tu tiempo y acelerar ventas. 🚀\n\nPodemos sugerirte un Punto de Venta (POS) móvil, un Software de Gestión Personalizado o un Asistente IA por WhatsApp.\n\nPara armarte la propuesta ideal, platícame:\n1. ¿De qué giro es tu negocio y cuántas sucursales manejas actualmente?\n2. ¿Qué tanto has explorado o utilizado la Inteligencia Artificial en tus procesos diarios?\n3. ¿Cuál es esa meta o idea con la que has soñado para automatizar tu empresa?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 4. Anti-Repetition Fallback Queue
  const fallbackMatrix = [
    `Entiendo perfecto. Para sugerirte la solución idónea, platícame: ¿Cuántas sucursales o puntos de servicio atiendes en tu negocio? 🏢`,
    `¡Excelente! Una pregunta clave: ¿Qué proceso operativo te quita más tiempo en el día a día? ⚙️`,
    `Si pudieras automatizar una sola tarea en tu empresa mañana para liberar tu tiempo, ¿cuál sería esa meta que has soñado? 💡`,
    `Te podemos generar una demostración interactiva con el nombre de tu marca en minutos. 🌐 Platícame el giro o nombre de tu negocio.`
  ];

  let selectedFallback = '';
  for (const f of fallbackMatrix) {
    if (!state.askedFallbacks.has(f.trim())) {
      selectedFallback = f;
      state.askedFallbacks.add(f.trim());
      break;
    }
  }

  if (!selectedFallback) {
    selectedFallback = `Con gusto te armamos una propuesta a la medida para tu negocio. Platícame: ¿Qué módulo te gustaría probar primero en tu demostración? 🚀`;
  }

  const reply = getUniqueReply(chatId, selectedFallback);
  history.push({ role: 'model', text: reply });
  return reply;
}

exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method === 'POST' && req.body && req.body.message) {
      const update = req.body;
      const chatId = update.message.chat.id;
      const firstName = update.message.from ? update.message.from.first_name : '';
      let userText = update.message.text || '';

      if (update.message.voice || update.message.audio) {
        const durationSec = (update.message.voice || update.message.audio).duration || 0;
        userText = `[Nota de voz de ${durationSec}s] Hola, le envié una nota de voz de ${durationSec} segundos sobre mi negocio.`;
      }

      if (userText) {
        await callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' });
        const reply = await generateHumanReply(chatId, firstName, userText);
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown'
        });
      }
    }
    res.status(200).send({ ok: true });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    res.status(200).send({ ok: true, error: err.message });
  }
});

// ============================================================
// 🔐 ALR SAAS GOVERNANCE — Firebase Admin SDK
// Usado por getPublicLicenseStatus/verifyAlrAdminAccess más abajo. El
// viejo exports.setLicenseStatus (onRequest con un ADMIN_SECRET
// hardcodeado compartido con api/telegram.js) se retiró: confirmado por
// grep que app.js nunca lo llama (usa Render/Firestore directo, ambos
// también reemplazados) -- era código muerto.
// ============================================================

const admin = require('firebase-admin');
const { authenticator } = require('otplib');

// Inicializar Firebase Admin solo si aún no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const adminDb = admin.firestore();

// ============================================================
// 🔐 ALR SAAS GOVERNANCE — Cloud Functions v2 (custom claims)
// Mismo patrón que rey-xalpa/Rey_Xalpa_temp/functions/index.js: el
// claim alrSuperAdmin SOLO lo asigna esta función (Admin SDK) tras
// validar el PIN contra Secret Manager. firestore.rules exige ese
// claim para leer/escribir master_licenses -- el navegador nunca
// puede otorgárselo a sí mismo.
// ============================================================

const ALR_REGION = 'us-central1';

// Antes era SYSTEM_ADMINS[0].pinHash en app.js, un hash SHA-256
// precalculado visible en el JS público (crackeable offline sin
// límite de intentos). Ahora vive en Secret Manager -- nunca en el
// código ni en un .env versionado. Configurar antes de desplegar:
//   firebase functions:secrets:set ALR_ADMIN_PIN
const ALR_ADMIN_PIN = defineSecret('ALR_ADMIN_PIN');

function alrSafeEqual(a, b) {
  const ha = nodeCrypto.createHash('sha256').update(String(a)).digest();
  const hb = nodeCrypto.createHash('sha256').update(String(b)).digest();
  return nodeCrypto.timingSafeEqual(ha, hb);
}

// --- Rate limiting server-side por IP ---------------------------------
// Antes el límite de 5 intentos/5min sólo vivía en variables del propio
// navegador (window.LOCK_ATTEMPTS) -- trivial de resetear recargando la
// página o llamando la Cloud Function directo. Esto lleva la cuenta en
// Firestore, por IP de origen, independiente de lo que haga el cliente.
const LOGIN_ATTEMPTS_COLLECTION = 'alr_login_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function getClientIp(request) {
  const raw = request.rawRequest;
  const fwd = raw?.headers?.['x-forwarded-for'];
  const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : null) || raw?.ip || 'unknown';
  // Los `:`/`.` son válidos en un doc id de Firestore, pero se sanitiza
  // igual por si acaso (IPv6 trae muchos ":").
  return ip.replace(/[^a-zA-Z0-9.:_-]/g, '_').slice(0, 200) || 'unknown';
}

async function checkAndConsumeRateLimit(ip) {
  const ref = adminDb.collection(LOGIN_ATTEMPTS_COLLECTION).doc(ip);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};
  if (data.lockedUntil && data.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((data.lockedUntil - Date.now()) / 1000);
    throw new HttpsError('resource-exhausted', `Demasiados intentos fallidos. Espera ${remainingSec}s.`);
  }
  return { ref, failCount: data.failCount || 0 };
}

// Mismo chat que ya usa api/telegram.js (ADMIN_CHAT_ID ahí) -- un chat id
// de Telegram no es un secreto (solo identifica la conversación), la
// credencial real es el bot token, que nunca sale de Render/Secret
// Manager. La ID token que exige el proxy se obtiene aquí mismo con un
// custom token del propio Admin SDK (nunca se guarda ni se expone).
const ALR_ALERT_CHAT_ID = '8337803949';
const ALR_WEB_API_KEY = 'AIzaSyCgIpvZux4c6VjBI31KX8rACPe-zDSVRYo';
const ALR_NOTIFY_PROXY_BASE = 'https://brain-branding-demo-generator.onrender.com';
const CONSECUTIVE_FAILS_ALERT_THRESHOLD = 3;

async function sendAlrSecurityAlert(text) {
  try {
    const customToken = await admin.auth().createCustomToken('alr-system-alerter', { alrSuperAdmin: true });
    const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${ALR_WEB_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    const signInJson = await signInRes.json();
    if (!signInJson.idToken) throw new Error(signInJson.error?.message || 'Sin idToken');
    await fetch(`${ALR_NOTIFY_PROXY_BASE}/api/alr-notify/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signInJson.idToken}` },
      body: JSON.stringify({ chatId: ALR_ALERT_CHAT_ID, text, parseMode: 'HTML' })
    });
  } catch (err) {
    // Una alerta que no se pudo enviar nunca debe tumbar el flujo de
    // autenticación real -- solo se registra en logs.
    console.error('[sendAlrSecurityAlert] Fallo al enviar alerta:', err);
  }
}

async function registerFailedAttempt(ref, failCount, context) {
  const nextCount = failCount + 1;
  const update = { failCount: nextCount, lastAttempt: Date.now() };
  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    update.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  await ref.set(update, { merge: true });

  if (nextCount === CONSECUTIVE_FAILS_ALERT_THRESHOLD) {
    const ip = context?.ip || 'IP desconocida';
    const fn = context?.fn || 'login';
    await sendAlrSecurityAlert(
      `⚠️ <b>ALR SaaS</b>: ${nextCount} intentos fallidos seguidos en <code>${fn}</code> desde IP <code>${ip}</code>. Si no fuiste tú, revisa la consola.`
    );
  }
}

async function clearRateLimit(ref) {
  await ref.delete().catch(() => {});
}

// --- verifyAlrAdminAccess({ pin, totpCode?, username? }) ---------------
// Puerta de entrada única al panel ALR SaaS Commander. Requiere sesión
// anónima de Firebase Auth ya iniciada (ver app.js). Si el PIN coincide
// (y el código TOTP también, cuando el operador ya enroló 2FA real vía
// enrollTotp), asigna el claim alrSuperAdmin:true al UID actual -- ese
// claim es lo único que firestore.rules exige para tocar
// master_licenses.
exports.verifyAlrAdminAccess = onCall({ region: ALR_REGION, secrets: [ALR_ADMIN_PIN] }, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Requiere sesión anónima activa.');

  const ip = getClientIp(request);
  const { ref: rateLimitRef, failCount } = await checkAndConsumeRateLimit(ip);

  const pin = String(data?.pin || '');
  const username = String(data?.username || 'Master Admin');

  if (!pin || !alrSafeEqual(pin, ALR_ADMIN_PIN.value())) {
    await registerFailedAttempt(rateLimitRef, failCount, { ip, fn: 'verifyAlrAdminAccess/pin' });
    throw new HttpsError('permission-denied', 'PIN inválido.');
  }

  // Si el operador ya enroló un TOTP real (ver enrollTotp), exigirlo
  // además del PIN -- reemplaza el "2FA" anterior, cuya semilla era una
  // constante pública (MASTER_LEDGER_SALT en app.js) y no protegía nada.
  const totpSnap = await adminDb.collection('alr_admin_totp').doc(username).get();
  if (totpSnap.exists) {
    const totpCode = String(data?.totpCode || '');
    const secret = totpSnap.data().secret;
    const totpValid = totpCode.length === 6 && authenticator.verify({ token: totpCode, secret });
    if (!totpValid) {
      await registerFailedAttempt(rateLimitRef, failCount, { ip, fn: 'verifyAlrAdminAccess/totp' });
      throw new HttpsError('permission-denied', totpCode ? 'Código 2FA inválido.' : 'Falta el código 2FA.');
    }
  }

  await clearRateLimit(rateLimitRef);
  await admin.auth().setCustomUserClaims(auth.uid, { alrSuperAdmin: true });
  return { ok: true, totpRequired: totpSnap.exists };
});

// --- enrollTotp({ username? }) ------------------------------------------
// Genera un secreto TOTP real (RFC 6238) por operador y lo guarda en
// Firestore -- solo el Admin SDK (aquí) lo lee o lo escribe, nunca el
// cliente. Requiere que quien llama YA tenga el claim alrSuperAdmin
// (es decir, ya pasó verifyAlrAdminAccess con el PIN) -- habilitar 2FA
// no puede ser en sí mismo la puerta de entrada.
exports.enrollTotp = onCall({ region: ALR_REGION }, async (request) => {
  const { auth, data } = request;
  if (!auth || auth.token?.alrSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Requiere sesión de administrador activa.');
  }
  const username = String(data?.username || 'Master Admin');
  const secret = authenticator.generateSecret();
  await adminDb.collection('alr_admin_totp').doc(username).set({
    secret,
    enrolledAt: new Date().toISOString(),
  });
  const otpauthUri = authenticator.keyuri(username, 'ALR SaaS Commander', secret);
  return { ok: true, secret, otpauthUri };
});

// --- disableTotp({ username? }) ------------------------------------------
// Por si el operador pierde el dispositivo -- requiere el PIN vigente
// (no solo el claim ya emitido) para que un navegador con sesión abierta
// pero robado no pueda apagar el segundo factor por su cuenta.
exports.disableTotp = onCall({ region: ALR_REGION, secrets: [ALR_ADMIN_PIN] }, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Requiere sesión anónima activa.');
  const pin = String(data?.pin || '');
  if (!pin || !alrSafeEqual(pin, ALR_ADMIN_PIN.value())) {
    throw new HttpsError('permission-denied', 'PIN inválido.');
  }
  const username = String(data?.username || 'Master Admin');
  await adminDb.collection('alr_admin_totp').doc(username).delete();
  return { ok: true };
});

// --- getPublicLicenseStatus?appId=... ---------------------------------
// Único endpoint que alr-saas-gate-sdk.js debe llamar, sin
// autenticación (se embebe en apps de terceros clientes). Usa Admin
// SDK, así que bypasea firestore.rules -- expone SOLO status y
// gracePeriodHours, nunca apiKey, datos de contacto ni el resto del
// documento de licencia.
exports.getPublicLicenseStatus = onRequest({ region: ALR_REGION, cors: true }, async (req, res) => {
  const appId = String(req.query.appId || '').trim();
  if (!appId || !/^[a-z0-9_-]{2,60}$/i.test(appId)) {
    return res.status(400).json({ error: 'appId inválido o ausente.' });
  }

  try {
    const snap = await adminDb.collection('master_licenses').doc(appId).get();
    if (!snap.exists) {
      // Mismo comportamiento "fail open" que el SDK actual si el doc
      // no existe, para no bloquear apps mal configuradas por error.
      return res.status(200).json({ status: 'ACTIVE', gracePeriodHours: 72 });
    }
    const licData = snap.data() || {};
    return res.status(200).json({
      status: String(licData.status || 'ACTIVE').toUpperCase(),
      gracePeriodHours: Number(licData.gracePeriodHours || 72)
    });
  } catch (err) {
    console.error('[getPublicLicenseStatus] Error:', err);
    // Fail open: un error del servidor no debe tumbar apps de clientes.
    return res.status(200).json({ status: 'ACTIVE', gracePeriodHours: 72 });
  }
});

// --- provisionAppClone({ appId, tenantId, businessName }) ---------------
// Clona una app ya construida para un cliente nuevo del mismo giro SIN
// crear infraestructura nueva: llama al registerTenant (o equivalente)
// que la app destino YA expone para alta de tenants dentro de su propio
// proyecto Firebase (ver rey-xalpa/Rey_Xalpa_temp/functions/index.js:111,
// que hace exactamente esto para autolavados). "appId" identifica el
// app-type en alr-saas-app-registry -- ese doc dice a qué proyecto/función
// llamar. Requiere claim alrSuperAdmin: a diferencia de un alta
// self-service normal de la app destino (que solo pide sesión anónima),
// aquí lo dispara el operador desde la consola central.
const CLONE_TENANT_ID_RE = /^[a-z0-9_]{2,40}$/;
const CALLABLE_ERROR_CODES = new Set([
  'already-exists', 'invalid-argument', 'permission-denied', 'unauthenticated',
  'not-found', 'resource-exhausted', 'failed-precondition', 'internal', 'unavailable'
]);
function mapRemoteCallableCode(status) {
  if (!status) return 'internal';
  const code = String(status).toLowerCase().replace(/_/g, '-');
  return CALLABLE_ERROR_CODES.has(code) ? code : 'internal';
}

exports.provisionAppClone = onCall({ region: ALR_REGION }, async (request) => {
  const { auth, data } = request;
  if (!auth || auth.token?.alrSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Requiere sesión de administrador activa.');
  }

  const appId = String(data?.appId || '').trim();
  const tenantId = String(data?.tenantId || '').trim().toLowerCase();
  const businessName = String(data?.businessName || '').trim();

  if (!appId) throw new HttpsError('invalid-argument', 'Falta appId.');
  if (!CLONE_TENANT_ID_RE.test(tenantId)) {
    throw new HttpsError('invalid-argument', 'tenantId inválido (usa minúsculas, números y guión bajo, 2-40 caracteres).');
  }
  if (businessName.length < 4) {
    throw new HttpsError('invalid-argument', 'Nombre de negocio muy corto.');
  }

  const registrySnap = await adminDb.collection('alr-saas-app-registry').doc(appId).get();
  if (!registrySnap.exists) {
    throw new HttpsError('failed-precondition', 'Esta app no tiene auto-clonado configurado.');
  }
  const { firebaseProjectId, functionsRegion, webApiKey, registerFunctionName, hostingBaseUrl } = registrySnap.data() || {};
  if (!firebaseProjectId || !functionsRegion || !webApiKey || !registerFunctionName || !hostingBaseUrl) {
    throw new HttpsError('failed-precondition', 'El registro de esta app está incompleto.');
  }

  // 1. Sesión anónima contra el proyecto DESTINO (no brain-branding) --
  // misma técnica que usa la propia app destino para su alta self-service,
  // solo que disparada aquí server-to-server. webApiKey no es secreta: ya
  // vive pública en el app_config.js de cada app cliente.
  let idToken;
  try {
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(webApiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
    );
    const signUpJson = await signUpRes.json();
    idToken = signUpJson.idToken;
    if (!idToken) throw new Error(signUpJson.error?.message || 'Sin idToken');
  } catch (err) {
    console.error('[provisionAppClone] Fallo al autenticar contra la app destino:', err);
    throw new HttpsError('unavailable', 'No se pudo iniciar sesión contra la app destino.');
  }

  // 2. Llamar a la función de alta de tenants de la app destino con el
  // protocolo estándar de Cloud Functions callable (mismo que usa
  // tests/alr-saas.smoke.test.js contra esta propia consola).
  let remoteResult;
  try {
    const fnRes = await fetch(
      `https://${functionsRegion}-${firebaseProjectId}.cloudfunctions.net/${registerFunctionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ data: { name: businessName, tenantId } })
      }
    );
    const fnJson = await fnRes.json();
    if (!fnRes.ok || fnJson.error) {
      throw new HttpsError(
        mapRemoteCallableCode(fnJson.error?.status),
        fnJson.error?.message || `La app destino respondió ${fnRes.status}.`
      );
    }
    remoteResult = fnJson.result;
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('[provisionAppClone] Fallo al llamar a la app destino:', err);
    throw new HttpsError('unavailable', 'No se pudo contactar a la app destino.');
  }

  // 3. Registrar la licencia/gobernanza en brain-branding para que el
  // cliente nuevo aparezca en el dashboard de ALR SaaS (activar/suspender/
  // facturar) -- mismo set de campos base que syncLicenseToFirestore
  // (app.js), escrito aquí server-side porque ya tenemos Admin SDK.
  const appUrl = `${String(hostingBaseUrl).replace(/\/$/, '')}/${tenantId}`;
  const nowIso = new Date().toISOString();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 20);
  await adminDb.collection('master_licenses').doc(tenantId).set({
    id: tenantId,
    clientName: businessName,
    appId,
    appName: appId,
    appUrl,
    status: 'ACTIVE',
    expiryDate: expiry.toISOString(),
    expirationDate: expiry.toISOString(),
    currentPlan: 'PLATA',
    lastUpdated: nowIso,
    provisionedVia: 'provisionAppClone',
  }, { merge: true });

  return { ok: true, tenantId, connectSecret: remoteResult?.connectSecret || null, appUrl };
});

// --- deprovisionAppClone({ appId, tenantId }) ----------------------------
// Contraparte destructiva de provisionAppClone: borra DE VERDAD el tenant
// en la app destino (todas sus colecciones, ver deleteTenant en
// rey-xalpa/Rey_Xalpa_temp/functions/index.js) y retira la licencia de
// master_licenses aquí. Irreversible -- requiere alrSuperAdmin + el
// adminPin guardado en el registro (mismo PIN que usa el panel maestro
// de la app destino, ver openAppCloneConfigModal en app.js).
exports.deprovisionAppClone = onCall({ region: ALR_REGION }, async (request) => {
  const { auth, data } = request;
  if (!auth || auth.token?.alrSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Requiere sesión de administrador activa.');
  }

  const appId = String(data?.appId || '').trim();
  const tenantId = String(data?.tenantId || '').trim().toLowerCase();
  if (!appId) throw new HttpsError('invalid-argument', 'Falta appId.');
  if (!CLONE_TENANT_ID_RE.test(tenantId)) {
    throw new HttpsError('invalid-argument', 'tenantId inválido.');
  }

  const registrySnap = await adminDb.collection('alr-saas-app-registry').doc(appId).get();
  if (!registrySnap.exists) {
    throw new HttpsError('failed-precondition', 'Esta app no tiene auto-clonado configurado.');
  }
  const { firebaseProjectId, functionsRegion, webApiKey, deleteFunctionName, adminPin } = registrySnap.data() || {};
  if (!firebaseProjectId || !functionsRegion || !webApiKey || !deleteFunctionName || !adminPin) {
    throw new HttpsError('failed-precondition', 'Falta configurar el borrado (deleteFunctionName/adminPin) para esta app.');
  }

  let idToken;
  try {
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(webApiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
    );
    const signUpJson = await signUpRes.json();
    idToken = signUpJson.idToken;
    if (!idToken) throw new Error(signUpJson.error?.message || 'Sin idToken');
  } catch (err) {
    console.error('[deprovisionAppClone] Fallo al autenticar contra la app destino:', err);
    throw new HttpsError('unavailable', 'No se pudo iniciar sesión contra la app destino.');
  }

  let remoteResult;
  try {
    const fnRes = await fetch(
      `https://${functionsRegion}-${firebaseProjectId}.cloudfunctions.net/${deleteFunctionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ data: { pin: adminPin, tenantId } })
      }
    );
    const fnJson = await fnRes.json();
    if (!fnRes.ok || fnJson.error) {
      throw new HttpsError(
        mapRemoteCallableCode(fnJson.error?.status),
        fnJson.error?.message || `La app destino respondió ${fnRes.status}.`
      );
    }
    remoteResult = fnJson.result;
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('[deprovisionAppClone] Fallo al llamar a la app destino:', err);
    throw new HttpsError('unavailable', 'No se pudo contactar a la app destino.');
  }

  await adminDb.collection('master_licenses').doc(tenantId).delete().catch(() => {});
  await adminDb.collection('master_licenses').doc(tenantId).collection('secrets').doc('apiKey').delete().catch(() => {});

  return { ok: true, tenantId, collectionsDeleted: remoteResult?.collectionsDeleted || [] };
});

// --- restoreAppCloneBackup({ appId, tenantId }) --------------------------
// Deshace el último clonado o borrado de un tenant: llama a
// restoreTenantBackup en la app destino, que reescribe el respaldo más
// reciente guardado ahí (ver createPreCloneBackup/createPreDeleteBackup
// en rey-xalpa/Rey_Xalpa_temp/functions/index.js) tal cual estaba antes
// de la operación. Reutiliza la misma conexión (webApiKey/adminPin) que
// provisionAppClone/deprovisionAppClone.
exports.restoreAppCloneBackup = onCall({ region: ALR_REGION }, async (request) => {
  const { auth, data } = request;
  if (!auth || auth.token?.alrSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Requiere sesión de administrador activa.');
  }

  const appId = String(data?.appId || '').trim();
  const tenantId = String(data?.tenantId || '').trim().toLowerCase();
  if (!appId) throw new HttpsError('invalid-argument', 'Falta appId.');
  if (!CLONE_TENANT_ID_RE.test(tenantId)) {
    throw new HttpsError('invalid-argument', 'tenantId inválido.');
  }

  const registrySnap = await adminDb.collection('alr-saas-app-registry').doc(appId).get();
  if (!registrySnap.exists) {
    throw new HttpsError('failed-precondition', 'Esta app no tiene auto-clonado configurado.');
  }
  const { firebaseProjectId, functionsRegion, webApiKey, adminPin } = registrySnap.data() || {};
  const restoreFunctionName = (registrySnap.data() || {}).restoreFunctionName || 'restoreTenantBackup';
  if (!firebaseProjectId || !functionsRegion || !webApiKey || !adminPin) {
    throw new HttpsError('failed-precondition', 'Falta configurar el borrado/restauración (adminPin) para esta app.');
  }

  let idToken;
  try {
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(webApiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
    );
    const signUpJson = await signUpRes.json();
    idToken = signUpJson.idToken;
    if (!idToken) throw new Error(signUpJson.error?.message || 'Sin idToken');
  } catch (err) {
    console.error('[restoreAppCloneBackup] Fallo al autenticar contra la app destino:', err);
    throw new HttpsError('unavailable', 'No se pudo iniciar sesión contra la app destino.');
  }

  let remoteResult;
  try {
    const fnRes = await fetch(
      `https://${functionsRegion}-${firebaseProjectId}.cloudfunctions.net/${restoreFunctionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ data: { pin: adminPin, tenantId } })
      }
    );
    const fnJson = await fnRes.json();
    if (!fnRes.ok || fnJson.error) {
      throw new HttpsError(
        mapRemoteCallableCode(fnJson.error?.status),
        fnJson.error?.message || `La app destino respondió ${fnRes.status}.`
      );
    }
    remoteResult = fnJson.result;
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('[restoreAppCloneBackup] Fallo al llamar a la app destino:', err);
    throw new HttpsError('unavailable', 'No se pudo contactar a la app destino.');
  }

  // Si el tenant había sido borrado de ALR SaaS, vuelve a registrarse aquí
  // también a partir de lo que la app destino diga que restauró (mismo
  // formato/estado que tenía antes, así que el tenant reaparece en el
  // dashboard como si nunca se hubiera ido).
  if (remoteResult?.tenantId) {
    await adminDb.collection('master_licenses').doc(tenantId).set({
      id: tenantId,
      appId,
      appName: appId,
      status: 'ACTIVE',
      lastUpdated: new Date().toISOString(),
      restoredFromBackup: remoteResult.backupId || null,
    }, { merge: true });
  }

  return { ok: true, tenantId, ...remoteResult };
});

// --- testAppCloneConnection({ appId }) -----------------------------------
// "Probar conexión" del panel de Auto-clonado: valida que webApiKey y
// registerFunctionName realmente funcionan SIN crear ningún tenant --
// llama a la función destino con un tenantId deliberadamente inválido
// ("__ping__", falla la validación TENANT_ID_RE del lado de la app
// destino) y confirma que la respuesta es un error JSON estructurado de
// esa función (prueba que existe y es alcanzable), no un 404/HTML de
// infraestructura.
exports.testAppCloneConnection = onCall({ region: ALR_REGION }, async (request) => {
  const { auth, data } = request;
  if (!auth || auth.token?.alrSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Requiere sesión de administrador activa.');
  }

  const appId = String(data?.appId || '').trim();
  const registrySnap = await adminDb.collection('alr-saas-app-registry').doc(appId).get();
  if (!registrySnap.exists) {
    throw new HttpsError('failed-precondition', 'Esta app no tiene auto-clonado configurado.');
  }
  const { firebaseProjectId, functionsRegion, webApiKey, registerFunctionName } = registrySnap.data() || {};
  if (!firebaseProjectId || !functionsRegion || !webApiKey || !registerFunctionName) {
    throw new HttpsError('failed-precondition', 'El registro de esta app está incompleto.');
  }

  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(webApiKey)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
  ).catch(() => null);
  const signUpJson = signUpRes ? await signUpRes.json().catch(() => ({})) : {};
  if (!signUpJson.idToken) {
    return { ok: false, step: 'auth', detail: signUpJson.error?.message || 'webApiKey inválida o auth anónima desactivada en el proyecto destino.' };
  }

  const fnRes = await fetch(
    `https://${functionsRegion}-${firebaseProjectId}.cloudfunctions.net/${registerFunctionName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signUpJson.idToken}` },
      body: JSON.stringify({ data: { name: 'Ping de prueba', tenantId: '__ping__' } })
    }
  ).catch(() => null);
  if (!fnRes) {
    return { ok: false, step: 'function', detail: 'No se pudo contactar la función -- revisa región/proyecto.' };
  }
  const fnJson = await fnRes.json().catch(() => null);
  if (!fnJson || (!fnJson.error && !fnJson.result)) {
    return { ok: false, step: 'function', detail: `Respuesta inesperada (status ${fnRes.status}) -- la función probablemente no existe con ese nombre.` };
  }

  return { ok: true, detail: 'Conexión verificada: la app destino respondió correctamente.' };
});

// --- listLoginAttempts() --------------------------------------------------
// Panel de auditoría: expone alr_login_attempts (rate-limit por IP de
// verifyAlrAdminAccess) de solo lectura -- esa colección no tiene reglas
// propias en firestore.rules (default-deny), así que el navegador nunca
// la lee directo; solo a través de esta función admin-gated.
exports.listLoginAttempts = onCall({ region: ALR_REGION }, async (request) => {
  const { auth } = request;
  if (!auth || auth.token?.alrSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Requiere sesión de administrador activa.');
  }
  const snap = await adminDb.collection(LOGIN_ATTEMPTS_COLLECTION).orderBy('lastAttempt', 'desc').limit(100).get();
  const attempts = snap.docs.map((doc) => ({ ip: doc.id, ...doc.data() }));
  return { ok: true, attempts };
});


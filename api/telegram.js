const https = require('https');

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
    getUrlDemo: (negocio) => `https://brainbranding.com.mx/?negocio=${encodeURIComponent(negocio)}`
  }
};

const userStates = {};
const conversationHistory = {};

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

function generateHumanReply(chatId, userName, userText) {
  if (!conversationHistory[chatId]) conversationHistory[chatId] = [];
  const state = getUserState(chatId);
  const history = conversationHistory[chatId];
  history.push({ role: 'user', text: userText });
  if (history.length > 12) history.shift();

  const textLower = userText.toLowerCase();

  if (userText === '/start') {
    const greetingName = userName ? ` ${userName}` : '';
    const welcome = `¡Hola${greetingName}! 👋 Qué gusto saludarte.\n\nSoy Andrés R de Brain Branding. Desarrollamos Asistentes con Inteligencia Artificial, Software a la Medida y Páginas Web de alta conversión.\n\nPlatícame, ¿qué área de tu negocio o empresa te gustaría automatizar hoy?`;
    history.push({ role: 'model', text: welcome });
    return getUniqueReply(chatId, welcome);
  }

  if (userText === '/demo' || textLower.includes('demo') || textLower.includes('demostracion')) {
    const reply = `Con mucho gusto te muestro nuestras demos en vivo. 📱\n\nPuedes probar nuestras plataformas interactivas directamente en el navegador:\n🌐 ${kb.agencia.sitioWeb}\n\nVerás cómo opera un Punto de Venta, CRM y Asistente IA en tiempo real. ¿Qué tipo de solución buscas?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (userText === '/precios' || textLower.includes('precio') || textLower.includes('costo') || textLower.includes('cuanto cuesta')) {
    const reply = `Te platico nuestro esquema de inversión transparente:\n\n• *Activación Inicial:* ${kb.comercial.activacionInicial}\n• *Mantenimiento Nube:* ${kb.comercial.mantenimientoNube}\n\nNuestra Garantía de Cero Riesgo: ${kb.comercial.garantiaCeroRiesgo} 😊\n\nAdemás, si concretamos esta semana te obsequiamos los primeros 2 meses de mantenimiento. ¿Tienes una idea o proyecto específico a cotizar?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 1. Numeric Choice Evaluator (1, 2, 3)
  if (textLower === '1' || textLower === '1.' || textLower === '1.-' || textLower.includes('opcion 1') || textLower.includes('opción 1')) {
    const reply = `¡Excelente elección! 🏪 Para negocios locales y comercios (talleres, tiendas, restaurantes, panaderías, etc.), la solución estrella es nuestro **Brain POS Móvil & Asistente IA**:\n\n• Registro rápido de ventas en 3 segundos desde celular o tablet.\n• Control automático de inventario, stock e insumos.\n• Emisión de tickets digitales y avisos a clientes por WhatsApp.\n\n🌐 *Probar Demo en Vivo:*\nhttps://brainbranding.com.mx/#simulador-pos\n\nPlatícame: ¿De qué giro exacto es tu negocio local o cuántos productos o notas manejan al día?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower === '2' || textLower === '2.' || textLower === '2.-' || textLower.includes('opcion 2') || textLower.includes('opción 2')) {
    const reply = `¡Extraordinaria opción! 📅 Para profesionales y servicios por cita o cotización (jardinería, consultorías, salud, hojalatería, talleres, etc.):\n\n• **Asistente IA 24/7:** Tus clientes agendan y cotizan por WhatsApp/Telegram sin quitarte tiempo.\n• **Cotizador PDF Express:** Envías presupuestos profesionales en 10 segundos desde tu celular.\n• **Recordatorios Automáticos:** Cero cancelaciones de último momento.\n\n🌐 *Probar Demo de Citas:*\nhttps://brainbranding.com.mx/#asistente-ia\n\nPlatícame: ¿Qué servicio ofrece tu empresa o cómo agendan actualmente tus clientes?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower === '3' || textLower === '3.' || textLower === '3.-' || textLower.includes('opcion 3') || textLower.includes('opción 3')) {
    const reply = `¡Con mucho gusto! Aquí tienes el acceso directo a nuestras 3 Demostraciones Interactivas en Vivo en la web: 🌐\n\n1. 📱 *Punto de Venta POS:* https://brainbranding.com.mx/#simulador-pos\n2. 🤖 *Asistente IA de Citas & Pedidos:* https://brainbranding.com.mx/#asistente-ia\n3. 💻 *Catálogo Web & ERP:* https://brainbranding.com.mx/#simulador-web\n\nVerás el funcionamiento en tiempo real con el nombre de tu marca. ¿Cuál de estas 3 demos te llama más la atención?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 2. Location & FAQ Triggers
  if (textLower.includes('donde estan') || textLower.includes('dónde están') || textLower.includes('ubicacion') || textLower.includes('ubicación') || textLower.includes('oficina') || textLower.includes('donde se ubican')) {
    const reply = `Operamos de forma 100% digital e implementamos proyectos en todo México y Latinoamérica 🇲🇽🌎.\n\nNuestras oficinas centrales de desarrollo están en Pachuca, Hidalgo, y brindamos soporte en la nube 24/7. Todas las demostraciones e implementaciones se realizan en línea sin necesidad de que salgas de tu negocio.\n\n¿Te gustaría ver una demostración en vivo o agendar una llamada rápida?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('factura') || textLower.includes('facturan') || textLower.includes('cfdi') || textLower.includes('sat') || textLower.includes('impuestos')) {
    const reply = `¡Sí, por supuesto! 📜 Todos nuestros proyectos de software, desarrollo y mantenimiento son 100% deducibles de impuestos y te emitimos factura fiscal CFDI 4.0 al instante.\n\n¿Requieres facturar la inversión a nombre de tu empresa o como persona física?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('cuanto tardan') || textLower.includes('cuánto tardan') || textLower.includes('tiempo de entrega') || textLower.includes('cuanto tiempo') || textLower.includes('tardanza')) {
    const reply = `Nuestros tiempos de entrega son los más rápidos del mercado gracias a nuestros módulos pre-diseñados:\n\n⚡ *Asistentes IA y Bots:* En 24 a 48 horas operando en tu WhatsApp.\n📱 *Puntos de Venta (POS):* Entrega inmediata en 24 horas.\n🌐 *Software y Webs a la Medida:* De 3 a 7 días hábiles.\n\n¿Para qué fecha te gustaría tener tu sistema funcionando?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 3. Business Triggers (Automotive, Services, Retail, Medical, Hospitality)
  if (textLower.includes('hojalat') || textLower.includes('carroc') || textLower.includes('pintur') || textLower.includes('taller') || textLower.includes('mecanic') || textLower.includes('enderezad') || textLower.includes('auto') || textLower.includes('vehic')) {
    state.giro = 'Taller de Hojalatería, Pintura & Mecánica Automotriz';
    const demoUrl = kb.generadorDemos.getUrlDemo('Taller Automotriz & Hojalatería');
    const reply = `¡Excelente giro! 🚗 Para un Taller de Hojalatería, Pintura y Mecánica, las soluciones que más aceleran la operación son:\n\n• *Gestor Móvil de Órdenes de Servicio:* Registras el ingreso del auto con fotos de abolladuras/detalles, inventario de piezas y envías la cotización al cliente por WhatsApp en 10 segundos.\n• *Avisos Automáticos de Estatus por WhatsApp/Telegram:* El bot notifica al cliente cuando su auto pase a preparación, pintura o esté listo para entrega ("Tu auto ya está listo para recolección 🚗✨").\n• *Control de Refacciones y Anticipos:* Registro de señas cobradas y pagos finales con corte de caja diario.\n\n🌐 *Ver Demo en Vivo:*\n${demoUrl}\n\nPlatícame: ¿Cómo le dan seguimiento a los autos que entran al taller o cómo envían sus presupuestos actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('cuales') || textLower.includes('cuáles') || textLower.includes('que hay') || textLower.includes('qué hay') || textLower.includes('que modulos') || textLower.includes('qué módulos') || textLower.includes('opciones') || textLower.includes('que tienen') || textLower.includes('que ofrecen') || textLower.includes('en que me puede ayudar') || textLower.includes('en qué me puede ayudar') || textLower.includes('como me puedes ayudar')) {
    const reply = `¡Con mucho gusto te muestro cómo te podemos impulsar! 🚀\n\nNuestras 4 Soluciones Principales a la Medida son:\n\n1. 🤖 *Asistente IA 24/7 (WhatsApp & Telegram):* Atiende clientes, responde dudas de tus servicios, agenda citas y toma pedidos automáticamente 24/7.\n2. 🚗 *Gestor de Órdenes & Servicios a la Medida:* Control de trabajos, recepción de vehículos/equipos con fotos, estatus de avance y presupuestos en PDF.\n3. 📱 *Punto de Venta (POS) Móvil y Nube:* Cobro rápido desde celular o tablet, tickets digitales, inventarios y corte de caja.\n4. 🌐 *Página Web y Catálogo Interactivo:* Presentación profesional con testimonios y demostraciones visuales de tu negocio.\n\n¿Cuál de estas opciones te llama más la atención o quisieras probar en una demostración gratuita?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('jardin') || textLower.includes('paisaj') || textLower.includes('poda') || textLower.includes('plant') || textLower.includes('fumig')) {
    state.giro = 'Jardinería & Mantenimiento de Áreas Verdes';
    const demoUrl = kb.generadorDemos.getUrlDemo('Jardinería & Paisajismo');
    const reply = `¡Excelente giro! 🌿 Para servicios de jardinería, paisajismo y mantenimiento, las mejores soluciones que implementamos son:\n\n• *Asistente IA para Agendar Citas:* Tus clientes solicitan visitas o cotizaciones por WhatsApp/Telegram y el bot organiza tu agenda automáticamente.\n• *Cotizador Móvil Rápido:* Envías presupuestos profesionales en PDF desde tu celular en 10 segundos.\n• *Catálogo Web de Trabajos:* Galería interactiva con tus proyectos realizados para transmitir máxima confianza.\n\n🌐 *Ver Demo para Jardinería:*\n${demoUrl}\n\nPlatícame: ¿Cómo agendan las citas o cotizan los servicios con tus clientes actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('cita') || textLower.includes('agend') || textLower.includes('horari') || textLower.includes('reserv')) {
    state.dolor = 'Agendamiento y gestión de citas';
    const reply = `¡Justo lo que automatizamos a la perfección! 📅 Cuando operas por citas, atender mensajes a mano quita tiempo valioso y provoca cancelaciones de último momento.\n\nCon nuestro **Asistente IA de Citas por WhatsApp/Telegram**:\n1. El cliente consulta tus horarios disponibles 24/7.\n2. El bot agenda la cita en tu calendario automáticamente.\n3. Envía un recordatorio 24 horas antes para confirmar la asistencia.\n\n¿Te gustaría probar una demo en vivo de cómo tus clientes agendarían su cita por WhatsApp?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('aliment') || textLower.includes('perr') || textLower.includes('gat') || textLower.includes('mascot') || textLower.includes('croquet') || textLower.includes('veterin')) {
    state.giro = 'Venta de Alimentos para Mascotas / Pet Shop';
    const demoUrl = kb.generadorDemos.getUrlDemo('Venta de Alimentos para Mascotas');
    const reply = `¡Excelente giro! 🐾 Para venta de alimentos y artículos para mascotas, los retos principales son controlar inventario por bulto/kilo y agilizar el cobro en mostrador.\n\nNuestras soluciones clave son:\n• *POS con Integración de Báscula:* Pesa y calcula el precio por kilo al instante.\n• *Control de Inventario de Bultos:* Descuento automático de kilos del costal al vender a granel.\n• *Asistente IA por WhatsApp:* Atiende pedidos a domicilio y envía ubicación.\n\n🌐 *Ver Demo para Alimento de Mascotas:*\n${demoUrl}\n\nPlatícame: ¿Cómo registran el pesaje o las ventas en mostrador actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('panader') || textLower.includes('pan') || textLower.includes('pastel') || textLower.includes('reposter')) {
    state.giro = 'Panadería & Pastelería';
    const demoUrl = kb.generadorDemos.getUrlDemo('Panadería & Pastelería');
    const reply = `¡Qué excelente giro! 🍞 Para panaderías y reposterías, las soluciones con mayor impacto son:\n\n• *Punto de Venta (POS) Táctil:* Registro rápido de pan dulce/blanco, corte de caja y control de inventario de insumos (harina, huevo, azúcar).\n• *Asistente IA por WhatsApp:* Toma pedidos de pasteles sobre diseño o encargos de pan mayoreo 24/7.\n• *Página Web Catálogo:* Folleto digital interactivo para mostrar tus especialidades.\n\n🌐 *Ver Demo en Vivo para Panadería:*\n${demoUrl}\n\nPlatícame: ¿Tienes una sola sucursal o varias? ¿O cuántos clientes/pedidos atienden al día aprox?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 4. Uncommunicative / Short Input Smart Handling (1-3 words)
  const isShortInput = userText.trim().split(/\s+/).length <= 3;
  const genericWords = ['si', 'sí', 'ok', 'no', 'bien', 'hola', 'interesa', 'mm', 'a ver', 'saludos', 'gracias', 'grax'];
  const isGeneric = genericWords.some(w => textLower === w || textLower === w + '.');

  if (isShortInput && isGeneric) {
    const reply = `¡Perfecto! Para darte la información exacta sin hacerte perder tiempo, responde únicamente con el número 1, 2 o 3: 💡\n\n1️⃣ Tengo un Negocio Físico / Local (taller, tienda, restaurante, panadería, etc.)\n2️⃣ Ofrezco Servicios por Cita o Cotización (jardinería, consultoría, salud, etc.)\n3️⃣ Quiero ver las Demostraciones Interactivas en Vivo 🌐`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 5. Bulletproof Fallback Menu for Unforeseen Queries
  const fallbackReply = `Te entiendo perfectamente. En Brain Branding nos especializamos en resolver cualquier reto operativo o de ventas con tecnología a la medida. 🚀\n\nPara mostrarte la solución idónea en 10 segundos, dime qué número describe mejor lo que buscas:\n\n1️⃣ Controlar mis Ventas e Inventario con un Punto de Venta (POS) 📱\n2️⃣ Automatizar la Atención a Clientes y Citas por WhatsApp 🤖\n3️⃣ Desarrollar una Página Web o Sistema Personalizado para mi Empresa 🌐`;
  
  history.push({ role: 'model', text: fallbackReply });
  return getUniqueReply(chatId, fallbackReply);
}

const express = require('express');
const app = express();
app.use(express.json());

const OWNER_PHONE = '+52 771 233 9238';
const ADMIN_CHAT_ID = '8337803949'; // Personal Telegram Chat ID of the Owner

const pausedChats = {}; // chatId -> expiryTimestamp (30 min takeover pause)
const prospectLogs = []; // Daily activity tracker for prospects

function getDynamicKeyboard(chatId, userText) {
  const history = conversationHistory[chatId] || [];
  const msgCount = history.length;
  const textLower = (userText || '').toLowerCase();

  const isExplicitCallRequest = textLower.includes('hablar') || textLower.includes('llamar') || textLower.includes('llamada') || textLower.includes('telefono') || textLower.includes('teléfono') || textLower.includes('contacto') || textLower.includes('humano') || textLower.includes('asesor') || textLower.includes('persona') || textLower.includes('whatsapp') || textLower.includes('andres') || textLower.includes('andrés');

  const buttons = [
    [
      { 
        text: "📅 Servicios por Citas (WhatsApp)", 
        url: "https://wa.me/527712339238?text=Hola%20Andr%C3%A9s%20R,%20me%20interesa%20informaci%C3%B3n%20sobre%20el%20Servicio%20de%20Citas%20y%20Automatizaci%C3%B3n" 
      }
    ],
    [
      { text: "🌐 Ver Demos Interactivas", callback_data: "opcion_3" }
    ]
  ];

  // ONLY attach "Hablar con Andrés R" button if 4+ messages HAVE BEEN EXCHANGED or client EXPLICITLY requested human contact!
  if (msgCount >= 4 || isExplicitCallRequest) {
    buttons.push([
      { 
        text: "📞 Hablar con Andrés R (+52 771 233 9238)", 
        url: "https://wa.me/527712339238?text=Hola%20Andr%C3%A9s%20R,%20estoy%20viendo%20el%20bot%20de%20Telegram%20y%20me%20gustar%C3%ADa%20una%20cotizaci%C3%B3n" 
      }
    ]);
  }

  return { inline_keyboard: buttons };
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

async function notifyOwner(chatId, firstName, username, userText) {
  if (chatId.toString() === ADMIN_CHAT_ID) return; // Strictly don't notify owner about their own admin messages

  const textLower = (userText || '').toLowerCase();
  const isCitaClick = textLower.includes('cita') || textLower.includes('agend') || textLower.includes('whatsapp') || textLower.includes('opcion_2');

  const tempTag = isCitaClick ? '🔥 *[ALERTA DE CITA SOLICITADA POR WHATSAPP]*' : getLeadTemperature(userText);
  const isPaused = pausedChats[chatId] && pausedChats[chatId] > Date.now();
  const statusTag = isPaused ? '⏸️ *[MODO PAUSA ACTIVO - BOT SILENCIADO]*' : '🤖 *[RESPUESTA AUTOMÁTICA ENVIADA]*';

  prospectLogs.push({
    chatId,
    name: firstName || 'Prospecto',
    username: username || 'Sin username',
    text: userText,
    temp: isCitaClick ? 'CITA_URGENTE' : (tempTag.includes('CALIENTE') ? 'CALIENTE' : (tempTag.includes('TIBIO') ? 'TIBIO' : 'FRÍO')),
    timestamp: new Date().toLocaleTimeString('es-MX')
  });
  if (prospectLogs.length > 200) prospectLogs.shift();

  const alertHeader = isCitaClick ? '🚨 *¡PROSPECTO SOLICITÓ AGENDAR CITA EN WHATSAPP!* 🚨' : '🚨 *¡NUEVO MENSAJE DE PROSPECTO EN TELEGRAM!* 🚨';

  const alertText = `${alertHeader}\n\n${tempTag}\n👤 *Cliente:* ${firstName || 'Prospecto'} (${username ? '@' + username : 'Sin Username'})\n💬 *Mensaje:* "${userText}"\n🆔 *Chat ID:* \`${chatId}\`\n📱 *Notificado a:* ${OWNER_PHONE}\n${statusTag}\n\n⚙️ *Comandos:* \`/pausa ${chatId}\` | \`/plantilla\` | \`/exportar\``;

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

      // Check if paused
      if (pausedChats[chatId] && pausedChats[chatId] > Date.now()) {
        await notifyOwner(chatId, firstName, username, `[Clic en Botón: ${data} (Pausado)]`);
        return res.status(200).json({ ok: true });
      }

      await notifyOwner(chatId, firstName, username, `[Clic en Botón: ${data}]`);

      let textChoice = '1';
      if (data === 'opcion_2') textChoice = '2';
      if (data === 'opcion_3') textChoice = '3';

      const reply = generateHumanReply(chatId, firstName, textChoice);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: reply,
        parse_mode: 'Markdown',
        reply_markup: getDynamicKeyboard(chatId, textChoice)
      });

      return res.status(200).json({ ok: true });
    }

    // Handle Standard Text & Voice Messages
    if (req.method === 'POST' && update && update.message) {
      const chatId = update.message.chat.id;
      const firstName = update.message.from ? update.message.from.first_name : '';
      const username = update.message.from ? update.message.from.username : '';
      let userText = update.message.text || '';

      // STRICT ADMIN SECURITY FILTER: Only Chat ID 8337803949 can execute admin commands
      if (chatId.toString() === ADMIN_CHAT_ID) {
        const cmdLower = userText.toLowerCase().trim();

        if (cmdLower.startsWith('/pausa') || cmdLower.startsWith('/intervenir')) {
          const parts = userText.split(/\s+/);
          const targetId = parts[1] || (prospectLogs.length > 0 ? prospectLogs[prospectLogs.length - 1].chatId : null);

          if (targetId) {
            pausedChats[targetId] = Date.now() + 30 * 60 * 1000; // 30 mins
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
          const plantillaMsg = `📱 *PLANTILLAS RÁPIDAS DE RESPUESTA WHATSAPP* 📱\n\n*Plantilla 1 (Respuesta a Citas):*\n"¡Hola! 👋 Soy Andrés R de Brain Branding. Recibí tu mensaje sobre agendar una cita/demo.\n\nPlatícame: ¿qué día u horario prefieres para una llamada rápida de 10 minutos o deseas que te envíe un presupuesto personalizado?"\n\n*Plantilla 2 (Envío de Demos):*\n"¡Con gusto! Aquí puedes probar nuestras demos en vivo:\n🌐 https://brainbranding.com.mx/#asistente-ia"\n\n⚡ *Envío Automático Directo:* Usa \`/enviarwa <teléfono> citas\` para enviarla en 1 clic.`;

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
            finalMsg = "¡Con gusto! Aquí puedes probar nuestras demos en vivo:\n🌐 https://brainbranding.com.mx/#asistente-ia";
          }

          if (sendWa) sendWa(targetPhone, finalMsg);

          await callTelegram('sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: `✅ *Mensaje WhatsApp Enviado Automáticamente por Andrés R* a \`${targetPhone}\`:\n\n💬 "${finalMsg.substring(0, 80)}..."`,
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
      }

      // Voice message text notation
      if (update.message.voice || update.message.audio) {
        const durationSec = (update.message.voice || update.message.audio).duration || 0;
        userText = `[Nota de voz de ${durationSec}s] Hola, le envié una nota de voz de ${durationSec} segundos sobre mi negocio.`;
      }

      if (userText) {
        // 1. Notify Owner instantly at +52 771 233 9238 / Admin Chat ID 8337803949
        await notifyOwner(chatId, firstName, username, userText);

        // 2. Check if Chat ID is currently paused for human takeover
        if (pausedChats[chatId] && pausedChats[chatId] > Date.now()) {
          console.log(`[PAUSED] Chat ${chatId} is currently taken over by owner. Skipping auto-reply.`);
          return res.status(200).json({ ok: true });
        }

        // 3. Generate Intelligent Reply with Dynamic Inline Buttons
        await callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' });
        const reply = generateHumanReply(chatId, firstName, userText);

        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown',
          reply_markup: getDynamicKeyboard(chatId, userText)
        });
      }
    }
    res.status(200).json({ ok: true, message: 'Brain Branding 24/7 Webhook Active' });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    res.status(200).json({ ok: true, error: err.message });
  }
}

const whatsappApp = require('./whatsapp.js');
app.use(whatsappApp);

// Endpoint to receive website conversion alerts and ping owner Telegram instantly
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

app.post('*', handleWebhookRequest);
app.get('*', (req, res) => res.json({ status: 'active', bot: '@Brainbranding_bot', service: 'Brain Branding 24/7 AI Engine (Telegram & WhatsApp)' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Brain Branding 24/7 AI Telegram & WhatsApp Engine running on port ${PORT}`);
});

module.exports = handleWebhookRequest;

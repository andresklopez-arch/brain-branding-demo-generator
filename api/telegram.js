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
    getUrlDemo: (negocio) => `https://brainbranding.com.mx/demos`
  }
};

const userStates = {};
const conversationHistory = {};
const visitsLog = [];

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

  const dynamicVariation = `${candidateReply}\n\nSi gustas, también podemos agendar una breve llamada de 5 a 10 minutos para revisar los detalles con calma. ☕`;
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

  // 0.2 Inicio de conversación (/start)
  if (userText === '/start') {
    const greetingName = userName ? ` ${userName}` : '';
    const welcome = `¡Hola${greetingName}! Qué gusto saludarte. 👋 Soy Andrés R de Brain Branding.\n\nDesarrollamos soluciones de software a la medida, asistentes conversacionales con Inteligencia Artificial y aplicaciones de alta conversión para empresas y negocios locales.\n\nPlatícame, ¿qué proyecto o área de tu empresa te gustaría automatizar o mejorar hoy?`;
    history.push({ role: 'model', text: welcome });
    return getUniqueReply(chatId, welcome);
  }

  // 0.3 Solicitud de Demos
  if (userText === '/demo' || textClean.includes('demo') || fuzzyClean.includes('demo') || textClean.includes('demostracion') || fuzzyClean.includes('demostracion') || textClean.includes('ejemplo')) {
    const reply = `Con mucho gusto te comparto nuestras demostraciones interactivas en vivo. 📱\n\nPuedes probar cómo funcionan nuestros desarrollos directamente en tu navegador desde tu celular o computadora:\n🌐 https://brainbranding.com.mx/demos\n\nAllí encontrarás simuladores de Punto de Venta (POS), Asistentes de Citas por IA y ERPs de gestión.\n\n¿De qué giro es tu negocio para sugerirte la demo más alineada a lo que buscas?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 0.4 Fase Cierre Listo
  if (state.conviction === 'TOTALMENTE' || textClean.includes('pasame la cuenta') || textClean.includes('datos bancarios') || textClean.includes('donde transfiero')) {
    state.temp = 'CITA_URGENTE';
    const reply = `¡Excelente decisión! Vamos a dejar tu sistema funcionando exactamente como lo necesitas.\n\nTe comparto los datos para coordinar la reunión de arranque o enviarte la información bancaria para el anticipo inicial (35%):\n\n📱 Contacto directo para arranque: https://wa.me/527712339238?text=Hola%20Andr%C3%A9s%20R,%20estoy%20listo%20para%20arrancar%20el%20proyecto.\n\n¿Prefieres que te llamemos hoy mismo o a qué hora te queda mejor?`;
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
    const rescueReply = `Entiendo perfectamente${greetingName}, sé que en el día a día el tiempo vuela. 🙌\n\nSin ningún compromiso, cuando tengas un par de minutos libres podemos coordinar una breve llamada de 5 minutos o te puedo enviar una propuesta rápida por WhatsApp para que la revises con calma.\n\nQuedo a la orden cuando te desocupes. ¡Que tengas un excelente día! ☕`;
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

  // 0.8 Giros Específicos de Negocio (Taller, Restaurantes, Clínicas, etc.)
  if (textClean.includes('hojalat') || textClean.includes('carroc') || textClean.includes('pintur') || textClean.includes('taller') || textClean.includes('mecanic') || textClean.includes('auto') || textClean.includes('vehic')) {
    state.giro = 'Taller Automotriz & Hojalatería';
    const reply = `¡Excelente giro! Para talleres mecánicos, de hojalatería y pintura desarrollamos soluciones muy prácticas:\n\n• **Recepción de Vehículos en Celular:** Capturas la orden con fotos de abolladuras y detalles desde el celular, generando la hoja de servicio al instante.\n• **Avisos Automáticos por WhatsApp:** El sistema notifica al cliente el avance de su vehículo (hojalatería, pintura o listo para entrega) sin que tengas que enviar mensajes a mano.\n• **Control de Presupuestos y Anticipos:** Manejo de reparaciones, refacciones y corte de caja.\n\nPuedes ver una demostración en vivo de este tipo de sistemas en:\n🌐 https://brainbranding.com.mx/demos\n\nCuéntame: ¿cómo llevan actualmente el control de las órdenes de servicio en tu taller?`;
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
    const reply = `Entiendo perfecto. Cuando trabajas por citas, contestar mensajes manuales quita muchísimo tiempo y a veces se pierden clientes por tardar en responder.\n\nCon un Asistente IA personalizado:\n1. El cliente consulta disponibilidad y agenda 24/7 por WhatsApp o Telegram.\n2. Se sincroniza con tu agenda en tiempo real.\n3. Envía recordatorios automáticos para evitar cancelaciones de última hora.\n\n¿Te gustaría ver un ejemplo de cómo agendaría un cliente en tu caso?`;
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
    const reply = `Nuestras oficinas de desarrollo se encuentran en Pachuca, Hidalgo, y brindamos servicio e implementación digital a clientes en todo México y Latinoamérica 🇲🇽🌎.\n\nTodo el desarrollo y las demostraciones se realizan en línea para tu mayor comodidad. ¿Te gustaría agendar una breve videollamada para conocernos?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('factura') || textClean.includes('cfdi') || textClean.includes('sat')) {
    const reply = `Así es, por supuesto. 📜 Todos nuestros desarrollos y servicios son 100% deducibles y emitimos factura fiscal CFDI 4.0.\n\n¿Requieres facturar a nombre de persona física o moral?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textClean.includes('cuanto tardan') || textClean.includes('tiempo de entrega')) {
    const reply = `Nuestros tiempos de entrega son muy ágiles:\n\n• **Asistentes IA y Bots:** De 24 a 48 horas operando en tu WhatsApp.\n• **Puntos de Venta (POS):** 24 horas.\n• **Software y Desarrollos a la Medida:** De 3 a 7 días hábiles.\n\n¿Para qué fecha te gustaría tener tu proyecto listo?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 1.0 Manejo natural de entradas cortas o genéricas ("hola", "ok", "bien", "saludos")
  const isShortInput = userText.trim().split(/\s+/).length <= 3;
  const genericWords = ['si', 'sí', 'ok', 'no', 'bien', 'hola', 'interesa', 'mm', 'a ver', 'saludos', 'gracias', 'grax', 'buenas', 'buenos dias', 'buenas tardes'];
  const isGeneric = genericWords.some(w => textLower === w || textLower === w + '.');

  if (isShortInput && isGeneric) {
    const greetingName = userName ? ` ${userName}` : '';
    const reply = `¡Con mucho gusto${greetingName}! Platícame un poquito sobre tu negocio o qué proyecto tienes en mente para orientarte de la mejor manera. ☕`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // 1.1 Respuesta fluida de seguimiento conversacional
  const reply = `Entiendo perfectamente lo que buscas. En Brain Branding nos especializamos en construir tecnología limpia y funcional adaptada a la manera exacta en que trabajas.\n\nSi gustas, platícame más sobre tu proceso actual o dime si prefieres revisar las demostraciones en vivo en la web: https://brainbranding.com.mx/demos 🌐`;
  history.push({ role: 'model', text: reply });
  return getUniqueReply(chatId, reply);
}

const express = require('express');
const app = express();
app.use(express.json());

const OWNER_PHONE = '+52 771 233 9238';
const ADMIN_CHAT_ID = '8337803949';

const pausedChats = {};
const prospectLogs = [];

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

async function notifyOwner(chatId, firstName, username, userText) {
  if (chatId.toString() === ADMIN_CHAT_ID) return;

  const state = userStates[chatId] || {};
  const convictionTag = state.conviction ? `🎯 *CONVICCIÓN:* ${state.conviction}` : '🎯 *CONVICCIÓN:* REGULAR';

  const textLower = (userText || '').toLowerCase();
  const isCitaClick = textLower.includes('cita') || textLower.includes('agend') || textLower.includes('whatsapp');

  const tempTag = isCitaClick ? '🔥 *[ALERTA DE CITA SOLICITADA POR WHATSAPP]*' : getLeadTemperature(userText);
  const isPaused = pausedChats[chatId] && pausedChats[chatId] > Date.now();
  const statusTag = isPaused ? '⏸️ *[MODO PAUSA ACTIVO - BOT SILENCIADO]*' : '🤖 *[RESPUESTA AUTOMÁTICA ENVIADA]*';

  prospectLogs.push({
    chatId,
    name: firstName || 'Prospecto',
    username: username || 'Sin username',
    text: userText,
    conviction: state.conviction || 'REGULAR',
    temp: isCitaClick ? 'CITA_URGENTE' : (tempTag.includes('CALIENTE') ? 'CALIENTE' : (tempTag.includes('TIBIO') ? 'TIBIO' : 'FRÍO')),
    timestamp: new Date().toLocaleTimeString('es-MX')
  });
  if (prospectLogs.length > 200) prospectLogs.shift();

  const alertHeader = isCitaClick ? '🚨 *¡PROSPECTO SOLICITÓ AGENDAR CITA EN WHATSAPP!* 🚨' : '🚨 *¡NUEVO MENSAJE DE PROSPECTO EN TELEGRAM!* 🚨';

  const alertText = `${alertHeader}\n\n${tempTag}\n${convictionTag}\n👤 *Cliente:* ${firstName || 'Prospecto'} (${username ? '@' + username : 'Sin Username'})\n💬 *Mensaje:* "${userText}"\n🆔 *Chat ID:* \`${chatId}\`\n📱 *Notificado a:* ${OWNER_PHONE}\n${statusTag}\n\n⚙️ *Comandos Rápido:* \`/pausa ${chatId}\` | \`/responder ${chatId} <mensaje>\` | \`/plantilla\`\n💡 *Tip de Intervención:* Responde (*Reply*) directamente a este mensaje para platicar con el cliente.`;

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

        if (cmdLower === '/visitas' || cmdLower === '/metricas' || cmdLower === '/resumen8am' || cmdLower === '/reporte_visitas') {
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
        await notifyOwner(chatId, firstName, username, userText);

        if (pausedChats[chatId] && pausedChats[chatId] > Date.now()) {
          console.log(`[PAUSED] Chat ${chatId} is currently taken over by owner. Skipping auto-reply.`);
          return res.status(200).json({ ok: true });
        }

        await callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' });
        const reply = generateHumanReply(chatId, firstName, userText);

        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown'
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

function buildDetailedAnalytics8AMReport(visits) {
  const total = visits.length;
  const nowStr = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', year: 'numeric', month: 'long', day: 'numeric' });

  if (total === 0) {
    return `☀️ *RESUMEN DIARIO DE VISITAS WEB (8:00 AM)* ☀️\n📅 *Fecha:* ${nowStr}\n\n📍 Sin visitas registradas en las últimas 24 horas.`;
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

  let report = `☀️ *RESUMEN DIARIO DE VISITAS WEB (8:00 AM)* ☀️\n`;
  report += `📅 *Fecha:* ${nowStr}\n`;
  report += `📊 *Total de Visitas Registradas:* *${total}*\n\n`;

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
  Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).forEach(([loc, count]) => {
    report += `• ${loc}: *${count} visitas* (${getPercent(count)}%)\n`;
  });
  report += `\n`;

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

  report += `\n💬 *Tip:* Escribe /resumen8am o /visitas en cualquier momento para generar este reporte consolidado.`;
  return report;
}

app.post('/api/track-visit', async (req, res) => {
  try {
    const { city, region, country, flag, source, device, isp, duration, scroll, clicks } = req.body || {};
    const record = {
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
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    };
    visitsLog.push(record);
    if (visitsLog.length > 500) visitsLog.shift();

    return res.status(200).json({ ok: true, totalVisits: visitsLog.length });
  } catch (err) {
    console.error('[TRACK VISIT ERROR]', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
});

app.get('/api/analytics-db', (req, res) => {
  return res.status(200).json({ ok: true, visits: visitsLog.slice(-100) });
});

let lastSummaryDate = '';
setInterval(async () => {
  try {
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
    const cdmxHour = parseInt(new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', hour12: false }).format(now), 10);

    // Fires at 8:00 AM CDMX time ONCE per day
    if (cdmxHour === 8 && lastSummaryDate !== currentDateStr) {
      lastSummaryDate = currentDateStr;
      
      const reportText = buildDetailedAnalytics8AMReport(visitsLog);

      await callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: reportText,
        parse_mode: 'Markdown'
      });
    }
  } catch (e) {
    console.error('[8AM DAILY SUMMARY ERROR]', e);
  }
}, 60000);

// Permanent SaaS Contracts Database & Endpoints
const contractsDB = {};

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
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      sha256Seal,
      signatureData: null
    };

    contractsDB[code] = contract;
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

app.get('/api/contracts-list', (req, res) => {
  return res.status(200).json({ ok: true, contracts: Object.values(contractsDB) });
});

app.post('*', handleWebhookRequest);
app.get('*', (req, res) => res.json({ status: 'active', bot: '@Brainbranding_bot', service: 'Brain Branding 24/7 AI Engine (Telegram & WhatsApp)' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Brain Branding 24/7 AI Telegram & WhatsApp Engine running on port ${PORT}`);
});

module.exports = handleWebhookRequest;

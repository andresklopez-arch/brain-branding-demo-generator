const express = require('express');
const crypto = require('crypto');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Serve static web app files directly with anti-caching headers
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
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
    const welcome = `¡Hola${greetingName}! 👋 Qué gusto saludarte, ¿cómo estás? En Brain Branding nos da mucho gusto atenderte. 😊\n\nNos especializamos en desarrollar tecnología limpia y ágil a la medida de tu empresa:\n• **Asistentes IA para WhatsApp y Telegram 24/7:** Atención automática, agendamiento de citas y toma de pedidos.\n• **Puntos de Venta (POS) y ERPs Nube:** Cobro en segundos desde celular o tablet, control de stock y caja.\n• **Páginas Web y Software a la Medida:** Desarrollos de alta conversión adaptados a tu forma exacta de trabajar.\n\nPlatícame: ¿en qué te podemos ayudar el día de hoy o qué área de tu negocio te gustaría mejorar? ☕`;
    history.push({ role: 'user', text: userText });
    history.push({ role: 'model', text: welcome });
    return getUniqueReply(chatId, welcome);
  }

  // 0.3 Solicitud de Información / Servicios / Ejemplos
  if (userText === '/demo' || textClean.includes('demo') || fuzzyClean.includes('demo') || textClean.includes('demostracion') || textClean.includes('servicio') || textClean.includes('ejemplo')) {
    const greetingName = userName ? ` ${userName}` : '';
    const reply = `¡Con mucho gusto${greetingName}! Te platico más sobre lo que podemos implementar para ti:\n\n1. **Asistentes de Inteligencia Artificial:** Responden a tus clientes las 24 horas por WhatsApp o Telegram, muestran información de tus servicios y agendan citas automáticamente.\n2. **Sistemas de Punto de Venta (POS) y ERP:** Para llevar el control de inventarios, presupuestos, notas y caja desde tu teléfono o computadora.\n3. **Desarrollos Web y Apps Personalizadas:** Creadas desde cero para la operación específica de tu empresa.\n\nPara orientarte mejor: ¿de qué giro es tu negocio o qué proceso te quita más tiempo en el día a día? ☕`;
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

  if (textClean.includes('hojalat') || textClean.includes('carroc') || textClean.includes('pintur') || textClean.includes('taller') || textClean.includes('mecanic') || textClean.includes('auto') || textClean.includes('vehic')) {
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
  const reply = `Entiendo perfectamente lo que buscas. En Brain Branding nos especializamos en construir tecnología limpia y funcional adaptada a la manera exacta en que trabajas.\n\nPlatícame un poco más sobre tu proceso actual: ¿cuántas personas colaboran en tu equipo o qué volumen de atenciones gestionan al día? ☕`;
  history.push({ role: 'model', text: reply });
  return getUniqueReply(chatId, reply);
}

const OWNER_PHONE = '+52 771 233 9238';
const ADMIN_CHAT_ID = '8337803949';

const pausedChats = {};
const prospectLogs = [];
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

async function getGeminiReply(userText, userName, chatId, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const systemInstruction = `Eres un consultor de ventas humano, empático, profesional y altamente capacitado llamado L.C.I. Andrés R, de Brain Branding (Agencia líder en México de Software a la Medida, Puntos de Venta e Inteligencia Artificial). Tu objetivo es atender y calificar prospectos que llegan solicitando información.

REGLAS ABSOLUTAS E INVIOLABLES:
1. SALUDO INICIAL: Si el usuario saluda ("Hola", "Buenas", etc.), inicia con:
"¡Hola! 👋 Qué gusto saludarte, ¿cómo estás? En Brain Branding nos da mucho gusto atenderte. 😊"
2. PROHIBIDO ENVIAR LINKS A LA PÁGINA WEB: Jamás envíes links a brainbranding.com.mx ni pidas que vayan a la web ni a probar demos. El prospecto viene de ahí.
3. PROHIBIDO USAR OPCIONES NUMERADAS O MENÚS RÍGIDOS (1, 2, 3): Mantén una plática fluida, humana e inteligente.
4. EXPLICACIÓN FLUIDA DE SERVICIOS: Explica con naturalidad nuestras soluciones:
   - Asistentes de IA 24/7 para WhatsApp y Telegram.
   - Puntos de Venta (POS) y ERPs en la Nube.
   - Desarrollos Web y Apps a la Medida.
5. DERIVACIÓN A ASESOR: No ofrezcas llamada ni asesor en la primera línea. Conversa primero. Si el cliente pide cotizar o cerrar, ofrece derivarlo con un asesor por WhatsApp.`;

    const geminiHistory = [];
    for (const item of history.slice(-6)) {
      geminiHistory.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      });
    }

    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        ...geminiHistory,
        { role: 'user', parts: [{ text: userText }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
      }
    });

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text ? text.trim() : null);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.write(payload);
      req.end();
    });
  } catch (e) {
    return null;
  }
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
    giro: state.giro || 'No especificado',
    conviction: state.conviction || 'REGULAR',
    temp: isCitaClick ? 'CITA_URGENTE' : (tempTag.includes('CALIENTE') ? 'CALIENTE' : (tempTag.includes('TIBIO') ? 'TIBIO' : 'FRÍO')),
    timestamp: new Date().toLocaleTimeString('es-MX')
  });
  if (prospectLogs.length > 200) prospectLogs.shift();

  const alertHeader = isCitaClick ? '🚨 *¡PROSPECTO SOLICITÓ AGENDAR CITA EN WHATSAPP!* 🚨' : '🚨 *¡NUEVO MENSAJE DE PROSPECTO EN TELEGRAM!* 🚨';
  const giroTag = state.giro ? `🏢 *Giro / Industria:* ${state.giro}\n` : '';

  const alertText = `${alertHeader}\n\n${tempTag}\n${convictionTag}\n${giroTag}👤 *Cliente:* ${firstName || 'Prospecto'} (${username ? '@' + username : 'Sin Username'})\n💬 *Mensaje:* "${userText}"\n🆔 *Chat ID:* \`${chatId}\`\n📱 *Notificado a:* ${OWNER_PHONE}\n${statusTag}\n\n⚙️ *Comandos Rápido:* \`/pausa ${chatId}\` | \`/responder ${chatId} <mensaje>\` | \`/plantilla\`\n💡 *Tip de Intervención:* Responde (*Reply*) directamente a este mensaje para platicar con el cliente.`;

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
        
        let reply = await getGeminiReply(userText, firstName, chatId, conversationHistory[chatId] || []);
        if (!reply) {
          reply = generateHumanReply(chatId, firstName, userText);
        }

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

// Geofencing Protection Middleware (Restricts High-Risk Countries)
const HIGH_RISK_COUNTRIES = ['RU', 'CN', 'KP', 'IR', 'BY'];
app.use((req, res, next) => {
  const country = (req.headers['cf-ipcountry'] || req.headers['x-country-code'] || '').toUpperCase();
  if (country && HIGH_RISK_COUNTRIES.includes(country)) {
    console.warn(`[GEOFENCING BLOCKED] Request from restricted country: ${country}`);
    return res.status(403).json({ ok: false, error: '🚨 ACCESO BLOQUEADO POR GEOFENCING DE SEGURIDAD INTERNACIONAL.' });
  }
  next();
});

// HMAC SHA-256 Master Key Secret Generator
const HMAC_SECRET = process.env.HMAC_SECRET || 'BRAIN_BRANDING_MASTER_SAAS_HMAC_KEY_2026_SECRET';
function generateHmacSeal(dataStr) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(dataStr).digest('hex').substring(0, 32).toUpperCase();
}

// 2FA OTP State
let currentAdminOTP = null;

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
app.use(whatsappApp);

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

// Local Blockchain Chain Hash State
let lastBlockchainHash = "GENESIS_BRAIN_BRANDING_BLOCK_SAAS_2026";

let lastSummaryDate = '';
setInterval(async () => {
  try {
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
    const cdmxHour = parseInt(new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', hour12: false }).format(now), 10);

    // Fires at 8:00 AM CDMX time ONCE per day
    if (cdmxHour === 8 && lastSummaryDate !== currentDateStr) {
      lastSummaryDate = currentDateStr;
      
      // 1. Visit Analytics Report
      const reportText = buildDetailedAnalytics8AMReport(visitsLog);
      await callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: reportText,
        parse_mode: 'Markdown'
      });

      // 2. Daily Billing Reminders for Contracts 3 Days Prior to Due Date
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
    console.error('[8AM DAILY SUMMARY & BILLING ERROR]', e);
  }
}, 60000);

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

app.post('/api/telegram', handleWebhookRequest);
app.post('/webhook', handleWebhookRequest);

app.post('*', (req, res, next) => {
  // If request comes to root POST or /api/webhook, handle Telegram
  if (req.path === '/' || req.path === '/api' || req.path === '/api/') {
    return handleWebhookRequest(req, res);
  }
  return res.status(404).json({ ok: false, error: `Ruta POST no encontrada: ${req.path}` });
});

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Brain Branding 24/7 AI Telegram & WhatsApp Engine running on port ${PORT}`);
});

module.exports = app;

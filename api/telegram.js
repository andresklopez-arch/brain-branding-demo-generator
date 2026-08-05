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
    const welcome = `¡Hola${greetingName}! 👋 Qué gusto saludarte.\n\nSoy Alejandro de Brain Branding. Desarrollamos Asistentes con Inteligencia Artificial, Software a la Medida y Páginas Web de alta conversión.\n\nPlatícame, ¿qué área de tu negocio o empresa te gustaría automatizar hoy?`;
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

  // Specific Business Triggers
  if (textLower.includes('jardinero') || textLower.includes('jardineria') || textLower.includes('jardinería') || textLower.includes('jardin') || textLower.includes('jardín') || textLower.includes('paisajismo') || textLower.includes('poda') || textLower.includes('plantas')) {
    state.giro = 'Jardinería & Mantenimiento de Áreas Verdes';
    const demoUrl = kb.generadorDemos.getUrlDemo('Jardinería & Paisajismo');
    const reply = `¡Excelente giro! 🌿 Para servicios de jardinería, paisajismo y mantenimiento, las mejores soluciones que implementamos son:\n\n• *Asistente IA para Agendar Citas:* Tus clientes solicitan visitas o cotizaciones por WhatsApp/Telegram y el bot organiza tu agenda automáticamente.\n• *Cotizador Móvil Rápido:* Envías presupuestos profesionales en PDF desde tu celular en 10 segundos.\n• *Catálogo Web de Trabajos:* Galería interactiva con tus proyectos realizados para transmitir máxima confianza.\n\n🌐 *Ver Demo para Jardinería:*\n${demoUrl}\n\nPlatícame: ¿Cómo agendan las citas o cotizan los servicios con tus clientes actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('cita') || textLower.includes('citas') || textLower.includes('agendar') || textLower.includes('agenda') || textLower.includes('agendamiento') || textLower.includes('horario') || textLower.includes('reserva') || textLower.includes('reservar')) {
    state.dolor = 'Agendamiento y gestión de citas';
    const reply = `¡Justo lo que automatizamos a la perfección! 📅 Cuando operas por citas, atender mensajes a mano quita tiempo valioso y provoca cancelaciones de último momento.\n\nCon nuestro **Asistente IA de Citas por WhatsApp/Telegram**:\n1. El cliente consulta tus horarios disponibles 24/7.\n2. El bot agenda la cita en tu calendario automáticamente.\n3. Envía un recordatorio 24 horas antes para confirmar la asistencia.\n\n¿Te gustaría probar una demo en vivo de cómo tus clientes agendarían su cita por WhatsApp?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('alimento') || textLower.includes('perro') || textLower.includes('perros') || textLower.includes('gato') || textLower.includes('mascota') || textLower.includes('croqueta') || textLower.includes('forrajera')) {
    state.giro = 'Venta de Alimentos para Mascotas / Pet Shop';
    const demoUrl = kb.generadorDemos.getUrlDemo('Venta de Alimentos para Mascotas');
    const reply = `¡Excelente giro! 🐾 Para venta de alimentos y artículos para mascotas, los retos principales son controlar inventario por bulto/kilo y agilizar el cobro en mostrador.\n\nNuestras soluciones clave son:\n• *POS con Integración de Báscula:* Pesa y calcula el precio por kilo al instante.\n• *Control de Inventario de Bultos:* Descuento automático de kilos del costal al vender a granel.\n• *Asistente IA por WhatsApp:* Atiende pedidos a domicilio y envía ubicación.\n\n🌐 *Ver Demo para Alimento de Mascotas:*\n${demoUrl}\n\nPlatícame: ¿Cómo registran el pesaje o las ventas en mostrador actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('pesar') || textLower.includes('pesado') || textLower.includes('pesando') || textLower.includes('bascula') || textLower.includes('báscula') || textLower.includes('granel') || textLower.includes('kilo') || textLower.includes('kilos')) {
    state.dolor = 'Pesaje manual a granel';
    const reply = `Entiendo perfecto. Pesar a mano y calcular precios por kilo quita mucho tiempo en mostrador y provoca errores en las cuentas. ⚖️\n\nJusto para eso conectamos el **Módulo de Pesaje con Báscula Electrónica Integrada**: al poner el producto en la báscula, el sistema lee el peso exacto en milisegundos y calcula el total sin fallas.\n\n¿Cómo realizan el cobro y registro de notas en caja actualmente?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('papel') || textLower.includes('lapiz') || textLower.includes('lápiz') || textLower.includes('cuaderno') || textLower.includes('libreta') || textLower.includes('mano') || textLower.includes('bitacora')) {
    state.cobro = 'Papel y lápiz / Libreta manual';
    const reply = `¡Nombre, con toda razón! Cobrar con papel y lápiz es un dolor de cabeza diario: las notas se traspapelan, toma minutos con cada cliente y al final del día el corte de caja nunca cuadra. 📄✏️\n\nCon nuestro **Brain POS Móvil**, registras la venta en 3 segundos desde una tablet o tu celular, emites el ticket y ves tu ganancia neta en vivo sin volver a tocar lápiz ni calculadora.\n\n¿Te gustaría que te preparemos una propuesta sin compromiso o ver una demostración en vivo?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('panaderia') || textLower.includes('panadería') || textLower.includes('pan') || textLower.includes('pasteleria') || textLower.includes('pastelería') || textLower.includes('reposteria')) {
    state.giro = 'Panadería & Pastelería';
    const demoUrl = kb.generadorDemos.getUrlDemo('Panadería & Pastelería');
    const reply = `¡Qué excelente giro! 🍞 Para panaderías y reposterías, las soluciones con mayor impacto son:\n\n• *Punto de Venta (POS) Táctil:* Registro rápido de pan dulce/blanco, corte de caja y control de inventario de insumos (harina, huevo, azúcar).\n• *Asistente IA por WhatsApp:* Toma pedidos de pasteles sobre diseño o encargos de pan mayoreo 24/7.\n• *Página Web Catálogo:* Folleto digital interactivo para mostrar tus especialidades.\n\n🌐 *Ver Demo en Vivo para Panadería:*\n${demoUrl}\n\nPlatícame: ¿Tienes una sola sucursal o varias? ¿O cuántos clientes/pedidos atienden al día aprox?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('modernizar') || textLower.includes('modernizarme') || textLower.includes('innovar') || textLower.includes('crecer') || textLower.includes('actualizar') || textLower.includes('cambiar') || textLower.includes('mejorar')) {
    const reply = `¡Extraordinaria visión! Modernizar la operación es la clave para liberar tu tiempo y acelerar ventas. 🚀\n\nPodemos sugerirte un Punto de Venta (POS) móvil, un Software de Gestión Personalizado o un Asistente IA por WhatsApp.\n\nPara armarte la propuesta ideal, platícame:\n1. ¿De qué giro es tu negocio y cuántas sucursales manejas actualmente?\n2. ¿Qué tanto has explorado o utilizado la Inteligencia Artificial en tus procesos diarios?\n3. ¿Cuál es esa meta o idea con la que has soñado para automatizar tu empresa?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('sucursal') || textLower.includes('sucursales') || textLower.includes('tiendas') || textLower.includes('varias')) {
    const reply = `¡Excelente! Cuando se manejan varias sucursales, el valor de nuestra solución se multiplica:\n\n• Sincronización en tiempo real de inventarios y caja de todas tus sucursales desde tu celular.\n• Asistente IA que deriva a los clientes a la sucursal más cercana automáticamente.\n\n¿Actualmente cómo controlas la venta y los inventarios entre tus sucursales?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  if (textLower.includes('idea') || textLower.includes('sueño') || textLower.includes('soñado') || textLower.includes('meta') || textLower.includes('proyecto')) {
    const reply = `¡Ese es el punto de partida perfecto! En Brain Branding nos apasiona convertir esas ideas ambiciosas en sistemas reales. 💡\n\nYa sea un Punto de Venta personalizado, una Plataforma Web visual o un Asistente IA 24/7, platícame tu idea con total libertad y le damos forma juntos.\n\n¿De qué trata tu negocio o proyecto?`;
    history.push({ role: 'model', text: reply });
    return getUniqueReply(chatId, reply);
  }

  // Anti-Repetition Fallback Queue
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

module.exports = async (req, res) => {
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
        const reply = generateHumanReply(chatId, firstName, userText);
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown'
        });
      }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    res.status(200).json({ ok: true, error: err.message });
  }
};

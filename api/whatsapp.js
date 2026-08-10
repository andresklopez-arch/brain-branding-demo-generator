/**
 * BRAIN BRANDING 24/7 WHATSAPP BOT ENGINE
 * Cloud Webhook Server for WhatsApp Business / Meta API / Twilio
 * Persona: Andrés R (+52 771 233 9238)
 */

const express = require('express');
const https = require('https');
const crypto = require('crypto');
const { getGeminiReply } = require('./geminiHelper.js');
const { getHistory, addTurn } = require('./historyStore.js');

const router = express.Router();
router.use(express.json());

const app = express();
app.use(express.json());
app.use(router);

const OWNER_PHONE = '+52 771 233 9238';
const ADMIN_CHAT_ID = '8337803949';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M';

const pausedWhatsapp = {};
const whatsappProspectLogs = [];

const kb = {
  agencia: {
    nombre: "Brain Branding",
    slogan: "Empoderando Marcas, Reprogramando Mentes",
    fundadores: "Andrés R & Equipo de Desarrollo Cybernético",
    telefono: "+52 771 233 9238",
    email: "contacto@brainbranding.com.mx",
    sitioWeb: "https://brainbranding.com.mx"
  },
  comercial: {
    activacionInicial: "$3,500 MXN (Pago Único)",
    mantenimientoNube: "$499 MXN / mes",
    garantiaCeroRiesgo: "Si el sistema no genera ventas o ahorra tiempo en los primeros 30 días, devolvemos el 100% de la inversión."
  }
};

const conversationHistory = {};

function verifyMetaSignature(req, res, next) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return next();
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(401).send('Signature missing');
  }
  const hmac = crypto.createHmac('sha256', appSecret);
  const digest = 'sha256=' + (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return next();
  }
  return res.status(401).send('Signature mismatch');
}

function callTelegramAdminAlert(text) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => resolve());
    req.on('error', () => resolve());
    req.write(postData);
    req.end();
  });
}

function sendWhatsappMessage(toPhone, messageText) {
  console.log(`[WHATSAPP OUTBOUND to ${toPhone}]: ${messageText.substring(0, 50)}...`);
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (token && phoneId) {
    const postData = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "text",
      text: { preview_url: true, body: messageText }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v19.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {});
    req.on('error', (e) => console.error('[WHATSAPP API ERROR]', e));
    req.write(postData);
    req.end();
  }
}

function getLeadTemperature(text) {
  const t = text.toLowerCase();
  if (t.includes('precio') || t.includes('costo') || t.includes('cuanto') || t.includes('cotizar') || t.includes('comprar') || t.includes('contratar') || t.includes('demo') || t.includes('cita') || t.includes('pagar')) {
    return '🔥 *LEAD CALIENTE (Alta Intención de Compra por WhatsApp)*';
  }
  if (t.includes('sucursal') || t.includes('modulo') || t.includes('taller') || t.includes('hojalat') || t.includes('jardin') || t.includes('tienda') || t.includes('pos')) {
    return '🟡 *LEAD TIBIO (Interés en Módulos / Giro)*';
  }
  return '❄️ *LEAD FRÍO (Contacto Inicial / Saludo)*';
}

async function generateHumanWhatsappReply(phone, name, userText) {
  const history = getHistory(phone);

  // Try Gemini AI response first
  const geminiReply = await getGeminiReply(userText, name, phone, history);
  if (geminiReply) {
    addTurn(phone, 'user', userText);
    addTurn(phone, 'model', geminiReply);
    return geminiReply;
  }

  addTurn(phone, 'user', userText);
  const textLower = userText.toLowerCase().trim();

  let reply = '';
  if (userText === '/start' || textLower.includes('hola') || textLower.includes('buenas') || textLower === 'buenos dias' || textLower === 'buenas tardes') {
    const greetingName = name ? ` ${name}` : '';
    reply = `¡Hola${greetingName}! 👋 Qué gusto saludarte.\n\nSoy Andrés R de Brain Branding. Desarrollamos Asistentes de Inteligencia Artificial 24/7, Puntos de Venta (POS) y Software a la Medida para negocios y empresas.\n\nPlatícame: ¿qué proyecto o área de tu empresa te gustaría automatizar o mejorar hoy? ☕`;
  } else if (textLower.includes('demo') || textLower.includes('demostracion') || textLower.includes('ejemplo')) {
    reply = `¡Con mucho gusto! En Brain Branding desarrollamos tecnología 100% a la medida según las necesidades de tu empresa.\n\nContamos con soluciones de Asistentes IA 24/7 para WhatsApp y Telegram, Puntos de Venta (POS) en la nube y ERPs de gestión operativa.\n\nPara orientarte de la mejor manera, platícame: ¿de qué giro es tu negocio y qué área o proceso te gustaría optimizar primero? ☕`;
  } else if (textLower.includes('precio') || textLower.includes('costo') || textLower.includes('cuanto cuesta') || textLower.includes('cotiz') || textLower.includes('inversio')) {
    reply = `Te platico con gusto sobre los presupuestos aproximados de referencia. 💰 En Brain Branding desarrollamos tecnología a la medida pensada para recuperar la inversión rápidamente.\n\nPor ejemplo:\n• **Asistente IA / Bot para WhatsApp:** Implementación desde $4,500 MXN (pago único de desarrollo e integración).\n• **Puntos de Venta (POS) y ERPs:** Servidor seguro y mantenimiento en la nube desde $290 a $490 MXN al mes (incluye soporte 24/7 y respaldos automáticos).\n\nPlatícame un poco más sobre lo que necesita tu negocio para darte un estimado exacto a la medida. ☕`;
  } else if (textLower.includes('punto de venta') || textLower.includes('pos') || textLower.includes('cobro') || textLower.includes('caja registradora')) {
    reply = `¡Con mucho gusto! Nuestros Puntos de Venta (POS) en la nube te permiten:\n\n• **Cobrar en Segundos:** Desde cualquier celular, tablet o lap con escáner de código de barras.\n• **Control Total de Inventarios:** Alertas automáticas de insumos o productos por agotarse.\n• **Corte de Caja Diario:** Reporte claro de ingresos en efectivo, tarjeta y transferencias desde $290 MXN/mes.\n\nPara recomendarte la configuración idónea: ¿de qué giro es tu negocio y qué productos o servicios vendes? ☕`;
  } else if (textLower.includes('autolavado') || textLower.includes('lavado de auto') || textLower.includes('carwash') || textLower.includes('car wash') || textLower.includes('lavadero')) {
    reply = `¡Excelente giro! Para autolavados y centros de estética automotriz implementamos soluciones muy prácticas:\n\n• **Punto de Venta Exprés para Autolavados:** Capturas el paquete de lavado (sencillo, detallado, encerado, vestiduras) por tipo de vehículo (sedán, SUV, camioneta) en 3 segundos desde celular o tablet.\n• **Ticket Digital por WhatsApp:** El cliente recibe su comprobante digital en su teléfono al dejar su auto.\n• **Aviso Automático de "Auto Listo":** Al terminar el lavado, el sistema notifica por WhatsApp al cliente para que pase a recogerlo.\n• **Control de Insumos y Corte de Caja:** Monitoreo de shampoo, cera, microfibras y reporte diario de caja.\n\nCuéntame: ¿cuántos autos lavan aproximadamente al día o qué paquetes manejan? ☕`;
  } else if (textLower.includes('hojalat') || textLower.includes('carroc') || textLower.includes('taller') || textLower.includes('mecanic') || (textLower.includes('auto') && !textLower.includes('autolavado'))) {
    reply = `¡Excelente giro! Para talleres mecánicos, de hojalatería y pintura desarrollamos soluciones muy prácticas:\n\n• **Recepción de Vehículos en Celular:** Capturas la orden con fotos de abolladuras y detalles desde el celular, generando la hoja de servicio al instante.\n• **Avisos Automáticos por WhatsApp:** El sistema notifica al cliente el avance de su vehículo sin enviar mensajes a mano.\n• **Control de Presupuestos y Anticipos:** Registro de reparaciones y corte de caja.\n\nCuéntame: ¿cómo llevan actualmente la recepción de vehículos y el control de las órdenes de servicio en tu taller?`;
  } else if (textLower.includes('jardin') || textLower.includes('poda') || textLower.includes('paisaj')) {
    reply = `¡Buenísimo! Para servicios de jardinería y mantenimiento de áreas verdes, las herramientas que más ayudan son:\n\n• Agendamiento Inteligente de Visitas por WhatsApp.\n• Cotizador Express en PDF desde tu celular en 1 minuto.\n• Catálogo Digital de Proyectos Realizados.\n\nPlatícame, ¿cuántos servicios o visitas atienden aproximadamente a la semana?`;
  } else if (textLower.includes('cita') || textLower.includes('agend') || textLower.includes('horari')) {
    reply = `Entiendo perfecto. Cuando trabajas por citas, contestar mensajes a mano quita tiempo valioso.\n\nCon un Asistente IA personalizado:\n1. El cliente consulta disponibilidad y agenda 24/7 por WhatsApp.\n2. Se sincroniza con tu calendario en tiempo real.\n3. Envía recordatorios automáticos para evitar cancelaciones.\n\n¿Te gustaría que diseñemos un flujo de agendamiento adaptado exactamente a tus horarios y servicios?`;
  } else {
    reply = `Entiendo perfectamente lo que buscas. En Brain Branding nos especializamos en construir tecnología limpia y funcional adaptada a la manera exacta en que trabajas.\n\nPlatícame un poco más sobre tu proceso actual: ¿cuántas personas colaboran en tu equipo o qué volumen de atenciones gestionan al día? ☕`;
  }

  addTurn(phone, 'model', reply);
  return reply;
}

router.post('/api/whatsapp/webhook', verifyMetaSignature, async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'whatsapp_business_account' && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      const fromPhone = msgObj.from;
      const contactObj = body.entry[0].changes[0].value.contacts ? body.entry[0].changes[0].value.contacts[0] : {};
      const name = contactObj.profile ? contactObj.profile.name : '';
      const text = msgObj.text ? msgObj.text.body : '';

      if (text) {
        whatsappProspectLogs.push({
          phone: fromPhone,
          name: name || 'Prospecto WhatsApp',
          text: text,
          timestamp: new Date().toLocaleTimeString('es-MX')
        });
        if (whatsappProspectLogs.length > 200) whatsappProspectLogs.shift();

        const tempTag = getLeadTemperature(text);
        callTelegramAdminAlert(`🚨 *¡NUEVO MENSAJE DE WHATSAPP!* 🚨\n\n${tempTag}\n👤 *Cliente:* ${name || 'Prospecto'} (\`${fromPhone}\`)\n💬 *Mensaje:* "${text}"`);

        if (!pausedWhatsapp[fromPhone] || pausedWhatsapp[fromPhone] < Date.now()) {
          const reply = await generateHumanWhatsappReply(fromPhone, name, text);
          sendWhatsappMessage(fromPhone, reply);
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } catch (e) {
    res.status(200).send('EVENT_RECEIVED');
  }
});

router.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'brainbranding2026')) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = { router, app, sendWhatsappMessage, whatsappProspectLogs, generateHumanWhatsappReply };

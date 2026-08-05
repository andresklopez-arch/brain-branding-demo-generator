/**
 * BRAIN BRANDING 24/7 WHATSAPP BOT ENGINE
 * Cloud Webhook Server for WhatsApp Business / Meta API / Twilio
 * Persona: Andrés R (+52 771 233 9238)
 */

const express = require('express');
const https = require('https');

const app = express();
app.use(express.json());

const OWNER_PHONE = '+52 771 233 9238';
const ADMIN_CHAT_ID = '8337803949'; // Owner's Telegram Chat ID for Emergency Alerts
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M';

const pausedWhatsapp = {}; // phone -> expiryTimestamp (30 min takeover pause)
const whatsappProspectLogs = []; // Daily WhatsApp lead tracker

// Master Knowledge Base (RAG)
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

const conversationHistory = {}; // phone -> history array

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

function generateHumanWhatsappReply(phone, name, userText) {
  if (!conversationHistory[phone]) conversationHistory[phone] = [];
  const history = conversationHistory[phone];

  history.push({ role: 'user', text: userText });
  if (history.length > 12) history.shift();

  const textLower = userText.toLowerCase();

  if (userText === '/start' || textLower.includes('hola') || textLower.includes('buenas')) {
    const greetingName = name ? ` ${name}` : '';
    const welcome = `¡Hola${greetingName}! 👋 Qué gusto saludarte.\n\nSoy *Andrés R* de *Brain Branding*. Desarrollamos Asistentes de Inteligencia Artificial 24/7, Puntos de Venta (POS) y Sistemas a la Medida por WhatsApp.\n\nPlatícame: ¿qué área de tu empresa o negocio te gustaría automatizar hoy? 🚀\n\nResponde únicamente con el número de tu interés:\n1️⃣ Controlar Ventas e Inventarios con POS Móvil 📱\n2️⃣ Agendar Citas y Cotizaciones Automáticas por WhatsApp 📅\n3️⃣ Probar Demostraciones Interactivas en Vivo 🌐`;
    history.push({ role: 'model', text: welcome });
    return welcome;
  }

  if (textLower === '1' || textLower.includes('opcion 1') || textLower.includes('pos')) {
    const reply = `¡Excelente! 🏪 Para negocios locales y comercios (talleres, tiendas, restaurantes, panaderías, etc.):\n\n• **POS Móvil & Nube:** Registras ventas en 3 segundos desde tu celular o tablet.\n• **Inventario Inteligente:** Descuento automático de stock e insumos.\n• **Tickets Digitales:** Envío directo al WhatsApp del cliente.\n\n🌐 *Probar Demo POS en Vivo:*\nhttps://brainbranding.com.mx/#simulador-pos\n\nPlatícame: ¿de qué giro es tu negocio o cuántas notas manejan al día?`;
    history.push({ role: 'model', text: reply });
    return reply;
  }

  if (textLower === '2' || textLower.includes('opcion 2') || textLower.includes('cita')) {
    const reply = `¡Extraordinaria opción! 📅 Para profesionales y servicios por cita o cotización (jardinería, consultorías, salud, talleres, etc.):\n\n• **Asistente IA 24/7:** Tus clientes agendan y cotizan solos por WhatsApp sin quitarte tiempo.\n• **Cotizador Express PDF:** Presupuestos profesionales en 10s.\n• **Recordatorios Automáticos:** Cero cancelaciones.\n\n🌐 *Probar Demo de Citas:*\nhttps://brainbranding.com.mx/#asistente-ia\n\nPlatícame: ¿qué servicio ofrecen o cómo agendan actualmente?`;
    history.push({ role: 'model', text: reply });
    return reply;
  }

  if (textLower === '3' || textLower.includes('opcion 3') || textLower.includes('demo')) {
    const reply = `¡Con mucho gusto! 🌐 Aquí tienes nuestras 3 Demos Interactivas en Vivo:\n\n1. 📱 *POS Móvil:* https://brainbranding.com.mx/#simulador-pos\n2. 🤖 *Asistente IA Citas:* https://brainbranding.com.mx/#asistente-ia\n3. 💻 *Catálogo & ERP:* https://brainbranding.com.mx/#simulador-web\n\n¿Cuál de estas demos te gustaría personalizar para tu marca?`;
    history.push({ role: 'model', text: reply });
    return reply;
  }

  if (textLower.includes('hojalat') || textLower.includes('carroc') || textLower.includes('taller') || textLower.includes('mecanic')) {
    const reply = `¡Excelente giro! 🚗 Para Talleres de Hojalatería, Pintura y Mecánica:\n\n• **Gestor Móvil de Órdenes:** Ingreso de autos con fotos de detalles y cotización por WhatsApp en 10s.\n• **Estatus Automáticos:** El bot le avisa al cliente ("Tu auto ya está listo para entrega 🚗✨").\n• **Anticipos y Caja:** Registro rápido de señas cobradas.\n\n🌐 *Ver Demo para Taller:*\nhttps://brainbranding.com.mx/#simulador-web\n\n¿Cómo le dan seguimiento a los autos en tu taller actualmente?`;
    history.push({ role: 'model', text: reply });
    return reply;
  }

  // Generic / Unforeseen Fallback
  const fallback = `Entiendo perfectamente. En *Brain Branding* diseñamos tecnología a la medida para automatizar tus ventas. 🚀\n\nPara mostrarte la solución exacta en 10 segundos, dime qué número describe mejor lo que buscas:\n\n1️⃣ Controlar Ventas e Inventario (POS Móvil) 📱\n2️⃣ Automatizar Citas y Cotizaciones por WhatsApp 🤖\n3️⃣ Desarrollar una Página Web o Sistema Personalizado 🌐`;
  history.push({ role: 'model', text: fallback });
  return fallback;
}

async function notifyOwnerWhatsappLead(phone, name, userText) {
  const isCita = userText.toLowerCase().includes('cita') || userText.toLowerCase().includes('agend') || userText === '2';
  const tempTag = isCita ? '🔥 *[ALERTA DE CITA EN WHATSAPP]*' : getLeadTemperature(userText);
  const isPaused = pausedWhatsapp[phone] && pausedWhatsapp[phone] > Date.now();
  const statusTag = isPaused ? '⏸️ *[MODO PAUSA ACTIVO]*' : '🤖 *[RESPUESTA AUTOMÁTICA ENVIADA]*';

  whatsappProspectLogs.push({
    phone,
    name: name || 'Prospecto WhatsApp',
    text: userText,
    timestamp: new Date().toLocaleTimeString('es-MX')
  });

  const alertText = `🚨 *¡NUEVO PROSPECTO EN WHATSAPP!* 🚨\n\n${tempTag}\n👤 *Cliente:* ${name || 'Prospecto'} (\`${phone}\`)\n💬 *Mensaje:* "${userText}"\n📱 *Notificado a:* ${OWNER_PHONE}\n${statusTag}\n\n⚙️ *Comandos:* \`/pausa ${phone}\` | \`/reanudar ${phone}\``;

  await callTelegramAdminAlert(alertText);
}

// Meta Webhook Verification Endpoint (GET)
app.get('/api/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'brainbranding123')) {
    console.log('[WHATSAPP WEBHOOK VERIFIED]');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

// Main Webhook Handler Endpoint (POST)
app.post('/api/whatsapp', async (req, res) => {
  try {
    const body = req.body || {};
    console.log('[WHATSAPP INBOUND PAYLOAD]', JSON.stringify(body).substring(0, 200));

    // Handle Meta WhatsApp Cloud API structure
    if (body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0].value) {
      const val = body.entry[0].changes[0].value;
      if (val.messages && val.messages[0]) {
        const msg = val.messages[0];
        const fromPhone = msg.from;
        const contactName = (val.contacts && val.contacts[0] && val.contacts[0].profile) ? val.contacts[0].profile.name : 'Prospecto';
        const text = msg.text ? msg.text.body : '[Mensaje Multimedia/Voz]';

        // 1. Alert Owner
        await notifyOwnerWhatsappLead(fromPhone, contactName, text);

        // 2. Check if paused
        if (pausedWhatsapp[fromPhone] && pausedWhatsapp[fromPhone] > Date.now()) {
          console.log(`[WHATSAPP PAUSED] ${fromPhone} taken over by Andrés R.`);
          return res.status(200).json({ status: 'paused' });
        }

        // 3. Generate & Send Reply
        const reply = generateHumanWhatsappReply(fromPhone, contactName, text);
        sendWhatsappMessage(fromPhone, reply);
      }
    }

    // Generic Webhook Fallback (Twilio / Custom Webhook payload)
    if (req.body.From && req.body.Body) {
      const fromPhone = req.body.From.replace('whatsapp:', '');
      const text = req.body.Body;
      await notifyOwnerWhatsappLead(fromPhone, 'Prospecto WhatsApp', text);

      if (!pausedWhatsapp[fromPhone] || pausedWhatsapp[fromPhone] <= Date.now()) {
        const reply = generateHumanWhatsappReply(fromPhone, 'Prospecto', text);
        sendWhatsappMessage(fromPhone, reply);
      }
    }

    res.status(200).json({ ok: true, service: 'Brain Branding WhatsApp Engine' });
  } catch (err) {
    console.error('[WHATSAPP WEBHOOK ERROR]', err);
    res.status(200).json({ ok: true, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Brain Branding 24/7 AI WhatsApp Bot Webhook running on port ${PORT}`);
  });
}

app.whatsappProspectLogs = whatsappProspectLogs;
module.exports = app;

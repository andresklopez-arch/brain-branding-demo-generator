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
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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
  // TODO: mientras WHATSAPP_APP_SECRET no esté configurado en Render, esto
  // deja pasar cualquier POST sin verificar (igual que antes) — hay que
  // configurarlo para que esta protección realmente entre en efecto.
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return next();

  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !req.rawBody) {
    return res.status(401).send('Signature missing');
  }

  // Antes esto nunca llamaba a .update()/.digest() en el HMAC, y comparaba
  // la firma de Meta contra JSON.stringify(req.body) (ni siquiera un HMAC
  // real, y además el body ya venía re-serializado por express.json, no
  // los bytes exactos que Meta firmó) — la verificación real de Meta
  // SIEMPRE fallaba. req.rawBody lo captura telegram.js en el parser
  // express.json() de más arriba, antes de que se pierdan los bytes
  // originales.
  const expectedDigest = 'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
  const expectedBuf = Buffer.from(expectedDigest);
  const providedBuf = Buffer.from(signature);
  if (expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)) {
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
    reply = `¡Hola${greetingName}! 👋 Qué gusto saludarte.\n\nSoy Andrés R de Brain Branding. Desarrollamos Asistentes de IA 24/7, Apps Móviles (Android & iOS / PWA), Puntos de Venta (POS) y Software a la Medida para negocios y empresas.\n\nPlatícame: ¿qué proyecto o área de tu empresa te gustaría automatizar o mejorar hoy? ☕`;
  } else if (textLower.includes('demo') || textLower.includes('demostracion') || textLower.includes('ejemplo')) {
    reply = `¡Con mucho gusto! En Brain Branding desarrollamos tecnología 100% a la medida según las necesidades de tu empresa.\n\nContamos con soluciones de Asistentes IA 24/7 para WhatsApp y Telegram, Apps Móviles (Android & iOS), Puntos de Venta (POS) en la nube y ERPs de gestión operativa.\n\nPara orientarte de la mejor manera, platícame: ¿de qué giro es tu negocio y qué área o proceso te gustaría optimizar primero? ☕`;
  } else if (textLower.includes('precio') || textLower.includes('costo') || textLower.includes('cuanto cuesta') || textLower.includes('cotiz') || textLower.includes('inversio')) {
    reply = `Te platico con gusto sobre los presupuestos aproximados de referencia. 💰 En Brain Branding desarrollamos tecnología a la medida pensada para recuperar la inversión rápidamente.\n\nPor ejemplo:\n• **Asistente IA / Bot para WhatsApp:** Implementación desde $4,500 MXN (pago único de desarrollo e integración).\n• **Apps Móviles (Android & iOS / PWA):** Desde $6,500 MXN (con notificaciones Push a pantalla de bloqueo y pagos en línea).\n• **Puntos de Venta (POS) y ERPs:** Servidor seguro y mantenimiento en la nube desde $290 a $490 MXN al mes (incluye soporte 24/7 y respaldos automáticos).\n\nPlatícame un poco más sobre lo que necesita tu negocio para darte un estimado exacto a la medida. ☕`;
  } else if (textLower.includes('app') || textLower.includes('aplicacion') || textLower.includes('movil') || textLower.includes('android') || textLower.includes('ios') || textLower.includes('play store') || textLower.includes('app store') || textLower.includes('iphone')) {
    reply = `¡Excelente! En Brain Branding desarrollamos Aplicaciones Móviles (Apps) nativas y PWA a la medida para Android e iOS (iPhone):\n\n• **Apps de Venta y Pedidos para Clientes:** Catálogo digital con cobro en tarjeta (Stripe/Mercado Pago) y notificaciones push ilimitadas a la pantalla de bloqueo.\n• **Apps PWA de Instalación Instantánea:** El cliente la instala en 1 clic desde el navegador sin pagar comisiones a tiendas.\n• **Apps Operativas para Empleados:** Control de repartidores, citas, inventarios y comandas en tiempo real.\n• **Servicio Llave en Mano:** Nos encargamos de todo el registro y publicación oficial en Google Play Store y Apple App Store.\n\n🌐 Demo: https://brain-branding.web.app/#demo-apps\n\nPlatícame: ¿qué función principal te gustaría que tenga tu App o para quién estará dirigida? ☕`;
  } else if (textLower.includes('punto de venta') || textLower.includes('pos') || textLower.includes('cobro') || textLower.includes('caja registradora')) {
    reply = `¡Con mucho gusto! Nuestros Puntos de Venta (POS) en la nube te permiten:\n\n• **Cobrar en Segundos:** Desde cualquier celular, tablet o lap con escáner de código de barras.\n• **Control Total de Inventarios:** Alertas automáticas de insumos o productos por agotarse.\n• **Corte de Caja Diario:** Reporte claro de ingresos en efectivo, tarjeta y transferencias desde $290 MXN/mes.\n\n🌐 Demo: https://brain-branding.web.app/#demo-pos\n\nPara recomendarte la configuración idónea: ¿de qué giro es tu negocio y qué productos o servicios vendes? ☕`;
  } else if (textLower.includes('purificadora') || textLower.includes('garrafon') || textLower.includes('planta de agua')) {
    reply = `¡Gran giro! Para purificadoras de agua y venta de garrafones implementamos:\n\n• **Cobro Exprés:** Registro de recarga de garrafón y envase nuevo en 2 segundos.\n• **Rutas de Repartidores por WhatsApp:** Toma de pedidos 24/7 con ubicación GPS del cliente.\n• **Control de Tapas y Filtros:** Monitoreo de insumos y corte de caja por turno.\n\n🌐 Demo: https://brain-branding.web.app/#demo-purificadora\n\n¿Tienen únicamente mostrador o cuentan con reparto a domicilio? ☕`;
  } else if (textLower.includes('tortilleria') || textLower.includes('molino') || textLower.includes('nixtamal') || textLower.includes('tortilla')) {
    reply = `¡Excelente giro! Para tortillerías y molinos de nixtamal desarrollamos:\n\n• **Cobro Táctil Exprés:** Botones de importe exacto ($10, $20, $50) y kilos para cobro en 2 segundos.\n• **Control de Reparto a Taquerías:** Notas de entrega a crédito o contado para clientes mayoristas.\n• **Rendimiento de Harina y Maíz:** Registro de bultos procesados por masa.\n\n🌐 Demo: https://brain-branding.web.app/#demo-tortilleria\n\n¿Surten pedidos a taquerías o atienden únicamente mostrador? ☕`;
  } else if (textLower.includes('imprenta') || textLower.includes('sublimac') || textLower.includes('taza') || textLower.includes('serigraf') || textLower.includes('lona')) {
    reply = `¡Buenísimo giro! Para imprentas, centros de sublimación y publicidad implementamos:\n\n• **Cotizador Expres:** Precios automáticos en tazas, lonas, playeras y volantes.\n• **Control de Anticipos (50%):** Registro de abono para enviar a producción y saldo contra entrega.\n• **Avisos de "Trabajo Listo" por WhatsApp:** Notificación automática al cliente cuando su pedido esté listo.\n\n🌐 Demo: https://brain-branding.web.app/#demo-imprenta\n\n¿Qué tipo de trabajos realizan con mayor frecuencia? ☕`;
  } else if (textLower.includes('carniceria') || textLower.includes('polleria') || textLower.includes('cremeria') || textLower.includes('salchichoneria')) {
    reply = `¡Excelente giro! Para carnicerías, pollerías y cremerías implementamos:\n\n• **Cobro Táctil Exprés:** Captura por kilos, gramos o peso exacto.\n• **Control de Inventarios y Cámara Fría:** Entrada de canales, cortes y mermas.\n• **Corte de Caja Diario:** Control exacto de ventas en efectivo, tarjeta y transferencias.\n\n🌐 Demo: https://brain-branding.web.app/#demo-carniceria\n\n¿Manejan únicamente menudeo o surten a taquerías y banquetes? ☕`;
  } else if (textLower.includes('farmacia') || textLower.includes('botica') || textLower.includes('medicamento')) {
    reply = `¡Un giro fundamental! Para farmacias y boticas de barrio implementamos:\n\n• **Búsqueda de Genéricos y Patentes:** Consulta rápida por ingrediente activo o sustancia.\n• **Alerta de Caducidades Próximas:** Reporte automático de lotes por vencer.\n• **Módulo de Consultorio Anexo:** Registro de recetas y consultas médicas.\n\n🌐 Demo: https://brain-branding.web.app/#demo-farmacia\n\n¿Cuentan con consultorio médico anexo o únicamente mostrador? ☕`;
  } else if (textLower.includes('materiales') || textLower.includes('cemento') || textLower.includes('varilla') || textLower.includes('bloquera')) {
    reply = `¡Excelente giro! Para casas de materiales de construcción y bloqueras desarrollamos:\n\n• **Venta por Viajes y Bultos:** Cotizaciones rápidas de cemento, varilla, arena y tabique.\n• **Control de Fletes:** Remisiones a choferes con cobro a contraentrega.\n• **Créditos a Maestros de Obra:** Estado de cuenta claro con notas firmadas.\n\n🌐 Demo: https://brain-branding.web.app/#demo-materiales\n\n¿Cuenta con camiones propios para entrega en obra? ☕`;
  } else if (textLower.includes('balneario') || textLower.includes('cabana') || textLower.includes('cabaña') || textLower.includes('hotel') || textLower.includes('posada')) {
    reply = `¡Excelente giro turístico! Para cabañas, hoteles, balnearios y parques turísticos:\n\n• **Reservación 24/7 por WhatsApp:** Fotos, tarifas y disponibilidad de cabañas u habitaciones.\n• **Anticipos y Comprobantes:** Confirmación automática de reserva.\n• **Punto de Venta para Consumos:** Cobro en restaurante, accesos a albercas y actividades.\n\n🌐 Demo: https://brain-branding.web.app/#demo-turismo\n\n¿Cuántas cabañas o habitaciones manejan? ☕`;
  } else if (textLower.includes('contacten') || textLower.includes('llamen') || textLower.includes('contactame') || textLower.includes('llamada') || textLower.includes('llamarme') || textLower.includes('marquen')) {
    reply = `¡Con mucho gusto! De inmediato registramos tu solicitud de contacto. 📲\n\nPor favor, compárteme tu **número telefónico de 10 dígitos o WhatsApp** y dinos en qué horario te resulta más cómodo recibir nuestra llamada. ☕`;
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

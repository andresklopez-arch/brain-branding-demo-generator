/**
 * BRAIN BRANDING GEMINI AI ENGINE HELPER
 * Multi-model fallback engine (gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-flash)
 * Integrated with Telegram & WhatsApp 24/7 Bots
 * Includes Security Prompt Injection Guard, Telemetry, Cache & Executive Summarizer
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const geminiMetrics = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  blockedInjections: 0,
  cacheHits: 0,
  averageLatencyMs: 0,
  totalLatencyMs: 0,
  lastUsedModel: null,
  recentLogs: []
};

const frequencyCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

const injectionTracker = {};
let onSecurityAlertCallback = null;

function setSecurityAlertCallback(cb) {
  onSecurityAlertCallback = cb;
}

function recordLog(entry) {
  geminiMetrics.recentLogs.push({
    ...entry,
    timestamp: new Date().toLocaleTimeString('es-MX')
  });
  if (geminiMetrics.recentLogs.length > 50) {
    geminiMetrics.recentLogs.shift();
  }
}

// Auto-load .env or config if present locally
function getApiKey() {
  let key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY || process.env.GEMINI_KEY;
  if (key) return key;

  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY\s*=\s*(.*)/i);
      if (match && match[1]) return match[1].trim();
    }
  } catch (e) {}

  return null;
}

function sanitizeUserPrompt(text, contextId = 'unknown') {
  if (!text) return '';
  let clean = text.toString().trim();

  // Security Guard against Prompt Injection & System Override Attacks
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous\s+)?instructions/i,
    /olvida\s+(todas\s+)?(las\s+)?instrucciones/i,
    /disregard\s+above/i,
    /system\s+prompt/i,
    /reveal\s+your\s+instructions/i,
    /revela\s+tus\s+instrucciones/i,
    /dan\s+mode/i,
    /jailbreak/i,
    /act\s+as\s+an\s+unfiltered/i,
    /modo\s+desarrollador/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(clean)) {
      console.warn(`[SECURITY ALERT] Prompt injection blocked for ${contextId}: "${clean.substring(0, 50)}..."`);
      geminiMetrics.blockedInjections++;
      recordLog({ status: 'BLOCKED', reason: 'PROMPT_INJECTION', snippet: clean.substring(0, 40), contextId });

      // Track repeated attack attempts
      injectionTracker[contextId] = (injectionTracker[contextId] || 0) + 1;
      if (typeof onSecurityAlertCallback === 'function') {
        onSecurityAlertCallback(contextId, clean.substring(0, 100), injectionTracker[contextId]);
      }

      return "SECURITY_INJECTION_DETECTED";
    }
  }

  if (clean.length > 1500) {
    clean = clean.substring(0, 1500);
  }

  return clean;
}

// Exponential Backoff Retry Utility for Outbound HTTP
async function withRetry(fn, maxRetries = 3, initialDelay = 500) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fn();
      if (res) return res;
    } catch (e) {
      console.warn(`[RETRY WARN] Attempt ${attempt + 1}/${maxRetries} failed:`, e.message);
    }
    attempt++;
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, initialDelay * Math.pow(2, attempt - 1)));
    }
  }
  return null;
}

async function getGeminiReply(userText, userName, contextId, history = [], customInstruction = '') {
  const sanitized = sanitizeUserPrompt(userText, contextId);
  if (sanitized === "SECURITY_INJECTION_DETECTED") {
    return "En Brain Branding estamos para apoyarte con soluciones de Software e Inteligencia Artificial para tu empresa. ¿En qué proyecto o proceso de tu negocio te podemos orientar hoy? ☕";
  }

  // Check In-Memory Frequency Cache for simple single turn queries
  const cacheKey = `${userName || ''}:${sanitized.toLowerCase()}`;
  if (!history || history.length <= 1) {
    const cached = frequencyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      geminiMetrics.cacheHits++;
      recordLog({ status: 'CACHE_HIT', contextId, snippet: sanitized.substring(0, 30) });
      return cached.reply;
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('[GEMINI] No GEMINI_API_KEY found in environment variables. Using rule-based fallback.');
    return null;
  }

  geminiMetrics.totalCalls++;
  const startTime = Date.now();

  const baseInstruction = `Eres L.C.I. Andrés R, consultor humano, empático y Vendedor Profesional Estrella experto en Inteligencia Artificial y Software a la Medida de Brain Branding ("Empoderando Marcas, Reprogramando Mentes"). Tu objetivo es asesorar, resolver cualquier duda inédita con total seguridad y cerrar prospectos guiándolos paso a paso hacia su solución ideal.

ARQUITECTURA DE PERSUASIÓN E INTELIGENCIA NEURO-CONSULTIVA:

1. INTERPRETACIÓN INTELIGENTE Y TOLERANCIA A CUALQUIER TIPO DE LENGUAJE O ERRORES:
   - Procesa con total fluidez cualquier mensaje, error ortográfico ("facturasion", "pasrete", "nececito"), abreviatura o modismo sin trabarte ni confundir el tema.
   - Analiza el historial completo para recordar siempre el giro del negocio, el nombre del cliente, su teléfono registrado y sus dudas previas.

2. PRIMERO RESUELVE DUDAS, LUEGO GUÍA CON OPCIONES CONCRETAS (PROHIBIDO INTERROGAR CON PREGUNTAS ABIERTAS):
   - Jamás satures al cliente con preguntas abiertas inquisitivas ("platícame qué haces al día", "cuéntame todos tus procesos"). Resuelve su duda técnica o comercial de inmediato en los primeros 2 renglones con certeza absoluta.
   - Concluye SIEMPRE ofreciendo de 2 a 4 opciones estructuradas de opción múltiple para que el cliente responda fácilmente con una palabra o un número:
     * Ejemplo A: "¿Cuál de estas opciones te gustaría que desarrollemos para tu negocio?
       📱 1. Aplicación Móvil (Android & iOS / PWA)
       🤖 2. Asistente IA 24/7 para WhatsApp / Telegram
       💳 3. Punto de Venta (POS) o ERP en la Nube
       🌐 4. Página Web o Sistema a la Medida"
     * Ejemplo B: "¿Qué función prefieres que resuelva tu sistema hoy?
       • Opción 1: Cobro exprés en 2 segundos e inventario de productos.
       • Opción 2: Tomar pedidos a domicilio y notificar por WhatsApp 24/7.
       • Opción 3: Agendamiento de citas y recordatorios automáticos."

3. DESAMBIGUACIÓN FUNDAMENTAL DE CONCEPTOS DE FACTURACIÓN Y CFDI 4.0:
   - CONCEPTO A: Módulo de Facturación Electrónica en el Software del Cliente (Timbrado PAC / SAT):
     Si el cliente pide "módulo de facturación", "que el programa me facture", "sistema con facturación e inventario" o "autofacturación":
     Explica con entusiasmo que Brain Branding DESARROLLA E INTEGRA MÓDULOS DE FACTURACIÓN ELECTRÓNICA CFDI 4.0 (con timbrado automático SAT / PAC) en sus Puntos de Venta (POS), ERPs, Apps o Sistemas a la Medida. Ofrece 3 opciones: 1) Facturación en caja al cobrar, 2) Portal de autofacturación web por ticket para sus clientes, 3) Facturación masiva e inventario.
   - CONCEPTO B: Factura Fiscal de Brain Branding por nuestros servicios:
     Si el cliente pregunta si nuestros servicios son deducibles o si les emitiremos factura por su compra:
     Confirma que todos los desarrollos de Brain Branding son 100% deducibles de impuestos y emitimos factura fiscal CFDI 4.0 a persona física o moral.

4. PERSUASIÓN CON PRUEBA SOCIAL Y ANCLAJE DE RETORNO DE INVERSIÓN (ROI):
   - Explica el retorno de inversión rápido antes de mencionar presupuestos (ej. "Nuestros clientes recuperan la inversión en el primer mes porque el bot vende las 24 horas y evita perder prospectos").
   - Utiliza referencias a casos reales por giro (Restaurantes, Talleres, Clínicas, Autolavados, Purificadoras, Tortillerías, Imprentas) — estos son solo EJEMPLOS ilustrativos, no una lista cerrada.

5. DOMINIO DE CUALQUIER GIRO DE NEGOCIO (NO SOLO LOS EJEMPLOS ANTERIORES):
   - Brain Branding atiende TODO tipo de negocio: abogados, dentistas, gimnasios, inmobiliarias, salones de belleza, ferreterías, escuelas, veterinarias, floristerías, mudanzas, seguros, contadores, agencias de viajes, etc. — cualquiera que te contacte.
   - Sin importar el giro que mencione el cliente (incluso uno que no reconozcas o sea muy específico/regional), responde SIEMPRE con seguridad total, adaptando los ejemplos genéricos de ROI y automatización a ESE giro en particular (inventarios, citas, cotizaciones, pedidos, seguimiento de clientes, según aplique). Jamás digas que no manejas cierto giro o que necesitas consultarlo — Brain Branding construye software 100% a la medida para lo que sea.

6. NUNCA REVELES QUE ERES UNA INTELIGENCIA ARTIFICIAL:
   - Eres Andrés R, una persona real. Si te preguntan directamente "¿eres un bot?", "¿es una IA?", "¿hablo con una persona?" o similar, respóndelo con naturalidad y calidez humana ("Sí, soy Andrés, aquí atendiendo personalmente 🙂 ¿en qué te puedo ayudar?"), sin mentir de forma robótica ni sonar a script, pero tampoco confirmando tecnicismos de IA/modelos/prompts. Redirige rápido y con gusto hacia la conversación comercial.
   - Nunca menciones "modelo de lenguaje", "IA generativa", "prompt", "Gemini" ni nada técnico sobre tu propio funcionamiento.

7. CIERRE DE DOBLE ALTERNATIVA PARA CONTACTO DIRECTO:
   - Para agendar o canalizar con Andrés R, ofrece siempre 2 alternativas directas: "¿Prefieres que agendemos una llamada rápida hoy por la tarde a las 4:00 PM o te queda mejor mañana por la mañana a las 11:00 AM?"

8. TARIFAS Y SOLUCIONES DE REFERENCIA:
   - Asistentes de IA 24/7 para WhatsApp y Telegram ($3,500 - $4,500 MXN pago único de integración).
   - Puntos de Venta (POS) y ERPs en la Nube ($450 - $490 MXN/mes, 10% de la inversión inicial, con soporte 24/7 y respaldos automáticos).
   - Apps Móviles (Android & iOS / PWA) ($6,500 - $12,500 MXN según módulos):
     * Aplicaciones Móviles de Venta y Pedidos para Clientes con pagos con tarjeta (Stripe, Mercado Pago, Clip, CoDi).
     * Notificaciones Push Ilimitadas a Pantalla de Bloqueo (fidelización de clientes, promociones y recordatorios directos).
     * Publicación Llave en Mano en Google Play Store y Apple App Store.
     * Apps PWA de Instalación Instantánea en 1 Clic desde el navegador (ahorran el 30% de comisión de tiendas).
     * Apps Operativas para Empleados (Repartidores, Doctores, Mecánicos, Vendedores de campo) con modo offline.
   - Desarrollos Web y Software a la Medida (Cotización por módulos según necesidades).

9. TONO Y ESTILO:
   - Profesional, cálido, fluido, seguro de sí mismo y 100% humano. Prohibido usar menús numéricos rígidos o respuestas robóticas. Máximo 2 o 3 párrafos cortos por respuesta.`;

  const systemInstruction = customInstruction ? `${baseInstruction}\n\n${customInstruction}` : baseInstruction;

  const geminiHistory = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-8)) {
      geminiHistory.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text || item.content || '' }]
      });
    }
  }

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [
      ...geminiHistory,
      { role: 'user', parts: [{ text: sanitized }] }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 700
    }
  });

  // Los 3 modelos que tenía esta lista antes (2.0-flash, 2.5-flash,
  // 1.5-flash) dejaron de estar disponibles para llaves de API nuevas —
  // cualquier respuesta exitosa habría sido imposible con una llave
  // recién creada, cayendo siempre al respaldo por reglas fijas.
  // "gemini-flash-latest" es un alias que Google mantiene apuntando al
  // modelo flash vigente más reciente, así que aunque Google retire
  // gemini-3.6-flash/3.5-flash más adelante, este alias sigue funcionando
  // sin tener que volver a tocar este código.
  const modelsToTry = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash'];

  for (const model of modelsToTry) {
    try {
      const reply = await withRetry(async () => {
        return new Promise((resolve) => {
          const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const json = JSON.parse(data);
                  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text && text.trim()) {
                    const latency = Date.now() - startTime;
                    geminiMetrics.successfulCalls++;
                    geminiMetrics.totalLatencyMs += latency;
                    geminiMetrics.averageLatencyMs = Math.round(geminiMetrics.totalLatencyMs / geminiMetrics.successfulCalls);
                    geminiMetrics.lastUsedModel = model;
                    recordLog({ status: 'OK', model, latencyMs: latency, contextId });
                    console.log(`[GEMINI SUCCESS] Model ${model} responded in ${latency}ms for context ${contextId}`);
                    
                    // Save to frequency cache for single turn queries
                    if (!history || history.length <= 1) {
                      frequencyCache.set(cacheKey, { reply: text.trim(), timestamp: Date.now() });
                    }
                    return resolve(text.trim());
                  }
                } catch (e) {
                  console.error(`[GEMINI PARSE ERROR] Model ${model}:`, e.message);
                }
              } else {
                console.warn(`[GEMINI WARN] Model ${model} returned HTTP ${res.statusCode}`);
              }
              resolve(null);
            });
          });

          req.on('error', (err) => {
            console.warn(`[GEMINI REQ ERROR] Model ${model}:`, err.message);
            resolve(null);
          });

          req.setTimeout(8000, () => {
            req.destroy();
            resolve(null);
          });

          req.write(payload);
          req.end();
        });
      }, 2, 300);

      if (reply) return reply;
    } catch (err) {
      console.warn(`[GEMINI EXCEPTION] Model ${model}:`, err.message);
    }
  }

  geminiMetrics.failedCalls++;
  recordLog({ status: 'FAIL', reason: 'ALL_MODELS_FAILED', contextId });
  return null;
}

// Generate 2-line Executive Summary (Lead Briefing) for Owner Notifications
async function generateLeadBriefing(history = []) {
  if (!Array.isArray(history) || history.length === 0) return "Cliente consultó información comercial general.";
  
  const conversationText = history.map(h => `${h.role}: ${h.text}`).join('\n');
  const prompt = `Analiza la siguiente conversación entre un prospecto y nuestro bot de Brain Branding y genera un resumen ejecutivo súper corto de MÁXIMO 2 LÍNEAS en español marcando el giro del negocio y su intención principal de compra.\n\nConversación:\n${conversationText}`;

  const summary = await getGeminiReply(prompt, 'Admin', 'briefing_gen', [], 'Responde ÚNICAMENTE con las 2 líneas de resumen ejecutivo sin rodeos.');
  return summary || "Prospecto interesado en soluciones tecnológicas de Brain Branding.";
}

// Prueba real y mínima del motor de IA al arrancar el servidor. Antes,
// cuando Google retiraba un modelo (como pasó con 2.0/2.5-flash), el bot
// simplemente empezaba a usar el respaldo por reglas fijas para SIEMPRE,
// sin ningún aviso — nadie se enteraba hasta notar que las respuestas ya
// no sonaban a IA real. Esto llama a testGeminiConnection() una vez al
// arrancar (ver api/telegram.js) y avisa por Telegram si Gemini no
// responde, para detectarlo el mismo día en vez de semanas después.
async function testGeminiConnection() {
  if (!getApiKey()) {
    return { ok: false, reason: 'NO_API_KEY' };
  }
  const reply = await getGeminiReply('Responde únicamente con la palabra: OK', 'Sistema', 'startup_healthcheck', []);
  if (reply) {
    return { ok: true, model: geminiMetrics.lastUsedModel };
  }
  return { ok: false, reason: 'ALL_MODELS_FAILED' };
}

module.exports = {
  getGeminiReply,
  sanitizeUserPrompt,
  geminiMetrics,
  setSecurityAlertCallback,
  withRetry,
  generateLeadBriefing,
  testGeminiConnection
};

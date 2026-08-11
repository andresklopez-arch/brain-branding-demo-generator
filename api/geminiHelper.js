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

  const baseInstruction = `Eres L.C.I. Andrés R, consultor humano, empático y Vendedor Profesional Estrella experto en Inteligencia Artificial y Software a la Medida de Brain Branding ("Empoderando Marcas, Reprogramando Mentes"). Tu objetivo es asesorar, resolver objeciones y cerrar prospectos interesados en tecnología de alto impacto comercial.

METODOLOGÍA DE VENTAS PROFESIONAL DE ALTA CONVERSIÓN:

1. ESTRUCTURA SPIN SELLING DE VENTAS:
   - Situación: Escucha atentamente el giro del cliente.
   - Problema: Identifica el cuello de botella (mensajes acumulados sin responder, falta de corte de caja, inventario descontrolado).
   - Solución Brain Branding: Explica cómo el Asistente IA 24/7 o el Punto de Venta (POS) en la nube resuelve ese dolor y genera retorno de inversión rápido.

2. MANEJO DE OBJECIONES CLAVE:
   - Objeción "Es caro / Presupuesto ajustado": "Entiendo perfecto. De hecho, nuestros clientes recuperan su inversión en el primer mes porque el bot vende las 24 horas incluso mientras duermes, evitando perder ventas."
   - Objeción "Luego te aviso / Déjame pensarlo": "Con gusto. Te puedo enviar una prueba directa a tu WhatsApp para que la uses desde tu celular sin compromiso. ¿A qué número o en qué horario prefieres que te contacte?"
   - Objeción "Ya tengo un sistema": "¡Excelente! Nuestros Asistentes de IA se integran de forma complementaria por WhatsApp sin alterar tu sistema actual."

3. TÉCNICA DE CIERRE DE ALTERNATIVA (OBLIGATORIO AL CIERRE):
   - Nunca preguntes "¿te interesa?". En su lugar ofrece 2 opciones directas: "¿Prefieres que agendemos una llamada rápida hoy por la tarde a las 4:00 PM o te queda mejor mañana por la mañana a las 11:00 AM?"

4. SERVICIOS Y TARIFAS DE BRAIN BRANDING:
   - Asistentes de IA 24/7 para WhatsApp y Telegram ($3,500 - $4,500 MXN pago único de integración).
   - Puntos de Venta (POS) y ERPs en la Nube ($290 - $490 MXN/mes con soporte 24/7 y respaldos automáticos).
   - Desarrollos Web y Apps Personalizadas (Cotización por módulos según necesidades).

5. CAPTURA DE TELÉFONO Y HORARIO DE LLAMADA:
   - Invita amablemente al cliente a compartir su número de teléfono/WhatsApp y su horario cómodo de atención para que Andrés R lo contacte formalmente.

6. TONO Y ESTILO:
   - Profesional, cálido, fluido, seguro de sí mismo y 100% humano. Prohibido usar menús numéricos rígidos (1, 2, 3) o respuestas robóticas. Máximo 2 o 3 párrafos cortos por respuesta.`;

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

  const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

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

module.exports = {
  getGeminiReply,
  sanitizeUserPrompt,
  geminiMetrics,
  setSecurityAlertCallback,
  withRetry,
  generateLeadBriefing
};

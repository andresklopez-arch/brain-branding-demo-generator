/**
 * BRAIN BRANDING GEMINI AI ENGINE HELPER
 * Multi-model fallback engine (gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-flash)
 * Integrated with Telegram & WhatsApp 24/7 Bots
 * Includes Security Prompt Injection Guard, Telemetry & Performance Metrics
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const geminiMetrics = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  blockedInjections: 0,
  averageLatencyMs: 0,
  totalLatencyMs: 0,
  lastUsedModel: null,
  recentLogs: []
};

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

function sanitizeUserPrompt(text) {
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
      console.warn(`[SECURITY ALERT] Prompt injection blocked: "${clean.substring(0, 50)}..."`);
      geminiMetrics.blockedInjections++;
      recordLog({ status: 'BLOCKED', reason: 'PROMPT_INJECTION', snippet: clean.substring(0, 40) });
      return "SECURITY_INJECTION_DETECTED";
    }
  }

  if (clean.length > 1500) {
    clean = clean.substring(0, 1500);
  }

  return clean;
}

async function getGeminiReply(userText, userName, contextId, history = [], customInstruction = '') {
  const sanitized = sanitizeUserPrompt(userText);
  if (sanitized === "SECURITY_INJECTION_DETECTED") {
    return "En Brain Branding estamos para apoyarte con soluciones de Software e Inteligencia Artificial para tu empresa. ¿En qué proyecto o proceso de tu negocio te podemos orientar hoy? ☕";
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('[GEMINI] No GEMINI_API_KEY found in environment variables. Using rule-based fallback.');
    return null;
  }

  geminiMetrics.totalCalls++;
  const startTime = Date.now();

  const baseInstruction = `Eres L.C.I. Andrés R, consultor humano, empático y experto en Inteligencia Artificial y Software a la Medida de Brain Branding ("Empoderando Marcas, Reprogramando Mentes"). Tu objetivo es atender y calificar prospectos interesados en tecnología.

REGLAS OBLIGATORIAS:
1. SALUDO HUMANO: Si el usuario saluda, salúdalo amablemente de forma personalizada (usa "${userName || 'amigo'}" si aplica).
2. CONVERSACIÓN FLUIDA Y NATURAL: Prohibido usar menús numéricos rígidos (ej. 1, 2, 3) o respuestas tipo contestadora automática.
3. CONOCIMIENTO DE SERVICIOS BRAIN BRANDING:
   - Asistentes de IA 24/7 para WhatsApp y Telegram (Integración $3,500 - $4,500 MXN pago único).
   - Puntos de Venta (POS) y ERPs en la Nube (Servidor seguro y soporte $290 - $490 MXN/mes).
   - Desarrollo Web y Móvil a la medida (SaaS, Apps para Android/iOS, automatizaciones).
4. CIERRE Y DERIVACIÓN A WHATSAPP: Cuando el prospecto pida cotización formal, agendar cita o cerrar, ofrece amablemente derivarlo con un asesor por WhatsApp (+52 771 233 9238).
5. RESPUESTAS CONCISAS Y DIRECTAS: Evita textos gigantescos. Máximo 2 o 3 párrafos cortos, con emojis adecuados y profesionalismo.
6. NO LINKS RAW A WEB: No envíes URLs largas ni pidas ir a la página web salvo que el cliente lo pida expresamente.`;

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
      const reply = await new Promise((resolve) => {
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

      if (reply) return reply;
    } catch (err) {
      console.warn(`[GEMINI EXCEPTION] Model ${model}:`, err.message);
    }
  }

  geminiMetrics.failedCalls++;
  recordLog({ status: 'FAIL', reason: 'ALL_MODELS_FAILED', contextId });
  return null;
}

module.exports = { getGeminiReply, sanitizeUserPrompt, geminiMetrics };

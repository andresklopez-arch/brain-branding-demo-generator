// Verificación rápida y NO destructiva de que brainbranding.com.mx y su
// backend siguen funcionando después de un deploy. No manda mensajes
// reales de WhatsApp/Telegram ni crea datos falsos.
//
// Uso: node scripts/smoke-check.js

const SITE = 'https://brainbranding.com.mx';
const API = 'https://brain-branding-demo-generator.onrender.com';
// Mismo secreto que ALR_GOVERNANCE_SECRET en api/telegram.js — los
// endpoints /api/admin/test-gemini-reply y /api/admin/gemini-healthcheck
// lo exigen para no dejarlos abiertos a que cualquiera los dispare y
// gaste cuota de la API key de Gemini.
const CALLER_KEY = 'alr-saas-master-2025-brain';

const checks = [
  {
    name: 'Sitio principal responde',
    run: async () => {
      const res = await fetch(SITE);
      if (!res.ok) throw new Error(`status ${res.status}`);
    },
  },
  {
    name: 'Backend (Render) responde',
    run: async () => {
      const res = await fetch(`${API}/api/admin/otp-status`);
      if (!res.ok) throw new Error(`status ${res.status}`);
    },
  },
  {
    name: 'Formulario de contacto usa el número correcto (527712339238)',
    run: async () => {
      const res = await fetch(`${SITE}/app.js`);
      const text = await res.text();
      if (!text.includes('const phone = "527712339238"; // WhatsApp comercial')) {
        throw new Error('El número del formulario principal no es el esperado — revisa manualmente.');
      }
      if (/wa\.me\/52(?!7712339238)\d{10}/.test(text)) {
        throw new Error('Se encontró un número de WhatsApp distinto al oficial en app.js.');
      }
    },
  },
  {
    name: 'hermes/ no tiene texto corrupto',
    run: async () => {
      const res = await fetch(`${SITE}/hermes/`);
      const text = await res.text();
      if (/Ã.|â€|�/.test(text)) {
        throw new Error('Se detectó texto con codificación corrupta en hermes/.');
      }
    },
  },
  {
    name: 'API de Base de Conocimiento responde',
    run: async () => {
      const res = await fetch(`${API}/api/knowledge-base`);
      const json = await res.json();
      if (!json.ok) throw new Error('respuesta inesperada: ' + JSON.stringify(json));
    },
  },
  {
    name: 'El bot está usando IA real (no solo reglas fijas)',
    run: async () => {
      const res = await fetch(`${API}/api/admin/gemini-metrics`);
      const json = await res.json();
      if (!json.ok) throw new Error('respuesta inesperada: ' + JSON.stringify(json));
      // No falla si totalCalls es 0 (puede que aún no haya conversaciones
      // desde el último reinicio) — solo avisa, no bloquea el smoke-check.
      if (json.metrics && json.metrics.totalCalls === 0) {
        console.warn('  ⚠️  0 llamadas a Gemini desde el último reinicio — normal si el servidor recién arrancó, revisa si persiste.');
      }
    },
  },
  {
    // A diferencia del check de arriba (que solo avisa), este SI falla el
    // smoke-check: telegramOk:false significa que TELEGRAM_BOT_TOKEN esta
    // invalido/revocado ahora mismo, y ni el chat ni los reportes
    // automaticos de las 6/14/22 hrs pueden funcionar aunque el servidor
    // responda 200 OK en todo lo demas (asi paso el 2026-08-20).
    name: 'El token de Telegram es válido (chat y reportes automáticos funcionan)',
    run: async () => {
      const res = await fetch(`${API}/api/keep-alive`);
      const json = await res.json();
      if (!json.telegramOk) {
        throw new Error(`TELEGRAM_BOT_TOKEN invalido/revocado en Render: ${JSON.stringify(json.telegramError)}`);
      }
    },
  },
  {
    // Antes maxOutputTokens:700 se compartía con el "thinking" interno de
    // los modelos gemini-3.x/flash-latest, y si el modelo pensaba de más
    // el bot mandaba respuestas cortadas a media frase (ej. "...para
    // que", visto en producción el 2026-08-20 con un spa de perros). Se
    // arregló en el commit 1748167 (thinkingBudget:0 + maxOutputTokens
    // más alto); este check llama a un prompt largo real para detectar
    // si el bug reaparece en el futuro.
    name: 'Las respuestas largas de Gemini no se cortan a media frase',
    run: async () => {
      const res = await fetch(`${API}/api/admin/test-gemini-reply?callerKey=${CALLER_KEY}`);
      const json = await res.json();
      if (!json.ok) {
        console.warn('  ⚠️  No se pudo generar una respuesta de prueba (revisa GEMINI_API_KEY) — no se pudo validar el corte de respuesta.');
        return;
      }
      if (json.truncated) {
        throw new Error('Gemini alcanzó MAX_TOKENS y la respuesta llegó incompleta — revisa maxOutputTokens/thinkingConfig en api/geminiHelper.js.');
      }
    },
  },
  {
    name: 'Webhook de Telegram rechaza secreto inválido en /api/governance',
    run: async () => {
      const res = await fetch(`${API}/api/governance/set-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: 'test', status: 'ACTIVE', callerKey: 'invalido' }),
      });
      if (res.status !== 403) throw new Error(`status ${res.status}, se esperaba 403`);
    },
  },
];

(async () => {
  let failed = 0;
  for (const check of checks) {
    try {
      await check.run();
      console.log(`OK   ${check.name}`);
    } catch (e) {
      failed++;
      console.error(`FAIL ${check.name}: ${e.message}`);
    }
  }
  console.log(`\n${checks.length - failed}/${checks.length} checks pasaron.`);
  process.exit(failed > 0 ? 1 : 0);
})();

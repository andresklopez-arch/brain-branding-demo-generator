// Verificación rápida y NO destructiva de que brainbranding.com.mx y su
// backend siguen funcionando después de un deploy. No manda mensajes
// reales de WhatsApp/Telegram ni crea datos falsos.
//
// Uso: node scripts/smoke-check.js

const SITE = 'https://brainbranding.com.mx';
const API = 'https://brain-branding-demo-generator.onrender.com';

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

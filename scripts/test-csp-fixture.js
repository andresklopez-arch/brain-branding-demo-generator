// Valida que la CSP de firebase.json siga cubriendo los dominios externos
// que el sitio realmente usa. Sin este check, alguien podría "limpiar" la
// CSP en un refactor y no enterarse hasta que el bot de Telegram mande el
// aviso en producción (ver api/telegram.js, sección CSP Report-Only) --
// esto corre en CI, antes de desplegar. No necesita red ni credenciales:
// solo parsea firebase.json.
//
// Uso: node scripts/test-csp-fixture.js

const fs = require('fs');
const path = require('path');

const firebaseJsonPath = path.join(__dirname, '..', 'firebase.json');
const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));

const headerBlock = (firebaseJson.hosting.headers || []).find((h) => h.source === '**');
if (!headerBlock) {
  console.error('FAIL: no se encontró el bloque de headers "**" en firebase.json');
  process.exit(1);
}
const cspHeader = (headerBlock.headers || []).find(
  (h) => h.key === 'Content-Security-Policy-Report-Only' || h.key === 'Content-Security-Policy'
);
if (!cspHeader) {
  console.error('FAIL: no se encontró ninguna cabecera Content-Security-Policy(-Report-Only) en firebase.json');
  process.exit(1);
}

// directiva -> lista de tokens (dominios/keywords) permitidos
const directives = {};
cspHeader.value.split(';').map((s) => s.trim()).filter(Boolean).forEach((part) => {
  const [name, ...tokens] = part.split(/\s+/);
  directives[name] = tokens;
});

function tokenToRegex(token) {
  const stripped = token.replace(/^https?:\/\//, '');
  const escaped = stripped.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const withWildcard = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${withWildcard}$`);
}

function allows(directiveName, domain) {
  const tokens = directives[directiveName] || [];
  return tokens.some((t) => {
    if (t.startsWith("'")) return false; // 'self', 'unsafe-inline', etc. no son dominios
    return tokenToRegex(t).test(domain);
  });
}

// Dominios externos reales que el sitio usa hoy -- si uno de estos deja de
// estar cubierto, algo se va a romper (o el bot va a empezar a mandar
// avisos de CSP para él) en cuanto se despliegue.
const EXPECTED = [
  { directive: 'script-src', domain: 'www.googletagmanager.com', why: 'Google Tag Manager / gtag.js' },
  { directive: 'script-src', domain: 'cdn.jsdelivr.net', why: 'librerías cargadas por CDN' },
  { directive: 'style-src', domain: 'fonts.googleapis.com', why: 'hoja de estilos de Google Fonts' },
  { directive: 'font-src', domain: 'fonts.gstatic.com', why: 'archivos de fuente de Google Fonts' },
  { directive: 'connect-src', domain: 'www.google-analytics.com', why: 'medición de Google Analytics/GA4' },
  { directive: 'connect-src', domain: 'region1.google-analytics.com', why: 'medición de GA4 (endpoint regional)' },
  { directive: 'connect-src', domain: 'www.google.com', why: 'endpoint alterno de GA4 (consent mode / g/collect)' },
  { directive: 'connect-src', domain: 'www.googletagmanager.com', why: 'llamadas propias de Google Tag Manager' },
  { directive: 'connect-src', domain: 'brain-branding-demo-generator.onrender.com', why: 'backend propio (chat, formularios, reportes)' },
  { directive: 'connect-src', domain: 'ipwho.is', why: 'geolocalización por IP' },
  { directive: 'connect-src', domain: 'ipapi.co', why: 'geolocalización por IP (respaldo)' },
  { directive: 'frame-src', domain: 'www.youtube-nocookie.com', why: 'video embebido de YouTube' },
];

let failed = 0;
for (const { directive, domain, why } of EXPECTED) {
  if (allows(directive, domain)) {
    console.log(`OK   ${directive} permite ${domain} (${why})`);
  } else {
    failed++;
    console.error(`FAIL ${directive} NO permite ${domain} (${why}) -- revisa firebase.json`);
  }
}

console.log(`\n${EXPECTED.length - failed}/${EXPECTED.length} dominios esperados cubiertos.`);
process.exit(failed > 0 ? 1 : 0);

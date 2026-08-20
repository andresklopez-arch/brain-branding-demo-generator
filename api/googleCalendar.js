/**
 * BRAIN BRANDING GOOGLE CALENDAR INTEGRATION
 *
 * Consulta disponibilidad real y crea eventos en el calendario de Andrés
 * usando una cuenta de servicio (JWT firmado a mano -> OAuth2), sin la
 * librería googleapis — igual que el resto del proyecto llama a
 * Firestore/Telegram/Gemini con el módulo https directo, sin dependencias
 * nuevas.
 *
 * Variables de entorno requeridas (Render → Environment):
 *   GOOGLE_CALENDAR_CLIENT_EMAIL  -> email de la cuenta de servicio
 *   GOOGLE_CALENDAR_PRIVATE_KEY   -> llave privada PEM (con \n literales,
 *                                    tal como viene en el JSON descargado
 *                                    de Google Cloud)
 *   GOOGLE_CALENDAR_ID            -> ID del calendario a usar (el correo
 *                                    de Andrés, o un calendario dedicado
 *                                    compartido con la cuenta de servicio
 *                                    con permiso "Hacer cambios en eventos")
 *
 * Si no están configuradas, TODAS las funciones de este archivo se
 * degradan a no-ops (retornan null/false) — el bot sigue funcionando
 * exactamente igual que antes de que este archivo existiera, solo sin la
 * capa extra de prevención de choques contra el calendario real.
 */

const https = require('https');
const crypto = require('crypto');

const CLIENT_EMAIL = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL || null;
const PRIVATE_KEY = process.env.GOOGLE_CALENDAR_PRIVATE_KEY
  ? process.env.GOOGLE_CALENDAR_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || null;

function isConfigured() {
  return !!(CLIENT_EMAIL && PRIVATE_KEY && CALENDAR_ID);
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cachedToken = null; // { accessToken, expiresAt }

async function getAccessToken() {
  if (!isConfigured()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  let signature;
  try {
    signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(PRIVATE_KEY, 'base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.warn('[GOOGLE CALENDAR] Llave privada inválida, revisa GOOGLE_CALENDAR_PRIVATE_KEY:', e.message);
    return null;
  }
  const jwt = `${unsigned}.${signature}`;
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`;

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            cachedToken = { accessToken: json.access_token, expiresAt: Date.now() + (json.expires_in || 3600) * 1000 };
            return resolve(json.access_token);
          }
          console.warn('[GOOGLE CALENDAR] Error obteniendo token:', JSON.stringify(json));
        } catch (e) {
          console.warn('[GOOGLE CALENDAR] Error parseando token:', e.message);
        }
        resolve(null);
      });
    });
    req.on('error', (e) => { console.warn('[GOOGLE CALENDAR] Error de red pidiendo token:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function calendarRequest(method, path, payload) {
  const token = await getAccessToken();
  if (!token) return null;

  const postData = payload ? JSON.stringify(payload) : null;
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: null });
        }
      });
    });
    req.on('error', (e) => { console.warn('[GOOGLE CALENDAR] Error de red:', e.message); resolve(null); });
    if (postData) req.write(postData);
    req.end();
  });
}

// México no usa horario de verano desde 2022 — CDMX es siempre UTC-6.
function toCdmxDateTimeString(dateISO, time24h) {
  return `${dateISO}T${time24h}:00-06:00`;
}

// Revisa si [dateISO time24h, +durationMinutes] choca con algo YA en el
// calendario REAL de Andrés — incluyendo compromisos que él puso a mano,
// que un chequeo solo contra appointments_db.json nunca podría detectar.
async function checkCalendarConflict(dateISO, time24h, durationMinutes = 30) {
  if (!isConfigured() || !dateISO || !time24h) return { checked: false, busy: false };

  const startISO = toCdmxDateTimeString(dateISO, time24h);
  const endDate = new Date(startISO);
  if (isNaN(endDate.getTime())) return { checked: false, busy: false };
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);

  const result = await calendarRequest('POST', '/calendar/v3/freeBusy', {
    timeMin: startISO,
    timeMax: endDate.toISOString(),
    items: [{ id: CALENDAR_ID }]
  });

  if (!result || !result.body) return { checked: false, busy: false };
  const busyRanges = result.body.calendars?.[CALENDAR_ID]?.busy || [];
  return { checked: true, busy: busyRanges.length > 0 };
}

// Crea el evento real en el calendario de Andrés para que le aparezca en
// su teléfono/computadora igual que cualquier cita que agende a mano.
async function createCalendarEvent({ summary, description, dateISO, time24h, durationMinutes = 30 }) {
  if (!isConfigured() || !dateISO || !time24h) return null;

  const startISO = toCdmxDateTimeString(dateISO, time24h);
  const endDate = new Date(startISO);
  if (isNaN(endDate.getTime())) return null;
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);

  const result = await calendarRequest('POST', `/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`, {
    summary,
    description,
    start: { dateTime: startISO, timeZone: 'America/Mexico_City' },
    end: { dateTime: endDate.toISOString(), timeZone: 'America/Mexico_City' }
  });

  if (!result || result.statusCode >= 300) {
    console.warn('[GOOGLE CALENDAR] No se pudo crear el evento:', result && JSON.stringify(result.body));
    return null;
  }
  return result.body?.htmlLink || null;
}

let cachedBusySummary = null; // { text, expiresAt }
const BUSY_SUMMARY_TTL_MS = 3 * 60 * 1000;

// Lista los horarios ocupados de HOY y MAÑANA para inyectarlos en el
// prompt de Gemini ANTES de que genere su respuesta, así el bot evita
// proponer un horario ya tomado en vez de solo avisar después de que ya
// lo ofreció. Se cachea 3 min para no llamar a la API de Calendar en
// cada mensaje de cada cliente.
async function getBusySlotsSummary() {
  if (!isConfigured()) return null;
  if (cachedBusySummary && cachedBusySummary.expiresAt > Date.now()) return cachedBusySummary.text;

  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowISO = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const result = await calendarRequest('POST', '/calendar/v3/freeBusy', {
    timeMin: `${todayISO}T00:00:00-06:00`,
    timeMax: `${tomorrowISO}T23:59:59-06:00`,
    items: [{ id: CALENDAR_ID }]
  });

  if (!result || !result.body) return null;
  const busyRanges = result.body.calendars?.[CALENDAR_ID]?.busy || [];

  const text = busyRanges.length === 0
    ? 'Hoy y mañana Andrés no tiene ningún horario ocupado registrado todavía.'
    : `Horarios YA OCUPADOS de Andrés en su calendario real — NO ofrezcas ni confirmes citas que caigan dentro de estos rangos, propón otro horario cercano libre:\n${busyRanges.map(b => {
        const start = new Date(b.start).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', hour: '2-digit', minute: '2-digit' });
        const end = new Date(b.end).toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
        return `- ${start} a ${end}`;
      }).join('\n')}`;

  cachedBusySummary = { text, expiresAt: Date.now() + BUSY_SUMMARY_TTL_MS };
  return text;
}

module.exports = {
  isConfigured,
  checkCalendarConflict,
  createCalendarEvent,
  getBusySlotsSummary
};

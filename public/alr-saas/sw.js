const CACHE_NAME = 'alr-saas-commander-v2';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './index.css',
  './ReyLicensingValidator.js',
  './ReyLicensingValidator.obfuscated.js',
  './obfuscator.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('api.telegram.org') ||
    url.hostname.includes('discord.com') ||
    url.hostname.includes('hooks.slack.com')
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });

          // 🔐 Sugerencia específica 3: Oráculo de tiempo (Clock Drift Failsafe con Token Dinámico y Firma HMAC)
          const dateStr = res.headers.get('Date');
          const apiKey = url.searchParams.get('apiKey');
          if (dateStr && apiKey) {
            try {
              const token = computeTimeOracleToken(apiKey);
              const timestamp = new Date(dateStr).getTime();
              const payload = JSON.stringify({ date: dateStr, timestamp: timestamp });
              
              // Firmar criptográficamente (HMAC-SHA256) usando la apiKey
              computeHMACSignature(payload, apiKey).then(signature => {
                const encryptedPayload = xorEncryptDecrypt(payload, token);
                const oracleResponse = new Response(JSON.stringify({ 
                  data: encryptedPayload,
                  signature: signature
                }), {
                  headers: { 'Content-Type': 'application/json' }
                });
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(`https://alr-saas-time-oracle.local/date?token=${token}`, oracleResponse);
                });
              }).catch(err => console.error("[SW] Error al firmar oráculo:", err));
            } catch (err) {
              console.error("[SW] Error al guardar oráculo de tiempo:", err);
            }
          }
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

/**
 * Genera un token mensual único a partir de la API Key.
 */
function computeTimeOracleToken(apiKey) {
  const date = new Date();
  const timeWindow = date.getUTCFullYear() + '-' + date.getUTCMonth();
  const str = apiKey + '|' + timeWindow;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Cifrador/Descifrador XOR seguro para base de datos local
 */
function xorEncryptDecrypt(str, key) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

/**
 * Genera una firma HMAC-SHA256 asincrónica usando SubtleCrypto
 */
async function computeHMACSignature(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

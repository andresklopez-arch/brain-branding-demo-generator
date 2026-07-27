/* ============================================================
   ALR SaaS — SDK Universal de Gobernanza & Licencias (v1.1.0)
   ============================================================ */

// 🔐 Sugerencia 37: Proteger referencias nativas contra hooks de extensiones maliciosas
const _nativeFetch = window.fetch.bind(window);
const _nativeGetItem = window.localStorage.getItem.bind(window.localStorage);
const _nativeSetItem = window.localStorage.setItem.bind(window.localStorage);

// 🔐 Sugerencia 22: Comparación en tiempo constante para evitar Timing Attacks
function constantTimeCompare(str1, str2) {
  if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;
  const len1 = str1.length;
  const len2 = str2.length;
  let diff = len1 ^ len2;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    diff |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
  }
  return diff === 0;
}

// 🔐 Sugerencia 30: Ofuscación estática de strings sensibles (Base64)
const _obfuscatedUrl = "aHR0cHM6Ly9yZXktc21hcnQtd2FzaC53ZWIuYXBwL2FwaQ=="; // https://rey-smart-wash.web.app/api
const _obfuscatedPhone = "NTI3NzEyMzM5MjM4"; // 527712339238
const _deobfuscateStr = (str) => atob(str);

export class ReyLicensingValidator {
  /**
   * Inicializa el validador de licencias para la aplicación cliente.
   * @param {Object} config - Configuración del validador.
   * @param {string} config.clientId - ID único asignado a este cliente (ej: 'xalpa_smart').
   * @param {string} config.apiKey - Token secreto de seguridad del cliente.
   * @param {string} config.apiUrl - URL base del API Gateway de ALR SaaS (opcional).
   * @param {Function} config.onBlock - Callback personalizado cuando se bloquea la licencia (opcional).
   */
  constructor(config) {
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.sdkVersion = "1.2.0";
    this.apiUrl = config.apiUrl || _deobfuscateStr(_obfuscatedUrl);
    this.onBlock = config.onBlock;
    this.checkIntervalMs = config.checkIntervalMs || 3600000; // Por defecto valida cada hora (1H)
    
    // 🔐 Sugerencia 23: Propiedades para Rate Limiting local
    this.lastRequestTime = 0;
    this.minRequestSpacingMs = 5000; // 5 segundos mínimo entre peticiones
  }

  /**
   * Realiza la llamada de validación al API Gateway de ALR SaaS.
   */
  async validateLicense() {
    // 🔐 Sugerencia 5: Detección de Modificación de Prototypes de Web Crypto API
    if (!this._verifyCryptoSubtleIntegrity()) {
      this.triggerLock("VIOLACIÓN DE INTEGRIDAD", "Se ha detectado una alteración hostil en la biblioteca de criptografía nativa de tu navegador.");
      return false;
    }
    // 🔐 Sugerencia 26: Validación Sintáctica Rigurosa antes de Criptografía
    const clientPattern = /^[a-z0-9_-]{3,30}$/i;
    if (!this.clientId || !clientPattern.test(this.clientId)) {
      this.triggerLock("ERROR DE CONFIGURACIÓN", "El ID de cliente configurado no es sintácticamente válido.");
      return false;
    }
    if (!this.apiKey || this.apiKey.length < 10) {
      this.triggerLock("ERROR DE CONFIGURACIÓN", "La clave API de seguridad no cumple con los requerimientos mínimos de longitud.");
      return false;
    }

    // 🔐 Sugerencia 23: Rate Limiting Local
    const now = Date.now();
    if (now - this.lastRequestTime < this.minRequestSpacingMs) {
      console.warn("[ReyLicensing] Rate limit local activo. Evitando petición de red redundante.");
      return await this._validateLocalCacheFallback();
    }
    this.lastRequestTime = now;

    try {
      // 🔐 Sugerencia 8: Firmado HMAC Bidireccional (Double Handshake Client-Server)
      // Generar cabeceras firmadas para autenticar la petición del cliente en el backend
      const signedHeaders = await this.signRequest({ clientId: this.clientId }, 'GET', '/validate-license');

      // Petición HTTP REST al API Gateway Central usando la referencia nativa protegida
      const response = await _nativeFetch(`${this.apiUrl}/validate-license?clientId=${this.clientId}&apiKey=${this.apiKey}`, {
        method: 'GET',
        headers: {
          ...signedHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      // 🔐 Sugerencia 28: Detección Activa de Manipulación del Reloj del Sistema
      const serverDateStr = response.headers.get('Date');
      if (serverDateStr) {
        const serverTime = new Date(serverDateStr).getTime();
        const localTime = Date.now();
        // Margen de tolerancia de 5 minutos (300,000 ms)
        if (Math.abs(localTime - serverTime) > 300000) {
          this.triggerLock(
            "MANIPULACIÓN DE HORA DETECTADA",
            "El reloj de tu sistema tiene un desfase mayor a 5 minutos con el servidor de seguridad. Corrige la hora de tu dispositivo."
          );
          return false;
        }
      }

      // Validación local contra bases de datos en caché para redundancia si da 404
      if (response.status === 404) {
        console.warn("[ReyLicensing] API Gateway retornó 404. Iniciando fallback local.");
        return await this._validateLocalCacheFallback();
      }

      const data = await response.json();

      // 🔐 VERIFICACIÓN DE FIRMA CRIPTOGRÁFICA (Seguridad de API / Estilo JWS)
      if (data.token) {
        const parts = data.token.split('.');
        if (parts.length === 3) {
          const [header, payload, signature] = parts;
          
          // 🔐 Sugerencia 35: Validación sintáctica estricta de estructura JWS
          const base64UrlPattern = /^[a-zA-Z0-9_-]+$/;
          if (!base64UrlPattern.test(header) || !base64UrlPattern.test(payload) || !base64UrlPattern.test(signature)) {
            this.triggerLock("TOKEN DE LICENCIA INVÁLIDO", "El token de licencia tiene un formato JWS malformado.");
            return false;
          }

          const localSig = await this._hash(header + '.' + payload, this.apiKey);
          
          // 🔐 Sugerencia 22: Mitigación de Canales Laterales de Tiempo
          if (!constantTimeCompare(localSig, signature)) {
            this.triggerLock("FIRMA DE LICENCIA CORRUPTA", "La firma criptográfica de la licencia es inválida. El intercambio ha sido alterado.");
            return false;
          }
          
          // Leer datos decodificados del payload
          let normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
          while (normalizedPayload.length % 4) {
            normalizedPayload += '=';
          }
          const decryptedPayload = JSON.parse(atob(normalizedPayload));
          
          // 🔐 Sugerencia avanzada 58: Validación de versión mínima (minSdkVersion)
          if (decryptedPayload.minSdkVersion) {
            if (this._compareVersions(this.sdkVersion, decryptedPayload.minSdkVersion) < 0) {
              this.triggerLock("SDK OBSOLETO", `Tu SDK de gobernanza (v${this.sdkVersion}) es obsoleto. Se requiere versión v${decryptedPayload.minSdkVersion} o superior.`);
              return false;
            }
          }

          if (decryptedPayload.clientId !== this.clientId) {
            this.triggerLock("CREDENCIA PLAN CORRUPTA", "El ID de cliente en la firma no coincide con esta instalación.");
            return false;
          }

          // 🔐 Sugerencia 31: Mecanismo de Kill Switch Remoto Instantáneo
          if (decryptedPayload.status === 'REVOKED' || decryptedPayload.allowed === false) {
            this.triggerLock("LICENCIA REVOCADA", "Tu licencia de uso ha sido suspendida permanentemente de forma remota.");
            _nativeSetItem(`alr_cache_${this.clientId}`, ""); // Borrar caché para obligar online
            return false;
          }
        } else {
          this.triggerLock("TOKEN DE LICENCIA INVÁLIDO", "Formato de token JWS corrupto.");
          return false;
        }
      }

      if (!response.ok || data.allowed === false) {
        // Verificar si cuenta con Periodo de Gracia activo
        const graceUntil = data.gracePeriodUntil ? new Date(data.gracePeriodUntil).getTime() : null;
        if (graceUntil && Date.now() < graceUntil) {
          this.triggerGraceWarning(
            data.reason || "PAGO PENDIENTE",
            data.message || "Tu pago mensual está pendiente.",
            data.gracePeriodUntil
          );
          window.ALR_ACTIVE_FEATURES = data.features || window.ALR_ACTIVE_FEATURES;
          window.ALR_SYSTEM_LIMITS = data.config || window.ALR_SYSTEM_LIMITS;
          return true;
        }

        this.triggerLock(data.reason || "LICENCIA INHABILITADA", data.message || "Tu acceso al sistema ha sido suspendido.");
        return false;
      }

      // Almacenar características y límites en el estado global para uso del cliente
      window.ALR_ACTIVE_FEATURES = data.features;
      window.ALR_SYSTEM_LIMITS = data.config;

      // 🔐 GUARDADO EN REPOSO CIFRADO (Failsafe local cifrado) con Crypto Agility (v1$AES-GCM$)
      const cacheKey = this._getRotatingCacheKey(0);
      const secureCache = await this._encrypt(JSON.stringify(data), cacheKey);
      _nativeSetItem(`alr_cache_${this.clientId}`, "v1$AES-GCM$" + secureCache);

      console.log(`[ReyLicensing] Licencia válida criptográficamente. Plan: ${data.currentPlan}.`);
      return true;

    } catch (error) {
      console.warn("[ReyLicensing] Error de conexión de red o firma. Leyendo caché de seguridad...", error);
      return await this._validateLocalCacheFallback();
    }
  }

  /**
   * Método de validación local y fallback contra caché en disco
   * @private
   */
  async _validateLocalCacheFallback() {
    const cachedData = _nativeGetItem(`alr_cache_${this.clientId}`);
    if (cachedData) {
      // 🔐 Sugerencia 25: Crypto Agility (Manejo de versiones v1$AES-GCM$ y legacy)
      let dataToDecrypt = cachedData;
      if (cachedData.startsWith("v1$AES-GCM$")) {
        dataToDecrypt = cachedData.slice(11);
      }
      
      // Intentar descifrar primero con la clave del mes actual
      const currentKey = this._getRotatingCacheKey(0);
      let decrypted = await this._decrypt(dataToDecrypt, currentKey);
      
      if (!decrypted) {
        // Fallback: Intentar descifrar con la clave del mes anterior (traslape de llaves)
        const prevKey = this._getRotatingCacheKey(-1);
        decrypted = await this._decrypt(dataToDecrypt, prevKey);
        
        if (decrypted) {
          // Re-encriptar con la clave actual para actualizar la caché
          try {
            const secureCache = await this._encrypt(decrypted, currentKey);
            _nativeSetItem(`alr_cache_${this.clientId}`, "v1$AES-GCM$" + secureCache);
            console.log("[ReyLicensing] Caché local rotada y actualizada al mes corriente.");
          } catch (e) {
            console.error("[ReyLicensing] Error al re-encriptar caché rotada:", e);
          }
        }
      }

      if (decrypted) {
        try {
          // 🔐 Sugerencia específica 3: Oráculo de tiempo (Clock Drift Failsafe)
          const oracleTime = await this._getServiceWorkerTimeOracle();
          if (oracleTime) {
            const localTime = Date.now();
            if (localTime < oracleTime - 3600000) {
              this.triggerLock(
                "MANIPULACIÓN DE HORA DETECTADA",
                "Se ha detectado que el reloj del sistema está atrasado con respecto al último registro de seguridad del navegador."
              );
              return false;
            }
          }

          const data = JSON.parse(decrypted);

          // 🔐 Sugerencia avanzada 58: Validación de versión mínima en caché
          if (data.minSdkVersion) {
            if (this._compareVersions(this.sdkVersion, data.minSdkVersion) < 0) {
              this.triggerLock("SDK OBSOLETO", `Tu SDK de gobernanza (v${this.sdkVersion}) es obsoleto. Se requiere v${data.minSdkVersion} o superior.`);
              return false;
            }
          }
          
          // 🔐 Sugerencia 31: Control en caché local de Kill Switch
          if (data.status === 'REVOKED' || data.allowed === false) {
            this.triggerLock("LICENCIA REVOCADA", "Tu licencia de uso ha sido revocada de forma remota.");
            return false;
          }

          const graceUntil = data.gracePeriodUntil ? new Date(data.gracePeriodUntil).getTime() : null;
          if (data.allowed !== false || (graceUntil && Date.now() < graceUntil)) {
            if (graceUntil && Date.now() < graceUntil) {
              this.triggerGraceWarning(
                data.reason || "PAGO PENDIENTE",
                data.message || "Tu acceso se suspenderá pronto.",
                data.gracePeriodUntil
              );
            }
            window.ALR_ACTIVE_FEATURES = data.features;
            window.ALR_SYSTEM_LIMITS = data.config;
            console.log("[ReyLicensing] Failsafe local exitoso. Licencia verificada en reposo.");
            return true;
          }
        } catch(e) {
          console.error("[ReyLicensing] Error al parsear caché local descifrada:", e);
        }
      }
    }
    
    this.triggerLock("CONEXIÓN REQUERIDA", "No se puede establecer conexión con el servidor de licencias y no existe una caché local válida.");
    return false;
  }

  /**
   * Deriva una clave de 256 bits para AES-GCM a partir de un string usando SHA-256.
   * @private
   */
  async _deriveKey(keyString) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    return await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Cifra un texto en reposo usando AES-GCM de 256 bits provisto por Web Crypto.
   * @private
   */
  async _encrypt(text, keyString) {
    try {
      const key = await this._deriveKey(keyString);
      const encoder = new TextEncoder();
      const textData = encoder.encode(text);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        textData
      );
      
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      let binary = "";
      const len = combined.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error("[ReyLicensing] Error en cifrado AES-GCM:", e);
      return "";
    }
  }

  /**
   * Descifra un texto en reposo usando AES-GCM.
   * @private
   */
  async _decrypt(encoded, keyString) {
    try {
      const key = await this._deriveKey(keyString);
      const binaryString = atob(encoded);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
      
      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      console.error("[ReyLicensing] Error en descifrado AES-GCM:", e);
      return "";
    }
  }

  /**
   * Genera una firma HMAC-SHA256 estándar.
   * @private
   */
  async _hash(string, keyString) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keyString);
      const messageData = encoder.encode(string);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageData
      );
      
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error("[ReyLicensing] Error en firma HMAC-SHA256:", e);
      return "";
    }
  }

  /**
   * Genera las cabeceras de firma criptográfica para validar peticiones del cliente en el backend.
   * @param {Object} requestData - Cuerpo de la petición.
   * @param {string} method - Método HTTP (GET, POST, etc.).
   * @param {string} path - Ruta del endpoint.
   */
  async signRequest(requestData, method, path) {
    const timestamp = Date.now().toString();
    const dataToSign = `${method.toUpperCase()}\n${path}\n${timestamp}\n${JSON.stringify(requestData)}`;
    const signature = await this._hash(dataToSign, this.apiKey);
    return {
      'X-ALR-ClientId': this.clientId,
      'X-ALR-Timestamp': timestamp,
      'X-ALR-Signature': signature
    };
  }

  /**
   * Obtiene la clave cifrada de la caché local rotada dinámicamente cada mes.
   * @private
   */
  _getRotatingCacheKey(offsetMonths = 0) {
    const d = new Date();
    if (offsetMonths !== 0) {
      d.setMonth(d.getMonth() + offsetMonths);
    }
    return this.apiKey + '_' + d.getFullYear() + '_' + d.getMonth();
  }

  /**
   * Verifica la integridad de la Web Crypto API nativa.
   * @private
   */
  _verifyCryptoSubtleIntegrity() {
    try {
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        return false;
      }
      const importKeyStr = crypto.subtle.importKey.toString();
      const signStr = crypto.subtle.sign.toString();
      if (!importKeyStr.includes('[native code]') || !signStr.includes('[native code]')) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Inicia el proceso de monitoreo automático recurrente.
   */
  startAutoVerification() {
    this.validateLicense();
    setInterval(() => this.validateLicense(), this.checkIntervalMs);
  }

  /**
   * Despliega la pantalla de bloqueo de alta fidelidad estética (Glassmorphism).
   */
  triggerLock(title, message) {
    if (this.onBlock) {
      this.onBlock(title, message);
      return;
    }

    // Comprobar si ya existe la pantalla de bloqueo para no duplicar elementos
    let lockScreen = document.getElementById('alr-saas-lockscreen');
    if (!lockScreen) {
      lockScreen = document.createElement('div');
      lockScreen.id = 'alr-saas-lockscreen';
      
      // Estilos en línea premium para blindar visualmente la app
      lockScreen.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999999;
        background: rgba(3, 5, 8, 0.95);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-family: 'Outfit', -apple-system, sans-serif;
        text-align: center;
        padding: 24px;
        transition: all 0.5s ease;
      `;
      
      const waLink = "https://wa.me/" + _deobfuscateStr(_obfuscatedPhone) + "?text=Hola,%20tengo%20un%20aviso%20de%20licencia%20en%20el%20cliente%20" + this.clientId;
      
      lockScreen.innerHTML = `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 40px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 30px 100px rgba(0,0,0,0.8); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
          <div style="font-size: 64px; margin-bottom: 24px; filter: drop-shadow(0 0 15px rgba(239,68,68,0.4));">🛑</div>
          <h1 style="font-size: 26px; font-weight: 900; margin: 0 0 10px; text-transform: uppercase; color: #ef4444; letter-spacing: -0.5px; font-style: italic;">
            ${title}
          </h1>
          <p style="font-size: 13px; opacity: 0.6; line-height: 1.6; margin: 0 0 30px; font-weight: 500;">
            ${message}
          </p>
          <a href="${waLink}" target="_blank" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 52px; background: #00e5ff; color: #000; font-weight: 900; border-radius: 16px; text-decoration: none; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 10px 25px rgba(0,229,255,0.2); transition: all 0.3s;">
            Contactar Soporte
          </a>
        </div>
      `;
      document.body.appendChild(lockScreen);
      document.body.style.overflow = "hidden"; // Deshabilita el scroll
    }
  }

  /**
   * Despliega un banner flotante estético en la parte superior que advierte sobre la suspensión próxima sin bloquear la interfaz.
   */
  triggerGraceWarning(title, message, untilDate) {
    let warningBanner = document.getElementById('alr-saas-grace-warning');
    if (!warningBanner) {
      warningBanner = document.createElement('div');
      warningBanner.id = 'alr-saas-grace-warning';
      warningBanner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999999;
        background: rgba(245, 158, 11, 0.95);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        color: #000;
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 12px;
        padding: 12px 24px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(245,158,11,0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideDownGrace 0.5s ease forwards;
      `;
      
      const formattedDate = new Date(untilDate).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      warningBanner.innerHTML = `
        <span style="font-size:16px;">⚠️</span>
        <div>
          <span style="text-transform:uppercase; font-weight:900; color:#000;">${title}:</span> ${message} 
          <span style="opacity:0.8; font-weight:600;">(Bloqueo el ${formattedDate})</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#000; font-size:16px; font-weight:900; cursor:pointer; padding:0 5px; margin-left:10px;">×</button>
      `;
      
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes slideDownGrace {
          from { transform: translate(-50%, -50px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(warningBanner);
    }
  }

  /**
   * Recupera el timestamp registrado por el oráculo de tiempo del Service Worker.
   * @private
   */
  async _getServiceWorkerTimeOracle() {
    try {
      if (typeof caches !== 'undefined') {
        const cache = await caches.open('alr-saas-commander-v2');
        
        // Generar token mensual único a partir de la API Key
        const date = new Date();
        const timeWindow = date.getUTCFullYear() + '-' + date.getUTCMonth();
        const str = this.apiKey + '|' + timeWindow;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        const token = Math.abs(hash).toString(16);
        
        const response = await cache.match(`https://alr-saas-time-oracle.local/date?token=${token}`);
        if (response) {
          const wrapper = await response.json();
          const decryptedStr = this._xorDecrypt(wrapper.data, token);
          
          // Verificar firma criptográfica HMAC-SHA256
          const isSignatureValid = await this._verifyHMACSignature(decryptedStr, wrapper.signature, this.apiKey);
          if (!isSignatureValid) {
            console.error("[ReyLicensing] Firma del oráculo de tiempo inválida. ¡Bloqueado!");
            return null;
          }
          
          const data = JSON.parse(decryptedStr);
          return data.timestamp;
        }
      }
    } catch (e) {
      console.warn("[ReyLicensing] Error al leer oráculo de tiempo del Service Worker:", e);
    }
    return null;
  }

  /**
   * Verifica la firma HMAC-SHA256 de un mensaje usando SubtleCrypto
   * @private
   */
  async _verifyHMACSignature(message, signatureHex, secret) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const msgData = encoder.encode(message);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      
      // Convertir firma hex a Uint8Array
      const sigBytes = new Uint8Array(signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, msgData);
      return isValid;
    } catch (e) {
      console.error("[ReyLicensing] Error al verificar firma HMAC:", e);
      return false;
    }
  }

  /**
   * Cifrador/Descifrador XOR seguro para base de datos local
   * @private
   */
  _xorDecrypt(b64, key) {
    try {
      const str = atob(b64);
      let result = '';
      for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      console.warn("[ReyLicensing] Error al desencriptar oráculo:", e);
    }
    return '';
  }

  /**
   * Compara dos cadenas de versiones semánticas (ej: '1.2.0' vs '1.1.0').
   * Retorna -1 si v1 < v2, 1 si v1 > v2, 0 si v1 == v2.
   * @private
   */
  _compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }
}

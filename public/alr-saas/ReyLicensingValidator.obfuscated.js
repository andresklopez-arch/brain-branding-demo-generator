


const _nativeFetch = window.fetch.bind(window);
const _nativeGetItem = window.localStorage.getItem.bind(window.localStorage);
const _nativeSetItem = window.localStorage.setItem.bind(window.localStorage);


function _0xa(str1, str2) {
  if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;
  const len1 = str1.length;
  const len2 = str2.length;
  let diff = len1 ^ len2;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    diff |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
  }
  return diff === 0;
}


const _obfuscatedUrl = "aHR0cHM6Ly9yZXktc21hcnQtd2FzaC53ZWIuYXBwL2FwaQ=="; 
const _obfuscatedPhone = "NTI3NzEyMzM5MjM4"; 
const _0x15 = (arr, key) => arr.map(c => String.fromCharCode(((c ^ key) - 3) & 255)).join('');

export class ReyLicensingValidator {
  
  constructor(config) {
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.sdkVersion = "1.2.0";
    this.apiUrl = config.apiUrl || _0x15(_obfuscatedUrl);
    this.onBlock = config.onBlock;
    this.checkIntervalMs = config.checkIntervalMs || 3600000; 
    
    
    this.lastRequestTime = 0;
    this.minRequestSpacingMs = 5000; 
  }

  
  async validateLicense() {
    
    if (!this._verifyCryptoSubtleIntegrity()) {
      this.triggerLock("VIOLACIÓN DE INTEGRIDAD", "Se ha detectado una alteración hostil en la biblioteca de criptografía nativa de tu navegador.");
      return false;
    }
    
    const clientPattern = /^[a-z0-9_-]{3,30}$/i;
    if (!this.clientId || !clientPattern.test(this.clientId)) {
      this.triggerLock("ERROR DE CONFIGURACIÓN", "El ID de cliente configurado no es sintácticamente válido.");
      return false;
    }
    if (!this.apiKey || this.apiKey.length < 10) {
      this.triggerLock("ERROR DE CONFIGURACIÓN", "La clave API de seguridad no cumple con los requerimientos mínimos de longitud.");
      return false;
    }

    
    const now = Date.now();
    if (now - this.lastRequestTime < this.minRequestSpacingMs) {
      console.warn("[ReyLicensing] Rate limit local activo. Evitando petición de red redundante.");
      return await this._validateLocalCacheFallback();
    }
    this.lastRequestTime = now;

    try {
      
      
      const signedHeaders = await this.signRequest({ clientId: this.clientId }, 'GET', '/validate-license');

      
      const response = await _nativeFetch(`${this.apiUrl}/validate-license?clientId=${this.clientId}&apiKey=${this.apiKey}`, {
        method: 'GET',
        headers: {
          ...signedHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      
      const serverDateStr = response.headers.get('Date');
      if (serverDateStr) {
        const serverTime = new Date(serverDateStr).getTime();
        const localTime = Date.now();
        
        if (Math.abs(localTime - serverTime) > 300000) {
          this.triggerLock(
            _0x15([98,126,99,102,97,106,101,126,124,102,236,99,17,125,122,17,121,96,111,126,17,125,122,109,122,124,109,126,125,126], 54),
            "El reloj de tu sistema tiene un desfase mayor a 5 minutos con el servidor de seguridad. Corrige la hora de tu dispositivo."
          );
          return false;
        }
      }

      
      if (response.status === 404) {
        console.warn("[ReyLicensing] API Gateway retornó 404. Iniciando fallback local.");
        return await this._validateLocalCacheFallback();
      }

      const data = await response.json();

      
      if (data.token) {
        const parts = data.token.split('.');
        if (parts.length === 3) {
          const [header, payload, signature] = parts;
          
          
          const base64UrlPattern = /^[a-zA-Z0-9_-]+$/;
          if (!base64UrlPattern.test(header) || !base64UrlPattern.test(payload) || !base64UrlPattern.test(signature)) {
            this.triggerLock("TOKEN DE LICENCIA INVÁLIDO", "El token de licencia tiene un formato JWS malformado.");
            return false;
          }

          const localSig = await this._hash(header + '.' + payload, this.apiKey);
          
          
          if (!_0xa(localSig, signature)) {
            this.triggerLock("FIRMA DE LICENCIA CORRUPTA", "La firma criptográfica de la licencia es inválida. El intercambio ha sido alterado.");
            return false;
          }
          
          
          let _0xb = payload.replace(/-/g, '+').replace(/_/g, '/');
          while (_0xb.length % 4) {
            _0xb += '=';
          }
          const _0xc = JSON.parse(atob(_0xb));
          
          
          if (_0xc.minSdkVersion) {
            if (this._compareVersions(this.sdkVersion, _0xc.minSdkVersion) < 0) {
              this.triggerLock("SDK OBSOLETO", `Tu SDK de gobernanza (v${this.sdkVersion}) es obsoleto. Se requiere versión v${_0xc.minSdkVersion} o superior.`);
              return false;
            }
          }

          if (_0xc.clientId !== this.clientId) {
            this.triggerLock("CREDENCIA PLAN CORRUPTA", "El ID de cliente en la firma no coincide con esta instalación.");
            return false;
          }

          
          if (_0xc.status === _0x15([36,57,40,35,63,57,54], 113) || _0xc.allowed === false) {
            this.triggerLock(_0x15([78,83,89,87,76,89,83,91,58,72,87,68,77,89,91,86,91], 30), "Tu licencia de uso ha sido suspendida permanentemente de forma remota.");
            _nativeSetItem(`alr_cache_${this.clientId}`, ""); 
            return false;
          }
        } else {
          this.triggerLock("TOKEN DE LICENCIA INVÁLIDO", "Formato de token JWS corrupto.");
          return false;
        }
      }

      if (!response.ok || data.allowed === false) {
        
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

      
      window.ALR_ACTIVE_FEATURES = data.features;
      window.ALR_SYSTEM_LIMITS = data.config;

      
      const cacheKey = this._getRotatingCacheKey(0);
      const _0xd = await this._encrypt(JSON.stringify(data), cacheKey);
      _nativeSetItem(`alr_cache_${this.clientId}`, "v1$AES-GCM$" + _0xd);

      console.log(`[ReyLicensing] Licencia válida criptográficamente. Plan: ${data.currentPlan}.`);
      return true;

    } catch (error) {
      console.warn("[ReyLicensing] Error de conexión de red o firma. Leyendo caché de seguridad...", error);
      return await this._validateLocalCacheFallback();
    }
  }

  
  async _validateLocalCacheFallback() {
    const _0xe = _nativeGetItem(`alr_cache_${this.clientId}`);
    if (_0xe) {
      
      let _0xf = _0xe;
      if (_0xe.startsWith("v1$AES-GCM$")) {
        _0xf = _0xe.slice(11);
      }
      
      
      const currentKey = this._getRotatingCacheKey(0);
      let _0x10 = await this._decrypt(_0xf, currentKey);
      
      if (!_0x10) {
        
        const prevKey = this._getRotatingCacheKey(-1);
        _0x10 = await this._decrypt(_0xf, prevKey);
        
        if (_0x10) {
          
          try {
            const _0xd = await this._encrypt(_0x10, currentKey);
            _nativeSetItem(`alr_cache_${this.clientId}`, "v1$AES-GCM$" + _0xd);
            console.log("[ReyLicensing] Caché local rotada y actualizada al mes corriente.");
          } catch (e) {
            console.error("[ReyLicensing] Error al re-encriptar caché rotada:", e);
          }
        }
      }

      if (_0x10) {
        try {
          
          const oracleTime = await this._getServiceWorkerTimeOracle();
          if (oracleTime) {
            const localTime = Date.now();
            if (localTime < oracleTime - 3600000) {
              this.triggerLock(
                _0x15([98,126,99,102,97,106,101,126,124,102,236,99,17,125,122,17,121,96,111,126,17,125,122,109,122,124,109,126,125,126], 54),
                "Se ha detectado que el reloj del sistema está atrasado con respecto al último registro de seguridad del navegador."
              );
              return false;
            }
          }

          const data = JSON.parse(_0x10);

          
          if (data.minSdkVersion) {
            if (this._compareVersions(this.sdkVersion, data.minSdkVersion) < 0) {
              this.triggerLock("SDK OBSOLETO", `Tu SDK de gobernanza (v${this.sdkVersion}) es obsoleto. Se requiere v${data.minSdkVersion} o superior.`);
              return false;
            }
          }
          
          
          if (data.status === _0x15([36,57,40,35,63,57,54], 113) || data.allowed === false) {
            this.triggerLock(_0x15([78,83,89,87,76,89,83,91,58,72,87,68,77,89,91,86,91], 30), "Tu licencia de uso ha sido revocada de forma remota.");
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

  
  async _deriveKey(keyString) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString);
    const _0x13 = await crypto.subtle.digest('SHA-256', keyData);
    return await crypto.subtle.importKey(
      'raw',
      _0x13,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  
  async _encrypt(text, keyString) {
    try {
      const key = await this._deriveKey(keyString);
      const encoder = new TextEncoder();
      const textData = encoder.encode(text);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const _0x11 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        textData
      );
      
      const combined = new Uint8Array(iv.length + _0x11.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(_0x11), iv.length);
      
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
      
      const _0x12 = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
      
      return new TextDecoder().decode(_0x12);
    } catch (e) {
      console.error("[ReyLicensing] Error en descifrado AES-GCM:", e);
      return "";
    }
  }

  
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
      
      const _0x14 = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageData
      );
      
      const hashArray = Array.from(new Uint8Array(_0x14));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error("[ReyLicensing] Error en firma HMAC-SHA256:", e);
      return "";
    }
  }

  
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

  
  _getRotatingCacheKey(offsetMonths = 0) {
    const d = new Date();
    if (offsetMonths !== 0) {
      d.setMonth(d.getMonth() + offsetMonths);
    }
    return this.apiKey + '_' + d.getFullYear() + '_' + d.getMonth();
  }

  
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

  
  startAutoVerification() {
    this.validateLicense();
    setInterval(() => this.validateLicense(), this.checkIntervalMs);
  }

  
  triggerLock(title, message) {
    if (this.onBlock) {
      this.onBlock(title, message);
      return;
    }

    
    let lockScreen = document.getElementById('alr-saas-lockscreen');
    if (!lockScreen) {
      lockScreen = document.createElement('div');
      lockScreen.id = 'alr-saas-lockscreen';
      
      
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
      
      const waLink = "https:
      
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
      document.body.style.overflow = "hidden"; 
    }
  }

  
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

  
  async _getServiceWorkerTimeOracle() {
    try {
      if (typeof caches !== 'undefined') {
        const cache = await caches.open('alr-saas-commander-v2');
        
        
        const date = new Date();
        const timeWindow = date.getUTCFullYear() + '-' + date.getUTCMonth();
        const str = this.apiKey + '|' + timeWindow;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        const token = Math.abs(hash).toString(16);
        
        const response = await cache.match(`https:
        if (response) {
          const wrapper = await response.json();
          const decryptedStr = this._0x17(wrapper.data, token);
          
          
          const isSignatureValid = await this._0x16(decryptedStr, wrapper.signature, this.apiKey);
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

  
  async _0x16(message, signatureHex, secret) {
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
      
      
      const sigBytes = new Uint8Array(signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, msgData);
      return isValid;
    } catch (e) {
      console.error("[ReyLicensing] Error al verificar firma HMAC:", e);
      return false;
    }
  }

  
  _0x17(b64, key) {
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

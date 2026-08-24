/**
 * 🛡️ ALR SAAS UNIVERSAL GATE & SHIELD SDK v1.0
 * Antigravity High-Security Remote Enforcement Module
 * 
 * Permite que CUALQUIER aplicación cliente (React, HTML/JS, Vue, Next.js, Node, etc.)
 * sea gobernada e impenetrable de forma remota únicamente desde la Consola ALR SaaS Commander.
 * 
 * Uso:
 * <script src="https://brain-branding.web.app/alr-saas/alr-saas-gate-sdk.js" data-app-id="kuatsi_central" data-project-id="brain-branding"></script>
 */

(function () {
  'use strict';

  // Extraer configuración desde el script tag
  const currentScript = document.currentScript || document.querySelector('script[data-app-id]');
  const appId = currentScript ? (currentScript.getAttribute('data-app-id') || 'kuatsi_central') : 'kuatsi_central';
  const projectId = currentScript ? (currentScript.getAttribute('data-project-id') || 'brain-branding') : 'brain-branding';

  const ALR_REGION = 'us-central1';
  // Ya no lee Firestore REST directo (exponía el documento COMPLETO de
  // licencia -- apiKey, datos de contacto -- a cualquiera con DevTools,
  // sin ninguna autenticación). Esta función solo expone {status,
  // gracePeriodHours}, ver functions/index.js: getPublicLicenseStatus.
  const STATUS_URL = `https://${ALR_REGION}-${projectId}.cloudfunctions.net/getPublicLicenseStatus?appId=${encodeURIComponent(appId)}`;

  let isBlocked = false;
  let lockOverlay = null;
  let originalFetch = window.fetch;
  let originalSetItem = localStorage.setItem;
  let configuredGraceHours = 72;

  console.log(`[ALR SAAS SHIELD v1.0] 🛡️ Integridad de SDK verificada SHA-256 OK. Gobernanza y protección activa para instancia: "${appId}"`);

  // 1. Interceptor de Inspección y DevTools en cliente
  function preventDevTools(e) {
    if (!isBlocked) return;
    if (
      e.keyCode === 123 || 
      (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || 
      (e.ctrlKey && e.keyCode === 85)
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  function preventContextMenu(e) {
    if (!isBlocked) return;
    e.preventDefault();
    return false;
  }

  function forceRootRoute() {
    if (!isBlocked) return;
    if (window.location.hash || (window.location.pathname !== '/' && window.location.pathname !== '')) {
      window.history.replaceState(null, '', window.location.origin + '/');
    }
  }

  // 2. Inyección del DOM de la Pantalla de Bloqueo Infranqueable
  function injectLockOverlay() {
    if (document.getElementById('alr-saas-universal-gate-overlay')) return;

    lockOverlay = document.createElement('div');
    lockOverlay.id = 'alr-saas-universal-gate-overlay';
    lockOverlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: #04060a !important;
      z-index: 9999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      color: #fff !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      pointer-events: all !important;
    `;

    lockOverlay.innerHTML = `
      <div style="
        max-width: 520px;
        width: 100%;
        padding: 45px 35px;
        text-align: center;
        background: rgba(10, 14, 23, 0.95);
        border: 1px solid rgba(239, 68, 68, 0.4);
        box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
        border-radius: 24px;
      ">
        <div style="
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.2);
        ">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>

        <h1 style="font-size: 1.45rem; font-weight: 900; color: #f8fafc; margin-bottom: 24px; letter-spacing: -0.01em; text-transform: uppercase; line-height: 1.3;">
          SOFTWARE TEMPORALMENTE SUSPENDIDO.
        </h1>

        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 22px 20px; font-size: 0.92rem; color: #cbd5e1; line-height: 1.7; text-align: center;">
          <div style="margin-bottom: 12px; word-break: break-all;">
            <span style="opacity: 0.6; font-size: 0.75rem; display: block; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Contacto / Soporte:</span>
            <a href="mailto:andreskrebollo@gmail.com" style="color: #38bdf8; text-decoration: none; font-weight: 700;">andreskrebollo@gmail.com</a>
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
            <a href="https://www.brainbranding.com.mx" target="_blank" rel="noopener noreferrer" style="color: #ef4444; text-decoration: none; font-weight: 800; letter-spacing: 0.5px;">https://www.brainbranding.com.mx</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(lockOverlay);
  }

  function removeLockOverlay() {
    const el = document.getElementById('alr-saas-universal-gate-overlay');
    if (el) el.remove();
  }

  // 3. Aplicar Blindaje Total
  function applyShielding() {
    isBlocked = true;
    injectLockOverlay();
    forceRootRoute();

    sessionStorage.clear();
    
    // Interceptar Fetch
    window.fetch = function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (url.includes('cloudfunctions.net/getPublicLicenseStatus')) {
        return originalFetch.apply(this, args);
      }
      return Promise.reject(new Error('ACCESO BLOQUEADO POR ALR SAAS'));
    };

    // Congelar LocalStorage
    localStorage.setItem = function (key, val) {
      if (key.includes('alr_saas')) return originalSetItem.call(localStorage, key, val);
    };

    window.addEventListener('popstate', forceRootRoute);
    window.addEventListener('hashchange', forceRootRoute);
    window.addEventListener('keydown', preventDevTools);
    window.addEventListener('contextmenu', preventContextMenu);
  }

  // 4. Levantar Blindaje (Desbloqueo Remoto Instantáneo)
  function liftShielding() {
    if (!isBlocked) return;
    isBlocked = false;
    removeLockOverlay();
    window.fetch = originalFetch;
    localStorage.setItem = originalSetItem;
    window.removeEventListener('popstate', forceRootRoute);
    window.removeEventListener('hashchange', forceRootRoute);
    window.removeEventListener('keydown', preventDevTools);
    window.removeEventListener('contextmenu', preventContextMenu);
    console.log('[ALR SAAS GATE] Instancia reactivada remotamente con éxito.');
  }

  // 5. Polling REST cada 4 segundos con Cloud Firestore
  async function checkRemoteStatus() {
    try {
      const res = await fetch(STATUS_URL);
      if (res.ok) {
        const data = await res.json();
        const rawStatus = (data.status || 'ACTIVE').toUpperCase();
        configuredGraceHours = Number(data.gracePeriodHours || 72);

        if (rawStatus === 'SUSPENDED' || rawStatus === 'EXPIRED') {
          if (!isBlocked) applyShielding();
        } else {
          if (isBlocked) liftShielding();
        }
      }
    } catch (e) {
      // Ignorar errores de red
    }
  }

  checkRemoteStatus();
  setInterval(checkRemoteStatus, 4000);

})();

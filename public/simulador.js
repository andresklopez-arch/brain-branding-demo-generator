// Safe storage wrapper to prevent crashes in strict privacy settings / custom domains
const safeStorage = (type) => {
  try {
    const storage = window[type];
    const testKey = '__test_store__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch (e) {
    const memory = {};
    return {
      getItem: (key) => (key in memory ? memory[key] : null),
      setItem: (key, value) => { memory[key] = String(value); },
      removeItem: (key) => { delete memory[key]; },
      clear: () => { Object.keys(memory).forEach(k => delete memory[k]); }
    };
  }
};
const safeLocalStorage = safeStorage('localStorage');
const safeSessionStorage = safeStorage('sessionStorage');

// ── READ SESSION DATA & AUTOCORRECT SPELLING ──
function cleanSpelling(text) {
  if (!text) return "";
  let cleaned = text.trim();
  
  const typos = [
    { regex: /\bmuebleds\b/gi, replacement: "muebles" },
    { regex: /\bmuebled\b/gi, replacement: "muebles" },
    { regex: /\bcréditp\b/gi, replacement: "crédito" },
    { regex: /\bcreditp\b/gi, replacement: "crédito" },
    { regex: /\bservico\b/gi, replacement: "servicio" },
    { regex: /\bservicos\b/gi, replacement: "servicios" },
    { regex: /\batencion\b/gi, replacement: "atención" },
    { regex: /\bclianterla\b/gi, replacement: "clientela" },
    { regex: /\bdesconecion\b/gi, replacement: "desconexión" },
    { regex: /\boptimisacion\b/gi, replacement: "optimización" },
    { regex: /\bautonoma\b/gi, replacement: "autónoma" },
    { regex: /\bautonomo\b/gi, replacement: "autónomo" },
    { regex: /\bdiagnostico\b/gi, replacement: "diagnóstico" },
    { regex: /\binterrucion\b/gi, replacement: "interrupción" },
    { regex: /\binterucion\b/gi, replacement: "interrupción" }
  ];
  
  typos.forEach(t => {
    cleaned = cleaned.replace(t.regex, t.replacement);
  });
  
  cleaned = cleaned.replace(/ebleds/gi, "ebles");
  cleaned = cleaned.replace(/itp\b/gi, "ito");
  
  return cleaned;
}

function sanitizeInput(text) {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, '').trim();
}

// Read data from safeLocalStorage or safeSessionStorage
const rawBizName = safeLocalStorage.getItem('sim_biz_name') || safeSessionStorage.getItem('sim_biz_name') || "";
const rawBizSector = safeLocalStorage.getItem('sim_biz_sector') || safeSessionStorage.getItem('sim_biz_sector') || "";
const rawBizProblem = safeLocalStorage.getItem('sim_biz_problem') || safeSessionStorage.getItem('sim_biz_problem') || "";
const simStart = parseInt(safeLocalStorage.getItem('sim_session_start') || safeSessionStorage.getItem('sim_session_start') || '0', 10);

const bizName = sanitizeInput(cleanSpelling(rawBizName));
const bizSector = sanitizeInput(cleanSpelling(rawBizSector));
const bizProblem = sanitizeInput(cleanSpelling(rawBizProblem));
const bizStyle = sanitizeInput(safeLocalStorage.getItem('sim_biz_style') || safeSessionStorage.getItem('sim_biz_style') || 'ultra-moderno');
let bizLogo = safeLocalStorage.getItem('sim_biz_logo') || safeSessionStorage.getItem('sim_biz_logo') || '';
const activeService = sanitizeInput(safeLocalStorage.getItem('sim_active_service') || safeSessionStorage.getItem('sim_active_service') || 'asistente');

// Check 15-minute expiration (15 * 60 * 1000 = 900,000 ms)
const isExpired = simStart > 0 && (Date.now() - simStart > 15 * 60 * 1000);

// Redirect if missing data or expired
if (!bizName || !bizSector || !bizProblem || isExpired) {
  safeLocalStorage.clear();
  safeSessionStorage.clear();
  window.location.href = '/';
  throw new Error("No session data found or session expired. Redirecting to root...");
}

// Set session active mark
safeSessionStorage.setItem('sim_session_active', 'true');

// Synchronize storage
safeSessionStorage.setItem('sim_biz_name', bizName);
safeSessionStorage.setItem('sim_biz_sector', bizSector);
safeSessionStorage.setItem('sim_biz_problem', bizProblem);
safeSessionStorage.setItem('sim_biz_style', bizStyle);
safeSessionStorage.setItem('sim_biz_logo', bizLogo);
safeSessionStorage.setItem('sim_active_service', activeService);

safeLocalStorage.setItem('sim_biz_name', bizName);
safeLocalStorage.setItem('sim_biz_sector', bizSector);
safeLocalStorage.setItem('sim_biz_problem', bizProblem);
safeLocalStorage.setItem('sim_biz_style', bizStyle);
safeLocalStorage.setItem('sim_biz_logo', bizLogo);
safeLocalStorage.setItem('sim_active_service', activeService);

// ── AUTOGENERATE LOGO IF EMPTY ──
if (!bizLogo) {
  bizLogo = generateAvatar(bizName);
  safeSessionStorage.setItem('sim_biz_logo', bizLogo);
}

function generateAvatar(name) {
  if (!name) return '';
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'BB';
  const colors = [
    ['#a855f7', '#ec4899'],
    ['#10b981', '#059669'],
    ['#0ea5e9', '#0284c7']
  ];
  const grad = colors[name.length % colors.length];
  const randId = Math.floor(Math.random() * 1000000);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="avatar-grad-${randId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${grad[0]}" />
        <stop offset="100%" stop-color="${grad[1]}" />
      </linearGradient>
      <style>
        @keyframes spinAvatar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulseAvatar { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.02); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
        .outer-ring { transform-origin: center; animation: spinAvatar 12s linear infinite; }
        .glow-avatar { transform-origin: center; animation: pulseAvatar 3s ease-in-out infinite; }
      </style>
    </defs>
    <!-- Drop Shadow Glow -->
    <circle cx="50" cy="50" r="45" fill="none" stroke="${grad[1]}" stroke-width="4" opacity="0.3" class="glow-avatar" />
    <!-- Main Background -->
    <circle cx="50" cy="50" r="42" fill="url(#avatar-grad-${randId})" />
    <!-- Tech Ring -->
    <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 30" opacity="0.75" class="outer-ring" />
    <circle cx="50" cy="50" r="45" fill="none" stroke="${grad[0]}" stroke-width="1.5" stroke-dasharray="50 150" opacity="0.6" class="outer-ring" style="animation-duration: 6s; animation-direction: reverse;" />
    <!-- Initials -->
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', sans-serif" font-weight="900" font-size="32" fill="#ffffff" style="letter-spacing: 0.5px;">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ── STARRY BACKGROUND FOR SIMULATOR ──
(function() {
  const canvas = document.getElementById('sim-star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Star {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5;
      this.speed = Math.random() * 0.3 + 0.1;
      this.opacity = Math.random();
    }
    draw() {
      ctx.fillStyle = `rgba(240, 220, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    update() {
      this.y -= this.speed;
      if (this.y < 0) {
        this.y = canvas.height;
        this.x = Math.random() * canvas.width;
      }
    }
  }

  function initStars() {
    const count = window.innerWidth < 768 ? 100 : 250;
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push(new Star());
    }
  }

  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animateStars);
  }

  window.addEventListener('resize', () => { resize(); initStars(); });
  resize(); initStars(); animateStars();
})();

// ── SESSION TIMER (15 MINUTES HARD LIMIT WITH EXTENSION TOAST) ──
let currentSessionStart = parseInt(safeLocalStorage.getItem('sim_session_start') || safeSessionStorage.getItem('sim_session_start') || Date.now().toString(), 10);
const timerEl = document.getElementById('countdown-timer');
let hasShownExpiryToast = false;

function showExpiryToast() {
  if (hasShownExpiryToast) return;
  hasShownExpiryToast = true;

  let toast = document.getElementById('sim-expiry-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sim-expiry-toast';
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(236, 72, 153, 0.5);
      color: #fff; padding: 14px 24px; border-radius: 16px; font-size: 13px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(236, 72, 153, 0.3);
      z-index: 1000; display: flex; align-items: center; gap: 15px;
      backdrop-filter: blur(15px); animation: fadeIn 0.4s ease-out;
    `;
    toast.innerHTML = `
      <span>⏳ Tu sesión de simulación caducará en <strong>menos de 1 minuto</strong>.</span>
      <button id="extend-timer-btn" style="background: linear-gradient(135deg, #a855f7, #ec4899); border: none; color: #fff; padding: 8px 16px; border-radius: 10px; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.2s;">
        ⏱️ Extender 15 min
      </button>
    `;
    document.body.appendChild(toast);

    document.getElementById('extend-timer-btn').addEventListener('click', () => {
      currentSessionStart = Date.now();
      safeLocalStorage.setItem('sim_session_start', currentSessionStart.toString());
      safeSessionStorage.setItem('sim_session_start', currentSessionStart.toString());
      if (toast) toast.remove();
      hasShownExpiryToast = false;
    });
  }
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - currentSessionStart) / 1000);
  const timeLeft = Math.max(0, 15 * 60 - elapsed);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  if (timerEl) {
    timerEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  
  if (timeLeft <= 60 && timeLeft > 0) {
    showExpiryToast();
  }

  if (timeLeft < 120) {
    if (timerEl) {
      timerEl.style.color = '#ef4444';
      timerEl.style.animation = 'pulse 1s infinite alternate';
    }
    const badge = document.getElementById('sim-timer-badge');
    if (badge) {
      badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      badge.style.background = 'rgba(239, 68, 68, 0.08)';
    }
  } else {
    if (timerEl) {
      timerEl.style.color = 'var(--text-main)';
      timerEl.style.animation = 'none';
    }
  }

  if (timeLeft <= 0) {
    destroySession();
  }
}
const timerInterval = setInterval(updateTimer, 1000);
updateTimer();

// Listen for storage changes across tabs
window.addEventListener('storage', (e) => {
  if (['sim_biz_name', 'sim_biz_sector', 'sim_biz_problem', 'sim_biz_logo'].includes(e.key)) {
    const newName = safeLocalStorage.getItem('sim_biz_name');
    const newSector = safeLocalStorage.getItem('sim_biz_sector');
    const newProblem = safeLocalStorage.getItem('sim_biz_problem');
    const newLogo = safeLocalStorage.getItem('sim_biz_logo');

    if (newName && newSector && newProblem) {
      bizName = sanitizeInput(cleanSpelling(newName));
      bizSector = sanitizeInput(cleanSpelling(newSector));
      bizProblem = sanitizeInput(cleanSpelling(newProblem));
      if (newLogo) bizLogo = newLogo;
      if (typeof initMockups === 'function') {
        initMockups();
      }
    }
  }
});

function destroySession() {
  clearInterval(timerInterval);
  safeSessionStorage.clear();
  safeLocalStorage.clear();
  
  document.body.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#06080c; color:#fff; font-family:sans-serif; gap:20px; text-align:center; padding: 20px; box-sizing: border-box;">
      <div style="font-size:60px; animation: rotate 2s linear infinite;">💥</div>
      <h2 style="font-size:24px; font-weight:bold; font-family: var(--font-title);">Sesión Autodestruida</h2>
      <p style="color:#94a3b8; max-width:400px; line-height:1.5; font-size:14px;">La simulación efímera ha expirado por inactividad. Los datos ingresados han sido completamente borrados.</p>
      <a href="/" style="padding:10px 20px; background:#a855f7; color:#fff; text-decoration:none; border-radius:10px; font-weight:bold; margin-top:10px;">Regresar al Inicio</a>
    </div>
  `;
  setTimeout(() => { window.location.href = "/"; }, 5000);
}

document.getElementById('destroy-session-btn').addEventListener('click', () => {
  if (confirm("¿Estás seguro de que deseas finalizar la sesión de simulación? Se borrarán todos los datos.")) {
    destroySession();
  }
});

// Copy Diagnosis Summary handler for WhatsApp
const copyDiagBtn = document.getElementById('copy-diag-btn');
if (copyDiagBtn) {
  copyDiagBtn.addEventListener('click', () => {
    const summaryText = `🤖 *DIAGNÓSTICO INTERACTIVO DE IA - BRAIN BRANDING*\n\n` +
      `🏢 *Empresa:* ${bizName}\n` +
      `🏷️ *Sector:* ${bizSector}\n` +
      `⚠️ *Reto Identificado:* ${bizProblem}\n` +
      `💡 *Solución Evaluada:* Implementación de Asistente IA 24/7, POS Inteligente, Plataforma Web y ERP a la medida.\n\n` +
      `🌐 *Solicitar Asesoría Directa por WhatsApp:* https://api.whatsapp.com/send?phone=525638165507&text=Hola%20Brain%20Branding,%20revis%C3%A9%20mi%20diagn%C3%B3stico%20para%20${encodeURIComponent(bizName)}%20y%20quiero%20cotizar.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        copyDiagBtn.innerHTML = '✅ ¡Copiado!';
        copyDiagBtn.style.borderColor = '#10b981';
        copyDiagBtn.style.color = '#10b981';
        setTimeout(() => {
          copyDiagBtn.innerHTML = '📋 Copiar Diagnóstico';
          copyDiagBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          copyDiagBtn.style.color = '#34d399';
        }, 3000);
      }).catch(() => {
        prompt('Copia este resumen para enviar por WhatsApp:', summaryText);
      });
    } else {
      prompt('Copia este resumen para enviar por WhatsApp:', summaryText);
    }
  });
}

// ── PRINT PDF HANDLER ──
const printPdfBtn = document.getElementById('print-pdf-btn');
if (printPdfBtn) {
  printPdfBtn.addEventListener('click', () => {
    window.print();
  });
}

// ── QR CODE MODAL HANDLER ──
const qrCodeBtn = document.getElementById('qr-code-btn');
const qrModal = document.getElementById('qr-modal');
const closeQrBtn = document.getElementById('close-qr-modal-btn');
const qrContainer = document.getElementById('qr-code-container');

function generateQrSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 25 25">
    <rect width="25" height="25" fill="#ffffff" />
    <path d="M 2,2 H 9 V 9 H 2 Z M 3,3 V 8 H 8 V 3 Z M 4,4 H 7 V 7 H 4 Z" fill="#a855f7" />
    <path d="M 16,2 H 23 V 9 H 16 Z M 17,3 V 8 H 22 V 3 Z M 18,4 H 21 V 7 H 18 Z" fill="#a855f7" />
    <path d="M 2,16 H 9 V 23 H 2 Z M 3,17 V 22 H 8 V 17 Z M 4,18 H 7 V 21 H 4 Z" fill="#a855f7" />
    <rect x="11" y="2" width="2" height="3" fill="#06080c"/>
    <rect x="14" y="4" width="1" height="4" fill="#06080c"/>
    <rect x="10" y="7" width="4" height="2" fill="#06080c"/>
    <rect x="2" y="11" width="5" height="2" fill="#06080c"/>
    <rect x="8" y="10" width="3" height="3" fill="#06080c"/>
    <rect x="12" y="12" width="5" height="2" fill="#a855f7"/>
    <rect x="18" y="11" width="4" height="2" fill="#06080c"/>
    <rect x="11" y="15" width="3" height="4" fill="#06080c"/>
    <rect x="15" y="16" width="4" height="2" fill="#06080c"/>
    <rect x="20" y="15" width="3" height="5" fill="#06080c"/>
    <rect x="10" y="20" width="4" height="3" fill="#06080c"/>
    <rect x="16" y="21" width="6" height="2" fill="#a855f7"/>
  </svg>`;
}

if (qrCodeBtn && qrModal) {
  qrCodeBtn.addEventListener('click', () => {
    if (qrContainer) {
      qrContainer.innerHTML = generateQrSvg();
    }
    qrModal.style.display = 'flex';
  });
}
if (closeQrBtn && qrModal) {
  closeQrBtn.addEventListener('click', () => {
    qrModal.style.display = 'none';
  });
}
if (qrModal) {
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.style.display = 'none';
  });
}

// ── ROI CALCULATOR LOGIC ──
const roiSlider = document.getElementById('roi-staff-slider');
const roiStaffVal = document.getElementById('roi-staff-val');
const roiHoursSaved = document.getElementById('roi-hours-saved');
const roiMoneySaved = document.getElementById('roi-money-saved');
const roiBizLabel = document.getElementById('roi-biz-name-label');
const roiToggleBtn = document.getElementById('roi-view-toggle-btn');
const roiMetricsView = document.getElementById('roi-metrics-view');
const roiChartView = document.getElementById('roi-chart-view');
let hasFiredRoiConfetti = false;

if (roiBizLabel && bizName) {
  roiBizLabel.textContent = bizName;
}

if (roiSlider) {
  roiSlider.addEventListener('input', (e) => {
    const staff = parseInt(e.target.value, 10);
    if (roiStaffVal) roiStaffVal.textContent = `${staff} ${staff === 1 ? 'persona' : 'personas'}`;
    const hours = staff * 35;
    const money = staff * 14500 * 12;
    if (roiHoursSaved) roiHoursSaved.textContent = `${hours.toLocaleString()} hrs`;
    if (roiMoneySaved) roiMoneySaved.textContent = `$${money.toLocaleString()} MXN`;

    if (staff >= 10 && !hasFiredRoiConfetti && typeof confetti === 'function') {
      hasFiredRoiConfetti = true;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
    }
  });
}

if (roiToggleBtn && roiMetricsView && roiChartView) {
  roiToggleBtn.addEventListener('click', () => {
    if (roiChartView.style.display === 'none') {
      roiChartView.style.display = 'flex';
      roiMetricsView.style.display = 'none';
      roiToggleBtn.textContent = '🔢 Ver Métricas Numeradas';
    } else {
      roiChartView.style.display = 'none';
      roiMetricsView.style.display = 'grid';
      roiToggleBtn.textContent = '📊 Alternar Gráfico / Métricas';
    }
  });
}

// ── VCARD DOWNLOAD & WHATSAPP DIRECT HANDLER ──
const vcardBtn = document.getElementById('download-vcard-btn');
if (vcardBtn) {
  vcardBtn.addEventListener('click', () => {
    const safeFilename = bizName.replace(/[^a-zA-Z0-9]/g, '_');
    const vcardContent = `BEGIN:VCARD\nVERSION:3.0\nN:${bizName};;;;\nFN:${bizName}\nORG:${bizName}\nTITLE:${bizSector}\nNOTE:Diagnóstico de IA creado en Brain Branding - ${bizProblem}\nTEL;TYPE=CELL:+525638165507\nURL:https://brainbranding.com.mx\nEND:VCARD`;
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeFilename}_Contacto.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open WhatsApp directly after short delay
    setTimeout(() => {
      const waUrl = `https://api.whatsapp.com/send?phone=525638165507&text=Hola%20Brain%20Branding,%20aqu%C3%AD%20est%C3%A1%20la%20vCard%20digital%20de%20mi%20empresa%20${encodeURIComponent(bizName)}%20(${encodeURIComponent(bizSector)}).%20Quiero%20solicitar%20asesor%C3%ADa%20personalizada.`;
      window.open(waUrl, '_blank');
    }, 500);
  });
}

// ── TERMINAL LOGS INITIALIZATION ──
const terminal = document.getElementById('search-terminal-logs') || document.getElementById('terminal-logs');
const progressBar = document.getElementById('search-progress-bar') || document.getElementById('loader-progress-bar');
const aiSearchModal = document.getElementById('ai-search-modal');
const simLoader = document.getElementById('sim-loader');

const logs = [
  `Conectando con el motor cognitivo de Brain Branding v4.2...`,
  `Escaneando internet en vivo para solucionar sector: "${bizSector}"...`,
  `Buscando mejores prácticas de automatización aplicables a "${bizName}"...`,
  `Analizando cuello de botella: "${bizProblem}"...`,
  `Diseñando arquitectura para erradicar: "${bizProblem}"...`,
  `Estructurando simuladores: Chatbot 24/7, POS Inteligente, Web Adaptativa y ERP...`,
  `Enlazando base de datos simulada de ${bizName}...`,
  `Algoritmos aplicados con éxito. Abración de Sandbox Interactivo.`
];

let logIndex = 0;
function printLog() {
  if (logIndex < logs.length) {
    if (terminal) {
      const div = document.createElement('div');
      div.textContent = '> ' + logs[logIndex];
      terminal.appendChild(div);
      terminal.scrollTop = terminal.scrollHeight;
    }
    
    if (progressBar) {
      progressBar.style.width = ((logIndex + 1) / logs.length * 100) + '%';
    }
    
    logIndex++;
    setTimeout(printLog, 450);
  } else {
    setTimeout(() => {
      if (aiSearchModal) aiSearchModal.style.display = 'none';
      if (simLoader) simLoader.style.display = 'none';
      const dashboard = document.getElementById('sim-dashboard');
      if (dashboard) dashboard.style.display = 'flex';
      initTabs();
      initMockups();
    }, 450);
  }
}
printLog();

// ── TAB SYSTEM (ONE SIMULATOR PER PAGE) ──
function initTabs() {
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  // Set initial active tab (default to 'asistente' if 'all' or empty)
  const defaultTab = (activeService === 'all') ? 'asistente' : activeService;
  
  tabLinks.forEach(link => {
    if (link.getAttribute('data-tab') === defaultTab) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  tabPanels.forEach(panel => {
    if (panel.id === `panel-${defaultTab}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Load initial AI advice
  updateAIAdvice(defaultTab);

  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      tabLinks.forEach(l => l.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(`panel-${tabId}`).classList.add('active');
      
      // Update dynamic AI advice!
      updateAIAdvice(tabId);
      
      // Reset scroll to top of content area to avoid disorientation
      document.querySelector('.sim-content-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── SECTOR DYNAMIC PROFILES ──
const sectorProfiles = {
  "restaurante": {
    logoName: "Restaurante / Café",
    chatInit: "¡Hola! ¿Tienen mesa disponible para hoy a las 8:00 PM para 4 personas y qué recomiendan de cenar?",
    chatReply: "¡Hola! Sí, por supuesto. He reservado una mesa para 4 personas hoy a las 8:00 PM en **{bizName}**. De cenar te recomiendo probar nuestra *Hamburguesa Especial* y el delicioso *Pastel de Chocolate*. ¿Te gustaría que pre-ordenemos algo para que esté listo al llegar?",
    posProducts: [
      { id: 1, icon: '☕', name: 'Café Capuccino', price: 55 },
      { id: 2, icon: '🍰', name: 'Pastel de Chocolate', price: 75 },
      { id: 3, icon: '🍳', name: 'Desayuno Americano', price: 145 },
      { id: 4, icon: '🍹', name: 'Bebida Artesanal', price: 60 },
      { id: 5, icon: '🥐', name: 'Croissant Jamón', price: 45 },
      { id: 6, icon: '🍔', name: 'Hamburguesa Especial', price: 180 }
    ],
    webTitle: "Sabor y Calidez en un Solo Lugar",
    webSlogan: "Explora nuestro menú artesanal e interactivo. Pide en línea, reserva tu mesa y disfruta de la mejor atención gastronómica de la ciudad.",
    erpBottleneck: "Retrasos y confusión en comandas físicas entre meseros y cocina.",
    erpOptimizeNode: "✅ Comandas Digitales en Tiempo Real",
    erpOptimizeDesc: "Pedidos directo a cocina desde tablet. Reduce el tiempo de entrega un 35% y elimina mermas por errores.",
    aiAdvice: "En el sector restaurantero, implementar un control de comandas digital sincronizado y predicción de demanda para ingredientes perecederos reduce las mermas de insumos críticos hasta en un 22% anual.",
    aiAdvices: {
      asistente: "Consejo IA: Un Asistente de reservas automatizado por WhatsApp evita la pérdida de mesas por llamadas no contestadas fuera de horario de servicio, captando un 15% más de reservas.",
      pos: "Consejo IA: La facturación con QR en el ticket del restaurante permite al cliente auto-facturar desde su celular, disminuyendo las filas en caja y el tiempo de espera del cliente.",
      web: "Consejo IA: Integrar un menú digital con fotos de alta calidad y un botón de pedido instantáneo eleva el ticket promedio de compra en un 24% comparado con menús en PDF tradicionales.",
      erp: "Consejo IA: Sincronizar las comandas directo de la mesa a la cocina elimina confusiones del mesero, reduciendo las mermas por platos mal preparados hasta en un 18%."
    }
  },
  "comercio": {
    logoName: "Comercio / Tienda (Retail)",
    chatInit: "Hola! ¿Tienen en existencia los tenis deportivos en talla 27 y hacen envíos a domicilio?",
    chatReply: "¡Hola! Sí, tenemos 3 piezas de *Tenis Deportivos* en talla 27 en stock. Sí hacemos envíos gratis a todo el país. He apartado un par provisionalmente para ti en **{bizName}**. ¿Te gustaría recibir el link de pago seguro?",
    posProducts: [
      { id: 1, icon: '👕', name: 'Playera de Algodón', price: 350 },
      { id: 2, icon: '👟', name: 'Tenis Deportivos', price: 1200 },
      { id: 3, icon: '🎒', name: 'Mochila Ergonómica', price: 450 },
      { id: 4, icon: '🕶️', name: 'Lentes de Sol', price: 750 },
      { id: 5, icon: '⌚', name: 'Reloj Inteligente', price: 1800 },
      { id: 6, icon: '👜', name: 'Bolso de Cuero', price: 950 }
    ],
    webTitle: "Moda y Tendencias a tu Alcance",
    webSlogan: "Descubre nuestra colección exclusiva. Compra online de forma segura con envío rápido a domicilio y devoluciones sin costo.",
    erpBottleneck: "Falta de sincronización de stock físico y digital en tiempo real.",
    erpOptimizeNode: "✅ Control de Inventario Omnicanal",
    erpOptimizeDesc: "Stock sincronizado automáticamente en web, POS y almacén. Reduce faltantes de stock un 40%.",
    aiAdvice: "Para comercios minoristas (Retail), la integración de inventario omnicanal automatizado previene ventas de productos agotados y disminuye pérdidas de conversión por quiebres de stock en un 28%.",
    aiAdvices: {
      asistente: "Consejo IA: Integrar un chatbot que responda al instante dudas sobre disponibilidad de tallas y colores de productos eleva la tasa de conversión de clientes potenciales un 30%.",
      pos: "Consejo IA: Un sistema POS sincronizado en tiempo real con tu catálogo online previene la venta de piezas agotadas y gestiona múltiples almacenes automáticamente.",
      web: "Consejo IA: El uso de pasarelas de pago con checkout rápido (como Apple Pay o tarjetas pre-guardadas) incrementa las compras completadas un 25%.",
      erp: "Consejo IA: Un ERP omnicanal te permite planificar reabastecimientos preventivos de mercancía basándose en análisis predictivos de tus ventas de los últimos 3 meses."
    }
  },
  "servicios": {
    logoName: "Servicios Profesionales / Consultoría",
    chatInit: "Hola, me interesa una cotización para una auditoría contable y saber qué incluye.",
    chatReply: "¡Hola! Claro. Nuestra *Auditoría Contable* incluye revisión de balances, conciliaciones fiscales y reporte de riesgos. El costo base es de $3,500. He generado una propuesta interactiva para **{bizName}**. ¿Te gustaría agendar una llamada breve con un especialista?",
    posProducts: [
      { id: 1, icon: '📑', name: 'Asesoría Legal / Hora', price: 1500 },
      { id: 2, icon: '📊', name: 'Auditoría Contable', price: 3500 },
      { id: 3, icon: '📈', name: 'Planificación Fiscal', price: 4500 },
      { id: 4, icon: '🧠', name: 'Consultoría TI', price: 2500 },
      { id: 5, icon: '💻', name: 'Soporte y Hosting', price: 1200 },
      { id: 6, icon: '📝', name: 'Redacción Contratos', price: 1800 }
    ],
    webTitle: "Soluciones Estratégicas para tu Crecimiento",
    webSlogan: "Impulsamos tu negocio con consultoría de alto nivel. Agenda citas de asesoría, firma contratos digitalmente y accede a tu panel de cliente.",
    erpBottleneck: "Lentitud en la preparación y envío de cotizaciones y contratos.",
    erpOptimizeNode: "✅ Generador Automático de Propuestas",
    erpOptimizeDesc: "Cotizaciones en PDF autogeneradas y firma electrónica instantánea. Reduce el ciclo de venta en un 50%.",
    aiAdvice: "En empresas de consultoría y servicios, automatizar la generación de propuestas comerciales y habilitar firmas digitales acorta el proceso de cierre de contratos comerciales de 9 días a menos de 24 horas.",
    aiAdvices: {
      asistente: "Consejo IA: Configurar recordatorios interactivos de citas profesionales vía chat reduce el ausentismo de clientes un 40% y agiliza el re-agendamiento autónomo.",
      pos: "Consejo IA: Habilitar cobros mediante links de pago de Stripe o PayPal integrados a tu CRM agiliza el cobro de anticipos de proyectos en un 60%.",
      web: "Consejo IA: Un sitio web con un cotizador interactivo permite perfilar prospectos calificados antes de que tomen una llamada, ahorrando valiosas horas de tu equipo de ventas.",
      erp: "Consejo IA: Centralizar tus propuestas, minutas y contratos de clientes en un solo sistema en la nube reduce los tiempos de cierre de contratos comerciales de 9 días a menos de 24 horas."
    }
  },
  "salud": {
    logoName: "Salud / Clínica",
    chatInit: "Hola! Buenas tardes, ¿tienen cita disponible para una limpieza dental mañana por la tarde?",
    chatReply: "¡Buenas tardes! Sí, tenemos espacios libres para *Limpieza Dental* mañana a las 3:00 PM y 5:00 PM en **{bizName}**. He apartado tentativamente el horario de las 3:00 PM. ¿Te queda bien para agendarlo oficialmente?",
    posProducts: [
      { id: 1, icon: '🩺', name: 'Consulta Médica', price: 600 },
      { id: 2, icon: '🦷', name: 'Limpieza Dental', price: 800 },
      { id: 3, icon: '🔬', name: 'Estudios de Laboratorio', price: 1200 },
      { id: 4, icon: '💊', name: 'Receta y Tratamiento', price: 450 },
      { id: 5, icon: '🧪', name: 'Prueba Diagnóstica', price: 1500 },
      { id: 6, icon: '🩹', name: 'Curación Clínica', price: 500 }
    ],
    webTitle: "Cuidado Profesional de tu Salud",
    webSlogan: "Reserva tus citas médicas en línea 24/7 de forma inmediata, consulta nuestro directorio de especialistas y accede a tu historial médico.",
    erpBottleneck: "Alta tasa de inasistencia a consultas y citas duplicadas.",
    erpOptimizeNode: "✅ Agenda y Recordatorios Automatizados",
    erpOptimizeDesc: "Confirmaciones automáticas vía WhatsApp integradas a la agenda. Reduce ausentismo en un 45%.",
    aiAdvice: "El uso de asistentes conversacionales para confirmación y recordatorio automático de consultas médicas disminuye el ausentismo (no-show) del 24% a menos del 5%, maximizando la ocupación del staff.",
    aiAdvices: {
      asistente: "Consejo IA: Un asistente médico virtual que responda preguntas comunes y valide seguros médicos por chat agiliza la recepción de la clínica y ahorra 15 horas semanales de llamadas.",
      pos: "Consejo IA: Integrar el cobro de consultas directamente con el expediente médico asegura el control de ingresos y automatiza el reporte de insumos médicos utilizados.",
      web: "Consejo IA: Un portal de pacientes para reservar citas médicas en línea 24/7 y descargar recetas o estudios clínicos eleva la retención de pacientes un 35%.",
      erp: "Consejo IA: Agendar citas médicas digitales integradas con recordatorios automáticos por WhatsApp disminuye el ausentismo (no-show) de pacientes del 24% a menos del 5%."
    }
  },
  "educacion": {
    logoName: "Educación / Cursos",
    chatInit: "Hola, me podrían dar información sobre los costos de inscripción y formas de pago?",
    chatReply: "¡Hola! Por supuesto. En **{bizName}** la *Inscripción Anual* es de $2,500 y la *Mensualidad del Curso* es de $1,800. Aceptamos tarjetas de crédito con facturación automatizada. ¿Deseas recibir el link del formulario de inscripción digital?",
    posProducts: [
      { id: 1, icon: '📚', name: 'Inscripción Anual', price: 2500 },
      { id: 2, icon: '✏️', name: 'Mensualidad Curso', price: 1800 },
      { id: 3, icon: '🎒', name: 'Kit Material Didáctico', price: 650 },
      { id: 4, icon: '💻', name: 'Acceso Plataforma LMS', price: 1200 },
      { id: 5, icon: '🧪', name: 'Taller Extracurricular', price: 950 },
      { id: 6, icon: '🎓', name: 'Certificado de Grado', price: 3000 }
    ],
    webTitle: "Formación de Excelencia para el Futuro",
    webSlogan: "Explora nuestra oferta académica. Inscripciones 100% online, pagos automatizados de colegiaturas y clases virtuales de última generación.",
    erpBottleneck: "Proceso manual y tardado de cobranza de colegiaturas pendientes.",
    erpOptimizeNode: "✅ Cobranza Recurrente y Automatizada",
    erpOptimizeDesc: "Cargos recurrentes con recordatorios de pago automáticos vía WhatsApp. Disminuye cartera vencida en un 60%.",
    aiAdvice: "Implementar pagos recurrentes automáticos integrados a notificaciones preventivas vía chat reduce la cartera en mora en instituciones educativas hasta en un 55% desde el primer trimestre."
  },
  "inmobiliaria": {
    logoName: "Inmobiliaria / Bienes Raíces",
    chatInit: "Hola! Busco casas o departamentos en renta por la zona centro de aprox $10,000 pesos.",
    chatReply: "¡Hola! Sí, contamos con 2 departamentos disponibles en la zona centro por $10,000. He enviado las fichas y recorridos virtuales a tu WhatsApp. ¿Te gustaría coordinar una visita física para esta semana?",
    posProducts: [
      { id: 1, icon: '🔑', name: 'Comisión Renta / Depósito', price: 15000 },
      { id: 2, icon: '🏢', name: 'Comisión Venta Propiedad', price: 95000 },
      { id: 3, icon: '📝', name: 'Contrato de Arrendamiento', price: 2500 },
      { id: 4, icon: '📸', name: 'Sesión Fotos Profesional', price: 1800 },
      { id: 5, icon: '📋', name: 'Valuación Comercial', price: 3500 },
      { id: 6, icon: '🛡️', name: 'Póliza Jurídica Anual', price: 4500 }
    ],
    webTitle: "Encuentra la Propiedad de tus Sueños",
    webSlogan: "Buscador inteligente de casas, oficinas y departamentos. Recorridos virtuales, mapas interactivos e información detallada al instante.",
    erpBottleneck: "Retrasos en el envío de fichas y listados de propiedades a leads.",
    erpOptimizeNode: "✅ CRM de Propiedades Inteligente",
    erpOptimizeDesc: "Mapeo automático de preferencias del cliente con fichas en PDF enviadas de inmediato. Agiliza cierres en un 40%.",
    aiAdvice: "En el sector inmobiliario, enviar propuestas perfiladas y recorridos 3D de forma autónoma dentro de los primeros 5 minutos de contacto eleva la tasa de conversión y agendamiento de visitas un 38%."
  },
  "manufactura": {
    logoName: "Manufactura / Distribución",
    chatInit: "Hola, queremos consultar el estado del pedido de 500 piezas que ordenamos.",
    chatReply: "¡Hola! Tu pedido de 500 piezas en **{bizName}** está al 90% de fabricación y programado para distribución mañana a las 9:00 AM. Se ha asignado el transportista y la guía de rastreo. ¿Quieres recibir notificaciones de entrega?",
    posProducts: [
      { id: 1, icon: '📦', name: 'Lote de Materia Prima A', price: 8500 },
      { id: 2, icon: '⚙️', name: 'Servicio Procesamiento', price: 12000 },
      { id: 3, icon: '🚛', name: 'Logística de Distribución', price: 3500 },
      { id: 4, icon: '📦', name: 'Lote de Producto Terminado', price: 14500 },
      { id: 5, icon: '🔧', name: 'Mantenimiento Correctivo', price: 4500 },
      { id: 6, icon: '📋', name: 'Control de Calidad ISO', price: 5000 }
    ],
    webTitle: "Suministro y Manufactura de Alta Precisión",
    webSlogan: "Portal corporativo para clientes mayoristas. Levanta órdenes de compra, cotiza fletes y rastrea el avance de tu producción en tiempo real.",
    erpBottleneck: "Falta de coordinación entre órdenes de venta y capacidad de planta.",
    erpOptimizeNode: "✅ Planificación de Producción (MRP)",
    erpOptimizeDesc: "Generación automática de órdenes de producción basadas en inventarios y ventas. Reduce retrasos un 30%.",
    aiAdvice: "Sincronizar las órdenes de venta directamente con el inventario de almacén e insumos en planta mediante reglas lógicas MRP reduce los tiempos muertos de producción un 22% y los retrasos en fletes un 30%."
  },
  "gimnasio": {
    logoName: "Gimnasio / Fitness",
    chatInit: "Hola! Quisiera informes sobre el costo mensual de las membresías de pesas y spinning.",
    chatReply: "¡Hola! En **{bizName}** la *Membresía Mensual* que incluye pesas y clases grupales de spinning es de $650. También te recomiendo reservar con nuestro *Entrenador Personal*. ¿Te gustaría agendar cita hoy?",
    posProducts: [
      { id: 1, icon: '🎫', name: 'Membresía Mensual', price: 650 },
      { id: 2, icon: '🏋️', name: 'Entrenador Personal', price: 1500 },
      { id: 3, icon: '🥤', name: 'Proteína Whey Shake', price: 65 },
      { id: 4, icon: '🎫', name: 'Pase Individual Día', price: 120 },
      { id: 5, icon: '🔒', name: 'Renta Locker Anual', price: 800 },
      { id: 6, icon: '👟', name: 'Toalla y Kit Accesorios', price: 250 }
    ],
    webTitle: "Transforma tu Cuerpo y Mente",
    webSlogan: "El mejor equipamiento y clases grupales guiadas por expertos. Inscríbete en línea, reserva tus lockers y gestiona tu membresía digitalmente.",
    erpBottleneck: "Deserción de socios por falta de seguimiento preventivo e inasistencias.",
    erpOptimizeNode: "✅ CRM de Retención Predictiva IA",
    erpOptimizeDesc: "Envío automatizado de ofertas y recordatorios vía WhatsApp al cumplir 10 días de inasistencia. Baja cancelaciones un 32%.",
    aiAdvice: "En el sector Fitness, el costo de adquisición de clientes es 5 veces mayor que el de retención. Integrar alertas automatizadas de inasistencia para reactivar socios inactivos reduce la deserción anual hasta en un 28%."
  },
  "automotriz": {
    logoName: "Taller Mecánico / Automotriz",
    chatInit: "Hola, mi coche hace un ruido extraño en los frenos, ¿puedo llevarlo hoy a revisión?",
    chatReply: "¡Hola! Sí, por supuesto. Podemos agendar una cita para evaluar los *Frenos Nuevos* o mantenimiento hoy mismo en **{bizName}**. He apartado el espacio de las 4:00 PM. Al ingresar tu auto, recibirás el diagnóstico y presupuesto detallado vía WhatsApp. ¿Confirmamos?",
    posProducts: [
      { id: 1, icon: '🔧', name: 'Afinación Mayor', price: 1800 },
      { id: 2, icon: '🛢️', name: 'Cambio Aceite Sintético', price: 850 },
      { id: 3, icon: '🚗', name: 'Diagnóstico Scanner', price: 400 },
      { id: 4, icon: '🛑', name: 'Balatas / Frenos Delanteros', price: 1200 },
      { id: 5, icon: '🛞', name: 'Alineación y Balanceo', price: 600 },
      { id: 6, icon: '🔩', name: 'Cambio de Amortiguadores', price: 3200 }
    ],
    webTitle: "Ingeniería y Cuidado Automotriz Profesional",
    webSlogan: "Reserva tu cita de servicio en línea, autoriza presupuestos directo en tu celular y consulta el historial clínico de tu vehículo.",
    erpBottleneck: "Tiempos muertos por demerito en autorización de presupuestos de refacciones.",
    erpOptimizeNode: "✅ Cotización y Aprobación Digital Móvil",
    erpOptimizeDesc: "Presupuestos interactivos detallados con fotos enviados por WhatsApp para aprobación en un clic. Acelera reparaciones un 40%.",
    aiAdvice: "Enviar cotizaciones interactivas de fallas mecánicas con evidencia fotográfica directo al WhatsApp del dueño del auto reduce el tiempo de aprobación de presupuestos a un promedio de 14 minutos, elevando la rotación en rampa."
  },
  "estetica": {
    logoName: "Estética / Salón de Belleza",
    chatInit: "Hola! Buenas tardes, ¿tienen disponibilidad para un tinte y corte de cabello mañana?",
    chatReply: "¡Buenas tardes! Sí, tenemos citas disponibles para *Corte y Tinte* mañana a las 11:00 AM y 4:00 PM con nuestra estilista principal en **{bizName}**. He apartado el horario de las 11:00 AM tentativamente. ¿Te gustaría confirmar?",
    posProducts: [
      { id: 1, icon: '💇‍♀️', name: 'Corte de Cabello Premium', price: 350 },
      { id: 2, icon: '🎨', name: 'Tinte Completo / Balayage', price: 1800 },
      { id: 3, icon: '💅', name: 'Manicura y Pedicura Gel', price: 650 },
      { id: 4, icon: '💆‍♀️', name: 'Tratamiento Capilar Keratina', price: 1200 },
      { id: 5, icon: '🧖‍♀️', name: 'Masaje Facial e Hidratación', price: 750 },
      { id: 6, icon: '💄', name: 'Maquillaje Social Eventos', price: 950 }
    ],
    webTitle: "Saca a Relucir tu Mejor Versión",
    webSlogan: "Reserva con tus estilistas favoritos en línea, acumula puntos en tu monedero digital y consulta tendencias personalizadas.",
    erpBottleneck: "Cancelaciones de última hora que dejan vacíos los horarios del staff.",
    erpOptimizeNode: "✅ Sistema de Citas con Garantía Anticipada",
    erpOptimizeDesc: "Solicitud automática de un depósito parcial de garantía vía link de pago al agendar. Reduce inasistencias al 1.5%.",
    aiAdvice: "Implementar micropagos de garantía para agendar citas estéticas en línea disminuye drásticamente el ausentismo imprevisto, asegurando una ocupación del estilista por encima del 92% de su jornada laboral."
  },
  "veterinaria": {
    logoName: "Mascotas / Veterinaria",
    chatInit: "Hola, quisiera saber los costos de la vacuna quíntuple y si tienen estética canina.",
    chatReply: "¡Hola! En **{bizName}** la *Vacuna Quíntuple* tiene un costo de $450 y ofrecemos servicio de *Estética Canina* desde $350 (dependiendo de la raza). ¿Te gustaría agendar cita médica o baño hoy mismo?",
    posProducts: [
      { id: 1, icon: '🐶', name: 'Estética Canina Completa', price: 400 },
      { id: 2, icon: '🩺', name: 'Consulta Médica Veterinaria', price: 450 },
      { id: 3, icon: '💉', name: 'Vacuna Quíntuple Mascota', price: 450 },
      { id: 4, icon: '🧴', name: 'Baño Antiparasitario', price: 300 },
      { id: 5, icon: '🦴', name: 'Alimento Premium Bolsa', price: 850 },
      { id: 6, icon: '🩹', name: 'Desparasitación Interna', price: 250 }
    ],
    webTitle: "Amor y Cuidado para tus Compañeros",
    webSlogan: "Agenda citas veterinarias y estéticas, consulta el expediente de vacunación de tu mascota y compra sus alimentos en línea.",
    erpBottleneck: "Olvidos de dueños en renovar vacunas y desparasitaciones preventivas.",
    erpOptimizeNode: "✅ Alertas Preventivas de Cartilla Médica",
    erpOptimizeDesc: "Avisos automáticos WhatsApp de próxima dosis de vacunas y baños basados en historial médico. Eleva recurrencia un 45%.",
    aiAdvice: "El envío proactivo de recordatorios de cartilla de salud animal vía WhatsApp (vacunación, desparasitante, corte de uñas) activa a dueños recurrentes e incrementa los ingresos veterinarios recurrentes un 35%."
  },
  "tecnologia": {
    logoName: "Soporte Técnico / Tecnología",
    chatInit: "Hola! Mi laptop no enciende y se queda la pantalla en negro, ¿hacen reparaciones?",
    chatReply: "¡Hola! Claro que sí, en **{bizName}** realizamos diagnósticos avanzados. El *Mantenimiento y Diagnóstico* tiene un costo base de $400. Puedes traer tu equipo o programar recolección a domicilio. Recibirás actualizaciones de reparación en tiempo real vía WhatsApp.",
    posProducts: [
      { id: 1, icon: '💻', name: 'Diagnóstico y Limpieza Laptop', price: 450 },
      { id: 2, icon: '💾', name: 'Recuperación de Datos HDD', price: 1500 },
      { id: 3, icon: '📱', name: 'Cambio de Pantalla Celular', price: 1800 },
      { id: 4, icon: '🔌', name: 'Reparación de Centro de Carga', price: 650 },
      { id: 5, icon: '⚙️', name: 'Instalación de Sistema Operativo', price: 800 },
      { id: 6, icon: '🔋', name: 'Cambio de Batería Original', price: 950 }
    ],
    webTitle: "Soporte Técnico Especializado en Dispositivos",
    webSlogan: "Rastrea el estado de tu equipo en línea en tiempo real. Autoriza presupuestos digitales y recibe garantía de satisfacción.",
    erpBottleneck: "Exceso de llamadas de clientes preguntando por el estado de su equipo.",
    erpOptimizeNode: "✅ Notificación Automatizada de Status",
    erpOptimizeDesc: "Actualizaciones WhatsApp autónomas del flujo de reparación (Ingresado, En Espera de Pieza, Listo). Baja llamadas un 60%.",
    aiAdvice: "Notificar de forma autónoma cada fase del diagnóstico y reparación de equipos electrónicos reduce un 60% la carga administrativa telefónica, liberando tiempo valioso de los técnicos para reparar más rápido."
  },
  "logistica": {
    logoName: "Logística / Distribución / Mudanzas",
    chatInit: "Hola! Requiero cotizar una mudanza residencial local de 2 habitaciones.",
    chatReply: "¡Hola! Con gusto. En **{bizName}** ofrecemos la *Mudanza Local* con servicio de carga y embalaje desde $2,500. ¿Para qué fecha tienes planeado tu traslado? Te puedo generar una reserva provisional de camión ahora.",
    posProducts: [
      { id: 1, icon: '🚛', name: 'Flete Residencial Local', price: 2500 },
      { id: 2, icon: '📦', name: 'Material Embalaje Kit', price: 450 },
      { id: 3, icon: '🚛', name: 'Flete Foráneo / Kilómetro', price: 6500 },
      { id: 4, icon: '🛡️', name: 'Seguro de Carga / Tránsito', price: 800 },
      { id: 5, icon: '📦', name: 'Maniobra Especial Volado', price: 1200 },
      { id: 6, icon: '📋', name: 'Renta de Unidad por Día', price: 4500 }
    ],
    webTitle: "Mudanzas y Transportes de Confianza",
    webSlogan: "Cotiza tu envío o mudanza al instante, agenda recolectores con unidades equipadas y rastrea tu flete en tiempo real.",
    erpBottleneck: "Coordinación manual ineficiente de rutas y retraso de operadores.",
    erpOptimizeNode: "✅ Asignador de Rutas y POD Digital",
    erpOptimizeDesc: "Rutas óptimas autogeneradas por GPS con captura digital de firma de entrega del operador. Reduce retrasos un 25%.",
    aiAdvice: "Sustituir el papeleo de acuses de recibo tradicionales por confirmaciones digitales con firma y foto (Proof of Delivery) reduce las disputas de entrega al instante y acelera el proceso de facturación."
  },
  "otro": {
    logoName: "Otro Sector",
    chatInit: "Hola! Me interesa conocer más sobre sus servicios especializados y qué soluciones tienen.",
    chatReply: "¡Hola! Qué gusto saludarte. En **{bizName}** diseñamos software inteligente a la medida para optimizar tus flujos de trabajo. En especial, solucionamos tu problema: *\"{bizProblem}\"*. ¿Te gustaría agendar una demostración con nuestro equipo técnico?",
    posProducts: [
      { id: 1, icon: '⚙️', name: 'Solución Personalizada', price: 4500 },
      { id: 2, icon: '💻', name: 'Software a la Medida', price: 12000 },
      { id: 3, icon: '📊', name: 'Integración de API', price: 3500 },
      { id: 4, icon: '🧠', name: 'Consultoría Tecnológica', price: 2500 },
      { id: 5, icon: '🔧', name: 'Soporte y Garantía', price: 1500 },
      { id: 6, icon: '📈', name: 'Optimización de Procesos', price: 3000 }
    ],
    webTitle: "Tecnología a la Medida de tus Ideas",
    webSlogan: "Desarrollamos soluciones de software robustas e inteligentes. Automatizamos procesos, conectamos tus sistemas y expandimos tu negocio.",
    erpBottleneck: "Inoperancia y pérdida de tiempo por tareas manuales repetitivas.",
    erpOptimizeNode: "✅ Automatización de Procesos (RPA)",
    erpOptimizeDesc: "Robotización de flujos de trabajo administrativos. Ahorra hasta 20 horas semanales de trabajo manual.",
    aiAdvice: "Implementar integraciones personalizadas vía API y flujos automatizados de datos elimina errores de captura humana en un 95% y eleva la productividad global de tu administración."
  }
};

function getSectorProfile(sector) {
  if (!sector) return sectorProfiles.otro;
  const norm = sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (norm.includes("restaurante") || norm.includes("cafe") || norm.includes("comida") || norm.includes("bistro") || norm.includes("alimento") || norm.includes("panaderia") || norm.includes("taqueria") || norm.includes("pizzeria") || norm.includes("pasteleria") || norm.includes("cena")) {
    return sectorProfiles.restaurante;
  } else if (norm.includes("gimnasio") || norm.includes("gym") || norm.includes("fitness") || norm.includes("deporte") || norm.includes("entrenam") || norm.includes("cruzfit") || norm.includes("crossfit") || norm.includes("yoga") || norm.includes("box") || norm.includes("spa") || norm.includes("ejercicio")) {
    return sectorProfiles.gimnasio;
  } else if (norm.includes("mecanico") || norm.includes("automotriz") || norm.includes("taller") || norm.includes("auto") || norm.includes("coche") || norm.includes("carro") || norm.includes("llanta") || norm.includes("motor") || norm.includes("refaccion")) {
    return sectorProfiles.automotriz;
  } else if (norm.includes("estetica") || norm.includes("barber") || norm.includes("unas") || norm.includes("cabello") || norm.includes("corte") || norm.includes("salon") || norm.includes("peluquer") || norm.includes("maquillaje") || norm.includes("belleza")) {
    return sectorProfiles.estetica;
  } else if (norm.includes("veterinaria") || norm.includes("mascota") || norm.includes("perro") || norm.includes("gato") || norm.includes("canina") || norm.includes("animal")) {
    return sectorProfiles.veterinaria;
  } else if (norm.includes("reparacion") || norm.includes("computador") || norm.includes("celular") || norm.includes("laptop") || norm.includes("iphone") || norm.includes("tecnico") || norm.includes("soporte")) {
    return sectorProfiles.tecnologia;
  } else if (norm.includes("logistica") || norm.includes("transporte") || norm.includes("flete") || norm.includes("envio") || norm.includes("mudanza") || norm.includes("paqueteria") || norm.includes("distribucion") || norm.includes("almacen") || norm.includes("bodega")) {
    return sectorProfiles.logistica;
  } else if (norm.includes("tienda") || norm.includes("comercio") || norm.includes("retail") || norm.includes("ropa") || norm.includes("ventas") || norm.includes("boutique") || norm.includes("supermercado") || norm.includes("abarrotes") || norm.includes("compras")) {
    return sectorProfiles.comercio;
  } else if (norm.includes("servicio") || norm.includes("consultor") || norm.includes("abogado") || norm.includes("despacho") || norm.includes("oficina") || norm.includes("agencia") || norm.includes("asesor") || norm.includes("contador")) {
    return sectorProfiles.servicios;
  } else if (norm.includes("salud") || norm.includes("clinica") || norm.includes("doctor") || norm.includes("dentista") || norm.includes("medico") || norm.includes("hospital") || norm.includes("odontol") || norm.includes("pediatra")) {
    return sectorProfiles.salud;
  } else if (norm.includes("educacion") || norm.includes("curso") || norm.includes("escuela") || norm.includes("academia") || norm.includes("colegio") || norm.includes("clase") || norm.includes("taller") || norm.includes("universidad")) {
    return sectorProfiles.educacion;
  } else if (norm.includes("inmobiliaria") || norm.includes("raices") || norm.includes("casa") || norm.includes("departamento") || norm.includes("inmueble") || norm.includes("terreno")) {
    return sectorProfiles.inmobiliaria;
  } else if (norm.includes("manufactura") || norm.includes("fabrica") || norm.includes("produccion") || norm.includes("industrial")) {
    return sectorProfiles.manufactura;
  } else {
    // If it's a completely custom activity entered by the client, build a dynamic profile based on what they typed!
    return {
      logoName: sector,
      chatInit: `Hola! Me gustaría cotizar un servicio y horarios para mi actividad: ${sector}.`,
      chatReply: `¡Hola! Con gusto te atendemos en **{bizName}**. Optimizamos tu sector de forma autónoma. Específicamente, solucionamos tu problema: *"{bizProblem}"*. ¿Te interesa que coordinemos un diagnóstico?`,
      posProducts: [
        { id: 1, icon: '⚙️', name: `Servicio ${sector}`, price: 1200 },
        { id: 2, icon: '💻', name: `Software a Medida`, price: 8500 },
        { id: 3, icon: '📊', name: `Optimización IA`, price: 4500 },
        { id: 4, icon: '🧠', name: `Consultoría Integral`, price: 2500 },
        { id: 5, icon: '🔧', name: `Soporte Técnico`, price: 1500 },
        { id: 6, icon: '📈', name: `Integración Automatizada`, price: 3000 }
      ],
      webTitle: `Servicios Profesionales de ${sector}`,
      webSlogan: `Digitalizamos e impulsamos tu negocio de ${sector} con soluciones avanzadas e Inteligencia Artificial a la medida.`,
      erpBottleneck: `Cuello de botella en ${sector}: ${bizProblem}`,
      erpOptimizeNode: `✅ Flujo de ${sector} Optimizado`,
      erpOptimizeDesc: `Reglas de negocio inteligentes aplicadas para erradicar: "${bizProblem}". Ahorra hasta 22 horas semanales.`,
      aiAdvice: `En el negocio de ${sector}, implementar automatización IA de procesos en tareas administrativas repetitivas reduce los costos de operación hasta un 30% y erradica errores de captura manual en un 95%.`
    };
  }
function extractKeywords(text) {
  if (!text) return [];
  const stopwords = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "y", "o", "u", "e", "en", "para", "por", "con", "sin", "sobre", "tras", "durante", "desde", "hasta", "a", "al", "como", "que", "se", "lo", "su", "sus", "mi", "mis", "tu", "tus", "nuestro", "nuestra", "nuestros", "nuestras", "yo", "nosotros", "tengo", "necesito", "quiero", "problema", "vendo", "compro", "esto", "hacer", "cómo", "como", "giro", "negocio", "empresa", "sector", "servicio", "servicios", "para", "muy", "mas", "más", "bien", "esta", "este", "estos", "estas"
  ]);
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word));
}

function getSectorEmojis(sector) {
  if (!sector) return ['⚙️', '💻', '📊', '🧠', '🔧', '📈'];
  const norm = sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("restaurante") || norm.includes("cafe") || norm.includes("comida") || norm.includes("pasteleria") || norm.includes("taqueria")) {
    return ['🍔', '🍕', '🍰', '🌮', '☕', '🍟'];
  } else if (norm.includes("mueble") || norm.includes("muebleria") || norm.includes("carpinteria") || norm.includes("madera")) {
    return ['🪑', '🛏️', '🪵', '🪟', '💡', '🚪'];
  } else if (norm.includes("gym") || norm.includes("gimnasio") || norm.includes("deporte") || norm.includes("fitness")) {
    return ['💪', '🏃', '🏋️', '🧘', '👟', '🥤'];
  } else if (norm.includes("estetica") || norm.includes("salon") || norm.includes("barberia") || norm.includes("cabello")) {
    return ['✂️', '💈', '💇', '💅', '🧴', '💄'];
  } else if (norm.includes("veterinaria") || norm.includes("mascota") || norm.includes("perro") || norm.includes("gato")) {
    return ['🐶', '🐱', '🐾', '🦴', '🩺', '🏥'];
  } else if (norm.includes("reparacion") || norm.includes("tecnico") || norm.includes("celular") || norm.includes("computadora")) {
    return ['📱', '💻', '🔌', '🛠️', '⚙️', '🔧'];
  } else if (norm.includes("logistica") || norm.includes("transporte") || norm.includes("mudanza") || norm.includes("flete")) {
    return ['🚛', '📦', '🗺️', '🚚', '⚓', '⛽'];
  } else if (norm.includes("tienda") || norm.includes("comercio") || norm.includes("ropa") || norm.includes("boutique")) {
    return ['👕', '👜', '🏷️', '👟', '💳', '🎁'];
  } else if (norm.includes("salud") || norm.includes("clinica") || norm.includes("doctor") || norm.includes("hospital")) {
    return ['🩺', '🦷', '💊', '🏥', '📋', '🩹'];
  } else if (norm.includes("educacion") || norm.includes("escuela") || norm.includes("curso")) {
    return ['📚', '🎓', '✏️', '💻', '🍎', '📝'];
  } else if (norm.includes("inmobiliaria") || norm.includes("casa") || norm.includes("terreno")) {
    return ['🏠', '🏢', '🔑', '🗺️', '🏗️', '📋'];
  } else if (norm.includes("manufactura") || norm.includes("fabrica") || norm.includes("industrial")) {
    return ['🏭', '⚙️', '🛠️', '📦', '🚛', '📋'];
  }
  return ['⚙️', '💻', '📊', '🧠', '🔧', '📈'];
}

function buildProblemProfile(rawProfile) {
  const prof = { ...rawProfile };
  const prob = bizProblem.toLowerCase();
  
  // Detect currency preference from bizProblem or bizSector
  const isUSD = prob.includes('usd') || prob.includes('dolar') || prob.includes('dólar') || prob.includes('dolares') || prob.includes('dólares');
  prof.currencySymbol = isUSD ? 'USD' : 'MXN';
  
  const kws = extractKeywords(bizProblem + " " + bizSector);
  let category = 'operations';
  
  const matches = (list) => kws.some(kw => list.includes(kw));
  
  if (matches(["credito", "cobro", "cobranza", "pago", "abono", "mensualidad", "cartera", "cuotas", "financiar", "financiamiento", "moroso", "deuda"])) {
    category = 'credit';
  } else if (matches(["inventario", "stock", "almacen", "bodega", "existencias", "insumos", "cocina", "ingredientes", "materia", "refacciones", "piezas"])) {
    category = 'inventory';
  } else if (matches(["ventas", "clientes", "marketing", "prospectos", "cotizar", "vender", "atraer", "leads", "publicidad"])) {
    category = 'sales';
  } else if (matches(["reparacion", "tecnico", "reparar", "taller", "mantenimiento", "garantia", "soporte", "falla"])) {
    category = 'repair';
  } else if (matches(["entrega", "entregas", "domicilio", "flete", "envio", "envios", "transporte", "ruta", "rutas", "camion"])) {
    category = 'logistics';
  }

  const emojis = getSectorEmojis(bizSector);
  const kw1 = kws[0] || "servicio";
  const kw2 = kws[1] || "operación";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  
  prof.chatInit = "Hola, ¿cómo está funcionando el Asistente IA de mi negocio hoy?";
  prof.chatReply = "¡Hola! El Asistente IA de **" + bizName + "** está activo y operando 24/7. He automatizado la gestión de tu problema principal: *\"" + bizProblem + "\"*. Todo está sincronizado con tu ERP y punto de venta en tiempo real.";

  if (category === 'credit') {
    prof.posProducts = [
      { id: 1, icon: emojis[0], name: "Producto A (" + cap(kw1) + ")", price: 8000 },
      { id: 2, icon: emojis[1], name: "Producto B (" + cap(kw2) + ")", price: 12000 },
      { id: 3, icon: '💳', name: 'Abono de Crédito Semanal', price: 1500 },
      { id: 4, icon: '💰', name: 'Enganche Inicial Mueble', price: 3000 },
      { id: 5, icon: emojis[2], name: "Paquete Ahorro " + cap(kw1), price: 9500 },
      { id: 6, icon: '💡', name: 'Pago Mensual Mueble', price: 2500 }
    ];
    prof.webTitle = "Créditos y Financiamiento en " + bizSector;
    prof.webSlogan = "Adquiere lo que necesitas hoy mismo. Autorización de crédito inmediata con nuestra IA en 5 minutos en línea, con plazos flexibles a tu medida.";
    
    prof.detailedServices = [
      { icon: '💳', name: 'Crédito Express IA', desc: 'Pre-aprobación en línea usando tu identificación y firma biométrica en 3 minutos.', price: 0 },
      { icon: '📅', name: 'Abono Flexible', desc: 'Realiza tus pagos semanales o mensuales por WhatsApp con links seguros de Stripe.', price: 0 },
      { icon: '🛡️', name: 'Protección de Saldo', desc: 'Seguro de pagos incluido para mantener tu cuenta al corriente ante imprevistos.', price: 0 }
    ];
    
    prof.branchFinancials = {
      centro: {
        revenue: 342000, cogs: 110000, expenses: 65000, taxes: 37120,
        alerts: [
          { type: 'success', text: 'Cobranza automática: 48 pagos de abonos conciliados hoy.' },
          { type: 'info', text: 'Monitoreo de Cartera: Cartera vencida reducida al 2.5%.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: 'Solicitó crédito para comedor de madera', status: 'Aprobado' },
          { name: 'Sofía Lira', contact: '525567312903', note: 'Liquidó saldo de crédito', status: 'Cerrado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Auditar solicitudes de crédito del día', desc: 'Verificadas por IA' },
            { id: 2, title: 'Conciliación de mensualidades por transferencia', desc: 'Automatizado con SAT' }
          ],
          done: [
            { id: 3, title: 'Enviar avisos preventivos de pago por WhatsApp', desc: 'Completado por Asistente IA' }
          ]
        }
      },
      norte: {
        revenue: 215000, cogs: 72000, expenses: 48000, taxes: 22880,
        alerts: [
          { type: 'info', text: 'Sucursal Norte: Enlace contable SAT sincronizado.' },
          { type: 'warning', text: 'Retraso de abonos detectado en 3 clientes locales.' }
        ],
        leads: [
          { name: 'María Gómez', contact: '525531984210', note: 'Consulta de enganche inicial de recámara', status: 'Seguimiento' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Validar historial crediticio local', desc: 'Uso de buró regional' }
          ],
          done: [
            { id: 2, title: 'Llamar a clientes con aviso vencido', desc: 'Realizado por bot de cobranza' }
          ]
        }
      },
      sur: {
        revenue: 189000, cogs: 63000, expenses: 41000, taxes: 20160,
        alerts: [
          { type: 'success', text: 'Cobros domiciliados conciliados con terminal física.' }
        ],
        leads: [
          { name: 'Fernando Ortíz', contact: '525590123847', note: 'Liquidación anticipada de comedor rústico', status: 'Aprobado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Revisión de pagarés en bóveda de sucursal', desc: 'Auditoría interna semanal' }
          ],
          done: []
        }
      }
    };
    prof.erpBottleneck = "Gestión manual de abonos y control de cuentas a crédito.";
    prof.erpOptimizeNode = "✅ Gestor de Créditos e IA de Cobranza";
    prof.erpOptimizeDesc = "Monitoreo automático de saldos y alertas dinámicas de pago. Reduce la morosidad un 75%.";
    prof.aiAdvice = "Automatizar la facturación de cuotas, el cálculo de intereses y las notificaciones de cobranza mediante el Asistente IA disminuye la cartera vencida en un 40% y te ahorra 18 horas de trabajo administrativo a la semana.";
  }
  else if (category === 'inventory') {
    prof.posProducts = [
      { id: 1, icon: emojis[0], name: "Lote de " + cap(kw1), price: 4500 },
      { id: 2, icon: emojis[1], name: "Unidad de " + cap(kw2), price: 1200 },
      { id: 3, icon: '🪵', name: "Materia Prima (" + cap(kw1) + ")", price: 7500 },
      { id: 4, icon: emojis[2], name: "Insumos Básicos " + cap(kw2), price: 950 },
      { id: 5, icon: '🛠️', name: 'Kit Accesorios de Ensamble', price: 1200 },
      { id: 6, icon: '🎨', name: 'Material de Barniz / Acabado', price: 800 }
    ];
    prof.webTitle = "Inventario Sincronizado para " + bizSector;
    prof.webSlogan = "Fabricación y venta de " + bizSector + " de alta calidad, siempre disponibles en tiempo real en nuestra tienda física y web.";
    
    prof.detailedServices = [
      { icon: '📦', name: 'Sincronización de Stock', desc: 'Catálogo omnicanal. Cada venta física descuenta piezas de la tienda online de inmediato.', price: 0 },
      { icon: '🔔', name: 'Alertas de Stock Mínimo', desc: 'El sistema notifica al administrador cuando la materia prima llega al nivel de seguridad.', price: 0 },
      { icon: '🚛', name: 'Reabastecimiento Predictivo', desc: 'Generación autónoma de órdenes de compra para el proveedor antes de que falte material.', price: 0 }
    ];

    prof.branchFinancials = {
      centro: {
        revenue: 295000, cogs: 95000, expenses: 74000, taxes: 32000,
        alerts: [
          { type: 'success', text: 'Reabastecimiento automático: Orden de compra enviada al proveedor.' },
          { type: 'info', text: 'Inventario cuadriplicado y conciliado con el POS físico.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: "Consultó existencias de Lote de " + cap(kw1), status: 'Enviado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: "Auditar existencias de " + cap(kw1) + " en almacén", desc: 'Sincronizado' },
            { id: 2, title: 'Conciliación de stock físico vs virtual', desc: 'Automatizado' }
          ],
          done: [
            { id: 3, title: 'Actualizar precios de catálogo por lote', desc: 'Completado por IA' }
          ]
        }
      },
      norte: {
        revenue: 198000, cogs: 64000, expenses: 51000, taxes: 21440,
        alerts: [
          { type: 'warning', text: 'Inventario local: Stock bajo en insumos básicos de ' + cap(kw2) + '.' }
        ],
        leads: [
          { name: 'Sofía Lira', contact: '525567312903', note: 'Consultó disponibilidad de ensamble rápido', status: 'Seguimiento' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Revisión periódica de mermas locales', desc: 'Control físico semanal' }
          ],
          done: [
            { id: 2, title: 'Ordenar kit accesorios de ensamble', desc: 'Completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 165000, cogs: 53000, expenses: 43000, taxes: 17920,
        alerts: [
          { type: 'success', text: 'Conciliación de inventario con terminal central aprobada.' }
        ],
        leads: [],
        tasks: {
          todo: [
            { id: 1, title: 'Descargar facturas de remisión locales', desc: 'Pendiente' }
          ],
          done: []
        }
      }
    };

    prof.erpBottleneck = "Desfase de stock entre ventas físicas y tienda en línea.";
    prof.erpOptimizeNode = "✅ Inventario Omnicanal Predictivo";
    prof.erpOptimizeDesc = "Control de stock al segundo y generación autónoma de órdenes de compra. Evita el quiebre de inventario.";
    prof.aiAdvice = "Sincronizar existencias mediante un motor lógico disminuye en un 100% las ventas incidentales de artículos agotados y automatiza los pedidos a proveedores al instante.";
  }
  else if (category === 'sales') {
    prof.posProducts = [
      { id: 1, icon: emojis[0], name: "Cotización de " + cap(kw1), price: 15000 },
      { id: 2, icon: emojis[1], name: "Servicio Premium " + cap(kw2), price: 25000 },
      { id: 3, icon: '✨', name: "Diseño Especial " + cap(kw1), price: 3500 },
      { id: 4, icon: emojis[2], name: "Básico de " + cap(kw2), price: 9500 },
      { id: 5, icon: '🚚', name: 'Envío Express a Domicilio', price: 1200 },
      { id: 6, icon: '🛡️', name: 'Garantía Extendida', price: 1500 }
    ];
    prof.webTitle = "Impulsando Ventas en " + bizSector;
    prof.webSlogan = "Cotiza tu proyecto a la medida al instante. Nuestro Asistente IA te guía para elegir las dimensiones y especificaciones perfectas.";

    prof.detailedServices = [
      { icon: '✨', name: 'Cotizador Interactivo', desc: 'Calcula el precio de tu proyecto en segundos según requerimientos y acabados.', price: 0 },
      { icon: '🗣️', name: 'Atención Inteligente 24/7', desc: 'Respuestas automáticas sobre tarifas, tiempos de entrega y métodos de pago.', price: 0 },
      { icon: '🎁', name: 'Recompensas de Lealtad', desc: 'Acumula 5% de cashback en cada compra y accede a promociones exclusivas.', price: 0 }
    ];

    prof.branchFinancials = {
      centro: {
        revenue: 315000, cogs: 98000, expenses: 60000, taxes: 34720,
        alerts: [
          { type: 'success', text: 'CRM: 15 nuevos leads clasificados con alta intención de compra.' },
          { type: 'info', text: 'Tasa de conversión web aumentada un 28% gracias al cotizador IA.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: "Solicitó cotización de " + cap(kw1), status: 'Seguimiento' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Clasificar prospectos de WhatsApp entrantes', desc: 'Asistente IA' },
            { id: 2, title: 'Enviar propuestas de diseño personalizadas', desc: 'Pendiente' }
          ],
          done: [
            { id: 3, title: 'Campaña de retención de clientes inactivos', desc: 'Auto-ejecutado por IA' }
          ]
        }
      },
      norte: {
        revenue: 220000, cogs: 68000, expenses: 45000, taxes: 24320,
        alerts: [
          { type: 'info', text: 'Sucursal Norte: 8 prospectos asignados al cotizador automático.' }
        ],
        leads: [
          { name: 'Carlos Sosa', contact: '525529847120', note: 'Solicitó información sobre promociones', status: 'Aprobado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Llamar a cotizaciones vencidas de la semana', desc: 'Fila de ventas local' }
          ],
          done: [
            { id: 2, title: 'Enviar encuesta de satisfacción automatizada', desc: 'Completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 175000, cogs: 54000, expenses: 38000, taxes: 19360,
        alerts: [
          { type: 'success', text: 'Conversión local: Se incrementó la recompensa por lealtad a clientes.' }
        ],
        leads: [],
        tasks: {
          todo: [
            { id: 1, title: 'Revisión de ofertas de cashback aplicadas', desc: 'Reporte mensual' }
          ],
          done: []
        }
      }
    };

    prof.erpBottleneck = "Pérdida de prospectos y demora al generar cotizaciones de proyectos.";
    prof.erpOptimizeNode = "✅ CRM IA de Ventas y Seguimiento";
    prof.erpOptimizeDesc = "Clasificación automática de leads y generación de cotizaciones dinámicas. Incrementa cierres un 30%.";
    prof.aiAdvice = "Automatizar el seguimiento de prospectos por WhatsApp e implementar un cotizador inteligente reduce el tiempo de respuesta de horas a segundos, duplicando las posibilidades de conversión.";
  }
  else if (category === 'repair') {
    prof.posProducts = [
      { id: 1, icon: '🔧', name: "Reparación de " + cap(kw1), price: 1500 },
      { id: 2, icon: '🛠️', name: "Mantenimiento " + cap(kw2), price: 2500 },
      { id: 3, icon: emojis[0], name: "Piezas y Refacciones " + cap(kw1), price: 3500 },
      { id: 4, icon: '🔌', name: 'Diagnóstico y Calibración', price: 800 },
      { id: 5, icon: emojis[1], name: 'Instalación Completa', price: 4500 },
      { id: 6, icon: '🛡️', name: 'Garantía Técnica Extendida', price: 1200 }
    ];
    prof.webTitle = "Servicio Técnico Especializado en " + bizSector;
    prof.webSlogan = "Rastrea el estado de tu orden en línea en tiempo real. Autoriza presupuestos digitales y recibe garantía de satisfacción en mano.";

    prof.detailedServices = [
      { icon: '🔧', name: 'Diagnóstico Veloz', desc: 'Pruebas automáticas por sensores e IA para identificar la falla en segundos.', price: 0 },
      { icon: '🔔', name: 'Notificaciones de Estatus', desc: 'Mensajes de WhatsApp dinámicos conforme tu orden pasa de Ingresada a Lista.', price: 0 },
      { icon: '🛡️', name: 'Garantía Escrita', desc: 'Cobertura del 100% de mano de obra y refacciones aplicadas por 6 meses.', price: 0 }
    ];

    prof.branchFinancials = {
      centro: {
        revenue: 260000, cogs: 82000, expenses: 68000, taxes: 27800,
        alerts: [
          { type: 'success', text: 'Técnico IA: 24 presupuestos digitales autorizados hoy por clientes.' },
          { type: 'info', text: 'Disponibilidad de taller: Productividad de técnicos al 95%.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: "Reportó falla técnica en " + cap(kw1), status: 'En Taller' }
        ],
        tasks: {
          todo: [
            { id: 1, title: "Auditar órdenes de reparación de " + cap(kw1), desc: 'En progreso' },
            { id: 2, title: 'Actualizar catálogo de refacciones en almacén', desc: 'Pendiente' }
          ],
          done: [
            { id: 3, title: 'Notificar entrega de orden de servicio #409', desc: 'Completado por IA' }
          ]
        }
      },
      norte: {
        revenue: 180000, cogs: 56000, expenses: 52000, taxes: 19840,
        alerts: [
          { type: 'warning', text: 'Sucursal Norte: Esperando arribo de refacciones de importación.' }
        ],
        leads: [
          { name: 'David Flores', contact: '525531920384', note: 'Ingresó equipo para cambio de circuito de carga', status: 'En Taller' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Diagnóstico express en banco de trabajo 3', desc: 'Asignado a técnico local' }
          ],
          done: [
            { id: 2, title: 'Sincronizar pólizas de garantía de equipos entregados', desc: 'Completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 145000, cogs: 45000, expenses: 40000, taxes: 16000,
        alerts: [
          { type: 'success', text: 'Control de calidad: 100% de equipos reparados pasaron prueba de estrés.' }
        ],
        leads: [],
        tasks: {
          todo: [
            { id: 1, title: 'Limpieza e inspección de herramientas del taller', desc: 'Mantenimiento preventivo local' }
          ],
          done: []
        }
      }
    };

    prof.erpBottleneck = "Exceso de llamadas de clientes preguntando por el estado de su orden.";
    prof.erpOptimizeNode = "✅ Notificación de Status y Cotizador Digital";
    prof.erpOptimizeDesc = "Actualizaciones automáticas vía WhatsApp del flujo técnico. Reduce consultas un 65%.";
    prof.aiAdvice = "Notificar de forma autónoma cada fase del diagnóstico y reparación de equipos reduce un 60% la carga administrativa telefónica, liberando tiempo valioso de los técnicos para reparar más rápido.";
  }
  else if (category === 'logistics') {
    prof.posProducts = [
      { id: 1, icon: '🚛', name: "Flete de " + cap(kw1), price: 4500 },
      { id: 2, icon: '📦', name: "Envío Express " + cap(kw2), price: 1200 },
      { id: 3, icon: '🚚', name: 'Maniobras de Entrega Domicilio', price: 1500 },
      { id: 4, icon: '🛡️', name: 'Seguro de Carga Completo', price: 900 },
      { id: 5, icon: '⚓', name: "Flete Foráneo por Km", price: 8500 },
      { id: 6, icon: '📋', name: 'Renta de Unidad por Día', price: 4500 }
    ];
    prof.webTitle = "Logística y Envíos para " + bizSector;
    prof.webSlogan = "Cotiza tu envío o mudanza al instante, agenda recolectores con unidades equipadas y rastrea tu flete en tiempo real.";

    prof.detailedServices = [
      { icon: '🚚', name: 'Ruteador Inteligente', desc: 'Cálculo de rutas óptimas por GPS reduciendo en un 25% los tiempos de traslado.', price: 0 },
      { icon: '📝', name: 'POD Digital (Firma)', desc: 'Confirmación digital con firma en pantalla y foto del acuse al segundo de entregar.', price: 0 },
      { icon: '🔔', name: 'Rastreo SMS / WhatsApp', desc: 'Notificaciones automáticas al cliente cuando el transportista esté a 5 minutos.', price: 0 }
    ];

    prof.branchFinancials = {
      centro: {
        revenue: 330000, cogs: 105000, expenses: 75000, taxes: 34000,
        alerts: [
          { type: 'success', text: 'Logística: 12 rutas optimizadas y asignadas por IA hoy.' },
          { type: 'info', text: 'Tiempos de entrega promedio reducidos a 32 minutos.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: "Solicitó flete de " + cap(kw1), status: 'En Ruta' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Monitorear fletes foráneos activos', desc: 'GPS activo' },
            { id: 2, title: 'Conciliar viáticos y combustible de operadores', desc: 'Pendiente' }
          ],
          done: [
            { id: 3, title: 'Generar acuses digitales POD del día', desc: 'Completado por IA' }
          ]
        }
      },
      norte: {
        revenue: 210000, cogs: 68000, expenses: 54000, taxes: 22720,
        alerts: [
          { type: 'warning', text: 'Sucursal Norte: Operador demorado en caseta regional.' }
        ],
        leads: [
          { name: 'Carlos Sosa', contact: '525529847120', note: 'Agendó mudanza foránea para el fin de semana', status: 'Aprobado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Mantenimiento correctivo de unidad TR-102', desc: 'Falla mecánica menor' }
          ],
          done: [
            { id: 2, title: 'Timbrar Cartas Porte SAT del turno matutino', desc: 'Completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 165000, cogs: 52000, expenses: 44000, taxes: 18080,
        alerts: [
          { type: 'success', text: 'Logística Sur: Coordinación de acuses POD al 100%.' }
        ],
        leads: [],
        tasks: {
          todo: [
            { id: 1, title: 'Revisión de bitácoras de operadores locales', desc: 'Entrega semanal' }
          ],
          done: []
        }
      }
    };

    prof.erpBottleneck = "Coordinación manual ineficiente de rutas y retraso de operadores.";
    prof.erpOptimizeNode = "✅ Asignador de Rutas y POD Digital";
    prof.erpOptimizeDesc = "Rutas óptimas autogeneradas por GPS con captura digital de firma de entrega del operador. Reduce retrasos un 25%.";
    prof.aiAdvice = "Sustituir el papeleo de acuses de recibo tradicionales por confirmaciones digitales con firma y foto (Proof of Delivery) reduce las disputas de entrega al instante y acelera el proceso de facturación.";
  }
  else {
    prof.posProducts = [
      { id: 1, icon: emojis[0], name: "Servicio de " + cap(kw1), price: 1200 },
      { id: 2, icon: emojis[1], name: "Software de " + cap(kw2), price: 8500 },
      { id: 3, icon: '📊', name: "Optimización IA " + cap(kw1), price: 4500 },
      { id: 4, icon: '🧠', name: "Consultoría de " + cap(kw2), price: 2500 },
      { id: 5, icon: '🔧', name: 'Soporte Técnico Especializado', price: 1500 },
      { id: 6, icon: '📈', name: 'Integración Automatizada', price: 3000 }
    ];
    prof.webTitle = "Servicios Avanzados de " + bizSector;
    prof.webSlogan = "Digitalizamos e impulsamos tu negocio de " + bizSector + " con soluciones avanzadas e Inteligencia Artificial a la medida.";
    
    prof.detailedServices = [
      { icon: '⚙️', name: 'Procesos Optimizados', desc: 'Flujo administrativo digital de extremo a extremo sin errores de captura humana.', price: 0 },
      { icon: '📋', name: 'Agenda Coordinada', desc: 'Programación automática de entregas y visitas técnicas directamente en calendario.', price: 0 },
      { icon: '🛡️', name: 'Garantía Total', desc: 'Seguimiento y auditoría de calidad permanente de cada pieza producida.', price: 0 }
    ];

    prof.branchFinancials = {
      centro: {
        revenue: 275000, cogs: 88000, expenses: 70000, taxes: 29920,
        alerts: [
          { type: 'success', text: 'Eficiencia operativa: Tareas repetitivas reducidas un 80%.' },
          { type: 'info', text: 'Tableros de productividad del equipo actualizados en vivo.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: 'Agendó visita técnica a sucursal', status: 'Agendado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Organizar reportes semanales de producción', desc: 'Asignado a Asistente IA' },
            { id: 2, title: 'Coordinar entregas de la sucursal Centro', desc: 'Pendiente' }
          ],
          done: [
            { id: 3, title: 'Archivar facturas y conciliaciones bancarias', desc: 'Completado por IA' }
          ]
        }
      },
      norte: {
        revenue: 195000, cogs: 62000, expenses: 51000, taxes: 21280,
        alerts: [
          { type: 'info', text: 'Sucursal Norte: Servidor local de automatización operativo.' }
        ],
        leads: [
          { name: 'Sofía Lira', contact: '525567312903', note: 'Agendó llamada de soporte operativo', status: 'Seguimiento' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Revisión periódica de procesos administrativos', desc: 'Auditoría local' }
          ],
          done: [
            { id: 2, title: 'Archivar auditorías de XML del mes pasado', desc: 'Completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 160000, cogs: 51000, expenses: 43000, taxes: 17440,
        alerts: [
          { type: 'success', text: 'Eficiencia Sur: Procesamiento contable e informes al 100%.' }
        ],
        leads: [],
        tasks: {
          todo: [
            { id: 1, title: 'Inspección de sistemas de red locales', desc: 'Mantenimiento rutinario' }
          ],
          done: []
        }
      }
    };

    prof.erpBottleneck = "Lentitud operativa y pérdida de tiempo en reportes y tareas repetitivas.";
    prof.erpOptimizeNode = "✅ Automatización Operativa Global (RPA)";
    prof.erpOptimizeDesc = "Robotización de flujos de trabajo administrativos. Ahorra 22 horas de tareas manuales repetitivas.";
    prof.aiAdvice = "Automatizar los flujos de tareas, agendas e informes periódicos mediante un operador cognitivo disminuye drásticamente el tiempo desperdiciado en administración, elevando la eficiencia.";
  }
  
  prof.mission = "Facilitar la adquisición de productos y servicios de alta calidad en " + bizSector + ", impulsando la transformación digital del sector.";
  prof.vision = "Consolidar a **" + bizName + "** como el referente nacional, integrando tecnología IA para optimizar la experiencia de cliente.";
  prof.values = "Transparencia, Confianza, Innovación y Enfoque en el Cliente.";
  
  return prof;
}

function generateDynamicScenarios(category) {
  const kws = extractKeywords(bizProblem + " " + bizSector);
  const kw1 = kws[0] || "servicio";
  const kw2 = kws[1] || "operación";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const emojis = getSectorEmojis(bizSector);

  if (category === 'credit') {
    return [
      {
        title: "Autorizando Crédito",
        channel: "whatsapp",
        logs: [
          "[NLP] Analizando solicitud entrante de Juan Pérez...",
          "[Risk_Engine] Evaluando buró de crédito del cliente...",
          "[Contract_API] Generando pagaré digital con firma biométrica..."
        ],
        incoming: "Hola! Quiero solicitar el crédito para comprar el producto " + cap(kw1) + ", ¿qué necesito?",
        outgoing: "✅ **Crédito Pre-Aprobado**: ¡Hola, Juan! Tu solicitud para el/la *" + cap(kw1) + "* fue autorizada con éxito. Tu abono será de $1,500 MXN semanales. Adjunto tu contrato digital firmado para confirmación: [DOCUMENTO]|Contrato de Crédito - " + bizName + "|Pago de $1,500 MXN semanales|AUTORIZADO",
        vars: { active_credit: cap(kw1), monthly_payment: 1500, credit_status: "Autorizado" }
      },
      {
        title: "Notificación de Pago de Mensualidad",
        channel: "whatsapp",
        logs: [
          "[Scheduler] Buscando abonos programados para hoy...",
          "[Stripe_API] Creando link de pago dinámico seguro para abono..."
        ],
        incoming: "🔔 [SISTEMA] Recordatorio automático enviado a María Gómez: Su abono semanal de $350 MXN vence mañana.",
        outgoing: "✅ **Recordatorio Enviado**: Estimada María, le recordamos que su abono vence mañana. Puede pagar de forma segura aquí: [PAYMENT_CARD]|Abono Semanal de Crédito|Folio de Contrato: C-4091|$350.00 MXN",
        vars: { overdue_warnings: "Ninguno", last_payment_link: "Generado" }
      },
      {
        title: "Conciliación de Transferencias",
        channel: "widget",
        logs: [
          "[RPA] Leyendo estado de cuenta bancario entrante...",
          "[OCR] Extrayendo concepto de transferencia 'Abono C-4091'...",
          "[ERP_API] Aplicando abono al saldo de cuenta del cliente..."
        ],
        incoming: "📊 [SISTEMA] Conciliación de transferencia SPEI de María Gómez por $350.00 MXN recibida con éxito.",
        outgoing: "✅ **Conciliación Exitosa**: El abono de $350.00 MXN fue aplicado automáticamente al contrato C-4091 de María Gómez. Su saldo restante se actualizó en el ERP contable.",
        vars: { bank_reconciliation: "Completada", processed_payments_today: 12 }
      },
      {
        title: "Reporte de Cartera de Crédito",
        channel: "messenger",
        logs: [
          "[SQL] query_credit_portfolio(status: 'all')",
          "[NLP] Generando resumen contable para dirección..."
        ],
        incoming: "Dame el reporte del estado de la cartera de crédito de hoy.",
        outgoing: "Aquí tienes el estado actual para **" + bizName + "**:\n📈 **Créditos Activos**: 142 contratos\n💳 **Cobrado este mes**: $98,400.00 MXN\n🟢 **Al corriente**: 97.5% | 🔴 **Vencido**: 2.5%\n*Todos los movimientos conciliados con el SAT de forma autónoma.*",
        vars: { active_credits_count: 142, delinquency_rate: "2.5%" }
      },
      {
        title: "Dudas sobre Requisitos de Crédito",
        channel: "whatsapp",
        logs: [
          "[NLP] Analizando dudas frecuentes sobre apertura de crédito..."
        ],
        incoming: "¿Qué papeles necesito para sacar un comedor a crédito?",
        outgoing: "Para autorizar tu crédito en **" + bizName + "** solo requiero:\n1. Foto de tu INE vigente.\n2. Comprobante de domicilio reciente.\nEl proceso es 100% digital y te respondo en menos de 3 minutos aquí mismo.",
        vars: { query_type: "requisitos_credito" }
      },
      {
        title: "Llamada de Cobranza Preventiva",
        channel: "messenger",
        logs: [
          "[SpeechToText] Transcribiendo buzón de voz entrante con Whisper...",
          "[NLP] Clasificando intención del cliente: 'Compromiso de pago'..."
        ],
        incoming: "📞 [SISTEMA] Mensaje de voz de cliente: 'Hola, tuve un retraso pero mañana hago mi transferencia de abono'.",
        outgoing: "📞 **Llamada de Cobranza Procesada**: El cliente se comprometió a pagar mañana. El Asistente IA agendó la alerta de seguimiento en el CRM y suspendió de forma preventiva los avisos robóticos.",
        vars: { follow_up_needed: "Mañana", alert_suspended: true }
      },
      {
        title: "Alerta de Cuenta Delicada",
        channel: "widget",
        logs: [
          "[Risk_Engine] Analizando comportamiento de pagos históricos...",
          "[NLP] Generando alerta de riesgo de impago en panel de control..."
        ],
        incoming: "🚨 [SISTEMA] Alerta: El cliente Carlos Sosa ha omitido su abono por segunda semana consecutiva.",
        outgoing: "🚨 **Alerta de Riesgo**: Se detectó una cuenta con 2 semanas de atraso. He generado una tarea prioritaria en el Kanban del ERP para contacto directo por un asesor humano y pausé los avisos robóticos.",
        vars: { high_risk_accounts: 1, action_taken: "Kanban ticket created" }
      },
      {
        title: "Liquidación Anticipada de Saldo",
        channel: "whatsapp",
        logs: [
          "[DB] query_credit_balance(client: 'Sofía Lira')",
          "[Stripe] Calculando descuento por liquidación anticipada (10%)..."
        ],
        incoming: "Quiero liquidar mi saldo pendiente de mi comedor, ¿tengo algún descuento?",
        outgoing: "¡Hola, Sofía! Claro que sí. Tu saldo pendiente al día de hoy es de $4,500 MXN. Al liquidar de forma anticipada, aplicamos un 10% de descuento. El total a pagar es de $4,050 MXN. Puedes pagar aquí: [PAYMENT_CARD]|Liquidación de Crédito Comedor|Descuento 10% applied|$4,050.00 MXN",
        vars: { discount_applied: "10%", total_liquidated: 4050 }
      },
      {
        title: "Abono Exitoso en POS",
        channel: "widget",
        logs: [
          "[POS_API] Registrando pago de abono presencial en sucursal...",
          "[SAT_API] Generando CFDI 4.0 con método de pago PPD/LPD..."
        ],
        incoming: "📊 [SISTEMA] Abono de $1,500.00 MXN cobrado con tarjeta en la sucursal Centro.",
        outgoing: "✅ **Pago Registrado**: El abono de $1,500.00 MXN fue recibido en caja. El sistema emitió la factura fiscal y actualizó el estado de cuenta del cliente en el ERP de de inmediato.",
        vars: { last_cash_register_sync: "Hace 1 min", active_cash_drawer: "Sincronizada" }
      },
      {
        title: "Geolocalización de Cobros",
        channel: "messenger",
        logs: [
          "[Google_Maps] Buscando ubicaciones de clientes con abonos pendientes hoy..."
        ],
        incoming: "¿Me das el mapa de clientes de cobranza del día de hoy?",
        outgoing: "📍 **Ruta de Cobros**: He mapeado 3 ubicaciones con cobros programados para entrega de recibos físicos. El mapa de cobertura en tu ERP ha sido actualizado con los pines de ruta óptimos.",
        vars: { active_pins: 3, route_optimized: true }
      },
      {
        title: "Resumen de Contratos Nuevos",
        channel: "whatsapp",
        logs: [
          "[DB] count_new_contracts(date: 'today')",
          "[NLP] Compilando resumen de cierres de crédito..."
        ],
        incoming: "¿Cuántos créditos se abrieron hoy?",
        outgoing: "📝 **Resumen del Día**: Hoy se abrieron **5 nuevos créditos** de muebles por un valor total de $75,000 MXN. Todos los expedientes cuentan con INE y firma digital válidos.",
        vars: { new_credits_today: 5, total_credit_value: 75000 }
      }
    ];
  }
  else if (category === 'inventory') {
    return [
      {
        title: "Alerta de Stock Bajo",
        channel: "whatsapp",
        logs: [
          "[Inventory] check_stock_levels()...",
          "[DB] Alerta: Insumo '" + cap(kw1) + "' por debajo del mínimo de seguridad..."
        ],
        incoming: "🚨 [SISTEMA] Alerta: Quedan solo 2 unidades de " + cap(kw1) + " en el almacén de producción.",
        outgoing: "🚨 **Alerta de Almacén**: He detectado stock crítico de *" + cap(kw1) + "*. Para evitar paros en la producción, redacté una orden de reabastecimiento automática para tu proveedor de confianza.",
        vars: { low_stock_item: cap(kw1), current_qty: 2, safety_min: 10 }
      },
      {
        title: "Reordenando al Proveedor",
        channel: "widget",
        logs: [
          "[Supplier_API] create_purchase_order(item: '" + cap(kw1) + "', qty: 25)...",
          "[Email_Sender] Enviando orden de compra en PDF al proveedor..."
        ],
        incoming: "🔔 [SISTEMA] Orden de compra #PO-902 por 25 unidades de " + cap(kw1) + " enviada automáticamente.",
        outgoing: "✅ **Orden de Compra Enviada**: Se solicitó el reabastecimiento de 25 unidades de " + cap(kw1) + ". El proveedor confirmó entrega para mañana a las 9:00 AM.",
        vars: { purchase_order_sent: true, eta_delivery: "Mañana 9:00 AM" }
      },
      {
        title: "Ingreso de Mercancía al Almacén",
        channel: "messenger",
        logs: [
          "[RPA] Escaneando nota de remisión entrante del transportista...",
          "[Inventory_API] Actualizando stock físico de tableros a 27 unidades..."
        ],
        incoming: "📥 [SISTEMA] Recepción de 25 unidades de " + cap(kw1) + " confirmada e ingresada al almacén.",
        outgoing: "✅ **Inventario Actualizado**: El stock de " + cap(kw1) + " se actualizó a 27 unidades en el ERP. El cuello de botella en producción ha sido resuelto.",
        vars: { stock_restocked: cap(kw1), total_qty: 27 }
      },
      {
        title: "Reporte de Existencias del Día",
        channel: "whatsapp",
        logs: [
          "[SQL] query_inventory_status(branch: 'all')"
        ],
        incoming: "Dame el reporte del estado de existencias del almacén.",
        outgoing: "Aquí tienes el reporte de existencias para **" + bizName + "**:\n🪵 **" + cap(kw1) + "**: 27 unidades (Suficiente)\n🪛 **" + cap(kw2) + "**: 45 unidades (Suficiente)\n*Inventario físico al 100% cuadriplicado con el POS.*",
        vars: { in_stock_items: 2, critical_items: 0 }
      },
      {
        title: "Consulta de Stock desde POS",
        channel: "widget",
        logs: [
          "[POS_API] query_available_stock(item: '" + cap(kw1) + "')"
        ],
        incoming: "¿Hay existencias disponibles de " + cap(kw1) + " para entrega hoy?",
        outgoing: "🔍 **Existencias en POS**: Sí, tenemos 3 unidades de *" + cap(kw1) + "* en la sucursal Centro listas para entrega inmediata. Si se vende una, el catálogo digital se actualizará automáticamente.",
        vars: { available_qty: 3, warehouse: "Centro" }
      },
      {
        title: "Ajuste de Mermas Físicas",
        channel: "messenger",
        logs: [
          "[Audit_Engine] Comparando reporte de mermas vs stock en sistema..."
        ],
        incoming: "Reporto 1 unidad de " + cap(kw1) + " dañado en el área operativa hoy.",
        outgoing: "🔧 **Ajuste Realizado**: Registré 1 unidad de " + cap(kw1) + " como merma por daño operativo. El inventario en el ERP se ajustó y el costo fue cargado a la cuenta de gastos contables.",
        vars: { adjust_type: "merma", adjusted_qty: 1 }
      },
      {
        title: "Recepción de Unidades Terminadas",
        channel: "whatsapp",
        logs: [
          "[Factory_API] Confirmando ensamble de producto terminado..."
        ],
        incoming: "🔨 [TALLER] Comedor terminado y listo para entrega.",
        outgoing: "✅ **Producto Ingresado**: Registré el ingreso de 1 Comedor a la sucursal Centro. El stock de materias primas fue descontado automáticamente según la receta de producción.",
        vars: { product_finished: "Comedor", status: "Listo para entrega" }
      },
      {
        title: "Envío de Alertas a Producción",
        channel: "widget",
        logs: [
          "[Scheduler] Analizando pedidos de clientes pendientes de fabricar..."
        ],
        incoming: "¿Qué pedidos están en fila de fabricación hoy?",
        outgoing: "📋 **Fila de Fabricación**: Tienes 2 comedores y 1 recámara pendientes en el taller. Las materias primas necesarias están reservadas en el almacén de forma exclusiva.",
        vars: { pending_builds: 3 }
      },
      {
        title: "Conciliación de Almacén Mensual",
        channel: "messenger",
        logs: [
          "[RPA] Comparando inventario teórico vs conteo cíclico físico..."
        ],
        incoming: "Ejecuta la conciliación de fin de mes del almacén.",
        outgoing: "📊 **Conciliación de Fin de Mes**: Procesé 120 partidas. Discrepancia del 0%. El inventario teórico y físico coinciden a la perfección. Reporte enviado al correo del administrador.",
        vars: { reconciliation_variance: "0%", status: "Aprobada" }
      },
      {
        title: "Sincronización con Tienda Web",
        channel: "whatsapp",
        logs: [
          "[Web_API] push_stock_update(item: 'Recámara King Size', qty: 2)..."
        ],
        incoming: "🔔 [SISTEMA] Stock de Recámara King Size actualizado de forma automática en Shopify.",
        outgoing: "✅ **Sincronización Web**: La disponibilidad de *Recámara King Size* fue actualizada a 2 unidades en tu página web tras completarse la venta en el POS físico.",
        vars: { web_sync_success: true }
      },
      {
        title: "Resumen de Movimientos de Stock",
        channel: "widget",
        logs: [
          "[DB] count_stock_movements_today()"
        ],
        incoming: "¿Cuántos movimientos de almacén se registraron hoy?",
        outgoing: "🪵 **Movimientos del Día**: Se registraron 18 movimientos de almacén (12 consumos, 2 entradas de proveedores y 4 ingresos de producto terminado). Todo auditado en tiempo real.",
        vars: { stock_movements_today: 18 }
      }
    ];
  }
  else if (category === 'sales') {
    return [
      {
        title: "Captura de Lead por Chatbot",
        channel: "whatsapp",
        logs: [
          "[NLP] Detectando prospecto interesado en comedor en WhatsApp...",
          "[CRM_API] Creando registro de prospecto de forma autónoma..."
        ],
        incoming: "Hola, me interesa comprar un comedor de madera pero quiero cotizar a una medida especial.",
        outgoing: "¡Hola! Con gusto te cotizo. El *Comedor de Madera 6S* personalizado está en promoción. He tomado tus datos y un asesor te enviará los bocetos de medidas. Tu ID de prospecto en el CRM es: [LEAD]|Carlos Sosa|Cotización Comedor Medida Especial|WhatsApp",
        vars: { active_lead: "Carlos Sosa", interest: "Comedor Medida", status: "Cotizando" }
      },
      {
        title: "Envío Automático de Cotización",
        channel: "whatsapp",
        logs: [
          "[NLP] Formateando propuesta de costo en formato PDF...",
          "[Email_API] Enviando propuesta a carlossosa@email.com..."
        ],
        incoming: "🔔 [SISTEMA] Cotización #QT-201 por $11,500 MXN enviada automáticamente a carlossosa@email.com.",
        outgoing: "✅ **Cotización Enviada**: Carlos, he enviado la cotización formal a tu correo. Cuenta con un diseño adaptado y desglose de IVA. ¿Te gustaría agendar una llamada con el diseñador?",
        vars: { quote_sent: true, value: 11500 }
      },
      {
        title: "Recordatorio de Prospecto Frío",
        channel: "widget",
        logs: [
          "[CRM] Buscando cotizaciones sin respuesta hace 3 días...",
          "[NLP] Redactando mensaje de seguimiento persuasivo..."
        ],
        incoming: "🔔 [SISTEMA] Seguimiento enviado automáticamente a Sofía Lira sobre su cotización de Sofá Modular.",
        outgoing: "✅ **Seguimiento Enviado**: Sofía, te recordamos que tu cotización del *Sofá Modular Premium* con 15% de descuento vence mañana. ¿Te gustaría procesar tu pedido hoy?",
        vars: { follow_up_leads: 1, active_discount: "15%" }
      },
      {
        title: "Cierre de Venta Exitoso",
        channel: "messenger",
        logs: [
          "[Stripe] Confirmando pago de enganche de Sofía Lira...",
          "[CRM_API] Marcando Lead como 'CERRADO / GANADO'..."
        ],
        incoming: "Listo, acabo de pagar el enganche para apartar mi Sofá Modular.",
        outgoing: "🎉 **¡Felicidades por tu compra!**: Sofía, recibimos tu pago con éxito. Tu pedido ha ingresado a la fila de fabricación. Tu comprobante de pago fue enviado a tu correo.",
        vars: { deal_closed: "Sofía Lira", value: 12000, crm_status: "Ganado" }
      },
      {
        title: "Reporte de Conversión de Leads",
        channel: "whatsapp",
        logs: [
          "[SQL] query_crm_conversion_rates()"
        ],
        incoming: "Dame el reporte de ventas del CRM de esta semana.",
        outgoing: "Aquí tienes el reporte para **" + bizName + "**:\n📈 **Nuevos Leads**: 28 prospectos\n🏆 **Ventas Cerradas**: 8 pedidos ($96,000 MXN)\n🟢 **Conversión**: 28.5% (+5% vs semana pasada)\n*Base de datos de clientes actualizada en el ERP.*",
        vars: { new_leads_this_week: 28, closed_deals: 8 }
      },
      {
        title: "Consulta de Horarios de Sucursal",
        channel: "messenger",
        logs: [
          "[NLP] Buscando horarios de atención de la sucursal..."
        ],
        incoming: "¿A qué hora abren la sucursal Centro los fines de semana?",
        outgoing: "La sucursal Centro de **" + bizName + "** está abierta los sábados de 9:00 AM a 7:00 PM and los domingos de 10:00 AM a 5:00 PM. ¡Te esperamos!",
        vars: { query: "horarios_sucursal" }
      },
      {
        title: "Solicitud de Soporte Posventa",
        channel: "whatsapp",
        logs: [
          "[Ticket_API] Creando ticket de soporte posventa en el sistema..."
        ],
        incoming: "Hola, mi comedor llegó hoy pero tiene un raspón en una pata.",
        outgoing: "Lamento mucho el inconveniente. He levantado un reporte de garantía de inmediato. Un técnico te contactará mañana para programar la reparación a domicilio sin costo. Folio de Ticket: #TK-802.",
        vars: { support_ticket_raised: true, ticket_id: "TK-802" }
      },
      {
        title: "Envío de Encuesta de Satisfacción",
        channel: "widget",
        logs: [
          "[Scheduler] Enviando link de evaluación de servicio técnico..."
        ],
        incoming: "📊 [SISTEMA] Encuesta de satisfacción enviada al cliente Carlos Sosa.",
        outgoing: "✅ **Encuesta Enviada**: Le pedimos a Carlos evaluar nuestro servicio. Sus respuestas se registrarán automáticamente en su expediente de cliente del CRM.",
        vars: { survey_sent: true }
      },
      {
        title: "Feedback Positivo de Cliente",
        channel: "messenger",
        logs: [
          "[NLP] Analizando sentimiento: 'Excelente y muy rápidos'..."
        ],
        incoming: "Excelente servicio, todo quedó perfecto y me atendieron muy rápido.",
        outgoing: "🎉 **¡Excelente!**: Agradecemos tu calificación. La nota de felicitación por rapidez ha sido añadida al perfil de rendimiento del equipo.",
        vars: { client_rating: 5, status: "Excelente" }
      },
      {
        title: "Recomendación de Compra Cruzada",
        channel: "whatsapp",
        logs: [
          "[Rec_Engine] Buscando equipos sin mantenimiento preventivo..."
        ],
        incoming: "🔔 [SISTEMA] Oferta especial de compra cruzada enviada automáticamente a clientes recurrentes.",
        outgoing: "✅ **Oferta Enviada**: Le sugerimos al cliente agregar un accesorio de mantenimiento con un 20% de descuento adicional hoy.",
        vars: { cross_sell: "Accesorios", discount: "20%" }
      },
      {
        title: "Resumen de Cierres de Venta",
        channel: "widget",
        logs: [
          "[DB] count_sales_closed_today()"
        ],
        incoming: "¿Cuántas ventas cerramos hoy?",
        outgoing: "🎉 **Resumen de Cierres**: Hoy se cerraron **3 ventas** por un valor total de $39,500 MXN. Todos los clientes recibieron su ticket digital de compra.",
        vars: { sales_closed_today: 3, total_revenue_today: 39500 }
      }
    ];
  }
  else if (category === 'repair') {
    return [
      {
        title: "Ingresando Orden de Servicio",
        channel: "whatsapp",
        logs: [
          "[NLP] Recibiendo solicitud de estatus de reparación...",
          "[DB] Buscando orden de servicio activa en base de datos..."
        ],
        incoming: "Hola! ¿Ya ingresaron mi laptop para reparación?",
        outgoing: "✅ **Orden Registrada**: ¡Hola! Sí, tu equipo fue registrado en el taller con el Folio #SR-4092. Nuestro técnico IA completó el diagnóstico inicial de hardware. Adjunto tu comprobante de ingreso: [DOCUMENTO]|Comprobante de Ingreso Técnico - " + bizName + "|Folio Orden: SR-4092|INGRESADO",
        vars: { repair_order: "SR-4092", status: "Diagnóstico inicial" }
      },
      {
        title: "Diagnóstico de Falla por IA",
        channel: "whatsapp",
        logs: [
          "[Diagnostic_Engine] Analizando reporte de voltaje de tarjeta madre...",
          "[NLP] Redactando cotización de refacciones y mano de obra..."
        ],
        incoming: "🔔 [SISTEMA] Alerta: Diagnóstico completado para Folio SR-4092. Falla detectada en chip de carga.",
        outgoing: "✅ **Diagnóstico Enviado**: El reporte técnico indica falla en el circuito integrado de carga. El costo de reparación es de $1,500 MXN. Puedes autorizar y pagar de forma segura aquí: [PAYMENT_CARD]|Reparación de Circuito de Carga|Folio SR-4092|$1,500.00 MXN",
        vars: { cost: 1500, parts_needed: "Chip Carga" }
      },
      {
        title: "Reordenando Refacciones",
        channel: "widget",
        logs: [
          "[Supplier_API] Buscando chip de carga en almacén de refacciones...",
          "[POS_API] Generando orden de compra exprés de autoparte..."
        ],
        incoming: "📥 [SISTEMA] Solicitud de reabastecimiento de 'Chip Carga' enviada automáticamente al proveedor de electrónica.",
        outgoing: "✅ **Refacción Solicitada**: Orden PO-881 enviada. El chip de carga llegará mañana a primera hora al taller de servicio.",
        vars: { purchase_order: "PO-881", eta_part: "Mañana" }
      },
      {
        title: "Autorización de Presupuesto",
        channel: "messenger",
        logs: [
          "[CRM] Esperando confirmación de cliente...",
          "[DB] Cliente autorizó presupuesto de reparación vía web..."
        ],
        incoming: "Listo, autorizo el presupuesto de $1,500 MXN para proceder con la reparación.",
        outgoing: "✅ **Presupuesto Autorizado**: Muchas gracias. He cambiado el estatus del equipo SR-4092 a *En Proceso de Reparación*. El técnico iniciará el ensamble del nuevo circuito en cuanto llegue la pieza.",
        vars: { repair_status: "En Proceso", approval_received: true }
      },
      {
        title: "Reparación Finalizada",
        channel: "whatsapp",
        logs: [
          "[Taller_API] Confirmando pruebas de voltaje exitosas en osciloscopio...",
          "[NLP] Generando mensaje de entrega lista para cliente..."
        ],
        incoming: "🔔 [SISTEMA] Reparación completada y verificada para la Orden SR-4092.",
        outgoing: "🎉 **¡Tu equipo está listo!**: El circuito de carga fue reemplazado y las pruebas de control de calidad resultaron exitosas. Puedes pasar a recogerlo en la sucursal Centro.",
        vars: { order_ready: true, status: "Listo para entrega" }
      },
      {
        title: "Consulta de Horarios de Taller",
        channel: "messenger",
        logs: [
          "[NLP] Analizando intenciones sobre horarios del área técnica..."
        ],
        incoming: "¿A qué hora puedo pasar a recoger mi equipo en la sucursal?",
        outgoing: "Nuestros horarios de entrega técnica en **" + bizName + "** son de lunes a viernes de 9:00 AM a 7:00 PM y sábados de 10:00 AM a 3:00 PM. ¡Te esperamos!",
        vars: { query: "horarios_entrega" }
      },
      {
        title: "Garantía Técnica Levantada",
        channel: "whatsapp",
        logs: [
          "[Ticket_API] Registrando póliza de garantía extendida por 6 meses..."
        ],
        incoming: "¿El trabajo cuenta con alguna garantía por si vuelve a fallar?",
        outgoing: "Por supuesto. Todos nuestros servicios en **" + bizName + "** cuentan con una garantía de 6 meses en mano de obra y refacciones. Tu póliza digital ya está adjunta a tu folio SR-4092.",
        vars: { warranty_active: true, warranty_months: 6 }
      },
      {
        title: "Encuesta de Satisfacción Técnica",
        channel: "widget",
        logs: [
          "[Scheduler] Enviando link de evaluación de servicio técnico..."
        ],
        incoming: "📊 [SISTEMA] Encuesta de servicio técnico enviada al cliente Carlos Sosa.",
        outgoing: "✅ **Encuesta Enviada**: Le pedimos a Carlos evaluar la atención y el tiempo de respuesta del taller. Los resultados se guardarán automáticamente en su CRM contable.",
        vars: { survey_sent: true }
      },
      {
        title: "Feedback Técnico de Cliente",
        channel: "messenger",
        logs: [
          "[NLP] Analizando sentimiento: 'Excelente y muy rápidos'..."
        ],
        incoming: "Excelente servicio, mi laptop quedó como nueva y me la entregaron en menos de 24 horas.",
        outgoing: "🎉 **¡Excelente!**: Agradecemos tu calificación. La nota de felicitación por rapidez ha sido añadida al perfil de rendimiento del técnico asignado.",
        vars: { client_rating: 5, status: "Excelente" }
      },
      {
        title: "Recomendación de Mantenimiento",
        channel: "whatsapp",
        logs: [
          "[Rec_Engine] Buscando equipos sin mantenimiento preventivo hace 6 meses..."
        ],
        incoming: "🔔 [SISTEMA] Oferta de mantenimiento preventivo anual enviada automáticamente a clientes recurrentes.",
        outgoing: "✅ **Mantenimiento Preventivo**: Le sugerimos al cliente realizar una limpieza física y cambio de pasta térmica con un 20% de descuento para prolongar la vida útil de su equipo.",
        vars: { cross_sell: "Mantenimiento", discount: "20%" }
      },
      {
        title: "Resumen de Órdenes del Taller",
        channel: "widget",
        logs: [
          "[DB] count_repaired_orders_today()"
        ],
        incoming: "¿Cuántos servicios técnicos se finalizaron hoy?",
        outgoing: "🔧 **Resumen de Taller**: Hoy se completaron **14 reparaciones** y se autorizaron **8 nuevos presupuestos**. El ERP contable se actualizó con $21,000 MXN en ingresos de taller.",
        vars: { completed_repairs_today: 14, revenue_today: 21000 }
      }
    ];
  }
  else if (category === 'logistics') {
    return [
      {
        title: "Cotizando Flete / Mudanza",
        channel: "whatsapp",
        logs: [
          "[NLP] Analizando origen y destino de flete...",
          "[Google_Maps_API] Calculando distancia de trayecto (15 km)...",
          "[Pricing_Engine] Calculando tarifa base de flete residencial..."
        ],
        incoming: "Hola! Requiero cotizar una mudanza local para trasladar muebles de una casa de 2 recámaras.",
        outgoing: "✅ **Cotización de Flete**: ¡Hola! Con gusto. En **" + bizName + "** ofrecemos la *Mudanza Local* con servicio de carga y embalaje desde $4,500 MXN. Te adjunto la propuesta formal con link de pago: [DOCUMENTO]|Propuesta de Flete Residencial - " + bizName + "|Mudanza 2 Recámaras - 15 km|$4,500.00 MXN|VIGENTE",
        vars: { trip_distance: "15 km", estimated_price: 4500 }
      },
      {
        title: "Asignando Operador y Ruta",
        channel: "widget",
        logs: [
          "[Logistics] check_available_trucks()...",
          "[GPS_Router] Generando ruta de entrega más eficiente por autopista...",
          "[RPA] Asignando pedido a la unidad #TR-301..."
        ],
        incoming: "🔔 [SISTEMA] Flete programado asignado a la Unidad TR-301 (Operador: Jorge Pérez).",
        outgoing: "✅ **Logística Programada**: He asignado la mudanza a Jorge Pérez en la unidad TR-301. La ruta óptima ha sido enviada a su terminal móvil para evitar zonas de tráfico.",
        vars: { truck_assigned: "TR-301", driver: "Jorge Pérez" }
      },
      {
        title: "Envío en Ruta y Link de Tracking",
        channel: "whatsapp",
        logs: [
          "[GPS] Tracking activo en tiempo real para unidad TR-301...",
          "[Stripe] Generando liga de cobro final para saldo pendiente..."
        ],
        incoming: "🔔 [SISTEMA] Mensaje automático de WhatsApp enviado al cliente: Jorge Pérez está en camino a tu domicilio.",
        outgoing: "✅ **Notificación de Tránsito**: Estimado cliente, Jorge Pérez se encuentra en trayecto y llegará a su domicilio en aproximadamente 15 minutos. Siga el trayecto aquí: [PAYMENT_CARD]|Flete Residencial Local|Estatus: En Trayecto (Jorge Pérez)|Rastrear",
        vars: { eta_minutes: 15, current_status: "En Trayecto" }
      },
      {
        title: "Entrega Finalizada y POD Digital",
        channel: "messenger",
        logs: [
          "[RPA] Recibiendo acuse de entrega de terminal de operador...",
          "[OCR] Validando firma y fotografía de acuse digital (Proof of Delivery)..."
        ],
        incoming: "Listo, ya llegó el chofer Jorge y entregó todo en excelentes condiciones. Ya firmé el acuse.",
        outgoing: "🎉 **¡Entrega Finalizada!**: Muchas gracias por confirmar. El acuse digital firmado (POD) se ha indexado en el ERP de la empresa y la orden de mudanza ha sido cerrada como *Entregada con Éxito*.",
        vars: { delivery_success: true, pod_captured: true }
      },
      {
        title: "Facturación SAT CFDI 4.0",
        channel: "widget",
        logs: [
          "[SAT_API] Generando CFDI 4.0 con complemento de Carta Porte obligatorio...",
          "[PDF_Engine] Compilando representación impresa de factura..."
        ],
        incoming: "📊 [SISTEMA] Factura #F-4091 timbrada automáticamente con Carta Porte digital ante el SAT.",
        outgoing: "✅ **Facturación Realizada**: Generé la factura fiscal #F-4091 con los datos de Carta Porte y el desglose de IVA correspondientes. Los archivos XML y PDF fueron enviados al correo del cliente.",
        vars: { invoice_number: "F-4091", sat_status: "Vigente" }
      },
      {
        title: "Alerta de Incidencia de Ruta",
        channel: "whatsapp",
        logs: [
          "[GPS] Detectando retraso por tráfico inusual en periférico...",
          "[NLP] Redactando aviso preventivo para el cliente..."
        ],
        incoming: "🚨 [SISTEMA] Alerta: Operador TR-301 reporta demora de 25 minutos por tráfico pesado en la ruta.",
        outgoing: "🚨 **Alerta de Trayecto**: Estimado cliente, el flete presenta un retraso de 25 minutos debido al tráfico. He enviado la ubicación del camión en vivo a su WhatsApp y notificado al supervisor.",
        vars: { delay_minutes: 25, customer_alerted: true }
      },
      {
        title: "Reporte de Desempeño de Fletes",
        channel: "messenger",
        logs: [
          "[SQL] query_flete_performance(date: 'this_week')"
        ],
        incoming: "Dame el reporte del desempeño de las entregas de esta semana.",
        outgoing: "Aquí tienes el estatus para **" + bizName + "**:\n🚚 **Entregas Totales**: 45 fletes\n⏱️ **Tiempos de entrega promedio**: 38 minutos\n🟢 **Entregas puntuales**: 95.8% | 🔴 **Incidencias**: 4.2%\n*Todos los operadores cuentan con POD digital.*",
        vars: { total_trips_week: 45, on_time_rate: "95.8%" }
      },
      {
        title: "Conciliación de Combustible",
        channel: "widget",
        logs: [
          "[Excel] parse_csv_rows('gastos_combustible.csv')...",
          "[ERP] Cruzando tickets de gasolina contra kilómetros recorridos..."
        ],
        incoming: "📊 [SISTEMA: EXCEL] Archivo 'gastos_combustible.csv' conciliado con el GPS de unidades.",
        outgoing: "📊 **Conciliación de Gasolina**: Procesé 12 tickets de combustible de las unidades. Discrepancia detectada del 0%. Los viáticos de Jorge Pérez quedaron cuadrando perfectamente con su flete.",
        vars: { gas_conciled: true, discrepancy_fuel: "0.00 MXN" }
      },
      {
        title: "Feedback de Flete por Cliente",
        channel: "whatsapp",
        logs: [
          "[NLP] Analizando comentario de Jorge Pérez: 'Muy amables y puntuales'..."
        ],
        incoming: "Excelente servicio de flete, los muchachos cargaron los muebles pesados con mucho cuidado.",
        outgoing: "🎉 **¡Excelente!**: El cliente evaluó nuestro servicio con 5 estrellas por cuidado y puntualidad. Se registró la felicitación en la bitácora del operador Jorge Pérez.",
        vars: { rating_stars: 5, operator_rewarded: true }
      },
      {
        title: "Reserva de Mesa con Proveedor",
        channel: "messenger",
        logs: [
          "[OpenTable_API] Reservar mesa hoy 3:00 PM para 3 personas..."
        ],
        incoming: "Reserva una mesa hoy para comer con 2 proveedores de logística cerca de la oficina.",
        outgoing: "🍽️ **Reserva Confirmada**: Mesa reservada para 3 personas hoy a las 3:00 PM en el restaurante *Lalo!* (Zona Centro). He enviado la confirmación y ubicación a tu calendario.",
        vars: { restaurant_reserved: "Lalo!", party_size: 3 }
      },
      {
        title: "Resumen de Entregas del Día",
        channel: "widget",
        logs: [
          "[DB] count_total_logistics_tasks()"
        ],
        incoming: "¿Cuántas tareas logísticas se automatizaron hoy?",
        outgoing: "✅ **Resumen del Día**: Se completaron **18 entregas**, se emitieron **18 Cartas Porte SAT** y se optimizaron **6 rutas**, ahorrando 4.5 horas de llamadas de coordinación telefónica.",
        vars: { deliveries_completed: 18, routes_optimized_count: 6 }
      }
    ];
  }
  else {
    return [
      {
        title: "Organizando Agenda del Día",
        channel: "whatsapp",
        logs: [
          "[Calendar] query_today_meetings(status: 'pending')",
          "[NLP] Ordenando reuniones por prioridad..."
        ],
        incoming: "Hola, ¿cuál es mi agenda de reuniones para el resto del día?",
        outgoing: "📅 **Reuniones de hoy**:\n• 🔴 **Alta (16:30)**: Junta de resultados mensuales con socios (Sala B).\n• 🟡 **Media (17:45)**: Seguimiento de entregas con el equipo de logística.\n• 🟢 **Baja (19:00)**: Revisión de nuevos diseños de catálogo.",
        vars: { pending_meetings: 3, highest_priority: "Junta de resultados" }
      },
      {
        title: "Auditoría de XML Facturación",
        channel: "widget",
        logs: [
          "[SAT_API] query_issued_cfdi(date: 'today')",
          "[IA_AUDIT] Verificando timbrado de 12 folios fiscales..."
        ],
        incoming: "📊 [SISTEMA] Auditoría SAT completada. 12 facturas timbradas con éxito sin discrepancias.",
        outgoing: "✅ **Auditoría CFDI Completa**: Verifiqué las 12 facturas del día. El timbrado ante el SAT es correcto. Los archivos XML y PDF fueron indexados en el servidor contable.",
        vars: { sat_audit_status: "Aprobado", total_audited_cfdi: 12 }
      },
      {
        title: "Alerta de Gasto Inusual",
        channel: "messenger",
        logs: [
          "[ERP_Audit] Analizando transacciones bancarias del mes...",
          "[NLP] Generando alerta de desviación de presupuesto..."
        ],
        incoming: "🚨 [SISTEMA] Alerta: Pago de servicio de luz excedió un 25% el promedio de los últimos 3 meses.",
        outgoing: "🚨 **Alerta de Gasto**: Detecté un consumo de energía inusual de $8,500 MXN. Generé un reporte de análisis en tus borradores y programé una tarea de inspección física en la sucursal Norte.",
        vars: { budget_deviation: "25%", total_amount: 8500 }
      },
      {
        title: "Agendando Cita de Mantenimiento",
        channel: "whatsapp",
        logs: [
          "[Calendar_API] insert_event(title: 'Mantenimiento de Maquinaria Taller')"
        ],
        incoming: "Agenda la inspección de la cortadora para el próximo viernes a las 10 AM.",
        outgoing: "📅 **Cita Agendada**: Programé la inspección técnica de la cortadora para el viernes a las 10:00 AM en tu Google Calendar y envié la notificación de confirmación al técnico asignado.",
        vars: { calendar_synced: true, event_title: "Mantenimiento Cortadora" }
      },
      {
        title: "Reporte de Productividad",
        channel: "widget",
        logs: [
          "[SQL] query_operator_performance_metrics()"
        ],
        incoming: "Dame el reporte de eficiencia operativa de esta semana.",
        outgoing: "Aquí tienes el reporte para **" + bizName + "**:\n📈 **Eficiencia General**: 94% (+4% vs promedio)\n⏱️ **Tiempo de Fabricación**: 4.2 días promedio por mueble\n🟢 **Retrasos**: 0 incidencias\n*Tablero Kanban contable actualizado.*",
        vars: { general_efficiency: "94%", manufacturing_time_avg: "4.2 días" }
      },
      {
        title: "Transcribiendo Minuta de Junta",
        channel: "messenger",
        logs: [
          "[SpeechToText] Transcribiendo audio 'minuta_operaciones.wav' con Whisper...",
          "[NLP] Extrayendo puntos de acuerdo y responsabilidades..."
        ],
        incoming: "Transcribe y resume el audio de la junta de operaciones de hoy.",
        outgoing: "📝 **Resumen de Minuta**:\n• **Acuerdo 1**: Cambiar inventario de POS físico (Responsable: Sistemas).\n• **Acuerdo 2**: Reorganizar rutas de entrega (Responsable: Logística).\n*Minuta guardada en la base de conocimiento de " + bizName + ".*",
        vars: { transcript_length: "8 min", knowledge_base_updated: true }
      },
      {
        title: "Alerta de Incidencia de Entrega",
        channel: "whatsapp",
        logs: [
          "[Logistics] check_delivery_tracking()...",
          "[NLP] Generando alerta de retraso de operador por tráfico..."
        ],
        incoming: "🚨 [SISTEMA] Alerta: Operador de flete F-302 reporta demora de 30 minutos por tráfico en Periférico.",
        outgoing: "🚨 **Alerta de Ruta**: Flete demorado por tráfico. El Asistente IA envió un WhatsApp automático al cliente reprogramando la entrega y notificó al supervisor de almacén.",
        vars: { delayed_deliveries: 1, action_taken: "Cliente notificado" }
      },
      {
        title: "Conciliación Bancaria Exitosa",
        channel: "widget",
        logs: [
          "[Excel] parse_csv_rows('estado_cuenta.csv')...",
          "[ERP] Conciliando movimientos contra facturas emitidas..."
        ],
        incoming: "📊 [SISTEMA] Conciliación bancaria exitosa de 85 movimientos correspondientes a esta semana.",
        outgoing: "📊 **Conciliación de Banco**: Procesé 85 movimientos bancarios. Todos coinciden con las facturas emitidas del mes. El libro contable del ERP se actualizó sin discrepancias.",
        vars: { reconciled_items: 85, balance_variance: "0.00 MXN" }
      },
      {
        title: "Reporte de Flujo de Efectivo",
        channel: "messenger",
        logs: [
          "[SQL] query_cash_flow_statement(branch: 'all')"
        ],
        incoming: "Dame el reporte del flujo de efectivo neto de este mes.",
        outgoing: "Aquí tienes el flujo de efectivo neto para **" + bizName + "**:\n💰 **Entradas**: $382,000 MXN\n💸 **Salidas**: $195,000 MXN\n🟢 **Flujo Neto**: +$187,000 MXN\n*Reporte financiero de finanzas consolidado.*",
        vars: { net_cash_flow: 187000, financial_status: "Saludable" }
      },
      {
        title: "Reserva de Comida de Negocios",
        channel: "whatsapp",
        logs: [
          "[OpenTable_API] Buscando mesa hoy a las 3:00 PM para 3 personas..."
        ],
        incoming: "Reserva una mesa para comer hoy con 2 proveedores cerca de la sucursal Centro.",
        outgoing: "🍽️ **Reserva Confirmada**: Mesa reservada para 3 personas hoy a las 3:00 PM en el restaurante *Lalo!* (Zona Centro). He enviado la confirmación y ubicación a tu calendario.",
        vars: { restaurant_reserved: "Lalo!", party_size: 3 }
      },
      {
        title: "Resumen de Fin de Jornada",
        channel: "widget",
        logs: [
          "[DB] count_total_tasks_completed_today()"
        ],
        incoming: "¿Cuántas tareas administrativas se automatizaron hoy?",
        outgoing: "✅ **Resumen del Día**: Se automatizaron **42 tareas repetitivas** (facturación, avisos de pago, conciliación e inventario), ahorrando un estimado de 3.5 horas de trabajo manual hoy.",
        vars: { automated_tasks_today: 42, hours_saved_today: 3.5 }
      }
    ];
  }
}

  // 1. Mission / Vision / Values
  if (!prof.mission) {
    prof.mission = `Proveer soluciones de alta calidad en ${sectorName} para potenciar el éxito y bienestar de nuestros clientes.`;
  }
  if (!prof.vision) {
    prof.vision = `Ser líderes reconocidos en el sector de ${sectorName}, impulsando la innovación y excelencia operativa con IA.`;
  }
  if (!prof.values) {
    prof.values = "Innovación, Integridad, Compromiso, Excelencia y Enfoque en el Cliente.";
  }
  if (!prof.address) {
    prof.address = "Av. Paseo de la Reforma 405, Piso 12, Lomas de Chapultepec, CDMX, C.P. 11000";
  }
  if (!prof.specialOffer) {
    prof.specialOffer = `¡20% de descuento en tu primer servicio de ${sectorName} contratando hoy!`;
  }
  
  // 2. Services Catalog
  if (!prof.detailedServices) {
    const prods = prof.posProducts || [];
    prof.detailedServices = [
      {
        icon: prods[0] ? prods[0].icon : '⚡',
        name: prods[0] ? prods[0].name : 'Servicio Básico',
        desc: `Solución de entrada ideal para optimizar tus operaciones diarias de ${sectorName}.`,
        price: prods[0] ? prods[0].price : 1000
      },
      {
        icon: prods[1] ? prods[1].icon : '💎',
        name: prods[1] ? prods[1].name : 'Servicio Premium',
        desc: `Implementación avanzada con inteligencia y control completo a la medida del negocio.`,
        price: prods[1] ? prods[1].price : 2500
      },
      {
        icon: prods[5] ? prods[5].icon : '📈',
        name: prods[5] ? prods[5].name : 'Consultoría de Expansión',
        desc: `Estrategia de crecimiento acelerado y automatización de procesos mediante IA avanzada.`,
        price: prods[5] ? prods[5].price : 4500
      }
    ];
  }
  
  // 3. Inventory Stock Insumos Key
  if (!prof.inventory) {
    const isRest = sectorName.toLowerCase().includes("restaurante");
    const isCom = sectorName.toLowerCase().includes("tienda") || sectorName.toLowerCase().includes("comercio");
    
    if (isRest) {
      prof.inventory = [
        { key: 'insumo1', name: 'Materia Prima (Carnes/Verduras)', qty: 65, unit: 'kg', speed: 'Alta (Agotamiento en 2 días)', min: 30 },
        { key: 'insumo2', name: 'Bebidas y Licores', qty: 110, unit: 'pzas', speed: 'Media (Agotamiento en 7 días)', min: 40 },
        { key: 'insumo3', name: 'Detergentes y Suministros', qty: 15, unit: 'lts', speed: 'Baja (Agotamiento en 14 días)', min: 10 }
      ];
    } else if (isCom) {
      prof.inventory = [
        { key: 'insumo1', name: 'Mercancía Premium (Tenis/Prendas)', qty: 45, unit: 'pzas', speed: 'Alta (Agotamiento en 3 días)', min: 25 },
        { key: 'insumo2', name: 'Bolsas y Empaques', qty: 400, unit: 'pzas', speed: 'Media (Agotamiento en 10 días)', min: 150 },
        { key: 'insumo3', name: 'Etiquetas de Código de Barras', qty: 250, unit: 'pzas', speed: 'Baja (Agotamiento en 20 días)', min: 80 }
      ];
    } else {
      prof.inventory = [
        { key: 'insumo1', name: 'Licencias de Software Activadas', qty: 12, unit: 'pzas', speed: 'Alta (Agotamiento en 1 día)', min: 10 },
        { key: 'insumo2', name: 'Papelería y Suministros de Oficina', qty: 85, unit: 'pzas', speed: 'Media (Agotamiento en 12 días)', min: 30 },
        { key: 'insumo3', name: 'Ancho de Banda de Servidor Cloud', qty: 92, unit: 'GB', speed: 'Baja (Agotamiento en 30 días)', min: 20 }
      ];
    }
  }

  // 4. Financial P&L branch data structure
  if (!prof.branchFinancials) {
    prof.branchFinancials = {
      centro: {
        revenue: 285000,
        cogs: 95000,
        expenses: 74000,
        taxes: 30400,
        alerts: [
          { type: 'info', text: 'Sucursal Centro operando al 92% de capacidad.' },
          { type: 'success', text: 'Retención de Impuestos SAT completada sin discrepancias.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: 'Interés en auditoría fiscal completa', status: 'Cotizando' },
          { name: 'Sofía Lira', contact: '525567312903', note: 'Consulta sobre planes de expansión corporativa', status: 'Cerrado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Revisar balance de caja del día de ayer', desc: 'Asignado a Asistente IA' },
            { id: 2, title: 'Conciliación fiscal SAT de cierre de mes', desc: 'Asignado a Contador Principal' }
          ],
          done: [
            { id: 3, title: 'Renovación de licencias de facturación en la nube', desc: 'Auto-completado por IA' }
          ]
        }
      },
      norte: {
        revenue: 145000,
        cogs: 52000,
        expenses: 42000,
        taxes: 16480,
        alerts: [
          { type: 'warning', text: 'Fuga de clientes detectada: 3 clientes VIP inactivos hace 45 días.' },
          { type: 'info', text: 'Nivel medio de stock en insumo crítico de almacén.' }
        ],
        leads: [
          { name: 'Arturo Neri', contact: '525571930284', note: 'Requiere demo en vivo del sistema corporativo', status: 'En Espera' }
        ],
        tasks: {
          todo: [
            { id: 4, title: 'Enviar cupones de WhatsApp a clientes inactivos', desc: 'Acción sugerida por IA' }
          ],
          done: [
            { id: 5, title: 'Reabastecer insumos agotados por fin de semana', desc: 'Auto-completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 95000,
        cogs: 31000,
        expenses: 28000,
        taxes: 10240,
        alerts: [
          { type: 'warning', text: 'Desviación de arqueo inusual detectada en caja del turno matutino.' }
        ],
        leads: [
          { name: 'Lucía Mendoza', contact: '525510293847', note: 'Interés en servicios básicos', status: 'Cotizando' }
        ],
        tasks: {
          todo: [
            { id: 6, title: 'Auditar caja de sucursal Sur con auditoría IA', desc: 'Urgente por desviación' }
          ],
          done: []
        }
      }
    };
  }
}

function completeProfileData(prof, sectorName, bizName) {
  if (!prof) return;
  // 1. Mission / Vision / Values
  if (!prof.mission) {
    prof.mission = `Proveer soluciones de alta calidad en ${sectorName} para potenciar el éxito y bienestar de nuestros clientes.`;
  }
  if (!prof.vision) {
    prof.vision = `Ser líderes reconocidos en el sector de ${sectorName}, impulsando la innovación y excelencia operativa con IA.`;
  }
  if (!prof.values) {
    prof.values = "Innovación, Integridad, Compromiso, Excelencia y Enfoque en el Cliente.";
  }
  if (!prof.address) {
    prof.address = "Av. Paseo de la Reforma 405, Piso 12, Lomas de Chapultepec, CDMX, C.P. 11000";
  }
  if (!prof.specialOffer) {
    prof.specialOffer = `¡20% de descuento en tu primer servicio de ${sectorName} contratando hoy!`;
  }
  
  // 2. Services Catalog
  if (!prof.detailedServices) {
    const prods = prof.posProducts || [];
    prof.detailedServices = [
      {
        icon: prods[0] ? prods[0].icon : '⚡',
        name: prods[0] ? prods[0].name : 'Servicio Básico',
        desc: `Solución de entrada ideal para optimizar tus operaciones diarias de ${sectorName}.`,
        price: prods[0] ? prods[0].price : 1000
      },
      {
        icon: prods[1] ? prods[1].icon : '💎',
        name: prods[1] ? prods[1].name : 'Servicio Premium',
        desc: `Implementación avanzada con inteligencia y control completo a la medida del negocio.`,
        price: prods[1] ? prods[1].price : 2500
      },
      {
        icon: prods[5] ? prods[5].icon : '📈',
        name: prods[5] ? prods[5].name : 'Consultoría de Expansión',
        desc: `Estrategia de crecimiento acelerado y automatización de procesos mediante IA avanzada.`,
        price: prods[5] ? prods[5].price : 4500
      }
    ];
  }
  
  // 3. Inventory Stock Insumos Key
  if (!prof.inventory) {
    const isRest = sectorName.toLowerCase().includes("restaurante");
    const isCom = sectorName.toLowerCase().includes("tienda") || sectorName.toLowerCase().includes("comercio");
    
    if (isRest) {
      prof.inventory = [
        { key: 'insumo1', name: 'Materia Prima (Carnes/Verduras)', qty: 65, unit: 'kg', speed: 'Alta (Agotamiento en 2 días)', min: 30 },
        { key: 'insumo2', name: 'Bebidas y Licores', qty: 110, unit: 'pzas', speed: 'Media (Agotamiento en 7 días)', min: 40 },
        { key: 'insumo3', name: 'Detergentes y Suministros', qty: 15, unit: 'lts', speed: 'Baja (Agotamiento en 14 días)', min: 10 }
      ];
    } else if (isCom) {
      prof.inventory = [
        { key: 'insumo1', name: 'Mercancía Premium (Tenis/Prendas)', qty: 45, unit: 'pzas', speed: 'Alta (Agotamiento en 3 días)', min: 25 },
        { key: 'insumo2', name: 'Bolsas y Empaques', qty: 400, unit: 'pzas', speed: 'Media (Agotamiento en 10 días)', min: 150 },
        { key: 'insumo3', name: 'Etiquetas de Código de Barras', qty: 250, unit: 'pzas', speed: 'Baja (Agotamiento en 20 días)', min: 80 }
      ];
    } else {
      prof.inventory = [
        { key: 'insumo1', name: 'Licencias de Software Activadas', qty: 12, unit: 'pzas', speed: 'Alta (Agotamiento en 1 día)', min: 10 },
        { key: 'insumo2', name: 'Papelería y Suministros de Oficina', qty: 85, unit: 'pzas', speed: 'Media (Agotamiento en 12 días)', min: 30 },
        { key: 'insumo3', name: 'Ancho de Banda de Servidor Cloud', qty: 92, unit: 'GB', speed: 'Baja (Agotamiento en 30 días)', min: 20 }
      ];
    }
  }

  // 4. Financial P&L branch data structure
  if (!prof.branchFinancials) {
    prof.branchFinancials = {
      centro: {
        revenue: 285000,
        cogs: 95000,
        expenses: 74000,
        taxes: 30400,
        alerts: [
          { type: 'info', text: 'Sucursal Centro operando al 92% de capacidad.' },
          { type: 'success', text: 'Retención de Impuestos SAT completada sin discrepancias.' }
        ],
        leads: [
          { name: 'Ricardo Ruiz', contact: '525541298471', note: 'Interés en auditoría fiscal completa', status: 'Cotizando' },
          { name: 'Sofía Lira', contact: '525567312903', note: 'Consulta sobre planes de expansión corporativa', status: 'Cerrado' }
        ],
        tasks: {
          todo: [
            { id: 1, title: 'Revisar balance de caja del día de ayer', desc: 'Asignado a Asistente IA' },
            { id: 2, title: 'Conciliación fiscal SAT de cierre de mes', desc: 'Asignado a Contador Principal' }
          ],
          done: [
            { id: 3, title: 'Renovación de licencias de facturación en la nube', desc: 'Auto-completado por IA' }
          ]
        }
      },
      norte: {
        revenue: 145000,
        cogs: 52000,
        expenses: 42000,
        taxes: 16480,
        alerts: [
          { type: 'warning', text: 'Fuga de clientes detectada: 3 clientes VIP inactivos hace 45 días.' },
          { type: 'info', text: 'Nivel medio de stock en insumo crítico de almacén.' }
        ],
        leads: [
          { name: 'Arturo Neri', contact: '525571930284', note: 'Requiere demo en vivo del sistema corporativo', status: 'En Espera' }
        ],
        tasks: {
          todo: [
            { id: 4, title: 'Enviar cupones de WhatsApp a clientes inactivos', desc: 'Acción sugerida por IA' }
          ],
          done: [
            { id: 5, title: 'Reabastecer insumos agotados por fin de semana', desc: 'Auto-completado por IA' }
          ]
        }
      },
      sur: {
        revenue: 95000,
        cogs: 31000,
        expenses: 28000,
        taxes: 10240,
        alerts: [
          { type: 'warning', text: 'Desviación de arqueo inusual detectada en caja del turno matutino.' }
        ],
        leads: [
          { name: 'Lucía Mendoza', contact: '525510293847', note: 'Interés en servicios básicos', status: 'Cotizando' }
        ],
        tasks: {
          todo: [
            { id: 6, title: 'Auditar caja de sucursal Sur con auditoría IA', desc: 'Urgente por desviación' }
          ],
          done: []
        }
      }
    };
  }
}

// Global reference to active profile
const rawProfile = getSectorProfile(bizSector);
const profile = buildProblemProfile(rawProfile);
completeProfileData(profile, bizSector, bizName);

// ── INITIALIZE DATA IN MOCKUPS ──
function initMockups() {
  try {
    // Update names
    document.querySelectorAll('.biz-name').forEach(el => el.textContent = bizName);
    document.querySelectorAll('.biz-sector').forEach(el => el.textContent = bizSector);
  } catch(e) { console.warn('initMockups: names failed', e); }
  
  try {
    // Inject Logos
    document.querySelectorAll('.business-logo-container').forEach(el => {
      if (!bizLogo || bizLogo === "null" || bizLogo === "undefined" || bizLogo === "" || bizLogo.includes("placeholder") || bizLogo.includes("logo_placeholder")) {
        const initials = bizName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const hue1 = (bizName.length * 12) % 360;
        const hue2 = (hue1 + 140) % 360;
        el.style.background = `linear-gradient(135deg, hsl(${hue1}, 80%, 40%), hsl(${hue2}, 85%, 50%))`;
        el.style.color = '#fff';
        el.style.fontWeight = '900';
        el.style.fontFamily = 'var(--font-title)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.border = '2px solid rgba(255,255,255,0.25)';
        el.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        el.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
        const currentWidth = el.style.width || el.offsetWidth;
        el.style.fontSize = (currentWidth === '68px' || currentWidth === 68) ? '24px' : '18px';
        el.textContent = initials;
      } else {
        el.style.background = 'transparent';
        el.innerHTML = `<img src="${bizLogo}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  } catch(e) { console.warn('initMockups: logos failed', e); }

  try {
    // Setup dynamic URLs
    const cleanUrl = bizName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com.mx';
    const urlEl = document.getElementById('mock-browser-url');
    if (urlEl) urlEl.textContent = `https://www.${cleanUrl}`;
  } catch(e) { console.warn('initMockups: url failed', e); }

  try {
    // 1. WhatsApp Chat Init with Memory
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
      
      const chatHistoryStr = safeSessionStorage.getItem('sim_chat_history');
      if (chatHistoryStr) {
        try {
          const history = JSON.parse(chatHistoryStr);
          history.forEach(msg => {
            addChatMessage(msg.sender, msg.text, true);
          });
        } catch(e) {
          safeSessionStorage.removeItem('sim_chat_history');
        }
      } else {
        const initMsg = profile.chatInit
          .replace(/{bizName}/g, bizName)
          .replace(/{bizProblem}/g, bizProblem);
        const replyMsg = profile.chatReply
          .replace(/{bizName}/g, bizName)
          .replace(/{bizProblem}/g, bizProblem);

        addChatMessage('incoming', initMsg);
        setTimeout(() => {
          addChatMessage('outgoing', replyMsg);
        }, 1000);
      }
    }
  } catch(e) { console.warn('initMockups: chat failed', e); }

  try {
    // 2. POS Grid Init
    initPOSProducts();
  } catch(e) { console.warn('initMockups: POS failed', e); }

  try {
    // 3. Mini Web Title & Slogan
    const webTitle = document.getElementById('mock-web-title');
    const webSlogan = document.getElementById('mock-web-slogan');
    if (webTitle) webTitle.textContent = profile.webTitle;
    if (webSlogan) webSlogan.textContent = profile.webSlogan;
    applyWebTheme(bizStyle);
  } catch(e) { console.warn('initMockups: web failed', e); }

  try {
    // 3.5 AI Advisor Card
    const advEl = document.getElementById('ai-advisor-advice');
    if (advEl) advEl.textContent = profile.aiAdvice;
  } catch(e) {}

  try {
    // 4. ERP Workflow Problem Description
    const erpDesc = document.getElementById('erp-bottleneck-desc');
    if (erpDesc) erpDesc.textContent = `Cuello de botella: ${profile.erpBottleneck}`;
  } catch(e) {}

  try {
    // Hydrate high fidelity sub-simulators
    initPOSInventory();
  } catch(e) { console.warn('initMockups: inventory failed', e); }
  try { initWebData(); } catch(e) {}
  try { startWebCountdown(); } catch(e) {}
  try { updateERPPL(); } catch(e) {}
  try { updateWhatsAppLink(); } catch(e) {}

  // ── LAUNCH AUTO-DEMO ENGINE AFTER 2 SECONDS ──
  setTimeout(startAutoDemo, 2000);
}

// ══════════════════════════════════════════════
// 🎬 AUTO-DEMO ENGINE - Simula la app en vivo
// ══════════════════════════════════════════════
let autoDemoRunning = false;
let autoDemoIntervals = [];

function startAutoDemo() {
  if (autoDemoRunning) return;
  autoDemoRunning = true;

  // ── 1. CHAT AUTO-CONVERSATION LOOP ──
  const chatConversations = [
    {
      q: `Hola! ¿Cuánto cuesta un mueble de sala en abonos? 💬`,
      a: `¡Hola! Bienvenido a **${bizName}** 🏡\n\nNuestras salas están desde **$4,500 MXN** con enganches desde **$450 MXN** y mensualidades cómodas. ¿Deseas que te genere un plan de crédito personalizado ahora mismo?`,
    },
    {
      q: `Sí, me interesa! ¿Tienen en negro? 🛋️`,
      a: `¡Claro que sí! Tenemos disponible la **Sala Neptuno** en color negro, ideal para tu hogar.\n\n💳 **Plan de crédito sugerido:**\n- Precio: $6,200 MXN\n- Enganche: $620 MXN\n- 12 quincenas de $475 MXN\n\n¿Deseas que reserve una pieza con tu nombre ahora? 📦`,
    },
    {
      q: `¿Hacen entregas a domicilio? 🚚`,
      a: `¡Por supuesto! En **${bizName}** entregamos a todo el estado sin costo adicional en compras mayores a $2,000 MXN.\n\n📍 Tiempo estimado de entrega: **24 a 48 hrs hábiles**\n🔧 Armado e instalación incluida en tu domicilio.`,
    },
    {
      q: `¿Puedo pagar quincenalmente desde WhatsApp? 💰`,
      a: `¡Sí! Con nuestro **Asistente IA de Cobranza** recibirás recordatorio automático 2 días antes de cada quincena y un **enlace de pago Stripe** directo a tu WhatsApp. Sin filas, sin sucursal. 📲\n\n¿Te agendamos tu primer pago?`,
    },
    {
      q: `Perfecto. ¿Tienen comedores también? 🍽️`,
      a: `¡Tenemos una gran selección de comedores! 🍽️\n\n✅ Comedor Marbella 4 piezas - desde **$3,200 MXN**\n✅ Comedor Imperial 6 piezas - desde **$5,800 MXN**\n✅ Comedor Tokyo vidrio templado - desde **$4,100 MXN**\n\nTodos con opciones de crédito personalizado desde tu celular.`,
    },
    {
      q: `¿Tienen tienda física o sólo en línea?`,
      a: `Tenemos **ambas opciones** para tu comodidad 😊\n\n📍 **Showroom principal:** Blvd. Principal #1204\n🕐 Horario: Lun-Sáb 9am - 7pm\n💻 **Tienda en línea 24/7:** ${bizName.toLowerCase().replace(/[^a-z0-9]/g,'')}.com.mx\n\n¿Quieres que te envíe la ubicación en Google Maps directamente?`,
    },
  ];

  let chatIdx = 0;
  function runNextChat() {
    if (chatIdx >= chatConversations.length) chatIdx = 0;
    const conv = chatConversations[chatIdx++];
    addChatMessage('incoming', conv.q);
    printToolLog(`[IA] Procesando pregunta: "${conv.q.substring(0, 30)}..."`);
    const delay = 1800 + Math.random() * 600;
    setTimeout(() => {
      addChatMessage('outgoing', conv.a);
      updateTelemetry(conv.q, conv.a, Math.round(120 + Math.random() * 380));
      printToolLog(`[IA] Respuesta generada. Memoria actualizada.`);
    }, delay);
  }

  // Kick off first auto message, then loop every ~12 seconds
  setTimeout(runNextChat, 1200);
  const chatTimer = setInterval(runNextChat, 12000);
  autoDemoIntervals.push(chatTimer);

  // ── 2. POS AUTO-SALES LOOP ──
  const posItems = profile.posProducts || [
    { icon: '🛋️', name: 'Sala Neptuno', price: 6200 },
    { icon: '🍽️', name: 'Comedor Marbella', price: 3200 },
    { icon: '🛏️', name: 'Recámara Elegance', price: 8500 },
    { icon: '📺', name: 'Centro Entretenimiento', price: 4100 },
  ];

  const posClients = ['Juan R.', 'María G.', 'Roberto L.', 'Ana P.', 'Carlos M.', 'Sofía V.', 'Diego H.', 'Fernanda T.'];

  function simulatePOSSale() {
    const item = posItems[Math.floor(Math.random() * posItems.length)];
    const client = posClients[Math.floor(Math.random() * posClients.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    const total = item.price * qty;

    // Light up last sale notification
    const lastSaleEl = document.getElementById('pos-last-sale');
    if (lastSaleEl) {
      lastSaleEl.style.animation = 'none';
      void lastSaleEl.offsetWidth;
      lastSaleEl.innerHTML = `<span style="color:#34d399;font-weight:700;">✅ Venta: ${item.icon} ${item.name} x${qty}</span> — <span style="color:#fbbf24;">$${total.toLocaleString()} MXN</span> — <span style="color:var(--text-muted);">${client}</span>`;
      lastSaleEl.style.animation = 'fadeIn 0.5s ease-out';
    }

    // Update revenue counter
    const revenueEl = document.getElementById('pos-revenue-today');
    if (revenueEl) {
      const current = parseInt((revenueEl.textContent || '0').replace(/[^0-9]/g, '')) || 0;
      const newTotal = current + total;
      revenueEl.textContent = `$${newTotal.toLocaleString()} MXN`;
    }

    // Update sales count
    const countEl = document.getElementById('pos-sales-count');
    if (countEl) {
      const current = parseInt(countEl.textContent || '0') || 0;
      countEl.textContent = current + qty;
    }
    printToolLog(`[POS] Venta registrada: ${item.name} x${qty} → $${total} MXN — ${client}`);
  }
  const posTimer = setInterval(simulatePOSSale, 6000);
  autoDemoIntervals.push(posTimer);
  setTimeout(simulatePOSSale, 2000);

  // ── 3. WEB PAGE AUTO-VISITOR LOOP ──
  const webMetrics = [
    { visitors: 347, sessions: 412, conversion: '4.2%', bounce: '28%' },
    { visitors: 412, sessions: 501, conversion: '5.1%', bounce: '24%' },
    { visitors: 289, sessions: 344, conversion: '3.8%', bounce: '31%' },
    { visitors: 531, sessions: 624, conversion: '6.3%', bounce: '19%' },
  ];
  let webMetricIdx = 0;
  function updateWebMetrics() {
    const m = webMetrics[webMetricIdx % webMetrics.length];
    webMetricIdx++;
    const visEl = document.getElementById('web-visitors-today');
    const sesEl = document.getElementById('web-sessions-today');
    const convEl = document.getElementById('web-conversion-rate');
    const bounceEl = document.getElementById('web-bounce-rate');
    if (visEl) visEl.textContent = m.visitors;
    if (sesEl) sesEl.textContent = m.sessions;
    if (convEl) convEl.textContent = m.conversion;
    if (bounceEl) bounceEl.textContent = m.bounce;

    // Animate a "new visitor" notification
    const notifEl = document.getElementById('web-visitor-notif');
    if (notifEl) {
      const cities = ['CDMX', 'Monterrey', 'Guadalajara', 'Puebla', 'Tijuana', 'Mérida'];
      const devices = ['📱 Móvil', '💻 Desktop', '📟 Tablet'];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      notifEl.innerHTML = `🌐 <strong>Nuevo visitante</strong> desde <span style="color:#38bdf8">${city}</span> · ${device}`;
      notifEl.style.opacity = '1';
      setTimeout(() => { notifEl.style.opacity = '0'; }, 4000);
    }
    printToolLog(`[WEB] Visita registrada en landing page. Conversión: ${m.conversion}`);
  }
  const webTimer = setInterval(updateWebMetrics, 8000);
  autoDemoIntervals.push(webTimer);
  setTimeout(updateWebMetrics, 3000);

  // ── 4. ERP AUTO-WORKFLOW LOOP ──
  const erpEvents = [
    `✅ Pago recibido: ${bizName} Factura #INV-${1200 + Math.floor(Math.random()*100)} — $4,800 MXN`,
    `📦 Pedido procesado: Comedor 6pz — Sucursal Norte — Listo para entrega`,
    `📑 CFDI 4.0 timbrado automáticamente — UUID generado por SAT`,
    `🔔 Recordatorio de cobro enviado a cliente Carlos M. (quincenal)`,
    `📊 Inventario actualizado: 3 unidades vendidas, stock restante: 18`,
    `💳 Pago por Stripe confirmado — $2,400 MXN — María G.`,
    `📋 Cotización generada: Recámara Elegance x2 → $17,000 MXN`,
    `📬 WhatsApp enviado: Comprobante de pago para pedido #ORD-0845`,
    `⚡ Alarma de stock bajo: Sala Neptuno — solo 2 en inventario`,
    `🏆 Meta del mes alcanzada al 78% — $124,000 de $160,000 MXN`,
  ];
  let erpEventIdx = 0;
  function simulateERPEvent() {
    const eventText = erpEvents[erpEventIdx % erpEvents.length];
    erpEventIdx++;
    const feedEl = document.getElementById('erp-live-feed');
    if (feedEl) {
      const div = document.createElement('div');
      div.style.cssText = 'padding: 8px 12px; border-radius: 8px; background: rgba(255,255,255,0.03); border-left: 3px solid #34d399; font-size: 12px; color: #e2e8f0; animation: fadeIn 0.4s ease-out;';
      div.innerHTML = `<span style="color:#64748b;font-size:10px;">${new Date().toLocaleTimeString()}</span> ${eventText}`;
      feedEl.prepend(div);
      if (feedEl.children.length > 12) feedEl.lastChild.remove();
    }
    printToolLog(`[ERP] ${eventText.replace(/[^\w\s:]/g, '').substring(0, 50)}...`);
  }
  const erpTimer = setInterval(simulateERPEvent, 5000);
  autoDemoIntervals.push(erpTimer);
  setTimeout(simulateERPEvent, 1000);
  setTimeout(simulateERPEvent, 3000);
}

// ── MOCKUP A: CHAT CONTROLLER ──
function printToolLog(message) {
  const consoleEl = document.getElementById('agent-tool-logs');
  if (!consoleEl) return;
  
  const dot = document.getElementById('tool-status-dot');
  if (dot) {
    dot.style.background = '#38bdf8'; // Active blue
    setTimeout(() => { dot.style.background = '#6b7280'; }, 600);
  }
  
  const div = document.createElement('div');
  div.innerHTML = `&gt; <span style="color: #64748b;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> ${message}`;
  consoleEl.appendChild(div);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function detectSentiment(text) {
  const lower = text.toLowerCase();
  const sentimentEl = document.getElementById('chat-sentiment');
  if (!sentimentEl) return;
  
  if (lower.match(/(gracias|excelente|perfecto|bien|genial|super|chido|chulo|increible|wow)/)) {
    sentimentEl.innerHTML = '🟢 Feliz / Satisfecho';
    sentimentEl.style.color = '#10b981';
  } else if (lower.match(/(mal|error|lento|tarda|espera|queja|falla|malo|ineficiente|peor)/)) {
    sentimentEl.innerHTML = '🔴 Frustrado';
    sentimentEl.style.color = '#f87171';
  } else if (lower.match(/(urgente|sat|satula|multa|auditoria|estafa|robo|enojado|fraude|pelear)/)) {
    sentimentEl.innerHTML = '🚨 Molesto / Enojado';
    sentimentEl.style.color = '#ef4444';
  } else {
    sentimentEl.innerHTML = '🟡 Neutro';
    sentimentEl.style.color = '#fbbf24';
  }
}

// ── LLM TELEMETRY & CHAT CONTROLS ──
let totalTokensUsed = 0;
let accumulatedCost = 0.0;
let averageLatency = 0;
let latencySamplesCount = 0;
let memoryVariables = {
  user_name: "Visitante",
  sentiment: "Neutro",
  sector: bizSector,
  style_applied: bizStyle,
  last_intent: "ninguno"
};

function updateTelemetry(promptText, replyText, latency) {
  const promptTokens = Math.ceil(promptText.length / 4);
  const replyTokens = Math.ceil(replyText.length / 4);
  const totalThisTurn = promptTokens + replyTokens;
  totalTokensUsed += totalThisTurn;
  
  const costThisTurn = (promptTokens * 0.0000015) + (replyTokens * 0.000002);
  accumulatedCost += costThisTurn;
  
  latencySamplesCount++;
  averageLatency = Math.round(((averageLatency * (latencySamplesCount - 1)) + latency) / latencySamplesCount);
  
  document.getElementById('telemetry-tokens').textContent = `${totalTokensUsed} tok`;
  document.getElementById('telemetry-cost').textContent = `$${accumulatedCost.toFixed(5)} USD`;
  document.getElementById('telemetry-latency').textContent = `${averageLatency} ms`;
  
  const keysCount = Object.keys(memoryVariables).length;
  document.getElementById('telemetry-memory-size').textContent = `${keysCount} vars`;
  
  document.getElementById('agent-memory-inspector').textContent = JSON.stringify(memoryVariables, null, 2);
}

let ttsTimeout = null;
function playBeep(freq, type, duration) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.value = freq || 440;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Blocked by user gesture:', e);
  }
}

function startTTS(text) {
  if (ttsTimeout) clearTimeout(ttsTimeout);
  const overlay = document.getElementById('tts-waveform-overlay');
  if (overlay) overlay.style.display = 'flex';
  
  playBeep(650, 'sine', 0.2);
  setTimeout(() => playBeep(850, 'sine', 0.2), 100);
  
  const wordCount = text.split(/\s+/).length;
  const durationMs = Math.max(2500, Math.min(8000, wordCount * 380));
  
  ttsTimeout = setTimeout(() => {
    stopTTS();
  }, durationMs);
}

function stopTTS() {
  if (ttsTimeout) clearTimeout(ttsTimeout);
  const overlay = document.getElementById('tts-waveform-overlay');
  if (overlay) overlay.style.display = 'none';
  playBeep(450, 'sine', 0.15);
}

document.getElementById('tts-stop-btn').addEventListener('click', stopTTS);

document.getElementById('chat-messages').addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('tts-play-btn')) {
    const textNode = e.target.closest('.chat-bubble').querySelector('.msg-body');
    if (textNode) {
      startTTS(textNode.innerText || textNode.textContent);
    }
  }
});

// Bind sliders
const sliderTemp = document.getElementById('slider-temp');
if (sliderTemp) {
  sliderTemp.addEventListener('input', (e) => {
    const valTemp = document.getElementById('val-temp');
    if (valTemp) valTemp.textContent = e.target.value;
    memoryVariables.style_applied = bizStyle;
  });
}
const sliderTokens = document.getElementById('slider-tokens');
if (sliderTokens) {
  sliderTokens.addEventListener('input', (e) => {
    const valTokens = document.getElementById('val-tokens');
    if (valTokens) valTokens.textContent = e.target.value;
  });
}

// Omnichannel Toggles
document.querySelectorAll('.chat-theme-toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.chat-theme-toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const theme = btn.getAttribute('data-theme');
    const chatOuter = document.getElementById('chat-outer-container');
    const headerBar = document.getElementById('chat-header-bar');
    const subtitle = document.getElementById('chat-channel-subtitle');
    
    if (theme === 'whatsapp') {
      chatOuter.style.borderColor = 'rgba(37, 211, 102, 0.25)';
      headerBar.style.background = 'rgba(6, 8, 12, 0.6)';
      subtitle.innerHTML = 'Chat de WhatsApp Oficial';
      subtitle.style.color = '#25d366';
      printToolLog(`[CHAT] Canal cambiado a WhatsApp API.`);
    } else if (theme === 'messenger') {
      chatOuter.style.borderColor = 'rgba(59, 130, 246, 0.25)';
      headerBar.style.background = 'rgba(15, 23, 42, 0.7)';
      subtitle.innerHTML = 'Facebook Messenger';
      subtitle.style.color = '#3b82f6';
      printToolLog(`[CHAT] Canal cambiado a Messenger API.`);
    } else {
      chatOuter.style.borderColor = 'rgba(168, 85, 247, 0.25)';
      headerBar.style.background = 'rgba(0, 0, 0, 0.5)';
      subtitle.innerHTML = 'Web Widget Live Chat';
      subtitle.style.color = '#c084fc';
      printToolLog(`[CHAT] Canal cambiado a Widget Web.`);
    }
  });
});

function addChatMessage(sender, text, isLoad = false) {
  const chatMessages = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (text.startsWith('[PAYMENT_CARD]')) {
    const parts = text.split('|');
    const title = parts[1] || 'Pago de Servicio';
    const desc = parts[2] || 'Código de transacción único';
    // Format payment amount using currency preference
    const amountVal = parts[3] || '$0.00 MXN';
    const finalAmount = (profile && profile.currencySymbol === 'USD') ? amountVal.replace('MXN', 'USD') : amountVal;
    bubble.style.background = 'transparent';
    bubble.style.border = 'none';
    bubble.style.padding = '0';
    bubble.innerHTML = `
      <div class="glass-card" style="padding: 15px; border-radius: 12px; border: 1px solid rgba(52, 211, 153, 0.4); display: flex; flex-direction: column; gap: 8px; width: 240px; background: rgba(16, 185, 129, 0.08); box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: left;">
        <span style="font-size: 10px; text-transform: uppercase; color: #34d399; font-weight: bold; letter-spacing: 0.5px;">💳 Enlace de Pago Seguro (IA)</span>
        <strong style="font-size: 13.5px; color: #fff;">${title}</strong>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">${desc}</span>
        <span style="font-size: 15px; font-weight: 800; color: #34d399; margin-top: 4px;">${finalAmount}</span>
        <button onclick="alert('💰 Pago Simulado Exitoso. El Asistente IA de ${bizName} ha timbrado la factura SAT automática en el ERP corporativo.'); console.log('Payment executed');" style="width: 100%; padding: 8px; border-radius: 6px; background: #10b981; border: none; color: #fff; font-size: 11.5px; font-weight: bold; cursor: pointer; margin-top: 5px; font-family: inherit;">Pagar con Stripe</button>
      </div>
      <span class="chat-time" style="display:block; margin-top: 4px;">${time} ✓✓</span>
    `;
  } else {
    // Replace MXN to USD in outgoing text dynamically if prefered currency is USD
    let finalText = text;
    if (profile && profile.currencySymbol === 'USD') {
      finalText = finalText.replace(/MXN/g, 'USD').replace(/pesos/g, 'dólares').replace(/Pesos/g, 'Dólares');
    }
    const formattedText = finalText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
    const ttsButtonHtml = sender === 'outgoing' ? `<button class="tts-play-btn" style="background: none; border: none; cursor: pointer; font-size: 10px; margin-left: 5px; opacity: 0.6; padding: 2px;" title="Escuchar Mensaje">🔊</button>` : '';
    bubble.innerHTML = `
      <div style="display:flex; align-items:center; gap:4px;">
        <div class="msg-body">${formattedText}</div>
        ${ttsButtonHtml}
      </div>
      <span class="chat-time">${time} ${sender === 'outgoing' ? '✓✓' : ''}</span>
    `;
  }
  
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Persist chat message inside safeSessionStorage
  if (!isLoad) {
    let history = [];
    try {
      history = JSON.parse(safeSessionStorage.getItem('sim_chat_history') || '[]');
    } catch(e) {}
    history.push({ sender, text });
    safeSessionStorage.setItem('sim_chat_history', JSON.stringify(history));
  }
}

document.getElementById('send-chat-btn').addEventListener('click', handleUserChatSend);
document.getElementById('chat-user-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleUserChatSend();
});

function handleUserChatSend() {
  const input = document.getElementById('chat-user-input');
  const text = input.value.trim();
  if (!text) return;
  
  addChatMessage('incoming', text);
  input.value = '';
  
  detectSentiment(text);
  
  printToolLog(`Recibida entrada de usuario: "${text.substring(0, 25)}..."`);
  printToolLog(`Ejecutando herramienta router_agent()...`);
  
  const latency = Math.round(Math.random() * 380 + 120);
  
  setTimeout(() => {
    const activeAgent = document.getElementById('agent-type-select').value;
    let reply = "";
    const lowerText = text.toLowerCase();
    
    // Dynamic Semantic Local Routing
    if (lowerText.includes("contacto") || lowerText.includes("telefono") || lowerText.includes("whatsapp") || lowerText.includes("llamar")) {
      printToolLog(`[CHAT] Procesando duda sobre contacto / comunicación...`);
      reply = `¡Claro! Puedes contactar a **${bizName}** directamente a nuestro WhatsApp oficial: [525638165507](https://api.whatsapp.com/send?phone=525638165507). Estaremos encantados de atenderte en tiempo real para tu negocio de ${bizSector}.`;
    } else if (lowerText.includes("direccion") || lowerText.includes("sucursal") || lowerText.includes("donde estan") || lowerText.includes("ubicacion") || lowerText.includes("donde queda")) {
      printToolLog(`[CHAT] Procesando duda sobre sucursales / ubicación...`);
      reply = `**${bizName}** cuenta con tres sucursales activas en el ERP corporativo:\n📍 **Sucursal Centro**: Oficina corporativa principal (CDMX).\n📍 **Sucursal Norte**: Almacén y taller de operaciones locales.\n📍 **Sucursal Sur**: Punto de distribución de envíos y fletes.`;
    } else if (lowerText.includes("factura") || lowerText.includes("sat") || lowerText.includes("xml") || lowerText.includes("cfdi")) {
      printToolLog(`[CHAT] Procesando duda sobre timbrado contable SAT...`);
      reply = `En **${bizName}**, todas las facturas y CFDI 4.0 se timbran autónomamente en el ERP en cuanto se confirma el cobro. Puedes descargar tus XML/PDF directamente desde el módulo **Software a Medida** -> pestaña **SAT CFDI 4.0**.`;
    } else if (lowerText.includes("problema") || lowerText.includes("falla") || lowerText.includes("error") || lowerText.includes("no funciona")) {
      printToolLog(`[CHAT] Procesando reporte de problema...`);
      reply = `Lamento escuchar eso. El Asistente IA de **${bizName}** ya tiene registrado el cuello de botella: *"${bizProblem}"*. He generado un ticket automático en el ERP para resolverlo de inmediato.`;
    } else if (lowerText.includes("precio") || lowerText.includes("costo") || lowerText.includes("cuanto cuesta") || lowerText.includes("pagar") || lowerText.includes("comprar") || lowerText.includes("cotiza")) {
      printToolLog(`[CHAT] Generando cotización dinámica por Stripe...`);
      reply = `[PAYMENT_CARD]|Servicio de ${bizSector}|Cotización de servicio a la medida para solucionar ${bizProblem}|${profile.posProducts[1] ? '$' + profile.posProducts[1].price + '.00 MXN' : '$1,500.00 MXN'}`;
    } else {
      // Agent specific defaults
      if (activeAgent === 'ventas') {
        reply = `Hola, como Agente de Ventas de **${bizName}**, te comento que podemos solucionar tu problema de *"${bizProblem}"* implementando un flujo digital optimizado con IA. ¿Deseas que te genere un link de pago con tu cotización?`;
      } else if (activeAgent === 'soporte') {
        printToolLog(`Ejecutando herramienta check_system_status()...`);
        reply = `Hola, soy tu Agente de Soporte Técnico de **${bizName}**. He revisado el estado del servidor y los flujos relacionados con *"${bizProblem}"*. Todo está listo para optimizarse. ¿Deseas levantar un ticket técnico?`;
      } else if (activeAgent === 'citas') {
        printToolLog(`Ejecutando herramienta check_google_calendar()...`);
        reply = `Hola, soy el Coordinador de Citas de **${bizName}**. He verificado nuestra agenda para ${bizSector}. Tenemos espacio disponible mañana a las 11:00 AM y a las 4:30 PM. ¿Cuál prefieres agendar?`;
      } else {
        printToolLog(`Ejecutando herramienta query_billing_status()...`);
        reply = `Hola, soy el Agente de Cobranza de **${bizName}**. He consultado el sistema contable y no tienes facturas pendientes. ¿Deseas emitir un CFDI o descargar tu Estado de Resultados del ERP?`;
      }
    }
    
    // Update memory
    memoryVariables.sentiment = document.getElementById('chat-sentiment').textContent.split(' ')[1] || "Neutro";
    memoryVariables.last_intent = lowerText.match(/(precio|costo|cuanto cuesta|pagar|comprar|servicio|cotiza)/) ? "ventas_cotizacion" : "consulta_general";
    
    addChatMessage('outgoing', reply);
    updateTelemetry(text, reply, latency);
  }, latency);
}

document.querySelectorAll('.sample-msg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-msg');
    addChatMessage('incoming', text);
    detectSentiment(text);
    
    printToolLog(`Recibido clic en muestra: "${text.substring(0, 20)}..."`);
    printToolLog(`Ejecutando router_agent() con prioridad alta...`);
    
    const latency = Math.round(Math.random() * 300 + 100);
    
    setTimeout(() => {
      let reply = "";
      if (text.includes('Precios')) {
        printToolLog(`Llamando api_stripe_checkout()...`);
        reply = `[PAYMENT_CARD]|Servicio Premium ${bizName}|Cotización completa de automatización para ${bizSector}|${profile.posProducts[2] ? '$' + profile.posProducts[2].price + '.00 MXN' : '$3,500.00 MXN'}`;
      } else if (text.includes('Cita')) {
        printToolLog(`Llamando api_google_calendar_schedule()...`);
        reply = `Entendido. Registramos tu solicitud de agendamiento para tu negocio. El Asistente IA de **${bizName}** consultará la disponibilidad en la agenda de tu sector (${profile.logoName}) y enviará confirmación automática por WhatsApp en unos momentos.`;
      } else {
        printToolLog(`Llamando api_ticket_system_raise()...`);
        reply = `Tu reporte técnico sobre *"${bizProblem}"* ha sido indexado y catalogado por el motor IA de **${bizName}** para asignación y resolución inmediata.`;
      }
      
      memoryVariables.sentiment = document.getElementById('chat-sentiment').textContent.split(' ')[1] || "Neutro";
      memoryVariables.last_intent = text.includes('Precios') ? "consultar_precios" : (text.includes('Cita') ? "agendar_cita" : "soporte_reporte");
      
      addChatMessage('outgoing', reply);
      updateTelemetry(text, reply, latency);
    }, latency);
  });
});

// Human transfer simulation
const humanTransferBtn = document.getElementById('human-transfer-btn');
if (humanTransferBtn) {
  humanTransferBtn.addEventListener('click', () => {
    printToolLog(`FORZANDO INTERVENCIÓN HUMANA...`);
    printToolLog(`Compilando resumen contextual de conversación...`);
    
    const sentimentEl = document.getElementById('chat-sentiment');
    const sentimentText = sentimentEl ? sentimentEl.textContent : 'Neutro';
    const summary = `Cliente consulta sobre el sector ${bizSector} para el negocio "${bizName}" con problema "${bizProblem}". Sentimiento actual: ${sentimentText}`;
    printToolLog(`Enviando resumen al operador: "${summary.substring(0, 45)}..."`);
    
    alert(`🚨 Conversación transferida con éxito.\nUn operador humano se conectará de inmediato.\n\nResumen enviado por IA al operador:\n"${summary}"`);
  });
}

// Selector changes agent logs
const agentTypeSelect = document.getElementById('agent-type-select');
if (agentTypeSelect) {
  agentTypeSelect.addEventListener('change', (e) => {
    printToolLog(`[COGNITIVE] Cambiando a perfil: "${e.target.options[e.target.selectedIndex].text}"`);
    printToolLog(`[COGNITIVE] Inicializando sub-agentes y recargando base de conocimiento...`);
    memoryVariables.active_agent_profile = e.target.value;
    const inspectorEl = document.getElementById('agent-memory-inspector');
    if (inspectorEl) inspectorEl.textContent = JSON.stringify(memoryVariables, null, 2);
  });
}

// ── MOCKUP B: POS CONTROLLER ──
let posCart = [];
let totalCashSales = 0;
let totalCardSales = 0;
let activeTipPercent = 0;
let activeCoupon = 'none';

function initPOSInventory() {
  const listContainer = document.getElementById('pos-inventory-list');
  if (!listContainer || !profile.inventory) return;
  
  listContainer.innerHTML = '';
  profile.inventory.forEach(item => {
    const pct = Math.round((item.qty / (item.min * 2.5)) * 100);
    const cappedPct = Math.min(100, pct);
    
    // Choose progress bar color based on stock level
    let barColor = '#10b981'; // Green
    if (item.qty <= item.min) {
      barColor = '#ef4444'; // Red
    } else if (item.qty <= item.min * 1.5) {
      barColor = '#fbbf24'; // Yellow
    }
    
    const card = document.createElement('div');
    card.style.cssText = "background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px;";
    card.innerHTML = `
      <span style="font-size: 11px; font-weight: bold; color: #fff; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; display:block;">${item.name}</span>
      <div style="display:flex; justify-content:space-between; font-size:10px; color: var(--text-muted);">
        <span>Stock: <strong>${item.qty} ${item.unit}</strong></span>
        <span>${pct}%</span>
      </div>
      <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow:hidden;">
        <div style="height: 100%; width: ${cappedPct}%; background: ${barColor}; border-radius: 3px; transition: width 0.5s;"></div>
      </div>
      <span style="font-size: 9px; color: var(--text-muted); font-style: italic;">${item.speed}</span>
    `;
    listContainer.appendChild(card);
  });

  // Sync the admin stock manager table
  renderAdminStockTable();
}

function initPOSProducts() {
  const grid = document.getElementById('pos-products-grid');
  grid.innerHTML = '';
  
  const products = profile.posProducts;

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pos-prod-card';
    card.innerHTML = `
      <span class="pos-prod-icon">${p.icon}</span>
      <h5 class="pos-prod-name">${p.name}</h5>
      <span class="pos-prod-price">$${p.price.toFixed(2)} MXN</span>
    `;
    card.addEventListener('click', () => addProductToCart(p));
    grid.appendChild(card);
  });
}

function deductInventory(product) {
  if (!profile.inventory) return true;
  // Deduct 1 unit or a weight fraction from insumo1
  const item = profile.inventory[0];
  if (item && item.qty > 0) {
    if (item.unit === 'kg') {
      item.qty = parseFloat((item.qty - 0.4).toFixed(1));
    } else {
      item.qty = Math.max(0, item.qty - 1);
    }
    
    if (item.qty <= item.min) {
      printToolLog(`[ALERTA OPERACIONES] Stock crítico de insumo: "${item.name}" (Quedan: ${item.qty} ${item.unit})`);
      updateERPPL(); // Trigger ERP warning alerts!
    }
    initPOSInventory();
    return true;
  }
  return false;
}

function addProductToCart(product) {
  const existing = posCart.find(item => item.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    posCart.push({ ...product, qty: 1 });
  }
  deductInventory(product);
  renderCart();
}

function renderCart() {
  const container = document.getElementById('pos-cart-items');
  container.innerHTML = '';
  
  let subtotal = 0;
  posCart.forEach(item => {
    const totalItemPrice = item.price * item.qty;
    subtotal += totalItemPrice;
    
    const row = document.createElement('div');
    row.className = 'pos-cart-row';
    row.innerHTML = `
      <div><strong>${item.name}</strong> x${item.qty}</div>
      <div style="color: var(--primary); font-weight:700;">$${totalItemPrice.toFixed(2)} MXN</div>
    `;
    container.appendChild(row);
  });

  // Calculate discounts
  const loyalty = document.getElementById('pos-loyalty-select').value;
  let loyaltyPct = 0;
  if (loyalty === 'vip') loyaltyPct = 0.10;
  if (loyalty === 'frecuente') loyaltyPct = 0.05;
  
  let discountVal = subtotal * loyaltyPct;
  
  if (activeCoupon === 'DESC15') {
    discountVal += subtotal * 0.15;
  } else if (activeCoupon === 'BOGO') {
    // Buy one get one free for items with qty >= 2
    posCart.forEach(item => {
      if (item.qty >= 2) {
        const freeItems = Math.floor(item.qty / 2);
        discountVal += item.price * freeItems;
      }
    });
  }
  
  const subtotalWithDisc = Math.max(0, subtotal - discountVal);
  const tipVal = subtotalWithDisc * (activeTipPercent / 100);
  const iva = subtotalWithDisc * 0.16;
  const total = subtotalWithDisc + iva + tipVal;

  document.getElementById('pos-subtotal').textContent = `$${subtotal.toFixed(2)} MXN`;
  
  const discRow = document.getElementById('pos-discount-row');
  const discValEl = document.getElementById('pos-discount-val');
  if (discountVal > 0) {
    discRow.style.display = 'flex';
    discValEl.textContent = `-$${discountVal.toFixed(2)} MXN`;
  } else {
    discRow.style.display = 'none';
  }
  
  const tipRow = document.getElementById('pos-tip-row');
  const tipValEl = document.getElementById('pos-tip-val');
  if (tipVal > 0) {
    tipRow.style.display = 'flex';
    tipValEl.textContent = `$${tipVal.toFixed(2)} MXN`;
  } else {
    tipRow.style.display = 'none';
  }
  
  document.getElementById('pos-iva').textContent = `$${iva.toFixed(2)} MXN`;
  document.getElementById('pos-total').textContent = `$${total.toFixed(2)} MXN`;
}

document.getElementById('clear-cart-btn').addEventListener('click', () => {
  posCart = [];
  renderCart();
});

// Loyalty discount change trigger
document.getElementById('pos-loyalty-select').addEventListener('change', renderCart);

// Suggestions tip buttons handlers
document.querySelectorAll('.tip-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTipPercent = parseInt(btn.getAttribute('data-tip'));
    renderCart();
  });
});

// Coupons selection handlers
document.querySelectorAll('.coupon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const selected = btn.getAttribute('data-coupon');
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      activeCoupon = 'none';
    } else {
      document.querySelectorAll('.coupon-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCoupon = selected;
    }
    renderCart();
  });
});

// Buy Direct reorder button
document.getElementById('pos-reorder-btn').addEventListener('click', () => {
  if (profile.inventory) {
    profile.inventory.forEach(item => {
      item.qty = Math.round(item.min * 2.3);
    });
    initPOSInventory();
    printToolLog(`[INVENTARIO] Pedido de reabastecimiento enviado vía API. Existencias al 100%.`);
    updateERPPL();
    alert('📦 Compra Inteligente Exitosa. Existencias reabastecidas y proveedor notificado de forma autónoma.');
  }
});

function renderAdminStockTable() {
  const tbody = document.getElementById('pos-admin-stock-tbody');
  if (!tbody || !profile.posProducts) return;
  tbody.innerHTML = '';
  
  profile.posProducts.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
    const qtyVal = profile.inventory && profile.inventory[idx] ? profile.inventory[idx].qty : 20;
    const unitStr = profile.inventory && profile.inventory[idx] ? profile.inventory[idx].unit : 'u';
    tr.innerHTML = `
      <td style="padding:4px 0; color:#fff; display:flex; align-items:center; gap:4px;">
        <span>${p.icon}</span>
        <span style="font-weight:bold;">${p.name}</span>
      </td>
      <td style="padding:4px 0;">
        <div style="display:flex; align-items:center; gap:2px;">
          <span style="color:var(--text-muted);">$</span>
          <input type="number" value="${p.price}" class="pos-admin-price-input" data-idx="${idx}" style="width:40px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:4px; color:#fff; font-size:10px; padding:2px; text-align:center; outline:none;">
        </div>
      </td>
      <td style="padding:4px 0;">
        <div style="display:flex; align-items:center; gap:2px;">
          <input type="number" value="${qtyVal}" class="pos-admin-qty-input" data-idx="${idx}" style="width:35px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:4px; color:#fff; font-size:10px; padding:2px; text-align:center; outline:none;">
          <span style="font-size:8px; color:var(--text-muted);">${unitStr}</span>
        </div>
      </td>
      <td style="padding:4px 0; text-align:right;">
        <button class="pos-admin-save-btn" data-idx="${idx}" style="background:var(--primary); border:none; border-radius:4px; padding:3px 6px; font-size:9px; font-weight:bold; color:#fff; cursor:pointer; font-family:inherit;">ok</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  tbody.querySelectorAll('.pos-admin-save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      const row = btn.closest('tr');
      const newPrice = parseFloat(row.querySelector('.pos-admin-price-input').value);
      const newQty = parseFloat(row.querySelector('.pos-admin-qty-input').value);
      
      if (!isNaN(newPrice) && newPrice >= 0) {
        profile.posProducts[idx].price = newPrice;
      }
      if (!isNaN(newQty) && newQty >= 0 && profile.inventory && profile.inventory[idx]) {
        profile.inventory[idx].qty = newQty;
      }
      
      initPOSProducts();
      initPOSInventory();
      renderCart();
      printToolLog(`[ALMACÉN] Precios y existencias actualizados para: "${profile.posProducts[idx].name}"`);
    });
  });
}

let pendingCheckoutData = null;

// Checkout action (Stripe Terminal Modal trigger)
document.getElementById('checkout-pos-btn').addEventListener('click', () => {
  if (posCart.length === 0) {
    alert('El carrito está vacío. Agrega productos haciendo clic en ellos.');
    return;
  }

  const subtotal = posCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const loyalty = document.getElementById('pos-loyalty-select').value;
  let loyaltyPct = 0;
  if (loyalty === 'vip') loyaltyPct = 0.10;
  if (loyalty === 'frecuente') loyaltyPct = 0.05;
  
  let discountVal = subtotal * loyaltyPct;
  if (activeCoupon === 'DESC15') discountVal += subtotal * 0.15;
  if (activeCoupon === 'BOGO') {
    posCart.forEach(item => {
      if (item.qty >= 2) {
        discountVal += item.price * Math.floor(item.qty / 2);
      }
    });
  }
  
  const finalSub = Math.max(0, subtotal - discountVal);
  const finalTotal = finalSub * 1.16 + (finalSub * activeTipPercent / 100);
  
  pendingCheckoutData = {
    subtotal: subtotal,
    discountVal: discountVal,
    tipVal: (finalSub * activeTipPercent / 100),
    iva: finalSub * 0.16,
    total: finalTotal,
    items: [...posCart],
    clientName: loyalty === 'vip' ? 'Juan Pérez (VIP)' : (loyalty === 'frecuente' ? 'María Gómez (Frecuente)' : 'Público General')
  };

  const terminalOverlay = document.getElementById('pos-terminal-overlay');
  terminalOverlay.style.display = 'flex';
  document.getElementById('terminal-screen-amount').textContent = `$${finalTotal.toFixed(2)} MXN`;
  document.getElementById('terminal-screen-status').textContent = 'ESPERANDO TARJETA...';
  document.getElementById('terminal-screen-progress').style.display = 'none';
  document.getElementById('terminal-payment-icon').style.transform = 'scale(1)';
  document.getElementById('simulate-tap-btn').disabled = false;
  document.getElementById('simulate-tap-btn').style.background = '#38bdf8';
  document.getElementById('simulate-tap-btn').textContent = '💳 Aproximar Tarjeta (Contactless)';
});

// Card Tap button handler
document.getElementById('simulate-tap-btn').addEventListener('click', () => {
  const tapBtn = document.getElementById('simulate-tap-btn');
  tapBtn.disabled = true;
  tapBtn.style.background = '#6b7280';
  tapBtn.textContent = 'Procesando...';
  
  const statusEl = document.getElementById('terminal-screen-status');
  const progressEl = document.getElementById('terminal-screen-progress');
  const iconEl = document.getElementById('terminal-payment-icon');
  
  statusEl.textContent = 'LEYENDO CHIP/NFC...';
  progressEl.style.display = 'block';
  iconEl.style.transform = 'scale(1.2) rotate(15deg)';
  
  playBeep(880, 'sine', 0.1);
  
  setTimeout(() => {
    statusEl.textContent = 'COMUNICANDO CON BANCO...';
    iconEl.style.transform = 'scale(1.3) rotate(-15deg)';
    
    setTimeout(() => {
      statusEl.textContent = 'TRANSACCIÓN APROBADA!';
      iconEl.style.transform = 'scale(1) rotate(0deg)';
      progressEl.style.display = 'none';
      
      playBeep(980, 'sine', 0.08);
      setTimeout(() => playBeep(1180, 'sine', 0.08), 80);
      setTimeout(() => playBeep(1380, 'sine', 0.12), 160);
      
      if (typeof confetti === 'function') {
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
      }
      
      totalCardSales += pendingCheckoutData.total;
      
      // Update transaction log
      const logContainer = document.getElementById('pos-transaction-log');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog = `[${timeStr}] Venta #${Math.floor(Math.random()*9000+1000)} por $${pendingCheckoutData.total.toFixed(2)} MXN cobrada con tarjeta. Cliente: ${pendingCheckoutData.clientName}.\n`;
      logContainer.innerHTML = newLog + logContainer.innerHTML;
      
      // Invoicing SAT CFDI 4.0
      const satTbody = document.getElementById('erp-sat-table-body');
      if (satTbody) {
        const uuid = generateUUID();
        const folioStr = `F-00${Math.floor(Math.random()*8000+1000)}`;
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
          <td style="padding: 8px 4px; font-family: monospace; font-size:10px;" title="${uuid}">
            <strong>${folioStr}</strong><br>
            <span style="color:var(--text-muted); font-size:8.5px;">${uuid.substring(0,8)}...</span>
          </td>
          <td style="padding: 8px 4px;">${pendingCheckoutData.clientName}</td>
          <td style="padding: 8px 4px; font-weight:bold; color:#10b981;">$${pendingCheckoutData.total.toFixed(2)}</td>
          <td style="padding: 8px 4px;"><span style="background:rgba(16,185,129,0.1); color:#34d399; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:bold;">VIGENTE</span></td>
          <td style="padding: 8px 4px; text-align:right;">
            <button class="sat-download-btn" onclick="alert('📥 XML de Factura CFDI descargado.');" style="background:none; border:none; color:var(--primary); font-size:10px; cursor:pointer; text-decoration:underline;">XML</button>
            <button class="sat-download-btn" onclick="alert('📥 Representación impresa PDF descargada.');" style="background:none; border:none; color:var(--primary); font-size:10px; cursor:pointer; text-decoration:underline; margin-left:4px;">PDF</button>
          </td>
        `;
        satTbody.insertBefore(tr, satTbody.firstChild);
      }
      
      updateERPPL();
      
      // Close Stripe Terminal and open receipt ticket view
      setTimeout(() => {
        document.getElementById('pos-terminal-overlay').style.display = 'none';
        openReceiptTicket(pendingCheckoutData);
      }, 1200);
      
    }, 1500);
  }, 1500);
});

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

function openReceiptTicket(data) {
  const ticketOverlay = document.getElementById('pos-ticket-overlay');
  ticketOverlay.style.display = 'flex';
  
  document.getElementById('ticket-folio').textContent = `F-00${Math.floor(Math.random()*8000+1000)}`;
  const dateStr = new Date().toISOString().substring(0,10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('ticket-date').textContent = dateStr;
  document.getElementById('ticket-client').textContent = data.clientName;
  document.getElementById('ticket-uuid').textContent = generateUUID();
  
  const tbody = document.getElementById('ticket-items-tbody');
  tbody.innerHTML = '';
  data.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding: 2px 0;">${item.name}</td>
      <td style="padding: 2px 0; text-align: center;">${item.qty}</td>
      <td style="padding: 2px 0; text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
  
  document.getElementById('ticket-subtotal').textContent = `$${data.subtotal.toFixed(2)}`;
  if (data.discountVal > 0) {
    document.getElementById('ticket-discount-row').style.display = 'table-row';
    document.getElementById('ticket-discount').textContent = `-$${data.discountVal.toFixed(2)}`;
  } else {
    document.getElementById('ticket-discount-row').style.display = 'none';
  }
  
  if (data.tipVal > 0) {
    document.getElementById('ticket-tip-row').style.display = 'table-row';
    document.getElementById('ticket-tip').textContent = `$${data.tipVal.toFixed(2)}`;
  } else {
    document.getElementById('ticket-tip-row').style.display = 'none';
  }
  
  document.getElementById('ticket-iva').textContent = `$${data.iva.toFixed(2)}`;
  document.getElementById('ticket-total').textContent = `$${data.total.toFixed(2)} MXN`;
}

document.getElementById('close-terminal-btn').addEventListener('click', () => {
  document.getElementById('pos-terminal-overlay').style.display = 'none';
});
document.getElementById('close-ticket-btn').addEventListener('click', () => {
  document.getElementById('pos-ticket-overlay').style.display = 'none';
  posCart = [];
  renderCart();
});

// Arqueo y Corte de Caja Modal Controls
document.getElementById('trigger-corte-btn').addEventListener('click', () => {
  const overlay = document.getElementById('corte-caja-overlay');
  if (!overlay) return;
  
  // Set values
  const expectedCash = totalCashSales + 500; // $500 is base box/fondo
  const expectedCard = totalCardSales;
  const expectedTotal = expectedCash + expectedCard;
  
  document.getElementById('corte-efectivo-reg').textContent = `$${expectedCash.toFixed(2)} MXN`;
  document.getElementById('corte-tarjeta-reg').textContent = `$${expectedCard.toFixed(2)} MXN`;
  document.getElementById('corte-total-reg').textContent = `$${expectedTotal.toFixed(2)} MXN`;
  
  // Reset input and result
  document.getElementById('corte-cash-counted').value = '';
  document.getElementById('corte-variance-panel').style.display = 'none';
  
  overlay.style.display = 'flex';
});

document.getElementById('close-corte-btn').addEventListener('click', () => {
  document.getElementById('corte-caja-overlay').style.display = 'none';
});

document.getElementById('calculate-arqueo-btn').addEventListener('click', () => {
  const expectedCash = totalCashSales + 500;
  const expectedCard = totalCardSales;
  const expectedTotal = expectedCash + expectedCard;
  
  const countedCash = parseFloat(document.getElementById('corte-cash-counted').value) || 0;
  const variance = countedCash - expectedCash;
  
  const varianceValEl = document.getElementById('corte-variance-val');
  const auditLogsEl = document.getElementById('corte-audit-logs');
  
  varianceValEl.textContent = `$${variance.toFixed(2)} MXN`;
  
  if (variance < 0) {
    varianceValEl.style.color = '#ef4444'; // Red
    auditLogsEl.innerHTML = `
      <div style="color:#fecaca; background:rgba(239,68,68,0.08); padding:8px; border-radius:6px; border:1px solid rgba(239,68,68,0.2); font-size: 11px;">
        ⚠️ <strong>Discrepancia detectada: Faltante de $${Math.abs(variance).toFixed(2)} MXN.</strong><br>
        El algoritmo IA del ERP sugiere auditar el turno del Cajero Activo. Posible merma o error humano en la entrega de cambio.
      </div>
    `;
    printToolLog(`[AUDITORÍA POS] Discrepancia de caja negativa detectada: -$${Math.abs(variance).toFixed(2)} MXN.`);
  } else if (variance > 0) {
    varianceValEl.style.color = '#38bdf8'; // Blue
    auditLogsEl.innerHTML = `
      <div style="color:#bae6fd; background:rgba(14,165,233,0.08); padding:8px; border-radius:6px; border:1px solid rgba(14,165,233,0.2); font-size: 11px;">
        📈 <strong>Sobrente detectado: +$${variance.toFixed(2)} MXN.</strong><br>
        Se ha registrado el excedente en la contabilidad automatizada como ingreso misceláneo extraordinario.
      </div>
    `;
    printToolLog(`[AUDITORÍA POS] Excedente detectado en caja: +$${variance.toFixed(2)} MXN.`);
  } else {
    varianceValEl.style.color = '#10b981'; // Green
    auditLogsEl.innerHTML = `
      <div style="color:#a7f3d0; background:rgba(16,185,129,0.08); padding:8px; border-radius:6px; border:1px solid rgba(16,185,129,0.2); font-size: 11px;">
        ✅ <strong>Arqueo perfecto: Sin discrepancias ($0.00 MXN).</strong><br>
        Corte verificado por el motor IA de auditoría SAT con firma digital. Todo cuadra correctamente.
      </div>
    `;
    printToolLog(`[AUDITORÍA POS] Arqueo completado con éxito. Balance de caja perfecto.`);
  }
  
  document.getElementById('corte-variance-panel').style.display = 'flex';
});

// ── MOCKUP C: WEBSITE CONTROLLER ──
function applyWebTheme(theme) {
  const preview = document.getElementById('mock-web-preview');
  if (preview) {
    preview.className = `theme-${theme}`;
  }
  
  // Apply globally to the entire simulator dashboard body!
  document.body.className = `sim-body theme-${theme}`;
  
  document.querySelectorAll('.web-color-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.borderColor = 'rgba(255,255,255,0.1)';
    
    const btnTheme = btn.getAttribute('data-theme');
    if (btnTheme === theme) {
      btn.classList.add('active');
      
      const colors = {
        'ultra-moderno': 'rgba(168, 85, 247, 0.4)',
        'clasico-claro': 'rgba(255, 255, 255, 0.4)',
        'windows': 'rgba(14, 165, 233, 0.4)',
        'mac': 'rgba(244, 63, 94, 0.4)',
        'ciberpunk': 'rgba(236, 72, 153, 0.4)',
        'nordico': 'rgba(16, 185, 129, 0.4)'
      };
      const backgrounds = {
        'ultra-moderno': 'rgba(168, 85, 247, 0.15)',
        'clasico-claro': 'rgba(255, 255, 255, 0.15)',
        'windows': 'rgba(14, 165, 233, 0.15)',
        'mac': 'rgba(244, 63, 94, 0.15)',
        'ciberpunk': 'rgba(236, 72, 153, 0.15)',
        'nordico': 'rgba(16, 185, 129, 0.15)'
      };
      
      btn.style.borderColor = colors[theme] || 'rgba(255,255,255,0.4)';
      btn.style.background = backgrounds[theme] || 'rgba(255,255,255,0.15)';
    }
  });
}

document.querySelectorAll('.web-color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme');
    applyWebTheme(theme);
  });
});

// Website subtab navigation switching
document.querySelectorAll('.web-subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.web-subtab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const targetSection = btn.getAttribute('data-web-tab');
    document.querySelectorAll('.web-page-section').forEach(sect => {
      sect.style.display = 'none';
    });
    
    const matched = document.getElementById(`web-section-${targetSection}`);
    if (matched) {
      if (targetSection === 'contact') {
        matched.style.display = 'grid';
      } else {
        matched.style.display = 'flex';
      }
    }
  });
});

// Website catalog & contact details injection
function renderWebServices() {
  const grid = document.getElementById('web-services-grid');
  if (!grid || !profile.detailedServices) return;
  grid.innerHTML = '';
  profile.detailedServices.forEach(s => {
    const card = document.createElement('div');
    card.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center; display:flex; flex-direction:column; gap: 4px;";
    card.innerHTML = `
      <span style="font-size: 16px;">${s.icon}</span>
      <strong style="font-size: 11px; color: #fff; display:block; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${s.name}</strong>
      <span style="font-size: 9.5px; color: var(--text-muted); line-height:1.2; flex: 1;">${s.desc}</span>
      <span style="font-size: 11px; font-weight: bold; color: var(--primary); margin-top: 3px;">$${s.price} MXN</span>
    `;
    grid.appendChild(card);
  });
}

function initWebData() {
  document.getElementById('web-about-slogan').textContent = profile.webSlogan;
  document.getElementById('web-about-mission').textContent = profile.mission;
  document.getElementById('web-about-vision').textContent = profile.vision;
  document.getElementById('web-about-values').textContent = profile.values;
  document.getElementById('web-contact-address').textContent = profile.address;
  document.getElementById('web-promo-text').textContent = profile.specialOffer;
  renderWebServices();

  // Populate dynamic FAQs based on sector
  const faqAccordion = document.getElementById('web-faqs-accordion');
  if (faqAccordion) {
    let faqsList = [];
    if (bizSector.toLowerCase().match(/(restaurante|cafe|comida|alimento)/)) {
      faqsList = [
        { q: "¿Tienen opciones vegetarianas o sin gluten?", a: "Sí, en nuestro menú indicamos con símbolos especiales todas las opciones vegetarianas, veganas y libres de gluten. Si tienes una alergia severa, por favor avísanos al ordenar." },
        { q: "¿Cómo funcionan las pre-órdenes desde el chat?", a: "Es muy sencillo: cuando chateas con nuestro asistente IA, puedes indicarle qué platillos deseas ordenar y la hora de tu llegada. Él procesará el cobro seguro y enviará la comanda al instante." },
        { q: "¿Tienen servicio a domicilio o catering para eventos?", a: "Sí, contamos con cobertura de envíos locales directos y diseñamos menús especiales con buffet para banquetes, bodas o eventos corporativos." }
      ];
    } else if (bizSector.toLowerCase().match(/(tienda|comercio|retail|ropa|compras)/)) {
      faqsList = [
        { q: "¿Cuánto tarda en llegar mi pedido?", a: "El envío estándar terrestre demora de 2 a 4 días hábiles. Si eliges envío express en el checkout, llegará en un lapso de 24 a 48 horas a cualquier parte del país." },
        { q: "¿Cómo realizo una devolución o cambio de talla?", a: "Tienes hasta 30 días naturales a partir de tu compra. Solicítalo en la sección de soporte del portal web o mediante WhatsApp y te enviaremos una guía de retorno sin costo." },
        { q: "¿Qué garantía tienen los productos?", a: "Todos nuestros artículos retail originales cuentan con 1 año de garantía de fábrica contra cualquier defecto de costura, materiales o ensamblaje." }
      ];
    } else {
      faqsList = [
        { q: "¿Cómo se realiza el diagnóstico inicial del servicio?", a: "Nuestros agentes analizan la información de tu sector y tus cuellos de botella operativos para proponerte una automatización a la medida en menos de 48 horas de forma gratuita." },
        { q: "¿Ofrecen soporte técnico post-implementación?", a: "Por supuesto, todos nuestros planes de servicio SaaS premium incluyen soporte técnico prioritario 24/7 con tiempos de respuesta menores a 15 minutos vía ticket o chat." },
        { q: "¿Cuáles son los métodos de pago aceptados?", a: "Aceptamos pagos con cualquier tarjeta de crédito o débito (Visa, Mastercard, Amex) a través del portal de Stripe, transferencias interbancarias SPEI y depósitos bancarios." }
      ];
    }

    faqAccordion.innerHTML = '';
    faqsList.forEach(faq => {
      const item = document.createElement('div');
      item.className = 'faq-accordion-item';
      item.innerHTML = `
        <div class="faq-accordion-header">
          <span>${faq.q}</span>
          <span class="faq-accordion-arrow">▶</span>
        </div>
        <div class="faq-accordion-content">${faq.a}</div>
      `;
      faqAccordion.appendChild(item);
    });

    // Accordion Event Click Listener
    faqAccordion.querySelectorAll('.faq-accordion-item').forEach(item => {
      item.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqAccordion.querySelectorAll('.faq-accordion-item').forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  // Bind Website tab navigation
  const webTabs = document.querySelectorAll('.web-nav-tab');
  const webSections = document.querySelectorAll('.web-section');
  webTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      webTabs.forEach(t => t.classList.remove('active'));
      webSections.forEach(s => s.style.display = 'none');
      
      tab.classList.add('active');
      const targetSectionId = tab.getAttribute('data-target');
      const targetEl = document.getElementById(targetSectionId);
      if (targetEl) {
        targetEl.style.display = 'flex';
        if (targetSectionId === 'web-contact') {
          // Draw maps when tab becomes active
          drawWebMockMap();
        }
      }
      printToolLog(`[PÁGINA WEB] Navegando a pestaña: "${tab.textContent}"`);
    });
  });

  // Website Fullscreen toggle
  const fsBtn = document.getElementById('web-fullscreen-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      const browser = document.getElementById('browser-outer-container');
      if (browser) {
        const isFS = browser.classList.contains('web-preview-fullscreen');
        if (isFS) {
          browser.classList.remove('web-preview-fullscreen');
          fsBtn.innerHTML = '🖥️ Pantalla Completa';
          printToolLog(`[PÁGINA WEB] Desactivado modo pantalla completa.`);
        } else {
          browser.classList.add('web-preview-fullscreen');
          fsBtn.innerHTML = '✕ Salir Pantalla Completa';
          printToolLog(`[PÁGINA WEB] Activado vista de fidelidad Pantalla Completa.`);
        }
      }
    });
  }

  // Draw initial ERP maps
  drawERPCoverageMap();
}

function drawWebMockMap() {
  const canvas = document.getElementById('web-mock-map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);
  
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for(let x=0; x<w; x+=15) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for(let y=0; y<h; y+=15) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  
  // Roads
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(w - 25, h); ctx.stroke();
  
  // Pin & Pulse
  ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
  ctx.beginPath(); ctx.arc(w/2, h/2, 20, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
  ctx.beginPath(); ctx.arc(w/2, h/2, 10, 0, Math.PI*2); ctx.fill();
  
  // Pin marker icon
  ctx.fillStyle = '#a855f7';
  ctx.font = '14px sans-serif';
  ctx.fillText('📍', w/2 - 7, h/2 + 2);
}

function drawERPCoverageMap() {
  const canvas = document.getElementById('erp-coverage-map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);
  
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for(let i=0; i<18; i++) {
    ctx.beginPath();
    ctx.arc(w/2 + (i*12 - 100), h/2 + (Math.sin(i)*20), Math.abs(Math.cos(i))*30 + 6, 0, Math.PI*2);
    ctx.stroke();
  }
  
  // Lines
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w*0.35, h*0.45);
  ctx.lineTo(w*0.65, h*0.25);
  ctx.lineTo(w*0.5, h*0.75);
  ctx.closePath();
  ctx.stroke();
  
  // Points
  ctx.fillStyle = '#fbbf24'; // North branch
  ctx.beginPath(); ctx.arc(w*0.65, h*0.25, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#38bdf8'; // South branch
  ctx.beginPath(); ctx.arc(w*0.5, h*0.75, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#10b981'; // Centro branch (Selected)
  ctx.beginPath(); ctx.arc(w*0.35, h*0.45, 6, 0, Math.PI*2); ctx.fill();
}

// Countdown timer loop
let countdownSecs = 5 * 60;
function startWebCountdown() {
  const el = document.getElementById('web-countdown');
  if (!el) return;
  setInterval(() => {
    if (countdownSecs <= 0) {
      countdownSecs = 5 * 60;
    }
    countdownSecs--;
    const min = Math.floor(countdownSecs / 60);
    const sec = countdownSecs % 60;
    el.textContent = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  }, 1000);
}

// Website contact form submit leads pipeline
const webForm = document.getElementById('web-contact-form');
if (webForm) {
  webForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = webForm.querySelector('input[placeholder="Tu Nombre"]').value.trim();
    const emailInput = webForm.querySelector('input[placeholder="Tu Correo Electrónico"]').value.trim();
    const msgInput = webForm.querySelector('textarea').value.trim();
    
    if (!nameInput) return;
    
    // Inject to active branch CRM
    const activeBranch = document.getElementById('erp-branch-select').value;
    const branchData = profile.branchFinancials[activeBranch];
    if (branchData && branchData.leads) {
      branchData.leads.unshift({
        name: nameInput,
        contact: emailInput || 'Email',
        note: msgInput || 'Interés general en servicios',
        status: 'Cotizando'
      });
      updateERPCRM();
      printToolLog(`[PÁGINA WEB] Nuevo prospecto registrado: "${nameInput}" asignado a sucursal ${activeBranch.toUpperCase()}.`);
    }
    
    alert(`📩 Mensaje enviado con éxito!\n\nEl Asistente IA ha registrado al lead "${nameInput}" en tu CRM de la Sucursal ${activeBranch.toUpperCase()}.`);
    webForm.reset();
  });
}

// ── MOCKUP D: ERP CONTROLLER ──
function formatCurrency(amount) {
  const symbol = (profile && profile.currencySymbol) ? profile.currencySymbol : 'MXN';
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${symbol}`;
}

function updateERPPL() {
  const branch = document.getElementById('erp-branch-select').value;
  const branchData = profile.branchFinancials[branch];
  if (!branchData) return;
  
  // Calculate dynamic sales
  let dynamicRev = 0;
  let dynamicCOGS = 0;
  
  // If the active branch is the selected one in the dropdown, we add POS sales
  if (branch === 'centro') {
    dynamicRev = totalCashSales + totalCardSales;
    dynamicCOGS = dynamicRev * 0.35; // 35% COGS for food or items
  }
  
  const totalRev = branchData.revenue + dynamicRev;
  const totalCOGS = branchData.cogs + dynamicCOGS;
  const gross = totalRev - totalCOGS;
  const expenses = branchData.expenses;
  const taxes = branchData.taxes + (dynamicRev * 0.16);
  const net = gross - expenses - taxes;
  
  document.getElementById('erp-pl-revenue').textContent = formatCurrency(totalRev);
  document.getElementById('erp-pl-cogs').textContent = formatCurrency(totalCOGS);
  document.getElementById('erp-pl-gross').textContent = formatCurrency(gross);
  document.getElementById('erp-pl-expenses').textContent = formatCurrency(expenses);
  document.getElementById('erp-pl-taxes').textContent = formatCurrency(taxes);
  
  const netEl = document.getElementById('erp-pl-net');
  netEl.textContent = formatCurrency(net);
  if (net < 0) {
    netEl.style.color = '#ef4444';
  } else {
    netEl.style.color = '#10b981';
  }

  // Update stacked P&L composition chart
  const pctCOGS = totalRev > 0 ? (totalCOGS / totalRev * 100) : 0;
  const pctExpenses = totalRev > 0 ? (expenses / totalRev * 100) : 0;
  const pctTaxes = totalRev > 0 ? (taxes / totalRev * 100) : 0;
  const pctNet = totalRev > 0 ? (net / totalRev * 100) : 0;

  const barCogs = document.getElementById('pl-bar-cogs');
  const barExpenses = document.getElementById('pl-bar-expenses');
  const barTaxes = document.getElementById('pl-bar-taxes');
  const barNet = document.getElementById('pl-bar-net');

  if (barCogs) barCogs.style.width = Math.max(0, pctCOGS) + '%';
  if (barExpenses) barExpenses.style.width = Math.max(0, pctExpenses) + '%';
  if (barTaxes) barTaxes.style.width = Math.max(0, pctTaxes) + '%';
  if (barNet) barNet.style.width = Math.max(0, pctNet) + '%';

  const pctCogsEl = document.getElementById('pl-pct-cogs');
  const pctExpensesEl = document.getElementById('pl-pct-expenses');
  const pctTaxesEl = document.getElementById('pl-pct-taxes');
  const pctNetEl = document.getElementById('pl-pct-net');

  if (pctCogsEl) pctCogsEl.textContent = Math.round(pctCOGS) + '%';
  if (pctExpensesEl) pctExpensesEl.textContent = Math.round(pctExpenses) + '%';
  if (pctTaxesEl) pctTaxesEl.textContent = Math.round(pctTaxes) + '%';
  if (pctNetEl) pctNetEl.textContent = Math.round(pctNet) + '%';

  // Update Sales Trend Chart July bar (scaled dynamically)
  const julyTotalK = totalRev / 1000;
  const barHeight = Math.max(5, Math.min(90, Math.round((julyTotalK / 25) * 80)));
  const bar6 = document.getElementById('chart-bar-6');
  const lbl6 = document.getElementById('chart-lbl-6');
  if (bar6 && lbl6) {
    bar6.style.height = `${barHeight}px`;
    lbl6.textContent = `$${julyTotalK.toFixed(1)}k`;
  }
  
  // Also refresh alerts, CRM and Tasks
  updateERPALerts();
  updateERPCRM();
  updateERPTasks();
}

function updateERPCRM() {
  const branch = document.getElementById('erp-branch-select').value;
  const branchData = profile.branchFinancials[branch];
  const tbody = document.getElementById('erp-crm-table-body');
  if (!tbody || !branchData || !branchData.leads) return;
  
  tbody.innerHTML = '';
  
  branchData.leads.forEach((lead, idx) => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    tr.innerHTML = `
      <td style="padding: 8px 5px; font-weight: bold; color: #fff;">${lead.name}</td>
      <td style="padding: 8px 5px; color: var(--text-muted); font-family: monospace;">${lead.contact}</td>
      <td style="padding: 8px 5px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lead.note}</td>
      <td style="padding: 8px 5px;">
        <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${lead.status === 'Cerrado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)'}; color: ${lead.status === 'Cerrado' ? '#10b981' : '#fbbf24'};">
          ${lead.status}
        </span>
      </td>
      <td style="padding: 8px 5px; text-align: right;">
        <button class="action-crm-btn" style="background:none; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer; font-family: inherit;">
          ${lead.status === 'Cotizando' ? '📞 Cerrar' : '✔ Listo'}
        </button>
      </td>
    `;
    
    // Bind click to status change
    const btn = tr.querySelector('.action-crm-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (lead.status === 'Cotizando' || lead.status === 'En Espera') {
          lead.status = 'Cerrado';
          // Accumulate a mockup sale to branch revenue!
          branchData.revenue += 4500;
          printToolLog(`[CRM] Lead "${lead.name}" cerrado con éxito. Registro de ingresos extraordinarios: +$4,500.00 MXN.`);
          updateERPPL();
          if (typeof confetti === 'function') {
            confetti({ particleCount: 30, spread: 30 });
          }
        } else {
          alert('Lead ya procesado por el Asistente IA.');
        }
      });
    }
    
    tbody.appendChild(tr);
  });
}

function updateERPTasks() {
  const branch = document.getElementById('erp-branch-select').value;
  const branchData = profile.branchFinancials[branch];
  const todoContainer = document.getElementById('erp-tasks-todo');
  const progressContainer = document.getElementById('erp-tasks-progress');
  const doneContainer = document.getElementById('erp-tasks-done');
  if (!todoContainer || !doneContainer || !branchData || !branchData.tasks) return;
  
  if (!branchData.tasks.progress) {
    branchData.tasks.progress = [];
  }
  
  todoContainer.innerHTML = '';
  if (progressContainer) progressContainer.innerHTML = '';
  doneContainer.innerHTML = '';
  
  branchData.tasks.todo.forEach(t => {
    const card = document.createElement('div');
    card.className = 'erp-task-card';
    card.innerHTML = `
      <strong style="color: #fff; font-size: 11px;">${t.title}</strong>
      <span style="font-size: 10px; color: var(--text-muted);">${t.desc}</span>
      <button class="start-task-btn" style="width: 100%; padding: 4px; border-radius: 4px; background: rgba(251, 191, 36, 0.2); border: 1px solid rgba(251, 191, 36, 0.4); color: #fff; font-size: 9.5px; font-weight: bold; cursor: pointer; margin-top: 3px; font-family: inherit;">⚙️ Iniciar Proceso</button>
    `;
    
    card.querySelector('.start-task-btn').addEventListener('click', () => {
      branchData.tasks.todo = branchData.tasks.todo.filter(item => item.id !== t.id);
      branchData.tasks.progress.push(t);
      printToolLog(`[OPERACIONES] Tarea "${t.title}" movida a En Progreso.`);
      updateERPTasks();
    });
    
    todoContainer.appendChild(card);
  });
  
  branchData.tasks.progress.forEach(t => {
    const card = document.createElement('div');
    card.className = 'erp-task-card';
    card.style.borderColor = 'rgba(251, 191, 36, 0.3)';
    card.innerHTML = `
      <strong style="color: #fff; font-size: 11px;">${t.title}</strong>
      <span style="font-size: 10px; color: var(--text-muted);">${t.desc}</span>
      <button class="solve-task-btn" style="width: 100%; padding: 4px; border-radius: 4px; background: rgba(168, 85, 247, 0.25); border: 1px solid rgba(168, 85, 247, 0.45); color: #fff; font-size: 9.5px; font-weight: bold; cursor: pointer; margin-top: 3px; font-family: inherit;">🚀 Resolver con IA</button>
    `;
    
    card.querySelector('.solve-task-btn').addEventListener('click', () => {
      branchData.tasks.progress = branchData.tasks.progress.filter(item => item.id !== t.id);
      branchData.tasks.done.push(t);
      printToolLog(`[OPERACIONES] Tarea "${t.title}" completada autónomamente por Agente Hermes.`);
      updateERPTasks();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 40, spread: 35 });
      }
    });
    
    if (progressContainer) progressContainer.appendChild(card);
  });
  
  branchData.tasks.done.forEach(t => {
    const card = document.createElement('div');
    card.className = 'erp-task-card';
    card.style.borderColor = 'rgba(16, 185, 129, 0.15)';
    card.innerHTML = `
      <strong style="color: #cbd5e1; font-size: 11px; text-decoration: line-through;">${t.title}</strong>
      <span style="font-size: 10px; color: #94a3b8; font-style: italic;">Resuelta por Hermes IA</span>
    `;
    doneContainer.appendChild(card);
  });
}

function updateERPALerts() {
  const branch = document.getElementById('erp-branch-select').value;
  const branchData = profile.branchFinancials[branch];
  const container = document.getElementById('erp-alerts-container');
  if (!container || !branchData) return;
  
  container.innerHTML = '';
  
  // Inject branch specific alerts
  branchData.alerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = `erp-alert-item ${alert.type === 'warning' ? 'warning' : alert.type === 'success' ? 'success' : 'info'}`;
    let icon = alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✅' : 'ℹ️';
    div.innerHTML = `<span>${icon}</span> <span>${alert.text}</span>`;
    container.appendChild(div);
  });
  
  // Inject global stock warning alert if inventory is low
  if (profile.inventory) {
    profile.inventory.forEach(item => {
      if (item.qty <= item.min) {
        const div = document.createElement('div');
        div.className = 'erp-alert-item warning';
        div.innerHTML = `<span>🚨</span> <span><strong>Stock Crítico:</strong> Quedan solo ${item.qty} ${item.unit} de "${item.name}".</span>`;
        container.appendChild(div);
      }
    });
  }
}

// Subtab switcher
document.querySelectorAll('.erp-subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.erp-subtab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const selectedSub = btn.getAttribute('data-subtab');
    document.querySelectorAll('.erp-subtab-content').forEach(view => {
      view.style.display = 'none';
    });
    
    const matched = document.getElementById(`erp-view-${selectedSub}`);
    if (matched) {
      if (selectedSub === 'tasks') {
        matched.style.display = 'grid'; // Uses grid
      } else {
        matched.style.display = 'flex';
        matched.style.flexDirection = 'column';
      }
    }
  });
});

// Dropdown change updates branch title and P&L
document.getElementById('erp-branch-select').addEventListener('change', (e) => {
  const name = e.target.options[e.target.selectedIndex].text;
  document.getElementById('erp-pl-branch-title').textContent = name;
  updateERPPL();
});

// Optimizer toggle switch
document.getElementById('erp-optimize-toggle').addEventListener('change', (e) => {
  const node = document.getElementById('erp-bottleneck-node');
  const statusVal = document.getElementById('erp-status-val');
  const timeVal = document.getElementById('erp-time-val');

  if (e.target.checked) {
    node.className = 'flow-node success';
    node.innerHTML = `
      ${profile.erpOptimizeNode}
      <div style="font-size: 10px; font-weight: 500; opacity: 0.8; margin-top: 3px;">${profile.erpOptimizeDesc}</div>
    `;
    statusVal.textContent = '🟢 Prototipo Óptimo (100% Eficiente)';
    statusVal.style.color = '#10b981';
    timeVal.textContent = '24 horas / semana';
    timeVal.style.color = '#10b981';
    
    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 40 });
    }
    printToolLog(`[OPTIMIZADOR ERP] Algoritmo IA de optimización de flujo activado. Erradicado: "${profile.erpBottleneck}".`);
  } else {
    node.className = 'flow-node error';
    node.innerHTML = `
      ❌ Cuello de Botella Operativo
      <div id="erp-bottleneck-desc" style="font-size: 10px; font-weight: 500; opacity: 0.8; margin-top: 3px;">Cuello de botella: ${profile.erpBottleneck}</div>
    `;
    statusVal.textContent = '⚠️ Ineficiencias Detectadas';
    statusVal.style.color = '#ef4444';
    timeVal.textContent = '0 horas/semana';
    timeVal.style.color = '#fff';
    printToolLog(`[OPTIMIZADOR ERP] Algoritmo desactivado. Estado operacional degradado a ineficiente.`);
  }
});

// ── WHATSAPP CONVERSION MESSAGE ──
function updateWhatsAppLink() {
  const phone = '525638165507';
  const text = `Hola Brain Branding, acabo de realizar la simulación de IA para mi negocio *${bizName}* (Giro: ${bizSector}). Mi problema principal es: *"${bizProblem}"*. Me interesa cotizar una implementación real de estos sistemas para mi empresa.`;
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  
  document.getElementById('whatsapp-implement-btn').setAttribute('href', url);
}



// ── AUTONOMOUS PERSONAL ASSISTANT DEMO ENGINE ──
// ── UNIFIED MULTI-PRODUCT AUTONOMOUS RUNNER ──
let activeLoopInterval = null;
let activeLoopTimeout = null;
let currentLoopTab = null;
let activeLoopStep = 0;
let tabPauseTimeout = {};

let assistantScenarios = [];

function addTypingIndicator(side) {
  removeTypingIndicator();
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  const bubble = document.createElement('div');
  bubble.id = 'chat-typing-indicator';
  bubble.className = `chat-bubble ${side}`;
  bubble.style.display = 'flex';
  bubble.style.alignItems = 'center';
  bubble.style.gap = '4px';
  bubble.style.padding = '10px 15px';
  bubble.innerHTML = `
    <span class="typing-dot" style="width:6px; height:6px; background:#fff; border-radius:50%; animation: pulse 1s infinite alternate;"></span>
    <span class="typing-dot" style="width:6px; height:6px; background:#fff; border-radius:50%; animation: pulse 1s infinite alternate; animation-delay: 0.2s;"></span>
    <span class="typing-dot" style="width:6px; height:6px; background:#fff; border-radius:50%; animation: pulse 1s infinite alternate; animation-delay: 0.4s;"></span>
  `;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('chat-typing-indicator');
  if (el) el.remove();
}

function clearActiveLoop() {
  if (activeLoopInterval) clearInterval(activeLoopInterval);
  if (activeLoopTimeout) clearTimeout(activeLoopTimeout);
  activeLoopInterval = null;
  activeLoopTimeout = null;
}

function startActiveTabLoop(tabId) {
  clearActiveLoop();
  currentLoopTab = tabId;
  activeLoopStep = 0;
  
  if (tabPauseTimeout[tabId]) {
    const statusEl = document.getElementById('chat-simulation-status');
    if (statusEl) {
      statusEl.textContent = "Interrupción Manual Activa";
      statusEl.style.color = "#ef4444";
    }
    return;
  }

  const statusEl = document.getElementById('chat-simulation-status');
  if (statusEl) {
    statusEl.textContent = "Simulación Autónoma Activa";
    statusEl.style.color = "#fbbf24";
  }

  if (tabId === 'asistente') {
    runAsistenteLoop();
  } else if (tabId === 'pos') {
    runPOSLoop();
  } else if (tabId === 'web') {
    runWebLoop();
  } else if (tabId === 'erp') {
    runERPLoop();
  }
}

let pauseCountdownInterval = null;
let pauseSecondsLeft = 22;

function pauseActiveTabLoop(tabId) {
  if (tabPauseTimeout[tabId]) clearTimeout(tabPauseTimeout[tabId]);
  if (pauseCountdownInterval) clearInterval(pauseCountdownInterval);
  
  clearActiveLoop();
  
  pauseSecondsLeft = 22;
  
  const updateStatusText = () => {
    if (currentLoopTab === tabId) {
      const statusEl = document.getElementById('chat-simulation-status');
      if (statusEl) {
        statusEl.textContent = `⚠️ Interrupción Manual (Reanudando en ${pauseSecondsLeft}s...)`;
        statusEl.style.color = "#ef4444";
      }
    }
  };
  
  updateStatusText();
  
  pauseCountdownInterval = setInterval(() => {
    pauseSecondsLeft--;
    if (pauseSecondsLeft <= 0) {
      clearInterval(pauseCountdownInterval);
    } else {
      updateStatusText();
    }
  }, 1000);

  tabPauseTimeout[tabId] = setTimeout(() => {
    delete tabPauseTimeout[tabId];
    if (pauseCountdownInterval) clearInterval(pauseCountdownInterval);
    if (currentLoopTab === tabId) {
      printToolLog(`[SISTEMA] Reanudando ciclo autónomo para: ${tabId}...`);
      startActiveTabLoop(tabId);
    }
  }, 22000);
}

// ── 1. ASISTENTE LOOP ──
function runAsistenteLoop() {
  const step = () => {
    if (currentLoopTab !== 'asistente') return;
    
    if (activeLoopStep === 0) {
      document.getElementById('chat-messages').innerHTML = '';
    }
    
    const scenario = assistantScenarios[activeLoopStep];
    activeLoopStep = (activeLoopStep + 1) % assistantScenarios.length;
    
    const themeBtn = document.querySelector(`.chat-theme-toggle-btn[data-theme="${scenario.channel}"]`);
    if (themeBtn) themeBtn.click();

    const statusEl = document.getElementById('chat-simulation-status');
    if (statusEl) statusEl.textContent = `Paso: ${scenario.title}`;

    const logsEl = document.getElementById('agent-tool-logs');
    if (logsEl) logsEl.innerHTML = '';
    scenario.logs.forEach((log, index) => {
      setTimeout(() => {
        if (logsEl && currentLoopTab === 'asistente') {
          logsEl.innerHTML += `<div>&gt; ${log}</div>`;
          logsEl.scrollTop = logsEl.scrollHeight;
        }
      }, index * 200);
    });

    setTimeout(() => {
      if (currentLoopTab !== 'asistente') return;
      addTypingIndicator('incoming');
      
      setTimeout(() => {
        if (currentLoopTab !== 'asistente') return;
        removeTypingIndicator();
        addChatMessage('incoming', scenario.incoming.replace(/{bizName}/g, bizName).replace(/{bizSector}/g, bizSector).replace(/{bizProblem}/g, bizProblem));
        
        setTimeout(() => {
          if (currentLoopTab !== 'asistente') return;
          addTypingIndicator('outgoing');
          
          setTimeout(() => {
            if (currentLoopTab !== 'asistente') return;
            removeTypingIndicator();
            const outgoingMsg = scenario.outgoing.replace(/{bizName}/g, bizName).replace(/{bizSector}/g, bizSector).replace(/{bizProblem}/g, bizProblem);
            addChatMessage('outgoing', outgoingMsg);
            
            playBeep(980, 'sine', 0.08);
            setTimeout(() => playBeep(1280, 'sine', 0.1), 100);
            
            memoryVariables = { ...memoryVariables, ...scenario.vars };
            const latency = Math.round(Math.random() * 220 + 80);
            updateTelemetry(scenario.incoming, outgoingMsg, latency);
            
            activeLoopTimeout = setTimeout(step, 6500);
          }, 1500);
        }, 1000);
      }, 1200);
    }, 500);
  };
  step();
}

// ── 2. POS LOOP ──
function runPOSLoop() {
  const step = () => {
    if (currentLoopTab !== 'pos') return;

    if (activeLoopStep === 0) {
      const clearBtn = document.getElementById('clear-cart-btn');
      if (clearBtn) clearBtn.click();
      
      const loyaltySelect = document.getElementById('pos-loyalty-select');
      if (loyaltySelect) {
        loyaltySelect.value = 'none';
        loyaltySelect.dispatchEvent(new Event('change'));
      }
      
      const prods = document.querySelectorAll('.pos-prod-card');
      if (prods.length > 0) {
        prods[0].click();
        printToolLog(`[POS AUTÓNOMO] Añadiendo: ${profile.posProducts[0].name} al carrito.`);
      }
      activeLoopStep = 1;
      activeLoopTimeout = setTimeout(step, 2000);
    } 
    else if (activeLoopStep === 1) {
      const prods = document.querySelectorAll('.pos-prod-card');
      if (prods.length > 2) {
        prods[2].click();
        printToolLog(`[POS AUTÓNOMO] Añadiendo: ${profile.posProducts[2].name} al carrito.`);
      }
      activeLoopStep = 2;
      activeLoopTimeout = setTimeout(step, 2000);
    } 
    else if (activeLoopStep === 2) {
      const coupons = document.querySelectorAll('.coupon-btn');
      if (coupons.length > 0) {
        coupons[0].click();
        printToolLog(`[POS AUTÓNOMO] Aplicando Cupón BOGO.`);
      }
      
      const loyaltySelect = document.getElementById('pos-loyalty-select');
      if (loyaltySelect) {
        loyaltySelect.value = 'vip';
        loyaltySelect.dispatchEvent(new Event('change'));
        printToolLog(`[POS AUTÓNOMO] Cliente VIP seleccionado.`);
      }
      activeLoopStep = 3;
      activeLoopTimeout = setTimeout(step, 2000);
    } 
    else if (activeLoopStep === 3) {
      const checkoutBtn = document.getElementById('checkout-pos-btn');
      if (checkoutBtn) {
        checkoutBtn.click();
        printToolLog(`[POS AUTÓNOMO] Iniciando Checkout. Esperando cobro Contactless.`);
      }
      activeLoopStep = 4;
      activeLoopTimeout = setTimeout(step, 2000);
    } 
    else if (activeLoopStep === 4) {
      const tapBtn = document.getElementById('simulate-tap-btn');
      if (tapBtn) {
        tapBtn.click();
        printToolLog(`[POS AUTÓNOMO] Leyendo tarjeta contactless en terminal Stripe.`);
      }
      activeLoopStep = 0;
      activeLoopTimeout = setTimeout(step, 6500);
    }
  };
  step();
}

// ── 3. WEBSITE LOOP ──
function runWebLoop() {
  const step = () => {
    if (currentLoopTab !== 'web') return;

    const sections = ['services', 'about', 'contact', 'home'];
    const currentSection = sections[activeLoopStep];
    
    const navLink = document.getElementById(`web-nav-${currentSection}`);
    if (navLink) {
      navLink.click();
      printToolLog(`[WEB AUTÓNOMO] Navegando a la sección: ${currentSection.toUpperCase()}`);
    }
    
    if (currentSection === 'services') {
      const accordions = document.querySelectorAll('.faq-accordion-header');
      if (accordions.length > 0) {
        setTimeout(() => {
          if (currentLoopTab === 'web') {
            accordions[0].click();
            printToolLog(`[WEB AUTÓNOMO] Desplegando acordeón FAQ: "¿Cómo funciona el servicio?"`);
          }
        }, 1000);
      }
    } 
    else if (currentSection === 'contact') {
      printToolLog(`[WEB AUTÓNOMO] Inicializando Canvas interactivo de Google Maps.`);
    }

    activeLoopStep = (activeLoopStep + 1) % sections.length;
    activeLoopTimeout = setTimeout(step, 3500);
  };
  step();
}

// ── 4. ERP LOOP ──
function runERPLoop() {
  const step = () => {
    if (currentLoopTab !== 'erp') return;

    const subtabs = ['pl', 'crm', 'tasks', 'sat', 'flow'];
    const currentSubtab = subtabs[activeLoopStep];

    const btn = document.querySelector(`.erp-subtab-btn[data-subtab="${currentSubtab}"]`);
    if (btn) {
      btn.click();
      printToolLog(`[ERP AUTÓNOMO] Abriendo módulo ERP: ${btn.textContent.trim()}`);
    }

    if (currentSubtab === 'pl') {
      const branchSelect = document.getElementById('erp-branch-select');
      if (branchSelect) {
        branchSelect.value = 'norte';
        branchSelect.dispatchEvent(new Event('change'));
        printToolLog(`[ERP AUTÓNOMO] Cambiando consolidado a Sucursal Norte.`);
      }
    } 
    else if (currentSubtab === 'tasks') {
      const cards = document.querySelectorAll('.kanban-card');
      if (cards.length > 0) {
        setTimeout(() => {
          if (currentLoopTab === 'erp') {
            cards[0].click();
            printToolLog(`[ERP AUTÓNOMO] Sincronizando tarea Kanban.`);
          }
        }, 1000);
      }
    } 
    else if (currentSubtab === 'flow') {
      const toggle = document.getElementById('erp-optimize-toggle');
      if (toggle) {
        setTimeout(() => {
          if (currentLoopTab === 'erp') {
            toggle.click();
            printToolLog(`[ERP AUTÓNOMO] Alternando Algoritmo de Optimización IA.`);
          }
        }, 1000);
      }
    }

    activeLoopStep = (activeLoopStep + 1) % subtabs.length;
    activeLoopTimeout = setTimeout(step, 4000);
  };
  step();
}

function attachPauseListeners() {
  // Asistente
  const assistantInputs = [
    document.getElementById('chat-user-input'),
    document.getElementById('send-chat-btn')
  ];
  assistantInputs.forEach(el => {
    if (el) {
      el.addEventListener('focus', () => pauseActiveTabLoop('asistente'));
      el.addEventListener('click', () => pauseActiveTabLoop('asistente'));
      el.addEventListener('keypress', () => pauseActiveTabLoop('asistente'));
    }
  });
  document.querySelectorAll('.chat-theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => pauseActiveTabLoop('asistente'));
  });

  // POS
  document.querySelectorAll('.pos-prod-card').forEach(btn => {
    btn.addEventListener('click', () => pauseActiveTabLoop('pos'));
  });
  document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => pauseActiveTabLoop('pos'));
  });
  document.querySelectorAll('.coupon-btn').forEach(btn => {
    btn.addEventListener('click', () => pauseActiveTabLoop('pos'));
  });
  const posSelects = [
    document.getElementById('pos-loyalty-select'),
    document.getElementById('pos-reorder-btn'),
    document.getElementById('checkout-pos-btn'),
    document.getElementById('simulate-tap-btn'),
    document.getElementById('clear-cart-btn')
  ];
  posSelects.forEach(el => {
    if (el) el.addEventListener('click', () => pauseActiveTabLoop('pos'));
  });

  // Web
  const webBtns = [
    document.getElementById('web-fullscreen-btn'),
    document.getElementById('web-nav-home'),
    document.getElementById('web-nav-services'),
    document.getElementById('web-nav-about'),
    document.getElementById('web-nav-contact')
  ];
  webBtns.forEach(el => {
    if (el) el.addEventListener('click', () => pauseActiveTabLoop('web'));
  });
  
  // ERP
  const erpBtns = [
    document.getElementById('erp-branch-select'),
    document.getElementById('erp-optimize-toggle')
  ];
  erpBtns.forEach(el => {
    if (el) el.addEventListener('click', () => pauseActiveTabLoop('erp'));
  });
  document.querySelectorAll('.erp-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => pauseActiveTabLoop('erp'));
  });
}

// ── LISTENERS FOR TAB SYSTEM ──
document.querySelectorAll('.tab-link').forEach(link => {
  link.addEventListener('click', () => {
    const tabId = link.getAttribute('data-tab');
    
    const loader = document.getElementById('tab-loader-overlay');
    if (loader) {
      loader.style.display = 'flex';
    }
    
    setTimeout(() => {
      if (loader) {
        loader.style.display = 'none';
      }
      startActiveTabLoop(tabId);
    }, 450);
  });
});

function initSimulationLoop() {
  attachPauseListeners();
  
  // Categorize problem to generate custom scenarios using the extraction helper
  const kws = extractKeywords(bizProblem + " " + bizSector);
  let category = 'operations';
  
  const matches = (list) => kws.some(kw => list.includes(kw));
  
  if (matches(["credito", "cobro", "cobranza", "pago", "abono", "mensualidad", "cartera", "cuotas", "financiar", "financiamiento", "moroso", "deuda"])) {
    category = 'credit';
  } else if (matches(["inventario", "stock", "almacen", "bodega", "existencias", "insumos", "cocina", "ingredientes", "materia", "refacciones", "piezas"])) {
    category = 'inventory';
  } else if (matches(["ventas", "clientes", "marketing", "prospectos", "cotizar", "vender", "atraer", "leads", "publicidad"])) {
    category = 'sales';
  } else if (matches(["reparacion", "tecnico", "reparar", "taller", "mantenimiento", "garantia", "soporte", "falla"])) {
    category = 'repair';
  } else if (matches(["entrega", "entregas", "domicilio", "flete", "envio", "envios", "transporte", "ruta", "rutas", "camion"])) {
    category = 'logistics';
  }
  
  assistantScenarios = generateDynamicScenarios(category);
  
  const defaultTab = (activeService === 'all') ? 'asistente' : activeService;
  startActiveTabLoop(defaultTab);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initSimulationLoop, 600);
} else {
  window.addEventListener('load', () => {
    setTimeout(initSimulationLoop, 600);
  });
}

/* ============================================================
   BRAIN BRANDING - LOGICA DE LA APLICACIÓN INTERACTIVA DE DEMO
   ============================================================ */

// 1. PIN GATE LOGIC
const PinGate = {
  enteredPin: "",
  validPins: ["72217", "20260", "20261", "2026", "84927"],

  press(num) {
    if (this.enteredPin.length < 5) {
      this.enteredPin += num;
      this.updateDisplay();
      if (this.enteredPin.length === 5) {
        this.submit();
      }
    }
  },

  clear() {
    this.enteredPin = this.enteredPin.slice(0, -1);
    this.updateDisplay();
  },

  updateDisplay() {
    const boxes = document.querySelectorAll(".pin-box");
    boxes.forEach((box, idx) => {
      if (idx < this.enteredPin.length) {
        box.textContent = "•";
        box.classList.add("active");
      } else {
        box.textContent = "";
        box.classList.remove("active");
      }
    });
  },

  submit() {
    const helper = document.getElementById("pinHelperText");
    if (this.validPins.includes(this.enteredPin) || this.enteredPin === "2026") {
      helper.innerHTML = "<span style='color: #2DD4BF;'>✓ ¡Acceso Autorizado! Cargando configuración de SERO LAB...</span>";
      setTimeout(() => {
        document.getElementById("pinOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
        DemoApp.init();
      }, 500);
    } else {
      helper.innerHTML = "<span style='color: #EF4444;'>❌ NIP Incorrecto. Prueba con 72217 o 20260</span>";
      this.enteredPin = "";
      this.updateDisplay();
    }
  },

  quickUnlock(pin) {
    this.enteredPin = pin;
    this.updateDisplay();
    this.submit();
  }
};

// 2. DEMO APP CONTROLLER
const DemoApp = {
  userRequirements: {},

  init() {
    this.loadSavedState();
    this.renderModules('all');
    this.updateProgress();
  },

  loadSavedState() {
    const saved = localStorage.getItem("serolab_demo_requirements");
    if (saved) {
      try {
        this.userRequirements = JSON.parse(saved);
      } catch (e) {
        this.userRequirements = {};
      }
    }
  },

  saveState() {
    localStorage.setItem("serolab_demo_requirements", JSON.stringify(this.userRequirements));
    this.updateProgress();
  },

  filterCategory(cat) {
    document.querySelectorAll(".cat-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === cat);
    });
    this.renderModules(cat);
  },

  renderModules(filter) {
    const grid = document.getElementById("modulesGrid");
    grid.innerHTML = "";

    const filtered = SEROLAB_MODULES.filter(m => filter === 'all' || m.category === filter);

    filtered.forEach(m => {
      const savedData = this.userRequirements[m.id] || {
        uso: m.defaultUso,
        deseo: m.defaultDeseo
      };

      const isConfigured = Boolean(this.userRequirements[m.id]);
      const card = document.createElement("div");
      card.className = `module-card ${isConfigured ? 'configured' : ''}`;
      card.id = `card-${m.id}`;

      card.innerHTML = `
        <div>
          <div class="mod-header">
            <div class="mod-title-group">
              <div class="mod-icon">${m.icon}</div>
              <div>
                <h3>${m.name}</h3>
                <span>${m.category.toUpperCase()}</span>
              </div>
            </div>
            <span class="mod-badge ${m.badgeType === 'new' ? 'badge-new' : 'badge-legacy'}">
              ${m.badgeText}
            </span>
          </div>

          <!-- Comparativa -->
          <div class="comp-panel">
            <div class="comp-label current">🔴 Qué hace su app actual (Labtivity)</div>
            <div class="comp-text">${m.currentApp}</div>
          </div>

          <div class="comp-panel" style="border-color: rgba(45, 212, 191, 0.3);">
            <div class="comp-label better">⚡ Cómo lo moderniza Brain Branding</div>
            <div class="comp-text" style="color: #E2E8F0;">${m.brainBetter}</div>
          </div>

          <!-- Campos Interactivos para el Prospecto -->
          <div class="input-block">
            <label>1. ¿En qué lo ocupan actualmente en SERO LAB? <span>(Personalizable)</span></label>
            <textarea class="custom-textarea" id="uso-${m.id}" placeholder="Escribe cómo usan este módulo..." oninput="DemoApp.handleInputChange('${m.id}')">${savedData.uso}</textarea>
          </div>

          <div class="input-block">
            <label>2. ¿Qué necesitan o les gustaría que haga de más? <span>(Requerimientos)</span></label>
            <textarea class="custom-textarea" id="deseo-${m.id}" placeholder="Escribe qué quisieras agregar o mejorar..." oninput="DemoApp.handleInputChange('${m.id}')">${savedData.deseo}</textarea>
          </div>

          <!-- Live AI Advice Box -->
          <div class="ai-advice-box" id="advice-${m.id}">
            <div class="ai-advice-header">
              <span>🧠 SUGERENCIA TECNOLÓGICA BRAIN BRANDING</span>
            </div>
            <div class="ai-advice-text">${m.aiAdvice}</div>
            <button class="btn-apply-advice" onclick="DemoApp.applyAdvice('${m.id}')">
              + Agregar recomendación a mi solicitud
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  },

  handleInputChange(modId) {
    const usoVal = document.getElementById(`uso-${modId}`).value;
    const deseoVal = document.getElementById(`deseo-${modId}`).value;

    this.userRequirements[modId] = {
      uso: usoVal,
      deseo: deseoVal,
      updatedAt: new Date().toISOString()
    };

    const card = document.getElementById(`card-${modId}`);
    if (card) card.classList.add("configured");

    this.saveState();
  },

  applyAdvice(modId) {
    const mod = SEROLAB_MODULES.find(m => m.id === modId);
    if (!mod) return;

    const deseoArea = document.getElementById(`deseo-${modId}`);
    if (deseoArea) {
      if (!deseoArea.value.includes(mod.aiAdvice)) {
        deseoArea.value = deseoArea.value ? `${deseoArea.value}\n\n• ${mod.aiAdvice}` : `• ${mod.aiAdvice}`;
        this.handleInputChange(modId);
      }
    }
  },

  updateProgress() {
    const count = Object.keys(this.userRequirements).length;
    const total = SEROLAB_MODULES.length;
    const pct = Math.round((count / total) * 100);

    const fill = document.getElementById("progressFill");
    const pctTxt = document.getElementById("progressPercent");
    const badge = document.getElementById("reqCountBadge");

    if (fill) fill.style.width = `${pct}%`;
    if (pctTxt) pctTxt.textContent = `${pct}% (${count}/${total})`;
    if (badge) badge.textContent = `${count}`;
  },

  openSummaryModal() {
    const modal = document.getElementById("summaryModal");
    const body = document.getElementById("modalBodyContent");
    const totalTxt = document.getElementById("totalReqsText");

    const keys = Object.keys(this.userRequirements);
    if (keys.length === 0) {
      // Auto pre-populate all with defaults if user hasn't touched yet
      SEROLAB_MODULES.forEach(m => {
        this.userRequirements[m.id] = { uso: m.defaultUso, deseo: m.defaultDeseo };
      });
      this.saveState();
    }

    body.innerHTML = "";
    SEROLAB_MODULES.forEach(m => {
      const data = this.userRequirements[m.id] || { uso: m.defaultUso, deseo: m.defaultDeseo };
      const item = document.createElement("div");
      item.className = "summary-item";
      item.innerHTML = `
        <h4>${m.icon} ${m.name} (${m.category.toUpperCase()})</h4>
        <p><b>Uso Actual en SERO LAB:</b> ${data.uso}</p>
        <p><b>Requerimientos & Mejoras Solicitadas:</b> <span style="color: #2DD4BF;">${data.deseo}</span></p>
      `;
      body.appendChild(item);
    });

    totalTxt.textContent = `Has diagnosticado y configurado los ${SEROLAB_MODULES.length} módulos.`;
    modal.style.display = "flex";
  },

  closeSummaryModal() {
    document.getElementById("summaryModal").style.display = "none";
  },

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      cliente: "SERO LAB GRUPO DIAGNÓSTICO",
      proveedor: "Brain Branding",
      fecha: new Date().toISOString(),
      requerimientos: this.userRequirements
    }, null, 2));

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Requerimientos_SEROLAB_BrainBranding_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  sendViaWhatsApp() {
    let msg = `*SOLICITUD DE REQUERIMIENTOS LIMS & ERP - SERO LAB GRUPO DIAGNÓSTICO*\n`;
    msg += `_Preparado a través del Configurador Interactivo de Brain Branding_\n\n`;

    SEROLAB_MODULES.forEach(m => {
      const req = this.userRequirements[m.id] || { uso: m.defaultUso, deseo: m.defaultDeseo };
      msg += `📌 *${m.name}*\n`;
      msg += `• Uso: ${req.uso}\n`;
      msg += `• Solicitud: ${req.deseo}\n\n`;
    });

    msg += `🚀 *Esperamos su retroalimentación para iniciar el desarrollo.*`;

    const encoded = encodeURIComponent(msg);
    // WhatsApp URL (can be user or company number)
    const waUrl = `https://wa.me/527221793328?text=${encoded}`;
    window.open(waUrl, "_blank");
  }
};

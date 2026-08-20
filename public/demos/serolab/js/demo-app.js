/* ============================================================
   BRAIN BRANDING - LOGICA DE LA APLICACIÓN INTERACTIVA v2.3
   INCLUYE SINCRONIZACIÓN EN TIEMPO REAL CON RENDER & TELEGRAM
   ============================================================ */

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
      helper.innerHTML = "<span style='color: #2DD4BF; font-weight: 700;'>✓ ¡Acceso Autorizado! Cargando configuración de SERO LAB...</span>";
      setTimeout(() => {
        document.getElementById("pinOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
        DemoApp.init();
      }, 400);
    } else {
      helper.innerHTML = "<span style='color: #EF4444; font-weight: 700;'>❌ NIP Incorrecto. Verifica con el equipo de Brain Branding</span>";
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

const DemoApp = {
  userRequirements: {},
  currentArea: "Laboratorio y Químicos",
  SYNC_API_URL: "https://brain-branding-demo-generator.onrender.com/api/serolab/save-requirement",

  init() {
    this.loadSavedState();
    this.renderModules('all');
    this.updateCounters();
  },

  setCollaboratorArea(area) {
    this.currentArea = area;
    const status = document.getElementById("saveStatusBar");
    if (status) {
      status.innerHTML = `<span>👤 Aportando como: <b>${area}</b>. Tus comentarios se etiquetarán con tu área y se notificarán a Brain Branding.</span>`;
    }
  },

  loadSavedState() {
    const saved = localStorage.getItem("serolab_lims_requirements_v2");
    if (saved) {
      try {
        this.userRequirements = JSON.parse(saved);
      } catch (e) {
        this.userRequirements = {};
      }
    }
  },

  saveState() {
    localStorage.setItem("serolab_lims_requirements_v2", JSON.stringify(this.userRequirements));
    this.updateCounters();
  },

  async syncToServer(modId) {
    const mod = SEROLAB_MODULES.find(m => m.id === modId);
    const data = this.userRequirements[modId];
    if (!mod || !data) return;

    try {
      fetch(this.SYNC_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: mod.id,
          moduleName: mod.name,
          authorArea: data.authorArea || this.currentArea,
          uso: data.uso,
          deseo: data.deseo,
          submodules: data.submodules || []
        })
      }).catch(e => console.log("Background sync non-blocking:", e));
    } catch (e) {}
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
        deseo: m.defaultDeseo,
        submodules: [],
        authorArea: this.currentArea
      };

      const isConfigured = Boolean(this.userRequirements[m.id]);
      const card = document.createElement("div");
      card.className = `module-card ${isConfigured ? 'configured' : ''}`;
      card.id = `card-${m.id}`;

      // Batería de sugerencias HTML
      let adviceItemsHtml = "";
      m.advices.forEach(adv => {
        adviceItemsHtml += `
          <div class="advice-item">
            <span>💡 ${adv}</span>
            <button class="btn-add-advice" onclick="DemoApp.appendAdvice('${m.id}', '${adv.replace(/'/g, "\\'")}')">
              + Agregar
            </button>
          </div>
        `;
      });

      // Submódulos Checkbox List
      let submodulesHtml = "";
      m.submodules.forEach(sub => {
        const isChecked = savedData.submodules && savedData.submodules.includes(sub);
        submodulesHtml += `
          <label class="submod-item">
            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="DemoApp.toggleSubmodule('${m.id}', '${sub.replace(/'/g, "\\'")}', this.checked)">
            <span>${sub}</span>
          </label>
        `;
      });

      card.innerHTML = `
        <div>
          <!-- Header -->
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

          <!-- DIFERENCIADORES VISUALES CLAROS -->
          <div class="diff-box legacy">
            <div class="diff-tag legacy-tag">🔴 LO QUE YA TIENEN HOY EN LABTIVITY:</div>
            <div class="diff-text">${m.currentApp}</div>
          </div>

          <div class="diff-box better">
            <div class="diff-tag better-tag">🚀 LA TRANSFORMACIÓN BRAIN BRANDING (LIMS 4.0):</div>
            <div class="diff-text">${m.brainBetter}</div>
          </div>

          <!-- Formularios Interactivos -->
          <div class="input-block">
            <label>1. ¿Cómo se opera hoy este módulo en tu área? <span>(Personalizable)</span></label>
            <textarea class="custom-textarea" id="uso-${m.id}" placeholder="Describe el uso actual en SERO LAB..." oninput="DemoApp.handleInputChange('${m.id}')">${savedData.uso}</textarea>
          </div>

          <div class="input-block">
            <label>2. ¿Qué necesitas o te gustaría que haga de más? <span>(Requerimientos)</span></label>
            <textarea class="custom-textarea" id="deseo-${m.id}" placeholder="Escribe tus requerimientos y mejoras..." oninput="DemoApp.handleInputChange('${m.id}')">${savedData.deseo}</textarea>
          </div>

          <!-- Batería de Sugerencias Tecnológicas de IA -->
          <div class="advice-section">
            <div class="advice-title">🧠 BATERÍA DE SUGERENCIAS TECNOLÓGICAS BRAIN BRANDING:</div>
            <div class="advice-list">
              ${adviceItemsHtml}
            </div>
          </div>

          <!-- Submódulos y Funciones Opcionales -->
          <div class="submodules-section">
            <div class="submod-title">🧩 SUBMÓDULOS & FUNCIONES AVANZADAS SELECCIONABLES:</div>
            <div class="submod-options">
              ${submodulesHtml}
            </div>
          </div>
        </div>

        <!-- Footer Card with Save Button -->
        <div class="card-footer-action">
          <span class="author-tag" id="author-${m.id}">Área: <b>${savedData.authorArea || this.currentArea}</b></span>
          <button class="btn-card-save" id="btn-save-${m.id}" onclick="DemoApp.saveSingleModule('${m.id}')">
            💾 Guardar este Módulo
          </button>
        </div>
      `;

      grid.appendChild(card);
    });
  },

  handleInputChange(modId) {
    const usoVal = document.getElementById(`uso-${modId}`).value;
    const deseoVal = document.getElementById(`deseo-${modId}`).value;

    const existing = this.userRequirements[modId] || { submodules: [] };

    this.userRequirements[modId] = {
      ...existing,
      uso: usoVal,
      deseo: deseoVal,
      authorArea: this.currentArea,
      updatedAt: new Date().toISOString()
    };

    const card = document.getElementById(`card-${modId}`);
    if (card) card.classList.add("configured");

    this.saveState();
  },

  appendAdvice(modId, text) {
    const deseoArea = document.getElementById(`deseo-${modId}`);
    if (deseoArea) {
      if (!deseoArea.value.includes(text)) {
        deseoArea.value = deseoArea.value ? `${deseoArea.value}\n\n• [Sugerencia IA] ${text}` : `• [Sugerencia IA] ${text}`;
        this.handleInputChange(modId);
        this.saveSingleModule(modId);
      }
    }
  },

  toggleSubmodule(modId, subName, isChecked) {
    if (!this.userRequirements[modId]) {
      const mod = SEROLAB_MODULES.find(m => m.id === modId);
      this.userRequirements[modId] = {
        uso: mod.defaultUso,
        deseo: mod.defaultDeseo,
        submodules: [],
        authorArea: this.currentArea
      };
    }

    if (!this.userRequirements[modId].submodules) {
      this.userRequirements[modId].submodules = [];
    }

    if (isChecked) {
      if (!this.userRequirements[modId].submodules.includes(subName)) {
        this.userRequirements[modId].submodules.push(subName);
      }
    } else {
      this.userRequirements[modId].submodules = this.userRequirements[modId].submodules.filter(s => s !== subName);
    }

    this.saveState();
    this.saveSingleModule(modId);
  },

  saveSingleModule(modId) {
    this.handleInputChange(modId);
    this.syncToServer(modId);
    this.showSaveFeedback(modId);
  },

  showSaveFeedback(modId) {
    const btn = document.getElementById(`btn-save-${modId}`);
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = "✓ ¡Guardado y Sincronizado!";
      btn.classList.add("saved");
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove("saved");
      }, 1500);
    }

    const statusBar = document.getElementById("saveStatusBar");
    if (statusBar) {
      statusBar.innerHTML = `<span>✓ Módulo sincronizado con Brain Branding (Área: <b>${this.currentArea}</b>) a las ${new Date().toLocaleTimeString()}</span>`;
    }
  },

  updateCounters() {
    const count = Object.keys(this.userRequirements).length;
    const badge = document.getElementById("reqCountBadge");
    const statConfigured = document.getElementById("statConfiguredCount");
    const statSubmods = document.getElementById("statSubmodulesCount");

    let totalSubmods = 0;
    Object.values(this.userRequirements).forEach(r => {
      if (r.submodules) totalSubmods += r.submodules.length;
    });

    if (badge) badge.textContent = `${count}`;
    if (statConfigured) statConfigured.textContent = `${count} / 18`;
    if (statSubmods) statSubmods.textContent = `${totalSubmods}`;
  },

  openSummaryModal() {
    const modal = document.getElementById("summaryModal");
    const body = document.getElementById("modalBodyContent");
    const totalTxt = document.getElementById("totalReqsText");

    // Auto prepopulate if empty
    if (Object.keys(this.userRequirements).length === 0) {
      SEROLAB_MODULES.forEach(m => {
        this.userRequirements[m.id] = {
          uso: m.defaultUso,
          deseo: m.defaultDeseo,
          submodules: m.submodules.slice(0, 2),
          authorArea: this.currentArea
        };
      });
      this.saveState();
    }

    body.innerHTML = "";
    SEROLAB_MODULES.forEach(m => {
      const data = this.userRequirements[m.id] || {
        uso: m.defaultUso,
        deseo: m.defaultDeseo,
        submodules: [],
        authorArea: "General"
      };

      const subList = data.submodules && data.submodules.length > 0
        ? data.submodules.map(s => `✓ ${s}`).join(" | ")
        : "Ninguno seleccionado";

      const item = document.createElement("div");
      item.className = "summary-item";
      item.innerHTML = `
        <h4>${m.icon} ${m.name} (${m.category.toUpperCase()}) — <font color="#94A3B8">Área: ${data.authorArea || 'General'}</font></h4>
        <p><b>Uso Actual en SERO LAB:</b> ${data.uso}</p>
        <p><b>Requerimientos & Deseos:</b> <span style="color: #2DD4BF;">${data.deseo}</span></p>
        <div class="summary-submods"><b>Submódulos Seleccionados:</b> ${subList}</div>
      `;
      body.appendChild(item);
    });

    totalTxt.textContent = `Consolidado de los 18 módulos para SERO LAB Grupo Diagnóstico.`;
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
    downloadAnchor.setAttribute("download", `Expediente_Requerimientos_SEROLAB_BrainBranding_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  sendViaWhatsApp() {
    let msg = `*EXPEDIENTE DE REQUERIMIENTOS LIMS 4.0 - SERO LAB GRUPO DIAGNÓSTICO*\n`;
    msg += `_Levantamiento Multidisciplinario para Brain Branding_\n\n`;

    SEROLAB_MODULES.forEach(m => {
      const req = this.userRequirements[m.id] || {
        uso: m.defaultUso,
        deseo: m.defaultDeseo,
        submodules: [],
        authorArea: "General"
      };

      msg += `📌 *${m.name}* (${req.authorArea || 'General'})\n`;
      msg += `• Uso: ${req.uso}\n`;
      msg += `• Solicitud: ${req.deseo}\n`;
      if (req.submodules && req.submodules.length > 0) {
        msg += `• Submódulos: ${req.submodules.join(", ")}\n`;
      }
      msg += `\n`;
    });

    msg += `🚀 *Enviado desde el Configurador Interactivo de Brain Branding.*`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/527712339238?text=${encoded}`;
    window.open(waUrl, "_blank");
  }
};

/* ==========================================================================
   LÓGICA PRINCIPAL DE LA APLICACIÓN - DEMO MULTI-TENANT (BRAIN BRANDING)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  currentRole: "admin", // "admin" or "client"
  enteredPin: "",
  failedAttempts: 0,
  lockUntil: 0,
  activeSector: "all",

  init: function() {
    this.bindEvents();
    this.renderAll();
    this.checkSession();
  },

  checkSession: function() {
    // Limpiar cualquier bloqueo residual previo en localStorage
    localStorage.removeItem("pedro_demo_lock_time");
    this.lockUntil = 0;
    this.failedAttempts = 0;

    // 2. Verificar expiración efímera de 90 días
    const created = new Date(initialData.createdDate || "2026-08-08");
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (diffDays > initialData.expirationDays) {
      document.body.innerHTML = `
        <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#070913; color:#fff; text-align:center; padding:20px; font-family:sans-serif;">
          <div style="max-width:420px; background:rgba(18, 24, 43, 0.85); border:1px solid rgba(255, 65, 108, 0.3); border-radius:20px; padding:32px;">
            <div style="font-size:48px; margin-bottom:12px;">⌛</div>
            <h2 style="color:#ff416c; margin-bottom:8px;">404 - Demo Expirada</h2>
            <p style="font-size:13px; color:#94a3b8; margin-bottom:20px;">
              Esta demostración efímera ha cumplido su periodo límite de vida útil de 90 días y se ha autolimpiado de forma segura del servidor.
            </p>
            <a href="https://brainbranding.com.mx" style="display:inline-block; background:#00f2fe; color:#000; font-weight:800; text-decoration:none; padding:12px 24px; border-radius:12px;">
              Contactar Soporte Brain Branding
            </a>
          </div>
        </div>
      `;
      return;
    }

    // SIEMPRE EXIGIR EL NIP DE 5 DÍGITOS AL ENTRAR AL HUB DE DEMOS
    const pinGate = document.getElementById("pinGateOverlay");
    if (pinGate) {
      pinGate.style.display = "flex";
    }
  },

  bindEvents: function() {
    // Physical Keyboard Listener (0-9, Backspace, Delete, Escape)
    document.addEventListener("keydown", (e) => {
      const pinGate = document.getElementById("pinGateOverlay");
      if (!pinGate || pinGate.style.display === "none") return;

      if (e.key >= "0" && e.key <= "9") {
        if (this.enteredPin.length < 6) {
          this.enteredPin += e.key;
          this.updatePinDisplay();
        }
      } else if (e.key === "Backspace") {
        this.enteredPin = this.enteredPin.slice(0, -1);
        this.updatePinDisplay();
      } else if (e.key === "Escape" || e.key === "Delete") {
        this.enteredPin = "";
        this.updatePinDisplay();
      }
    });

    document.querySelectorAll(".key-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const val = e.currentTarget.dataset.key;
        if (val === "del") {
          this.enteredPin = this.enteredPin.slice(0, -1);
        } else if (val === "clear") {
          this.enteredPin = "";
        } else if (this.enteredPin.length < 6) {
          this.enteredPin += val;
        }
        this.updatePinDisplay();
      });
    });

    document.querySelectorAll(".role-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const role = e.currentTarget.dataset.role;
        this.switchRole(role);
      });
    });
  },

  pinTimeout: null,

  updatePinDisplay: function() {
    if (this.pinTimeout) {
      clearTimeout(this.pinTimeout);
      this.pinTimeout = null;
    }

    const digits = document.querySelectorAll(".pin-digit");
    digits.forEach((d, idx) => {
      if (idx < this.enteredPin.length) {
        d.textContent = "•";
        d.classList.add("filled");
      } else {
        d.textContent = "";
        d.classList.remove("filled");
      }
    });

    // Real-time status badge feedback
    const badge = document.getElementById("pinStatusBadge");
    if (badge) {
      if (this.enteredPin.length === 0) {
        badge.textContent = "⌨️ Ingresa tus dígitos (Teclado táctil o físico)";
        badge.style.color = "#00f2fe";
      } else if (this.enteredPin.length < 5) {
        badge.textContent = `✍️ Tecleando código (${this.enteredPin.length}/6 dígitos)...`;
        badge.style.color = "#a855f7";
      } else if (this.enteredPin.length === 5) {
        const tenant = typeof demoRegistry !== 'undefined' ? demoRegistry[this.enteredPin] : null;
        if (tenant) {
          badge.textContent = "🔍 Detectando NIP de Demo Personalizada (5D)...";
          badge.style.color = "#10b981";
        } else {
          badge.textContent = "📜 Ingresa el 6º dígito para consultar Contrato Digital (6D)...";
          badge.style.color = "#00f2fe";
        }
      } else if (this.enteredPin.length === 6) {
        badge.textContent = "📜 Consultando Contrato Digital SaaS (6D)...";
        badge.style.color = "#00f2fe";
      }
    }

    if (this.enteredPin.length === 5) {
      const tenant = typeof demoRegistry !== 'undefined' ? demoRegistry[this.enteredPin] : null;
      if (tenant) {
        this.failedAttempts = 0;
        
        if (tenant.redirectUrl) {
          sessionStorage.setItem("BB_AUTH_NIP", this.enteredPin);
          sessionStorage.setItem("BB_AUTH_CLIENT", tenant.clientId || "");
          sessionStorage.setItem("BB_AUTH_TIMESTAMP", Date.now().toString());
          setTimeout(() => {
            window.location.href = tenant.redirectUrl;
          }, 300);
          return;
        }

        const welcomeTitle = document.querySelector(".welcome-title");
        const welcomeText = document.querySelector(".welcome-text");
        const hubSub = document.querySelector(".hub-sub");

        if (welcomeTitle) welcomeTitle.textContent = tenant.welcomeTitle;
        if (welcomeText) welcomeText.textContent = tenant.welcomeText;
        if (hubSub) hubSub.textContent = `brainbranding.com.mx/demos • CLIENTE: ${tenant.clientName.toUpperCase()}`;

        setTimeout(() => {
          document.getElementById("pinGateOverlay").style.display = "none";
          this.showWelcomeModal();
        }, 200);
      } else {
        // NIP de 5 dígitos no es una demo -> Dar tiempo para ingresar el 6º dígito del folio de contrato
        this.pinTimeout = setTimeout(() => {
          if (this.enteredPin.length === 5) {
            this.handleInvalidPin(this.enteredPin);
          }
        }, 2500);
      }
    } else if (this.enteredPin.length === 6) {
      this.verifyAndRedirectContract(this.enteredPin);
    }
  },

  verifyAndRedirectContract: function(code) {
    const cleanCode = String(code).trim();

    // 1. Verificar contratos locales en localStorage de forma instantánea
    let localContracts = [];
    try {
      const raw = localStorage.getItem('brain_branding_contracts');
      const backupRaw = localStorage.getItem('brain_branding_contracts_backup');
      if (raw) localContracts = JSON.parse(raw);
      if ((!localContracts || !localContracts.length) && backupRaw) localContracts = JSON.parse(backupRaw);
    } catch(e) {}

    const isLocalMatch = Array.isArray(localContracts) && localContracts.some(c => c && String(c.code).trim() === cleanCode);
    if (isLocalMatch) {
      this.failedAttempts = 0;
      window.location.href = `https://brainbranding.com.mx/?contrato=${cleanCode}`;
      return;
    }

    // 2. Consultar servidor central Render API
    const apiBase = window.API_BASE || 'https://brain-branding-demo-generator.onrender.com';
    fetch(`${apiBase}/api/contracts/${cleanCode}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.ok && data.contract) {
          this.failedAttempts = 0;
          window.location.href = `https://brainbranding.com.mx/?contrato=${cleanCode}`;
        } else {
          // Redirigir al visor principal de contratos para que app.js lo resuelva o muestre detalle
          window.location.href = `https://brainbranding.com.mx/?contrato=${cleanCode}`;
        }
      })
      .catch(() => {
        // En caso de falla de red o tiempo de espera, redirigir directamente al visor
        window.location.href = `https://brainbranding.com.mx/?contrato=${cleanCode}`;
      });
  },

  handleInvalidPin: function(code) {
    this.enteredPin = "";
    this.updatePinDisplay();
    const badge = document.getElementById("pinStatusBadge");
    if (badge) {
      badge.textContent = "⚠️ Código No Encontrado. Revisa tu NIP de 5 dígitos o Folio de 6 dígitos.";
      badge.style.color = "#ef4444";
    } else {
      alert("⚠️ Código No Encontrado. Revisa el NIP de 5 dígitos o el Folio de 6 dígitos proporcionado por tu ejecutivo.");
    }
  },

  showLockScreen: function() {
    // Función deshabilitada para evitar bloqueos
  },

  showWelcomeModal: function() {
    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.classList.add("active");
  },

  closeWelcomeModal: function() {
    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.classList.remove("active");
  },

  startGuidedTour: function() {
    this.closeWelcomeModal();
    TourGuide.start();
  },

  switchRole: function(role) {
    this.currentRole = role;
    document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.role-btn[data-role="${role}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    const mainNav = document.getElementById("mainNavWrapper");
    const mobileNav = document.querySelector(".mobile-nav");
    const clientView = document.getElementById("clientPortalSection");
    const adminView = document.getElementById("adminPortalSection");

    if (role === "client") {
      // MODO CLIENTE: Ocultar 100% BackOffice, menú superior y navegación móvil del Administrador
      if (mainNav) mainNav.style.display = "none";
      if (mobileNav) mobileNav.style.display = "none";
      if (adminView) {
        adminView.style.display = "none";
        adminView.classList.remove("active");
      }
      if (clientView) {
        clientView.style.display = "block";
        clientView.classList.add("active");
      }
    } else {
      // MODO ADMINISTRACIÓN: Mostrar BackOffice completo y herramientas de Pedro
      if (mainNav) mainNav.style.display = "block";
      if (mobileNav) mobileNav.style.display = "flex";
      if (clientView) {
        clientView.style.display = "none";
        clientView.classList.remove("active");
      }
      if (adminView) {
        adminView.style.display = "block";
        adminView.classList.add("active");
      }
    }
  },

  switchTab: function(tabName) {
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add("active");

    document.querySelectorAll("#adminPortalSection .section-panel").forEach(p => p.classList.remove("active"));
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) targetPanel.classList.add("active");

    document.querySelectorAll(".mobile-nav-item").forEach(m => m.classList.remove("active"));
    const mobItem = document.querySelector(`.mobile-nav-item[data-tab="${tabName}"]`);
    if (mobItem) mobItem.classList.add("active");
  },

  switchClientTab: function(subTab) {
    document.querySelectorAll(".client-sub-tab").forEach(t => t.style.display = "none");
    const target = document.getElementById(`clientTab-${subTab}`);
    if (target) target.style.display = "block";

    // Actualizar clase activa en pestañas del portal de clientes
    document.querySelectorAll(".client-nav-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`.client-nav-btn[data-client-tab="${subTab}"]`);
    if (activeBtn) activeBtn.classList.add("active");
  },

  filterClientSector: function(sector) {
    this.activeSector = sector;

    document.querySelectorAll(".sector-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`.sector-btn[data-sector="${sector}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    this.renderCatalog();
  },

  simulateClientSupport: function() {
    const input = document.getElementById("clientSupportInput");
    if (!input || !input.value.trim()) return;
    alert(`💬 Chatbot Ejecutivo de Ventas & Licitaciones:\n\nHemos recibido tu consulta comercial: "${input.value}"\n\nRespuesta IA: Contamos con catálogo certificado para Hogar, Empresa y Gobierno. Un ejecutivo comercial se comunicará contigo de inmediato.`);
    input.value = "";
  },

  renderAll: function() {
    this.renderCatalog();
    this.renderInventories();
    this.renderPipeline();
    this.renderPersonnel();
    this.renderFinances();
  },

  renderCatalog: function() {
    const container = document.getElementById("catalogGrid");
    if (!container) return;

    let filteredLamps = initialData.lamps;
    if (this.activeSector === "hogar") {
      filteredLamps = initialData.lamps.filter(l => l.targetSector.includes("Hogar"));
    } else if (this.activeSector === "empresa") {
      filteredLamps = initialData.lamps.filter(l => l.targetSector.includes("Empresa"));
    } else if (this.activeSector === "gobierno") {
      filteredLamps = initialData.lamps.filter(l => l.targetSector.includes("Gobierno"));
    }

    container.innerHTML = filteredLamps.map(lamp => `
      <div class="glass-panel product-card">
        <div class="product-img-wrapper">
          <img src="${lamp.img}" alt="${lamp.name}" class="product-img" onerror="this.src='https://via.placeholder.com/400x300/12182b/00f2fe?text=L%C3%A1mpara+LED'">
          <span class="product-badge">${lamp.category}</span>
        </div>
        <div class="product-body">
          <div>
            <h3 class="product-name">${lamp.name}</h3>
            <p class="product-specs">${lamp.specs}</p>
            <span class="badge badge-warning" style="margin-bottom:8px;">🎯 Sector: ${lamp.targetSector}</span>
            <span class="badge badge-info" style="margin-bottom:8px; display:block;">⚡ Potencia: ${lamp.power}</span>
          </div>
          <div class="product-price-row">
            <div>
              <span style="font-size:10px; color:var(--text-muted); display:block;">PRECIO COTIZACION</span>
              <span class="product-price">$${lamp.price.toLocaleString()} MXN</span>
            </div>
            <button onclick="App.openPreOrderModal('${lamp.id}')" class="btn-secondary" style="font-size:11px;">
              🛍️ Cotizar / Pedir
            </button>
          </div>
        </div>
      </div>
    `).join("");

    const predictorSelect = document.getElementById("predictLampSelect");
    if (predictorSelect) {
      predictorSelect.innerHTML = initialData.lamps.map(l => `
        <option value="${l.id}">${l.name} (${l.power})</option>
      `).join("");
    }
  },

  renderInventories: function() {
    const insumosContainer = document.getElementById("tblInsumos");
    if (insumosContainer) {
      insumosContainer.innerHTML = initialData.inventories.insumos.map(i => `
        <tr>
          <td><strong>${i.id}</strong></td>
          <td>${i.name}</td>
          <td><span class="badge badge-info">${i.category}</span></td>
          <td><strong>${i.stock}</strong> ${i.unit}</td>
          <td>
            ${i.alert 
              ? `<span class="badge badge-danger">⚠️ Stock Bajo (<${i.minStock})</span>`
              : `<span class="badge badge-success">OK (>${i.minStock})</span>`
            }
          </td>
          <td>
            <button onclick="App.adjustStock('insumos', '${i.id}', 50)" class="btn-secondary" style="padding:2px 8px; font-size:11px;">+50 Reabastecer</button>
          </td>
        </tr>
      `).join("");
    }

    const componentesContainer = document.getElementById("tblComponentes");
    if (componentesContainer) {
      componentesContainer.innerHTML = initialData.inventories.componentes.map(c => `
        <tr>
          <td><strong>${c.id}</strong></td>
          <td>${c.name}</td>
          <td><span class="badge badge-info">${c.category}</span></td>
          <td><strong>${c.stock}</strong> ${c.unit}</td>
          <td>
            ${c.alert 
              ? `<span class="badge badge-danger">⚠️ Alerta Desabasto (<${c.minStock})</span>`
              : `<span class="badge badge-success">Suficiente</span>`
            }
          </td>
          <td>
            <button onclick="App.adjustStock('componentes', '${c.id}', 100)" class="btn-secondary" style="padding:2px 8px; font-size:11px;">+100 Pedir</button>
          </td>
        </tr>
      `).join("");
    }

    const compradosContainer = document.getElementById("tblComprados");
    if (compradosContainer) {
      compradosContainer.innerHTML = initialData.inventories.comprados.map(p => `
        <tr>
          <td><strong>${p.id}</strong></td>
          <td>${p.name}</td>
          <td>$${p.cost} MXN</td>
          <td>$${p.price} MXN</td>
          <td><strong>${p.stock}</strong> uds</td>
          <td><span class="badge badge-success">Listo para Entrega</span></td>
        </tr>
      `).join("");
    }

    const fabricadosContainer = document.getElementById("tblFabricados");
    if (fabricadosContainer) {
      fabricadosContainer.innerHTML = initialData.inventories.fabricados.map(f => `
        <tr>
          <td><strong>${f.id}</strong></td>
          <td>${f.name}</td>
          <td><strong>${f.stock}</strong> unidades</td>
          <td>📍 ${f.location}</td>
          <td><span class="badge badge-info">Terminado 100%</span></td>
        </tr>
      `).join("");
    }
  },

  adjustStock: function(type, id, qty) {
    const item = initialData.inventories[type].find(x => x.id === id);
    if (item) {
      item.stock += qty;
      if (item.stock >= (item.minStock || 0)) item.alert = false;
      this.renderInventories();
      alert(`✅ Se han sumado ${qty} a [${item.name}]. Nuevo stock: ${item.stock}`);
    }
  },

  renderPipeline: function() {
    const container = document.getElementById("pipelineContainer");
    if (!container) return;

    container.innerHTML = initialData.stages.map(stage => {
      const batchesInStage = initialData.productionBatches.filter(b => b.stage === stage);
      return `
        <div class="pipeline-stage">
          <div class="stage-header">
            <span class="stage-name">${stage}</span>
            <span class="stage-count">${batchesInStage.length} Lotes</span>
          </div>
          ${batchesInStage.map(batch => `
            <div class="batch-card">
              <div class="batch-id">${batch.id} • ${batch.qty} uds</div>
              <div style="font-weight:600; color:#fff; font-size:12px; margin-bottom:2px;">${batch.lampName}</div>
              <div class="batch-details">Operario: ${batch.operator}</div>
              <button onclick="App.advanceBatchStage('${batch.id}')" class="btn-mini">
                ⏩ Avanzar Etapa (-Insumos)
              </button>
            </div>
          `).join("")}
          ${batchesInStage.length === 0 ? '<div style="font-size:11px; color:var(--text-dim); text-align:center; padding:12px;">Sin Lotes</div>' : ''}
        </div>
      `;
    }).join("");
  },

  advanceBatchStage: function(batchId) {
    const batch = initialData.productionBatches.find(b => b.id === batchId);
    if (!batch) return;

    const currentIdx = initialData.stages.indexOf(batch.stage);
    if (currentIdx < initialData.stages.length - 1) {
      batch.stage = initialData.stages[currentIdx + 1];
      
      const comp1 = initialData.inventories.componentes[0];
      if (comp1 && comp1.stock >= 50) comp1.stock -= 50;

      this.renderPipeline();
      this.renderInventories();
      alert(`⏩ Lote [${batch.id}] avanzado a la etapa: "${batch.stage}". Se han descontado componentes automáticamente de los almacenes.`);
    } else {
      alert(`🎉 El Lote [${batch.id}] ha completado todas las etapas de fabricación y pasa al Almacén de Lámparas Fabricadas.`);
    }
  },

  renderPersonnel: function() {
    const container = document.getElementById("tblPersonnel");
    if (!container) return;

    container.innerHTML = initialData.personnel.map(p => `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td><strong>${p.name}</strong><br><span style="font-size:11px; color:var(--text-muted);">${p.role}</span></td>
        <td>${p.shift}</td>
        <td>📍 ${p.station}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex:1; background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
              <div style="width:${p.productivity}%; background:var(--accent-emerald); height:100%;"></div>
            </div>
            <strong style="font-size:12px; color:var(--accent-emerald);">${p.productivity}%</strong>
          </div>
        </td>
        <td><span class="badge badge-success">Activo</span></td>
      </tr>
    `).join("");
  },

  renderFinances: function() {
    this.runROICalculator();
  },

  runPredictor: function() {
    const lampId = document.getElementById("predictLampSelect").value;
    const qty = document.getElementById("predictQtyInput").value;
    const resultContainer = document.getElementById("predictResultBox");

    const res = AIEngine.predictDeliveryTime(lampId, qty);

    resultContainer.innerHTML = `
      <div style="background:rgba(0, 242, 254, 0.08); border:1px solid var(--accent-cyan); border-radius:var(--radius-md); padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="color:var(--accent-cyan);">🤖 Predicción IA de Fabricación</h4>
          <span class="badge badge-success">Confianza: ${res.confidence}%</span>
        </div>
        <p style="font-size:14px; margin-bottom:8px;">
          Para fabricar <strong>${res.quantity} unidades</strong> de <em>${res.lampName}</em>:
        </p>
        <div style="font-size:24px; font-weight:800; color:#fff; margin-bottom:12px;">
          ⏱️ Tiempo Estimado: <span style="color:var(--accent-emerald);">${res.timeString}</span>
        </div>
        ${res.bottlenecks.length > 0 ? `
          <div style="background:rgba(255,65,108,0.15); border-left:3px solid var(--accent-rose); padding:8px 12px; margin-bottom:12px; font-size:12px;">
            ${res.bottlenecks.join("<br>")}
          </div>
        ` : ''}
        <div style="font-size:12px; color:var(--text-muted); border-top:1px dashed var(--border-glass); padding-top:8px;">
          ${res.recommendation}
        </div>
      </div>
    `;
  },

  runROICalculator: function() {
    const slider = document.getElementById("roiLampsInput");
    if (!slider) return;
    const qty = slider.value;
    document.getElementById("roiLampsVal").textContent = qty;

    const res = AIEngine.calculateROI(qty);
    document.getElementById("roiHoursSaved").textContent = `${res.paperHoursWasted} hrs`;
    document.getElementById("roiMoneySaved").textContent = `$${res.monthlySavings} MXN`;
    document.getElementById("roiYearlySaved").textContent = `$${res.yearlySavings} MXN`;
  },

  simulateQRScan: function() {
    const output = document.getElementById("qrScanResult");
    output.innerHTML = `<span style="color:var(--accent-cyan);">⏳ Escaneando código de barras de lote...</span>`;

    setTimeout(() => {
      output.innerHTML = `
        <div style="background:rgba(0,242,96,0.15); border:1px solid var(--accent-emerald); padding:12px; border-radius:8px;">
          <h4 style="color:var(--accent-emerald);">✅ Escaneo Exitoso</h4>
          <p style="font-size:12px;">Lote Detectado: <strong>LOTE-8842 (20x Candelabro Titanium)</strong></p>
          <p style="font-size:12px;">Acción: Registrado control de calidad QC por celular sin papel.</p>
        </div>
      `;
    }, 1500);
  },

  openPreOrderModal: function(lampId) {
    const lamp = initialData.lamps.find(l => l.id === lampId);
    if (!lamp) return;

    const qty = prompt(`🛍️ Cotización / Pedido Profesional (${lamp.targetSector})\n\nProducto: ${lamp.name}\nIngresa la cantidad de unidades deseadas:`, "25");
    if (qty) {
      const pred = AIEngine.predictDeliveryTime(lampId, qty);
      alert(`🎉 Cotización Profesional Generada para Pedro!\n\nProducto: ${lamp.name}\nSector Target: ${lamp.targetSector}\nCantidad: ${qty} unidades\nTiempo Estimado de Fabricación por IA: ${pred.timeString}\n\nEstatus: Registrado en el sistema comercial.`);
    }
  }
};

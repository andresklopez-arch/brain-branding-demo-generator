/* ==========================================================================
   LÓGICA PRINCIPAL DE LA APLICACIÓN - DEMO PEDRO (BRAIN BRANDING)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  currentRole: "admin", // "admin" or "client"
  enteredPin: "",

  init: function() {
    this.bindEvents();
    this.renderAll();
    this.checkSession();
  },

  checkSession: function() {
    const savedPin = localStorage.getItem("pedro_demo_authenticated");
    if (savedPin === "true") {
      const pinGate = document.getElementById("pinGateOverlay");
      if (pinGate) pinGate.style.display = "none";
      this.showWelcomeModal();
    }
  },

  bindEvents: function() {
    // PIN Keypad buttons
    document.querySelectorAll(".key-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const val = e.target.dataset.key;
        if (val === "del") {
          this.enteredPin = this.enteredPin.slice(0, -1);
        } else if (val === "clear") {
          this.enteredPin = "";
        } else if (this.enteredPin.length < 4) {
          this.enteredPin += val;
        }
        this.updatePinDisplay();
      });
    });

    // Role Switcher Buttons
    document.querySelectorAll(".role-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const role = e.currentTarget.dataset.role;
        this.switchRole(role);
      });
    });
  },

  updatePinDisplay: function() {
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

    if (this.enteredPin.length === 4) {
      if (this.enteredPin === initialData.passcode) {
        localStorage.setItem("pedro_demo_authenticated", "true");
        setTimeout(() => {
          document.getElementById("pinGateOverlay").style.display = "none";
          this.showWelcomeModal();
        }, 300);
      } else {
        alert("⚠️ PIN Incorrecto. Utiliza el PIN de demo: " + initialData.passcode);
        this.enteredPin = "";
        this.updatePinDisplay();
      }
    }
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

    const adminNav = document.getElementById("adminNavTabs");
    const clientView = document.getElementById("clientPortalSection");
    const adminView = document.getElementById("adminPortalSection");

    if (role === "client") {
      if (adminNav) adminNav.style.display = "none";
      if (clientView) clientView.classList.add("active");
      if (adminView) adminView.classList.remove("active");
    } else {
      if (adminNav) adminNav.style.display = "flex";
      if (clientView) clientView.classList.remove("active");
      if (adminView) adminView.classList.add("active");
    }
  },

  switchTab: function(tabName) {
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add("active");

    document.querySelectorAll(".section-panel").forEach(p => p.classList.remove("active"));
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) targetPanel.classList.add("active");

    // Sync mobile bottom nav
    document.querySelectorAll(".mobile-nav-item").forEach(m => m.classList.remove("active"));
    const mobItem = document.querySelector(`.mobile-nav-item[data-tab="${tabName}"]`);
    if (mobItem) mobItem.classList.add("active");
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

    container.innerHTML = initialData.lamps.map(lamp => `
      <div class="glass-panel product-card">
        <div class="product-img-wrapper">
          <img src="${lamp.img}" alt="${lamp.name}" class="product-img" onerror="this.src='https://via.placeholder.com/400x300/12182b/00f2fe?text=L%C3%A1mpara+LED'">
          <span class="product-badge">${lamp.category}</span>
        </div>
        <div class="product-body">
          <div>
            <h3 class="product-name">${lamp.name}</h3>
            <p class="product-specs">${lamp.specs}</p>
            <span class="badge badge-info" style="margin-bottom:8px;">⚡ Capacidad: ${lamp.power}</span>
          </div>
          <div class="product-price-row">
            <div>
              <span style="font-size:10px; color:var(--text-muted); display:block;">PRECIO AL PUBLICO</span>
              <span class="product-price">$${lamp.price.toLocaleString()} MXN</span>
            </div>
            <button onclick="App.openPreOrderModal('${lamp.id}')" class="btn-secondary" style="font-size:11px;">
              🛍️ Pre-Pedir
            </button>
          </div>
        </div>
      </div>
    `).join("");

    // Populate Select in AI Predictor Form
    const predictorSelect = document.getElementById("predictLampSelect");
    if (predictorSelect) {
      predictorSelect.innerHTML = initialData.lamps.map(l => `
        <option value="${l.id}">${l.name} (${l.power})</option>
      `).join("");
    }
  },

  renderInventories: function() {
    // 1. Insumos (Materia Prima)
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

    // 2. Componentes
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

    // 3. Productos Comprados para Venta Directa
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

    // 4. Lámparas Fabricadas
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
      
      // Auto-descontar componentes del inventario para simular consumo real
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
    // Render ROI Calculator dynamic text
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

    const qty = prompt(`🛍️ Pre-Pedido de ${lamp.name}\n\nIngresa la cantidad de lámparas que deseas cotizar:`, "25");
    if (qty) {
      const pred = AIEngine.predictDeliveryTime(lampId, qty);
      alert(`🎉 Pre-Pedido Generado Exitosamente para Pedro!\n\nProducto: ${lamp.name}\nCantidad: ${qty} unidades\nTiempo Estimado de Entrega por IA: ${pred.timeString}\n\nEstatus: Enviado al administrador.`);
    }
  }
};

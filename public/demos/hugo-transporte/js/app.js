/* ==========================================================================
   TRANSPORTE INTELIGENTE HUGO - CORE APP & UI LOGIC
   Brain Branding AI Platform
   ========================================================================== */

const App = {
  state: {
    currentRole: "driver", // "driver" | "admin"
    activeTab: "driver-terminal",
    selectedRouteId: "R-01",
    totalRevenue: 13716.00,
    totalTickets: 644,
    tickets: [...HugoTransportData.recentTickets],
    lastIssuedTicket: null,
    audioCtx: null,
    roiUnits: 5,
    roiDailyTicketsPerUnit: 250
  },

  init() {
    console.log("🚀 [Transporte Hugo App] Iniciando aplicación...");
    this.initAudioContext();
    this.renderRouteSelector();
    this.renderFareButtons();
    this.renderRecentTickets();
    this.renderFleetTable();
    this.renderDriversTable();
    this.renderAIInsights();
    this.initCharts();
    this.calculateROI();
    AIEngine.init();
    AIEngine.initVoiceEngine();
    
    // Iniciar SIEMPRE el tour inmersivo obligatorio de ventas para Hugo
    setTimeout(() => {
      TourGuide.start();
    }, 450);
  },

  // Modal de Pantalla Espejo para Pasajeros
  openPassengerScreenModal() {
    const modal = document.getElementById("passengerScreenModal");
    if (modal) modal.classList.add("active");
  },

  closePassengerScreenModal() {
    const modal = document.getElementById("passengerScreenModal");
    if (modal) modal.classList.remove("active");
  },

  // Modal Biométrico del Chofer
  openBiometricModal() {
    const modal = document.getElementById("biometricModal");
    if (modal) modal.classList.add("active");
  },

  closeBiometricModal() {
    const modal = document.getElementById("biometricModal");
    if (modal) modal.classList.remove("active");
  },

  // Inicializar Web Audio API para sonidos hiperrealistas de caja y ticket térmico
  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.state.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio no disponible:", e);
    }
  },

  playBeep(freq = 750, duration = 0.1) {
    if (!this.state.audioCtx) return;
    try {
      if (this.state.audioCtx.state === "suspended") {
        this.state.audioCtx.resume();
      }
      const osc = this.state.audioCtx.createOscillator();
      const gain = this.state.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.state.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.state.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.state.audioCtx.destination);
      osc.start();
      osc.stop(this.state.audioCtx.currentTime + duration);
    } catch (e) { }
  },

  playThermalPrintSound() {
    if (!this.state.audioCtx) return;
    try {
      if (this.state.audioCtx.state === "suspended") {
        this.state.audioCtx.resume();
      }
      const now = this.state.audioCtx.currentTime;
      // Secuencia de chasquidos mecánicos de cabezal térmico
      for (let i = 0; i < 6; i++) {
        const osc = this.state.audioCtx.createOscillator();
        const gain = this.state.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120 + i * 40, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.05);
        osc.connect(gain);
        gain.connect(this.state.audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.06);
      }
    } catch (e) { }
  },

  // Comprobar si se debe mostrar la bienvenida personalizada a Hugo
  checkWelcomeParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const nip = urlParams.get("nip");
    // Mostrar siempre el modal de bienvenida a Hugo al abrir la app si no se ha cerrado en esta sesión
    if (!sessionStorage.getItem("hugo_welcome_seen") || nip === "59381") {
      this.openWelcomeModal();
    }
  },

  openWelcomeModal() {
    const modal = document.getElementById("welcomeModal");
    if (modal) modal.classList.add("active");
  },

  closeWelcomeModal() {
    const modal = document.getElementById("welcomeModal");
    if (modal) modal.classList.remove("active");
    sessionStorage.setItem("hugo_welcome_seen", "true");
  },

  // Cambio de Rol (Modo Chofer en Ruta vs Modo Administración Central)
  switchRole(role) {
    this.state.currentRole = role;
    document.querySelectorAll(".role-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.role === role);
    });

    const driverSection = document.getElementById("driverModeSection");
    const adminSection = document.getElementById("adminModeSection");
    const navTabs = document.getElementById("mainNavTabs");

    if (role === "driver") {
      if (driverSection) driverSection.style.display = "block";
      if (adminSection) adminSection.style.display = "none";
      if (navTabs) navTabs.style.display = "none";
      this.showToast("⚡ Modo Chofer en Ruta Activado (Emisión Rápida & Impresora Térmica)");
    } else {
      if (driverSection) driverSection.style.display = "none";
      if (adminSection) adminSection.style.display = "block";
      if (navTabs) navTabs.style.display = "flex";
      this.switchTab("dashboard");
      this.showToast("🏢 Modo Administración Central & Analítica Activado");
    }
  },

  // Cambio de Pestañas en Modo Admin
  switchTab(tabId) {
    this.state.activeTab = tabId;
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabId);
    });

    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `tab-${tabId}`);
    });

    if (tabId === "reports" && window.revenueChart) {
      setTimeout(() => {
        window.revenueChart.resize();
        window.densityChart.resize();
      }, 100);
    }
  },

  // Renderizar Selector de Rutas
  renderRouteSelector() {
    const selector = document.getElementById("routeSelector");
    if (!selector) return;

    selector.innerHTML = HugoTransportData.routes.map(r => `
      <option value="${r.id}" ${r.id === this.state.selectedRouteId ? "selected" : ""}>
        ${r.name} (${r.code}) • Tarifa Base: $${r.baseFare.toFixed(2)}
      </option>
    `).join("");

    selector.addEventListener("change", (e) => {
      this.state.selectedRouteId = e.target.value;
      this.renderFareButtons();
      this.showToast(`Ruta actualizada a: ${selector.options[selector.selectedIndex].text}`);
    });
  },

  // Renderizar Botones Táctiles de Tarifas para el Chofer
  renderFareButtons() {
    const container = document.getElementById("fareButtonsGrid");
    if (!container) return;

    const currentRoute = HugoTransportData.routes.find(r => r.id === this.state.selectedRouteId) || HugoTransportData.routes[0];

    container.innerHTML = currentRoute.fares.map(fare => `
      <button class="fare-btn" onclick="App.issueTicket('${fare.id}', 'Manual 1-Tap')">
        <div class="fare-icon">${fare.icon}</div>
        <div class="fare-info">
          <div class="fare-label">${fare.label}</div>
          <div class="fare-badge">${fare.badge}</div>
        </div>
        <div class="fare-price">$${fare.price.toFixed(2)}</div>
      </button>
    `).join("");
  },

  // Emitir Boleto con Efecto Térmico y QR (Soporta Efectivo o NFC)
  issueTicket(fareId, triggerType = "Manual 1-Tap") {
    const currentRoute = HugoTransportData.routes.find(r => r.id === this.state.selectedRouteId) || HugoTransportData.routes[0];
    const fare = currentRoute.fares.find(f => f.id === fareId) || currentRoute.fares[0];
    this.issueTicketWithPayment(fare.price, "Efectivo", triggerType, null, fare.label);
  },

  issueTicketWithPayment(amount, paymentMethod = "Efectivo", triggerType = "Manual 1-Tap", nfcCard = null, fareLabel = "Tarifa Regular") {
    const currentRoute = HugoTransportData.routes.find(r => r.id === this.state.selectedRouteId) || HugoTransportData.routes[0];
    const folioNumber = 89211 + this.state.tickets.length;
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const dateStr = now.toISOString().split("T")[0];

    const newTicket = {
      folio: `TCK-${folioNumber}`,
      time: timeStr,
      date: dateStr,
      route: currentRoute.name,
      fareType: nfcCard ? `NFC (${nfcCard.type})` : fareLabel,
      amount: amount,
      payment: paymentMethod,
      unit: HugoTransportData.client.currentUnit.split(" (")[0],
      driver: HugoTransportData.client.currentDriver.split(" (")[0],
      trigger: triggerType,
      nfcCard: nfcCard,
      hash: "SEC-" + Math.random().toString(36).substring(2, 8).toUpperCase()
    };

    // Actualizar estados
    this.state.tickets.unshift(newTicket);
    this.state.totalTickets++;
    this.state.totalRevenue += amount;
    AIEngine.state.totalTicketsIssued++;
    this.state.lastIssuedTicket = newTicket;

    // Actualizar UI
    this.updateStatsUI();
    this.renderRecentTickets();
    AIEngine.updateDiscrepancyCheck();

    // Efectos de sonido y animación de impresión térmica
    this.playThermalPrintSound();
    this.showTicketThermalPreview(newTicket);
    this.showToast(`🎟️ Boleto #${newTicket.folio} expedido ($${newTicket.amount.toFixed(2)})`);
  },

  // Modal & Validador de Tarjetas NFC / QR
  openNfcModal() {
    this.renderNfcModal();
    const modal = document.getElementById("nfcModal");
    if (modal) modal.classList.add("active");
  },

  closeNfcModal() {
    const modal = document.getElementById("nfcModal");
    if (modal) modal.classList.remove("active");
  },

  renderNfcModal() {
    const container = document.getElementById("nfcCardsContainer");
    if (!container) return;

    container.innerHTML = HugoTransportData.nfcCards.map(c => `
      <div class="nfc-card-item" onclick="AIEngine.processNfcPayment('${c.id}')">
        <div class="nfc-avatar">${c.avatar}</div>
        <div class="nfc-info">
          <div class="nfc-passenger-name">${c.passenger}</div>
          <div class="nfc-type-tag">${c.type} • ID: ${c.id}</div>
          <div class="nfc-discount">${c.discountPct > 0 ? `🔥 ${c.discountPct}% de descuento aplicado` : 'Tarifa normal'}</div>
        </div>
        <div class="nfc-balance-box">
          <div class="nfc-balance-lbl">Saldo Disponible</div>
          <div class="nfc-balance-val">$${c.balance.toFixed(2)}</div>
          <button class="btn-nfc-tap">📱 Tap NFC</button>
        </div>
      </div>
    `).join("");
  },

  // Actualizar UI de Telemetría
  updateTelemetryUI() {
    const scoreEl = document.getElementById("telemetryDriverScore");
    const speedEl = document.getElementById("telemetrySpeed");
    const savingsEl = document.getElementById("telemetryFuelSavings");
    const harshEl = document.getElementById("telemetryHarshBraking");

    if (scoreEl) {
      scoreEl.innerText = `${HugoTransportData.telemetry.driverScore} / 100`;
      scoreEl.style.color = HugoTransportData.telemetry.driverScore >= 90 ? "#10b981" : (HugoTransportData.telemetry.driverScore >= 75 ? "#f59e0b" : "#ef4444");
    }
    if (speedEl) speedEl.innerText = `${HugoTransportData.telemetry.currentSpeedKmh} km/h`;
    if (savingsEl) savingsEl.innerText = `$${HugoTransportData.telemetry.fuelSavingsEstimateMxn.toLocaleString()} MXN`;
    if (harshEl) harshEl.innerText = `${HugoTransportData.telemetry.harshBrakingCount} eventos`;
  },

  // Mostrar Vista Previa del Ticket Térmico Fidedigno (Simulador ESC/POS)
  showTicketThermalPreview(t) {
    const receiptContainer = document.getElementById("thermalReceiptPreview");
    if (!receiptContainer) return;

    receiptContainer.innerHTML = `
      <div class="thermal-ticket-paper animate-print">
        <div class="ticket-header">
          <div class="ticket-logo">🚌 ${HugoTransportData.client.business}</div>
          <div class="ticket-sub">SERVICIO PÚBLICO DE PASAJEROS</div>
          <div class="ticket-sub">RFC: THU-240822-BB8 • FOLIO OFICIAL</div>
          <div class="ticket-divider">================================</div>
        </div>

        <div class="ticket-row">
          <span>FOLIO:</span>
          <strong>${t.folio}</strong>
        </div>
        <div class="ticket-row">
          <span>FECHA / HORA:</span>
          <span>${t.date || "2026-08-22"} ${t.time}</span>
        </div>
        <div class="ticket-row">
          <span>UNIDAD:</span>
          <span>${t.unit}</span>
        </div>
        <div class="ticket-row">
          <span>CHOFER:</span>
          <span>${t.driver}</span>
        </div>
        <div class="ticket-row">
          <span>RUTA:</span>
          <span style="max-width:140px; text-align:right; font-size:10px;">${t.route}</span>
        </div>

        <div class="ticket-divider">--------------------------------</div>
        
        <div class="ticket-row" style="font-size: 13px; font-weight: bold;">
          <span>TIPO BOLETO:</span>
          <span>${t.fareType}</span>
        </div>
        <div class="ticket-row" style="font-size: 15px; font-weight: 800; color:#000;">
          <span>TOTAL PAGADO:</span>
          <span>$${t.amount.toFixed(2)} MXN</span>
        </div>
        <div class="ticket-row">
          <span>MÉTODO:</span>
          <span>${t.payment} (${t.trigger})</span>
        </div>

        <div class="ticket-divider">================================</div>

        <div class="ticket-qr-section">
          <!-- QR Code Vectorial Dinámico -->
          <div class="ticket-qr-code">
            <svg viewBox="0 0 100 100" width="90" height="90">
              <rect width="100" height="100" fill="#ffffff" />
              <!-- Marcadores QR -->
              <rect x="5" y="5" width="25" height="25" fill="#000000" />
              <rect x="8" y="8" width="19" height="19" fill="#ffffff" />
              <rect x="11" y="11" width="13" height="13" fill="#000000" />
              <rect x="70" y="5" width="25" height="25" fill="#000000" />
              <rect x="73" y="8" width="19" height="19" fill="#ffffff" />
              <rect x="76" y="11" width="13" height="13" fill="#000000" />
              <rect x="5" y="70" width="25" height="25" fill="#000000" />
              <rect x="8" y="73" width="19" height="19" fill="#ffffff" />
              <rect x="11" y="76" width="13" height="13" fill="#000000" />
              <!-- Puntos de datos -->
              <rect x="36" y="10" width="8" height="8" fill="#000" />
              <rect x="48" y="10" width="8" height="8" fill="#000" />
              <rect x="36" y="24" width="8" height="8" fill="#000" />
              <rect x="10" y="36" width="8" height="8" fill="#000" />
              <rect x="24" y="44" width="8" height="8" fill="#000" />
              <rect x="40" y="40" width="20" height="20" fill="#000" />
              <rect x="70" y="40" width="8" height="8" fill="#000" />
              <rect x="84" y="40" width="8" height="8" fill="#000" />
              <rect x="36" y="70" width="8" height="8" fill="#000" />
              <rect x="48" y="80" width="12" height="12" fill="#000" />
              <rect x="70" y="70" width="18" height="18" fill="#000" />
            </svg>
          </div>
          <div class="ticket-security-code">${t.hash} • SEGURO DE VIAJERO INCLUIDO</div>
          <div class="ticket-footer-msg">¡Gracias por viajar con nosotros!<br>Conserve su boleto para cualquier aclaración.</div>
        </div>
      </div>
    `;
  },

  // Imprimir físicamente en impresora térmica conectada
  printThermalDirect() {
    if (!this.state.lastIssuedTicket) {
      this.showToast("Emita un boleto primero para imprimir.", "warning");
      return;
    }
    window.print();
  },

  // Renderizar Lista de Boletos Recientes
  renderRecentTickets() {
    const list = document.getElementById("recentTicketsList");
    if (!list) return;

    list.innerHTML = this.state.tickets.slice(0, 8).map(t => `
      <div class="ticket-item">
        <div class="ticket-item-left">
          <div class="ticket-item-folio">${t.folio}</div>
          <div class="ticket-item-sub">${t.time} • ${t.fareType}</div>
          <div class="ticket-item-trigger"><span class="badge-dot"></span>${t.trigger}</div>
        </div>
        <div class="ticket-item-right">
          <div class="ticket-item-amount">$${t.amount.toFixed(2)}</div>
          <button class="btn-reprint" onclick="App.reprintTicket('${t.folio}')">🖨️ Re-imprimir</button>
        </div>
      </div>
    `).join("");
  },

  reprintTicket(folio) {
    const t = this.state.tickets.find(item => item.folio === folio);
    if (t) {
      this.playThermalPrintSound();
      this.showTicketThermalPreview(t);
      this.showToast(`Re-imprimiendo copia de boleto #${folio}...`);
    }
  },

  // Actualizar Contadores Generales en la UI
  updateStatsUI() {
    const revEl = document.getElementById("statTotalRevenue");
    const tckEl = document.getElementById("statTotalTickets");
    const shiftRevEl = document.getElementById("statShiftRevenue");
    const shiftTckEl = document.getElementById("statShiftTickets");

    if (revEl) revEl.innerText = `$${this.state.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
    if (tckEl) tckEl.innerText = this.state.totalTickets.toLocaleString();
    if (shiftRevEl) shiftRevEl.innerText = `$${(this.state.tickets.reduce((acc, cur) => acc + cur.amount, 0) + 2646).toFixed(2)}`;
    if (shiftTckEl) shiftTckEl.innerText = this.state.tickets.length + 189;
  },

  // Renderizar Tabla de Flotilla (Modo Admin)
  renderFleetTable() {
    const container = document.getElementById("fleetTableBody");
    if (!container) return;

    container.innerHTML = HugoTransportData.fleet.map(u => `
      <tr>
        <td><strong>${u.name}</strong><div style="font-size:10.5px; opacity:0.75;">${u.model} • ${u.plates}</div></td>
        <td><span class="badge ${u.status.includes('Activo') ? 'badge-success' : (u.status.includes('Taller') ? 'badge-warning' : 'badge-primary')}">${u.status}</span></td>
        <td>${u.route}</td>
        <td>${u.driver}</td>
        <td><strong>${u.passengersToday}</strong> pax</td>
        <td><strong style="color:#00f2fe;">$${u.revenueToday.toLocaleString()}</strong></td>
        <td>${u.fuelEfficiency}</td>
        <td>
          <button class="btn-table-action" onclick="App.inspectUnit('${u.id}')">📡 Telemetría</button>
        </td>
      </tr>
    `).join("");
  },

  // Renderizar Tabla de Choferes
  renderDriversTable() {
    const container = document.getElementById("driversTableBody");
    if (!container) return;

    container.innerHTML = HugoTransportData.drivers.map(d => `
      <tr>
        <td><strong>${d.name}</strong><div style="font-size:10.5px; opacity:0.75;">ID: ${d.id} • ${d.license}</div></td>
        <td>${d.unit}</td>
        <td><span style="color:#10b981; font-weight:700;">★ ${d.score} / 10</span></td>
        <td>${d.ticketsIssued} boletos</td>
        <td><strong>$${d.cashCollected.toLocaleString()} MXN</strong></td>
        <td>${d.anomalies === 0 ? '<span class="badge badge-success">0 Fugas (100% Cobro)</span>' : '<span class="badge badge-danger">1 Alerta</span>'}</td>
        <td>
          <button class="btn-table-action" onclick="App.showCashierCutModal('${d.id}')">💵 Liquidar Turno</button>
        </td>
      </tr>
    `).join("");
  },

  // Renderizar Recomendaciones de IA
  renderAIInsights() {
    const container = document.getElementById("aiInsightsContainer");
    if (!container) return;

    const insights = AIEngine.getBusinessInsights();
    container.innerHTML = insights.map(item => `
      <div class="insight-card ${item.type}">
        <div class="insight-header">
          <span class="insight-badge">${item.badge}</span>
          <span class="insight-icon">${item.icon}</span>
        </div>
        <h4 class="insight-title">${item.title}</h4>
        <p class="insight-desc">${item.desc}</p>
        <button class="btn-insight" onclick="App.showToast('Acción ejecutada: ${item.action}')">${item.action} ➔</button>
      </div>
    `).join("");
  },

  // Inicializar Gráficas con Chart.js
  initCharts() {
    if (typeof Chart === "undefined") return;

    // 1. Gráfica de Ingresos por Ruta
    const ctxRevenue = document.getElementById("revenueChartCanvas");
    if (ctxRevenue) {
      window.revenueChart = new Chart(ctxRevenue, {
        type: "bar",
        data: {
          labels: ["Ruta 01 Centro", "Ruta 02 Industrial", "Ruta 03 Exprés", "Ruta 04 Intermun."],
          datasets: [{
            label: "Ingresos Hoy (MXN)",
            data: [2646, 2480, 3430, 5160],
            backgroundColor: ["#00f2fe", "#7928ca", "#10b981", "#f59e0b"],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
          }
        }
      });
    }

    // 2. Gráfica de Afluencia de Pasajeros por Hora (IA Predictive Demand)
    const ctxDensity = document.getElementById("densityChartCanvas");
    if (ctxDensity) {
      window.densityChart = new Chart(ctxDensity, {
        type: "line",
        data: {
          labels: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00 (Previsto)", "15:00 (Previsto)"],
          datasets: [
            {
              label: "Pasajeros Reales Cobrados",
              data: [85, 142, 198, 120, 95, 78, 110, 160, null, null],
              borderColor: "#00f2fe",
              backgroundColor: "rgba(0, 242, 254, 0.15)",
              fill: true,
              tension: 0.4
            },
            {
              label: "Proyección IA de Demanda",
              data: [null, null, null, null, null, null, null, 160, 210, 185],
              borderColor: "#7928ca",
              borderDash: [6, 6],
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: "#94a3b8" } } },
          scales: {
            x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
          }
        }
      });
    }
  },

  // Calculadora Dinámica de Retorno de Inversión (ROI) para Hugo
  calculateROI() {
    const unitsInput = document.getElementById("roiUnitsSlider");
    const ticketsInput = document.getElementById("roiTicketsSlider");

    const units = unitsInput ? parseInt(unitsInput.value) : this.state.roiUnits;
    const ticketsPerDay = ticketsInput ? parseInt(ticketsInput.value) : this.state.roiDailyTicketsPerUnit;

    const lblUnits = document.getElementById("lblRoiUnits");
    const lblTickets = document.getElementById("lblRoiTickets");
    if (lblUnits) lblUnits.innerText = `${units} Unidades`;
    if (lblTickets) lblTickets.innerText = `${ticketsPerDay} Boletos/día por unidad`;

    // Cálculos mensuales
    const totalMonthlyTickets = units * ticketsPerDay * 30;
    const paperCostMonthly = (totalMonthlyTickets / 1000) * HugoTransportData.roiModel.paperTicketCostPerThousand;
    const avgFare = 15.50;
    const totalMonthlyRevenue = totalMonthlyTickets * avgFare;
    const leakagePreventedMonthly = totalMonthlyRevenue * (HugoTransportData.roiModel.estimatedLeakageReductionPct / 100);
    const totalMonthlySavings = paperCostMonthly + leakagePreventedMonthly;
    const totalAnnualSavings = totalMonthlySavings * 12;

    const elPaperCost = document.getElementById("roiPaperCostSaved");
    const elLeakage = document.getElementById("roiLeakageSaved");
    const elTotalMonthly = document.getElementById("roiTotalMonthlySavings");
    const elTotalAnnual = document.getElementById("roiTotalAnnualSavings");

    if (elPaperCost) elPaperCost.innerText = `$${paperCostMonthly.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`;
    if (elLeakage) elLeakage.innerText = `$${leakagePreventedMonthly.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`;
    if (elTotalMonthly) elTotalMonthly.innerText = `$${totalMonthlySavings.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN / mes`;
    if (elTotalAnnual) elTotalAnnual.innerText = `$${totalAnnualSavings.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`;
  },

  // Modal de Arqueo de Caja / Liquidación
  showCashierCutModal(driverId) {
    const driver = HugoTransportData.drivers.find(d => d.id === driverId) || HugoTransportData.drivers[0];
    const modal = document.getElementById("cashierModal");
    const body = document.getElementById("cashierModalBody");
    if (!modal || !body) return;

    body.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        <div style="font-size:32px;">🧾</div>
        <h3 style="margin:4px 0; color:#00f2fe;">Cierre de Turno & Liquidación</h3>
        <p style="font-size:12px; color:#94a3b8;">Chofer: <strong>${driver.name}</strong> • ${driver.unit}</p>
      </div>

      <div class="cashier-summary-grid">
        <div class="summary-box">
          <span class="sum-label">Boletos Emitidos</span>
          <span class="sum-val">${driver.ticketsIssued}</span>
        </div>
        <div class="summary-box">
          <span class="sum-label">Pasajeros Detectados IA</span>
          <span class="sum-val">${driver.ticketsIssued} (100%)</span>
        </div>
        <div class="summary-box highlight">
          <span class="sum-label">Efectivo a Entregar</span>
          <span class="sum-val" style="color:#10b981;">$${driver.cashCollected.toLocaleString()} MXN</span>
        </div>
        <div class="summary-box">
          <span class="sum-label">Discrepancias</span>
          <span class="sum-val" style="color:#10b981;">0 (Cero Fugas)</span>
        </div>
      </div>

      <div style="margin-top:16px; padding:12px; background:rgba(0,242,254,0.05); border:1px solid rgba(0,242,254,0.2); border-radius:8px; font-size:11.5px;">
        ✔ <strong>Validación con IA:</strong> Se cruzaron las lecturas de aforo de cámara con el folio de boletos expedidos. La liquidación cuadra con precisión del 100%.
      </div>
    `;

    modal.classList.add("active");
  },

  closeCashierModal() {
    const modal = document.getElementById("cashierModal");
    if (modal) modal.classList.remove("active");
  },

  confirmCashierCut() {
    this.playBeep(950, 0.2);
    this.closeCashierModal();
    this.showToast("✅ ¡Turno liquidado y archivado exitosamente en el servidor!");
  },

  // Notificaciones Toast
  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-pill ${type}`;
    toast.innerHTML = `<span>${type === 'warning' ? '⚠️' : (type === 'info' ? 'ℹ️' : '✨')}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }
};

// Auto-inicio al cargar el DOM
window.addEventListener("DOMContentLoaded", () => {
  App.init();
});

/* ==========================================================================
   APLICACIÓN PRINCIPAL - RECICLADORA SIO (BRAIN BRANDING DEMOS)
   ========================================================================== */

const App = {
  currentTab: 'dashboard',
  currentRole: 'admin',
  liveScaleInterval: null,
  currentSimulatedWeight: 0,
  audioCtx: null,

  init() {
    // Cargar datos en memoria reactiva
    window.SIO_DATA = JSON.parse(localStorage.getItem('SIO_DEMO_DATA')) || initialData;

    this.renderHeader();
    this.renderKPIs();
    this.renderPriceMatrix();
    this.renderScaleForm();
    this.renderRecentWeighings();
    this.renderShipments();
    this.renderAIInsights();
    PnLEngine.render('daily');

    this.startLiveScaleStream();
    console.log('Recicladora SIO Demo inicializada correctamente.');
  },

  // Audio sintético para efectos de pesaje y caja registradora
  playSound(type = 'beep') {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'cash') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Ignorar si el navegador bloquea audio sin interacción previa
    }
  },

  renderHeader() {
    const data = window.SIO_DATA;
    const clientNameEl = document.getElementById('headerClientName');
    const cashOnHandEl = document.getElementById('headerCashOnHand');
    if (clientNameEl) clientNameEl.textContent = `${data.clientName} (${data.businessName})`;
    if (cashOnHandEl) cashOnHandEl.textContent = `$${data.cashOnHand.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });

    if (tabId === 'pnl') {
      PnLEngine.render('daily');
    } else if (tabId === 'ai') {
      this.renderAIInsights();
    } else if (tabId === 'precios') {
      this.renderPriceMatrix();
    } else if (tabId === 'dashboard') {
      this.renderKPIs();
      this.renderRecentWeighings();
    }
  },

  switchRole(role) {
    this.currentRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });

    if (role === 'proveedor') {
      document.getElementById('adminNavTabs').style.display = 'none';
      document.getElementById('providerNavTabs').style.display = 'flex';
      this.switchTab('proveedor-view');
      this.renderProviderPortal();
    } else {
      document.getElementById('adminNavTabs').style.display = 'flex';
      document.getElementById('providerNavTabs').style.display = 'none';
      this.switchTab('dashboard');
    }
  },

  // 1. KPI DASHBOARD
  renderKPIs() {
    const data = window.SIO_DATA;
    const pnl = PnLEngine.calculate('daily');

    const totalStockKg = data.materials.reduce((sum, m) => sum + m.currentStockKg, 0);
    const totalYardValue = data.materials.reduce((sum, m) => sum + (m.currentStockKg * m.buyerPrice), 0);
    const todayPayouts = data.recentWeighings.reduce((sum, w) => sum + w.totalPayout, 0);

    const kpiStockKg = document.getElementById('kpiStockKg');
    const kpiYardValue = document.getElementById('kpiYardValue');
    const kpiTodayPayouts = document.getElementById('kpiTodayPayouts');
    const kpiNetIncome = document.getElementById('kpiNetIncome');

    if (kpiStockKg) kpiStockKg.textContent = `${(totalStockKg / 1000).toFixed(1)} Ton (${totalStockKg.toLocaleString()} kg)`;
    if (kpiYardValue) kpiYardValue.textContent = `$${totalYardValue.toLocaleString('es-MX', {maximumFractionDigits: 0})}`;
    if (kpiTodayPayouts) kpiTodayPayouts.textContent = `$${todayPayouts.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
    if (kpiNetIncome) {
      kpiNetIncome.textContent = `$${pnl.operatingIncome.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
      kpiNetIncome.className = `kpi-value ${pnl.operatingIncome >= 0 ? 'text-neon-green' : 'text-danger'}`;
    }

    // Actualizar ticker de precios
    this.renderPriceTicker();
  },

  renderPriceTicker() {
    const ticker = document.getElementById('livePriceTicker');
    if (!ticker) return;
    const data = window.SIO_DATA;

    ticker.innerHTML = data.materials.map(m => `
      <div class="ticker-item">
        <span class="ticker-icon">${m.icon}</span>
        <span class="ticker-name">${m.name.split('(')[0].trim()}:</span>
        <span class="ticker-price">$${m.buyerPrice.toFixed(2)}/kg</span>
        <span class="ticker-tag">N1: $${m.t1Price.toFixed(2)}</span>
      </div>
    `).join('');
  },

  // 2. MATRIZ DE PRECIOS EN CASCADA
  renderPriceMatrix() {
    const container = document.getElementById('priceMatrixTableBody');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = data.materials.map(mat => {
      const spreadT1 = mat.buyerPrice - mat.t1Price;
      const spreadT2 = mat.buyerPrice - mat.t2Price;
      const spreadT3 = mat.buyerPrice - mat.t3Price;

      return `
        <tr class="price-row" data-id="${mat.id}">
          <td>
            <div class="mat-cell">
              <span class="mat-icon">${mat.icon}</span>
              <div>
                <strong>${mat.name}</strong>
                <div class="mat-cat-tag">${mat.category} • Stock: ${mat.currentStockKg.toLocaleString()} kg</div>
              </div>
            </div>
          </td>
          <td>
            <div class="buyer-price-cell">
              <span class="currency-sign">$</span>
              <input type="number" step="0.10" class="input-buyer-price" id="buyer-input-${mat.id}" 
                     value="${mat.buyerPrice.toFixed(2)}" 
                     onchange="App.onBuyerPriceChange('${mat.id}', this.value)" />
              <span class="unit-tag">/${mat.unit}</span>
            </div>
          </td>
          <td>
            <div class="tier-price-cell tier-t1">
              <strong class="price-val">$${mat.t1Price.toFixed(2)}</strong>
              <span class="spread-badge text-sky">+$${spreadT1.toFixed(2)} (${((spreadT1/mat.buyerPrice)*100).toFixed(0)}%)</span>
            </div>
          </td>
          <td>
            <div class="tier-price-cell tier-t2">
              <strong class="price-val">$${mat.t2Price.toFixed(2)}</strong>
              <span class="spread-badge text-emerald">+$${spreadT2.toFixed(2)} (${((spreadT2/mat.buyerPrice)*100).toFixed(0)}%)</span>
            </div>
          </td>
          <td>
            <div class="tier-price-cell tier-t3">
              <strong class="price-val">$${mat.t3Price.toFixed(2)}</strong>
              <span class="spread-badge text-amber">+$${spreadT3.toFixed(2)} (${((spreadT3/mat.buyerPrice)*100).toFixed(0)}%)</span>
            </div>
          </td>
          <td>
            <button class="btn-action-flash" onclick="App.quickAdjust('${mat.id}', 1.05)" title="Ajustar +5%">+5%</button>
            <button class="btn-action-flash" onclick="App.quickAdjust('${mat.id}', 0.95)" title="Ajustar -5%">-5%</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Manejo de cambio en precio del Gran Comprador (Cascada Inmediata)
  onBuyerPriceChange(materialId, newPriceStr) {
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) return;

    const data = window.SIO_DATA;
    const mat = data.materials.find(m => m.id === materialId);
    if (!mat) return;

    const oldPrice = mat.buyerPrice;
    mat.buyerPrice = newPrice;
    
    // Fórmulas en cascada de compra protegiendo márgenes
    mat.t1Price = +(newPrice * (1 - 0.28)).toFixed(2);
    mat.t2Price = +(newPrice * (1 - 0.16)).toFixed(2);
    mat.t3Price = +(newPrice * (1 - 0.08)).toFixed(2);

    // Registro de impacto por inventario en patio
    const impact = (newPrice - oldPrice) * mat.currentStockKg;
    data.priceChangeHistory.unshift({
      timestamp: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'}),
      trigger: 'Modificación Manual de Carlos (Cascada)',
      materialId: mat.id,
      materialName: mat.name,
      oldBuyerPrice: oldPrice,
      newBuyerPrice: newPrice,
      deltaBuyer: `${newPrice >= oldPrice ? '+' : ''}$${(newPrice - oldPrice).toFixed(2)}/kg`,
      revaluationImpact: impact,
      impactType: impact >= 0 ? 'GANANCIA_STOCK' : 'PÉRDIDA_STOCK'
    });

    this.saveData();
    this.renderPriceMatrix();
    this.renderKPIs();
    this.renderScaleForm();
    PnLEngine.render('daily');
    this.playSound('beep');
    this.showToast(`⚡ Precios actualizados en cascada para ${mat.name}`);
  },

  quickAdjust(materialId, factor) {
    const data = window.SIO_DATA;
    const mat = data.materials.find(m => m.id === materialId);
    if (!mat) return;
    const newPrice = +(mat.buyerPrice * factor).toFixed(2);
    this.onBuyerPriceChange(materialId, newPrice);
  },

  // 3. SIMULADOR DE LLAMADA DE LA SIDERÚRGICA (FLASH CALL)
  openCallSimulatorModal() {
    this.playSound('alert');
    const modal = document.getElementById('flashCallModal');
    if (modal) modal.classList.add('active');
  },

  closeCallSimulatorModal() {
    const modal = document.getElementById('flashCallModal');
    if (modal) modal.classList.remove('active');
  },

  applySimulatedCall(scenarioType) {
    const data = window.SIO_DATA;
    let message = '';

    if (scenarioType === 'copper_up') {
      const copper1 = data.materials.find(m => m.id === 'MAT-01');
      const copper2 = data.materials.find(m => m.id === 'MAT-02');
      if (copper1) copper1.buyerPrice = 162.00;
      if (copper2) copper2.buyerPrice = 145.00;
      message = '📞 Siderúrgica Monterrey: Cobre 1ra subió a $162.00/kg (+8.00). Precios de compra en báscula actualizados en cascada.';
    } else if (scenarioType === 'steel_down') {
      const steel = data.materials.find(m => m.id === 'MAT-03');
      if (steel) steel.buyerPrice = 5.00;
      message = '📞 Siderúrgica Monterrey: Acero Mixto bajó a $5.00/kg (-0.40). Báscula ajustada de inmediato para no pagar de más.';
    } else if (scenarioType === 'all_metals_surge') {
      data.materials.forEach(m => {
        m.buyerPrice = +(m.buyerPrice * 1.06).toFixed(2);
      });
      message = '📞 Siderúrgica Monterrey: Repunte generalizado +6% en todos los metales. Pizarra y básculas sincronizadas.';
    }

    // Recalcular todos los niveles en cascada
    data.materials.forEach(mat => {
      mat.t1Price = +(mat.buyerPrice * (1 - 0.28)).toFixed(2);
      mat.t2Price = +(mat.buyerPrice * (1 - 0.16)).toFixed(2);
      mat.t3Price = +(mat.buyerPrice * (1 - 0.08)).toFixed(2);
    });

    this.saveData();
    this.closeCallSimulatorModal();
    this.renderPriceMatrix();
    this.renderKPIs();
    this.renderScaleForm();
    PnLEngine.render('daily');
    this.playSound('cash');
    this.showToast(message, 'success');
  },

  // 4. BÁSCULA DIGITAL & SIMULADOR DE PESAJE EN VIVO
  startLiveScaleStream() {
    if (this.liveScaleInterval) clearInterval(this.liveScaleInterval);
    this.liveScaleInterval = setInterval(() => {
      // Simular ligeras fluctuaciones de báscula en vivo (ruido digital de celdas de carga)
      const base = this.currentSimulatedWeight || 180;
      const jitter = (Math.random() * 0.4 - 0.2).toFixed(1);
      const displayVal = Math.max(0, +(parseFloat(base) + parseFloat(jitter)).toFixed(1));
      
      const liveIndicator = document.getElementById('liveScaleDisplay');
      if (liveIndicator) {
        liveIndicator.textContent = `${displayVal} kg`;
      }
    }, 400);
  },

  renderScaleForm() {
    const matSelect = document.getElementById('scaleMaterialSelect');
    const supSelect = document.getElementById('scaleSupplierSelect');
    if (!matSelect || !supSelect) return;

    const data = window.SIO_DATA;
    matSelect.innerHTML = data.materials.map(m => `
      <option value="${m.id}" data-t1="${m.t1Price}" data-t2="${m.t2Price}" data-t3="${m.t3Price}">
        ${m.icon} ${m.name} (${m.category})
      </option>
    `).join('');

    supSelect.innerHTML = data.suppliers.map(s => `
      <option value="${s.id}" data-tier="${s.tier}">
        ${s.name} • [${s.tier === 'T1' ? 'Nivel 1 Menudeo' : s.tier === 'T2' ? 'Nivel 2 Frecuente' : 'Nivel 3 Industrial'}]
      </option>
    `).join('');

    this.updateScaleCalculations();
  },

  updateScaleCalculations() {
    const data = window.SIO_DATA;
    const matSelect = document.getElementById('scaleMaterialSelect');
    const supSelect = document.getElementById('scaleSupplierSelect');
    const grossInput = document.getElementById('scaleGrossWeight');
    const tareInput = document.getElementById('scaleTareWeight');

    if (!matSelect || !supSelect || !grossInput || !tareInput) return;

    const selectedMatId = matSelect.value;
    const selectedSupId = supSelect.value;
    const mat = data.materials.find(m => m.id === selectedMatId);
    const sup = data.suppliers.find(s => s.id === selectedSupId);

    if (!mat || !sup) return;

    const gross = parseFloat(grossInput.value) || 0;
    const tare = parseFloat(tareInput.value) || 0;
    const net = Math.max(0, +(gross - tare).toFixed(1));

    // Determinar precio según el nivel del proveedor
    let pricePerKg = mat.t1Price;
    let tierLabel = 'Nivel 1 (28% Margen SIO)';
    if (sup.tier === 'T2') {
      pricePerKg = mat.t2Price;
      tierLabel = 'Nivel 2 (16% Margen SIO)';
    } else if (sup.tier === 'T3') {
      pricePerKg = mat.t3Price;
      tierLabel = 'Nivel 3 (8% Margen SIO)';
    }

    const totalPayout = +(net * pricePerKg).toFixed(2);
    const buyerRevenue = +(net * mat.buyerPrice).toFixed(2);
    const grossProfitSIO = +(buyerRevenue - totalPayout).toFixed(2);

    document.getElementById('scaleNetWeightDisplay').textContent = `${net.toLocaleString()} kg`;
    document.getElementById('scalePricePerKgDisplay').textContent = `$${pricePerKg.toFixed(2)} / kg`;
    document.getElementById('scaleTierLabelDisplay').textContent = tierLabel;
    document.getElementById('scaleTotalPayoutDisplay').textContent = `$${totalPayout.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
    document.getElementById('scaleGrossProfitDisplay').textContent = `+$${grossProfitSIO.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
  },

  captureLiveScaleToGross() {
    this.playSound('beep');
    const randomWeights = [185.0, 420.5, 1250.0, 3680.0, 75.0, 240.0];
    const picked = randomWeights[Math.floor(Math.random() * randomWeights.length)];
    document.getElementById('scaleGrossWeight').value = picked;
    this.currentSimulatedWeight = picked;
    this.updateScaleCalculations();
    this.showToast(`⚖️ Peso capturado de Báscula: ${picked} kg`);
  },

  setTareZero() {
    this.playSound('beep');
    document.getElementById('scaleTareWeight').value = 0;
    this.updateScaleCalculations();
  },

  autoTareContainer() {
    this.playSound('beep');
    const gross = parseFloat(document.getElementById('scaleGrossWeight').value) || 0;
    const tare = +(gross * 0.08).toFixed(1); // 8% de tara estimada por botes/tara
    document.getElementById('scaleTareWeight').value = tare;
    this.updateScaleCalculations();
  },

  // Registrar Liquidación y Pago en Efectivo de Báscula
  processWeighingCheckout() {
    const data = window.SIO_DATA;
    const matSelect = document.getElementById('scaleMaterialSelect');
    const supSelect = document.getElementById('scaleSupplierSelect');
    const gross = parseFloat(document.getElementById('scaleGrossWeight').value) || 0;
    const tare = parseFloat(document.getElementById('scaleTareWeight').value) || 0;
    const net = Math.max(0, +(gross - tare).toFixed(1));

    if (net <= 0) {
      alert('Por favor ingrese un peso válido mayor a cero.');
      return;
    }

    const mat = data.materials.find(m => m.id === matSelect.value);
    const sup = data.suppliers.find(s => s.id === supSelect.value);

    let pricePerKg = mat.t1Price;
    if (sup.tier === 'T2') pricePerKg = mat.t2Price;
    if (sup.tier === 'T3') pricePerKg = mat.t3Price;

    const totalPayout = +(net * pricePerKg).toFixed(2);

    if (totalPayout > data.cashOnHand) {
      alert(`⚠️ Saldo insuficiente en caja ($${data.cashOnHand.toLocaleString('es-MX')}). Se requiere reposición de efectivo.`);
      return;
    }

    // Crear registro
    const newFolio = `REC-2026-${String(data.recentWeighings.length + 843).padStart(4, '0')}`;
    const newRecord = {
      folio: newFolio,
      timestamp: new Date().toLocaleString('es-MX', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}),
      supplierName: sup.name,
      tier: sup.tier,
      materialId: mat.id,
      materialName: mat.name,
      grossWeightKg: gross,
      tareWeightKg: tare,
      netWeightKg: net,
      pricePerKg: pricePerKg,
      totalPayout: totalPayout,
      status: 'PAGADO_EFECTIVO',
      scaleType: gross > 1000 ? 'Báscula Camionera 60 Ton' : 'Báscula Plataforma 1 Ton'
    };

    // Actualizar inventario en patio y caja
    mat.currentStockKg += net;
    data.cashOnHand -= totalPayout;
    data.recentWeighings.unshift(newRecord);

    this.saveData();
    this.playSound('cash');
    this.renderKPIs();
    this.renderRecentWeighings();
    PnLEngine.render('daily');
    this.openTicketModal(newRecord);
  },

  // 5. MODAL DE TICKET DIGITAL DE BÁSCULA
  openTicketModal(ticket) {
    const data = window.SIO_DATA;
    const modal = document.getElementById('scaleTicketModal');
    const container = document.getElementById('ticketPrintArea');
    if (!modal || !container) return;

    container.innerHTML = `
      <div class="digital-ticket">
        <div class="ticket-header">
          <div class="ticket-logo">🧠 SIO</div>
          <h3 class="ticket-biz">${data.fullName}</h3>
          <div class="ticket-lic">${data.license}</div>
          <div class="ticket-divider">================================</div>
          <div class="ticket-folio">FOLIO: <strong>${ticket.folio}</strong></div>
          <div class="ticket-date">${ticket.timestamp}</div>
        </div>

        <div class="ticket-body">
          <div class="t-row"><span>PROVEEDOR:</span> <strong>${ticket.supplierName}</strong></div>
          <div class="t-row"><span>TARIFA:</span> <span>${ticket.tier}</span></div>
          <div class="t-row"><span>MATERIAL:</span> <strong>${ticket.materialName}</strong></div>
          <div class="ticket-divider">--------------------------------</div>
          <div class="t-row"><span>PESO BRUTO:</span> <span>${ticket.grossWeightKg.toLocaleString()} kg</span></div>
          <div class="t-row"><span>TARA / DESCUENTO:</span> <span>-${ticket.tareWeightKg.toLocaleString()} kg</span></div>
          <div class="t-row highlight-t"><span>PESO NETO:</span> <strong>${ticket.netWeightKg.toLocaleString()} kg</strong></div>
          <div class="t-row"><span>PRECIO APLICADO:</span> <strong>$${ticket.pricePerKg.toFixed(2)} / kg</strong></div>
          <div class="ticket-divider">================================</div>
          <div class="t-row total-t">
            <span>TOTAL LIQUIDADO:</span>
            <span class="payout-amount">$${ticket.totalPayout.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="t-row"><span>FORMA DE PAGO:</span> <span>${ticket.status}</span></div>
        </div>

        <div class="ticket-footer">
          <div class="qr-mock">
            <div class="qr-box">QR VERIFICADO • SIO AI</div>
          </div>
          <div class="ticket-legend">Certificado de Pesaje Conforme a Normativa Ambiental</div>
          <div class="ticket-thanks">¡Gracias por contribuir al reciclaje industrial!</div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  closeTicketModal() {
    const modal = document.getElementById('scaleTicketModal');
    if (modal) modal.classList.remove('active');
  },

  printTicket() {
    window.print();
  },

  // 6. HISTORIAL DE PISAJES RECIENTES
  renderRecentWeighings() {
    const tbody = document.getElementById('recentWeighingsTableBody');
    if (!tbody) return;
    const data = window.SIO_DATA;

    tbody.innerHTML = data.recentWeighings.slice(0, 6).map(w => `
      <tr>
        <td><strong>${w.folio}</strong><br><small class="text-slate">${w.timestamp}</small></td>
        <td>${w.supplierName}<br><span class="badge badge-tier">${w.tier}</span></td>
        <td><strong>${w.materialName}</strong></td>
        <td>${w.netWeightKg.toLocaleString()} kg</td>
        <td>$${w.pricePerKg.toFixed(2)}</td>
        <td class="text-right font-bold text-emerald">$${w.totalPayout.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
        <td class="text-center">
          <button class="btn-sm-print" onclick='App.openTicketModal(${JSON.stringify(w)})' title="Ver Ticket">🖨️</button>
        </td>
      </tr>
    `).join('');
  },

  // 7. EMBARQUES A SIDERÚRGICA
  renderShipments() {
    const container = document.getElementById('shipmentsTableBody');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = data.shipmentsToBuyer.map(s => `
      <tr>
        <td><strong>${s.folio}</strong><br><small class="text-slate">${s.date}</small></td>
        <td>${s.buyerName}</td>
        <td><strong>${s.materialName}</strong></td>
        <td>${(s.shippedKg / 1000).toFixed(1)} Ton (${s.shippedKg.toLocaleString()} kg)</td>
        <td>$${s.salePricePerKg.toFixed(2)}/kg</td>
        <td>$${s.totalRevenue.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
        <td class="text-right text-neon-green font-bold">+$${s.grossProfit.toLocaleString('es-MX', {minimumFractionDigits: 2})} (${s.marginPct}%)</td>
        <td><span class="badge badge-success">${s.status}</span></td>
      </tr>
    `).join('');
  },

  openNewShipmentModal() {
    const matSelect = document.getElementById('shipmentMaterialSelect');
    if (matSelect) {
      const data = window.SIO_DATA;
      matSelect.innerHTML = data.materials.map(m => `
        <option value="${m.id}">${m.name} (Stock en patio: ${m.currentStockKg.toLocaleString()} kg)</option>
      `).join('');
    }
    const modal = document.getElementById('newShipmentModal');
    if (modal) modal.classList.add('active');
  },

  closeNewShipmentModal() {
    const modal = document.getElementById('newShipmentModal');
    if (modal) modal.classList.remove('active');
  },

  dispatchShipment() {
    const data = window.SIO_DATA;
    const matId = document.getElementById('shipmentMaterialSelect').value;
    const tons = parseFloat(document.getElementById('shipmentTonsInput').value) || 0;
    const shippedKg = tons * 1000;

    const mat = data.materials.find(m => m.id === matId);
    if (!mat || shippedKg <= 0) {
      alert('Por favor ingrese un tonelaje válido.');
      return;
    }

    if (shippedKg > mat.currentStockKg) {
      alert(`⚠️ Stock insuficiente en patio. Stock disponible: ${mat.currentStockKg.toLocaleString()} kg.`);
      return;
    }

    const totalRevenue = +(shippedKg * mat.buyerPrice).toFixed(2);
    const totalCost = +(shippedKg * mat.avgCostPerKg).toFixed(2);
    const freightCost = 4500.00;
    const grossProfit = +(totalRevenue - totalCost - freightCost).toFixed(2);
    const marginPct = +((grossProfit / totalRevenue) * 100).toFixed(2);

    const newFolio = `EMB-SIO-${String(data.shipmentsToBuyer.length + 95).padStart(3, '0')}`;
    const newShipment = {
      folio: newFolio,
      date: new Date().toISOString().split('T')[0],
      buyerName: data.buyerName,
      materialId: mat.id,
      materialName: mat.name,
      shippedKg: shippedKg,
      salePricePerKg: mat.buyerPrice,
      totalRevenue: totalRevenue,
      avgCostPerKg: mat.avgCostPerKg,
      totalCost: totalCost,
      freightCost: freightCost,
      grossProfit: grossProfit,
      marginPct: marginPct,
      status: 'EN_TRÁNSITO_AUTORIZADO'
    };

    // Descontar inventario y sumar efectivo/cuentas por cobrar
    mat.currentStockKg -= shippedKg;
    data.cashOnHand += totalRevenue * 0.5; // 50% anticipo de siderúrgica
    data.shipmentsToBuyer.unshift(newShipment);

    this.saveData();
    this.playSound('cash');
    this.closeNewShipmentModal();
    this.renderKPIs();
    this.renderShipments();
    PnLEngine.render('daily');
    this.showToast(`🚚 Góndola despachada con éxito: Folio ${newFolio} (+${grossProfit.toLocaleString('es-MX')} MXN de ganancia)`);
  },

  // 8. BRAIN IA INSIGHTS
  renderAIInsights() {
    const container = document.getElementById('aiInsightsContainer');
    if (!container) return;

    const insights = BrainAIEngine.getInsights();
    container.innerHTML = insights.map(item => `
      <div class="ai-insight-card" style="border-left: 4px solid ${item.color};">
        <div class="ai-card-header">
          <h4 class="ai-card-title">${item.title}</h4>
          <span class="ai-badge" style="background: ${item.color}22; color: ${item.color}; border: 1px solid ${item.color}44;">
            ${item.badge}
          </span>
        </div>
        <div class="ai-card-body">${item.text}</div>
      </div>
    `).join('');
  },

  // 9. PORTAL DEL PROVEEDOR (VISTA DUAL)
  renderProviderPortal() {
    const container = document.getElementById('providerPortalContent');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = `
      <div class="provider-hero">
        <h2>🛍️ Portal de Proveedores & Recolectores • SIO</h2>
        <p>Consulta en tiempo real la pizarra de precios oficial y el historial de tus entregas certificadas.</p>
      </div>

      <div class="provider-price-grid">
        ${data.materials.map(m => `
          <div class="provider-price-card">
            <div class="p-icon">${m.icon}</div>
            <div class="p-name">${m.name}</div>
            <div class="p-tier-prices">
              <div class="p-price-box">
                <span class="p-label">Nivel 1 (Menudeo):</span>
                <strong class="p-val text-sky">$${m.t1Price.toFixed(2)}/kg</strong>
              </div>
              <div class="p-price-box">
                <span class="p-label">Nivel 2 (Camionetero):</span>
                <strong class="p-val text-emerald">$${m.t2Price.toFixed(2)}/kg</strong>
              </div>
              <div class="p-price-box">
                <span class="p-label">Nivel 3 (Industrial):</span>
                <strong class="p-val text-amber">$${m.t3Price.toFixed(2)}/kg</strong>
              </div>
            </div>
            <div class="p-badge-eco">✅ Pago Inmediato en Efectivo</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showToast(msg, type = 'info') {
    const toast = document.getElementById('appToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `app-toast active ${type}`;
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  },

  saveData() {
    localStorage.setItem('SIO_DEMO_DATA', JSON.stringify(window.SIO_DATA));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

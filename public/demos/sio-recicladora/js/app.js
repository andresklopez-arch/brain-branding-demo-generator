/* ==========================================================================
   APLICACIÓN PRINCIPAL - RECICLADORA SIO (BRAIN BRANDING DEMOS)
   ========================================================================== */

const App = {
  currentTab: 'dashboard',
  currentRole: 'admin',
  liveScaleInterval: null,
  currentSimulatedWeight: 0,
  audioCtx: null,
  enteredPin: '',
  bannerTimer: null,

  quickPriceState: {
    materialId: 'MAT-01',
    direction: 'up',
    unit: 'amount',
    value: 5.0
  },

  onboardingStep: 0,
  onboardingCards: [
    {
      icon: '🌐',
      badge: 'POTENCIAL #1 • PREDICTOR INTERNACIONAL IA',
      title: 'Anticipa las Llamadas con Precios Mundiales (LME / COMEX)',
      text: 'El motor de Inteligencia Artificial monitorea la <strong>Bolsa de Metales de Londres (LME)</strong> y Fastmarkets. Te avisa con hasta 72 horas de anticipación si el Cobre o el Acero van a subir o bajar, permitiéndote acaparar material barato o despachar inventario antes de que baje la tarifa.',
      benefit: '📈 <strong>Beneficio:</strong> Máxima ganancia especulativa y ventaja competitiva total sobre otros recicladores.'
    },
    {
      icon: '📲',
      badge: 'POTENCIAL #2 • BOT DE WHATSAPP / TELEGRAM',
      title: 'Control de Precios Remoto sin Llamar al Cajero',
      text: 'Recibe alertas instantáneas en tu celular y cambia precios respondiendo al Bot de Telegram/WhatsApp con comandos directos como <code>/precio cobre +5</code>. La báscula se actualiza al milisegundo sin que el operador de mostrador cometa errores.',
      benefit: '⚡ <strong>Beneficio:</strong> Cero fuga de dinero por rezago de precios y control total desde la palma de tu mano.'
    },
    {
      icon: '📺',
      badge: 'POTENCIAL #3 • PANTALLA LED DE PATIO EN VIVO',
      title: 'Pizarra Digital en TV para Proveedores y Báscula',
      text: 'Conecta cualquier pantalla o Smart TV en el área de descarga. Cuando cambias un precio (desde la web o por Telegram), la pantalla LED de patio se actualiza en <strong>tiempo real con animación brillante</strong>, transmitiendo máxima transparencia a los recolectores.',
      benefit: '💎 <strong>Beneficio:</strong> Imagen corporativa de alto nivel y fidelización de proveedores camioneros e industriales.'
    },
    {
      icon: '📈',
      badge: 'POTENCIAL #4 • ESTADO DE RESULTADOS & BÁSCULA IA',
      title: 'P&L Diario con Efecto por Volatilidad de Inventario',
      text: 'Captura de peso digital en báscula con emisión de tickets con código QR y un Estado de Resultados que mide cuánto dinero ganas cada día y el valor exacto de revalorización de tu stock en patio.',
      benefit: '💰 <strong>Beneficio:</strong> Visión financiera exacta de utilidades netas y cero robo hormiga.'
    }
  ],

  init() {
    window.SIO_DATA = JSON.parse(localStorage.getItem('SIO_DEMO_DATA')) || initialData;

    this.renderHeader();
    this.renderKPIs();
    this.renderPriceMatrix();
    this.renderScaleForm();
    this.renderRecentWeighings();
    this.renderShipments();
    this.renderAIInsights();
    this.renderInternationalMarkets();
    this.renderTelegramBotMessages();
    this.renderTVScreen();
    PnLEngine.render('daily');

    this.startLiveScaleStream();
    this.bindKeypadEvents();

    // Comprobar si hay sesión activa para pedir NIP de seguridad
    const sessionActive = sessionStorage.getItem('BB_SIO_UNLOCKED');
    if (!sessionActive) {
      this.showPinGate();
    } else {
      this.unlockApp(false);
    }

    console.log('Recicladora SIO Demo V2 - Menú Unificado & Control de Seguridad Inicializado.');
  },

  showPinGate() {
    this.enteredPin = '';
    this.updatePinDots();
    const gate = document.getElementById('pinGateOverlay');
    if (gate) {
      gate.style.display = 'flex';
      gate.classList.add('active');
    }
  },

  bindKeypadEvents() {
    document.addEventListener('keydown', (e) => {
      const gate = document.getElementById('pinGateOverlay');
      if (!gate || gate.style.display === 'none') return;

      if (e.key >= '0' && e.key <= '9') {
        this.addPinDigit(e.key);
      } else if (e.key === 'Backspace') {
        this.deletePinDigit();
      } else if (e.key === 'Escape') {
        this.clearPin();
      }
    });
  },

  addPinDigit(d) {
    if (this.enteredPin.length < 5) {
      this.enteredPin += d;
      this.playSound('beep');
      this.updatePinDots();

      if (this.enteredPin.length === 5) {
        setTimeout(() => this.verifyPin(), 180);
      }
    }
  },

  deletePinDigit() {
    if (this.enteredPin.length > 0) {
      this.enteredPin = this.enteredPin.slice(0, -1);
      this.playSound('beep');
      this.updatePinDots();
    }
  },

  clearPin() {
    this.enteredPin = '';
    this.playSound('beep');
    this.updatePinDots();
  },

  updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      if (idx < this.enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });

    const statusEl = document.getElementById('pinStatusMsg');
    if (statusEl) {
      if (this.enteredPin.length === 0) {
        statusEl.textContent = 'Ingresa el NIP de 5 dígitos (51934)';
        statusEl.style.color = '#94a3b8';
      } else {
        statusEl.textContent = `Dígitos ingresados: ${this.enteredPin.length}/5`;
        statusEl.style.color = '#38bdf8';
      }
    }
  },

  verifyPin() {
    if (this.enteredPin === '51934') {
      sessionStorage.setItem('BB_SIO_UNLOCKED', 'true');
      sessionStorage.setItem('BB_AUTH_NIP', '51934');
      this.unlockApp(true);
    } else {
      this.playSound('alert');
      const card = document.querySelector('.pin-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
      }
      const statusEl = document.getElementById('pinStatusMsg');
      if (statusEl) {
        statusEl.textContent = '❌ NIP incorrecto. Intenta con: 51934';
        statusEl.style.color = '#ef4444';
      }
      setTimeout(() => {
        this.clearPin();
      }, 700);
    }
  },

  unlockApp(isFirstTime = true) {
    const gate = document.getElementById('pinGateOverlay');
    if (gate) {
      gate.classList.remove('active');
      setTimeout(() => { gate.style.display = 'none'; }, 300);
    }

    this.playSound('cash');

    // 1. Iniciar temporizador de 3 segundos para auto-ocultar el banner superior de la imagen 2
    this.startBannerAutoHideTimer();

    // 2. Voz de bienvenida y speech
    this.speakWelcomeSpeech();

    // 3. Abrir siempre el tutorial dinámico (Onboarding)
    setTimeout(() => {
      this.openOnboardingModal();
    }, 450);
  },

  lockSession() {
    sessionStorage.removeItem('BB_SIO_UNLOCKED');
    this.showPinGate();
    this.showToast('🔒 Sesión bloqueada por seguridad de patio.');
  },

  startBannerAutoHideTimer() {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.collapseTopBanner();
    }, 3000);
  },

  collapseTopBanner() {
    const banner = document.getElementById('topBrandingBanner');
    if (banner) {
      banner.classList.add('auto-hidden');
    }
  },

  toggleTopBanner() {
    const banner = document.getElementById('topBrandingBanner');
    if (banner) {
      banner.classList.toggle('auto-hidden');
    }
  },

  speakWelcomeSpeech() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Bienvenido Carlos a la plataforma de Recicladora SIO. Control de precios internacionales, báscula y margen en cascada activo.");
        utterance.lang = 'es-MX';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  },

  scrollNav(direction) {
    const container = document.getElementById('adminNavTabs');
    if (container) {
      const scrollAmount = 180 * direction;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  },

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
    } catch (e) {}
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
      this.renderInternationalMarkets();
    } else if (tabId === 'precios') {
      this.renderPriceMatrix();
    } else if (tabId === 'dashboard') {
      this.renderKPIs();
      this.renderRecentWeighings();
    } else if (tabId === 'tv-screen') {
      this.renderTVScreen();
    } else if (tabId === 'bot') {
      this.renderTelegramBotMessages();
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

    this.renderPriceTicker();
  },

  renderPriceTicker() {
    const ticker = document.getElementById('livePriceTicker');
    if (!ticker) return;
    const data = window.SIO_DATA;

    ticker.innerHTML = data.materials.map(m => `
      <div class="ticker-item" onclick="App.openQuickPriceModal('${m.id}')" style="cursor:pointer;" title="Clic para ajustar precio rápido">
        <span class="ticker-icon">${m.icon}</span>
        <span class="ticker-name">${m.name.split('(')[0].trim()}:</span>
        <span class="ticker-price">$${m.buyerPrice.toFixed(2)}/kg</span>
        <span class="ticker-tag">N1: $${m.t1Price.toFixed(2)}</span>
      </div>
    `).join('');
  },

  // 1. PREDICTOR INTERNACIONAL IA
  renderInternationalMarkets() {
    const container = document.getElementById('intlMarketsGrid');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = data.internationalMarkets.map(m => `
      <div class="intl-market-card">
        <div class="intl-header">
          <div>
            <span class="intl-symbol">${m.symbol}</span>
            <h4 class="intl-name">${m.name}</h4>
          </div>
          <span class="intl-badge ${m.trend24h.startsWith('+') ? 'badge-up' : 'badge-down'}">${m.trend24h} (24h)</span>
        </div>
        <div class="intl-price-row">
          <div>
            <div class="intl-lbl">COTIZACIÓN GLOBAL:</div>
            <div class="intl-val">$${m.priceUSDPerTon.toLocaleString()} USD/Ton</div>
          </div>
          <div style="text-align:right;">
            <div class="intl-lbl">EQUIVALENTE MXN:</div>
            <div class="intl-val text-emerald">$${m.priceMXNPerKg.toFixed(2)} /kg</div>
          </div>
        </div>
        <div class="intl-forecast-box">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:0.75rem; color:#94a3b8;">Proyección IA (72h): <strong>${m.forecast72h}</strong></span>
            <span style="font-size:0.75rem; color:#38bdf8; font-weight:bold;">Fiabilidad: ${m.confidence}</span>
          </div>
          <p style="font-size:0.8rem; color:#cbd5e1; margin-bottom:6px;">${m.impactLocal}</p>
          <div class="intl-action-tag">💡 ${m.actionSuggested}</div>
        </div>
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
                <div class="mat-cat-tag">${mat.category} • Benchmark: <span class="text-sky">${mat.intlBenchmark}</span></div>
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
            <button class="btn-action-flash" onclick="App.openQuickPriceModal('${mat.id}')" title="Ajuste Rápido en $ o %">⚡ Ajustar</button>
            <button class="btn-action-flash" onclick="App.quickAdjust('${mat.id}', 1.05)" title="+5%">+5%</button>
            <button class="btn-action-flash" onclick="App.quickAdjust('${mat.id}', 0.95)" title="-5%">-5%</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  onBuyerPriceChange(materialId, newPriceStr, source = 'Web Panel') {
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) return;

    const data = window.SIO_DATA;
    const mat = data.materials.find(m => m.id === materialId);
    if (!mat) return;

    const oldPrice = mat.buyerPrice;
    mat.buyerPrice = newPrice;
    
    mat.t1Price = +(newPrice * (1 - 0.28)).toFixed(2);
    mat.t2Price = +(newPrice * (1 - 0.16)).toFixed(2);
    mat.t3Price = +(newPrice * (1 - 0.08)).toFixed(2);

    const delta = newPrice - oldPrice;
    const revaluation = delta * mat.currentStockKg;

    data.priceChangeHistory.unshift({
      timestamp: new Date().toLocaleString('es-MX', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}),
      trigger: `${source} (Siderúrgica)`,
      materialId: mat.id,
      materialName: mat.name,
      oldBuyerPrice: oldPrice,
      newBuyerPrice: newPrice,
      deltaBuyer: `${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}/kg`,
      revaluationImpact: revaluation,
      impactType: revaluation >= 0 ? 'GANANCIA_STOCK' : 'PÉRDIDA_STOCK'
    });

    this.saveData();
    this.renderPriceMatrix();
    this.renderKPIs();
    this.renderScaleForm();
    this.renderTVScreen();
    this.flashTVScreenUpdate(mat.name, newPrice);
    PnLEngine.render('daily');
    this.playSound('cash');
    this.showToast(`⚡ Precio actualizado para ${mat.name}: $${newPrice.toFixed(2)}/kg (Báscula N1: $${mat.t1Price.toFixed(2)})`);
  },

  quickAdjust(matId, multiplier) {
    const data = window.SIO_DATA;
    const mat = data.materials.find(m => m.id === matId);
    if (mat) {
      const newPrice = +(mat.buyerPrice * multiplier).toFixed(2);
      this.onBuyerPriceChange(matId, newPrice, 'Ajuste Rápido %');
    }
  },

  // 3. CAMBIADOR RÁPIDO DE PRECIOS MODAL
  openQuickPriceModal(defaultMatId = null) {
    const modal = document.getElementById('quickPriceModal');
    if (!modal) return;

    const select = document.getElementById('qpMaterialSelect');
    const data = window.SIO_DATA;
    
    select.innerHTML = `
      <option value="ALL">🌐 TODOS LOS MATERIALES (Ajuste Global)</option>
      ${data.materials.map(m => `
        <option value="${m.id}" ${m.id === defaultMatId ? 'selected' : ''}>
          ${m.icon} ${m.name} (Actual: $${m.buyerPrice.toFixed(2)}/kg)
        </option>
      `).join('')}
    `;

    if (defaultMatId) {
      this.quickPriceState.materialId = defaultMatId;
      select.value = defaultMatId;
    }

    this.updateQuickPricePreview();
    modal.classList.add('active');
  },

  closeQuickPriceModal() {
    const modal = document.getElementById('quickPriceModal');
    if (modal) modal.classList.remove('active');
  },

  setQuickPriceDirection(dir) {
    this.quickPriceState.direction = dir;
    document.querySelectorAll('.qp-dir-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dir === dir);
    });
    this.updateQuickPricePreview();
  },

  setQuickPriceUnit(unit) {
    this.quickPriceState.unit = unit;
    document.querySelectorAll('.qp-unit-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.unit === unit);
    });

    const prefix = document.getElementById('qpValuePrefix');
    if (prefix) prefix.textContent = unit === 'amount' ? '$' : '%';

    const input = document.getElementById('qpValueInput');
    if (input) input.value = unit === 'amount' ? '5.0' : '5';

    this.updateQuickPricePreview();
  },

  setQuickPresetValue(val) {
    const input = document.getElementById('qpValueInput');
    if (input) {
      input.value = val;
      this.updateQuickPricePreview();
    }
  },

  updateQuickPricePreview() {
    const data = window.SIO_DATA;
    const select = document.getElementById('qpMaterialSelect');
    const input = document.getElementById('qpValueInput');
    if (!select || !input) return;

    const matId = select.value;
    const val = parseFloat(input.value) || 0;
    const isUp = this.quickPriceState.direction === 'up';
    const isAmount = this.quickPriceState.unit === 'amount';

    const previewBox = document.getElementById('qpPreviewDetails');
    if (!previewBox) return;

    if (matId === 'ALL') {
      previewBox.innerHTML = `
        <div class="qp-preview-item">
          <span>Acción Global:</span>
          <strong class="${isUp ? 'text-emerald' : 'text-amber'}">
            ${isUp ? '▲ AUMENTAR' : '▼ DISMINUIR'} ${isAmount ? `$${val.toFixed(2)} MXN/kg` : `${val}%`} a TODOS los metales
          </strong>
        </div>
      `;
      return;
    }

    const mat = data.materials.find(m => m.id === matId);
    if (!mat) return;

    let newBuyerPrice = mat.buyerPrice;
    if (isAmount) {
      newBuyerPrice = isUp ? (mat.buyerPrice + val) : Math.max(0.1, mat.buyerPrice - val);
    } else {
      newBuyerPrice = isUp ? (mat.buyerPrice * (1 + (val / 100))) : Math.max(0.1, mat.buyerPrice * (1 - (val / 100)));
    }
    newBuyerPrice = +newBuyerPrice.toFixed(2);

    const newT1 = +(newBuyerPrice * (1 - 0.28)).toFixed(2);
    const newT2 = +(newBuyerPrice * (1 - 0.16)).toFixed(2);
    const newT3 = +(newBuyerPrice * (1 - 0.08)).toFixed(2);
    const stockImpact = (newBuyerPrice - mat.buyerPrice) * mat.currentStockKg;

    previewBox.innerHTML = `
      <div class="qp-preview-grid">
        <div class="qp-prev-col">
          <div class="qp-prev-lbl">PRECIO COMPRADOR:</div>
          <div class="qp-prev-val">
            <span style="text-decoration: line-through; color:#94a3b8; font-size:0.85rem;">$${mat.buyerPrice.toFixed(2)}</span> 
            ➔ <strong class="${isUp ? 'text-emerald' : 'text-amber'}">$${newBuyerPrice.toFixed(2)}/kg</strong>
          </div>
        </div>
        <div class="qp-prev-col">
          <div class="qp-prev-lbl">BÁSCULA NIVEL 1 (28% Margen):</div>
          <div class="qp-prev-val text-sky"><strong>$${newT1.toFixed(2)}/kg</strong> (Margen: +$${(newBuyerPrice - newT1).toFixed(2)})</div>
        </div>
        <div class="qp-prev-col">
          <div class="qp-prev-lbl">BÁSCULA NIVEL 2 (16% Margen):</div>
          <div class="qp-prev-val text-emerald"><strong>$${newT2.toFixed(2)}/kg</strong> (Margen: +$${(newBuyerPrice - newT2).toFixed(2)})</div>
        </div>
        <div class="qp-prev-col">
          <div class="qp-prev-lbl">BÁSCULA NIVEL 3 (8% Margen):</div>
          <div class="qp-prev-val text-amber"><strong>$${newT3.toFixed(2)}/kg</strong> (Margen: +$${(newBuyerPrice - newT3).toFixed(2)})</div>
        </div>
      </div>
      <div class="qp-stock-impact ${stockImpact >= 0 ? 'bg-emerald-soft text-emerald' : 'bg-amber-soft text-amber'}">
        ⚖️ Revalorización de patio: 
        <strong>${stockImpact >= 0 ? '+' : ''}$${stockImpact.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</strong>
      </div>
    `;
  },

  applyQuickPriceChange() {
    const data = window.SIO_DATA;
    const select = document.getElementById('qpMaterialSelect');
    const input = document.getElementById('qpValueInput');
    if (!select || !input) return;

    const matId = select.value;
    const val = parseFloat(input.value) || 0;
    const isUp = this.quickPriceState.direction === 'up';
    const isAmount = this.quickPriceState.unit === 'amount';

    if (val <= 0) {
      alert('Por favor ingrese un valor de ajuste mayor a cero.');
      return;
    }

    if (matId === 'ALL') {
      data.materials.forEach(mat => {
        let newPrice = mat.buyerPrice;
        if (isAmount) {
          newPrice = isUp ? (mat.buyerPrice + val) : Math.max(0.1, mat.buyerPrice - val);
        } else {
          newPrice = isUp ? (mat.buyerPrice * (1 + (val / 100))) : Math.max(0.1, mat.buyerPrice * (1 - (val / 100)));
        }
        mat.buyerPrice = +newPrice.toFixed(2);
        mat.t1Price = +(newPrice * (1 - 0.28)).toFixed(2);
        mat.t2Price = +(newPrice * (1 - 0.16)).toFixed(2);
        mat.t3Price = +(newPrice * (1 - 0.08)).toFixed(2);
      });
      this.showToast(`⚡ Todos los metales han sido ${isUp ? 'aumentados' : 'reducidos'} exitosamente.`);
    } else {
      const mat = data.materials.find(m => m.id === matId);
      if (!mat) return;

      let newPrice = mat.buyerPrice;
      if (isAmount) {
        newPrice = isUp ? (mat.buyerPrice + val) : Math.max(0.1, mat.buyerPrice - val);
      } else {
        newPrice = isUp ? (mat.buyerPrice * (1 + (val / 100))) : Math.max(0.1, mat.buyerPrice * (1 - (val / 100)));
      }
      this.onBuyerPriceChange(matId, newPrice, 'Ajuste Rápido Web');
    }

    this.saveData();
    this.closeQuickPriceModal();
    this.renderPriceMatrix();
    this.renderKPIs();
    this.renderScaleForm();
    this.renderTVScreen();
    PnLEngine.render('daily');
    this.playSound('cash');
  },

  // 4. BOT DE TELEGRAM / WHATSAPP SIMULATOR
  renderTelegramBotMessages() {
    const container = document.getElementById('botChatContainer');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = data.botMessages.map(msg => `
      <div class="chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}">
        <div class="chat-header-info">
          <span>${msg.sender === 'user' ? '👤 Carlos (Administrador)' : '🤖 Brain Bot SIO'}</span>
          <span class="chat-time">${msg.time}</span>
        </div>
        <div class="chat-text">${msg.text}</div>
        ${msg.actions ? `
          <div class="chat-actions-row">
            ${msg.actions.map(act => `
              <button class="btn-chat-action" onclick="App.handleBotAction('${act.cmd}')">${act.label}</button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  },

  sendBotCommand() {
    const input = document.getElementById('botCommandInput');
    if (!input || !input.value.trim()) return;

    const raw = input.value.trim();
    const data = window.SIO_DATA;
    const timeNow = new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'});

    data.botMessages.push({
      id: `MSG-${Date.now()}`,
      sender: "user",
      time: timeNow,
      text: raw
    });

    input.value = '';
    this.renderTelegramBotMessages();
    this.playSound('beep');

    setTimeout(() => {
      this.processBotNLP(raw, timeNow);
    }, 600);
  },

  processBotNLP(cmd, timeNow) {
    const data = window.SIO_DATA;
    const lower = cmd.toLowerCase();

    if (lower.includes('cobre') && (lower.includes('+') || lower.includes('subir') || lower.includes('5'))) {
      const copper = data.materials.find(m => m.id === 'MAT-01');
      if (copper) {
        const newPrice = copper.buyerPrice + 5.0;
        this.onBuyerPriceChange('MAT-01', newPrice, 'Bot Telegram');
        data.botMessages.push({
          id: `MSG-${Date.now()}`,
          sender: "bot",
          time: timeNow,
          text: `✅ <strong>Comando Ejecutado:</strong> Cobre 1ra elevado a <strong>$${newPrice.toFixed(2)}/kg</strong> (+5.00). Báscula Nivel 1 actualizada a $${copper.t1Price.toFixed(2)} y Pantalla LED de Patio sincronizada.`
        });
      }
    } else if (lower.includes('acero') && (lower.includes('-') || lower.includes('bajar') || lower.includes('0.40') || lower.includes('0.50'))) {
      const steel = data.materials.find(m => m.id === 'MAT-03');
      if (steel) {
        const newPrice = 5.00;
        this.onBuyerPriceChange('MAT-03', newPrice, 'Bot WhatsApp');
        data.botMessages.push({
          id: `MSG-${Date.now()}`,
          sender: "bot",
          time: timeNow,
          text: `🛡️ <strong>Báscula Protegida:</strong> Acero Mixto ajustado a <strong>$5.00/kg</strong> (-0.40). El cajero ya no podrá liquidar al precio anterior.`
        });
      }
    } else if (lower.includes('status') || lower.includes('patio')) {
      const totalStock = data.materials.reduce((s, m) => s + m.currentStockKg, 0);
      data.botMessages.push({
        id: `MSG-${Date.now()}`,
        sender: "bot",
        time: timeNow,
        text: `📊 <strong>Status de Patio SIO:</strong> Stock Total: <strong>${(totalStock/1000).toFixed(1)} Ton</strong> | Efectivo en Caja Báscula: <strong>$${data.cashOnHand.toLocaleString('es-MX')} MXN</strong> | Pantalla LED: <strong>En línea</strong>.`
      });
    } else {
      data.botMessages.push({
        id: `MSG-${Date.now()}`,
        sender: "bot",
        time: timeNow,
        text: `🤖 <strong>Bot SIO:</strong> Comando recibido. Prueba con: <code>/precio cobre +5</code> o <code>/bajar acero 0.40</code>.`
      });
    }

    this.renderTelegramBotMessages();
    this.playSound('cash');
  },

  handleBotAction(cmd) {
    if (cmd === 'adjust_copper_up') {
      this.processBotNLP('subir cobre +5', new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'}));
    } else if (cmd === 'sync_protect') {
      this.processBotNLP('proteger bascula acero -0.40', new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'}));
    }
  },

  // 5. PANTALLA LED DE PATIO (TV MONITOR EN VIVO)
  renderTVScreen() {
    const container = document.getElementById('tvScreenContent');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = `
      <div class="tv-screen-board">
        <div class="tv-board-header">
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="tv-logo">♻️ SIO</div>
            <div>
              <h2 class="tv-title">PIZARRA OFICIAL DE COMPRA EN BÁSCULA</h2>
              <div class="tv-sub">RECICLADORA SIO • CEDES I AI • TIEMPO REAL</div>
            </div>
          </div>
          <div class="tv-live-badge">
            <span class="pulse-dot"></span> EN VIVO: ${new Date().toLocaleTimeString('es-MX')}
          </div>
        </div>

        <div class="tv-price-grid">
          ${data.materials.map(m => `
            <div class="tv-price-card" id="tv-card-${m.id}">
              <div class="tv-card-top">
                <span class="tv-mat-icon">${m.icon}</span>
                <span class="tv-mat-name">${m.name}</span>
              </div>
              <div class="tv-prices-row">
                <div class="tv-price-box">
                  <span class="tv-lbl">N1 (Menudeo):</span>
                  <span class="tv-price-val text-sky">$${m.t1Price.toFixed(2)}</span>
                </div>
                <div class="tv-price-box">
                  <span class="tv-lbl">N2 (Frecuente):</span>
                  <span class="tv-price-val text-emerald">$${m.t2Price.toFixed(2)}</span>
                </div>
                <div class="tv-price-box">
                  <span class="tv-lbl">N3 (Industrial):</span>
                  <span class="tv-price-val text-amber">$${m.t3Price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="tv-footer-ticker">
          ⚖️ PAGO INMEDIATO EN EFECTIVO • BÁSCULAS CALIBRADAS CERTIFICADAS • CONTROL AMBIENTAL CEDES
        </div>
      </div>
    `;
  },

  flashTVScreenUpdate(matName, newPrice) {
    const flashEl = document.getElementById('tvFlashBanner');
    if (flashEl) {
      flashEl.innerHTML = `⚡ <strong>PANTALLA DE PATIO ACTUALIZADA:</strong> ${matName} cotizando a $${newPrice.toFixed(2)}/kg`;
      flashEl.classList.add('active');
      setTimeout(() => {
        flashEl.classList.remove('active');
      }, 4000);
    }
  },

  // 6. ONBOARDING MODAL
  openOnboardingModal() {
    this.onboardingStep = 0;
    this.renderOnboardingCard();
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.pointerEvents = 'auto';
      modal.classList.add('active');
    }
  },

  closeOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      setTimeout(() => {
        if (!modal.classList.contains('active')) {
          modal.style.display = 'none';
        }
      }, 250);
    }
  },

  nextOnboardingCard() {
    if (this.onboardingStep < this.onboardingCards.length - 1) {
      this.onboardingStep++;
      this.renderOnboardingCard();
      this.playSound('beep');
    } else {
      this.closeOnboardingModal();
      this.playSound('cash');
      this.showToast('🚀 ¡Bienvenido a la demo interactiva de Recicladora SIO!');
    }
  },

  prevOnboardingCard() {
    if (this.onboardingStep > 0) {
      this.onboardingStep--;
      this.renderOnboardingCard();
      this.playSound('beep');
    }
  },

  renderOnboardingCard() {
    const card = this.onboardingCards[this.onboardingStep];
    const container = document.getElementById('onboardingCardContent');
    const dotsContainer = document.getElementById('onboardingDots');
    const btnNext = document.getElementById('btnNextOnboarding');
    const btnPrev = document.getElementById('btnPrevOnboarding');

    if (!container || !card) return;

    container.innerHTML = `
      <div class="onboarding-card-hero">
        <div class="onb-icon-wrap">${card.icon}</div>
        <span class="onb-badge">${card.badge}</span>
        <h3 class="onb-title">${card.title}</h3>
        <p class="onb-text">${card.text}</p>
        <div class="onb-benefit-box">${card.benefit}</div>
      </div>
    `;

    if (dotsContainer) {
      dotsContainer.innerHTML = this.onboardingCards.map((_, idx) => `
        <span class="onb-dot ${idx === this.onboardingStep ? 'active' : ''}" onclick="App.goToOnboardingStep(${idx})"></span>
      `).join('');
    }

    if (btnPrev) btnPrev.style.visibility = this.onboardingStep === 0 ? 'hidden' : 'visible';
    if (btnNext) btnNext.innerHTML = this.onboardingStep === this.onboardingCards.length - 1 ? '🚀 Entrar a la Demo' : 'Siguiente ➔';
  },

  goToOnboardingStep(step) {
    this.onboardingStep = step;
    this.renderOnboardingCard();
  },

  // 7. SIMULADOR DE LLAMADA SIDERÚRGICA
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
      message = '📞 Siderúrgica Monterrey: Cobre 1ra subió a $162.00/kg (+8.00). Precios en báscula y Pantalla LED sincronizados.';
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
    this.renderTVScreen();
    PnLEngine.render('daily');
    this.playSound('cash');
    this.showToast(message, 'success');
  },

  // 8. BÁSCULA DIGITAL
  startLiveScaleStream() {
    if (this.liveScaleInterval) clearInterval(this.liveScaleInterval);
    this.liveScaleInterval = setInterval(() => {
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
    const tare = +(gross * 0.08).toFixed(1);
    document.getElementById('scaleTareWeight').value = tare;
    this.updateScaleCalculations();
  },

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
          <div class="t-row"><span>PROVEEDOR:</span><strong>${ticket.supplierName}</strong></div>
          <div class="t-row"><span>TARIFA / NIVEL:</span><strong>${ticket.tier}</strong></div>
          <div class="t-row"><span>EQUIPO:</span><span>${ticket.scaleType}</span></div>
          <div class="ticket-divider">--------------------------------</div>
          <div class="t-row"><span>MATERIAL:</span><strong>${ticket.materialName}</strong></div>
          <div class="t-row"><span>PESO BRUTO:</span><span>${ticket.grossWeightKg.toFixed(1)} kg</span></div>
          <div class="t-row"><span>TARA:</span><span>${ticket.tareWeightKg.toFixed(1)} kg</span></div>
          <div class="t-row font-bold"><span>PESO NETO:</span><span class="text-sky">${ticket.netWeightKg.toFixed(1)} kg</span></div>
          <div class="t-row"><span>PRECIO/KG:</span><span>$${ticket.pricePerKg.toFixed(2)} MXN</span></div>
          <div class="ticket-divider">================================</div>
          <div class="t-row ticket-total-row">
            <span>TOTAL LIQUIDADO:</span>
            <strong class="text-emerald">$${ticket.totalPayout.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</strong>
          </div>
          <div class="ticket-status-badge">● PAGO EN EFECTIVO AUTORIZADO</div>
        </div>

        <div class="ticket-footer">
          <div>RECIBÍ DE CONFORMIDAD</div>
          <div class="ticket-sign-line"></div>
          <div style="font-size:0.65rem; color:#94a3b8; margin-top:6px;">
            SISTEMA DIGITAL SIO • VERIFICADO POR CEDES
          </div>
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

  // 9. GESTIÓN DE EMBARQUES
  openNewShipmentModal() {
    const modal = document.getElementById('newShipmentModal');
    const select = document.getElementById('shipmentMaterialSelect');
    const data = window.SIO_DATA;
    if (!modal || !select) return;

    select.innerHTML = data.materials.map(m => `
      <option value="${m.id}">
        ${m.icon} ${m.name} (Stock: ${(m.currentStockKg/1000).toFixed(1)} Ton • Venta: $${m.buyerPrice.toFixed(2)}/kg)
      </option>
    `).join('');

    modal.classList.add('active');
  },

  closeNewShipmentModal() {
    const modal = document.getElementById('newShipmentModal');
    if (modal) modal.classList.remove('active');
  },

  dispatchShipment() {
    const data = window.SIO_DATA;
    const select = document.getElementById('shipmentMaterialSelect');
    const tonsInput = document.getElementById('shipmentTonsInput');
    if (!select || !tonsInput) return;

    const matId = select.value;
    const tons = parseFloat(tonsInput.value) || 0;
    const kg = tons * 1000;

    if (tons <= 0) {
      alert('Ingrese un tonelaje válido.');
      return;
    }

    const mat = data.materials.find(m => m.id === matId);
    if (!mat) return;

    if (kg > mat.currentStockKg) {
      alert(`⚠️ Stock insuficiente en patio. Solo tienes ${(mat.currentStockKg/1000).toFixed(1)} Ton disponibles.`);
      return;
    }

    const totalRevenue = kg * mat.buyerPrice;
    const totalCost = kg * mat.avgCostPerKg;
    const freightCost = 4500.00;
    const grossProfit = totalRevenue - totalCost - freightCost;
    const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const newShipment = {
      folio: `EMB-SIO-${String(data.shipmentsToBuyer.length + 95).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      buyerName: data.buyerName,
      materialId: mat.id,
      materialName: mat.name,
      shippedKg: kg,
      salePricePerKg: mat.buyerPrice,
      totalRevenue: totalRevenue,
      avgCostPerKg: mat.avgCostPerKg,
      totalCost: totalCost,
      freightCost: freightCost,
      grossProfit: grossProfit,
      marginPct: marginPct,
      status: "EN_TRÁNSITO_AUTORIZADO"
    };

    mat.currentStockKg -= kg;
    data.shipmentsToBuyer.unshift(newShipment);

    this.saveData();
    this.closeNewShipmentModal();
    this.renderKPIs();
    this.renderShipments();
    PnLEngine.render('daily');
    this.playSound('cash');
    this.showToast(`🚚 Góndola ${newShipment.folio} despachada a Siderúrgica: +$${grossProfit.toLocaleString('es-MX', {maximumFractionDigits: 0})} Ganancia`);
  },

  renderShipments() {
    const container = document.getElementById('shipmentsTableBody');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = data.shipmentsToBuyer.map(s => `
      <tr>
        <td><strong>${s.folio}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${s.date}</span></td>
        <td>${s.buyerName}</td>
        <td>${s.materialName}</td>
        <td><strong>${(s.shippedKg / 1000).toFixed(1)} Ton</strong> (${s.shippedKg.toLocaleString()} kg)</td>
        <td>$${s.salePricePerKg.toFixed(2)}/kg</td>
        <td class="text-emerald font-mono">$${s.totalRevenue.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
        <td class="text-right font-mono font-bold ${s.grossProfit >= 0 ? 'text-neon-green' : 'text-danger'}">
          +$${s.grossProfit.toLocaleString('es-MX', {minimumFractionDigits: 2})}
          <div style="font-size:0.68rem; color:#94a3b8;">Margen: ${s.marginPct.toFixed(1)}%</div>
        </td>
        <td><span class="badge ${s.status.includes('PAGADO') ? 'badge-success' : 'badge-warning'}">${s.status}</span></td>
      </tr>
    `).join('');
  },

  renderRecentWeighings() {
    const container = document.getElementById('recentWeighingsTableBody');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = data.recentWeighings.map(w => `
      <tr>
        <td><strong>${w.folio}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${w.timestamp}</span></td>
        <td>${w.supplierName} <span class="badge badge-tier">${w.tier}</span></td>
        <td>${w.materialName}</td>
        <td><strong>${w.netWeightKg.toFixed(1)} kg</strong> <span style="font-size:0.68rem; color:#94a3b8;">(B: ${w.grossWeightKg} | T: ${w.tareWeightKg})</span></td>
        <td>$${w.pricePerKg.toFixed(2)}/kg</td>
        <td class="text-right font-mono font-bold text-emerald">$${w.totalPayout.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
        <td class="text-center">
          <button class="btn-sm-print" onclick="App.openTicketModal(${JSON.stringify(w).replace(/"/g, '&quot;')})">🖨️ Ver</button>
        </td>
      </tr>
    `).join('');
  },

  renderAIInsights() {
    const container = document.getElementById('aiInsightsContainer');
    if (!container) return;
    const insights = BrainAIEngine.generateInsights();

    container.innerHTML = `
      <div class="ai-insights-grid">
        ${insights.map(item => `
          <div class="ai-card" style="border-left: 4px solid ${item.color};">
            <div class="ai-card-header">
              <h4 style="color:#fff; font-size:0.95rem;">${item.title}</h4>
              <span class="badge" style="background:${item.color}22; color:${item.color}; border: 1px solid ${item.color};">${item.badge}</span>
            </div>
            <p style="font-size:0.83rem; color:#cbd5e1; margin-top:8px; line-height:1.4;">${item.text}</p>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderProviderPortal() {
    const container = document.getElementById('providerPortalContent');
    if (!container) return;
    const data = window.SIO_DATA;

    container.innerHTML = `
      <div class="provider-hero">
        <div class="provider-badge">♻️ CENTRO DE ACOPIO SIO • TARIFAS VIGENTES</div>
        <h2>Precios de Compra de Metales al Recolector</h2>
        <p>Precios oficiales por kilogramo actualizados al instante con báscula calibrada y pago en efectivo inmediato.</p>
      </div>

      <div class="provider-matrix-grid">
        ${data.materials.map(m => `
          <div class="provider-card">
            <div class="provider-card-header">
              <span class="provider-icon">${m.icon}</span>
              <div>
                <h4 class="provider-mat-name">${m.name}</h4>
                <div class="provider-cat">${m.category}</div>
              </div>
            </div>
            <div class="provider-price-tag">
              <div class="p-lbl">PAGO EN BÁSCULA:</div>
              <div class="p-val">$${m.t1Price.toFixed(2)} <span style="font-size:0.8rem; color:#94a3b8;">/ ${m.unit}</span></div>
            </div>
            <div class="provider-tier-desc">
              Tarifa Menudeo (Nivel 1). Para lotes industriales (>1 Ton) consulta precio preferencial de hasta <strong>$${m.t3Price.toFixed(2)}/kg</strong>.
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('appToast');
    if (!toast) return;
    toast.innerHTML = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4500);
  },

  saveData() {
    localStorage.setItem('SIO_DEMO_DATA', JSON.stringify(window.SIO_DATA));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

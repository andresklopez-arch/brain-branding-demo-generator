// ── READ SESSION DATA ──
const bizName = sessionStorage.getItem('sim_biz_name');
const bizSector = sessionStorage.getItem('sim_biz_sector');
const bizProblem = sessionStorage.getItem('sim_biz_problem');
let bizLogo = sessionStorage.getItem('sim_biz_logo');
const activeService = sessionStorage.getItem('sim_active_service') || 'asistente';

// Redirect if no data
if (!bizName || !bizSector || !bizProblem) {
  window.location.href = '/';
}

// ── AUTOGENERATE LOGO IF EMPTY ──
if (!bizLogo) {
  bizLogo = generateAvatar(bizName);
  sessionStorage.setItem('sim_biz_logo', bizLogo);
}

function generateAvatar(name) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'BB';
  const colors = [
    ['#a855f7', '#ec4899'],
    ['#10b981', '#059669'],
    ['#0ea5e9', '#0284c7']
  ];
  const grad = colors[name.length % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${grad[0]}" />
        <stop offset="100%" stop-color="${grad[1]}" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#avatar-grad)" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="34" fill="#ffffff">${initials}</text>
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

// ── INACTIVITY TIMER (15 MINUTES) ──
let timeLeft = 15 * 60; // 900 seconds
const timerEl = document.getElementById('countdown-timer');

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  
  if (timeLeft <= 0) {
    destroySession();
  } else {
    timeLeft--;
  }
}
const timerInterval = setInterval(updateTimer, 1000);

// Reset timer on user activity
function resetTimer() {
  timeLeft = 15 * 60;
}
['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
  window.addEventListener(evt, resetTimer, { passive: true });
});

function destroySession() {
  clearInterval(timerInterval);
  sessionStorage.clear();
  localStorage.clear();
  
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
  if (confirm('¿Seguro que deseas destruir la sesión de simulación y todos los datos asociados inmediatamente?')) {
    destroySession();
  }
});

// ── TERMINAL LOGS INITIALIZATION ──
const terminal = document.getElementById('terminal-logs');
const logs = [
  `[BOOT] Inicializando simulador personalizado para ${bizName}...`,
  `[COGNITIVE] Analizando sector comercial: ${bizSector}...`,
  `[DIAGNOSTIC] Analizando problemática declarada: "${bizProblem}"...`,
  `[OPTIMIZER] Generando reglas automatizadas IA...`,
  `[SUCCESS] Simulación multiprograma compilada con éxito. Iniciando sandbox.`
];

let logIndex = 0;
function printLog() {
  if (logIndex < logs.length) {
    const div = document.createElement('div');
    div.textContent = logs[logIndex];
    terminal.appendChild(div);
    logIndex++;
    setTimeout(printLog, 600);
  } else {
    setTimeout(() => {
      document.getElementById('sim-loader').style.display = 'none';
      document.getElementById('sim-dashboard').style.display = 'flex';
      initTabs();
      initMockups();
    }, 600);
  }
}
printLog();

// ── TAB SYSTEM ──
function initTabs() {
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  // Set initial active tab
  tabLinks.forEach(link => {
    if (link.getAttribute('data-tab') === activeService) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  tabPanels.forEach(panel => {
    if (panel.id === `panel-${activeService}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      tabLinks.forEach(l => l.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(`panel-${tabId}`).classList.add('active');
    });
  });
}

// ── INITIALIZE DATA IN MOCKUPS ──
function initMockups() {
  // Update names
  document.querySelectorAll('.biz-name').forEach(el => el.textContent = bizName);
  document.querySelectorAll('.biz-sector').forEach(el => el.textContent = bizSector);
  
  // Inject Logos
  document.querySelectorAll('.business-logo-container').forEach(el => {
    el.innerHTML = `<img src="${bizLogo}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">`;
  });

  // Setup dynamic URLs
  const cleanUrl = bizName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com.mx';
  document.getElementById('mock-browser-url').textContent = `https://www.${cleanUrl}`;

  // 1. WhatsApp Chat Init
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  addChatMessage('incoming', `Hola! Me gustaría cotizar un servicio y saber sus horarios. ¿Cuáles son las ventajas de contratarlos?`);
  setTimeout(() => {
    addChatMessage('outgoing', `¡Hola! Un gusto saludarte. En **${bizName}** te atendemos de inmediato de forma automatizada.\n\nPara tu sector (${bizSector}), optimizamos las operaciones. De manera específica, nuestra solución soluciona de raíz tu problema: *"${bizProblem}"*, ahorrándote tiempo administrativo y evitando descuidos. ¿Te gustaría agendar una llamada con un asesor humano?`);
  }, 1000);

  // 2. POS Grid Init
  initPOSProducts();

  // 3. Mini Web Slogan
  let webSlogan = `Optimizamos los procesos comerciales de ${bizName} y solucionamos tus problemas de ${bizProblem} con software inteligente a la medida.`;
  if (bizSector.includes('Restaurante')) {
    webSlogan = `El sabor, la calidez y el servicio que te definen en ${bizName}, potenciados por un sistema de caja y comandas inteligente.`;
  } else if (bizSector.includes('Comercio')) {
    webSlogan = `Explora y compra lo mejor de ${bizName} de forma ágil. Administramos inventario en tiempo real para brindarte el mejor stock.`;
  }
  document.getElementById('mock-web-slogan').textContent = webSlogan;

  // 4. ERP Workflow Problem Description
  document.getElementById('erp-bottleneck-desc').textContent = `Cuello de botella: "${bizProblem}"`;

  // Update final WhatsApp link
  updateWhatsAppLink();
}

// ── MOCKUP A: CHAT CONTROLLER ──
function addChatMessage(sender, text) {
  const chatMessages = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  // Format text with bold
  const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  bubble.innerHTML = `
    <div>${formattedText}</div>
    <span class="chat-time">${time} ${sender === 'outgoing' ? '✓✓' : ''}</span>
  `;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
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

  // Show typing response
  setTimeout(() => {
    // Generate AI dynamic reply
    let reply = `Hemos recibido tu consulta sobre *"${text}"* en **${bizName}**. Nuestro motor de IA procesa esta información y está listo para canalizarla. ¿Deseas cotizar este módulo con uno de nuestros ingenieros de software?`;
    addChatMessage('outgoing', reply);
  }, 1200);
}

document.querySelectorAll('.sample-msg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-msg');
    addChatMessage('incoming', text);
    setTimeout(() => {
      let reply = "";
      if (text.includes('Precios')) {
        reply = `En **${bizName}** ofrecemos soluciones modulares a la medida de tu sector (${bizSector}). Al automatizar tu problema: *"${bizProblem}"*, reduces mermas y costos operativos desde el primer mes. ¿Te gustaría recibir una llamada de presupuesto?`;
      } else if (text.includes('Cita')) {
        reply = `Entendido. Registramos solicitud de atención técnica para tu negocio. El Asistente IA de **${bizName}** consultará disponibilidad y enviará recordatorio automático.`;
      } else {
        reply = `Lamentamos el inconveniente. Tu reporte ha sido indexado y catalogado por el motor IA de **${bizName}** para asignación inmediata.`;
      }
      addChatMessage('outgoing', reply);
    }, 1200);
  });
});

// ── MOCKUP B: POS CONTROLLER ──
let posCart = [];

function initPOSProducts() {
  const grid = document.getElementById('pos-products-grid');
  grid.innerHTML = '';
  
  let products = [];
  if (bizSector.includes('Restaurante')) {
    products = [
      { id: 1, icon: '☕', name: 'Café Capuccino', price: 55 },
      { id: 2, icon: '🍰', name: 'Pastel de Chocolate', price: 75 },
      { id: 3, icon: '🍳', name: 'Desayuno Completo', price: 145 },
      { id: 4, icon: '🍹', name: 'Bebida Artesanal', price: 60 },
      { id: 5, icon: '🥐', name: 'Pan Horneado', price: 35 },
      { id: 6, icon: '🍔', name: 'Hamburguesa Especial', price: 180 }
    ];
  } else if (bizSector.includes('Comercio')) {
    products = [
      { id: 1, icon: '👕', name: 'Prenda de Moda', price: 350 },
      { id: 2, icon: '👟', name: 'Calzado Deportivo', price: 1200 },
      { id: 3, icon: '🎒', name: 'Accesorio / Mochila', price: 450 },
      { id: 4, icon: '🕶️', name: 'Lentes Premium', price: 750 },
      { id: 5, icon: '⌚', name: 'Reloj Inteligente', price: 1800 },
      { id: 6, icon: '👜', name: 'Bolso de Mano', price: 950 }
    ];
  } else {
    products = [
      { id: 1, icon: '💼', name: 'Servicio Estándar', price: 450 },
      { id: 2, icon: '📈', name: 'Suscripción Mensual', price: 950 },
      { id: 3, icon: '🧠', name: 'Asesoría Técnica', price: 1200 },
      { id: 4, icon: '🛠️', name: 'Mantenimiento Correctivo', price: 850 },
      { id: 5, icon: '📦', name: 'Kit Básico Insumos', price: 650 },
      { id: 6, icon: '📑', name: 'Consultoría Integral', price: 3200 }
    ];
  }

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

function addProductToCart(product) {
  const existing = posCart.find(item => item.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    posCart.push({ ...product, qty: 1 });
  }
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

  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  document.getElementById('pos-subtotal').textContent = `$${subtotal.toFixed(2)} MXN`;
  document.getElementById('pos-iva').textContent = `$${iva.toFixed(2)} MXN`;
  document.getElementById('pos-total').textContent = `$${total.toFixed(2)} MXN`;
}

document.getElementById('clear-cart-btn').addEventListener('click', () => {
  posCart = [];
  renderCart();
});

document.getElementById('checkout-pos-btn').addEventListener('click', () => {
  if (posCart.length === 0) {
    alert('El carrito está vacío. Agrega productos haciendo clic en ellos.');
    return;
  }

  // Trigger Confetti!
  if (typeof confetti === 'function') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }

  alert(`💰 Cobro Exitoso para ${bizName}\n` +
        `-----------------------------------------\n` +
        `Total de Venta: $${(posCart.reduce((acc, item) => acc + (item.price * item.qty), 0) * 1.16).toFixed(2)} MXN\n` +
        `Facturación automática enviada por API SAT con Inteligencia Artificial.`);
  posCart = [];
  renderCart();
});

// ── MOCKUP C: WEBSITE CONTROLLER ──
document.querySelectorAll('.web-color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.web-color-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = 'rgba(255,255,255,0.05)';
      b.style.borderColor = 'rgba(255,255,255,0.1)';
    });
    btn.classList.add('active');
    
    const theme = btn.getAttribute('data-theme');
    const preview = document.getElementById('mock-web-preview');
    preview.className = `theme-${theme}`;

    if (theme === 'ciberpunk') {
      btn.style.background = 'rgba(168, 85, 247, 0.15)';
      btn.style.borderColor = 'rgba(168, 85, 247, 0.4)';
    } else if (theme === 'emerald') {
      btn.style.background = 'rgba(16, 185, 129, 0.15)';
      btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else if (theme === 'sky') {
      btn.style.background = 'rgba(14, 165, 233, 0.15)';
      btn.style.borderColor = 'rgba(14, 165, 233, 0.4)';
    }
  });
});

// ── MOCKUP D: ERP CONTROLLER ──
document.getElementById('erp-optimize-toggle').addEventListener('change', (e) => {
  const node = document.getElementById('erp-bottleneck-node');
  const statusVal = document.getElementById('erp-status-val');
  const timeVal = document.getElementById('erp-time-val');

  if (e.target.checked) {
    node.className = 'flow-node success';
    node.innerHTML = `
      ✅ Flujo Optimizado por IA
      <div style="font-size: 11px; font-weight: 500; opacity: 0.8; margin-top: 4px;">Reglas de negocio aplicadas</div>
    `;
    statusVal.textContent = '🟢 Prototipo Óptimo (100% Eficiente)';
    statusVal.style.color = '#10b981';
    timeVal.textContent = '24 horas / semana';
    timeVal.style.color = '#10b981';
    
    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 40 });
    }
  } else {
    node.className = 'flow-node error';
    node.innerHTML = `
      ❌ Cuello de Botella Operativo
      <div id="erp-bottleneck-desc" style="font-size: 11px; font-weight: 500; opacity: 0.8; margin-top: 4px;">Cuello de botella: "${bizProblem}"</div>
    `;
    statusVal.textContent = '⚠️ Ineficiencias Detectadas';
    statusVal.style.color = '#ef4444';
    timeVal.textContent = '0 horas/semana';
    timeVal.style.color = '#fff';
  }
});

// ── WHATSAPP CONVERSION MESSAGE ──
function updateWhatsAppLink() {
  const phone = '525638165507';
  const text = `Hola Brain Branding, acabo de realizar la simulación de IA para mi negocio *${bizName}* (Giro: ${bizSector}). Mi problema principal es: *"${bizProblem}"*. Me interesa cotizar una implementación real de estos sistemas para mi empresa.`;
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  
  document.getElementById('whatsapp-implement-btn').setAttribute('href', url);
}

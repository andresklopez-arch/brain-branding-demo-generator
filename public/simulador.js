// ── READ SESSION DATA ──
const bizName = sessionStorage.getItem('sim_biz_name');
const bizSector = sessionStorage.getItem('sim_biz_sector');
const bizProblem = sessionStorage.getItem('sim_biz_problem');
let bizLogo = sessionStorage.getItem('sim_biz_logo');
const activeService = sessionStorage.getItem('sim_active_service') || 'asistente';

// Redirect if no data
if (!bizName || !bizSector || !bizProblem) {
  window.location.href = '/';
  throw new Error("No session data found. Redirecting to root...");
}

// ── AUTOGENERATE LOGO IF EMPTY ──
if (!bizLogo) {
  bizLogo = generateAvatar(bizName);
  sessionStorage.setItem('sim_biz_logo', bizLogo);
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

  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      tabLinks.forEach(l => l.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(`panel-${tabId}`).classList.add('active');
      
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
    erpOptimizeDesc: "Pedidos directo a cocina desde tablet. Reduce el tiempo de entrega un 35% y elimina mermas por errores."
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
    erpOptimizeDesc: "Stock sincronizado automáticamente en web, POS y almacén. Reduce faltantes de stock un 40%."
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
    erpOptimizeDesc: "Cotizaciones en PDF autogeneradas y firma electrónica instantánea. Reduce el ciclo de venta en un 50%."
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
    erpOptimizeDesc: "Confirmaciones automáticas vía WhatsApp integradas a la agenda. Reduce ausentismo en un 45%."
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
    erpOptimizeDesc: "Cargos recurrentes con recordatorios de pago automáticos vía WhatsApp. Disminuye cartera vencida en un 60%."
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
    erpOptimizeDesc: "Mapeo automático de preferencias del cliente con fichas en PDF enviadas de inmediato. Agiliza cierres en un 40%."
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
    erpOptimizeDesc: "Generación automática de órdenes de producción basadas en inventarios y ventas. Reduce retrasos un 30%."
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
    erpOptimizeDesc: "Robotización de flujos de trabajo administrativos. Ahorra hasta 20 horas semanales de trabajo manual."
  }
};

function getSectorProfile(sector) {
  if (!sector) return sectorProfiles.otro;
  const norm = sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("restaurante") || norm.includes("cafe") || norm.includes("comida") || norm.includes("bistro") || norm.includes("alimento")) {
    return sectorProfiles.restaurante;
  } else if (norm.includes("tienda") || norm.includes("comercio") || norm.includes("retail") || norm.includes("ropa") || norm.includes("ventas") || norm.includes("boutique") || norm.includes("supermercado")) {
    return sectorProfiles.comercio;
  } else if (norm.includes("servicio") || norm.includes("consultor") || norm.includes("abogado") || norm.includes("despacho") || norm.includes("oficina") || norm.includes("agencia") || norm.includes("asesor")) {
    return sectorProfiles.servicios;
  } else if (norm.includes("salud") || norm.includes("clinica") || norm.includes("doctor") || norm.includes("dentista") || norm.includes("medico") || norm.includes("hospital") || norm.includes("odontol")) {
    return sectorProfiles.salud;
  } else if (norm.includes("educacion") || norm.includes("curso") || norm.includes("escuela") || norm.includes("academia") || norm.includes("colegio") || norm.includes("clase")) {
    return sectorProfiles.educacion;
  } else if (norm.includes("inmobiliaria") || norm.includes("raices") || norm.includes("casa") || norm.includes("departamento") || norm.includes("inmueble") || norm.includes("terreno")) {
    return sectorProfiles.inmobiliaria;
  } else if (norm.includes("manufactura") || norm.includes("distribucion") || norm.includes("fabrica") || norm.includes("almacen") || norm.includes("logistica") || norm.includes("produccion")) {
    return sectorProfiles.manufactura;
  } else {
    return sectorProfiles.otro;
  }
}

// Global reference to active profile
const profile = getSectorProfile(bizSector);

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

  // 2. POS Grid Init
  initPOSProducts();

  // 3. Mini Web Title & Slogan
  document.getElementById('mock-web-title').textContent = profile.webTitle;
  document.getElementById('mock-web-slogan').textContent = profile.webSlogan;

  // 4. ERP Workflow Problem Description
  document.getElementById('erp-bottleneck-desc').textContent = `Cuello de botella: ${profile.erpBottleneck}`;

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
        reply = `En **${bizName}** ofrecemos soluciones modulares a la medida. Al automatizar tu problema principal: *"${profile.erpBottleneck}"*, reduces costos operativos e ineficiencias desde el primer mes. ¿Te gustaría recibir una llamada de presupuesto?`;
      } else if (text.includes('Cita')) {
        reply = `Entendido. Registramos tu solicitud de agendamiento para tu negocio. El Asistente IA de **${bizName}** consultará la disponibilidad en la agenda de tu sector (${profile.logoName}) y enviará confirmación automática por WhatsApp en unos momentos.`;
      } else {
        reply = `Tu reporte técnico ha sido indexado y catalogado por el motor IA de **${bizName}** para asignación y resolución inmediata.`;
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
      ${profile.erpOptimizeNode}
      <div style="font-size: 11px; font-weight: 500; opacity: 0.8; margin-top: 4px;">${profile.erpOptimizeDesc}</div>
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
      <div id="erp-bottleneck-desc" style="font-size: 11px; font-weight: 500; opacity: 0.8; margin-top: 4px;">Cuello de botella: "${profile.erpBottleneck}"</div>
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

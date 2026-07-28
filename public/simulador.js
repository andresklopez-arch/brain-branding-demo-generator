// ── READ SESSION DATA ──
const bizName = sessionStorage.getItem('sim_biz_name');
const bizSector = sessionStorage.getItem('sim_biz_sector');
const bizProblem = sessionStorage.getItem('sim_biz_problem');
const bizStyle = sessionStorage.getItem('sim_biz_style') || 'ultra-moderno';
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
}

function completeProfileData(prof, sectorName, bizName) {
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
const profile = getSectorProfile(bizSector);
completeProfileData(profile, bizSector, bizName);

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

  // Initialize Website Theme based on user choice
  applyWebTheme(bizStyle);

  // 3.5 AI Advisor Card
  document.getElementById('ai-advisor-advice').textContent = profile.aiAdvice;

  // 4. ERP Workflow Problem Description
  document.getElementById('erp-bottleneck-desc').textContent = `Cuello de botella: ${profile.erpBottleneck}`;

  // Hydrate high fidelity sub-simulators
  initPOSInventory();
  initWebData();
  startWebCountdown();
  updateERPPL();

  // Update final WhatsApp link
  updateWhatsAppLink();
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
document.getElementById('slider-temp').addEventListener('input', (e) => {
  document.getElementById('val-temp').textContent = e.target.value;
  memoryVariables.style_applied = bizStyle;
});
document.getElementById('slider-tokens').addEventListener('input', (e) => {
  document.getElementById('val-tokens').textContent = e.target.value;
});

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

function addChatMessage(sender, text) {
  const chatMessages = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (text.startsWith('[PAYMENT_CARD]')) {
    const parts = text.split('|');
    const title = parts[1] || 'Pago de Servicio';
    const desc = parts[2] || 'Código de transacción único';
    const amount = parts[3] || '$0.00 MXN';
    bubble.style.background = 'transparent';
    bubble.style.border = 'none';
    bubble.style.padding = '0';
    bubble.innerHTML = `
      <div class="glass-card" style="padding: 15px; border-radius: 12px; border: 1px solid rgba(52, 211, 153, 0.4); display: flex; flex-direction: column; gap: 8px; width: 240px; background: rgba(16, 185, 129, 0.08); box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: left;">
        <span style="font-size: 10px; text-transform: uppercase; color: #34d399; font-weight: bold; letter-spacing: 0.5px;">💳 Enlace de Pago Seguro (IA)</span>
        <strong style="font-size: 13.5px; color: #fff;">${title}</strong>
        <span style="font-size: 11px; color: var(--text-muted);">${desc}</span>
        <span style="font-size: 15px; font-weight: 800; color: #34d399; margin-top: 4px;">${amount}</span>
        <button onclick="alert('💰 Pago Simulado Exitoso. El Asistente IA de ${bizName} ha timbrado la factura SAT automática en el ERP corporativo.'); console.log('Payment executed');" style="width: 100%; padding: 8px; border-radius: 6px; background: #10b981; border: none; color: #fff; font-size: 11.5px; font-weight: bold; cursor: pointer; margin-top: 5px; font-family: inherit;">Pagar con Stripe</button>
      </div>
      <span class="chat-time" style="display:block; margin-top: 4px;">${time} ✓✓</span>
    `;
  } else {
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
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
    
    if (activeAgent === 'ventas') {
      printToolLog(`Ejecutando herramienta query_pricing_database()...`);
      if (text.toLowerCase().match(/(precio|costo|cuanto cuesta|pagar|comprar|servicio|cotiza)/)) {
        reply = `[PAYMENT_CARD]|Servicio de ${bizSector}|Cotización de servicio a la medida para solucionar ${bizProblem}|${profile.posProducts[1] ? '$' + profile.posProducts[1].price + '.00 MXN' : '$1,500.00 MXN'}`;
      } else {
        reply = `Hola, como Agente de Ventas de **${bizName}**, te comento que podemos solucionar tu problema de *"${bizProblem}"* implementando un flujo digital optimizado con IA. ¿Deseas que te genere un link de pago con tu cotización?`;
      }
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
    
    // Update memory
    memoryVariables.sentiment = document.getElementById('chat-sentiment').textContent.split(' ')[1] || "Neutro";
    memoryVariables.last_intent = text.toLowerCase().match(/(precio|costo|cuanto cuesta|pagar|comprar|servicio|cotiza)/) ? "ventas_cotizacion" : "consulta_general";
    
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
document.getElementById('human-transfer-btn').addEventListener('click', () => {
  printToolLog(`FORZANDO INTERVENCIÓN HUMANA...`);
  printToolLog(`Compilando resumen contextual de conversación...`);
  
  const summary = `Cliente consulta sobre el sector ${bizSector} para el negocio "${bizName}" con problema "${bizProblem}". Sentimiento actual: ${document.getElementById('chat-sentiment').textContent}`;
  printToolLog(`Enviando resumen al operador: "${summary.substring(0, 45)}..."`);
  
  alert(`🚨 Conversación transferida con éxito.\nUn operador humano se conectará de inmediato.\n\nResumen enviado por IA al operador:\n"${summary}"`);
});

// Selector changes agent logs
document.getElementById('agent-type-select').addEventListener('change', (e) => {
  printToolLog(`[COGNITIVE] Cambiando a perfil: "${e.target.options[e.target.selectedIndex].text}"`);
  printToolLog(`[COGNITIVE] Inicializando sub-agentes y recargando base de conocimiento...`);
  memoryVariables.active_agent_profile = e.target.value;
  document.getElementById('agent-memory-inspector').textContent = JSON.stringify(memoryVariables, null, 2);
});

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
  
  document.getElementById('erp-pl-revenue').textContent = `$${totalRev.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  document.getElementById('erp-pl-cogs').textContent = `$${totalCOGS.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  document.getElementById('erp-pl-gross').textContent = `$${gross.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  document.getElementById('erp-pl-expenses').textContent = `$${expenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  document.getElementById('erp-pl-taxes').textContent = `$${taxes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  
  const netEl = document.getElementById('erp-pl-net');
  netEl.textContent = `$${net.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  if (net < 0) {
    netEl.style.color = '#ef4444';
  } else {
    netEl.style.color = '#10b981';
  }

  // Update Sales Trend Chart July bar (scaled dynamically)
  const julyTotalK = totalRev / 1000;
  // Scale bar height: let max 25k represent 80px
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

// ── UPDATE IA ADVICE BY TAB ──
function updateAIAdvice(tabId) {
  // Obsoleted
}

// ── AUTONOMOUS PERSONAL ASSISTANT DEMO ENGINE ──
let assistantAutoInterval = null;
let assistantStepIndex = 0;
let isSimulationPaused = false;
let userResumeTimeout = null;

const assistantScenarios = [
  {
    title: "Atendiendo Cliente (Ventas)",
    channel: "whatsapp",
    logs: [
      "[NLP] Detectando intención del usuario: 'Consulta de precios'...",
      "[DB] query_pricing_database(sector: '" + bizSector + "')",
      "[Stripe_API] Generando link de pago dinámico seguro..."
    ],
    incoming: "Hola! ¿Cuáles son los precios de sus servicios y formas de pago para mi negocio?",
    outgoing: "[PAYMENT_CARD]|Servicio de " + bizSector + "|Cotización de servicio a la medida para solucionar " + bizProblem + "|" + (profile.posProducts[1] ? '$' + profile.posProducts[1].price + '.00 MXN' : '$1,500.00 MXN'),
    vars: { last_intent: "cotizacion_precios", active_channel: "whatsapp", client_status: "Interesado" }
  },
  {
    title: "Organizando Correos Entrantes",
    channel: "widget",
    logs: [
      "[RPA] Buscando correos no leídos en Inbox corporativo...",
      "[OCR_Engine] Procesando archivo adjunto 'factura_proveedor.pdf'...",
      "[ERP_API] Insertar cuenta por pagar en base de datos contable..."
    ],
    incoming: "📩 [SISTEMA: CORREO] Entrada de correo de proveedora@almacen.com con asunto: 'Factura pendiente de pago y actualización de stock'.",
    outgoing: "✅ **Acción Autónoma**: Recibí el correo de tu proveedor, extraje los datos de la factura e indexé la cuenta por pagar en tu ERP contable. También redacté un correo de confirmación de trámite en tus borradores.",
    vars: { last_intent: "organizar_correos", active_channel: "widget", accounts_payable: "actualizado" }
  },
  {
    title: "Reporte de Datos Financieros",
    channel: "messenger",
    logs: [
      "[SQL] query_sales_records(branch: 'all', date: 'yesterday')",
      "[NLP] Formateando resumen de desempeño operativo para chat..."
    ],
    incoming: "Hola, ¿me das las estadísticas de ventas generales de ayer?",
    outgoing: "Aquí tienes el reporte de ayer para **" + bizName + "**:\n📈 **Ventas Totales**: $14,850.00 MXN (+12% vs promedio)\n💳 **Tarjeta**: 65% | 💵 **Efectivo**: 35%\n🏆 **Producto más vendido**: Insumo Premium.\n*Estado de Resultados del ERP totalmente sincronizado.*",
    vars: { last_intent: "reporte_ventas", active_channel: "messenger", sales_trend: "positivo" }
  },
  {
    title: "Recordatorios de Citas Urgentes",
    channel: "whatsapp",
    logs: [
      "[Calendar] check_meeting_details(id: 'inv-903')",
      "[Google_Maps_API] Buscando tráfico a Paseo de la Reforma 405...",
      "[RPA] Solicitando Uber ejecutivo de forma automática..."
    ],
    incoming: "📅 [CALENDARIO] Recordatorio: Junta de negocios clave en 15 minutos con cliente corporativo.",
    outgoing: "🔔 **Recordatorio**: Tienes la junta de negocios en 15 minutos. El tráfico es moderado. He abierto los documentos de presentación en tu laptop y solicité un Uber para tu traslado. ¡Buen viaje!",
    vars: { last_intent: "recordatorio_citas", active_channel: "whatsapp", uber_requested: true }
  },
  {
    title: "Resumen de Minuta de Junta",
    channel: "widget",
    logs: [
      "[SpeechToText] Procesando audio 'minuta_planeacion.wav' con Whisper...",
      "[NLP] Extrayendo puntos de acuerdo y asignando responsables..."
    ],
    incoming: "🎙️ [SISTEMA: AUDIO] Procesar minuta de la junta de planeación mensual finalizada (12 min).",
    outgoing: "📝 **Resumen de Junta Procesado**:\n• **Acuerdo 1**: Automatizar stock en POS (Responsable: Sistemas).\n• **Acuerdo 2**: Lanzar campaña de marketing Web (Responsable: Ventas).\n*Minuta guardada en la base de conocimiento de " + bizName + ".*",
    vars: { last_intent: "resumen_junta", active_channel: "widget", knowledge_base: "actualizada" }
  },
  {
    title: "Agendando Llamadas en Calendario",
    channel: "messenger",
    logs: [
      "[Calendar] search_free_slots(date: 'tomorrow', duration: '30m')",
      "[Calendar_API] insert_event(title: 'Llamada Técnica - " + bizName + "')"
    ],
    incoming: "Hola, ¿tienen espacio mañana para una llamada técnica de soporte?",
    outgoing: "Entendido. He agendado la llamada técnica para mañana a las 4:30 PM en el espacio libre de tu Google Calendar. He enviado la invitación por correo electrónico al cliente.",
    vars: { last_intent: "agendar_llamada", active_channel: "messenger", calendar_synced: true }
  },
  {
    title: "Llamadas y Buzón de Voz",
    channel: "whatsapp",
    logs: [
      "[SpeechToText] Transcribiendo mensaje de voz entrante...",
      "[NLP] Clasificando sentimiento del mensaje: 'Satisfecho'..."
    ],
    incoming: "📞 [SISTEMA: BUZÓN] Mensaje de voz entrante de Cliente Satisfecho (0:45s).",
    outgoing: "📞 **Buzón de Voz Transcrito**: El cliente llamó para felicitarlos por el gran servicio y consultar horarios. Le envié un WhatsApp automatizado con los horarios del fin de semana.",
    vars: { last_intent: "buzon_voz", active_channel: "whatsapp", client_sentiment: "Feliz" }
  },
  {
    title: "Conciliación de Hojas de Excel",
    channel: "widget",
    logs: [
      "[Excel] parse_csv_rows('conciliaciones_bancarias.csv')...",
      "[ERP_API] Comparando movimientos bancarios contra facturas...",
      "[IA_AUDIT] Buscando discrepancias fiscales..."
    ],
    incoming: "📊 [SISTEMA: EXCEL] Archivo 'conciliaciones_bancarias.csv' cargado en la nube corporativa.",
    outgoing: "📊 **Análisis Contable**: Procesé 140 transacciones de Excel. Encontré 1 discrepancia de $120.00 MXN en la factura F-409. He marcado la celda en rojo en la hoja de cálculo y notificado al contador.",
    vars: { last_intent: "conciliacion_excel", active_channel: "widget", discrepancy_found: true }
  },
  {
    title: "Reservaciones de Restaurante",
    channel: "messenger",
    logs: [
      "[OpenTable_API] Buscando mesas hoy 8:00 PM para 4 personas cerca de Lomas...",
      "[API] Reservar mesa confirmada en Rosetta..."
    ],
    incoming: "Reserva una mesa de negocios para cenar hoy con 3 socios.",
    outgoing: "🍽️ **Reserva Confirmada**: Mesa reservada para 4 personas hoy a las 8:00 PM en el restaurante *Rosetta*. He enviado la confirmación en formato de tarjeta digital a tu correo y calendario.",
    vars: { last_intent: "reservacion_restaurante", active_channel: "messenger", reservation_confirmed: true }
  },
  {
    title: "Recomendación de Citas de Negocios",
    channel: "whatsapp",
    logs: [
      "[Google_Maps] query_places(type: 'cafe', rating: '>4.5', keyword: 'business, quiet')"
    ],
    incoming: "Recomiéndame un café tranquilo para una junta de negocios rápida cerca de la oficina.",
    outgoing: "📍 **Lugares recomendados para juntas**:\n1. *Café Toscano* (Terraza tranquila y buen internet).\n2. *Lalo!* (Espacio amplio, ambiente ejecutivo).\n3. *Piso 12 Ejecutivo* (Privacidad total y salas de juntas).",
    vars: { last_intent: "recomendar_lugares", active_channel: "whatsapp", rating_limit: 4.5 }
  },
  {
    title: "Recordatorio de Juntas por Prioridad",
    channel: "widget",
    logs: [
      "[Calendar] query_today_meetings(status: 'pending')",
      "[IA_PRIORITY] Clasificando juntas por nivel de importancia y urgencia..."
    ],
    incoming: "Dime qué reuniones tengo pendientes para el resto del día.",
    outgoing: "📅 **Reuniones por Prioridad para hoy**:\n• 🔴 **Alta (16:30)**: Cierre de Contrato con Inversionistas (Sala Principal).\n• 🟡 **Media (17:45)**: Estatus de operaciones de la sucursal Centro.\n• 🟢 **Baja (19:00)**: Charla informal con el equipo de soporte.",
    vars: { last_intent: "prioridad_juntas", active_channel: "widget", pending_meetings_count: 3 }
  }
];

function runAutonomousAssistantStep() {
  if (isSimulationPaused) return;

  const panel = document.getElementById('panel-asistente');
  if (!panel || !panel.classList.contains('active')) return;

  const step = assistantScenarios[assistantStepIndex];
  
  const themeBtn = document.querySelector(`.chat-theme-toggle-btn[data-theme="${step.channel}"]`);
  if (themeBtn) {
    themeBtn.click();
  }

  if (assistantStepIndex === 0) {
    document.getElementById('chat-messages').innerHTML = '';
  }

  const statusEl = document.getElementById('chat-simulation-status');
  if (statusEl) {
    statusEl.textContent = `Paso: ${step.title}`;
  }

  const logsEl = document.getElementById('agent-tool-logs');
  if (logsEl) {
    logsEl.innerHTML = '';
  }
  
  step.logs.forEach((log, index) => {
    setTimeout(() => {
      if (logsEl) {
        logsEl.innerHTML += `<div>&gt; ${log}</div>`;
        logsEl.scrollTop = logsEl.scrollHeight;
      }
    }, index * 300);
  });

  setTimeout(() => {
    if (isSimulationPaused) return;
    addChatMessage('incoming', step.incoming.replace(/{bizName}/g, bizName).replace(/{bizSector}/g, bizSector).replace(/{bizProblem}/g, bizProblem));
    
    setTimeout(() => {
      if (isSimulationPaused) return;
      
      const outgoingMsg = step.outgoing.replace(/{bizName}/g, bizName).replace(/{bizSector}/g, bizSector).replace(/{bizProblem}/g, bizProblem);
      addChatMessage('outgoing', outgoingMsg);
      
      memoryVariables = { ...memoryVariables, ...step.vars };
      
      const latency = Math.round(Math.random() * 220 + 80);
      updateTelemetry(step.incoming, outgoingMsg, latency);
      
      assistantStepIndex = (assistantStepIndex + 1) % assistantScenarios.length;
    }, 1800);

  }, 1000);
}

function startAutonomousAssistantLoop() {
  if (assistantAutoInterval) clearInterval(assistantAutoInterval);
  
  runAutonomousAssistantStep();
  
  assistantAutoInterval = setInterval(() => {
    runAutonomousAssistantStep();
  }, 7500);
}

function pauseSimulationOnUserAction() {
  isSimulationPaused = true;
  const statusEl = document.getElementById('chat-simulation-status');
  if (statusEl) {
    statusEl.textContent = "Interrupción Manual Activa";
    statusEl.style.color = "#ef4444";
  }
  
  if (userResumeTimeout) clearTimeout(userResumeTimeout);
  
  userResumeTimeout = setTimeout(() => {
    isSimulationPaused = false;
    if (statusEl) {
      statusEl.textContent = "Simulación Autónoma Activa";
      statusEl.style.color = "#fbbf24";
    }
    printToolLog("[SYSTEM] Reanudando ciclo autónomo del Asistente...");
    runAutonomousAssistantStep();
  }, 22000);
}

document.getElementById('chat-user-input').addEventListener('focus', pauseSimulationOnUserAction);
document.getElementById('chat-user-input').addEventListener('keypress', (e) => {
  pauseSimulationOnUserAction();
});
document.getElementById('send-chat-btn').addEventListener('click', pauseSimulationOnUserAction);

window.addEventListener('load', () => {
  setTimeout(() => {
    startAutonomousAssistantLoop();
  }, 8000);
});

document.querySelectorAll('.tab-link').forEach(link => {
  link.addEventListener('click', () => {
    if (link.getAttribute('data-tab') === 'asistente') {
      setTimeout(startAutonomousAssistantLoop, 200);
    }
  });
});

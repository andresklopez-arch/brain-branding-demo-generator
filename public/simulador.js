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

  // Initialize Website Theme based on user choice
  applyWebTheme(bizStyle);

  // 3.5 AI Advisor Card
  document.getElementById('ai-advisor-advice').textContent = profile.aiAdvice;

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
function applyWebTheme(theme) {
  const preview = document.getElementById('mock-web-preview');
  if (!preview) return;
  
  preview.className = `theme-${theme}`;
  
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

// ── UPDATE IA ADVICE BY TAB ──
function updateAIAdvice(tabId) {
  const adviceEl = document.getElementById('ai-advisor-advice');
  if (!adviceEl) return;
  
  if (profile.aiAdvices && profile.aiAdvices[tabId]) {
    adviceEl.textContent = profile.aiAdvices[tabId].replace(/{bizName}/g, bizName).replace(/{bizProblem}/g, bizProblem);
  } else {
    // Fallback if not defined or custom
    const genericAdvices = {
      asistente: "Consejo IA: Automatizar la atención de primer contacto mediante WhatsApp Business API reduce los costos operativos de soporte técnico y atención a clientes hasta en un 40%.",
      pos: "Consejo IA: Emitir facturas fiscales automáticas en el Punto de Venta con timbrado SAT en la nube disminuye el trabajo del equipo contable en un 70% al cierre mensual.",
      web: "Consejo IA: Un sitio web optimizado para SEO local e indexado correctamente en Google Maps incrementa las visitas presenciales a tu negocio un 35%.",
      erp: profile.aiAdvice || "Consejo IA: Automatizar el flujo de tus procesos operativos te ahorra hasta 22 horas de tareas manuales repetitivas a la semana."
    };
    adviceEl.textContent = genericAdvices[tabId];
  }
}

// ── INTERACTIVE IA DIAGNOSTIC ENGINE ──
document.getElementById('trigger-diagnostic-btn').addEventListener('click', () => {
  const overlay = document.getElementById('diagnostic-overlay');
  const scanner = document.getElementById('diagnostic-scanner');
  const report = document.getElementById('diagnostic-report-card');
  const status = document.getElementById('scanner-status');
  
  overlay.style.display = 'flex';
  scanner.style.display = 'flex';
  report.style.display = 'none';
  
  // Set up animation phases
  const statuses = [
    { text: "Accediendo al motor cognitivo de Brain Branding...", delay: 0 },
    { text: `Analizando el sector: "${bizSector}"...`, delay: 600 },
    { text: `Deconstruyendo cuello de botella: "${bizProblem}"...`, delay: 1300 },
    { text: "Calculando proyecciones de ROI y automatizaciones...", delay: 2000 }
  ];
  
  statuses.forEach(phase => {
    setTimeout(() => {
      status.textContent = phase.text;
    }, phase.delay);
  });
  
  setTimeout(() => {
    // Hide scanner, show report
    scanner.style.display = 'none';
    report.style.display = 'flex';
    
    // Fill diagnostic report details
    document.querySelectorAll('.biz-name').forEach(el => el.textContent = bizName);
    
    // Calculate smart values based on sector or custom
    let hrsSaved = 22;
    let efficiencyInc = 45;
    let analysisText = "";
    let steps = [];
    let technicalDetails = {};
    
    if (bizSector.toLowerCase().includes("restaurante")) {
      hrsSaved = 18;
      efficiencyInc = 35;
      analysisText = `En el sector de Restaurantes, el problema "${bizProblem}" se origina por la desconexión entre el personal de servicio y cocina, provocando mermas de insumos críticos e insatisfacción del comensal.`;
      steps = [
        "**Fase 1 (Día 1-15)**: Desplegar comandas digitales en tablets sincronizadas con cocina para reducir los tiempos de entrega un 35%.",
        "**Fase 2 (Día 16-30)**: Integrar bases de datos de inventario con predicción de demanda para ingredientes perecederos.",
        "**Fase 3 (Día 31+)**: Habilitar autofacturación vía QR en tickets y encuestas de satisfacción automatizadas."
      ];
      technicalDetails = {
        0: `Para la Fase 1 en ${bizName}, implementaremos una interfaz táctil PWA responsiva conectada por WebSockets directos a una pantalla de cocina. Los pedidos ingresan de inmediato con prioridad automática de preparación, reduciendo el papeleo y eliminando el 100% de los errores de comanda escrita.`,
        1: `En la Fase 2, programaremos un motor lógico local en NodeJS que cruza el historial de platos vendidos con la disponibilidad de ingredientes en el POS. Al predecir el flujo de comensales semanales, te sugerirá las cantidades óptimas de compra para pescados, carnes y verduras, evitando mermas.`,
        2: `Para la Fase 3, integraremos un generador de CFDI con timbrado automático directo a la pasarela de pagos SAT. El cliente final puede escanear su ticket físico, ingresar su RFC y descargar su factura fiscal en PDF/XML en menos de 2 minutos sin intervención del cajero.`
      };
    } else if (bizSector.toLowerCase().includes("tienda") || bizSector.toLowerCase().includes("comercio")) {
      hrsSaved = 20;
      efficiencyInc = 40;
      analysisText = `Para Comercios, la ineficiencia de "${bizProblem}" deviene de no sincronizar las existencias entre la tienda física y digital, perdiendo conversiones valiosas en temporadas altas.`;
      steps = [
        "**Fase 1 (Día 1-15)**: Implementar control de inventario omnicanal en tiempo real unificando POS y tienda en línea.",
        "**Fase 2 (Día 16-30)**: Automatizar alertas de stock crítico y reordenes de proveedores con reglas lógicas de negocio.",
        "**Fase 3 (Día 31+)**: Lanzar campañas automatizadas de retención de clientes inactivos basadas en historial de compras."
      ];
      technicalDetails = {
        0: `La Fase 1 en ${bizName} conectará el software de cobro físico (POS) con las APIs de tu tienda en línea (Shopify/WooCommerce). Cada transacción en caja descuenta stock de forma inmediata en la web, previniendo compras accidentales de artículos agotados.`,
        1: `Para la Fase 2, desarrollaremos un gestor de almacenes centralizado que detecta niveles mínimos de stock. Cuando un producto de alta rotación baja del límite de seguridad, el sistema redacta y envía automáticamente una orden de compra en PDF al proveedor correspondiente.`,
        2: `En la Fase 3, usaremos algoritmos de retención (CRM) que identifican comportamientos de compra. Si un cliente frecuente deja de comprar por 45 días, el sistema le enviará un cupón dinámico del 15% por WhatsApp de forma autónoma.`
      };
    } else {
      // Custom / generic
      // Deterministic but random-looking numbers based on string lengths
      hrsSaved = 14 + (bizName.length % 11);
      efficiencyInc = 35 + (bizProblem.length % 21);
      analysisText = `El cuello de botella detectado en ${bizSector} bajo el problema "${bizProblem}" genera pérdidas de productividad severas debido a procesos administrativos y operativos manuales.`;
      steps = [
        `**Fase 1 (Día 1-15)**: Integrar Asistente Conversacional IA para automatizar dudas recurrentes sobre ${bizSector}.`,
        `**Fase 2 (Día 16-30)**: Diseñar un flujo en la nube a medida para organizar y erradicar tareas repetitivas relacionadas con "${bizProblem}".`,
        `**Fase 3 (Día 31+)**: Establecer dashboards en tiempo real con alertas preventivas para evitar que el cuello de botella vuelva a surgir.`
      ];
      technicalDetails = {
        0: `En la Fase 1, desplegaremos un bot conversacional con procesamiento de lenguaje natural (NLP) entrenado específicamente con las políticas y tarifas de ${bizName}. Resolverá el 80% de preguntas frecuentes por WhatsApp en segundos.`,
        1: `La Fase 2 estructurará una base de datos relacional PostgreSQL con un frontend web responsivo a medida. Automatizará los registros de entrada/salida y las notificaciones para erradicar las tareas manuales repetitivas que provocan: "${bizProblem}".`,
        2: `En la Fase 3, configuraremos un panel de control con métricas clave (KPIs) e integraciones Webhook para monitorear el desempeño del negocio de ${bizSector} en vivo, alertando por correo y chat si ocurren anomalías operativas.`
      };
    }
    
    // Calculate Return on Investment savings
    // Costo promedio de hora operativa = $75 MXN
    const monthlySavingsVal = Math.round(hrsSaved * 75 * 4.33);
    const formattedSavings = monthlySavingsVal.toLocaleString('es-MX');
    
    document.getElementById('diag-time-saved').textContent = hrsSaved;
    document.getElementById('diag-efficiency').textContent = efficiencyInc;
    document.getElementById('diag-roi-savings').textContent = formattedSavings;
    document.getElementById('diag-analysis-text').textContent = analysisText;
    
    // Animate capacity chart
    const targetCapacity = 80 + (efficiencyInc % 18);
    document.getElementById('diag-chart-capacity').textContent = `${targetCapacity}% de capacidad`;
    const chartBar = document.getElementById('diag-chart-bar');
    chartBar.style.width = '0%';
    setTimeout(() => {
      chartBar.style.width = `${targetCapacity}%`;
    }, 100);
    
    const stepsUl = document.getElementById('diag-steps');
    stepsUl.innerHTML = '';
    
    const detailsDrawer = document.getElementById('diag-step-details');
    const detailsTitle = document.getElementById('diag-step-details-title');
    const detailsBody = document.getElementById('diag-step-details-body');
    
    // Reset details drawer
    detailsDrawer.style.display = 'none';
    
    steps.forEach((step, idx) => {
      const li = document.createElement('li');
      li.innerHTML = step.replace(/\*\frac{.*?}{.*?}/g, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      li.addEventListener('click', () => {
        // Toggle selected styling
        stepsUl.querySelectorAll('li').forEach(item => item.classList.remove('selected-phase'));
        li.classList.add('selected-phase');
        
        // Show detail in drawer
        detailsDrawer.style.display = 'block';
        detailsTitle.textContent = `Detalle Técnico: Fase ${idx + 1}`;
        detailsBody.textContent = technicalDetails[idx];
        
        // Soft scroll into view
        detailsDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      
      stepsUl.appendChild(li);
    });
    
    // Configure WhatsApp Button inside Diagnostic Report
    const phone = '525638165507';
    const msgText = `Hola Brain Branding, acabo de generar mi Reporte de Diagnóstico IA para mi negocio *${bizName}* (Giro: ${bizSector}). El reporte estima un ahorro de ${hrsSaved} horas semanales y eficiencia de +${efficiencyInc}%. Me interesa programar una sesión estratégica para implementar este plan y solucionar: "${bizProblem}".`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msgText)}`;
    
    const wBtn = document.getElementById('diag-whatsapp-btn');
    wBtn.onclick = () => {
      window.open(whatsappUrl, '_blank');
    };
    
    if (typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 60 });
    }
    
  }, 2600);
});

// Close diagnostic modal actions
const closeBtn = document.getElementById('close-diagnostic-btn');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    document.getElementById('diagnostic-overlay').style.display = 'none';
  });
}

document.getElementById('diagnostic-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'diagnostic-overlay') {
    document.getElementById('diagnostic-overlay').style.display = 'none';
  }
});

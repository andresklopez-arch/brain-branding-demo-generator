/* ==========================================================================
   RECORRIDO GUIADO INTERACTIVO - PEDRO DEMO (BRAIN BRANDING)
   ========================================================================== */

const TourGuide = {
  currentStep: 0,
  steps: [
    {
      title: "👋 ¡Bienvenido Pedro a tu Ecosistema Inteligente!",
      text: "Esta es la simulación en tiempo real de tu fábrica de lámparas. Aquí sustituimos el lápiz y papel por un potente motor de Inteligencia Artificial que trabaja 24/7 para ti.",
      highlightElement: "#roleSwitcher"
    },
    {
      title: "🔄 Conmutador de Portales (Cliente vs Administrador)",
      text: "Con un clic puedes cambiar entre lo que ven tus clientes para hacer pedidos y lo que ves tú en el BackOffice de la fábrica para controlar la operación.",
      highlightElement: "#roleSwitcher"
    },
    {
      title: "🤖 Motor de IA & Alertas de Cuellos de Botella",
      text: "El sistema detecta automáticamente desabasto de insumos, retrasos en estaciones de ensamble y te da sugerencias de solución antes de que ocurran problemas.",
      highlightElement: "#aiAlertBanner"
    },
    {
      title: "📦 Gestión de 4 Almacenes de Inventarios",
      text: "Clasifica automáticamente Materias Primas, Componentes Electrónicos, Productos Comprados y Lámparas Fabricadas con alertas de stock mínimo.",
      highlightElement: "#tab-inventarios"
    },
    {
      title: "⚙️ Etapas de Producción & Descuento Automático",
      text: "Al avanzar un lote de lámparas por sus 5 etapas (Corte, Ensamble, Pruebas, QC, Empaque), el sistema descuenta los insumos usados al instante.",
      highlightElement: "#tab-procesos"
    },
    {
      title: "⏱️ Calculadora Predictiva de Tiempos de Entrega",
      text: "Ingresa cuántas lámparas te pide un cliente y la IA te dirá el tiempo exacto de fabricación basado en el personal disponible e inventarios.",
      highlightElement: "#aiPredictorCard"
    },
    {
      title: "📸 Escáner QR en Celular para Operarios",
      text: "Tus trabajadores en la fábrica pueden escanear con su celular el código de cada lote para actualizar el estatus sin llenar una sola hoja de papel.",
      highlightElement: "#tab-qr"
    },
    {
      title: "💰 Calculadora de ROI & Finanzas de Pedro",
      text: "Observa en vivo el margen de ganancia por cada modelo de lámpara y el dinero exacto que te ahorrarás al eliminar el uso de papel.",
      highlightElement: "#tab-finanzas"
    }
  ],

  start: function() {
    this.currentStep = 0;
    this.showStep();
  },

  showStep: function() {
    const step = this.steps[this.currentStep];
    const overlay = document.getElementById("tourOverlay");
    const card = document.getElementById("tourCard");

    if (!step || !overlay || !card) return;

    overlay.classList.add("active");
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span class="badge badge-info">Paso ${this.currentStep + 1} de ${this.steps.length}</span>
        <button onclick="TourGuide.close()" style="background:none; border:none; color:#888; cursor:pointer; font-size:18px;">✕</button>
      </div>
      <h3 style="font-size:18px; margin-bottom:8px; color:var(--accent-cyan);">${step.title}</h3>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">${step.text}</p>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button onclick="TourGuide.prev()" ${this.currentStep === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-secondary">◀ Anterior</button>
        <button onclick="TourGuide.next()" class="btn-primary" style="width:auto; padding:8px 18px;">
          ${this.currentStep === this.steps.length - 1 ? '¡Comenzar Demo! 🎉' : 'Siguiente ▶'}
        </button>
      </div>
    `;
  },

  next: function() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep();
    } else {
      this.close();
    }
  },

  prev: function() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  },

  close: function() {
    const overlay = document.getElementById("tourOverlay");
    if (overlay) overlay.classList.remove("active");
  }
};

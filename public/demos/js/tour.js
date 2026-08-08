/* ==========================================================================
   RECORRIDO GUIADO INTERACTIVO - PEDRO DEMO (BRAIN BRANDING)
   ========================================================================== */

const TourGuide = {
  currentStep: 0,
  steps: [
    {
      title: "👋 ¡Bienvenido Pedro a tu Ecosistema Inteligente!",
      text: "Esta es la simulación en tiempo real de tu fábrica de lámparas. Aquí sustituimos el lápiz y papel por un potente motor de Inteligencia Artificial que trabaja 24/7 para ti."
    },
    {
      title: "🔄 Conmutador de Portales (Modo Cliente vs Administración)",
      text: "Con un solo clic puedes cambiar entre el Portal de Clientes (atención y pedidos) y el Modo Administración (control total de fábrica)."
    },
    {
      title: "📋 Menú Principal de Navegación",
      text: "Ubicado en la parte superior para fácil acceso desde tu celular: Panel General, Inventarios, Procesos, Escáner QR, RH y Finanzas."
    },
    {
      title: "📦 Gestión de 4 Almacenes de Inventarios",
      text: "Clasifica automáticamente Materias Primas, Componentes Electrónicos, Productos Comprados y Lámparas Fabricadas con alertas de stock mínimo."
    },
    {
      title: "⚙️ Etapas de Producción & Descuento Automático",
      text: "Al avanzar un lote de lámparas por sus 5 etapas (Corte, Ensamble, Pruebas, QC, Empaque), el sistema descuenta los insumos usados al instante."
    },
    {
      title: "⏱️ Calculadora Predictiva de Tiempos de Entrega",
      text: "Ingresa cuántas lámparas te pide un cliente y la IA te dirá el tiempo exacto de fabricación basado en el personal disponible e inventarios."
    },
    {
      title: "📸 Escáner QR en Celular para Operarios",
      text: "Tus trabajadores en la fábrica pueden escanear con su celular el código de cada lote para actualizar el estatus sin llenar una sola hoja de papel."
    },
    {
      title: "💰 Calculadora de ROI & Finanzas de Pedro",
      text: "Observa en vivo el margen de ganancia por cada modelo de lámpara y el dinero exacto que te ahorrarás al eliminar el uso de papel."
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
    overlay.style.display = "block";
    card.style.display = "block";

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span class="badge badge-info" style="font-size:12px; font-weight:700;">Paso ${this.currentStep + 1} de ${this.steps.length}</span>
        <button onclick="TourGuide.close()" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:22px; padding:4px;">✕</button>
      </div>
      <h3 style="font-size:18px; margin-bottom:8px; color:var(--accent-cyan); font-weight:800;">${step.title}</h3>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:18px; line-height:1.5;">${step.text}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <button onclick="TourGuide.prev()" ${this.currentStep === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-secondary">◀ Anterior</button>
        <button onclick="TourGuide.next()" class="btn-primary" style="width:auto; padding:10px 20px;">
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
    const card = document.getElementById("tourCard");
    if (overlay) {
      overlay.classList.remove("active");
      overlay.style.display = "none";
    }
    if (card) {
      card.style.display = "none";
    }
  }
};

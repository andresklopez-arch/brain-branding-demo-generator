/* ==========================================================================
   TRANSPORTE INTELIGENTE HUGO - TOUR INMERSIVO DE VENTAS & NEUROMARKETING
   Brain Branding AI Platform
   ========================================================================== */

const TourGuide = {
  currentStep: 0,
  steps: [
    {
      badge: "🎯 PASO 1: EL PROBLEMA QUE VAMOS A RESOLVER",
      title: "Hugo, adiós al papel preimpreso y a la falta de control",
      subtitle: "De talonarios manuales a control digital blindado",
      text: "Hoy en día, tus choferes llenan boletos a mano, se quedan con una parte y entregan otra. Esto provoca <strong>filas lentas, boletos maltratados o perdidos, falta de métricas en tiempo real y riesgo constante de cobros no reportados</strong>. Esta aplicación fue diseñada específicamente para resolver todo eso de raíz.",
      highlightId: "roleSwitcher",
      voiceText: "Hugo, adiós al papel preimpreso y a la falta de control. Esta aplicación fue diseñada para modernizar tu negocio de raíz."
    },
    {
      badge: "⚡ PASO 2: MIRA TODO LO QUE HACE Y RESUELVE TU APP",
      title: "Emisión de Boletos en 1 Toque y Comandos de Voz",
      subtitle: "Velocidad absoluta para tus choferes en ruta",
      text: "Tus operadores ya no pierden tiempo con lápiz ni papel. Con solo presionar la tarifa en la pantalla o simplemente decir en voz alta <strong>'Imprimir'</strong>, la app emite el ticket térmico en microsegundos con <strong>folio fiscal cifrado, seguro de viajero y código QR oficial</strong>.",
      highlightId: "fareButtonsGrid",
      voiceText: "Mira todo lo que resuelve tu app. Emisión en un toque o por comando de voz con impresora térmica y QR oficial."
    },
    {
      badge: "👁️ PASO 3: BLINDAJE ANTIFRAUDE CON VISIÓN ARTIFICIAL IA",
      title: "Cero pasajeros sin pagar: La cámara cuenta el aforo real",
      subtitle: "Auditoría en vivo segundo a segundo",
      text: "La cámara del celular o tablet vigila la puerta de abordaje. La IA detecta a cada persona que sube y <strong>cruza el conteo en tiempo real contra los boletos cobrados</strong>. Si alguien sube sin registrar boleto, el sistema emite una alerta instantánea tanto en cabina como en tu panel central.",
      highlightId: "aiCameraCard",
      voiceText: "Cero pasajeros sin pagar. La visión artificial cuenta a cada usuario y audita el cobro en tiempo real."
    },
    {
      badge: "💰 PASO 4: ESTO ES LO QUE TE VAS A AHORRAR",
      title: "Eliminación de Gastos de Imprenta y Recuperación de Fugas",
      subtitle: "Rentabilidad directa y blindaje de cada peso cobrado",
      text: "<strong>100% de ahorro</strong> en el gasto continuo de mandar a imprimir talonarios de papel. Además, eliminas por completo el desperdicio de boletos mojados o rotos y <strong>recuperas todo el dinero de pasajes no cobrados</strong> gracias al cruce inteligente con la visión de la cámara.",
      highlightId: "driverModeSection",
      voiceText: "Esto es lo que te vas a ahorrar. Cero gastos de imprenta en papel y recuperación total del dinero de pasajes cobrados."
    },
    {
      badge: "📈 PASO 5: ESTO ES LO QUE VAS A GANAR MÁS",
      title: "Nuevos Ingresos con Publicidad en Pantallas a Bordo",
      subtitle: "Monetización adicional y optimización de tu flotilla",
      text: "Tu negocio no solo cobrará pasajes: ahora puedes <strong>vender espacios publicitarios dinámicos y geolocalizados</strong> a negocios locales en pantallas dentro de tus unidades. Además, la IA predice las horas pico para enviar refuerzos y <strong>optimiza el rendimiento del combustible</strong> de tus choferes.",
      highlightId: "driverModeSection",
      voiceText: "Esto es lo que vas a ganar más. Nuevos ingresos vendiendo anuncios en pantallas a bordo, optimización de rutas y ahorro de combustible."
    },
    {
      badge: "🚀 PASO 6: ESTÁS A UN SOLO PASO DE RESOLVERLO",
      title: "¡Bienvenido al Futuro de tu Empresa, Hugo!",
      subtitle: "El software a la medida que transformará tu flotilla",
      text: "Todo lo que acabas de ver está listo para implementarse en tus unidades. Explora la terminal, prueba la cámara, emite boletos de prueba y comprueba el poder que tendrá tu software terminado.",
      highlightId: "driverModeSection",
      voiceText: "Estás a un solo paso de resolver tus problemas. Bienvenido al futuro de tu empresa, Hugo."
    }
  ],

  start() {
    this.currentStep = 0;
    this.showStep(0);
  },

  showStep(idx) {
    if (idx < 0 || idx >= this.steps.length) {
      this.finish();
      return;
    }

    this.currentStep = idx;
    const step = this.steps[idx];

    let overlay = document.getElementById("tourOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "tourOverlay";
      overlay.className = "tour-modal-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="tour-card animate-pop" style="border: 2px solid #00f2fe; box-shadow: 0 0 50px rgba(0,242,254,0.35);">
        <div class="tour-header">
          <span class="tour-badge" style="background: rgba(0,242,254,0.15); color: #00f2fe; font-weight:800; font-size:11px;">
            ${step.badge}
          </span>
          <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">${idx + 1} / ${this.steps.length}</span>
        </div>
        
        <h3 class="tour-title" style="font-size: 17px; margin-top: 6px; color: #fff; line-height: 1.3;">
          ${step.title}
        </h3>
        
        <div style="font-size: 12px; color: #00f2fe; font-weight: 600; margin-bottom: 10px;">
          ${step.subtitle}
        </div>

        <p class="tour-body" style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
          ${step.text}
        </p>

        <div class="tour-footer">
          <button class="btn-secondary" style="font-size:12px; padding: 8px 14px;" onclick="TourGuide.prev()" ${idx === 0 ? "disabled style='opacity:0.4; pointer-events:none;'" : ""}>
            ◀ Anterior
          </button>
          
          <div class="tour-dots">
            ${this.steps.map((_, i) => `<span class="tour-dot ${i === idx ? 'active' : ''}"></span>`).join("")}
          </div>

          <button class="btn-primary" style="font-size:12.5px; padding: 8px 18px;" onclick="TourGuide.next()">
            ${idx === this.steps.length - 1 ? '¡Comenzar a Probar la App! 🎉' : 'Siguiente Paso ▶'}
          </button>
        </div>
      </div>
    `;

    overlay.style.display = "flex";

    // Reproducir voz IA si está disponible
    if (step.voiceText && typeof AIEngine !== 'undefined') {
      AIEngine.speak(step.voiceText);
    }

    // Resaltar elemento objetivo si existe
    if (step.highlightId) {
      const el = document.getElementById(step.highlightId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  },

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.finish();
    }
  },

  prev() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  },

  finish() {
    const overlay = document.getElementById("tourOverlay");
    if (overlay) overlay.style.display = "none";
    if (typeof App !== 'undefined') {
      App.showToast("✨ ¡Presentación completada! Ahora puedes operar la app de Hugo en vivo.");
    }
  }
};

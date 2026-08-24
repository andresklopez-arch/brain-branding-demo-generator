/* ==========================================================================
   TRANSPORTE INTELIGENTE HUGO - MOTOR IA, VISIÓN ARTIFICIAL & BIG DATA
   Brain Branding AI Platform
   ========================================================================== */

const AIEngine = {
  // Estado del motor IA
  state: {
    cameraActive: false,
    cameraStream: null,
    autoTicketMode: true,
    totalBoardingsDetected: 191,
    totalTicketsIssued: 189,
    currentDiscrepancy: 2, // 2 pasajeros no cobrados detectados
    liveDetections: [],
    animInterval: null,
    isDetecting: false
  },

  // Inicialización del Motor IA
  init() {
    console.log("🧠 [Brain Branding AI Engine] Inicializado para Hugo Transporte...");
    this.startSimulatedVisionLoop();
  },

  // Simulación del bucle de visión por computadora
  startSimulatedVisionLoop() {
    const canvas = document.getElementById("aiVisionCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let step = 0;
    const render = () => {
      if (!this.state.cameraActive) {
        // Modo simulación gráfica cuando no hay cámara web física
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fondo de simulación de escáner
        ctx.fillStyle = "rgba(10, 25, 47, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Líneas de radar / escaneo HUD
        ctx.strokeStyle = "rgba(0, 242, 254, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        // Línea de barrido láser vertical
        const scanY = (step % 200) * (canvas.height / 200);
        const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        grad.addColorStop(0, "rgba(0, 242, 254, 0)");
        grad.addColorStop(0.5, "rgba(0, 242, 254, 0.45)");
        grad.addColorStop(1, "rgba(0, 242, 254, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 15, canvas.width, 30);

        // Renderizado de Bounding Boxes (Detección de Persona)
        this.renderSimulatedPassengerBoxes(ctx, step);
      } else {
        // Cuando la cámara física está encendida, solo dibujamos las cajas HUD sobre el video
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.renderSimulatedPassengerBoxes(ctx, step);
      }

      step++;
      requestAnimationFrame(render);
    };

    render();
  },

  renderSimulatedPassengerBoxes(ctx, step) {
    const canvas = ctx.canvas;
    const timeSec = step * 0.03;
    
    // Generar oscilación suave de detección de persona
    const boxX = (canvas.width / 2) - 80 + Math.sin(timeSec) * 15;
    const boxY = 40 + Math.cos(timeSec * 0.8) * 8;
    const boxW = 160;
    const boxH = canvas.height - 70;

    // Caja IA delimitadora Neón
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    // Esquinas de enfoque tecnológico
    const cornerSize = 14;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3.5;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(boxX, boxY + cornerSize); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cornerSize, boxY); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerSize, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + cornerSize); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - cornerSize); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + cornerSize, boxY + boxH); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerSize, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - cornerSize); ctx.stroke();

    // Etiqueta HUD de IA
    ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
    ctx.fillRect(boxX, boxY - 24, 180, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("👤 PASAJERO EN PUERTA 98.6%", boxX + 6, boxY - 9);

    // Indicador de estado de cobro
    const isPaid = (Math.floor(timeSec / 4) % 2 === 0);
    ctx.fillStyle = isPaid ? "rgba(0, 242, 254, 0.85)" : "rgba(239, 68, 68, 0.85)";
    ctx.fillRect(boxX, boxY + boxH + 4, 150, 20);
    ctx.fillStyle = "#0a0f1d";
    ctx.font = "bold 10px monospace";
    ctx.fillText(isPaid ? "✔ BOLETO EMITIDO" : "⚠ COBRO PENDIENTE", boxX + 8, boxY + boxH + 18);
  },

  // Encender/Apagar Cámara Física (Webcam o Celular)
  async toggleCamera() {
    const video = document.getElementById("aiCameraVideo");
    const statusTxt = document.getElementById("cameraStatusTxt");
    const btn = document.getElementById("btnToggleCam");

    if (this.state.cameraActive) {
      // Detener cámara
      if (this.state.cameraStream) {
        this.state.cameraStream.getTracks().forEach(track => track.stop());
        this.state.cameraStream = null;
      }
      if (video) video.srcObject = null;
      this.state.cameraActive = false;
      if (statusTxt) statusTxt.innerHTML = "📡 Modo Simulación Activo (Sensor Óptico IA)";
      if (btn) btn.innerHTML = "📸 Activar Cámara Real de Celular";
      App.showToast("Cámara física desactivada. Modo sensor IA activo.");
    } else {
      // Iniciar cámara con permisos getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (video) {
          video.srcObject = stream;
          video.play();
        }
        this.state.cameraStream = stream;
        this.state.cameraActive = true;
        if (statusTxt) statusTxt.innerHTML = "🟢 Cámara en Vivo • Detección en Puerta";
        if (btn) btn.innerHTML = "⏹️ Desactivar Cámara Real";
        App.showToast("¡Cámara de la unidad vinculada con éxito!");
      } catch (err) {
        console.warn("No se pudo acceder a la cámara:", err);
        App.showToast("No se detectó cámara física. Manteniendo simulación óptica IA.", "warning");
      }
    }
  },

  // Disparar detección de pasajero manual/sensor para demostración
  triggerPassengerDetection() {
    this.state.totalBoardingsDetected++;
    document.getElementById("statBoardings").innerText = this.state.totalBoardingsDetected;

    App.playBeep(880, 0.15); // Beep agudo de detección IA

    // Notificación en pantalla
    App.showToast("👤 ¡Nuevo pasajero detectado al abordar la unidad!", "info");

    if (this.state.autoTicketMode) {
      setTimeout(() => {
        App.issueTicket("gen", "IA Cámara (Detección Auto)");
      }, 400);
    } else {
      this.updateDiscrepancyCheck();
    }
  },

  // Verificación de Discrepancias y Fugas de Ingreso
  updateDiscrepancyCheck() {
    const diff = this.state.totalBoardingsDetected - this.state.totalTicketsIssued;
    this.state.currentDiscrepancy = Math.max(0, diff);

    const discEl = document.getElementById("statDiscrepancies");
    if (discEl) {
      discEl.innerText = this.state.currentDiscrepancy;
      discEl.style.color = this.state.currentDiscrepancy > 0 ? "#ef4444" : "#10b981";
    }

    const banner = document.getElementById("aiAuditBanner");
    if (banner) {
      if (this.state.currentDiscrepancy > 0) {
        banner.className = "alert-card alert-warning";
        banner.innerHTML = `
          <div class="alert-icon">⚠️</div>
          <div>
            <strong>Discrepancia Detectada por IA:</strong> Se registraron <strong>${this.state.currentDiscrepancy} abordajes sin boleto</strong> cobrado en la última parada.
            <div style="font-size:11px; opacity:0.85; margin-top:2px;">Fuga potencial evitada: $${(this.state.currentDiscrepancy * 14).toFixed(2)} MXN. Se envió notificación al chofer.</div>
          </div>
        `;
      } else {
        banner.className = "alert-card alert-success";
        banner.innerHTML = `
          <div class="alert-icon">🛡️</div>
          <div>
            <strong>Auditoría Antifraude en Tiempo Real:</strong> 100% de aforo verificado y cobrado. Cero fugas de efectivo en turno actual.
          </div>
        `;
      }
    }
  },

  // Consejos y Diagnósticos Inteligentes del Negocio (Neuromarketing + Big Data)
  getBusinessInsights() {
    return [
      {
        type: "opportunity",
        badge: "Oportunidad de Ingreso",
        icon: "📈",
        title: "Alta Demanda Detectada en Ruta 01 (Centro - Terminal Sur)",
        desc: "El análisis histórico indica que los viernes entre 13:00 y 16:00 la ocupación sube al 94%. Se recomienda despachar la Unidad #15 (Standby) para captar $3,800 MXN adicionales.",
        action: "Asignar Refuerzo"
      },
      {
        type: "efficiency",
        badge: "Ahorro de Combustible",
        icon: "⛽",
        title: "Optimización de Rendimiento en Unidad #08",
        desc: "El chofer Esteban Morales registra un rendimiento de 6.4 km/L vs promedio de flota de 8.9 km/L debido a aceleraciones bruscas en semáforos. La IA sugiere capacitación de manejo suave con ahorro estimado de $4,200/mes.",
        action: "Ver Telemetría"
      },
      {
        type: "security",
        badge: "Control Antifraude",
        icon: "🛡️",
        title: "Trazabilidad Total de Efectivo",
        desc: "Al sustituir los talonarios de papel por boletos térmicos con folio cifrado y QR, el negocio de Hugo ha eliminado un 14.2% de pérdidas por boletos no reportados.",
        action: "Descargar Informe"
      }
    ];
  },

  // =========================================================================
  // NUEVAS SUGERENCIAS IMPLEMENTADAS: GPS, TELEMETRÍA Y NFC
  // =========================================================================

  // 1. Motor de Geocercas GPS & Tarificación Dinámica Automática
  currentGpsIndex: 0,
  simulateGpsProgress() {
    this.currentGpsIndex = (this.currentGpsIndex + 1) % HugoTransportData.gpsWaypoints.length;
    const currentWp = HugoTransportData.gpsWaypoints[this.currentGpsIndex];

    const gpsEl = document.getElementById("gpsLocationTag");
    const gpsZoneEl = document.getElementById("gpsZoneTag");
    const gpsDistanceEl = document.getElementById("gpsProgressTrack");

    if (gpsEl) gpsEl.innerText = `📍 ${currentWp.name}`;
    if (gpsZoneEl) gpsZoneEl.innerText = currentWp.zone;
    if (gpsDistanceEl) {
      const pct = ((this.currentGpsIndex + 1) / HugoTransportData.gpsWaypoints.length) * 100;
      gpsDistanceEl.style.width = `${pct}%`;
    }

    // Auto-ajuste inteligente de tarifa sugerida según la geocerca
    App.showToast(`🛰️ GPS: Unidad ingresó a [${currentWp.zone}]. Tarifa ajustada a $${currentWp.basePrice.toFixed(2)}`, "info");
    App.playBeep(600, 0.08);
  },

  // 2. Procesador de Pagos Contactless NFC / Monedero Electrónico
  processNfcPayment(cardId) {
    const card = HugoTransportData.nfcCards.find(c => c.id === cardId) || HugoTransportData.nfcCards[0];
    const currentRoute = HugoTransportData.routes.find(r => r.id === App.state.selectedRouteId) || HugoTransportData.routes[0];
    
    let fareAmount = currentRoute.baseFare;
    if (card.discountPct > 0) {
      fareAmount = fareAmount * (1 - card.discountPct / 100);
    }

    if (card.balance < fareAmount) {
      App.showToast(`❌ Saldo insuficiente en tarjeta NFC (${card.passenger}). Saldo: $${card.balance.toFixed(2)}`, "warning");
      App.playBeep(300, 0.3);
      return;
    }

    // Descontar saldo de la tarjeta
    card.balance -= fareAmount;

    // Emitir boleto digital
    App.issueTicketWithPayment(fareAmount, `NFC / Tarjeta (${card.passenger})`, "💳 Tap Contactless NFC", card);

    // Sonido agradable de cobro electrónico
    App.playBeep(1200, 0.12);
    setTimeout(() => App.playBeep(1600, 0.18), 100);

    App.showToast(`💳 ¡Cobro NFC Exitoso! $${fareAmount.toFixed(2)} deducidos a ${card.passenger}. Nuevo saldo: $${card.balance.toFixed(2)}`);
    App.renderNfcModal();
  },

  // 3. Telemetría de Hábitos de Conducción y Ahorro de Combustible
  simulateDrivingEvent(eventType) {
    if (eventType === "harsh_brake") {
      HugoTransportData.telemetry.harshBrakingCount++;
      HugoTransportData.telemetry.driverScore = Math.max(70, HugoTransportData.telemetry.driverScore - 3);
      App.showToast("⚠️ IA Telemetría: Frenada brusca detectada (-0.4G). Se notificó al chofer.", "warning");
      App.playBeep(350, 0.25);
    } else if (eventType === "speeding") {
      HugoTransportData.telemetry.speedingEvents++;
      HugoTransportData.telemetry.driverScore = Math.max(65, HugoTransportData.telemetry.driverScore - 5);
      App.showToast("🚨 IA Telemetría: Exceso de velocidad (78 km/h en zona de 60 km/h). Alerta emitida.", "warning");
      App.playBeep(250, 0.3);
    } else if (eventType === "smooth_driving") {
      HugoTransportData.telemetry.driverScore = Math.min(100, HugoTransportData.telemetry.driverScore + 2);
      App.showToast("🌟 IA Telemetría: Conducción eficiente y suave (+0.6 km/L en rendimiento diésel).", "info");
      App.playBeep(980, 0.15);
    }

    App.updateTelemetryUI();
  },

  // =========================================================================
  // 4. RECONOCIMIENTO BIOMÉTRICO FACIAL & ANTI-FATIGA DEL CHOFER
  // =========================================================================
  verifyDriverBiometrics() {
    App.showToast("🔍 Escaneando rostro del chofer con IA Biometric...", "info");
    App.playBeep(800, 0.1);
    
    setTimeout(() => {
      const bioStatus = document.getElementById("biometricStatusBadge");
      if (bioStatus) {
        bioStatus.className = "badge badge-success";
        bioStatus.innerText = "✔ Conductor Validado: Carlos Mendoza (99.8% Coincidencia • 0% Somnolencia)";
      }
      App.playBeep(1200, 0.2);
      App.showToast("✅ Biometría Aprobada: Identidad verificada y chofer en estado óptimo de alerta.");
      this.speak("Conductor Carlos Mendoza verificado. Unidad autorizada para inicio de ruta.");
    }, 1200);
  },

  // =========================================================================
  // 5. MODO COMANDOS DE VOZ IA (MANOS LIBRES PARA EL CHOFER)
  // =========================================================================
  voiceState: {
    isListening: false,
    recognition: null
  },

  initVoiceEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.lang = "es-MX";
      rec.interimResults = false;

      rec.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toLowerCase();
        console.log("🎙️ Comando de voz detectado:", transcript);
        this.processVoiceCommand(transcript);
      };

      rec.onerror = (err) => {
        console.warn("Error en reconocimiento de voz:", err);
      };

      this.voiceState.recognition = rec;
    }
  },

  toggleVoiceControl() {
    const micBtn = document.getElementById("btnVoiceMic");
    const micStatus = document.getElementById("voiceStatusText");

    if (this.voiceState.isListening) {
      if (this.voiceState.recognition) {
        try { this.voiceState.recognition.stop(); } catch (e) { }
      }
      this.voiceState.isListening = false;
      if (micBtn) micBtn.classList.remove("listening");
      if (micStatus) micStatus.innerText = "🎙️ Modo Voz: Apagado (Toca para activar)";
      App.showToast("Comandos de voz desactivados.");
    } else {
      if (this.voiceState.recognition) {
        try {
          this.voiceState.recognition.start();
        } catch (e) { }
      }
      this.voiceState.isListening = true;
      if (micBtn) micBtn.classList.add("listening");
      if (micStatus) micStatus.innerText = "🔴 Escuchando al chofer... (Di 'Imprimir' o 'General')";
      App.showToast("🎙️ ¡Modo Voz Activado! Di 'Imprimir', 'General', 'Estudiante' o 'NFC'.");
      this.speak("Modo voz activado. Diga su comando.");
    }
  },

  processVoiceCommand(command) {
    App.showToast(`🗣️ Comando de voz: "${command}"`, "info");

    if (command.includes("imprimir") || command.includes("boleto") || command.includes("general") || command.includes("cobrar")) {
      App.issueTicket("gen", "Comando de Voz ('" + command + "')");
      this.speak("Boleto general emitido.");
    } else if (command.includes("estudiante") || command.includes("descuento") || command.includes("inapam")) {
      App.issueTicket("pref", "Comando de Voz ('" + command + "')");
      this.speak("Boleto preferencial emitido.");
    } else if (command.includes("tarjeta") || command.includes("nfc") || command.includes("monedero")) {
      App.openNfcModal();
      this.speak("Abriendo validador de tarjeta.");
    } else if (command.includes("ruta") || command.includes("avance") || command.includes("gps")) {
      this.simulateGpsProgress();
    } else {
      App.showToast(`Comando "${command}" reconocido pero sin acción asociada. Prueba diciendo "Imprimir"`, "warning");
    }
  },

  // Síntesis de voz para respuesta audible
  speak(text) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-MX";
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) { }
    }
  }
};

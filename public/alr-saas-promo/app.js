// ==========================================================================
// CONFIGURACIÓN Y ESTADO DE LAS ESCENAS DE CAMPAÑA
// ==========================================================================
let CAMPAIGN_SCENES = [
  {
    id: 1,
    icon: 'ri-shield-flash-fill',
    title: 'CONTROL TOTAL',
    desc: 'SaaS unificado para aprovisionamiento, licencias y telemetría multi-app.',
    duration: 4.0, // segundos
    effectClass: 'animate-in animate-glow',
    bgTransform: 'scale(1.0)',
    soundType: 'intro',
    extraUi: '',
    textAnimation: 'slide-up',
    textPosition: 'center',
    titleColor: '#ffffff',
    titleSize: 'medium'
  },
  {
    id: 2,
    icon: 'ri-error-warning-fill',
    title: 'EL PELIGRO',
    desc: 'Accesos no autorizados, descontrol y brechas de seguridad críticas.',
    duration: 4.0,
    effectClass: 'animate-in animate-glitch',
    bgTransform: 'scale(1.15) translate(-10px, 10px)',
    soundType: 'alert',
    extraUi: 'danger-glow',
    textAnimation: 'glitch',
    textPosition: 'center',
    titleColor: '#ff3860',
    titleSize: 'medium'
  },
  {
    id: 3,
    icon: 'ri-command-fill',
    title: 'COMMANDER HUB',
    desc: 'Tu consola centralizada para gestionar licencias y telemetría en tiempo real.',
    duration: 4.0,
    effectClass: 'animate-in animate-glow',
    bgTransform: 'scale(1.05) translate(10px, -10px)',
    soundType: 'sweep',
    extraUi: 'dashboard-wireframe',
    textAnimation: 'slide-up',
    textPosition: 'center',
    titleColor: '#ffffff',
    titleSize: 'medium'
  },
  {
    id: 4,
    icon: 'ri-telegram-fill',
    title: 'MÁXIMA SEGURIDAD',
    desc: 'Doble factor 2FA OTP obligatorio enviado directamente a tu Telegram.',
    duration: 4.0,
    effectClass: 'animate-in animate-glow',
    bgTransform: 'scale(1.1) rotate(2deg)',
    soundType: 'lock',
    extraUi: 'otp-wireframe',
    textAnimation: 'slide-up',
    textPosition: 'center',
    titleColor: '#ffffff',
    titleSize: 'medium'
  },
  {
    id: 5,
    icon: 'ri-rocket-2-fill',
    title: 'POTENCIA TU SAAS',
    desc: 'Prueba Commander Hub hoy mismo y lleva tu infraestructura al siguiente nivel.',
    duration: 4.0,
    effectClass: 'animate-in animate-glow',
    bgTransform: 'scale(1.0)',
    soundType: 'success',
    extraUi: 'cta-glow',
    textAnimation: 'slide-up',
    textPosition: 'center',
    titleColor: '#00e5ff',
    titleSize: 'medium'
  }
];

const DEFAULT_TEXTS = JSON.parse(JSON.stringify(CAMPAIGN_SCENES));

// Estado de reproducción
let isPlaying = false;
let currentTime = 0.0;
let totalDuration = 20.0; // 5 escenas * 4s
let lastFrameTime = 0;
let activeSceneId = null;
let isMuted = true;

// Contexto de Web Audio y Compresor de Seguridad
let audioCtx = null;
let compressorNode = null;

// Lógica de Typewriter (Intervalo global)
let typewriterInterval = null;

// Variables de Secuenciador Musical (Banda Sonora en vivo)
let activeMusicStyle = 'synthwave'; // none, synthwave, cyberpunk, glitch
let bgMusicPlaying = false;
let bgMusicTimer = null;
let currentStep = 0;
let nextStepTime = 0.0;
let musicTempo = 120; // BPM
let musicStepTime = 60.0 / 120 / 2; // corcheas (0.25s)

// Whitelists para validación estricta de presets e importaciones (Sugerencia 3)
const WHITE_LIST_ANIMATIONS = ['slide-up', 'glitch', 'typewriter', 'fade-in', 'zoom-in'];
const WHITE_LIST_POSITIONS = ['center', 'top', 'bottom'];
const WHITE_LIST_SIZES = ['small', 'medium', 'large', 'xlarge'];
const WHITE_LIST_MUSIC_STYLES = ['none', 'synthwave', 'cyberpunk', 'glitch'];

function sanitizeColorHex(colorStr, fallback = '#ffffff') {
  if (typeof colorStr !== 'string') return fallback;
  const cleaned = colorStr.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(cleaned)) {
    return cleaned;
  }
  return fallback;
}

function getWhiteListOrDefault(val, whitelist, fallback) {
  if (whitelist.includes(val)) return val;
  return fallback;
}

// ==========================================================================
// SINTETIZADOR DE EFECTOS DE SONIDO Y SECUENCIADOR (WEB AUDIO API)
// ==========================================================================
function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear y configurar compresor dinámico para prevenir distorsión (Sugerencia 1)
    compressorNode = audioCtx.createDynamicsCompressor();
    compressorNode.threshold.setValueAtTime(-24, audioCtx.currentTime);
    compressorNode.knee.setValueAtTime(30, audioCtx.currentTime);
    compressorNode.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);
    
    // Conectar compresor a la salida del sistema
    compressorNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSynthesizedSound(type) {
  if (isMuted) return;
  initAudioContext();
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(compressorNode); // Conectar al compresor de seguridad

  const now = audioCtx.currentTime;

  if (type === 'intro') {
    // Futuristic sweep
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } 
  else if (type === 'alert') {
    // Discordant alarm beep
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.setValueAtTime(350, now + 0.15);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } 
  else if (type === 'sweep') {
    // Cinematic sweep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.6);
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.start(now);
    osc.stop(now + 0.75);
  } 
  else if (type === 'lock') {
    // Metallic double click
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.setValueAtTime(0.06, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } 
  else if (type === 'success') {
    // Sci-fi arpeggio (C4 -> E4 -> G4 -> C5)
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const singleOsc = audioCtx.createOscillator();
      const singleGain = audioCtx.createGain();
      singleOsc.connect(singleGain);
      singleGain.connect(compressorNode); // Conectar al compresor
      
      singleOsc.type = 'sine';
      singleOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
      singleGain.gain.setValueAtTime(0.08, now + idx * 0.1);
      singleGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
      
      singleOsc.start(now + idx * 0.1);
      singleOsc.stop(now + idx * 0.1 + 0.35);
    });
  }
}

// Bucle de programación musical en tiempo real
function startMusicLoop() {
  if (isMuted || !isPlaying || activeMusicStyle === 'none') return;
  initAudioContext();
  if (bgMusicPlaying) return;
  
  bgMusicPlaying = true;
  nextStepTime = audioCtx.currentTime;
  currentStep = 0;
  
  // Establecer BPM según el estilo
  if (activeMusicStyle === 'synthwave') {
    musicTempo = 120;
  } else if (activeMusicStyle === 'cyberpunk') {
    musicTempo = 100;
  } else if (activeMusicStyle === 'glitch') {
    musicTempo = 138;
  }
  musicStepTime = 60.0 / musicTempo / 2; // corcheas
  
  function runScheduler() {
    if (!bgMusicPlaying) return;
    // Programar notas hasta con 100ms de antelación
    while (nextStepTime < audioCtx.currentTime + 0.1) {
      scheduleMusicStep(currentStep, nextStepTime);
      nextStepTime += musicStepTime;
      currentStep = (currentStep + 1) % 16;
    }
    bgMusicTimer = setTimeout(runScheduler, 25);
  }
  runScheduler();
}

function stopMusicLoop() {
  bgMusicPlaying = false;
  if (bgMusicTimer) {
    clearTimeout(bgMusicTimer);
    bgMusicTimer = null;
  }
}

function updateMusicStyle() {
  const select = document.getElementById('cfg-music-style');
  if (select) {
    activeMusicStyle = select.value;
  }
  stopMusicLoop();
  if (isPlaying && !isMuted) {
    startMusicLoop();
  }
}

// Síntesis rítmica avanzada para la musicalización
function scheduleMusicStep(step, time) {
  if (isMuted || activeMusicStyle === 'none') return;
  const ctx = audioCtx;

  // 1. KICK DRUM (Tiempos fuertes 0, 4, 8, 12)
  if (step % 4 === 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(compressorNode); // Conectar al compresor
    
    // Caída rápida de frecuencia y volumen
    osc.frequency.setValueAtTime(activeMusicStyle === 'cyberpunk' ? 90 : 130, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
    
    gain.gain.setValueAtTime(activeMusicStyle === 'cyberpunk' ? 0.25 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    
    osc.start(time);
    osc.stop(time + 0.14);
  }

  // 2. SNARE / CLAP (Tiempos de caja 4, 12)
  const playsSnare = (activeMusicStyle === 'cyberpunk') ? (step === 4 || step === 12 || step === 8 || step === 14) : (step === 4 || step === 12);
  if (playsSnare) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(compressorNode); // Conectar al compresor
    
    // Sonido triangular con barrido de frecuencia rápido simulando caja electrónica
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.15);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, time);
    
    gain.gain.setValueAtTime(activeMusicStyle === 'cyberpunk' ? 0.14 : 0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.start(time);
    osc.stop(time + 0.16);
  }

  // 3. HI-HAT (Contratiempos impares 1, 3, 5, 7, etc.)
  if (step % 2 === 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(compressorNode); // Conectar al compresor
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(12000, time);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);
    
    gain.gain.setValueAtTime(activeMusicStyle === 'glitch' ? 0.018 : 0.01, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // 4. BASSLINE (Línea de Bajo)
  if (activeMusicStyle === 'synthwave') {
    // Progresión clásica de Synthwave ochentero en La menor (A -> C -> F -> G)
    let freq = 55.0; // A1
    if (step >= 4 && step < 8) freq = 65.41; // C2
    else if (step >= 8 && step < 12) freq = 43.65; // F1
    else if (step >= 12) freq = 49.00; // G1

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(compressorNode); // Conectar al compresor
    
    osc.type = 'sawtooth';
    // Alternancia de octavas en cada paso
    const mult = (step % 2 === 1) ? 2 : 1;
    osc.frequency.setValueAtTime(freq * mult, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.start(time);
    osc.stop(time + 0.22);

    // Melodía aleatoria / fija en los pasos fuertes de la secuencia
    if (step === 0 || step === 3 || step === 8 || step === 11) {
      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();
      melOsc.connect(melGain);
      melGain.connect(compressorNode); // Conectar al compresor
      
      melOsc.type = 'sine';
      const melNotes = [440.00, 523.25, 659.25, 783.99]; // A4, C5, E5, G5
      const note = melNotes[step % melNotes.length];
      melOsc.frequency.setValueAtTime(note, time);
      
      melGain.gain.setValueAtTime(0.015, time);
      melGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      
      melOsc.start(time);
      melOsc.stop(time + 0.4);
    }
  } 
  else if (activeMusicStyle === 'cyberpunk') {
    // Bajo industrial pesado en Re menor (D1 -> D#1 -> C1 -> A#0)
    let freq = 36.71; // D1
    if (step >= 4 && step < 8) freq = 38.89; // D#1
    else if (step >= 8 && step < 12) freq = 32.70; // C1
    else if (step >= 12) freq = 29.14; // A#0

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(compressorNode); // Conectar al compresor
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, time);
    
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
    
    osc.start(time);
    osc.stop(time + 0.26);

    // Sweep de sirena en el fondo (pasos 0 y 8)
    if (step === 0 || step === 8) {
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.connect(sweepGain);
      sweepGain.connect(compressorNode); // Conectar al compresor
      
      sweepOsc.type = 'sawtooth';
      sweepOsc.frequency.setValueAtTime(freq * 8, time);
      sweepOsc.frequency.linearRampToValueAtTime(freq * 12, time + 0.6);
      
      sweepGain.gain.setValueAtTime(0.01, time);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      
      sweepOsc.start(time);
      sweepOsc.stop(time + 0.65);
    }
  } 
  else if (activeMusicStyle === 'glitch') {
    // Rítmica fragmentada y tonos erráticos de alta tecnología
    if (step % 3 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(compressorNode); // Conectar al compresor
      
      osc.type = 'square';
      const randFreq = 600 + Math.random() * 2200;
      osc.frequency.setValueAtTime(randFreq, time);
      
      gain.gain.setValueAtTime(0.008, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      
      osc.start(time);
      osc.stop(time + 0.05);
    }

    // Bajo blip errático
    if (step % 2 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(compressorNode); // Conectar al compresor
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(45.0, time);
      
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      osc.start(time);
      osc.stop(time + 0.1);
    }
  }
}

// ==========================================================================
// LOOP DE REPRODUCCIÓN & RENDER
// ==========================================================================
function updateTimeline(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const dt = (timestamp - lastFrameTime) / 1000.0;
  lastFrameTime = timestamp;

  if (isPlaying) {
    currentTime += dt;
    if (currentTime >= totalDuration) {
      currentTime = 0.0;
    }
    const slider = document.getElementById('timeline');
    if (slider) {
      slider.value = (currentTime / totalDuration) * 100.0;
    }
    renderCurrentState();
  }

  requestAnimationFrame(updateTimeline);
}

function renderCurrentState() {
  // Encontrar la escena actual según currentTime
  let accumulatedTime = 0.0;
  let activeScene = CAMPAIGN_SCENES[0];
  
  for (const scene of CAMPAIGN_SCENES) {
    if (currentTime >= accumulatedTime && currentTime < (accumulatedTime + scene.duration)) {
      activeScene = scene;
      break;
    }
    accumulatedTime += scene.duration;
  }

  // Sincronizar barra de llenado
  const percentage = (currentTime / totalDuration) * 100.0;
  const fill = document.getElementById('timeline-fill');
  if (fill) fill.style.width = `${percentage}%`;
  
  // Actualizar indicadores de tiempo
  const display = document.getElementById('time-current');
  if (display) display.innerText = currentTime.toFixed(1);

  // Gatillar sonido y transición si cambia la escena activa
  if (activeScene.id !== activeSceneId) {
    activeSceneId = activeScene.id;
    
    // Gatillar tono sintetizado
    playSynthesizedSound(activeScene.soundType);
    
    // Aplicar transiciones visuales
    renderSceneInViewport(activeScene);
    highlightActiveSceneEditor(activeScene.id);
  }

  // Efecto de paralaje sutil del fondo con el tiempo
  const bg = document.getElementById('video-bg');
  if (bg) {
    bg.style.transform = activeScene.bgTransform;
  }
}

function renderSceneInViewport(scene) {
  const container = document.getElementById('scene-container');
  if (!container) return;

  // Limpiar cualquier intervalo activo de máquina de escribir
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }

  // Configurar alineación vertical
  container.className = 'scene-stage'; // reset
  const alignClass = `align-${scene.textPosition || 'center'}`;
  container.classList.add(alignClass);

  let extraHtml = '';
  if (scene.extraUi === 'dashboard-wireframe') {
    extraHtml = `
      <div class="ui-simulation-box">
        <div class="ui-row accent"></div>
        <div class="ui-row"></div>
        <div class="ui-row short"></div>
      </div>
    `;
  } else if (scene.extraUi === 'otp-wireframe') {
    extraHtml = `
      <div class="ui-simulation-box" style="position: relative; text-align: center;">
        <div style="font-size: 16px; margin-bottom: 6px;">🔒 2FA</div>
        <div style="display:flex; justify-content:center; gap:6px; margin-top:10px;">
          <div style="width:14px; height:18px; background:var(--accent); border-radius:3px; opacity:0.8;"></div>
          <div style="width:14px; height:18px; background:var(--accent); border-radius:3px; opacity:0.8;"></div>
          <div style="width:14px; height:18px; background:var(--accent); border-radius:3px; opacity:0.8;"></div>
          <div style="width:14px; height:18px; background:rgba(255,255,255,0.1); border-radius:3px;"></div>
          <div style="width:14px; height:18px; background:rgba(255,255,255,0.1); border-radius:3px;"></div>
          <div style="width:14px; height:18px; background:rgba(255,255,255,0.1); border-radius:3px;"></div>
        </div>
        <div class="ui-pulse-indicator"></div>
      </div>
    `;
  } else if (scene.extraUi === 'cta-glow') {
    extraHtml = `
      <div style="margin-top: 24px; animation: pulseGlow 1.5s infinite alternate;">
        <button class="btn" style="background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color:#000; border:none; width: 140px; height: 32px; font-size:10px; font-weight:900; border-radius: 16px;">
          PROBAR AHORA <i class="ri-arrow-right-line"></i>
        </button>
      </div>
    `;
  } else if (scene.extraUi === 'danger-glow') {
    extraHtml = `
      <div style="margin-top: 15px; color: var(--danger); font-size: 40px; filter: drop-shadow(0 0 10px rgba(255, 56, 96, 0.4));">
        <i class="ri-shield-user-line"></i>
      </div>
    `;
  }

  // Colores e intesidades personalizadas
  const tColor = scene.titleColor || '#ffffff';
  const sizeClass = `title-${scene.titleSize || 'medium'}`;
  const animClass = `anim-${scene.textAnimation || 'slide-up'}`;

  container.innerHTML = `
    <div class="${animClass} animate-glow">
      <i class="${scene.icon} video-icon"></i>
      <h2 class="video-title ${sizeClass}" style="color: ${tColor};">${scene.title}</h2>
      <p class="video-desc" id="typewriter-desc-${scene.id}">${scene.textAnimation === 'typewriter' ? '' : scene.desc}</p>
      ${extraHtml}
    </div>
  `;

  // Gatillar máquina de escribir si se requiere
  if (scene.textAnimation === 'typewriter') {
    const descEl = document.getElementById(`typewriter-desc-${scene.id}`);
    if (descEl) {
      let charIdx = 0;
      const text = scene.desc;
      typewriterInterval = setInterval(() => {
        if (charIdx < text.length) {
          descEl.innerText += text.charAt(charIdx);
          charIdx++;
        } else {
          clearInterval(typewriterInterval);
          typewriterInterval = null;
        }
      }, 35);
    }
  }
}

// ==========================================================================
// CONTROLES DE LÍNEA DE TIEMPO E INTERACCIONES
// ==========================================================================
function togglePlay() {
  initAudioContext();
  isPlaying = !isPlaying;
  const playIcon = document.getElementById('play-icon');
  
  if (isPlaying) {
    if (playIcon) playIcon.className = 'ri-pause-fill';
    lastFrameTime = performance.now();
    startMusicLoop();
    showToast("Comercial en reproducción", "info");
  } else {
    if (playIcon) playIcon.className = 'ri-play-fill';
    stopMusicLoop();
    showToast("Comercial pausado", "info");
  }
}

function restartVideo() {
  currentTime = 0.0;
  activeSceneId = null; // forzar gatillado de animación
  if (!isPlaying) {
    renderCurrentState();
  } else {
    // Si ya se está reproduciendo, reiniciar secuenciador musical
    stopMusicLoop();
    startMusicLoop();
  }
  showToast("Video reiniciado", "info");
}

function onTimelineSliderInput(value) {
  currentTime = (parseFloat(value) / 100.0) * totalDuration;
  renderCurrentState();
}

function toggleMute() {
  initAudioContext();
  isMuted = !isMuted;
  const muteIcon = document.getElementById('mute-icon');
  if (isMuted) {
    if (muteIcon) muteIcon.className = 'ri-volume-mute-fill';
    stopMusicLoop();
    showToast("Efectos de sonido silenciados", "warning");
  } else {
    if (muteIcon) muteIcon.className = 'ri-volume-up-fill';
    startMusicLoop();
    showToast("Efectos de sonido y musicalización activados", "success");
    playSynthesizedSound('lock'); // sonar para verificar
  }
}

// ==========================================================================
// PANEL EDITOR DE CAMPANAS (DINÁMICO)
// ==========================================================================
function buildScenesEditor() {
  const container = document.getElementById('scenes-editor-container');
  if (!container) return;

  container.innerHTML = CAMPAIGN_SCENES.map(scene => `
    <div class="scene-card" id="editor-card-${scene.id}">
      <h3>Escena <span>#${scene.id}</span></h3>
      <div class="form-group">
        <label class="form-label">Título de la Escena</label>
        <input type="text" class="form-input" value="${scene.title}" oninput="updateSceneProperty(${scene.id}, 'title', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción del Copy</label>
        <textarea class="form-input" style="resize: none; height: 50px;" oninput="updateSceneProperty(${scene.id}, 'desc', this.value)">${scene.desc}</textarea>
      </div>
      
      <div class="form-group-row" style="margin-top: 8px;">
        <div class="form-group">
          <label class="form-label">Animación</label>
          <select class="form-input" onchange="updateSceneProperty(${scene.id}, 'textAnimation', this.value)" style="background: #000; border: 1px solid var(--border-glass); color: #fff;">
            <option value="slide-up" ${scene.textAnimation === 'slide-up' ? 'selected' : ''}>Deslizar</option>
            <option value="glitch" ${scene.textAnimation === 'glitch' ? 'selected' : ''}>Glitch</option>
            <option value="typewriter" ${scene.textAnimation === 'typewriter' ? 'selected' : ''}>Máquina</option>
            <option value="fade-in" ${scene.textAnimation === 'fade-in' ? 'selected' : ''}>Desvanecer</option>
            <option value="zoom-in" ${scene.textAnimation === 'zoom-in' ? 'selected' : ''}>Zoom</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Posición</label>
          <select class="form-input" onchange="updateSceneProperty(${scene.id}, 'textPosition', this.value)" style="background: #000; border: 1px solid var(--border-glass); color: #fff;">
            <option value="center" ${scene.textPosition === 'center' ? 'selected' : ''}>Centro</option>
            <option value="top" ${scene.textPosition === 'top' ? 'selected' : ''}>Arriba</option>
            <option value="bottom" ${scene.textPosition === 'bottom' ? 'selected' : ''}>Abajo</option>
          </select>
        </div>
      </div>

      <div class="form-group-row" style="margin-top: 8px;">
        <div class="form-group">
          <label class="form-label">Color Título</label>
          <input type="color" class="form-input" value="${scene.titleColor || '#ffffff'}" onchange="updateSceneProperty(${scene.id}, 'titleColor', this.value)" style="height:32px; padding: 2px;">
        </div>
        <div class="form-group">
          <label class="form-label">Tamaño</label>
          <select class="form-input" onchange="updateSceneProperty(${scene.id}, 'titleSize', this.value)" style="background: #000; border: 1px solid var(--border-glass); color: #fff;">
            <option value="small" ${scene.titleSize === 'small' ? 'selected' : ''}>Pequeño</option>
            <option value="medium" ${scene.titleSize === 'medium' ? 'selected' : ''}>Mediano</option>
            <option value="large" ${scene.titleSize === 'large' ? 'selected' : ''}>Grande</option>
            <option value="xlarge" ${scene.titleSize === 'xlarge' ? 'selected' : ''}>Gigante</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

function updateSceneProperty(sceneId, property, value) {
  const scene = CAMPAIGN_SCENES.find(s => s.id === sceneId);
  if (scene) {
    scene[property] = value;
    // Si la escena editada es la que está en pantalla, actualizar de inmediato
    if (activeSceneId === sceneId) {
      renderSceneInViewport(scene);
    }
  }
}

// Para compatibilidad hacia atrás
function updateSceneText(sceneId, field, value) {
  updateSceneProperty(sceneId, field, value);
}

function highlightActiveSceneEditor(sceneId) {
  CAMPAIGN_SCENES.forEach(scene => {
    const card = document.getElementById(`editor-card-${scene.id}`);
    if (card) {
      if (scene.id === sceneId) {
        card.style.borderColor = 'var(--accent)';
        card.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.1)';
      } else {
        card.style.borderColor = 'var(--border-glass)';
        card.style.boxShadow = 'none';
      }
    }
  });
}

function resetDefaultTexts() {
  CAMPAIGN_SCENES = JSON.parse(JSON.stringify(DEFAULT_TEXTS));
  buildScenesEditor();
  if (activeSceneId) {
    const active = CAMPAIGN_SCENES.find(s => s.id === activeSceneId);
    if (active) renderSceneInViewport(active);
  }
  showToast("Textos y propiedades restablecidos", "success");
}

function updateThemeColors() {
  const primary = document.getElementById('cfg-color-primary').value;
  const secondary = document.getElementById('cfg-color-secondary').value;
  
  document.documentElement.style.setProperty('--accent', primary);
  document.documentElement.style.setProperty('--accent-secondary', secondary);
  
  showToast("Colores de campaña actualizados", "success");
}

// Función para aplicar paletas preconfiguradas rápidamente (Sugerencia 6)
window.applyPresetPalette = function(primary, secondary, name) {
  const pSanitized = sanitizeColorHex(primary, '#00e5ff');
  const sSanitized = sanitizeColorHex(secondary, '#3b82f6');

  document.documentElement.style.setProperty('--accent', pSanitized);
  document.documentElement.style.setProperty('--accent-secondary', sSanitized);

  const inputC1 = document.getElementById('cfg-color-primary');
  const inputC2 = document.getElementById('cfg-color-secondary');
  if (inputC1) inputC1.value = pSanitized;
  if (inputC2) inputC2.value = sSanitized;

  showToast(`Paleta "${name}" aplicada con éxito.`, "success");
};

// ==========================================================================
// TOASTS NOTIFICADORES
// ==========================================================================
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg || !icon) return;

  const icons = { info: '⚡', success: '✅', warning: '⚠️', danger: '🛑' };
  
  let border = "var(--border-glass)";
  if (type === 'success') border = "rgba(34, 197, 94, 0.3)";
  else if (type === 'danger') border = "rgba(239, 68, 68, 0.3)";
  else if (type === 'warning') border = "rgba(245, 158, 11, 0.3)";

  toast.style.borderColor = border;
  icon.innerText = icons[type] || '✨';
  msg.innerHTML = message;

  toast.classList.add('show');
  
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Cargar imports dinámicos de la IA si existen en la sesión
  const importGoal = sessionStorage.getItem('alr_saas_promo_import_goal');
  const importC1 = sessionStorage.getItem('alr_saas_promo_import_c1');
  const importC2 = sessionStorage.getItem('alr_saas_promo_import_c2');

  const importTitle = sessionStorage.getItem('alr_saas_promo_import_title');
  const importCopy = sessionStorage.getItem('alr_saas_promo_import_copy');

  if (importGoal) {
    // Sobrescribir copys de escenas 1, 3 y 5 con el objetivo procesado o la sugerencia de copy personalizada
    if (importTitle) CAMPAIGN_SCENES[0].title = importTitle;
    CAMPAIGN_SCENES[0].desc = importCopy || `Servicio Premium ALR: ${importGoal}. Control de accesos y administración.`;
    CAMPAIGN_SCENES[2].desc = importCopy ? `Optimización en vivo. Campaña activa: "${importTitle || importGoal}".` : `Optimiza tu negocio. Campaña activa: "${importGoal}" con reportes de telemetría.`;
    CAMPAIGN_SCENES[4].desc = importCopy ? `¡Únete ahora! ${importCopy}` : `¡Aprovecha hoy mismo! ${importGoal}. Calidad garantizada.`;
    
    sessionStorage.removeItem('alr_saas_promo_import_goal');
    if (importTitle) sessionStorage.removeItem('alr_saas_promo_import_title');
    if (importCopy) sessionStorage.removeItem('alr_saas_promo_import_copy');
  }

  if (importC1 && importC2) {
    document.documentElement.style.setProperty('--accent', importC1);
    document.documentElement.style.setProperty('--accent-secondary', importC2);
    
    const inputC1 = document.getElementById('cfg-color-primary');
    const inputC2 = document.getElementById('cfg-color-secondary');
    if (inputC1) inputC1.value = importC1;
    if (inputC2) inputC2.value = importC2;
    
    sessionStorage.removeItem('alr_saas_promo_import_c1');
    sessionStorage.removeItem('alr_saas_promo_import_c2');
  }

  buildScenesEditor();
  renderCurrentState();
  
  // Iniciar loop de frames
  requestAnimationFrame(updateTimeline);
  
  // Sincronización del Video de Referencia
  window.syncPlayWithReference = function() {
    const refVideo = document.getElementById('ref-video-player');
    if (!refVideo) return;
    
    // Si el simulador está pausado, reproducir ambos
    if (!isPlaying) {
      refVideo.currentTime = (currentTime / totalDuration) * refVideo.duration;
      refVideo.play();
      togglePlay();
    } else {
      refVideo.pause();
      togglePlay();
    }
  };

  // Soporte para cargar presets compartidos mediante URL hash base64 comprimida (Sugerencia 3)
  try {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#preset=')) {
      const base64Data = hash.substring(8);
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const payload = JSON.parse(jsonStr);
      
      // Validar esquema estricto de forma segura con sanitizaciones y whitelists (Sugerencia 3)
      if (payload && typeof payload === 'object') {
        if (payload.a && typeof payload.a === 'string') {
          const accent = sanitizeColorHex(payload.a, '#00e5ff');
          document.documentElement.style.setProperty('--accent', accent);
          const inputC1 = document.getElementById('cfg-color-primary');
          if (inputC1) inputC1.value = accent;
        }
        if (payload.as && typeof payload.as === 'string') {
          const accentSec = sanitizeColorHex(payload.as, '#3b82f6');
          document.documentElement.style.setProperty('--accent-secondary', accentSec);
          const inputC2 = document.getElementById('cfg-color-secondary');
          if (inputC2) inputC2.value = accentSec;
        }
        if (payload.m && typeof payload.m === 'string') {
          activeMusicStyle = getWhiteListOrDefault(payload.m, WHITE_LIST_MUSIC_STYLES, 'synthwave');
          const mSelect = document.getElementById('cfg-music-style');
          if (mSelect) mSelect.value = activeMusicStyle;
        }
        if (Array.isArray(payload.s)) {
          payload.s.forEach((scData, idx) => {
            if (Array.isArray(scData) && scData.length >= 2 && CAMPAIGN_SCENES[idx]) {
              if (typeof scData[0] === 'string') CAMPAIGN_SCENES[idx].title = scData[0].substring(0, 50);
              if (typeof scData[1] === 'string') CAMPAIGN_SCENES[idx].desc = scData[1].substring(0, 200);
              if (typeof scData[2] === 'string') CAMPAIGN_SCENES[idx].textAnimation = getWhiteListOrDefault(scData[2], WHITE_LIST_ANIMATIONS, 'slide-up');
              if (typeof scData[3] === 'string') CAMPAIGN_SCENES[idx].textPosition = getWhiteListOrDefault(scData[3], WHITE_LIST_POSITIONS, 'center');
              if (typeof scData[4] === 'string') CAMPAIGN_SCENES[idx].titleColor = sanitizeColorHex(scData[4], '#ffffff');
              if (typeof scData[5] === 'string') CAMPAIGN_SCENES[idx].titleSize = getWhiteListOrDefault(scData[5], WHITE_LIST_SIZES, 'medium');
            }
          });
          buildScenesEditor();
          renderCurrentState();
          showToast("Campaña cargada desde el enlace compartido.", "success");
        }
      }
    }
  } catch (e) {
    console.error("Error loading shareable preset", e);
  }

  if (importGoal) {
    showToast("Campaña de IA cargada y adaptada con éxito.", "success");
  }
});

// Función para compilar la campaña actual y generar el enlace de video compartido acortado
window.buildAndExportVideoCampaign = function() {
  showToast("Generando render de video y compilando metadatos...", "info");
  
  setTimeout(() => {
    try {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const accentSec = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
      
      // Comprimir nombres de campos y omitir redundancias para acortar URL
      const payload = {
        a: accent,
        as: accentSec,
        m: activeMusicStyle,
        s: CAMPAIGN_SCENES.map(sc => [
          sc.title,
          sc.desc,
          sc.textAnimation,
          sc.textPosition,
          sc.titleColor,
          sc.titleSize
        ])
      };
      
      const jsonStr = JSON.stringify(payload);
      const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
      
      // Construir enlace web de visualización directa
      const shareUrl = `${window.location.origin}${window.location.pathname}#preset=${base64Data}`;
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("¡Link copiado con éxito! Puedes compartirlo.", "success");
      }).catch(() => {
        showToast("Campaña compilada. Copia la URL de tu navegador.", "info");
      });
      
      // Mostrar modal
      const userChoice = confirm("¡Campaña de video compilada con éxito!\n\nSe ha generado un enlace dinámico único que carga esta campaña, la paleta de colores y la musicalización de forma automática.\n\n¿Deseas abrir el enlace de la campaña en una pestaña nueva ahora mismo?");
      if (userChoice) {
        window.open(shareUrl, '_blank');
      }
    } catch (e) {
      console.error("Export process failed", e);
      showToast("Error al compilar metadatos de campaña.", "danger");
    }
  }, 1200);
};

// Función para guardar la configuración de la campaña en un fichero JSON local
window.exportCampaignJsonFile = function() {
  try {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const accentSec = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
    const payload = {
      accent: accent,
      accentSec: accentSec,
      musicStyle: activeMusicStyle,
      scenes: CAMPAIGN_SCENES.map(s => ({
        title: s.title,
        desc: s.desc,
        textAnimation: s.textAnimation,
        textPosition: s.textPosition,
        titleColor: s.titleColor,
        titleSize: s.titleSize
      }))
    };
    
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Campana_Video_ALR_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("Archivo de campaña guardado con éxito.", "success");
  } catch (e) {
    console.error("Failed to export JSON file", e);
    showToast("Error al exportar el archivo.", "danger");
  }
};

// Función para cargar la configuración de la campaña desde un fichero JSON local
window.importCampaignJsonFile = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const payload = JSON.parse(e.target.result);
      if (payload && typeof payload === 'object') {
        if (payload.accent && typeof payload.accent === 'string') {
          const accent = sanitizeColorHex(payload.accent, '#00e5ff');
          document.documentElement.style.setProperty('--accent', accent);
          const inputC1 = document.getElementById('cfg-color-primary');
          if (inputC1) inputC1.value = accent;
        }
        if (payload.accentSec && typeof payload.accentSec === 'string') {
          const accentSec = sanitizeColorHex(payload.accentSec, '#3b82f6');
          document.documentElement.style.setProperty('--accent-secondary', accentSec);
          const inputC2 = document.getElementById('cfg-color-secondary');
          if (inputC2) inputC2.value = accentSec;
        }
        if (payload.musicStyle && typeof payload.musicStyle === 'string') {
          activeMusicStyle = getWhiteListOrDefault(payload.musicStyle, WHITE_LIST_MUSIC_STYLES, 'synthwave');
          const mSelect = document.getElementById('cfg-music-style');
          if (mSelect) mSelect.value = activeMusicStyle;
        }
        if (Array.isArray(payload.scenes)) {
          payload.scenes.forEach((scData, idx) => {
            if (scData && CAMPAIGN_SCENES[idx]) {
              if (scData.title && typeof scData.title === 'string') CAMPAIGN_SCENES[idx].title = scData.title.substring(0, 50);
              if (scData.desc && typeof scData.desc === 'string') CAMPAIGN_SCENES[idx].desc = scData.desc.substring(0, 200);
              if (scData.textAnimation && typeof scData.textAnimation === 'string') {
                CAMPAIGN_SCENES[idx].textAnimation = getWhiteListOrDefault(scData.textAnimation, WHITE_LIST_ANIMATIONS, 'slide-up');
              }
              if (scData.textPosition && typeof scData.textPosition === 'string') {
                CAMPAIGN_SCENES[idx].textPosition = getWhiteListOrDefault(scData.textPosition, WHITE_LIST_POSITIONS, 'center');
              }
              if (scData.titleColor && typeof scData.titleColor === 'string') {
                CAMPAIGN_SCENES[idx].titleColor = sanitizeColorHex(scData.titleColor, '#ffffff');
              }
              if (scData.titleSize && typeof scData.titleSize === 'string') {
                CAMPAIGN_SCENES[idx].titleSize = getWhiteListOrDefault(scData.titleSize, WHITE_LIST_SIZES, 'medium');
              }
            }
          });
          buildScenesEditor();
          renderCurrentState();
          showToast("Campañas cargadas del archivo con éxito.", "success");
        }
      }
    } catch (err) {
      console.error("Failed to parse JSON file", err);
      showToast("Error de sintaxis en el archivo JSON.", "danger");
    }
  };
  reader.readAsText(file);
};

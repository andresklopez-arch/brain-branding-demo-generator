/* ==========================================================================
   BRAIN BRANDING PROMO STUDIO — app.js v2.2 (7 Mejoras + Limpieza)
   ========================================================================== */

// ──────────────────────────────────────────────────────────────
// 1. HELPERS & DATA FACTORIES
// ──────────────────────────────────────────────────────────────
function generateId() { return 'el-' + Math.random().toString(36).substr(2, 8); }

function defaultTextElement(o = {}) {
  return {
    id: generateId(), type: 'text', content: 'Nuevo Texto',
    x: 50, y: 50, fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', color: '#ffffff',
    textAlign: 'center', italic: false, underline: false, textShadow: false, textShadowColor: '#000000', textShadowBlur: 10,
    letterSpacing: -0.5, lineHeight: 1.15, bgColor: 'transparent', bgPadding: 0, bgRadius: 0,
    opacity: 1, brightness: 100, contrast: 100, blur: 0, strobe: false, strobeSpeed: 0.25,
    fillScreen: false, duplicate: false, enterAt: 0, exitAt: null, enterAnimation: 'slide-up', exitAnimation: 'fade-out', rotation: 0, width: null,
    ...o
  };
}

function defaultImageElement(o = {}) {
  return {
    id: generateId(), type: 'image', src: null, x: 50, y: 50, width: 70, borderRadius: 8,
    opacity: 1, brightness: 100, contrast: 100, blur: 0, strobe: false, strobeSpeed: 0.25,
    enterAt: 0, exitAt: null, enterAnimation: 'fade-in', exitAnimation: 'fade-out', rotation: 0,
    ...o
  };
}

function defaultShapeElement(o = {}) {
  return {
    id: generateId(), type: 'shape', x: 50, y: 50, width: 80, height: 6,
    bgColor: 'rgba(0,240,255,0.3)', borderRadius: 4, opacity: 1, enterAt: 0, exitAt: null, enterAnimation: 'fade-in', exitAnimation: 'fade-out',
    ...o
  };
}

// ──────────────────────────────────────────────────────────────
// 2. DEFAULT SCENES (Limpio de textos originales)
// ──────────────────────────────────────────────────────────────
const DEFAULT_SCENES = [
  { id:1, name:'Gancho 1', duration:1.2, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 50% 50%, #180830 0%, #050508 100%)', elements:[] },
  { id:2, name:'Gancho 2', duration:1.3, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 50% 50%, #180830 0%, #050508 100%)', elements:[] },
  { id:3, name:'Bombero', duration:2.1, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 30% 60%, #1a0a00 0%, #050508 100%)', elements:[] },
  { id:4, name:'App Genérica', duration:2.5, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 70% 30%, #0a001a 0%, #050508 100%)', elements:[] },
  { id:5, name:'Fricción', duration:1.5, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 50% 50%, #150015 0%, #050508 100%)', elements:[] },
  { id:6, name:'ZzZz...', duration:1.5, bgColor:'#ffffff', bgImage:null, bgGradient:null, elements:[] },
  { id:7, name:'IA Adaptativa', duration:3.5, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 50% 30%, #001830 0%, #050508 100%)', elements:[] },
  { id:8, name:'Lo Necesario', duration:2.0, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 50% 50%, #100020 0%, #050508 100%)', elements:[] },
  { id:9, name:'Cierre Brain', duration:2.5, bgColor:'#05050a', bgImage:null, bgGradient:'radial-gradient(circle at 50% 50%, #000a1a 0%, #050508 100%)', elements:[] }
];

// ──────────────────────────────────────────────────────────────
// 3. APP STATE & HISTORY (Undo/Redo & AutoSave)
// ──────────────────────────────────────────────────────────────
let STATE = {
  scenes: JSON.parse(JSON.stringify(DEFAULT_SCENES)),
  activeSceneId: 1, selectedElementId: null, activeTab: 'scenes',
  isPlaying: false, isMuted: true, currentTime: 0, totalDuration: 0,
  logoSrc: null, globalAccent: '#00f0ff', globalAccentSec: '#9d00ff',
  audioCtx: null, audioNodes: null, audioReady: false, voiceSource: null, voiceAnalyser: null, masterVolume: 0.85, duckingLevel: 0.15
};

let HISTORY_PAST = [];
let HISTORY_FUTURE = [];
let isUndoRedoAction = false;
let autoSaveTimer = null;

const DRAG = { active:false, elementId:null, startX:0, startY:0, startElX:0, startElY:0, screenRect:null };
let BLOB_URLS = {};
let videoPlayer = null;
let voicePlayer = null;
let referenceVideo = null;
let refVolumeGain = null;
let isSceneLoopActive = localStorage.getItem('bb_promo_scene_loop_active') === 'true';

// Variables globales para grabación de voz, TTS y recorte
let mediaRecorder = null;
let recordedChunks = [];
let isRecordingVoice = false;
let currentDecodedVoiceBuffer = null;
let originalUploadedVoiceBuffer = null;
let currentDetectedSilences = [];
let VOICE_LIBRARY = [];
let activeSceneRecordingId = null;

// Monitoreo VU Meter
let micStreamSource = null;
let micAnalyser = null;
let micAnimationId = null;

function saveState(label = 'Modificación') {
  if (isUndoRedoAction) return;
  const snapshot = JSON.parse(JSON.stringify({
    scenes: STATE.scenes, activeSceneId: STATE.activeSceneId,
    logoSrc: STATE.logoSrc, globalAccent: STATE.globalAccent,
    globalAccentSec: STATE.globalAccentSec, masterVolume: STATE.masterVolume,
    duckingLevel: STATE.duckingLevel,
    label: label
  }));
  HISTORY_PAST.push(snapshot);
  if (HISTORY_PAST.length > 30) HISTORY_PAST.shift();
  HISTORY_FUTURE = [];
  updateHistoryButtons();
  updateHistoryDropdown();
  
  // Auto-Save con debounce
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => { saveToStorage(); }, 1000);
}

function undo() {
  if (HISTORY_PAST.length === 0) return;
  isUndoRedoAction = true;
  HISTORY_FUTURE.push(JSON.parse(JSON.stringify({
    scenes: STATE.scenes, activeSceneId: STATE.activeSceneId,
    logoSrc: STATE.logoSrc, globalAccent: STATE.globalAccent,
    globalAccentSec: STATE.globalAccentSec, masterVolume: STATE.masterVolume,
    label: 'Deshacer'
  })));
  const prevState = HISTORY_PAST.pop();
  applyState(prevState);
  isUndoRedoAction = false;
  updateHistoryButtons();
  updateHistoryDropdown();
  saveToStorage();
}

function redo() {
  if (HISTORY_FUTURE.length === 0) return;
  isUndoRedoAction = true;
  HISTORY_PAST.push(JSON.parse(JSON.stringify({
    scenes: STATE.scenes, activeSceneId: STATE.activeSceneId,
    logoSrc: STATE.logoSrc, globalAccent: STATE.globalAccent,
    globalAccentSec: STATE.globalAccentSec, masterVolume: STATE.masterVolume,
    label: 'Rehacer'
  })));
  const nextState = HISTORY_FUTURE.pop();
  applyState(nextState);
  isUndoRedoAction = false;
  updateHistoryButtons();
  updateHistoryDropdown();
  saveToStorage();
}

function updateHistoryButtons() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = HISTORY_PAST.length === 0;
  if (btnRedo) btnRedo.disabled = HISTORY_FUTURE.length === 0;
}

function updateHistoryDropdown() {
  const dropdown = document.getElementById('history-dropdown');
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">Acciones...</option>';
  
  const startIdx = Math.max(0, HISTORY_PAST.length - 10);
  for (let i = HISTORY_PAST.length - 1; i >= startIdx; i--) {
    const state = HISTORY_PAST[i];
    const label = state.label || `Acción #${i + 1}`;
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${HISTORY_PAST.length - i}. ${label}`;
    dropdown.appendChild(option);
  }
}

function jumpToHistoryIndex(idxVal) {
  if (idxVal === "") return;
  const idx = parseInt(idxVal);
  if (isNaN(idx) || idx < 0 || idx >= HISTORY_PAST.length) return;
  
  isUndoRedoAction = true;
  
  const currentState = JSON.parse(JSON.stringify({
    scenes: STATE.scenes, activeSceneId: STATE.activeSceneId,
    logoSrc: STATE.logoSrc, globalAccent: STATE.globalAccent,
    globalAccentSec: STATE.globalAccentSec, masterVolume: STATE.masterVolume,
    label: 'Antes de saltar'
  }));
  HISTORY_FUTURE.push(currentState);
  
  while (HISTORY_PAST.length - 1 > idx) {
    const state = HISTORY_PAST.pop();
    HISTORY_FUTURE.push(state);
  }
  
  const targetState = HISTORY_PAST.pop();
  applyState(targetState);
  
  isUndoRedoAction = false;
  updateHistoryButtons();
  updateHistoryDropdown();
  saveToStorage();
  showToast('Historial restaurado', 'success');
}

function applyState(partialState) {
  Object.assign(STATE, partialState);
  updateGlobalColor('accent', STATE.globalAccent, false);
  updateGlobalColor('accent-sec', STATE.globalAccentSec, false);
  computeTotalDuration();
  renderScene(getActiveScene());
  buildScenesPanel();
  buildGlobalPanel();
  buildTimeline();
  buildSceneIndicator();
  if (STATE.selectedElementId) selectElement(STATE.selectedElementId);
  else deselectElement();
}

function saveToStorage() {
  localStorage.setItem('bb_promo_v2_autosave', JSON.stringify({
    scenes: STATE.scenes, globalAccent: STATE.globalAccent, globalAccentSec: STATE.globalAccentSec, masterVolume: STATE.masterVolume, duckingLevel: STATE.duckingLevel
  }));
  
  // Destellar LED de autoguardado
  const led = document.getElementById('autosave-led');
  const text = document.getElementById('autosave-indicator');
  if (led && text) {
    led.style.background = '#00ffaa'; // Green active color
    text.style.opacity = '1';
    setTimeout(() => {
      led.style.background = 'var(--accent)'; // Cyan normal color
      text.style.opacity = '0.5';
    }, 1000);
  }
}

function loadFromStorage() {
  const saved = localStorage.getItem('bb_promo_v2_autosave');
  if (saved) {
    if(confirm('Se encontró un proyecto de auto-guardado reciente. ¿Deseas restaurarlo?')) {
      const data = JSON.parse(saved);
      applyState(data);
      showToast('Proyecto auto-guardado restaurado', 'success');
    } else {
      localStorage.removeItem('bb_promo_v2_autosave');
      saveState(); // Guardar el estado inicial en blanco en el historial
    }
  } else {
    saveState();
  }
}

// ──────────────────────────────────────────────────────────────
// 4. INIT
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  videoPlayer = document.getElementById('ref-video');
  voicePlayer = document.getElementById('voice-player');
  referenceVideo = document.getElementById('reference-video');
  videoPlayer.muted = true;
  if (referenceVideo) referenceVideo.muted = true; 

  computeTotalDuration();
  
  const loadedFromHash = checkUrlHashCampaign();
  if (!loadedFromHash) {
    loadFromStorage();
  } else {
    saveState(); // Guardar en historial para permitir deshacer
  }

  buildScenesPanel();
  buildGlobalPanel();
  buildTimeline();
  buildSceneIndicator();
  renderScene(getActiveScene());

  // Inicializar estado visual del bucle de escena
  const loopIcon = document.getElementById('loop-scene-icon');
  const loopBtn = document.getElementById('btn-loop-scene');
  if (loopIcon) {
    if (isSceneLoopActive) {
      loopIcon.style.color = 'var(--accent)';
      if (loopBtn) loopBtn.title = "Bucle por escena activo (Repitiendo escena actual)";
    } else {
      loopIcon.style.color = 'var(--text-gray)';
      if (loopBtn) loopBtn.title = "Repetir escena actual (Bucle)";
    }
  }

  videoPlayer.addEventListener('timeupdate', onVideoTimeUpdate);
  videoPlayer.addEventListener('ended', restartVideo);

  if (referenceVideo) {
    const loader = document.getElementById('ref-loader');
    referenceVideo.addEventListener('loadstart', () => {
      if (loader) loader.style.display = 'flex';
    });
    referenceVideo.addEventListener('canplay', () => {
      if (loader) loader.style.display = 'none';
    });
    referenceVideo.addEventListener('error', () => {
      if (loader) loader.style.display = 'none';
      showToast('Error al cargar el video de referencia', 'warning');
    });

    referenceVideo.addEventListener('play', () => {
      if (STATE.audioCtx) {
        try {
          if (STATE.audioCtx.state === 'suspended') {
            STATE.audioCtx.resume().catch(e => console.warn('AudioContext resume rejected:', e));
          }
        } catch (e) {
          console.error('AudioContext resume failed:', e);
        }
      } else if (!STATE.audioReady) {
        initAudioEffects();
      }
      
      // Recordatorio de silencio
      if (STATE.isMuted) {
        showToast('La aplicación está silenciada. Activa el sonido arriba para escuchar el video.', 'info');
      }
      
      // Pausar video principal si está en reproducción
      if (STATE.isPlaying && videoPlayer && !videoPlayer.paused) {
        videoPlayer.pause();
        if (voicePlayer) voicePlayer.pause();
        STATE.isPlaying = false;
        const playIcon = document.getElementById('play-icon');
        if (playIcon) playIcon.className = 'ri-play-fill';
      }
    });

    // Restaurar nombre del video de referencia anterior de localStorage
    const savedRefName = localStorage.getItem('bb_promo_ref_video_name');
    if (savedRefName) {
      const refInfo = document.querySelector('.ref-info');
      if (refInfo) refInfo.innerText = `Último video: ${savedRefName}. Cárgalo de nuevo si es necesario.`;
    }

    // Atajos de teclado para el video de referencia y el simulador principal
    let isMouseOverRef = false;
    const refPanel = document.querySelector('.reference-panel');
    if (refPanel) {
      refPanel.addEventListener('mouseenter', () => { isMouseOverRef = true; });
      refPanel.addEventListener('mouseleave', () => { isMouseOverRef = false; });
    }

    // Volumen de referencia con rueda del ratón (requiere Shift)
    if (referenceVideo) {
      referenceVideo.addEventListener('wheel', (e) => {
        if (!e.shiftKey) return;
        e.preventDefault();
        const slider = document.getElementById('ref-volume-slider');
        if (slider) {
          let currentVol = parseFloat(slider.value);
          if (e.deltaY < 0) {
            currentVol = Math.min(1.0, currentVol + 0.05);
          } else {
            currentVol = Math.max(0.0, currentVol - 0.05);
          }
          slider.value = currentVol;
          updateReferenceVolume(currentVol);
        }
      }, { passive: false });
    }

    let isMouseOverMain = false;
    const mainScreen = document.getElementById('promo-screen');
    if (mainScreen) {
      mainScreen.addEventListener('mouseenter', () => { isMouseOverMain = true; });
      mainScreen.addEventListener('mouseleave', () => { isMouseOverMain = false; });
    }

    document.addEventListener('keydown', (e) => {
      // Atajos de la Referencia
      if (isMouseOverRef) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (referenceVideo.paused) {
            referenceVideo.play().catch(err => console.warn(err));
          } else {
            referenceVideo.pause();
          }
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          stepReferenceFrame(-0.03);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          stepReferenceFrame(0.03);
        }
      }
      
      // Atajos del Simulador Principal (Páginas del Editor)
      if (isMouseOverMain) {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        } else if (e.code === 'KeyJ') {
          e.preventDefault();
          if (videoPlayer) {
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 1.0);
            onVideoTimeUpdate();
          }
        } else if (e.code === 'KeyL') {
          e.preventDefault();
          if (videoPlayer) {
            videoPlayer.currentTime = Math.min(STATE.totalDuration, videoPlayer.currentTime + 1.0);
            onVideoTimeUpdate();
          }
        } else if (e.code === 'KeyK') {
          e.preventDefault();
          if (videoPlayer) {
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 0.03);
            onVideoTimeUpdate();
          }
        } else if (e.code === 'KeyI') {
          e.preventDefault();
          if (videoPlayer) {
            videoPlayer.currentTime = Math.min(STATE.totalDuration, videoPlayer.currentTime + 0.03);
            onVideoTimeUpdate();
          }
        }
      }
    });

    // Event listener timeupdate en referenceVideo para el rango de bucle personalizado
    referenceVideo.addEventListener('timeupdate', () => {
      const loopCheckbox = document.getElementById('ref-loop-checkbox');
      if (loopCheckbox && loopCheckbox.checked) {
        const startVal = Math.max(0, parseFloat(document.getElementById('ref-loop-start').value || 0));
        let endVal = parseFloat(document.getElementById('ref-loop-end').value || referenceVideo.duration || 9999);
        if (isNaN(endVal) || endVal < startVal + 0.2) {
          endVal = startVal + 0.2;
        }
        if (referenceVideo.currentTime >= endVal) {
          referenceVideo.currentTime = startVal;
          if (referenceVideo.paused) {
            referenceVideo.play().catch(e => console.warn(e));
          }
        }
      }
    });

    // Autodetectar fin del video de referencia
    referenceVideo.addEventListener('ended', () => {
      const loopCheckbox = document.getElementById('ref-loop-checkbox');
      if (loopCheckbox && !loopCheckbox.checked) {
        if (STATE.isPlaying) {
          togglePlay();
          showToast('Video de referencia finalizado. Reproductor principal pausado.', 'info');
        }
      }
    });
  }

  document.getElementById('time-total').innerText = STATE.totalDuration.toFixed(1);
  document.getElementById('tl-total-dur').innerText = STATE.totalDuration.toFixed(1) + 's';

  // Restablecer sliders con doble clic
  document.addEventListener('dblclick', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'range') {
      const defaultVal = e.target.getAttribute('value');
      if (defaultVal !== null) {
        e.target.value = defaultVal;
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
        e.target.dispatchEvent(new Event('change', { bubbles: true }));
        showToast('Control restablecido al valor predeterminado', 'info');
      }
    }
  });

  // Indicador de procesamiento de pista de voz
  if (voicePlayer) {
    voicePlayer.addEventListener('loadstart', () => {
      if (voicePlayer.src && !voicePlayer.src.endsWith('html')) {
        showToast('Cargando/procesando pista de voz...', 'info');
      }
    });
    voicePlayer.addEventListener('canplay', () => {
      if (voicePlayer.src && !voicePlayer.src.endsWith('html')) {
        showToast('Pista de voz lista y sincronizada', 'success');
      }
    });
    voicePlayer.addEventListener('error', () => {
      if (voicePlayer.src && !voicePlayer.src.endsWith('html')) {
        showToast('Error al procesar la pista de voz', 'warning');
      }
    });
  }

  // Drag & Drop para video de referencia
  const refPanel = document.querySelector('.reference-panel');
  if (refPanel) {
    refPanel.addEventListener('dragover', (e) => {
      e.preventDefault();
      refPanel.style.border = '2px dashed var(--accent)';
      refPanel.style.background = 'rgba(0, 240, 255, 0.05)';
    });
    refPanel.addEventListener('dragleave', () => {
      refPanel.style.border = '';
      refPanel.style.background = '';
    });
    refPanel.addEventListener('drop', (e) => {
      e.preventDefault();
      refPanel.style.border = '';
      refPanel.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        const fakeEvent = { target: { files: [file] } };
        handleReferenceVideoUpload(fakeEvent);
      } else {
        showToast('Solo se admiten archivos de video compatibles', 'warning');
      }
    });
  }

  // Sincronizar volúmenes si la casilla está marcada
  const linkVol = document.getElementById('link-volume-checkbox');
  if (linkVol) {
    linkVol.addEventListener('change', (e) => {
      if (e.target.checked) {
        const masterVal = document.getElementById('master-volume-slider').value;
        const refSlider = document.getElementById('ref-volume-slider');
        if (refSlider) refSlider.value = masterVal;
        updateReferenceVolume(masterVal);
        showToast('Volúmenes vinculados', 'success');
      } else {
        showToast('Volúmenes desvinculados', 'info');
      }
    });
  }

  // Ctrl + D para clonar escena sobre la lista
  let isMouseOverScenesList = false;
  const scenesList = document.getElementById('scenes-list');
  if (scenesList) {
    scenesList.addEventListener('mouseenter', () => { isMouseOverScenesList = true; });
    scenesList.addEventListener('mouseleave', () => { isMouseOverScenesList = false; });
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyD') {
      if (isMouseOverScenesList) {
        e.preventDefault();
        cloneCurrentScene();
      }
    }
  });

  updateHistoryDropdown();

  showToast('Promo Studio listo. Autoguardado activado.', 'success');
});

function computeTotalDuration() { STATE.totalDuration = STATE.scenes.reduce((sum, s) => sum + s.duration, 0); }
function getActiveScene() { return STATE.scenes.find(s => s.id === STATE.activeSceneId) || STATE.scenes[0]; }
function getSceneAtTime(time) {
  let acc = 0;
  for (const scene of STATE.scenes) {
    if (time >= acc && time < acc + scene.duration) return { scene, offset: time - acc };
    acc += scene.duration;
  }
  const last = STATE.scenes[STATE.scenes.length - 1];
  return { scene: last, offset: last.duration };
}
function getSceneStartTime(sceneId) {
  let acc = 0;
  for (const s of STATE.scenes) {
    if (s.id === sceneId) return acc;
    acc += s.duration;
  }
  return 0;
}

// ──────────────────────────────────────────────────────────────
// 5. AUDIO & VISUALIZER — Web Audio API + Voice Ducking
// ──────────────────────────────────────────────────────────────
function initAudioEffects() {
  if (STATE.audioReady) {
    if (STATE.audioCtx && STATE.audioCtx.state === 'suspended') STATE.audioCtx.resume();
    return;
  }
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    videoPlayer.muted = false;
    if (referenceVideo) referenceVideo.muted = false;
    
    const source = audioCtx.createMediaElementSource(videoPlayer);
    let sourceRef = null;
    if (referenceVideo) {
      sourceRef = audioCtx.createMediaElementSource(referenceVideo);
    }

    // Instanciar ganancia para volumen del video de referencia
    refVolumeGain = audioCtx.createGain();
    const refVolumeSlider = document.getElementById('ref-volume-slider');
    refVolumeGain.gain.value = refVolumeSlider ? parseFloat(refVolumeSlider.value) : 0.8;

    // Filtros de Música
    const voiceCut1 = audioCtx.createBiquadFilter(); voiceCut1.type = 'peaking'; voiceCut1.frequency.value = 800; voiceCut1.gain.value = -18; voiceCut1.Q.value = 1.2;
    const voiceCut2 = audioCtx.createBiquadFilter(); voiceCut2.type = 'peaking'; voiceCut2.frequency.value = 2200; voiceCut2.gain.value = -14; voiceCut2.Q.value = 1.0;
    const bassFilter = audioCtx.createBiquadFilter(); bassFilter.type = 'lowshelf'; bassFilter.frequency.value = 100; bassFilter.gain.value = 4;
    const trebleFilter = audioCtx.createBiquadFilter(); trebleFilter.type = 'highshelf'; trebleFilter.frequency.value = 7000; trebleFilter.gain.value = 2;
    
    const delay = audioCtx.createDelay(2.0); delay.delayTime.value = 0;
    const delayFeedback = audioCtx.createGain(); delayFeedback.gain.value = 0;
    const delayDryWet = audioCtx.createGain(); delayDryWet.gain.value = 0;
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -20; compressor.knee.value = 30; compressor.ratio.value = 8; compressor.attack.value = 0.003; compressor.release.value = 0.25;
    
    const masterGain = audioCtx.createGain(); masterGain.gain.value = STATE.isMuted ? 0 : STATE.masterVolume;
    const analyser = audioCtx.createAnalyser(); // Music analyser for visualizer

    source.connect(voiceCut1);
    if (sourceRef) {
      sourceRef.connect(refVolumeGain);
      refVolumeGain.connect(voiceCut1);
    }
    
    voiceCut1.connect(voiceCut2); voiceCut2.connect(bassFilter); bassFilter.connect(trebleFilter); trebleFilter.connect(compressor);
    compressor.connect(delay); delay.connect(delayFeedback); delayFeedback.connect(delay); delay.connect(delayDryWet);
    compressor.connect(masterGain); delayDryWet.connect(masterGain);
    masterGain.connect(analyser); analyser.connect(audioCtx.destination);

    STATE.audioCtx = audioCtx;
    STATE.audioNodes = { voiceCut1, voiceCut2, bassFilter, trebleFilter, delay, delayFeedback, delayDryWet, compressor, masterGain, analyser };
    STATE.audioReady = true;

    setupVoiceAudio(); // Si ya se cargó una voz, reconectarla
    showToast('🎵 Motor de audio activado', 'success');
    buildGlobalPanel();
  } catch(e) { console.error('AudioContext error:', e); showToast('Error de audio: ' + e.message, 'warning'); }
}

function updateAudioNode(nodeName, property, value) {
  if (!STATE.audioNodes) return;
  const node = STATE.audioNodes[nodeName];
  if (!node) return;
  if (property === 'gain') node.gain.value = parseFloat(value);
  else if (property === 'delayTime') node.delayTime.value = parseFloat(value);
  else if (property === 'frequency') node.frequency.value = parseFloat(value);
}

function handleVoiceUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  if (voicePlayer.src && voicePlayer.src.startsWith('blob:')) URL.revokeObjectURL(voicePlayer.src);
  voicePlayer.src = url;
  showToast('Locución cargada', 'success');
  if (STATE.audioReady) setupVoiceAudio();
  buildGlobalPanel();
  detectSilenceInVoiceFile(file);
}

function detectSilenceInVoiceFile(file) {
  const ctx = STATE.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  showToast('Analizando silencios en pista de voz...', 'info');
  
  const promise = file.arrayBuffer ? file.arrayBuffer() : Promise.resolve(file);
  
  promise.then(arrayBuffer => {
    return ctx.decodeAudioData(arrayBuffer);
  }).then(audioBuffer => {
    currentDecodedVoiceBuffer = audioBuffer;
    originalUploadedVoiceBuffer = audioBuffer;
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const threshold = 0.01;
    let silences = [];
    let silentStart = null;
    const stepSize = Math.floor(sampleRate * 0.1); // 100ms windows
    
    for (let i = 0; i < channelData.length; i += stepSize) {
      let isWindowSilent = true;
      const endPos = Math.min(channelData.length, i + stepSize);
      for (let j = i; j < endPos; j++) {
        if (Math.abs(channelData[j]) > threshold) {
          isWindowSilent = false;
          break;
        }
      }
      if (isWindowSilent) {
        if (silentStart === null) {
          silentStart = i / sampleRate;
        }
      } else {
        if (silentStart !== null) {
          const silentEnd = i / sampleRate;
          const duration = silentEnd - silentStart;
          if (duration >= 3.0) {
            silences.push({ start: silentStart, end: silentEnd, duration });
          }
          silentStart = null;
        }
      }
    }
    if (silentStart !== null) {
      const silentEnd = channelData.length / sampleRate;
      const duration = silentEnd - silentStart;
      if (duration >= 3.0) {
        silences.push({ start: silentStart, end: silentEnd, duration });
      }
    }
    
    currentDetectedSilences = silences;
    
    if (silences.length > 0) {
      const msgs = silences.map(s => `${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s`).join(', ');
      alert(`⚠️ Detector de Silencios:\n\nSe detectaron silencios largos (>3s) en las posiciones:\n${msgs}`);
      showToast(`Silencios detectados en: ${msgs}`, 'warning');
      
      const trimContainer = document.getElementById('voice-trim-container');
      if (trimContainer) trimContainer.style.display = 'block';
    } else {
      showToast('✅ No se detectaron silencios largos (>3s)', 'success');
      const trimContainer = document.getElementById('voice-trim-container');
      if (trimContainer) trimContainer.style.display = 'none';
    }
  }).catch(err => {
    console.error('Error al analizar silencios:', err);
    showToast('No se pudo analizar silencios en pista de voz', 'warning');
  });
}

function setupVoiceAudio() {
  if (!STATE.audioCtx || !voicePlayer.src || STATE.voiceSource) return;
  STATE.voiceSource = STATE.audioCtx.createMediaElementSource(voicePlayer);
  STATE.voiceAnalyser = STATE.audioCtx.createAnalyser();
  
  // Filtro pasa-altos (Highpass) a 80Hz para recortar el ruido de fondo/hum del micro
  const voiceFilter = STATE.audioCtx.createBiquadFilter();
  voiceFilter.type = 'highpass';
  voiceFilter.frequency.value = 80;
  
  STATE.voiceSource.connect(voiceFilter);
  voiceFilter.connect(STATE.voiceAnalyser);
  
  const voiceGain = STATE.audioCtx.createGain();
  voiceGain.gain.value = 1.0;
  STATE.voiceAnalyser.connect(voiceGain);
  voiceGain.connect(STATE.audioCtx.destination);
  
  STATE.audioNodes.voiceGain = voiceGain;
  STATE.audioNodes.voiceFilter = voiceFilter;
}

function visualizerLoop() {
  if (!STATE.isPlaying) return;
  requestAnimationFrame(visualizerLoop);
  
  // DUCKING LOGIC
  if (STATE.voiceAnalyser && STATE.audioNodes && !STATE.isMuted) {
     const vdata = new Uint8Array(STATE.voiceAnalyser.frequencyBinCount);
     STATE.voiceAnalyser.getByteFrequencyData(vdata);
     let sum = 0; for(let i=0; i<vdata.length; i++) sum += vdata[i];
     const avg = sum / vdata.length;
     
     // Si la voz suena fuerte (avg > 5), bajamos la música drásticamente (ducking)
     const duckTarget = avg > 5 ? STATE.masterVolume * (STATE.duckingLevel !== undefined ? STATE.duckingLevel : 0.15) : STATE.masterVolume;
     const currentGain = STATE.audioNodes.masterGain.gain.value;
     STATE.audioNodes.masterGain.gain.value = currentGain + (duckTarget - currentGain) * 0.15; // Suavizado
  }

  // CANVAS DRAWING
  const canvas = document.getElementById('audio-visualizer');
  if (canvas && STATE.audioNodes && STATE.audioNodes.analyser) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width; const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    const data = new Uint8Array(STATE.audioNodes.analyser.frequencyBinCount);
    STATE.audioNodes.analyser.getByteFrequencyData(data);
    
    ctx.fillStyle = STATE.globalAccent;
    const barWidth = (width / 50); // Mostrar unas 50 barras
    let x = 0;
    for (let i = 0; i < 50; i++) {
      const barHeight = (data[i*2] / 255) * height; // Normalizar
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// 6. RENDERING
// ──────────────────────────────────────────────────────────────
function renderScene(scene) {
  if (!scene) return;
  const bg = document.getElementById('promo-bg');
  if (bg) {
    if (scene.bgImage) {
      bg.style.backgroundImage = `url(${scene.bgImage})`; bg.style.backgroundSize = 'cover'; bg.style.backgroundPosition = 'center'; bg.style.background = '';
    } else if (scene.bgColor === 'transparent') {
      bg.style.backgroundImage = 'none'; bg.style.background = 'transparent';
    } else {
      bg.style.backgroundImage = 'none'; bg.style.background = scene.bgGradient || scene.bgColor || '#05050a';
    }
  }
  const layer = document.getElementById('elements-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const now = STATE.isPlaying ? STATE.currentTime - getSceneStartTime(scene.id) : -1;
  scene.elements.forEach(el => layer.appendChild(createElementDiv(el, scene.duration, now)));
}

function createElementDiv(el, sceneDuration, timeOffset) {
  const div = document.createElement('div');
  div.className = `phone-element anim-${el.enterAnimation || 'fade-in'}`;
  div.dataset.elId = el.id;
  div.style.left = `${el.x}%`; div.style.top = `${el.y}%`;
  div.style.transform = `translate(-50%,-50%) rotate(${el.rotation||0}deg)`;
  div.style.opacity = el.opacity;
  if (el.fillScreen) { div.style.width='100%'; div.style.maxWidth='100%'; } else if (el.width) { div.style.width=`${el.width}%`; div.style.maxWidth='100%'; }

  const filters = [];
  if (el.brightness!==100) filters.push(`brightness(${el.brightness}%)`);
  if (el.contrast!==100)   filters.push(`contrast(${el.contrast}%)`);
  if (el.blur>0)            filters.push(`blur(${el.blur}px)`);
  if (filters.length) div.style.filter = filters.join(' ');
  if (el.strobe) div.style.animation = `strobeEffect ${el.strobeSpeed}s steps(1) infinite`;

  if (el.type === 'text') {
    div.style.fontFamily = `'${el.fontFamily||'Outfit'}', sans-serif`; div.style.fontSize   = `${el.fontSize||28}px`;
    div.style.fontWeight = el.fontWeight||800; div.style.color = el.color||'#ffffff';
    div.style.letterSpacing = `${el.letterSpacing||0}px`; div.style.lineHeight = el.lineHeight||1.15;
    div.style.fontStyle  = el.italic ? 'italic' : 'normal'; div.style.textDecoration = el.underline ? 'underline' : 'none';
    div.style.textAlign  = el.textAlign||'center'; div.style.whiteSpace = el.fillScreen ? 'normal' : 'pre-wrap';
    if (el.bgColor && el.bgColor !== 'transparent') {
      div.style.backgroundColor = el.bgColor; div.style.padding = `${el.bgPadding||0}px ${(el.bgPadding||0)*1.8}px`;
      div.style.borderRadius = `${el.bgRadius||0}px`; div.style.display = 'inline-block';
    }
    if (el.textShadow) div.style.textShadow = `0 2px ${el.textShadowBlur||10}px ${el.textShadowColor||'#000'}`;
    div.innerHTML = (el.content||'').replace(/\n/g,'<br>');
    if (el.duplicate) {
      const echo = document.createElement('div'); echo.style.opacity='0.25'; echo.style.marginTop='6px'; echo.style.transform='scaleX(-1)'; echo.innerHTML = div.innerHTML; div.appendChild(echo);
    }
  } else if (el.type==='image'||el.type==='logo') {
    const src = BLOB_URLS[el.id] || el.src;
    if (src) {
      const img = document.createElement('img'); img.src=src; img.draggable=false; img.style.display='block'; img.style.margin='0 auto';
      img.style.width=`${el.width||70}%`; img.style.maxWidth='100%'; img.style.borderRadius=`${el.borderRadius||8}px`; div.appendChild(img);
    } else {
      div.style.cssText += ';width:56px;height:56px;background:rgba(255,255,255,0.06);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;color:rgba(255,255,255,0.3);border:1px dashed rgba(255,255,255,0.15)';
      div.innerHTML = el.type==='logo'?'<i class="ri-star-line"></i>':'<i class="ri-image-line"></i>';
    }
  } else if (el.type==='shape') {
    div.style.width=`${el.width||80}%`; div.style.height=`${el.height||6}px`; div.style.backgroundColor=el.bgColor||'rgba(0,240,255,0.3)';
    div.style.borderRadius=`${el.borderRadius||4}px`; div.style.maxWidth='100%';
  }

  if (timeOffset>=0) {
    const exit = el.exitAt!==null ? el.exitAt : sceneDuration;
    if (timeOffset<(el.enterAt||0)||timeOffset>=exit) { div.style.visibility='hidden'; div.style.opacity='0'; }
  }
  if (STATE.selectedElementId===el.id) div.classList.add('selected');

  div.addEventListener('mousedown', e => {
    if (div.contentEditable === 'true') return;
    e.preventDefault(); e.stopPropagation(); selectElement(el.id); startDrag(e,el.id);
  });
  div.addEventListener('touchstart', e => { e.stopPropagation(); selectElement(el.id); }, { passive:true });
  
  if (el.type === 'text') {
    div.addEventListener('dblclick', e => {
      e.stopPropagation();
      div.contentEditable = 'true';
      div.focus();
      
      const range = document.createRange();
      range.selectNodeContents(div);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      
      DRAG.active = false;
    });
    
    div.addEventListener('blur', () => {
      div.contentEditable = 'false';
      const newContent = div.innerHTML.trim();
      if (el.content !== newContent) {
        saveState();
        el.content = newContent;
        const ta = document.querySelector('.prop-textarea');
        if (ta && STATE.selectedElementId === el.id) ta.value = div.innerText.trim();
        buildTimeline();
      }
    });

    div.addEventListener('input', () => {
      el.content = div.innerHTML;
      const ta = document.querySelector('.prop-textarea');
      if (ta && STATE.selectedElementId === el.id) {
        ta.value = div.innerText.trim();
      }
    });
  }
  
  return div;
}

// ──────────────────────────────────────────────────────────────
// 7. SELECTION & DRAG
// ──────────────────────────────────────────────────────────────
function selectElement(elId) {
  STATE.selectedElementId = elId;
  document.querySelectorAll('.phone-element').forEach(d=>d.classList.remove('selected'));
  const div = document.querySelector(`[data-el-id="${elId}"]`);
  if (div) div.classList.add('selected');
  ['fab-delete','fab-duplicate'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='flex'; });
  switchTab('element'); buildElementPropsPanel(elId);
  buildElementsTimeline();
}
function deselectElement() {
  STATE.selectedElementId = null;
  document.querySelectorAll('.phone-element').forEach(d=>d.classList.remove('selected'));
  ['fab-delete','fab-duplicate'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  buildElementsTimeline();
}
function onLayerClick(e) { if (e.target.classList.contains('elements-layer')) deselectElement(); }

function startDrag(e, elId) {
  const screen = document.getElementById('promo-screen'); if (!screen) return;
  const scene = getActiveScene(); const el = scene.elements.find(el=>el.id===elId); if (!el) return;
  DRAG.active=true; DRAG.elementId=elId; DRAG.startX=e.clientX; DRAG.startY=e.clientY;
  DRAG.startElX=el.x; DRAG.startElY=el.y; DRAG.screenRect=screen.getBoundingClientRect();
  document.body.style.cursor='grabbing';
}
function onDragMove(e) {
  if (!DRAG.active||!DRAG.screenRect) return;
  const dx = ((e.clientX-DRAG.startX)/DRAG.screenRect.width)*100;
  const dy = ((e.clientY-DRAG.startY)/DRAG.screenRect.height)*100;
  let newX = Math.max(2,Math.min(98,DRAG.startElX+dx)); 
  let newY = Math.max(2,Math.min(98,DRAG.startElY+dy));
  
  // Smart Snapping (guías magnéticas al 50%)
  const snapThreshold = 2.5;
  const guideV = document.getElementById('guide-v');
  const guideH = document.getElementById('guide-h');
  
  if (Math.abs(newX - 50) <= snapThreshold) {
    newX = 50;
    if (guideV) guideV.style.display = 'block';
  } else {
    if (guideV) guideV.style.display = 'none';
  }
  
  if (Math.abs(newY - 50) <= snapThreshold) {
    newY = 50;
    if (guideH) guideH.style.display = 'block';
  } else {
    if (guideH) guideH.style.display = 'none';
  }
  
  const scene = getActiveScene(); const el = scene.elements.find(el=>el.id===DRAG.elementId); if (!el) return;
  el.x=Math.round(newX*10)/10; el.y=Math.round(newY*10)/10;
  const div=document.querySelector(`[data-el-id="${DRAG.elementId}"]`);
  if (div) { div.style.left=`${el.x}%`; div.style.top=`${el.y}%`; }
  const xS=document.getElementById('prop-x'), yS=document.getElementById('prop-y');
  const xV=document.getElementById('prop-x-val'), yV=document.getElementById('prop-y-val');
  if (xS) xS.value=el.x; if (yS) yS.value=el.y;
  if (xV) xV.innerText=`${el.x.toFixed(0)}%`; if (yV) yV.innerText=`${el.y.toFixed(0)}%`;
}
function onDragEnd(e) { 
  if (!DRAG.active) return; 
  DRAG.active=false; document.body.style.cursor=''; 
  // Ocultar guías magnéticas
  const guideV = document.getElementById('guide-v');
  const guideH = document.getElementById('guide-h');
  if (guideV) guideV.style.display = 'none';
  if (guideH) guideH.style.display = 'none';
  saveState(); // Guardar historia después de arrastrar
  buildTimeline(); 
}

let historyDebounceTimer = null;
function updateElProp(elId, prop, value) {
  const scene = getActiveScene(); const el = scene.elements.find(e=>e.id===elId); if (!el) return;
  
  if (prop === 'content') {
    clearTimeout(historyDebounceTimer);
    if (!historyDebounceTimer) {
      saveState();
    }
    el[prop] = value;
    historyDebounceTimer = setTimeout(() => {
      historyDebounceTimer = null;
      saveToStorage();
    }, 1000);
  } else {
    saveState();
    el[prop] = value;
  }
  
  renderScene(scene);
  const div=document.querySelector(`[data-el-id="${elId}"]`); if (div) div.classList.add('selected');
  buildTimeline();
}

// ──────────────────────────────────────────────────────────────
// 8. SCENES PANEL — Drag & Drop + Presets
// ──────────────────────────────────────────────────────────────

function onSceneDragStart(e, sceneId) {
  e.dataTransfer.setData('text/plain', sceneId);
  e.target.classList.add('dragging');
}
function onSceneDragOver(e) { e.preventDefault(); e.currentTarget.style.borderTop = '2px dashed var(--accent)'; }
function onSceneDragLeave(e) { e.currentTarget.style.borderTop = 'none'; }
function onSceneDrop(e, targetSceneId) {
  e.preventDefault();
  e.currentTarget.style.borderTop = 'none';
  const sourceSceneId = parseInt(e.dataTransfer.getData('text/plain'));
  if (sourceSceneId === targetSceneId || !sourceSceneId) return;
  
  saveState();
  const sourceIdx = STATE.scenes.findIndex(s => s.id === sourceSceneId);
  const targetIdx = STATE.scenes.findIndex(s => s.id === targetSceneId);
  const [removed] = STATE.scenes.splice(sourceIdx, 1);
  STATE.scenes.splice(targetIdx, 0, removed);
  buildScenesPanel(); buildTimeline(); buildSceneIndicator();
  showToast('Escenas reordenadas', 'success');
}

function applyPreset(sceneId, presetName) {
  const f = document.getElementById(`sc-font-${sceneId}`);
  const sz = document.getElementById(`sc-sz-${sceneId}`);
  const w = document.getElementById(`sc-w-${sceneId}`);
  const col = document.getElementById(`sc-col-${sceneId}`);
  const bg = document.getElementById(`sc-bg-${sceneId}`);
  const align = document.getElementById(`sc-align-${sceneId}`);
  const y = document.getElementById(`sc-y-${sceneId}`);

  if(presetName === 'titulo') { f.value='Outfit'; sz.value=40; w.value=900; col.value='#ffffff'; bg.value='transparent'; align.value='center'; y.value=35; }
  if(presetName === 'neon') { f.value='Bebas Neue'; sz.value=55; w.value=800; col.value=STATE.globalAccent; bg.value='transparent'; align.value='center'; y.value=50; }
  if(presetName === 'etiqueta') { f.value='Montserrat'; sz.value=18; w.value=700; col.value='#000000'; bg.value=STATE.globalAccent; align.value='center'; y.value=80; }
  
  document.getElementById(`sc-szv-${sceneId}`).innerText = sz.value+'px';
  document.getElementById(`sc-colT-${sceneId}`).value = col.value;
  document.getElementById(`sc-yv-${sceneId}`).innerText = y.value+'%';
  
  onQuickTextChange(sceneId);
}

function buildScenesPanel() {
  const panel = document.getElementById('scenes-list');
  if (!panel) return;
  const FONTS=['Outfit','Inter','Montserrat','Bebas Neue','Playfair Display','Roboto'];
  const ANIMS=['slide-up','fade-in','zoom-in','glitch','bounce','slide-left','spin'];

  panel.innerHTML = STATE.scenes.map((scene,i)=>`
    <div class="scene-card ${scene.id===STATE.activeSceneId?'active':''}" 
         draggable="true" 
         ondragstart="onSceneDragStart(event, ${scene.id})"
         ondragend="this.classList.remove('dragging')"
         ondragover="onSceneDragOver(event)"
         ondragleave="onSceneDragLeave(event)"
         ondrop="onSceneDrop(event, ${scene.id})"
         onclick="setActiveScene(${scene.id})">
      <div class="scene-card-header">
        <span class="scene-num">${i+1}</span>
        <input class="scene-name-input" value="${scene.name}" maxlength="22"
          onclick="event.stopPropagation()" onchange="saveState(); updateSceneName(${scene.id},this.value)">
        <div class="scene-card-actions" style="cursor:grab;">
          <i class="ri-draggable" title="Arrastrar para ordenar"></i>
          <button onclick="event.stopPropagation();deleteScene(${scene.id})" title="Eliminar"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
      <div class="scene-card-body">
        <div class="prop-row">
          <label class="prop-label">Duración</label>
          <input type="range" min="0.5" max="12" step="0.1" value="${scene.duration}"
            class="prop-slider" onclick="event.stopPropagation()" onchange="saveState()"
            oninput="updateSceneDuration(${scene.id},+this.value);document.getElementById('dur-${scene.id}').innerText=(+this.value).toFixed(1)+'s'">
          <span class="prop-val" id="dur-${scene.id}">${scene.duration.toFixed(1)}s</span>
        </div>
        <div class="prop-row">
          <label class="prop-label">Fondo</label>
          <input type="color" class="prop-color" value="${scene.bgColor==='transparent'?'#05050a':scene.bgColor||'#05050a'}"
            onclick="event.stopPropagation()" onchange="saveState()" oninput="updateSceneProp(${scene.id},'bgColor',this.value)">
          <label class="btn-sm" onclick="event.stopPropagation()" title="Imagen de fondo" style="cursor:pointer;">
            <i class="ri-image-add-line"></i> Imagen
            <input type="file" accept="image/*" style="display:none;" onchange="handleSceneBgUpload(event,${scene.id})">
          </label>
          ${scene.bgImage?`<button class="btn-sm" onclick="event.stopPropagation();saveState();updateSceneProp(${scene.id},'bgImage',null)" title="Quitar imagen">✕</button>`:''}
        </div>
        <div class="scene-elements-count" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span><i class="ri-layers-line"></i> ${scene.elements.length} elemento${scene.elements.length!==1?'s':''}</span>
          <div style="display:flex; gap:2px;">
            <button onclick="event.stopPropagation();copySceneElements(${scene.id})" class="btn-sm" style="font-size:8px; padding:2px 4px; height:auto; background:rgba(255,255,255,0.05);" title="Copiar todos los elementos de esta escena"><i class="ri-file-copy-line"></i> Copiar</button>
            <button onclick="event.stopPropagation();pasteSceneElements(${scene.id})" class="btn-sm" style="font-size:8px; padding:2px 4px; height:auto; background:rgba(255,255,255,0.05);" title="Pegar elementos copiados en esta escena" ${copiedSceneElements?'':'disabled'}><i class="ri-clipboard-line"></i> Pegar</button>
          </div>
        </div>

        <div class="scene-quick-text-bar">
          <button class="btn-sm accent-outline" onclick="event.stopPropagation();toggleSceneTextEditor(${scene.id})" title="Agregar texto a esta escena">
            <i class="ri-text"></i> + Texto
          </button>
          ${isRecordingVoice && activeSceneRecordingId === scene.id ? `
            <button class="btn-sm accent-outline" id="btn-scene-rec-${scene.id}" onclick="event.stopPropagation();toggleVoiceRecordingFromScene(${scene.id})" title="Detener grabación de voz en off" style="background: rgba(255, 56, 96, 0.25); border-color: var(--danger);">
              <i class="ri-record-circle-line" id="scene-rec-icon-${scene.id}" style="color:var(--danger); animation: strobeEffect 0.8s steps(1) infinite;"></i> Grabando...
            </button>
          ` : `
            <button class="btn-sm accent-outline" id="btn-scene-rec-${scene.id}" onclick="event.stopPropagation();toggleVoiceRecordingFromScene(${scene.id})" title="Grabar locución de voz en off para esta escena">
              <i class="ri-mic-line" id="scene-rec-icon-${scene.id}"></i> Grabar Voz
            </button>
          `}
        </div>
        <div class="scene-text-editor" id="scene-te-${scene.id}" style="display:none;" onclick="event.stopPropagation()">
          <div style="display:flex;gap:4px;margin-bottom:6px;">
            <button class="btn-sm accent-outline" onclick="applyPreset(${scene.id},'titulo')">Título</button>
            <button class="btn-sm accent-outline" onclick="applyPreset(${scene.id},'neon')">Neón</button>
            <button class="btn-sm accent-outline" onclick="applyPreset(${scene.id},'etiqueta')">Etiqueta</button>
          </div>
          <textarea class="prop-textarea" id="sc-txt-${scene.id}" placeholder="Escribe aquí..." rows="2"
            oninput="onQuickTextChange(${scene.id})"></textarea>
          <div class="prop-row">
            <label class="prop-label">Fuente</label>
            <select class="prop-select" id="sc-font-${scene.id}" onchange="onQuickTextChange(${scene.id})">
              ${FONTS.map(f=>`<option value="${f}">${f}</option>`).join('')}
            </select>
          </div>
          <div class="prop-row">
            <label class="prop-label">Tamaño</label>
            <input type="range" min="10" max="90" value="28" id="sc-sz-${scene.id}" class="prop-slider"
              oninput="document.getElementById('sc-szv-${scene.id}').innerText=this.value+'px'; onQuickTextChange(${scene.id})">
            <span class="prop-val" id="sc-szv-${scene.id}">28px</span>
          </div>
          <div class="prop-row">
            <label class="prop-label">Peso</label>
            <select class="prop-select" id="sc-w-${scene.id}" onchange="onQuickTextChange(${scene.id})">
              <option value="400">Regular</option><option value="600">Semi</option>
              <option value="700">Bold</option><option value="800" selected>Extra</option><option value="900">Black</option>
            </select>
          </div>
          <div class="prop-row">
            <label class="prop-label">Color</label>
            <input type="color" class="prop-color" value="#ffffff" id="sc-col-${scene.id}"
              oninput="document.getElementById('sc-colT-${scene.id}').value=this.value; onQuickTextChange(${scene.id})">
            <input type="text" class="prop-text-sm" value="#ffffff" id="sc-colT-${scene.id}"
              oninput="document.getElementById('sc-col-${scene.id}').value=this.value; onQuickTextChange(${scene.id})">
          </div>
          <div class="prop-row">
            <label class="prop-label">Fondo txt</label>
            <input type="color" class="prop-color" value="#000000" id="sc-bg-${scene.id}" data-transparent="false"
              oninput="this.dataset.transparent='false'; document.getElementById('sc-bg-btn-${scene.id}').style.background=''; document.getElementById('sc-bg-btn-${scene.id}').style.borderColor=''; document.getElementById('sc-bg-btn-${scene.id}').textContent='Sin fondo'; onQuickTextChange(${scene.id})">
            <button class="btn-sm" id="sc-bg-btn-${scene.id}"
              onclick="setQuickTextBgTransparent(${scene.id})"
              style="padding:2px 5px; font-size:10px; flex-shrink:0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle;
                background: repeating-conic-gradient(#aaa 0% 25%, #fff 0% 50%) 0 0 / 5px 5px;
                border:1px solid rgba(255,255,255,0.3); margin-right:2px;"></span>Sin fondo
            </button>
          </div>
          <div class="prop-row">
            <label class="prop-label">Alinear</label>
            <select class="prop-select" id="sc-align-${scene.id}" onchange="onQuickTextChange(${scene.id})">
              <option value="center" selected>Centro</option><option value="left">Izq.</option><option value="right">Der.</option>
            </select>
          </div>
          <div class="prop-row">
            <label class="prop-label">Pos. Y</label>
            <input type="range" min="10" max="90" value="50" id="sc-y-${scene.id}" class="prop-slider"
              oninput="document.getElementById('sc-yv-${scene.id}').innerText=this.value+'%'; onQuickTextChange(${scene.id})">
            <span class="prop-val" id="sc-yv-${scene.id}">50%</span>
          </div>
          <div class="prop-row">
            <label class="prop-label">Anim.</label>
            <select class="prop-select" id="sc-anim-${scene.id}" onchange="onQuickTextChange(${scene.id})">
              ${ANIMS.map(a=>`<option value="${a}">${a}</option>`).join('')}
            </select>
          </div>
          <button class="btn-full" style="margin-top:4px;" onclick="addTextFromSceneCard(${scene.id})"><i class="ri-add-line"></i> Agregar a Escena</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ──────────────────────────────────────────────────────────────
// 9. GLOBAL SETTINGS — Canvas + Locución + Plantillas
// ──────────────────────────────────────────────────────────────

function buildGlobalPanel() {
  const panel = document.getElementById('global-settings-panel');
  if (!panel) return;
  const ready = STATE.audioReady;

  panel.innerHTML = `
    <!-- SISTEMA DE PLANTILLAS -->
    <div class="props-section">
      <div class="props-section-title"><i class="ri-layout-masonry-line"></i> Plantillas Rápidas</div>
      <div class="prop-row" style="gap:4px;">
        <button class="btn-sm accent-outline" onclick="saveTemplate()"><i class="ri-save-line"></i> Guardar como Plantilla</button>
        <button class="btn-sm accent-outline" onclick="loadTemplateMenu()"><i class="ri-folder-open-line"></i> Cargar Plantilla</button>
      </div>
      <div id="template-list-container" style="margin-top:8px; display:none; flex-direction:column; gap:4px;"></div>
    </div>

    <!-- PALETA -->
    <div class="props-section">
      <div class="props-section-title"><i class="ri-palette-line"></i> Paleta de Colores</div>
      <div class="prop-row">
        <label class="prop-label">Acento 1</label>
        <input type="color" class="prop-color" value="${STATE.globalAccent}" onchange="saveState()" oninput="updateGlobalColor('accent',this.value)">
      </div>
      <div class="prop-row">
        <label class="prop-label">Acento 2</label>
        <input type="color" class="prop-color" value="${STATE.globalAccentSec}" onchange="saveState()" oninput="updateGlobalColor('accent-sec',this.value)">
      </div>
      <div class="prop-row">
        <label class="prop-label">Presets</label>
        <div class="palette-presets">
          ${[['#00f0ff','#9d00ff'],['#ff007f','#7f00ff'],['#00ff88','#005533'],['#ffd700','#ff6600'],['#ff3366','#ff9900']].map(([a,b])=>
            `<button class="palette-btn" style="background:linear-gradient(135deg,${a},${b})" onclick="saveState(); applyPalette('${a}','${b}')"></button>`
          ).join('')}
        </div>
      </div>
    </div>

    <!-- FONDOS PREESTABLECIDOS -->
    <div class="props-section">
      <div class="props-section-title"><i class="ri-gradienter-line"></i> Degradados Rápidos para Escena</div>
      <p style="font-size:9px; color:var(--text-gray); margin-bottom:6px; line-height:1.2;">Aplica un degradado de fondo moderno a la escena activa.</p>
      <div class="palette-presets" style="flex-wrap: wrap; gap: 6px; display:flex;">
        ${[
          { name: 'Aurora', val: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
          { name: 'Neon', val: 'linear-gradient(135deg, #f953c6 0%, #b91d73 100%)' },
          { name: 'Cyber', val: 'radial-gradient(circle at 50% 50%, #180830 0%, #050508 100%)' },
          { name: 'Emerald', val: 'linear-gradient(135deg, #051937 0%, #004d7a 100%)' },
          { name: 'Eclipse', val: 'linear-gradient(135deg, #111111 0%, #2c3e50 100%)' },
          { name: 'Crimson', val: 'radial-gradient(circle at 30% 60%, #1a0a00 0%, #050508 100%)' }
        ].map(g =>
          `<button class="palette-btn" style="background:${g.val}; width:32px; height:32px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); cursor:pointer;" title="${g.name}" onclick="applySceneGradient('${g.val}')"></button>`
        ).join('')}
      </div>
    </div>

    <!-- GUARDADO EN LA NUBE -->
    <div class="props-section">
      <div class="props-section-title"><i class="ri-cloud-line"></i> Sincronización en la Nube</div>
      <p style="font-size:9px; color:var(--text-gray); margin-bottom:6px; line-height:1.2;">Sincroniza tu proyecto y obtén un código de restauración único para recuperarlo.</p>
      <div class="prop-row" style="gap:4px;">
        <button class="btn-sm accent" style="flex:1;" onclick="saveToCloud()"><i class="ri-cloud-upload-line"></i> Guardar en Nube</button>
        <button class="btn-sm accent-outline" style="flex:1;" onclick="loadFromCloud()"><i class="ri-cloud-download-line"></i> Cargar de Nube</button>
      </div>
    </div>

    <!-- LOGO -->
    <div class="props-section">
      <div class="props-section-title"><i class="ri-star-line"></i> Logo Global</div>
      <label class="btn-full" style="cursor:pointer;">
        <i class="ri-upload-2-line"></i> Cargar Logo
        <input type="file" accept="image/*" style="display:none;" onchange="saveState(); handleGlobalLogoUpload(event)">
      </label>
      ${STATE.logoSrc?`
        <div style="text-align:center;margin-top:8px;"><img src="${STATE.logoSrc}" style="max-width:80%;max-height:50px;border-radius:4px;object-fit:contain;"></div>
        <div class="prop-row" style="margin-top:4px;">
          <button class="btn-sm" onclick="saveState(); addLogoToScene()"><i class="ri-add-line"></i> Añadir a escena</button>
          <button class="btn-sm" onclick="saveState(); STATE.logoSrc=null;buildGlobalPanel()"><i class="ri-delete-bin-line"></i></button>
        </div>
      `:'<div style="font-size:10px;color:var(--text-gray);text-align:center;padding:6px 0;">Sin logo cargado</div>'}
    </div>

    <!-- AUDIO / LOCUCIÓN -->
    <div class="props-section">
      <div class="props-section-title"><i class="ri-mic-line"></i> Locución (Voice-Over)</div>
      
      <div style="display:flex; flex-direction:column; gap:6px;">
        <!-- Archivo local -->
        <label class="btn-full" style="cursor:pointer; font-size:10px; padding:6px 10px;">
          <i class="ri-upload-cloud-2-line"></i> ${voicePlayer.src&&!voicePlayer.src.endsWith('html')?'Cambiar Audio (.mp3)':'Cargar Audio (.mp3)'}
          <input type="file" accept="audio/*" style="display:none;" onchange="handleVoiceUpload(event)">
        </label>
        
        <!-- Grabador de voz -->
        <button id="btn-record-voice" class="btn-full accent-outline" onclick="toggleVoiceRecording()" style="font-size:10px; padding:6px 10px;">
          <i class="ri-record-circle-line" id="rec-icon" style="${isRecordingVoice?'color:var(--danger); animation: strobeEffect 0.8s steps(1) infinite;':''}"></i> <span id="rec-text">${isRecordingVoice?'Detener Grabación':'Grabar Voz en Off'}</span>
        </button>

        <!-- VU Meter -->
        <div id="mic-level-meter" style="display:${isRecordingVoice?'block':'none'}; width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; margin-top:2px;">
          <div id="mic-level-bar" style="width:0%; height:100%; background:var(--accent); transition: width 0.05s ease;"></div>
        </div>
        
        <!-- Texto a Voz (TTS) -->
        <div style="border-top:1px solid rgba(255,255,255,0.05); margin-top:4px; padding-top:6px;">
          <label style="font-size:8px; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Texto a Voz (TTS AI)</label>
          <textarea id="tts-textarea" class="prop-textarea" placeholder="Escribe la narración aquí..." rows="2" style="font-size:10px; margin-top:2px;"></textarea>
          
          <div class="prop-row" style="margin-top: 4px;">
            <label class="prop-label" style="font-size:9px;">Idioma</label>
            <select id="tts-lang" class="prop-select" style="font-size:9px; padding:2px; cursor:pointer;">
              <option value="es-mx" selected>Español (Latino)</option>
              <option value="es-es">Español (España)</option>
              <option value="en-us">Inglés (US)</option>
            </select>
          </div>
          <div class="prop-row" style="margin-top: 2px;">
            <label class="prop-label" style="font-size:9px;">Velocidad</label>
            <select id="tts-speed" class="prop-select" style="font-size:9px; padding:2px; cursor:pointer;">
              <option value="0.8">0.8x Lento</option>
              <option value="1.0" selected>1.0x Normal</option>
              <option value="1.2">1.2x Rápido</option>
              <option value="1.5">1.5x Veloz</option>
            </select>
          </div>
          
          <button class="btn-full accent" onclick="generateTTSVoice()" style="font-size:10px; padding:5px 8px; margin-top:4px; background:linear-gradient(135deg,#9d00ff,#00f0ff); border:none;">
            <i class="ri-voiceprint-line"></i> Generar Voz Narrativa
          </button>
        </div>

        <!-- LIBRERÍA DE AUDIO LOCAL -->
        <div id="voice-library-box" style="display:${VOICE_LIBRARY.length>0?'block':'none'}; border-top:1px solid rgba(255,255,255,0.05); margin-top:6px; padding-top:6px;">
          <label style="font-size:8px; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Tomas de Voz Recientes</label>
          <div id="voice-library-list" style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
            ${VOICE_LIBRARY.map((item, idx) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:4px 6px; font-size:9px;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px; color:${voicePlayer.src === item.src ? 'var(--accent)' : '#fff'};" title="${item.name}">${item.name} (${item.date})</span>
                <div style="display:flex; gap:2px;">
                  <button class="btn-sm" style="font-size:8px; padding:1px 4px; height:auto; cursor:pointer;" onclick="selectVoiceLibraryItem(${idx})" title="Cargar esta toma">Usar</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      ${voicePlayer.src&&!voicePlayer.src.endsWith('html')?`
        <div id="voice-info-box" style="margin-top:8px; background:rgba(0,255,170,0.05); border:1px solid rgba(0,255,170,0.15); border-radius:6px; padding:6px;">
          <p style="font-size:10px; text-align:center; color:var(--success); margin:0;">
            🎤 Audio de narración cargado y activo.
          </p>
          <div id="voice-trim-container" style="display:${currentDetectedSilences.length>0?'block':'none'}; text-align:center; margin-top:4px; display:flex; flex-direction:column; gap:4px;">
            <button class="btn-sm danger" onclick="autoTrimDetectedSilences()" style="font-size:8px; padding:2px 6px; height:auto; cursor:pointer; width:100%;">
              <i class="ri-scissors-line"></i> Recortar Silencios Detectados
            </button>
            <button class="btn-sm accent-outline" onclick="autoAlignScenesToVoice()" style="font-size:8px; padding:2px 6px; height:auto; cursor:pointer; width:100%;">
              <i class="ri-equalizer-line"></i> Alinear Escenas a la Voz
            </button>
          </div>
        </div>
        
        <!-- Recorte manual de Audio -->
        <div style="border-top:1px solid rgba(255,255,255,0.05); margin-top:6px; padding-top:6px;">
          <label style="font-size:8px; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Recortar Audio Manual</label>
          <div class="prop-row" style="margin-top:2px; display:flex; gap:4px; align-items:center;">
            <span style="font-size:9px; color:var(--text-gray);">Ini</span>
            <input type="number" min="0" step="0.1" value="0.0" id="voice-crop-start" class="prop-text-sm" style="max-width:32px; padding:2px; text-align:center; font-size:9px; height:18px;">
            <span style="font-size:9px; color:var(--text-gray);">Fin</span>
            <input type="number" min="0" step="0.1" value="${(voicePlayer.duration || 10).toFixed(1)}" id="voice-crop-end" class="prop-text-sm" style="max-width:32px; padding:2px; text-align:center; font-size:9px; height:18px;">
            <button class="btn-sm accent" onclick="applyManualAudioCrop()" style="font-size:8px; padding:2px 4px; height:18px; cursor:pointer; flex:1;">Cortar</button>
          </div>
        </div>
      `:''}
    </div>

    <div class="props-section">
      <div class="props-section-title"><i class="ri-equalizer-line"></i> Efectos de Música</div>
      <div class="audio-status-badge ${ready?'ready':''}">
        ${ready?'🎵 Motor Activo':'⚡ Da Play para activar'}
      </div>
      
      <!-- Visualizer Canvas -->
      <canvas id="audio-visualizer" width="300" height="40" style="width:100%; height:40px; background:rgba(0,0,0,0.4); border-radius:6px; margin: 8px 0; border:1px solid rgba(255,255,255,0.05);"></canvas>

      <div class="prop-row">
        <label class="prop-label">Volumen</label>
        <input type="range" min="0" max="1.5" step="0.05" value="${STATE.masterVolume}" class="prop-slider"
          onchange="saveState()" oninput="STATE.masterVolume=parseFloat(this.value); updateAudioNode('masterGain','gain',this.value);document.getElementById('av-vol').innerText=Math.round(this.value*100)+'%'">
        <span class="prop-val" id="av-vol">${Math.round(STATE.masterVolume*100)}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Atenuación Voz</label>
        <input type="range" min="0" max="0.8" step="0.05" value="${STATE.duckingLevel !== undefined ? STATE.duckingLevel : 0.15}" class="prop-slider"
          onchange="saveState()" oninput="STATE.duckingLevel=parseFloat(this.value);document.getElementById('av-duck').innerText=Math.round((1-this.value)*100)+'%'">
        <span class="prop-val" id="av-duck">${Math.round((1-(STATE.duckingLevel !== undefined ? STATE.duckingLevel : 0.15))*100)}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Cortar Voz 1</label>
        <input type="range" min="-30" max="0" step="1" value="-18" class="prop-slider"
          oninput="updateAudioNode('voiceCut1','gain',this.value);document.getElementById('av-vc').innerText=this.value+'dB'">
        <span class="prop-val" id="av-vc">-18dB</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Cortar Voz 2</label>
        <input type="range" min="-25" max="0" step="1" value="-14" class="prop-slider"
          oninput="updateAudioNode('voiceCut2','gain',this.value);document.getElementById('av-vc2').innerText=this.value+'dB'">
        <span class="prop-val" id="av-vc2">-14dB</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Bajo</label>
        <input type="range" min="-15" max="15" step="1" value="4" class="prop-slider"
          oninput="updateAudioNode('bassFilter','gain',this.value);document.getElementById('av-bass').innerText=(this.value>0?'+':'')+this.value+'dB'">
        <span class="prop-val" id="av-bass">+4dB</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Agudos</label>
        <input type="range" min="-15" max="15" step="1" value="2" class="prop-slider"
          oninput="updateAudioNode('trebleFilter','gain',this.value);document.getElementById('av-treb').innerText=(this.value>0?'+':'')+this.value+'dB'">
        <span class="prop-val" id="av-treb">+2dB</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Echo</label>
        <input type="range" min="0" max="0.7" step="0.05" value="0" class="prop-slider"
          oninput="updateAudioNode('delayDryWet','gain',this.value);updateAudioNode('delayFeedback','gain',this.value*0.4);document.getElementById('av-echo').innerText=Math.round(this.value*100)+'%'">
        <span class="prop-val" id="av-echo">0%</span>
      </div>
      <div class="prop-row">
        <button class="btn-sm" onclick="initAudioEffects()"><i class="ri-refresh-line"></i> Forzar Conexión Audio</button>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────
// 10. TEMPLATE SYSTEM
// ──────────────────────────────────────────────────────────────
function saveTemplate() {
  const name = prompt('Ingresa un nombre para esta plantilla (Ej. Cliente A):');
  if (!name) return;
  const tpls = JSON.parse(localStorage.getItem('bb_promo_templates') || '{}');
  tpls[name] = JSON.stringify({
    scenes: STATE.scenes, globalAccent: STATE.globalAccent, globalAccentSec: STATE.globalAccentSec, masterVolume: STATE.masterVolume
  });
  localStorage.setItem('bb_promo_templates', JSON.stringify(tpls));
  showToast(`Plantilla "${name}" guardada`, 'success');
}
function loadTemplateMenu() {
  const container = document.getElementById('template-list-container');
  if (!container) return;
  const tpls = JSON.parse(localStorage.getItem('bb_promo_templates') || '{}');
  const names = Object.keys(tpls);
  if (names.length === 0) { showToast('No hay plantillas guardadas', 'warning'); return; }
  
  container.style.display = 'flex';
  container.innerHTML = names.map(n => `
    <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px; border-radius:4px;">
      <span style="font-size:12px; margin-top:4px;">${n}</span>
      <div>
        <button class="btn-sm accent-outline" onclick="loadTemplate('${n}')"><i class="ri-check-line"></i></button>
        <button class="btn-sm danger" onclick="deleteTemplate('${n}')"><i class="ri-delete-bin-line"></i></button>
      </div>
    </div>
  `).join('');
}
function loadTemplate(name) {
  if(!confirm(`¿Cargar la plantilla "${name}"? Se sobrescribirá tu trabajo actual.`)) return;
  saveState(); // Permitir deshacer la carga de la plantilla
  const tpls = JSON.parse(localStorage.getItem('bb_promo_templates') || '{}');
  if (tpls[name]) {
    applyState(JSON.parse(tpls[name]));
    showToast(`Plantilla "${name}" cargada`, 'success');
    document.getElementById('template-list-container').style.display = 'none';
  }
}
function deleteTemplate(name) {
  const tpls = JSON.parse(localStorage.getItem('bb_promo_templates') || '{}');
  delete tpls[name];
  localStorage.setItem('bb_promo_templates', JSON.stringify(tpls));
  loadTemplateMenu();
}

// ──────────────────────────────────────────────────────────────
// ELEMENT PROPS (Omitidos los extensos por brevedad, se inyectan en runtime pero son los mismos)
// Para evitar hacer el archivo gigante repetiremos sólo las firmas que se llaman
// ──────────────────────────────────────────────────────────────
// La función buildElementPropsPanel y otras secundarias deben permanecer intactas.
// Al usar Overwrite voy a escribir TODO el archivo para asegurar que no falte nada.
// Retomo el código original aquí:

function buildElementPropsPanel(elId) {
  const panel = document.getElementById('element-props-panel');
  if (!panel) return;
  const scene = getActiveScene();
  const el = scene.elements.find(e=>e.id===elId);
  if (!el) { panel.innerHTML='<div class="no-selection-hint"><p>Elemento no encontrado.</p></div>'; return; }

  const isText = el.type === 'text';
  const isImage = el.type === 'image' || el.type === 'logo';
  const isShape = el.type === 'shape';

  const FONTS=['Outfit','Inter','Montserrat','Bebas Neue','Playfair Display','Roboto'];
  const ANIMS=['slide-up','fade-in','zoom-in','glitch','bounce','slide-left','spin'];
  const EXIT_ANIMS=['none','fade-out','slide-down','zoom-out'];

  let html = `
    <div class="props-section">
      <div class="props-section-title"><i class="ri-settings-line"></i> Propiedades Básicas</div>
  `;

  if (isText) {
    html += `
      <div style="display:flex; gap:4px; margin-bottom:8px; width:100%;">
        <button class="btn-sm" style="flex:1; font-size:10px; padding:4px;" onclick="copyTextStyle('${el.id}')" title="Copiar tipografía, color, sombras y fondos de este texto"><i class="ri-file-copy-line"></i> Copiar Estilos</button>
        <button class="btn-sm" style="flex:1; font-size:10px; padding:4px;" onclick="pasteTextStyle('${el.id}')" title="Pegar estilos copiados a este texto" id="btn-paste-style" ${copiedTextStyle?'':'disabled'}><i class="ri-clipboard-line"></i> Pegar Estilos</button>
      </div>
      <div class="prop-row-vertical">
        <label class="prop-label">Contenido de Texto</label>
        <textarea class="prop-textarea" oninput="updateElProp('${el.id}', 'content', this.value)" rows="3">${el.content || ''}</textarea>
      </div>
      <div class="prop-row">
        <label class="prop-label">Fuente</label>
        <select class="prop-select" onchange="updateElProp('${el.id}', 'fontFamily', this.value)">
          ${FONTS.map(f => `<option value="${f}" ${el.fontFamily===f?'selected':''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="prop-row">
        <label class="prop-label">Tamaño</label>
        <input type="range" min="10" max="90" value="${el.fontSize || 28}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'fontSize', parseInt(this.value)); document.getElementById('val-sz-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-sz-${el.id}">${el.fontSize || 28}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Peso</label>
        <select class="prop-select" onchange="updateElProp('${el.id}', 'fontWeight', parseInt(this.value))">
          <option value="300" ${el.fontWeight===300?'selected':''}>Light</option>
          <option value="400" ${el.fontWeight===400?'selected':''}>Regular</option>
          <option value="600" ${el.fontWeight===600?'selected':''}>Semi-Bold</option>
          <option value="700" ${el.fontWeight===700?'selected':''}>Bold</option>
          <option value="800" ${el.fontWeight===800?'selected':''}>Extra-Bold</option>
          <option value="900" ${el.fontWeight===900?'selected':''}>Black</option>
        </select>
      </div>
      <div class="prop-row">
        <label class="prop-label">Color Texto</label>
        <div style="display:flex; gap:2px; align-items:center;">
          <input type="color" class="prop-color" value="${el.color || '#ffffff'}" id="col-picker-${el.id}"
            oninput="updateElProp('${el.id}', 'color', this.value); document.getElementById('val-col-${el.id}').value=this.value">
          <button class="btn-sm" onclick="pickColorWithEyedropper('${el.id}', 'color')" title="Tomar color de pantalla" style="padding: 2px 6px;"><i class="ri-contrast-drop-line"></i></button>
        </div>
        <input type="text" class="prop-text-sm" value="${el.color || '#ffffff'}" id="val-col-${el.id}"
          oninput="updateElProp('${el.id}', 'color', this.value)">
      </div>
      <div class="prop-row" style="margin-top: -4px;">
        <label class="prop-label" style="opacity: 0; pointer-events: none;">Rápido</label>
        <div class="quick-palette-container">
          ${['#ffffff', '#000000', STATE.globalAccent, STATE.globalAccentSec, '#ff3366', '#00ffaa', '#ffcc00'].map(c => `<div class="color-chip" style="background:${c};" onclick="updateElProp('${el.id}', 'color', '${c}'); document.getElementById('col-picker-${el.id}').value='${c}'; document.getElementById('val-col-${el.id}').value='${c}'"></div>`).join('')}
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">Alineación</label>
        <select class="prop-select" onchange="updateElProp('${el.id}', 'textAlign', this.value)">
          <option value="left" ${el.textAlign==='left'?'selected':''}>Izquierda</option>
          <option value="center" ${el.textAlign==='center'?'selected':''}>Centro</option>
          <option value="right" ${el.textAlign==='right'?'selected':''}>Derecha</option>
        </select>
      </div>
      <div class="prop-row">
        <label class="prop-label">Fondo Texto</label>
        <div style="display:flex; gap:2px; align-items:center;">
          <input type="color" class="prop-color" value="${el.bgColor === 'transparent' ? '#000000' : el.bgColor}" id="bg-picker-${el.id}"
            oninput="updateElProp('${el.id}', 'bgColor', this.value)"
            style="${el.bgColor === 'transparent' ? 'opacity:0.4; pointer-events:none;' : ''}">
          <button class="btn-sm" onclick="pickColorWithEyedropper('${el.id}', 'bgColor')" title="Tomar color de pantalla" style="padding: 2px 6px; ${el.bgColor === 'transparent' ? 'opacity:0.4; pointer-events:none;' : ''}"><i class="ri-contrast-drop-line"></i></button>
        </div>
        <button class="btn-sm" onclick="updateElProp('${el.id}', 'bgColor', 'transparent')"
          title="Quitar el fondo de color del texto (NO cambia el fondo de la escena)"
          style="${el.bgColor === 'transparent' ? 'background:rgba(0,240,255,0.18);border-color:var(--accent);' : ''}; padding:2px 5px; font-size:10px; flex-shrink:0;">
          <span style="display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:middle;
            background: repeating-conic-gradient(#aaa 0% 25%, #fff 0% 50%) 0 0 / 6px 6px;
            border:1px solid rgba(255,255,255,0.3); margin-right:2px;"></span>${el.bgColor === 'transparent' ? '✓ Sin fondo' : 'Sin fondo'}
        </button>
      </div>
      <div class="prop-row" style="margin-top: -4px;">
        <label class="prop-label" style="opacity: 0; pointer-events: none;">Rápido</label>
        <div class="quick-palette-container">
          ${['#ffffff', '#000000', STATE.globalAccent, STATE.globalAccentSec, '#ff3366', '#00ffaa', '#ffcc00'].map(c => `<div class="color-chip" style="background:${c};" onclick="updateElProp('${el.id}', 'bgColor', '${c}'); document.getElementById('bg-picker-${el.id}').value='${c}'"></div>`).join('')}
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">Padding Fondo</label>
        <input type="range" min="0" max="30" value="${el.bgPadding || 0}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'bgPadding', parseInt(this.value)); document.getElementById('val-pad-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-pad-${el.id}">${el.bgPadding || 0}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Borde Radio</label>
        <input type="range" min="0" max="25" value="${el.bgRadius || 0}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'bgRadius', parseInt(this.value)); document.getElementById('val-rad-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-rad-${el.id}">${el.bgRadius || 0}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Interlineado</label>
        <input type="range" min="0.8" max="2.0" step="0.05" value="${el.lineHeight || 1.15}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'lineHeight', parseFloat(this.value)); document.getElementById('val-lh-${el.id}').innerText=this.value">
        <span class="prop-val" id="val-lh-${el.id}">${el.lineHeight || 1.15}</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Espaciado Letras</label>
        <input type="range" min="-3" max="10" step="0.5" value="${el.letterSpacing || 0}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'letterSpacing', parseFloat(this.value)); document.getElementById('val-ls-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-ls-${el.id}">${el.letterSpacing || 0}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Sombra de Texto</label>
        <input type="checkbox" ${el.textShadow?'checked':''} onchange="updateElProp('${el.id}', 'textShadow', this.checked)">
      </div>
      <div class="prop-row">
        <label class="prop-label">Color Sombra</label>
        <input type="color" class="prop-color" value="${el.textShadowColor || '#000000'}"
          oninput="updateElProp('${el.id}', 'textShadowColor', this.value)">
      </div>
      <div class="prop-row">
        <label class="prop-label">Estilos</label>
        <div style="display:flex; gap:4px;">
          <button class="btn-sm ${el.italic?'active':''}" onclick="updateElProp('${el.id}', 'italic', ${!el.italic})"><i class="ri-italic"></i></button>
          <button class="btn-sm ${el.underline?'active':''}" onclick="updateElProp('${el.id}', 'underline', ${!el.underline})"><i class="ri-underline"></i></button>
          <button class="btn-sm ${el.fillScreen?'active':''}" onclick="updateElProp('${el.id}', 'fillScreen', ${!el.fillScreen})"><i class="ri-fullscreen-line"></i> Llenar Ancho</button>
          <button class="btn-sm ${el.duplicate?'active':''}" onclick="updateElProp('${el.id}', 'duplicate', ${!el.duplicate})"><i class="ri-file-copy-2-line"></i> Duplicado (Reflejo)</button>
        </div>
      </div>
    `;
  } else if (isImage) {
    html += `
      <div class="prop-row">
        <label class="prop-label">Ancho (%)</label>
        <input type="range" min="10" max="100" value="${el.width || 70}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'width', parseInt(this.value)); document.getElementById('val-w-${el.id}').innerText=this.value+'%'">
        <span class="prop-val" id="val-w-${el.id}">${el.width || 70}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Radio Borde</label>
        <input type="range" min="0" max="50" value="${el.borderRadius || 8}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'borderRadius', parseInt(this.value)); document.getElementById('val-br-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-br-${el.id}">${el.borderRadius || 8}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Cambiar Imagen</label>
        <label class="btn-sm" style="cursor:pointer; display:inline-block; text-align:center;">
          <i class="ri-upload-2-line"></i> Subir nueva
          <input type="file" accept="image/*" style="display:none;" onchange="updateImageFile(event, '${el.id}')">
        </label>
      </div>
    `;
  } else if (isShape) {
    html += `
      <div class="prop-row">
        <label class="prop-label">Ancho (%)</label>
        <input type="range" min="2" max="100" value="${el.width || 80}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'width', parseInt(this.value)); document.getElementById('val-w-${el.id}').innerText=this.value+'%'">
        <span class="prop-val" id="val-w-${el.id}">${el.width || 80}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Alto (px)</label>
        <input type="range" min="1" max="50" value="${el.height || 6}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'height', parseInt(this.value)); document.getElementById('val-h-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-h-${el.id}">${el.height || 6}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Color Forma</label>
        <input type="color" class="prop-color" value="${el.bgColor || 'rgba(0,240,255,0.3)'}" id="shape-picker-${el.id}"
          oninput="updateElProp('${el.id}', 'bgColor', this.value)">
      </div>
      <div class="prop-row" style="margin-top: -4px;">
        <label class="prop-label" style="opacity: 0; pointer-events: none;">Rápido</label>
        <div class="quick-palette-container">
          ${['#ffffff', '#000000', STATE.globalAccent, STATE.globalAccentSec, '#ff3366', '#00ffaa', '#ffcc00'].map(c => `<div class="color-chip" style="background:${c};" onclick="updateElProp('${el.id}', 'bgColor', '${c}'); document.getElementById('shape-picker-${el.id}').value='${c}'"></div>`).join('')}
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">Radio Borde</label>
        <input type="range" min="0" max="25" value="${el.borderRadius || 4}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'borderRadius', parseInt(this.value)); document.getElementById('val-br-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-br-${el.id}">${el.borderRadius || 4}px</span>
      </div>
    `;
  }

  // Posicionamiento común a todos los elementos
  html += `
    </div>
    
    <div class="props-section">
      <div class="props-section-title"><i class="ri-focus-3-line"></i> Posición y Giro</div>
      <div class="prop-row">
        <label class="prop-label">Posición X</label>
        <input type="range" min="0" max="100" value="${el.x}" id="prop-x" class="prop-slider"
          oninput="updateElProp('${el.id}', 'x', parseFloat(this.value)); document.getElementById('prop-x-val').innerText=Math.round(this.value)+'%'">
        <span class="prop-val" id="prop-x-val">${Math.round(el.x)}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Posición Y</label>
        <input type="range" min="0" max="100" value="${el.y}" id="prop-y" class="prop-slider"
          oninput="updateElProp('${el.id}', 'y', parseFloat(this.value)); document.getElementById('prop-y-val').innerText=Math.round(this.value)+'%'">
        <span class="prop-val" id="prop-y-val">${Math.round(el.y)}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Rotación</label>
        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
          <div style="display:flex; align-items:center; gap:6px; width:100%;">
            <input type="range" min="-180" max="180" value="${el.rotation || 0}" class="prop-slider" id="rot-slider-${el.id}" style="flex:1;"
              oninput="updateElProp('${el.id}', 'rotation', parseInt(this.value)); document.getElementById('val-rot-${el.id}').innerText=this.value+'°'">
            <span class="prop-val" id="val-rot-${el.id}">${el.rotation || 0}°</span>
          </div>
          <div style="display:flex; gap:3px; width:100%;">
            <button class="btn-sm" style="font-size:8px; padding:1px 4px; height:auto; flex:1;" onclick="setElRotation('${el.id}', -90)">-90°</button>
            <button class="btn-sm" style="font-size:8px; padding:1px 4px; height:auto; flex:1;" onclick="setElRotation('${el.id}', 0)">0° (Reset)</button>
            <button class="btn-sm" style="font-size:8px; padding:1px 4px; height:auto; flex:1;" onclick="setElRotation('${el.id}', 90)">+90°</button>
          </div>
        </div>
      </div>
    </div>

    <div class="props-section">
      <div class="props-section-title"><i class="ri-contrast-drop-2-line"></i> Efectos Visuales</div>
      <div class="prop-row">
        <label class="prop-label">Opacidad</label>
        <input type="range" min="0" max="1" step="0.05" value="${el.opacity !== undefined ? el.opacity : 1}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'opacity', parseFloat(this.value)); document.getElementById('val-op-${el.id}').innerText=Math.round(this.value*100)+'%'">
        <span class="prop-val" id="val-op-${el.id}">${Math.round((el.opacity !== undefined ? el.opacity : 1)*100)}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Brillo</label>
        <input type="range" min="0" max="200" value="${el.brightness !== undefined ? el.brightness : 100}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'brightness', parseInt(this.value)); document.getElementById('val-bri-${el.id}').innerText=this.value+'%'">
        <span class="prop-val" id="val-bri-${el.id}">${el.brightness !== undefined ? el.brightness : 100}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Contraste</label>
        <input type="range" min="0" max="200" value="${el.contrast !== undefined ? el.contrast : 100}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'contrast', parseInt(this.value)); document.getElementById('val-con-${el.id}').innerText=this.value+'%'">
        <span class="prop-val" id="val-con-${el.id}">${el.contrast !== undefined ? el.contrast : 100}%</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Desenfoque (Blur)</label>
        <input type="range" min="0" max="20" value="${el.blur || 0}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'blur', parseInt(this.value)); document.getElementById('val-blur-${el.id}').innerText=this.value+'px'">
        <span class="prop-val" id="val-blur-${el.id}">${el.blur || 0}px</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Estrobo (Parpadeo)</label>
        <input type="checkbox" ${el.strobe?'checked':''} onchange="updateElProp('${el.id}', 'strobe', this.checked)">
      </div>
      <div class="prop-row">
        <label class="prop-label">Velocidad Estrobo</label>
        <input type="range" min="0.05" max="1.5" step="0.05" value="${el.strobeSpeed || 0.25}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'strobeSpeed', parseFloat(this.value)); document.getElementById('val-strobes-${el.id}').innerText=this.value+'s'">
        <span class="prop-val" id="val-strobes-${el.id}">${el.strobeSpeed || 0.25}s</span>
      </div>
    </div>

    <div class="props-section">
      <div class="props-section-title"><i class="ri-time-line"></i> Tiempo de Aparición</div>
      <div class="prop-row">
        <label class="prop-label">Animación Entrada</label>
        <select class="prop-select" onchange="updateElProp('${el.id}', 'enterAnimation', this.value)" id="anim-select-${el.id}">
          ${ANIMS.map(a => `<option value="${a}" ${el.enterAnimation===a?'selected':''}>${a}</option>`).join('')}
        </select>
        <button class="btn-sm" onclick="previewElementAnimation('${el.id}')" title="Previsualizar animación"><i class="ri-play-circle-line"></i> Ver</button>
      </div>
      <div class="prop-row">
        <label class="prop-label">Animación Salida</label>
        <select class="prop-select" onchange="updateElProp('${el.id}', 'exitAnimation', this.value)" id="exit-anim-select-${el.id}">
          ${EXIT_ANIMS.map(a => `<option value="${a}" ${el.exitAnimation===a?'selected':''}>${a}</option>`).join('')}
        </select>
        <button class="btn-sm" onclick="previewElementExitAnimation('${el.id}')" title="Previsualizar animación salida"><i class="ri-play-circle-line"></i> Ver</button>
      </div>
      <div class="prop-row">
        <label class="prop-label">Entrada (s)</label>
        <input type="range" min="0" max="${scene.duration}" step="0.1" value="${el.enterAt || 0}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'enterAt', parseFloat(this.value)); document.getElementById('val-ent-${el.id}').innerText=this.value+'s'">
        <span class="prop-val" id="val-ent-${el.id}">${(el.enterAt || 0).toFixed(1)}s</span>
      </div>
      <div class="prop-row">
        <label class="prop-label">Salida (s)</label>
        <input type="range" min="0" max="${scene.duration}" step="0.1" value="${el.exitAt !== null ? el.exitAt : scene.duration}" class="prop-slider"
          oninput="updateElProp('${el.id}', 'exitAt', parseFloat(this.value)); document.getElementById('val-exi-${el.id}').innerText=this.value+'s'">
        <span class="prop-val" id="val-exi-${el.id}">${(el.exitAt !== null ? el.exitAt : scene.duration).toFixed(1)}s</span>
      </div>
    </div>
  `;

  panel.innerHTML = html;
}

function updateImageFile(event, elId) {
  const file = event.target.files[0];
  if (!file) return;
  saveState();
  const url = URL.createObjectURL(file);
  BLOB_URLS[elId] = url;
  const scene = getActiveScene();
  const el = scene.elements.find(e => e.id === elId);
  if (el) {
    el.src = url;
    renderScene(scene);
    buildElementPropsPanel(elId);
  }
}

function updateSceneName(sceneId,name) { const s=STATE.scenes.find(s=>s.id===sceneId); if(s){s.name=name;buildTimeline();buildSceneIndicator();} }
function updateSceneDuration(sceneId,duration) { const s=STATE.scenes.find(s=>s.id===sceneId); if (s) { s.duration=duration; computeTotalDuration(); document.getElementById('time-total').innerText=STATE.totalDuration.toFixed(1); buildTimeline(); } }
function updateSceneProp(sceneId,prop,value) { const s=STATE.scenes.find(s=>s.id===sceneId); if (s) { s[prop]=value; if (sceneId===STATE.activeSceneId) renderScene(getActiveScene()); buildScenesPanel(); } }
function setSceneTransparent(sceneId) { const s=STATE.scenes.find(s=>s.id===sceneId); if (s) { saveState(); s.bgColor='transparent'; s.bgGradient=null; s.bgImage=null; if (sceneId===STATE.activeSceneId) renderScene(getActiveScene()); buildScenesPanel(); showToast('Fondo transparente aplicado','success'); } }
function setQuickTextBgTransparent(sceneId) {
  const inp = document.getElementById(`sc-bg-${sceneId}`);
  const btn = document.getElementById(`sc-bg-btn-${sceneId}`);
  if (!inp) return;
  inp.dataset.transparent = 'true';
  if (btn) {
    btn.style.background = 'rgba(0,240,255,0.18)';
    btn.style.borderColor = 'var(--accent)';
    btn.innerHTML = '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle;background:repeating-conic-gradient(#aaa 0% 25%,#fff 0% 50%) 0 0/5px 5px;border:1px solid rgba(255,255,255,0.3);margin-right:2px;"></span>✓ Sin fondo';
  }
  onQuickTextChange(sceneId);
}
function addNewScene() {
  saveState();
  const newId=Math.max(...STATE.scenes.map(s=>s.id))+1;
  STATE.scenes.push({id:newId,name:`Escena ${newId}`,duration:2.0,bgColor:'#05050a',bgImage:null,bgGradient:'',elements:[]});
  setActiveScene(newId); buildScenesPanel(); showToast('Nueva escena creada','success');
}
function cloneCurrentScene() {
  saveState();
  const scene=getActiveScene(), newId=Math.max(...STATE.scenes.map(s=>s.id))+1;
  const clone=JSON.parse(JSON.stringify(scene)); clone.id=newId; clone.name=scene.name+' (copia)';
  clone.elements=clone.elements.map(el=>({...el,id:generateId()}));
  const idx=STATE.scenes.findIndex(s=>s.id===STATE.activeSceneId);
  STATE.scenes.splice(idx+1,0,clone);
  computeTotalDuration(); setActiveScene(newId); buildScenesPanel(); showToast('Escena clonada','success');
}
function deleteScene(sceneId) {
  if (STATE.scenes.length<=1) return;
  saveState();
  const idx=STATE.scenes.findIndex(s=>s.id===sceneId); STATE.scenes.splice(idx,1);
  if (STATE.activeSceneId===sceneId) STATE.activeSceneId=STATE.scenes[Math.max(0,idx-1)].id;
  computeTotalDuration(); renderScene(getActiveScene()); buildScenesPanel(); buildTimeline(); buildSceneIndicator();
}

function toggleSceneTextEditor(sceneId) {
  const el = document.getElementById(`scene-te-${sceneId}`);
  if (!el) return;
  const isOpening = el.style.display === 'none';
  el.style.display = isOpening ? 'block' : 'none';
  
  if (!isOpening) {
    const scene = STATE.scenes.find(s=>s.id===sceneId);
    if (scene) {
      const idx = scene.elements.findIndex(e => e.isTempQuickText === true);
      if (idx !== -1) {
        scene.elements.splice(idx, 1);
        renderScene(scene);
        buildTimeline();
      }
    }
  }
}

function addTextFromSceneCard(sceneId) {
  const scene = STATE.scenes.find(s=>s.id===sceneId); if (!scene) return;
  
  let el = scene.elements.find(e => e.isTempQuickText === true);
  
  if (el) {
    delete el.isTempQuickText;
  } else {
    const content  = document.getElementById(`sc-txt-${sceneId}`)?.value || ' ';
    const fontSize = parseInt(document.getElementById(`sc-sz-${sceneId}`)?.value||28);
    const fontWeight= parseInt(document.getElementById(`sc-w-${sceneId}`)?.value||800);
    const color    = document.getElementById(`sc-col-${sceneId}`)?.value || '#ffffff';
    const bgInputEl2 = document.getElementById(`sc-bg-${sceneId}`);
  const bgColor  = (bgInputEl2?.dataset?.transparent === 'true') ? 'transparent' : (bgInputEl2?.value || '#000000');
    const textAlign= document.getElementById(`sc-align-${sceneId}`)?.value || 'center';
    const y        = parseInt(document.getElementById(`sc-y-${sceneId}`)?.value||50);
    const enterAnimation = document.getElementById(`sc-anim-${sceneId}`)?.value || 'slide-up';
    const fontFamily = document.getElementById(`sc-font-${sceneId}`)?.value || 'Outfit';
    
    el = defaultTextElement({ content, fontSize, fontWeight, fontFamily, color, bgColor, bgPadding: bgColor!=='transparent'?8:0, bgRadius: bgColor!=='transparent'?6:0, textAlign, y, enterAnimation });
    scene.elements.push(el);
  }
  
  const textarea = document.getElementById(`sc-txt-${sceneId}`);
  if (textarea) textarea.value = '';
  
  const editorEl = document.getElementById(`scene-te-${sceneId}`);
  if (editorEl) editorEl.style.display = 'none';
  
  STATE.activeSceneId = sceneId;
  renderScene(scene);
  buildScenesPanel();
  buildTimeline();
  buildSceneIndicator();
  selectElement(el.id);
  saveState();
  showToast('Texto agregado','success');
}

function addElement(type) {
  saveState();
  const scene = getActiveScene(); let el;
  if (type==='text') el=defaultTextElement(); else if (type==='shape') el=defaultShapeElement();
  if(el){ scene.elements.push(el); renderScene(scene); buildTimeline(); selectElement(el.id); }
}
function addElementFromFile(event, type) {
  saveState();
  const file = event.target.files[0]; if (!file) return;
  const el = type==='logo' ? defaultImageElement({type:'logo', width:28, y:12}) : defaultImageElement({type:'image'});
  const blobUrl = URL.createObjectURL(file); BLOB_URLS[el.id] = blobUrl; el.src = blobUrl;
  const scene = getActiveScene(); scene.elements.push(el);
  renderScene(scene); buildTimeline(); selectElement(el.id); event.target.value = '';
}
function deleteElement(elId) {
  saveState();
  const scene=getActiveScene(); const idx=scene.elements.findIndex(e=>e.id===elId); if (idx===-1) return;
  scene.elements.splice(idx,1); deselectElement(); renderScene(scene); buildTimeline();
}
function deleteSelectedElement() { if (STATE.selectedElementId) deleteElement(STATE.selectedElementId); }
function duplicateSelectedElement() {
  if (!STATE.selectedElementId) return; saveState();
  const scene=getActiveScene(); const orig=scene.elements.find(e=>e.id===STATE.selectedElementId); if (!orig) return;
  const copy=JSON.parse(JSON.stringify(orig)); copy.id=generateId(); copy.x=Math.min(95,orig.x+5); copy.y=Math.min(95,orig.y+5);
  scene.elements.push(copy); renderScene(scene); buildTimeline(); selectElement(copy.id);
}

function onVideoTimeUpdate() {
  const time=videoPlayer.currentTime; STATE.currentTime=time;
  
  if (isSceneLoopActive) {
    const activeScene = getActiveScene();
    const startTime = getSceneStartTime(activeScene.id);
    const endTime = startTime + activeScene.duration;
    if (time >= endTime - 0.05 || time < startTime) {
      videoPlayer.currentTime = startTime;
      if (voicePlayer && voicePlayer.src && !voicePlayer.src.endsWith('html')) {
        voicePlayer.currentTime = startTime;
      }
      if (referenceVideo && referenceVideo.src && !referenceVideo.paused) {
        referenceVideo.currentTime = startTime;
      }
      return;
    }
  }
  
  // Sincronizar voz si hay deriva
  if (voicePlayer && voicePlayer.src && !voicePlayer.src.endsWith('html')) {
    if (Math.abs(voicePlayer.currentTime - time) > 0.15) voicePlayer.currentTime = time;
  }
  // Sincronizar video de referencia si hay deriva
  if (referenceVideo && referenceVideo.src && !referenceVideo.paused) {
    if (Math.abs(referenceVideo.currentTime - time) > 0.15) referenceVideo.currentTime = time;
  }
  
  const ce=document.getElementById('time-current'); if (ce) ce.innerText=time.toFixed(1);
  const ph=document.getElementById('timeline-playhead'); if (ph) ph.style.left=`${Math.min(100,(time/STATE.totalDuration)*100).toFixed(2)}%`;
  const {scene, offset}=getSceneAtTime(time);
  if (scene.id!==STATE.activeSceneId) { STATE.activeSceneId=scene.id; renderScene(scene); buildTimeline(); buildSceneIndicator(); }
  updateElementVisibility(scene, offset);
}

function updateElementVisibility(scene, offset) {
  scene.elements.forEach(el => {
    const div = document.querySelector(`[data-el-id="${el.id}"]`);
    if (!div) return;
    const exit = el.exitAt !== null ? el.exitAt : scene.duration;
    const exitDuration = 0.3; // matches the CSS duration
    
    const isVisible = offset >= (el.enterAt || 0) && offset < exit;
    
    if (isVisible) {
      div.style.visibility = 'visible';
      
      // Check if we are in the exit animation window
      if (el.exitAnimation && el.exitAnimation !== 'none' && offset >= (exit - exitDuration)) {
        const exitClass = `anim-exit-${el.exitAnimation}`;
        if (!div.classList.contains(exitClass)) {
          // Remove enter animation class so it doesn't conflict
          const enterAnim = el.enterAnimation || 'fade-in';
          div.classList.remove(`anim-${enterAnim}`);
          div.classList.add(exitClass);
        }
      } else {
        // We are not in the exit window
        const exitClass = `anim-exit-${el.exitAnimation || 'fade-out'}`;
        div.classList.remove(exitClass);
        div.classList.remove('anim-exit-fade-out', 'anim-exit-slide-down', 'anim-exit-zoom-out');
        
        // Ensure enter animation class is present
        const enterAnim = el.enterAnimation || 'fade-in';
        if (!div.classList.contains(`anim-${enterAnim}`)) {
          div.classList.add(`anim-${enterAnim}`);
        }
        div.style.opacity = el.opacity !== undefined ? el.opacity : 1;
      }
    } else {
      div.style.visibility = 'hidden';
      div.style.opacity = '0';
      if (el.exitAnimation) {
        div.classList.remove(`anim-exit-${el.exitAnimation}`);
      }
      div.classList.remove('anim-exit-fade-out', 'anim-exit-slide-down', 'anim-exit-zoom-out');
    }
  });
}

function togglePlay() {
  if (videoPlayer.paused) {
    if (!STATE.audioReady) {
      initAudioEffects();
    } else if (STATE.audioCtx && STATE.audioCtx.state === 'suspended') {
      try {
        STATE.audioCtx.resume().catch(e => console.warn('AudioContext resume rejected:', e));
      } catch (e) {
        console.error('AudioContext resume failed:', e);
      }
    }
    
    videoPlayer.play().then(()=>{
      if (voicePlayer.src && !voicePlayer.src.endsWith('html')) voicePlayer.play();
      if (referenceVideo && referenceVideo.src) {
        // Pausar reproducción independiente si estaba activa
        referenceVideo.currentTime = videoPlayer.currentTime;
        referenceVideo.play().catch(e => console.warn('Reference video play blocked:', e));
      }
      STATE.isPlaying=true; document.getElementById('play-icon').className='ri-pause-fill';
      visualizerLoop();
    }).catch(()=>showToast('Permite el audio en el navegador','warning'));
  } else {
    videoPlayer.pause();
    voicePlayer.pause();
    if (referenceVideo) referenceVideo.pause();
    STATE.isPlaying=false; document.getElementById('play-icon').className='ri-play-fill';
  }
}
function restartVideo() {
  if (videoPlayer) { videoPlayer.currentTime=0; videoPlayer.pause(); }
  if (voicePlayer) { voicePlayer.currentTime=0; voicePlayer.pause(); }
  if (referenceVideo) { referenceVideo.currentTime=0; referenceVideo.pause(); }
  STATE.currentTime=0; STATE.activeSceneId=STATE.scenes[0].id; STATE.isPlaying=false;
  document.getElementById('play-icon').className='ri-play-fill';
  renderScene(getActiveScene()); buildTimeline(); buildSceneIndicator();
}
function toggleMute() {
  STATE.isMuted=!STATE.isMuted;
  if (STATE.audioNodes) {
    STATE.audioNodes.masterGain.gain.value = STATE.isMuted ? 0 : STATE.masterVolume;
  } else {
    videoPlayer.muted = STATE.isMuted;
  }
  if (referenceVideo) {
    referenceVideo.muted = STATE.isMuted;
  }
  document.getElementById('mute-icon').className=STATE.isMuted?'ri-volume-mute-fill':'ri-volume-up-fill';
  updateVolumeSliderStyles();
}

function setActiveScene(sceneId) {
  STATE.activeSceneId=sceneId; STATE.selectedElementId=null;
  const startTime=getSceneStartTime(sceneId);
  if (videoPlayer) videoPlayer.currentTime=startTime;
  if (referenceVideo) referenceVideo.currentTime=startTime;
  STATE.currentTime=startTime; renderScene(getActiveScene());
  buildScenesPanel(); buildTimeline(); buildSceneIndicator(); deselectElement();
}
// ──────────────────────────────────────────────────────────────
// TIMELINE INTERACTIVA (Elementos)
// ──────────────────────────────────────────────────────────────
let TL_DRAG = { active: false, elId: null, type: null, startX: 0, startEnter: 0, startExit: 0, duration: 0, screenRect: null };

function onTimelineElementDown(e, elId, type) {
  e.preventDefault(); e.stopPropagation();
  const scene = getActiveScene(); const el = scene.elements.find(e=>e.id===elId); if(!el) return;
  selectElement(elId);
  const container = document.getElementById('timeline-bar-wrap');
  TL_DRAG = {
    active: true, elId, type, startX: e.clientX,
    startEnter: el.enterAt || 0,
    startExit: el.exitAt !== null ? el.exitAt : scene.duration,
    duration: scene.duration,
    screenRect: container.getBoundingClientRect()
  };
  document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
}

function onTimelineDragMove(e) {
  if (!TL_DRAG.active || !TL_DRAG.screenRect) return;
  const scene = getActiveScene(); const el = scene.elements.find(e=>e.id===TL_DRAG.elId); if(!el) return;
  
  const dxPixels = e.clientX - TL_DRAG.startX;
  const pixelsPerSecond = TL_DRAG.screenRect.width / STATE.totalDuration;
  const dt = dxPixels / pixelsPerSecond;
  
  if (TL_DRAG.type === 'left') {
    let newEnter = Math.max(0, Math.min(TL_DRAG.startExit - 0.2, TL_DRAG.startEnter + dt));
    el.enterAt = parseFloat(newEnter.toFixed(2));
  } else if (TL_DRAG.type === 'right') {
    let newExit = Math.max(TL_DRAG.startEnter + 0.2, Math.min(TL_DRAG.duration, TL_DRAG.startExit + dt));
    el.exitAt = parseFloat(newExit.toFixed(2));
  } else if (TL_DRAG.type === 'move') {
    let newEnter = TL_DRAG.startEnter + dt;
    let newExit = TL_DRAG.startExit + dt;
    const dur = TL_DRAG.startExit - TL_DRAG.startEnter;
    if (newEnter < 0) { newEnter = 0; newExit = dur; }
    if (newExit > TL_DRAG.duration) { newExit = TL_DRAG.duration; newEnter = TL_DRAG.duration - dur; }
    el.enterAt = parseFloat(newEnter.toFixed(2));
    el.exitAt = parseFloat(newExit.toFixed(2));
  }
  
  buildElementsTimeline();
  updateElementVisibility(scene, STATE.currentTime - getSceneStartTime(scene.id));
}

function onTimelineDragEnd(e) {
  if (!TL_DRAG.active) return;
  TL_DRAG.active = false;
  document.body.style.cursor = '';
  saveState();
}

function buildElementsTimeline() {
  const container = document.getElementById('timeline-elements-container');
  if (!container) return;
  const scene = getActiveScene();
  const sceneStart = getSceneStartTime(scene.id);
  const total = STATE.totalDuration || 1;
  
  container.innerHTML = scene.elements.map(el => {
    const enter = el.enterAt || 0;
    const exit = el.exitAt !== null ? el.exitAt : scene.duration;
    
    const globalEnter = sceneStart + enter;
    const globalExit = sceneStart + exit;
    
    const leftPct = (globalEnter / total) * 100;
    const widthPct = ((globalExit - globalEnter) / total) * 100;
    const isSelected = STATE.selectedElementId === el.id;
    const isCollision = exit > scene.duration || enter >= scene.duration || enter >= exit || enter < 0;
    
    return `
      <div class="timeline-el-track">
        <div class="timeline-el-block ${isSelected ? 'selected' : ''} ${isCollision ? 'collision' : ''}" style="left:${leftPct}%; width:${widthPct}%;"
             onmousedown="onTimelineElementDown(event, '${el.id}', 'move')">
          <div class="tl-handle" onmousedown="onTimelineElementDown(event, '${el.id}', 'left')"></div>
          <div class="tl-el-name">${el.type === 'text' ? (el.content || 'Texto').replace(/<br>/g,' ') : (el.type === 'logo' ? 'Logo' : 'Imagen')}</div>
          <div class="tl-handle" onmousedown="onTimelineElementDown(event, '${el.id}', 'right')"></div>
        </div>
      </div>
    `;
  }).join('');
}

function buildTimeline() {
  computeTotalDuration();
  document.getElementById('time-total').innerText = STATE.totalDuration.toFixed(1);
  const row=document.getElementById('timeline-scenes-row');
  if (row) {
    let acc=0;
    row.innerHTML=STATE.scenes.map((s,i)=>{
      const l=(acc/STATE.totalDuration)*100, w=(s.duration/STATE.totalDuration)*100; acc+=s.duration;
      return `<div class="timeline-scene-block${s.id===STATE.activeSceneId?' active':''}" style="left:${l}%;width:${w}%;background:rgba(0,240,255,0.18);border-top:2px solid ${s.id===STATE.activeSceneId?'var(--accent)':'transparent'};" onclick="event.stopPropagation();setActiveScene(${s.id})"><span>${s.name}</span></div>`;
    }).join('');
  }
  buildElementsTimeline();
}
function buildSceneIndicator() {
  const el=document.getElementById('scene-indicator');
  if (el) el.innerHTML=STATE.scenes.map(s=>`<div class="scene-dot ${s.id===STATE.activeSceneId?'active':''}" onclick="setActiveScene(${s.id})"></div>`).join('');
}
function updateGlobalColor(which,value, s=true) {
  if(s) saveState();
  const root=document.documentElement;
  if (which==='accent') { STATE.globalAccent=value; root.style.setProperty('--accent',value); root.style.setProperty('--accent-glow',value+'55'); }
  else { STATE.globalAccentSec=value; root.style.setProperty('--accent-secondary',value); root.style.setProperty('--accent-sec-glow',value+'40'); }
}
function applyPalette(a,b) { updateGlobalColor('accent',a); updateGlobalColor('accent-sec',b); buildGlobalPanel(); }
function handleGlobalLogoUpload(event) {
  const file=event.target.files[0]; if(!file)return;
  STATE.logoSrc=URL.createObjectURL(file); buildGlobalPanel(); showToast('Logo cargado','success');
}
function addLogoToScene() {
  if (!STATE.logoSrc) return;
  saveState();
  const el=defaultImageElement({type:'logo',src:STATE.logoSrc,width:28,y:12});
  const scene=getActiveScene(); scene.elements.push(el); BLOB_URLS[el.id]=STATE.logoSrc;
  renderScene(scene); buildTimeline(); selectElement(el.id);
}
function handleSceneBgUpload(event, sceneId) {
  saveState();
  const file = event.target.files[0]; if (!file) return;
  const s=STATE.scenes.find(s=>s.id===sceneId);
  if (s) { s.bgImage=URL.createObjectURL(file); }
  if (sceneId===STATE.activeSceneId) renderScene(getActiveScene());
  buildScenesPanel();
}
function switchTab(name) {
  STATE.activeTab=name;
  ['scenes','element','global'].forEach(t=>{
    document.getElementById(`tab-btn-${t}`)?.classList.toggle('active',t===name);
    document.getElementById(`tab-${t}`)?.classList.toggle('active',t===name);
  });
}
function showToast(m,t='info') {
  const toast=document.getElementById('toast'), msg=document.getElementById('toast-message');
  if(!toast)return; toast.style.borderColor=t==='success'?'rgba(0,255,170,0.3)':'rgba(0,240,255,0.15)';
  msg.innerHTML=m; toast.classList.add('show');
  clearTimeout(window.__tT); window.__tT=setTimeout(()=>toast.classList.remove('show'),3000);
}
function resetToDefaults() {
  if (!confirm('¿Restaurar proyecto original en blanco?')) return;
  localStorage.removeItem('bb_promo_v2_autosave');
  location.reload();
}
function exportConfigJson() {
  const data=JSON.stringify(STATE, null, 2);
  const blob=new Blob([data],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Promo_${Date.now()}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function exportPromoLink() {
  try {
    // We only serialize what's necessary to keep the URL short
    const dataToShare = {
      scenes: STATE.scenes.map(s => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        bgColor: s.bgColor,
        bgGradient: s.bgGradient,
        elements: s.elements.filter(e => !e.isTempQuickText).map(e => {
          // Exclude local blob URLs to save space in sharing
          const cleanEl = { ...e };
          if (cleanEl.src && cleanEl.src.startsWith('blob:')) {
            delete cleanEl.src;
          }
          return cleanEl;
        })
      })),
      globalAccent: STATE.globalAccent,
      globalAccentSec: STATE.globalAccentSec,
      masterVolume: STATE.masterVolume
    };
    
    const jsonStr = JSON.stringify(dataToShare);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const shareUrl = `${window.location.origin}${window.location.pathname}#campaign=${base64}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('¡Enlace de campaña copiado al portapapeles!', 'success');
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
      // Fallback manual copying
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast('¡Enlace de campaña copiado al portapapeles!', 'success');
    });
  } catch (e) {
    console.error('Error al exportar campaña:', e);
    showToast('Error al generar enlace de compartir', 'warning');
  }
}

function checkUrlHashCampaign() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#campaign=')) {
    try {
      const base64Data = hash.substring('#campaign='.length);
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const data = JSON.parse(jsonStr);
      
      if (data && data.scenes) {
        // Apply state
        applyState(data);
        showToast('Campaña compartida cargada con éxito', 'success');
        // Clear hash from URL so it doesn't reload/clutter
        window.history.replaceState(null, null, window.location.pathname);
        return true;
      }
    } catch (e) {
      console.error('Error al decodificar campaña del URL:', e);
      showToast('El enlace de campaña compartido no es válido o está dañado', 'warning');
    }
  }
  return false;
}

// ──────────────────────────────────────────────────────────────
// GESTIÓN Y EXTRACCIÓN DE VIDEO DE REFERENCIA
// ──────────────────────────────────────────────────────────────
function handleReferenceVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Cerrar PiP si está activo al cargar un nuevo video
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(e => console.error('Error al salir de PiP:', e));
  }

  // Validación de tamaño (máximo 100MB) y tipo MIME
  if (file.size > 100 * 1024 * 1024) {
    showToast('El archivo supera el límite de 100MB', 'warning');
    event.target.value = '';
    return;
  }
  if (!file.type.startsWith('video/')) {
    showToast('El archivo seleccionado no es un video compatible', 'warning');
    event.target.value = '';
    return;
  }

  const url = URL.createObjectURL(file);
  if (referenceVideo.src && referenceVideo.src.startsWith('blob:')) {
    URL.revokeObjectURL(referenceVideo.src);
  }
  
  // Guardar persistencia del nombre en localStorage
  localStorage.setItem('bb_promo_ref_video_name', file.name);
  const refInfo = document.querySelector('.ref-info');
  if (refInfo) {
    refInfo.innerText = `Video: ${file.name}. Audio sincronizado del video base.`;
  }

  referenceVideo.src = url;
  referenceVideo.load();
  showToast('Video de referencia cargado con éxito', 'success');
}

function extractAudioFromReference() {
  if (!referenceVideo || !referenceVideo.src) {
    showToast('Primero carga un video de referencia', 'warning');
    return;
  }
  
  // Validación de pistas de audio
  let hasAudio = true;
  if (referenceVideo.mozHasAudio !== undefined) {
    hasAudio = referenceVideo.mozHasAudio;
  } else if (referenceVideo.webkitAudioDecodedByteCount !== undefined) {
    hasAudio = referenceVideo.webkitAudioDecodedByteCount > 0;
  } else if (referenceVideo.audioTracks !== undefined) {
    hasAudio = referenceVideo.audioTracks.length > 0;
  }
  
  if (!hasAudio) {
    showToast('Advertencia: El video de referencia no parece tener pistas de audio', 'warning');
  }

  saveState();
  if (voicePlayer.src && voicePlayer.src.startsWith('blob:')) {
    URL.revokeObjectURL(voicePlayer.src);
  }
  voicePlayer.src = referenceVideo.src;
  voicePlayer.load();
  if (STATE.audioReady) {
    setupVoiceAudio();
  }
  buildGlobalPanel();
  showToast('Audio extraído y asignado como Pista de Voz', 'success');

  // Registrar extracción en el log visual
  addExtractionLogEntry('audio', referenceVideo.currentTime);
}

function toggleReferenceLoop(checked) {
  if (referenceVideo) referenceVideo.loop = checked;
  const rangeRow = document.getElementById('ref-loop-range-row');
  if (rangeRow) {
    rangeRow.style.display = checked ? 'flex' : 'none';
    const endInput = document.getElementById('ref-loop-end');
    if (checked && endInput && parseFloat(endInput.value) === 0 && referenceVideo.duration) {
      endInput.value = referenceVideo.duration.toFixed(1);
      endInput.max = referenceVideo.duration;
    }
  }
}

function updateReferenceLoopRange() {
  if (!referenceVideo) return;
  const startInput = document.getElementById('ref-loop-start');
  const endInput = document.getElementById('ref-loop-end');
  if (!startInput || !endInput) return;

  let start = parseFloat(startInput.value);
  let end = parseFloat(endInput.value);

  if (isNaN(start) || start < 0) {
    start = 0;
    startInput.value = 0;
  }

  const duration = referenceVideo.duration || 9999;
  if (isNaN(end) || end > duration) {
    end = duration;
    endInput.value = duration.toFixed(1);
  }

  // Desactivación de bucles ultra-cortos (< 0.2s)
  if (end < start + 0.2) {
    end = start + 0.2;
    endInput.value = end.toFixed(1);
    showToast('El bucle debe durar al menos 0.2 segundos', 'warning');
  }

  if (referenceVideo.currentTime < start) {
    referenceVideo.currentTime = start;
  } else if (referenceVideo.currentTime >= end) {
    referenceVideo.currentTime = start;
  }
}

function toggleReferencePiP() {
  if (!document.pictureInPictureEnabled) {
    showToast('Tu navegador no soporta Picture-in-Picture nativo', 'warning');
    return;
  }
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
      .then(() => showToast('Modo Picture-in-Picture desactivado', 'info'))
      .catch(e => {
        console.warn('Error al desactivar PiP:', e);
        showToast('No se pudo desactivar el modo PiP', 'warning');
      });
  } else if (referenceVideo) {
    referenceVideo.requestPictureInPicture()
      .then(() => showToast('Modo Picture-in-Picture activado', 'success'))
      .catch(e => {
        console.warn('Error al activar PiP:', e);
        showToast('No se pudo activar el modo flotante PiP (requiere gesto del usuario)', 'warning');
      });
  }
}

function extractFrameFromReference() {
  if (!referenceVideo || !referenceVideo.src) {
    showToast('Primero carga un video de referencia', 'warning');
    return;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = referenceVideo.videoWidth || 640;
  canvas.height = referenceVideo.videoHeight || 1136;
  const ctx = canvas.getContext('2d');
  
  try {
    ctx.drawImage(referenceVideo, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('Error al generar la imagen del fotograma', 'warning');
        return;
      }
      saveState();
      const el = defaultImageElement({ type: 'image' });
      const url = URL.createObjectURL(blob);
      BLOB_URLS[el.id] = url;
      el.src = url;
      
      const scene = getActiveScene();
      scene.elements.push(el);
      renderScene(scene);
      buildTimeline();
      selectElement(el.id);
      showToast('¡Imagen extraída del video e inyectada a la escena!', 'success');

      // Registrar extracción en el log visual
      addExtractionLogEntry('image', referenceVideo.currentTime);
    }, 'image/png');
  } catch (e) {
    console.error('Error al capturar frame:', e);
    showToast('Error al extraer imagen (puede ser CORS si el video no es local)', 'warning');
  }
}

// ──────────────────────────────────────────────────────────────
// PREVISUALIZACIÓN EN TIEMPO REAL (QUICK TEXT EDITOR)
// ──────────────────────────────────────────────────────────────
function onQuickTextChange(sceneId) {
  const content  = document.getElementById(`sc-txt-${sceneId}`)?.value || ' ';
  const fontSize = parseInt(document.getElementById(`sc-sz-${sceneId}`)?.value||28);
  const fontWeight= parseInt(document.getElementById(`sc-w-${sceneId}`)?.value||800);
  const color    = document.getElementById(`sc-col-${sceneId}`)?.value || '#ffffff';
  const bgInputEl = document.getElementById(`sc-bg-${sceneId}`);
  const bgColor  = (bgInputEl?.dataset?.transparent === 'true') ? 'transparent' : (bgInputEl?.value || '#000000');
  const textAlign= document.getElementById(`sc-align-${sceneId}`)?.value || 'center';
  const y        = parseInt(document.getElementById(`sc-y-${sceneId}`)?.value||50);
  const enterAnimation = document.getElementById(`sc-anim-${sceneId}`)?.value || 'slide-up';
  const fontFamily = document.getElementById(`sc-font-${sceneId}`)?.value || 'Outfit';

  const scene = STATE.scenes.find(s=>s.id===sceneId); if (!scene) return;
  
  let el = scene.elements.find(e => e.isTempQuickText === true);
  if (!el) {
    el = defaultTextElement({ 
      isTempQuickText: true,
      content, fontSize, fontWeight, fontFamily, color, bgColor, 
      bgPadding: bgColor!=='transparent'?8:0, bgRadius: bgColor!=='transparent'?6:0, 
      textAlign, y, enterAnimation 
    });
    scene.elements.push(el);
  } else {
    el.content = content;
    el.fontSize = fontSize;
    el.fontWeight = fontWeight;
    el.fontFamily = fontFamily;
    el.color = color;
    el.bgColor = bgColor;
    el.bgPadding = bgColor !== 'transparent' ? 8 : 0;
    el.bgRadius = bgColor !== 'transparent' ? 6 : 0;
    el.textAlign = textAlign;
    el.y = y;
    el.enterAnimation = enterAnimation;
  }
  
  renderScene(scene);
}

function updateReferenceVolume(val) {
  if (refVolumeGain) {
    refVolumeGain.gain.value = parseFloat(val);
  } else if (referenceVideo) {
    referenceVideo.volume = parseFloat(val);
  }
  updateVolumeSliderStyles();

  // Sincronización vinculada
  const linkVol = document.getElementById('link-volume-checkbox');
  if (linkVol && linkVol.checked) {
    const masterVolSlider = document.getElementById('master-volume-slider');
    if (masterVolSlider) {
      masterVolSlider.value = val;
    }
    if (STATE.masterVolume !== parseFloat(val)) {
      STATE.masterVolume = parseFloat(val);
      if (STATE.audioNodes && STATE.audioNodes.masterGain) {
        STATE.audioNodes.masterGain.gain.value = STATE.isMuted ? 0 : parseFloat(val);
      } else if (videoPlayer) {
        videoPlayer.volume = STATE.isMuted ? 0 : parseFloat(val);
      }
      const slider = document.getElementById('master-volume-slider');
      if (slider) {
        slider.style.filter = STATE.isMuted || parseFloat(val) === 0 ? 'grayscale(1) opacity(0.5)' : '';
      }
    }
  }
}

function updateVolumeSliderStyles() {
  const slider = document.getElementById('ref-volume-slider');
  const valSpan = document.getElementById('ref-volume-val');
  if (slider) {
    const isMuted = STATE.isMuted || parseFloat(slider.value) === 0;
    slider.style.filter = isMuted ? 'grayscale(1) opacity(0.5)' : '';
    if (valSpan) {
      valSpan.style.color = isMuted ? 'var(--text-gray)' : 'var(--accent)';
      if (STATE.isMuted) {
        valSpan.innerText = 'MUTED';
      } else {
        valSpan.innerText = Math.round(parseFloat(slider.value) * 100) + '%';
      }
    }
  }
}

function stepReferenceFrame(dt) {
  if (!referenceVideo) return;
  referenceVideo.currentTime = Math.max(0, Math.min(referenceVideo.duration, referenceVideo.currentTime + dt));
  
  if (videoPlayer) {
    videoPlayer.currentTime = referenceVideo.currentTime;
    STATE.currentTime = videoPlayer.currentTime;
    const ce = document.getElementById('time-current'); if (ce) ce.innerText = STATE.currentTime.toFixed(2);
    const ph = document.getElementById('timeline-playhead'); if (ph) ph.style.left = `${Math.min(100,(STATE.currentTime/STATE.totalDuration)*100).toFixed(2)}%`;
    const {scene, offset} = getSceneAtTime(STATE.currentTime);
    if (scene.id !== STATE.activeSceneId) {
      STATE.activeSceneId = scene.id;
      renderScene(scene);
      buildTimeline();
      buildSceneIndicator();
    }
    updateElementVisibility(scene, offset);
  }
}

// ──────────────────────────────────────────────────────────────
// COLOR EYE DROPPER & ANIMATION PREVIEW
// ──────────────────────────────────────────────────────────────
function pickColorWithEyedropper(elId, prop) {
  if (!window.EyeDropper) {
    showToast('Tu navegador no soporta el Cuentagotas visual (se requiere Chrome/Edge reciente)', 'warning');
    return;
  }
  const eyeDropper = new EyeDropper();
  eyeDropper.open().then(result => {
    const color = result.sRGBHex;
    updateElProp(elId, prop, color);
    if (prop === 'color') {
      const picker = document.getElementById(`col-picker-${elId}`);
      const text = document.getElementById(`val-col-${elId}`);
      if (picker) picker.value = color;
      if (text) text.value = color;
    } else if (prop === 'bgColor') {
      const picker = document.getElementById(`bg-picker-${elId}`);
      if (picker) picker.value = color;
    }
    showToast('Color capturado con éxito', 'success');
  }).catch(e => {
    console.log('EyeDropper cancelado:', e);
  });
}

function previewElementAnimation(elId) {
  const div = document.querySelector(`[data-el-id="${elId}"]`);
  if (!div) return;
  const scene = getActiveScene();
  const el = scene.elements.find(e => e.id === elId);
  if (!el) return;
  
  const anim = el.enterAnimation || 'fade-in';
  div.className = `phone-element selected`; // Limpiar animaciones previas
  void div.offsetWidth; // Disparar reflow del navegador para reiniciar animación CSS
  div.className = `phone-element anim-${anim} selected`;
}

function previewElementExitAnimation(elId) {
  const div = document.querySelector(`[data-el-id="${elId}"]`);
  if (!div) return;
  const scene = getActiveScene();
  const el = scene.elements.find(e => e.id === elId);
  if (!el) return;
  
  const anim = el.exitAnimation || 'fade-out';
  if (anim === 'none') return;
  div.className = `phone-element selected`; // Limpiar animaciones previas
  void div.offsetWidth; // Disparar reflow
  div.className = `phone-element anim-exit-${anim} selected`;
  
  // Restores the element to editor mode after 1s
  setTimeout(() => {
    if (STATE.selectedElementId === elId) {
      div.className = `phone-element selected`;
      const enterAnim = el.enterAnimation || 'fade-in';
      div.classList.add(`anim-${enterAnim}`);
    }
  }, 1000);
}

function toggleSceneLoop() {
  isSceneLoopActive = !isSceneLoopActive;
  localStorage.setItem('bb_promo_scene_loop_active', isSceneLoopActive);
  const loopIcon = document.getElementById('loop-scene-icon');
  const loopBtn = document.getElementById('btn-loop-scene');
  if (loopIcon) {
    if (isSceneLoopActive) {
      loopIcon.style.color = 'var(--accent)';
      if (loopBtn) loopBtn.title = "Bucle por escena activo (Repitiendo escena actual)";
      showToast('Bucle por escena activado', 'success');
    } else {
      loopIcon.style.color = 'var(--text-gray)';
      if (loopBtn) loopBtn.title = "Repetir escena actual (Bucle)";
      showToast('Bucle por escena desactivado', 'info');
    }
  }
}

function changeReferencePlaybackRate(val) {
  if (referenceVideo) {
    let speed = parseFloat(val);
    if (isNaN(speed) || speed < 0.25 || speed > 2.0) {
      speed = 1.0;
      showToast('Velocidad inválida, restablecida a 1.0x', 'warning');
    }
    referenceVideo.playbackRate = speed;
    showToast(`Velocidad de referencia: ${speed}x`, 'success');
  }
}

function addExtractionLogEntry(type, seconds) {
  const logDiv = document.getElementById('ref-extraction-log');
  const logList = document.getElementById('ref-extraction-list');
  if (!logDiv || !logList) return;

  logDiv.style.display = 'block';
  const itemId = 'ext-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

  const container = document.createElement('div');
  container.id = itemId;
  container.style.display = 'flex';
  container.style.justifyContent = 'space-between';
  container.style.alignItems = 'center';
  container.style.marginBottom = '2px';
  container.style.fontSize = '10px';

  const textSpan = document.createElement('span');
  textSpan.style.overflow = 'hidden';
  textSpan.style.textOverflow = 'ellipsis';
  textSpan.style.whiteSpace = 'nowrap';
  textSpan.style.maxWidth = '85%';
  
  const icon = type === 'audio' ? '🎵' : '🖼️';
  const label = type === 'audio' ? 'Audio' : 'Imagen';
  const timeText = `${icon} ${label} en ${seconds.toFixed(2)}s`;
  textSpan.textContent = timeText;
  textSpan.title = timeText;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-sm';
  deleteBtn.style.fontSize = '8px';
  deleteBtn.style.padding = '0 3px';
  deleteBtn.style.height = 'auto';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.background = 'transparent';
  deleteBtn.style.border = 'none';
  deleteBtn.style.color = 'var(--text-gray)';
  deleteBtn.textContent = '✕';
  deleteBtn.onclick = () => deleteExtractionItem(itemId);

  container.appendChild(textSpan);
  container.appendChild(deleteBtn);
  logList.appendChild(container);
}

function clearExtractionLog() {
  const logList = document.getElementById('ref-extraction-list');
  const logDiv = document.getElementById('ref-extraction-log');
  if (logList) {
    logList.innerHTML = '';
  }
  if (logDiv) {
    logDiv.style.display = 'none';
  }
  showToast('Historial de extracciones limpio', 'info');
}

function deleteExtractionItem(id) {
  const item = document.getElementById(id);
  if (item) {
    item.remove();
  }
  const logList = document.getElementById('ref-extraction-list');
  const logDiv = document.getElementById('ref-extraction-log');
  if (logList && logList.children.length === 0 && logDiv) {
    logDiv.style.display = 'none';
  }
}

function updateTimelineZoom(val) {
  const editor = document.getElementById('timeline-editor');
  if (editor) {
    editor.style.setProperty('--timeline-zoom', val);
  }
}

function seekByTimeline(e) {
  const container = document.getElementById('timeline-bar-wrap');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pct = clickX / rect.width;
  const targetTime = pct * STATE.totalDuration;
  if (videoPlayer) {
    videoPlayer.currentTime = targetTime;
    onVideoTimeUpdate();
  }
}

// Variables globales para las sugerencias
let isGridOverlayActive = false;
let copiedTextStyle = null;
let copiedSceneElements = null;

function toggleGridOverlay() {
  isGridOverlayActive = !isGridOverlayActive;
  const gridEl = document.getElementById('grid-overlay');
  const gridIcon = document.getElementById('grid-icon');
  if (gridEl && gridIcon) {
    gridEl.style.display = isGridOverlayActive ? 'block' : 'none';
    gridIcon.style.color = isGridOverlayActive ? 'var(--accent)' : 'var(--text-gray)';
    showToast(isGridOverlayActive ? 'Cuadrícula activada' : 'Cuadrícula desactivada', 'info');
  }
}

function copyTextStyle(elId) {
  const scene = getActiveScene();
  const el = scene.elements.find(e => e.id === elId);
  if (!el) return;
  copiedTextStyle = {
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color: el.color,
    textAlign: el.textAlign,
    italic: el.italic,
    underline: el.underline,
    textShadow: el.textShadow,
    textShadowColor: el.textShadowColor,
    textShadowBlur: el.textShadowBlur,
    letterSpacing: el.letterSpacing,
    lineHeight: el.lineHeight,
    bgColor: el.bgColor,
    bgPadding: el.bgPadding,
    bgRadius: el.bgRadius,
    enterAnimation: el.enterAnimation,
    exitAnimation: el.exitAnimation
  };
  showToast('Estilos copiados al portapapeles', 'success');
  buildElementPropsPanel(elId);
}

function pasteTextStyle(elId) {
  if (!copiedTextStyle) {
    showToast('No hay estilos copiados', 'warning');
    return;
  }
  saveState();
  const scene = getActiveScene();
  const el = scene.elements.find(e => e.id === elId);
  if (!el) return;
  Object.assign(el, copiedTextStyle);
  renderScene(scene);
  buildElementPropsPanel(elId);
  showToast('Estilos aplicados correctamente', 'success');
}

function updateMasterVolume(val) {
  const vol = parseFloat(val);
  STATE.masterVolume = vol;
  if (STATE.audioNodes && STATE.audioNodes.masterGain) {
    STATE.audioNodes.masterGain.gain.value = STATE.isMuted ? 0 : vol;
  } else if (videoPlayer) {
    videoPlayer.volume = STATE.isMuted ? 0 : vol;
  }
  
  if (vol > 0 && STATE.isMuted) {
    toggleMute();
  }
  
  const slider = document.getElementById('master-volume-slider');
  if (slider) {
    slider.style.filter = STATE.isMuted || vol === 0 ? 'grayscale(1) opacity(0.5)' : '';
  }

  // Sincronización vinculada
  const linkVol = document.getElementById('link-volume-checkbox');
  if (linkVol && linkVol.checked) {
    const refVolSlider = document.getElementById('ref-volume-slider');
    if (refVolSlider) {
      refVolSlider.value = val;
    }
    const refVolVal = document.getElementById('ref-volume-val');
    if (refVolVal) {
      refVolVal.innerText = Math.round(vol * 100) + '%';
    }
    if (refVolumeGain) {
      refVolumeGain.gain.value = vol;
    } else if (referenceVideo) {
      referenceVideo.volume = vol;
    }
  }
}

function copySceneElements(sceneId) {
  const scene = STATE.scenes.find(s => s.id === sceneId);
  if (!scene) return;
  copiedSceneElements = JSON.parse(JSON.stringify(scene.elements.filter(e => !e.isTempQuickText)));
  showToast(`Copiadas todas las capas de la escena "${scene.name}"`, 'success');
  buildScenesPanel();
}

function pasteSceneElements(sceneId) {
  if (!copiedSceneElements) {
    showToast('No hay capas en el portapapeles', 'warning');
    return;
  }
  saveState();
  const scene = STATE.scenes.find(s => s.id === sceneId);
  if (!scene) return;
  
  const elementsCopy = copiedSceneElements.map(el => {
    const newEl = JSON.parse(JSON.stringify(el));
    const oldId = newEl.id;
    newEl.id = generateId();
    if (BLOB_URLS[oldId]) {
      BLOB_URLS[newEl.id] = BLOB_URLS[oldId];
    }
    return newEl;
  });
  
  scene.elements = scene.elements.concat(elementsCopy);
  renderScene(scene);
  buildScenesPanel();
  buildTimeline();
  showToast(`Pegadas ${elementsCopy.length} capas en la escena "${scene.name}"`, 'success');
}

function applySceneGradient(gradient) {
  saveState();
  const scene = getActiveScene();
  if (scene) {
    scene.bgGradient = gradient;
    scene.bgImage = null;
    renderScene(scene);
    buildScenesPanel();
    showToast('Degradado aplicado a la escena activa', 'success');
  }
}

function setElRotation(elId, val) {
  saveState();
  const scene = getActiveScene();
  const el = scene.elements.find(e => e.id === elId);
  if (el) {
    el.rotation = parseInt(val);
    renderScene(scene);
    buildElementPropsPanel(elId);
    showToast(`Rotación establecida a ${val}°`, 'success');
  }
}

// ──────────────────────────────────────────────────────────────
// CLOUD SAVING (MOCK CON LOCALSTORAGE)
// ──────────────────────────────────────────────────────────────
function generateCloudCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BB-${code}`;
}

function saveToCloud() {
  const code = generateCloudCode();
  const projectData = {
    scenes: STATE.scenes,
    globalAccent: STATE.globalAccent,
    globalAccentSec: STATE.globalAccentSec,
    masterVolume: STATE.masterVolume,
    logoSrc: STATE.logoSrc
  };
  const cloudSaves = JSON.parse(localStorage.getItem('bb_cloud_saves') || '{}');
  cloudSaves[code] = JSON.stringify(projectData);
  localStorage.setItem('bb_cloud_saves', JSON.stringify(cloudSaves));
  alert(`☁️ ¡Proyecto Sincronizado con la Nube!\n\nCódigo de restauración: ${code}\n\nUsa este código en el botón "Cargar desde la Nube" para recuperar tu proyecto.`);
  showToast(`Proyecto guardado con código ${code}`, 'success');
  buildGlobalPanel();
}

function loadFromCloud() {
  const code = prompt('Ingresa el código de restauración (Ej: BB-XXXXXX):');
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  const cloudSaves = JSON.parse(localStorage.getItem('bb_cloud_saves') || '{}');
  const savedData = cloudSaves[cleanCode];
  if (savedData) {
    saveState('Cargar desde la Nube');
    applyState(JSON.parse(savedData));
    showToast(`Proyecto ${cleanCode} restaurado`, 'success');
  } else {
    alert(`❌ No se encontró ningún proyecto con el código "${cleanCode}".`);
    showToast('Código de nube inválido', 'warning');
  }
}

// ──────────────────────────────────────────────────────────────
// EXPORT SCENE HD (1080x1920)
// ──────────────────────────────────────────────────────────────
function applyCssBackgroundToCanvas(ctx, bgString, width, height) {
  if (!bgString) {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);
    return;
  }
  try {
    if (bgString.includes('radial-gradient')) {
      const colors = bgString.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/g);
      const posMatch = bgString.match(/at\s+(\d+)%\s+(\d+)%/);
      let px = 0.5, py = 0.5;
      if (posMatch) {
        px = parseFloat(posMatch[1]) / 100;
        py = parseFloat(posMatch[2]) / 100;
      }
      if (colors && colors.length >= 2) {
        const cx = width * px;
        const cy = height * py;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height));
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[colors.length - 1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }
    } else if (bgString.includes('linear-gradient')) {
      const colors = bgString.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/g);
      if (colors && colors.length >= 2) {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[colors.length - 1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }
    }
  } catch (err) {
    console.warn('Error parsing background gradient:', err);
  }
  ctx.fillStyle = bgString.includes('gradient') ? '#05050a' : bgString;
  ctx.fillRect(0, 0, width, height);
}

function drawTextElementOnCanvas(ctx, el, scale) {
  ctx.save();
  const cx = (el.x / 100) * 1080;
  const cy = (el.y / 100) * 1920;
  const fontSize = (el.fontSize || 28) * scale;
  const fontWeight = el.fontWeight || 800;
  const fontFamily = el.fontFamily || 'Outfit';
  const color = el.color || '#ffffff';
  const textAlign = el.textAlign || 'center';
  const italic = el.italic ? 'italic' : 'normal';
  const rotationRad = ((el.rotation || 0) * Math.PI) / 180;
  const lineHeight = el.lineHeight || 1.15;
  
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.font = `${italic} ${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
  ctx.textBaseline = 'middle';
  
  const lines = (el.content || '').replace(/<br>/g, '\n').split('\n');
  const lineHeights = fontSize * lineHeight;
  const totalHeight = lines.length * lineHeights;
  
  let maxLineWidth = 0;
  lines.forEach(line => {
    const m = ctx.measureText(line);
    if (m.width > maxLineWidth) maxLineWidth = m.width;
  });
  
  if (el.bgColor && el.bgColor !== 'transparent') {
    const padX = (el.bgPadding || 0) * 1.8 * scale;
    const padY = (el.bgPadding || 0) * scale;
    const rectWidth = maxLineWidth + padX * 2;
    const rectHeight = totalHeight + padY * 2;
    const rx = -rectWidth / 2;
    const ry = -rectHeight / 2;
    const radius = (el.bgRadius || 0) * scale;
    
    ctx.fillStyle = el.bgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rx, ry, rectWidth, rectHeight, radius);
    else ctx.rect(rx, ry, rectWidth, rectHeight);
    ctx.fill();
  }
  
  if (el.textShadow) {
    ctx.shadowColor = el.textShadowColor || '#000000';
    ctx.shadowBlur = (el.textShadowBlur || 10) * scale;
    ctx.shadowOffsetY = 2 * scale;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  
  lines.forEach((line, idx) => {
    const lx = textAlign === 'center' ? 0 : (textAlign === 'left' ? -maxLineWidth / 2 : maxLineWidth / 2);
    const ly = -totalHeight / 2 + (idx + 0.5) * lineHeights;
    ctx.fillText(line, lx, ly);
  });
  ctx.restore();
}

function drawImageElementOnCanvas(ctx, el, scale) {
  const src = BLOB_URLS[el.id] || el.src;
  if (!src) return Promise.resolve();
  
  return loadImage(src).then(img => {
    ctx.save();
    const cx = (el.x / 100) * 1080;
    const cy = (el.y / 100) * 1920;
    const rotationRad = ((el.rotation || 0) * Math.PI) / 180;
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
    
    let filters = [];
    if (el.brightness !== undefined && el.brightness !== 100) filters.push(`brightness(${el.brightness}%)`);
    if (el.contrast !== undefined && el.contrast !== 100) filters.push(`contrast(${el.contrast}%)`);
    if (filters.length) ctx.filter = filters.join(' ');
    
    const imgWidth = ((el.width || 70) / 100) * 1080;
    const imgHeight = imgWidth * (img.naturalHeight / img.naturalWidth);
    const rx = -imgWidth / 2;
    const ry = -imgHeight / 2;
    
    if (el.borderRadius || el.borderRadius === 0) {
      const radius = (el.borderRadius || 8) * scale;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(rx, ry, imgWidth, imgHeight, radius);
      else ctx.rect(rx, ry, imgWidth, imgHeight);
      ctx.clip();
    }
    ctx.drawImage(img, rx, ry, imgWidth, imgHeight);
    ctx.restore();
  }).catch(err => {
    console.warn('Error loading element image for canvas:', err);
  });
}

function drawShapeElementOnCanvas(ctx, el, scale) {
  ctx.save();
  const cx = (el.x / 100) * 1080;
  const cy = (el.y / 100) * 1920;
  const shapeWidth = ((el.width || 80) / 100) * 1080;
  const shapeHeight = (el.height || 6) * scale;
  const radius = (el.borderRadius || 4) * scale;
  const rotationRad = ((el.rotation || 0) * Math.PI) / 180;
  
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
  const rx = -shapeWidth / 2;
  const ry = -shapeHeight / 2;
  
  ctx.fillStyle = el.bgColor || 'rgba(0, 240, 255, 0.3)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(rx, ry, shapeWidth, shapeHeight, radius);
  else ctx.rect(rx, ry, shapeWidth, shapeHeight);
  ctx.fill();
  ctx.restore();
}

function exportActiveSceneHD() {
  const scene = getActiveScene();
  if (!scene) {
    showToast('No hay una escena activa para exportar', 'warning');
    return;
  }
  showToast('Generando render HD (1080x1920)...', 'info');
  
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  const scale = 1080 / 274;
  
  let bgPromise;
  if (scene.bgImage) {
    bgPromise = loadImage(scene.bgImage).then(img => {
      ctx.drawImage(img, 0, 0, 1080, 1920);
    }).catch(() => {
      applyCssBackgroundToCanvas(ctx, scene.bgGradient || scene.bgColor, 1080, 1920);
    });
  } else {
    applyCssBackgroundToCanvas(ctx, scene.bgGradient || scene.bgColor, 1080, 1920);
    bgPromise = Promise.resolve();
  }
  
  bgPromise.then(() => {
    if (videoPlayer && videoPlayer.src && !videoPlayer.paused) {
      try {
        ctx.drawImage(videoPlayer, 0, 0, 1080, 1920);
      } catch (e) {
        console.warn('No se pudo renderizar frame de video:', e);
      }
    }
    
    let promiseChain = Promise.resolve();
    scene.elements.forEach(el => {
      const exit = el.exitAt !== null ? el.exitAt : scene.duration;
      const now = STATE.isPlaying ? STATE.currentTime - getSceneStartTime(scene.id) : 0;
      if (STATE.isPlaying && (now < (el.enterAt || 0) || now >= exit)) return;
      
      if (el.type === 'text') {
        promiseChain = promiseChain.then(() => {
          drawTextElementOnCanvas(ctx, el, scale);
        });
      } else if (el.type === 'image' || el.type === 'logo') {
        promiseChain = promiseChain.then(() => {
          return drawImageElementOnCanvas(ctx, el, scale);
        });
      } else if (el.type === 'shape') {
        promiseChain = promiseChain.then(() => {
          drawShapeElementOnCanvas(ctx, el, scale);
        });
      }
    });
    return promiseChain;
  }).then(() => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `escena_${scene.id}_hd.png`;
    link.href = dataUrl;
    link.click();
    showToast('¡Imagen HD descargada con éxito!', 'success');
  }).catch(err => {
    console.error('Error renderizando escena HD:', err);
    showToast('Error al exportar escena en HD', 'warning');
  });
}

// ──────────────────────────────────────────────────────────────
// VOICE RECORDING & TTS GENERATOR
// ──────────────────────────────────────────────────────────────
function toggleVoiceRecording() {
  const btn = document.getElementById('btn-record-voice');
  const icon = document.getElementById('rec-icon');
  const text = document.getElementById('rec-text');
  
  if (!isRecordingVoice) {
    navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: true, 
        noiseSuppression: true, 
        autoGainControl: true 
      } 
    }).then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        stopMicLevelMonitoring();
        const blob = new Blob(recordedChunks, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        if (voicePlayer.src && voicePlayer.src.startsWith('blob:')) {
          URL.revokeObjectURL(voicePlayer.src);
        }
        voicePlayer.src = url;
        showToast('Voz en off grabada con éxito', 'success');
        if (STATE.audioReady) setupVoiceAudio();
        
        // Registrar en la librería
        addAudioToLibrary('Voz en off', url);
        
        activeSceneRecordingId = null;
        isRecordingVoice = false;
        buildScenesPanel();
        buildGlobalPanel();
        
        detectSilenceInVoiceFile(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      isRecordingVoice = true;
      if (btn) btn.style.background = 'rgba(255, 56, 96, 0.2)';
      if (icon) {
        icon.className = 'ri-record-circle-line';
        icon.style.color = 'var(--danger)';
        icon.style.animation = 'strobeEffect 0.8s steps(1) infinite';
      }
      if (text) text.innerText = 'Detener Grabación';
      showToast('Grabando voz... Habla ahora', 'info');
      
      // VU Meter
      startMicLevelMonitoring(stream);
      
      buildScenesPanel();
    }).catch(err => {
      console.error('Error al acceder al micrófono:', err);
      showToast('No se pudo acceder al micrófono', 'warning');
      activeSceneRecordingId = null;
      buildScenesPanel();
    });
  } else {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecordingVoice = false;
    activeSceneRecordingId = null;
    buildScenesPanel();
    if (btn) btn.style.background = '';
    if (icon) {
      icon.className = 'ri-record-circle-line';
      icon.style.color = '';
      icon.style.animation = '';
    }
    if (text) text.innerText = 'Grabar Voz en Off';
  }
}

function generateTTSVoice() {
  const textarea = document.getElementById('tts-textarea');
  const langSelect = document.getElementById('tts-lang');
  const speedSelect = document.getElementById('tts-speed');
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) {
    showToast('Escribe algún texto para generar la voz', 'warning');
    return;
  }
  
  const lang = langSelect ? langSelect.value : 'es-mx';
  const speed = speedSelect ? parseFloat(speedSelect.value) : 1.0;
  
  showToast('Generando voz por IA (TTS)...', 'info');
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
  
  if (voicePlayer.src && voicePlayer.src.startsWith('blob:')) {
    URL.revokeObjectURL(voicePlayer.src);
  }
  
  voicePlayer.src = url;
  voicePlayer.load();
  voicePlayer.playbackRate = speed;
  
  if (STATE.audioReady) {
    setupVoiceAudio();
  }
  
  // Registrar en la librería
  const ttsName = text.length > 15 ? text.substring(0, 15) + '...' : text;
  addAudioToLibrary('TTS (' + lang + '): ' + ttsName, url);
  
  showToast('Locución generada por IA cargada', 'success');
  buildGlobalPanel();
}

function autoTrimDetectedSilences() {
  if (!currentDecodedVoiceBuffer || currentDetectedSilences.length === 0) {
    showToast('No hay silencios detectados para recortar', 'warning');
    return;
  }
  
  try {
    showToast('Recortando silencios y generando nuevo audio...', 'info');
    const trimmedBuffer = trimAudioBufferSilences(currentDecodedVoiceBuffer, currentDetectedSilences);
    const wavBlob = bufferToWavBlob(trimmedBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    if (voicePlayer.src && voicePlayer.src.startsWith('blob:')) {
      URL.revokeObjectURL(voicePlayer.src);
    }
    
    voicePlayer.src = url;
    voicePlayer.load();
    
    currentDecodedVoiceBuffer = trimmedBuffer;
    currentDetectedSilences = [];
    
    const trimContainer = document.getElementById('voice-trim-container');
    if (trimContainer) trimContainer.style.display = 'none';
    
    showToast('✅ Pista de voz optimizada sin silencios largos', 'success');
    buildGlobalPanel();
  } catch (err) {
    console.error('Error al recortar silencios:', err);
    showToast('Error al procesar el recorte de silencios', 'warning');
  }
}

function trimAudioBufferSilences(audioBuffer, silences) {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  
  const silentRanges = silences.map(s => ({
    startSample: Math.floor(s.start * sampleRate),
    endSample: Math.floor(s.end * sampleRate)
  }));
  
  let keepRanges = [];
  let currentPos = 0;
  
  silentRanges.forEach(range => {
    if (range.startSample > currentPos) {
      keepRanges.push({ start: currentPos, end: range.startSample });
    }
    currentPos = range.endSample;
  });
  
  if (currentPos < audioBuffer.length) {
    keepRanges.push({ start: currentPos, end: audioBuffer.length });
  }
  
  const newLength = keepRanges.reduce((sum, r) => sum + (r.end - r.start), 0);
  if (newLength === 0) return audioBuffer;
  
  const ctx = STATE.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const newBuffer = ctx.createBuffer(channels, newLength, sampleRate);
  
  for (let channel = 0; channel < channels; channel++) {
    const oldData = audioBuffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    let writeOffset = 0;
    
    keepRanges.forEach(r => {
      const segment = oldData.subarray(r.start, r.end);
      newData.set(segment, writeOffset);
      writeOffset += segment.length;
    });
  }
  
  return newBuffer;
}

function bufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * 2 * numOfChan + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;
  
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // raw PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);
  
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  
  return new Blob([bufferArr], { type: 'audio/wav' });
}

function toggleShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) {
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';
  }
}

// ──────────────────────────────────────────────────────────────
// VU METER MONITORING & AUDIO LIBRARY HELPERS
// ──────────────────────────────────────────────────────────────
function startMicLevelMonitoring(stream) {
  const audioCtx = STATE.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  micStreamSource = audioCtx.createMediaStreamSource(stream);
  micAnalyser = audioCtx.createAnalyser();
  micAnalyser.fftSize = 256;
  micStreamSource.connect(micAnalyser);
  
  const meter = document.getElementById('mic-level-meter');
  const bar = document.getElementById('mic-level-bar');
  if (meter) meter.style.display = 'block';
  
  const bufferLength = micAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function updateMeter() {
    if (!isRecordingVoice) return;
    micAnalyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const percent = Math.min(100, Math.round((average / 140) * 100));
    
    if (bar) {
      bar.style.width = percent + '%';
      if (percent > 85) {
        bar.style.background = 'var(--danger)';
      } else if (percent > 60) {
        bar.style.background = '#ffd700'; // Yellow
      } else {
        bar.style.background = 'var(--accent)';
      }
    }
    
    micAnimationId = requestAnimationFrame(updateMeter);
  }
  
  updateMeter();
}

function stopMicLevelMonitoring() {
  if (micAnimationId) {
    cancelAnimationFrame(micAnimationId);
    micAnimationId = null;
  }
  const meter = document.getElementById('mic-level-meter');
  const bar = document.getElementById('mic-level-bar');
  if (meter) meter.style.display = 'none';
  if (bar) bar.style.width = '0%';
  
  if (micStreamSource) {
    micStreamSource.disconnect();
    micStreamSource = null;
  }
  micAnalyser = null;
}

function addAudioToLibrary(name, src) {
  if (VOICE_LIBRARY.some(item => item.src === src)) return;
  VOICE_LIBRARY.unshift({ name, src, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
  if (VOICE_LIBRARY.length > 5) {
    VOICE_LIBRARY.pop();
  }
  updateVoiceLibraryUI();
}

function updateVoiceLibraryUI() {
  const container = document.getElementById('voice-library-box');
  const list = document.getElementById('voice-library-list');
  if (container && list) {
    if (VOICE_LIBRARY.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    list.innerHTML = VOICE_LIBRARY.map((item, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:4px 6px; font-size:9px;">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px; color:${voicePlayer.src === item.src ? 'var(--accent)' : '#fff'};" title="${item.name}">${item.name} (${item.date})</span>
        <button class="btn-sm" style="font-size:8px; padding:1px 4px; height:auto; cursor:pointer;" onclick="selectVoiceLibraryItem(${idx})">Usar</button>
      </div>
    `).join('');
  }
}

function selectVoiceLibraryItem(idx) {
  const item = VOICE_LIBRARY[idx];
  if (!item) return;
  
  saveState('Cargar toma de voz');
  voicePlayer.src = item.src;
  voicePlayer.load();
  if (STATE.audioReady) setupVoiceAudio();
  showToast(`Cargada toma: ${item.name}`, 'success');
  buildGlobalPanel();
}

// ──────────────────────────────────────────────────────────────
// AUDIO EDITING, ALIGNMENT & WEBBM COMPILER HELPERS
// ──────────────────────────────────────────────────────────────
function applyManualAudioCrop() {
  const startInput = document.getElementById('voice-crop-start');
  const endInput = document.getElementById('voice-crop-end');
  if (!startInput || !endInput) return;
  
  const startVal = parseFloat(startInput.value);
  const endVal = parseFloat(endInput.value);
  
  const bufferToUse = originalUploadedVoiceBuffer || currentDecodedVoiceBuffer;
  if (!bufferToUse) {
    showToast('Primero carga o graba una pista de voz', 'warning');
    return;
  }
  
  const duration = bufferToUse.duration;
  if (isNaN(startVal) || isNaN(endVal) || startVal < 0 || endVal > duration || startVal >= endVal) {
    showToast('Valores de recorte inválidos', 'warning');
    return;
  }
  
  try {
    saveState('Recortar audio');
    showToast('Cortando pista de audio...', 'info');
    
    const sampleRate = bufferToUse.sampleRate;
    const channels = bufferToUse.numberOfChannels;
    const startSample = Math.floor(startVal * sampleRate);
    const endSample = Math.floor(endVal * sampleRate);
    const newLength = endSample - startSample;
    
    const ctx = STATE.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const newBuffer = ctx.createBuffer(channels, newLength, sampleRate);
    
    for (let channel = 0; channel < channels; channel++) {
      const oldData = bufferToUse.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      newData.set(oldData.subarray(startSample, endSample));
    }
    
    const wavBlob = bufferToWavBlob(newBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    if (voicePlayer.src && voicePlayer.src.startsWith('blob:')) {
      URL.revokeObjectURL(voicePlayer.src);
    }
    
    voicePlayer.src = url;
    voicePlayer.load();
    
    currentDecodedVoiceBuffer = newBuffer;
    currentDetectedSilences = [];
    
    showToast('✅ Audio recortado con éxito', 'success');
    buildGlobalPanel();
  } catch (err) {
    console.error('Error al recortar audio:', err);
    showToast('Error al procesar el recorte de audio', 'warning');
  }
}

function autoAlignScenesToVoice() {
  if (!currentDecodedVoiceBuffer) {
    showToast('Primero graba o carga una locución de voz', 'warning');
    return;
  }
  
  saveState('Alinear escenas con voz');
  
  const sampleRate = currentDecodedVoiceBuffer.sampleRate;
  const channelData = currentDecodedVoiceBuffer.getChannelData(0);
  const threshold = 0.015;
  const windowSize = Math.floor(sampleRate * 0.1); // 100ms
  
  let energyArray = [];
  for (let i = 0; i < channelData.length; i += windowSize) {
    let peak = 0;
    const end = Math.min(channelData.length, i + windowSize);
    for (let j = i; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > peak) peak = val;
    }
    energyArray.push(peak);
  }
  
  let segments = [];
  let inSpeech = false;
  let segmentStart = 0;
  
  for (let i = 0; i < energyArray.length; i++) {
    const isActive = energyArray[i] > threshold;
    if (isActive && !inSpeech) {
      inSpeech = true;
      segmentStart = i * 0.1;
    } else if (!isActive && inSpeech) {
      let pauseLength = 0;
      for (let j = i; j < Math.min(energyArray.length, i + 8); j++) {
        if (energyArray[j] > threshold) break;
        pauseLength++;
      }
      if (pauseLength >= 8 || i === energyArray.length - 1) {
        inSpeech = false;
        const segmentEnd = i * 0.1;
        segments.push({ start: segmentStart, end: segmentEnd, duration: segmentEnd - segmentStart });
        i += pauseLength - 1;
      }
    }
  }
  
  if (segments.length === 0) {
    const totalDuration = currentDecodedVoiceBuffer.duration;
    const sceneDuration = totalDuration / STATE.scenes.length;
    STATE.scenes.forEach(s => {
      s.duration = Math.max(0.5, Math.min(12, Math.round(sceneDuration * 10) / 10));
    });
    computeTotalDuration();
    buildScenesPanel();
    buildTimeline();
    showToast('Escenas alineadas equitativamente con la pista de voz', 'success');
    return;
  }
  
  STATE.scenes.forEach((scene, idx) => {
    if (idx < segments.length) {
      let dur = segments[idx].duration;
      dur = Math.round((dur + 0.5) * 10) / 10;
      scene.duration = Math.max(0.8, Math.min(12, dur));
    } else {
      scene.duration = 2.0;
    }
  });
  
  computeTotalDuration();
  buildScenesPanel();
  buildTimeline();
  showToast(`¡Alineadas ${Math.min(STATE.scenes.length, segments.length)} escenas con voz!`, 'success');
}

let isExportingVideo = false;

function exportFullVideo() {
  if (isExportingVideo) return;
  isExportingVideo = true;
  
  showToast('Preparando exportación de video completo (WebM)...', 'info');
  
  const wasPlaying = STATE.isPlaying;
  if (wasPlaying) togglePlay();
  
  const originalTime = videoPlayer ? videoPlayer.currentTime : 0;
  
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 540;
  exportCanvas.height = 960;
  const ctx = exportCanvas.getContext('2d');
  const scale = 540 / 274;
  
  const canvasStream = exportCanvas.captureStream(30);
  const audioCtx = STATE.audioCtx;
  let audioStream = null;
  
  if (audioCtx) {
    try {
      const dest = audioCtx.createMediaStreamDestination ? audioCtx.createMediaStreamDestination() : null;
      if (dest && STATE.audioNodes && STATE.audioNodes.analyser) {
        STATE.audioNodes.analyser.connect(dest);
        audioStream = dest.stream;
      }
    } catch(err) {
      console.warn('No se pudo capturar audio para exportación:', err);
    }
  }
  
  const outputStream = new MediaStream();
  canvasStream.getVideoTracks().forEach(track => outputStream.addTrack(track));
  if (audioStream) {
    audioStream.getAudioTracks().forEach(track => outputStream.addTrack(track));
  }
  
  let recorder;
  try {
    recorder = new MediaRecorder(outputStream, { mimeType: 'video/webm;codecs=vp8,opus' });
  } catch(e) {
    recorder = new MediaRecorder(outputStream);
  }
  
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comercial_${Date.now()}.webm`;
    link.click();
    
    isExportingVideo = false;
    if (videoPlayer) {
      videoPlayer.currentTime = originalTime;
      onVideoTimeUpdate();
    }
    showToast('¡Video exportado con éxito!', 'success');
  };
  
  recorder.start();
  
  let exportTime = 0;
  const duration = STATE.totalDuration;
  
  if (videoPlayer) {
    videoPlayer.muted = true;
    videoPlayer.currentTime = 0;
    if (voicePlayer) voicePlayer.currentTime = 0;
  }
  
  function renderNextFrame() {
    if (exportTime >= duration) {
      recorder.stop();
      return;
    }
    
    if (videoPlayer) {
      videoPlayer.currentTime = exportTime;
      if (voicePlayer && voicePlayer.src) {
        voicePlayer.currentTime = exportTime;
      }
    }
    
    const sceneIdx = getSceneIndexAtTime(exportTime);
    const scene = STATE.scenes[sceneIdx];
    
    if (scene) {
      if (scene.bgImage) {
        loadImage(scene.bgImage).then(img => {
          ctx.drawImage(img, 0, 0, 540, 960);
          drawOverlayElements();
        }).catch(() => {
          applyCssBackgroundToCanvas(ctx, scene.bgGradient || scene.bgColor, 540, 960);
          drawOverlayElements();
        });
      } else {
        applyCssBackgroundToCanvas(ctx, scene.bgGradient || scene.bgColor, 540, 960);
        drawOverlayElements();
      }
    } else {
      drawOverlayElements();
    }
    
    function drawOverlayElements() {
      if (videoPlayer && videoPlayer.readyState >= 2) {
        try {
          ctx.drawImage(videoPlayer, 0, 0, 540, 960);
        } catch(e) {}
      }
      
      let promiseChain = Promise.resolve();
      scene.elements.forEach(el => {
        const exit = el.exitAt !== null ? el.exitAt : scene.duration;
        const offset = exportTime - getSceneStartTime(scene.id);
        
        if (offset < (el.enterAt || 0) || offset >= exit) return;
        
        if (el.type === 'text') {
          promiseChain = promiseChain.then(() => {
            drawTextElementOnCanvas(ctx, el, scale);
          });
        } else if (el.type === 'image' || el.type === 'logo') {
          promiseChain = promiseChain.then(() => {
            return drawImageElementOnCanvas(ctx, el, scale);
          });
        } else if (el.type === 'shape') {
          promiseChain = promiseChain.then(() => {
            drawShapeElementOnCanvas(ctx, el, scale);
          });
        }
      });
      
      promiseChain.then(() => {
        exportTime += 1/30;
        const pct = Math.round((exportTime / duration) * 100);
        showToast(`Exportando video: ${pct}%`, 'info');
        setTimeout(renderNextFrame, 33);
      });
    }
  }
  
  renderNextFrame();
}

function getSceneIndexAtTime(time) {
  let elapsed = 0;
  for (let i = 0; i < STATE.scenes.length; i++) {
    elapsed += STATE.scenes[i].duration;
    if (time <= elapsed) return i;
  }
  return STATE.scenes.length - 1;
}

function selectVoiceLibraryItem(idx) {
  const item = VOICE_LIBRARY[idx];
  if (!item) return;
  
  saveState('Cargar toma de voz');
  voicePlayer.src = item.src;
  voicePlayer.load();
  if (STATE.audioReady) setupVoiceAudio();
  showToast(`Cargada toma: ${item.name}`, 'success');
  buildGlobalPanel();
}

function toggleVoiceRecordingFromScene(sceneId) {
  const isStarting = !isRecordingVoice;
  if (isStarting) {
    activeSceneRecordingId = sceneId;
    
    // Establecer la escena activa
    setActiveScene(sceneId);
    
    // Sincronizar el video al inicio de la escena
    const startTime = getSceneStartTime(sceneId);
    if (videoPlayer) {
      videoPlayer.currentTime = startTime;
      onVideoTimeUpdate();
    }
    
    // Iniciar grabación
    toggleVoiceRecording();
    
    // Reproducir para grabar en sincronía en tiempo real
    if (!STATE.isPlaying) {
      togglePlay();
    }
  } else {
    // Si ya está grabando, pausar y detener
    if (STATE.isPlaying) {
      togglePlay();
    }
    toggleVoiceRecording();
  }
}

window.addEventListener('beforeunload', () => {
  for (const key in BLOB_URLS) {
    if (BLOB_URLS[key] && BLOB_URLS[key].startsWith('blob:')) {
      URL.revokeObjectURL(BLOB_URLS[key]);
    }
  }
  if (videoPlayer && videoPlayer.src && videoPlayer.src.startsWith('blob:')) URL.revokeObjectURL(videoPlayer.src);
  if (voicePlayer && voicePlayer.src && voicePlayer.src.startsWith('blob:')) URL.revokeObjectURL(voicePlayer.src);
  if (referenceVideo && referenceVideo.src && referenceVideo.src.startsWith('blob:')) URL.revokeObjectURL(referenceVideo.src);
  
  STATE.scenes.forEach(s => {
    if (s.bgImage && s.bgImage.startsWith('blob:')) {
      URL.revokeObjectURL(s.bgImage);
    }
  });
});

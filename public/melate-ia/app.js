// Core JavaScript Logic for Predictor IA Melate (Client API + Web Worker version)

let API_BASE_URL = localStorage.getItem('melate_api_ip') || '';
if (API_BASE_URL && API_BASE_URL.endsWith('/')) {
    API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Sleek Toast notification system (Suggestion Applied)
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: min(320px, 90vw);
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: rgba(15, 23, 42, 0.95);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
    `;
    
    if (type === 'error') {
        toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        toast.style.background = 'rgba(20, 10, 10, 0.98)';
        toast.innerHTML = `<span style="color:#ef4444; font-size:16px;">❌</span> <div>${message}</div>`;
    } else if (type === 'warning') {
        toast.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        toast.style.background = 'rgba(20, 15, 10, 0.98)';
        toast.innerHTML = `<span style="color:#f59e0b; font-size:16px;">⚠️</span> <div>${message}</div>`;
    } else if (type === 'success') {
        toast.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        toast.style.background = 'rgba(10, 20, 15, 0.98)';
        toast.innerHTML = `<span style="color:#10b981; font-size:16px;">✅</span> <div>${message}</div>`;
    } else {
        toast.style.borderColor = 'rgba(212, 175, 55, 0.4)';
        toast.style.background = 'rgba(15, 15, 20, 0.98)';
        toast.innerHTML = `<span style="color:var(--gold); font-size:16px;">ℹ️</span> <div>${message}</div>`;
    }
    
    container.appendChild(toast);
    
    // Trigger layout reflow
    toast.offsetHeight;
    
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function configureApiUrl() {
    const current = localStorage.getItem('melate_api_ip') || 'http://localhost:3000';
    const newUrl = prompt("Configura la URL de tu Servidor Backend API (ej: http://192.168.1.75:3000 o ngrok):", current);
    if (newUrl !== null) {
        let trimmed = newUrl.trim();
        if (trimmed && trimmed.endsWith('/')) trimmed = trimmed.slice(0, -1);
        localStorage.setItem('melate_api_ip', trimmed);
        showToast("URL del servidor actualizada con éxito. Recargando...", "success");
        setTimeout(() => window.location.reload(), 1200);
    }
}

let activeGame = 'retro'; // 'retro' or 'melate'
let activeMelateSubGame = 'melate'; // 'melate', 'revancha', or 'revanchita'
let activeStatsTab = 'freq'; // 'freq', 'sums', 'parity'
let selectedNumbers = []; // User selected numbers on the volante
let suggestedPool = []; // Suggested pool of 6-12 numbers
let generatedTickets = []; // Simulated tickets from Backend
let serverStatus = null; // Caches status response
let statsCache = {}; // Caches statistics to avoid duplicate fetches

// Web Worker instance
let simWorker = null;

// On Window Load
window.addEventListener('DOMContentLoaded', () => {
    setupRangeSliders();
    
    // Initialize config panel collapse state
    const configCollapsed = localStorage.getItem('config_collapsed') === 'true';
    const body = document.getElementById('config-body-panel');
    const arrow = document.getElementById('config-toggle-arrow');
    if (configCollapsed && body && arrow) {
        body.classList.add('collapsed');
        arrow.innerText = '▲';
    }
    
    loadServerStatus();
    initializeDashboard();
    
    // Setup advanced filters listeners and history (Suggestions 1 & 2 applied)
    const excludeInput = document.getElementById('exclude-numbers');
    const includeInput = document.getElementById('include-numbers');
    if (excludeInput && includeInput) {
        excludeInput.addEventListener('input', validateFilters);
        includeInput.addEventListener('input', validateFilters);
    }
    renderFilterHistory();
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registrado con éxito:', reg.scope))
            .catch(err => console.warn('Fallo al registrar Service Worker:', err));
    }

    // Network status listeners
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();
});

function updateConnectionStatus() {
    const dot = document.querySelector('.status-dot');
    const label = document.querySelector('.status-text p span') || document.querySelector('.status-text p');
    if (navigator.onLine) {
        if (dot) dot.className = 'status-dot green';
        if (label) label.innerText = 'Base de Datos Activa';
    } else {
        if (dot) dot.className = 'status-dot red';
        if (label) label.innerText = 'Modo sin Conexión';
        showToast("Se ha perdido la conexión de red. La app cargará desde caché local.", "warning");
    }
}

function setupRangeSliders() {
    const poolSize = document.getElementById('pool-size');
    const poolSizeVal = document.getElementById('pool-size-val');
    if (poolSize && poolSizeVal) {
        poolSize.addEventListener('input', () => {
            poolSizeVal.innerText = poolSize.value;
        });
    }

    const ticketCount = document.getElementById('ticket-count');
    const ticketCountVal = document.getElementById('ticket-count-val');
    if (ticketCount && ticketCountVal) {
        ticketCount.addEventListener('input', () => {
            ticketCountVal.innerText = ticketCount.value;
        });
    }
}

// Fetch status of Express Server
// Fetch status of Express Server (with automatic static database fallback)
async function loadServerStatus() {
    const syncBtn = document.getElementById('btn-sync-database');
    try {
        const response = await fetch(API_BASE_URL + '/api/status');
        if (response.ok) {
            serverStatus = await response.json();
            console.log("Server connected. Status:", serverStatus);
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.style.opacity = '1';
                syncBtn.style.cursor = 'pointer';
                syncBtn.innerHTML = '🔄 Sincronizar';
            }
            updateDbStatusUI();
            updateQuickStats();
            return;
        } else {
            throw new Error("Server status is not OK");
        }
    } catch (e) {
        console.warn("Could not connect to backend server. Loading static database for client-side execution...", e.message);
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.style.opacity = '0.5';
            syncBtn.style.cursor = 'not-allowed';
            syncBtn.innerHTML = '📴 Autónomo';
            syncBtn.title = 'Modo Autónomo Local: Sincronización deshabilitada sin servidor backend activo';
        }
        
        // Attempt to load from static fallback file
        const db = await loadLocalDatabaseFallback();
        if (db) {
            serverStatus = {
                status: "offline-local",
                retroCount: db.retro ? db.retro.length : 0,
                melateCount: db.melate ? db.melate.length : 0,
                latestRetro: db.retro && db.retro.length > 0 ? db.retro[db.retro.length - 1] : null,
                latestMelate: db.melate && db.melate.length > 0 ? db.melate[db.melate.length - 1] : null
            };
            
            // Set status dot to orange for local fallback mode
            const statusDot = document.querySelector('.status-dot');
            if (statusDot) statusDot.className = 'status-dot orange';
            
            const label = document.querySelector('.status-text p span') || document.querySelector('.status-text p');
            if (label) label.innerHTML = `Base de Datos Local <span style="font-size:10px; opacity:0.7;">(Modo Autónomo)</span>`;
            
            updateDbStatusUI();
            updateQuickStats();
        } else {
            document.getElementById('latest-db-info').innerText = "Servidor Desconectado";
        }
    }
}

function updateDbStatusUI() {
    const latestInfo = document.getElementById('latest-db-info');
    if (!serverStatus) {
        latestInfo.innerText = "Servidor Desconectado";
        return;
    }
    
    if (activeGame === 'retro') {
        const count = serverStatus.retroCount;
        const latest = serverStatus.latestRetro || { concurso: '--', fecha: '--' };
        latestInfo.innerText = `Sorteos: ${count} | Último: #${latest.concurso} (${latest.fecha})`;
    } else {
        const count = serverStatus.melateCount;
        const latest = serverStatus.latestMelate || { concurso: '--', fecha: '--' };
        latestInfo.innerText = `Sorteos: ${count} | Sincronizado: #${latest.concurso}`;
    }
}

function initializeDashboard() {
    // Restore parameter preferences (Suggestion 3)
    const savedPoolSize = localStorage.getItem(`pref_pool_size_${activeGame}`);
    const savedExclude = localStorage.getItem(`pref_exclude_${activeGame}`);
    const savedInclude = localStorage.getItem(`pref_include_${activeGame}`);
    
    if (savedPoolSize) {
        document.getElementById('pool-size').value = savedPoolSize;
        document.getElementById('pool-size-val').innerText = savedPoolSize;
    }
    if (savedExclude !== null) {
        document.getElementById('exclude-numbers').value = savedExclude;
    }
    if (savedInclude !== null) {
        document.getElementById('include-numbers').value = savedInclude;
    }
    calculatePredictions(); // Automatically calculate on start
}

// Switch between Melate Retro and Melate Tradicional
function switchGame(game) {
    activeGame = game;
    
    // UI Button highlight
    document.getElementById('btn-retro').classList.toggle('active', game === 'retro');
    document.getElementById('btn-melate').classList.toggle('active', game === 'melate');
    
    // Update labels
    const gameSubtitle = document.getElementById('game-subtitle');
    const subGameSelector = document.getElementById('melate-subgame-selector');
    const activeBadge = document.getElementById('active-game-badge');
    
    if (game === 'retro') {
        gameSubtitle.innerText = "Estadísticas y Algoritmos para Melate Retro (1-39)";
        subGameSelector.style.display = 'none';
        if (activeBadge) activeBadge.innerText = "Melate Retro";
    } else {
        gameSubtitle.innerText = "Estadísticas y Algoritmos para Melate / Revancha / Revanchita (1-56)";
        subGameSelector.style.display = 'flex';
        if (activeBadge) {
            const prettySubName = activeMelateSubGame.charAt(0).toUpperCase() + activeMelateSubGame.slice(1);
            activeBadge.innerText = `Melate / ${prettySubName}`;
        }
    }
    
    // Load game-specific preferences (Suggestion 3)
    const savedPoolSize = localStorage.getItem(`pref_pool_size_${game}`) || 10;
    const savedExclude = localStorage.getItem(`pref_exclude_${game}`) || '';
    const savedInclude = localStorage.getItem(`pref_include_${game}`) || '';
    
    document.getElementById('pool-size').value = savedPoolSize;
    document.getElementById('pool-size-val').innerText = savedPoolSize;
    document.getElementById('exclude-numbers').value = savedExclude;
    document.getElementById('include-numbers').value = savedInclude;
    
    selectedNumbers = [];
    suggestedPool = [];
    generatedTickets = [];
    
    updateDbStatusUI();
    updateQuickStats();
    calculatePredictions(false);
}

function switchMelateSubGame(subgame) {
    activeMelateSubGame = subgame;
    
    // Toggle active classes
    document.getElementById('btn-subgame-melate').classList.toggle('active', subgame === 'melate');
    document.getElementById('btn-subgame-revancha').classList.toggle('active', subgame === 'revancha');
    document.getElementById('btn-subgame-revanchita').classList.toggle('active', subgame === 'revanchita');
    
    // Update badge
    const activeBadge = document.getElementById('active-game-badge');
    if (activeBadge) {
        const prettySubName = subgame.charAt(0).toUpperCase() + subgame.slice(1);
        activeBadge.innerText = `Melate / ${prettySubName}`;
    }
    
    updateQuickStats();
    calculatePredictions(false);
}

// Update Top Row Quick Stats
function updateQuickStats() {
    if (!serverStatus) return;
    
    const latest = activeGame === 'retro' ? serverStatus.latestRetro : serverStatus.latestMelate;
    if (!latest) return;
    
    document.getElementById('quick-last-draw').innerText = `#${latest.concurso}`;
    
    let numbersToShow = [];
    let extraNum = null;
    
    if (activeGame === 'retro') {
        numbersToShow = latest.numbers;
        extraNum = latest.extra;
        document.getElementById('quick-bolsa').innerText = "$19,800,000 MXN";
    } else {
        if (activeMelateSubGame === 'melate') {
            numbersToShow = latest.numbers;
            extraNum = latest.extra;
        } else if (activeMelateSubGame === 'revancha') {
            numbersToShow = latest.revancha || [];
        } else {
            numbersToShow = latest.revanchita || [];
        }
        document.getElementById('quick-bolsa').innerText = "$148,000,000 MXN";
    }
    
    // Format numbers with hyphens (suggestion applied)
    let html = '';
    if (numbersToShow && numbersToShow.length > 0) {
        const formatted = numbersToShow.map(n => n < 10 ? '0' + n : n);
        html = formatted.join(' - ');
    }
    if (extraNum !== null && extraNum !== undefined) {
        html += ` <span style="color: var(--gold); font-weight: 800; text-shadow: 0 0 5px var(--gold-glow);">- ${extraNum < 10 ? '0' + extraNum : extraNum}</span>`;
    }
    
    document.getElementById('quick-last-numbers').innerHTML = html;
}



// Request predictions from Backend API (with robust client-side fallback)
async function calculatePredictions(autoCloseSidebar = false) {
    const poolSize = parseInt(document.getElementById('pool-size').value);
    
    // Read exclude / include numbers (Advanced Filters)
    const excludeStr = document.getElementById('exclude-numbers').value.trim();
    const includeStr = document.getElementById('include-numbers').value.trim();
    
    // Save parameter preferences (Suggestion 3)
    localStorage.setItem(`pref_pool_size_${activeGame}`, poolSize);
    localStorage.setItem(`pref_exclude_${activeGame}`, excludeStr);
    localStorage.setItem(`pref_include_${activeGame}`, includeStr);
    
    const consensusContainer = document.getElementById('consensus-ticket-container');
    const methodsContainer = document.getElementById('predictive-methods-container');
    
    // Attempt to load from localStorage cache first (SWR pattern)
    const cacheKey = `last_prediction_${activeGame}_${activeMelateSubGame}_p_${poolSize}_ex_${excludeStr}_in_${includeStr}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    let loadedFromCache = false;
    if (cachedData) {
        const decoded = decodeCacheData(cachedData);
        if (decoded) {
            // Check expiration: 3 days = 3 * 24 * 60 * 60 * 1000 = 259,200,000 ms
            const isExpired = (Date.now() - decoded.timestamp) > 259200000;
            if (!isExpired) {
                const data = decoded.payload;
                renderConsensusTicket(data.consensusTicket, data.unionPool);
                renderPredictiveMethods(data.methods);
                showOfflineCacheIndicator(true);
                loadedFromCache = true;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }
    }
    
    if (!loadedFromCache) {
        // Show circular skeletons inside containers
        let consensusSkeleton = '<div class="skeleton-pool" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; width:100%;">';
        for (let i = 0; i < 6; i++) {
            consensusSkeleton += '<div class="skeleton-circle shimmer" style="width:45px; height:45px; border-radius:50%; background:rgba(255,255,255,0.05);"></div>';
        }
        consensusSkeleton += '</div>';
        consensusContainer.innerHTML = consensusSkeleton;
        
        let methodsSkeleton = '';
        for (let m = 0; m < 4; m++) {
            methodsSkeleton += `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 18px;">
                    <div class="shimmer" style="height: 14px; width: 200px; background: rgba(255,255,255,0.04); border-radius: 4px; margin-bottom: 12px;"></div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            `;
            for (let i = 0; i < poolSize; i++) {
                methodsSkeleton += '<div class="skeleton-circle shimmer" style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.03);"></div>';
            }
            methodsSkeleton += '</div></div>';
        }
        methodsContainer.innerHTML = methodsSkeleton;
    }
    
    try {
        const url = `/api/predictions?game=${activeGame}&subgame=${activeMelateSubGame}&poolSize=${poolSize}&exclude=${encodeURIComponent(excludeStr)}&include=${encodeURIComponent(includeStr)}`;
        const response = await fetch(API_BASE_URL + url);
        
        if (!response.ok) throw new Error("API call failed");
        
        const data = await response.json();
        
        // Save to LocalStorage for cache
        localStorage.setItem(cacheKey, encodeCacheData(data));
        
        showOfflineCacheIndicator(false);
        renderConsensusTicket(data.consensusTicket, data.unionPool);
        renderPredictiveMethods(data.methods);
        
    } catch (e) {
        console.warn("Backend API not available. Switching to client-side fallback...", e);
        
        const latestInfo = document.getElementById('latest-db-info');
        if (latestInfo) {
            latestInfo.innerHTML = `<span style="color:#f59e0b; font-weight:bold;">Motor IA Local Activo</span>`;
        }
        
        const db = await loadLocalDatabaseFallback();
        if (db) {
            try {
                const data = runPredictionsLocally(db, activeGame, activeMelateSubGame, null, poolSize, 0, excludeStr, includeStr);
                
                // Save to LocalStorage for cache
                localStorage.setItem(cacheKey, encodeCacheData(data));
                
                showOfflineCacheIndicator(false);
                renderConsensusTicket(data.consensusTicket, data.unionPool);
                renderPredictiveMethods(data.methods);
                
                const statusDot = document.querySelector('.status-dot');
                if (statusDot) statusDot.className = 'status-dot orange';
                
                console.log("Client-side fallback predictions calculated successfully.");
                fetchAndDrawStats();
                if (autoCloseSidebar) {
                    autoCloseMobileSidebar();
                }
                return;
            } catch (err) {
                console.error("Local calculation failed:", err);
            }
        }
        
        consensusContainer.innerHTML = `<p style="color:#ef4444;font-size:12px;">Error al calcular predicciones locales.</p>`;
        methodsContainer.innerHTML = `<p style="color:#ef4444;font-size:12px;">Servidor no disponible y base de datos local inaccesible.</p>`;
    }
    
    // Save filters to history (Suggestion 1)
    if (excludeStr) saveFilterToHistory('ex', excludeStr);
    if (includeStr) saveFilterToHistory('in', includeStr);
    renderFilterHistory();
    
    // Fetch and Draw Stats Charts
    fetchAndDrawStats();
    if (autoCloseSidebar) {
        autoCloseMobileSidebar();
    }
}



// Render pool in DOM with explanation triggers
// Render top 6 consensus ticket in DOM (Consensus Ticket UI)
let consensusTicketData = []; // Store current ticket for copy/download

function renderConsensusTicket(consensusTicket, unionPool) {
    consensusTicketData = consensusTicket;
    const container = document.getElementById('consensus-ticket-container');
    if (!container) return;
    container.innerHTML = '';
    
    consensusTicket.forEach(num => {
        const item = unionPool.find(x => x.num === num) || {
            num: num,
            score: 0.8,
            isFixed: false,
            algosProposed: ["Consenso General"]
        };
        
        const card = document.createElement('div');
        card.className = 'pool-item';
        card.style.position = 'relative';
        card.style.cursor = 'pointer';
        
        const probPct = Math.round(item.score * 100);
        
        let reason = "Análisis IA";
        if (item.isFixed) reason = "Fijo (Manual)";
        else if (item.overdue > 12) reason = "Rezago Crítico";
        else if (item.freqRecent > 5) reason = "En Racha";
        else if (item.markov > 20) reason = "Conexión Markov";
        
        // Pinned status icon
        let pinHtml = '';
        if (item.isFixed) {
            pinHtml = `<span style="position:absolute; top:-3px; left:-3px; background:var(--emerald); border-radius:50%; width:15px; height:15px; display:flex; align-items:center; justify-content:center; font-size:9px; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index:2;" title="Número Fijo Fichado">📌</span>`;
        }
        
        // Golden Consensus Ticket Style
        const ballStyles = `
            border: 2px solid var(--gold) !important;
            background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b) !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.5) !important;
        `;
        
        card.innerHTML = `
            ${pinHtml}
            <div class="pool-ball" style="${ballStyles}">${item.num < 10 ? '0' + item.num : item.num}</div>
            <div class="pool-info">
                <span class="prob" style="color: var(--gold); font-weight:700;">${probPct}% certeza</span>
                <span class="reason-tag" style="background: rgba(212,175,55,0.15); color: var(--gold); border-color: rgba(212,175,55,0.3);">${reason}</span>
            </div>
        `;
        
        // Compatibility highlights on hover
        card.addEventListener('mouseover', () => {
            if (item.compatibles) {
                const allCards = document.querySelectorAll('.pool-item');
                allCards.forEach(el => {
                    const numVal = parseInt(el.querySelector('.pool-ball').innerText);
                    if (item.compatibles.includes(numVal)) {
                        el.style.transform = "scale(1.12)";
                        el.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                        const ball = el.querySelector('.pool-ball');
                        ball.style.borderColor = "#00f3ff";
                        ball.style.boxShadow = "0 0 14px rgba(0, 243, 255, 0.7)";
                    }
                });
            }
        });
        
        card.addEventListener('mouseout', () => {
            const allCards = document.querySelectorAll('.pool-item');
            allCards.forEach(el => {
                el.style.transform = "";
                const ball = el.querySelector('.pool-ball');
                ball.style.borderColor = "";
                ball.style.boxShadow = "";
            });
        });
        
        card.addEventListener('click', () => showExplanation(item));
        container.appendChild(card);
    });
}

// Render individual predictive methods pools
let currentMethodsData = {}; // Store current methods lists for download

function renderPredictiveMethods(methods) {
    currentMethodsData = methods;
    const container = document.getElementById('predictive-methods-container');
    if (!container) return;
    container.innerHTML = '';
    
    const algos = [
        { key: 'fusion', title: '🎯 Fusión Monte Carlo (Super Fusión Adaptativa)', desc: 'Optimización predictiva basada en backtesting multimodelo.' },
        { key: 'markov', title: '⛓️ Cadenas de Markov (Predicción Secuencial)', desc: 'Matriz de probabilidad de transición condicional del último sorteo.' },
        { key: 'entropy', title: '🌀 Regresión de Entropía (Rezago Crítico)', desc: 'Favorece números con mayor retraso temporal o rezago histórico.' },
        { key: 'frequency', title: '📊 Frecuencia Ponderada (Histórico y Reciente)', desc: 'Peso dinámico basado en apariciones calientes globales e inmediatas.' }
    ];
    
    algos.forEach(algo => {
        const pool = methods[algo.key] || [];
        
        const cardWrapper = document.createElement('div');
        cardWrapper.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);";
        
        const header = document.createElement('div');
        header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:5px;";
        header.innerHTML = `
            <div>
                <h4 style="margin:0; font-size:14px; font-weight:700; color:var(--text-primary);">${algo.title}</h4>
                <p style="margin:2px 0 0 0; font-size:11px; color:var(--text-secondary);">${algo.desc}</p>
            </div>
            <span class="badge" style="font-size:10px; padding:3px 8px; border-radius:4px; font-weight:bold; background:rgba(255,255,255,0.04); color:var(--text-secondary);">${pool.length} Números</span>
        `;
        cardWrapper.appendChild(header);
        
        const poolGrid = document.createElement('div');
        poolGrid.className = 'pool-grid';
        poolGrid.style.cssText = "display:flex; gap:12px; flex-wrap:wrap; justify-content:flex-start; margin-top:10px;";
        
        pool.forEach(item => {
            const ballItem = document.createElement('div');
            ballItem.className = 'pool-item';
            ballItem.style.position = 'relative';
            ballItem.style.cursor = 'pointer';
            
            const probPct = Math.round(item.score * 100);
            
            let reason = "Análisis IA";
            if (item.isFixed) reason = "Fijo (Manual)";
            else if (item.overdue > 12) reason = "Rezago Crítico";
            else if (item.freqRecent > 5) reason = "En Racha";
            else if (item.markov > 20) reason = "Conexión Markov";
            
            let pinHtml = '';
            if (item.isFixed) {
                pinHtml = `<span style="position:absolute; top:-3px; left:-3px; background:var(--emerald); border-radius:50%; width:15px; height:15px; display:flex; align-items:center; justify-content:center; font-size:9px; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index:2;">📌</span>`;
            }
            
            // Standard dynamic styles based on tags
            let ballStyles = "";
            const votesCount = item.algosProposed ? item.algosProposed.length : 1;
            
            if (item.isFixed) {
                ballStyles = "border: 2.5px solid var(--emerald) !important; box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);";
            } else if (votesCount === 4) {
                ballStyles = "border: 2.5px double var(--gold) !important; box-shadow: 0 0 10px rgba(212, 175, 55, 0.4); outline: 1px solid rgba(212,175,55,0.2);";
            } else if (votesCount >= 2) {
                ballStyles = "border: 2px solid var(--gold) !important; box-shadow: 0 0 6px rgba(212, 175, 55, 0.2);";
            }
            
            ballItem.innerHTML = `
                ${pinHtml}
                <div class="pool-ball" style="${ballStyles}">${item.num < 10 ? '0' + item.num : item.num}</div>
                <div class="pool-info">
                    <span class="prob" style="${item.isFixed ? 'color: var(--emerald); font-weight:700;' : ''}">${probPct}% certeza</span>
                    <span class="reason-tag" style="${item.isFixed ? 'background: rgba(16,185,129,0.15); color: var(--emerald); border-color: rgba(16,185,129,0.3);' : ''}">${reason}</span>
                </div>
            `;
            
            // Compatibility hover highlighting
            ballItem.addEventListener('mouseover', () => {
                if (item.compatibles) {
                    const allCards = document.querySelectorAll('.pool-item');
                    allCards.forEach(el => {
                        const numVal = parseInt(el.querySelector('.pool-ball').innerText);
                        if (item.compatibles.includes(numVal)) {
                            el.style.transform = "scale(1.12)";
                            el.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                            const ball = el.querySelector('.pool-ball');
                            ball.style.borderColor = "#00f3ff";
                            ball.style.boxShadow = "0 0 14px rgba(0, 243, 255, 0.7)";
                        }
                    });
                }
            });
            
            ballItem.addEventListener('mouseout', () => {
                const allCards = document.querySelectorAll('.pool-item');
                allCards.forEach(el => {
                    el.style.transform = "";
                    const ball = el.querySelector('.pool-ball');
                    ball.style.borderColor = "";
                    ball.style.boxShadow = "";
                });
            });
            
            ballItem.addEventListener('click', () => showExplanation(item));
            poolGrid.appendChild(ballItem);
        });
        
        cardWrapper.appendChild(poolGrid);
        container.appendChild(cardWrapper);
    });
}

// Explanation modal generator
function showExplanation(details) {
    const modal = document.getElementById('explanation-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-body-content');
    
    title.innerText = `Análisis Científico del Número ${details.num < 10 ? '0' + details.num : details.num}`;
    
    const probPct = Math.round(details.score * 100);
    const avgDraws = activeGame === 'retro' ? 6.5 : 9.3;
    const timeFrame = activeGame === 'retro' ? "martes y sábados" : "miércoles, viernes y domingos";
    
    let algosHTML = "";
    if (details.algosProposed && details.algosProposed.length > 0) {
        algosHTML = `
            <div style="margin: 15px 0; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(212,175,55,0.15); border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: var(--gold); letter-spacing: 0.5px; font-weight: bold;">Sugerido por los Modelos:</p>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    ${details.algosProposed.map(a => `<span style="background: rgba(212, 175, 55, 0.1); color: var(--gold); border: 1px solid rgba(212, 175, 55, 0.25); font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 500;">${a}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <p><strong>Probabilidad de Salida:</strong> <span style="color: var(--emerald); font-weight:700;">${probPct}%</span></p>
        ${algosHTML}
        <p>El motor lógico-matemático ha ponderado las variables físicas de este número bajo el siguiente esquema:</p>
        
        <h4>1. Historial de Rezago (Ley de Grandes Números)</h4>
        <p>Este número ha estado ausente durante <strong>${details.overdue} sorteos</strong> consecutivos. Dado que la frecuencia teórica esperada es de aparecer cada ${avgDraws} sorteos, la <strong>Regresión a la Media</strong> indica que este número está entrando en una fase de rezago acumulado del ${(details.overdue / (avgDraws*2) * 100).toFixed(0)}%, lo que eleva exponencialmente su probabilidad de ser extraído próximamente para equilibrar la distribución de entropía.</p>
        
        <h4>2. Cadena de Transición de Markov</h4>
        <p>Basándonos en las combinaciones del sorteo anterior, este número registra una fuerza de acoplamiento de <strong>${details.markov} transiciones históricas</strong>. Esto significa que cuando aparecen los números del sorteo pasado, el número ${details.num} suele ser extraído con un alto coeficiente de co-ocurrencia.</p>
        
        <h4>3. Tendencia de Racha (Frecuencia Temporal)</h4>
        <p>Ha salido <strong>${details.freqRecent} veces</strong> en los últimos 30 sorteos. Su inercia en la urna muestra un comportamiento ${details.freqRecent > 4 ? "caliente y en racha activa" : "dentro del promedio normal de distribución estocástica"}.</p>
        
        <p style="margin-top:15px; font-style:italic; color:var(--text-secondary);">Recomendación: Utiliza este número como pilar para conformar tus combinaciones múltiples en el próximo sorteo de los días ${timeFrame}.</p>
    `;
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('explanation-modal').classList.remove('show');
}

function copyTicket(ticketStr) {
    navigator.clipboard.writeText(ticketStr.replace(/,/g, ' - ')).then(() => {
        alert("Boleto copiado al portapapeles: " + ticketStr.replace(/,/g, ' - '));
    });
}



// Fetch stats data and draw charts
// Fetch stats data and draw charts (with client-side fallback)
async function fetchAndDrawStats() {
    const canvas = document.getElementById('stats-canvas');
    if (!canvas) return; // Exit early if stats card is removed (user request)
    
    const cacheKey = `${activeGame}-${activeMelateSubGame}`;
    let data;
    
    if (statsCache[cacheKey]) {
        data = statsCache[cacheKey];
    } else {
        try {
            const response = await fetch(API_BASE_URL + `/api/stats?game=${activeGame}&subgame=${activeMelateSubGame}`);
            if (!response.ok) throw new Error("Failed to load statistics");
            data = await response.json();
            statsCache[cacheKey] = data; // Cache response
        } catch (e) {
            console.warn("Error loading stats from API, trying client-side fallback:", e);
            const db = await loadLocalDatabaseFallback();
            if (db) {
                data = calculateStatsLocally(db, activeGame, activeMelateSubGame);
                if (data) {
                    statsCache[cacheKey] = data;
                }
            }
            if (!data) {
                console.error("Could not calculate stats locally.");
                return;
            }
        }
    }
    
    drawChartsWithData(data);
}

function switchStatsTab(tab) {
    activeStatsTab = tab;
    
    const tabs = document.querySelectorAll('.stats-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
        if (t.innerText.toLowerCase().includes('frecuencia') && tab === 'freq') t.classList.add('active');
        if (t.innerText.toLowerCase().includes('suma') && tab === 'sums') t.classList.add('active');
        if (t.innerText.toLowerCase().includes('par/impar') && tab === 'parity') t.classList.add('active');
    });
    
    fetchAndDrawStats();
}

function drawChartsWithData(data) {
    const canvas = document.getElementById('stats-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxNum = activeGame === 'retro' ? 39 : 56;
    
    if (activeStatsTab === 'freq') {
        const freq = data.freq; // length maxNum
        const maxFreq = Math.max(...freq) || 1;
        
        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;
        const chartWidth = canvas.width - paddingLeft - paddingRight;
        const chartHeight = canvas.height - paddingTop - paddingBottom;
        const barWidth = chartWidth / maxNum;
        
        // Draw Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, paddingTop);
        ctx.lineTo(paddingLeft, canvas.height - paddingBottom);
        ctx.lineTo(canvas.width - paddingRight, canvas.height - paddingBottom);
        ctx.stroke();
        
        // Draw Bars
        for (let i = 1; i <= maxNum; i++) {
            const freqVal = freq[i - 1] || 0;
            const h = (freqVal / maxFreq) * chartHeight;
            const x = paddingLeft + (i - 1) * barWidth + 2;
            const y = canvas.height - paddingBottom - h;
            
            const isSuggested = suggestedPool.includes(i);
            ctx.fillStyle = isSuggested ? '#d4af37' : 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(x, y, barWidth - 3, h);
            
            if (i % (maxNum > 40 ? 5 : 2) === 0 || i === 1) {
                ctx.fillStyle = '#9aa0a6';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(i, x + barWidth / 2, canvas.height - 15);
            }
        }
        
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(maxFreq, paddingLeft - 8, paddingTop + 10);
        ctx.fillText(Math.round(maxFreq/2), paddingLeft - 8, paddingTop + chartHeight / 2 + 5);
        ctx.fillText(0, paddingLeft - 8, canvas.height - paddingBottom);
        
    } else if (activeStatsTab === 'sums') {
        const sums = data.sums;
        const logicalMin = activeGame === 'retro' ? 70 : 100;
        const logicalMax = activeGame === 'retro' ? 170 : 250;
        
        const bucketCount = 15;
        const bucketSize = (logicalMax - logicalMin) / bucketCount;
        let buckets = Array(bucketCount).fill(0);
        
        sums.forEach(s => {
            if (s >= logicalMin && s < logicalMax) {
                const idx = Math.floor((s - logicalMin) / bucketSize);
                if (idx >= 0 && idx < bucketCount) buckets[idx]++;
            }
        });
        
        const maxBucketVal = Math.max(...buckets) || 1;
        const paddingLeft = 50;
        const paddingRight = 20;
        const paddingTop = 25;
        const paddingBottom = 35;
        const chartWidth = canvas.width - paddingLeft - paddingRight;
        const chartHeight = canvas.height - paddingTop - paddingBottom;
        const barWidth = chartWidth / bucketCount;
        
        for (let i = 0; i < bucketCount; i++) {
            const h = (buckets[i] / maxBucketVal) * chartHeight;
            const x = paddingLeft + i * barWidth + 4;
            const y = canvas.height - paddingBottom - h;
            
            ctx.fillStyle = 'rgba(0, 255, 170, 0.4)';
            ctx.fillRect(x, y, barWidth - 8, h);
            
            const rangeStart = Math.round(logicalMin + i * bucketSize);
            if (i % 2 === 0) {
                ctx.fillStyle = '#9aa0a6';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(rangeStart, x + barWidth / 2, canvas.height - 18);
            }
        }
        
        // Draw Normal Curve
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let xCoord = paddingLeft; xCoord < canvas.width - paddingRight; xCoord++) {
            const pct = (xCoord - paddingLeft) / chartWidth;
            const exponent = -Math.pow(pct - 0.5, 2) / 0.05;
            const yVal = canvas.height - paddingBottom - Math.exp(exponent) * chartHeight * 0.95;
            if (xCoord === paddingLeft) ctx.moveTo(xCoord, yVal);
            else ctx.lineTo(xCoord, yVal);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(maxBucketVal, paddingLeft - 8, paddingTop + 10);
        ctx.fillText(0, paddingLeft - 8, canvas.height - paddingBottom);
        
    } else if (activeStatsTab === 'parity') {
        const evens = data.evens;
        const odds = data.odds;
        const total = odds + evens || 1;
        const oddPct = (odds / total) * 100;
        const evenPct = (evens / total) * 100;
        
        const barY = canvas.height / 2 - 15;
        const barHeight = 30;
        const barWidth = canvas.width - 200;
        const barX = 100;
        
        const oddWidth = (odds / total) * barWidth;
        ctx.fillStyle = '#9c27b0';
        ctx.fillRect(barX, barY, oddWidth, barHeight);
        
        ctx.fillStyle = '#00ffaa';
        ctx.fillRect(barX + oddWidth, barY, barWidth - oddWidth, barHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Impares: ${oddPct.toFixed(1)}%`, barX, barY - 15);
        
        ctx.textAlign = 'right';
        ctx.fillText(`Pares: ${evenPct.toFixed(1)}%`, barX + barWidth, barY - 15);
        
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("La relación ideal de combinaciones en la Lotería es 3:3 (3 Pares y 3 Impares), representando el 48% de sorteos históricos.", canvas.width / 2, canvas.height - 30);
    }
}

let localDatabase = null;

async function loadLocalDatabaseFallback() {
    if (localDatabase) return localDatabase;
    try {
        const response = await fetch('./lottery_database.json');
        if (response.ok) {
            localDatabase = await response.json();
            console.log("Fallback database loaded successfully from static file. Draws count:", {
                retro: localDatabase.retro ? localDatabase.retro.length : 0,
                melate: localDatabase.melate ? localDatabase.melate.length : 0
            });
            return localDatabase;
        }
    } catch (e) {
        console.error("Could not load local database fallback:", e);
    }
    return null;
}

function runPredictionsLocally(db, game, sub, algo, pSize, tCount, excludeStr, includeStr) {
    const draws = game === 'retro' ? db.retro : db.melate;
    const maxNum = game === 'retro' ? 39 : 56;
    
    if (!draws || draws.length === 0) {
        throw new Error("No draws data found");
    }
    
    // Parse exclude and include parameters (Advanced Filters)
    const excludeNums = (excludeStr || '').split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x) && x >= 1 && x <= maxNum);
    const includeNums = (includeStr || '').split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x) && x >= 1 && x <= maxNum).slice(0, 5); // Max 5 fixed
    
    // Exclude takes precedence
    const finalInclude = includeNums.filter(n => !excludeNums.includes(n));
    
    let scores = Array(maxNum + 1).fill(0);
    
    // 1. Frequencies
    let freqGlobal = Array(maxNum + 1).fill(0);
    let freqRecent = Array(maxNum + 1).fill(0);
    const recentThreshold = Math.min(30, draws.length);
    
    draws.forEach((draw, idx) => {
        let nums = [];
        if (game === 'retro') nums = draw.numbers;
        else {
            if (sub === 'melate') nums = draw.numbers;
            else if (sub === 'revancha') nums = draw.revancha || [];
            else nums = draw.revanchita || [];
        }
        
        if (nums) {
            nums.forEach(n => {
                if (n >= 1 && n <= maxNum) {
                    freqGlobal[n]++;
                    if (draws.length - idx <= recentThreshold) {
                        freqRecent[n]++;
                    }
                }
            });
        }
    });
    
    const maxGlobalFreq = Math.max(...freqGlobal) || 1;
    const maxRecentFreq = Math.max(...freqRecent) || 1;
    
    // 2. Overdue / Entropy
    let lastSeen = Array(maxNum + 1).fill(0);
    for (let i = 1; i <= maxNum; i++) {
        let seenIdx = -1;
        for (let idx = draws.length - 1; idx >= 0; idx--) {
            let nums = [];
            if (game === 'retro') nums = draws[idx].numbers;
            else {
                if (sub === 'melate') nums = draws[idx].numbers;
                else if (sub === 'revancha') nums = draws[idx].revancha || [];
                else nums = draws[idx].revanchita || [];
            }
            if (nums && nums.includes(i)) {
                seenIdx = idx;
                break;
            }
        }
        if (seenIdx === -1) {
            lastSeen[i] = draws.length;
        } else {
            lastSeen[i] = draws.length - 1 - seenIdx;
        }
    }
    const maxOverdue = Math.max(...lastSeen) || 1;
    
    // 3. Markov transition matrix
    let transitions = Array(maxNum + 1).fill(0).map(() => Array(maxNum + 1).fill(0));
    for (let i = 0; i < draws.length - 1; i++) {
        let currentDraw = [];
        let nextDraw = [];
        if (game === 'retro') {
            currentDraw = draws[i].numbers;
            nextDraw = draws[i+1].numbers;
        } else {
            if (sub === 'melate') {
                currentDraw = draws[i].numbers;
                nextDraw = draws[i+1].numbers;
            } else if (sub === 'revancha') {
                currentDraw = draws[i].revancha || [];
                nextDraw = draws[i+1].revancha || [];
            } else {
                currentDraw = draws[i].revanchita || [];
                nextDraw = draws[i+1].revanchita || [];
            }
        }
        
        if (currentDraw && nextDraw) {
            currentDraw.forEach(c => {
                nextDraw.forEach(n => {
                    if (c >= 1 && c <= maxNum && n >= 1 && n <= maxNum) {
                        transitions[c][n]++;
                    }
                });
            });
        }
    }
    
    const lastDraw = draws[draws.length - 1];
    let lastNums = [];
    if (game === 'retro') lastNums = lastDraw.numbers;
    else {
        if (sub === 'melate') lastNums = lastDraw.numbers;
        else if (sub === 'revancha') lastNums = lastDraw.revancha || [];
        else lastNums = lastDraw.revanchita || [];
    }
    
    let markovWeights = Array(maxNum + 1).fill(0);
    if (lastNums) {
        lastNums.forEach(l => {
            if (l >= 1 && l <= maxNum) {
                for (let target = 1; target <= maxNum; target++) {
                    markovWeights[target] += transitions[l][target];
                }
            }
        });
    }
    const maxMarkov = Math.max(...markovWeights) || 1;
    
    // --- Backtesting Adaptativo para Ponderación Dinámica ---
    let hitCountFreq = 1;
    let hitCountEntropy = 1;
    let hitCountMarkov = 1;
    
    const evaluationSlice = draws.slice(-50);
    evaluationSlice.forEach(draw => {
        let nums = [];
        if (game === 'retro') nums = draw.numbers;
        else {
            if (sub === 'melate') nums = draw.numbers;
            else if (sub === 'revancha') nums = draw.revancha || [];
            else nums = draw.revanchita || [];
        }
        if (nums) {
            nums.forEach(n => {
                if (n >= 1 && n <= maxNum) {
                    if (freqGlobal[n] > maxGlobalFreq * 0.7) hitCountFreq++;
                    if (lastSeen[n] > maxOverdue * 0.7) hitCountEntropy++;
                    if (markovWeights[n] > maxMarkov * 0.7) hitCountMarkov++;
                }
            });
        }
    });
    
    const totalHitScores = hitCountFreq + hitCountEntropy + hitCountMarkov;
    const wFreq = hitCountFreq / totalHitScores;
    const wEntropy = hitCountEntropy / totalHitScores;
    const wMarkov = hitCountMarkov / totalHitScores;
    
    // Calculate final score
    for (let i = 1; i <= maxNum; i++) {
        const freqWeight = (freqGlobal[i] / maxGlobalFreq) * 0.4 + (freqRecent[i] / maxRecentFreq) * 0.6;
        const overdueWeight = lastSeen[i] / maxOverdue;
        const markovWeight = markovWeights[i] / maxMarkov;
        
        if (algo === 'frequency') {
            scores[i] = freqWeight;
        } else if (algo === 'entropy') {
            scores[i] = overdueWeight;
        } else if (algo === 'markov') {
            scores[i] = markovWeight;
        } else if (algo === 'all_algorithms') {
            scores[i] = Math.max(freqWeight, overdueWeight, markovWeight, (freqWeight * wFreq) + (overdueWeight * wEntropy) + (markovWeight * wMarkov));
        } else { // 'fusion'
            scores[i] = (freqWeight * wFreq) + (overdueWeight * wEntropy) + (markovWeight * wMarkov);
        }
    }
    
    // Force scores of excluded numbers to 0
    excludeNums.forEach(n => {
        scores[n] = 0;
    });
    
    // Co-occurrence Matrix (Pair compatibility)
    let coOccurrence = Array(maxNum + 1).fill(0).map(() => Array(maxNum + 1).fill(0));
    draws.forEach(draw => {
        let nums = [];
        if (game === 'retro') nums = draw.numbers;
        else {
            if (sub === 'melate') nums = draw.numbers;
            else if (sub === 'revancha') nums = draw.revancha || [];
            else nums = draw.revanchita || [];
        }
        if (nums) {
            for (let i = 0; i < nums.length; i++) {
                for (let j = i + 1; j < nums.length; j++) {
                    const u = nums[i];
                    const v = nums[j];
                    if (u >= 1 && u <= maxNum && v >= 1 && v <= maxNum) {
                        coOccurrence[u][v]++;
                        coOccurrence[v][u]++;
                    }
                }
            }
        }
    });
    
    // Helper to find top 3 compatible partner numbers (Suggestion 3)
    const getCompatibles = (n) => {
        let partners = [];
        for (let j = 1; j <= maxNum; j++) {
            if (n !== j) {
                partners.push({ num: j, count: coOccurrence[n][j] });
            }
        }
        partners.sort((a, b) => b.count - a.count);
        return partners.slice(0, 3).map(x => x.num);
    };

    // Compile pool details for all algorithms
    let allDetails = [];
    for (let i = 1; i <= maxNum; i++) {
        const freqWeight = (freqGlobal[i] / maxGlobalFreq) * 0.4 + (freqRecent[i] / maxRecentFreq) * 0.6;
        const overdueWeight = lastSeen[i] / maxOverdue;
        const markovWeight = markovWeights[i] / maxMarkov;
        const fusionWeight = (freqWeight * wFreq) + (overdueWeight * wEntropy) + (markovWeight * wMarkov);
        
        allDetails.push({
            num: i,
            freqWeight: isNaN(freqWeight) ? 0 : freqWeight,
            overdueWeight: isNaN(overdueWeight) ? 0 : overdueWeight,
            markovWeight: isNaN(markovWeight) ? 0 : markovWeight,
            fusionWeight: isNaN(fusionWeight) ? 0 : fusionWeight,
            freqGlobal: freqGlobal[i] || 0,
            freqRecent: freqRecent[i] || 0,
            overdue: lastSeen[i] || 0,
            markov: markovWeights[i] || 0,
            compatibles: getCompatibles(i)
        });
    }

    // Filter out excluded numbers
    let eligibleDetails = allDetails.filter(x => !excludeNums.includes(x.num));

    // Compile the 4 predictive pools of size pSize
    let poolFreq = [...eligibleDetails]
        .sort((a, b) => b.freqWeight - a.freqWeight)
        .slice(0, pSize)
        .map(x => ({
            num: x.num,
            score: x.freqWeight,
            freqGlobal: x.freqGlobal,
            freqRecent: x.freqRecent,
            overdue: x.overdue,
            markov: x.markov,
            compatibles: x.compatibles,
            algosProposed: ["Frecuencia Ponderada"]
        }));

    let poolEntropy = [...eligibleDetails]
        .sort((a, b) => b.overdueWeight - a.overdueWeight)
        .slice(0, pSize)
        .map(x => ({
            num: x.num,
            score: x.overdueWeight,
            freqGlobal: x.freqGlobal,
            freqRecent: x.freqRecent,
            overdue: x.overdue,
            markov: x.markov,
            compatibles: x.compatibles,
            algosProposed: ["Regresión de Entropía"]
        }));

    let poolMarkov = [...eligibleDetails]
        .sort((a, b) => b.markovWeight - a.markovWeight)
        .slice(0, pSize)
        .map(x => ({
            num: x.num,
            score: x.markovWeight,
            freqGlobal: x.freqGlobal,
            freqRecent: x.freqRecent,
            overdue: x.overdue,
            markov: x.markov,
            compatibles: x.compatibles,
            algosProposed: ["Cadenas de Markov"]
        }));

    let poolFusion = [...eligibleDetails]
        .sort((a, b) => b.fusionWeight - a.fusionWeight)
        .slice(0, pSize)
        .map(x => ({
            num: x.num,
            score: x.fusionWeight,
            freqGlobal: x.freqGlobal,
            freqRecent: x.freqRecent,
            overdue: x.overdue,
            markov: x.markov,
            compatibles: x.compatibles,
            algosProposed: ["Fusión Monte Carlo"]
        }));

    // Force inclusion of finalInclude (fijos) into all pools visually
    const forceInclusion = (pool, getWeight, algoName) => {
        finalInclude.forEach(n => {
            if (!pool.some(x => x.num === n)) {
                const src = allDetails.find(x => x.num === n);
                if (src) {
                    pool.push({
                        num: n,
                        score: getWeight(src),
                        freqGlobal: src.freqGlobal,
                        freqRecent: src.freqRecent,
                        overdue: src.overdue,
                        markov: src.markov,
                        compatibles: src.compatibles,
                        algosProposed: [algoName],
                        isFixed: true
                    });
                }
            }
        });
        pool.forEach(x => {
            if (finalInclude.includes(x.num)) {
                x.isFixed = true;
                x.score = 1.0;
            }
        });
        pool.sort((a, b) => a.num - b.num);
    };

    forceInclusion(poolFreq, x => x.freqWeight, "Frecuencia Ponderada");
    forceInclusion(poolEntropy, x => x.overdueWeight, "Regresión de Entropía");
    forceInclusion(poolMarkov, x => x.markovWeight, "Cadenas de Markov");
    forceInclusion(poolFusion, x => x.fusionWeight, "Fusión Monte Carlo");

    // Build Union Pool for Consensus calculations
    const freqNums = poolFreq.map(x => x.num);
    const entropyNums = poolEntropy.map(x => x.num);
    const markovNums = poolMarkov.map(x => x.num);
    const fusionNums = poolFusion.map(x => x.num);
    const unionNums = new Set([...freqNums, ...entropyNums, ...markovNums, ...fusionNums]);

    let unionPool = [];
    unionNums.forEach(n => {
        const src = allDetails.find(x => x.num === n);
        if (src) {
            const algosProposed = [];
            if (freqNums.includes(n)) algosProposed.push("Frecuencia Ponderada");
            if (entropyNums.includes(n)) algosProposed.push("Regresión de Entropía");
            if (markovNums.includes(n)) algosProposed.push("Cadenas de Markov");
            if (fusionNums.includes(n)) algosProposed.push("Fusión Monte Carlo");

            const bonus = 1 + (algosProposed.length - 1) * 0.15;
            const finalScore = Math.min(1.0, src.fusionWeight * bonus);

            unionPool.push({
                num: n,
                score: finalScore,
                algosProposed: algosProposed,
                compatibles: src.compatibles,
                freqGlobal: src.freqGlobal,
                freqRecent: src.freqRecent,
                overdue: src.overdue,
                markov: src.markov,
                isFixed: finalInclude.includes(n)
            });
        }
    });

    // Compile top 6 numbers for the Consensus Ticket
    let consensusTicket = [...finalInclude];
    const needed = 6 - consensusTicket.length;
    if (needed > 0) {
        const candidates = unionPool
            .filter(x => !finalInclude.includes(x.num))
            .sort((a, b) => b.score - a.score);

        for (let i = 0; i < needed; i++) {
            if (candidates[i]) {
                consensusTicket.push(candidates[i].num);
            }
        }
    }
    
    // Fill up to 6 if still lacking (edge case)
    if (consensusTicket.length < 6) {
        for (let i = 1; i <= maxNum; i++) {
            if (consensusTicket.length >= 6) break;
            if (!excludeNums.includes(i) && !consensusTicket.includes(i)) {
                consensusTicket.push(i);
            }
        }
    }
    consensusTicket.sort((a, b) => a - b);

    return {
        consensusTicket: consensusTicket,
        unionPool: unionPool,
        methods: {
            fusion: poolFusion,
            markov: poolMarkov,
            entropy: poolEntropy,
            frequency: poolFreq
        }
    };
}


// --- COLLAPSIBLE CONFIGURATION PANEL CONTROLS ---
function toggleConfigPanel() {
    const body = document.getElementById('config-body-panel');
    const arrow = document.getElementById('config-toggle-arrow');
    if (!body || !arrow) return;
    
    const isCollapsed = body.classList.contains('collapsed');
    
    if (isCollapsed) {
        body.classList.remove('collapsed');
        // Reset custom max-height for CSS animation
        body.style.maxHeight = '800px';
        arrow.style.transform = 'rotate(0deg)';
        localStorage.setItem('config_collapsed', 'false');
    } else {
        body.style.maxHeight = '0';
        body.classList.add('collapsed');
        arrow.style.transform = 'rotate(180deg)';
        localStorage.setItem('config_collapsed', 'true');
    }
}

// Deprecated sidebar functions (kept as empty stubs for backwards compatibility and SW cached clients)
function initSidebar() {}
function toggleSidebarPin() {}
function expandSidebar() {}
function toggleOverlay() {}
function autoCloseMobileSidebar() {}

// Scrape Loteria Nacional for latest results from browser (backend proxy)
async function triggerManualUpdate() {
    const btn = document.getElementById('btn-sync-database');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">🔄</span> Sincronizando...`;
    
    try {
        if (!serverStatus || serverStatus.status === 'offline-local') {
            throw new Error("offline-mode");
        }
        
        const response = await fetch(API_BASE_URL + '/api/trigger-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Error de respuesta del servidor");
        }
        
        showToast("Actualización Exitosa: " + data.message, "success");
        
        // Reload dashboard and charts with latest data
        await loadServerStatus();
        calculatePredictions();
        
    } catch (e) {
        console.error("Manual update failed:", e);
        if (e.message === "offline-mode") {
            showToast("Modo Autónomo Activo: Conecte su backend local para sincronizar.", "warning");
        } else {
            showToast("Error al sincronizar: " + e.message, "error");
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// Copy top consensus ticket formatted as text to clipboard (suggestion 2 applied)
function copyConsensusTicketToClipboard() {
    if (!consensusTicketData || consensusTicketData.length === 0) {
        showToast("No hay combinación consensuada para copiar.", "error");
        return;
    }
    
    let text = `Predictor IA Melate - Combinación Consensuada Máxima\n`;
    text += `Juego: ${activeGame === 'retro' ? 'Melate Retro' : 'Melate Tradicional'} (${activeMelateSubGame.toUpperCase()})\n`;
    text += `Último Sorteo de referencia: ${document.getElementById('quick-last-draw').innerText}\n\n`;
    text += `Combinación: ${consensusTicketData.map(n => n < 10 ? '0' + n : n).join(' - ')}\n`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast("¡Combinación consensuada copiada al portapapeles con éxito!", "success");
    }).catch(err => {
        console.error("Fallo al copiar combinación: ", err);
        showToast("No se pudo copiar automáticamente. Por favor copia manualmente.", "warning");
    });
}

// Toggle the local cache visual badge indicator
function showOfflineCacheIndicator(show) {
    const badge = document.getElementById('offline-cache-badge');
    if (badge) {
        badge.style.display = show ? 'inline-block' : 'none';
    }
}

const CACHE_SECRET_KEY = "brain_branding_melate_ia";

// Encode JSON cache payload to Base64 XOR Cipher (security suggestion 2 applied)
function encodeCacheData(data) {
    try {
        const payload = {
            timestamp: Date.now(),
            payload: data
        };
        const str = JSON.stringify(payload);
        let cipher = "";
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i) ^ CACHE_SECRET_KEY.charCodeAt(i % CACHE_SECRET_KEY.length);
            cipher += String.fromCharCode(charCode);
        }
        return btoa(unescape(encodeURIComponent(cipher)));
    } catch (e) {
        console.error("Error encoding cache:", e);
        return null;
    }
}

// Decode Base64 XOR Cipher to JSON cache payload (security suggestion 2 applied)
function decodeCacheData(str) {
    if (!str) return null;
    try {
        // Compatibility check for legacy raw JSON
        if (str.startsWith('{') || str.startsWith('[')) {
            return { payload: JSON.parse(str), timestamp: Date.now() };
        }
        const decodedBase64 = decodeURIComponent(escape(atob(str)));
        let decipher = "";
        for (let i = 0; i < decodedBase64.length; i++) {
            const charCode = decodedBase64.charCodeAt(i) ^ CACHE_SECRET_KEY.charCodeAt(i % CACHE_SECRET_KEY.length);
            decipher += String.fromCharCode(charCode);
        }
        return JSON.parse(decipher);
    } catch (e) {
        console.error("Error decoding cache:", e);
        return null;
    }
}

// Clear all predictions from local cache (suggestions 1 & 3 applied)
function clearPredictionsCache() {
    const btn = document.querySelector('.clear-cache-btn');
    if (btn) {
        btn.innerHTML = '🧹 Borrando...';
        btn.style.color = '#f59e0b';
    }
    
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('last_pool_') || key.startsWith('last_tickets_') || key.startsWith('last_details_') || key.startsWith('last_prediction_'))) {
            keys.push(key);
        }
    }
    keys.forEach(k => localStorage.removeItem(k));
    
    setTimeout(() => {
        showToast("🧹 Caché local de predicciones limpiada con éxito.", "success");
        setTimeout(() => location.reload(), 1200);
    }, 500); // 500ms delay for visual sweep effect feedback (Suggestion 3)
}

// Auto-refresh calculations when network connection is restored (suggestion 3 applied)
window.addEventListener('online', () => {
    console.log("Conectado a Internet. Actualizando predicciones automáticamente...");
    calculatePredictions();
});

// Download Consensus Ticket and Method pools as a text file (Suggestion 2 applied)
function downloadConsensusTicketsFile() {
    if (!consensusTicketData || consensusTicketData.length === 0) {
        showToast("No hay combinaciones generadas para descargar.", "error");
        return;
    }
    
    let text = `Predictor IA Melate - Combinación Consensuada Máxima e Individuales\n`;
    text += `====================================================================\n`;
    text += `Juego: ${activeGame === 'retro' ? 'Melate Retro' : 'Melate Tradicional'} (${activeMelateSubGame.toUpperCase()})\n`;
    text += `Último Sorteo de referencia: ${document.getElementById('quick-last-draw').innerText}\n`;
    text += `Fecha de generación: ${new Date().toLocaleString()}\n`;
    text += `====================================================================\n\n`;
    
    text += `✨ COMBINACIÓN CONSENSUADA MÁXIMA:\n`;
    text += `${consensusTicketData.map(n => n < 10 ? '0' + n : n).join(' - ')}\n\n`;
    
    text += `--------------------------------------------------------------------\n`;
    text += `DESGLOSE DE NÚMEROS POR MODELO PREDICTIVO:\n`;
    text += `--------------------------------------------------------------------\n\n`;
    
    const algos = [
        { key: 'fusion', name: '🎯 Fusión Monte Carlo' },
        { key: 'markov', name: '⛓️ Cadenas de Markov' },
        { key: 'entropy', name: '🌀 Regresión de Entropía' },
        { key: 'frequency', name: '📊 Frecuencia Ponderada' }
    ];
    
    algos.forEach(algo => {
        const pool = currentMethodsData[algo.key] || [];
        const nums = pool.map(x => x.num < 10 ? '0' + x.num : x.num);
        text += `${algo.name} (${pool.length} números):\n`;
        text += `${nums.join(' - ')}\n\n`;
    });
    
    text += `Generado con Inteligencia Artificial - Brain Branding`;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `combinacion_consenso_${activeGame}_${activeMelateSubGame}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Validate advanced filter inputs (Suggestion 2 applied)
function validateFilters() {
    const maxNum = activeGame === 'retro' ? 39 : 56;
    const excludeInput = document.getElementById('exclude-numbers');
    const includeInput = document.getElementById('include-numbers');
    const calcBtn = document.getElementById('btn-calculate');
    
    if (!excludeInput || !includeInput || !calcBtn) return;
    
    let isValid = true;
    let excludeMsg = "";
    let includeMsg = "";
    
    // Validate Exclusions
    const excludeVals = excludeInput.value.split(',').map(x => x.trim()).filter(x => x !== '');
    if (excludeVals.some(v => isNaN(parseInt(v)) || parseInt(v) < 1 || parseInt(v) > maxNum)) {
        isValid = false;
        excludeMsg = `Números deben estar entre 1 y ${maxNum}`;
    }
    
    // Validate Inclusions
    const includeVals = includeInput.value.split(',').map(x => x.trim()).filter(x => x !== '');
    const includeNums = includeVals.map(x => parseInt(x)).filter(x => !isNaN(x));
    if (includeVals.some(v => isNaN(parseInt(v)) || parseInt(v) < 1 || parseInt(v) > maxNum)) {
        isValid = false;
        includeMsg = `Números deben estar entre 1 y ${maxNum}`;
    } else if (includeNums.length > 5) {
        isValid = false;
        includeMsg = "Máximo 5 números obligatorios";
    }
    
    // Show / Hide borders and messages
    excludeInput.style.borderColor = excludeMsg ? '#ef4444' : 'rgba(255,255,255,0.08)';
    includeInput.style.borderColor = includeMsg ? '#ef4444' : 'rgba(255,255,255,0.08)';
    
    let excludeWarn = document.getElementById('exclude-warn');
    if (!excludeWarn) {
        excludeWarn = document.createElement('span');
        excludeWarn.id = 'exclude-warn';
        excludeWarn.style.cssText = "color:#ef4444; font-size:10px; display:block; margin-top:2px;";
        excludeInput.parentNode.appendChild(excludeWarn);
    }
    excludeWarn.innerText = excludeMsg;
    
    let includeWarn = document.getElementById('include-warn');
    if (!includeWarn) {
        includeWarn = document.createElement('span');
        includeWarn.id = 'include-warn';
        includeWarn.style.cssText = "color:#ef4444; font-size:10px; display:block; margin-top:2px;";
        includeInput.parentNode.appendChild(includeWarn);
    }
    includeWarn.innerText = includeMsg;
    
    calcBtn.disabled = !isValid;
    calcBtn.style.opacity = isValid ? '1' : '0.5';
    calcBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
}

// Render search filters historical logs in UI (Suggestion 1 applied)
function renderFilterHistory() {
    // Render Exclude History
    const excludeInput = document.getElementById('exclude-numbers');
    if (excludeInput) {
        let excludeHistoryContainer = document.getElementById('exclude-history');
        if (!excludeHistoryContainer) {
            excludeHistoryContainer = document.createElement('div');
            excludeHistoryContainer.id = 'exclude-history';
            excludeHistoryContainer.style.cssText = "display:flex; gap:5px; flex-wrap:wrap; margin-top:4px;";
            excludeInput.parentNode.appendChild(excludeHistoryContainer);
        }
        
        let exHist = JSON.parse(localStorage.getItem(`ex_hist_${activeGame}`) || '[]');
        excludeHistoryContainer.innerHTML = exHist.map(h => `
            <span class="history-badge" onclick="applyHistoryFilter('exclude-numbers', '${h}')" style="font-size:9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:3px; padding:2px 5px; color:var(--text-secondary); cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">${h}</span>
        `).join('');
    }
    
    // Render Include History
    const includeInput = document.getElementById('include-numbers');
    if (includeInput) {
        let includeHistoryContainer = document.getElementById('include-history');
        if (!includeHistoryContainer) {
            includeHistoryContainer = document.createElement('div');
            includeHistoryContainer.id = 'include-history';
            includeHistoryContainer.style.cssText = "display:flex; gap:5px; flex-wrap:wrap; margin-top:4px;";
            includeInput.parentNode.appendChild(includeHistoryContainer);
        }
        
        let inHist = JSON.parse(localStorage.getItem(`in_hist_${activeGame}`) || '[]');
        includeHistoryContainer.innerHTML = inHist.map(h => `
            <span class="history-badge" onclick="applyHistoryFilter('include-numbers', '${h}')" style="font-size:9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:3px; padding:2px 5px; color:var(--text-secondary); cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">${h}</span>
        `).join('');
    }
}

// Click callback to apply clicked history badge to search input
function applyHistoryFilter(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = value;
        validateFilters();
    }
}

// Save successfully run filters to history (Suggestion 1 applied)
function saveFilterToHistory(type, value) {
    if (!value) return;
    const key = `${type}_hist_${activeGame}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list = list.filter(x => x !== value);
    list.unshift(value);
    if (list.length > 3) list.pop();
    localStorage.setItem(key, JSON.stringify(list));
}

// Swipe gestures for mobile sidebar (Suggestion 3 applied)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchStartTarget = null;

window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTarget = e.target;
}, { passive: true });

window.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe(e);
}, { passive: true });

function handleSwipe(e) {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Ignore swipe if the touch started inside the sidebar (prevents sliders/inputs conflicts)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && (sidebar.contains(touchStartTarget) || sidebar.contains(e.target))) {
        return;
    }
    
    // We want horizontal swipe (X axis) to dominate and be significant (at least 70px)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 70) {
        const container = document.querySelector('.app-container');
        const isMobile = window.innerWidth <= 900;
        
        if (isMobile) {
            if (diffX > 0 && touchStartX < 50) {
                // Swipe Right starting near left edge -> Open Sidebar
                expandSidebar();
            } else if (diffX < 0 && container.classList.contains('sidebar-open')) {
                // Swipe Left with sidebar open -> Close Sidebar
                container.classList.remove('sidebar-open');
                container.classList.add('sidebar-collapsed');
                toggleOverlay(false);
            }
        }
    }
}

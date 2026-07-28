// Safe storage wrapper to prevent crashes in strict privacy settings / custom domains
const safeStorage = (type) => {
  try {
    const storage = window[type];
    const testKey = '__test_store__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch (e) {
    const memory = {};
    return {
      getItem: (key) => (key in memory ? memory[key] : null),
      setItem: (key, value) => { memory[key] = String(value); },
      removeItem: (key) => { delete memory[key]; },
      clear: () => { Object.keys(memory).forEach(k => delete memory[k]); }
    };
  }
};
const safeLocalStorage = safeStorage('localStorage');
const safeSessionStorage = safeStorage('sessionStorage');

/* Brain Branding - Interactive Scripts */

document.addEventListener('DOMContentLoaded', () => {
  const redirectReason = safeLocalStorage.getItem('sim_redirect_reason');
  if (redirectReason) {
    console.warn("REDIRECTED REASON:", redirectReason);
    safeLocalStorage.removeItem('sim_redirect_reason');
  }

  
  
  // ── IA SIMULATOR SETUP MODAL LOGIC ──
  let activeSimulatorService = 'asistente';
  let uploadedLogoDataUrl = '';

  const simModal = document.getElementById('setup-simulator-modal');
  const cancelSimBtn = document.getElementById('cancel-sim-btn');
  const closeSimModalBtn = document.getElementById('close-sim-modal-btn');
  const simSetupForm = document.getElementById('sim-setup-form');
  const dragZone = document.getElementById('sim-logo-drag-zone');
  const fileInput = document.getElementById('sim-logo-file');
  const logoStatus = document.getElementById('sim-logo-status');

  const servicePlaceholders = {
    asistente: 'Ej: Tardo mucho respondiendo dudas repetitivas de clientes en WhatsApp sobre precios y horarios...',
    pos: 'Ej: Tengo descontrol en inventario, faltantes de stock y cobros lentos en cajas...',
    web: 'Ej: No tengo presencia digital profesional ni catálogo web interactivo para captar prospectos...',
    erp: 'Ej: Mis sucursales, facturación y cuentas por cobrar están desconectadas y generan cuellos de botella...'
  };

  // Open modal on simulator button clicks
  document.querySelectorAll('.sim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSimulatorService = btn.getAttribute('data-service') || 'asistente';
      const problemInput = document.getElementById('sim-business-problem');
      if (problemInput && servicePlaceholders[activeSimulatorService]) {
        problemInput.placeholder = servicePlaceholders[activeSimulatorService];
      }
      if (simModal) {
        simModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock main scroll
      }
    });
  });

  // Close modal functions
  const hideSimModal = () => {
    if (simModal) {
      simModal.style.display = 'none';
      document.body.style.overflow = ''; // Unlock scroll
      // Reset form
      if (simSetupForm) simSetupForm.reset();
      uploadedLogoDataUrl = '';
      if (logoStatus) {
        logoStatus.textContent = 'Arrastra tu logo aquí o haz clic para subir';
        logoStatus.style.color = 'var(--text-muted)';
      }
      if (dragZone) dragZone.style.borderColor = 'rgba(168, 85, 247, 0.4)';
    }
  };

  if (cancelSimBtn) cancelSimBtn.addEventListener('click', hideSimModal);
  if (closeSimModalBtn) closeSimModalBtn.addEventListener('click', hideSimModal);
  if (simModal) {
    simModal.addEventListener('click', (e) => {
      if (e.target === simModal) hideSimModal();
    });
  }

  // Logo Drag & Drop / File Upload handlers
  if (dragZone && fileInput) {
    dragZone.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
    });

    dragZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragZone.style.borderColor = '#ec4899';
      dragZone.style.background = 'rgba(236, 72, 153, 0.05)';
    });

    ['dragleave', 'drop'].forEach(evt => {
      dragZone.addEventListener(evt, () => {
        dragZone.style.borderColor = 'rgba(168, 85, 247, 0.4)';
        dragZone.style.background = 'rgba(255,255,255,0.01)';
      });
    });

    dragZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        processLogoFile(file);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processLogoFile(file);
      }
    });
  }

  function processLogoFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedLogoDataUrl = e.target.result;
      if (logoStatus) {
        logoStatus.textContent = `✓ Logo cargado: ${file.name}`;
        logoStatus.style.color = '#10b981';
      }
      if (dragZone) dragZone.style.borderColor = '#10b981';
    };
    reader.readAsDataURL(file);
  }

  // ── GIRO/SECTOR AUTCOMPLETE FUZZY SEARCH LOGIC ──
  const sectorInput = document.getElementById('sim-business-sector');
  const autocompleteList = document.getElementById('sim-sector-autocomplete-list');

  const sectorsList = [
    { name: "Restaurante / Café", icon: "🍳", keywords: ["comida", "alimentos", "cafe", "bar", "cena", "desayuno", "bistro", "taqueria", "restaurante", "pasteleria", "panaderia", "pizzeria"] },
    { name: "Comercio / Tienda (Retail)", icon: "🛍️", keywords: ["tienda", "comercio", "boutique", "ropa", "calzado", "ventas", "supermercado", "retail", "mercado", "abarrotes"] },
    { name: "Servicios Profesionales / Consultoría", icon: "💼", keywords: ["consultor", "oficina", "despacho", "abogado", "contador", "freelance", "agencia", "servicios", "asesor"] },
    { name: "Salud / Clínica", icon: "🏥", keywords: ["doctor", "medico", "dentista", "clinica", "hospital", "farmacia", "odontologo", "pediatra", "terapia"] },
    { name: "Educación / Cursos", icon: "🎓", keywords: ["escuela", "colegio", "curso", "taller", "universidad", "academia", "clases", "profesor", "docente"] },
    { name: "Inmobiliaria / Bienes Raíces", icon: "🏠", keywords: ["inmobiliaria", "bienes raices", "renta", "venta de casas", "terrenos", "broker", "agente inmobiliario"] },
    { name: "Manufactura / Distribución", icon: "🏭", keywords: ["fabrica", "manufactura", "distribuidora", "almacen", "logistica", "bodega", "produccion", "taller industrial"] },
    { name: "Otro Sector", icon: "✨", keywords: ["otro", "personalizado", "giro diferente"] }
  ];

  const normalizeStr = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
  };

  const levenshteinDistance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    return track[str2.length][str1.length];
  };

  const showSuggestions = (val) => {
    if (!autocompleteList) return;
    autocompleteList.innerHTML = '';
    
    const query = normalizeStr(val);
    
    const scoredSectors = sectorsList.map(sec => {
      let score = 0;
      const normalizedSec = normalizeStr(sec.name);
      
      if (normalizedSec.includes(query)) {
        score += 80;
      }
      if (normalizedSec === query) {
        score += 100;
      }
      
      sec.keywords.forEach(kw => {
        const normKw = normalizeStr(kw);
        if (normKw.includes(query) || query.includes(normKw)) {
          score += 50;
        }
        
        const words = query.split(/\s+/);
        words.forEach(word => {
          if (word.length > 2) {
            const dist = levenshteinDistance(word, normKw);
            if (dist <= 1) score += 35;
            else if (dist <= 2) score += 15;
          }
        });
      });
      
      return { ...sec, score };
    });
    
    let filtered = scoredSectors.filter(s => s.score > 0 || val === '');
    filtered.sort((a, b) => b.score - a.score);
    
    if (filtered.length === 0 && val.trim().length > 0) {
      filtered.push({
        name: val.trim(),
        icon: "✨",
        custom: true
      });
    }
    
    filtered.forEach(sec => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = "padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;";
      itemDiv.innerHTML = `
        <span style="font-size: 16px;">${sec.icon}</span>
        <div style="flex: 1;">
          <span style="font-size: 13.5px; color: #fff; font-weight: 600;">${sec.name}</span>
          ${sec.custom ? `<span style="font-size: 10px; color: var(--primary); display: block; margin-top: 2px;">Giro Personalizado</span>` : ''}
        </div>
      `;
      
      itemDiv.addEventListener('click', () => {
        sectorInput.value = sec.name;
        autocompleteList.style.display = 'none';
      });
      
      itemDiv.addEventListener('mouseover', () => {
        itemDiv.style.background = 'rgba(168, 85, 247, 0.15)';
      });
      itemDiv.addEventListener('mouseout', () => {
        itemDiv.style.background = 'transparent';
      });
      
      autocompleteList.appendChild(itemDiv);
    });
    
    autocompleteList.style.display = filtered.length > 0 ? 'block' : 'none';
  };

  if (sectorInput && autocompleteList) {
    sectorInput.addEventListener('focus', () => {
      showSuggestions(sectorInput.value);
    });
    
    sectorInput.addEventListener('input', (e) => {
      showSuggestions(e.target.value);
    });
    
    document.addEventListener('click', (e) => {
      if (!sectorInput.contains(e.target) && !autocompleteList.contains(e.target)) {
        autocompleteList.style.display = 'none';
      }
    });
  }

  // Real-time Form Validation
  const valInputs = [
    { id: 'sim-business-name', min: 3, label: 'Nombre', msg: 'Mínimo 3 letras' },
    { id: 'sim-business-sector', min: 3, label: 'Giro', msg: 'Mínimo 3 letras' },
    { id: 'sim-business-problem', min: 10, label: 'Problema', msg: 'Mínimo 10 letras' }
  ];

  valInputs.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;

    // Find or create label indicator
    const labelEl = el.closest('div').querySelector('label');
    let indicator = labelEl.querySelector('.val-indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'val-indicator';
      indicator.style.fontSize = '10px';
      indicator.style.fontWeight = 'normal';
      indicator.style.marginLeft = '8px';
      indicator.style.opacity = '0.8';
      indicator.style.transition = 'all 0.3s';
      labelEl.appendChild(indicator);
    }

    const validate = () => {
      const val = el.value.trim();
      if (val.length === 0) {
        indicator.textContent = '';
        el.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        el.style.boxShadow = 'none';
      } else if (val.length < item.min) {
        indicator.textContent = '❌ ' + item.msg;
        indicator.style.color = '#ef4444';
        el.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        el.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.1)';
      } else {
        indicator.textContent = '✅ Completo';
        indicator.style.color = '#10b981';
        el.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        el.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.1)';
      }
    };

    el.addEventListener('input', validate);
    el.addEventListener('blur', validate);
  });

  // Handle Form Submit / Start Simulation Action
  const startSimAction = (e) => {
    if (e) e.preventDefault();

    const nameEl = document.getElementById('sim-business-name');
    const sectorEl = document.getElementById('sim-business-sector');
    const problemEl = document.getElementById('sim-business-problem');

    const rawName = nameEl ? nameEl.value.trim() : '';
    const rawSector = sectorEl ? sectorEl.value.trim() : '';
    const rawProblem = problemEl ? problemEl.value.trim() : '';

    // Smart defaults so button NEVER fails
    const bizName = rawName || 'Mi Empresa';
    const bizSector = rawSector || 'Comercio / General';
    const bizProblem = rawProblem || 'Optimización de tiempo y control de operaciones';

    // Lock button to prevent duplicate clicks
    const startBtn = document.getElementById('start-sim-btn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = '✨ Generando Prototipo...';
      startBtn.style.opacity = '0.75';
      startBtn.style.cursor = 'wait';
    }

    const bizStyle = (document.getElementById('sim-business-style') && document.getElementById('sim-business-style').value) || 'ultra-moderno';
    const nowStr = Date.now().toString();

    // Store in safeSessionStorage
    safeSessionStorage.setItem('sim_session_active', 'true');
    safeSessionStorage.setItem('sim_session_start', nowStr);
    safeSessionStorage.setItem('sim_biz_name', bizName);
    safeSessionStorage.setItem('sim_biz_sector', bizSector);
    safeSessionStorage.setItem('sim_biz_problem', bizProblem);
    safeSessionStorage.setItem('sim_biz_style', bizStyle);
    safeSessionStorage.setItem('sim_biz_logo', uploadedLogoDataUrl || '');
    safeSessionStorage.setItem('sim_active_service', activeSimulatorService);

    // Store in safeLocalStorage
    safeLocalStorage.setItem('sim_session_active', 'true');
    safeLocalStorage.setItem('sim_session_start', nowStr);
    safeLocalStorage.setItem('sim_biz_name', bizName);
    safeLocalStorage.setItem('sim_biz_sector', bizSector);
    safeLocalStorage.setItem('sim_biz_problem', bizProblem);
    safeLocalStorage.setItem('sim_biz_style', bizStyle);
    safeLocalStorage.setItem('sim_biz_logo', uploadedLogoDataUrl || '');
    safeLocalStorage.setItem('sim_active_service', activeSimulatorService);

    // Close modal
    hideSimModal();

    // Navigate smoothly to simulator.html
    window.location.href = '/simulador.html';
  };

  const startSimBtn = document.getElementById('start-sim-btn');
  if (startSimBtn) {
    startSimBtn.addEventListener('click', startSimAction);
  }
  if (simSetupForm) {
    simSetupForm.addEventListener('submit', startSimAction);
  }

  // Express Simulation 1-click action
  const expressSimBtn = document.getElementById('express-sim-btn');
  if (expressSimBtn) {
    expressSimBtn.addEventListener('click', () => {
      const nameEl = document.getElementById('sim-business-name');
      const sectorEl = document.getElementById('sim-business-sector');
      const problemEl = document.getElementById('sim-business-problem');
      if (nameEl) nameEl.value = 'Boutique Nova';
      if (sectorEl) sectorEl.value = 'Venta de Muebles y Decoración';
      if (problemEl) problemEl.value = 'Optimización de respuestas a clientes y control de crédito';
      startSimAction();
    });
  }

  // Real-time green glow feedback on filled inputs
  ['sim-business-name', 'sim-business-sector', 'sim-business-problem'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        if (input.value.trim().length >= 2) {
          input.style.borderColor = 'rgba(16, 185, 129, 0.6)';
          input.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.15)';
        } else {
          input.style.borderColor = 'var(--border-color)';
          input.style.boxShadow = 'none';
        }
      });
    }
  });

  // 1. Header scroll animation & Footer Sim Banner
  const header = document.querySelector('header');
  const footerBanner = document.getElementById('footer-sim-banner');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    const scrollPos = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (footerBanner) {
      if (scrollPos > docHeight * 0.75) {
        footerBanner.style.display = 'flex';
      } else {
        footerBanner.style.display = 'none';
      }
    }
  });

  // Suggestion Chip Handler
  const probInput = document.getElementById('sim-business-problem');
  const chipBtn = document.getElementById('use-suggestion-chip');
  if (probInput && chipBtn) {
    probInput.addEventListener('focus', () => {
      if (!probInput.value.trim() && probInput.placeholder) {
        chipBtn.innerHTML = `💡 Tap para usar sugerencia: "${probInput.placeholder.substring(0, 45)}..."`;
        chipBtn.style.display = 'block';
      }
    });

    chipBtn.addEventListener('click', () => {
      if (probInput.placeholder) {
        probInput.value = probInput.placeholder.replace(/^Ej:\s*/i, '');
        probInput.style.borderColor = 'rgba(16, 185, 129, 0.6)';
        probInput.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.15)';
        chipBtn.style.display = 'none';
      }
    });
  }

  // 2. Parallax 3D Card Hover for the Brain Card
  const brainCard = document.querySelector('.brain-card');
  const brainContainer = document.querySelector('.brain-container');
  
  if (brainCard && brainContainer) {
    brainCard.addEventListener('mousemove', (e) => {
      const rect = brainCard.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position inside element
      const y = e.clientY - rect.top;  // y position inside element
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = -(y - centerY) / 12; // Max 15 degrees rotate
      const rotateY = (x - centerX) / 12;
      
      brainCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      brainContainer.style.transform = `translateZ(30px) scale(1.05)`;
    });
    
    brainCard.addEventListener('mouseleave', () => {
      brainCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      brainContainer.style.transform = 'translateZ(0px) scale(1)';
    });
  }

  // 3. Dynamic typing text for the Hero
  const typingElement = document.getElementById('typing-text');
  if (typingElement) {
    const words = ["Asistente Personal IA", "Punto de Venta", "Página Web", "Software a Medida"];
    const descriptions = [
      "Implementamos tu Asistente Personal de Inteligencia Artificial que puedes controlar desde Whatsapp o Telegram para que puedas disfrutar más de las cosas que valen la pena.",
      "Controla tu negocio 24/7 desde cualquier lugar y/o dispositivo, administra tus inventarios, sucursales, facturación y cobros, todo a medida.",
      "Establece una presencia digital corporativa premium con tu Página Web, con el nombre de tu empresa en la WEB.",
      "Tu negocio no es igual a ningún otro, tu empresa no se tiene que amoldar al sistema, naturalmente debe ser al revés."
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
      if (document.hidden) {
        setTimeout(type, 1000);
        return;
      }
      const currentWord = words[wordIndex];
      if (isDeleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }
      
      let typeSpeed = isDeleting ? 40 : 80;
      
      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000; // Pause at end of word
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500; // Pause before typing next word
        
        // Update description dynamically with opacity transition & slide
        const descElement = document.querySelector('.hero-desc');
        if (descElement) {
          descElement.classList.add('fade-out');
          setTimeout(() => {
            descElement.textContent = descriptions[wordIndex];
            descElement.classList.remove('fade-out');
          }, 250);
        }
        
        // Update more info button dynamic link & label
        const targets = ["#detail-asistente-ia", "#detail-punto-venta", "#detail-pagina-web", "#detail-software-medida"];
        const buttonLabels = [
          "Ver ventajas de tu Asistente Personal IA",
          "Ver ventajas de tu Punto de Venta",
          "Ver ventajas de tu Página Web",
          "Ver ventajas de tu Software a Medida"
        ];
        const moreInfoBtn = document.getElementById('hero-more-info-btn');
        const moreInfoText = document.getElementById('more-info-text');
        if (moreInfoBtn && moreInfoText) {
          moreInfoBtn.style.opacity = '0';
          setTimeout(() => {
            moreInfoBtn.setAttribute('href', targets[wordIndex]);
            moreInfoText.textContent = buttonLabels[wordIndex];
            moreInfoBtn.style.opacity = '1';
          }, 250);
        }
        
        // Update contact form message input dynamically if empty or template
        const templates = [
          "Hola! Me interesa diseñar mi Asistente Personal de IA para automatizar mis procesos.",
          "Hola! Me interesa cotizar un Sistema de Punto de Venta a la medida.",
          "Hola! Me interesa crear mi Página Web corporativa premium.",
          "Hola! Me interesa cotizar un Software a Medida para mi empresa."
        ];
        const descField = document.getElementById('contact-desc');
        if (descField) {
          const currentVal = descField.value.trim();
          const isTemplate = currentVal === "" || templates.includes(currentVal);
          if (isTemplate) {
            descField.value = templates[wordIndex];
            descField.dispatchEvent(new Event('input'));
          }
        }
      }
      
      setTimeout(type, typeSpeed);
    }
    
    setTimeout(type, 1000);
  }

  // 4. Showcase Demo Simulation (Interactive count animation)
  const numbers = document.querySelectorAll('.animate-number');
  let animated = false;
  
  function animateNumbers() {
    numbers.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'));
      const duration = 2000; // 2s
      const step = target / (duration / 16); // 60fps
      let current = 0;
      
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          num.textContent = num.getAttribute('data-prefix') + target.toLocaleString() + num.getAttribute('data-suffix');
          clearInterval(timer);
        } else {
          num.textContent = num.getAttribute('data-prefix') + Math.floor(current).toLocaleString() + num.getAttribute('data-suffix');
        }
      }, 16);
    });
  }

  // Trigger animation on scroll when showcase is visible
  const showcaseSection = document.querySelector('.showcase');
  if (showcaseSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animateNumbers();
          animated = true;
        }
      });
    }, { threshold: 0.3 });
    
  }

  // 5. Contact Form WhatsApp Redirection & Giro Chips Handler
  const chips = document.querySelectorAll('.giro-chip');
  const verticalInput = document.getElementById('contact-vertical');
  if (chips && verticalInput) {
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => {
          c.style.borderColor = 'var(--border-color)';
          c.style.color = 'var(--text-muted)';
          c.style.background = 'rgba(255,255,255,0.02)';
          c.classList.remove('active-chip');
        });
        chip.style.borderColor = 'var(--primary)';
        chip.style.color = '#fff';
        chip.style.background = 'rgba(99, 102, 241, 0.1)';
        chip.classList.add('active-chip');
        verticalInput.value = chip.getAttribute('data-value');
        if (typeof gtag === 'function') {
          gtag('event', 'select_giro_chip', {
            event_category: 'engagement',
            event_label: chip.getAttribute('data-value')
          });
        }
      });
    });
  }

  const contactForm = document.getElementById('agency-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Honeypot anti-spam verification
      const honeypot = document.getElementById('contact-honeypot');
      if (honeypot && honeypot.value !== '') {
        console.warn('[Security] Bot detectado en el formulario.');
        return; // Bloqueo silencioso
      }
      
      const name = document.getElementById('contact-name').value.trim();
      const business = document.getElementById('contact-business').value.trim();
      const vertical = document.getElementById('contact-vertical').value;
      const desc = document.getElementById('contact-desc').value.trim();
      const operation = document.getElementById('contact-operation').value.trim();
      
      // WhatsApp pre-filled link
      const phone = "525638165507"; // WhatsApp comercial
      const text = `Hola *Brain Branding*, realicé el diagnóstico de mi negocio en la web:\n\n1. *Giro:* ${vertical}\n2. *Funciones que requiero:* ${desc}\n3. *Operación actual:* ${operation}\n\nMi nombre es *${name}* de la empresa *${business}*. Quedo a la espera de mi propuesta personalizada.`;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const waUrl = isMobile 
        ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
        : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
      
      // Visual feedback on button
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '✓ ¡Estructurando idea! Abriendo WhatsApp...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
 
      setTimeout(() => {
        window.open(waUrl, '_blank');
        
        // Reset button after redirect
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          contactForm.reset();
          // Reset chips to default
          if (chips && chips.length > 0) {
            chips.forEach((c, idx) => {
              if (idx === 0) {
                c.style.borderColor = 'var(--primary)';
                c.style.color = '#fff';
                c.style.background = 'rgba(99, 102, 241, 0.1)';
                c.classList.add('active-chip');
                verticalInput.value = c.getAttribute('data-value');
              } else {
                c.style.borderColor = 'var(--border-color)';
                c.style.color = 'var(--text-muted)';
                c.style.background = 'rgba(255,255,255,0.02)';
                c.classList.remove('active-chip');
              }
            });
          }
        }, 1000);
      }, 600);
    });
  }

  // 6. Cookie Consent Logic
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptCookiesBtn = document.getElementById('accept-cookies-btn');
  if (cookieBanner && acceptCookiesBtn) {
    if (!safeLocalStorage.getItem('cookies_accepted')) {
      setTimeout(() => {
        cookieBanner.style.display = 'block';
      }, 1000);
    }
    acceptCookiesBtn.addEventListener('click', () => {
      safeLocalStorage.setItem('cookies_accepted', 'true');
      cookieBanner.style.opacity = '0';
      setTimeout(() => {
        cookieBanner.style.display = 'none';
      }, 300);
    });
  }

  // 7. Light/Dark Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    if (safeLocalStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
      themeToggleBtn.textContent = '🌙';
    } else {
      themeToggleBtn.textContent = '☀️';
    }
    
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      safeLocalStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggleBtn.textContent = isLight ? '🌙' : '☀️';
      themeToggleBtn.classList.toggle('rotated');
    });
  }

  // 8. Cybernetic Custom Cursor Logic (Only Desktop)
  if (!window.matchMedia("(max-width: 968px)").matches) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    const follower = document.createElement('div');
    follower.className = 'custom-cursor-follower';
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      
      // Smooth lag effect for follower
      setTimeout(() => {
        follower.style.left = e.clientX + 'px';
        follower.style.top = e.clientY + 'px';
      }, 40);
    });

    // Scale cursor on hover
    document.querySelectorAll('a, button, .service-card, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width = '14px';
        cursor.style.height = '14px';
        cursor.style.backgroundColor = 'var(--secondary)';
        follower.style.width = '42px';
        follower.style.height = '42px';
        follower.style.borderColor = 'var(--primary)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '8px';
        cursor.style.height = '8px';
        cursor.style.backgroundColor = 'var(--primary)';
        follower.style.width = '26px';
        follower.style.height = '26px';
        follower.style.borderColor = 'var(--secondary)';
      });
    });
  }

  // 9. Scroll Reveal Logic
  const revealElements = document.querySelectorAll('.service-card, .showcase-preview, .showcase-content, .testimonial-card, .contact-card, .contact-info');
  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target); // Trigger only once
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => revealObserver.observe(el));

  // 10. Calculator Logic
  const basePrice = 12000;
  const calcChecks = document.querySelectorAll('.calc-check');
  const totalDisplay = document.getElementById('calc-total-price');
  
  if (totalDisplay && calcChecks.length > 0) {
    const svgCircle = document.getElementById('calc-svg-progress');
    const pctLabel = document.getElementById('calc-pct-label');

    const updateEstimate = () => {
      let total = basePrice;
      calcChecks.forEach(chk => {
        if (chk.checked) {
          total += parseInt(chk.getAttribute('data-price'));
        }
      });
      totalDisplay.textContent = `$${total.toLocaleString()} MXN`;
      
      const pct = Math.round((total / 35000) * 100);
      if (pctLabel) pctLabel.textContent = `${pct}%`;
      
      if (svgCircle) {
        const strokeOffset = 345.57 - (345.57 * pct) / 100;
        svgCircle.style.strokeDashoffset = strokeOffset;
      }
    };
    
    calcChecks.forEach(chk => chk.addEventListener('change', () => {
      updateEstimate();
      if (typeof gtag === 'function') {
        gtag('event', 'select_saas_module', {
          event_category: 'calculator',
          event_label: chk.parentElement.querySelector('span').textContent,
          value: parseInt(chk.getAttribute('data-price'))
        });
      }
    }));
    updateEstimate(); // Inicializar gráfico
    
    const calcSubmitBtn = document.getElementById('calc-submit-btn');
    if (calcSubmitBtn) {
      calcSubmitBtn.addEventListener('click', () => {
        const selectedModules = [];
        calcChecks.forEach(chk => {
          if (chk.checked) {
            selectedModules.push(chk.parentElement.querySelector('span').textContent);
          }
        });
        
        const totalPrice = document.getElementById('calc-total-price').textContent;
        const descField = document.getElementById('contact-desc');
        if (descField) {
          descField.value = `Coticé una configuración SaaS con presupuesto estimado de ${totalPrice}.\n\nMódulos seleccionados:\n- Plataforma Base\n${selectedModules.map(m => `- ${m}`).join('\n')}`;
        }
        
        const contactSec = document.getElementById('contacto');
        if (contactSec) {
          contactSec.scrollIntoView({ behavior: 'smooth' });
        }

        // Fire premium corporate confetti burst
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 150,
            spread: 85,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ec4899', '#3b82f6', '#10b981']
          });
        }

        const contactCard = document.querySelector('.contact-card');
        if (contactCard) {
          contactCard.classList.add('pulse-highlight');
          setTimeout(() => {
            contactCard.classList.remove('pulse-highlight');
          }, 3000);
        }
      });
    }
  }

  // 11. FAQ Accordion Logic
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');
    
    item.addEventListener('click', () => {
      const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';
      
      // Close all other FAQs
      document.querySelectorAll('.faq-answer').forEach(ans => {
        ans.style.maxHeight = '0px';
      });
      document.querySelectorAll('.faq-icon').forEach(ic => {
        ic.style.transform = 'rotate(0deg)';
      });
      
      if (!isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(45deg)';
      }
    });
  });


  // 14. Passcode Gate for Private Portal Demos
  const passcodeModal = document.getElementById('passcode-modal');
  const passcodeInput = document.getElementById('passcode-input');
  const passcodeError = document.getElementById('passcode-error');
  const submitPasscodeBtn = document.getElementById('submit-passcode-btn');
  const closePasscodeBtn = document.getElementById('close-passcode-btn');
  let targetPortalUrl = '/portal/';

  document.querySelectorAll('a[href^="/portal"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      targetPortalUrl = link.getAttribute('href');
      if (passcodeModal) {
        passcodeModal.style.display = 'flex';
        if (passcodeInput) {
          passcodeInput.value = '';
          passcodeInput.focus();
        }
        if (passcodeError) passcodeError.style.display = 'none';
      }
    });
  });

  if (closePasscodeBtn && passcodeModal) {
    closePasscodeBtn.addEventListener('click', () => {
      passcodeModal.style.display = 'none';
    });
  }

  let passcodeAttempts = 0;
  let passcodeLockoutTimer = null;

  if (submitPasscodeBtn) {
    const checkPasscode = async () => {
      if (passcodeAttempts >= 5) return;
      
      const enteredCode = passcodeInput ? passcodeInput.value.trim() : '';
      if (!enteredCode) return;
      
      // Master Passcode logic
      if (enteredCode.toUpperCase() === 'BB2026') {
        passcodeAttempts = 0;
        if (typeof gtag === 'function') {
          gtag('event', 'unlock_private_portal', { event_category: 'security', event_label: 'Success Master' });
        }
        window.location.href = targetPortalUrl;
        return;
      }
      
      // Dynamic Passcode API validation
      submitPasscodeBtn.disabled = true;
      if (passcodeError) {
        passcodeError.style.display = 'block';
        passcodeError.textContent = 'Validando clave...';
        passcodeError.style.color = 'var(--text-muted)';
      }
      
      try {
        const cleanCode = enteredCode.trim().toUpperCase();
        
        // Derive SHA-256 hash natively in client browser
        const encoder = new TextEncoder();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(cleanCode));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const cleanHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const res = await fetch(`https://brain-branding-demo-generator.onrender.com/api/validate-passcode?hash=${cleanHash}`);
        const data = await res.json();
        
        if (data.success && data.redirectUrl) {
          passcodeAttempts = 0;
          safeSessionStorage.setItem('demo_key', cleanCode);
          if (typeof gtag === 'function') {
            gtag('event', 'unlock_private_demo_api', { event_category: 'security', event_label: data.clientName });
          }
          const finalUrl = data.redirectUrl.startsWith('http') 
            ? data.redirectUrl 
            : `https://brain-branding.web.app${data.redirectUrl}`;
          window.location.href = finalUrl;
        } else {
          handleFail(data.error || 'Código incorrecto.');
        }
      } catch (err) {
        console.error('[API Passcode] Error:', err);
        handleFail('Error al conectar con el servidor.');
      }
    };
    
    const handleFail = (errorMessage) => {
      submitPasscodeBtn.disabled = false;
      passcodeAttempts++;
      if (typeof gtag === 'function') {
        gtag('event', 'unlock_private_portal_fail', { event_category: 'security', event_label: `Attempt ${passcodeAttempts}` });
      }
      
      if (passcodeAttempts >= 5) {
        submitPasscodeBtn.disabled = true;
        if (passcodeInput) passcodeInput.disabled = true;
        if (passcodeError) {
          passcodeError.style.display = 'block';
          passcodeError.style.color = 'var(--secondary)';
          let timeLeft = 600; // 10 minutes
          
          // Format seconds into MM:SS
          const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
          };
          
          passcodeError.textContent = `Demasiados intentos. Bloqueado por ${formatTime(timeLeft)}.`;
          
          // Log security event to backend server
          fetch('https://brain-branding-demo-generator.onrender.com/api/log-client-security', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'PORTAL_LOCKOUT',
              details: 'Intrusión potencial: El portal corporativo bloqueó un cliente tras 5 intentos fallidos de passcode.'
            })
          }).catch(err => console.warn('Fallo al reportar auditoría:', err));
          
          passcodeLockoutTimer = setInterval(() => {
            timeLeft--;
            passcodeError.textContent = `Demasiados intentos. Bloqueado por ${formatTime(timeLeft)}.`;
            if (timeLeft <= 0) {
              clearInterval(passcodeLockoutTimer);
              passcodeAttempts = 0;
              submitPasscodeBtn.disabled = false;
              if (passcodeInput) {
                passcodeInput.disabled = false;
                passcodeInput.value = '';
                passcodeInput.focus();
              }
              passcodeError.style.display = 'none';
            }
          }, 1000);
        }
      } else {
        if (passcodeError) {
          passcodeError.style.display = 'block';
          passcodeError.style.color = 'var(--secondary)';
          passcodeError.textContent = `${errorMessage} (${passcodeAttempts}/5 intentos)`;
        }
      }
    };

    submitPasscodeBtn.addEventListener('click', checkPasscode);
    if (passcodeInput) {
      passcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPasscode();
      });
    }
  }

  // 15. 3D Tilt Hover Effect for Service Cards
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const angleX = (yc - y) / 15;
      const angleY = (x - xc) / 15;
      
      card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });

  // 16. Print / Download PDF Proposal
  const calcPdfBtn = document.getElementById('calc-pdf-btn');
  if (calcPdfBtn) {
    calcPdfBtn.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'download_proposal_pdf', {
          event_category: 'engagement',
          event_label: 'SaaS Calculator'
        });
      }
      window.print();
    });
  }

  // 17. Real-Time Visual Field Validation
  const validateInputs = ['contact-name', 'contact-business', 'contact-desc', 'contact-operation'];
  validateInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (el.value.trim().length >= 3) {
          el.style.borderColor = 'rgba(34, 197, 94, 0.4)';
          el.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.1)';
        } else {
          el.style.borderColor = 'var(--border-color)';
          el.style.boxShadow = 'none';
        }
      });
    }
  });

  // 18. Google Analytics Event for FAB Click
  const fab = document.getElementById('whatsapp-fab');
  if (fab) {
    fab.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'click_whatsapp_fab', {
          event_category: 'engagement',
          event_label: 'WhatsApp FAB'
        });
      }
    });
  }

  // 19. WhatsApp FAB Tooltip Auto-Show & Auto-Hide
  setTimeout(() => {
    const tooltip = document.getElementById('fab-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
      
      // Auto-hide after 6 seconds
      setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
      }, 6000);
    }
  }, 5000);

  // 20. Scroll Spy for Icon Nav links
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('header nav .nav-link');

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 140; // offset for header height
    
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentSectionId = sec.getAttribute('id');
      }
    });

    if (currentSectionId) {
      safeSessionStorage.setItem('activeSection', currentSectionId);
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // Reset active states
      link.style.borderColor = 'var(--border-color)';
      link.style.background = 'rgba(255, 255, 255, 0.02)';
      link.style.boxShadow = 'none';
      
      if (href === `#${currentSectionId}`) {
        link.style.borderColor = 'var(--primary)';
        link.style.background = 'rgba(99, 102, 241, 0.15)';
        link.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.25)';
      }
    });
  });

  // 21. Analytics Tooltip Reading Event
  navLinks.forEach(link => {
    let hoverTimer;
    link.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => {
        if (typeof gtag === 'function') {
          gtag('event', 'read_tooltip', {
            event_category: 'engagement',
            event_label: link.getAttribute('data-tooltip') || 'Campaña'
          });
        }
      }, 1500);
    });
    link.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
    });
  });

  // 22. Click Spark for Nav Links
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      link.style.borderColor = '#00e5ff';
      link.style.background = 'rgba(0, 229, 255, 0.2)';
      link.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.6)';
      
      setTimeout(() => {
        link.style.borderColor = '';
        link.style.background = '';
        link.style.boxShadow = '';
      }, 400);
    });
  });

  // 23. Scroll State Restoration
  const savedSection = safeSessionStorage.getItem('activeSection');
  if (savedSection && window.location.hash === '') {
    setTimeout(() => {
      const targetSec = document.getElementById(savedSection);
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
  }

  // 24. WhatsApp FAB click debouncing
  if (fab) {
    let clickTimeout = null;
    fab.addEventListener('click', (e) => {
      if (clickTimeout !== null) {
        e.preventDefault();
        return;
      }
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
      }, 500);
    });
  }

  // 25. Hide WhatsApp FAB Tooltip on scroll or click outside
  const tooltip = document.getElementById('fab-tooltip');
  if (tooltip) {
    const hideTooltip = () => {
      if (tooltip.style.opacity === '1') {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
      }
    };
    window.addEventListener('scroll', hideTooltip, { passive: true });
    document.addEventListener('click', (e) => {
      if (fab && fab.contains(e.target)) return;
      hideTooltip();
    });
  }

  // 26. Dynamic Smart Header (Slide up/down on scroll)
  let lastScrollY = window.scrollY;
  const mainHeader = document.querySelector('header');
  
  if (mainHeader) {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        mainHeader.classList.add('header-hidden');
      } else {
        mainHeader.classList.remove('header-hidden');
      }
      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // Helper to sanitize HTML to prevent XSS injection
  function sanitizeInput(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // 27. Form draft auto-save
  const draftFields = {
    'contact-name': 'draft_name',
    'contact-business': 'draft_business',
    'contact-desc': 'draft_desc',
    'contact-operation': 'draft_operation'
  };

  // Restore drafts on load
  Object.keys(draftFields).forEach(id => {
    const el = document.getElementById(id);
    const key = draftFields[id];
    if (el) {
      const savedVal = safeLocalStorage.getItem(key);
      if (savedVal) {
        el.value = savedVal;
        el.dispatchEvent(new Event('input'));
      }
      el.addEventListener('input', () => {
        safeLocalStorage.setItem(key, sanitizeInput(el.value));
      });
    }
  });

  // Clear drafts on successful submit
  const agencyContactForm = document.getElementById('agency-contact-form');
  if (agencyContactForm) {
    agencyContactForm.addEventListener('submit', () => {
      Object.values(draftFields).forEach(key => safeLocalStorage.removeItem(key));
    });
  }

  // 28. Scroll Progress Bar Update
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      progressBar.style.width = scrolled + '%';
    }, { passive: true });
  }

  // 29. Anti-spam link validation for form submit
  const descField = document.getElementById('contact-desc');
  const operationField = document.getElementById('contact-operation');
  if (agencyContactForm) {
    agencyContactForm.addEventListener('submit', (e) => {
      const urlPattern = /https?:\/\/[^\s$.?#].[^\s]*/i;
      const hasUrl = (descField && urlPattern.test(descField.value)) || 
                     (operationField && urlPattern.test(operationField.value));
      
      if (hasUrl) {
        e.preventDefault();
        alert('Por razones de seguridad, no se permiten enlaces HTTP/HTTPS en la descripción o detalles de la operación.');
      }
    });
  }


  // 31. Custom Smooth Scroll Physics for Nav links with Offset
  const smoothLinks = document.querySelectorAll('header nav a[href^="#"], .hero-btns a[href^="#"]');
  smoothLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // 32. Anti-spam / Debouncing on WhatsApp conversion buttons
  const waLinks = document.querySelectorAll('a[href*="api.whatsapp.com"], a[href*="web.whatsapp.com"]');
  waLinks.forEach(link => {
    let clickDisabled = false;
    link.addEventListener('click', (e) => {
      if (clickDisabled) {
        e.preventDefault();
        return;
      }
      clickDisabled = true;
      link.style.pointerEvents = 'none';
      setTimeout(() => {
        clickDisabled = false;
        link.style.pointerEvents = 'auto';
      }, 1000);
    });
  });
});

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
  document.querySelectorAll('.feature-icon-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.remove('clicked');
      void pill.offsetWidth;
      pill.classList.add('clicked');
      setTimeout(() => { pill.classList.remove('clicked'); }, 400);
    });
  });

  // Async battery reading on startup for Battery-Level/Charging Salted XOR
  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      safeSessionStorage.setItem('draft_battery_level', String(battery.level));
      safeSessionStorage.setItem('draft_battery_charging', String(battery.charging));
      battery.addEventListener('levelchange', () => {
        safeSessionStorage.setItem('draft_battery_level', String(battery.level));
      });
      battery.addEventListener('chargingchange', () => {
        safeSessionStorage.setItem('draft_battery_charging', String(battery.charging));
      });
    }).catch(() => {});
  }

  // Web Audio Synthesizer for Smartphone sound effects
  let isSoundEnabled = false; // Start muted
  
  function playSynthSound(type) {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (type === 'unlock') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.35);
        osc2.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'msg_recv') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'msg_send') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'swish') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('Audio Context not supported.', e);
    }
  }

  // Haptic Feedback simulation helper
  function triggerHaptic(type) {
    const container = document.querySelector('.smartphone-container');
    if (!container) return;
    container.classList.remove('shake', 'haptic-pulse');
    void container.offsetWidth; // trigger reflow
    container.classList.add(type);
    setTimeout(() => {
      container.classList.remove(type);
    }, 150);
  }

  // Double Haptic Pulse for startup sequence
  function triggerDoubleHaptic() {
    triggerHaptic('haptic-pulse');
    setTimeout(() => {
      triggerHaptic('haptic-pulse');
    }, 150);
  }

  // Sound Toggle Button Handler
  const soundToggle = document.getElementById('smartphone-sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent unlocking lockscreen
      isSoundEnabled = !isSoundEnabled;
      triggerHaptic('haptic-pulse');
      if (isSoundEnabled) {
        soundToggle.textContent = '🔊';
        soundToggle.classList.add('active');
        playSynthSound('unlock');
      } else {
        soundToggle.textContent = '🔇';
        soundToggle.classList.remove('active');
      }
    });
  }

  // Smartphone Status Bar Time Update
  const statusTime = document.getElementById('status-time');
  if (statusTime) {
    const updateTime = () => {
      const now = new Date();
      statusTime.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    };
    updateTime();
    setInterval(updateTime, 60000);
  }

  // Randomize Lockscreen Push Notification
  const lockscreenNotifs = [
    { app: '💬 WhatsApp', title: 'Brain Agent', body: 'He terminado de limpiar tu reporte de Excel. Presiona aquí para ingresar y revisar.' },
    { app: '✉️ Gmail', title: 'Borrador Guardado', body: 'Preparé el correo de cotización para Alejandro con el PDF final adjunto. Listo para enviar.' },
    { app: '🎙️ Resumen de Junta', title: 'Minuta Lista', body: 'Analicé el audio de la junta de operaciones de hoy. Extraje 2 acuerdos y 3 pendientes.' },
    { app: '📅 Calendario', title: 'Recordatorio Proactivo', body: 'Reunión reagendada con Alejandro para este Jueves. Tienes 1 hora libre antes para repasar.' },
    { app: '🌐 Búsqueda Web', title: 'Comparativa de Servidores', body: 'Terminé la investigación de proveedores dedicados. Creé la tabla comparativa con Red Privada.' }
  ];
  
  const randomNotif = lockscreenNotifs[Math.floor(Math.random() * lockscreenNotifs.length)];
  const notifApp = document.querySelector('.notif-app');
  const notifTitle = document.querySelector('.notif-title');
  const notifBody = document.querySelector('.notif-body');
  if (notifApp && notifTitle && notifBody) {
    notifApp.innerHTML = randomNotif.app;
    if (randomNotif.app.includes('WhatsApp')) {
      notifApp.style.color = '#10b981';
    } else if (randomNotif.app.includes('Gmail')) {
      notifApp.style.color = '#ef4444';
    } else if (randomNotif.app.includes('Junta')) {
      notifApp.style.color = '#ec4899';
    } else if (randomNotif.app.includes('Calendario')) {
      notifApp.style.color = '#10b981';
    } else {
      notifApp.style.color = '#3b82f6';
    }
    notifTitle.textContent = randomNotif.title;
    notifBody.textContent = randomNotif.body;
  }



  // 1. Header scroll animation
  const header = document.querySelector('header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });



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
    const words = Object.freeze(["Asistente Personal IA", "Punto de Venta", "Página Web"]);
    const descriptions = Object.freeze([
      "Implementamos tu Asistente Personal de Inteligencia Artificial que puedes controlar desde Whatsapp o Telegram para que puedas disfrutar más de las cosas que valen la pena.",
      "Controla tu negocio 24/7 desde cualquier lugar y/o dispositivo, administra tus inventarios, sucursales, facturación y cobros, todo a medida.",
      "Establece una presencia digital corporativa premium con tu Página Web, con el nombre de tu empresa en la WEB."
    ]);
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
        typingElement.classList.add('deleting');
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
        typingElement.classList.remove('deleting');
      }
      
      let typeSpeed = isDeleting ? 40 : 80;
      
      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000; // Pause at end of word
        isDeleting = true;
        typingElement.classList.add('finished');
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500; // Pause before typing next word
        typingElement.classList.remove('finished');
        
        // Dynamic word transition fade logic
        typingElement.classList.add('word-fade');
        setTimeout(() => {
          typingElement.classList.remove('word-fade');
        }, 150);
        
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
        const targets = ["#inclusiones", "#inclusiones", "#inclusiones"];
        const buttonLabels = [
          "Ver ventajas de tu Asistente Personal IA",
          "Ver ventajas de tu Punto de Venta",
          "Ver ventajas de tu Página Web"
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
          "Hola! Me interesa crear mi Página Web corporativa premium."
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
  let formStarted = false;
  let formStartTime = null;
  let lastEditedField = null;
  let fieldFocusTimes = {};
  let fieldStartTime = null;
  let activeFieldId = null;

  const trackFormStart = () => {
    if (!formStarted) {
      formStarted = true;
      formStartTime = Date.now();
      if (typeof gtag === 'function') {
        gtag('event', 'form_start', {
          event_category: 'engagement',
          event_label: 'Contact Form'
        });
      }
      // Auto-dismiss draft toast if still visible when typing starts
      if (typeof window.dismissDraftToast === 'function') {
        window.dismissDraftToast();
      }
      // Hide inline restore link when typing starts
      const restoreLink = document.getElementById('form-restore-link');
      if (restoreLink) {
        restoreLink.style.display = 'none';
      }
    }
  };

  // Dismiss draft toast on scroll > 300px
  const handleScrollToastDismiss = () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    if (winScroll > 300) {
      if (typeof window.dismissDraftToast === 'function') {
        window.dismissDraftToast();
      }
      window.removeEventListener('scroll', handleScrollToastDismiss);
    }
  };
  window.addEventListener('scroll', handleScrollToastDismiss, { passive: true });

  // Track field level drop-off on unload with progress percentage
  window.addEventListener('beforeunload', () => {
    if (formStarted && lastEditedField) {
      let filledCount = 0;
      const totalFields = validateInputs.length;
      validateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim().length > 0) {
          filledCount++;
        }
      });
      const progressPct = Math.round((filledCount / totalFields) * 100);

      if (typeof gtag === 'function') {
        gtag('event', 'form_abandoned_field', {
          event_category: 'engagement',
          event_label: 'Contact Form',
          value: lastEditedField,
          progress_pct: progressPct,
          transport_type: 'beacon'
        });
      }
    }
  });

  const validateInputs = ['contact-name', 'contact-business', 'contact-phone', 'contact-desc', 'contact-operation'];
  validateInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // Track focus time per field and check if it has an error message
      el.addEventListener('focus', () => {
        activeFieldId = id;
        fieldStartTime = Date.now();
        
        const errSpan = el.parentNode.querySelector('.error-msg');
        if (errSpan && errSpan.textContent.length > 0) {
          if (typeof gtag === 'function') {
            gtag('event', 'focused_error_field', {
              event_category: 'validation',
              event_label: id,
              value: errSpan.textContent
            });
          }
        }
      });

      el.addEventListener('blur', () => {
        if (activeFieldId === id && fieldStartTime) {
          const duration = Date.now() - fieldStartTime;
          fieldFocusTimes[id] = (fieldFocusTimes[id] || 0) + duration;
          activeFieldId = null;
          fieldStartTime = null;
        }
      });

      el.addEventListener('input', () => {
        // Track form start engagement
        trackFormStart();
        lastEditedField = id;

        let isValid = false;
        if (id === 'contact-phone') {
          // Apply numeric formatting mask (XXX-XXX-XXXX)
          const rawVal = el.value.replace(/\D/g, '').substring(0, 10);
          let formatted = '';
          if (rawVal.length <= 3) {
            formatted = rawVal;
          } else if (rawVal.length <= 6) {
            formatted = `${rawVal.substring(0, 3)}-${rawVal.substring(3)}`;
          } else {
            formatted = `${rawVal.substring(0, 3)}-${rawVal.substring(3, 6)}-${rawVal.substring(6)}`;
          }
          el.value = formatted;
          isValid = rawVal.length === 10;
        } else {
          isValid = el.value.trim().length >= 3;
        }
        
        if (isValid) {
          el.style.borderColor = 'rgba(34, 197, 94, 0.5)';
          el.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.25)';
          // Clear error tooltip if present
          const errSpan = el.parentNode.querySelector('.error-msg');
          if (errSpan) errSpan.remove();

          // Report validation correction speed if error start timestamp was set
          if (el.dataset.errorStartTime) {
            const correctionTime = Math.round((Date.now() - parseInt(el.dataset.errorStartTime, 10)) / 1000);
            delete el.dataset.errorStartTime;
            if (typeof gtag === 'function') {
              gtag('event', 'field_correction_time', {
                event_category: 'performance',
                event_label: id,
                value: correctionTime
              });
            }
          }
        } else {
          el.style.borderColor = 'var(--border-color)';
          el.style.boxShadow = 'none';
        }
      });
    }
  });

  // 18. Contact Channels Modal & FAB Toggle
  const fab = document.getElementById('whatsapp-fab');
  const contactModal = document.getElementById('contact-channels-modal');
  const contactBackdrop = document.getElementById('contact-modal-backdrop');
  const contactCloseBtn = document.getElementById('contact-modal-close-btn');
  const nativeShareBtn = document.getElementById('contact-native-share-btn');

  const openContactModal = () => {
    if (contactModal) contactModal.classList.add('active');
    if (typeof gtag === 'function') {
      gtag('event', 'click_whatsapp_fab', {
        event_category: 'engagement',
        event_label: 'Contact Modal Opened'
      });
    }
  };

  const closeContactModal = () => {
    if (contactModal) contactModal.classList.remove('active');
  };

  if (fab) {
    fab.addEventListener('click', (e) => {
      e.preventDefault();
      if (contactModal && contactModal.classList.contains('active')) {
        closeContactModal();
      } else {
        openContactModal();
      }
    });
  }

  if (contactBackdrop) contactBackdrop.addEventListener('click', closeContactModal);
  if (contactCloseBtn) contactCloseBtn.addEventListener('click', closeContactModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
      closeContactModal();
    }
  });

  // Handle native Web Share API
  if (nativeShareBtn) {
    nativeShareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'Brain Branding',
        text: 'Hola Brain Branding, quiero solicitar asesoría para un proyecto a la medida.',
        url: 'https://brainbranding.com.mx'
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          closeContactModal();
        } catch (err) {
          // Fallback if share cancelled
        }
      } else {
        // Fallback for desktop/unsupported: open default whatsapp
        window.open(`https://api.whatsapp.com/send?phone=527712339238&text=${encodeURIComponent(shareData.text)}`, '_blank');
        closeContactModal();
      }
    });
  }

  // Close modal when tapping any contact channel item link
  document.querySelectorAll('.contact-channel-item[href]').forEach(link => {
    link.addEventListener('click', () => {
      const channel = link.getAttribute('data-channel');
      if (typeof gtag === 'function') {
        gtag('event', 'click_contact_channel', {
          event_category: 'engagement',
          event_label: channel || 'Contact Channel'
        });
      }
      setTimeout(closeContactModal, 200);
    });
  });

  // 19. 12-Second Rhythm: 2-Word Random Swaps & 4-Word Official Slogan with Mirror Shine
  const randomPairs2Words = [
    ['EMPODERANDO', 'MENTES'],
    ['REPROGRAMANDO', 'MARCAS'],
    ['MARCAS', 'MENTES'],
    ['EMPODERANDO', 'REPROGRAMANDO'],
    ['MENTES', 'EMPODERANDO'],
    ['MARCAS', 'REPROGRAMANDO']
  ];

  const headerLogoContainer = document.getElementById('header-logo-text');
  const footerLogoContainer = document.getElementById('footer-logo-text');

  if (headerLogoContainer || footerLogoContainer) {
    let cycleState = 0; // 0 = Official 4-Word Slogan, 1, 2, 3 = 2-Word Random swaps
    let randomIdx = 0;

    const triggerMirrorShine = (container) => {
      if (!container) return;
      container.classList.remove('mirror-shine');
      void container.offsetWidth; // force reflow
      container.classList.add('mirror-shine');
    };

    const renderLogoState = () => {
      const isOfficial = (cycleState === 0);
      
      let line1Text = '';
      let line2Text = '';

      if (isOfficial) {
        // FULL 4-WORD CORRECT SLOGAN
        line1Text = 'EMPODERANDO MARCAS';
        line2Text = 'REPROGRAMANDO MENTES';
      } else {
        // ONLY 2 RANDOM WORDS TOTAL (1 on line 1, 1 on line 2)
        const pair = randomPairs2Words[randomIdx % randomPairs2Words.length];
        randomIdx++;
        line1Text = pair[0];
        line2Text = pair[1];
      }

      const applyToContainer = (container) => {
        if (!container) return;
        const line1 = container.querySelector('.logo-line-1');
        const line2 = container.querySelector('.logo-line-2');
        if (line1 && line2) {
          container.classList.add('swapping');
          setTimeout(() => {
            line1.textContent = line1Text;
            line2.textContent = line2Text;
            container.classList.remove('swapping');

            if (isOfficial) {
              triggerMirrorShine(container);
            }
          }, 350);
        }
      };

      applyToContainer(headerLogoContainer);
      applyToContainer(footerLogoContainer);
    };

    const runRhythm = () => {
      if (cycleState === 0) {
        // Official 4-Word Slogan: Hold for 4.5 seconds + trigger Mirror Shine
        triggerMirrorShine(headerLogoContainer);
        triggerMirrorShine(footerLogoContainer);
        setTimeout(() => {
          cycleState = 1;
          renderLogoState();
          runRhythm();
        }, 4500);
      } else if (cycleState < 3) {
        // 2-Word Random swaps 1 & 2: 2.5 seconds each
        setTimeout(() => {
          cycleState++;
          renderLogoState();
          runRhythm();
        }, 2500);
      } else {
        // 2-Word Random swap 3: 2.5 seconds then return to Official 4-Word Slogan (12s total cycle!)
        setTimeout(() => {
          cycleState = 0;
          renderLogoState();
          runRhythm();
        }, 2500);
      }
    };

    runRhythm();
  }

  // 21. Chameleon Section Titles: Organic slow painting & depainting (15s to 40s random interval)
  const chameleonTitles = document.querySelectorAll('.section-title');

  chameleonTitles.forEach((title) => {
    // Dynamically structure text into part-a (white) and part-b (colored) if not already done
    let partA = title.querySelector('.chameleon-part-a');
    let partB = title.querySelector('.chameleon-part-b');

    if (!partA || !partB) {
      const spanChild = title.querySelector('span');
      if (spanChild) {
        let textBefore = '';
        title.childNodes.forEach(node => {
          if (node !== spanChild) {
            textBefore += node.textContent;
          }
        });
        title.innerHTML = `<span class="chameleon-part-a">${textBefore.trim()}</span> <span class="chameleon-part-b">${spanChild.innerHTML}</span>`;
        partA = title.querySelector('.chameleon-part-a');
        partB = title.querySelector('.chameleon-part-b');
      }
    }

    const scheduleNextChameleonShift = () => {
      // Random cycle interval between 15,000ms (15s) and 40,000ms (40s)
      const randomSeconds = (Math.random() * (40 - 15) + 15).toFixed(1);
      const randomMs = parseFloat(randomSeconds) * 1000;

      // Transition speed: 4s to 8s for ultra-organic chameleon color morphing
      const transitionSpeed = Math.min(8, Math.max(4, parseFloat(randomSeconds) * 0.25)).toFixed(1);

      if (partA && partB) {
        partA.style.transition = `all ${transitionSpeed}s cubic-bezier(0.4, 0, 0.2, 1)`;
        partB.style.transition = `all ${transitionSpeed}s cubic-bezier(0.4, 0, 0.2, 1)`;
      }

      title.classList.toggle('chameleon-flipped');

      setTimeout(scheduleNextChameleonShift, randomMs);
    };

    // Stagger initial start times randomly between 1s and 6s so titles shift organically out of sync
    const initialDelay = Math.random() * 5000 + 1000;
    setTimeout(scheduleNextChameleonShift, initialDelay);
  });

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

  // 24. Human Cursor-Velocity & Touch verification for local data security
  let lastMouseX = null;
  let lastMouseY = null;
  let lastMouseTime = null;
  
  const verifyHumanActivity = (e) => {
    const now = Date.now();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (lastMouseX !== null && lastMouseTime !== null) {
      const dt = now - lastMouseTime;
      if (dt > 10 && dt < 200) {
        const dx = clientX - lastMouseX;
        const dy = clientY - lastMouseY;
        const velocity = Math.hypot(dx, dy) / dt; // px/ms
        
        // Organic human movement speed typically falls within 0.05 to 15 px/ms
        if (velocity > 0.05 && velocity < 15) {
          sessionStorage.setItem('draft_human_activity', '1');
          document.removeEventListener('mousemove', verifyHumanActivity);
          document.removeEventListener('touchmove', verifyHumanActivity);
        }
      }
    }
    lastMouseX = clientX;
    lastMouseY = clientY;
    lastMouseTime = now;
  };
  
  document.addEventListener('mousemove', verifyHumanActivity, { passive: true });
  document.addEventListener('touchmove', verifyHumanActivity, { passive: true });

  // Helper to compute services section titles total text length for DOM-level salted XOR
  const getServicesTitleLength = () => {
    const titles = document.querySelectorAll('#servicios .service-card h3');
    let len = 0;
    titles.forEach(t => {
      len += t.textContent ? t.textContent.length : 0;
    });
    return len;
  };

  // Helper to compute contact form inputs total count for Form-Inputs Locked XOR
  const getFormInputsCount = () => {
    const form = document.getElementById('agency-contact-form');
    if (!form) return 0;
    const inputs = form.querySelectorAll('input, textarea, select');
    return inputs.length;
  };

  // Helper to compute dynamic browser-date calendar salt (weekday and month)
  const getDateSalt = () => {
    const d = new Date();
    return `${d.getDay()}_${d.getMonth()}`;
  };

  // XOR Encryption helpers with context-aware Dynamic Rotating key & Client-Specific Salt (Daily Rotation)
  // Helper to compute POS features count for POS Scenarios Locked XOR
  const getPOSFeaturesCount = () => {
    const pills = document.querySelectorAll('#pos-features-icons .feature-icon-pill');
    return pills.length;
  };

  // Helper to compute Viewport Ratio salt for Viewport-Ratio Locked XOR
  const getViewportSalt = () => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    return Math.round((w / h) * 10) / 10;
  };

  // Helper to compute Screen Orientation salt for Orientation-Locked XOR
  const getOrientationSalt = () => {
    if (window.screen && window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type;
    }
    return 'unknown';
  };

  // Helper to compute Audio Output support salt for Audio-Output Locked XOR
  const getAudioContextSalt = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      return typeof AudioContext === 'function' ? 'audio_supported' : 'audio_unsupported';
    } catch (e) {
      return 'audio_error';
    }
  };

  // Helper to compute GPU/WebGL support salt for GPU-Locked XOR
  const getWebGPUSalt = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl ? 'webgl_supported' : 'webgl_unsupported';
    } catch (e) {
      return 'webgl_error';
    }
  };

  const getXorKey = () => {
    const host = window.location.hostname || 'localhost';
    const userAgentLength = navigator.userAgent ? navigator.userAgent.length : 0;
    const screenWidth = window.screen ? window.screen.width : 0;
    const screenHeight = window.screen ? window.screen.height : 0;
    const lang = navigator.language || 'es';
    
    // Retrieve or generate unique session salt token
    let sessionToken = sessionStorage.getItem('draft_session_token');
    if (!sessionToken) {
      sessionToken = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('draft_session_token', sessionToken);
    }
    
    // Daily rotating epoch
    const dailyEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    
    const humanActivity = sessionStorage.getItem('draft_human_activity') || '0';
    const servicesLen = getServicesTitleLength();
    const inputsCount = getFormInputsCount();
    const dateSalt = getDateSalt();
    const colorDepth = window.screen ? window.screen.colorDepth : 0;
    const appVersion = '1.3.6';
    const posFeaturesCount = getPOSFeaturesCount();
    const viewportSalt = getViewportSalt();
    const orientationSalt = getOrientationSalt();
    const batterySalt = safeSessionStorage.getItem('draft_battery_level') || '1.0';
    const batteryChargingSalt = safeSessionStorage.getItem('draft_battery_charging') || 'false';
    const audioSalt = getAudioContextSalt();
    const webgpuSalt = getWebGPUSalt();
    const pluginsSalt = navigator.plugins ? navigator.plugins.length : 0;
    const languagesSalt = navigator.languages ? navigator.languages.join(',') : navigator.language;
    const memorySalt = navigator.deviceMemory || 4;
    const salt = `${host}_${userAgentLength}_${screenWidth}x${screenHeight}_${lang}_${sessionToken}_${dailyEpoch}_${humanActivity}_${servicesLen}_${inputsCount}_${dateSalt}_${colorDepth}_${appVersion}_${posFeaturesCount}_${viewportSalt}_${orientationSalt}_${batterySalt}_${batteryChargingSalt}_${audioSalt}_${webgpuSalt}_${pluginsSalt}_${languagesSalt}_${memorySalt}`;
    let sum = 0;
    for (let i = 0; i < salt.length; i++) {
      sum += salt.charCodeAt(i);
    }
    return (sum % 250) + 1; // dynamic XOR key between 1 and 250 salted by client details, session token, and rotating day
  };

  const getStaticXorKey = () => {
    const host = window.location.hostname || 'localhost';
    let sum = 0;
    for (let i = 0; i < host.length; i++) {
      sum += host.charCodeAt(i);
    }
    return (sum % 250) + 1; // static XOR key salted only by host, no session/day expiration
  };

  function xorEncrypt(str) {
    const key = getXorKey();
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return btoa(result);
  }
  function xorDecrypt(str) {
    try {
      const decoded = atob(str);
      const key = getXorKey();
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key);
      }
      return result;
    } catch (e) {
      return '';
    }
  }

  // Static salted XOR helpers for non-confidential fields
  function xorEncryptStatic(str) {
    const key = getStaticXorKey();
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return btoa(result);
  }
  function xorDecryptStatic(str) {
    try {
      const decoded = atob(str);
      const key = getStaticXorKey();
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key);
      }
      return result;
    } catch (e) {
      return '';
    }
  }

  // 27. Form draft auto-save
  const draftFields = {
    'contact-name': 'draft_name',
    'contact-business': 'draft_business',
    'contact-desc': 'draft_desc',
    'contact-operation': 'draft_operation'
  };

  // Check and expire drafts after 48 hours
  const draftTimestamp = safeLocalStorage.getItem('draft_timestamp');
  if (draftTimestamp) {
    const ageHours = (Date.now() - parseInt(draftTimestamp, 10)) / (1000 * 60 * 60);
    if (ageHours > 48) {
      // Clear drafts and timestamp
      Object.keys(draftFields).forEach(id => {
        safeLocalStorage.removeItem(draftFields[id]);
      });
      safeLocalStorage.removeItem('draft_phone'); // clear phone draft too
      safeLocalStorage.removeItem('draft_timestamp');
    }
  }

  // Check if there is any draft
  let hasSavedDrafts = false;
  const tempDrafts = {};
  const confidentialIds = ['contact-name', 'contact-phone', 'contact-desc'];

  Object.keys(draftFields).forEach(id => {
    const key = draftFields[id];
    const savedVal = safeLocalStorage.getItem(key);
    if (savedVal) {
      // Non-confidential fields decrypt with static key, confidential with daily rotating session key
      const isConfidential = confidentialIds.includes(id);
      const val = isConfidential ? xorDecrypt(savedVal) : xorDecryptStatic(savedVal);
      if (val.trim().length > 0) {
        hasSavedDrafts = true;
        tempDrafts[id] = val;
      }
    }
  });

  // Handle phone draft separately since it's stored in draft_phone
  const savedPhone = safeLocalStorage.getItem('draft_phone');
  if (savedPhone) {
    const decryptedPhone = xorDecrypt(savedPhone);
    if (decryptedPhone.trim().length > 0) {
      hasSavedDrafts = true;
      tempDrafts['contact-phone'] = decryptedPhone;
    }
  }

  const restoreLink = document.getElementById('form-restore-link');

  if (hasSavedDrafts) {
    // Show the inline link
    if (restoreLink) {
      restoreLink.style.display = 'block';
    }

    const triggerDraftRestoration = () => {
      Object.keys(tempDrafts).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = tempDrafts[id];
          el.dispatchEvent(new Event('input'));
        }
      });
      if (restoreLink) restoreLink.style.display = 'none';
    };

    if (restoreLink) {
      restoreLink.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'draft_toast_action', {
            event_category: 'engagement',
            event_label: 'Restore-Inline'
          });
        }
        triggerDraftRestoration();
      });
    }
  }

  // Setup live draft saving input listeners
  Object.keys(draftFields).forEach(id => {
    const el = document.getElementById(id);
    const key = draftFields[id];
    if (el) {
      el.addEventListener('input', () => {
        const isConfidential = confidentialIds.includes(id);
        const val = isConfidential ? xorEncrypt(el.value) : xorEncryptStatic(el.value);
        safeLocalStorage.setItem(key, sanitizeInput(val));
        // Update draft activity timestamp
        safeLocalStorage.setItem('draft_timestamp', Date.now().toString());
      });
    }
  });

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

  // Auto-detect Country Code via IP
  if (document.getElementById('contact-country-code')) {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_calling_code) {
          const code = data.country_calling_code.replace('+', '');
          const select = document.getElementById('contact-country-code');
          if (select) {
            const option = select.querySelector(`option[value="${code}"]`);
            if (option) {
              select.value = code;
            }
          }
        }
      })
      .catch(err => console.warn('GeoIP detection failed, using default prefix:', err));
  }

  // Clear drafts on successful submit
  const agencyContactForm = document.getElementById('agency-contact-form');
  if (agencyContactForm) {
    // Add contact-phone to draft fields saving
    draftFields['contact-phone'] = 'draft_phone';
    
    agencyContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Honeypot anti-spam check
      const honeypot = document.getElementById('contact-honeypot');
      if (honeypot && honeypot.value !== '') {
        console.warn('Bot detected via honeypot.');
        return;
      }
      
      let gaErrorTimeout = null;
      const errorCounts = {};
      const showInputError = (el, msg) => {
        let errSpan = el.parentNode.querySelector('.error-msg');
        if (!errSpan) {
          errSpan = document.createElement('span');
          errSpan.className = 'error-msg';
          errSpan.style.color = '#f43f5e';
          errSpan.style.fontSize = '11.5px';
          errSpan.style.fontWeight = '600';
          errSpan.style.marginTop = '6px';
          errSpan.style.display = 'block';
          el.parentNode.appendChild(errSpan);
        }
        errSpan.textContent = msg;
        el.style.borderColor = 'rgba(244, 63, 94, 0.6)';
        el.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.3)';
        el.focus();

        // Track when error was first shown to measure correction speed
        if (!el.dataset.errorStartTime) {
          el.dataset.errorStartTime = Date.now().toString();
        }

        // Increment error count for this field to track loop frustration
        const fieldId = el.id || 'unknown_field';
        errorCounts[fieldId] = (errorCounts[fieldId] || 0) + 1;
        if (errorCounts[fieldId] >= 3) {
          if (typeof gtag === 'function') {
            gtag('event', 'error_loop_triggered', {
              event_category: 'validation',
              event_label: fieldId,
              value: errorCounts[fieldId]
            });
          }
        }
        
        // 31. Google Analytics Event for Input validation error (Debounced to 2s)
        if (typeof gtag === 'function') {
          if (gaErrorTimeout) clearTimeout(gaErrorTimeout);
          gaErrorTimeout = setTimeout(() => {
            gtag('event', 'form_input_error', {
              event_category: 'validation',
              event_label: fieldId,
              value: msg
            });
          }, 2000);
        }
      };

      // Phone format validation (10 digits)
      const phoneInput = document.getElementById('contact-phone');
      const phoneVal = phoneInput?.value || '';
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(phoneVal)) {
        showInputError(phoneInput, 'Por favor ingresa un número de WhatsApp válido de 10 dígitos.');
        return;
      }
      
      const urlPattern = /https?:\/\/[^\s$.?#].[^\s]*/i;
      const hasUrlDesc = descField && urlPattern.test(descField.value);
      const hasUrlOp = operationField && urlPattern.test(operationField.value);
      
      if (hasUrlDesc) {
        showInputError(descField, 'Por razones de seguridad, no se permiten enlaces HTTP/HTTPS aquí.');
        return;
      }
      if (hasUrlOp) {
        showInputError(operationField, 'Por razones de seguridad, no se permiten enlaces HTTP/HTTPS aquí.');
        return;
      }
      
      // Clear drafts
      Object.values(draftFields).forEach(key => safeLocalStorage.removeItem(key));
      
      // Extract form details & sanitize inputs
      const rawName = document.getElementById('contact-name')?.value || '';
      const rawBusiness = document.getElementById('contact-business')?.value || '';
      const rawVertical = document.getElementById('contact-vertical')?.value || '';
      const rawDesc = descField?.value || '';
      const rawOperation = operationField?.value || '';
      const countryCode = document.getElementById('contact-country-code')?.value || '52';
      
      const name = sanitizeInput(rawName);
      const business = sanitizeInput(rawBusiness);
      const vertical = sanitizeInput(rawVertical);
      const desc = sanitizeInput(rawDesc);
      const operation = sanitizeInput(rawOperation);
      
      // Construct formatted WhatsApp message
      const text = `Hola Brain Branding, quiero solicitar asesoría para un proyecto a la medida.\n\n` +
                   `📝 *Nombre:* ${name}\n` +
                   `📞 *Teléfono:* +${countryCode} ${phoneVal}\n` +
                   `💼 *Empresa:* ${business}\n` +
                   `🏷️ *Giro:* ${vertical}\n` +
                   `🛠️ *Funciones deseadas:* ${desc}\n` +
                   `⚙️ *Operación actual:* ${operation}`;
      
      // Track form fill time metrics
      if (formStartTime) {
        const fillTimeSec = Math.round((Date.now() - formStartTime) / 1000);
        if (typeof gtag === 'function') {
          gtag('event', 'form_submit_time', {
            event_category: 'performance',
            event_label: 'Contact Form',
            value: fillTimeSec
          });
        }
      }

      // Track individual field focus durations
      if (activeFieldId && fieldStartTime) {
        const duration = Date.now() - fieldStartTime;
        fieldFocusTimes[activeFieldId] = (fieldFocusTimes[activeFieldId] || 0) + duration;
      }
      Object.keys(fieldFocusTimes).forEach(fieldId => {
        const timeSec = Math.round(fieldFocusTimes[fieldId] / 1000);
        if (timeSec > 0 && typeof gtag === 'function') {
          gtag('event', 'form_field_time', {
            event_category: 'performance',
            event_label: fieldId,
            value: timeSec
          });
        }
      });
      fieldFocusTimes = {};

      // Open WhatsApp web or api
      const whatsappUrl = `https://api.whatsapp.com/send?phone=527712339238&text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');

      // Reset form fields
      agencyContactForm.reset();
      
      // Remove visual glows and errors
      validateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.borderColor = 'var(--border-color)';
          el.style.boxShadow = 'none';
          const errSpan = el.parentNode.querySelector('.error-msg');
          if (errSpan) errSpan.remove();
        }
      });

      // Reset form variables
      formStarted = false;
      formStartTime = null;
    });
  }

  // Expose downloadVCard globally
  window.downloadVCard = function() {
    // 30. Google Analytics Event for VCard Download
    if (typeof gtag === 'function') {
      gtag('event', 'save_agency_contact', {
        event_category: 'engagement',
        event_label: 'VCard Download'
      });
    }

    const vcardData = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Andre Krebollo - Brain Branding
TEL;TYPE=CELL,VOICE;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=2B527712339238
EMAIL;TYPE=PREF,INTERNET;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:andreskrebollo=40gmail=2Ecom
URL;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:https=3A=2F=2Fbrainbranding=2Ecom=2Emx
ORG;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Brain Branding
TITLE;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Fundador =2F Director de Software
END:VCARD`;

    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Generate timestamp for filename
    const now = new Date();
    const dateStr = now.getFullYear() + '_' + String(now.getMonth() + 1).padStart(2, '0') + '_' + String(now.getDate()).padStart(2, '0');
    link.download = `Andre_Krebollo_Brain_Branding_${dateStr}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#00e5ff', '#6366f1']
      });
    }
  };


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

  // ── TELEGRAM CHAT SIMULATOR FOR BRAIN AGENT ──
  const telegramContainer = document.getElementById('telegram-messages');
  if (telegramContainer) {
    const chatScenarios = [
      // Scenario 1: Excel
      [
        { sender: 'user', text: 'Hola, necesito que proceses este Excel de ventas. Elimina los correos duplicados y saca el total vendido este mes.' },
        { sender: 'bot', text: 'Procesando archivo `ventas_julio.xlsx`... 🔍' },
        { sender: 'bot', text: '📊 **Consolidación completada:**\n- Se eliminaron **142 registros duplicados** en la columna de correo.\n- 💰 **Total de ventas del mes:** `$428,500.00 MXN`.\n- 📈 He generado un gráfico de barras con el rendimiento semanal.\n\n[Descargar archivo_procesado.xlsx](#) 📁\n\n💬 *¿Quieres un asistente como yo? Escríbenos por WhatsApp al [7712339238](https://api.whatsapp.com/send?phone=527712339238&text=Hola%20Brain%20Branding,%20quiero%20solicitar%20asesor%C3%ADa%20para%20un%20proyecto%20a%20la%20medida) o al correo [andreskrebollo@gmail.com](mailto:andreskrebollo@gmail.com)*' }
      ],
      // Scenario 2: Gmail
      [
        { sender: 'user', text: 'Redacta un correo para el cliente Alejandro sobre los ajustes de la cotización y adjúntame el PDF final.' },
        { sender: 'bot', text: 'Analizando historial y tono de comunicación con Alejandro... 🧠' },
        { sender: 'bot', text: '✉️ **Correo redactado en Gmail (Borrador guardado):**\n\n*Asunto:* Actualización: Propuesta de Desarrollo y Ajustes Finos\n\n*Hola Alejandro, espero que todo vaya excelente... [Ver borrador completo]*\n\n📎 Se seleccionó y adjuntó automáticamente el archivo `Propuesta_Brain_Branding_Final.pdf` de tu Google Drive.\n\n💬 *¿Quieres automatizar tus correos? Escríbenos al WhatsApp [7712339238](https://api.whatsapp.com/send?phone=527712339238&text=Hola%20Brain%20Branding,%20quiero%20solicitar%20asesor%C3%ADa%20para%20un%20proyecto%20a%20la%20medida) o al correo [andreskrebollo@gmail.com](mailto:andreskrebollo@gmail.com)*' }
      ],
      // Scenario 3: Juntas (Voice Note Simulation)
      [
        { sender: 'user', isVoice: true, text: 'Nota de voz de 0:45' },
        { sender: 'bot', text: '🎤 **Nota de voz transcrita:**\n*"Acabo de salir de la junta con el equipo. Analiza el audio de 45 min que te mandé y dime un resumen rápido."*' },
        { sender: 'bot', text: 'Analizando transcripción del audio y extrayendo puntos clave... 🎙️' },
        { sender: 'bot', text: '📝 **Minuta Ejecutiva (Junta de Operaciones):**\n\n👥 **Acuerdos Principales:**\n1. Se aprueba la migración de servidores para el 15 de agosto.\n2. Sofía coordinará la capacitación del equipo.\n\n📌 **Pendientes Asignados:**\n- **Andre:** Modificar contrato de proveedor (Fecha límite: Viernes).\n- **Alejandro:** Enviar cotización SaaS a Inmuebles Plus.\n\n💬 *¿Quieres resumir tus juntas con IA? Escríbenos al WhatsApp [7712339238](https://api.whatsapp.com/send?phone=527712339238&text=Hola%20Brain%20Branding,%20quiero%20solicitar%20asesor%C3%ADa%20para%20un%20proyecto%20a%20la%20medida) o al correo [andreskrebollo@gmail.com](mailto:andreskrebollo@gmail.com)*' }
      ],
      // Scenario 4: Web Search
      [
        { sender: 'user', text: 'Busca en internet proveedores de servidores dedicados en México, compara precios y hazme una tabla.' },
        { sender: 'bot', text: 'Buscando y verificando fuentes en la web sin alucinaciones... 🌐' },
        { sender: 'bot', text: '🔍 **Comparativa de Servidores Dedicados en México:**\n\n| Proveedor | Plan Base | Ancho Banda | Garantía |\n| :--- | :--- | :--- | :--- |\n| **Proveedor A** | $2,499/mes | 100 Mbps | 99.9% Uptime |\n| **Proveedor B** | $2,800/mes | 1 Gbps | Red Privada |\n\n*Nota:* Proveedor B incluye red dedicada ideal para protección de datos corporativa. 🔐\n\n💬 *¿Quieres conectar búsquedas a tu IA? Escríbenos al WhatsApp [7712339238](https://api.whatsapp.com/send?phone=527712339238&text=Hola%20Brain%20Branding,%20quiero%20solicitar%20asesor%C3%ADa%20para%20un%20proyecto%20a%20la%20medida) o al correo [andreskrebollo@gmail.com](mailto:andreskrebollo@gmail.com)*' }
      ],
      // Scenario 5: Agenda
      [
        { sender: 'user', text: 'Reagenda mi reunión con Alejandro para el jueves a las 3:00 PM y avísale.' },
        { sender: 'bot', text: 'Cruzando agendas y verificando disponibilidad... 📅' },
        { sender: 'bot', text: '📅 **Agenda Actualizada:**\n- La junta fue movida al **Jueves 30 de Julio a las 15:00 hrs**.\n- Se envió la invitación de Google Calendar a Alejandro y ya la aceptó.\n- 💡 *Recordatorio Proactivo:* Tienes un espacio libre de 1 hora antes de la junta por si deseas repasar la propuesta.\n\n💬 *¿Quieres delegar tu agenda a una IA? Escríbenos al WhatsApp [7712339238](https://api.whatsapp.com/send?phone=527712339238&text=Hola%20Brain%20Branding,%20quiero%20solicitar%20asesor%C3%ADa%20para%20un%20proyecto%20a%20la%20medida) o al correo [andreskrebollo@gmail.com](mailto:andreskrebollo@gmail.com)*' }
      ]
    ];

    const featureDetails = {
      excel: {
        title: 'Microsoft Excel y Google Sheets',
        desc: 'Procesa miles de filas, limpia registros duplicados, genera gráficos estructurados y extrae métricas clave de tus tablas en segundos.',
        color: '#00e5ff'
      },
      correo: {
        title: 'Gmail y Outlook',
        desc: 'Redacta correos de gran complejidad seleccionando los archivos correctos con tu propio estilo y reglas de negocio. Búsqueda inteligente para encontrar cualquier correo histórico al instante.',
        color: '#a855f7'
      },
      juntas: {
        title: 'Resumen de Juntas',
        desc: 'Analiza audios o transcripciones de reuniones extensas y complejas. Extrae acuerdos principales, minutas ejecutivas y pendientes asignados en segundos.',
        color: '#ec4899'
      },
      web: {
        title: 'Búsqueda en la Web',
        desc: 'Investiga, busca datos técnicos y compara servicios o proveedores en internet por ti de forma precisa y 100% libre de alucinaciones.',
        color: '#3b82f6'
      },
      agenda: {
        title: 'Organización de Agenda',
        desc: 'Reagenda juntas, cruza disponibilidades de participantes y envía invitaciones automáticas. Cuenta con recordatorios proactivos de tus tareas frecuentes.',
        color: '#10b981'
      },
      control: {
        title: 'Control en WhatsApp/Telegram',
        desc: 'Gestiona Excel, correo, agenda y juntas de forma discreta usando notas de voz o texto directamente en la app que ya utilizas a diario.',
        color: '#06b6d4',
        botText: '📱 **Control por Mensajería:**\nTodo se gestiona de forma altamente discreta por notas de voz o texto en el chat que ya usas a diario. No necesitas cambiar de aplicación.'
      },
      inteligencia: {
        title: 'Inteligencia Adaptativa',
        desc: 'Cero explicaciones repetitivas: el sistema aprende de tus formatos, tus métodos y tus hábitos de trabajo desde el primer día. No necesitas repetir instrucciones ni ser repetitivo en ellas.',
        color: '#f43f5e',
        botText: '🧠 **Inteligencia Adaptativa:**\nCero explicaciones repetitivas. Aprendo de tus formatos, tus métodos y tus hábitos de trabajo desde el primer día para actuar de forma autónoma.'
      },
      seguridad: {
        title: 'Seguridad Blindada',
        desc: 'Confidencialidad total: tus datos corporativos no navegan por IAs públicas ni entrenan modelos externos. El sistema opera sobre una red privada dedicada, garantizando la confidencialidad total de tu empresa.',
        color: '#eab308',
        botText: '🛡️ **Seguridad Blindada:**\nTus datos no navegan por IAs públicas ni entrenan modelos externos. Opero sobre una red dedicada, garantizando confidencialidad absoluta.'
      }
    };

    let currentScenarioIdx = 0;
    let currentMessageIdx = 0;
    let simulatorTimeout = null;
    let isSectionVisible = true;
    let isLocked = true;
    let scenarioStartTime = Date.now();
    let isSmartphoneHovered = false;
    let progressInterval = null;

    function formatTimestamp() {
      const now = new Date();
      return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    function showTypingIndicator() {
      // Mark last user check as read (double check)
      const lastCheck = telegramContainer.querySelector('.telegram-bubble.user:last-of-type .tg-check');
      if (lastCheck) {
        lastCheck.textContent = '✓✓';
        lastCheck.classList.add('read');
      }

      // Show phone status bar notification bubble
      const notif = document.getElementById('status-notif');
      if (notif) {
        notif.style.opacity = '1';
      }

      const indicator = document.createElement('div');
      indicator.className = 'telegram-bubble typing';
      indicator.id = 'telegram-typing';
      indicator.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      `;
      telegramContainer.appendChild(indicator);
      telegramContainer.scrollTop = telegramContainer.scrollHeight;
    }

    function removeTypingIndicator() {
      const indicator = document.getElementById('telegram-typing');
      if (indicator) {
        indicator.remove();
      }
      
      // Hide phone status bar notification bubble
      const notif = document.getElementById('status-notif');
      if (notif) {
        notif.style.opacity = '0';
      }
    }

    function formatMessageText(text) {
      let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 11.5px; color: #cbd5e1;">$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #40c4ff; text-decoration: underline; font-weight: bold;">$1</a>');
      
      if (html.includes('|')) {
        return html.replace(/\|/g, ' │ ');
      }
      return html;
    }

    function renderMessage(sender, msgObj) {
      const bubble = document.createElement('div');
      bubble.className = `telegram-bubble ${sender}`;
      
      if (msgObj.isVoice) {
        bubble.innerHTML = `
          <div class="voice-note-player">
            <div class="vn-play-btn">▶</div>
            <div class="vn-waveform">
              <span class="vn-wave-bar" style="height: 10px;"></span>
              <span class="vn-wave-bar" style="height: 14px;"></span>
              <span class="vn-wave-bar" style="height: 8px;"></span>
              <span class="vn-wave-bar" style="height: 16px;"></span>
              <span class="vn-wave-bar" style="height: 12px;"></span>
              <span class="vn-wave-bar" style="height: 18px;"></span>
              <span class="vn-wave-bar" style="height: 10px;"></span>
              <span class="vn-wave-bar" style="height: 14px;"></span>
              <span class="vn-wave-bar" style="height: 6px;"></span>
              <span class="vn-wave-bar" style="height: 12px;"></span>
              <span class="vn-wave-bar" style="height: 16px;"></span>
              <span class="vn-wave-bar" style="height: 8px;"></span>
              <span class="vn-wave-bar" style="height: 14px;"></span>
              <span class="vn-wave-bar" style="height: 10px;"></span>
            </div>
            <span style="font-size: 11px; font-weight: 600; margin-right: 5px;">0:45</span>
          </div>
          <span class="time">${formatTimestamp()} <span class="tg-check">✓</span></span>
        `;
        setTimeout(() => {
          const bars = bubble.querySelectorAll('.vn-wave-bar');
          let barIdx = 0;
          const animateInterval = setInterval(() => {
            if (barIdx >= bars.length) {
              clearInterval(animateInterval);
              return;
            }
            bars[barIdx].classList.add('active');
            barIdx++;
          }, 60);
        }, 100);
      } else {
        const formattedText = formatMessageText(msgObj.text);
        const checkHtml = sender === 'user' ? ` <span class="tg-check">✓</span>` : '';
        bubble.innerHTML = `
          <div class="text">${formattedText.replace(/\n/g, '<br>')}</div>
          <span class="time">${formatTimestamp()}${checkHtml}</span>
        `;
      }
      
      telegramContainer.appendChild(bubble);
      telegramContainer.scrollTop = telegramContainer.scrollHeight;
      
      // Play sound and trigger haptic pulse
      if (sender === 'user') {
        playSynthSound('msg_send');
        triggerHaptic('haptic-pulse');
      } else {
        playSynthSound('msg_recv');
        triggerHaptic('haptic-pulse');
      }
    }

    function updateActiveIcon(scenarioIdx) {
      const pills = document.querySelectorAll('.feature-icon-pill');
      pills.forEach(p => {
        const pScenario = p.getAttribute('data-scenario');
        if (pScenario === String(scenarioIdx)) {
          p.classList.add('active');
          const featureKey = p.getAttribute('data-feature');
          updateDetailCard(featureKey);
        } else {
          p.classList.remove('active');
        }
      });
    }

    function updateDetailCard(featureKey) {
      const details = featureDetails[featureKey];
      const card = document.getElementById('feature-detail-card');
      const titleEl = document.getElementById('feature-detail-title');
      const descEl = document.getElementById('feature-detail-desc');
      
      if (card && titleEl && descEl && details) {
        titleEl.textContent = details.title;
        descEl.textContent = details.desc;
        card.style.color = details.color;
      }
    }

    function startProgressBar() {
      const bar = document.getElementById('smartphone-progress-bar');
      if (!bar) return;
      if (progressInterval) clearInterval(progressInterval);
      
      progressInterval = setInterval(() => {
        if (isSmartphoneHovered || isLocked) return;
        const elapsed = Date.now() - scenarioStartTime;
        const pct = Math.min(100, (elapsed / 10000) * 100);
        bar.style.width = `${pct}%`;
      }, 100);
    }

    function playNextMessage() {
      if (!isSectionVisible || isLocked) return;

      const scenario = chatScenarios[currentScenarioIdx];
      
      if (currentMessageIdx === 0) {
        startProgressBar();
      }
      
      if (currentMessageIdx >= scenario.length) {
        const elapsed = Date.now() - scenarioStartTime;
        const remaining = Math.max(1000, 10000 - elapsed);
        simulatorTimeout = setTimeout(() => {
          const checkHoverAndTransition = () => {
            if (isSmartphoneHovered) {
              simulatorTimeout = setTimeout(checkHoverAndTransition, 500);
              return;
            }
            
            const wash = document.getElementById('telegram-screen-wash');
            if (wash) {
              wash.classList.remove('wash-active');
              void wash.offsetWidth; // Force reflow
              wash.classList.add('wash-active');
              playSynthSound('swish');
            }
            
            setTimeout(() => {
              telegramContainer.innerHTML = '';
              currentScenarioIdx = (currentScenarioIdx + 1) % chatScenarios.length;
              currentMessageIdx = 0;
              scenarioStartTime = Date.now();
              startProgressBar();
              updateActiveIcon(currentScenarioIdx);
              playNextMessage();
            }, 250); // Wiping screen duration cover delay
          };
          checkHoverAndTransition();
        }, remaining);
        return;
      }

      const msg = scenario[currentMessageIdx];
      currentMessageIdx++;

      if (msg.sender === 'user') {
        simulatorTimeout = setTimeout(() => {
          renderMessage('user', msg);
          playNextMessage();
        }, 400); // Quick user post
      } else {
        simulatorTimeout = setTimeout(() => {
          showTypingIndicator();
          simulatorTimeout = setTimeout(() => {
            removeTypingIndicator();
            renderMessage('bot', msg);
            playNextMessage();
          }, 1200); // 1.2s typing indicator duration
        }, 400); // 400ms delay before typing
      }
    }

    // Interactive command pills click listener
    const featurePills = document.querySelectorAll('.feature-icon-pill');
    let isPillTransitioning = false;

    featurePills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (isPillTransitioning) return;
        
        // Auto-unlock lockscreen if locked
        if (isLocked) {
          isLocked = false;
          const ls = document.getElementById('smartphone-lockscreen');
          if (ls) {
            ls.classList.add('unlocked');
          }
          const container = document.querySelector('.smartphone-container');
          if (container) {
            container.classList.add('unlocked-mockup');
          }
          
          // Trigger avatar boot animation
          const avatarCont = document.getElementById('telegram-avatar-container');
          if (avatarCont) {
            avatarCont.classList.remove('activated');
            void avatarCont.offsetWidth;
            avatarCont.classList.add('activated');
          }
          playSynthSound('unlock');
          triggerDoubleHaptic();
        }
        
        const featureKey = pill.getAttribute('data-feature');
        const scenarioVal = pill.getAttribute('data-scenario');
        
        isPillTransitioning = true;
        featurePills.forEach(p => p.classList.add('disabled'));
        setTimeout(() => {
          isPillTransitioning = false;
          featurePills.forEach(p => p.classList.remove('disabled'));
        }, 1200);

        // Update active class
        featurePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        // Update details card
        updateDetailCard(featureKey);

        // Reset loops
        if (simulatorTimeout) {
          clearTimeout(simulatorTimeout);
          simulatorTimeout = null;
        }
        removeTypingIndicator();
        telegramContainer.innerHTML = '';

        if (scenarioVal === 'control' || scenarioVal === 'inteligencia' || scenarioVal === 'seguridad') {
          const details = featureDetails[featureKey];
          renderMessage('user', { text: `Quiero saber sobre ${details.title}` });
          
          simulatorTimeout = setTimeout(() => {
            showTypingIndicator();
            simulatorTimeout = setTimeout(() => {
              removeTypingIndicator();
              renderMessage('bot', { text: details.botText });
            }, 2000);
          }, 800);
        } else {
          const scenarioIdx = parseInt(scenarioVal, 10);
          currentScenarioIdx = scenarioIdx;
          currentMessageIdx = 0;
          scenarioStartTime = Date.now();

          const scenario = chatScenarios[currentScenarioIdx];
          if (scenario && scenario.length > 0) {
            const firstMsg = scenario[0];
            currentMessageIdx = 1;
            renderMessage(firstMsg.sender, firstMsg);
            playNextMessage();
          }
        }
      });
    });

    // Smartphone Lockscreen Logic
    const lockscreen = document.getElementById('smartphone-lockscreen');
    const lockTime = document.getElementById('lockscreen-time');
    const lockDate = document.getElementById('lockscreen-date');

    if (lockTime && lockDate) {
      const updateLockClock = () => {
        const now = new Date();
        lockTime.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        lockDate.textContent = now.toLocaleDateString('es-ES', options);
      };
      updateLockClock();
      setInterval(updateLockClock, 60000);
    }

    if (lockscreen) {
      lockscreen.addEventListener('click', () => {
        if (!isLocked) return;
        
        // Unlock immediately
        isLocked = false;
        lockscreen.classList.add('unlocked');
        
        // Trigger depth blur removal
        const container = document.querySelector('.smartphone-container');
        if (container) {
          container.classList.add('unlocked-mockup');
        }
        
        // Trigger avatar boot animation
        const avatarCont = document.getElementById('telegram-avatar-container');
        if (avatarCont) {
          avatarCont.classList.remove('activated');
          void avatarCont.offsetWidth;
          avatarCont.classList.add('activated');
        }
        
        // Play unlock chime
        playSynthSound('unlock');
        triggerDoubleHaptic();
        
        // Reset and start simulation
        if (simulatorTimeout) {
          clearTimeout(simulatorTimeout);
        }
        removeTypingIndicator();
        telegramContainer.innerHTML = '';
        currentScenarioIdx = 0;
        currentMessageIdx = 0;
        scenarioStartTime = Date.now();
        updateActiveIcon(0);
        
        const scenario = chatScenarios[0];
        if (scenario && scenario.length > 0) {
          const firstMsg = scenario[0];
          currentMessageIdx = 1;
          
          // Realistic typing delay on welcome message
          simulatorTimeout = setTimeout(() => {
            showTypingIndicator();
            simulatorTimeout = setTimeout(() => {
              removeTypingIndicator();
              renderMessage(firstMsg.sender, firstMsg);
              playNextMessage();
            }, 1200);
          }, 350);
        }
      });
    }

    // IntersectionObserver implementation for visibility check (Auto-Unlock on Scroll)
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isSectionVisible) {
              isSectionVisible = true;
            }
            
            // Auto-unlock instantly when visitor scrolls to the phone
            if (isLocked) {
              isLocked = false;
              if (lockscreen) {
                lockscreen.classList.add('unlocked');
              }
              const container = document.querySelector('.smartphone-container');
              if (container) {
                container.classList.add('unlocked-mockup');
              }
              
              // Trigger avatar boot animation
              const avatarCont = document.getElementById('telegram-avatar-container');
              if (avatarCont) {
                avatarCont.classList.remove('activated');
                void avatarCont.offsetWidth;
                avatarCont.classList.add('activated');
              }
              
              playSynthSound('unlock');
              triggerDoubleHaptic();
              
              if (simulatorTimeout) {
                clearTimeout(simulatorTimeout);
              }
              removeTypingIndicator();
              telegramContainer.innerHTML = '';
              currentScenarioIdx = 0;
              currentMessageIdx = 0;
              scenarioStartTime = Date.now();
              updateActiveIcon(0);
              
              const scenario = chatScenarios[0];
              if (scenario && scenario.length > 0) {
                const firstMsg = scenario[0];
                currentMessageIdx = 1;
                
                // Realistic typing delay on welcome message
                simulatorTimeout = setTimeout(() => {
                  showTypingIndicator();
                  simulatorTimeout = setTimeout(() => {
                    removeTypingIndicator();
                    renderMessage(firstMsg.sender, firstMsg);
                    playNextMessage();
                  }, 1200);
                }, 350);
              }
            } else {
              playNextMessage();
            }
          } else {
            isSectionVisible = false;
            if (simulatorTimeout) {
              clearTimeout(simulatorTimeout);
              simulatorTimeout = null;
            }
          }
        });
      }, { threshold: 0.15 });

      const targetSection = document.getElementById('asistente-ia');
      if (targetSection) {
        observer.observe(targetSection);
      }
    } else {
      // Fallback: start loop directly
      playNextMessage();
    }

    const phoneContainer = document.querySelector('.smartphone-container');
    if (phoneContainer) {
      phoneContainer.addEventListener('mouseenter', () => { isSmartphoneHovered = true; });
      phoneContainer.addEventListener('mouseleave', () => { isSmartphoneHovered = false; });
      phoneContainer.addEventListener('touchstart', () => { isSmartphoneHovered = true; }, { passive: true });
      phoneContainer.addEventListener('touchend', () => { isSmartphoneHovered = false; });
    }
  }

  // Synthesize digital sweep click using Web Audio API (Zero Asset Dependency)
  const playDeviceSwitchSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  // 31. Tablet POS Simulator State Machine and Animations
  const posScenarios = [
    {
      title: "Ventas Táctiles",
      desc: "Simula el registro y cobro de ventas en segundos. Selecciona productos, calcula impuestos y genera el total de forma automática.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Menú Rápido</div>
          <div class="pos-grid-menu">
            <div class="pos-item-button" id="pos-btn-cafe">
              <span class="pos-item-icon">☕</span>
              <span class="pos-item-label">Café Americano</span>
              <span class="pos-item-price">$45.00</span>
            </div>
            <div class="pos-item-button" id="pos-btn-croissant">
              <span class="pos-item-icon">🥐</span>
              <span class="pos-item-label">Croissant</span>
              <span class="pos-item-price">$35.00</span>
            </div>
            <div class="pos-item-button" id="pos-btn-cake">
              <span class="pos-item-icon">🍰</span>
              <span class="pos-item-label">Pastel Choc</span>
              <span class="pos-item-price">$60.00</span>
            </div>
          </div>
          <div style="font-size:10px; color:var(--text-muted); margin-top:10px;">* Pulsa cualquier producto para simular la venta en la tablet.</div>
        `;
        
        cartContainer.innerHTML = '';
        totalObj.subtotal.textContent = '$0.00';
        totalObj.tax.textContent = '$0.00';
        totalObj.total.textContent = '$0.00';
        totalObj.checkout.classList.remove('active-pay');
        totalObj.checkout.innerHTML = '<span>Cobrar Ticket</span>';
        
        const t1 = setTimeout(() => {
          const btn = document.getElementById('pos-btn-cafe');
          if (btn) btn.classList.add('active-item');
          cartContainer.innerHTML += `
            <div class="cart-item">
              <span class="cart-item-name">☕ Café Americano x1</span>
              <span class="cart-item-price">$45.00</span>
            </div>
          `;
          totalObj.subtotal.textContent = '$45.00';
          totalObj.tax.textContent = '$7.20';
          totalObj.total.textContent = '$52.20';
        }, 1200);
        leftPanel.dataset.t1 = t1;
        
        const t2 = setTimeout(() => {
          const btn = document.getElementById('pos-btn-croissant');
          if (btn) btn.classList.add('active-item');
          cartContainer.innerHTML += `
            <div class="cart-item">
              <span class="cart-item-name">🥐 Croissant x1</span>
              <span class="cart-item-price">$35.00</span>
            </div>
          `;
          totalObj.subtotal.textContent = '$80.00';
          totalObj.tax.textContent = '$12.80';
          totalObj.total.textContent = '$92.80';
        }, 2800);
        leftPanel.dataset.t2 = t2;
      }
    },
    {
      title: "Control de Inventario",
      desc: "Monitoreo en tiempo real de existencias. Recibe alertas de stock crítico y reabastecimiento automatizado.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Estado de Inventario</div>
          <div class="pos-inventory-list">
            <div class="pos-inventory-item">
              <span>☕ Café en Grano (KG)</span>
              <span class="pos-stock-badge in-stock">45 KG (OK)</span>
            </div>
            <div class="pos-inventory-item">
              <span>🥐 Croissant (Pzas)</span>
              <span class="pos-stock-badge low-stock" style="background:rgba(239,68,68,0.15); color:#ef4444; font-weight:700;">3 pzs (Crítico)</span>
            </div>
            <div class="pos-inventory-item">
              <span>🍰 Pastel Chocolate (Pzas)</span>
              <span class="pos-stock-badge in-stock">12 pzs (OK)</span>
            </div>
          </div>
          <div id="pos-inv-alert" style="margin-top:10px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); padding:10px; border-radius:8px; font-size:10.5px; color:#ef4444; opacity:0; transition:opacity 0.3s;">
            🚨 <b>Alerta de Compra:</b> Proveedor notificado para envío de 50 croissants.
          </div>
        `;
        
        cartContainer.innerHTML = `
          <div class="cart-item" style="opacity:0.5;">
            <span class="cart-item-name">☕ Café Americano x1</span>
            <span class="cart-item-price">$45.00</span>
          </div>
          <div class="cart-item" style="opacity:0.5;">
            <span class="cart-item-name">🥐 Croissant x1</span>
            <span class="cart-item-price">$35.00</span>
          </div>
        `;
        totalObj.subtotal.textContent = '$80.00';
        totalObj.tax.textContent = '$12.80';
        totalObj.total.textContent = '$92.80';
        
        const t1 = setTimeout(() => {
          const alert = document.getElementById('pos-inv-alert');
          if (alert) alert.style.opacity = '1';
        }, 1500);
        leftPanel.dataset.t1 = t1;
      }
    },
    {
      title: "Control de Caja (Arqueo)",
      desc: "Control absoluto del flujo de efectivo. Registra aperturas, retiros parciales de seguridad y cierres automáticos.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Bitácora de Caja (Shift #4)</div>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:10.5px; color:rgba(255,255,255,0.7);">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span>🔑 Apertura de Caja (Fondo)</span>
              <span style="color:#10b981;">+$1,500.00</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span>🛒 Ventas Registradas (Efectivo)</span>
              <span style="color:#10b981;">+$2,840.00</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;" id="pos-cash-withdraw">
              <span>🛡️ Retiro de Seguridad (Envío a Bóveda)</span>
              <span style="color:#ef4444;">-$2,000.00</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:700; color:#fff; padding-top:4px;">
              <span>💵 Saldo Actual en Cajón</span>
              <span id="pos-cash-total">$2,340.00</span>
            </div>
          </div>
        `;
        
        cartContainer.innerHTML = '';
        totalObj.subtotal.textContent = '$0.00';
        totalObj.tax.textContent = '$0.00';
        totalObj.total.textContent = '$0.00';
        
        const t1 = setTimeout(() => {
          const withdraw = document.getElementById('pos-cash-withdraw');
          if (withdraw) {
            withdraw.style.background = 'rgba(239, 68, 68, 0.1)';
            setTimeout(() => {
              withdraw.style.background = 'transparent';
            }, 800);
          }
        }, 1500);
        leftPanel.dataset.t1 = t1;
      }
    },
    {
      title: "Facturación XML / CFDI 4.0",
      desc: "Autofacturación integrada para tus clientes. Genera facturas al instante y envíalas directamente por correo electrónico.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Autofacturación Express</div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center;">
            <div style="background:#fff; padding:6px; border-radius:8px; width:100px; height:100px; display:flex; align-items:center; justify-content:center;" id="pos-invoice-qr">
              <svg viewBox="0 0 100 100" width="80" height="80">
                <rect x="10" y="10" width="20" height="20" fill="#000"/>
                <rect x="70" y="10" width="20" height="20" fill="#000"/>
                <rect x="10" y="70" width="20" height="20" fill="#000"/>
                <rect x="35" y="35" width="30" height="30" fill="#000" opacity="0.8"/>
                <rect x="20" y="45" width="10" height="10" fill="#000"/>
                <rect x="50" y="15" width="10" height="10" fill="#000"/>
              </svg>
            </div>
            <div style="font-size:10.5px; color:#fff;" id="pos-invoice-status">Esperando escaneo de ticket...</div>
          </div>
        `;
        
        cartContainer.innerHTML = `
          <div class="cart-item">
            <span class="cart-item-name">Ticket #1002</span>
            <span class="cart-item-price">$92.80</span>
          </div>
        `;
        totalObj.subtotal.textContent = '$80.00';
        totalObj.tax.textContent = '$12.80';
        totalObj.total.textContent = '$92.80';
        
        const t1 = setTimeout(() => {
          const status = document.getElementById('pos-invoice-status');
          if (status) status.innerHTML = "✅ <b>CFDI Generado:</b> Enviado a cliente@ejemplo.com";
          const qr = document.getElementById('pos-invoice-qr');
          if (qr) qr.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
        }, 2200);
        leftPanel.dataset.t1 = t1;
      }
    },
    {
      title: "Reportes en Tiempo Real",
      desc: "Analiza el rendimiento comercial al instante con gráficas visuales automatizadas actualizadas al segundo.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Reporte de Ventas (Hoy)</div>
          <div class="pos-chart-container" style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; flex-direction:column; gap:4px; font-size:10px; color:var(--text-muted);">
              <div style="display:flex; justify-content:space-between; color:#fff;">
                <span>Café Americano (65%)</span>
                <span>$1,480.00</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
                <div id="pos-bar-cafe" style="width:0%; height:100%; background:#00e5ff; transition:width 1.2s ease-out;"></div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px; font-size:10px; color:var(--text-muted);">
              <div style="display:flex; justify-content:space-between; color:#fff;">
                <span>Croissants (35%)</span>
                <span>$810.00</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
                <div id="pos-bar-croissant" style="width:0%; height:100%; background:#a855f7; transition:width 1.2s ease-out;"></div>
              </div>
            </div>
          </div>
        `;
        
        cartContainer.innerHTML = '';
        totalObj.subtotal.textContent = '$0.00';
        totalObj.tax.textContent = '$0.00';
        totalObj.total.textContent = '$0.00';
        
        const t1 = setTimeout(() => {
          const barCafe = document.getElementById('pos-bar-cafe');
          const barCroissant = document.getElementById('pos-bar-croissant');
          if (barCafe) barCafe.style.width = '65%';
          if (barCroissant) barCroissant.style.width = '35%';
        }, 300);
        leftPanel.dataset.t1 = t1;
      }
    },
    {
      title: "CRM y Clientes VIP",
      desc: "Base de datos unificada de clientes. Premia a tus compradores frecuentes con puntos acumulados y descuentos automáticos.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Perfil de Cliente</div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:12px; font-size:11px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:30px; height:30px; border-radius:50%; background:#a855f7; display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; font-size:12px;">AM</div>
              <div>
                <div style="color:#fff; font-weight:700;">Alejandro Mendoza</div>
                <div style="font-size:9.5px; color:var(--text-muted);">Membresía: VIP Oro</div>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
              <span style="color:var(--text-muted);">Puntos Disponibles:</span>
              <span style="color:#00e5ff; font-weight:700;">1,240 pts</span>
            </div>
            <div style="display:flex; justify-content:space-between;" id="pos-crm-disc-row">
              <span style="color:var(--text-muted);">Descuento Especial:</span>
              <span style="color:#10b981; font-weight:700;">-10% Activo</span>
            </div>
          </div>
        `;
        
        cartContainer.innerHTML = `
          <div class="cart-item">
            <span class="cart-item-name">☕ Café Americano x1</span>
            <span class="cart-item-price">$45.00</span>
          </div>
        `;
        totalObj.subtotal.textContent = '$45.00';
        totalObj.tax.textContent = '$7.20';
        totalObj.total.textContent = '$52.20';
        
        const t1 = setTimeout(() => {
          const discRow = document.getElementById('pos-crm-disc-row');
          if (discRow) {
            discRow.style.background = 'rgba(16, 185, 129, 0.1)';
            totalObj.subtotal.textContent = '$40.50';
            totalObj.tax.textContent = '$6.48';
            totalObj.total.textContent = '$46.98';
          }
        }, 1500);
        leftPanel.dataset.t1 = t1;
      }
    },
    {
      title: "Cobros sin Contacto (NFC)",
      desc: "Acepta cobros con tarjetas de crédito, débito y transferencias móviles directamente desde tu tableta.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Procesando Pago NFC</div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; padding:10px 0;">
            <div id="pos-card-reader" style="font-size:32px; border:2px dashed rgba(255,255,255,0.15); border-radius:50%; width:70px; height:70px; display:flex; align-items:center; justify-content:center; position:relative; background:rgba(255,255,255,0.01);">
              💳
              <div id="pos-card-glow" style="position:absolute; inset:-5px; border-radius:50%; border:2px solid #00e5ff; opacity:0; transition:all 0.3s;"></div>
            </div>
            <div id="pos-nfc-status" style="font-size:11px; color:#fff;">Acerque la tarjeta o celular...</div>
          </div>
        `;
        
        cartContainer.innerHTML = `
          <div class="cart-item">
            <span class="cart-item-name">☕ Café Americano x1</span>
            <span class="cart-item-price">$45.00</span>
          </div>
          <div class="cart-item">
            <span class="cart-item-name">🥐 Croissant x1</span>
            <span class="cart-item-price">$35.00</span>
          </div>
        `;
        totalObj.subtotal.textContent = '$80.00';
        totalObj.tax.textContent = '$12.80';
        totalObj.total.textContent = '$92.80';
        totalObj.checkout.classList.remove('active-pay');
        totalObj.checkout.innerHTML = '<span>Cobrar Ticket</span>';
        
        const t1 = setTimeout(() => {
          const glow = document.getElementById('pos-card-glow');
          const status = document.getElementById('pos-nfc-status');
          if (glow) {
            glow.style.opacity = '1';
            glow.style.transform = 'scale(1.1)';
          }
          if (status) status.innerHTML = "⚡ <b>Procesando transacciones...</b>";
        }, 1500);
        leftPanel.dataset.t1 = t1;
        
        const t2 = setTimeout(() => {
          const status = document.getElementById('pos-nfc-status');
          if (status) status.innerHTML = "✅ <b>Pago Aprobado (Ref #8491)</b>";
          totalObj.checkout.classList.add('active-pay');
          totalObj.checkout.innerHTML = '<span>Aprobado ✓</span>';
          if (navigator.vibrate) navigator.vibrate([15, 10, 15]);
        }, 3200);
        leftPanel.dataset.t2 = t2;
      }
    },
    {
      title: "Auditoría Contable Cifrada",
      desc: "Historial de transacciones y retiros firmado criptográficamente, previniendo fraudes y fugas de capital interno.",
      run: (leftPanel, cartContainer, totalObj) => {
        leftPanel.innerHTML = `
          <div style="font-size:12px; color:#fff; font-weight:700; margin-bottom:8px;">Historial de Auditoría Cifrada</div>
          <div style="background:#05070a; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; font-family:monospace; font-size:8px; color:#10b981; display:flex; flex-direction:column; gap:4px; max-height:100px; overflow:hidden;" id="pos-audit-logs">
            <div>[12:30:10] SYS_OPEN FUND: $1500.00</div>
            <div>[12:31:05] TX_1001 APPR BY NFC_REF: 4291</div>
            <div>[12:32:45] TX_1002 APPR BY NFC_REF: 8491</div>
          </div>
          <div style="font-size:10px; color:#10b981; margin-top:8px; display:flex; align-items:center; gap:5px;">
            <span>🛡️</span> <b>Firma SHA-256 Activa e Inviolable</b>
          </div>
        `;
        
        cartContainer.innerHTML = '';
        totalObj.subtotal.textContent = '$0.00';
        totalObj.tax.textContent = '$0.00';
        totalObj.total.textContent = '$0.00';
        
        const t1 = setTimeout(() => {
          const logs = document.getElementById('pos-audit-logs');
          if (logs) {
            logs.innerHTML += `<div>[12:33:01] SECURE_WITHDRAW SHIFT: #4 - $2000.00</div>`;
            logs.innerHTML += `<div style="color:#00e5ff;">[12:33:02] INTEGRITY_VERIFIED HASH: SHA_9fa4b...</div>`;
          }
        }, 1500);
        leftPanel.dataset.t1 = t1;
      }
    }
  ];

  const initPOSSimulator = () => {
    const leftPanel = document.getElementById('pos-screen-content');
    const cartContainer = document.getElementById('pos-cart-items');
    const totalObj = {
      subtotal: document.getElementById('pos-subtotal'),
      tax: document.getElementById('pos-tax'),
      total: document.getElementById('pos-total'),
      checkout: document.getElementById('pos-checkout-btn')
    };
    const pills = document.querySelectorAll('#pos-features-icons .feature-icon-pill');
    const detailTitle = document.getElementById('pos-detail-title');
    const detailDesc = document.getElementById('pos-detail-desc');
    
    if (!leftPanel || !cartContainer) return;
    
    let currentIdx = 0;
    let timer = null;
    let isPOSVisible = true;
    let isPOSHovered = false;
    let posBatteryPercent = 98;
    let posBatteryInterval = null;
    
    const updateBatteryVisual = () => {
      const batteryText = document.querySelector('.tablet-status-bar span');
      const batteryLevelBar = document.querySelector('.tablet-status-bar .battery-level');
      if (batteryText) batteryText.textContent = `${posBatteryPercent}%`;
      if (batteryLevelBar) batteryLevelBar.style.width = `${posBatteryPercent}%`;
      
      const tabletScreen = document.querySelector('.tablet-screen');
      if (tabletScreen) {
        if (posBatteryPercent <= 15) {
          tabletScreen.classList.add('power-saving-mode');
          let alertBanner = document.getElementById('pos-low-bat-banner');
          if (!alertBanner) {
            alertBanner = document.createElement('div');
            alertBanner.id = 'pos-low-bat-banner';
            alertBanner.style.position = 'absolute';
            alertBanner.style.bottom = '45px';
            alertBanner.style.left = '50%';
            alertBanner.style.transform = 'translateX(-50%)';
            alertBanner.style.background = '#ef4444';
            alertBanner.style.color = '#fff';
            alertBanner.style.fontSize = '9px';
            alertBanner.style.fontWeight = '700';
            alertBanner.style.padding = '4px 10px';
            alertBanner.style.borderRadius = '10px';
            alertBanner.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
            alertBanner.style.zIndex = '999';
            alertBanner.style.animation = 'pulseLowStock 1s infinite alternate';
            alertBanner.textContent = '🚨 BATERÍA BAJA - MODO AHORRO';
            tabletScreen.appendChild(alertBanner);
          }
        } else {
          tabletScreen.classList.remove('power-saving-mode');
          const alertBanner = document.getElementById('pos-low-bat-banner');
          if (alertBanner) alertBanner.remove();
        }
      }
    };
    
    const startBatteryDischarging = () => {
      if (posBatteryInterval) return;
      posBatteryInterval = setInterval(() => {
        if (posBatteryPercent > 3) {
          posBatteryPercent--;
          updateBatteryVisual();
        }
      }, 180000);
    };
    
    const stopBatteryDischarging = () => {
      if (posBatteryInterval) {
        clearInterval(posBatteryInterval);
        posBatteryInterval = null;
      }
    };
    
    const clearPosTimeouts = () => {
      if (leftPanel.dataset.t1) { clearTimeout(parseInt(leftPanel.dataset.t1, 10)); delete leftPanel.dataset.t1; }
      if (leftPanel.dataset.t2) { clearTimeout(parseInt(leftPanel.dataset.t2, 10)); delete leftPanel.dataset.t2; }
    };
    
    const updatePOSActiveIcon = (idx) => {
      pills.forEach(p => {
        const pScenario = p.getAttribute('data-pos-scenario');
        if (pScenario === String(idx)) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
      
      const scenario = posScenarios[idx];
      detailTitle.textContent = scenario.title;
      detailDesc.textContent = scenario.desc;
    };
    
    const runPOSCycle = () => {
      if (!isPOSVisible) return;
      
      clearPosTimeouts();
      updatePOSActiveIcon(currentIdx);
      const scenario = posScenarios[currentIdx];
      scenario.run(leftPanel, cartContainer, totalObj);
      
      timer = setTimeout(() => {
        const checkHoverAndTransition = () => {
          if (isPOSHovered) {
            timer = setTimeout(checkHoverAndTransition, 500);
            return;
          }
          currentIdx = (currentIdx + 1) % posScenarios.length;
          runPOSCycle();
        };
        checkHoverAndTransition();
      }, 5000);
    };
    
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (timer) clearTimeout(timer);
        const scenarioIdx = parseInt(pill.getAttribute('data-pos-scenario'), 10);
        currentIdx = scenarioIdx;
        runPOSCycle();
      });
    });
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isPOSVisible = true;
            startBatteryDischarging();
            if (!timer) runPOSCycle();
          } else {
            isPOSVisible = false;
            stopBatteryDischarging();
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            clearPosTimeouts();
          }
        });
      }, { threshold: 0.15 });
      
      const targetSection = document.getElementById('simulador-pos');
      if (targetSection) observer.observe(targetSection);
    } else {
      startBatteryDischarging();
      runPOSCycle();
    }

    // Device switcher button interactions
    const switcherBtns = document.querySelectorAll('.pos-device-switcher .switcher-btn');
    const tabletMock = document.querySelector('.tablet-container');
    if (tabletMock) {
      tabletMock.addEventListener('mouseenter', () => { isPOSHovered = true; });
      tabletMock.addEventListener('mouseleave', () => { isPOSHovered = false; });
      tabletMock.addEventListener('touchstart', () => { isPOSHovered = true; }, { passive: true });
      tabletMock.addEventListener('touchend', () => { isPOSHovered = false; });
    }
    const triggerPosBoot = () => {
      const bootScreen = document.getElementById('pos-boot-screen');
      const bootBar = document.getElementById('pos-boot-bar');
      if (bootScreen && bootBar) {
        bootScreen.style.opacity = '1';
        bootScreen.style.pointerEvents = 'auto';
        bootBar.style.width = '0%';
        
        setTimeout(() => {
          bootBar.style.width = '100%';
        }, 50);
        
        setTimeout(() => {
          bootScreen.style.opacity = '0';
          bootScreen.style.pointerEvents = 'none';
          setTimeout(() => {
            bootBar.style.width = '0%';
          }, 200);
        }, 500);
      }
    };

    switcherBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playDeviceSwitchSound();
        triggerPosBoot();
        
        // Lower battery by 1% on device switch as an interactive hardware consumption simulator
        if (posBatteryPercent > 3) {
          posBatteryPercent--;
          updateBatteryVisual();
        }
        
        // Wait 100ms for screen switch so resizing triggers during black boot screen for clean visual effect
        setTimeout(() => {
          switcherBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const device = btn.getAttribute('data-device');
          if (tabletMock) {
            tabletMock.classList.remove('mock-mobile', 'mock-desktop');
            if (device === 'mobile') {
              tabletMock.classList.add('mock-mobile');
            } else if (device === 'desktop') {
              tabletMock.classList.add('mock-desktop');
            }
          }
        }, 100);
      });
    });
  };

  initPOSSimulator();

  // 35. Web Simulator State Machine and Animations
  const webScenarios = [
    {
      title: "Velocidad de Carga",
      desc: "Optimización extrema de archivos estáticos y renderizado del lado del cliente para cargar la plataforma en milisegundos.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page">
            <div style="font-size:12px; font-weight:700; color:#fff; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; margin-bottom:8px;">Google Lighthouse Score</div>
            <div class="web-lighthouse-grid">
              <div class="lighthouse-metric">
                <div class="lighthouse-circle" id="lh-perf">0</div>
                <span class="lighthouse-label">Rendimiento</span>
              </div>
              <div class="lighthouse-metric">
                <div class="lighthouse-circle" id="lh-acc">0</div>
                <span class="lighthouse-label">Accesibilidad</span>
              </div>
              <div class="lighthouse-metric">
                <div class="lighthouse-circle" id="lh-bp">0</div>
                <span class="lighthouse-label">Prácticas</span>
              </div>
              <div class="lighthouse-metric">
                <div class="lighthouse-circle" id="lh-seo">0</div>
                <span class="lighthouse-label">SEO</span>
              </div>
            </div>
            <div id="lh-status" style="font-size:10.5px; text-align:center; color:#10b981; opacity:0; transition:opacity 0.3s; margin-top:5px;">
              Sitio optimizado: Carga instantánea en 0.4s
            </div>
          </div>
        `;
        
        // Animate metrics to 100
        const animateLH = (id, target, delay) => {
          setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) return;
            let current = 0;
            const interval = setInterval(() => {
              if (current >= target) {
                el.textContent = target;
                clearInterval(interval);
              } else {
                current += 5;
                el.textContent = current;
              }
            }, 20);
          }, delay);
        };
        
        animateLH('lh-perf', 100, 200);
        animateLH('lh-acc', 100, 500);
        animateLH('lh-bp', 100, 800);
        animateLH('lh-seo', 100, 1100);
        
        const t1 = setTimeout(() => {
          const status = document.getElementById('lh-status');
          if (status) status.style.opacity = '1';
        }, 1600);
        screen.dataset.t1 = t1;
      }
    },
    {
      title: "Diseño Premium & UX",
      desc: "Estética refinada con soporte nativo de temas oscuro/claro y efectos de cristal líquido (glassmorphism).",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page" id="web-theme-page" style="transition: background 0.5s ease, color 0.5s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; margin-bottom:8px;">
              <span style="font-size:11px; font-weight:700;">Modo Oscuro / Claro</span>
              <button id="theme-toggle-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:10px; padding:3px 8px; border-radius:12px; cursor:pointer;">
                ☀️ Claro
              </button>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px;" id="web-theme-card">
              <h4 style="font-size:11px; font-weight:700; margin-bottom:4px; color:#fff;" id="theme-card-title">Tarjeta con Glassmorphism</h4>
              <p style="font-size:9.5px; color:var(--text-muted); margin:0;" id="theme-card-desc">Soporte dinámico de colores HSL metálicos adaptados al entorno visual de tu marca.</p>
            </div>
          </div>
        `;
        
        const toggleBtn = document.getElementById('theme-toggle-btn');
        const themePage = document.getElementById('web-theme-page');
        const themeCard = document.getElementById('web-theme-card');
        const cardTitle = document.getElementById('theme-card-title');
        const cardDesc = document.getElementById('theme-card-desc');
        
        const t1 = setTimeout(() => {
          if (toggleBtn && themePage) {
            toggleBtn.textContent = '🌙 Oscuro';
            toggleBtn.style.background = '#e4e6eb';
            toggleBtn.style.color = '#000';
            themePage.style.background = '#f4f5f6';
            themePage.style.color = '#1f2023';
            if (themeCard) {
              themeCard.style.background = 'rgba(0,0,0,0.02)';
              themeCard.style.borderColor = 'rgba(0,0,0,0.06)';
            }
            if (cardTitle) cardTitle.style.color = '#1f2023';
            if (cardDesc) cardDesc.style.color = '#65676b';
          }
        }, 1800);
        screen.dataset.t1 = t1;
        
        const t2 = setTimeout(() => {
          if (toggleBtn && themePage) {
            toggleBtn.textContent = '☀️ Claro';
            toggleBtn.style.background = 'rgba(255,255,255,0.05)';
            toggleBtn.style.color = '#fff';
            themePage.style.background = '#090b0f';
            themePage.style.color = '#fff';
            if (themeCard) {
              themeCard.style.background = 'rgba(255,255,255,0.02)';
              themeCard.style.borderColor = 'rgba(255,255,255,0.05)';
            }
            if (cardTitle) cardTitle.style.color = '#fff';
            if (cardDesc) cardDesc.style.color = 'var(--text-muted)';
          }
        }, 3800);
        screen.dataset.t2 = t2;
      }
    },
    {
      title: "Pasarela de Pagos",
      desc: "Checkout seguro integrado con Stripe y PayPal, incluyendo cálculo de descuentos mediante cupones inteligentes.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page">
            <div style="font-size:11px; font-weight:700; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">Carrito de Compra</div>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:10px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Plan Desarrollo Web</span>
                <span>$15,000.00</span>
              </div>
              <div style="display:flex; gap:8px; margin-top:5px;">
                <input type="text" id="web-coupon-input" value="" placeholder="Cupón" style="flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:3px 6px; font-size:9.5px; color:#fff;" readonly>
                <button id="coupon-apply-btn" style="background:#a855f7; border:none; border-radius:4px; color:#fff; font-size:9px; padding:3px 8px;">Aplicar</button>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:6px; border-top:1px dashed rgba(255,255,255,0.05); padding-top:6px; font-weight:700; color:#fff;">
                <span>Total a Pagar:</span>
                <span id="web-cart-total">$15,000.00</span>
              </div>
            </div>
          </div>
        `;
        
        const couponInput = document.getElementById('web-coupon-input');
        const cartTotal = document.getElementById('web-cart-total');
        
        const t1 = setTimeout(() => {
          if (couponInput) couponInput.value = 'BRAIN20';
        }, 1200);
        screen.dataset.t1 = t1;
        
        const t2 = setTimeout(() => {
          if (couponInput) {
            couponInput.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            couponInput.style.background = 'rgba(16, 185, 129, 0.05)';
          }
          if (cartTotal) {
            cartTotal.textContent = '$12,000.00 (-20%)';
            cartTotal.style.color = '#10b981';
          }
        }, 2500);
        screen.dataset.t2 = t2;
      }
    },
    {
      title: "Optimización SEO Orgánica",
      desc: "Posicionamiento natural en buscadores con meta-tags automatizados y marcado de datos estructurados Schema.org.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page" style="background:#202124; font-family:arial,sans-serif; padding:12px;">
            <div style="font-size:10px; color:#969ba1; margin-bottom:8px;">Cerca de 452,000 resultados (0.42 segundos)</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="font-size:9px; color:#bdc1c6; display:flex; align-items:center; gap:4px;">
                <span>https://brainbranding.com.mx</span> <span>▼</span>
              </div>
              <div style="font-size:12px; color:#8ab4f8; font-weight:500; cursor:pointer;" id="seo-title-link">
                Brain Branding - Software y Páginas Web a la Medida
              </div>
              <div style="font-size:10px; color:#bdc1c6; line-height:1.4;">
                Desarrollo premium de aplicaciones web, SaaS y software personalizado. Velocidad extrema de carga y SEO A+ garantizado para tu empresa.
              </div>
              <div style="display:flex; gap:10px; font-size:9.5px; color:#8ab4f8; margin-top:4px;">
                <span>⭐ Calificación: 5.0 - 48 votos</span>
                <span>• Portafolio</span>
                <span>• Contacto</span>
              </div>
            </div>
          </div>
        `;
        
        const link = document.getElementById('seo-title-link');
        const t1 = setTimeout(() => {
          if (link) {
            link.style.color = '#c5a5ff';
            link.style.textDecoration = 'underline';
          }
        }, 1500);
        screen.dataset.t1 = t1;
      }
    },
    {
      title: "Seguridad de Datos SSL",
      desc: "Conexión HTTPS cifrada con TLS 1.3 de última generación, headers de seguridad HTTP y protección de cookies.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page">
            <div style="font-size:11px; font-weight:700; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">Detalles de Certificado de Seguridad</div>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:10px; color:rgba(255,255,255,0.76);">
              <div style="display:flex; justify-content:space-between;">
                <span>Estado de Conexión:</span>
                <span style="color:#10b981; font-weight:700;">Segura (HTTPS)</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Algoritmo:</span>
                <span>TLS 1.3 / AES_256_GCM</span>
              </div>
              <div style="display:flex; justify-content:space-between;" id="ssl-validation-row">
                <span>Firma Emisor:</span>
                <span style="color:#a855f7;">Let's Encrypt R3</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Validez:</span>
                <span>Expira en 90 días (Autorenovación)</span>
              </div>
            </div>
          </div>
        `;
        
        const row = document.getElementById('ssl-validation-row');
        const t1 = setTimeout(() => {
          if (row) {
            row.style.background = 'rgba(168, 85, 247, 0.1)';
            row.innerHTML = '<span>Integridad del Sitio:</span> <span style="color:#10b981; font-weight:700;">Verificado ✓</span>';
          }
        }, 1800);
        screen.dataset.t1 = t1;
      }
    },
    {
      title: "Panel de Administración",
      desc: "Dashboard interactivo con gráficas en tiempo real de visitas, tasas de rebote y embudos de ventas.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px; margin-bottom:8px;">
              <span style="font-size:11px; font-weight:700;">Métricas de Tráfico (Hoy)</span>
              <span style="font-size:9.5px; background:rgba(0,229,255,0.1); color:#00e5ff; padding:2px 6px; border-radius:6px; font-weight:700;" id="active-users-counter">124 Activos</span>
            </div>
            <div style="display:flex; align-items:flex-end; gap:8px; height:60px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
              <div style="flex:1; height:20%; background:rgba(168,85,247,0.3); border-radius:2px 2px 0 0;"></div>
              <div style="flex:1; height:45%; background:rgba(168,85,247,0.3); border-radius:2px 2px 0 0;"></div>
              <div style="flex:1; height:35%; background:rgba(168,85,247,0.3); border-radius:2px 2px 0 0;"></div>
              <div style="flex:1; height:80%; background:#a855f7; border-radius:2px 2px 0 0;" id="active-bar-4"></div>
              <div style="flex:1; height:60%; background:rgba(168,85,247,0.3); border-radius:2px 2px 0 0;"></div>
            </div>
          </div>
        `;
        
        const counter = document.getElementById('active-users-counter');
        const activeBar = document.getElementById('active-bar-4');
        
        const t1 = setTimeout(() => {
          if (counter) counter.textContent = '148 Activos';
          if (activeBar) activeBar.style.height = '95%';
        }, 1500);
        screen.dataset.t1 = t1;
        
        const t2 = setTimeout(() => {
          if (counter) counter.textContent = '182 Activos';
        }, 3000);
        screen.dataset.t2 = t2;
      }
    },
    {
      title: "Integración de Base de Datos",
      desc: "Consultas de base de datos ultrarrápidas a través de APIs REST y GraphQL firmadas criptográficamente.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page">
            <div style="font-size:11px; font-weight:700; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">API Response (JSON)</div>
            <div style="background:#05070a; border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:10px; font-family:monospace; font-size:8.5px; color:#a855f7; display:flex; flex-direction:column; gap:4px; max-height:85px; overflow:hidden;" id="web-api-response">
              <div>{</div>
              <div style="padding-left:10px;">"status": "success",</div>
              <div style="padding-left:10px;">"records_fetched": 45,</div>
              <div style="padding-left:10px;" id="api-resp-latency">"latency": "14ms"</div>
              <div>}</div>
            </div>
          </div>
        `;
        
        const latency = document.getElementById('api-resp-latency');
        const t1 = setTimeout(() => {
          if (latency) {
            latency.style.color = '#10b981';
            latency.innerHTML = '"latency": "8ms" ⚡';
          }
        }, 1500);
        screen.dataset.t1 = t1;
      }
    },
    {
      title: "Aplicación Web Progresiva (PWA)",
      desc: "Instala la plataforma como aplicación nativa en tu escritorio o celular con soporte offline y notificaciones push.",
      run: (screen) => {
        screen.innerHTML = `
          <div class="mock-web-page">
            <div style="font-size:11px; font-weight:700; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">Compatibilidad de Aplicación</div>
            <div style="display:flex; flex-direction:column; gap:8px;" id="pwa-install-container">
              <div style="background:rgba(168, 85, 247, 0.05); border:1px solid rgba(168, 85, 247, 0.2); border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:10px; font-weight:700; color:#fff;">Instalar Brain Branding</div>
                  <div style="font-size:8.5px; color:var(--text-muted);">Accede al instante desde tu escritorio</div>
                </div>
                <button id="pwa-install-btn" style="background:#a855f7; border:none; color:#fff; font-size:9.5px; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:700;">Instalar</button>
              </div>
            </div>
          </div>
        `;
        
        const container = document.getElementById('pwa-install-container');
        const btn = document.getElementById('pwa-install-btn');
        
        const t1 = setTimeout(() => {
          if (btn) {
            btn.style.background = '#10b981';
            btn.textContent = 'Instalando...';
          }
        }, 1500);
        screen.dataset.t1 = t1;
        
        const t2 = setTimeout(() => {
          if (container) {
            container.innerHTML = `
              <div style="background:rgba(16, 185, 129, 0.05); border:1px solid rgba(16, 185, 129, 0.2); border-radius:8px; padding:10px; font-size:10px; color:#10b981; text-align:center; font-weight:700;">
                ✓ Aplicación Instalada con éxito en Escritorio
              </div>
            `;
          }
        }, 3000);
        screen.dataset.t2 = t2;
      }
    }
  ];

  const initWebSimulator = () => {
    const screen = document.getElementById('web-screen-content');
    const pills = document.querySelectorAll('#web-features-icons .feature-icon-pill');
    const detailTitle = document.getElementById('web-detail-title');
    const detailDesc = document.getElementById('web-detail-desc');
    
    if (!screen) return;
    
    let currentIdx = 0;
    let timer = null;
    let isWebVisible = true;
    let isWebHovered = false;
    let consoleLogsBuffer = ['[INFO] Iniciando módulo de simulación de Brain Branding...'];
    
    const webPaths = [
      '/rendimiento-lighthouse',
      '/diseno-premium-ux',
      '/checkout-pasarela',
      '/seo-google-index',
      '/certificado-ssl-https',
      '/dashboard-administrador',
      '/api-database-json',
      '/pwa-offline-app'
    ];

    const webLogs = [
      '[SUCCESS] Lighthouse audit completed in 0.4s. 100/100 scores verified.',
      '[THEME] Visual mode changed: Dark / Light theme synchronization active.',
      '[CHECKOUT] Stripe API token verification: coupon BRAIN20 successfully applied.',
      '[SEO] Google index crawler status: verified site indexing Rank #1.',
      '[SECURITY] TLS 1.3 handshakes verified. SSL certificate SHA-256 validation status A+.',
      '[DASHBOARD] Realtime analytics channel connected. Active websocket listeners: 1.',
      '[DATABASE] Executing query SELECT * FROM portafolio. Query latency: 8ms.',
      '[PWA] Progressive web app service worker registered. Ready for offline mode.'
    ];

    const clearWebTimeouts = () => {
      if (screen.dataset.t1) { clearTimeout(parseInt(screen.dataset.t1, 10)); delete screen.dataset.t1; }
      if (screen.dataset.t2) { clearTimeout(parseInt(screen.dataset.t2, 10)); delete screen.dataset.t2; }
      if (screen.dataset.typewriter) { clearInterval(parseInt(screen.dataset.typewriter, 10)); delete screen.dataset.typewriter; }
    };
    
    const updateWebActiveIcon = (idx) => {
      pills.forEach(p => {
        const pScenario = p.getAttribute('data-web-scenario');
        if (pScenario === String(idx)) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
      
      const scenario = webScenarios[idx];
      detailTitle.textContent = scenario.title;
      detailDesc.textContent = scenario.desc;
    };
    
    const runWebCycle = () => {
      if (!isWebVisible) return;
      
      clearWebTimeouts();
      updateWebActiveIcon(currentIdx);
      
      // Update Dev Console mock log
      const consoleLogEl = document.getElementById('web-console-log');
      if (consoleLogEl) {
        consoleLogsBuffer.push(webLogs[currentIdx]);
        if (consoleLogsBuffer.length > 3) consoleLogsBuffer.shift();
        consoleLogEl.innerHTML = consoleLogsBuffer.map(log => `<div><span style="color:#ffbd2e; margin-right:6px;">▶</span><span style="color:rgba(255,255,255,0.85);">${log}</span></div>`).join('');
      }
      
      // Typewriter URL animation
      const browserUrlEl = document.getElementById('web-browser-url');
      if (browserUrlEl) {
        const base = 'https://brainbranding.com.mx';
        const path = webPaths[currentIdx];
        browserUrlEl.textContent = base;
        
        const chars = path.split('');
        let curChar = 0;
        const typeInterval = setInterval(() => {
          if (curChar >= chars.length) {
            clearInterval(typeInterval);
          } else {
            browserUrlEl.textContent += chars[curChar];
            curChar++;
          }
        }, 50);
        screen.dataset.typewriter = typeInterval;
      }
      
      const scenario = webScenarios[currentIdx];
      scenario.run(screen);
      
      timer = setTimeout(() => {
        const checkHoverAndTransition = () => {
          if (isWebHovered) {
            timer = setTimeout(checkHoverAndTransition, 500);
            return;
          }
          currentIdx = (currentIdx + 1) % webScenarios.length;
          runWebCycle();
        };
        checkHoverAndTransition();
      }, 5000);
    };
    
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (timer) clearTimeout(timer);
        const scenarioIdx = parseInt(pill.getAttribute('data-web-scenario'), 10);
        currentIdx = scenarioIdx;
        runWebCycle();
      });
    });
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isWebVisible = true;
            if (!timer) runWebCycle();
          } else {
            isWebVisible = false;
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            clearWebTimeouts();
          }
        });
      }, { threshold: 0.15 });
      
      const targetSection = document.getElementById('simulador-web');
      if (targetSection) observer.observe(targetSection);
    } else {
      runWebCycle();
    }
    
    // Device switcher button interactions for web browser container
    const switcherBtns = document.querySelectorAll('#web-device-switcher .switcher-btn');
    const browserMock = document.querySelector('.browser-container');
    if (browserMock) {
      browserMock.addEventListener('mouseenter', () => { isWebHovered = true; });
      browserMock.addEventListener('mouseleave', () => { isWebHovered = false; });
      browserMock.addEventListener('touchstart', () => { isWebHovered = true; }, { passive: true });
      browserMock.addEventListener('touchend', () => { isWebHovered = false; });
    }
    const triggerWebBoot = () => {
      const bootScreen = document.getElementById('web-boot-screen');
      const bootBar = document.getElementById('web-boot-bar');
      if (bootScreen && bootBar) {
        bootScreen.style.opacity = '1';
        bootScreen.style.pointerEvents = 'auto';
        bootBar.style.width = '0%';
        setTimeout(() => { bootBar.style.width = '100%'; }, 50);
        setTimeout(() => {
          bootScreen.style.opacity = '0';
          bootScreen.style.pointerEvents = 'none';
          setTimeout(() => { bootBar.style.width = '0%'; }, 200);
        }, 500);
      }
    };
    
    switcherBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof playDeviceSwitchSound === 'function') {
          playDeviceSwitchSound();
        }
        triggerWebBoot();
        
        setTimeout(() => {
          switcherBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const device = btn.getAttribute('data-web-device');
          if (browserMock) {
            browserMock.classList.remove('mock-mobile', 'mock-tablet', 'mock-desktop');
            if (device === 'mobile') {
              browserMock.classList.add('mock-mobile');
            } else if (device === 'tablet') {
              browserMock.classList.add('mock-tablet');
            } else if (device === 'desktop') {
              browserMock.classList.add('mock-desktop');
            }
          }
        }, 100);
      });
    });
    
    // 3D Parallax on browserContainer
    if (browserMock) {
      browserMock.addEventListener('mousemove', (e) => {
        const rect = browserMock.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((centerY - y) / centerY) * 3; // 3 deg max
        const rotateY = ((x - centerX) / centerX) * 3;
        browserMock.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        browserMock.style.transition = 'transform 0.1s ease';
      });
      browserMock.addEventListener('mouseleave', () => {
        browserMock.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        browserMock.style.transition = 'transform 0.5s ease';
      });
    }
  };

  initWebSimulator();

  // 36. Custom Software Simulator State Machine and Animations
  const renderErpTabs = (activeIdx) => {
    const tabs = [
      { label: "📊 Panel", idx: 0 },
      { label: "💸 Caja", idx: 1 },
      { label: "🧪 LIS", idx: 2 },
      { label: "📄 Facturas", idx: 3 },
      { label: "🎯 CRM", idx: 4 },
      { label: "📦 Almacén", idx: 5 },
      { label: "🛡️ Auditoría", idx: 6 },
      { label: "🔒 Seguridad", idx: 7 }
    ];
    return `
      <div class="erp-tab-bar">
        ${tabs.map(t => `<button class="erp-tab-btn ${t.idx === activeIdx ? 'active' : ''}" data-tab-idx="${t.idx}">${t.label}</button>`).join('')}
      </div>
    `;
  };

  const triggerCameraScanner = (onScanSuccess) => {
    const erpMockup = document.querySelector('.software-container') || screen;
    if (!erpMockup) return;
    
    if (typeof playDeviceSwitchSound === 'function') {
      playDeviceSwitchSound();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'erp-scanner-overlay';
    overlay.innerHTML = `
      <button class="erp-scanner-close">✕</button>
      <div style="font-size:9px; font-weight:700; margin-bottom:5px; color:#00e5ff; display:flex; align-items:center; gap:4px;">
        <span class="animate-pulse">🔴</span> ESCANEANDO CÓDIGO BARRAS LIS
      </div>
      <div class="erp-scanner-frame">
        <div class="erp-scanner-laser"></div>
        <video id="erp-scanner-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:none;"></video>
        <div class="erp-scanner-fallback" id="erp-scanner-fallback-grid">
          Iniciando Cámara...
        </div>
      </div>
      <div style="font-size:8px; color:rgba(255,255,255,0.4); margin-top:5px; text-align:center;">
        Coloca el código de barras/QR frente a la cámara
      </div>
    `;
    
    erpMockup.appendChild(overlay);
    
    let localStream = null;
    const videoEl = overlay.querySelector('#erp-scanner-video');
    const fallbackGrid = overlay.querySelector('#erp-scanner-fallback-grid');
    const closeBtn = overlay.querySelector('.erp-scanner-close');
    
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          localStream = stream;
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.style.display = 'block';
            if (fallbackGrid) fallbackGrid.style.display = 'none';
          }
        })
        .catch(err => {
          console.warn("Camera access denied/unavailable", err);
          if (fallbackGrid) fallbackGrid.textContent = "Modo Simulado: Escaneando...";
        });
    } else {
      if (fallbackGrid) fallbackGrid.textContent = "Modo Simulado: Escaneando...";
    }
    
    const playScannerBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.warn("AudioContext beep blocked", e);
      }
    };
    
    const cleanup = () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
    };
    
    let scanTimeout = setTimeout(() => {
      playScannerBeep();
      const frame = overlay.querySelector('.erp-scanner-frame');
      if (frame) {
        frame.style.borderColor = '#10b981';
        frame.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
      }
      setTimeout(() => {
        cleanup();
        onScanSuccess();
      }, 500);
    }, 3200);
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(scanTimeout);
      cleanup();
    });
  };

  const triggerConfetti = () => {
    const container = document.querySelector('.software-container') || screen;
    if (!container) return;
    for (let i = 0; i < 40; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'absolute';
      conf.style.width = `${Math.random() * 5 + 3}px`;
      conf.style.height = `${Math.random() * 8 + 5}px`;
      conf.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
      conf.style.left = `${Math.random() * 80 + 10}%`;
      conf.style.top = `-10px`;
      conf.style.zIndex = '300';
      conf.style.borderRadius = '2px';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(conf);
      
      const speed = Math.random() * 3 + 2.5;
      const drift = Math.random() * 1.5 - 0.75;
      let topVal = -10;
      let leftVal = parseFloat(conf.style.left);
      const anim = setInterval(() => {
        topVal += speed;
        leftVal += drift;
        conf.style.top = `${topVal}px`;
        conf.style.left = `${leftVal}%`;
        if (topVal > container.offsetHeight) {
          clearInterval(anim);
          conf.remove();
        }
      }, 25);
    }
  };

  const initSignaturePad = (canvas, clearBtn, confirmBtn, onConfirm) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = (e.touches && e.touches.length) ? e.touches[0].clientX : e.clientX;
      const clientY = (e.touches && e.touches.length) ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };
    
    const startDrawing = (e) => {
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };
    
    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    };
    
    const stopDrawing = () => {
      drawing = false;
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onConfirm();
      });
    }
  };



  // 32. Local client-side QR Codes generator using qrcodejs
  if (typeof QRCode === 'function') {
    // WhatsApp QR container removed

    const vcardContainer = document.getElementById("vcard-qr-container");
    if (vcardContainer) {
      new QRCode(vcardContainer, {
        text: `BEGIN:VCARD\nVERSION:3.0\nFN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Andre Krebollo - Brain Branding\nTEL;TYPE=CELL,VOICE;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=2B527712339238\nEMAIL;TYPE=PREF,INTERNET;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:andreskrebollo=40gmail=2Ecom\nURL;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:https=3A=2F=2Fbrainbranding=2Ecom=2Emx\nORG;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Brain Branding\nTITLE;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Fundador =2F Director de Software\nEND:VCARD`,
        width: 130,
        height: 130,
        colorDark : "#0a0f1d",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });
      // Touch interaction tracking for mobile devices
      vcardContainer.addEventListener('touchstart', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'qr_touch_interaction', {
            event_category: 'engagement',
            event_label: 'VCard QR Mobile'
          });
        }
      }, { passive: true });
    }
  }

  // Hero section reading retention metric
  setTimeout(() => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    // If user scrolled less than 200px after 6 seconds, report hero engagement
    if (winScroll < 200) {
      if (typeof gtag === 'function') {
        gtag('event', 'hero_read_retention', {
          event_category: 'engagement',
          event_label: 'Stayed 6s in Hero'
        });
      }
    }
  }, 6000);

  // 23. Neuromarketing "Attentive Gaze" Interactive Logo
  const logoArea = document.querySelector('.logo-area');
  const logoImg = document.querySelector('.logo-area img');
  if (logoArea && logoImg) {
    logoImg.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.3s ease';
    document.addEventListener('mousemove', (e) => {
      const rect = logoImg.getBoundingClientRect();
      const imgCenterX = rect.left + rect.width / 2;
      const imgCenterY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - imgCenterX;
      const deltaY = e.clientY - imgCenterY;
      const distance = Math.hypot(deltaX, deltaY);
      
      if (distance < 700) { // Track if mouse is relatively nearby (within 700px)
        const maxMove = 3.5; // Max pixels to translate
        const maxRotate = 12; // Max degrees to rotate in 3D
        
        const angle = Math.atan2(deltaY, deltaX);
        const intensity = 1 - distance / 700;
        const moveX = Math.cos(angle) * maxMove * intensity;
        const moveY = Math.sin(angle) * maxMove * intensity;
        
        const rotX = -(moveY / maxMove) * maxRotate;
        const rotY = (moveX / maxMove) * maxRotate;
        
        logoImg.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        // Reassuring warm cian/gold shadow follows the gaze parallax
        logoImg.style.filter = `drop-shadow(${-moveX * 0.8}px ${-moveY * 0.8}px 4px rgba(0, 229, 255, 0.65))`;
      } else {
        logoImg.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
        logoImg.style.filter = 'drop-shadow(0 0 2px rgba(99, 102, 241, 0.3))';
      }
    });
    
    // Smooth reset on mouse leave window
    document.addEventListener('mouseleave', () => {
      logoImg.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
      logoImg.style.filter = 'drop-shadow(0 0 2px rgba(99, 102, 241, 0.3))';
    });

    // 27. 3D Interactive Card Tilt Effect for Services
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((centerY - y) / centerY) * 8;
        const rotateY = ((x - centerX) / centerX) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        card.style.transition = 'transform 0.1s ease, box-shadow 0.2s ease, border-color 0.2s ease';
        
        // Calculate glare shine position percentages
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        card.style.setProperty('--glare-x', `${percentX}%`);
        card.style.setProperty('--glare-y', `${percentY}%`);
        card.style.setProperty('--glare-opacity', '0.15');
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s';
        card.style.setProperty('--glare-opacity', '0');
      });
    });

    // 33. 3D Tablet Device Parallax Effect
    const tabletContainer = document.querySelector('.tablet-container');
    if (tabletContainer) {
      tabletContainer.addEventListener('mousemove', (e) => {
        const rect = tabletContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((centerY - y) / centerY) * 4; // Max 4 degrees
        const rotateY = ((x - centerX) / centerX) * 4;
        
        tabletContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        tabletContainer.style.transition = 'transform 0.1s ease, box-shadow 0.2s ease';
      });
      
      tabletContainer.addEventListener('mouseleave', () => {
        tabletContainer.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        tabletContainer.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    }

    // Reassuring warm touch vibration & circular expand light glow ring for mobile
    logoArea.addEventListener('touchstart', () => {
      if (navigator.vibrate) {
        navigator.vibrate(12); // Reassuring short touch vibration
      }
      logoArea.classList.remove('touch-pulse');
      void logoArea.offsetWidth; // Force reflow to restart animation
      logoArea.classList.add('touch-pulse');
      setTimeout(() => {
        logoArea.classList.remove('touch-pulse');
      }, 600);
    }, { passive: true });
  }
});

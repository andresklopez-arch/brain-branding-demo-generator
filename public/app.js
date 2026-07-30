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

  // ── TELEGRAM CHAT SIMULATOR FOR BRAIN AGENT ──
  const telegramContainer = document.getElementById('telegram-messages');
  if (telegramContainer) {
    const chatScenarios = [
      // Scenario 1: Excel
      [
        { sender: 'user', text: 'Hola, necesito que proceses este Excel de ventas. Elimina los correos duplicados y saca el total vendido este mes.' },
        { sender: 'bot', text: 'Procesando archivo `ventas_julio.xlsx`... 🔍' },
        { sender: 'bot', text: '📊 **Consolidación completada:**\n- Se eliminaron **142 registros duplicados** en la columna de correo.\n- 💰 **Total de ventas del mes:** `$428,500.00 MXN`.\n- 📈 He generado un gráfico de barras con el rendimiento semanal.\n\n[Descargar archivo_procesado.xlsx] 📁' }
      ],
      // Scenario 2: Gmail
      [
        { sender: 'user', text: 'Redacta un correo para el cliente Alejandro sobre los ajustes de la cotización y adjúntame el PDF final.' },
        { sender: 'bot', text: 'Analizando historial y tono de comunicación con Alejandro... 🧠' },
        { sender: 'bot', text: '✉️ **Correo redactado en Gmail (Borrador guardado):**\n\n*Asunto:* Actualización: Propuesta de Desarrollo y Ajustes Finos\n\n*Hola Alejandro, espero que todo vaya excelente... [Ver borrador completo]*\n\n📎 Se seleccionó y adjuntó automáticamente el archivo `Propuesta_Brain_Branding_Final.pdf` de tu Google Drive.' }
      ],
      // Scenario 3: Juntas (Voice Note Simulation)
      [
        { sender: 'user', isVoice: true, text: 'Nota de voz de 0:45' },
        { sender: 'bot', text: '🎤 **Nota de voz transcrita:**\n*"Acabo de salir de la junta con el equipo. Analiza el audio de 45 min que te mandé y dime un resumen rápido."*' },
        { sender: 'bot', text: 'Analizando transcripción del audio y extrayendo puntos clave... 🎙️' },
        { sender: 'bot', text: '📝 **Minuta Ejecutiva (Junta de Operaciones):**\n\n👥 **Acuerdos Principales:**\n1. Se aprueba la migración de servidores para el 15 de agosto.\n2. Sofía coordinará la capacitación del equipo.\n\n📌 **Pendientes Asignados:**\n- **Andre:** Modificar contrato de proveedor (Fecha límite: Viernes).\n- **Alejandro:** Enviar cotización SaaS a Inmuebles Plus.' }
      ],
      // Scenario 4: Web Search
      [
        { sender: 'user', text: 'Busca en internet proveedores de servidores dedicados en México, compara precios y hazme una tabla.' },
        { sender: 'bot', text: 'Buscando y verificando fuentes en la web sin alucinaciones... 🌐' },
        { sender: 'bot', text: '🔍 **Comparativa de Servidores Dedicados en México:**\n\n| Proveedor | Plan Base | Ancho Banda | Garantía |\n| :--- | :--- | :--- | :--- |\n| **Proveedor A** | $2,499/mes | 100 Mbps | 99.9% Uptime |\n| **Proveedor B** | $2,800/mes | 1 Gbps | Red Privada |\n\n*Nota:* Proveedor B incluye red dedicada ideal para protección de datos corporativa. 🔐' }
      ],
      // Scenario 5: Agenda
      [
        { sender: 'user', text: 'Reagenda mi reunión con Alejandro para el jueves a las 3:00 PM y avísale.' },
        { sender: 'bot', text: 'Cruzando agendas y verificando disponibilidad... 📅' },
        { sender: 'bot', text: '📅 **Agenda Actualizada:**\n- La junta fue movida al **Jueves 30 de Julio a las 15:00 hrs**.\n- Se envió la invitación de Google Calendar a Alejandro y ya la aceptó.\n- 💡 *Recordatorio Proactivo:* Tienes un espacio libre de 1 hora antes de la junta por si deseas repasar la propuesta.' }
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
        .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 11.5px; color: #cbd5e1;">$1</code>');
      
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
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          titleEl.textContent = details.title;
          descEl.textContent = details.desc;
          card.style.color = details.color;
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 200);
      }
    }

    function playNextMessage() {
      if (!isSectionVisible || isLocked) return;

      const scenario = chatScenarios[currentScenarioIdx];
      
      if (currentMessageIdx >= scenario.length) {
        simulatorTimeout = setTimeout(() => {
          telegramContainer.innerHTML = '';
          currentScenarioIdx = (currentScenarioIdx + 1) % chatScenarios.length;
          currentMessageIdx = 0;
          updateActiveIcon(currentScenarioIdx);
          playNextMessage();
        }, 5000);
        return;
      }

      const msg = scenario[currentMessageIdx];
      currentMessageIdx++;

      if (msg.sender === 'user') {
        simulatorTimeout = setTimeout(() => {
          renderMessage('user', msg);
          playNextMessage();
        }, 1500);
      } else {
        simulatorTimeout = setTimeout(() => {
          showTypingIndicator();
          simulatorTimeout = setTimeout(() => {
            removeTypingIndicator();
            renderMessage('bot', msg);
            playNextMessage();
          }, 2500);
        }, 800);
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
  }
});

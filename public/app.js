/* Brain Branding - Interactive Scripts */

document.addEventListener('DOMContentLoaded', () => {
  
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
    const words = ["Inteligencia Artificial", "Diseño Premium UX/UX", "Automatización SaaS", "Demos Ultra-Rápidas"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
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
    
    observer.observe(showcaseSection);
  }

  // 5. Contact Form WhatsApp Redirection
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
        ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
      
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
        }, 1000);
      }, 600);
    });
  }

  // 6. Cookie Consent Logic
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptCookiesBtn = document.getElementById('accept-cookies-btn');
  if (cookieBanner && acceptCookiesBtn) {
    if (!localStorage.getItem('cookies_accepted')) {
      setTimeout(() => {
        cookieBanner.style.display = 'block';
      }, 1000);
    }
    acceptCookiesBtn.addEventListener('click', () => {
      localStorage.setItem('cookies_accepted', 'true');
      cookieBanner.style.opacity = '0';
      setTimeout(() => {
        cookieBanner.style.display = 'none';
      }, 300);
    });
  }

  // 7. Light/Dark Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
      themeToggleBtn.textContent = '🌙';
    } else {
      themeToggleBtn.textContent = '☀️';
    }
    
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggleBtn.textContent = isLight ? '🌙' : '☀️';
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

  // 12. Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] Service Worker registrado con éxito:', reg.scope))
        .catch(err => console.error('[PWA] Error al registrar Service Worker:', err));
    });
  }

  // 13. PWA Installation Promotion Handler
  let deferredPrompt;
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser install bar from showing
    e.preventDefault();
    // Stash the event so it can be triggered on user action
    deferredPrompt = e;
    // Show the custom install button
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'flex';
    }
  });

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', () => {
      // Hide button
      pwaInstallBtn.style.display = 'none';
      // Trigger prompt
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] El usuario aceptó instalar la app.');
          } else {
            console.log('[PWA] El usuario rechazó instalar la app.');
          }
          deferredPrompt = null;
        });
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplicación instalada exitosamente.');
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'none';
    }
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
          sessionStorage.setItem('demo_key', cleanCode);
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
});

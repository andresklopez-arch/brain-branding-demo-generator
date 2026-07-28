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
      
      const name = document.getElementById('contact-name').value.trim();
      const business = document.getElementById('contact-business').value.trim();
      const vertical = document.getElementById('contact-vertical').value;
      const desc = document.getElementById('contact-desc').value.trim();
      
      // WhatsApp pre-filled link
      const phone = "525638165507"; // WhatsApp comercial
      const text = `Hola *Brain Branding*, mi nombre es *${name}* de la empresa *${business}* (Giro: *${vertical}*).\n\nMe interesa solicitar un prototipo descriptivo de software de IA para mi negocio. Aquí te comparto la idea general:\n\n_"${desc}"_`;
      
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      
      // Open in new tab
      window.open(waUrl, '_blank');
    });
  }
});

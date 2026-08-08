/**
 * Brain Branding - Behavioral Analytics & Exit-Intent Lead Rescue Engine
 * Module: public/js/analytics.js
 */
(function() {
  const startTime = Date.now();
  let maxScroll = 0;
  let clickedElements = [];
  let sectionTime = {
    hero: 0,
    asistente_ia: 0,
    simulador_pos: 0,
    simulador_web: 0,
    contacto: 0
  };
  let geoData = null;
  let reportSent = false;
  let exitIntentAlertSent = false;

  // 1. Fetch Geolocation (Non-blocking)
  fetch('https://ipwho.is/')
    .then(r => r.json())
    .then(d => { if (d && d.success) geoData = d; })
    .catch(() => {});

  // Precise Device Specifications Parser
  const getDetailedDeviceInfo = () => {
    const ua = navigator.userAgent || '';
    let os = 'Desconocido';
    let deviceType = 'Computadora 💻';
    let browser = 'Navegador Web';

    if (/iPhone/i.test(ua)) {
      os = 'iPhone (iOS)';
      deviceType = 'Móvil 📱';
      const match = ua.match(/OS (\d+_\d+)/);
      if (match) os = `iPhone (iOS ${match[1].replace('_', '.')})`;
    } else if (/iPad/i.test(ua)) {
      os = 'iPad (iPadOS)';
      deviceType = 'Tablet 📟';
    } else if (/Android/i.test(ua)) {
      deviceType = /Mobile/i.test(ua) ? 'Móvil 📱' : 'Tablet 📟';
      const verMatch = ua.match(/Android\s([0-9.]+)/i);
      const ver = verMatch ? `Android ${verMatch[1]}` : 'Android';
      
      let model = '';
      if (/Samsung|SM-|GT-/i.test(ua)) model = 'Samsung';
      else if (/Xiaomi|Redmi|POCO/i.test(ua)) model = 'Xiaomi / Redmi';
      else if (/Motorola|Moto/i.test(ua)) model = 'Motorola';
      else if (/Huawei|HONOR/i.test(ua)) model = 'Huawei';
      else if (/OPPO|Realme/i.test(ua)) model = 'OPPO / Realme';
      else if (/Pixel/i.test(ua)) model = 'Google Pixel';

      os = model ? `${ver} (${model})` : ver;
    } else if (/Windows NT 10.0/i.test(ua)) {
      os = 'Windows 10/11 PC';
      deviceType = 'Computadora 💻';
    } else if (/Windows NT 6.1/i.test(ua)) {
      os = 'Windows 7 PC';
      deviceType = 'Computadora 💻';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      os = 'MacBook / Mac (macOS)';
      deviceType = 'Computadora 💻';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux PC';
      deviceType = 'Computadora 💻';
    }

    if (/WhatsApp/i.test(ua)) {
      browser = 'Navegador de WhatsApp 💬';
    } else if (/FBAN|FBAV/i.test(ua)) {
      browser = 'Facebook App 🔵';
    } else if (/Instagram/i.test(ua)) {
      browser = 'Instagram App 📸';
    } else if (/Telegram/i.test(ua)) {
      browser = 'Telegram App ✈️';
    } else if (/Edg\//i.test(ua)) {
      browser = 'Microsoft Edge 🌊';
    } else if (/Chrome\/([0-9]+)/i.test(ua) && !/Chromium|Edg|OPR/i.test(ua)) {
      const ver = ua.match(/Chrome\/([0-9]+)/i);
      browser = `Chrome ${ver ? ver[1] : ''} 🌐`;
    } else if (/Safari\/([0-9]+)/i.test(ua) && !/Chrome|Android/i.test(ua)) {
      browser = 'Safari 🧭';
    } else if (/Firefox\/([0-9]+)/i.test(ua)) {
      browser = 'Firefox 🦊';
    } else if (/SamsungBrowser\/([0-9]+)/i.test(ua)) {
      browser = 'Samsung Internet 📱';
    } else if (/OPR\/|Opera/i.test(ua)) {
      browser = 'Opera 🔴';
    }

    const width = window.screen ? window.screen.width : 0;
    const height = window.screen ? window.screen.height : 0;
    const resolution = (width && height) ? `${width}x${height}px` : '';

    return `${os} (${browser}) ${resolution ? '[' + resolution + ']' : ''} ${deviceType}`;
  };

  // Instant Initial Visit Recording on Load
  const recordInitialVisit = () => {
    try {
      const city = geoData ? (geoData.city || 'Ciudad de México') : 'Ciudad de México';
      const region = geoData ? (geoData.region || 'CDMX') : 'CDMX';
      const country = geoData ? (geoData.country || 'México') : 'México';
      const flag = (geoData && geoData.flag && geoData.flag.emoji) ? geoData.flag.emoji : '🇲🇽';
      const urlParams = new URLSearchParams(window.location.search);
      let source = 'Acceso Directo Web 🌐';
      if (urlParams.has('gclid') || (urlParams.get('utm_source') && urlParams.get('utm_source').includes('google')) || document.referrer.includes('google')) {
        source = 'Google Ads 🟡';
      } else if (urlParams.get('utm_source') === 'wa' || document.referrer.includes('wa.me')) {
        source = 'WhatsApp 🟢';
      } else if (document.referrer.includes('t.me')) {
        source = 'Telegram 🔵';
      }
      const device = getDetailedDeviceInfo();

      const initialRecord = {
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        city,
        region,
        country,
        flag,
        source,
        device,
        duration: 'En Navegación ⚡',
        scroll: maxScroll || 10,
        clicks: ['Ingreso a la web'],
        timestamp: new Date().toISOString()
      };

      // Save to local storage
      const rawLogs = localStorage.getItem('brain_branding_analytics_log');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.push(initialRecord);
      if (logs.length > 100) logs.shift();
      localStorage.setItem('brain_branding_analytics_log', JSON.stringify(logs));

      // Post to backend database
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialRecord)
      }).catch(function(){});
    } catch(e) {}
  };

  // Trigger initial recording 1.5 seconds after page load
  setTimeout(recordInitialVisit, 1500);

  // 2. Track Scroll Depth (%)
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const currentScroll = Math.round((window.scrollY / totalHeight) * 100);
      if (currentScroll > maxScroll) maxScroll = currentScroll;
    }
  }, { passive: true });

  // 3. Track Click Interactions
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, a, .feature-icon-pill, .switcher-btn, .erp-tab-btn, .contact-channel-card, .faq-item');
    if (btn) {
      const label = (btn.innerText || btn.getAttribute('data-tooltip') || btn.getAttribute('title') || btn.className || 'Elemento').trim().replace(/\s+/g, ' ').substring(0, 45);
      if (label && !clickedElements.includes(label)) {
        clickedElements.push(label);
        if (clickedElements.length > 10) clickedElements.shift();
      }
    }
  });

  // 4. Section Visibility Timing (Intersection Observer)
  let currentSection = 'hero';
  let sectionEnterTime = Date.now();

  const switchSectionTime = (newSec) => {
    const elapsed = Math.round((Date.now() - sectionEnterTime) / 1000);
    if (sectionTime[currentSection] !== undefined && elapsed > 0) {
      sectionTime[currentSection] += elapsed;
    }
    currentSection = newSec;
    sectionEnterTime = Date.now();
  };

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'inicio') switchSectionTime('hero');
          else if (id === 'asistente-ia') switchSectionTime('asistente_ia');
          else if (id === 'simulador-pos') switchSectionTime('simulador_pos');
          else if (id === 'simulador-web') switchSectionTime('simulador_web');
          else if (id === 'contacto') switchSectionTime('contacto');
        }
      });
    }, { threshold: 0.3 });

    ['inicio', 'asistente-ia', 'simulador-pos', 'simulador-web', 'contacto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  // 5. Function to Build & Dispatch Session Report
  const sendSessionReport = (reason) => {
    if (reportSent) return;
    reportSent = true;

    switchSectionTime(currentSection);
    const totalSecs = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const durationStr = mins > 0 ? `${mins} min ${secs} seg` : `${secs} segundos`;

    let mostAttractive = 'Vista General (Hero)';
    let maxSecTime = 0;
    const secLabels = {
      hero: 'Inicio / Caracterización',
      asistente_ia: 'Asistente IA Telegram/WhatsApp 🧠',
      simulador_pos: 'Punto de Venta POS 🛒',
      simulador_web: 'Software Personalizado & ERP 💻',
      contacto: 'Sección de Contacto & Diagnóstico 💬'
    };
    Object.entries(sectionTime).forEach(([key, time]) => {
      if (time > maxSecTime) {
        maxSecTime = time;
        mostAttractive = `${secLabels[key]} (${time}s)`;
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    let source = 'Acceso Directo Web 🌐';
    if (urlParams.has('gclid') || (urlParams.get('utm_source') && urlParams.get('utm_source').includes('google')) || document.referrer.includes('google')) {
      source = 'Google Ads 🟡';
    } else if (urlParams.get('utm_source') === 'wa' || document.referrer.includes('wa.me')) {
      source = 'WhatsApp 🟢';
    } else if (document.referrer.includes('t.me')) {
      source = 'Telegram 🔵';
    }

    const device = getDetailedDeviceInfo();
    const city = geoData ? geoData.city || 'Desconocida' : 'México';
    const region = geoData ? geoData.region || '' : '';
    const country = geoData ? geoData.country || 'México' : 'México';
    const flag = (geoData && geoData.flag && geoData.flag.emoji) ? geoData.flag.emoji : '🇲🇽';
    const isp = (geoData && geoData.connection && geoData.connection.isp) ? geoData.connection.isp : 'N/A';

    let clicksText = clickedElements.length > 0 
      ? clickedElements.map(c => `  • ${c}`).join('\n')
      : '  • Sin clics registrados (Navegación de lectura)';

    const isExitIntent = reason === 'exit_intent';
    const headerTitle = isExitIntent 
      ? '⚠️ *¡PROSPECTO A PUNTO DE ABANDONAR LA WEB!* ⚠️'
      : '📊 *REPORTE COMPLETO DE COMPORTAMIENTO WEB* 📊';

    const textMsg = `${headerTitle}\n\n` +
      `📌 *Estado:* ${reason === 'exit' ? 'Visitante cerró la web 🚪' : (isExitIntent ? 'Intención de salida detectada ⚠️' : 'Permanencia de 5 Minutos ⏱️')}\n` +
      `📍 *Ubicación:* ${city}, ${region}, ${country} ${flag}\n` +
      `⚡ *Proveedor:* ${isp}\n` +
      `🎯 *Origen:* ${source}\n` +
      `📱 *Dispositivo:* ${device}\n\n` +
      `⏱️ *Tiempo de Permanencia:* ${durationStr}\n` +
      `📜 *Profundidad Scroll:* ${maxScroll}%\n` +
      `🔥 *Sección Más Atractiva:* ${mostAttractive}\n\n` +
      `🖱️ *Interacciones y Clics:* \n${clicksText}\n\n` +
      `⏰ *Hora:* ${new Date().toLocaleTimeString('es-MX')}`;

    // Dispatch via Telegram Direct Bot API
    const tgUrl = `https://api.telegram.org/bot8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M/sendMessage?chat_id=8337803949&text=${encodeURIComponent(textMsg)}&parse_mode=Markdown`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(tgUrl);
    } else {
      fetch(tgUrl).catch(function(){});
    }

    // Save to LocalStorage analytics log
    try {
      const rawLogs = localStorage.getItem('brain_branding_analytics_log');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.push({
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        city,
        region,
        country,
        flag,
        source,
        device,
        isp,
        duration: durationStr,
        scroll: maxScroll,
        clicks: clickedElements,
        timestamp: new Date().toISOString()
      });
      if (logs.length > 100) logs.shift();
      localStorage.setItem('brain_branding_analytics_log', JSON.stringify(logs));
    } catch(e) {}

    // Send payload to Central Server Database (Render)
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, region, country, flag, source, device, isp, duration: durationStr, scroll: maxScroll, clicks: clickedElements })
    }).catch(function(){});
  };

  // 6. Exit-Intent Rescue Trigger (Desktop mouseleave top & Mobile unload)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 5 && !exitIntentAlertSent && (Date.now() - startTime > 15000)) {
      exitIntentAlertSent = true;
      sendSessionReport('exit_intent');
    }
  });

  // 7. Auto Timers (5 Minutes & Visibility Change)
  setTimeout(() => {
    sendSessionReport('5min');
  }, 300000);

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendSessionReport('exit');
    }
  });

  window.addEventListener('pagehide', () => {
    sendSessionReport('exit');
  });

})();

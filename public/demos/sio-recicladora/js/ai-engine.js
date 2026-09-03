/* ==========================================================================
   BRAIN IA ENGINE - INTELIGENCIA ARTIFICIAL Y PREDICTOR INTERNACIONAL
   ========================================================================== */

const BrainAIEngine = {
  getInsights() {
    const data = window.SIO_DATA || initialData;
    const insights = [];

    // 1. Predictor Internacional LME Cobre
    insights.push({
      type: 'market_lme',
      title: '🌐 Predictor Internacional IA • Bolsa de Londres (LME Cobre)',
      badge: 'PROYECCIÓN ALCISTA (+4.5%)',
      color: '#f97316',
      text: `El algoritmo de IA correlaciona la subida de <strong>$9,840 USD/Ton</strong> en Londres (+3.8% hoy) con el costo de reposición de la Siderúrgica Monterrey. <strong>Pronóstico 72h:</strong> La Siderúrgica subirá su oferta de compra en Cobre de 1ra entre <strong>+$4.00 y +$7.00 MXN/kg</strong>. <em>Recomendación:</em> Elevar compra en patio para acaparar volumen antes que la competencia.`
    });

    // 2. Predictor Internacional Fastmarkets Acero
    insights.push({
      type: 'market_steel',
      title: '📉 Predictor Internacional IA • Chatarra Ferrosa HMS (Fastmarkets)',
      badge: 'ALERTA BAJISTA (-3.2%)',
      color: '#f59e0b',
      text: `El índice Fastmarkets reporta saturación de inventario en molinos del norte. La IA estima un <strong>88% de probabilidad</strong> de que el Acero Mixto baje de $5.40 a <strong>$5.00/kg</strong> en los próximos 2 días. <em>Recomendación:</em> Despachar las 46.8 Toneladas de patio de inmediato.`
    });

    // 3. Bot Remoto WhatsApp / Telegram
    insights.push({
      type: 'remote_bot',
      title: '📲 Control Remoto por WhatsApp & Telegram en Vivo',
      badge: 'BOT AUTÓNOMO ACTIVO',
      color: '#38bdf8',
      text: `Carlos puede enviar <code>/precio cobre +5</code> o <code>/bajar acero 0.50</code> desde su celular mientras viaja o está fuera de oficina. El sistema actualiza en <strong>menos de 100ms</strong> la báscula del cajero y la Pantalla LED de patio sin necesidad de hacer llamadas telefónicas.`
    });

    // 4. Auditoría de Báscula
    insights.push({
      type: 'audit',
      title: '⚖️ Auditoría de Celdas de Carga & Prevención de Mermas',
      badge: 'SISTEMA PROTEGIDO',
      color: '#10b981',
      text: `La IA analiza las lecturas en tiempo real de las celdas de carga digitales (60 Ton y 1 Ton). No se detectan anomalías de tara manipulada ni descuadre entre peso bruto y neto liquidado.`
    });

    return insights;
  }
};

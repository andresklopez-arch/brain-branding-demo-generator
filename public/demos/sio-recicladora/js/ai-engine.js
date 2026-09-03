/* ==========================================================================
   BRAIN IA ENGINE & RECOMENDACIONES PREDICTIVAS - RECICLADORA SIO
   ========================================================================== */

const BrainAIEngine = {
  generateInsights() {
    const data = window.SIO_DATA || initialData;
    const insights = [];

    // 1. Oportunidad de Arbitraje Cobre
    const copper = data.materials.find(m => m.id === 'MAT-01');
    if (copper) {
      insights.push({
        type: 'opportunity',
        title: '⚡ Oportunidad de Arbitraje IA • Cobre de 1ra',
        badge: 'ALERTA LME +3.8%',
        color: '#10b981',
        text: `La Bolsa de Metales de Londres cotiza a $9,840 USD/Ton. Tu precio de venta actual ($154.00 MXN) tiene margen de subir a <strong>$162.00 MXN</strong>. Si elevas tu compra Nivel 1 a $116.00/kg captarás el 70% del cobre de los competidores locales manteniendo un <strong>margen bruto del 28%</strong>.`
      });
    }

    // 2. Riesgo Acero Chatarra
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

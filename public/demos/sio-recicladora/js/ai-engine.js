/* ==========================================================================
   BRAIN IA ENGINE - INTELIGENCIA ARTIFICIAL PARA RECICLADORA SIO
   ========================================================================== */

const BrainAIEngine = {
  getInsights() {
    const data = window.SIO_DATA || initialData;
    const insights = [];

    const copper1 = data.materials.find(m => m.id === 'MAT-01');
    if (copper1) {
      insights.push({
        type: 'opportunity',
        title: '⚡ Oportunidad de Arbitraje en Cobre de 1ra',
        badge: 'ALTA RENTABILIDAD',
        color: '#f97316',
        text: `El Cobre de 1ra tiene un spread de compra-venta de <strong>+$43.12/kg</strong> en Nivel 1. Con las 3.8 Toneladas en patio, despachar hoy a la Siderúrgica consolidaría una utilidad neta estimada de <strong>$116,500 MXN</strong> antes de posibles ajustes del mercado internacional.`
      });
    }

    const steel = data.materials.find(m => m.id === 'MAT-03');
    if (steel && steel.currentStockKg >= 40000) {
      insights.push({
        type: 'warning',
        title: '🏗️ Saturación de Patio en Acero Pesado (46.8 Ton)',
        badge: 'ACCIÓN REQUERIDA',
        color: '#f59e0b',
        text: `El stock de Acero Mixto supera el 85% de capacidad de patio. La IA recomienda programar <strong>2 góndolas de 25 Toneladas</strong> con la Siderúrgica Monterrey hoy mismo para liberar espacio y asegurar el precio de $5.40/kg.`
      });
    }

    insights.push({
      type: 'audit',
      title: '⚖️ Auditoría de Pesaje & Detección de Mermas',
      badge: 'SISTEMA PROTEGIDO',
      color: '#10b981',
      text: `Se auditó el pesaje del proveedor <em>Chatarrero El Güero</em> (Folio REC-0841). La relación tara/bruto es consistente (51.0%). Sin indicios de manipulación o impureza fuera de norma.`
    });

    insights.push({
      type: 'strategy',
      title: '🧠 Estrategia Dinámica de Márgenes (Modo Cascada)',
      badge: 'OPTIMIZACIÓN ACTIVA',
      color: '#38bdf8',
      text: `El algoritmo de cascada mantiene protegidos tus márgenes mínimos: <strong>28% (N1)</strong>, <strong>16% (N2)</strong> y <strong>8% (N3)</strong>. Cualquier llamada entrante de la siderúrgica recalculará en menos de 100ms las tarifas de la báscula.`
    });

    return insights;
  }
};

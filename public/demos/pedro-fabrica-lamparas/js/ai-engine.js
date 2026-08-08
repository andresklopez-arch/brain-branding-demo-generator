/* ==========================================================================
   MOTOR DE IA & AUTOAPRENDIZAJE - DEMO FÁBRICA DE LÁMPARAS PEDRO
   Cálculo predictivo, detección de cuellos de botella y neuromarketing
   ========================================================================== */

const AIEngine = {
  // Predicción inteligente de tiempo de entrega para un pedido
  predictDeliveryTime: function(lampId, quantity) {
    const lamp = initialData.lamps.find(l => l.id === lampId) || initialData.lamps[0];
    const qty = parseInt(quantity) || 10;

    // Simulación de cálculo de capacidad y disponibilidad
    let baseHoursPerUnit = 0.45; // 45 min por lámpara en promedio
    if (lamp.category === "Decorativo Lujo") baseHoursPerUnit = 1.2;
    if (lamp.category === "Exteriores") baseHoursPerUnit = 0.65;

    const totalHoursNeeded = Math.ceil(qty * baseHoursPerUnit);
    const activeWorkers = initialData.personnel.filter(p => p.active).length;
    const effectiveHours = (totalHoursNeeded / Math.max(1, activeWorkers * 0.85)).toFixed(1);

    // Revisar cuellos de botella en insumos
    let bottlenecks = [];
    let hasAlert = false;

    if (lamp.insumosNeeded) {
      lamp.insumosNeeded.forEach(req => {
        const component = initialData.inventories.componentes.find(c => c.name.includes(req.name)) ||
                          initialData.inventories.insumos.find(i => i.name.includes(req.name));
        if (component) {
          const totalNeeded = req.qty * qty;
          if (component.stock < totalNeeded) {
            bottlenecks.push(`⚠️ Desabasto de [${component.name}]: Requeridos ${totalNeeded}, disponible ${component.stock}`);
            hasAlert = true;
          }
        }
      });
    }

    // Convertir horas efectivas a días / horas
    const days = Math.floor(effectiveHours / 8);
    const remainingHours = Math.ceil(effectiveHours % 8);
    let timeString = "";
    if (days > 0) timeString += `${days} día${days > 1 ? 's' : ''} `;
    if (remainingHours > 0 || days === 0) timeString += `${remainingHours} hora${remainingHours > 1 ? 's' : ''}`;

    const confidence = hasAlert ? 78.5 : 98.4;

    return {
      lampName: lamp.name,
      quantity: qty,
      timeString: timeString,
      effectiveHours: effectiveHours,
      bottlenecks: bottlenecks,
      confidence: confidence,
      recommendation: hasAlert 
        ? "🤖 **IA Consejera**: Sugerimos autorizar compra exprés de componentes o reasignar 1 técnico del turno vespertino para evitar retrasos."
        : "✅ **IA Confirmación**: Capacidad de producción óptima. Puedes hacer el compromiso de entrega con el cliente con total certeza."
    };
  },

  // Generador de Alertas Dinámicas de la Operación
  generateLiveAlerts: function() {
    const alerts = [
      { text: "⚡ **Cuello de Botella Detectado**: La Estación de Ensamble Electrónico está al 92% de capacidad. IA sugiere rebalanceo de personal.", type: "warning" },
      { text: "📦 **Stock Crítico**: Quedan sólo 18 unidades de 'Driver MeanWell 150W IP67'. Recompra sugerida lanzada.", type: "danger" },
      { text: "📈 **Neuromarketing Tip**: El modelo 'Candelabro Luxury Titanium Ring' tiene un margen del 57.3%. La IA recomienda destacarlo en el Portal de Clientes.", type: "info" }
    ];
    return alerts;
  },

  // Calculadora Interactiva de ROI (Retorno de Inversión) para Pedro
  calculateROI: function(numLampsPerMonth) {
    const qty = parseInt(numLampsPerMonth) || 300;
    const paperErrorRate = 0.08; // 8% errores por papel y lápiz
    const paperHoursWasted = (qty * 0.25).toFixed(0); // 15 min por orden perdida o mala anotación
    const paperMoneyWasted = (qty * 120 * paperErrorRate).toFixed(0);

    const monthlySavings = (parseFloat(paperMoneyWasted) + 25000).toFixed(0);
    const yearlySavings = (monthlySavings * 12).toLocaleString();

    return {
      paperHoursWasted,
      paperMoneyWasted,
      monthlySavings: parseFloat(monthlySavings).toLocaleString(),
      yearlySavings
    };
  }
};

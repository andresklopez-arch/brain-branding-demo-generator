/* ==========================================================================
   ESTADO DE RESULTADOS (P&L) DINÁMICO & ANÁLISIS DE VOLATILIDAD - RECICLADORA SIO
   ========================================================================== */

const PnLEngine = {
  calculate(period = 'daily') {
    const data = window.SIO_DATA || initialData;
    
    let totalRevenue = 0;
    let totalCostOfGoodsSold = 0;
    let shippedKg = 0;

    data.shipmentsToBuyer.forEach(shipment => {
      totalRevenue += shipment.totalRevenue;
      totalCostOfGoodsSold += shipment.totalCost;
      shippedKg += shipment.shippedKg;
    });

    let periodMultiplier = 1;
    if (period === 'weekly') periodMultiplier = 2.5;
    if (period === 'monthly') periodMultiplier = 7.8;

    const scaledRevenue = totalRevenue * (period === 'daily' ? 0.6 : periodMultiplier * 0.4);
    const scaledCOGS = totalCostOfGoodsSold * (period === 'daily' ? 0.6 : periodMultiplier * 0.4);
    const grossProfitFromSales = scaledRevenue - scaledCOGS;

    let totalStockRevaluation = 0;
    data.priceChangeHistory.forEach(change => {
      totalStockRevaluation += change.revaluationImpact;
    });

    const netGrossProfit = grossProfitFromSales + (period === 'daily' ? (totalStockRevaluation * 0.5) : totalStockRevaluation);

    const op = data.operatingExpenses;
    const freight = (op.freightAndLogistics / 30) * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30);
    const fuel = (op.fuelAndMachinery / 30) * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30);
    const payroll = (op.yardPayrollAndOperators / 30) * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30);
    const utilities = (op.utilitiesAndLicenses / 30) * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30);
    const scrapWaste = (op.unrecoverableScrapWaste / 30) * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30);

    const totalOperatingExpenses = freight + fuel + payroll + utilities + scrapWaste;
    const operatingIncome = netGrossProfit - totalOperatingExpenses;
    const operatingMarginPct = scaledRevenue > 0 ? (operatingIncome / scaledRevenue) * 100 : 0;

    const materialProfitability = data.materials.map(mat => {
      const spreadT1 = mat.buyerPrice - mat.t1Price;
      const spreadT2 = mat.buyerPrice - mat.t2Price;
      const spreadT3 = mat.buyerPrice - mat.t3Price;
      const avgSpread = (spreadT1 * 0.3) + (spreadT2 * 0.5) + (spreadT3 * 0.2);
      const estimatedYardValue = mat.currentStockKg * mat.buyerPrice;
      const estimatedCost = mat.currentStockKg * mat.avgCostPerKg;
      const potentialYardProfit = estimatedYardValue - estimatedCost;

      return {
        id: mat.id,
        name: mat.name,
        category: mat.category,
        icon: mat.icon,
        currentStockKg: mat.currentStockKg,
        buyerPrice: mat.buyerPrice,
        avgSpreadPerKg: avgSpread,
        potentialYardProfit: potentialYardProfit,
        marginPct: mat.buyerPrice > 0 ? (avgSpread / mat.buyerPrice) * 100 : 0
      };
    }).sort((a, b) => b.potentialYardProfit - a.potentialYardProfit);

    return {
      period,
      periodLabel: period === 'daily' ? 'Hoy (Turno Diario)' : period === 'weekly' ? 'Semana en Curso' : 'Mes Acumulado',
      revenue: scaledRevenue,
      cogs: scaledCOGS,
      grossProfitFromSales,
      stockRevaluation: totalStockRevaluation,
      netGrossProfit,
      expenses: {
        freight,
        fuel,
        payroll,
        utilities,
        scrapWaste,
        total: totalOperatingExpenses
      },
      operatingIncome,
      operatingMarginPct,
      materialProfitability,
      totalYardStockValue: data.materials.reduce((sum, m) => sum + (m.currentStockKg * m.buyerPrice), 0),
      totalYardStockKg: data.materials.reduce((sum, m) => sum + m.currentStockKg, 0)
    };
  },

  render(period = 'daily') {
    const report = this.calculate(period);
    const container = document.getElementById('pnlReportContainer');
    if (!container) return;

    const isPositive = report.operatingIncome >= 0;
    const isRevalPositive = report.stockRevaluation >= 0;

    container.innerHTML = `
      <div class="pnl-summary-grid">
        <div class="kpi-card pnl-kpi-primary">
          <div class="kpi-label">INGRESOS POR VENTAS (SIDERÚRGICA)</div>
          <div class="kpi-value text-emerald">$${report.revenue.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="kpi-sub">Embarques liquidados • ${report.periodLabel}</div>
        </div>

        <div class="kpi-card pnl-kpi-cost">
          <div class="kpi-label">COSTO DE COMPRA DE MATERIALES (BÁSCULA)</div>
          <div class="kpi-value text-rose">$${report.cogs.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="kpi-sub">Pago a recolectores T1, T2 y T3</div>
        </div>

        <div class="kpi-card ${isRevalPositive ? 'pnl-kpi-gain' : 'pnl-kpi-loss'}">
          <div class="kpi-label">EFECTO VOLATILIDAD EN INVENTARIO (STOCK)</div>
          <div class="kpi-value ${isRevalPositive ? 'text-emerald' : 'text-amber'}">
            ${isRevalPositive ? '+' : ''}$${report.stockRevaluation.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div class="kpi-sub">Ganancia/Pérdida por cambio de cotización</div>
        </div>

        <div class="kpi-card ${isPositive ? 'pnl-kpi-success' : 'pnl-kpi-danger'}">
          <div class="kpi-label">UTILIDAD NETA OPERATIVA (EBITDA)</div>
          <div class="kpi-value ${isPositive ? 'text-neon-green' : 'text-danger'}">
            $${report.operatingIncome.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div class="kpi-sub">Margen Neto: <strong>${report.operatingMarginPct.toFixed(1)}%</strong></div>
        </div>
      </div>

      <div class="financial-statement-card">
        <div class="statement-header">
          <div>
            <h3 class="statement-title">📄 Estado de Resultados Integral • ${report.periodLabel}</h3>
            <p class="statement-subtitle">Recicladora SIO • Base Efectivo y Revalorización Ponderada</p>
          </div>
          <div class="period-switcher-pnl">
            <button class="pnl-filter-btn ${period === 'daily' ? 'active' : ''}" onclick="PnLEngine.render('daily')">Diario</button>
            <button class="pnl-filter-btn ${period === 'weekly' ? 'active' : ''}" onclick="PnLEngine.render('weekly')">Semanal</button>
            <button class="pnl-filter-btn ${period === 'monthly' ? 'active' : ''}" onclick="PnLEngine.render('monthly')">Mensual</button>
          </div>
        </div>

        <div class="statement-table-wrapper">
          <table class="statement-table">
            <tbody>
              <tr class="st-row-header">
                <td>(+) Ventas Brutas de Chatarra y Metales</td>
                <td class="text-right text-emerald font-bold">$${report.revenue.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">(-) Costo de Compras en Báscula (Proveedores T1/T2/T3)</td>
                <td class="text-right text-rose">-$${report.cogs.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">(=) Margen Comercial de Pesaje</td>
                <td class="text-right font-bold text-slate">$${report.grossProfitFromSales.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-highlight ${isRevalPositive ? 'bg-emerald-soft' : 'bg-amber-soft'}">
                <td>(±) Impacto Financiero por Volatilidad / Revalorización de Inventario en Patio</td>
                <td class="text-right font-bold ${isRevalPositive ? 'text-emerald' : 'text-amber'}">
                  ${isRevalPositive ? '+' : ''}$${report.stockRevaluation.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </td>
              </tr>
              <tr class="st-row-total">
                <td>(=) Utilidad Bruta Ajustada por Mercado</td>
                <td class="text-right font-bold text-neon-green">$${report.netGrossProfit.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>

              <tr class="st-row-header" style="padding-top: 15px;">
                <td colspan="2">(-) Gastos Operativos del Centro de Acopio SIO</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">• Fletes de Góndolas & Logística Pesada</td>
                <td class="text-right text-slate">-$${report.expenses.freight.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">• Diesel & Mantenimiento de Grúa / Cizalla / Montacargas</td>
                <td class="text-right text-slate">-$${report.expenses.fuel.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">• Nómina Operativa (Báscula, Patio & Seguridad)</td>
                <td class="text-right text-slate">-$${report.expenses.payroll.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">• Energía Trifásica, Licencia Ambiental CEDES & Servicios</td>
                <td class="text-right text-slate">-$${report.expenses.utilities.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub">
                <td style="padding-left: 24px;">• Mermas Operativas / Tierra & Impurezas Descontadas</td>
                <td class="text-right text-slate">-$${report.expenses.scrapWaste.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="st-row-sub font-semibold">
                <td style="padding-left: 24px;">(=) Total Gastos de Operación</td>
                <td class="text-right text-rose font-bold">-$${report.expenses.total.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
              </tr>

              <tr class="st-row-grand-total">
                <td>
                  <strong>( = ) UTILIDAD NETA OPERATIVA REAL (EBITDA)</strong>
                  <div style="font-size: 11px; color: #94a3b8; font-weight: normal;">Rendimiento del negocio listo para reinversión / retiro</div>
                </td>
                <td class="text-right font-bold text-neon-green" style="font-size: 1.35rem;">
                  $${report.operatingIncome.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="profitability-section">
        <h4 class="section-subheading" style="font-size:1.05rem; font-weight:800; margin-bottom:12px;">🏆 Ranking de Rentabilidad por Material en Patio</h4>
        <div class="profitability-grid">
          ${report.materialProfitability.slice(0, 4).map(mat => `
            <div class="profit-mini-card">
              <div class="profit-header">
                <span class="mat-icon">${mat.icon}</span>
                <div>
                  <div class="profit-name">${mat.name}</div>
                  <div class="profit-stock">${mat.currentStockKg.toLocaleString()} kg en patio</div>
                </div>
              </div>
              <div class="profit-metric-row">
                <span>Spread Promedio:</span>
                <strong class="text-emerald">+$${mat.avgSpreadPerKg.toFixed(2)}/kg</strong>
              </div>
              <div class="profit-metric-row">
                <span>Utilidad Potencial:</span>
                <strong class="text-neon-green">$${mat.potentialYardProfit.toLocaleString('es-MX', {maximumFractionDigits: 0})}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};

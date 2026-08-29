// Lógica pura de "¿qué slots de reporte tocan ahora?", separada de
// api/telegram.js para poder probarla sin levantar el servidor completo ni
// depender de la hora real del sistema (ver scripts/test-report-catchup.js).
// checkAndTriggerMorningReports (telegram.js) es la única que la usa en
// producción.

// cdmxHour: hora actual en CDMX (0-23). targetHours: horas de corte del
// día (ej. [6, 14, 22]). isSlotAlreadySent: (targetH) => boolean, ya
// mandado hoy o no. Regresa la lista de horas que ya vencieron y siguen
// sin mandarse -- "cdmxHour >= targetH" (no "===") es lo que permite
// recuperar un slot perdido si el proceso estaba dormido justo a la hora
// exacta y recién despierta más tarde el mismo día.
function getDueReportSlots(cdmxHour, targetHours, isSlotAlreadySent) {
  return targetHours.filter((targetH) => cdmxHour >= targetH && !isSlotAlreadySent(targetH));
}

module.exports = { getDueReportSlots };

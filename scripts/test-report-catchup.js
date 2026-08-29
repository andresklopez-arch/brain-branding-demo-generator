// Prueba la lógica pura de "¿qué reportes ya vencieron y siguen sin
// mandarse?" (api/reportScheduling.js) sin levantar el servidor ni
// depender de la hora real -- el bug que corrigió esto (reportes de
// 6/14/22 que se perdían si el servidor estaba dormido justo a esa hora)
// no tenía ninguna prueba automatizada antes.
//
// Uso: node scripts/test-report-catchup.js

const { getDueReportSlots } = require('../api/reportScheduling.js');

const TARGET_HOURS = [6, 14, 22];
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`OK   ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name} -- esperado ${JSON.stringify(expected)}, obtuvo ${JSON.stringify(actual)}`);
  }
}

// Antes de cualquier hora de corte: nada vencido todavía.
check(
  'A las 3:00 AM, sin nada enviado -- ningún slot vence todavía',
  getDueReportSlots(3, TARGET_HOURS, () => false),
  []
);

// Justo a la hora exacta, comportamiento original (=== targetH).
check(
  'A las 6:00 AM en punto, sin nada enviado -- vence el slot 6',
  getDueReportSlots(6, TARGET_HOURS, () => false),
  [6]
);

// El caso que causaba el bug: el proceso estuvo dormido y recién despierta
// horas después de que un slot debió mandarse -- debe recuperarlo, no
// perderlo para siempre.
check(
  'A las 9:00 AM (el servidor estuvo dormido desde antes de las 6) -- recupera el slot 6',
  getDueReportSlots(9, TARGET_HOURS, () => false),
  [6]
);

// Varios slots vencidos a la vez (ej. el proceso despierta hasta la noche).
check(
  'A las 23:00 sin nada enviado en todo el día -- recupera los 3 slots, en orden',
  getDueReportSlots(23, TARGET_HOURS, () => false),
  [6, 14, 22]
);

// Un slot ya enviado no se debe repetir aunque siga "vencido".
check(
  'A las 9:00 AM con el slot 6 ya marcado como enviado -- no lo repite',
  getDueReportSlots(9, TARGET_HOURS, (h) => h === 6),
  []
);

// Mezcla: uno ya enviado, otro todavía pendiente.
check(
  'A las 15:00 con el slot 6 ya enviado -- solo falta el 14',
  getDueReportSlots(15, TARGET_HOURS, (h) => h === 6),
  [14]
);

// Todos ya enviados -- no hay nada que recuperar.
check(
  'A las 23:00 con los 3 slots ya enviados -- ninguno pendiente',
  getDueReportSlots(23, TARGET_HOURS, () => true),
  []
);

console.log(`\n${failed === 0 ? 'Todo correcto' : `${failed} prueba(s) fallaron`}.`);
process.exit(failed > 0 ? 1 : 0);

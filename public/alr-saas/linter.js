const fs = require('fs');
const path = require('path');

const filesToCheck = ['app.js', 'ReyLicensingValidator.js'];
let errors = 0;
let warnings = 0;

console.log("============================================================");
console.log("🔍 INICIANDO ANALISIS DE CALIDAD ESTATICA (LIGHTWEIGHT LINTER)");
console.log("============================================================");

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  console.log(`\n📄 Analizando: ${file}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // 1. Deteccion critica de eval (Riesgo grave de inyeccion de codigo)
    if (line.match(/\beval\s*\(/)) {
      console.log(`   🛑 [ERROR] Linea ${lineNum}: Uso de eval() detectado. ¡Prohibido por seguridad!`);
      errors++;
    }
    
    // 2. Comprobar debugger activo
    if (line.match(/\bdebugger\b/)) {
      console.log(`   🛑 [ERROR] Linea ${lineNum}: Sentencia 'debugger' detectada.`);
      errors++;
    }
    
    // 3. Buenas practicas: Validar que no se usen variables sin declarar de tipo global implícito en asignaciones locales simples
    if (line.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/) && 
        !line.match(/\b(let|const|var|window|this|state|l|app|select|selectedApp|slugInput|titleInput|appSelect|counts|mrrVal|churnVal|ltvVal|custodyVal|planShareContainer|total|multInput|scaleLabel|simClients|simMrr|simArr|intact|failedIndex|failedLog|isAlertActive|updated|roleColor|glowColor|currentAdmin|inactivityTimeout|shouldNotify|parsedUrl|seedDataFromDb|loadedFromDb|businessConfig|roles|services|prefix|matchedDoc|matchedId|tgWorker|lastUpdateId|pollingInterval|isPolling|constantTimeCompare|sha256Sync|devtoolsThreshold|lastRotStr|licensesIndex|ledgerBadge|workerSecret|SESSION_KEY|SESSION_KEY_BUFFER)\b/)) {
      if (!line.includes('.') && !line.includes('[') && !line.includes('return') && !line.trim().startsWith('if')) {
        console.log(`   ⚠️ [ADVERTENCIA] Linea ${lineNum}: Posible asignacion global implicita: "${line.trim()}"`);
        warnings++;
      }
    }
    
    // 4. Seguridad: Detección de posibles API Keys reales harcodeadas expuestas (Alta entropía)
    if (line.match(/(api[_-]?key|secret|password|token)\s*=\s*["'][a-zA-Z0-9_\-]{32,}["']/i)) {
      console.log(`   🛑 [ERROR] Linea ${lineNum}: Se detecto una posible credencial o API Key real expuesta en texto plano.`);
      errors++;
    }
  });
});

console.log("\n============================================================");
console.log(`📊 RESUMEN: ${errors} Errores | ${warnings} Advertencias`);
console.log("============================================================");

if (errors > 0) {
  console.log("🛑 Operacion de pre-commit cancelada debido a errores de calidad de codigo.");
  process.exit(1);
} else {
  console.log("[✓] Analisis de calidad estatica completado con exito.");
  process.exit(0);
}

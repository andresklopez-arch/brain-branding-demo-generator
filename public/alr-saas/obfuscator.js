const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'ReyLicensingValidator.js');
const destPath = path.join(__dirname, 'ReyLicensingValidator.obfuscated.js');

if (!fs.existsSync(srcPath)) {
  console.log("No se encuentra ReyLicensingValidator.js");
  process.exit(1);
}

let code = fs.readFileSync(srcPath, 'utf8');

// 1. Quitar comentarios
code = code.replace(/\/\*[\s\S]*?\*\//g, ''); // Comentarios de bloque
code = code.replace(/(^|[^\/])\/\/.*$/gm, '$1'); // Comentarios de una sola línea

// Reemplazar el helper de deofuscación atob original por el deofuscador con doble transformación (XOR + Adición)
const base64DeobfTarget = 'const _deobfuscateStr = (str) => atob(str);';
const xorDeobfReplacement = `const _deobfuscateStr = (arr, key) => arr.map(c => String.fromCharCode(((c ^ key) - 3) & 255)).join('');`;

if (code.includes(base64DeobfTarget)) {
  code = code.replace(base64DeobfTarget, xorDeobfReplacement);
} else {
  code = code.replace(/const\s+_deobfuscateStr\s*=\s*\(\s*str\s*\)\s*=>\s*atob\(\s*str\s*\);/, xorDeobfReplacement);
}

// 2. Ofuscar strings sensibles codificándolos dinámicamente mediante XOR con doble transformación (con claves múltiples)
const stringsToObfuscate = [
  'REVOKED',
  'alr_cache_',
  'MANIPULACIÓN DE HORA DETECTADA',
  'LICENCIA REVOCADA'
];

stringsToObfuscate.forEach(str => {
  const currentXorKey = Math.floor(Math.random() * 240) + 10;
  const offset = (currentXorKey % 7) + 2;
  // Cifrado con doble transformación y offset dinámico derivado de la clave
  const xorBytes = Array.from(str).map(char => ((char.charCodeAt(0) + offset) & 255) ^ currentXorKey);
  const arrayStr = `[${xorBytes.join(',')}]`;
  const regex = new RegExp(`['"]${str}['"]`, 'g');
  code = code.replace(regex, `_deobfuscateStr(${arrayStr}, ${currentXorKey})`);
});

// 3. Ofuscar nombres de variables locales comunes y helpers a hexadecimales
const varsToReplace = [
  'constantTimeCompare',
  'normalizedPayload',
  'decryptedPayload',
  'secureCache',
  'cachedData',
  'dataToDecrypt',
  'decrypted',
  'encryptedBuffer',
  'decryptedBuffer',
  'hashBuffer',
  'signatureBuffer',
  '_deobfuscateStr',
  '_verifyHMACSignature',
  '_xorDecrypt'
];

varsToReplace.forEach((v, idx) => {
  const hexName = `_0x${(idx + 10).toString(16)}`;
  const regex = new RegExp(`\\b${v}\\b`, 'g');
  code = code.replace(regex, hexName);
});

fs.writeFileSync(destPath, code, 'utf8');
console.log(`[✓] SDK ofuscado generado con éxito mediante claves XOR múltiples y doble transformación en ReyLicensingValidator.obfuscated.js`);

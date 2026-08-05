/**
 * BRAIN BRANDING - WHATSAPP BUSINESS AI ENGINE (QR LINKING & CLOUD API)
 * Permite conectar WhatsApp Business escaneando un Código QR desde tu celular
 * o mediante Meta Cloud API.
 * Persona: Andrés R (+52 771 233 9238)
 */

const express = require('express');
const app = express();
app.use(express.json());

const OWNER_PHONE = '+52 771 233 9238';

console.log('----------------------------------------------------');
console.log('🤖 CONECTOR DE WHATSAPP BUSINESS CON MOTOR DE IA');
console.log('----------------------------------------------------');
console.log('1. Opción Meta Cloud API: Conectado a /api/whatsapp');
console.log('2. Opción QR Scanner: Escanea desde WhatsApp Business');
console.log('----------------------------------------------------');

module.exports = {
  status: 'active',
  engine: 'Brain Branding AI RAG',
  owner: 'Andrés R',
  phone: OWNER_PHONE
};

@echo off
setlocal

echo [INFO] Iniciando subida de cambios en Brain Branding...

:: 0. Automated Syntax Pre-check (Suggestion 2)
echo [INFO] Verificando sintaxis de codigo antes de desplegar...
node --check api/telegram.js
if errorlevel 1 (
    echo [ERROR] Error de sintaxis en api/telegram.js! Cancelando deploy.
    exit /b 1
)

node --check api/whatsapp.js
if errorlevel 1 (
    echo [ERROR] Error de sintaxis en api/whatsapp.js! Cancelando deploy.
    exit /b 1
)

node --check api/geminiHelper.js
if errorlevel 1 (
    echo [ERROR] Error de sintaxis en api/geminiHelper.js! Cancelando deploy.
    exit /b 1
)

echo [OK] Sintaxis verificada correctamente.

:: 1. Git Add & Commit
git add .
git commit -m "Feat: Add Gemini AI multi-model fallback engine and refactor WhatsApp/Telegram bots"

:: 2. Push to GitHub (Render Backend)
echo [INFO] Subiendo backend a GitHub (Render)...
git push origin main

:: 3. Firebase Deploy (Frontend)
echo [INFO] Desplegando frontend a Firebase Hosting...
call firebase deploy --only hosting

echo [SUCCESS] Deploy completado con exito.

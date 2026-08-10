@echo off
setlocal

echo [INFO] Iniciando subida de cambios en Brain Branding...

:: 1. Git Add & Commit
git add .
git commit -m "Fix: Silence visit alerts and configure API_BASE for 2FA OTP"

:: 2. Push to GitHub (Render Backend)
echo [INFO] Subiendo backend a GitHub (Render)...
git push origin main

:: 3. Firebase Deploy (Frontend)
echo [INFO] Desplegando frontend a Firebase Hosting...
call firebase deploy --only hosting

echo [SUCCESS] Deploy completado con exito.

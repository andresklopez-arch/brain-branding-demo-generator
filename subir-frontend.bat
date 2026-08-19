@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════════
::  Brain Branding — Deploy SOLO FRONTEND (Firebase Hosting)
:: ═══════════════════════════════════════════════════════════

echo [FRONTEND] Desplegando public/ a Firebase Hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo [ERROR] Firebase deploy falló. Ejecuta: firebase login
    set STATUS=fail
) else (
    echo [OK] Firebase Hosting actualizado.
    set STATUS=ok
)

for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"HH:mm\""') do set T=%%d
powershell -command "Invoke-RestMethod -Uri 'https://brain-branding-demo-generator.onrender.com/api/deploy-notify' -Method POST -ContentType 'application/json' -Body '{\"firebase\":\"%STATUS%\",\"timestamp\":\"%T%\"}'" >nul 2>&1
echo [OK] Notificación enviada a Telegram (via servidor, ya no con el token embebido aqui).

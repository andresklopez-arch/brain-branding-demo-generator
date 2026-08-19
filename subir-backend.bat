@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════════
::  Brain Branding — Deploy SOLO BACKEND (Render via GitHub)
:: ═══════════════════════════════════════════════════════════

echo [BACKEND] Subiendo cambios del servidor a GitHub...
git add api/ package.json >nul 2>&1
git diff --cached --quiet
if not errorlevel 1 (
    echo [OK] Sin cambios en el backend.
    goto notify
)

for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set DT=%%d
git commit -m "Backend update [%DT%]" >nul 2>&1
git push origin main >nul 2>&1
echo [OK] Backend en GitHub. Render redespliegará automaticamente.

:notify
for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"HH:mm\""') do set T=%%d
powershell -command "Invoke-RestMethod -Uri 'https://brain-branding-demo-generator.onrender.com/api/deploy-notify' -Method POST -ContentType 'application/json' -Body '{\"backend\":\"ok\",\"timestamp\":\"%T%\"}'" >nul 2>&1
echo [OK] Notificación enviada a Telegram (via servidor, ya no con el token embebido aqui).

@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════════
::  Brain Branding — Deploy SOLO BACKEND (Render via GitHub)
:: ═══════════════════════════════════════════════════════════

set TG_TOKEN=8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M
set TG_CHAT=8337803949

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
for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"dd/MM/yyyy HH:mm\""') do set T=%%d
set MSG=⚙️ *BACKEND ACTUALIZADO* (Render)%%0A%%0A📦 GitHub push completado%%0A🤖 Render redespliegue automático iniciado%%0A⏰ %T%

powershell -command "Invoke-RestMethod -Uri 'https://api.telegram.org/bot%TG_TOKEN%/sendMessage' -Method POST -ContentType 'application/json' -Body ('{\"chat_id\":\"%TG_CHAT%\",\"text\":\"%MSG%\",\"parse_mode\":\"Markdown\"}' -replace '%%0A',[char]10)" >nul 2>&1
echo [OK] Notificación enviada a Telegram.

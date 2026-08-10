@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════════
::  Brain Branding — Deploy SOLO FRONTEND (Firebase Hosting)
:: ═══════════════════════════════════════════════════════════

set TG_TOKEN=8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M
set TG_CHAT=8337803949

echo [FRONTEND] Desplegando public/ a Firebase Hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo [ERROR] Firebase deploy falló. Ejecuta: firebase login
    set STATUS=❌ FALLÓ
) else (
    echo [OK] Firebase Hosting actualizado.
    set STATUS=✅ OK
)

for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"dd/MM/yyyy HH:mm\""') do set T=%%d
set MSG=🌐 *FRONTEND ACTUALIZADO* (Firebase Hosting)%%0A%%0A📦 Estado: %STATUS%%%0A🔗 https://brainbranding.com.mx%%0A⏰ %T%

powershell -command "Invoke-RestMethod -Uri 'https://api.telegram.org/bot%TG_TOKEN%/sendMessage' -Method POST -ContentType 'application/json' -Body ('{\"chat_id\":\"%TG_CHAT%\",\"text\":\"%MSG%\",\"parse_mode\":\"Markdown\"}' -replace '%%0A',[char]10)" >nul 2>&1
echo [OK] Notificación enviada a Telegram.

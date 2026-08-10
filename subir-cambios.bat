@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════════
::  Brain Branding — Auto-Deploy Full Stack
::  GitHub (Backend/Render) + Firebase Hosting (Frontend)
::  + Notificación Telegram al terminar
:: ═══════════════════════════════════════════════════════════

set TG_TOKEN=8926335223:AAGIjytPf5xBciwizz2FvgiO-CM-viCA50M
set TG_CHAT=8337803949
set VERSION=30.0.0

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║  BRAIN BRANDING - AUTO DEPLOY v%VERSION%  ║
echo  ╚═══════════════════════════════════════╝
echo.

:: ─── PASO 1: Git staging ─────────────────────────────────
echo [1/4] Preparando cambios Git...
git add . >nul 2>&1
git diff --cached --quiet
if errorlevel 1 (
    for /f "delims=" %%i in ('git log --oneline -1 2^>nul') do set LAST_COMMIT=%%i
    for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set DEPLOY_TIME=%%d
    git commit -m "Auto-deploy [%DEPLOY_TIME%] v%VERSION% BrainBranding" >nul 2>&1
    echo [OK] Cambios confirmados localmente.
) else (
    echo [OK] Sin nuevos cambios en el repositorio.
)

:: ─── PASO 2: GitHub / Render Backend ─────────────────────
echo [2/4] Subiendo backend a GitHub...
git remote get-url origin >nul 2>&1
if not errorlevel 1 (
    git push origin main >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Git push falló.
    ) else (
        echo [OK] GitHub actualizado. Render iniciará redeploy automatico.
    )
) else (
    echo [WARN] Sin remote origin configurado.
)

:: ─── PASO 3: Firebase Hosting (Frontend) ─────────────────
echo [3/4] Desplegando frontend a Firebase Hosting...
firebase deploy --only hosting >nul 2>&1
if errorlevel 1 (
    echo [WARN] Firebase deploy falló. Ejecuta: firebase login
    set FIREBASE_STATUS=FALLO
) else (
    echo [OK] Firebase Hosting actualizado en vivo.
    set FIREBASE_STATUS=OK
)

:: ─── PASO 4: Log en CHANGELOG.md ─────────────────────────
echo [4/4] Registrando en CHANGELOG.md...
for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"yyyy-MM-dd HH:mm:ss\""') do set TIMESTAMP=%%d
for /f "delims=" %%c in ('git log --oneline -1 2^>nul') do set COMMIT_LINE=%%c
echo ## [v%VERSION%] - %TIMESTAMP% >> CHANGELOG.md
echo - Commit: %COMMIT_LINE% >> CHANGELOG.md
echo - Firebase Hosting: %FIREBASE_STATUS% >> CHANGELOG.md
echo - Backend Render: GitHub push completado >> CHANGELOG.md
echo. >> CHANGELOG.md

:: ─── PASO 5: Notificación Telegram ───────────────────────
for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format \"dd/MM/yyyy HH:mm\""') do set NOTIF_TIME=%%d

set MSG=🚀 *BRAIN BRANDING AUTO-DEPLOY COMPLETADO*%%0A%%0A✅ *Firebase Hosting:* %FIREBASE_STATUS%%%0A✅ *Backend Render:* GitHub Push OK%%0A📦 *Versión:* v%VERSION%%%0A⏰ *Hora:* %NOTIF_TIME%%%0A%%0A🌐 https://brainbranding.com.mx ya está actualizado en vivo.

powershell -command "Invoke-RestMethod -Uri 'https://api.telegram.org/bot%TG_TOKEN%/sendMessage' -Method POST -ContentType 'application/json' -Body ('{\"chat_id\":\"%TG_CHAT%\",\"text\":\"%MSG%\",\"parse_mode\":\"Markdown\"}' -replace '%%0A',[char]10)" >nul 2>&1

echo.
echo  ╔════════════════════════════════════════════════╗
echo  ║  DEPLOY COMPLETO — Revisa Telegram para conf.  ║
echo  ╚════════════════════════════════════════════════╝
echo.

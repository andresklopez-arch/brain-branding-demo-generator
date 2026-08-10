@echo off
chcp 65001 >nul
:: ═══════════════════════════════════════════════════════════
::  Brain Branding — Activar Auto-Deploy Watcher
::  Ejecuta este archivo UNA SOLA VEZ.
::  A partir de entonces, cada vez que guardes un archivo
::  en public/ o api/, el deploy se lanzará automáticamente.
:: ═══════════════════════════════════════════════════════════

echo.
echo  ╔════════════════════════════════════════════════╗
echo  ║  BRAIN BRANDING — INICIANDO AUTO-DEPLOY        ║
echo  ║  Monitoreo de cambios en public/ y api/        ║
echo  ╚════════════════════════════════════════════════╝
echo.
echo  Cada vez que guardes un archivo, el deploy
echo  se ejecutara automaticamente en 8 segundos.
echo.
echo  Para DETENER el watcher: cierra esta ventana.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0auto-deploy.ps1"

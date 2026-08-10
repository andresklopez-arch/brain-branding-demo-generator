@echo off
echo [INFO] Iniciando subida de cambios en Brain Branding Web...

if not exist .git (
    echo [INFO] Inicializando repositorio Git...
    git init
    git branch -M main
    git config user.email "andre@example.com"
    git config user.name "Andre"
)

git add .
if errorlevel 1 (
    echo [ERROR] Falló al agregar cambios.
    exit /b 1
)

git commit -m "Auto-commit: Adición de Hermes Agent"

git remote get-url origin >nul 2>&1
if errorlevel 1 goto noremote
echo [INFO] Subiendo cambios a GitHub (git push)...
git push origin main
goto firebase

:noremote
echo [WARNING] No hay repositorio remoto origin configurado.

:firebase
echo [INFO] Desplegando frontend a Firebase Hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo [WARNING] Firebase deploy falló o no está autenticado. Ejecuta: firebase login
) else (
    echo [SUCCESS] Firebase Hosting actualizado en vivo.
)

:end
echo [SUCCESS] Cambios locales confirmados en Git.

# Brain Branding — Auto-Deploy PowerShell Watcher
# Monitorea cambios en public/ y api/ y lanza subir-cambios.bat automáticamente
# Uso: Ejecutar una sola vez. Deja la ventana abierta mientras desarrollas.
# Detener: Cierra la ventana de PowerShell o presiona Ctrl+C

param(
    [string]$ProjectPath = "C:\Users\andre\.gemini\antigravity\scratch\Brain_Branding_Web",
    [int]$DebounceSeconds = 8
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host " ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║  BRAIN BRANDING — AUTO-DEPLOY WATCHER ACTIVO ║" -ForegroundColor Cyan
Write-Host " ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host " Monitoreando cambios en:" -ForegroundColor Yellow
Write-Host "   📁 $ProjectPath\public" -ForegroundColor Green
Write-Host "   📁 $ProjectPath\api" -ForegroundColor Green
Write-Host ""
Write-Host " Cada vez que guardes un archivo, el deploy se ejecutará" -ForegroundColor White
Write-Host " automáticamente en $DebounceSeconds segundos." -ForegroundColor White
Write-Host ""
Write-Host " Presiona Ctrl+C para detener el watcher." -ForegroundColor Red
Write-Host ""

# File System Watchers
$watcherPublic = New-Object System.IO.FileSystemWatcher
$watcherPublic.Path = "$ProjectPath\public"
$watcherPublic.IncludeSubdirectories = $true
$watcherPublic.EnableRaisingEvents = $true
$watcherPublic.Filter = "*.*"

$watcherApi = New-Object System.IO.FileSystemWatcher
$watcherApi.Path = "$ProjectPath\api"
$watcherApi.IncludeSubdirectories = $false
$watcherApi.EnableRaisingEvents = $true
$watcherApi.Filter = "*.js"

$lastDeployTime = [datetime]::MinValue
$deployScript = "$ProjectPath\subir-cambios.bat"

$action = {
    $now = [datetime]::Now
    $global:pendingDeploy = $true
    $global:lastChangeTime = $now
    $fileName = $Event.SourceEventArgs.Name
    Write-Host " 📝 Cambio detectado: $fileName — deploy en $using:DebounceSeconds seg..." -ForegroundColor Yellow
}

# Register events
Register-ObjectEvent $watcherPublic -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcherPublic -EventName "Created" -Action $action | Out-Null
Register-ObjectEvent $watcherApi    -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcherApi    -EventName "Created" -Action $action | Out-Null

$global:pendingDeploy = $false
$global:lastChangeTime = [datetime]::MinValue

# Main loop with debounce
while ($true) {
    Start-Sleep -Seconds 1

    if ($global:pendingDeploy) {
        $elapsed = ([datetime]::Now - $global:lastChangeTime).TotalSeconds
        if ($elapsed -ge $DebounceSeconds) {
            $global:pendingDeploy = $false
            Write-Host ""
            Write-Host " 🚀 Iniciando Auto-Deploy..." -ForegroundColor Cyan
            Write-Host " ─────────────────────────────────────" -ForegroundColor DarkGray

            Push-Location $ProjectPath
            & cmd /c $deployScript
            Pop-Location

            Write-Host " ─────────────────────────────────────" -ForegroundColor DarkGray
            Write-Host " ✅ Deploy completado. Vuelvo a monitorear cambios..." -ForegroundColor Green
            Write-Host ""
        }
    }
}

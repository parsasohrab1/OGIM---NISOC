# Live run of the Dehloran field dashboard without internet and without a backend
# Prerequisite: npm install must have been done once (with internet) in frontend/web

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Web = Join-Path $Root "frontend\web"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Offline live dashboard — Dehloran field" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "Error: Node.js is not installed or is not in PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $Web "node_modules"))) {
    Write-Host "The node_modules folder was not found." -ForegroundColor Yellow
    Write-Host "Internet is needed the first time:" -ForegroundColor Yellow
    Write-Host "  cd frontend\web" -ForegroundColor White
    Write-Host "  npm install" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Install now with internet? (y/N)"
    if ($choice -match '^[yY]') {
        Set-Location $Web
        npm install
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } else {
        exit 1
    }
}

Set-Location $Web

# Force offline mode even if env is not loaded
$env:VITE_OFFLINE_LIVE = "true"

Write-Host "Starting Vite in offline mode..." -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard address: http://127.0.0.1:3000/" -ForegroundColor Cyan
Write-Host "Live data: local simulation of the Dehloran field (every 4 seconds)" -ForegroundColor Cyan
Write-Host "No internet / backend required." -ForegroundColor Cyan
Write-Host ""

# Open the browser after a short delay
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://127.0.0.1:3000/"
} | Out-Null

npm run dev:offline

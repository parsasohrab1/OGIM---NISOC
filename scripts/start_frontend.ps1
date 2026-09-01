# PowerShell startup script for frontend web portal

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting OGIM Frontend Web Portal" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$frontendPath = Join-Path $PSScriptRoot "..\frontend\web"
Set-Location $frontendPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting development server..." -ForegroundColor Yellow
npm run dev


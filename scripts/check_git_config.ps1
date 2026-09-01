# Script to check and display Git configuration

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Git Configuration Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Git installation
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed" -ForegroundColor Red
    Write-Host "   Install from: https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

$gitVersion = git --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Git is not installed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check repository
if (Test-Path ".git") {
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
    
    $currentBranch = git branch --show-current
    Write-Host "   Current branch: $currentBranch" -ForegroundColor Gray
    
    # Check remote
    $remotes = git remote -v
    if ($remotes) {
        Write-Host "✅ Remote configured:" -ForegroundColor Green
        $remotes | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "⚠️  No remote configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Not a git repository" -ForegroundColor Yellow
    Write-Host "   Run: git init" -ForegroundColor Gray
}
Write-Host ""

# Check user configuration
$userName = git config user.name
$userEmail = git config user.email

if ($userName -and $userEmail) {
    Write-Host "✅ User configured:" -ForegroundColor Green
    Write-Host "   Name:  $userName" -ForegroundColor Gray
    Write-Host "   Email: $userEmail" -ForegroundColor Gray
} else {
    Write-Host "❌ User not configured!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Run these commands:" -ForegroundColor Yellow
    Write-Host "   git config --global user.name 'Your Name'" -ForegroundColor Gray
    Write-Host "   git config --global user.email 'your.email@example.com'" -ForegroundColor Gray
}

Write-Host ""

# Check other useful settings
Write-Host "Other Git Settings:" -ForegroundColor Cyan
$color = git config --global color.ui
$autocrlf = git config --global core.autocrlf
$defaultBranch = git config --global init.defaultBranch

if ($color) {
    Write-Host "   Color UI: $color" -ForegroundColor Gray
}
if ($autocrlf) {
    Write-Host "   Auto CRLF: $autocrlf" -ForegroundColor Gray
}
if ($defaultBranch) {
    Write-Host "   Default branch: $defaultBranch" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan


# PowerShell Git setup script for OGIM project

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "OGIM Git Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

# Initialize git repository if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Check if user name and email are configured
$userName = git config user.name
$userEmail = git config user.email

if ([string]::IsNullOrEmpty($userName) -or [string]::IsNullOrEmpty($userEmail)) {
    Write-Host ""
    Write-Host "Git user configuration is missing!" -ForegroundColor Yellow
    Write-Host "Please run:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name 'Your Name'" -ForegroundColor Gray
    Write-Host "  git config --global user.email 'your.email@example.com'" -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "Do you want to configure now? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $name = Read-Host "Enter your name"
        $email = Read-Host "Enter your email"
        git config --global user.name $name
        git config --global user.email $email
        Write-Host "Git configuration updated!" -ForegroundColor Green
    }
}

# Show current git status
Write-Host ""
Write-Host "Current Git Configuration:" -ForegroundColor Cyan
Write-Host "  User: $(git config user.name)" -ForegroundColor Gray
Write-Host "  Email: $(git config user.email)" -ForegroundColor Gray
Write-Host "  Branch: $(git branch --show-current)" -ForegroundColor Gray
Write-Host ""

# Show remote if configured
if (git remote | Select-String -Pattern "origin" -Quiet) {
    Write-Host "Remote Repository:" -ForegroundColor Cyan
    git remote -v
} else {
    Write-Host "No remote repository configured." -ForegroundColor Yellow
    Write-Host "To add a remote repository:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <repository-url>" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Git setup complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan


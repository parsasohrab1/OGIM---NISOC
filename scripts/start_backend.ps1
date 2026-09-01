# PowerShell startup script for backend services

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting OGIM Backend Services" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$dockerComposePath = Join-Path $PSScriptRoot "..\infrastructure\docker\docker-compose.yml"

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "Starting Docker Compose services..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..\infrastructure\docker")
docker-compose up -d

Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "Checking service health..." -ForegroundColor Yellow

$services = @(
    @{Name="api-gateway"; Port=8000},
    @{Name="auth-service"; Port=8001},
    @{Name="data-ingestion-service"; Port=8002},
    @{Name="ml-inference-service"; Port=8003},
    @{Name="alert-service"; Port=8004},
    @{Name="reporting-service"; Port=8005},
    @{Name="command-control-service"; Port=8006},
    @{Name="tag-catalog-service"; Port=8007},
    @{Name="digital-twin-service"; Port=8008}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $($service.Name) is healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "[FAIL] $($service.Name) is not responding" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Backend services started!" -ForegroundColor Green
Write-Host "API Gateway: http://localhost:8000" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan


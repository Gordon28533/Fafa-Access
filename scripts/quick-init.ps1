# Quick PostgreSQL Setup Check and Init
# Run this after PostgreSQL installation completes

Write-Host "=== PostgreSQL Setup Check ===" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL
$pgVersions = @("16", "17", "15", "14")
$pgPath = $null

foreach ($ver in $pgVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$ver"
    if (Test-Path $testPath) {
        $pgPath = $testPath
        Write-Host "Found PostgreSQL $ver at: $pgPath" -ForegroundColor Green
        break
    }
}

if (-not $pgPath) {
    Write-Host "PostgreSQL not found in Program Files" -ForegroundColor Red
    Write-Host "Installation may still be in progress or failed." -ForegroundColor Yellow
    Write-Host "Check the elevated PowerShell window for install status." -ForegroundColor Yellow
    exit 1
}

$pgBin = Join-Path $pgPath "bin"
$psql = Join-Path $pgBin "psql.exe"

# Check service
Write-Host ""
Write-Host "Checking PostgreSQL service..." -ForegroundColor Cyan

$serviceNames = @("postgresql-x64-16", "postgresql-x64-17", "PostgreSQL 16 Server")
$service = $null

foreach ($svcName in $serviceNames) {
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svc) {
        $service = $svc
        Write-Host "Found service: $($svc.Name) - Status: $($svc.Status)" -ForegroundColor Green
        break
    }
}

if ($service) {
    if ($service.Status -ne "Running") {
        Write-Host "Starting service..." -ForegroundColor Yellow
        try {
            Start-Service $service.Name
            Start-Sleep -Seconds 3
            Write-Host "Service started" -ForegroundColor Green
        } catch {
            Write-Host "Failed to start service: $_" -ForegroundColor Red
            Write-Host "Try running this script as Administrator" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "Service is already running" -ForegroundColor Green
    }
} else {
    Write-Host "No PostgreSQL service found" -ForegroundColor Red
    Write-Host "Service might not be registered yet" -ForegroundColor Yellow
    exit 1
}

# Test connection and create database
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Cyan
$env:PGPASSWORD = "Gordon28"

& $psql -U postgres -h localhost -c "SELECT version();" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Connected successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Creating database Fafa_Access..." -ForegroundColor Cyan
    
    & $psql -U postgres -h localhost -c "CREATE DATABASE fafa_access;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database created!" -ForegroundColor Green
    } else {
        Write-Host "Database might already exist (checking...)" -ForegroundColor Yellow
        & $psql -U postgres -h localhost -l | Select-String "Fafa_Access"
    }
    
    Write-Host ""
    Write-Host "=== Setup Complete ===" -ForegroundColor Green
    Write-Host "Database: fafa_access" -ForegroundColor Cyan
    Write-Host "User: postgres" -ForegroundColor Cyan
    Write-Host "Password: Gordon28" -ForegroundColor Cyan
    Write-Host "Host: localhost" -ForegroundColor Cyan
    Write-Host "Port: 5432" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to run migrations: npm run db:migrate" -ForegroundColor Yellow
    
} else {
    Write-Host "Connection failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "The installer may have set a different password for postgres user." -ForegroundColor Yellow
    Write-Host "Check the password you entered during installation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To reset password (requires modifying pg_hba.conf):" -ForegroundColor Yellow
    Write-Host "1. Edit: $pgPath\data\pg_hba.conf"
    Write-Host "2. Change METHOD from 'scram-sha-256' to 'trust' for local connections"
    Write-Host "3. Restart service"
    Write-Host "4. Run: psql -U postgres -c `"ALTER USER postgres PASSWORD 'Gordon28';`""
    Write-Host "5. Revert pg_hba.conf changes"
}

# Reset PostgreSQL Password - PowerShell Version
# This script sets postgres user password to Gordon28

$pgPath = "C:\Program Files\PostgreSQL\16"
$pgData = "$pgPath\data"
$pgHba = "$pgData\pg_hba.conf"
$pgBin = "$pgPath\bin"
$psql = "$pgBin\psql.exe"

Write-Host "=== PostgreSQL Password Reset ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Backup pg_hba.conf"
Write-Host "2. Allow passwordless connection"
Write-Host "3. Set postgres password to Gordon28"
Write-Host "4. Restore original configuration"
Write-Host ""

# Check if pg_hba.conf exists
if (-not (Test-Path $pgHba)) {
    Write-Host "ERROR: pg_hba.conf not found at $pgHba" -ForegroundColor Red
    exit 1
}

# Backup
$backupPath = "$pgHba.backup"
if (Test-Path $backupPath) {
    Remove-Item $backupPath -Force
}
Copy-Item $pgHba $backupPath
Write-Host "Backed up to: $backupPath" -ForegroundColor Green

# Read and modify pg_hba.conf
Write-Host "Modifying pg_hba.conf..." -ForegroundColor Yellow
$content = Get-Content $pgHba -Raw

# Replace scram-sha-256 with trust for local connections
$modified = $content -replace '(^127\.0\.0\.1.*?)\s+scram-sha-256', '$1 trust'
$modified = $modified -replace '(^::1.*?)\s+scram-sha-256', '$1 trust'

# Write modified version
Set-Content $pgHba $modified -Force

# Restart service
Write-Host "Restarting PostgreSQL service..." -ForegroundColor Yellow
Stop-Service "postgresql-x64-16" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service "postgresql-x64-16" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Set password
Write-Host "Setting postgres password..." -ForegroundColor Yellow
$env:PGPASSWORD = ""
& $psql -U postgres -h localhost -c "ALTER USER postgres PASSWORD 'Gordon28';" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Password set successfully!" -ForegroundColor Green
} else {
    Write-Host "Error setting password. Attempting with localhost..." -ForegroundColor Yellow
    & $psql -U postgres -h 127.0.0.1 -c "ALTER USER postgres PASSWORD 'Gordon28';" 2>$null
}

# Restore pg_hba.conf
Write-Host "Restoring original pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $backupPath $pgHba -Force
Remove-Item $backupPath -Force

# Restart again with original config
Write-Host "Restarting service with original configuration..." -ForegroundColor Yellow
Stop-Service "postgresql-x64-16" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service "postgresql-x64-16" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Test connection
Write-Host ""
Write-Host "Testing connection with new password..." -ForegroundColor Cyan
$env:PGPASSWORD = "Gordon28"
& $psql -U postgres -h localhost -c "SELECT version();" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Connected with password!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Creating database Fafa_Access..." -ForegroundColor Cyan
    & $psql -U postgres -h localhost -c 'CREATE DATABASE fafa_access;' 2>$null
    
    Write-Host ""
    Write-Host "=== Complete ===" -ForegroundColor Green
    Write-Host "Database: fafa_access" -ForegroundColor Cyan
    Write-Host "User: postgres" -ForegroundColor Cyan
    Write-Host "Password: Gordon28" -ForegroundColor Cyan
    Write-Host "Host: localhost" -ForegroundColor Cyan
    Write-Host "Port: 5432" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to run: npm run db:migrate" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Connection failed with new password" -ForegroundColor Red
    Write-Host "The password reset may have failed." -ForegroundColor Yellow
}

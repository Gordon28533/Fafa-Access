# Requires: winget v1.12+, Admin PowerShell
# Installs PostgreSQL 16 and initializes password + database

param(
  [string]$Version = "16",
  [string]$DbName = "fafa_access",
  [string]$Password = "Gordon28"
)

Write-Host "Checking winget..."
winget --version | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "winget not found. Please update to Windows 11 or install winget."
  exit 1
}

$pkgId = "PostgreSQL.PostgreSQL.$Version"
Write-Host "Installing PostgreSQL $Version via winget... (this may prompt a GUI installer)"
winget install --id $pkgId --accept-package-agreements --accept-source-agreements

# Guess install path (default)
$pgBin = "C:\Program Files\PostgreSQL\$Version\bin"
$psql = Join-Path $pgBin "psql.exe"

if (-not (Test-Path $psql)) {
  Write-Warning "psql not found at $psql. If you chose a custom path, update the script."
}

# Wait for service to be up (service name can vary by version)
Start-Sleep -Seconds 5

Write-Host "Attempting to set postgres password and create database '$DbName'..."
$env:PGPASSWORD = $Password

# Try to connect without password first; if fails, prompt.
& $psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "If prompted by the installer, ensure the postgres superuser password is '$Password', or adjust below."
}

# Initialize DB and password using psql
$initSqlPath = Join-Path $PSScriptRoot "init-postgres.sql"
if (-not (Test-Path $initSqlPath)) {
  Write-Error "Missing init-postgres.sql next to this script."
  exit 1
}

# Run init SQL
& $psql -h localhost -U postgres -d postgres -f $initSqlPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to initialize postgres. You may need to re-run with the correct current password and uncomment ALTER USER line."
  exit 1
}

Write-Host "PostgreSQL setup complete. DB: $DbName, user: postgres"

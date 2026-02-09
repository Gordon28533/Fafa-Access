# PostgreSQL Diagnostic and Startup Helper
# Finds the PostgreSQL installation and attempts to start the service

Write-Host "=== PostgreSQL Diagnostic ===" -ForegroundColor Cyan

# 1. Check common install paths
$commonPaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL"
)

$pgPath = $null
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "Found PostgreSQL directory: $path" -ForegroundColor Green
        $pgPath = $path
        break
    }
}

if (-not $pgPath) {
    Write-Host "PostgreSQL not found in common paths" -ForegroundColor Red
    Write-Host "If installed via SQL Workbench connection, you may be using a remote server." -ForegroundColor Yellow
    Write-Host "Please provide the server hostname/IP for your .env file." -ForegroundColor Yellow
    exit 1
}

# 2. Find installed versions
$versions = Get-ChildItem $pgPath -Directory | Where-Object { $_.Name -match '^\d+' }
if ($versions) {
    Write-Host "Found versions: $($versions.Name -join ', ')" -ForegroundColor Green
    $latestVersion = $versions | Sort-Object Name -Descending | Select-Object -First 1
    $pgBin = Join-Path $latestVersion.FullName "bin"
    Write-Host "Using: $($latestVersion.Name)" -ForegroundColor Cyan
} else {
    Write-Host "No version directories found" -ForegroundColor Red
    exit 1
}

# 3. Check if server is running
$psql = Join-Path $pgBin "psql.exe"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"

if (Test-Path $psql) {
    Write-Host "Found psql: $psql" -ForegroundColor Green
} else {
    Write-Host "psql not found at $psql" -ForegroundColor Red
}

# 4. Try to find the service
$services = Get-Service | Where-Object { $_.DisplayName -match "PostgreSQL" -or $_.Name -match "postgres" }
if ($services) {
    foreach ($svc in $services) {
        Write-Host "Found service: $($svc.Name) - Status: $($svc.Status)" -ForegroundColor Green
        if ($svc.Status -ne "Running") {
            Write-Host "Attempting to start $($svc.Name)..." -ForegroundColor Yellow
            try {
                Start-Service $svc.Name
                Write-Host "Service started successfully!" -ForegroundColor Green
            } catch {
                Write-Host "Failed to start: $_" -ForegroundColor Red
                Write-Host "Try running as Administrator or start manually from Services app" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "No PostgreSQL service found in Windows Services" -ForegroundColor Red
    Write-Host "PostgreSQL might be installed but not registered as a service." -ForegroundColor Yellow
    Write-Host "Check if you are connecting to a remote server instead." -ForegroundColor Yellow
}

# 5. Test connection
Write-Host "" 
Write-Host "=== Testing Connection ===" -ForegroundColor Cyan
$testResult = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
if ($testResult.TcpTestSucceeded) {
    Write-Host "Port 5432 is accepting connections!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: npm run db:migrate" -ForegroundColor Cyan
} else {
    Write-Host "Port 5432 is not accepting connections" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check if PostgreSQL is installed locally or if you are using a remote server"
    Write-Host "2. If remote, update .env with the correct hostname"
    Write-Host "3. If local but no service, you may need to initialize the data directory"
    Write-Host "4. Check firewall settings"
}

Write-Host ""
Write-Host "=== Connection String ===" -ForegroundColor Cyan
Write-Host "Current .env setting:" -ForegroundColor Yellow
Write-Host "DATABASE_URL=postgresql://postgres:Gordon28@localhost:5432/Fafa_Access"
Write-Host ""
Write-Host "If using remote server, change localhost to your server hostname/IP" -ForegroundColor Yellow

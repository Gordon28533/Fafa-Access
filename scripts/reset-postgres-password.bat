@echo off
REM Reset PostgreSQL postgres user password to Gordon28
REM This script temporarily allows passwordless connection, sets the password, then reverts

setlocal enabledelayedexpansion

set PG_PATH=C:\Program Files\PostgreSQL\16
set PG_DATA=%PG_PATH%\data
set PG_HBA=%PG_DATA%\pg_hba.conf
set PG_BIN=%PG_PATH%\bin

echo === PostgreSQL Password Reset ===
echo.
echo This will temporarily allow passwordless connection to set the correct password
echo.

REM Check if pg_hba.conf exists
if not exist "%PG_HBA%" (
    echo ERROR: pg_hba.conf not found at %PG_HBA%
    echo PostgreSQL installation incomplete?
    pause
    exit /b 1
)

echo Backing up pg_hba.conf...
copy "%PG_HBA%" "%PG_HBA%.backup" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot backup pg_hba.conf
    pause
    exit /b 1
)
echo Backup created: %PG_HBA%.backup
echo.

echo Modifying pg_hba.conf to allow local trust connection...
REM Create temporary modified version - change local/127.0.0.1 entries to trust
(
    for /f "tokens=*" %%a in ('type "%PG_HBA%"') do (
        set "line=%%a"
        REM Skip comments and empty lines, process IPv4 local connections
        if "!line:~0,1!" neq "#" (
            if "!line!" neq "" (
                echo !line! | findstr /i "127.0.0.1.*scram" >nul
                if !ERRORLEVEL! equ 0 (
                    echo !line:scram-sha-256=trust!
                ) else (
                    echo !line!
                )
            ) else (
                echo.
            )
        ) else (
            echo !line!
        )
    )
) > "%PG_HBA%.tmp"

move /y "%PG_HBA%.tmp" "%PG_HBA%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot update pg_hba.conf
    move /y "%PG_HBA%.backup" "%PG_HBA%" >nul
    pause
    exit /b 1
)
echo Modified. Restarting PostgreSQL service...
echo.

REM Restart service
net stop postgresql-x64-16 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-16 >nul 2>&1
timeout /t 3 /nobreak >nul

echo Connecting as postgres (no password)...
REM Connect without password and set new password
"%PG_BIN%\psql.exe" -U postgres -h localhost -c "ALTER USER postgres PASSWORD 'Gordon28';" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Password changed to 'Gordon28'
    echo.
) else (
    echo ERROR: Could not change password
    echo Restoring original pg_hba.conf...
    move /y "%PG_HBA%.backup" "%PG_HBA%" >nul
    net stop postgresql-x64-16 >nul 2>&1
    timeout /t 2 /nobreak >nul
    net start postgresql-x64-16 >nul 2>&1
    pause
    exit /b 1
)

echo Restoring original pg_hba.conf...
move /y "%PG_HBA%.backup" "%PG_HBA%" >nul
echo Restarting PostgreSQL service...
net stop postgresql-x64-16 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-16 >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo Testing new password...
set PGPASSWORD=Gordon28
"%PG_BIN%\psql.exe" -U postgres -h localhost -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Connected with password Gordon28
    echo.
    echo Creating database Fafa_Access...
    "%PG_BIN%\psql.exe" -U postgres -h localhost -c "CREATE DATABASE \"Fafa_Access\";" 2>nul
    echo.
    echo === All Done ===
    echo Password: Gordon28
    echo Database: Fafa_Access
    echo Host: localhost
    echo Port: 5432
    echo.
    echo Ready to run: npm run db:migrate
) else (
    echo ERROR: Cannot connect with new password
    echo Check if the service restarted correctly
)

echo.
pause

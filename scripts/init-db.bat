@echo off
REM Initialize PostgreSQL Server and Create Database
REM Run this AFTER PostgreSQL is installed

echo === PostgreSQL Initialization ===
echo.

REM Find PostgreSQL installation
set PG_PATH=
if exist "C:\Program Files\PostgreSQL\16" set PG_PATH=C:\Program Files\PostgreSQL\16
if exist "C:\Program Files\PostgreSQL\17" set PG_PATH=C:\Program Files\PostgreSQL\17
if exist "C:\Program Files\PostgreSQL\15" set PG_PATH=C:\Program Files\PostgreSQL\15

if "%PG_PATH%"=="" (
    echo ERROR: PostgreSQL not found in Program Files
    echo Please install PostgreSQL first.
    pause
    exit /b 1
)

echo Found PostgreSQL at: %PG_PATH%
echo.

REM Set paths
set PGBIN=%PG_PATH%\bin
set PATH=%PGBIN%;%PATH%

REM Check if service is running
echo Checking PostgreSQL service...
sc query postgresql-x64-16 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Service not found. Checking alternative names...
    sc query "PostgreSQL 16 Server" >nul 2>&1
)

REM Try to start service
echo Starting PostgreSQL service...
net start postgresql-x64-16 2>nul
if %ERRORLEVEL% NEQ 0 (
    net start "PostgreSQL 16 Server" 2>nul
)

REM Wait a moment for server to be ready
timeout /t 3 /nobreak >nul

REM Test connection
echo.
echo Testing connection...
set PGPASSWORD=Gordon28
"%PGBIN%\psql.exe" -U postgres -h localhost -c "SELECT version();" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Connected to PostgreSQL
    echo.
    
    REM Create database
    echo Creating database Fafa_Access...
    "%PGBIN%\psql.exe" -U postgres -h localhost -c "CREATE DATABASE fafa_access;" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Database created successfully!
    ) else (
        echo Database might already exist or creation failed
        echo Checking if it exists...
        "%PGBIN%\psql.exe" -U postgres -h localhost -c "\l" | findstr Fafa_Access
    )
    
    echo.
    echo === Setup Complete ===
    echo Database: fafa_access
    echo User: postgres
    echo Password: Gordon28
    echo Host: localhost
    echo Port: 5432
    echo.
    echo You can now run: npm run db:migrate
    
) else (
    echo ERROR: Cannot connect to PostgreSQL
    echo.
    echo The installer may have set a different password.
    echo Please check the password you set during installation.
    echo.
    echo If you need to reset the password, you can:
    echo 1. Find pg_hba.conf in %PG_PATH%\data
    echo 2. Temporarily change authentication to 'trust'
    echo 3. Restart service and set password with:
    echo    psql -U postgres -c "ALTER USER postgres PASSWORD 'Gordon28';"
)

echo.
pause

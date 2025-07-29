@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: CONFIGURATION
set APP_DIR=C:\Server\htdocs\expedientes-digitales
set MAINT_TEMPLATE=%APP_DIR%\maintenance-template.html
set MAINT_FILE=%APP_DIR%\maintenance.html
set PM2_APP=expedientes-digitales

:: === 1. ASK FOR DURATION ===
:ASK_DURATION
set /p DURATION="Enter expected downtime (minutes, e.g. 15): "

:: Validate: must be a positive integer
for /f "delims=0123456789" %%A in ("%DURATION%") do (
    echo [ERROR] Invalid input. Enter numbers only.
    goto ASK_DURATION
)
if "%DURATION%"=="" (
    echo [ERROR] Duration cannot be empty.
    goto ASK_DURATION
)

:: === 2. CALCULATE ETA ===
for /f "tokens=1-4 delims=:. " %%a in ("%time%") do (
    set /a hh=100%%a %% 100, mm=100%%b %% 100, ss=100%%c %% 100
)
set /a mm+=%DURATION%
set /a hh+=(mm/60), mm%%=60
if !hh! lss 10 set hh=0!hh!
if !mm! lss 10 set mm=0!mm!
set ETA_DATE=%date%
set ETA_TIME=!hh!:!mm!:!ss!

:: ISO format for JavaScript
set ETA_STR=%date:~6,4%-%date:~3,2%-%date:~0,2%T!hh!:!mm!:!ss!

echo [INFO] Maintenance ETA: %ETA_STR%

:: === 3. GENERATE MAINTENANCE PAGE WITH ETA ===
if not exist "%MAINT_TEMPLATE%" (
    echo [ERROR] Template file %MAINT_TEMPLATE% not found!
    pause
    exit /b 1
)
copy "%MAINT_TEMPLATE%" "%MAINT_FILE%" >nul
powershell -Command "(Get-Content '%MAINT_FILE%') -replace '{{ETA}}','%ETA_STR%' | Set-Content '%MAINT_FILE%'"

:: === 4. ENABLE MAINTENANCE MODE ===
echo === Enabling Maintenance Mode ===
echo 1 > "%APP_DIR%\maintenance.flag"
iisreset

:: === 5. UPDATE CODE FROM GIT ===
echo === Pulling latest code from origin/main ===
cd /d "%APP_DIR%"
git fetch origin main
git reset --hard origin/main

:: === 6. INSTALL & BUILD ===
echo === Installing dependencies & building ===
call npm ci
call npm run build
if errorlevel 1 (
    echo !!! Build failed. Keeping site in maintenance mode !!!
    pause
    exit /b 1
)

:: === 7. RELOAD PM2 ===
echo === Reloading PM2 ===
pm2 reload %PM2_APP%

:: === 8. RESTART IIS ===
echo === Restarting IIS ===
iisreset

:: === 9. DISABLE MAINTENANCE MODE ===
echo === Disabling Maintenance Mode ===
del "%APP_DIR%\maintenance.flag"
iisreset

echo === ✅ Deployment Completed Successfully ===
pause
ENDLOCAL

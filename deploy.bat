@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ===== CONFIG =====
set APP_DIR=C:\Server\htdocs\expedientes-digitales
set MAINT_TEMPLATE=%APP_DIR%\maintenance-template.html
set MAINT_FILE=%APP_DIR%\maintenance.html
set PM2_APP=expedientes-digitales
set DURATION=5

REM ===== ETA (adds %DURATION% mins) =====
for /f "tokens=1-4 delims=:. " %%a in ("%time%") do (
  set /a hh=100%%a %% 100, mm=100%%b %% 100, ss=100%%c %% 100
)
set /a mm+=%DURATION%
set /a hh+=(mm/60), mm%%=60
if !hh! lss 10 set hh=0!hh!
if !mm! lss 10 set mm=0!mm!
set ETA_STR=%date:~6,4%-%date:~3,2%-%date:~0,2%T!hh!:!mm!:!ss!

echo [INFO] Maintenance ETA: %ETA_STR%

REM ===== Maintenance page =====
if not exist "%MAINT_TEMPLATE%" (
  echo [ERROR] Template file %MAINT_TEMPLATE% not found!
  exit /b 1
)
copy /Y "%MAINT_TEMPLATE%" "%MAINT_FILE%" >nul
powershell -Command "(Get-Content '%MAINT_FILE%') -replace '{{ETA}}','%ETA_STR%' | Set-Content '%MAINT_FILE%'"

echo === Enabling Maintenance Mode ===
echo 1 > "%APP_DIR%\maintenance.flag"

REM ===== Stop IIS and PM2 app BEFORE touching node_modules =====
iisreset /stop >nul 2>&1
pm2 stop %PM2_APP% >nul 2>&1

REM ===== Update code =====
echo === Pulling latest code from origin/main ===
cd /d "%APP_DIR%"
git fetch origin main
git reset --hard origin/main

REM ===== Clean potentially locked Prisma engine =====
echo [INFO] Cleaning old dependencies...
rmdir /S /Q "%APP_DIR%\node_modules\.prisma" 2>nul

REM ===== Install & build =====
echo === Installing dependencies ^& building ===
call npm ci
if errorlevel 1 (
  echo !!! npm ci failed. Keeping site in maintenance mode !!!
  goto :fail
)

call npm run build
if errorlevel 1 (
  echo !!! Build failed. Keeping site in maintenance mode !!!
  goto :fail
)

REM ===== Restart PM2 app and IIS =====
pm2 start %PM2_APP% >nul 2>&1
pm2 reload %PM2_APP%

iisreset /start >nul 2>&1

REM ===== Disable maintenance mode =====
del /Q "%APP_DIR%\maintenance.flag" >nul 2>&1

echo === ✅ Deployment Completed Successfully ===
ENDLOCAL
exit /b 0

:fail
iisreset /start >nul 2>&1
ENDLOCAL
exit /b 1

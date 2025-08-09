@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ===== CONFIG =====
set APP_DIR=C:\Server\htdocs\expedientes-digitales
set MAINT_TEMPLATE=%APP_DIR%\maintenance-template.html
set MAINT_FILE=%APP_DIR%\maintenance.html
set PM2_APP=SIGNIA
set IIS_APPPOOL=EXP-DIGITAL
set DURATION=5
set EXITCODE=0

echo [STEP] Calculating maintenance ETA...
for /f "tokens=1-4 delims=:. " %%a in ("%time%") do (
    set /a hh=100%%a %% 100, mm=100%%b %% 100, ss=100%%c %% 100
)
set /a mm+=%DURATION%
set /a hh+=(mm/60), mm%%=60
if !hh! lss 10 set hh=0!hh!
if !mm! lss 10 set mm=0!mm!
set ETA_STR=%date:~6,4%-%date:~3,2%-%date:~0,2%T!hh!:!mm!:!ss!
echo [INFO] Maintenance ETA: %ETA_STR%

echo [STEP] Preparing maintenance page (optional)...
if exist "%MAINT_TEMPLATE%" (
    copy /Y "%MAINT_TEMPLATE%" "%MAINT_FILE%" >nul
    powershell -Command "(Get-Content '%MAINT_FILE%') -replace '{{ETA}}','%ETA_STR%' | Set-Content '%MAINT_FILE%'" 2>nul
) else (
    echo [WARN] Maintenance template not found at "%MAINT_TEMPLATE%". Skipping.
)

echo [STEP] Enabling maintenance mode...
echo 1 > "%APP_DIR%\maintenance.flag"

echo [STEP] Stopping IIS App Pool: %IIS_APPPOOL%...
%systemroot%\system32\inetsrv\appcmd stop apppool /apppool.name:"%IIS_APPPOOL%" >nul 2>&1

echo [STEP] Stopping PM2 app: %PM2_APP%...
cmd /c "pm2 stop %PM2_APP%"

echo [STEP] Updating code from origin/main...
cd /d "%APP_DIR%"
if errorlevel 1 (
    echo [ERROR] APP_DIR not found: %APP_DIR%
    set EXITCODE=1
    goto :end
)

git fetch origin main
if errorlevel 1 (
    echo [ERROR] Git fetch failed.
    set EXITCODE=1
    goto :end
)

git reset --hard origin/main
if errorlevel 1 (
    echo [ERROR] Git reset failed.
    set EXITCODE=1
    goto :end
)

echo [STEP] Clearing locked Prisma engine (if any)...
rmdir /S /Q "%APP_DIR%\node_modules\.prisma" 2>nul

echo [STEP] Installing dependencies (legacy peer deps)...
call npm ci --legacy-peer-deps
if errorlevel 1 (
    echo [ERROR] npm ci failed.
    set EXITCODE=1
    goto :end
)

echo [STEP] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Prisma generate failed.
    set EXITCODE=1
    goto :end
)

echo [STEP] Building project...
call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed.
    set EXITCODE=1
    goto :end
)

echo [STEP] Starting PM2 app: %PM2_APP%...
cmd /c "pm2 start %PM2_APP%"
cmd /c "pm2 reload %PM2_APP%"

echo [STEP] Starting IIS App Pool: %IIS_APPPOOL%...
%systemroot%\system32\inetsrv\appcmd start apppool /apppool.name:"%IIS_APPPOOL%" >nul 2>&1

echo [STEP] Disabling maintenance mode...
del /Q "%APP_DIR%\maintenance.flag" >nul 2>&1

echo [DONE] Deployment completed successfully.
goto :end

:fail
echo [FAIL] Deployment failed. Keeping maintenance mode enabled.
%systemroot%\system32\inetsrv\appcmd start apppool /apppool.name:"%IIS_APPPOOL%" >nul 2>&1
set EXITCODE=1

:end
ENDLOCAL
if "%GITHUB_ACTIONS%"=="" (
    pause
) else (
    exit /b %EXITCODE%
)

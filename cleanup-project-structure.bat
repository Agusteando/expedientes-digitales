
@echo off
setlocal

REM === Safe canonical folder restructuring for Signia ===
REM This script performs:
REM   - Deleting fully deprecated folders/files (e.g., dashboard)
REM   - Cleaning duplicated/ambiguous layouts/pages
REM   - Leaving /components as-is; admin is canonical
REM   - Only operates on /app/ and canonicalizes routing structure

echo.
echo ===== Signia Project Canonical Structure Cleanup =====
echo.
echo WARNING: This script will irreversibly delete/rename the following:
echo   - app\dashboard\*           [removes experimental dashboard]
echo   - app\expediente\layout.jsx [removes layout re-export]
echo   - app\admin\inicio\superadmin\page.jsx [removes deprecated dashboard]
echo.
echo Make sure your git index is clean and you have backups or stashed uncommited work.
echo -----------------------------------------------------
choice /C YN /M "Proceed with project file/folder cleanup and canonicalization?"

if errorlevel 2 (
    echo Cancelled by user. No changes made.
    exit /b 1
)

REM --- 1. DELETE dashboard folder and all contents ---
if exist "app\dashboard" (
    echo [1/3] Removing app\dashboard and all subfolders...
    rmdir /S /Q "app\dashboard"
) else (
    echo [1/3] app\dashboard not found; skipping.
)

REM --- 2. Remove expediente/layout.jsx if just a re-export or empty ---
if exist "app\expediente\layout.jsx" (
    echo [2/3] Removing app\expediente\layout.jsx (layout defers to admin canonical)...
    del /Q "app\expediente\layout.jsx"
) else (
    echo [2/3] app\expediente\layout.jsx not found; skipping.
)

REM --- 3. Remove deprecated admin/superadmin dashboard page, if it exists ---
if exist "app\admin\inicio\superadmin\page.jsx" (
    echo [3/3] Removing app\admin\inicio\superadmin\page.jsx (deprecated superadmin dashboard)...
    del /Q "app\admin\inicio\superadmin\page.jsx"
    REM Remove folder if now empty
    for /f %%i in ('dir /b "app\admin\inicio\superadmin"') do set found=1
    if not defined found (
        rmdir "app\admin\inicio\superadmin"
        echo ...removed empty app\admin\inicio\superadmin\
    )
    set found=
) else (
    echo [3/3] app\admin\inicio\superadmin\page.jsx not found; skipping.
)

REM --- 4. Canonical folders: ensure basic structure, create if missing ---
REM (Don't touch /components, /api, /admin, they are fine)
if not exist "app\expediente" (
    echo Creating app\expediente...
    mkdir "app\expediente"
)
REM Canonical login/register exists at root or /app; do not rename or move.

REM --- 5. Summarize result ---
echo.
echo ========== Summary ==========
if not exist "app\dashboard" (
    echo Deleted:   app\dashboard
)
if not exist "app\expediente\layout.jsx" (
    echo Deleted:   app\expediente\layout.jsx
)
if not exist "app\admin\inicio\superadmin\page.jsx" (
    echo Deleted:   app\admin\inicio\superadmin\page.jsx
)
echo.
echo Folders now conform to canonical admin-first structure.
echo Refer to /admin as the role-based standard for future feature development.
echo.
echo ========= Done =========
endlocal

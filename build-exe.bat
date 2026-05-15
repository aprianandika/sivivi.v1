@echo off
REM Builds Sivivi as a Windows installer (.exe). Mirrors source to the user's
REM Documents folder first so esbuild's parent-directory walk doesn't trip on
REM the restricted C:\Local parent. Result is copied back to release\.
REM
REM Double-click to run. First build takes ~5 minutes (downloads Electron
REM binary ~150MB on first run, cached afterwards).

setlocal
set SOURCE_DIR=%~dp0
set BUILD_DIR=%USERPROFILE%\Documents\Sivivi-build

echo.
echo ============================================================
echo   Sivivi - Build Windows Installer (.exe)
echo ============================================================
echo.
echo   Source : %SOURCE_DIR%
echo   Build  : %BUILD_DIR%
echo.

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo [1/4] Syncing source files to build folder...
robocopy "%SOURCE_DIR%" "%BUILD_DIR%" /E ^
  /XD node_modules dist release generated .git ^
  /XF *.zip *.tar *.rar *.7z ^
  /NJH /NJS /NDL /NFL >nul
echo       done.

cd /d "%BUILD_DIR%"

if not exist node_modules (
  echo [2/4] Installing dependencies (one-time, ~2 min)...
  call npm install
  if errorlevel 1 (
    echo INSTALL FAILED
    pause
    exit /b 1
  )
) else (
  echo [2/4] Dependencies already installed - skipping.
)

echo [3/4] Building installer (this takes a few minutes)...
echo       - vite build (renderer)
echo       - electron-builder (NSIS installer)
echo.
call npm run dist:installer
if errorlevel 1 (
  echo BUILD FAILED. See errors above.
  pause
  exit /b 1
)

echo.
echo [4/4] Copying installer back to source folder...
if not exist "%SOURCE_DIR%release" mkdir "%SOURCE_DIR%release"
robocopy "%BUILD_DIR%\release" "%SOURCE_DIR%release" *.exe /NJH /NJS /NDL /NFL >nul

echo.
echo ============================================================
echo   BUILD COMPLETE
echo ============================================================
echo.
echo   Installer:
for %%F in ("%SOURCE_DIR%release\*.exe") do echo     %%F
echo.
echo   Distribute the .exe to user laptops. Double-click to install.
echo   Default install path: %%LOCALAPPDATA%%\Programs\Sivivi
echo.
echo   Note: Windows SmartScreen will warn "Unknown publisher" on first
echo   run. User clicks "More info" then "Run anyway". This is normal
echo   for unsigned binaries. To eliminate the warning, buy a code
echo   signing certificate ($150-$400/year).
echo ============================================================
echo.

start "" "%SOURCE_DIR%release"

pause

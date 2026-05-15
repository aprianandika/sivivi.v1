@echo off
REM Builds Sivivi as a portable .exe (single file, no install).
REM
REM Mirrors source to the user's Documents folder so esbuild doesn't trip on
REM the restricted C:\Local parent. Result copied back to release\.
REM
REM Double-click to run.

setlocal
set SOURCE_DIR=%~dp0
set BUILD_DIR=%USERPROFILE%\Documents\Sivivi-build

echo.
echo ============================================================
echo   Sivivi - Build Portable .exe (single file, no install)
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

echo [3/4] Building portable .exe (this takes a few minutes)...
echo       - vite build (renderer)
echo       - electron-builder (portable target)
echo.
call npm run dist:portable
if errorlevel 1 (
  echo BUILD FAILED. See errors above.
  pause
  exit /b 1
)

echo.
echo [4/4] Copying portable .exe back to source folder...
if not exist "%SOURCE_DIR%release" mkdir "%SOURCE_DIR%release"
robocopy "%BUILD_DIR%\release" "%SOURCE_DIR%release" *portable*.exe /NJH /NJS /NDL /NFL >nul

echo.
echo ============================================================
echo   BUILD COMPLETE
echo ============================================================
echo.
echo   Portable .exe:
for %%F in ("%SOURCE_DIR%release\*portable*.exe") do echo     %%F
echo.
echo   Distribute via USB / network share / chat. User double-clicks
echo   the .exe - no install, no admin needed. Extracts to a temp folder
echo   on each run and launches Sivivi.
echo.
echo   Heads up: portable .exe is more frequently false-flagged by AV
echo   than NSIS installer (because of the 7z self-extractor wrapper).
echo   If a user's AV blocks it, ask them to whitelist or run
echo   build-exe.bat instead for the NSIS installer (.exe with wizard).
echo.
echo   Windows SmartScreen will show "Unknown publisher" on first run.
echo   User clicks "More info" then "Run anyway".
echo ============================================================
echo.

start "" "%SOURCE_DIR%release"

pause

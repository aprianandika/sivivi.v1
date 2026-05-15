@echo off
REM Production-style local server.
REM
REM Workaround for "Access is denied" build error: the original folder lives
REM under C:\Local which has restricted parent permissions (esbuild walks up
REM and trips on it). This script mirrors the source into the user's Documents
REM folder, builds there, then serves the built dist/ at http://[IP]:5173.
REM
REM Double-click to run. First build takes a few minutes (npm install + build).
REM Subsequent runs are fast — only changed source files are re-copied.

setlocal
set SOURCE_DIR=%~dp0
set BUILD_DIR=%USERPROFILE%\Documents\Sivivi-build

echo.
echo ============================================================
echo   Sivivi - Production Local Server (LAN)
echo ============================================================
echo.
echo   Source : %SOURCE_DIR%
echo   Build  : %BUILD_DIR%
echo.

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo [1/3] Syncing source files to build folder...
robocopy "%SOURCE_DIR%" "%BUILD_DIR%" /E ^
  /XD node_modules dist release generated .git release ^
  /XF *.zip *.tar *.rar *.7z ^
  /NJH /NJS /NDL /NFL >nul
echo       done.

cd /d "%BUILD_DIR%"

if not exist node_modules (
  echo [2/3] Installing dependencies (one-time, ~2 min)...
  call npm install
  if errorlevel 1 (
    echo INSTALL FAILED
    pause
    exit /b 1
  )
) else (
  echo [2/3] Dependencies already installed - skipping.
)

echo [3/3] Building production bundle...
call npm run build:web
if errorlevel 1 (
  echo BUILD FAILED. See errors above.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   Build complete. Starting static server...
echo ============================================================
echo.
echo   Other devices on the same WiFi can access via:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo     http://%%b:5173
)
echo.
echo   Local:   http://localhost:5173
echo.
echo   Press Ctrl+C to stop.
echo ============================================================
echo.

call npx vite preview --host --port 5173

pause

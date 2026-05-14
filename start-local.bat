@echo off
REM Start Sivivi as a local web server. Other devices on the same WiFi/LAN
REM can open the URL shown in the console — no install, no antivirus prompt.
REM
REM Double-click this file to launch.

setlocal
cd /d "%~dp0"

echo.
echo ============================================================
echo   Sivivi - Local Web Server
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

call npm run dev:web

pause

@echo off
echo ============================================
echo  AEGIS BANK SERVER - STARTING
echo ============================================

echo [1/2] Starting Backend on port 3002...
start "AEGIS Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend on port 5173...
start "AEGIS Frontend" cmd /k "cd /d "%~dp0frontend" && npx next dev -p 5173"

timeout /t 8 /nobreak >nul

echo ============================================
echo  OPEN THIS IN YOUR BROWSER:
echo  http://localhost:5173
echo ============================================
start "" "http://localhost:5173"
pause

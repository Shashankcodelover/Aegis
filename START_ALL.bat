@echo off
title AEGIS SYSTEM LAUNCHER
color 0B

echo.
echo  ============================================================
echo   AEGIS ZERO-TRUST SYSTEM -- ONE-CLICK LAUNCHER
echo  ============================================================
echo.

:: ── Set root to the folder this .bat lives in ────────────────────────────────
set ROOT=%~dp0
:: Remove trailing backslash
if "%ROOT:~-1%"=="\" set ROOT=%ROOT:~0,-1%

set GATEWAY=%ROOT%\tt\Security system Moniters_3_persons_activities\aegis-dashboard
set BANK=%ROOT%\tt\user_payment\node-2-bank-server
set HACKER=%ROOT%\tt\user_payment\node-3-attacker-c2
set GONG=%ROOT%\tt\user_payment\node-1-defender-app
set DASHBOARD=%ROOT%\tt\Security system Moniters_3_persons_activities\aegis-dashboard

:: ── 1. AEGIS Gateway (start first) ───────────────────────────────────────────
echo [1/5] Starting AEGIS Gateway on port 5002...
start "AEGIS Gateway :5002" cmd /k "cd /d "%GATEWAY%" && echo [ AEGIS GATEWAY ] Starting... && node server/gateway.js"

timeout /t 3 /nobreak >nul

:: ── 2. Bank Server ────────────────────────────────────────────────────────────
echo [2/5] Starting Bank Server on port 5001...
start "Bank Server :5001" cmd /k "cd /d "%BANK%" && echo [ BANK SERVER ] Starting... && node server.js"

timeout /t 2 /nobreak >nul

:: ── 3. Hacker C2 ──────────────────────────────────────────────────────────────
echo [3/5] Starting Hacker C2 on port 5003...
start "Hacker C2 :5003" cmd /k "cd /d "%HACKER%" && echo [ HACKER C2 ] Starting... && node server.js"

timeout /t 2 /nobreak >nul

:: ── 4. Gong Payment App ───────────────────────────────────────────────────────
echo [4/5] Starting Gong Payment App on port 5000...
start "Gong App :5000" cmd /k "cd /d "%GONG%" && echo [ GONG APP ] Starting... && npm run dev -- --port 5000"

timeout /t 2 /nobreak >nul

:: ── 5. AEGIS Dashboard ────────────────────────────────────────────────────────
echo [5/5] Starting AEGIS Dashboard on port 5004...
start "AEGIS Dashboard :5004" cmd /k "cd /d "%DASHBOARD%" && echo [ AEGIS DASHBOARD ] Starting... && npm run dev"

:: ── Wait for Next.js to compile ───────────────────────────────────────────────
echo.
echo  Waiting 12 seconds for Next.js apps to compile...
timeout /t 12 /nobreak >nul

:: ── Open all browser tabs ─────────────────────────────────────────────────────
echo  Opening all apps in browser...
start "" "http://localhost:5000"
timeout /t 1 /nobreak >nul
start "" "http://localhost:5001"
timeout /t 1 /nobreak >nul
start "" "http://localhost:5003"
timeout /t 1 /nobreak >nul
start "" "http://localhost:5004"

:: ── Done ──────────────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   ALL SYSTEMS UP
echo  ============================================================
echo   http://localhost:5000  --  Gong Payment App  (Person 1)
echo   http://localhost:5001  --  Bank Server        (Person 2)
echo   http://localhost:5002  --  AEGIS Gateway      (API)
echo   http://localhost:5003  --  Hacker C2           (Person 3)
echo   http://localhost:5004  --  AEGIS Dashboard    (Monitor)
echo  ============================================================
echo.
echo  To stop: close all 5 cmd windows that opened.
echo.
pause

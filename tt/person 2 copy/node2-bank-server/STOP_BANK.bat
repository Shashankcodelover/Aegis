@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1
echo Done. All servers stopped.
pause

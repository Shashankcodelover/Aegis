# ═══════════════════════════════════════════════════════════════
#  NODE 2 — ONE-CLICK HACKATHON LAUNCHER
#  Starts backend (port 5001) and frontend (port 5001) in
#  separate PowerShell windows simultaneously.
# ═══════════════════════════════════════════════════════════════

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AEGIS SOC — NODE 2 LAUNCHER                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "[1/2] Starting Backend on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; Write-Host 'BACKEND STARTING on :5001...' -ForegroundColor Cyan; npm start"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "[2/2] Starting SOC Dashboard on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; Write-Host 'FRONTEND STARTING on :5001...' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅  Both services launching." -ForegroundColor Green
Write-Host "    Backend  → http://localhost:5001/health" -ForegroundColor Cyan
Write-Host "    Dashboard → http://localhost:5001" -ForegroundColor Green
Write-Host ""

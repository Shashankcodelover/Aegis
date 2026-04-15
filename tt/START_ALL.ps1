# AEGIS — Unified Startup Script (Windows PowerShell)
# Starts all 6 nodes in the correct order on canonical ports
#
# Port Map:
#   5002 — AEGIS Gateway API              (start FIRST — others depend on it)
#   5001 — Person 2: Bank Server Backend
#   5001 — Person 2: Bank SOC Dashboard   (same port — backend serves both)
#   5003 — Person 3: Hacker C2 UI
#   5000 — Person 1: PhonePe UI
#   5004 — AEGIS Security Dashboard UI    (start LAST)
#
# Usage: Right-click → "Run with PowerShell"
#        OR: powershell -ExecutionPolicy Bypass -File START_ALL.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AEGIS — Starting All Nodes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── AEGIS Gateway (port 5002) — FIRST ────────────────────────────────────────
Write-Host "[1/6] Starting AEGIS Gateway on port 5002..." -ForegroundColor Green
$gatewayPath = Join-Path $ROOT "Security system Moniters_3_persons_activities\aegis-dashboard"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$gatewayPath'; Write-Host 'AEGIS Gateway :5002' -ForegroundColor Cyan; node server/gateway.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Person 2: Bank Backend (port 5001) ───────────────────────────────────────
Write-Host "[2/6] Starting Person 2 Bank Backend on port 5001..." -ForegroundColor Green
$bankBackendPath = Join-Path $ROOT "person 2 copy\node2-bank-server\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$bankBackendPath'; Write-Host 'Bank Backend :5001' -ForegroundColor Yellow; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# ── Person 2: Bank SOC Dashboard (port 5001) ─────────────────────────────────
Write-Host "[3/6] Starting Person 2 Bank SOC Dashboard on port 5001..." -ForegroundColor Green
$bankFrontendPath = Join-Path $ROOT "person 2 copy\node2-bank-server\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$bankFrontendPath'; Write-Host 'Bank SOC Dashboard :5001' -ForegroundColor Yellow; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# ── Person 3: Hacker C2 UI (port 5003) ───────────────────────────────────────
Write-Host "[4/6] Starting Person 3 Hacker C2 on port 5003..." -ForegroundColor Green
$hackerPath = Join-Path $ROOT "person 3 copy\hacker-ui"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$hackerPath'; Write-Host 'Hacker C2 :5003' -ForegroundColor Red; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# ── Person 1: PhonePe UI (port 5000) ─────────────────────────────────────────
Write-Host "[5/6] Starting Person 1 PhonePe UI on port 5000..." -ForegroundColor Green
$phonepePath = Join-Path $ROOT "user_payment\node-1-defender-app"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$phonepePath'; Write-Host 'PhonePe UI :5000' -ForegroundColor Cyan; npm run dev -- --port 5000" -WindowStyle Normal

Start-Sleep -Seconds 2

# ── AEGIS Security Dashboard (port 5004) ─────────────────────────────────────
Write-Host "[6/6] Starting AEGIS Security Dashboard on port 5004..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$gatewayPath'; Write-Host 'AEGIS Dashboard :5004' -ForegroundColor Magenta; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All nodes starting up!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Open these URLs once ready:" -ForegroundColor White
Write-Host "  http://localhost:5000  — Person 1: PhonePe UI (payment app)" -ForegroundColor Cyan
Write-Host "  http://localhost:5001  — Person 2: Bank Server + SOC Dashboard" -ForegroundColor Yellow
Write-Host "  http://localhost:5002/health — AEGIS Gateway (health check)" -ForegroundColor Green
Write-Host "  http://localhost:5003  — Person 3: Hacker C2 Dashboard" -ForegroundColor Red
Write-Host "  http://localhost:5004  — AEGIS Security Monitor Dashboard" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Demo flow:" -ForegroundColor White
Write-Host "  1. Open :5000 (Person 1) and make a payment" -ForegroundColor Gray
Write-Host "  2. Watch :5001 (Person 2) bank ledger update" -ForegroundColor Gray
Write-Host "  3. Open :5003 (Person 3) and launch CSRF attack" -ForegroundColor Gray
Write-Host "  4. Watch :5004 (AEGIS) detect and block the attack" -ForegroundColor Gray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
#  AEGIS SYSTEM — ONE-CLICK LAUNCHER (PowerShell)
#  Starts all 5 services in separate windows simultaneously.
#
#  Run this from the repo root:
#      .\START_ALL.ps1
# ═══════════════════════════════════════════════════════════════════════════════

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$gateway   = Join-Path $root "tt\Security system Moniters_3_persons_activities\aegis-dashboard"
$bank      = Join-Path $root "tt\user_payment\node-2-bank-server"
$hacker    = Join-Path $root "tt\user_payment\node-3-attacker-c2"
$gong      = Join-Path $root "tt\user_payment\node-1-defender-app"
$dashboard = Join-Path $root "tt\Security system Moniters_3_persons_activities\aegis-dashboard"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         AEGIS ZERO-TRUST SYSTEM — LAUNCHING             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. AEGIS Gateway (must start first — all nodes connect to it) ─────────────
Write-Host "[1/5] Starting AEGIS Gateway on port 5002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$gateway'; `
   Write-Host '[ AEGIS GATEWAY ] Starting on port 5002...' -ForegroundColor Cyan; `
   node server/gateway.js"

Write-Host "      Waiting 3s for gateway to be ready..." -ForegroundColor DarkGray
Start-Sleep -Seconds 3

# ── 2. Bank Server ────────────────────────────────────────────────────────────
Write-Host "[2/5] Starting Bank Server on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$bank'; `
   Write-Host '[ BANK SERVER ] Starting on port 5001...' -ForegroundColor Green; `
   node server.js"

Start-Sleep -Seconds 1

# ── 3. Hacker C2 ──────────────────────────────────────────────────────────────
Write-Host "[3/5] Starting Hacker C2 on port 5003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$hacker'; `
   Write-Host '[ HACKER C2 ] Starting on port 5003...' -ForegroundColor Red; `
   node server.js"

Start-Sleep -Seconds 1

# ── 4. Gong Payment App (Next.js) ─────────────────────────────────────────────
Write-Host "[4/5] Starting Gong Payment App on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$gong'; `
   Write-Host '[ GONG APP ] Starting on port 5000...' -ForegroundColor Magenta; `
   npm run dev -- --port 5000"

Start-Sleep -Seconds 1

# ── 5. AEGIS Dashboard (Next.js) ──────────────────────────────────────────────
Write-Host "[5/5] Starting AEGIS Dashboard on port 5004..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$dashboard'; `
   Write-Host '[ AEGIS DASHBOARD ] Starting on port 5004...' -ForegroundColor Cyan; `
   npm run dev"

# ── Wait for everything to boot ───────────────────────────────────────────────
Write-Host ""
Write-Host "  All 5 services launching. Waiting 10s for Next.js to compile..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

# ── Open all browser tabs ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Opening all apps in browser..." -ForegroundColor Green
Start-Process "http://localhost:5000"   # Gong Payment App
Start-Sleep -Seconds 1
Start-Process "http://localhost:5001"   # Bank Dashboard
Start-Sleep -Seconds 1
Start-Process "http://localhost:5003"   # Hacker C2
Start-Sleep -Seconds 1
Start-Process "http://localhost:5004"   # AEGIS Dashboard

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ALL SYSTEMS UP                                          ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  http://localhost:5000  →  Gong Payment App (Person 1)  ║" -ForegroundColor White
Write-Host "║  http://localhost:5001  →  Bank Server (Person 2)       ║" -ForegroundColor White
Write-Host "║  http://localhost:5002  →  AEGIS Gateway (API)          ║" -ForegroundColor White
Write-Host "║  http://localhost:5003  →  Hacker C2 (Person 3)         ║" -ForegroundColor White
Write-Host "║  http://localhost:5004  →  AEGIS Dashboard (Monitor)    ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  To stop everything: close all 5 PowerShell windows." -ForegroundColor DarkGray
Write-Host ""

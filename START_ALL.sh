#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  AEGIS SYSTEM — ONE-CLICK LAUNCHER (Mac / Linux)
#  Run from repo root:  bash START_ALL.sh
# ═══════════════════════════════════════════════════════════════════════════════

ROOT="$(cd "$(dirname "$0")" && pwd)"

GATEWAY="$ROOT/tt/Security system Moniters_3_persons_activities/aegis-dashboard"
BANK="$ROOT/tt/user_payment/node-2-bank-server"
HACKER="$ROOT/tt/user_payment/node-3-attacker-c2"
GONG="$ROOT/tt/user_payment/node-1-defender-app"
DASHBOARD="$ROOT/tt/Security system Moniters_3_persons_activities/aegis-dashboard"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         AEGIS ZERO-TRUST SYSTEM — LAUNCHING             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Detect terminal emulator
open_terminal() {
  local title="$1"
  local cmd="$2"
  if command -v gnome-terminal &>/dev/null; then
    gnome-terminal --title="$title" -- bash -c "$cmd; exec bash"
  elif command -v xterm &>/dev/null; then
    xterm -title "$title" -e bash -c "$cmd; exec bash" &
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"$cmd\""
  else
    # Fallback: run in background, log to file
    bash -c "$cmd" > "/tmp/aegis_${title// /_}.log" 2>&1 &
    echo "  Started $title (log: /tmp/aegis_${title// /_}.log)"
  fi
}

# ── 1. AEGIS Gateway ──────────────────────────────────────────────────────────
echo "[1/5] Starting AEGIS Gateway on port 5002..."
open_terminal "AEGIS Gateway :5002" "cd '$GATEWAY' && echo '[ AEGIS GATEWAY ] Starting...' && node server/gateway.js"
sleep 3

# ── 2. Bank Server ────────────────────────────────────────────────────────────
echo "[2/5] Starting Bank Server on port 5001..."
open_terminal "Bank Server :5001" "cd '$BANK' && echo '[ BANK SERVER ] Starting...' && node server.js"
sleep 2

# ── 3. Hacker C2 ──────────────────────────────────────────────────────────────
echo "[3/5] Starting Hacker C2 on port 5003..."
open_terminal "Hacker C2 :5003" "cd '$HACKER' && echo '[ HACKER C2 ] Starting...' && node server.js"
sleep 2

# ── 4. Gong Payment App ───────────────────────────────────────────────────────
echo "[4/5] Starting Gong Payment App on port 5000..."
open_terminal "Gong App :5000" "cd '$GONG' && echo '[ GONG APP ] Starting...' && npm run dev -- --port 5000"
sleep 2

# ── 5. AEGIS Dashboard ────────────────────────────────────────────────────────
echo "[5/5] Starting AEGIS Dashboard on port 5004..."
open_terminal "AEGIS Dashboard :5004" "cd '$DASHBOARD' && echo '[ AEGIS DASHBOARD ] Starting...' && npm run dev"

# ── Wait for Next.js ──────────────────────────────────────────────────────────
echo ""
echo "  Waiting 12 seconds for Next.js apps to compile..."
sleep 12

# ── Open browser tabs ─────────────────────────────────────────────────────────
echo "  Opening all apps in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:5000"
  open "http://localhost:5001"
  open "http://localhost:5003"
  open "http://localhost:5004"
else
  xdg-open "http://localhost:5000" 2>/dev/null
  xdg-open "http://localhost:5001" 2>/dev/null
  xdg-open "http://localhost:5003" 2>/dev/null
  xdg-open "http://localhost:5004" 2>/dev/null
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ALL SYSTEMS UP                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  http://localhost:5000  →  Gong Payment App (Person 1)  ║"
echo "║  http://localhost:5001  →  Bank Server (Person 2)       ║"
echo "║  http://localhost:5002  →  AEGIS Gateway (API)          ║"
echo "║  http://localhost:5003  →  Hacker C2 (Person 3)         ║"
echo "║  http://localhost:5004  →  AEGIS Dashboard (Monitor)    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

#!/usr/bin/env bash
# AEGIS — Unified Startup Script (Unix/macOS/Linux)
# Starts all 5 nodes in the correct order on canonical ports
#
# Port Map:
#   5002 — AEGIS Gateway API        (start FIRST)
#   5001 — Person 2: Bank Server
#   5003 — Person 3: Hacker C2
#   5000 — Person 1: PhonePe UI
#   5004 — AEGIS Dashboard UI       (start LAST)
#
# Usage: chmod +x START_ALL.sh && ./START_ALL.sh

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATEWAY_DIR="$ROOT/Security system Moniters_3_persons_activities/aegis-dashboard"
BANK_DIR="$ROOT/user_payment/node-2-bank-server"
HACKER_DIR="$ROOT/user_payment/node-3-attacker-c2"
PHONEPE_DIR="$ROOT/user_payment/node-1-defender-app"

PIDS=()

cleanup() {
  echo ""
  echo "Stopping all AEGIS nodes..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  echo "All nodes stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "========================================"
echo "  AEGIS — Starting All 5 Nodes"
echo "========================================"
echo ""

# ── Node 4: AEGIS Gateway (port 5002) — FIRST ────────────────────────────────
echo "[1/5] Starting AEGIS Gateway on port 5002..."
cd "$GATEWAY_DIR"
node server/gateway.js > /tmp/aegis-gateway.log 2>&1 &
PIDS+=($!)
sleep 3

# ── Node 2: Bank Server (port 5001) ──────────────────────────────────────────
echo "[2/5] Starting Bank Server on port 5001..."
cd "$BANK_DIR"
node server.js > /tmp/aegis-bank.log 2>&1 &
PIDS+=($!)
sleep 2

# ── Node 3: Hacker C2 (port 5003) ────────────────────────────────────────────
echo "[3/5] Starting Hacker C2 on port 5003..."
cd "$HACKER_DIR"
node server.js > /tmp/aegis-hacker.log 2>&1 &
PIDS+=($!)
sleep 2

# ── Node 1: PhonePe UI (port 5000) ───────────────────────────────────────────
echo "[4/5] Starting PhonePe UI on port 5000..."
cd "$PHONEPE_DIR"
npm run dev -- --port 5000 > /tmp/aegis-phonepe.log 2>&1 &
PIDS+=($!)
sleep 2

# ── Node 5: AEGIS Dashboard (port 5004) ──────────────────────────────────────
echo "[5/5] Starting AEGIS Dashboard on port 5004..."
cd "$GATEWAY_DIR"
npm run dev > /tmp/aegis-dashboard.log 2>&1 &
PIDS+=($!)

echo ""
echo "========================================"
echo "  All 5 nodes starting up!"
echo "========================================"
echo ""
echo "  Open these URLs once ready:"
echo "  http://localhost:5000  — PhonePe UI (Person 1)"
echo "  http://localhost:5001  — Bank Dashboard (Person 2)"
echo "  http://localhost:5002/health — AEGIS Gateway"
echo "  http://localhost:5003  — Hacker C2 (Person 3)"
echo "  http://localhost:5004  — AEGIS Security Dashboard"
echo ""
echo "  Logs: /tmp/aegis-*.log"
echo "  Press Ctrl+C to stop all nodes."
echo ""

wait

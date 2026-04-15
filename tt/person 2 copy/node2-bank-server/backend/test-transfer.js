/**
 * test-transfer.js
 * ─────────────────────────────────────────────────────────────
 * Fires a LEGITIMATE dual-channel transaction (both shards) so
 * you can watch the SOC dashboard light up green during the demo.
 *
 * Usage:
 *   node test-transfer.js            → approved transaction
 *   node test-transfer.js --attack   → simulated CSRF attack (HTTP only, no WebRTC shard)
 *   node test-transfer.js --amtd     → AMTD port mismatch attack
 *
 * Run AFTER `npm start` has the backend up on port 3002.
 * ─────────────────────────────────────────────────────────────
 */

import { io } from 'socket.io-client';

const BACKEND = process.env.BANK_HOST ?? 'http://localhost:3002';
const MODE    = process.argv[2] ?? '';

const txId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const zkp  = `zkp_${Buffer.from(txId).toString('base64').slice(0, 16)}`;

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log(`║  NODE 2 — ZERO-TRUST TEST CLIENT                ║`);
console.log(`╚══════════════════════════════════════════════════╝`);
console.log(`  Backend : ${BACKEND}`);
console.log(`  TxID    : ${txId}`);
console.log(`  Mode    : ${MODE === '--attack' ? '🔴 CSRF ATTACK (no WebRTC shard)' : MODE === '--amtd' ? '🟠 AMTD PORT MISMATCH' : '🟢 LEGITIMATE TRANSACTION'}\n`);

// ── Connect to Socket.io to get the live AMTD port ──
const socket = io(BACKEND, { transports: ['websocket'] });

socket.on('connect', () => {
  console.log(`[WS] Connected → ${socket.id}`);
});

// Wait for the current AMTD port, then fire
socket.on('amtd_telemetry', async ({ current_port }) => {
  console.log(`[AMTD] Active port received: ${current_port}`);

  // ── Step 1: Send Shard B via WebRTC/WebSocket (out-of-band) ──
  if (MODE !== '--attack') {
    const targetPort = MODE === '--amtd' ? 12345 : current_port; // wrong port for AMTD test
    console.log(`[WS]   Emitting submit_shard_b  (targetPort: ${targetPort})`);
    socket.emit('submit_shard_b', {
      transactionId: txId,
      zkpSignature:  zkp,
      targetPort,
    });
  } else {
    console.log(`[WS]   Skipping Shard B — simulating CSRF bot attack`);
  }

  // ── Step 2: Send Shard A via HTTP (slight delay to simulate real timing) ──
  await new Promise(r => setTimeout(r, 10));

  console.log(`[HTTP] POST ${BACKEND}/api/transfer`);
  try {
    const res  = await fetch(`${BACKEND}/api/transfer`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: txId,
        amount:        1000,
        receiver:      'alice@aegisbank.com',
        timestamp:     Date.now(),
      }),
    });
    const body = await res.json();
    console.log(`\n[RESULT] HTTP ${res.status}`);
    console.log(JSON.stringify(body, null, 2));

    if (body.status === 'APPROVED') {
      console.log(`\n✅  Transaction APPROVED — Δ${body.delta_ms}ms sync latency`);
    } else {
      console.log(`\n🚫  Transaction BLOCKED — ${body.reason}`);
    }
  } catch (err) {
    console.error(`[ERROR] Could not reach backend: ${err.message}`);
    console.error(`        Make sure the backend is running: npm start`);
  }

  socket.disconnect();
  process.exit(0);
});

// Timeout guard
setTimeout(() => {
  console.error('[TIMEOUT] No AMTD telemetry received. Is the backend running?');
  socket.disconnect();
  process.exit(1);
}, 5000);

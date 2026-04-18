/**
 * Node 2 — Gramin Cooperative Bank Server
 * Port: 3002
 *
 * 3-Scenario Demo Controller:
 *   SCENARIO_1 — Legacy mode: blindly trusts HTTP payload (legitimate transfer)
 *   SCENARIO_2 — Legacy mode: blindly trusts forged payload (CSRF exploit visible)
 *   SCENARIO_3 — AEGIS mode: enforces 50ms dual-channel ZKP sharding
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";
import { io as ioClient } from "socket.io-client";
import { webcrypto } from "crypto";

const PORT = 5001;
const SHARD_TTL_MS = 50; // 50ms production window
const AEGIS_GATEWAY_URL = "http://localhost:5002";

// ── Notify AEGIS gateway via Socket.io client ─────────────────────────────────
let aegisSocket = null;
function getAegisSocket() {
  if (!aegisSocket || !aegisSocket.connected) {
    aegisSocket = ioClient(AEGIS_GATEWAY_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 3,
      timeout: 3000,
    });
    aegisSocket.on("connect_error", () => {}); // silent — AEGIS optional
  }
  return aegisSocket;
}
function notifyAegisGateway(event, data) {
  try {
    const sock = getAegisSocket();
    if (!sock.connected) sock.connect();
    sock.emit(event, data);
  } catch { /* AEGIS offline — ignore */ }
}

// ── Scenario State ────────────────────────────────────────────────────────────
let ACTIVE_DEMO_SCENARIO = "SCENARIO_1";

// ── In-process shard store ────────────────────────────────────────────────────
const shardStore = new Map();

function shardSet(key, value, ttlMs) {
  const existing = shardStore.get(key);
  if (existing?.timer) clearTimeout(existing.timer);
  const timer = setTimeout(() => shardStore.delete(key), ttlMs);
  if (timer.unref) timer.unref();
  shardStore.set(key, { value, expiresAt: Date.now() + ttlMs, timer });
}

function shardGet(key) {
  const entry = shardStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { shardStore.delete(key); return null; }
  return entry.value;
}

// ── SHA-256 helper ────────────────────────────────────────────────────────────
async function sha256Hex(data) {
  const buf = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Fastify setup ─────────────────────────────────────────────────────────────
const fastify = Fastify({ logger: false });

await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
});

let io;

// ── Route: POST /admin/set-scenario ──────────────────────────────────────────
fastify.post("/admin/set-scenario", async (req, reply) => {
  const { scenario } = req.body || {};
  const valid = ["SCENARIO_1", "SCENARIO_2", "SCENARIO_3"];
  if (!valid.includes(scenario)) {
    return reply.code(400).send({ error: "Invalid scenario. Use SCENARIO_1, SCENARIO_2, or SCENARIO_3." });
  }
  ACTIVE_DEMO_SCENARIO = scenario;
  console.log(`[Bank] 🎬 Scenario changed → ${ACTIVE_DEMO_SCENARIO}`);
  io?.emit("scenario_changed", { scenario: ACTIVE_DEMO_SCENARIO });

  // Notify AEGIS gateway so dashboard updates its status
  notifyAegisGateway("scenario_changed", { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });

  return reply.send({ status: "OK", active: ACTIVE_DEMO_SCENARIO });
});

// ── Route: GET /admin/scenario ────────────────────────────────────────────────
fastify.get("/admin/scenario", async (_req, reply) => {
  return reply.send({ active: ACTIVE_DEMO_SCENARIO });
});

// ── Route: POST /api/transfer ─────────────────────────────────────────────────
fastify.post("/api/transfer", async (req, reply) => {
  const body = req.body;

  if (!body || !body.amount || !body.to) {
    return reply.code(400).send({ error: "Missing required fields: amount, to" });
  }

  const { amount, to, isForged, sender, purpose, timestamp } = body;
  const txId = `TXN_${Date.now().toString(36).toUpperCase()}`;

  // ── LEGACY MODE (SCENARIO_1 & SCENARIO_2) ────────────────────────────────
  if (ACTIVE_DEMO_SCENARIO === "SCENARIO_1" || ACTIVE_DEMO_SCENARIO === "SCENARIO_2") {
    console.log(`[Bank] ⚠️  Legacy Mode (${ACTIVE_DEMO_SCENARIO}) — processing without ZKP — txId=${txId}`);

    const status = isForged ? "CRITICAL_THEFT_SUCCESS" : "LEGITIMATE_SUCCESS";
    const ledgerEntry = {
      id: txId,
      sender: sender || "Person 1",
      destination: isForged ? "OFFSHORE_HACKER_WALLET_0x99" : (to || "Gramin Bank Account"),
      amount: amount,
      purpose: purpose || (isForged ? "UNAUTHORIZED TRANSFER" : "Crop Loan Repayment"),
      status,
      timestamp: new Date().toISOString(),
      scenario: ACTIVE_DEMO_SCENARIO,
    };

    io?.emit("ledger_update", ledgerEntry);

    // Notify AEGIS gateway — attack succeeded in legacy mode or legit transfer
    if (isForged) {
      notifyAegisGateway("payment_attack", {
        transactionId: txId, amount, receiver: to,
        sender: "PERSON_3_ATTACKER", attackType: "LEGACY_CSRF_SUCCESS",
        shardAReceived: true, shardBReceived: false,
        origin: "PERSON_3_ATTACKER", status: "STOLEN", timestamp: Date.now(),
      });
    } else {
      notifyAegisGateway("payment_success", {
        transactionId: txId, amount, receiver: to,
        sender: sender || "PERSON_1", shardAReceived: true, shardBReceived: true,
        origin: "PERSON_1_LEGITIMATE", status: "APPROVED", timestamp: Date.now(),
      });
    }

    return reply.send({
      status: "PROCESSED_LEGACY",
      txId,
      message: isForged
        ? `⚠️ Forged transfer of ₹${amount} processed — CSRF exploit succeeded`
        : `✅ Transfer of ₹${amount} to ${to} processed successfully`,
    });
  }

  // ── AEGIS MODE (SCENARIO_3) ───────────────────────────────────────────────
  if (ACTIVE_DEMO_SCENARIO === "SCENARIO_3") {
    console.log(`[Bank] 🛡️  AEGIS Mode — waiting 50ms for Shard B — txId=${txId}`);

    shardSet(`shardA:${txId}`, { amount, to, timestamp: timestamp || Date.now() }, SHARD_TTL_MS + 200);

    await new Promise(r => setTimeout(r, SHARD_TTL_MS));

    const shardB = shardGet(`shardB:${txId}`);
    shardStore.delete(`shardA:${txId}`);
    shardStore.delete(`shardB:${txId}`);

    if (!shardB) {
      console.warn(`[Bank] 🚨 AEGIS INTERVENTION — Shard B missing — txId=${txId}`);
      io?.emit("aegis_intervention", {
        id: txId, sender: sender || "UNKNOWN", amount, to,
        reason: "Asymmetric Transport Failure. WebRTC ZK-Proof Missing.",
        mitigation: "Transaction Terminated. Origin flagged as automated bot.",
        timestamp: new Date().toISOString(),
      });
      // Notify AEGIS gateway — attack blocked
      notifyAegisGateway("payment_attack", {
        transactionId: txId, amount, receiver: to,
        sender: "PERSON_3_ATTACKER", attackType: "AEGIS_SHARD_B_MISSING",
        shardAReceived: true, shardBReceived: false,
        origin: "PERSON_3_ATTACKER", status: "BLOCKED", timestamp: Date.now(),
      });
      return reply.code(403).send({
        status: "BLOCKED_BY_AEGIS",
        code: "MISSING_SHARD_B",
        message: "Zero-Trust Engine: WebRTC behavioral proof absent. CSRF attack neutralized.",
      });
    }

    // Both shards present — legitimate transfer in SCENARIO_3
    const hash = await sha256Hex(JSON.stringify({ amount, to }) + JSON.stringify(shardB));
    const ledgerEntry = {
      id: txId, sender: sender || "Person 1", destination: to, amount,
      purpose: purpose || "Verified Transfer", status: "LEGITIMATE_SUCCESS",
      hash: hash.slice(0, 16) + "...", timestamp: new Date().toISOString(),
      scenario: ACTIVE_DEMO_SCENARIO,
    };
    io?.emit("ledger_update", ledgerEntry);
    // Notify AEGIS gateway — legit transfer approved
    notifyAegisGateway("payment_success", {
      transactionId: txId, amount, receiver: to,
      sender: sender || "PERSON_1", shardAReceived: true, shardBReceived: true,
      origin: "PERSON_1_LEGITIMATE", status: "APPROVED", timestamp: Date.now(),
    });

    return reply.send({
      status: "APPROVED",
      txId,
      hash,
      message: `Transfer of ₹${amount} to ${to} authorized. Dual-channel verification passed.`,
    });
  }
});

// ── Route: POST /api/shard-b ──────────────────────────────────────────────────
fastify.post("/api/shard-b", async (req, reply) => {
  const { txId, zkp_signature, timestamp } = req.body || {};
  if (!txId || !zkp_signature) {
    return reply.code(400).send({ error: "Missing txId or zkp_signature" });
  }
  shardSet(`shardB:${txId}`, { zkp_signature, timestamp: timestamp || Date.now() }, SHARD_TTL_MS + 200);
  console.log(`[Bank] 📡 Shard B stored — txId=${txId}`);
  return reply.code(202).send({ status: "SHARD_B_STORED", txId });
});

// ── Route: GET /health ────────────────────────────────────────────────────────
fastify.get("/health", async (_req, reply) => {
  return reply.send({ status: "ok", node: "bank-server", port: PORT, scenario: ACTIVE_DEMO_SCENARIO, ts: Date.now() });
});

// ── Route: GET /favicon.ico ───────────────────────────────────────────────────
fastify.get("/favicon.ico", async (_req, reply) => reply.code(204).send());


// ── Route: GET / — Rural Cooperative Bank Dashboard ──────────────────────────
fastify.get("/", async (_req, reply) => {
  reply.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>🌾 Gramin Cooperative Bank</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #fdf9ed;
      --bg2: #f8fafc;
      --green: #166534;
      --green-light: #dcfce7;
      --green-mid: #16a34a;
      --blue: #1e3a8a;
      --blue-light: #dbeafe;
      --gold: #fef08a;
      --gold-dark: #ca8a04;
      --red: #ef4444;
      --red-light: #fee2e2;
      --orange: #f97316;
      --orange-light: #ffedd5;
      --teal: #2dd4bf;
      --teal-dark: #0d9488;
      --text: #1c1917;
      --text-muted: #78716c;
      --border: #e7e5e4;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      transition: filter 0.4s ease;
    }

    body.aegis-blur { filter: blur(4px) brightness(0.6); pointer-events: none; }

    /* ── Header ── */
    .bank-header {
      background: linear-gradient(135deg, var(--green) 0%, #14532d 100%);
      color: white;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
      box-shadow: 0 2px 12px rgba(22,101,52,0.3);
    }
    .bank-logo { display: flex; align-items: center; gap: 12px; }
    .bank-logo-icon {
      width: 44px; height: 44px; background: rgba(255,255,255,0.15);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 22px; border: 1px solid rgba(255,255,255,0.25);
    }
    .bank-name { font-family: 'Merriweather', serif; font-size: 18px; font-weight: 700; }
    .bank-tagline { font-size: 11px; opacity: 0.75; margin-top: 1px; }
    .header-right { display: flex; align-items: center; gap: 16px; }
    .scenario-badge {
      padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 700;
      letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.12); color: white; transition: all 0.3s;
    }
    .scenario-badge.s1 { background: rgba(255,255,255,0.15); }
    .scenario-badge.s2 { background: rgba(249,115,22,0.4); border-color: rgba(249,115,22,0.6); }
    .scenario-badge.s3 { background: rgba(45,212,191,0.3); border-color: rgba(45,212,191,0.6); }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #4ade80;
      animation: pulse-dot 1.5s infinite;
    }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }

    /* ── Main layout ── */
    .main { max-width: 1100px; margin: 0 auto; padding: 28px 24px 100px; }

    /* ── Stats row ── */
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card {
      background: white; border-radius: 16px; padding: 20px 24px;
      border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-value.green { color: var(--green); }
    .stat-value.red { color: var(--red); }
    .stat-value.blue { color: var(--blue); }

    /* ── Ledger panel ── */
    .ledger-panel {
      background: white; border-radius: 20px; border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;
    }
    .ledger-header {
      padding: 20px 24px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .ledger-title { font-family: 'Merriweather', serif; font-size: 16px; font-weight: 700; color: var(--blue); }
    .ledger-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .ledger-table { width: 100%; border-collapse: collapse; }
    .ledger-table th {
      padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted);
      background: #fafaf9; border-bottom: 1px solid var(--border);
    }
    .ledger-table td { padding: 14px 20px; font-size: 13px; border-bottom: 1px solid #f5f5f4; }
    .ledger-table tr:last-child td { border-bottom: none; }
    .ledger-table tr { transition: background 0.2s; }
    .ledger-table tr.row-success { background: #f0fdf4; }
    .ledger-table tr.row-theft { background: #fff7ed; }
    .ledger-table tr.row-success:hover { background: #dcfce7; }
    .ledger-table tr.row-theft:hover { background: #ffedd5; }
    .ledger-table tr { animation: rowIn 0.35s ease; }
    @keyframes rowIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

    .status-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
    }
    .status-pill.success { background: var(--green-light); color: var(--green); border: 1px solid #bbf7d0; }
    .status-pill.theft { background: var(--orange-light); color: var(--orange); border: 1px solid #fed7aa; }
    .status-pill.blocked { background: #f0f9ff; color: var(--blue); border: 1px solid #bae6fd; }

    .amount-cell { font-weight: 700; font-family: 'Inter', sans-serif; }
    .amount-cell.success { color: var(--green); }
    .amount-cell.theft { color: var(--red); }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); }

    .empty-ledger { padding: 60px; text-align: center; color: var(--text-muted); }
    .empty-ledger .icon { font-size: 40px; margin-bottom: 12px; }
    .empty-ledger p { font-size: 14px; }

    /* ── FAB Admin Panel ── */
    .fab-container { position: fixed; bottom: 28px; right: 28px; z-index: 100; }
    .fab-btn {
      width: 52px; height: 52px; border-radius: 50%; background: var(--blue);
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 20px; box-shadow: 0 4px 16px rgba(30,58,138,0.4);
      transition: all 0.2s; color: white;
    }
    .fab-btn:hover { transform: scale(1.08); background: #1e40af; }
    .fab-panel {
      position: absolute; bottom: 64px; right: 0; width: 260px;
      background: white; border-radius: 16px; border: 1px solid var(--border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.15); padding: 16px;
      display: none; animation: panelIn 0.2s ease;
    }
    .fab-panel.open { display: block; }
    @keyframes panelIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fab-panel-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 12px;
      padding-bottom: 10px; border-bottom: 1px solid var(--border);
    }
    .scenario-btn {
      width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--border);
      background: white; cursor: pointer; text-align: left; margin-bottom: 8px;
      transition: all 0.15s; font-family: 'Inter', sans-serif;
    }
    .scenario-btn:last-child { margin-bottom: 0; }
    .scenario-btn:hover { border-color: var(--blue); background: var(--blue-light); }
    .scenario-btn.active { border-color: var(--green); background: var(--green-light); }
    .scenario-btn.active-s2 { border-color: var(--orange); background: var(--orange-light); }
    .scenario-btn.active-s3 { border-color: var(--teal-dark); background: #f0fdfa; }
    .scenario-btn-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .scenario-btn-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    /* ── AEGIS Overlay ── */
    .aegis-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(2, 8, 20, 0.96);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; transition: opacity 0.3s;
    }
    .aegis-overlay.active { opacity: 1; pointer-events: all; }
    .aegis-terminal {
      width: 680px; max-width: 95vw;
      background: #020c14; border: 1px solid var(--teal);
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 0 60px rgba(45,212,191,0.25), 0 0 120px rgba(45,212,191,0.1);
    }
    .aegis-terminal-bar {
      background: #041018; padding: 12px 20px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(45,212,191,0.3);
    }
    .aegis-terminal-title {
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      color: var(--teal); font-weight: 700; letter-spacing: 1px;
    }
    .aegis-close-btn {
      background: none; border: 1px solid rgba(45,212,191,0.4); color: var(--teal);
      padding: 4px 12px; border-radius: 6px; cursor: pointer;
      font-family: 'JetBrains Mono', monospace; font-size: 11px;
      transition: all 0.15s;
    }
    .aegis-close-btn:hover { background: rgba(45,212,191,0.1); }
    .aegis-terminal-body { padding: 24px; min-height: 280px; }
    .aegis-line {
      font-family: 'JetBrains Mono', monospace; font-size: 13px;
      line-height: 1.8; opacity: 0; transform: translateX(-8px);
      transition: opacity 0.3s, transform 0.3s;
    }
    .aegis-line.visible { opacity: 1; transform: translateX(0); }
    .aegis-line .prefix-ok { color: var(--teal); }
    .aegis-line .prefix-warn { color: #fbbf24; }
    .aegis-line .prefix-err { color: var(--red); }
    .aegis-line .prefix-action { color: #a78bfa; }
    .aegis-line .text { color: #cbd5e1; }
    .aegis-verdict {
      margin-top: 20px; padding: 14px 18px; border-radius: 8px;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.4);
      font-family: 'JetBrains Mono', monospace; font-size: 13px;
      color: var(--red); font-weight: 700; opacity: 0; transition: opacity 0.4s;
      text-align: center; letter-spacing: 0.5px;
    }
    .aegis-verdict.visible { opacity: 1; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  </style>
</head>
<body>

  <!-- ── Bank Header ── -->
  <header class="bank-header">
    <div class="bank-logo">
      <div class="bank-logo-icon">🌾</div>
      <div>
        <div class="bank-name">Gramin Cooperative Bank</div>
        <div class="bank-tagline">Serving Rural Communities Since 1962</div>
      </div>
    </div>
    <div class="header-right">
      <span class="scenario-badge s1" id="scenario-badge">● SCENARIO 1 — LEGACY</span>
      <div class="live-dot"></div>
    </div>
  </header>

  <!-- ── Main ── -->
  <main class="main">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Total Transactions</div>
        <div class="stat-value blue" id="stat-total">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Legitimate Transfers</div>
        <div class="stat-value green" id="stat-legit">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Theft / Blocked</div>
        <div class="stat-value red" id="stat-bad">0</div>
      </div>
    </div>

    <div class="ledger-panel">
      <div class="ledger-header">
        <div>
          <div class="ledger-title">Live Bank Ledger</div>
          <div class="ledger-subtitle">Real-time transaction feed</div>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Sender</th>
              <th>Destination</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="ledger-body">
            <tr id="empty-row">
              <td colspan="6">
                <div class="empty-ledger">
                  <div class="icon">🏦</div>
                  <p>Waiting for transactions...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- ── FAB Admin Panel ── -->
  <div class="fab-container">
    <div class="fab-panel" id="fab-panel">
      <div class="fab-panel-title">⚙ Demo Scenario Control</div>
      <button class="scenario-btn active" id="btn-s1" onclick="setScenario('SCENARIO_1')">
        <div class="scenario-btn-title">🌾 Scenario 1 — Legitimate</div>
        <div class="scenario-btn-desc">Legacy mode, blind trust, green ledger</div>
      </button>
      <button class="scenario-btn" id="btn-s2" onclick="setScenario('SCENARIO_2')">
        <div class="scenario-btn-title">💀 Scenario 2 — CSRF Exploit</div>
        <div class="scenario-btn-desc">Forged request processed silently</div>
      </button>
      <button class="scenario-btn" id="btn-s3" onclick="setScenario('SCENARIO_3')">
        <div class="scenario-btn-title">🛡 Scenario 3 — AEGIS Active</div>
        <div class="scenario-btn-desc">50ms ZKP window, attack neutralized</div>
      </button>
    </div>
    <button class="fab-btn" id="fab-btn" onclick="toggleFab()" title="Demo Controls">⚙</button>
  </div>

  <!-- ── AEGIS Security Overlay ── -->
  <div class="aegis-overlay" id="aegis-overlay">
    <div class="aegis-terminal">
      <div class="aegis-terminal-bar">
        <span class="aegis-terminal-title">▶ AEGIS ZERO-TRUST ENGINE — INTERVENTION LOG</span>
        <button class="aegis-close-btn" onclick="dismissAegis()">DISMISS</button>
      </div>
      <div class="aegis-terminal-body" id="aegis-terminal-body">
        <!-- lines injected by JS -->
      </div>
    </div>
  </div>

  <script>
    const socket = io('http://localhost:5001', {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });
    let counts = { total: 0, legit: 0, bad: 0 };
    let fabOpen = false;
    let activeScenario = 'SCENARIO_1';

    // ── Socket events ──────────────────────────────────────────────────────────
    socket.on('connect', () => console.log('[Bank UI] Socket connected'));

    socket.on('scenario_changed', ({ scenario }) => {
      activeScenario = scenario;
      updateScenarioBadge(scenario);
      updateFabButtons(scenario);
    });

    socket.on('ledger_update', (entry) => {
      counts.total++;
      const isTheft = entry.status === 'CRITICAL_THEFT_SUCCESS';
      if (isTheft) counts.bad++; else counts.legit++;
      updateStats();
      addLedgerRow(entry);
    });

    socket.on('aegis_intervention', (data) => {
      document.body.classList.add('aegis-blur');
      showAegisOverlay(data);
    });

    // ── Scenario control ───────────────────────────────────────────────────────
    async function setScenario(scenario) {
      await fetch('/admin/set-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      activeScenario = scenario;
      updateScenarioBadge(scenario);
      updateFabButtons(scenario);
      toggleFab();
    }

    function updateScenarioBadge(scenario) {
      const badge = document.getElementById('scenario-badge');
      badge.className = 'scenario-badge';
      if (scenario === 'SCENARIO_1') {
        badge.classList.add('s1');
        badge.textContent = '● SCENARIO 1 — LEGACY';
      } else if (scenario === 'SCENARIO_2') {
        badge.classList.add('s2');
        badge.textContent = '⚠ SCENARIO 2 — CSRF EXPLOIT';
      } else {
        badge.classList.add('s3');
        badge.textContent = '🛡 SCENARIO 3 — AEGIS ACTIVE';
      }
    }

    function updateFabButtons(scenario) {
      document.getElementById('btn-s1').className = 'scenario-btn' + (scenario === 'SCENARIO_1' ? ' active' : '');
      document.getElementById('btn-s2').className = 'scenario-btn' + (scenario === 'SCENARIO_2' ? ' active-s2' : '');
      document.getElementById('btn-s3').className = 'scenario-btn' + (scenario === 'SCENARIO_3' ? ' active-s3' : '');
    }

    function toggleFab() {
      fabOpen = !fabOpen;
      document.getElementById('fab-panel').classList.toggle('open', fabOpen);
      document.getElementById('fab-btn').textContent = fabOpen ? '✕' : '⚙';
    }

    // ── Stats ──────────────────────────────────────────────────────────────────
    function updateStats() {
      document.getElementById('stat-total').textContent = counts.total;
      document.getElementById('stat-legit').textContent = counts.legit;
      document.getElementById('stat-bad').textContent = counts.bad;
    }

    // ── Ledger ─────────────────────────────────────────────────────────────────
    function addLedgerRow(entry) {
      const tbody = document.getElementById('ledger-body');
      const empty = document.getElementById('empty-row');
      if (empty) empty.remove();

      const isTheft = entry.status === 'CRITICAL_THEFT_SUCCESS';
      const rowClass = isTheft ? 'row-theft' : 'row-success';
      const pillClass = isTheft ? 'theft' : 'success';
      const pillLabel = isTheft ? '⚠ THEFT' : '✓ SUCCESS';
      const amtClass = isTheft ? 'theft' : 'success';
      const amtPrefix = isTheft ? '−' : '+';
      const time = new Date(entry.timestamp).toLocaleTimeString('en-IN');

      const tr = document.createElement('tr');
      tr.className = rowClass;
      tr.innerHTML = \`
        <td class="mono">\${time}</td>
        <td style="font-weight:500">\${entry.sender}</td>
        <td class="mono" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${entry.destination}">\${entry.destination}</td>
        <td class="amount-cell \${amtClass}">\${amtPrefix}₹\${Number(entry.amount).toLocaleString('en-IN')}</td>
        <td style="color:#78716c;font-size:12px">\${entry.purpose}</td>
        <td><span class="status-pill \${pillClass}">\${pillLabel}</span></td>
      \`;
      tbody.insertBefore(tr, tbody.firstChild);
      while (tbody.children.length > 50) tbody.removeChild(tbody.lastChild);
    }

    // ── AEGIS Overlay ──────────────────────────────────────────────────────────
    const TERMINAL_LINES = [
      { prefix: 'ok',     text: ' Incoming state-changing POST request detected on /api/transfer.' },
      { prefix: 'ok',     text: ' Validating ambient credentials (Cookies)... STATUS: PRESENT.' },
      { prefix: 'ok',     text: ' Initiating 50ms temporal window for WebRTC cryptographic shard.' },
      { prefix: 'warn',   text: '... 50ms elapsed. Shard B (ZK-Behavioral Proof) NOT FOUND.' },
      { prefix: 'warn',   text: ' Verifying Sec-Fetch-Site metadata... WARNING: Cross-Site origin detected.' },
      { prefix: 'err',    text: ' DIAGNOSIS: OWASP API2:2023 Broken Authentication Exploit (CSRF) Attempted.' },
      { prefix: 'action', text: ' ACTION: Payload dropped. Connection severed. Funds secured.' },
    ];

    function showAegisOverlay(data) {
      const overlay = document.getElementById('aegis-overlay');
      const body = document.getElementById('aegis-terminal-body');
      body.innerHTML = '';
      overlay.classList.add('active');

      TERMINAL_LINES.forEach((line, i) => {
        const div = document.createElement('div');
        div.className = 'aegis-line';
        const prefixMap = {
          ok: '<span class="prefix-ok">[✓ AEGIS]</span>',
          warn: '<span class="prefix-warn">[⚠ WARN ]</span>',
          err: '<span class="prefix-err">[✗ ALERT]</span>',
          action: '<span class="prefix-action">[⚡ ACT  ]</span>',
        };
        div.innerHTML = prefixMap[line.prefix] + ' <span class="text">' + line.text + '</span>';
        body.appendChild(div);

        setTimeout(() => div.classList.add('visible'), 300 + i * 400);
      });

      // Verdict
      const verdict = document.createElement('div');
      verdict.className = 'aegis-verdict';
      verdict.textContent = '🛡 CSRF EXPLOIT NEUTRALIZED — FUNDS SECURED — ZERO-TRUST VERIFIED';
      body.appendChild(verdict);
      setTimeout(() => verdict.classList.add('visible'), 300 + TERMINAL_LINES.length * 400 + 200);
    }

    function dismissAegis() {
      document.getElementById('aegis-overlay').classList.remove('active');
      document.body.classList.remove('aegis-blur');
    }

    // ── Init: fetch current scenario ───────────────────────────────────────────
    fetch('/admin/scenario').then(r => r.json()).then(({ active }) => {
      activeScenario = active;
      updateScenarioBadge(active);
      updateFabButtons(active);
    }).catch(() => {});
  </script>
</body>
</html>`);
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
await fastify.listen({ port: PORT, host: "0.0.0.0" });

io = new SocketIOServer(fastify.server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", socket => {
  console.log(`[Bank/Socket.io] Client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`[Bank/Socket.io] Disconnected: ${socket.id}`));
});

console.log(`\n🌾 Gramin Cooperative Bank Server running on http://localhost:${PORT}`);
console.log(`   GET  /              — Rural Bank Dashboard UI`);
console.log(`   POST /api/transfer  — Transfer endpoint (scenario-aware)`);
console.log(`   POST /api/shard-b   — WebRTC Shard B simulation`);
console.log(`   POST /admin/set-scenario — Switch demo scenario`);
console.log(`   GET  /admin/scenario     — Get active scenario`);
console.log(`   GET  /health        — Health check\n`);

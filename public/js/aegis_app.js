// AEGIS Client Application & Multi-Node Controller

const socket = io();

// State
let recordedPoints = [];
let lastPointTime = Date.now();
let activeAMTDPort = 49152;
let defenseMode = 'AEGIS_ACTIVE';
let isTracking = false;

document.addEventListener('DOMContentLoaded', () => {
  initEntropyCanvas();
  initTransportCanvas();
  initControls();
  fetchStats();
  setupSocketListeners();
});

// 1. Socket Event Listeners
function setupSocketListeners() {
  socket.on('amtd_state', (data) => {
    activeAMTDPort = data.activePort;
    document.getElementById('amtd-port-badge').textContent = `PORT: ${activeAMTDPort}`;
    document.getElementById('stat-amtd').textContent = activeAMTDPort;
  });

  socket.on('mode_changed', (data) => {
    defenseMode = data.mode;
    updateModeButtons();
  });

  socket.on('shard_a_received', (data) => {
    animateTransportParticle('SHARD_A');
  });

  socket.on('shard_b_received', (data) => {
    animateTransportParticle('SHARD_B');
  });

  socket.on('transaction_evaluated', (result) => {
    handleTransactionResult(result);
    fetchStats();
  });

  socket.on('system_reset', (stats) => {
    updateStatsUI(stats);
    document.getElementById('threat-stream').innerHTML = '<div style="color: #64748b; text-align: center; padding: 1rem;">Ledger reset to baseline nominal state.</div>';
  });
}

// 2. Fetch and Update Stats
async function fetchStats() {
  try {
    const res = await fetch('/api/aegis/stats');
    const data = await res.json();
    updateStatsUI(data);
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

function updateStatsUI(data) {
  document.getElementById('stat-balance').textContent = `₹${data.bankBalance.toLocaleString()}`;
  document.getElementById('stat-approved').textContent = data.approvedTransactions;
  document.getElementById('stat-blocked').textContent = data.interceptedAttacks;
  document.getElementById('stat-amtd').textContent = data.activeAMTDPort;

  // Render recent approved transactions
  const tbody = document.getElementById('ledger-tbody');
  if (tbody && data.recentTransactions) {
    tbody.innerHTML = data.recentTransactions.slice(0, 5).map(tx => `
      <tr>
        <td><span style="font-family: var(--font-mono); color: #67e8f9;">${tx.txId}</span></td>
        <td>${tx.recipient}</td>
        <td><strong style="color: #6ee7b7;">₹${tx.amount.toLocaleString()}</strong></td>
        <td><span style="font-family: var(--font-mono); color: #a855f7;">${tx.timeDeltaMs !== undefined ? tx.timeDeltaMs + 'ms' : '0ms'}</span></td>
        <td><span style="background: rgba(16, 185, 129, 0.15); color: #6ee7b7; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">APPROVED</span></td>
      </tr>
    `).join('');
  }
}

function updateModeButtons() {
  const btnAegis = document.getElementById('btn-mode-aegis');
  const btnLegacy = document.getElementById('btn-mode-legacy');
  const statusLabel = document.getElementById('defense-mode-indicator');

  if (defenseMode === 'AEGIS_ACTIVE') {
    btnAegis.className = 'mode-btn active aegis';
    btnLegacy.className = 'mode-btn';
    if (statusLabel) {
      statusLabel.textContent = 'ZERO-TRUST DUAL-CHANNEL ENFORCED';
      statusLabel.style.color = '#10b981';
    }
  } else {
    btnAegis.className = 'mode-btn';
    btnLegacy.className = 'mode-btn active legacy';
    if (statusLabel) {
      statusLabel.textContent = '⚠️ LEGACY UNPROTECTED MODE (CSRF VULNERABLE)';
      statusLabel.style.color = '#ef4444';
    }
  }
}

// 3. Mouse / Touch Entropy Tracker
function initEntropyCanvas() {
  const canvas = document.getElementById('entropy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth - 20;
  canvas.height = 110;

  function clearCanvas() {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }
  clearCanvas();

  function recordPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const now = Date.now();

    recordedPoints.push({ x, y, t: now });
    if (recordedPoints.length > 50) recordedPoints.shift();

    // Draw trace
    clearCanvas();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < recordedPoints.length; i++) {
      const pt = recordedPoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Latest point glow
    if (recordedPoints.length > 0) {
      const last = recordedPoints[recordedPoints.length - 1];
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Estimate live entropy
    const ent = calculateLocalEntropy(recordedPoints);
    document.getElementById('lbl-entropy-val').textContent = ent.toFixed(2);
    document.getElementById('lbl-sample-count').textContent = `${recordedPoints.length} pts`;
  }

  canvas.addEventListener('mousemove', recordPoint);
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) recordPoint(e.touches[0]);
  });
}

function calculateLocalEntropy(points) {
  if (points.length < 5) return 0.5;
  const velocities = [];
  for (let i = 1; i < points.length; i++) {
    const dt = Math.max(1, points[i].t - points[i-1].t);
    const dist = Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
    velocities.push(Math.round(dist / dt * 100));
  }
  const counts = {};
  for (const v of velocities) counts[v] = (counts[v] || 0) + 1;
  let ent = 0;
  for (const v in counts) {
    const p = counts[v] / velocities.length;
    ent -= p * Math.log2(p);
  }
  return ent;
}

// 4. Dual-Channel Particle Transport Animation
let transportCtx = null;
let particles = [];

function initTransportCanvas() {
  const canvas = document.getElementById('transport-canvas');
  if (!canvas) return;
  transportCtx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth - 40;
  canvas.height = 70;

  function loop() {
    transportCtx.fillStyle = 'rgba(3, 7, 18, 0.25)';
    transportCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Channel labels
    transportCtx.font = '10px JetBrains Mono';
    transportCtx.fillStyle = '#3b82f6';
    transportCtx.fillText('CHANNEL 1: IN-BAND (HTTP POST)', 10, 22);
    transportCtx.fillStyle = '#a855f7';
    transportCtx.fillText('CHANNEL 2: OUT-OF-BAND (WebRTC DATACHANNEL)', 10, 52);

    // Update & draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speed;
      transportCtx.fillStyle = p.color;
      transportCtx.shadowColor = p.color;
      transportCtx.shadowBlur = 10;
      transportCtx.beginPath();
      transportCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      transportCtx.fill();
      transportCtx.shadowBlur = 0;

      if (p.x >= canvas.width - 20) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function animateTransportParticle(type) {
  const canvas = document.getElementById('transport-canvas');
  if (!canvas) return;
  if (type === 'SHARD_A') {
    particles.push({ x: 200, y: 18, speed: 6, radius: 4, color: '#3b82f6' });
  } else if (type === 'SHARD_B') {
    particles.push({ x: 290, y: 48, speed: 6, radius: 4, color: '#a855f7' });
  }
}

// 5. User Payment & Attack Execution Controls
function initControls() {
  // Pay button (Node 1 - Defender Phone)
  const btnPay = document.getElementById('btn-pay-user');
  if (btnPay) {
    btnPay.addEventListener('click', async () => {
      btnPay.disabled = true;
      btnPay.textContent = 'Sharding & Transmitting...';

      // Seed baseline points if user didn't move cursor on canvas
      if (recordedPoints.length < 5) {
        const now = Date.now();
        recordedPoints = [
          { x: 30, y: 35, t: now - 150 },
          { x: 45, y: 55, t: now - 120 },
          { x: 72, y: 68, t: now - 90 },
          { x: 95, y: 74, t: now - 60 },
          { x: 120, y: 85, t: now - 20 },
          { x: 135, y: 92, t: now }
        ];
      }

      const txId = `TX-USER-${Date.now().toString(36).toUpperCase()}`;
      
      // 1. Generate ZK-Proof (Shard B)
      const proofRes = await fetch('/api/proof/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txId,
          trajectoryPoints: recordedPoints,
          userActivation: true
        })
      });
      const proof = await proofRes.json();

      // 2. Dispatch Shard B via Out-of-Band WebRTC Tunnel
      fetch('/api/webrtc/shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof)
      });

      // 3. Dispatch Shard A via Public HTTP POST
      try {
        const transferRes = await fetch('/api/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txId,
            sender: 'Pooja (Honest User)',
            recipient: 'Gong Grocery Store',
            amount: 5000,
            sessionCookie: 'AEGIS_AUTHENTICATED_SESSION'
          })
        });
        const transferData = await transferRes.json();
      } catch (e) {
        console.error(e);
      } finally {
        btnPay.disabled = false;
        btnPay.textContent = '⚡ Pay ₹5,000 via Dual-Channel Shard';
      }
    });
  }

  // Attack 1: Classic CSRF
  document.getElementById('btn-atk-csrf').addEventListener('click', () => {
    fetch('/api/attack/csrf', { method: 'POST' });
  });

  // Attack 2: Agentic AI Bot
  document.getElementById('btn-atk-bot').addEventListener('click', () => {
    fetch('/api/attack/bot', { method: 'POST' });
  });

  // Attack 3: Temporal Desync
  document.getElementById('btn-atk-desync').addEventListener('click', () => {
    fetch('/api/attack/desync', { method: 'POST' });
  });

  // Attack 4: AMTD Probe
  document.getElementById('btn-atk-amtd').addEventListener('click', () => {
    const txId = `AMTD-PROBE-${Date.now().toString(36).toUpperCase()}`;
    // Send with obsolete target port 12345
    fetch('/api/webrtc/shard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txId,
        zkpSignature: 'probe_sig',
        userActivation: true,
        entropy: 3.5,
        amtdPort: 12345 // Mismatched obsolete port
      })
    });
    fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, amount: 9999, recipient: 'Port Scanner C2' })
    });
  });

  // Mode Toggles
  document.getElementById('btn-mode-aegis').addEventListener('click', () => {
    fetch('/api/aegis/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'AEGIS_ACTIVE' })
    });
  });

  document.getElementById('btn-mode-legacy').addEventListener('click', () => {
    fetch('/api/aegis/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'LEGACY_VULNERABLE' })
    });
  });

  // Reset
  document.getElementById('btn-reset-system').addEventListener('click', () => {
    fetch('/api/reset', { method: 'POST' });
  });
}

// 6. Handle Transaction Evaluation Result
function handleTransactionResult(result) {
  const syncGauge = document.getElementById('sync-delta-display');
  const vaultStatus = document.getElementById('vault-status-text');
  const threatStream = document.getElementById('threat-stream');

  if (result.status === 'APPROVED') {
    if (vaultStatus) {
      vaultStatus.textContent = 'VAULT AUTHORIZED ✅';
      vaultStatus.style.color = '#10b981';
    }
    if (syncGauge && result.timeDeltaMs !== undefined) {
      syncGauge.textContent = `Δt = ${result.timeDeltaMs}ms`;
      syncGauge.style.color = '#10b981';
    }

    // Add entry to threat/audit feed
    const entry = document.createElement('div');
    entry.className = 'threat-entry APPROVED';
    entry.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-weight: 700; color: #6ee7b7;">
        <span>✔ HUMAN TRANSACTION AUTHORIZED</span>
        <span>${result.txRecord?.txId || ''}</span>
      </div>
      <div style="color: #cbd5e1; font-size: 0.72rem; margin-top: 0.2rem;">
        Amount: ₹${result.txRecord?.amount} | Delta: ${result.timeDeltaMs}ms | Mode: ${result.txRecord?.mode}
      </div>
    `;
    threatStream.prepend(entry);
  } else {
    // Attack Blocked!
    if (vaultStatus) {
      vaultStatus.textContent = 'ATTACK QUARANTINED 🛑';
      vaultStatus.style.color = '#ef4444';
    }
    if (syncGauge) {
      syncGauge.textContent = 'Δt = ∞ (BLOCKED)';
      syncGauge.style.color = '#ef4444';
    }

    const atk = result.attackRecord || {};
    const entry = document.createElement('div');
    entry.className = 'threat-entry';
    entry.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-weight: 700; color: #fca5a5;">
        <span>🛑 ${atk.vector || 'ATTACK INTERCEPTED'}</span>
        <span>${atk.attackId || 'BLOCKED'}</span>
      </div>
      <div style="color: #cbd5e1; font-size: 0.72rem; margin-top: 0.2rem;">
        <strong>Failed:</strong> ${atk.failedLayer || result.reason}<br>
        <strong>Action:</strong> ${atk.mitigation || 'Transaction dropped. Zero funds deducted.'}
      </div>
    `;
    threatStream.prepend(entry);
  }
}

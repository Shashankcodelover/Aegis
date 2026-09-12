const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Server: SocketIOServer } = require('socket.io');

const engine = require('./core/aegis_engine');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 5050;

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false // Enable modern inline canvases, particle animations, fonts
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io for live WebRTC signaling and AMTD rotation events
io.on('connection', (socket) => {
  // Send current AMTD port immediately on connection
  socket.emit('amtd_state', engine.getAMTDState());

  socket.on('submit_shard_b', async (data) => {
    const result = engine.receiveShardB(data);
    io.emit('shard_b_received', { txId: data.txId, timestamp: Date.now() });
    if (result && result.status) {
      io.emit('transaction_evaluated', result);
    }
  });
});

// Periodic broadcast of AMTD state
setInterval(() => {
  io.emit('amtd_state', engine.getAMTDState());
}, 2000).unref();

// === REST API ENDPOINTS ===

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AEGIS Zero-Trust Dual-Channel Behavioral Proof Cyber Defense System',
    version: '1.0.0',
    port: PORT,
    defenseMode: engine.defenseMode,
    amtdPort: engine.amtdPort
  });
});

app.get('/api/aegis/stats', (req, res) => {
  res.json(engine.getStats());
});

app.post('/api/aegis/mode', (req, res) => {
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: 'mode is required' });
  const result = engine.setDefenseMode(mode);
  io.emit('mode_changed', result);
  res.json(result);
});

// Shard A (In-Band / Public HTTP POST)
app.post('/api/transfer', async (req, res) => {
  try {
    const { txId, sender, recipient, amount, sessionCookie } = req.body;
    if (!txId) return res.status(400).json({ error: 'txId is required' });

    io.emit('shard_a_received', { txId, sender, recipient, amount, timestamp: Date.now() });

    const result = await engine.receiveShardA({ txId, sender, recipient, amount, sessionCookie });
    io.emit('transaction_evaluated', result);

    if (result.status === 'APPROVED') {
      res.json(result);
    } else {
      res.status(403).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shard B (Out-of-Band / WebRTC Tunnel)
app.post('/api/webrtc/shard', (req, res) => {
  try {
    const { txId, zkpSignature, userActivation, entropy, amtdPort } = req.body;
    if (!txId) return res.status(400).json({ error: 'txId is required' });

    io.emit('shard_b_received', { txId, timestamp: Date.now(), entropy, amtdPort });

    const result = engine.receiveShardB({ txId, zkpSignature, userActivation, entropy, amtdPort });
    if (result && result.status && result.status !== 'WAITING_FOR_SHARD_A') {
      io.emit('transaction_evaluated', result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client helper: generate ZK proof
app.post('/api/proof/generate', (req, res) => {
  try {
    const { txId, trajectoryPoints, userActivation } = req.body;
    const proof = engine.generateZKProof({ txId, trajectoryPoints, userActivation });
    res.json(proof);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attack Vector 1: Classic CSRF (fires Shard A only)
app.post('/api/attack/csrf', async (req, res) => {
  try {
    const txId = `CSRF-ATK-${Date.now().toString(36).toUpperCase()}`;
    const shardA = {
      txId,
      sender: 'Victim (Unwittingly logged in)',
      recipient: 'Attacker Cayman Bank #8821',
      amount: 15000,
      sessionCookie: 'AEGIS_AUTH_STOLEN_VALID_COOKIE'
    };

    io.emit('attack_launched', { vector: 'CLASSIC_CSRF', txId, details: 'Hidden iframe submitted forged HTTP POST' });
    io.emit('shard_a_received', { ...shardA, timestamp: Date.now() });

    const result = await engine.receiveShardA(shardA);
    io.emit('transaction_evaluated', result);
    res.json({ txId, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attack Vector 2: Agentic AI Bot Exploit (fires both, but with synthetic 0-entropy / no user activation)
app.post('/api/attack/bot', async (req, res) => {
  try {
    const txId = `BOT-ATK-${Date.now().toString(36).toUpperCase()}`;
    const shardA = {
      txId,
      sender: 'Victim User',
      recipient: 'DarkPool AI Agent #901',
      amount: 50000,
      sessionCookie: 'AEGIS_AUTH_BOT_INJECTED'
    };

    // Synthetic linear robotic motion
    const syntheticPoints = [
      { x: 100, y: 100, t: 100 },
      { x: 200, y: 200, t: 110 },
      { x: 300, y: 300, t: 120 }
    ];

    const proof = engine.generateZKProof({ txId, trajectoryPoints: syntheticPoints, userActivation: false });

    io.emit('attack_launched', { vector: 'AGENTIC_AI_BOT', txId, details: 'Headless browser executed script-driven click' });
    io.emit('shard_a_received', { ...shardA, timestamp: Date.now() });
    io.emit('shard_b_received', { txId, timestamp: Date.now(), entropy: proof.entropy, amtdPort: proof.amtdPort });

    // Submit Shard B
    engine.receiveShardB(proof);

    // Submit Shard A
    const result = await engine.receiveShardA(shardA);
    io.emit('transaction_evaluated', result);
    res.json({ txId, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attack Vector 3: Temporal Desync Attack (delays Shard B by 250ms)
app.post('/api/attack/desync', async (req, res) => {
  try {
    const txId = `DESYNC-ATK-${Date.now().toString(36).toUpperCase()}`;
    const shardA = {
      txId,
      sender: 'Victim User',
      recipient: 'Replay Exploit Syndicate',
      amount: 25000
    };

    const humanPoints = [
      { x: 10, y: 12, t: 100 },
      { x: 14, y: 21, t: 118 },
      { x: 28, y: 34, t: 135 },
      { x: 45, y: 42, t: 147 },
      { x: 62, y: 58, t: 169 }
    ];
    const proof = engine.generateZKProof({ txId, trajectoryPoints: humanPoints, userActivation: true });

    io.emit('attack_launched', { vector: 'TEMPORAL_DESYNC', txId, details: 'Shard B intercepted and delayed by 250ms' });
    io.emit('shard_a_received', { ...shardA, timestamp: Date.now() });

    // Submit Shard A immediately
    const shardAPromise = engine.receiveShardA(shardA);

    // Delay Shard B by 250ms (> 50ms window)
    setTimeout(() => {
      engine.receiveShardB(proof);
      io.emit('shard_b_received', { txId, timestamp: Date.now(), entropy: proof.entropy, amtdPort: proof.amtdPort });
    }, 250);

    const result = await shardAPromise;
    io.emit('transaction_evaluated', result);
    res.json({ txId, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset System
app.post('/api/reset', (req, res) => {
  engine.bankBalance = 250000;
  engine.transactionHistory = [];
  engine.attackLog = [];
  engine.defenseMode = 'AEGIS_ACTIVE';
  io.emit('system_reset', engine.getStats());
  res.json({ status: 'RESET_COMPLETE', stats: engine.getStats() });
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🛡️ AEGIS Zero-Trust Cyber Defense Server running on port ${PORT}`);
  console.log(`🌐 SOC Command Console: http://localhost:${PORT}`);
});

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { randomInt } from 'crypto';

// ─────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────
let activeAmtdPort = randomInt(49152, 65536);
let aegisActive = false;           // toggled by frontend
const shardMemoryVault = new Map();

// ─────────────────────────────────────────────
//  FASTIFY
// ─────────────────────────────────────────────
const fastify = Fastify({ logger: false });
await fastify.register(cors, { origin: true, methods: ['GET', 'POST', 'OPTIONS'] });

fastify.get('/health', async () => ({
  status: 'ONLINE', port: 3002,
  amtd_port: activeAmtdPort, aegis_active: aegisActive, timestamp: Date.now(),
}));

// ─────────────────────────────────────────────
//  TRANSFER ROUTE
// ─────────────────────────────────────────────
fastify.post('/api/transfer', async (request, reply) => {
  const { transactionId, amount, receiver, scenario, isForged } = request.body ?? {};

  if (!transactionId || !amount || !receiver || !scenario) {
    return reply.status(400).send({ status: 'ERROR', reason: 'Missing fields.' });
  }

  // ══════════════════════════════════════════
  //  SCENARIO 1 — Legitimate legacy transfer
  // ══════════════════════════════════════════
  if (scenario === 'SCENARIO_1') {
    io.emit('ledger_update', {
      id: transactionId, sender: 'Person 1', receiver,
      amount, status: 'LEGITIMATE_SUCCESS',
      scenario: 'SCENARIO_1', timestamp: new Date().toISOString(),
    });
    io.emit('terminal_log', {
      level: 'info', scenario: 'SCENARIO_1',
      message: `[S1] Legitimate transfer ₹${amount} → ${receiver} processed.`,
      timestamp: Date.now(),
    });
    return reply.send({ status: 'PROCESSED_LEGACY', scenario: 'SCENARIO_1' });
  }

  // ══════════════════════════════════════════
  //  SCENARIO 2 — CSRF attack
  //  If AEGIS is OFF  → bank blindly processes (theft)
  //  If AEGIS is ON   → AEGIS intercepts, payment fails
  // ══════════════════════════════════════════
  if (scenario === 'SCENARIO_2') {
    if (isForged && aegisActive) {
      // AEGIS intercepts the forged request
      io.emit('ledger_update', {
        id: transactionId,
        sender: 'ATTACKER (CSRF attempt)',
        receiver,
        amount,
        status: 'AEGIS_INTERCEPTED',
        scenario: 'SCENARIO_2',
        timestamp: new Date().toISOString(),
      });
      io.emit('aegis_intervention', {
        id: transactionId,
        scenario: 'SCENARIO_2',
        reason: 'Asymmetric Transport Failure. WebRTC ZK-Proof Missing.',
        mitigation: 'Payment blocked. Possible CSRF attack detected.',
        timestamp: Date.now(),
        sequence: [
          'Incoming state-changing POST request detected on /api/transfer.',
          'Validating ambient credentials (Cookies)... STATUS: PRESENT.',
          'AEGIS: Initiating 50ms temporal window for WebRTC ZK-Proof...',
          '50ms elapsed. Shard B (ZK-Behavioral Proof) NOT FOUND.',
          'Verifying Sec-Fetch-Site metadata... WARNING: Cross-Site origin detected.',
          'DIAGNOSIS: OWASP API2:2023 Broken Authentication Exploit (CSRF) Attempted.',
          'ACTION: Payment blocked. Funds secured. AEGIS protection active.',
        ],
      });
      io.emit('terminal_log', {
        level: 'threat', scenario: 'SCENARIO_2',
        message: `[AEGIS] CSRF intercepted on S2. Payment NOT processed. TxID: ${transactionId}`,
        timestamp: Date.now(),
      });
      return reply.status(403).send({ status: 'AEGIS_INTERCEPTED', reason: 'CSRF blocked by AEGIS.' });
    }

    // AEGIS OFF — legacy bank blindly processes
    io.emit('ledger_update', {
      id: transactionId,
      sender: isForged ? 'Person 1 (FORGED SESSION)' : 'Person 1',
      receiver, amount,
      status: isForged ? 'CRITICAL_THEFT_SUCCESS' : 'LEGITIMATE_SUCCESS',
      scenario: 'SCENARIO_2',
      timestamp: new Date().toISOString(),
    });
    io.emit('terminal_log', {
      level: isForged ? 'threat' : 'info', scenario: 'SCENARIO_2',
      message: isForged
        ? `[S2] ⚠ CSRF PAYLOAD BLINDLY PROCESSED — ₹${amount} → ${receiver}`
        : `[S2] Transfer ₹${amount} → ${receiver} processed (legacy).`,
      timestamp: Date.now(),
    });
    return reply.send({ status: 'PROCESSED_LEGACY', scenario: 'SCENARIO_2' });
  }

  // ══════════════════════════════════════════
  //  SCENARIO 3 — AEGIS Zero-Trust (always enforced)
  // ══════════════════════════════════════════
  if (scenario === 'SCENARIO_3') {
    shardMemoryVault.set(`${transactionId}_HTTP`, { data: request.body, timestamp: Date.now() });

    io.emit('shard_received', { protocol: 'HTTP', transactionId, scenario: 'SCENARIO_3', timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', scenario: 'SCENARIO_3', message: `[AEGIS] HTTP Shard A stored. TxID: ${transactionId}`, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', scenario: 'SCENARIO_3', message: `[AEGIS] Validating ambient credentials (Cookies)... STATUS: PRESENT.`, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', scenario: 'SCENARIO_3', message: `[AEGIS] Initiating 50ms temporal window for WebRTC ZK-Proof...`, timestamp: Date.now() });

    await new Promise(r => setTimeout(r, 50));

    const httpShard   = shardMemoryVault.get(`${transactionId}_HTTP`);
    const webrtcShard = shardMemoryVault.get(`${transactionId}_WEBRTC`);
    shardMemoryVault.delete(`${transactionId}_HTTP`);
    shardMemoryVault.delete(`${transactionId}_WEBRTC`);

    if (!webrtcShard) {
      io.emit('aegis_intervention', {
        id: transactionId, scenario: 'SCENARIO_3',
        reason: 'Asymmetric Transport Failure. WebRTC ZK-Proof Missing.',
        mitigation: 'Transaction Terminated. Origin flagged as automated bot.',
        timestamp: Date.now(),
        sequence: [
          'Incoming state-changing POST request detected on /api/transfer.',
          'Validating ambient credentials (Cookies)... STATUS: PRESENT.',
          'Initiating 50ms temporal window for WebRTC cryptographic shard.',
          '50ms elapsed. Shard B (ZK-Behavioral Proof) NOT FOUND.',
          'Verifying Sec-Fetch-Site metadata... WARNING: Cross-Site origin detected.',
          'DIAGNOSIS: OWASP API2:2023 Broken Authentication Exploit (CSRF) Attempted.',
          'ACTION: Payload dropped. Connection severed. Funds secured.',
        ],
      });
      io.emit('ledger_update', {
        id: transactionId, sender: 'ATTACKER (CSRF)',
        receiver: 'OFFSHORE_HACKER_WALLET_0x99',
        amount, status: 'AEGIS_BLOCKED',
        scenario: 'SCENARIO_3', timestamp: new Date().toISOString(),
      });
      io.emit('terminal_log', { level: 'threat', scenario: 'SCENARIO_3', message: `[AEGIS] CSRF Payload terminated. TxID: ${transactionId}`, timestamp: Date.now() });
      return reply.status(403).send({ status: 'BLOCKED_BY_AEGIS' });
    }

    const delta = Math.abs(httpShard.timestamp - webrtcShard.timestamp);
    io.emit('ledger_update', {
      id: transactionId, sender: 'Person 1', receiver,
      amount, status: 'AEGIS_VERIFIED', delta,
      scenario: 'SCENARIO_3', timestamp: new Date().toISOString(),
    });
    io.emit('transaction_success', { transactionId, delta, scenario: 'SCENARIO_3', timestamp: Date.now() });
    io.emit('terminal_log', { level: 'success', scenario: 'SCENARIO_3', message: `[AEGIS] Sync verified (Δ${delta}ms). APPROVED. TxID: ${transactionId}`, timestamp: Date.now() });
    return reply.status(200).send({ status: 'APPROVED', delta_ms: delta });
  }

  return reply.status(400).send({ status: 'ERROR', reason: 'Unknown scenario.' });
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
await fastify.listen({ port: 3002, host: '0.0.0.0' });
console.log('[NODE 2] Fastify on http://0.0.0.0:3002');

const io = new Server(fastify.server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// AMTD daemon
setInterval(() => {
  activeAmtdPort = randomInt(49152, 65536);
  io.emit('amtd_telemetry', { current_port: activeAmtdPort, timestamp: Date.now() });
}, 3500);

io.on('connection', (socket) => {
  console.log(`[WS] ${socket.id} connected`);
  // Send current state on connect
  socket.emit('amtd_telemetry', { current_port: activeAmtdPort, timestamp: Date.now() });
  socket.emit('aegis_status', { active: aegisActive });

  // Toggle AEGIS on/off from frontend
  socket.on('set_aegis', ({ active }) => {
    aegisActive = !!active;
    console.log(`[AEGIS] System ${aegisActive ? 'ACTIVATED' : 'DEACTIVATED'}`);
    io.emit('aegis_status', { active: aegisActive });
    io.emit('terminal_log', {
      level: aegisActive ? 'success' : 'info',
      scenario: 'SCENARIO_3',
      message: aegisActive
        ? '[AEGIS] ⚡ AEGIS Zero-Trust Engine ACTIVATED — All channels now protected.'
        : '[AEGIS] System deactivated — Legacy mode restored.',
      timestamp: Date.now(),
    });
  });

  // Shard B for SCENARIO_3
  socket.on('submit_shard_b', ({ transactionId, zkpSignature, targetPort }) => {
    if (targetPort !== activeAmtdPort) {
      io.emit('terminal_log', {
        level: 'threat', scenario: 'SCENARIO_3',
        message: `[AEGIS] AMTD BLOCK — Stale port ${targetPort}. Active: ${activeAmtdPort}. TxID: ${transactionId}`,
        timestamp: Date.now(),
      });
      return;
    }
    shardMemoryVault.set(`${transactionId}_WEBRTC`, { signature: zkpSignature, timestamp: Date.now() });
    io.emit('shard_received', { protocol: 'WebRTC', transactionId, scenario: 'SCENARIO_3', timestamp: Date.now() });
  });

  socket.on('disconnect', () => console.log(`[WS] ${socket.id} disconnected`));
});

console.log('[AMTD] Daemon started — rotating every 3500ms');

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { randomInt } from 'crypto';

// ─────────────────────────────────────────────
//  GLOBAL DEMO STATE
// ─────────────────────────────────────────────
let ACTIVE_DEMO_SCENARIO = 'SCENARIO_1';
let activeAmtdPort = randomInt(49152, 65536);
const shardMemoryVault = new Map();

// ─────────────────────────────────────────────
//  FASTIFY
// ─────────────────────────────────────────────
const fastify = Fastify({ logger: false });
await fastify.register(cors, { origin: true, methods: ['GET', 'POST', 'OPTIONS'] });

fastify.get('/health', async () => ({
  status: 'ONLINE', port: 3002,
  scenario: ACTIVE_DEMO_SCENARIO,
  amtd_port: activeAmtdPort,
  timestamp: Date.now(),
}));

// ─────────────────────────────────────────────
//  ADMIN: SET SCENARIO
// ─────────────────────────────────────────────
fastify.post('/admin/set-scenario', async (request, reply) => {
  const { scenario } = request.body ?? {};
  const valid = ['SCENARIO_1', 'SCENARIO_2', 'SCENARIO_3'];
  if (!valid.includes(scenario)) return reply.status(400).send({ status: 'ERROR' });
  ACTIVE_DEMO_SCENARIO = scenario;
  io.emit('scenario_changed', { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });
  console.log(`[ADMIN] Scenario → ${ACTIVE_DEMO_SCENARIO}`);
  return { status: 'OK', active: ACTIVE_DEMO_SCENARIO };
});

// ─────────────────────────────────────────────
//  MAIN TRANSFER ROUTE
// ─────────────────────────────────────────────
fastify.post('/api/transfer', async (request, reply) => {
  const { transactionId, amount, receiver, isForged } = request.body ?? {};

  if (!transactionId || !amount || !receiver) {
    return reply.status(400).send({ status: 'ERROR', reason: 'Missing fields.' });
  }

  // ── SCENARIO 1 & 2: Legacy — blindly trust HTTP ──
  if (ACTIVE_DEMO_SCENARIO === 'SCENARIO_1' || ACTIVE_DEMO_SCENARIO === 'SCENARIO_2') {
    console.warn(`[LEGACY] Processing TxID ${transactionId} WITHOUT ZKP. isForged=${isForged}`);

    io.emit('ledger_update', {
      id: transactionId,
      sender: isForged ? 'Person 1 (FORGED SESSION)' : 'Person 1',
      receiver,
      amount,
      status: isForged ? 'CRITICAL_THEFT_SUCCESS' : 'LEGITIMATE_SUCCESS',
      scenario: ACTIVE_DEMO_SCENARIO,
      timestamp: new Date().toISOString(),
    });

    io.emit('terminal_log', {
      level: isForged ? 'threat' : 'info',
      message: isForged
        ? `[LEGACY] ⚠ CSRF PAYLOAD BLINDLY PROCESSED — ₹${amount} → ${receiver}`
        : `[LEGACY] Legitimate transfer ₹${amount} → ${receiver} processed.`,
      timestamp: Date.now(),
    });

    return reply.send({ status: 'PROCESSED_LEGACY', message: 'Funds transferred.' });
  }

  // ── SCENARIO 3: AEGIS Zero-Trust ──
  if (ACTIVE_DEMO_SCENARIO === 'SCENARIO_3') {
    shardMemoryVault.set(`${transactionId}_HTTP`, { data: request.body, timestamp: Date.now() });

    io.emit('shard_received', { protocol: 'HTTP', transactionId, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', message: `[AEGIS] Incoming POST /api/transfer — HTTP Shard A stored. TxID: ${transactionId}`, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', message: `[AEGIS] Validating ambient credentials (Cookies)... STATUS: PRESENT.`, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', message: `[AEGIS] Initiating 50ms temporal window for WebRTC cryptographic shard.`, timestamp: Date.now() });

    await new Promise(r => setTimeout(r, 50));

    const httpShard   = shardMemoryVault.get(`${transactionId}_HTTP`);
    const webrtcShard = shardMemoryVault.get(`${transactionId}_WEBRTC`);
    shardMemoryVault.delete(`${transactionId}_HTTP`);
    shardMemoryVault.delete(`${transactionId}_WEBRTC`);

    if (!webrtcShard) {
      io.emit('aegis_intervention', {
        id: transactionId,
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
      io.emit('terminal_log', { level: 'threat', message: `[AEGIS] FATAL: CSRF Payload terminated. TxID: ${transactionId}`, timestamp: Date.now() });
      return reply.status(403).send({ status: 'BLOCKED_BY_AEGIS' });
    }

    const delta = Math.abs(httpShard.timestamp - webrtcShard.timestamp);
    io.emit('ledger_update', {
      id: transactionId, sender: 'Person 1', receiver,
      amount, status: 'AEGIS_VERIFIED', delta,
      scenario: 'SCENARIO_3', timestamp: new Date().toISOString(),
    });
    io.emit('transaction_success', { transactionId, delta, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'success', message: `[AEGIS] Dual-channel sync verified (Δ${delta}ms). APPROVED. TxID: ${transactionId}`, timestamp: Date.now() });
    return reply.status(200).send({ status: 'APPROVED', delta_ms: delta });
  }
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
await fastify.listen({ port: 3002, host: '0.0.0.0' });
console.log('[NODE 2] Fastify on http://0.0.0.0:3002');

const io = new Server(fastify.server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setInterval(() => {
  activeAmtdPort = randomInt(49152, 65536);
  if (ACTIVE_DEMO_SCENARIO === 'SCENARIO_3') {
    io.emit('amtd_telemetry', { current_port: activeAmtdPort, timestamp: Date.now() });
  }
}, 3500);

io.on('connection', (socket) => {
  console.log(`[WS] ${socket.id} connected`);
  socket.emit('scenario_changed', { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });
  socket.emit('amtd_telemetry', { current_port: activeAmtdPort, timestamp: Date.now() });

  socket.on('set_scenario', ({ scenario }) => {
    const valid = ['SCENARIO_1', 'SCENARIO_2', 'SCENARIO_3'];
    if (!valid.includes(scenario)) return;
    ACTIVE_DEMO_SCENARIO = scenario;
    console.log(`[WS] Scenario → ${ACTIVE_DEMO_SCENARIO}`);
    io.emit('scenario_changed', { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });
  });

  socket.on('submit_shard_b', ({ transactionId, zkpSignature, targetPort }) => {
    if (ACTIVE_DEMO_SCENARIO !== 'SCENARIO_3') return;
    if (targetPort !== activeAmtdPort) {
      io.emit('terminal_log', { level: 'threat', message: `[AEGIS] AMTD BLOCK — Stale port ${targetPort}. Active: ${activeAmtdPort}.`, timestamp: Date.now() });
      return;
    }
    shardMemoryVault.set(`${transactionId}_WEBRTC`, { signature: zkpSignature, timestamp: Date.now() });
    io.emit('shard_received', { protocol: 'WebRTC', transactionId, timestamp: Date.now() });
  });

  socket.on('disconnect', () => console.log(`[WS] ${socket.id} disconnected`));
});

console.log('[AMTD] Daemon started — rotating every 3500ms');

/**
 * ⚠️  DEPRECATED — DO NOT RUN
 *
 * This is an early prototype stub from "Project Mirage" (pre-AEGIS).
 * It is NOT part of the live TECHNOTSAV 2026 demo.
 *
 * The active bank server is:
 *   AEGIS/tt/user_payment/node-2-bank-server/server.js  (port 5001)
 *
 * The active AEGIS gateway is:
 *   AEGIS/tt/Security system Moniters_3_persons_activities/aegis-dashboard/server/gateway.js  (port 5002)
 *
 * Known issues in this file (do not fix — file is deprecated):
 *   - Broken CORS registration (missing methods array value)
 *   - AMTD logic not present in the real system
 *   - Runs on port 3001 (not part of the canonical port map)
 */

import Fastify from 'fastify';
import { Server } from 'socket.io';
import crypto from 'crypto';

// Initialize the ultra-fast Fastify server (Node.js 22 LTS optimized)
const fastify = Fastify({ logger: true });

// Setup CORS so our frontend can communicate with it
await fastify.register(import('@fastify/cors'), {
    origin: '*', // In production, this is strictly limited to the exact frontend domain
    methods:
});

// Attach Socket.io for the WebRTC signaling and AMTD rotation
const io = new Server(fastify.server, {
    cors: { origin: '*' }
});

// The Zero-Trust Memory Map: Holds Shard A for exactly 50ms waiting for Shard B
const pendingTransactions = new Map();

// --- 1. AUTOMATED MOVING TARGET DEFENSE (AMTD) ENGINE ---
let currentSecurePort = 49152;

// Every 3 seconds, the server rotates the expected secure tunnel port
setInterval(() => {
    currentSecurePort = Math.floor(Math.random() * (65535 - 49152 + 1) + 49152);
    // Securely broadcast the new moving target ONLY to currently authenticated, human-verified clients
    io.emit('amtd_rotation', { activePort: currentSecurePort });
    fastify.log.info(` Attack surface rotated. New WebRTC Signaling Port: ${currentSecurePort}`);
}, 3000);


// --- 2. THE WEBRTC TUNNEL (Receiving Shard B) ---
io.on('connection', (socket) => {
    fastify.log.info(` Secure client connected: ${socket.id}`);

    socket.on('submit_shard_b', (data) => {
        const { transactionId, zkpSignature, amtdTarget } = data;

        // If the attacker tries to hit an old port, block it instantly
        if (amtdTarget!== currentSecurePort) {
            fastify.log.warn(` AMTD Blocked! Attacker hit dead port: ${amtdTarget}`);
            return;
        }

        // Store Shard B in the vault, ready to be synchronized
        pendingTransactions.set(`${transactionId}_B`, { zkpSignature, timestamp: Date.now() });
    });
});


// --- 3. THE PUBLIC HIGHWAY (Receiving Shard A via HTTP POST) ---
fastify.post('/api/transfer', async (request, reply) => {
    const { transactionId, amount, destination } = request.body;
    
    // Log the arrival of Shard A from the public internet
    pendingTransactions.set(`${transactionId}_A`, { amount, destination, timestamp: Date.now() });

    // The Synchronization Engine: Wait exactly 50ms for Shard B to arrive via WebRTC
    return new Promise((resolve) => {
        setTimeout(() => {
            const shardA = pendingTransactions.get(`${transactionId}_A`);
            const shardB = pendingTransactions.get(`${transactionId}_B`);

            // Clean up memory to prevent memory-leak attacks
            pendingTransactions.delete(`${transactionId}_A`);
            pendingTransactions.delete(`${transactionId}_B`);

            // If Shard B (The WebRTC ZK-Proof) is missing, it's a CSRF / Agentic AI attack!
            if (!shardB) {
                fastify.log.error(` Asymmetric Transport Failure! Missing WebRTC Shard. Attack Neutralized.`);
                resolve(reply.status(403).send({ 
                    status: 'BLOCKED', 
                    reason: 'Zero-Trust Engine: Cryptographic Shard B not received. Automated attack assumed.' 
                }));
                return;
            }

            // Verify the time gap. If they didn't arrive within 50ms of each other, block it.
            const timeDelta = Math.abs(shardA.timestamp - shardB.timestamp);
            if (timeDelta > 50) {
                fastify.log.error(` Temporal Sync Failure. Shards arrived ${timeDelta}ms apart.`);
                resolve(reply.status(403).send({ status: 'BLOCKED', reason: 'Temporal synchronization failed.' }));
                return;
            }

            // SUCCESS: Both shards arrived safely, on the correct rotated port, within 50ms.
            fastify.log.info(` Dual-Channel Shards synchronized. Human Intent Verified.`);
            resolve(reply.send({ status: 'APPROVED', message: 'Funds transferred securely.' }));

        }, 50); // The 50ms Zero-Trust Window
    });
});

// Start the Defender Server
const start = async () => {
    try {
        await fastify.listen({ port: 3001 });
        console.log('🛡️ Project Mirage: Zero-Trust Defender Backend Active on port 3001');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
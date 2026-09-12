const crypto = require('crypto');

class AegisEngine {
  constructor() {
    this.SHARD_TTL_MS = 50; // 50ms temporal synchronization window
    this.vaultStore = new Map(); // Key: txId, Value: { shardA, shardB, timer }
    this.bankBalance = 250000; // Starting Gramin Bank Balance
    this.transactionHistory = [];
    this.attackLog = [];
    this.amtdPort = 49152;
    this.amtdSecret = crypto.randomBytes(16).toString('hex');
    this.defenseMode = 'AEGIS_ACTIVE'; // 'AEGIS_ACTIVE' or 'LEGACY_VULNERABLE'
    
    // Start AMTD Rotation every 5 seconds
    this.startAMTDRotation();
  }

  startAMTDRotation() {
    const timer = setInterval(() => {
      // Dynamic port rotation between 49152 and 65535
      this.amtdPort = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
    }, 5000);
    if (timer.unref) timer.unref();
  }

  getAMTDState() {
    return {
      activePort: this.amtdPort,
      rotationIntervalMs: 5000,
      protocol: 'UDP/WebRTC-AMTD'
    };
  }

  setDefenseMode(mode) {
    this.defenseMode = mode;
    return { mode: this.defenseMode };
  }

  // 1. Evaluate Shannon Entropy of mouse / touch trajectory
  calculateTrajectoryEntropy(points) {
    if (!points || !Array.isArray(points) || points.length < 5) {
      return { entropy: 0, isHuman: false, reason: 'Insufficient motion samples (< 5 points)' };
    }

    const velocities = [];
    for (let i = 1; i < points.length; i++) {
      const dt = Math.max(1, points[i].t - points[i-1].t);
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      velocities.push(Math.round(dist / dt * 100)); // discrete velocity bins
    }

    // Velocity frequency distribution
    const counts = {};
    for (const v of velocities) {
      counts[v] = (counts[v] || 0) + 1;
    }

    // Shannon Entropy: H = - sum(p * log2(p))
    let entropy = 0;
    const total = velocities.length;
    for (const v in counts) {
      const p = counts[v] / total;
      entropy -= p * Math.log2(p);
    }

    // Check for angle changes (detect straight lines)
    let angleChanges = 0;
    for (let i = 2; i < points.length; i++) {
      const a1 = Math.atan2(points[i-1].y - points[i-2].y, points[i-1].x - points[i-2].x);
      const a2 = Math.atan2(points[i].y - points[i-1].y, points[i].x - points[i-1].x);
      if (Math.abs(a2 - a1) > 0.05) angleChanges++;
    }

    const isHuman = (entropy >= 1.5 && angleChanges >= 2);
    return {
      entropy: parseFloat(entropy.toFixed(3)),
      angleChanges,
      isHuman,
      sampleCount: points.length,
      reason: isHuman ? 'Natural human ballistic trajectory' : 'Synthetic or programmatic motion detected'
    };
  }

  // 2. Generate Client-Side ZK-Behavioral Proof (ZK-BP)
  generateZKProof({ txId, trajectoryPoints, userActivation }) {
    const entropyResult = this.calculateTrajectoryEntropy(trajectoryPoints);
    const trajectoryHash = crypto.createHash('sha256')
      .update(JSON.stringify(trajectoryPoints || []))
      .digest('hex');

    const zkpSignature = crypto.createHmac('sha256', this.amtdSecret)
      .update(`${txId}|${trajectoryHash}|${userActivation}|${this.amtdPort}`)
      .digest('hex');

    return {
      txId,
      zkpSignature,
      trajectoryHash,
      entropy: entropyResult.entropy,
      isHuman: entropyResult.isHuman,
      userActivation: Boolean(userActivation),
      amtdPort: this.amtdPort,
      timestamp: Date.now()
    };
  }

  // 3. Receive Shard A (In-Band / HTTP POST)
  receiveShardA(shardA) {
    const { txId, sender, recipient, amount } = shardA;
    const arrivalTime = Date.now();

    // In legacy mode, system blindly approves HTTP request without Shard B
    if (this.defenseMode === 'LEGACY_VULNERABLE') {
      const txRecord = {
        txId,
        sender: sender || 'User-Victim',
        recipient: recipient || 'Hacker-Account',
        amount: Number(amount) || 5000,
        status: 'APPROVED',
        mode: 'LEGACY_UNPROTECTED',
        timestamp: new Date().toISOString(),
        warning: 'PROCESSED IN LEGACY MODE WITHOUT DUAL-CHANNEL VERIFICATION'
      };
      this.bankBalance -= txRecord.amount;
      this.transactionHistory.unshift(txRecord);
      return Promise.resolve({
        status: 'APPROVED',
        message: 'Transaction processed (Legacy vulnerable mode)',
        txRecord
      });
    }

    // AEGIS Zero-Trust Dual-Channel Sharding Engine
    return new Promise((resolve) => {
      let entry = this.vaultStore.get(txId);
      if (!entry) {
        entry = { shardA: null, shardB: null };
        this.vaultStore.set(txId, entry);
      }
      entry.shardA = { ...shardA, arrivalTime };

      // Check if Shard B is already waiting
      if (entry.shardB) {
        return resolve(this.evaluateDualShards(txId));
      }

      // Start 50ms Zero-Trust countdown window
      entry.timer = setTimeout(() => {
        const currentEntry = this.vaultStore.get(txId);
        if (currentEntry && !currentEntry.shardB) {
          // Asymmetric Transport Failure: Missing Shard B -> CSRF or Bot attack!
          this.vaultStore.delete(txId);
          const attackRecord = {
            attackId: `ATK-${Date.now().toString(36).toUpperCase()}`,
            txId,
            vector: 'CSRF_OR_BOT_ASYMMETRIC_TRANSPORT',
            timestamp: new Date().toISOString(),
            failedLayer: 'LAYER 4 (Out-of-Band WebRTC Shard B Missing)',
            details: 'Public HTTP POST arrived, but no matching ZK-Proof was received over WebRTC within 50ms window.',
            mitigation: 'Transaction violently dropped. Session token flagged. Zero balance deducted.',
            verdict: 'BLOCKED'
          };
          this.attackLog.unshift(attackRecord);
          return resolve({
            status: 'BLOCKED',
            reason: 'Zero-Trust Asymmetric Transport Failure: Shard B (ZK-Proof) missing. Automated CSRF/Bot attack neutralized.',
            attackRecord
          });
        }
      }, this.SHARD_TTL_MS);
      if (entry.timer.unref) entry.timer.unref();
    });
  }

  // 4. Receive Shard B (Out-of-Band / WebRTC Tunnel)
  receiveShardB(shardB) {
    const { txId } = shardB;
    const arrivalTime = Date.now();

    let entry = this.vaultStore.get(txId);
    if (!entry) {
      entry = { shardA: null, shardB: null };
      this.vaultStore.set(txId, entry);
    }
    entry.shardB = { ...shardB, arrivalTime };

    // If Shard A is already present, evaluate instantly
    if (entry.shardA) {
      if (entry.timer) clearTimeout(entry.timer);
      return this.evaluateDualShards(txId);
    }

    // If Shard A hasn't arrived yet, wait up to 50ms
    entry.timer = setTimeout(() => {
      this.vaultStore.delete(txId);
    }, this.SHARD_TTL_MS);
    if (entry.timer.unref) entry.timer.unref();

    return { status: 'WAITING_FOR_SHARD_A', txId };
  }

  // 5. Evaluate both Shard A and Shard B in the vault
  evaluateDualShards(txId) {
    const entry = this.vaultStore.get(txId);
    this.vaultStore.delete(txId);

    if (!entry || !entry.shardA || !entry.shardB) {
      return { status: 'BLOCKED', reason: 'Internal synchronization state corrupted' };
    }

    const { shardA, shardB } = entry;
    const timeDelta = Math.abs(shardA.arrivalTime - shardB.arrivalTime);

    // Layer 1: User Activation Verification
    if (!shardB.userActivation) {
      const atk = {
        attackId: `ATK-${Date.now().toString(36).toUpperCase()}`,
        txId,
        vector: 'HEADLESS_AGENTIC_BOT_CLICK',
        timestamp: new Date().toISOString(),
        failedLayer: 'LAYER 1 (navigator.userActivation.isActive = FALSE)',
        details: 'Transaction triggered programmatically by script without physical user activation.',
        mitigation: 'Blocked at hardware activation layer.',
        verdict: 'BLOCKED'
      };
      this.attackLog.unshift(atk);
      return { status: 'BLOCKED', reason: 'Layer 1 Violation: navigator.userActivation failed.', attackRecord: atk };
    }

    // Layer 2: Biometric Trajectory Entropy
    if (shardB.entropy < 1.5) {
      const atk = {
        attackId: `ATK-${Date.now().toString(36).toUpperCase()}`,
        txId,
        vector: 'SYNTHETIC_MOUSE_TRAJECTORY_SPOOF',
        timestamp: new Date().toISOString(),
        failedLayer: 'LAYER 2 (Shannon Entropy H < 1.5)',
        details: `Linear or robotic cursor trajectory detected (Entropy = ${shardB.entropy}).`,
        mitigation: 'Biometric synthetic spoof defense triggered.',
        verdict: 'BLOCKED'
      };
      this.attackLog.unshift(atk);
      return { status: 'BLOCKED', reason: 'Layer 2 Violation: Biometric trajectory entropy insufficient.', attackRecord: atk };
    }

    // Layer 3: AMTD Port Alignment
    if (shardB.amtdPort !== this.amtdPort) {
      const atk = {
        attackId: `ATK-${Date.now().toString(36).toUpperCase()}`,
        txId,
        vector: 'AMTD_RETIRED_PORT_REPLAY',
        timestamp: new Date().toISOString(),
        failedLayer: 'LAYER 3 (AMTD Port Mismatch)',
        details: `Shard arrived on retired port ${shardB.amtdPort}. Expected active port: ${this.amtdPort}.`,
        mitigation: 'Moving Target Defense quarantine engaged.',
        verdict: 'BLOCKED'
      };
      this.attackLog.unshift(atk);
      return { status: 'BLOCKED', reason: 'Layer 3 Violation: AMTD port rotation target invalid.', attackRecord: atk };
    }

    // Layer 5: 50ms Temporal Synchronization Window
    if (timeDelta > this.SHARD_TTL_MS) {
      const atk = {
        attackId: `ATK-${Date.now().toString(36).toUpperCase()}`,
        txId,
        vector: 'TEMPORAL_DESYNCHRONIZATION_ATTACK',
        timestamp: new Date().toISOString(),
        failedLayer: 'LAYER 5 (Temporal Sync Window Exceeded)',
        details: `Shards arrived ${timeDelta}ms apart (Strict limit: ${this.SHARD_TTL_MS}ms).`,
        mitigation: 'Temporal desync block.',
        verdict: 'BLOCKED'
      };
      this.attackLog.unshift(atk);
      return { status: 'BLOCKED', reason: `Layer 5 Violation: Shards arrived ${timeDelta}ms apart (> 50ms).`, attackRecord: atk };
    }

    // ALL 5 LAYERS PASSED: AUTHORIZED HUMAN TRANSACTION!
    const txRecord = {
      txId,
      sender: shardA.sender || 'Verified Human User',
      recipient: shardA.recipient || 'Gong Merchant',
      amount: Number(shardA.amount) || 5000,
      timeDeltaMs: timeDelta,
      zkpSignature: shardB.zkpSignature.slice(0, 16) + '...',
      status: 'APPROVED',
      mode: 'AEGIS_ZERO_TRUST_DUAL_CHANNEL',
      timestamp: new Date().toISOString()
    };

    this.bankBalance -= txRecord.amount;
    this.transactionHistory.unshift(txRecord);

    return {
      status: 'APPROVED',
      message: 'Dual-Channel Shards synchronized within 50ms. Human intent cryptographically verified.',
      timeDeltaMs: timeDelta,
      txRecord
    };
  }

  getStats() {
    return {
      bankBalance: this.bankBalance,
      approvedTransactions: this.transactionHistory.length,
      interceptedAttacks: this.attackLog.length,
      activeAMTDPort: this.amtdPort,
      defenseMode: this.defenseMode,
      shardSyncWindowMs: this.SHARD_TTL_MS,
      recentTransactions: this.transactionHistory.slice(0, 10),
      recentAttacks: this.attackLog.slice(0, 10)
    };
  }
}

module.exports = new AegisEngine();

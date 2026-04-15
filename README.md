it is now time to build the AEGIS system 


# AEGIS — Zero-Knowledge Behavioral Proof CSRF Defense System

> A 3-node live cybersecurity demonstration proving that traditional CSRF tokens are insufficient, and that **Dual-Channel Payload Sharding with ZK-Behavioral Proofs** is the superior defense.

---

## 🌐 The 3-Node Architecture (Live Demo Setup)

To definitively prove the superiority of the AEGIS Dual-Channel framework over standard HTTP CSRF tokens, we are deploying a physical 3-node network.

### 💻 Node 1: The Defender / Victim (Person 1)

- **Role:** The everyday consumer using a trusted digital payment platform (PhonePe UI Clone).
- **Vulnerability:** Relies on standard `SameSite=None` session cookies, making them a target for Cross-Site Request Forgery.
- **The Defense:** Equipped with the **AEGIS Middleware Engine**. AEGIS utilizes `navigator.userActivation` and captures hardware-level mouse/touch entropy to generate a Zero-Knowledge Behavioral Proof (ZK-BP) before any transaction is authorized.
- **Tech Stack:** Next.js 15, Tailwind CSS (Liquid Glass), Framer Motion, WebRTC API.
- **Directory:** `/node-1-defender-app`

### 💻 Node 2: The Trusted Bank Server (Person 2)

- **Role:** The legitimate backend financial institution processing the UPI transfers.
- **The Defense:** Runs the **Zero-Trust Synchronization Engine**. It refuses to process any HTTP POST request unless it simultaneously receives a valid ZK-Proof via a secure, out-of-band WebRTC Data Channel.
- **Tech Stack:** Node.js 22 LTS, Fastify, Socket.io.
- **Directory:** `/node-2-bank-server`

### 💻 Node 3: The Threat Actor / Hacker (Person 3)

- **Role:** A malicious third-party website executing an Agentic AI / CSRF attack.
- **The Attack:** Tricks Node 1 into visiting a compromised page. The page utilizes a hidden `<iframe>` to forge a POST request to Node 2, attempting to drain Node 1's funds by piggybacking on their active session cookies.
- **The Result:** Because Node 3 cannot forge the physical mouse entropy or access the out-of-band WebRTC channel, AEGIS detects the asymmetric transport failure and violently terminates the attack.
- **Tech Stack:** Node.js, Malicious HTML/JS Payload.
- **Directory:** `/node-3-attacker-c2`

---

## 🚀 Running Node 1

```bash
cd node-1-defender-app
npm run dev
# Open http://localhost:3000
```

## 🔬 How AEGIS Works

```
User moves mouse → Entropy buffer fills (500ms window)
                         ↓
User clicks PAY → navigator.userActivation.isActive checked
                         ↓
generateZKProof(entropyData) → zkp_8f9a2b... (SHA-256 of trajectory)
                         ↓
         ┌───────────────┴───────────────┐
    SHARD A (HTTP)               SHARD B (WebRTC)
  POST /api/transfer           RTCDataChannel.send()
  { amount, to, zkp }          { zkp_signature }
         └───────────────┬───────────────┘
                         ↓
              Node 2 validates BOTH shards
              → Transaction approved ✅

If CSRF attack fires (no mouse entropy, no userActivation):
  → ZK-Proof = NULL_TRAJECTORY
  → AEGIS blocks instantly 🛑
  → Threat Modal fires with full trace log
```

## 🛡️ AEGIS Defense Layers

| Layer | Mechanism | Defeats |
|-------|-----------|---------|
| L1 | `navigator.userActivation.isActive` | Automated scripts, hidden iframes |
| L2 | Mouse/touch entropy (500ms window) | Ghost clicks, programmatic events |
| L3 | ZK-Behavioral Proof (SHA-256 trajectory hash) | Replay attacks |
| L4 | WebRTC Dual-Channel Sharding | Cross-origin CSRF (can't forge OOB channel) |
| L5 | Framer Motion threat visualization | Demo impact 😄 |
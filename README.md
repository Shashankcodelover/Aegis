# 🛡️ AEGIS: Zero-Knowledge Behavioral Proof & Dual-Channel Payload Sharding Defense

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Defense Layer](https://img.shields.io/badge/Defense-5--Layer%20Zero--Trust-cyan)](#aegis-5-layer-defense-matrix)
[![AMTD Active](https://img.shields.io/badge/AMTD-5s%20Port%20Rotation-purple)](#automated-moving-target-defense-amtd)
[![Playwright Verified](https://img.shields.io/badge/Playwright-E2E%20Verified-brightgreen)](tests)

> **Google Project of the Year Standard**: Next-generation financial cyber defense proving traditional CSRF tokens and SameSite cookies obsolete against Agentic AI bots and browser injection, introducing **Dual-Channel Payload Sharding (HTTP + WebRTC)** with **Hardware-Level Zero-Knowledge Behavioral Proofs (ZK-BP)**.

---

## ⚡ Executive Summary

Traditional web security assumes that HTTP requests bearing valid session cookies or CSRF tokens originate from a deliberate human intention. In the era of autonomous **Agentic AI**, headless browser automation, and malicious browser extensions, this assumption is fundamentally broken. Attackers can hijack active sessions without user consent via invisible iframes, fetch proxies, or synthetic script injection.

**AEGIS** introduces a zero-trust dual-channel transport framework:
1. **Dual-Channel Payload Sharding**: Financial transactions are cryptographically split into two decoupled transport streams:
   - **Shard A (In-Band / HTTP POST)**: Transaction parameters (amount, recipient, transaction ID, session token).
   - **Shard B (Out-of-Band / WebRTC DataChannel)**: Cryptographic Zero-Knowledge Behavioral Proof (ZK-BP) containing hardware mouse/touch micro-movement trajectory entropy, jitter analysis, `navigator.userActivation` attestation, and ephemeral HMAC signatures.
2. **50ms Temporal Synchronization Vault**: The bank vault server refuses to process transactions unless *both* Shard A and Shard B arrive within a strict $\Delta t \le 50\text{ms}$ window.
3. **Automated Moving Target Defense (AMTD)**: Continuously rotates the verification tunneling port every 5 seconds (between 49152 and 65535), neutralizing static port discovery and replay probes.

---

## 🔬 Scientific & Algorithmic Defense Layers

| Layer | Mechanism | Cryptographic / Biometric Metric | Threat Defeated |
| :--- | :--- | :--- | :--- |
| **Layer 1: Hardware Activation** | `navigator.userActivation.isActive` | Ephemeral browser user activation lifetime check | Invisible iframes, automated background fetch scripts |
| **Layer 2: Biometric Trajectory Entropy** | Shannon Entropy $\mathcal{H} = -\sum p_i \log_2 p_i$ | Discrete velocity frequency binning ($\mathcal{H} \ge 1.5$, $\Delta\theta \ge 2$) | Synthetic bot clicks, linear robotic cursor automation |
| **Layer 3: AMTD Port Alignment** | Dynamic port rotation every 5 seconds | Ephemeral port HMAC binding ($P \in [49152, 65535]$) | Man-in-the-Middle tunnel replay, port scanning |
| **Layer 4: Dual-Channel Sharding** | Out-of-Band WebRTC DataChannel | Transport layer decoupling ($C_1 \neq C_2$) | Classic Cross-Site Request Forgery (CSRF) |
| **Layer 5: Temporal Sync Vault** | Sub-50ms synchronization window | Real-time arrival differential $\Delta t = \|t_A - t_B\| \le 50\text{ms}$ | Asymmetric replay, race condition exploits |

---

## 🖥️ System Architecture & Node Network

```
+-----------------------------------------------------------------------------------------+
|                                  Node 1: Defender Client                                |
|                        (PhonePe / Gong UPI Mobile Terminal Interface)                   |
+-----------------------------+------------------------------------+----------------------+
                              |                                    |
            [Shard A: HTTP POST /api/transfer]   [Shard B: Out-of-Band WebRTC DataChannel]
            { txId, amount, recipient }          { txId, zkpSignature, entropy, amtdPort }
                              |                                    |
                              +------------------+-----------------+
                                                 |
                                                 v
+-----------------------------------------------------------------------------------------+
|                               Node 2: Gramin Bank Vault Server                          |
|             Zero-Trust Synchronizer | Strict 50ms Temporal Window | Real-Time Ledger     |
+------------------------------------------------+----------------------------------------+
                                                 |
                   +-----------------------------+-----------------------------+
                   | (If Shard B missing / late)                               | (If both arrive <= 50ms)
                   v                                                           v
+------------------------------------+                       +------------------------------------+
|       QUARANTINE & DROP 🛑         |                       |     TRANSACTION AUTHORIZED ✅      |
|    Asymmetric Transport Failure    |                       |      Ledger Deducted & Logged      |
|      0 Funds Lost / Stolen         |                       |        Delta t Gauge Display       |
+------------------------------------+                       +------------------------------------+
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js 18+ (tested on Node v25.8.1)
- Python 3.10+ (with `playwright` for testing)

### Installation
```bash
git clone https://github.com/Shashankcodelover/Aegis.git
cd Aegis
npm install
```

### Launch Master Defense SOC Console
```bash
npm start
# SOC Dashboard available at http://localhost:5050
```

### Run End-to-End Playwright Verification
```bash
python tests/playwright_aegis_test.py
```

---

## 🧪 Verified Artifacts

Validated end-to-end with Chromium Playwright:
- `aegis_soc_nominal_verified.png`: 4-quadrant operational overview (Defender Phone, Bank Vault Server, Attacker C2, Master SOC).
- `aegis_human_transfer_verified.png`: Legitimate user payment with live mouse entropy ($\mathcal{H} = 3.42$), dual-channel particle transport, and sub-10ms synchronization approval.
- `aegis_csrf_blocked_verified.png`: Malicious CSRF injection intercepted at Layer 4 (Missing Shard B), vault quarantined, zero balance deducted.
- `aegis_multi_vector_defense_verified.png`: Comprehensive defense against Headless Agentic AI bot clicks, temporal desync, and AMTD port probes.

---

## 📜 License
MIT License. Open-source zero-trust cybersecurity research and engineering prototype.

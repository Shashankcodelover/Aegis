# NODE 2 — TRUSTED BANK SERVER
## AEGIS SOC · Zero-Trust Synchronization Engine

---

## Quick Start (run both in separate terminals)

### Terminal 1 — Backend API + Socket.io (port 3002)
```bash
cd node2-bank-server/backend
npm start
```

### Terminal 2 — SOC Dashboard (port 3000)
```bash
cd node2-bank-server/frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Architecture

```
Person 1 (Victim Laptop)
  │
  ├─── HTTP POST /api/transfer ──────────────────► Fastify :3002  (Shard A)
  └─── Socket.io emit('submit_shard_b') ─────────► Socket.io :3002 (Shard B)
                                                         │
                                              50ms Temporal Window
                                                         │
                                              Both shards present?
                                               ┌─── YES ──► 200 APPROVED
                                               └─── NO  ──► 403 BLOCKED
                                                         │
                                              Socket.io broadcast
                                                         │
                                              SOC Dashboard :3000
```

---

## How the Zero-Trust Engine Works

| Step | Action |
|------|--------|
| 1 | HTTP POST arrives → Shard A stored in `shardMemoryVault` |
| 2 | `shard_received` event fires → SOC Cyan flash |
| 3 | Engine waits exactly **50ms** |
| 4 | Checks for matching `_WEBRTC` shard in vault |
| 5a | Both present → `200 APPROVED` + SOC green sync |
| 5b | WebRTC missing → `403 BLOCKED` + SOC red alarm + vault shake |

## AMTD Daemon
- Rotates active decoy port every **3500ms** using `crypto.randomInt(49152, 65536)`
- Any `submit_shard_b` with a stale `targetPort` is instantly dropped
- Port displayed live on SOC dashboard with animated number swap

## Attack Detection (Person 3)
Person 3's bot sends only the HTTP shard (no WebRTC tunnel).
After 50ms the engine detects the missing ZKP shard and returns:
```json
{ "status": "BLOCKED", "reason": "Asymmetric Transport Failure. Out-of-band ZK-Proof missing." }
```
The SOC dashboard triggers the red alarm, vault shake, and CSRF BLOCKED overlay.

---

## API Reference

### `POST /api/transfer`
```json
{
  "transactionId": "txn_abc123",
  "amount": 500,
  "receiver": "alice@bank.com"
}
```
**Success:** `200 { "status": "APPROVED", "delta_ms": 12 }`  
**Attack:**  `403 { "status": "BLOCKED", "reason": "..." }`

### `GET /health`
```json
{ "status": "ONLINE", "node": "NODE_2_BANK_SERVER", "port": 3002, "amtd_port": 54321 }
```

### Socket.io Events (emit from Person 1)
| Event | Payload |
|-------|---------|
| `submit_shard_b` | `{ transactionId, zkpSignature, targetPort }` |

### Socket.io Events (broadcast to SOC)
| Event | Description |
|-------|-------------|
| `amtd_telemetry` | New active port every 3500ms |
| `shard_received` | HTTP or WebRTC shard arrived |
| `transaction_success` | Both shards verified |
| `threat_alert` | Attack detected / AMTD block |
| `terminal_log` | Raw log line for terminal panel |

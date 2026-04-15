# AEGIS — Full Local Deployment Guide

## Port Map

| Port | Role | Directory |
|------|------|-----------|
| **5000** | Person 1 — PhonePe UI (money sender) | `node-1-defender-app/` |
| **5001** | Person 2 — Bank Server | `node-2-bank-server/` |
| **5002** | AEGIS Security Gateway | `../Security system Moniters_3_persons_activities/aegis-dashboard/server/` |
| **5003** | Person 3 — Hacker C2 Site | `node-3-attacker-c2/` |
| **5004** | AEGIS Dashboard (monitor UI) | `../Security system Moniters_3_persons_activities/aegis-dashboard/` |

## Start All (open 5 separate terminals)

### Terminal 1 — AEGIS Gateway (Port 5002) — START FIRST
```bash
cd "AEGIS/tt/Security system Moniters_3_persons_activities/aegis-dashboard"
node server/gateway.js
```

### Terminal 2 — Person 2: Bank Server (Port 5001)
```bash
cd AEGIS/tt/user_payment/node-2-bank-server
node server.js
```

### Terminal 3 — Person 3: Hacker C2 (Port 5003)
```bash
cd AEGIS/tt/user_payment/node-3-attacker-c2
node server.js
```

### Terminal 4 — Person 1: PhonePe UI (Port 5000)
```bash
cd AEGIS/tt/user_payment/node-1-defender-app
npm run dev -- --port 5000
```

### Terminal 5 — AEGIS Dashboard UI (Port 5004)
```bash
cd "AEGIS/tt/Security system Moniters_3_persons_activities/aegis-dashboard"
npm run dev
```
> Port 5004 is set in `package.json` dev script — no `--port` flag needed.

## Open in Browser

- http://localhost:5000 — Person 1 (PhonePe UI — make payments here)
- http://localhost:5001 — Person 2 (Bank Server dashboard + ledger)
- http://localhost:5001/health — Person 2 health check
- http://localhost:5002/health — AEGIS Gateway health check
- http://localhost:5003 — Person 3 (Hacker control panel)
- http://localhost:5004 — AEGIS Security Dashboard (watch attacks in real-time)

## Quick Reference — Canonical Port Map

| Port | Node | Tech |
|------|------|------|
| 5000 | Person 1 — PhonePe Payment App | Next.js |
| 5001 | Person 2 — Bank Server | Fastify + HTML |
| 5002 | AEGIS Gateway API | Fastify + Socket.io |
| 5003 | Person 3 — Hacker C2 | Express |
| 5004 | AEGIS Dashboard UI | Next.js |

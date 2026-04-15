# AEGIS System — Local Setup Guide

This project runs **5 separate processes** across 4 folders. You need all of them running at the same time for the full demo to work.

---

## Prerequisites — Install These First

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18 or higher | https://nodejs.org |
| npm | comes with Node.js | — |
| Git | any recent version | https://git-scm.com |

Check your versions:
```bash
node -v
npm -v
git --version
```

---

## Step 1 — Clone the Repo

```bash
git clone <your-repo-url>
cd <repo-folder>
```

---

## Step 2 — Install Dependencies

You need to run `npm install` inside **each** of the 4 project folders separately.

Open 4 terminal tabs and run:

**Terminal 1 — Node 1 (Gong Payment App)**
```bash
cd tt/user_payment/node-1-defender-app
npm install
```

**Terminal 2 — Node 2 (Bank Server)**
```bash
cd tt/user_payment/node-2-bank-server
npm install
```

**Terminal 3 — Node 3 (Attacker C2)**
```bash
cd tt/user_payment/node-3-attacker-c2
npm install
```

**Terminal 4 — AEGIS Dashboard + Gateway**
```bash
cd "tt/Security system Moniters_3_persons_activities/aegis-dashboard"
npm install
```

---

## Step 3 — Set Up Environment Variables

### Node 1 — Gong Payment App
Create a file at `tt/user_payment/node-1-defender-app/.env.local` with:
```
NEXT_PUBLIC_AEGIS_URL=http://localhost:5002
NEXT_PUBLIC_APP_PORT=5000
NEXT_PUBLIC_BANK_URL=http://localhost:5001/api/transfer
```

### AEGIS Dashboard
Create a file at `tt/Security system Moniters_3_persons_activities/aegis-dashboard/.env.local` with:
```
NEXT_PUBLIC_GATEWAY_URL=http://localhost:5002
NEXT_PUBLIC_GATEWAY_PORT=5002
NEXT_PUBLIC_DEFENDER_URL=http://localhost:5000
```

> Node 2 and Node 3 have no env files — they run with defaults.

---

## Step 4 — Start All 5 Processes

You need **5 terminals open at the same time**. Start them in this exact order:

### Terminal 1 — AEGIS Gateway (start this FIRST)
```bash
cd "tt/Security system Moniters_3_persons_activities/aegis-dashboard"
npm run gateway
```
Runs on: `http://localhost:5002`
This is the central hub — all other nodes connect to it. Start it before anything else.

---

### Terminal 2 — Node 2: Bank Server
```bash
cd tt/user_payment/node-2-bank-server
npm run dev
```
Runs on: `http://localhost:5001`
The Gramin Cooperative Bank backend. Handles transfers and the 3-scenario demo controller.

---

### Terminal 3 — Node 3: Attacker C2
```bash
cd tt/user_payment/node-3-attacker-c2
npm run dev
```
Runs on: `http://localhost:5003`
The hacker command-and-control server. Simulates CSRF and agentic AI attacks.

---

### Terminal 4 — Node 1: Gong Payment App (Next.js)
```bash
cd tt/user_payment/node-1-defender-app
npm run dev
```
Runs on: `http://localhost:3000`
The legitimate user's payment app. This is where Person 1 makes payments.

---

### Terminal 5 — AEGIS Dashboard (Next.js)
```bash
cd "tt/Security system Moniters_3_persons_activities/aegis-dashboard"
npm run dev
```
Runs on: `http://localhost:5004`
The security monitoring dashboard. Shows real-time signal flow, transaction history, and attack detection.

---

## Step 5 — Open in Browser

Once all 5 processes are running, open these URLs:

| URL | What it is |
|-----|-----------|
| `http://localhost:3000` | Gong Payment App — Person 1 makes payments here |
| `http://localhost:5001` | Gramin Bank Dashboard — shows the bank ledger |
| `http://localhost:5003` | Attacker C2 — launch CSRF attacks from here |
| `http://localhost:5004` | AEGIS Dashboard — watch the security system in real time |

---

## Port Reference

| Port | Service |
|------|---------|
| 3000 | Node 1 — Gong Payment App (Next.js) |
| 5001 | Node 2 — Bank Server (Fastify) |
| 5002 | AEGIS Gateway (Fastify + Socket.io) |
| 5003 | Node 3 — Attacker C2 (Express) |
| 5004 | AEGIS Dashboard (Next.js) |

---

## How the Demo Works

1. Open the **Gong app** at `localhost:3000` and make a payment — this is the legitimate flow
2. Watch the **AEGIS Dashboard** at `localhost:5004` — you'll see the signal split into 2 channels (HTTP + WebRTC) and both arrive at the vault
3. Open the **Attacker C2** at `localhost:5003` and launch a CSRF attack — only Channel 1 (HTTP) travels, Channel 2 (WebRTC) never arrives, vault blocks it
4. Watch the **Bank Dashboard** at `localhost:5001` — switch between Scenario 1, 2, and 3 using the ⚙ button

---

## Troubleshooting

**`npm install` fails with node-datachannel errors**
This package has native bindings. Make sure you have Python and a C++ build tool installed:
- Windows: `npm install --global windows-build-tools`
- Mac: `xcode-select --install`
- Linux: `sudo apt-get install build-essential`

**Port already in use**
Kill the process using that port:
```bash
# Windows
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:<PORT> | xargs kill
```

**Dashboard shows "OFFLINE" / "GATEWAY LIVE" not appearing**
Make sure the AEGIS Gateway (Terminal 1) started successfully before the other processes. Check Terminal 1 for `[AEGIS] Gateway running on http://0.0.0.0:5002`.

**WebRTC channel not connecting**
The WebRTC DataChannel requires the AEGIS Gateway to be running and reachable. If you're on a different machine on the same LAN, replace `localhost` in the `.env.local` files with the host machine's local IP address (e.g. `192.168.1.x`).

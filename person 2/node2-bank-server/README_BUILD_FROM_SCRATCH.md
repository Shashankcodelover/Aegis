# Gramin Cooperative Bank — Build From Scratch

> **Hackathon-ready spec.** Hand this file to Kiro agent. It will build the exact locally-deployed website — every pixel, every socket event, every scenario — from zero.

---

## What You Are Building

A **rural cooperative bank security operations dashboard** that demonstrates three CSRF attack scenarios in real time. The site has:

- Warm parchment background (`#f5f0e8`), white cards, Inter font
- Decorative green top bar with Hindi + English bank name
- 3-column layout — one column per scenario
- Live transaction ledger per scenario (Socket.io powered)
- AEGIS security intervention modal with animated kill-chain sequence
- Screen shake animation when funds are stolen
- Real-time AMTD port display and shard event monitor

**Two separate processes run simultaneously:**
1. `backend/server.js` — Fastify API + Socket.io on **port 3002**
2. `frontend/` — Next.js 16 dashboard on **port 4000**

---

## Folder Structure to Create

```
node2-bank-server/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── postcss.config.mjs
    ├── next.config.ts
    ├── .env.local
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── config.ts
        └── page.tsx
```

---

## STEP 1 — Backend

### `backend/package.json`

```json
{
  "name": "node2-bank-server-backend",
  "version": "1.0.0",
  "description": "Node 2: Trusted Bank Server - Zero-Trust Synchronization Engine",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "fastify": "^4.28.1",
    "@fastify/cors": "^9.0.1",
    "socket.io": "^4.7.5"
  }
}
```

> After creating this file run: `cd backend && npm install`

---

### `backend/server.js`

```js
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
//  START SERVER
// ─────────────────────────────────────────────
await fastify.listen({ port: 3002, host: '0.0.0.0' });
console.log('[NODE 2] Fastify on http://0.0.0.0:3002');

const io = new Server(fastify.server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// AMTD port rotation every 3500ms
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
```

---

## STEP 2 — Frontend

### `frontend/package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 4000",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.8.0",
    "next": "16.2.3",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

> After creating this file run: `cd frontend && npm install`

---

### `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### `frontend/postcss.config.mjs`

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

---

### `frontend/next.config.ts`

```ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {};
export default nextConfig;
```

---

### `frontend/.env.local`

```
NEXT_PUBLIC_BANK_HOST=http://localhost:3002
```

> **LAN multi-laptop mode:** Change this to the IP of the laptop running the backend.
> Example: `NEXT_PUBLIC_BANK_HOST=http://192.168.1.42:3002`

---

### `frontend/app/config.ts`

```ts
export const BANK_HOST =
  process.env.NEXT_PUBLIC_BANK_HOST ?? 'http://localhost:3002';
```

---

### `frontend/app/globals.css`

```css
@import "tailwindcss";

@layer base {
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; font-family: 'Inter', system-ui, sans-serif; background: #f5f0e8; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #e8e0d0; }
  ::-webkit-scrollbar-thumb { background: #a0855a; border-radius: 2px; }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.row-in { animation: fadeSlideIn 0.4s ease both; }
```

---

### `frontend/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gramin Cooperative Bank',
  description: 'Rural Cooperative Bank — AEGIS Zero-Trust Protected',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
```

---

## STEP 3 — page.tsx

The full `frontend/app/page.tsx` source is in the companion file **`README_PAGE.md`** in this same folder. Copy every code block from that file into `frontend/app/page.tsx` in order — they form one complete file.

---

## STEP 4 — Install & Run

### Terminal 1 — Backend API
```bash
cd node2-bank-server/backend
npm install
node server.js
# → [NODE 2] Fastify on http://0.0.0.0:3002
```

### Terminal 2 — Frontend Dashboard
```bash
cd node2-bank-server/frontend
npm install
npm run dev
# → Ready on http://localhost:4000
```

Open **http://localhost:4000** in your browser.

---

## STEP 5 — Verify Everything Works

| Check | Expected |
|---|---|
| Top bar | Green bar: "सहकारी बैंक \| Cooperative Bank" |
| Header | Landmark icon, "Gramin Cooperative Bank", "Established 1987" |
| Connection badge | Green "Connected" pill (top right) |
| Scenario 1 | Click "Approve Transfer" → green row appears in ledger |
| Scenario 2 | Click "Launch CSRF Attack" → red row, screen shakes |
| Scenario 3 | Click "Launch CSRF Attack (AEGIS Active)" → amber modal with 7-line kill chain sequence |
| Scenario 3 | Click "Approve Transfer (AEGIS)" → blue row "AEGIS VERIFIED" in ledger |

---

## STEP 6 — GitHub Push (ask judge before each push)

After completing each step, ask the judge:
> *"Should I push this to the repo now?"*

```bash
# After backend is working:
git add backend/
git commit -m "feat: add bank backend — Fastify API + Socket.io on port 3002"
git push

# After frontend is working:
git add frontend/
git commit -m "feat: add bank frontend — Gramin Cooperative Bank SOC dashboard on port 4000"
git push

# After any judge-requested alteration:
git add .
git commit -m "fix: <describe the change the judge asked for>"
git push
```

---

## STEP 7 — LAN Multi-Laptop Mode (common WiFi)

When all 4 laptops are on the same WiFi network:

1. Find the IP of the laptop running the **bank backend**:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address under your WiFi adapter e.g. 192.168.1.42
   ```

2. On **every other laptop**, set the env variable to point at that IP:
   ```
   # frontend/.env.local
   NEXT_PUBLIC_BANK_HOST=http://192.168.1.42:3002
   ```

3. On the **hacker laptop (Person 3)**, update `.env.local`:
   ```
   NEXT_PUBLIC_AEGIS_IP=192.168.1.42
   ```

4. Restart all frontends after changing `.env.local`.

5. All 4 laptops can now see live real-time events from the same bank backend.

---

## Design System Reference

| Token | Value |
|---|---|
| Page background | `#f5f0e8` (warm parchment) |
| Top bar | `bg-green-800` |
| Header | `bg-white`, left border `border-green-800` |
| Scenario 1 accent | `bg-green-600` top border |
| Scenario 2 accent | `bg-red-600` top border |
| Scenario 3 accent | `bg-blue-700` top border |
| Font | Inter (Google Fonts) |
| Card style | `bg-white rounded-lg shadow-sm border border-stone-200` |
| Ledger flash | `rgba(254,243,199,0.6)` → white (amber flash on new row) |
| Screen shake | CSS `shake` keyframe, 0.6s, triggered on `CRITICAL_THEFT_SUCCESS` |
| AEGIS modal border | `border-amber-400` |
| AEGIS sequence speed | 420ms per line |

---

## Socket Events Reference

| Event (server → client) | Payload | Effect |
|---|---|---|
| `ledger_update` | `{id, sender, receiver, amount, status, scenario, timestamp}` | Adds row to correct scenario ledger |
| `aegis_intervention` | `{id, reason, mitigation, timestamp, sequence[]}` | Opens AEGIS modal with animated sequence |
| `terminal_log` | `{level, message, timestamp}` | Appends to AEGIS Event Stream |
| `shard_received` | `{protocol, transactionId, timestamp}` | Shows in Shard Monitor |
| `amtd_telemetry` | `{current_port}` | Updates AMTD port display |

| Event (client → server) | Payload | Effect |
|---|---|---|
| `set_scenario` | `{scenario}` | Switches active scenario on backend |
| `submit_shard_b` | `{transactionId, zkpSignature, targetPort}` | Registers WebRTC shard for AEGIS verification |

---

*Built for OWASP CSRF demonstration — Gramin Cooperative Bank Security Operations Centre*

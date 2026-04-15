# Hacker UI — Node 3 (Demo)

Hackathon demo dashboard for the attacker node.

## Setup

```bash
cd hacker-ui
npm install
npm run dev
```

Open http://localhost:3000

## Configuration

Edit `hooks/useAgenticExploit.ts` — change `TARGET_IP` and `TARGET_PORT` to match your bank/demo server machine.

Edit `hooks/useAegisSync.ts` — change `WS_URL` to match your AEGIS machine's WebSocket server IP.

## How it works

- **LEGACY mode** — the demo server returns `200 OK`, the success overlay fires (green)
- **AEGIS mode** — the demo server returns `403 Forbidden`, the blur + failure overlay fires (red)

The mode can be toggled manually in the header, or automatically via WebSocket signal from the AEGIS machine.

## What your demo server needs to expose

```
POST /api/transfer
Body: { transactionId, amount, receiver, scenario }

Returns 200 if scenario === 'LEGACY_VULNERABLE'
Returns 403 if scenario === 'AEGIS_SECURED'
```

The `scenario` field in the request body tells your server which outcome to simulate.

# Person 3 — AGENTIC_SWARM_C2 v4.2.0 (Advanced Attacker UI)

> **Role clarification for TECHNOTSAV 2026 demo**

---

## What This Is

This is **AGENTIC_SWARM_C2 v4.2.0** — a sophisticated Next.js attacker UI built as an advanced demonstration of a multi-vector AI-driven attack platform.

## ⚠️ This is NOT the Primary Demo Node

**The primary Person 3 demo node is:**
```
AEGIS/tt/user_payment/node-3-attacker-c2/server.js
```
- Simple Express server on **port 5003**
- Included in `START_ALL.ps1` / `START_ALL.sh`
- More reliable for live hackathon demo use
- Has 3 clear attack buttons: CSRF iframe, Agentic AI API hijack, PostMessage injection

## When to Use This App

This Next.js app can be used as an **optional advanced demonstration** of a more sophisticated attacker interface. It is suitable for:
- Extended demos where you want to show a more realistic attacker C2 panel
- Showcasing multi-vector AI swarm attack simulation
- Deeper technical discussions about agentic AI threats

## Running This App

If you choose to use this app, it runs on **port 6231** (per its `package.json`):

```bash
cd "AEGIS/tt/person 3"
npm run dev
# Opens on http://localhost:6231
```

> This app is **NOT included** in `START_ALL.ps1` / `START_ALL.sh`. Start it separately if needed.

## Port Map Reference

| Port | Node |
|------|------|
| 5000 | Person 1 — PhonePe UI |
| 5001 | Person 2 — Bank Server |
| 5002 | AEGIS Gateway |
| **5003** | **Person 3 — Primary C2 (Express)** |
| 5004 | AEGIS Dashboard |
| 6231 | Person 3 — Advanced C2 (this app, optional) |

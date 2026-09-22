# AEGIS — Setup and Operations Guide

This guide details how to install, run, and test the AEGIS defense simulation system.

---

## Prerequisites

- **Node.js**: v18 or higher (verified on modern Node LTS / current versions)
- **npm**: Comes bundled with Node.js
- **Git**: Any modern version

Verify your environment:
```bash
node -v
npm -v
```

---

## Quickstart (Consolidated AEGIS System)

The operational core of AEGIS runs as a consolidated Node.js Express server on port 5050, serving both the REST/Socket.IO backend and the interactive SOC frontend.

### 1. Install Dependencies
Run in the project root:
```bash
npm install
```

### 2. Launch Server
Start the defense system:
```bash
npm start
```
The server starts listening:
```
🛡️ AEGIS Zero-Trust Cyber Defense Server running on port 5050
🌐 SOC Command Console: http://localhost:5050
```

### 3. Access SOC Console
Open `http://localhost:5050` in a web browser. From here you can:
- Test legitimate dual-channel payments using the Gong Pay interface.
- Move your cursor across the entropy tracker canvas to view live Shannon entropy calculations.
- Trigger simulated attack vectors (Classic CSRF, Agentic AI bot, Temporal Desync, AMTD Port probe).
- Inspect real-time transaction verification in the Gramin Bank ledger table.
- View and manage zero-trust network topology corridors and endpoint nodes.
- Execute batch imports of corridors and nodes via RFC 4180 CSV or JSON schemas.

---

## Running Automated Tests

AEGIS includes 11 automated unit tests covering the in-memory topology engine, cascading corridor purges, and RFC 4180 CSV / JSON batch ingestion:

```bash
node --test tests/enterpriseMesh.test.js
```

---

## Auxiliary Directories Note

The repository also contains experimental and prototype subdirectories:
- `person 2/node2-bank-server`: An alternative standalone Fastify bank server prototype.
- `tt/`: Legacy multi-component experiment and prototype directories. Note that historical multi-process launchers (`START_ALL.bat`, `START_ALL.ps1`) reference external submodule directories from earlier development stages.

# 🛡️ AEGIS: Dual-Channel Payload Sharding Defense System

AEGIS provides an Express and Socket.IO server simulating a dual-channel payload validation architecture, automated moving target defense (AMTD) port rotation, behavioral trajectory entropy analysis, and an in-memory network topology management service with batch ingestion.

## Features

### 1. Dual-Channel Payload Sharding Simulation
- **Two Transport Channels**: Accepts transaction data split across two separate HTTP POST endpoints: `/api/transfer` (In-Band Shard A: transaction metadata and amount) and `/api/webrtc/shard` (Out-of-Band Shard B: behavioral entropy and port target).
- **50ms Temporal Synchronization Window**: Holds Shard A in memory for up to 50ms awaiting Shard B. If Shard B does not arrive within this window, the transaction is dropped as an asymmetric transport failure.
- **5-Layer Transaction Evaluation Engine**:
  - **Layer 1 (User Activation)**: Verifies the `userActivation` boolean flag is present and true.
  - **Layer 2 (Biometric Entropy)**: Computes the Shannon entropy and directional angle changes of mouse/touch coordinates to differentiate human motion from linear bot scripts.
  - **Layer 3 (AMTD Port Alignment)**: Confirms the target port matches the active server-rotated port.
  - **Layer 4 (Shard Presence)**: Rejects transactions missing the out-of-band validation shard (e.g., standard CSRF requests).
  - **Layer 5 (Temporal Delta)**: Verifies that both shards arrive within 50ms of each other.
- **In-Memory Ledger & Defense Modes**: Maintains an in-memory bank balance (starting at ₹250,000), transaction history, and attack logs. Supports toggling between `AEGIS_ACTIVE` (enforces 5-layer checks) and `LEGACY_VULNERABLE` (approves HTTP requests directly without dual-channel checks).

### 2. Automated Moving Target Defense (AMTD)
- **Dynamic Port Rotation**: Rotates the expected verification port every 5 seconds to a random integer between 49152 and 65535.
- **Telemetry Broadcast**: Emits port updates to connected clients via Socket.IO events (`amtd_state`).

### 3. Interactive Web SOC Console (`public/index.html`)
- **Node 1 (Defender Client)**: Provides an HTML5 canvas to track cursor/touch movements, displays live Shannon entropy calculation, and submits dual-channel transaction requests.
- **Node 2 (Bank Vault Server)**: Displays the current bank vault balance, real-time synchronization delta ($\Delta t$), and a verified transaction ledger table.
- **Node 3 (Attacker C2 Center)**: Provides buttons to trigger four simulated attack vectors:
  - Classic CSRF (submits Shard A only; dropped after 50ms).
  - Agentic AI Bot (submits synthetic linear trajectories with `userActivation: false`).
  - Temporal Desync (delays Shard B by 250ms).
  - AMTD Port Scan (submits Shard B with an obsolete port number).
- **Operations Console**: Renders status cards for all 5 defense layers, animates shard arrival using an HTML5 particle canvas, and displays a live interception feed.

### 4. Relational Topology Mesh Service (`core/aegisTopologyService.js`)
- **Corridors & Nodes Management**: In-memory CRUD endpoints for managing network nodes (`/api/topology/nodes`) and sharding corridors (`/api/topology/corridors`).
- **1-Click Corridor Controls**: Supports instant severing (`/api/topology/corridors/:id/sever`) and restoration (`/api/topology/corridors/:id/restore`) of communication corridors.
- **Cascading Deletion**: Automatically removes all associated sharding corridors when an endpoint node is deleted.
- **Batch Ingestion Studio**: Ingests corridor and node definitions in bulk from RFC 4180 CSV or JSON formats via `/api/topology/corridors/upload` and `/api/topology/nodes/upload`.
- **Live Telemetry Strip**: Calculates active corridor counts, average Shannon entropy, governed nodes, zero-trust coverage percentage, and average recombination SLA.

---

## 📸 Screenshots

### Executive SOC Command Console
![AEGIS SOC Executive Command](screenshots/desktop/01_desktop_aegis_soc_executive_command.png)

### Zero-Trust Sharding Topology Mesh
![Zero-Trust Topology Mesh](screenshots/desktop/02_desktop_zerotrust_sharding_topology_mesh.png)

### Enterprise Batch Ingestion Studio
![Enterprise Batch Ingestion Studio](screenshots/desktop/03_desktop_enterprise_ingestion_studio.png)

### Verified User Flows
| Legitimate Transfer Authorized | CSRF Attack Blocked |
|---|---|
| ![Human Transfer](docs/aegis_human_transfer_verified.png) | ![CSRF Blocked](docs/aegis_csrf_blocked_verified.png) |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Server Framework**: Express 4.19.2
- **Real-Time Signaling**: Socket.IO 4.7.5 & Socket.IO Client 4.7.5
- **Security & Logging**: Helmet 7.1.0, CORS 2.8.5, Morgan 1.10.0
- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Testing**: Node.js Native Test Runner (`node:test`), Playwright

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js 18 or higher

### Installation
```bash
npm install
```

### Launch Server
```bash
npm start
```
The dashboard listens at `http://localhost:5050`.

### Run Automated Tests
```bash
node --test tests/enterpriseMesh.test.js
```

---

## 🧪 Automated Testing Suite

The project includes unit tests for topology and batch ingestion logic (`tests/enterpriseMesh.test.js`):

- Default endpoint node seeding and schema validation
- Live telemetry calculation (coverage and average Shannon entropy)
- Corridor provisioning and endpoint binding
- 1-click corridor severing and restoration
- Single corridor deletion and referential continuity
- Cascading deletion of dependent corridors upon node removal
- Batch corridor ingestion via RFC 4180 CSV
- Batch node ingestion via structured JSON
- Malformed batch payload rejection
- Universal corridor purge
- Universal node purge with complete cascading purge

---

## 📁 Repository Structure

- `server.js`: Express server, Socket.IO event handler, and REST API routes.
- `core/aegis_engine.js`: Core validation engine, 50ms temporal window, Shannon entropy calculation, and AMTD port rotation.
- `core/aegisTopologyService.js`: In-memory graph of nodes and corridors, cascading deletion logic, and RFC 4180 CSV/JSON batch parsers.
- `public/`: Web dashboard UI (`index.html`, `js/aegis_app.js`, `css/style.css`).
- `tests/enterpriseMesh.test.js`: 11 unit tests for topology and batch ingestion logic.
- `tests/playwright_aegis_test.py`: Playwright end-to-end browser verification script.
- `screenshots/` & `docs/`: Screenshots of the dashboard and test executions.
- `person 2/`: Secondary bank server prototype.
- `tt/`: Legacy multi-component experiment and prototype scripts.

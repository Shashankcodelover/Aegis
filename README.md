# 🛡️ AEGIS: Basic Dual-Channel Concept API

This project provides a basic Node.js Express server to simulate a dual-channel transport validation concept. 

## Features

1. **Simulated Dual-Channel Validation**: The server provides two HTTP POST endpoints (`/api/transfer` and `/api/webrtc/shard`). It waits up to 50ms for both endpoints to receive data for a given transaction ID before processing.
2. **Trajectory Validation**: It calculates the Shannon entropy of provided mouse/touch trajectory points and checks for angle changes to simulate basic bot detection.
3. **Simulated Port Validation**: It generates a random port number internally every 5 seconds and validates that incoming payloads include this expected number.
4. **Basic Topology Service**: Includes a simple in-memory CRUD API for managing "corridors" and "nodes" along with a batch ingestion route that parses CSV and JSON into the in-memory array.

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js 18+

### Installation
```bash
npm install
```

### Launch Server
```bash
npm start
# Dashboard listening at http://localhost:5050
```

### Run Tests
```bash
node --test tests/enterpriseMesh.test.js
```

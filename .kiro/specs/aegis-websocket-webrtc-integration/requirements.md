# Requirements Document

## Introduction

The AEGIS system currently has a partially-wired WebSocket + WebRTC integration across its 3-node security architecture. WebSocket (Socket.io) connections exist between Node 1 and the AEGIS Gateway, but Node 2 (bank server) has no outbound connection to the gateway. More critically, the WebRTC DataChannel used to carry Shard B (the ZK behavioral proof) is entirely simulated — no real ICE negotiation or signaling server exists, so the channel never actually opens. This feature fully implements the complete, production-grade WebSocket topology and real WebRTC DataChannel signaling so that the split-path security concept works end-to-end with no stubs or fallbacks.

**The split-path concept in one sentence:** When a legitimate user pays, the payment signal is split into two shards — Shard A travels over HTTP, Shard B travels over a real WebRTC DataChannel — and AEGIS only authorizes the transaction when both arrive within a 50 ms temporal window. Automated bots cannot open a WebRTC DataChannel (no signaling, no human interaction), so they are always blocked.

---

## Glossary

- **AEGIS_Gateway**: The Fastify + Socket.io server running on port 5002. The central zero-trust vault that receives both shards and runs SHA-256 verification.
- **Node_1**: The Next.js Gong payment app (port 3000). Person 1 / legitimate user's browser.
- **Node_2**: The Fastify Gramin Cooperative Bank server (port 5001). Receives the final authorized transfer.
- **Node_3**: The Express attacker C2 server (port 5003). Simulates CSRF, agentic AI, and postMessage attacks.
- **Shard_A**: The public HTTP fragment of a payment signal. Contains `{ transactionId, timestamp, payload }`. Sent via `POST /gateway/shard-a`.
- **Shard_B**: The hidden WebRTC fragment of a payment signal. Contains `{ transactionId, timestamp, proof }` (ZK behavioral proof). Sent via RTCDataChannel named `"aegis-zkp-shard"`.
- **Signaling_Server**: The Socket.io event layer inside AEGIS_Gateway that brokers WebRTC offer/answer/ICE exchange between Node_1 browser and the gateway's node-datachannel peer.
- **ZK_Proof**: A deterministic SHA-256 hash derived from mouse/touch entropy captured in the 500 ms before a payment click. Proves a real human interacted with the UI.
- **Temporal_Window**: The 50 ms deadline within which both Shard_A and Shard_B must arrive at AEGIS_Gateway for a transaction to be authorized.
- **ICE_Candidate**: An Interactive Connectivity Establishment candidate — a network address/port pair used during WebRTC negotiation.
- **DataChannel**: An RTCDataChannel instance named `"aegis-zkp-shard"` used to carry Shard_B from Node_1 browser to AEGIS_Gateway.
- **useAegisInterceptor**: The React hook in Node_1 that manages behavioral entropy capture, ZK proof generation, WebRTC setup, and dual-channel sharding.
- **aegisBridge**: The Socket.io client module in Node_1 that connects to AEGIS_Gateway and emits signal lifecycle events.
- **aegisSocket**: The Socket.io client module in Node_1 that emits payment result events (`payment_success`, `payment_attack`) to AEGIS_Gateway.

---

## Requirements

### Requirement 1: Complete WebSocket Topology — All 3 Nodes Connected to AEGIS Gateway

**User Story:** As a security researcher watching the AEGIS dashboard, I want all three nodes to be connected to the AEGIS Gateway via Socket.io, so that every event (legitimate payment, bank confirmation, attack attempt) is visible in real time on the dashboard.

#### Acceptance Criteria

1. THE Node_1 SHALL maintain a persistent Socket.io connection to AEGIS_Gateway on port 5002, emitting `payment_initiated`, `payment_success`, `payment_attack`, `signal_initiated`, and `signal_update` events.
2. THE Node_2 SHALL establish an outbound Socket.io client connection to AEGIS_Gateway on port 5002 on server startup, emitting `bank_transfer_received`, `bank_transfer_authorized`, and `bank_transfer_blocked` events whenever a transfer is processed.
3. THE Node_3 SHALL emit a `attack_launched` Socket.io event to AEGIS_Gateway on port 5002 whenever an attack button is clicked, carrying `{ attackType, targetUrl, timestamp }`.
4. WHEN AEGIS_Gateway receives a `bank_transfer_authorized` event from Node_2, THE AEGIS_Gateway SHALL emit a `transaction_update` event to all connected dashboard clients.
5. WHEN AEGIS_Gateway receives a `bank_transfer_blocked` event from Node_2, THE AEGIS_Gateway SHALL emit a `CRITICAL_INTERCEPT` event to all connected dashboard clients.
6. IF Node_2 loses its Socket.io connection to AEGIS_Gateway, THEN THE Node_2 SHALL attempt reconnection with exponential backoff up to 3 attempts before logging a warning and continuing in standalone mode.
7. THE AEGIS_Gateway SHALL accept Socket.io connections from all three nodes on a single shared namespace (`/`) with CORS origin set to `*` for LAN demo compatibility.

---

### Requirement 2: WebRTC Signaling Server in AEGIS Gateway

**User Story:** As a developer, I want the AEGIS Gateway to act as a WebRTC signaling server over Socket.io, so that Node_1's browser can negotiate a real ICE connection and open a DataChannel to the gateway without any external signaling infrastructure.

#### Acceptance Criteria

1. WHEN a Socket.io client emits a `webrtc_offer` event carrying `{ sdp, type: "offer" }`, THE AEGIS_Gateway SHALL create a new `node-datachannel` PeerConnection, set the remote description from the offer SDP, generate an answer SDP, and emit `webrtc_answer` back to the same socket with `{ sdp, type: "answer" }`.
2. WHEN a Socket.io client emits a `webrtc_ice_candidate` event carrying `{ candidate, sdpMid, sdpMLineIndex }`, THE AEGIS_Gateway SHALL add the ICE candidate to the corresponding PeerConnection for that socket.
3. THE AEGIS_Gateway SHALL maintain a per-socket Map of active PeerConnections keyed by `socket.id`, so that multiple simultaneous clients can each have their own WebRTC session.
4. WHEN a DataChannel named `"aegis-zkp-shard"` opens on a PeerConnection, THE AEGIS_Gateway SHALL register an `onMessage` handler that parses the incoming JSON as Shard_B and stores it in the temporal shard store.
5. WHEN a socket disconnects, THE AEGIS_Gateway SHALL close and delete the PeerConnection associated with that `socket.id` to prevent resource leaks.
6. IF `node-datachannel` is not available, THEN THE AEGIS_Gateway SHALL log a warning and accept Shard_B via the existing HTTP fallback endpoint `POST /gateway/shard-b` without crashing.

---

### Requirement 3: Real WebRTC DataChannel in Node_1 (useAegisInterceptor)

**User Story:** As a developer, I want the `useAegisInterceptor` hook to perform real WebRTC offer/answer/ICE negotiation via Socket.io signaling, so that Shard_B is transmitted over a genuine RTCDataChannel rather than a simulated timeout.

#### Acceptance Criteria

1. WHEN `useAegisInterceptor` initializes, THE useAegisInterceptor SHALL create an `RTCPeerConnection` with STUN server `stun:stun.l.google.com:19302`, create a DataChannel named `"aegis-zkp-shard"`, generate an SDP offer, and emit `webrtc_offer` to AEGIS_Gateway via the aegisBridge Socket.io connection.
2. WHEN AEGIS_Gateway emits `webrtc_answer` back to Node_1, THE useAegisInterceptor SHALL set the remote description on the `RTCPeerConnection` using the received answer SDP.
3. WHEN the `RTCPeerConnection` generates an ICE candidate, THE useAegisInterceptor SHALL emit `webrtc_ice_candidate` to AEGIS_Gateway via the aegisBridge Socket.io connection carrying `{ candidate, sdpMid, sdpMLineIndex }`.
4. WHEN AEGIS_Gateway emits `webrtc_ice_candidate` to Node_1, THE useAegisInterceptor SHALL add the received ICE candidate to the `RTCPeerConnection`.
5. WHEN the DataChannel `"aegis-zkp-shard"` transitions to `readyState === "open"`, THE useAegisInterceptor SHALL set `isWebRTCReady: true` in its state and remove the 1500 ms fallback timeout.
6. WHILE the DataChannel is open and `isWebRTCReady` is true, THE useAegisInterceptor SHALL send Shard_B as a JSON string via `dataChannel.send()` instead of the HTTP fallback `POST /gateway/shard-b`.
7. IF the DataChannel fails to open within 5000 ms of offer creation, THEN THE useAegisInterceptor SHALL fall back to sending Shard_B via `POST /gateway/shard-b` and log `[AEGIS/WebRTC] Fallback to HTTP for Shard B`.
8. THE useAegisInterceptor SHALL close the `RTCPeerConnection` and DataChannel on component unmount to prevent memory leaks.

---

### Requirement 4: Signal Split — Where Shard A and Shard B Diverge

**User Story:** As a security researcher, I want to understand exactly where in the code the payment signal splits into two channels, so that I can verify the dual-path architecture is correctly implemented.

#### Acceptance Criteria

1. WHEN `executeTransfer` in `useAegisInterceptor` determines the payment is legitimate (human entropy verified, `userActivation.isActive` is true, ZK proof passes), THE useAegisInterceptor SHALL split the signal at that exact point into Shard_A and Shard_B before any network call is made.
2. THE useAegisInterceptor SHALL dispatch Shard_A as `POST /gateway/shard-a` with body `{ transactionId, timestamp, payload: { amount, to }, source: "PERSON_1" }` within 10 ms of the split decision.
3. THE useAegisInterceptor SHALL dispatch Shard_B via the open DataChannel as JSON `{ transactionId, timestamp, proof: zkResult.proof, entropyScore: zkResult.entropyScore }` within 10 ms of the split decision.
4. THE useAegisInterceptor SHALL generate a single `transactionId` (format: `txn-${Date.now()}-${random}`) shared by both Shard_A and Shard_B so AEGIS_Gateway can correlate them.
5. WHEN an automated attack is detected (no `userActivation`, zero entropy, or `isAutomated` flag), THE useAegisInterceptor SHALL NOT create or send Shard_B, ensuring AEGIS_Gateway receives only Shard_A and blocks the transaction.
6. FOR ALL legitimate payments, the `transactionId` in Shard_A SHALL equal the `transactionId` in Shard_B so that `H(P) = SHA-256(S_A ∥ S_B)` produces a deterministic, verifiable hash.

---

### Requirement 5: AEGIS Gateway Shard Verification Engine

**User Story:** As a security engineer, I want the AEGIS Gateway to correctly verify both shards using SHA-256 and the 50 ms temporal window, so that only legitimate dual-channel payments are authorized.

#### Acceptance Criteria

1. WHEN `POST /gateway/shard-a` is received, THE AEGIS_Gateway SHALL store Shard_A in the in-process temporal store with key `shardA:{transactionId}` and a TTL of 1000 ms (20× the 50 ms window).
2. WHEN Shard_B arrives via WebRTC DataChannel, THE AEGIS_Gateway SHALL store it with key `shardB:{transactionId}` and a TTL of 1000 ms.
3. WHEN both shards are present, THE AEGIS_Gateway SHALL compute `drift = |shardA.timestamp - shardB.timestamp|` and reject the transaction with status `BLOCKED` and code `TEMPORAL_DRIFT` if `drift > 50`.
4. WHEN both shards are present and `drift ≤ 50`, THE AEGIS_Gateway SHALL compute `hash = SHA-256(JSON.stringify(shardA) + JSON.stringify(shardB))` and emit `TRANSACTION_AUTHORIZED` with `{ transactionId, hash, drift }` to all dashboard clients.
5. WHEN 50 ms elapses after Shard_A arrives and Shard_B has not been stored, THE AEGIS_Gateway SHALL emit `CRITICAL_INTERCEPT` with `{ transactionId, source, reason: "Cryptographic Shard B (WebRTC) absent. Automated forgery detected." }` and return HTTP 403 with `{ status: "BLOCKED", code: "MISSING_SHARD_B" }`.
6. FOR ALL valid inputs where `shardA.transactionId === shardB.transactionId` and `drift ≤ 50`, THE AEGIS_Gateway SHALL produce the same SHA-256 hash on every invocation (deterministic verification).

---

### Requirement 6: Node 2 Bank Server Socket.io Client Connection to AEGIS Gateway

**User Story:** As a developer, I want Node_2 to connect to AEGIS_Gateway as a Socket.io client, so that bank-side events (transfer received, authorized, blocked) are visible on the AEGIS dashboard in real time.

#### Acceptance Criteria

1. WHEN Node_2 starts, THE Node_2 SHALL create a Socket.io client connection to `http://localhost:5002` (or the value of `AEGIS_GATEWAY_URL` environment variable) using `socket.io-client`.
2. WHEN Node_2 processes a transfer in SCENARIO_3 and the transfer is authorized (both shards present), THE Node_2 SHALL emit `bank_transfer_authorized` to AEGIS_Gateway with `{ txId, amount, to, hash, timestamp }`.
3. WHEN Node_2 processes a transfer in SCENARIO_3 and Shard_B is missing, THE Node_2 SHALL emit `bank_transfer_blocked` to AEGIS_Gateway with `{ txId, amount, to, reason: "MISSING_SHARD_B", timestamp }`.
4. WHEN Node_2 processes a transfer in SCENARIO_1 or SCENARIO_2, THE Node_2 SHALL emit `bank_transfer_received` to AEGIS_Gateway with `{ txId, amount, to, scenario, timestamp }` for dashboard visibility.
5. WHEN Node_2's Socket.io connection to AEGIS_Gateway is lost, THE Node_2 SHALL continue processing transfers normally and attempt reconnection in the background without blocking the transfer endpoint.

---

### Requirement 7: Dashboard Animation Driven by Real Socket Events

**User Story:** As a demo presenter, I want the AEGIS dashboard's `SignalFlowVisualizer` and `SplitTunnelHero` animations to be driven by real Socket.io events from the gateway, so that the visual flow matches the actual network activity.

#### Acceptance Criteria

1. WHEN AEGIS_Gateway emits `animate_signal_start`, THE Dashboard SHALL dispatch `window.CustomEvent("aegis_animate_start")` to trigger the split-tunnel animation from IDLE → INITIATED → SPLITTING → TRAVELING.
2. WHEN AEGIS_Gateway emits `animate_approval` with `{ matchScore, latencyMs }`, THE Dashboard SHALL dispatch `window.CustomEvent("aegis_approved", { detail: { matchScore, latencyMs } })` to transition the animation to APPROVED state.
3. WHEN AEGIS_Gateway emits `animate_block` with `{ blockReason }`, THE Dashboard SHALL dispatch `window.CustomEvent("aegis_blocked", { detail: { blockReason } })` to transition the animation to BLOCKED state.
4. WHEN AEGIS_Gateway emits `TRANSACTION_AUTHORIZED`, THE Dashboard SHALL update the `PaymentHistoryFeed` and `ThreatReadout` components with the authorized transaction data within 100 ms of receiving the event.
5. WHEN AEGIS_Gateway emits `CRITICAL_INTERCEPT`, THE Dashboard SHALL trigger the red flash overlay and update `ThreatReadout` with the intercept reason within 100 ms of receiving the event.
6. THE Dashboard Socket.io client SHALL connect to AEGIS_Gateway using `transports: ["websocket", "polling"]` and display a connection status indicator that reflects the live connection state.

---

### Requirement 8: End-to-End Legitimate Payment Flow (No Stubs)

**User Story:** As a developer, I want a complete, stub-free legitimate payment flow from Node_1 click to AEGIS authorization, so that the demo proves the real dual-channel architecture works.

#### Acceptance Criteria

1. WHEN Person 1 clicks Pay in the Gong app with sufficient mouse entropy (≥ 3 entropy points, entropy score > 5), THE useAegisInterceptor SHALL complete the full flow: ZK proof generation → signal split → Shard_A via HTTP → Shard_B via real WebRTC DataChannel → AEGIS authorization → `payment_success` emitted to dashboard.
2. WHEN the WebRTC DataChannel is open and Shard_B is sent, THE AEGIS_Gateway SHALL receive the DataChannel message, parse it as JSON, store it as `shardB:{transactionId}`, and emit `SHARD_B_RECEIVED` to dashboard clients.
3. WHEN both shards are verified and `TRANSACTION_AUTHORIZED` is emitted, THE Node_1 SHALL receive the `signal_approved` Socket.io event and update the UI to show payment approved.
4. THE complete flow from Pay button click to `TRANSACTION_AUTHORIZED` event on the dashboard SHALL complete within 500 ms under normal LAN conditions.
5. FOR ALL legitimate payments where the WebRTC DataChannel is open, THE system SHALL NOT use the HTTP fallback `POST /gateway/shard-b` for Shard_B delivery.

---

### Requirement 9: End-to-End Attack Flow (No Stubs)

**User Story:** As a security researcher, I want automated attacks from Node_3 to be provably blocked because they cannot produce Shard_B, so that the demo clearly shows the WebRTC behavioral proof is the security boundary.

#### Acceptance Criteria

1. WHEN Node_3 launches a CSRF attack (direct `POST /gateway/shard-a` with no corresponding Shard_B), THE AEGIS_Gateway SHALL wait 50 ms, find no Shard_B, and return HTTP 403 with `{ status: "BLOCKED", code: "MISSING_SHARD_B" }`.
2. WHEN Node_3 launches an agentic AI attack, THE AEGIS_Gateway SHALL emit `CRITICAL_INTERCEPT` to the dashboard within 60 ms of receiving the forged Shard_A.
3. WHEN a postMessage injection triggers `executeTransfer` with `isAutomated = true`, THE useAegisInterceptor SHALL NOT open a WebRTC DataChannel and SHALL NOT send Shard_B, ensuring the attack is blocked at the gateway.
4. THE Node_3 attack flow SHALL NOT require any code changes to be blocked — the absence of a real WebRTC DataChannel (no signaling, no human interaction) is sufficient for AEGIS_Gateway to detect and block the attack.
5. WHEN an attack is blocked, THE AEGIS_Gateway SHALL emit `animate_signal_start` followed by `animate_block` (after 3200 ms) so the dashboard shows the attack traveling through Channel 1 but failing at the vault when Channel 2 never arrives.

---

### Requirement 10: WebRTC Round-Trip Integrity (Parser/Serializer)

**User Story:** As a developer, I want Shard_B's JSON serialization and deserialization to be lossless across the WebRTC DataChannel, so that the ZK proof and transaction ID are never corrupted in transit.

#### Acceptance Criteria

1. THE useAegisInterceptor SHALL serialize Shard_B as `JSON.stringify({ transactionId, timestamp, proof, entropyScore })` before calling `dataChannel.send()`.
2. THE AEGIS_Gateway SHALL deserialize the DataChannel message using `JSON.parse(msg)` and validate that `proof.transactionId`, `proof.timestamp`, and `proof.proof` are all present before storing.
3. FOR ALL valid Shard_B objects, serializing then deserializing SHALL produce an object where `parsed.transactionId === original.transactionId` and `parsed.proof === original.proof` (round-trip property).
4. IF the DataChannel message cannot be parsed as valid JSON, THEN THE AEGIS_Gateway SHALL log `[AEGIS/WebRTC] Failed to parse Shard B` and discard the message without crashing.
5. IF the parsed Shard_B is missing `transactionId`, `timestamp`, or `proof`, THEN THE AEGIS_Gateway SHALL discard the message and log a warning, treating the transaction as having no Shard_B.

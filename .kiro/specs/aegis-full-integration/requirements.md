# Requirements Document

## Introduction

This feature fully integrates three running web applications into a single coherent demonstration system:

1. **Bank Dashboard** (`tt/person 2 copy/node2-bank-server/`) — the victim bank UI and backend (ports 4000 frontend / 3002 backend)
2. **AEGIS Security Dashboard** (`tt/Security system Moniters_3_persons_activities/aegis-dashboard/`) — the zero-trust security monitoring UI and gateway (ports 5004 frontend / 5002 gateway)
3. **Hacker C2** (`tt/person 3 copy/hacker-ui/`) — the attacker command-and-control UI (port 5003)

Currently the three apps run in isolation. The bank backend does not forward events to the AEGIS gateway, the AEGIS dashboard has no awareness of bank transactions, and the Hacker C2 targets the wrong port (5001 instead of 3002). This feature wires all three together so that every user action in any app produces a visible, real-time reaction in the other two apps, demonstrating the full AEGIS zero-trust dual-channel security story end-to-end.

---

## Glossary

- **Bank_Backend**: The Fastify + Socket.io server running on port 3002 at `tt/person 2 copy/node2-bank-server/backend/server.js`
- **Bank_Frontend**: The Next.js React app running on port 4000 at `tt/person 2 copy/node2-bank-server/frontend/app/page.tsx`
- **AEGIS_Gateway**: The Fastify + Socket.io server running on port 5002 at `tt/Security system Moniters_3_persons_activities/aegis-dashboard/server/gateway.js`
- **AEGIS_Dashboard**: The Next.js React app running on port 5004 at `tt/Security system Moniters_3_persons_activities/aegis-dashboard/app/page.tsx`
- **Hacker_C2**: The Next.js React app running on port 5003 at `tt/person 3 copy/hacker-ui/`
- **Hacker_Hook**: The hook at `tt/person 3 copy/hacker-ui/hooks/useAgenticExploit.ts`
- **Shard_A**: The HTTP channel cryptographic fragment of a transaction, carrying the POST body
- **Shard_B**: The WebRTC channel cryptographic fragment of a transaction, carrying the ZK behavioral proof
- **AMTD_Port**: The dynamically rotating port number used by the AEGIS Moving Target Defense mechanism, emitted every 3500 ms by the Bank_Backend
- **Dual_Channel_Animation**: The split-tunnel visual on the AEGIS_Dashboard showing a signal travelling through two parallel tunnels and merging at the vault
- **AEGIS_Toggle**: A button on the Bank_Frontend that switches the active scenario between SCENARIO_3 (AEGIS active) and SCENARIO_1 (AEGIS inactive)
- **CSRF_Attack**: A forged cross-site POST request sent without a matching Shard_B, simulating an automated bot attack
- **Transaction_ID**: A unique string identifier generated per transfer attempt, used to correlate Shard_A and Shard_B across systems

---

## Requirements

### Requirement 1: Bank Backend Forwards Events to AEGIS Gateway

**User Story:** As a demo operator, I want the Bank_Backend to notify the AEGIS_Gateway whenever a transaction is processed or blocked, so that the AEGIS_Dashboard reflects real bank activity in real time.

#### Acceptance Criteria

1. WHEN the Bank_Backend approves a SCENARIO_3 transaction (both shards matched), THE Bank_Backend SHALL emit a `payment_success` Socket.io event to the AEGIS_Gateway containing `transactionId`, `amount`, `receiver`, and `timestamp`.
2. WHEN the Bank_Backend blocks a SCENARIO_3 transaction due to a missing Shard_B, THE Bank_Backend SHALL emit a `payment_attack` Socket.io event to the AEGIS_Gateway containing `transactionId`, `reason`, and `timestamp`.
3. THE Bank_Backend SHALL establish a Socket.io client connection to the AEGIS_Gateway at `http://localhost:5002` on startup.
4. IF the AEGIS_Gateway is unreachable at startup, THEN THE Bank_Backend SHALL log a warning and continue operating without crashing.
5. IF the AEGIS_Gateway connection drops after startup, THEN THE Bank_Backend SHALL attempt to reconnect automatically using Socket.io's built-in reconnection mechanism.
6. WHILE the Bank_Backend is connected to the AEGIS_Gateway, THE Bank_Backend SHALL forward events only for SCENARIO_3 transactions, not for SCENARIO_1 or SCENARIO_2 transactions.

---

### Requirement 2: Legitimate Payment Triggers AEGIS Dual-Channel Animation

**User Story:** As a demo viewer, I want clicking "Approve Transfer (AEGIS)" on the Bank_Frontend to produce a green dual-channel animation on the AEGIS_Dashboard, so that the audience can see the zero-trust approval flow visually.

#### Acceptance Criteria

1. WHEN a user clicks "Approve Transfer (AEGIS)" on the Bank_Frontend, THE Bank_Frontend SHALL emit `submit_shard_b` via Socket.io to the Bank_Backend before sending the HTTP POST to `/api/transfer`.
2. WHEN the Bank_Backend receives both Shard_A (HTTP) and Shard_B (WebRTC) within the 50 ms temporal window, THE Bank_Backend SHALL emit `transaction_success` to all Bank_Frontend clients and `payment_success` to the AEGIS_Gateway.
3. WHEN the AEGIS_Gateway receives `payment_success`, THE AEGIS_Gateway SHALL emit `animate_signal_start` followed by `animate_approval` (after 3200 ms) to all connected AEGIS_Dashboard clients.
4. WHEN the AEGIS_Dashboard receives `animate_signal_start`, THE AEGIS_Dashboard SHALL begin the Dual_Channel_Animation showing the signal splitting into two tunnels.
5. WHEN the AEGIS_Dashboard receives `animate_approval`, THE AEGIS_Dashboard SHALL complete the Dual_Channel_Animation with a green vault-merge outcome and display "TRANSACTION AUTHORIZED".
6. THE Bank_Frontend SHALL emit `submit_shard_b` at least 20 ms before the HTTP POST so that Shard_B arrives at the Bank_Backend before the 50 ms window expires.

---

### Requirement 3: CSRF Attack Triggers AEGIS Block Animation

**User Story:** As a demo viewer, I want clicking "LAUNCH CSRF PAYLOAD" on the Hacker_C2 to produce a red blocked animation on the AEGIS_Dashboard and an "ACCESS DENIED" overlay on the Hacker_C2, so that the audience can see the attack being intercepted.

#### Acceptance Criteria

1. WHEN a user clicks the AEGIS-mode attack button on the Hacker_C2, THE Hacker_Hook SHALL send a POST request to `http://localhost:3002/api/transfer` (not port 5001).
2. WHEN the Bank_Backend receives a SCENARIO_3 POST without a matching Shard_B after the 50 ms window, THE Bank_Backend SHALL return HTTP 403 and emit `aegis_intervention` to Bank_Frontend clients and `payment_attack` to the AEGIS_Gateway.
3. WHEN the AEGIS_Gateway receives `payment_attack`, THE AEGIS_Gateway SHALL emit `animate_signal_start` followed by `animate_block` (after 3200 ms) to all connected AEGIS_Dashboard clients.
4. WHEN the AEGIS_Dashboard receives `animate_block`, THE AEGIS_Dashboard SHALL complete the Dual_Channel_Animation with a red vault-block outcome and display "CRITICAL INTERCEPT".
5. WHEN the Hacker_Hook receives an HTTP 403 response from the Bank_Backend, THE Hacker_C2 SHALL display the "ACCESS DENIED" failure overlay.
6. THE Hacker_Hook TARGET_PORT constant SHALL be set to 3002.

---

### Requirement 4: AEGIS Toggle on Bank Frontend

**User Story:** As a demo operator, I want a single "ACTIVATE AEGIS" / "DEACTIVATE AEGIS" toggle button on the Bank_Frontend, so that I can switch the protection mode during a live demo without opening a terminal.

#### Acceptance Criteria

1. THE Bank_Frontend SHALL display an "ACTIVATE AEGIS" button when the active scenario is SCENARIO_1 or SCENARIO_2.
2. THE Bank_Frontend SHALL display a "DEACTIVATE AEGIS" button when the active scenario is SCENARIO_3.
3. WHEN a user clicks "ACTIVATE AEGIS", THE Bank_Frontend SHALL emit `set_scenario` with `{ scenario: "SCENARIO_3" }` via Socket.io to the Bank_Backend.
4. WHEN a user clicks "DEACTIVATE AEGIS", THE Bank_Frontend SHALL emit `set_scenario` with `{ scenario: "SCENARIO_1" }` via Socket.io to the Bank_Backend.
5. WHEN the Bank_Backend emits `scenario_changed`, THE Bank_Frontend SHALL update the toggle button label to reflect the new active scenario within 500 ms.
6. WHEN the active scenario changes to SCENARIO_3, THE AEGIS_Dashboard status indicator SHALL display "AEGIS ONLINE".
7. WHEN the active scenario changes to SCENARIO_1, THE AEGIS_Dashboard status indicator SHALL display "AEGIS OFFLINE".

---

### Requirement 5: AEGIS Dashboard Scenario Status Indicator

**User Story:** As a demo viewer, I want the AEGIS_Dashboard to show whether AEGIS protection is currently active or inactive, so that the audience always knows the current system state.

#### Acceptance Criteria

1. THE AEGIS_Dashboard SHALL display a persistent status badge showing either "AEGIS ONLINE" (green) or "AEGIS OFFLINE" (red/grey).
2. WHEN the AEGIS_Gateway receives a `scenario_changed` event forwarded from the Bank_Backend with `scenario: "SCENARIO_3"`, THE AEGIS_Gateway SHALL emit a `aegis_status` event with `{ active: true }` to all connected AEGIS_Dashboard clients.
3. WHEN the AEGIS_Gateway receives a `scenario_changed` event with `scenario: "SCENARIO_1"` or `scenario: "SCENARIO_2"`, THE AEGIS_Gateway SHALL emit a `aegis_status` event with `{ active: false }` to all connected AEGIS_Dashboard clients.
4. WHEN the AEGIS_Dashboard receives `aegis_status` with `{ active: true }`, THE AEGIS_Dashboard SHALL update the status badge to "AEGIS ONLINE" within 500 ms.
5. WHEN the AEGIS_Dashboard receives `aegis_status` with `{ active: false }`, THE AEGIS_Dashboard SHALL update the status badge to "AEGIS OFFLINE" within 500 ms.
6. IF the AEGIS_Dashboard connects to the AEGIS_Gateway and no `aegis_status` event has been received yet, THEN THE AEGIS_Dashboard SHALL display "AEGIS OFFLINE" as the default state.

---

### Requirement 6: Hacker C2 Target Port Correction

**User Story:** As a demo operator, I want the Hacker_C2 to target the correct bank backend port, so that attack simulations actually reach the Bank_Backend and produce observable results.

#### Acceptance Criteria

1. THE Hacker_Hook SHALL use port 3002 as the TARGET_PORT for all attack simulations.
2. WHEN `runSimulation2` is executed (AEGIS active scenario), THE Hacker_Hook SHALL send the POST request to `http://localhost:3002/api/transfer`.
3. WHEN `runSimulation1` is executed (AEGIS offline scenario), THE Hacker_Hook SHALL send the POST request to `http://localhost:3002/api/transfer`.
4. THE Hacker_C2 target URL displayed in the UI SHALL reflect `http://localhost:3002/api/transfer`.
5. IF the environment variable `NEXT_PUBLIC_AEGIS_IP` is set, THEN THE Hacker_Hook SHALL use that IP with port 3002 (not port 5001).

---

### Requirement 7: Bank Backend Scenario Forwarding to AEGIS Gateway

**User Story:** As a demo operator, I want scenario changes on the Bank_Backend to be forwarded to the AEGIS_Gateway, so that the AEGIS_Dashboard status indicator stays in sync with the bank's active protection mode.

#### Acceptance Criteria

1. WHEN the Bank_Backend's active scenario changes (via `set_scenario` Socket.io event or `/admin/set-scenario` HTTP endpoint), THE Bank_Backend SHALL emit a `scenario_changed` Socket.io event to the AEGIS_Gateway containing `{ scenario, timestamp }`.
2. WHEN the AEGIS_Gateway receives `scenario_changed` from the Bank_Backend, THE AEGIS_Gateway SHALL derive and emit the corresponding `aegis_status` event to all AEGIS_Dashboard clients.
3. THE Bank_Backend SHALL forward `scenario_changed` to the AEGIS_Gateway within 100 ms of the scenario change occurring.

---

### Requirement 8: End-to-End Flow Integrity

**User Story:** As a demo operator, I want all three flows (legitimate payment, CSRF attack, AEGIS toggle) to complete without errors or stale state, so that the demo runs reliably in front of an audience.

#### Acceptance Criteria

1. WHEN a legitimate AEGIS payment completes, THE Bank_Frontend ledger SHALL show status "AEGIS_VERIFIED", THE AEGIS_Dashboard SHALL show a green animation outcome, and THE Hacker_C2 SHALL remain in its current state — all within 5 seconds of the button click.
2. WHEN a CSRF attack is launched from the Hacker_C2, THE Bank_Frontend ledger SHALL show status "BLOCKED_BY_AEGIS", THE AEGIS_Dashboard SHALL show a red animation outcome, and THE Hacker_C2 SHALL show the "ACCESS DENIED" overlay — all within 5 seconds of the button click.
3. WHEN the AEGIS toggle is activated, THE Bank_Frontend toggle button SHALL update its label, and THE AEGIS_Dashboard status badge SHALL update — both within 1 second of the button click.
4. IF a transaction is in progress and the scenario changes mid-flight, THEN THE Bank_Backend SHALL complete the in-flight transaction using the scenario that was active when the transaction started.
5. THE Bank_Backend SHALL NOT forward SCENARIO_1 or SCENARIO_2 transaction events to the AEGIS_Gateway, so that the AEGIS_Dashboard only shows AEGIS-relevant activity.

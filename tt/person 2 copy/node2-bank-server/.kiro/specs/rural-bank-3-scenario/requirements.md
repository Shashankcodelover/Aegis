# Requirements Document

## Introduction

This feature refactors the Person 2 bank frontend (`page.tsx`) to support a structured three-scenario CSRF security demonstration. The existing backend (`server.js`) already handles `SCENARIO_1`, `SCENARIO_2`, and `SCENARIO_3` logic with Socket.io event emission. The frontend must be refactored to expose five distinct simulation buttons across three scenario panels, adopt a "Rural Cooperative Trust" visual aesthetic, and render an AEGIS intervention overlay with a typewriter terminal sequence when a CSRF attack is blocked in Scenario 3. The result is a self-contained, presentation-ready demo that contrasts an innocent rural bank UI against a zero-trust AEGIS security engine.

---

## Glossary

- **Bank_UI**: The Next.js 15 frontend application running on port 4000.
- **Backend**: The Fastify server running on port 3002 that handles transfer logic and emits Socket.io events.
- **Scenario_Controller**: The Floating Action Button (FAB) component that allows the user to switch between SCENARIO_1, SCENARIO_2, and SCENARIO_3.
- **Scenario_Panel**: The contextual panel rendered within the Bank_UI that displays simulation buttons relevant to the active scenario.
- **Simulation_Button**: A button within a Scenario_Panel that triggers a specific demo action via HTTP POST and/or Socket.io emission.
- **Ledger**: The live transaction table displayed in the Bank_UI showing all processed and blocked transactions.
- **Ledger_Row**: A single animated row in the Ledger representing one transaction event.
- **AEGIS_Overlay**: The full-screen modal that appears when the Backend emits an `aegis_intervention` Socket.io event.
- **Terminal_Sequence**: The typewriter-animated list of diagnostic lines rendered inside the AEGIS_Overlay.
- **Shard_A**: The HTTP channel component of the dual-channel ZKP transaction used in SCENARIO_3.
- **Shard_B**: The WebRTC channel component of the dual-channel ZKP transaction, submitted via `submit_shard_b` Socket.io event.
- **AMTD_Port**: The rotating Adaptive Moving Target Defense port number emitted by the Backend every 3500ms via `amtd_telemetry`.
- **Rural_Mode**: The visual state of the Bank_UI when SCENARIO_1 or SCENARIO_2 is active — soft cream/green palette, warm typography.
- **AEGIS_Mode**: The visual state of the Bank_UI when SCENARIO_3 is active — dark background, Cyber Teal and Alert Red palette, JetBrains Mono typography.
- **Screen_Shake**: A brief horizontal shake animation applied to the root layout element when a `CRITICAL_THEFT_SUCCESS` ledger entry is received.
- **OWASP_API2_2023**: The OWASP API Security Top 10 2023 item "Broken Object Level Authorization / Broken Authentication", referenced in AEGIS diagnostics.

---

## Requirements

### Requirement 1: Scenario Panel with Five Simulation Buttons

**User Story:** As a demo presenter, I want each scenario to display its own set of clearly labelled simulation buttons, so that I can trigger the correct attack or legitimate transfer for each scenario without confusion.

#### Acceptance Criteria

1. WHEN `SCENARIO_1` is the active scenario, THE Scenario_Panel SHALL render exactly one Simulation_Button labelled "SIMULATE LEGITIMATE TRANSFER".
2. WHEN `SCENARIO_2` is the active scenario, THE Scenario_Panel SHALL render exactly two Simulation_Buttons: one labelled "SIMULATE LEGITIMATE TRANSFER" and one labelled "LAUNCH CSRF ATTACK (NO AEGIS)".
3. WHEN `SCENARIO_3` is the active scenario, THE Scenario_Panel SHALL render exactly two Simulation_Buttons: one labelled "SIMULATE LEGITIMATE TRANSFER (AEGIS)" and one labelled "LAUNCH CSRF ATTACK (AEGIS ACTIVE)".
4. WHEN the "SIMULATE LEGITIMATE TRANSFER" button is clicked in `SCENARIO_1` or `SCENARIO_2`, THE Bank_UI SHALL POST to `/api/transfer` with `amount: 5000`, `receiver: "Gramin Bank (Person 2)"`, and `isForged: false`.
5. WHEN the "LAUNCH CSRF ATTACK (NO AEGIS)" button is clicked in `SCENARIO_2`, THE Bank_UI SHALL POST to `/api/transfer` with `amount: 50000`, `receiver: "OFFSHORE_HACKER_WALLET_0x99"`, and `isForged: true`.
6. WHEN the "SIMULATE LEGITIMATE TRANSFER (AEGIS)" button is clicked in `SCENARIO_3`, THE Bank_UI SHALL emit `submit_shard_b` via Socket.io with a valid `transactionId`, `zkpSignature`, and the current `AMTD_Port` value, then POST to `/api/transfer` with `amount: 5000`, `isForged: false`.
7. WHEN the "LAUNCH CSRF ATTACK (AEGIS ACTIVE)" button is clicked in `SCENARIO_3`, THE Bank_UI SHALL POST to `/api/transfer` with `amount: 50000`, `isForged: true` WITHOUT emitting `submit_shard_b`, so that the Backend detects a missing Shard_B and triggers AEGIS intervention.
8. THE Bank_UI SHALL assign a unique `transactionId` of the format `txn_{timestamp}_{random4chars}` to each Simulation_Button click before initiating any network call.

---

### Requirement 2: Rural Cooperative Trust Aesthetic (Rural Mode)

**User Story:** As a demo presenter, I want the bank UI to look warm, trustworthy, and innocent in Scenarios 1 and 2, so that the contrast with the hacker's dark UI and the AEGIS intervention is visually dramatic.

#### Acceptance Criteria

1. WHILE `SCENARIO_1` or `SCENARIO_2` is active, THE Bank_UI SHALL render a background using a soft cream-to-green gradient from `#fdf9ed` to `#f0fdf4` to `#eff6ff`.
2. WHILE `SCENARIO_1` or `SCENARIO_2` is active, THE Bank_UI SHALL display the bank name "Gramin Cooperative Bank" in Harvest Green (`#166534`) using the Inter font family.
3. WHILE `SCENARIO_1` or `SCENARIO_2` is active, THE Bank_UI SHALL display the subtitle "Serving Rural Communities Since 1987 · Trusted · Secure · Local" beneath the bank name.
4. WHILE `SCENARIO_1` or `SCENARIO_2` is active, THE Bank_UI SHALL apply Harvest Green (`#166534`) as the primary brand colour for headers, borders, and active Simulation_Button backgrounds.
5. WHILE `SCENARIO_1` or `SCENARIO_2` is active, THE Bank_UI SHALL render the Ledger with a white background (`#ffffff`) and green-tinted header row (`#f0fdf4`).
6. WHILE `SCENARIO_2` is active, THE Bank_UI SHALL maintain the Rural_Mode aesthetic without any visual indication that a CSRF attack is possible, preserving the "innocent bank" narrative.

---

### Requirement 3: AEGIS Mode Visual Transformation (Scenario 3)

**User Story:** As a demo presenter, I want the bank UI to undergo a violent visual shift when Scenario 3 is activated, so that the audience immediately understands that a fundamentally different security layer is now active.

#### Acceptance Criteria

1. WHEN `SCENARIO_3` becomes the active scenario, THE Bank_UI SHALL transition the root background to near-black (`#030305`) within 700ms using a CSS transition.
2. WHEN `SCENARIO_3` becomes the active scenario, THE Bank_UI SHALL replace all Harvest Green brand elements with Cyber Teal (`#2dd4bf`) equivalents.
3. WHEN `SCENARIO_3` becomes the active scenario, THE Bank_UI SHALL switch the bank name typography to JetBrains Mono and display "AEGIS // GRAMIN COOPERATIVE BANK".
4. WHEN `SCENARIO_3` becomes the active scenario, THE Bank_UI SHALL display the subtitle "ZERO-TRUST PROTECTION ACTIVE — NIST SP 800-207" in Cyber Teal using JetBrains Mono.
5. WHEN `SCENARIO_3` becomes the active scenario, THE Bank_UI SHALL render the AEGIS Shard Monitor panel showing HTTP Shard A status, WebRTC Shard B status, and the current AMTD_Port value.
6. WHEN `SCENARIO_3` becomes the active scenario, THE Bank_UI SHALL render the AEGIS Event Stream terminal panel below the Ledger.
7. WHEN `SCENARIO_1` or `SCENARIO_2` becomes the active scenario after `SCENARIO_3` was active, THE Bank_UI SHALL transition back to Rural_Mode within 700ms.

---

### Requirement 4: Scenario Controller Floating Action Button

**User Story:** As a demo presenter, I want a floating button that expands to show all three scenario options, so that I can switch scenarios mid-presentation without navigating away from the bank UI.

#### Acceptance Criteria

1. THE Scenario_Controller SHALL render as a circular Floating Action Button fixed to the bottom-right corner of the viewport at `bottom: 24px`, `right: 24px`.
2. WHEN the Scenario_Controller FAB is clicked, THE Scenario_Controller SHALL expand to display a panel listing all three scenarios with their labels and descriptions.
3. WHEN a scenario option is selected from the Scenario_Controller panel, THE Bank_UI SHALL emit `set_scenario` via Socket.io with the selected scenario identifier.
4. WHEN a scenario option is selected from the Scenario_Controller panel, THE Scenario_Controller SHALL collapse the panel and update the FAB background colour to match the selected scenario's brand colour.
5. WHEN the Backend emits `scenario_changed`, THE Bank_UI SHALL update the active scenario state to match the received scenario identifier.
6. THE Scenario_Controller FAB SHALL display the currently active scenario's brand colour as its background at all times.
7. THE Scenario_Controller panel SHALL mark the currently active scenario with a checkmark indicator.

---

### Requirement 5: Live Bank Ledger

**User Story:** As a demo audience member, I want to see every transaction appear in a live ledger table as it happens, so that I can follow the flow of legitimate transfers, thefts, and AEGIS interventions in real time.

#### Acceptance Criteria

1. WHEN the Backend emits a `ledger_update` event, THE Ledger SHALL prepend a new Ledger_Row to the top of the table within one render cycle.
2. THE Ledger SHALL display five columns in order: Timestamp, Sender, Destination, Amount, Status.
3. WHEN a Ledger_Row has status `LEGITIMATE_SUCCESS`, THE Ledger_Row SHALL display a "✓ Approved" badge with green background (`#dcfce7`) and green text (`#166534`).
4. WHEN a Ledger_Row has status `CRITICAL_THEFT_SUCCESS`, THE Ledger_Row SHALL display a "⚠ THEFT PROCESSED" badge with red background (`#fee2e2`) and red text (`#dc2626`), and the row background SHALL be `#fef2f2`.
5. WHEN a Ledger_Row has status `AEGIS_VERIFIED`, THE Ledger_Row SHALL display a "⚡ AEGIS VERIFIED" badge with teal background (`#ccfbf1`) and teal text (`#0e7490`), optionally appending the delta milliseconds value.
6. WHEN a Ledger_Row has status `AEGIS_BLOCKED`, THE Ledger_Row SHALL display a "✗ AEGIS BLOCKED" badge with orange background (`#ffedd5`) and orange text (`#c2410c`).
7. WHEN a new Ledger_Row is added, THE Ledger_Row SHALL animate in using a framer-motion slide from `x: -16, opacity: 0` to `x: 0, opacity: 1` over 350ms.
8. WHEN a `CRITICAL_THEFT_SUCCESS` Ledger_Row is received, THE Bank_UI SHALL apply a Screen_Shake animation to the root layout element consisting of horizontal offsets `[-8, 8, -8, 8, -4, 4, 0]` over 500ms.
9. THE Ledger SHALL retain a maximum of 50 Ledger_Row entries, discarding the oldest when the limit is exceeded.
10. THE Ledger SHALL expose an `aria-live="polite"` region so that screen readers announce new transaction entries.

---

### Requirement 6: AEGIS Intervention Overlay

**User Story:** As a demo audience member, I want a dramatic full-screen overlay to appear when AEGIS blocks a CSRF attack, so that I can clearly see the security engine's diagnostic output and understand why the attack failed.

#### Acceptance Criteria

1. WHEN the Backend emits an `aegis_intervention` Socket.io event, THE AEGIS_Overlay SHALL render as a full-screen fixed overlay with a dark semi-transparent background (`rgba(3,3,5,0.93)`) and a 10px backdrop blur.
2. WHEN the AEGIS_Overlay is rendered, THE Bank_UI SHALL apply a blur filter to all content behind the overlay.
3. WHEN the AEGIS_Overlay is rendered, THE AEGIS_Overlay SHALL display a header containing a rotating Shield icon, the title "⚡ AEGIS INTERVENTION", and the subtitle "Zero-Trust Engine — CSRF Neutralized" in JetBrains Mono.
4. WHEN the AEGIS_Overlay is rendered, THE Terminal_Sequence SHALL print each line from the `aegis_intervention` event's `sequence` array one at a time with a 400ms interval between lines using a typewriter effect.
5. THE Terminal_Sequence SHALL print exactly 7 lines covering: incoming request detection, cookie validation, 50ms temporal window initiation, Shard_B not found, Sec-Fetch-Site cross-site warning, OWASP_API2_2023 diagnosis, and ACTION payload drop.
6. WHEN all Terminal_Sequence lines have been printed, THE AEGIS_Overlay SHALL display a "Funds Secured" confirmation panel with the `mitigation` text from the event payload.
7. WHEN all Terminal_Sequence lines have been printed, THE AEGIS_Overlay SHALL display a "DISMISS — RETURN TO BANK" button in JetBrains Mono.
8. WHEN the "DISMISS — RETURN TO BANK" button is clicked, THE AEGIS_Overlay SHALL close and THE Bank_UI SHALL remove the blur filter from the background content.
9. WHEN the AEGIS_Overlay opens, THE Bank_UI SHALL move keyboard focus to the AEGIS_Overlay container so that keyboard users can interact with it without tabbing through background content.
10. THE AEGIS_Overlay SHALL expose an `aria-live="assertive"` region so that screen readers immediately announce the intervention.

---

### Requirement 7: AEGIS Shard Monitor Panel

**User Story:** As a demo presenter, I want a live shard status panel visible in Scenario 3, so that the audience can see the dual-channel ZKP handshake in real time as HTTP and WebRTC shards arrive.

#### Acceptance Criteria

1. WHILE `SCENARIO_3` is active, THE Bank_UI SHALL display the AEGIS Shard Monitor panel in the left sidebar.
2. WHEN the Backend emits `shard_received` with `protocol: "HTTP"`, THE Bank_UI SHALL illuminate the HTTP Shard A indicator with Cyan (`#06b6d4`) and a glow effect within one render cycle.
3. WHEN the Backend emits `shard_received` with `protocol: "WebRTC"`, THE Bank_UI SHALL illuminate the WebRTC Shard B indicator with Emerald (`#10b981`) and a glow effect within one render cycle.
4. WHEN the Backend emits `transaction_success` or `aegis_intervention`, THE Bank_UI SHALL reset both shard indicators to their inactive state after 2500ms.
5. WHEN the Backend emits `amtd_telemetry`, THE Bank_UI SHALL update the displayed AMTD_Port value to the received `current_port` within one render cycle.
6. THE AEGIS Shard Monitor panel SHALL display three rows: "HTTP Shard A", "WebRTC Shard B", and "AMTD Port".

---

### Requirement 8: AEGIS Event Stream Terminal

**User Story:** As a demo presenter, I want a live terminal log panel visible in Scenario 3, so that the audience can read the AEGIS engine's real-time diagnostic messages as transactions are processed.

#### Acceptance Criteria

1. WHILE `SCENARIO_3` is active, THE Bank_UI SHALL display the AEGIS Event Stream terminal panel below the Ledger with a fixed height of 160px.
2. WHEN the Backend emits a `terminal_log` event, THE Bank_UI SHALL append the log entry to the AEGIS Event Stream terminal within one render cycle.
3. WHEN a `terminal_log` entry has `level: "threat"`, THE Bank_UI SHALL render the message text in Alert Red (`#ef4444`) with a "⚠" prefix.
4. WHEN a `terminal_log` entry has `level: "success"`, THE Bank_UI SHALL render the message text in Cyber Teal (`#2dd4bf`) with a "✓" prefix.
5. WHEN a `terminal_log` entry has any other level, THE Bank_UI SHALL render the message text in green (`#22c55e`).
6. THE Bank_UI SHALL retain a maximum of 200 terminal log entries, discarding the oldest when the limit is exceeded.
7. WHEN a new terminal log entry is appended, THE Bank_UI SHALL auto-scroll the AEGIS Event Stream terminal to the bottom.
8. THE AEGIS Event Stream terminal SHALL expose an `aria-live="polite"` region so that screen readers announce new log entries.

---

### Requirement 9: Transaction Statistics Counter

**User Story:** As a demo presenter, I want a live statistics panel showing counts of approved, stolen, and blocked transactions, so that the cumulative impact of each scenario is immediately visible to the audience.

#### Acceptance Criteria

1. THE Bank_UI SHALL display three statistic counters in the left sidebar: "Approved", "Theft Processed", and "AEGIS Blocked".
2. WHEN a `ledger_update` event is received with status `LEGITIMATE_SUCCESS` or `AEGIS_VERIFIED`, THE Bank_UI SHALL increment the "Approved" counter by 1.
3. WHEN a `ledger_update` event is received with status `CRITICAL_THEFT_SUCCESS`, THE Bank_UI SHALL increment the "Theft Processed" counter by 1.
4. WHEN a `ledger_update` event is received with status `AEGIS_BLOCKED`, THE Bank_UI SHALL increment the "AEGIS Blocked" counter by 1.
5. WHILE `SCENARIO_1` or `SCENARIO_2` is active, THE Bank_UI SHALL render the statistics counters with Rural_Mode colours (green, red, teal on light backgrounds).
6. WHILE `SCENARIO_3` is active, THE Bank_UI SHALL render the statistics counters with AEGIS_Mode colours (dark card backgrounds with matching accent colours).

---

### Requirement 10: Socket.io Connection Management

**User Story:** As a demo presenter, I want the bank UI to maintain a reliable Socket.io connection to the backend and display its status, so that I can confirm the demo is live before presenting.

#### Acceptance Criteria

1. WHEN the Bank_UI mounts, THE Bank_UI SHALL establish a Socket.io WebSocket connection to the Backend at `BANK_HOST` using the `websocket` transport.
2. WHEN the Socket.io connection is established, THE Bank_UI SHALL display a green pulsing indicator and the text "Secure Connection · Port 3002" in Rural_Mode or "AEGIS ENGINE ONLINE · PORT 3002" in AEGIS_Mode.
3. WHEN the Socket.io connection is lost, THE Bank_UI SHALL display a red pulsing indicator and the text "Reconnecting...".
4. WHEN the Bank_UI unmounts, THE Bank_UI SHALL call `socket.disconnect()` to clean up the Socket.io connection.
5. WHEN the Backend emits `scenario_changed` on initial connection, THE Bank_UI SHALL synchronise its active scenario state to match the Backend's current scenario.

---

### Requirement 11: Accessibility

**User Story:** As a demo presenter using assistive technology or keyboard navigation, I want the bank UI to be fully keyboard navigable and screen-reader friendly, so that the demo is inclusive and meets baseline accessibility standards.

#### Acceptance Criteria

1. THE Bank_UI SHALL assign a descriptive `aria-label` attribute to every Simulation_Button that includes the button's action and the scenario context (e.g., `aria-label="Simulate legitimate transfer of ₹5,000 in Scenario 1"`).
2. THE Scenario_Controller FAB SHALL have an `aria-label` of "Switch Demo Scenario" and `aria-expanded` set to `true` when the panel is open and `false` when closed.
3. THE Ledger SHALL be wrapped in a container with `aria-live="polite"` and `aria-label="Live transaction ledger"`.
4. THE AEGIS Event Stream terminal SHALL be wrapped in a container with `aria-live="polite"` and `aria-label="AEGIS event stream"`.
5. THE AEGIS_Overlay SHALL be implemented as a `role="dialog"` element with `aria-modal="true"` and `aria-label="AEGIS Intervention Alert"`.
6. WHEN the AEGIS_Overlay opens, THE Bank_UI SHALL move focus to the AEGIS_Overlay container element.
7. WHEN the AEGIS_Overlay closes, THE Bank_UI SHALL return focus to the Simulation_Button that triggered the action.
8. THE Bank_UI SHALL ensure all interactive elements are reachable and activatable via keyboard Tab and Enter/Space keys.

---

### Requirement 12: Parser and Serializer — Socket.io Event Payloads

**User Story:** As a developer, I want all Socket.io event payloads to be correctly serialised and deserialised between the Backend and Bank_UI, so that no data corruption occurs during the demo.

#### Acceptance Criteria

1. WHEN the Backend emits a `ledger_update` event, THE Bank_UI SHALL deserialise the payload into a `LedgerEntry` object with fields: `id`, `sender`, `receiver`, `amount`, `status`, `scenario`, `timestamp`, and optional `delta`.
2. WHEN the Backend emits an `aegis_intervention` event, THE Bank_UI SHALL deserialise the payload into an `AegisEvent` object with fields: `id`, `reason`, `mitigation`, `sequence` (string array), and `timestamp`.
3. WHEN the Bank_UI emits `submit_shard_b`, THE Bank_UI SHALL serialise the payload as a JSON object with fields: `transactionId` (string), `zkpSignature` (string), and `targetPort` (number).
4. WHEN the Bank_UI emits `set_scenario`, THE Bank_UI SHALL serialise the payload as a JSON object with field: `scenario` (one of `"SCENARIO_1"`, `"SCENARIO_2"`, `"SCENARIO_3"`).
5. FOR ALL valid `LedgerEntry` objects received from the Backend, THE Bank_UI SHALL render the `amount` field as a locale-formatted Indian Rupee string using `toLocaleString('en-IN')` prefixed with "₹".

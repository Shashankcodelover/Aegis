# Implementation Plan: rural-bank-3-scenario

## Overview

Complete rewrite of `frontend/app/page.tsx` and targeted update to `frontend/app/globals.css` to deliver the three-scenario CSRF security demonstration. The backend (`server.js`) is already complete and requires no changes.

## Tasks

- [x] 1. Update globals.css with required animation utilities
  - Add `.font-jetbrains` class using JetBrains Mono font stack
  - Add `@keyframes aegisFlash` and `.aegis-flash` utility class (teal glow pulse, 3 iterations)
  - Verify existing `theftShake` / `theft-shake` keyframes are present; add if missing
  - _Requirements: 2.2, 3.3_

- [x] 2. Rewrite page.tsx — types, constants, and helper utilities
  - Define `Scenario`, `LedgerStatus`, `LedgerEntry`, `AegisEvent`, `TerminalLog` TypeScript types
  - Define `SCENARIO_INFO` lookup map with label, color, bg, and desc per scenario
  - Implement `generateTransactionId()` helper: `txn_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
  - _Requirements: 1.8, 12.1, 12.3, 12.4_

  - [ ]* 2.1 Write property test for transaction ID uniqueness and format
    - **Property 1: Transaction ID uniqueness and format**
    - **Validates: Requirements 1.8**

- [x] 3. Implement presentational sub-components
  - [x] 3.1 Implement `StatsPanel` component
    - Three counter cards: Approved, Theft Processed, AEGIS Blocked
    - Rural Mode colours when `isAegisMode=false`; AEGIS Mode dark card colours when `isAegisMode=true`
    - _Requirements: 9.1, 9.5, 9.6_

  - [x] 3.2 Implement `ShardMonitor` component
    - Three rows: HTTP Shard A (cyan glow when active), WebRTC Shard B (emerald glow when active), AMTD Port (live number)
    - Only rendered when `scenario === 'SCENARIO_3'`
    - _Requirements: 3.5, 7.1, 7.2, 7.3, 7.6_

  - [x] 3.3 Implement `EventStream` component
    - Fixed height 160px terminal panel; `aria-live="polite"`, `aria-label="AEGIS event stream"`
    - Color/prefix mapping: `threat` → `#ef4444` + "⚠ ", `success` → `#2dd4bf` + "✓ ", other → `#22c55e`
    - Auto-scroll to bottom on new entry via `logEndRef`
    - Only rendered when `scenario === 'SCENARIO_3'`
    - _Requirements: 3.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8, 11.4_

  - [ ]* 3.4 Write property test for terminal log level color and prefix
    - **Property 7: Terminal log level color and prefix**
    - **Validates: Requirements 8.3, 8.4, 8.5**

  - [x] 3.5 Implement `LedgerRow` component
    - Framer-motion slide-in: `initial={{ opacity:0, x:-16 }}` → `animate={{ opacity:1, x:0 }}`, 350ms
    - Status badge mapping per design table (text, bg color, text color, row bg)
    - Amount rendered as `₹` + `Number(amount).toLocaleString('en-IN')`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 12.5_

  - [ ]* 3.6 Write property test for LedgerRow badge correctness
    - **Property 5: LedgerRow badge correctness for any entry**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6**

  - [ ]* 3.7 Write property test for amount locale formatting
    - **Property 12: Amount rendered as locale-formatted Indian Rupee string**
    - **Validates: Requirements 12.5**

  - [x] 3.8 Implement `LedgerTable` component
    - Wraps rows in `AnimatePresence`; `aria-live="polite"`, `aria-label="Live transaction ledger"`
    - Five columns: Timestamp, Sender, Destination, Amount, Status
    - Empty state: "Awaiting transactions..." placeholder
    - _Requirements: 5.1, 5.2, 5.10, 11.3_

  - [x] 3.9 Implement `ScenarioPanel` component
    - `SCENARIO_1`: 1 button — "SIMULATE LEGITIMATE TRANSFER"
    - `SCENARIO_2`: 2 buttons — "SIMULATE LEGITIMATE TRANSFER" + "LAUNCH CSRF ATTACK (NO AEGIS)"
    - `SCENARIO_3`: 2 buttons — "SIMULATE LEGITIMATE TRANSFER (AEGIS)" + "LAUNCH CSRF ATTACK (AEGIS ACTIVE)"
    - Each button has descriptive `aria-label` including action and scenario context
    - _Requirements: 1.1, 1.2, 1.3, 11.1_

  - [ ]* 3.10 Write property test for simulation button aria-labels
    - **Property 10: Simulation buttons always have descriptive aria-labels**
    - **Validates: Requirements 11.1**

  - [x] 3.11 Implement `ScenarioFAB` component
    - Fixed `bottom:24px right:24px`; FAB background = `SCENARIO_INFO[current].color`
    - Expand/collapse panel listing all three scenarios with checkmark on active
    - `aria-label="Switch Demo Scenario"`, `aria-expanded={open}`
    - Panel animation: `initial={{ opacity:0, y:12, scale:0.95 }}` → `animate={{ opacity:1, y:0, scale:1 }}`
    - _Requirements: 4.1, 4.2, 4.4, 4.6, 4.7, 11.2_

  - [ ]* 3.12 Write property test for FAB background color
    - **Property 2: FAB background color matches active scenario**
    - **Validates: Requirements 4.6**

  - [ ]* 3.13 Write property test for FAB checkmark on active scenario
    - **Property 3: FAB panel marks only the active scenario with a checkmark**
    - **Validates: Requirements 4.7**

  - [x] 3.14 Implement `AegisOverlay` component
    - `role="dialog"`, `aria-modal="true"`, `aria-label="AEGIS Intervention Alert"`
    - `aria-live="assertive"` on terminal sequence container
    - Typewriter: append one line from `data.sequence` every 400ms via `setInterval`
    - Show "Funds Secured" panel + "DISMISS — RETURN TO BANK" button after all lines printed
    - Full-screen fixed overlay: `rgba(3,3,5,0.93)` background, 10px backdrop blur
    - Spring animation: `initial={{ scale:0.8, y:50 }}`, stiffness 280, damping 24
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 11.5_

- [ ] 4. Checkpoint — verify all sub-components render without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `BankPage` root component with Socket.io and state
  - [x] 5.1 Set up all React state and Socket.io connection lifecycle
    - Initialise all state from `BankPageState` interface
    - Connect to `BANK_HOST` with `transports: ['websocket']` on mount; call `socket.disconnect()` on unmount
    - Display green pulsing indicator + "Secure Connection · Port 3002" (Rural) or "AEGIS ENGINE ONLINE · PORT 3002" (AEGIS) when connected; red + "Reconnecting..." when disconnected
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 5.2 Wire all inbound Socket.io event handlers
    - `scenario_changed` → `setScenario()`; sync on initial connection
    - `amtd_telemetry` → `setAmtdPort()`
    - `ledger_update` → prepend to ledger (max 50), update stats, trigger screen shake on `CRITICAL_THEFT_SUCCESS`
    - `shard_received` → `setHttpActive()` / `setWebrtcActive()` based on `protocol`
    - `transaction_success` → `resetShards()` after 2500ms
    - `aegis_intervention` → `setBlurred(true)`, `setAegisEvent()`, `resetShards()`
    - `terminal_log` → append to logs (max 200)
    - _Requirements: 4.5, 5.1, 5.8, 5.9, 7.2, 7.3, 7.4, 7.5, 8.2, 8.6, 9.2, 9.3, 9.4, 10.5_

  - [ ]* 5.3 Write property test for ledger prepend ordering
    - **Property 4: Ledger entries are always prepended (newest first)**
    - **Validates: Requirements 5.1**

  - [ ]* 5.4 Write property test for ledger maximum capacity
    - **Property 6: Ledger maximum capacity**
    - **Validates: Requirements 5.9**

  - [ ]* 5.5 Write property test for terminal log maximum capacity
    - **Property 8: Terminal log maximum capacity**
    - **Validates: Requirements 8.6**

  - [ ]* 5.6 Write property test for stats counter accuracy
    - **Property 9: Stats counters accurately reflect ledger event history**
    - **Validates: Requirements 9.2, 9.3, 9.4**

  - [ ]* 5.7 Write property test for LedgerEntry deserialization
    - **Property 11: LedgerEntry deserialization preserves all required fields**
    - **Validates: Requirements 12.1**

  - [x] 5.8 Implement all five simulation button handlers
    - `handleLegitTransfer`: POST `/api/transfer` with `amount:5000`, `receiver:"Gramin Bank (Person 2)"`, `isForged:false` (Scenarios 1 & 2)
    - `handleCsrfNoAegis`: POST `/api/transfer` with `amount:50000`, `receiver:"OFFSHORE_HACKER_WALLET_0x99"`, `isForged:true` (Scenario 2)
    - `handleLegitTransferAegis`: emit `submit_shard_b` with `transactionId`, `zkpSignature`, `targetPort:amtdPort`, then POST `/api/transfer` with `amount:5000`, `isForged:false` (Scenario 3)
    - `handleCsrfAegisActive`: POST `/api/transfer` with `amount:50000`, `isForged:true` WITHOUT emitting `submit_shard_b` (Scenario 3)
    - Each handler generates a unique `transactionId` before any network call; wrap fetch in `.catch(() => {})`
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 12.3_

  - [x] 5.9 Implement Rural Mode ↔ AEGIS Mode visual transitions
    - Root `motion.div` background transitions to `#030305` (AEGIS) or cream-green gradient (Rural) within 700ms via CSS `transition-colors duration-700`
    - Header, scenario banner, ledger, stats, and typography switch between green/cream (Rural) and teal/dark (AEGIS) palettes
    - Bank name switches to "AEGIS // GRAMIN COOPERATIVE BANK" in JetBrains Mono for Scenario 3; reverts to "Gramin Cooperative Bank" in Inter for Scenarios 1 & 2
    - Subtitle switches to "ZERO-TRUST PROTECTION ACTIVE — NIST SP 800-207" (AEGIS) or "Serving Rural Communities Since 1987 · Trusted · Secure · Local" (Rural)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.7_

  - [x] 5.10 Implement screen shake on theft and focus management for AegisOverlay
    - Apply framer-motion `animate={{ x: [-8,8,-8,8,-4,4,0] }}` over 500ms to root div on `CRITICAL_THEFT_SUCCESS`
    - On `AegisOverlay` open: move keyboard focus to overlay container element
    - On `AegisOverlay` close: return focus to the simulation button that triggered the action; fall back to `document.body` if ref is stale
    - _Requirements: 5.8, 6.9, 11.6, 11.7_

  - [x] 5.11 Wire `ScenarioFAB` onChange to emit `set_scenario` via Socket.io
    - `onChange` handler calls `socket.emit('set_scenario', { scenario })`
    - _Requirements: 4.3_

- [ ] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The backend (`server.js`) is complete — no backend changes are needed
- All Socket.io payloads must match the contracts defined in the design document (§ Socket.io Payload Contracts)
- Property tests use fast-check; install with `npm install --save-dev fast-check vitest @testing-library/react @testing-library/user-event`
- Each task references specific requirements for traceability

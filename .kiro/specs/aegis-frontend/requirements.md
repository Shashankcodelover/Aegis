# Requirements Document

## Introduction

AEGIS (Adaptive Entropy-Gated Integrity Shield) is a Zero-Knowledge Behavioral Proof CSRF Defense System. This document covers the frontend requirements for **Node 1 — The Defender**, implemented as a Next.js 15 application (`node-1-defender-app`).

The AEGIS frontend is a pure security system UI — not a payment product clone — that demonstrates how Dual-Channel Payload Sharding with ZK-Behavioral Proofs defeats Cross-Site Request Forgery attacks that bypass traditional CSRF tokens. The UI uses a Liquid Glass / glassmorphism aesthetic with Framer Motion threat visualizations.

The system collects hardware-level mouse/touch entropy, generates a Zero-Knowledge Behavioral Proof via SHA-256, dispatches a dual-channel payload (HTTP + WebRTC), and renders a live threat detection modal when an attack is detected.

Two additional engineering constraints apply across the entire application:

1. **RAM Efficiency** — The application must minimize memory footprint. No unnecessary npm packages, no heavy UI libraries beyond what is specified, no redundant state, and no memory leaks from uncleared event listeners or timers.
2. **Realistic Attack Simulation** — The CSRF Attack Simulator must present a credible, professional-grade simulation sequence (staged phases, real-looking attacker payloads, timestamped log entries) so the defense looks authoritative in a live demo.

---

## Glossary

- **AEGIS**: The frontend security middleware engine running in Node 1.
- **Defender_App**: The Next.js 15 application at `/node-1-defender-app` (Node 1).
- **Entropy_Collector**: The `useEntropyCollector` React hook that captures mouse/touch trajectory data.
- **Entropy_Buffer**: The in-memory array of `{x, y, t}` coordinate samples collected during the 500ms entropy window.
- **ZK_Proof_Generator**: The module that computes a SHA-256 hash of the serialized Entropy_Buffer using the Web Crypto API.
- **ZK_Proof**: The hex-encoded SHA-256 digest of the Entropy_Buffer, used as a Zero-Knowledge Behavioral Proof.
- **NULL_TRAJECTORY**: The sentinel ZK_Proof value produced when the Entropy_Buffer is empty or the entropy window was not satisfied.
- **UserActivation_Gate**: The L1 defense layer that checks `navigator.userActivation.isActive` before allowing a transaction.
- **Shard_Dispatcher**: The module that splits the transaction payload into Shard A (HTTP POST) and Shard B (WebRTC DataChannel).
- **Shard_A**: The HTTP POST portion of the dual-channel payload, containing `{ amount, recipient, zkProof }`.
- **Shard_B**: The WebRTC DataChannel portion of the dual-channel payload, containing `{ zkSignature }`.
- **RTCDataChannel**: The browser-native WebRTC data channel used to transmit Shard B out-of-band.
- **Threat_Modal**: The Framer Motion animated overlay rendered when AEGIS detects a CSRF attack or defense failure.
- **Trace_Log**: The structured log of defense layer outcomes attached to the Threat_Modal.
- **Attack_Simulator**: The UI control that triggers a synthetic CSRF attack for live demonstration purposes.
- **AEGIS_Dashboard**: The main security status screen showing all active defense layers and system health.
- **Transaction_Surface**: The protected action UI where the user initiates a transfer/transaction.
- **Defense_Layer**: One of the five AEGIS security mechanisms (L1–L5).
- **Liquid_Glass**: The glassmorphism visual design system used throughout the Defender_App.

---

## Requirements

### Requirement 1: Project Scaffold

**User Story:** As a developer, I want a properly scaffolded Next.js 15 project with all required dependencies, so that the AEGIS frontend can be built and run immediately with minimal RAM usage.

#### Acceptance Criteria

1. THE Defender_App SHALL be scaffolded as a Next.js 15 application using the App Router at the directory path `node-1-defender-app`.
2. THE Defender_App SHALL include Tailwind CSS v4 configured for the Liquid_Glass design system.
3. THE Defender_App SHALL include Framer Motion as a dependency for threat visualization animations.
4. THE Defender_App SHALL include TypeScript 5 with strict mode enabled.
5. WHEN the developer runs `npm run dev` inside `node-1-defender-app`, THE Defender_App SHALL start a development server accessible at `http://localhost:3000`.
6. THE Defender_App SHALL define a TypeScript interface `EntropyPoint` with fields `x: number`, `y: number`, and `t: number`.
7. THE Defender_App SHALL define a TypeScript interface `TransactionPayload` with fields `amount: number`, `recipient: string`, and `zkProof: string`.
8. THE Defender_App SHALL define a TypeScript interface `DefenseLayerStatus` with fields `layer: string`, `passed: boolean`, and `detail: string`.
9. THE Defender_App SHALL install ONLY the following npm dependencies and no others: `next`, `react`, `react-dom`, `framer-motion`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`. No additional UI component libraries, icon packs, animation libraries, HTTP clients, or utility packages SHALL be added.
10. THE Defender_App SHALL use Next.js `--turbo` dev mode to reduce memory overhead during development.
11. THE Entropy_Buffer SHALL be stored in a plain `useRef` (not `useState`) to avoid triggering React re-renders on every mouse event, keeping CPU and memory usage low.
12. ALL event listeners registered by any hook or component SHALL be removed in their cleanup functions to prevent memory leaks.

---

### Requirement 2: AEGIS Dashboard UI

**User Story:** As a security analyst, I want a real-time dashboard showing all active AEGIS defense layers and system status, so that I can monitor the security posture of the Defender node at a glance.

#### Acceptance Criteria

1. THE AEGIS_Dashboard SHALL display the current status (active/inactive) of all five Defense_Layers (L1 through L5) simultaneously.
2. THE AEGIS_Dashboard SHALL render each Defense_Layer status indicator using the Liquid_Glass visual style with glassmorphism card components.
3. WHEN all five Defense_Layers are active, THE AEGIS_Dashboard SHALL display a system-wide "PROTECTED" status indicator.
4. WHEN one or more Defense_Layers are inactive, THE AEGIS_Dashboard SHALL display a "DEGRADED" status indicator with the count of inactive layers.
5. THE AEGIS_Dashboard SHALL display the most recently computed ZK_Proof value (truncated to 16 hex characters) or "AWAITING ENTROPY" when no proof has been generated.
6. THE AEGIS_Dashboard SHALL display the current WebRTC connection state of the RTCDataChannel (connecting / open / closed / failed).
7. WHEN the RTCDataChannel state changes, THE AEGIS_Dashboard SHALL update the displayed connection state within 500ms.
8. THE AEGIS_Dashboard SHALL be fully responsive and render correctly on viewport widths from 375px to 1920px.

---

### Requirement 3: Transaction Surface UI

**User Story:** As a user, I want a clean transaction interface to initiate a protected transfer, so that I can trigger the full AEGIS defense pipeline in a realistic interaction.

#### Acceptance Criteria

1. THE Transaction_Surface SHALL render an amount input field accepting numeric values.
2. THE Transaction_Surface SHALL render a recipient input field accepting alphanumeric strings.
3. THE Transaction_Surface SHALL render a "PAY" submit button that initiates the AEGIS defense pipeline.
4. WHILE the AEGIS defense pipeline is processing, THE Transaction_Surface SHALL disable the "PAY" button and display a processing indicator.
5. WHEN the transaction is approved by both shards, THE Transaction_Surface SHALL display a success confirmation with the ZK_Proof value.
6. WHEN the transaction is blocked by any Defense_Layer, THE Transaction_Surface SHALL trigger the Threat_Modal.
7. THE Transaction_Surface SHALL render using the Liquid_Glass visual style consistent with the AEGIS_Dashboard.
8. IF the amount input contains a non-numeric value, THEN THE Transaction_Surface SHALL display an inline validation error and prevent submission.
9. IF the recipient input is empty, THEN THE Transaction_Surface SHALL display an inline validation error and prevent submission.

---

### Requirement 4: Entropy Collector

**User Story:** As a security engineer, I want the system to capture hardware-level mouse and touch trajectory data during a 500ms window, so that genuine human interaction can be distinguished from programmatic events.

#### Acceptance Criteria

1. THE Entropy_Collector SHALL be implemented as a React hook named `useEntropyCollector`.
2. WHEN the `useEntropyCollector` hook is mounted, THE Entropy_Collector SHALL attach event listeners for `mousemove` and `touchmove` events on the document.
3. WHEN a `mousemove` event fires, THE Entropy_Collector SHALL append an `EntropyPoint` `{x, y, t}` to the Entropy_Buffer, where `t` is `Date.now()`.
4. WHEN a `touchmove` event fires, THE Entropy_Collector SHALL append an `EntropyPoint` using the first touch contact's `clientX` and `clientY` coordinates.
5. THE Entropy_Collector SHALL maintain a rolling 500ms window, discarding `EntropyPoint` entries older than 500ms relative to the most recent entry.
6. WHEN the `useEntropyCollector` hook is unmounted, THE Entropy_Collector SHALL remove all attached event listeners.
7. THE Entropy_Collector SHALL expose a `getBuffer()` function that returns a snapshot of the current Entropy_Buffer as a readonly array of `EntropyPoint`.
8. THE Entropy_Collector SHALL expose a `clearBuffer()` function that empties the Entropy_Buffer.
9. FOR ALL Entropy_Buffer snapshots returned by `getBuffer()`, every `EntropyPoint` in the array SHALL have a `t` value within 500ms of the maximum `t` value in the array (rolling window invariant).

---

### Requirement 5: ZK-Behavioral Proof Generator

**User Story:** As a security engineer, I want the system to generate a cryptographic proof of genuine user behavior, so that replay attacks and forged requests can be detected and rejected.

#### Acceptance Criteria

1. THE ZK_Proof_Generator SHALL be implemented as an async function named `generateZKProof` accepting an array of `EntropyPoint`.
2. WHEN `generateZKProof` is called with a non-empty array of `EntropyPoint`, THE ZK_Proof_Generator SHALL serialize the array to a JSON string and compute its SHA-256 digest using the Web Crypto API (`crypto.subtle.digest`).
3. WHEN `generateZKProof` is called with a non-empty array of `EntropyPoint`, THE ZK_Proof_Generator SHALL return the SHA-256 digest as a lowercase hex-encoded string of exactly 64 characters.
4. WHEN `generateZKProof` is called with an empty array, THE ZK_Proof_Generator SHALL return the string `"NULL_TRAJECTORY"`.
5. IF the Web Crypto API is unavailable in the current browser context, THEN THE ZK_Proof_Generator SHALL return `"NULL_TRAJECTORY"` and log a warning to the browser console.
6. FOR ALL non-empty `EntropyPoint` arrays with identical contents and ordering, `generateZKProof` SHALL return the same hex string (determinism property).
7. FOR ALL pairs of non-empty `EntropyPoint` arrays that differ in at least one field of any element, `generateZKProof` SHALL return different hex strings with overwhelming probability (collision resistance).

---

### Requirement 6: navigator.userActivation Gate (L1)

**User Story:** As a security engineer, I want the system to verify genuine user activation before processing any transaction, so that automated scripts and hidden iframes cannot forge transactions.

#### Acceptance Criteria

1. THE UserActivation_Gate SHALL be implemented as a function named `checkUserActivation` returning a `DefenseLayerStatus`.
2. WHEN `checkUserActivation` is called and `navigator.userActivation.isActive` is `true`, THE UserActivation_Gate SHALL return a `DefenseLayerStatus` with `passed: true`, `layer: "L1"`, and a detail string indicating activation was confirmed.
3. WHEN `checkUserActivation` is called and `navigator.userActivation.isActive` is `false`, THE UserActivation_Gate SHALL return a `DefenseLayerStatus` with `passed: false`, `layer: "L1"`, and a detail string indicating no user activation was detected.
4. IF `navigator.userActivation` is undefined in the current browser context, THEN THE UserActivation_Gate SHALL return a `DefenseLayerStatus` with `passed: false`, `layer: "L1"`, and a detail string indicating the API is unsupported.
5. THE UserActivation_Gate SHALL be invoked as the first step in the AEGIS defense pipeline, before entropy collection or ZK_Proof generation.
6. WHEN the UserActivation_Gate returns `passed: false`, THE Defender_App SHALL halt the defense pipeline and trigger the Threat_Modal with the L1 failure recorded in the Trace_Log.

---

### Requirement 7: Dual-Channel Shard Dispatcher (L4)

**User Story:** As a security engineer, I want the transaction payload split across two independent transport channels, so that a cross-origin CSRF attacker who can forge the HTTP channel cannot also forge the out-of-band WebRTC channel.

#### Acceptance Criteria

1. THE Shard_Dispatcher SHALL be implemented as an async function named `dispatchShards` accepting a `TransactionPayload` and an `RTCDataChannel` reference.
2. WHEN `dispatchShards` is called, THE Shard_Dispatcher SHALL simultaneously initiate Shard_A via HTTP POST to `/api/transfer` and Shard_B via `RTCDataChannel.send()`.
3. THE Shard_Dispatcher SHALL include `{ amount, recipient, zkProof }` in the Shard_A HTTP POST body as JSON.
4. THE Shard_Dispatcher SHALL include `{ zkSignature: zkProof }` as the Shard_B WebRTC message payload.
5. WHEN both Shard_A and Shard_B are dispatched successfully, THE Shard_Dispatcher SHALL return a result object with `success: true`.
6. IF the RTCDataChannel is not in the `"open"` state when `dispatchShards` is called, THEN THE Shard_Dispatcher SHALL return a result object with `success: false` and a detail string indicating the WebRTC channel is unavailable.
7. IF the HTTP POST to `/api/transfer` returns a non-2xx status code, THEN THE Shard_Dispatcher SHALL return a result object with `success: false` and include the HTTP status code in the detail string.
8. WHEN `dispatchShards` returns `success: false`, THE Defender_App SHALL trigger the Threat_Modal with the L4 failure recorded in the Trace_Log.
9. THE Shard_Dispatcher SHALL establish the RTCDataChannel using the browser-native `RTCPeerConnection` API without any third-party WebRTC library.

---

### Requirement 8: Threat Detection Modal

**User Story:** As a security analyst, I want a visually prominent animated modal to appear when AEGIS detects an attack, so that the defense mechanism is clearly communicated during a live demonstration.

#### Acceptance Criteria

1. THE Threat_Modal SHALL be implemented as a React component using Framer Motion for all entrance and exit animations.
2. WHEN the Threat_Modal is triggered, THE Threat_Modal SHALL animate into view using a scale-and-fade entrance transition with a duration of 300ms or less.
3. THE Threat_Modal SHALL display the label of the Defense_Layer that triggered the block (e.g., "L1 — UserActivation Failure").
4. THE Threat_Modal SHALL display the full Trace_Log as a structured list showing each Defense_Layer's name, pass/fail status, and detail string.
5. THE Threat_Modal SHALL display the computed ZK_Proof value or `"NULL_TRAJECTORY"` if no proof was generated.
6. THE Threat_Modal SHALL render using the Liquid_Glass visual style with a red-tinted threat color scheme.
7. WHEN the user clicks a "DISMISS" button on the Threat_Modal, THE Threat_Modal SHALL animate out using a scale-and-fade exit transition and unmount from the DOM.
8. WHILE the Threat_Modal is visible, THE Transaction_Surface SHALL be non-interactive (pointer events disabled).
9. THE Threat_Modal SHALL be accessible, with a focus trap active while the modal is open and focus returned to the triggering element on dismiss.

---

### Requirement 9: CSRF Attack Simulator

**User Story:** As a demonstrator, I want a one-click "Simulate Attack" control that fires a realistic, staged CSRF attack sequence with professional-grade visuals, so that a live audience can clearly see exactly how the attack unfolds and how AEGIS terminates it.

#### Acceptance Criteria

1. THE Attack_Simulator SHALL render a clearly labeled "Simulate Attack" button on the AEGIS_Dashboard.
2. WHEN the "Simulate Attack" button is clicked, THE Attack_Simulator SHALL programmatically invoke the AEGIS defense pipeline with an empty Entropy_Buffer and `navigator.userActivation.isActive` forced to `false`.
3. WHEN the Attack_Simulator pipeline runs, THE ZK_Proof_Generator SHALL produce `"NULL_TRAJECTORY"` due to the empty Entropy_Buffer.
4. WHEN the Attack_Simulator pipeline runs, THE UserActivation_Gate SHALL return `passed: false` due to the forced inactive state.
5. WHEN the Attack_Simulator pipeline completes, THE Threat_Modal SHALL be triggered with a Trace_Log showing all Defense_Layer failures caused by the simulated attack.
6. THE Attack_Simulator SHALL visually distinguish the "Simulate Attack" button from the normal "PAY" button using a red/warning color scheme.
7. WHILE the Attack_Simulator pipeline is running, THE Attack_Simulator SHALL disable the "Simulate Attack" button to prevent concurrent simulations.
8. THE Attack_Simulator SHALL include a visible label or tooltip indicating this control is for demonstration purposes only.
9. THE Attack_Simulator SHALL display a multi-phase simulation sequence with the following staged steps, each shown as a timestamped log line that appears sequentially with a short delay between phases:
   - **Phase 1 — Recon** `[T+0ms]`: `"ATTACKER: Scanning target origin... found session cookie SameSite=None"`
   - **Phase 2 — Payload Forge** `[T+400ms]`: `"ATTACKER: Forging POST /api/transfer { amount: 99999, recipient: 'attacker_wallet' }"`
   - **Phase 3 — Inject** `[T+800ms]`: `"ATTACKER: Injecting via hidden <iframe> cross-origin..."`
   - **Phase 4 — AEGIS Intercept** `[T+1200ms]`: `"AEGIS L1: navigator.userActivation.isActive = false → BLOCKED"`
   - **Phase 5 — ZK Null** `[T+1400ms]`: `"AEGIS L3: ZK-Proof = NULL_TRAJECTORY → No entropy signature"`
   - **Phase 6 — Channel Fail** `[T+1600ms]`: `"AEGIS L4: WebRTC Shard B missing → Asymmetric transport failure"`
   - **Phase 7 — Terminate** `[T+1800ms]`: `"AEGIS: THREAT NEUTRALIZED — Attack vector destroyed 🛑"`
10. EACH phase log line SHALL appear with a typewriter-style reveal animation using CSS only (no additional JS animation library), keeping RAM usage minimal.
11. THE simulation log SHALL use a monospace font and a dark terminal aesthetic (black background, green text for attacker lines, red text for AEGIS block lines) to reinforce the cybersecurity context.
12. THE Threat_Modal triggered at the end of the simulation SHALL include the full simulation phase log embedded in the Trace_Log section.

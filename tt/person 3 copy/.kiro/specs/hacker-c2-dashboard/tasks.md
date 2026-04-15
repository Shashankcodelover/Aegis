# Implementation Plan: Hacker C2 Dashboard

## Overview

Rewrite `app/page.tsx` to implement the full Hacker C2 dashboard with two simulation buttons, all UI zones, and wire everything to the existing `useAgenticExploit` hook. The hook already handles both scenarios correctly — the primary work is the page rebuild.

## Tasks

- [ ] 1. Rewrite `app/page.tsx` — two-column layout with Command Header
  - [ ] 1.1 Scaffold the full-viewport layout: Command Header (10vh) + two-column main grid (90vh)
    - Radial gradient background, CRT scanline overlay via `main::after`, `overflow-hidden`
    - Command Header: pulsing Skull (Framer Motion scale loop), title `AGENTIC_SWARM_C2 // v4.2.0-BETA_BUILD`, scenario mode toggle button
    - Scenario toggle calls `setScenario()` from the hook; label updates to `LEGACY_VULNERABLE` / `AEGIS_SECURED`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2, 8.6, 8.7_

  - [ ] 1.2 Build the Attack Vector Configurator (left column, ~34vw)
    - Target IP/URL input (read-only, value from `state.targetUrl`), port input, payload type selector
    - Session token display: mock cookie string `session=eyJhbGci...` in phosphor green mono
    - MITRE tag badge: `T1189 Drive-by Compromise`
    - HTTP request preview panel: forged POST headers + JSON body, syntax-highlighted mono
    - `SIMULATE CSRF ATTACK (LEGACY)` button — crimson bg, green text; on click: `setScenario('LEGACY_VULNERABLE')` then `executePayload()`
    - `SIMULATE CSRF ATTACK (AEGIS ACTIVE)` button — black bg, red border, orange text; on click: `setScenario('AEGIS_SECURED')` then `executePayload()`
    - Both buttons disabled (with loading indicator) when `status !== 'IDLE'`
    - `aria-label` on each button per Requirement 10.5
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 10.1, 10.5_

  - [ ] 1.3 Build the Live Execution Terminal (right column, lower 62%)
    - Render `state.logs` with typewriter character-reveal per entry (use existing `TerminalLogEntry` or inline)
    - Color coding: INFO → green-400, WARNING → orange-500, CRITICAL → red-400, SUCCESS → green-300 with glow
    - Timestamp prefix per entry, blinking `_` cursor on most recent entry
    - Static header line when IDLE; placeholder `> AWAITING OPERATOR INPUT...` when logs empty
    - `aria-live="polite"` on the log container; `aria-live="assertive"` region for modal outcomes
    - Auto-scroll to bottom ref on `logs` change
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.3, 10.4_

- [ ] 2. Add Network Topology Mini-Map and HTTP Inspector panels
  - [ ] 2.1 Build the Network Topology Mini-Map (SVG, right column upper area or below header)
    - Three labeled SVG nodes: `NODE 3 (C2)`, `NODE 4 (AEGIS)`, `NODE 1 (VICTIM)`
    - Connection lines: neutral red at IDLE, animated orange pulse at INJECTING, green glow at SUCCESS_STOLEN, broken red at FAILED_BLURRED
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 2.2 Build the HTTP Request/Response Inspector panel
    - Static forged POST display at IDLE (method, URL, headers, JSON body)
    - Typewriter line-by-line reveal when status transitions to INJECTING
    - Response panel: `HTTP/1.1 200 OK` in green at SUCCESS_STOLEN; `HTTP/1.1 403 Forbidden` in red at FAILED_BLURRED
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Implement Framer Motion overlays and glitch animation
  - [ ] 3.1 Catastrophic Screen Blur Overlay (FAILED_BLURRED)
    - Framer Motion `backdrop-blur-3xl` + `bg-black/80` layer over main content, delayed 1.5s after glitch
    - Glitch sequence on main grid: `skewX [0, 5, -3, 0]` + `filter: invert(1)` for 1.5s via Framer Motion
    - `aria-hidden="true"` on blurred region; focus moves to Failure Modal
    - _Requirements: 4.4, 4.5, 9.1, 9.4, 10.6_

  - [ ] 3.2 Failure Modal (FAILED_BLURRED)
    - `AnimatePresence` + spring scale `0.8→1.0`, opacity `0→1` over 300ms
    - `ShieldOff` icon, `ACCESS FAILED` headline, `ZERO-TRUST INTERCEPTION` message in red with glowing border
    - `RECONNECT` button calls `resetAttack()`
    - _Requirements: 4.6, 4.7, 9.1, 9.2_

  - [ ] 3.3 Success Modal (SUCCESS_STOLEN)
    - `AnimatePresence` + `y: 20→0`, opacity `0→1` over 250ms
    - `FUNDS ACQUIRED: ₹50,000 REDIRECTED TO OFFSHORE ACCOUNT` in phosphor green, full-screen green glow for 1.5s
    - `RESET` button calls `resetAttack()`
    - _Requirements: 3.3, 3.5, 3.6, 9.1, 9.3_

- [ ] 4. Checkpoint — wire everything together and verify both simulation paths
  - Ensure all tests pass, ask the user if questions arise.
  - Verify LEGACY button → `setScenario('LEGACY_VULNERABLE')` → `executePayload()` → SUCCESS_STOLEN → Success Modal
  - Verify AEGIS button → `setScenario('AEGIS_SECURED')` → `executePayload()` → FAILED_BLURRED → glitch → Blur Overlay → Failure Modal
  - Verify `resetAttack()` from either modal returns to IDLE and clears logs
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3_

- [ ] 5. Accessibility and animation polish
  - [ ] 5.1 Keyboard navigation and ARIA
    - Confirm Tab order: scenario toggle → LEGACY button → AEGIS button → RECONNECT/RESET
    - Add `aria-live="assertive"` visually-hidden region updated on SUCCESS_STOLEN / FAILED_BLURRED
    - Verify `aria-label` on both simulation buttons
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 5.2 Reduced-motion guard
    - Wrap Framer Motion `animate` props with `useReducedMotion()` hook; skip animations when true
    - _Requirements: 8.10, 9.1_

- [ ] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The hook (`useAgenticExploit`) is already complete — do not rewrite it, only call `setScenario` before `executePayload`
- Both simulation buttons must call `setScenario` first, then `executePayload` — this is the critical wiring
- `TerminalLogEntry` component already exists at `app/TerminalLogEntry` and can be reused

# Requirements Document

## Introduction

The CSRF Attack Simulation Dashboard (Node 3: Hacker C2 Interface) is a production-ready Next.js 15 single-page application that serves as the attacker's command-and-control interface in a live 4-machine network security demonstration. The dashboard simulates Cross-Site Request Forgery (CSRF) attacks against the AEGIS API Gateway (Node 4), attempting to drain funds from a victim (Person 1) to an offshore account. It provides two distinct simulation scenarios — one against a legacy unprotected bank endpoint and one against the AEGIS Zero-Trust system — with visually distinct outcomes for each. The interface adopts a "BRUTALIST RED TEAM KINETIC" design language inspired by real penetration testing tools such as Metasploit, Burp Suite, and Cobalt Strike.

---

## Glossary

- **Dashboard**: The Next.js 15 SPA rendered at `app/page.tsx` that constitutes the entire C2 interface.
- **AEGIS**: The Zero-Trust API Gateway (Node 4) that intercepts and blocks unauthorized CSRF requests.
- **CSRF_Attack**: A simulated Cross-Site Request Forgery HTTP POST request forged by the Dashboard against the target bank endpoint.
- **Legacy_Scenario**: Simulation Case 1 — the bank has no CSRF protection and accepts the forged request.
- **AEGIS_Scenario**: Simulation Case 2 — AEGIS is active and returns HTTP 403 Forbidden, blocking the attack.
- **Attack_Vector_Configurator**: The left-column control panel containing target configuration fields and the two simulation trigger buttons.
- **Execution_Terminal**: The right-column live log panel that renders timestamped log entries with a typewriter effect.
- **Blur_Overlay**: A full-screen Framer Motion overlay applied when the AEGIS_Scenario fails, rendering the main content unreadable.
- **Failure_Modal**: The glowing red modal that appears after AEGIS blocks the attack.
- **Success_Modal**: The phosphor-green modal that appears after the Legacy_Scenario succeeds.
- **Command_Header**: The top navigation bar containing the pulsing Skull icon, application title, and scenario mode toggle.
- **AttackState**: The TypeScript interface (defined in `types/exploit.ts`) representing the full FSM state of an in-progress or completed attack.
- **LogEntry**: A single timestamped terminal log line with a severity type (`INFO`, `WARNING`, `CRITICAL`, `SUCCESS`).
- **ScenarioMode**: A TypeScript union type (`'LEGACY_VULNERABLE' | 'AEGIS_SECURED'`) indicating which simulation is active.
- **useAgenticExploit**: The existing React hook in `hooks/useAgenticExploit.ts` that drives attack FSM transitions and network calls.
- **CRT_Effect**: A CSS scanline overlay applied via `main::after` pseudo-element to simulate a cathode-ray tube monitor.
- **MITRE_Tag**: A UI badge displaying a MITRE ATT&CK technique identifier (e.g., T1189 Drive-by Compromise).

---

## Requirements

### Requirement 1: Weaponized Command Header

**User Story:** As a red team operator, I want a visually dominant top navigation bar, so that the application identity and current scenario mode are immediately clear at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL render a full-width Command_Header at the top of the viewport containing a pulsing Skull icon, the application title `AGENTIC_SWARM_C2 // v4.2.0-BETA_BUILD`, and a scenario mode toggle.
2. WHEN the page loads, THE Command_Header SHALL display the Skull icon with a continuous pulse animation using the `threat-pulse` keyframe defined in `globals.css`.
3. THE Command_Header SHALL render the application title in JetBrains Mono font at no less than 14px, in Neon Blood Orange (`#ea580c`) color.
4. THE Command_Header SHALL include a scenario mode toggle that switches the active `ScenarioMode` between `LEGACY_VULNERABLE` and `AEGIS_SECURED` without reloading the page.
5. WHEN the scenario mode toggle is activated, THE Dashboard SHALL update the `AttackState.scenario` field via the `setScenario` function exported by `useAgenticExploit`.
6. THE Command_Header SHALL use a background of absolute void black (`#000000`) with a `1px solid rgba(220, 38, 38, 0.4)` bottom border and no rounded corners.

---

### Requirement 2: Attack Vector Configurator Panel

**User Story:** As a red team operator, I want a brutalist left-column control panel with target configuration fields and simulation trigger buttons, so that I can configure and launch CSRF attack simulations.

#### Acceptance Criteria

1. THE Attack_Vector_Configurator SHALL occupy the left column of a two-column CSS grid layout and contain: a target IP/URL input field, a target port input field, a payload type selector, a session token display area, and the two simulation trigger buttons.
2. THE Attack_Vector_Configurator SHALL apply a glowing red inner `box-shadow` (`inset 0 0 20px rgba(220, 38, 38, 0.15)`) and a `1px solid rgba(220, 38, 38, 0.4)` border with no rounded corners (`rounded-none`).
3. THE Attack_Vector_Configurator SHALL display a MITRE_Tag badge labeled `T1189 Drive-by Compromise` in the panel header area.
4. THE Attack_Vector_Configurator SHALL render a button labeled `SIMULATE CSRF ATTACK (LEGACY)` styled with a Deep Crimson Red (`#dc2626`) background and phosphor green (`#22c55e`) text.
5. THE Attack_Vector_Configurator SHALL render a button labeled `SIMULATE CSRF ATTACK (AEGIS ACTIVE)` styled with a black background, a `1px solid #dc2626` border, and Neon Blood Orange (`#ea580c`) text.
6. WHEN either simulation button is clicked while an attack is already in progress (`AttackState.status` is not `IDLE`), THE Attack_Vector_Configurator SHALL disable both buttons and display a visual loading indicator.
7. THE Attack_Vector_Configurator SHALL display a session token visualization area showing a mock hijacked cookie string (e.g., `session=eyJhbGci...`) in JetBrains Mono font with Phosphor Green (`#22c55e`) color.
8. THE Attack_Vector_Configurator SHALL include an HTTP request preview panel showing the forged POST request headers and JSON body in a syntax-highlighted monospace display.

---

### Requirement 3: Legacy Scenario Simulation (Case 1)

**User Story:** As a red team operator, I want to simulate a CSRF attack against a legacy bank with no CSRF protection, so that I can demonstrate the vulnerability to an audience.

#### Acceptance Criteria

1. WHEN the `SIMULATE CSRF ATTACK (LEGACY)` button is clicked, THE Dashboard SHALL set `AttackState.scenario` to `LEGACY_VULNERABLE` and invoke `executePayload()` from `useAgenticExploit`.
2. WHEN `AttackState.scenario` is `LEGACY_VULNERABLE` and `executePayload()` is called, THE `useAgenticExploit` hook SHALL simulate a successful fund transfer without making a real network request to AEGIS, resolving to `ExploitStatus` of `SUCCESS_STOLEN`.
3. WHEN `AttackState.status` transitions to `SUCCESS_STOLEN`, THE Dashboard SHALL display the Success_Modal with the message `FUNDS ACQUIRED: ₹50,000 REDIRECTED TO OFFSHORE ACCOUNT` in Phosphor Green (`#22c55e`) text on a black background.
4. WHEN `AttackState.status` transitions to `SUCCESS_STOLEN`, THE Execution_Terminal SHALL render a final log entry of type `SUCCESS` with the message `> TARGET COMPROMISED. FUNDS TRANSFERRED SUCCESSFULLY.`
5. WHEN `AttackState.status` transitions to `SUCCESS_STOLEN`, THE Dashboard SHALL apply a full-screen green phosphor glow animation to the main content area for 1.5 seconds.
6. THE Success_Modal SHALL include a `RESET` button that, when clicked, calls `resetAttack()` and returns `AttackState.status` to `IDLE`, dismissing the modal.

---

### Requirement 4: AEGIS Scenario Simulation (Case 2)

**User Story:** As a red team operator, I want to simulate a CSRF attack against the AEGIS Zero-Trust system, so that I can demonstrate how AEGIS blocks the attack.

#### Acceptance Criteria

1. WHEN the `SIMULATE CSRF ATTACK (AEGIS ACTIVE)` button is clicked, THE Dashboard SHALL set `AttackState.scenario` to `AEGIS_SECURED` and invoke `executePayload()` from `useAgenticExploit`.
2. WHEN `AttackState.scenario` is `AEGIS_SECURED` and `executePayload()` is called, THE `useAgenticExploit` hook SHALL send a real `fetch()` POST request with `credentials: 'include'` to the configured AEGIS target URL.
3. WHEN the AEGIS target URL returns HTTP 403 Forbidden, THE `useAgenticExploit` hook SHALL transition `AttackState.status` to `FAILED_BLURRED`.
4. WHEN `AttackState.status` transitions to `FAILED_BLURRED`, THE Dashboard SHALL trigger a catastrophic failure animation: a `skewX(5deg)` transform combined with a CSS `filter: invert(1)` flash applied to the main content grid for 1.5 seconds via Framer Motion.
5. WHEN the catastrophic failure animation completes, THE Dashboard SHALL apply the Blur_Overlay — a Framer Motion-controlled `backdrop-blur-3xl` layer covering the entire main content grid, rendering the Attack_Vector_Configurator and Execution_Terminal visually unreadable.
6. WHEN `AttackState.status` is `FAILED_BLURRED`, THE Dashboard SHALL display the Failure_Modal with the message `ACCESS FAILED: ZERO-TRUST INTERCEPTION. CONNECTION SEVERED BY AEGIS SECURITY SYSTEM.` in Glitch Red (`#ef4444`) text with a glowing red border (`box-shadow: 0 0 40px rgba(220, 38, 38, 0.8)`).
7. THE Failure_Modal SHALL include a `RECONNECT` button that, when clicked, calls `resetAttack()`, dismisses the Blur_Overlay, and returns `AttackState.status` to `IDLE`.
8. WHEN `AttackState.status` is `FAILED_BLURRED`, THE Execution_Terminal SHALL render a final log entry of type `CRITICAL` with the message `> FATAL EXPLOIT FAILURE. ACCESS DENIED BY AEGIS.`

---

### Requirement 5: Live Execution Terminal

**User Story:** As a red team operator, I want a real-time terminal log panel, so that I can observe each step of the attack chain as it executes.

#### Acceptance Criteria

1. THE Execution_Terminal SHALL occupy the right column of the two-column CSS grid layout and render all entries from `AttackState.logs` in reverse-chronological order (newest at top).
2. WHEN a new `LogEntry` is added to `AttackState.logs`, THE Execution_Terminal SHALL render it with a typewriter character-reveal animation completing within 300ms.
3. THE Execution_Terminal SHALL render each `LogEntry` with a timestamp prefix in JetBrains Mono font at 11px, colored `rgba(100, 116, 139, 0.8)` (slate-500).
4. THE Execution_Terminal SHALL apply color coding per `LogEntry.type`: `INFO` → Phosphor Green (`#22c55e`), `WARNING` → Neon Blood Orange (`#ea580c`), `CRITICAL` → Glitch Red (`#ef4444`), `SUCCESS` → Phosphor Green (`#22c55e`) with a glow effect.
5. THE Execution_Terminal SHALL display a blinking cursor (`_`) at the end of the most recent log entry using the `cursor-blink` keyframe defined in `globals.css`.
6. THE Execution_Terminal SHALL have a fixed height with `overflow-y: auto` and auto-scroll to the newest entry when a new `LogEntry` is appended.
7. THE Execution_Terminal SHALL render a static header line `[AGENTIC_SWARM_C2] EXPLOIT CHAIN INITIALIZED` in Phosphor Green when `AttackState.status` is `IDLE`.
8. WHEN `AttackState.logs` is empty and `AttackState.status` is `IDLE`, THE Execution_Terminal SHALL display the placeholder text `> AWAITING OPERATOR INPUT...` with the blinking cursor.

---

### Requirement 6: Network Topology Mini-Map

**User Story:** As a red team operator, I want a visual network topology diagram, so that the audience can see the attack path between nodes during the demonstration.

#### Acceptance Criteria

1. THE Dashboard SHALL render a Network Topology Mini-Map panel showing at minimum three labeled nodes: `NODE 3 (C2)`, `NODE 4 (AEGIS)`, and `NODE 1 (VICTIM)`.
2. WHEN `AttackState.status` is `IDLE`, THE Network Topology Mini-Map SHALL render connection lines between nodes in a neutral color (`rgba(220, 38, 38, 0.3)`).
3. WHEN `AttackState.status` is `INJECTING`, THE Network Topology Mini-Map SHALL animate the connection line from `NODE 3 (C2)` to `NODE 4 (AEGIS)` with a traveling pulse in Neon Blood Orange (`#ea580c`).
4. WHEN `AttackState.status` is `SUCCESS_STOLEN`, THE Network Topology Mini-Map SHALL render the connection line from `NODE 3 (C2)` to `NODE 1 (VICTIM)` in Phosphor Green (`#22c55e`) with a glow effect.
5. WHEN `AttackState.status` is `FAILED_BLURRED`, THE Network Topology Mini-Map SHALL render the connection line from `NODE 3 (C2)` to `NODE 4 (AEGIS)` in Glitch Red (`#ef4444`) with a severed/broken line animation.

---

### Requirement 7: HTTP Request/Response Inspector

**User Story:** As a red team operator, I want an HTTP request and response inspector panel, so that the audience can see the exact forged request and the server's response during the demonstration.

#### Acceptance Criteria

1. THE Dashboard SHALL render an HTTP Request/Response Inspector panel that displays the forged POST request method, URL, headers (`Content-Type`, `Cookie`), and JSON body.
2. WHEN `AttackState.status` is `IDLE`, THE HTTP Request/Response Inspector SHALL display the pre-configured forged request in a static, syntax-highlighted monospace view.
3. WHEN `AttackState.status` transitions to `INJECTING`, THE HTTP Request/Response Inspector SHALL animate the request fields appearing line-by-line with a typewriter effect.
4. WHEN `AttackState.status` is `SUCCESS_STOLEN`, THE HTTP Request/Response Inspector SHALL display a response panel showing `HTTP/1.1 200 OK` with a mock success response body in Phosphor Green.
5. WHEN `AttackState.status` is `FAILED_BLURRED`, THE HTTP Request/Response Inspector SHALL display a response panel showing `HTTP/1.1 403 Forbidden` with the AEGIS rejection body in Glitch Red.

---

### Requirement 8: Design System and Visual Fidelity

**User Story:** As a red team operator, I want the entire dashboard to conform to the "BRUTALIST RED TEAM KINETIC" design language, so that the interface is visually intimidating and authentic to real penetration testing tools.

#### Acceptance Criteria

1. THE Dashboard SHALL use `#000000` (absolute void black) as the root background color for all surfaces.
2. THE Dashboard SHALL apply a dark crimson radial gradient from the viewport center as a background layer beneath all panels.
3. THE Dashboard SHALL use Neon Blood Orange (`#ea580c`) and Deep Crimson Red (`#dc2626`) as the only primary accent colors for interactive elements and borders.
4. THE Dashboard SHALL use Phosphor Green (`#22c55e`) exclusively for success states, terminal log text, and positive indicators.
5. THE Dashboard SHALL use Glitch Red (`#ef4444`) exclusively for error states, critical log entries, and failure indicators.
6. THE Dashboard SHALL apply `rounded-none` or `rounded-sm` (maximum 2px) to all UI panels, cards, and buttons — no soft rounded corners.
7. THE Dashboard SHALL render the CRT_Effect scanline overlay via the `main::after` pseudo-element defined in `globals.css` at all times.
8. THE Dashboard SHALL use JetBrains Mono as the primary font for all terminal text, log entries, data values, and monospace displays.
9. THE Dashboard SHALL use Inter as the secondary font for panel labels, headers, and non-terminal UI text.
10. WHERE the user's operating system has `prefers-reduced-motion: reduce` set, THE Dashboard SHALL disable all Framer Motion animations and CSS keyframe animations per the media query defined in `globals.css`.

---

### Requirement 9: Framer Motion Animations

**User Story:** As a red team operator, I want kinetic animations throughout the interface, so that the dashboard feels alive and creates dramatic impact during the live demonstration.

#### Acceptance Criteria

1. THE Dashboard SHALL use Framer Motion `motion` components for all state-transition animations including the Blur_Overlay, Failure_Modal entrance, and Success_Modal entrance.
2. WHEN the Failure_Modal enters the viewport, THE Dashboard SHALL animate it with a `scale` from `0.8` to `1.0` and `opacity` from `0` to `1` over 300ms using a `spring` easing.
3. WHEN the Success_Modal enters the viewport, THE Dashboard SHALL animate it with a `y` translate from `20px` to `0px` and `opacity` from `0` to `1` over 250ms.
4. WHEN `AttackState.status` transitions to `FAILED_BLURRED`, THE Dashboard SHALL apply a Framer Motion `animate` sequence: first `skewX: 5` with `filter: invert(1)` for 750ms, then `skewX: -3` for 250ms, then `skewX: 0` with `filter: invert(0)` for 500ms.
5. THE Command_Header Skull icon SHALL use a Framer Motion `animate` loop with `scale` oscillating between `1.0` and `1.15` on a 1.5-second repeat to create a pulsing heartbeat effect.
6. WHEN `AttackState.status` transitions from `IDLE` to `ENUMERATING`, THE Attack_Vector_Configurator border SHALL animate from `rgba(220, 38, 38, 0.4)` to `rgba(234, 88, 12, 0.9)` over 400ms via Framer Motion `animate`.

---

### Requirement 10: Accessibility and Keyboard Navigation

**User Story:** As a demonstration operator, I want the dashboard to support keyboard navigation and screen reader announcements, so that the simulation can be operated without a mouse during a live presentation.

#### Acceptance Criteria

1. THE Dashboard SHALL ensure all interactive elements (buttons, toggles, inputs) are reachable via `Tab` key navigation in a logical document order.
2. THE Dashboard SHALL apply a visible `outline: 1px solid #dc2626` focus ring to all focused interactive elements, as defined in the `*:focus-visible` rule in `globals.css`.
3. THE Dashboard SHALL include `aria-live="polite"` regions on the Execution_Terminal so that screen readers announce new log entries as they are appended.
4. WHEN `AttackState.status` transitions to `SUCCESS_STOLEN` or `FAILED_BLURRED`, THE Dashboard SHALL update an `aria-live="assertive"` region with the modal message text so screen readers announce the outcome immediately.
5. THE two simulation buttons SHALL have `aria-label` attributes that describe their function: `aria-label="Simulate CSRF attack against legacy bank (no CSRF protection)"` and `aria-label="Simulate CSRF attack against AEGIS Zero-Trust system"`.
6. THE Blur_Overlay SHALL set `aria-hidden="true"` on the blurred main content region and move focus to the Failure_Modal when it appears, so keyboard users are not trapped behind the overlay.

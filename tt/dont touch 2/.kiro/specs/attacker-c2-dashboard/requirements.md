# Requirements Document

## Introduction

This feature is a Single-Page Application (SPA) for "Node 3: Attacker C2 Dashboard" — a brutalist, hacker-aesthetic command-and-control interface used to demonstrate a Cross-Site Request Forgery (CSRF) attack in an educational security context.

The dashboard allows a simulated attacker to select between two scenarios (LEGACY and AEGIS), configure a target URL, and launch a forged CSRF payload. The outcome depends on the active scenario: a LEGACY target is compromised, while an AEGIS-protected target intercepts the attack and triggers a dramatic failure sequence.

The application is built with Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, and lucide-react. It replaces the existing multi-tab layout with a focused, single-purpose CSRF demonstration UI.

---

## Glossary

- **Dashboard**: The full-screen SPA rendered at the root route (`/`).
- **Scenario**: The active attack mode, either `LEGACY` (unprotected target) or `AEGIS` (zero-trust protected target).
- **Status**: The current state of the attack lifecycle: `IDLE`, `INJECTING`, `SUCCESS`, or `FAILED_BLURRED`.
- **CSRF Payload**: A forged HTTP POST request sent with `credentials: 'include'` to simulate a browser attaching the victim's session cookies.
- **Target URL**: The endpoint the CSRF payload is sent to, prefilled as `http://<AEGIS_IP>:3002/gateway/shard-a`.
- **AEGIS_IP**: The IP address of the target server, sourced from the `NEXT_PUBLIC_AEGIS_IP` environment variable, defaulting to `localhost`.
- **AMTD Radar**: A fake Adaptive Moving Target Defense port scanner widget that cycles random 5-digit port numbers rapidly.
- **Terminal**: A scrolling console panel that displays sequential log messages with typewriter-style animation.
- **Glitch Sequence**: A Framer Motion animation applied to the main layout on `FAILED_BLURRED` status — rapid `skewX` transforms and `invert` CSS filters for approximately 1 second.
- **Failure Modal**: A large, absolute-positioned overlay modal displayed when status is `FAILED_BLURRED`, containing a `ShieldOff` icon and the interception message.
- **CRT Overlay**: A CSS `::after` pseudo-element on `<main>` that renders a subtle `repeating-linear-gradient` to simulate scanlines on a CRT monitor.
- **Brutalist Design System**: The visual language of the UI — Void Black (`#000000`) background, Crimson Red (`#dc2626`) borders/accents, Phosphor Green (`#22c55e`) and Glitch Red (`#ef4444`) for terminal text, `rounded-none` corners, and monospace fonts everywhere.

---

## Requirements

### Requirement 1: Page Layout and Grid Structure

**User Story:** As a presenter, I want the dashboard to fill the entire viewport in a structured grid, so that all UI panels are visible simultaneously without scrolling.

#### Acceptance Criteria

1. THE Dashboard SHALL render as a `100vh` full-screen layout with no overflow scrolling on the outer container.
2. THE Dashboard SHALL be divided into three regions: a Header bar, a Left Panel (Controls), and a Right Panel (split into Top-Right Radar and Bottom-Right Terminal).
3. THE Dashboard SHALL apply the Brutalist Design System: Void Black (`#000000`) background, `rounded-none` on all interactive elements, and monospace fonts on all text.
4. THE Dashboard SHALL render a CRT Overlay via a CSS `::after` pseudo-element on `<main>` using `repeating-linear-gradient` to simulate scanlines.

---

### Requirement 2: Header

**User Story:** As a presenter, I want a header that identifies the tool and lets me switch scenarios, so that the audience can see the active attack mode at a glance.

#### Acceptance Criteria

1. THE Header SHALL display a `Skull` icon (from lucide-react) and the title text `AGENTIC_SWARM_C2`.
2. THE Header SHALL contain a toggle switch that changes the Scenario state between `LEGACY` and `AEGIS`.
3. WHEN the Scenario toggle is switched, THE Dashboard SHALL update the Scenario state immediately without resetting the Status.
4. THE Header SHALL display the currently active Scenario label (`LEGACY` or `AEGIS`) adjacent to the toggle switch.

---

### Requirement 3: Left Panel — Attack Controls

**User Story:** As a presenter, I want a controls panel with a target URL, a credential indicator, and a launch button, so that I can configure and trigger the CSRF attack.

#### Acceptance Criteria

1. THE Left_Panel SHALL display a text input prefilled with `http://<AEGIS_IP>:3002/gateway/shard-a`, where `<AEGIS_IP>` is resolved from the `NEXT_PUBLIC_AEGIS_IP` environment variable (defaulting to `localhost`).
2. THE Left_Panel SHALL display a locked toggle indicator labelled "Include Ambient Credentials (Cookies)" that is permanently set to `ON` and cannot be toggled by the user.
3. THE Left_Panel SHALL display a button labelled "LAUNCH CSRF PAYLOAD" styled with a large Crimson Red (`#dc2626`) background and bold uppercase monospace text.
4. WHEN Status is `IDLE`, THE Launch_Button SHALL be enabled and clickable.
5. WHEN Status is `INJECTING`, THE Launch_Button SHALL be disabled and visually indicate a loading/in-progress state.
6. WHEN Status is `SUCCESS` or `FAILED_BLURRED`, THE Launch_Button SHALL be disabled.

---

### Requirement 4: Top-Right Panel — AMTD Radar

**User Story:** As a presenter, I want a fake port scanner widget, so that the UI looks like an active threat tool scanning for open ports.

#### Acceptance Criteria

1. THE AMTD_Radar SHALL display a random 5-digit port number that cycles rapidly (updating at least every 200ms).
2. WHEN Status is `IDLE` or `SUCCESS` or `FAILED_BLURRED`, THE AMTD_Radar SHALL display the static text `SCANNING...` instead of cycling numbers.
3. WHEN Status is `INJECTING`, THE AMTD_Radar SHALL begin cycling random 5-digit port numbers rapidly.
4. THE AMTD_Radar SHALL display the port number in Phosphor Green (`#22c55e`) monospace font.

---

### Requirement 5: Bottom-Right Panel — Terminal Console

**User Story:** As a presenter, I want a scrolling terminal that shows attack log messages with a typewriter animation, so that the audience can follow the attack sequence in real time.

#### Acceptance Criteria

1. THE Terminal SHALL display log messages sequentially, with each new message appearing via a Framer Motion typewriter or fade-in animation.
2. THE Terminal SHALL auto-scroll to the latest log entry whenever a new message is appended.
3. WHEN Status is `IDLE`, THE Terminal SHALL display a static waiting prompt (e.g., `[AWAITING PAYLOAD EXECUTION]`).
4. THE Terminal SHALL render `INFO`-type log messages in Phosphor Green (`#22c55e`).
5. THE Terminal SHALL render `SUCCESS`-type log messages in Phosphor Green (`#22c55e`) with bold styling.
6. THE Terminal SHALL render `CRITICAL`-type log messages in Glitch Red (`#ef4444`).
7. THE Terminal SHALL use a monospace font for all log text.

---

### Requirement 6: Attack State Machine

**User Story:** As a developer, I want a React hook that manages the attack lifecycle, so that the UI reflects the correct state at each phase of the CSRF demonstration.

#### Acceptance Criteria

1. THE useC2Attack_Hook SHALL expose a `status` field typed as `'IDLE' | 'INJECTING' | 'SUCCESS' | 'FAILED_BLURRED'`.
2. THE useC2Attack_Hook SHALL expose a `scenario` field typed as `'LEGACY' | 'AEGIS'`.
3. THE useC2Attack_Hook SHALL expose a `logs` array of log entries, each with `id`, `message`, `type`, and `timestamp` fields.
4. THE useC2Attack_Hook SHALL expose a `targetUrl` string field.
5. THE useC2Attack_Hook SHALL expose a `launchPayload` function that initiates the attack sequence.
6. THE useC2Attack_Hook SHALL expose a `setScenario` function that updates the Scenario without resetting Status.
7. THE useC2Attack_Hook SHALL expose a `reset` function that resets Status to `IDLE` and clears the logs array.

---

### Requirement 7: CSRF Payload Execution

**User Story:** As a presenter, I want the launch button to fire a real fetch request with session cookies included, so that the CSRF attack is demonstrated with actual browser credential-forwarding behaviour.

#### Acceptance Criteria

1. WHEN `launchPayload` is called, THE useC2Attack_Hook SHALL set Status to `INJECTING` and append the log message `"Forging CSRF request..."` of type `INFO`.
2. WHEN Status transitions to `INJECTING`, THE useC2Attack_Hook SHALL append the log message `"Hijacking session cookies..."` of type `WARNING`.
3. THE useC2Attack_Hook SHALL execute a `fetch` POST request to the Target URL with `credentials: 'include'` and a JSON body of `{ amount: 99999, isForged: true, scenario: <current_scenario> }`.
4. THE useC2Attack_Hook SHALL set the `Content-Type` request header to `application/json`.

---

### Requirement 8: LEGACY Scenario — Success Outcome

**User Story:** As a presenter, I want the LEGACY scenario to show a successful attack, so that the audience understands what happens when CSRF protection is absent.

#### Acceptance Criteria

1. WHEN the fetch response is successful (HTTP 2xx) and Scenario is `LEGACY`, THE useC2Attack_Hook SHALL set Status to `SUCCESS`.
2. WHEN Status transitions to `SUCCESS`, THE Terminal SHALL display the message `"TARGET COMPROMISED. FUNDS TRANSFERRED."` in Phosphor Green (`#22c55e`) bold text.

---

### Requirement 9: AEGIS Scenario — Interception Outcome

**User Story:** As a presenter, I want the AEGIS scenario to show a blocked attack with a dramatic failure sequence, so that the audience understands how zero-trust defences stop CSRF.

#### Acceptance Criteria

1. WHEN the fetch response is HTTP 403 and Scenario is `AEGIS`, THE useC2Attack_Hook SHALL set Status to `FAILED_BLURRED`.
2. WHEN Status transitions to `FAILED_BLURRED`, THE Terminal SHALL append the log message `"ACCESS DENIED: ZERO-TRUST INTERCEPTION BY AEGIS."` of type `CRITICAL`.
3. IF the fetch throws a network error (e.g., CORS rejection, connection refused) and Scenario is `AEGIS`, THEN THE useC2Attack_Hook SHALL also set Status to `FAILED_BLURRED`.

---

### Requirement 10: Glitch Animation on Failure

**User Story:** As a presenter, I want the screen to violently glitch when the AEGIS interception fires, so that the failure is visually dramatic and unmistakable.

#### Acceptance Criteria

1. WHEN Status is `FAILED_BLURRED`, THE Dashboard SHALL apply a Framer Motion animation to the main layout `motion.div` consisting of rapid `skewX` keyframes (e.g., `-5deg`, `5deg`, `-5deg`, `5deg`, `0deg`) and `invert` CSS filter keyframes.
2. THE Glitch_Animation SHALL complete within approximately 1 second.
3. WHEN the Glitch_Animation completes, THE Dashboard SHALL apply `backdrop-blur-3xl` and `bg-black/80` to the entire screen, obscuring the hacker UI.

---

### Requirement 11: Failure Modal

**User Story:** As a presenter, I want a large modal to slam onto the screen after the glitch, so that the AEGIS interception message is impossible to miss.

#### Acceptance Criteria

1. WHEN Status is `FAILED_BLURRED`, THE Failure_Modal SHALL be rendered as an absolute-positioned overlay centred on the screen with a `z-index` above all other content.
2. THE Failure_Modal SHALL display a `ShieldOff` icon (from lucide-react) prominently.
3. THE Failure_Modal SHALL display the text `"ACCESS FAILED: ZERO-TRUST INTERCEPTION. CONNECTION SEVERED BY AEGIS."` in large, bold, uppercase monospace font.
4. THE Failure_Modal SHALL have a Crimson Red (`#dc2626`) border.
5. THE Failure_Modal SHALL enter the screen with a Framer Motion bounce/spring animation (e.g., `type: 'spring'` with high stiffness).
6. WHEN Status is `FAILED_BLURRED`, THE Left_Panel SHALL display a reset button that calls the `reset` function when clicked, returning Status to `IDLE` and dismissing the Failure_Modal.

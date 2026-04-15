# Design Document — Attacker C2 Dashboard

## Overview

The Attacker C2 Dashboard is a single-page application (SPA) that replaces the existing `app/page.tsx` with a focused, brutalist hacker-aesthetic command-and-control interface for demonstrating a Cross-Site Request Forgery (CSRF) attack in an educational security context.

The UI is intentionally theatrical: a full-screen, no-scroll grid with a CRT scanline overlay, phosphor-green terminal text, crimson-red borders, and Framer Motion glitch animations. The presenter selects a scenario (LEGACY or AEGIS), configures a target URL, and fires a real `fetch` POST with `credentials: 'include'`. The outcome — success or dramatic failure — is determined by the server's response.

The existing `CSRFInterceptConsole` component and `useCSRFInterception` hook are **not** part of this spec and must be preserved untouched.

### Key Design Decisions

- **Single hook (`useC2Attack`)** owns all attack state: status, scenario, logs, targetUrl, and all actions. The page component is a pure renderer.
- **Status drives everything**: the four states (`IDLE`, `INJECTING`, `SUCCESS`, `FAILED_BLURRED`) control button enablement, AMTD radar display, terminal content, glitch animation, and failure modal visibility.
- **No new CSS files**: all styling uses Tailwind utility classes and the existing design tokens from `c3-tokens.css` and `globals.css`.
- **`TerminalLogEntry` is reused as-is** for typewriter animation in the terminal panel.
- **Framer Motion `motion.div`** wraps the main grid and receives the glitch animation when `FAILED_BLURRED`.

---

## Architecture

```
app/page.tsx  (C2Dashboard — pure renderer)
    │
    ├── useC2Attack (hooks/useC2Attack.ts)
    │       ├── state: { status, scenario, logs, targetUrl }
    │       └── actions: { launchPayload, setScenario, reset }
    │
    ├── Header
    │       ├── Skull icon + AGENTIC_SWARM_C2 title
    │       └── Scenario toggle (LEGACY / AEGIS)
    │
    ├── Left Panel (35vw)
    │       ├── Target URL input (read-only)
    │       ├── Locked credentials indicator
    │       ├── LAUNCH CSRF PAYLOAD button
    │       └── Reset button (FAILED_BLURRED only)
    │
    └── Right Panel (65vw)
            ├── Top: AMTD Radar (port cycling / SCANNING...)
            └── Bottom: Terminal Console (TerminalLogEntry rows)

types/exploit.ts  (updated — adds Scenario type + C2AttackState interface)
```

### Data Flow

```
User clicks LAUNCH
    → launchPayload()
        → status = INJECTING
        → logs += "Forging CSRF request..." (INFO)
        → logs += "Hijacking session cookies..." (WARNING)
        → fetch(targetUrl, { method: POST, credentials: include, body: {...} })
            ┌── 2xx + LEGACY → status = SUCCESS
            │                 → logs += "TARGET COMPROMISED. FUNDS TRANSFERRED." (SUCCESS)
            └── 403 / network error + AEGIS → status = FAILED_BLURRED
                                             → logs += "ACCESS DENIED: ZERO-TRUST INTERCEPTION BY AEGIS." (CRITICAL)

User clicks RESET (FAILED_BLURRED only)
    → reset()
        → status = IDLE, logs = []
```

---

## Components and Interfaces

### `C2Dashboard` (app/page.tsx — full replacement)

The root page component. Consumes `useC2Attack` and renders the full layout. Manages only the AMTD port cycling interval via `useEffect` (local UI state, not part of the hook).

**Responsibilities:**
- Render the 100vh grid (header + left + right)
- Apply Framer Motion glitch animation on `FAILED_BLURRED`
- Render blur backdrop + failure modal when `FAILED_BLURRED`
- Drive AMTD port cycling interval based on `status === 'INJECTING'`
- Auto-scroll terminal to bottom on log changes

### `useC2Attack` (hooks/useC2Attack.ts — new file)

The single source of truth for all attack state and logic.

```typescript
interface UseC2AttackReturn {
  status: C2Status;
  scenario: Scenario;
  logs: LogEntry[];
  targetUrl: string;
  launchPayload: () => Promise<void>;
  setScenario: (s: Scenario) => void;
  reset: () => void;
}
```

**Internal state shape:**

```typescript
interface C2AttackState {
  status: C2Status;
  scenario: Scenario;
  logs: LogEntry[];
  targetUrl: string;
}
```

### Updated `types/exploit.ts`

Adds two new exports without removing existing ones:

```typescript
export type Scenario = 'LEGACY' | 'AEGIS';

export interface C2AttackState {
  status: ExploitStatus;   // reuses existing ExploitStatus
  scenario: Scenario;
  logs: LogEntry[];        // reuses existing LogEntry
  targetUrl: string;
}
```

`ExploitStatus` already covers the four required values (`IDLE | INJECTING | SUCCESS | FAILED_BLURRED`) so no change is needed to that type.

---

## Data Models

### `LogEntry` (existing — no change)

```typescript
interface LogEntry {
  id: string;          // `log_${Date.now()}_${Math.random()}`
  timestamp: string;   // ISO 8601
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
}
```

### `Scenario` (new)

```typescript
type Scenario = 'LEGACY' | 'AEGIS';
```

### `C2AttackState` (new)

```typescript
interface C2AttackState {
  status: 'IDLE' | 'INJECTING' | 'SUCCESS' | 'FAILED_BLURRED';
  scenario: Scenario;
  logs: LogEntry[];
  targetUrl: string;
}
```

### Fetch Payload Shape

```typescript
{
  amount: 99999,
  isForged: true,
  scenario: 'LEGACY' | 'AEGIS'   // current scenario at time of launch
}
```

### AMTD Port Display

Local `useState<string>` in `C2Dashboard`. Value is either `'SCANNING...'` (non-INJECTING) or a random 5-digit string generated by:

```typescript
const port = String(Math.floor(Math.random() * 90000) + 10000);
```

Interval: 150ms when `status === 'INJECTING'`, cleared otherwise.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property-based testing applies here because `useC2Attack` contains pure state-transition logic and the AMTD port generation is a pure function. These have universal properties that hold across all inputs and can be verified with 100+ iterations cheaply (no real network calls — fetch is mocked).

### Property 1: AMTD port numbers are always valid 5-digit numbers

*For any* invocation of the AMTD port generation expression `Math.floor(Math.random() * 90000) + 10000`, the result SHALL always be an integer in the range [10000, 99999] inclusive.

**Validates: Requirements 4.1**

### Property 2: Hook state values are always valid

*For any* sequence of `setScenario` and `reset` calls on the hook, the `status` field SHALL always be one of `'IDLE' | 'INJECTING' | 'SUCCESS' | 'FAILED_BLURRED'` and the `scenario` field SHALL always be one of `'LEGACY' | 'AEGIS'`.

**Validates: Requirements 6.1, 6.2**

### Property 3: Log entries always contain all required fields

*For any* log entry present in the `logs` array at any point during the hook's lifecycle, that entry SHALL have a non-empty `id` string, a non-empty `message` string, a valid `type` (`'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'`), and a non-empty `timestamp` string.

**Validates: Requirements 6.3**

### Property 4: setScenario never resets status

*For any* current `status` value and any target `scenario` value, calling `setScenario(scenario)` SHALL leave `status` unchanged.

**Validates: Requirements 6.6, 2.3**

### Property 5: reset always produces IDLE status and empty logs

*For any* hook state (regardless of current `status`, `scenario`, or `logs` contents), calling `reset()` SHALL always produce `status === 'IDLE'` and `logs.length === 0`.

**Validates: Requirements 6.7**

### Property 6: fetch is always called with correct credentials and body

*For any* `targetUrl` string and any `scenario` value, when `launchPayload()` is called, the `fetch` function SHALL be invoked with `credentials: 'include'`, `method: 'POST'`, `Content-Type: application/json`, and a body containing `{ amount: 99999, isForged: true, scenario: <current_scenario> }`.

**Validates: Requirements 7.3, 7.4**

---

## Error Handling

### Network Errors (CORS rejection, connection refused)

When `fetch` throws (any `Error` subclass), and the current scenario is `AEGIS`, the hook transitions to `FAILED_BLURRED` and appends the CRITICAL log message. This covers CORS preflight failures, DNS resolution failures, and connection refused errors — all of which manifest as thrown exceptions rather than HTTP responses.

When scenario is `LEGACY` and fetch throws, the hook should also transition to `FAILED_BLURRED` to avoid leaving the UI in a stuck `INJECTING` state. The same CRITICAL log message is appropriate.

### Non-2xx Responses (non-403)

The requirements specify 403 triggers `FAILED_BLURRED` for AEGIS. For robustness, any non-2xx response should be treated as a failure regardless of scenario, transitioning to `FAILED_BLURRED`.

### Concurrent Launch Prevention

The `launchPayload` function checks `status !== 'IDLE'` before proceeding. Since the button is disabled for non-IDLE states, double-invocation is prevented at the UI layer. The hook adds a guard at the function level as a second line of defence.

### Environment Variable Missing

If `NEXT_PUBLIC_AEGIS_IP` is not set, the `targetUrl` defaults to `http://localhost:3002/gateway/shard-a`. This is handled at the hook initialisation level.

---

## Testing Strategy

### Unit Tests (example-based)

Focus on specific interactions and state transitions:

- **Hook initial state**: `status === 'IDLE'`, `scenario === 'LEGACY'`, `logs === []`, `targetUrl` matches expected pattern
- **launchPayload → INJECTING**: status transitions, first two log messages (message text + type)
- **LEGACY success path**: mock fetch returning 200, assert `status === 'SUCCESS'` and SUCCESS log message
- **AEGIS 403 path**: mock fetch returning 403, assert `status === 'FAILED_BLURRED'` and CRITICAL log message
- **AEGIS network error path**: mock fetch throwing, assert `status === 'FAILED_BLURRED'`
- **setScenario**: assert scenario updates, assert status unchanged
- **reset**: assert status returns to IDLE, logs cleared
- **Button states**: disabled when INJECTING/SUCCESS/FAILED_BLURRED, enabled when IDLE
- **Failure modal**: present in DOM when `FAILED_BLURRED`, absent otherwise
- **Reset button**: present in DOM when `FAILED_BLURRED`, absent otherwise
- **AMTD display**: shows `SCANNING...` for non-INJECTING states, shows a number for INJECTING
- **Terminal waiting prompt**: shown when `status === 'IDLE'` and `logs === []`

### Property-Based Tests

Use a property-based testing library (e.g., **fast-check** for TypeScript/Jest). Each test runs a minimum of **100 iterations**.

Tag format: `Feature: attacker-c2-dashboard, Property {N}: {property_text}`

**Property 1 — AMTD port range** (`Feature: attacker-c2-dashboard, Property 1: AMTD port numbers are always valid 5-digit numbers`)
- Generator: run the expression N times
- Assert: every result is an integer, `>= 10000`, `<= 99999`

**Property 2 — Hook state invariants** (`Feature: attacker-c2-dashboard, Property 2: Hook state values are always valid`)
- Generator: arbitrary sequences of `setScenario('LEGACY')`, `setScenario('AEGIS')`, `reset()` calls
- Assert: after each call, `status` ∈ `{IDLE, INJECTING, SUCCESS, FAILED_BLURRED}` and `scenario` ∈ `{LEGACY, AEGIS}`

**Property 3 — Log entry structure** (`Feature: attacker-c2-dashboard, Property 3: Log entries always contain all required fields`)
- Generator: trigger `launchPayload` with mocked fetch (various response codes), collect all log entries
- Assert: every entry has non-empty `id`, `message`, `timestamp`, and `type` ∈ `{INFO, WARNING, CRITICAL, SUCCESS}`

**Property 4 — setScenario preserves status** (`Feature: attacker-c2-dashboard, Property 4: setScenario never resets status`)
- Generator: arbitrary `status` value (set via mock), arbitrary `scenario` value
- Assert: `status` before and after `setScenario` call is identical

**Property 5 — reset invariant** (`Feature: attacker-c2-dashboard, Property 5: reset always produces IDLE status and empty logs`)
- Generator: arbitrary hook state (various statuses, various log arrays)
- Assert: after `reset()`, `status === 'IDLE'` and `logs.length === 0`

**Property 6 — fetch invocation correctness** (`Feature: attacker-c2-dashboard, Property 6: fetch is always called with correct credentials and body`)
- Generator: arbitrary `targetUrl` strings, arbitrary `scenario` values
- Assert: captured `fetch` mock call has `credentials: 'include'`, `method: 'POST'`, `Content-Type: application/json` header, and parsed body equals `{ amount: 99999, isForged: true, scenario: <generated_scenario> }`

### Visual / Smoke Tests

The following are verified by visual review during development and are not automated:
- CRT scanline overlay rendering
- Brutalist design system (void black background, rounded-none, monospace fonts)
- Phosphor green / glitch red terminal text colours
- Framer Motion glitch animation (skewX + invert) on FAILED_BLURRED
- Failure modal spring bounce animation
- AMTD port number colour (phosphor green)

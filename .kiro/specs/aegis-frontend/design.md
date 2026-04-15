# Design Document — AEGIS Frontend (Node 1 Defender App)

## Overview

AEGIS (Adaptive Entropy-Gated Integrity Shield) is a Zero-Knowledge Behavioral Proof CSRF Defense System implemented as a Next.js 15 App Router application. The frontend (`node-1-defender-app`) is the sole focus of this document.

The application serves two purposes simultaneously:

1. **Functional security middleware** — it gates every transaction through a 5-layer defense pipeline before dispatching a dual-channel payload (HTTP + WebRTC).
2. **Live demonstration surface** — it renders a glassmorphism dashboard, a protected transaction form, and a one-click CSRF attack simulator with a 7-phase terminal sequence.

### Key Engineering Constraints

- **Zero unnecessary packages** — only the 11 approved dependencies are installed.
- **RAM efficiency** — entropy buffer lives in `useRef`, not `useState`; all event listeners are cleaned up; `ThreatModal` is lazy-loaded via `next/dynamic`.
- **No global state library** — React context is used only where cross-tree sharing is genuinely needed.
- **CSS-only typewriter animation** — the simulation terminal uses `@keyframes` steps, not a JS library.

---

## Architecture

### Directory Layout

```
node-1-defender-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # RootLayout — font + metadata only
│   │   ├── page.tsx            # HomePage — composes Dashboard + TransactionSurface
│   │   └── api/
│   │       └── transfer/
│   │           └── route.ts    # Mock API route for Shard A HTTP POST
│   ├── components/
│   │   ├── AegisDashboard.tsx
│   │   ├── TransactionSurface.tsx
│   │   ├── DefenseLayerCard.tsx
│   │   ├── ThreatModal.tsx     # lazy-loaded via next/dynamic
│   │   └── SimulationTerminal.tsx
│   ├── hooks/
│   │   └── useEntropyCollector.ts
│   ├── lib/
│   │   ├── zk-proof.ts
│   │   ├── user-activation.ts
│   │   └── shard-dispatcher.ts
│   └── types/
│       └── aegis-types.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### Runtime Data Flow

```
User moves mouse / touches screen
        │
        ▼
useEntropyCollector (useRef buffer, 500ms rolling window)
        │
        ▼  User clicks PAY
checkUserActivation()  ──── L1 gate ────► passed: false → halt + ThreatModal
        │ passed: true
        ▼
generateZKProof(buffer.current)  ──── L3 gate ────► NULL_TRAJECTORY → halt + ThreatModal
        │ valid hex proof
        ▼
dispatchShards(payload, dataChannel)
        ├── Shard A: HTTP POST /api/transfer  { amount, recipient, zkProof }
        └── Shard B: RTCDataChannel.send()    { zkSignature: zkProof }
                │
                ▼  both succeed
        TransactionSurface shows success + zkProof
                │  either fails
                ▼
        ThreatModal (L4 failure in TraceLog)
```

### Defense Pipeline Sequence

| Step | Layer | Check | Failure Action |
|------|-------|-------|----------------|
| 1 | L1 | `navigator.userActivation.isActive` | Halt, open ThreatModal |
| 2 | L2 | Entropy buffer non-empty | Halt, open ThreatModal |
| 3 | L3 | `generateZKProof` ≠ `"NULL_TRAJECTORY"` | Halt, open ThreatModal |
| 4 | L4 | `dispatchShards` both channels succeed | Halt, open ThreatModal |
| 5 | L5 | Framer Motion visualization | (demo layer — always passes) |

### State Management Strategy

No global state library is used. State is distributed as follows:

| State | Owner | Mechanism |
|-------|-------|-----------|
| Entropy buffer | `useEntropyCollector` | `useRef` (no re-renders) |
| Defense layer statuses | `AegisDashboard` | `useState` array |
| ZK proof display value | `AegisDashboard` | `useState` string |
| WebRTC channel ref | `AegisDashboard` | `useRef` |
| Transaction form values | `TransactionSurface` | `useState` (amount, recipient) |
| Modal open/trace log | `HomePage` | `useState` (lifted) |
| Simulation running flag | `AegisDashboard` | `useState` boolean |

`HomePage` owns the modal open state and trace log so it can disable `TransactionSurface` pointer events while the modal is visible.

---

## Components and Interfaces

### RootLayout (`app/layout.tsx`)

Minimal shell. Sets `<html lang="en">`, applies the global CSS (Tailwind base + background gradient), and exports metadata. No client-side logic.

### HomePage (`app/page.tsx`)

Client component. Composes `AegisDashboard` and `TransactionSurface` side-by-side on desktop, stacked on mobile. Owns `modalOpen: boolean` and `traceLog: DefenseLayerStatus[]` state. Passes `onThreat` callback down to both children so either can trigger the modal.

```tsx
// Lazy-loaded to keep initial bundle small
const ThreatModal = dynamic(() => import('@/components/ThreatModal'), { ssr: false });
```

### AegisDashboard

Props:
```ts
interface AegisDashboardProps {
  onThreat: (log: DefenseLayerStatus[]) => void;
}
```

Internal state:
- `layers: DefenseLayerStatus[]` — current status of L1–L5
- `zkProof: string` — last computed proof (display only)
- `rtcState: RTCDataChannelState` — live channel state
- `simRunning: boolean` — disables Simulate Attack button

Renders:
- Five `DefenseLayerCard` components
- System status badge (PROTECTED / DEGRADED)
- ZK proof display (truncated to 16 chars)
- WebRTC state indicator
- "Simulate Attack" button → triggers `SimulationTerminal` inside `ThreatModal`

Holds `dataChannelRef: useRef<RTCDataChannel | null>` and establishes the loopback `RTCPeerConnection` on mount (for demo purposes, a local loopback peer is sufficient).

### TransactionSurface

Props:
```ts
interface TransactionSurfaceProps {
  onThreat: (log: DefenseLayerStatus[]) => void;
  disabled: boolean; // true while ThreatModal is open
}
```

Internal state:
- `amount: string`, `recipient: string` — form fields
- `amountError: string`, `recipientError: string` — inline validation
- `processing: boolean` — disables PAY button during pipeline
- `successProof: string | null` — shown after approval

On PAY click: validates inputs, runs the full defense pipeline, either shows success or calls `onThreat`.

### DefenseLayerCard

Props:
```ts
interface DefenseLayerCardProps {
  status: DefenseLayerStatus;
}
```

Pure presentational component. Renders a glassmorphism card with:
- Layer label (e.g., "L1 — UserActivation")
- Pass/fail icon
- Detail string
- Green glow when `passed: true`, red glow when `passed: false`

### ThreatModal (lazy-loaded)

Props:
```ts
interface ThreatModalProps {
  traceLog: DefenseLayerStatus[];
  zkProof: string;
  simulationPhases?: SimulationPhase[]; // present when triggered by Attack Simulator
  onDismiss: () => void;
}
```

Uses Framer Motion `AnimatePresence` + `motion.div` for scale-and-fade entrance/exit (300ms). Implements focus trap via `useEffect` that captures Tab/Shift+Tab keydown events and cycles focus within the modal. Returns focus to the triggering element on dismiss via a stored `ref`.

Renders:
- Red-tinted glassmorphism overlay
- Blocking layer label
- Trace log list
- ZK proof value
- `SimulationTerminal` (when `simulationPhases` is provided)
- DISMISS button

### SimulationTerminal

Props:
```ts
interface SimulationTerminalProps {
  phases: SimulationPhase[];
}
```

Renders a `<pre>` block with `font-family: monospace`, black background. Each phase line is a `<span>` with a CSS `animation: typewriter` applied. Lines are staggered using `animation-delay` computed from the phase timestamp offset. Attacker lines use `color: #22c55e` (green-500), AEGIS block lines use `color: #ef4444` (red-500).

No JS animation library — purely CSS `@keyframes steps()`.

---

## Data Models

### `aegis-types.ts`

```ts
/** A single hardware-level pointer sample */
export interface EntropyPoint {
  x: number;   // clientX or touch.clientX
  y: number;   // clientY or touch.clientY
  t: number;   // Date.now() timestamp in ms
}

/** The payload dispatched across both channels */
export interface TransactionPayload {
  amount: number;
  recipient: string;
  zkProof: string;
}

/** Result of a single defense layer evaluation */
export interface DefenseLayerStatus {
  layer: string;   // "L1" | "L2" | "L3" | "L4" | "L5"
  passed: boolean;
  detail: string;
}

/** A single phase in the attack simulation sequence */
export interface SimulationPhase {
  offsetMs: number;   // delay from T+0 (0, 400, 800, 1200, 1400, 1600, 1800)
  text: string;       // the log line text
  type: 'attacker' | 'aegis'; // controls text color
}

/** Return type of dispatchShards */
export interface ShardResult {
  success: boolean;
  detail?: string;
}
```

### Simulation Phase Data (static constant)

```ts
export const SIMULATION_PHASES: SimulationPhase[] = [
  { offsetMs: 0,    type: 'attacker', text: "ATTACKER: Scanning target origin... found session cookie SameSite=None" },
  { offsetMs: 400,  type: 'attacker', text: "ATTACKER: Forging POST /api/transfer { amount: 99999, recipient: 'attacker_wallet' }" },
  { offsetMs: 800,  type: 'attacker', text: "ATTACKER: Injecting via hidden <iframe> cross-origin..." },
  { offsetMs: 1200, type: 'aegis',    text: "AEGIS L1: navigator.userActivation.isActive = false → BLOCKED" },
  { offsetMs: 1400, type: 'aegis',    text: "AEGIS L3: ZK-Proof = NULL_TRAJECTORY → No entropy signature" },
  { offsetMs: 1600, type: 'aegis',    text: "AEGIS L4: WebRTC Shard B missing → Asymmetric transport failure" },
  { offsetMs: 1800, type: 'aegis',    text: "AEGIS: THREAT NEUTRALIZED — Attack vector destroyed 🛑" },
];
```

### Security Library Signatures

```ts
// hooks/useEntropyCollector.ts
export function useEntropyCollector(): {
  getBuffer: () => readonly EntropyPoint[];
  clearBuffer: () => void;
}

// lib/zk-proof.ts
export async function generateZKProof(points: EntropyPoint[]): Promise<string>

// lib/user-activation.ts
export function checkUserActivation(): DefenseLayerStatus

// lib/shard-dispatcher.ts
export async function dispatchShards(
  payload: TransactionPayload,
  channel: RTCDataChannel
): Promise<ShardResult>
```

### CSS Typewriter Animation

```css
@keyframes typewriter {
  from { width: 0; }
  to   { width: 100%; }
}

.terminal-line {
  overflow: hidden;
  white-space: nowrap;
  animation: typewriter 0.4s steps(40, end) forwards;
  animation-delay: var(--delay);
  width: 0;
}
```

Each `SimulationPhase` line receives `style={{ '--delay': `${phase.offsetMs}ms` }}` so the CSS animation fires at the correct offset without any JS timer.

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Entropy event appends correct EntropyPoint

*For any* pointer coordinates `(x, y)` delivered via a `mousemove` or `touchmove` event, the `useEntropyCollector` buffer SHALL contain an `EntropyPoint` with those exact `x` and `y` values and a `t` value equal to `Date.now()` at the time of the event.

**Validates: Requirements 4.3, 4.4**

### Property 2: Rolling window invariant

*For any* snapshot returned by `getBuffer()`, every `EntropyPoint` in the array SHALL have a `t` value within 500ms of the maximum `t` value in the array. Points older than 500ms relative to the newest entry SHALL NOT appear in the snapshot.

**Validates: Requirements 4.5, 4.9**

### Property 3: clearBuffer produces empty snapshot

*For any* buffer state (empty, partially filled, or full), calling `clearBuffer()` followed immediately by `getBuffer()` SHALL return an empty array.

**Validates: Requirements 4.8**

### Property 4: generateZKProof returns valid 64-char hex for non-empty input

*For any* non-empty array of `EntropyPoint` values, `generateZKProof` SHALL return a string of exactly 64 characters where every character is a lowercase hexadecimal digit (`[0-9a-f]`).

**Validates: Requirements 5.2, 5.3**

### Property 5: generateZKProof is deterministic

*For any* non-empty array of `EntropyPoint` values, calling `generateZKProof` twice with identical array contents SHALL return the same hex string both times.

**Validates: Requirements 5.6**

### Property 6: Shard dispatch correctness

*For any* valid `TransactionPayload` `{ amount, recipient, zkProof }` and an open `RTCDataChannel`, `dispatchShards` SHALL call `fetch('/api/transfer')` with a JSON body containing all three fields AND call `RTCDataChannel.send()` with `{ zkSignature: zkProof }`, and SHALL return `{ success: true }`.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 7: Non-2xx HTTP response yields failure

*For any* HTTP status code in the range 400–599 returned by `/api/transfer`, `dispatchShards` SHALL return `{ success: false }` with the status code present in the `detail` string.

**Validates: Requirements 7.7**

---

## Error Handling

### Defense Pipeline Failures

Every layer in the pipeline returns a `DefenseLayerStatus`. The pipeline is sequential and halts on the first `passed: false` result. The accumulated `DefenseLayerStatus[]` up to the failure point is passed to `onThreat`, which opens `ThreatModal`.

```
L1 fails → [L1 status] → ThreatModal
L2 fails → [L1 pass, L2 status] → ThreatModal
L3 fails → [L1 pass, L2 pass, L3 status] → ThreatModal
L4 fails → [L1 pass, L2 pass, L3 pass, L4 status] → ThreatModal
```

### Form Validation

`TransactionSurface` validates before touching the pipeline:
- Amount: must be a finite positive number → inline error, no pipeline call.
- Recipient: must be non-empty after trim → inline error, no pipeline call.

### Web Crypto API Unavailability

`generateZKProof` wraps `crypto.subtle.digest` in a try/catch. On failure or when `crypto.subtle` is undefined, it returns `"NULL_TRAJECTORY"` and logs `console.warn('AEGIS: Web Crypto API unavailable')`. The pipeline then treats this as an L3 failure.

### WebRTC Channel Not Open

`dispatchShards` checks `channel.readyState === 'open'` before calling `send()`. If not open, it returns `{ success: false, detail: 'WebRTC channel not open: <state>' }` immediately without making the HTTP call, triggering an L4 failure.

### RTCPeerConnection Setup (Demo Loopback)

For the demo, `AegisDashboard` establishes a local loopback `RTCPeerConnection` (offer/answer on the same page). If ICE negotiation fails, `rtcState` is set to `'failed'` and the L4 card shows red. The `dataChannelRef` is set to `null` and `dispatchShards` will return `success: false`.

---

## Testing Strategy

### Unit Tests (example-based)

Focus on specific behaviors and edge cases:

- `checkUserActivation` with `isActive = true` → `passed: true`
- `checkUserActivation` with `isActive = false` → `passed: false`
- `checkUserActivation` with `navigator.userActivation = undefined` → `passed: false`
- `generateZKProof([])` → `"NULL_TRAJECTORY"`
- `generateZKProof` with Web Crypto unavailable → `"NULL_TRAJECTORY"`
- `dispatchShards` with closed RTCDataChannel → `success: false`
- `dispatchShards` with HTTP 500 → `success: false` with status in detail
- `SIMULATION_PHASES` constant has exactly 7 entries with correct `offsetMs` values and `text` strings
- `TransactionSurface` shows inline error for non-numeric amount
- `TransactionSurface` shows inline error for empty recipient

### Property-Based Tests

Using [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-native PBT library). Each test runs a minimum of 100 iterations.

**Property 1 — Entropy event appends correct EntropyPoint**
```
Feature: aegis-frontend, Property 1: entropy event appends correct EntropyPoint
```
Generate arbitrary `(x, y)` number pairs, fire synthetic `mousemove` and `touchmove` events, assert buffer contains matching point.

**Property 2 — Rolling window invariant**
```
Feature: aegis-frontend, Property 2: rolling window invariant
```
Generate arbitrary arrays of `EntropyPoint` with varying `t` offsets, insert them into the hook, call `getBuffer()`, assert every returned point satisfies `maxT - point.t <= 500`.

**Property 3 — clearBuffer produces empty snapshot**
```
Feature: aegis-frontend, Property 3: clearBuffer produces empty snapshot
```
Generate arbitrary buffer contents, call `clearBuffer()`, assert `getBuffer().length === 0`.

**Property 4 — generateZKProof returns valid 64-char hex**
```
Feature: aegis-frontend, Property 4: generateZKProof returns valid 64-char hex for non-empty input
```
Generate arbitrary non-empty `EntropyPoint[]`, call `generateZKProof`, assert result matches `/^[0-9a-f]{64}$/`.

**Property 5 — generateZKProof is deterministic**
```
Feature: aegis-frontend, Property 5: generateZKProof is deterministic
```
Generate arbitrary non-empty `EntropyPoint[]`, call `generateZKProof` twice with the same array, assert both results are equal.

**Property 6 — Shard dispatch correctness**
```
Feature: aegis-frontend, Property 6: shard dispatch correctness
```
Generate arbitrary `TransactionPayload` values, mock `fetch` and `RTCDataChannel`, call `dispatchShards`, assert both channels received correct data and result is `success: true`.

**Property 7 — Non-2xx HTTP response yields failure**
```
Feature: aegis-frontend, Property 7: non-2xx HTTP response yields failure
```
Generate arbitrary status codes in range 400–599, mock `fetch` to return that status, call `dispatchShards`, assert `success: false` and status code appears in `detail`.

### Integration Tests

- Full defense pipeline with real `navigator.userActivation` (Playwright/jsdom): verify modal opens on simulated attack.
- `SimulationTerminal` renders all 7 phase lines with correct CSS classes (green/red).
- `ThreatModal` focus trap: Tab key cycles within modal, Escape/DISMISS returns focus.

### Visual / Smoke Tests

- Glassmorphism cards render with correct `backdrop-blur` and border styles.
- PROTECTED badge appears when all 5 layers pass.
- DEGRADED badge appears with correct count when layers fail.
- Typewriter animation fires in correct order (manual inspection or Playwright screenshot diff).

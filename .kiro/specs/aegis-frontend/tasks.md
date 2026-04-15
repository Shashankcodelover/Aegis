# Implementation Plan: AEGIS Frontend (Node 1 Defender App)

## Overview

Incremental implementation of the AEGIS Next.js 15 frontend, building from project scaffold through each security layer to the full attack simulator. Each parent task ends with a checkpoint — stop and ask the user to push to GitHub before proceeding to the next task.

## Tasks

- [x] 1. Project Scaffold
  - [x] 1.1 Bootstrap Next.js 15 App Router project
    - Run `npx create-next-app@latest node-1-defender-app --typescript --tailwind --app --turbo --no-eslint --no-src-dir` (or equivalent manual scaffold)
    - Verify `package.json` contains ONLY the 11 approved deps: `next`, `react`, `react-dom`, `framer-motion`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`
    - Remove any extra packages added by the scaffolder (e.g. `eslint`, `eslint-config-next`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9, 1.10_

  - [x] 1.2 Configure Tailwind for Liquid Glass design system
    - Edit `tailwind.config.ts` to add custom `backdropBlur`, `boxShadow`, and `colors` tokens needed for glassmorphism cards
    - Add global CSS base layer with background gradient and `backdrop-filter` utilities
    - _Requirements: 1.2_

  - [x] 1.3 Define core TypeScript interfaces in `src/types/aegis-types.ts`
    - Export `EntropyPoint { x: number; y: number; t: number }`
    - Export `TransactionPayload { amount: number; recipient: string; zkProof: string }`
    - Export `DefenseLayerStatus { layer: string; passed: boolean; detail: string }`
    - Export `SimulationPhase { offsetMs: number; text: string; type: 'attacker' | 'aegis' }`
    - Export `ShardResult { success: boolean; detail?: string }`
    - Export the static `SIMULATION_PHASES` constant (7 entries with correct `offsetMs` and `text` values)
    - _Requirements: 1.6, 1.7, 1.8, 9.9_

  - [x] 1.4 Scaffold minimal `app/layout.tsx` and `app/page.tsx`
    - `layout.tsx`: sets `<html lang="en">`, applies global CSS, exports metadata — no client logic
    - `page.tsx`: client component stub that renders placeholder divs for Dashboard and TransactionSurface
    - _Requirements: 1.1, 1.5_

  - [x]* 1.5 Verify scaffold compiles and dev server starts
    - Run `npm run build` inside `node-1-defender-app` and confirm zero TypeScript errors
    - _Requirements: 1.4, 1.5_

  - [x] 1.6 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 2.

---

- [-] 2. AEGIS Dashboard UI
  - [x] 2.1 Implement `DefenseLayerCard` component
    - Create `src/components/DefenseLayerCard.tsx` as a pure presentational component
    - Accept `status: DefenseLayerStatus` prop
    - Render glassmorphism card with layer label, pass/fail icon, detail string
    - Apply green glow when `passed: true`, red glow when `passed: false`
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implement `AegisDashboard` component skeleton
    - Create `src/components/AegisDashboard.tsx` as a client component
    - Accept `onThreat: (log: DefenseLayerStatus[]) => void` prop
    - Initialize `layers: DefenseLayerStatus[]` state (L1–L5 all inactive by default)
    - Render five `DefenseLayerCard` instances
    - _Requirements: 2.1, 2.2_

  - [x] 2.3 Add system status badge, ZK proof display, and WebRTC state indicator
    - Compute PROTECTED vs DEGRADED from `layers` state; show inactive count when DEGRADED
    - Render ZK proof display: truncate to 16 chars or show "AWAITING ENTROPY"
    - Render WebRTC state indicator bound to `rtcState` state (`useRef<RTCDataChannel>`)
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.4 Establish loopback `RTCPeerConnection` on mount
    - In `useEffect`, create offer/answer loopback peer connection
    - Store `dataChannelRef` as `useRef<RTCDataChannel | null>`
    - Update `rtcState` on channel state change events; set to `'failed'` on ICE failure
    - Clean up peer connection and channel in effect cleanup
    - _Requirements: 1.12, 2.6, 2.7, 7.9_

  - [x] 2.5 Make layout responsive (375px–1920px)
    - Wire `AegisDashboard` and `TransactionSurface` into `page.tsx` side-by-side on desktop, stacked on mobile using Tailwind responsive classes
    - _Requirements: 2.8_

  - [ ]* 2.6 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 3.

---

- [-] 3. Transaction Surface UI
  - [x] 3.1 Implement `TransactionSurface` component
    - Create `src/components/TransactionSurface.tsx` as a client component
    - Accept `onThreat: (log: DefenseLayerStatus[]) => void` and `disabled: boolean` props
    - Render amount input, recipient input, and PAY button with Liquid Glass styling
    - _Requirements: 3.1, 3.2, 3.3, 3.7_

  - [x] 3.2 Add inline form validation
    - Validate amount is a finite positive number; show inline error and block submission if not
    - Validate recipient is non-empty after trim; show inline error and block submission if not
    - _Requirements: 3.8, 3.9_

  - [x] 3.3 Add processing state and success state
    - Set `processing: boolean` to `true` during pipeline; disable PAY button and show indicator
    - On approval, set `successProof: string` and display success confirmation with ZK proof value
    - Apply `pointer-events: none` when `disabled` prop is `true`
    - _Requirements: 3.4, 3.5, 3.6, 8.8_

  - [ ]* 3.4 Write unit tests for `TransactionSurface` validation
    - Test inline error appears for non-numeric amount
    - Test inline error appears for empty recipient
    - _Requirements: 3.8, 3.9_

  - [ ] 3.5 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 4.

---

- [-] 4. Entropy Collector
  - [x] 4.1 Implement `useEntropyCollector` hook
    - Create `src/hooks/useEntropyCollector.ts`
    - Store buffer in `useRef<EntropyPoint[]>` (not `useState`)
    - Attach `mousemove` and `touchmove` listeners on `document` in `useEffect`
    - On `mousemove`: append `{ x: e.clientX, y: e.clientY, t: Date.now() }` to buffer
    - On `touchmove`: append using `e.touches[0].clientX` / `clientY`
    - Remove all listeners in effect cleanup
    - _Requirements: 1.11, 1.12, 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 4.2 Implement rolling 500ms window and expose `getBuffer` / `clearBuffer`
    - After each append, filter out entries where `maxT - point.t > 500`
    - Expose `getBuffer(): readonly EntropyPoint[]` returning a snapshot of the buffer
    - Expose `clearBuffer()` that sets `bufferRef.current = []`
    - _Requirements: 4.5, 4.7, 4.8, 4.9_

  - [ ]* 4.3 Write property test — Property 1: entropy event appends correct EntropyPoint
    - Using fast-check, generate arbitrary `(x, y)` pairs, fire synthetic events, assert buffer contains matching point
    - **Property 1: Entropy event appends correct EntropyPoint**
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 4.4 Write property test — Property 2: rolling window invariant
    - Generate arbitrary `EntropyPoint[]` with varying `t` offsets, assert every returned point satisfies `maxT - point.t <= 500`
    - **Property 2: Rolling window invariant**
    - **Validates: Requirements 4.5, 4.9**

  - [ ]* 4.5 Write property test — Property 3: clearBuffer produces empty snapshot
    - Generate arbitrary buffer contents, call `clearBuffer()`, assert `getBuffer().length === 0`
    - **Property 3: clearBuffer produces empty snapshot**
    - **Validates: Requirements 4.8**

  - [ ] 4.6 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 5.

---

- [-] 5. ZK-Behavioral Proof Generator
  - [x] 5.1 Implement `generateZKProof` in `src/lib/zk-proof.ts`
    - Accept `points: EntropyPoint[]`
    - If array is empty, return `"NULL_TRAJECTORY"` immediately
    - Serialize array to JSON string, encode to `Uint8Array`, call `crypto.subtle.digest('SHA-256', ...)`
    - Convert `ArrayBuffer` result to lowercase hex string (exactly 64 chars)
    - Wrap in try/catch: on any error or if `crypto.subtle` is undefined, log `console.warn('AEGIS: Web Crypto API unavailable')` and return `"NULL_TRAJECTORY"`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write unit tests for `generateZKProof` edge cases
    - Test empty array → `"NULL_TRAJECTORY"`
    - Test Web Crypto unavailable → `"NULL_TRAJECTORY"` + console.warn
    - _Requirements: 5.4, 5.5_

  - [ ]* 5.3 Write property test — Property 4: generateZKProof returns valid 64-char hex
    - Generate arbitrary non-empty `EntropyPoint[]`, assert result matches `/^[0-9a-f]{64}$/`
    - **Property 4: generateZKProof returns valid 64-char hex for non-empty input**
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 5.4 Write property test — Property 5: generateZKProof is deterministic
    - Generate arbitrary non-empty `EntropyPoint[]`, call twice with same array, assert results are equal
    - **Property 5: generateZKProof is deterministic**
    - **Validates: Requirements 5.6**

  - [ ] 5.5 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 6.

---

- [-] 6. UserActivation Gate (L1)
  - [x] 6.1 Implement `checkUserActivation` in `src/lib/user-activation.ts`
    - Return `DefenseLayerStatus` with `layer: "L1"`
    - If `navigator.userActivation?.isActive === true` → `passed: true`, detail confirms activation
    - If `navigator.userActivation?.isActive === false` → `passed: false`, detail indicates no activation
    - If `navigator.userActivation` is `undefined` → `passed: false`, detail indicates API unsupported
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.2 Wire L1 gate as first step in the defense pipeline inside `TransactionSurface`
    - On PAY click (after form validation), call `checkUserActivation()` first
    - If `passed: false`, call `onThreat([l1Status])` and halt — do not proceed to entropy/ZK steps
    - _Requirements: 6.5, 6.6_

  - [ ]* 6.3 Write unit tests for `checkUserActivation`
    - Test `isActive = true` → `passed: true`
    - Test `isActive = false` → `passed: false`
    - Test `navigator.userActivation = undefined` → `passed: false`
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ] 6.4 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 7.

---

- [-] 7. Dual-Channel Shard Dispatcher (L4)
  - [x] 7.1 Implement mock API route `src/app/api/transfer/route.ts`
    - Accept POST with JSON body `{ amount, recipient, zkProof }`
    - Return `200 OK` with `{ status: 'approved' }` for valid payloads
    - _Requirements: 7.2, 7.3_

  - [x] 7.2 Implement `dispatchShards` in `src/lib/shard-dispatcher.ts`
    - Accept `payload: TransactionPayload` and `channel: RTCDataChannel`
    - Check `channel.readyState === 'open'`; if not, return `{ success: false, detail: 'WebRTC channel not open: <state>' }` immediately
    - Simultaneously initiate Shard A (`fetch('/api/transfer', { method: 'POST', body: JSON.stringify(payload) })`) and Shard B (`channel.send(JSON.stringify({ zkSignature: payload.zkProof }))`)
    - If HTTP response is non-2xx, return `{ success: false, detail: 'HTTP <status>' }`
    - If both succeed, return `{ success: true }`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 7.3 Wire `dispatchShards` into the defense pipeline
    - After L1, L2 (entropy check), L3 (ZK proof) pass, call `dispatchShards(payload, dataChannelRef.current)`
    - If `success: false`, call `onThreat` with accumulated trace log including L4 failure
    - If `success: true`, set `successProof` in `TransactionSurface`
    - _Requirements: 7.8_

  - [ ]* 7.4 Write unit tests for `dispatchShards` edge cases
    - Test closed RTCDataChannel → `success: false`
    - Test HTTP 500 → `success: false` with status in detail
    - _Requirements: 7.6, 7.7_

  - [ ]* 7.5 Write property test — Property 6: shard dispatch correctness
    - Generate arbitrary `TransactionPayload`, mock `fetch` and `RTCDataChannel`, assert both channels received correct data and result is `success: true`
    - **Property 6: Shard dispatch correctness**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

  - [ ]* 7.6 Write property test — Property 7: non-2xx HTTP response yields failure
    - Generate arbitrary status codes 400–599, mock `fetch`, assert `success: false` and status in `detail`
    - **Property 7: Non-2xx HTTP response yields failure**
    - **Validates: Requirements 7.7**

  - [ ] 7.7 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 8.

---

- [-] 8. Threat Detection Modal
  - [x] 8.1 Implement `ThreatModal` component
    - Create `src/components/ThreatModal.tsx` as a client component
    - Accept `traceLog: DefenseLayerStatus[]`, `zkProof: string`, `simulationPhases?: SimulationPhase[]`, `onDismiss: () => void` props
    - Render red-tinted glassmorphism overlay with blocking layer label, trace log list, ZK proof value, and DISMISS button
    - Conditionally render `SimulationTerminal` when `simulationPhases` is provided
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6_

  - [x] 8.2 Add Framer Motion entrance/exit animations
    - Wrap modal content in `AnimatePresence` + `motion.div`
    - Scale-and-fade entrance: `initial={{ opacity: 0, scale: 0.9 }}` → `animate={{ opacity: 1, scale: 1 }}`, duration ≤ 300ms
    - Scale-and-fade exit on DISMISS
    - _Requirements: 8.2, 8.7_

  - [x] 8.3 Implement focus trap and focus restoration
    - In `useEffect`, capture Tab/Shift+Tab keydown events and cycle focus within modal
    - Store triggering element ref before modal opens; restore focus on dismiss
    - _Requirements: 8.9_

  - [x] 8.4 Lazy-load `ThreatModal` via `next/dynamic` in `page.tsx`
    - Replace direct import with `dynamic(() => import('@/components/ThreatModal'), { ssr: false })`
    - Pass `modalOpen`, `traceLog`, `zkProof`, `simulationPhases`, and `onDismiss` from `HomePage` state
    - While modal is open, pass `disabled={true}` to `TransactionSurface`
    - _Requirements: 8.8_

  - [ ]* 8.5 Write unit tests for `ThreatModal` focus trap
    - Test Tab key cycles within modal
    - Test DISMISS returns focus to triggering element
    - _Requirements: 8.9_

  - [ ] 8.6 Checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub before moving to Task 9.

---

- [-] 9. CSRF Attack Simulator
  - [x] 9.1 Implement `SimulationTerminal` component
    - Create `src/components/SimulationTerminal.tsx`
    - Accept `phases: SimulationPhase[]` prop
    - Render `<pre>` block with monospace font, black background
    - Each phase is a `<span class="terminal-line">` with `style={{ '--delay': `${phase.offsetMs}ms` }}`
    - Attacker lines: `color: #22c55e`; AEGIS lines: `color: #ef4444`
    - _Requirements: 9.9, 9.10, 9.11_

  - [x] 9.2 Add CSS typewriter animation
    - In global CSS (or a CSS module), define `@keyframes typewriter { from { width: 0; } to { width: 100%; } }`
    - Apply `.terminal-line { overflow: hidden; white-space: nowrap; animation: typewriter 0.4s steps(40, end) forwards; animation-delay: var(--delay); width: 0; }`
    - No JS animation library — CSS only
    - _Requirements: 9.10, 1.9_

  - [x] 9.3 Implement "Simulate Attack" button in `AegisDashboard`
    - Render a red/warning styled "Simulate Attack" button with a demo-only label or tooltip
    - Disable button while `simRunning` is `true`
    - _Requirements: 9.1, 9.6, 9.7, 9.8_

  - [x] 9.4 Wire attack simulation pipeline
    - On button click: set `simRunning = true`, call defense pipeline with empty buffer and forced `userActivation.isActive = false`
    - Collect resulting `DefenseLayerStatus[]` trace log
    - Call `onThreat` with trace log and `SIMULATION_PHASES` so `ThreatModal` renders `SimulationTerminal`
    - Set `simRunning = false` after modal is triggered
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.12_

  - [ ]* 9.5 Write unit tests for simulation constant and terminal rendering
    - Test `SIMULATION_PHASES` has exactly 7 entries with correct `offsetMs` values and `text` strings
    - Test `SimulationTerminal` renders all 7 phase lines with correct CSS color classes
    - _Requirements: 9.9, 9.11_

  - [ ] 9.6 Final checkpoint — push to GitHub
    - Ensure all tests pass, ask the user to push to GitHub. Implementation complete.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each parent task ends with a checkpoint — stop and ask the user to push to GitHub before proceeding
- Property tests use `fast-check` (must be added as a dev dependency only, not a runtime dep)
- Each task references specific requirements for traceability
- The `useRef` entropy buffer (not `useState`) is a hard constraint — never change this to state
- `ThreatModal` must always be lazy-loaded via `next/dynamic` to keep initial bundle small
- The typewriter animation must be CSS-only (`@keyframes steps`) — no JS animation library

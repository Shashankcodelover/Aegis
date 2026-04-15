# Implementation Plan: Attacker C2 Dashboard

## Overview

Replace the existing multi-tab `app/page.tsx` with a focused brutalist CSRF demonstration SPA. The work is split into three incremental steps: extend the type system, build the `useC2Attack` hook, then wire the full dashboard UI. Property-based tests (fast-check) validate the hook's state-machine invariants and the AMTD port generator.

## Tasks

- [x] 1. Extend types/exploit.ts with Scenario and C2AttackState
  - Add `export type Scenario = 'LEGACY' | 'AEGIS'` to `types/exploit.ts`
  - Add `export interface C2AttackState` with fields `status: ExploitStatus`, `scenario: Scenario`, `logs: LogEntry[]`, `targetUrl: string`
  - Keep all existing exports (`ExploitStatus`, `PayloadType`, `CSRFStatus`, `LogEntry`, `VictimPayment`, `CSRFInterceptState`, `AttackState`) untouched
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Implement useC2Attack hook
  - [x] 2.1 Create hooks/useC2Attack.ts with initial state
    - Create `hooks/useC2Attack.ts` as a `'use client'` module
    - Initialise state: `status: 'IDLE'`, `scenario: 'LEGACY'`, `logs: []`, `targetUrl` derived from `process.env.NEXT_PUBLIC_AEGIS_IP ?? 'localhost'` as `http://<ip>:3002/gateway/shard-a`
    - Export the `UseC2AttackReturn` interface and the `useC2Attack` hook
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 2.2 Implement setScenario and reset actions
    - `setScenario(s: Scenario)` updates only `scenario`, leaves `status` unchanged
    - `reset()` sets `status` back to `'IDLE'` and clears `logs` to `[]`
    - _Requirements: 6.6, 6.7_

  - [x] 2.3 Implement launchPayload action
    - Guard: return early if `status !== 'IDLE'`
    - Set `status = 'INJECTING'`, append `INFO` log `"Forging CSRF request..."`
    - Append `WARNING` log `"Hijacking session cookies..."`
    - Execute `fetch(targetUrl, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 99999, isForged: true, scenario }) })`
    - On 2xx + LEGACY: set `status = 'SUCCESS'`, append `SUCCESS` log `"TARGET COMPROMISED. FUNDS TRANSFERRED."`
    - On 403 or any non-2xx, or on thrown network error: set `status = 'FAILED_BLURRED'`, append `CRITICAL` log `"ACCESS DENIED: ZERO-TRUST INTERCEPTION BY AEGIS."`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 9.1, 9.2, 9.3_

  - [ ]* 2.4 Install fast-check and write property tests for useC2Attack
    - Install `fast-check` as a dev dependency (`npm install --save-dev fast-check`)
    - Create `hooks/__tests__/useC2Attack.test.ts` (or `.tsx` with `@testing-library/react-hooks`)
    - **Property 1: AMTD port numbers are always valid 5-digit numbers**
      - Generator: run `Math.floor(Math.random() * 90000) + 10000` N times via `fc.integer`
      - Assert: every result is an integer `>= 10000` and `<= 99999`
      - Tag: `Feature: attacker-c2-dashboard, Property 1: AMTD port numbers are always valid 5-digit numbers`
      - **Validates: Requirements 4.1**
    - **Property 2: Hook state values are always valid**
      - Generator: arbitrary sequences of `setScenario('LEGACY')`, `setScenario('AEGIS')`, `reset()` calls
      - Assert: after each call `status` ∈ `{IDLE, INJECTING, SUCCESS, FAILED_BLURRED}` and `scenario` ∈ `{LEGACY, AEGIS}`
      - Tag: `Feature: attacker-c2-dashboard, Property 2: Hook state values are always valid`
      - **Validates: Requirements 6.1, 6.2**
    - **Property 3: Log entries always contain all required fields**
      - Generator: trigger `launchPayload` with mocked fetch returning various response codes; collect all log entries
      - Assert: every entry has non-empty `id`, `message`, `timestamp`, and `type` ∈ `{INFO, WARNING, CRITICAL, SUCCESS}`
      - Tag: `Feature: attacker-c2-dashboard, Property 3: Log entries always contain all required fields`
      - **Validates: Requirements 6.3**
    - **Property 4: setScenario never resets status**
      - Generator: arbitrary `status` value (set via mock), arbitrary `scenario` value
      - Assert: `status` before and after `setScenario` call is identical
      - Tag: `Feature: attacker-c2-dashboard, Property 4: setScenario never resets status`
      - **Validates: Requirements 6.6, 2.3**
    - **Property 5: reset always produces IDLE status and empty logs**
      - Generator: arbitrary hook state (various statuses, various log arrays)
      - Assert: after `reset()`, `status === 'IDLE'` and `logs.length === 0`
      - Tag: `Feature: attacker-c2-dashboard, Property 5: reset always produces IDLE status and empty logs`
      - **Validates: Requirements 6.7**
    - **Property 6: fetch is always called with correct credentials and body**
      - Generator: arbitrary `targetUrl` strings, arbitrary `scenario` values
      - Assert: captured `fetch` mock call has `credentials: 'include'`, `method: 'POST'`, `Content-Type: application/json` header, and parsed body equals `{ amount: 99999, isForged: true, scenario: <generated_scenario> }`
      - Tag: `Feature: attacker-c2-dashboard, Property 6: fetch is always called with correct credentials and body`
      - **Validates: Requirements 7.3, 7.4**

- [x] 3. Checkpoint — hook complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Replace app/page.tsx with the C2 Dashboard SPA
  - [x] 4.1 Scaffold the full-screen grid layout and header
    - Replace `app/page.tsx` entirely with a new `'use client'` component named `C2Dashboard`
    - Render a `<main>` with `w-screen h-screen overflow-hidden flex flex-col` (100vh, no scroll)
    - Add a `<header>` (10vh) containing: `Skull` icon, title `AGENTIC_SWARM_C2`, and a LEGACY/AEGIS scenario toggle that calls `setScenario`
    - Wrap the main content area in a `<motion.div>` that receives the glitch animation when `status === 'FAILED_BLURRED'` (`skewX` keyframes + `invert` filter, ~1 s duration)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 10.1, 10.2_

  - [x] 4.2 Implement the Left Panel (attack controls)
    - Render a 35vw left column with: read-only target URL input, locked credentials indicator (permanently ON), "LAUNCH CSRF PAYLOAD" button, and conditional reset button
    - Button enabled only when `status === 'IDLE'`; disabled (with visual indicator) for `INJECTING`, `SUCCESS`, `FAILED_BLURRED`
    - Reset button visible only when `status === 'FAILED_BLURRED'`; calls `reset()` on click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 11.6_

  - [x] 4.3 Implement the Top-Right AMTD Radar panel
    - Render a 65vw right column, top half: AMTD Radar widget
    - Add local `useState<string>` for `amtdPort`, initialised to `'SCANNING...'`
    - `useEffect` that starts a 150ms interval cycling `Math.floor(Math.random() * 90000) + 10000` when `status === 'INJECTING'`; clears interval and resets to `'SCANNING...'` otherwise
    - Display port value in Phosphor Green monospace; show `SCANNING...` for non-INJECTING states
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.4 Implement the Bottom-Right Terminal Console
    - Render the bottom half of the right column as a scrolling terminal
    - Use `useRef` + `useEffect` to auto-scroll to the latest log entry on `logs` change
    - When `logs` is empty and `status === 'IDLE'`, show the static waiting prompt `[AWAITING PAYLOAD EXECUTION]`
    - Map `logs` to `<TerminalLogEntry>` components (reuse existing component from `app/TerminalLogEntry.tsx`)
    - Apply correct text colours per log type: `INFO` → Phosphor Green, `SUCCESS` → Phosphor Green bold, `CRITICAL` → Glitch Red
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 4.5 Implement the Failure Modal and blur backdrop
    - When `status === 'FAILED_BLURRED'`, render a `backdrop-blur` + `bg-black/80` overlay (`z-40`) and a centred modal (`z-50`)
    - Modal contains: `ShieldOff` icon, text `"ACCESS FAILED: ZERO-TRUST INTERCEPTION. CONNECTION SEVERED BY AEGIS."`, Crimson Red border
    - Modal enters with Framer Motion spring animation (`type: 'spring'`, high stiffness, scale from 3 → 1)
    - _Requirements: 10.3, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `useAgenticExploit`, `useCSRFInterception`, and `CSRFInterceptConsole` are **not** modified by this spec
- `fast-check` must be installed before running property tests (task 2.4)
- All styling uses existing Tailwind utility classes and `c3-tokens.css` design tokens — no new CSS files
- Property tests run a minimum of 100 iterations each; fetch must be mocked (no real network calls)

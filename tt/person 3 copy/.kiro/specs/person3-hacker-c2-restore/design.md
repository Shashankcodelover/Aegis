# Person 3 Hacker C2 Dashboard Restoration — Bugfix Design

## Overview

The Person 3 "AGENTIC_SWARM_C2" application has drifted from its spec-defined state. Five files
contain incorrect content and three extra files exist that were never part of the spec. The fix
is a targeted restoration: rewrite the five drifted files to their spec-defined state and delete
the three extra files. No new logic is introduced; all changes are restorations of intended
behavior. Unchanged files (`app/layout.tsx`, `app/TerminalLogEntry.tsx`, `next.config.js`,
`package.json`, `tailwind.config.js`) must not be touched.

---

## Glossary

- **Bug_Condition (C)**: A file in the workspace whose content does not match the spec-defined
  state — either wrong types, wrong logic, wrong UI elements, wrong CSS imports, or the file
  should not exist at all.
- **Property (P)**: The desired post-fix state — each affected file matches the spec exactly and
  the three extra files are absent.
- **Preservation**: All files NOT in the bug condition set (`layout.tsx`, `TerminalLogEntry.tsx`,
  `next.config.js`, `package.json`, `tailwind.config.js`) remain byte-for-byte unchanged.
- **ExploitStatus**: The union type `'IDLE' | 'ENUMERATING' | 'INJECTING' | 'SUCCESS_STOLEN' | 'FAILED_BLURRED'` defined in `types/exploit.ts`.
- **ScenarioMode**: The union type `'LEGACY_VULNERABLE' | 'AEGIS_SECURED'` defined in `types/exploit.ts`.
- **AttackState**: The interface `{ status, scenario, targetUrl, logs }` defined in `types/exploit.ts`.
- **useAgenticExploit**: The hook in `hooks/useAgenticExploit.ts` that manages `AttackState` and
  exposes `executePayload`, `addLog`, and `resetAttack`.
- **isBugCondition(X)**: Pseudocode predicate — returns true when file X is in the drifted state.

---

## Bug Details

### Bug Condition

The bug manifests across five files that have drifted from their spec-defined content, plus three
extra files that should not exist. The drift is not a runtime crash but a correctness failure:
the app renders with the wrong design system, exposes wrong types, uses wrong hook logic, shows
wrong button labels, and is missing required UI elements (pulsing Skull, success modal,
catastrophic blur animation, correct title).

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type AppFile (file path + content in the person 3 workspace)
  OUTPUT: boolean

  RETURN (
    X.path = 'types/exploit.ts'
      AND (X exports 'SUCCESS' instead of 'SUCCESS_STOLEN'
           OR X exports 'Scenario' instead of 'ScenarioMode'
           OR X exports extra types: PayloadType, CSRFStatus, VictimPayment, CSRFInterceptState, C2AttackState)
  ) OR (
    X.path = 'hooks/useAgenticExploit.ts'
      AND (X.AttackState has fields targetAmtdPort, payloadType, ambientCredentialsEnabled
           OR X.status values include 'ENUMERATING_PORTS', 'COMPILING_PAYLOAD', 'INJECTING_CSRF'
           OR X does not handle SUCCESS_STOLEN scenario)
  ) OR (
    X.path = 'app/page.tsx'
      AND (X imports useC2Attack instead of useAgenticExploit
           OR X.Skull is not animated with pulse
           OR X.title does not include '// v4.2.0-BETA_BUILD'
           OR X.button label is 'LAUNCH CSRF PAYLOAD' instead of 'SIMULATE CSRF ATTACK'
           OR X missing success modal for SUCCESS_STOLEN
           OR X.scenario toggle uses 'AEGIS'/'LEGACY' instead of 'AEGIS_SECURED'/'LEGACY_VULNERABLE')
  ) OR (
    X.path = 'app/globals.css'
      AND X.content contains "@import \"./styles/c3-tokens.css\""
  ) OR (
    X.path IN ['app/CSRFInterceptConsole.tsx',
               'hooks/useCSRFInterception.ts',
               'hooks/useC2Attack.ts']
      AND X exists
  )
END FUNCTION
```

### Examples

- **types/exploit.ts**: Exports `ExploitStatus` with `'SUCCESS'` — expected `'SUCCESS_STOLEN'`.
  Also exports `Scenario = 'LEGACY' | 'AEGIS'` — expected `ScenarioMode = 'LEGACY_VULNERABLE' | 'AEGIS_SECURED'`.
- **hooks/useAgenticExploit.ts**: Initializes `AttackState` with `targetAmtdPort: 'SCANNING...'`,
  `payloadType: 'JSON_SMUGGLING_CSRF'`, `ambientCredentialsEnabled: true` — none of these fields
  exist in the spec-defined `AttackState`.
- **app/page.tsx**: Imports `useC2Attack` (a non-spec hook), renders `<Skull>` without a pulse
  animation, shows button label `"LAUNCH CSRF PAYLOAD"`, and has no success modal for the
  `SUCCESS_STOLEN` state.
- **app/globals.css**: Line 2 is `@import "./styles/c3-tokens.css"` which injects a blue-centric
  design token system (`--c3-void`, `--c3-blue-glow`, etc.) overriding the required black/red palette.
- **hooks/useC2Attack.ts**: File exists and is imported by `page.tsx` — it is not part of the spec.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `app/layout.tsx` — JetBrains Mono font loading and metadata title `"AGENTIC_SWARM_C2 v4.2.0"` must remain exactly as-is.
- `app/TerminalLogEntry.tsx` — character-by-character typewriter animation must continue to work.
- Terminal auto-scroll to bottom on new log entries must continue to work.
- The scenario toggle must continue to switch between the two modes and update the UI label.
- The attack button must continue to be disabled and show `"INJECTING..."` while an attack is in progress.
- The reset button must continue to appear when `status === 'FAILED_BLURRED'` and return the app to `IDLE`.
- `next.config.js`, `package.json`, `tailwind.config.js`, `tsconfig.json` must not be modified.
- The app must continue to compile without TypeScript errors under Next.js 15 App Router with strict TypeScript.

**Scope:**
All files NOT listed in the bug condition set are completely unaffected by this fix. The fix
touches exactly: `types/exploit.ts`, `hooks/useAgenticExploit.ts`, `app/page.tsx`,
`app/globals.css`, and deletes `app/CSRFInterceptConsole.tsx`, `hooks/useCSRFInterception.ts`,
`hooks/useC2Attack.ts`.

---

## Hypothesized Root Cause

Based on the current file contents, the most likely causes of drift are:

1. **Incremental feature creep on types**: `types/exploit.ts` was extended with CSRF interception
   types (`CSRFStatus`, `VictimPayment`, `CSRFInterceptState`) and a parallel attack state
   (`C2AttackState`) for a different feature branch. The original `ExploitStatus` and `Scenario`
   types were modified in-place rather than kept separate, corrupting the spec-defined names.

2. **Hook replacement**: `hooks/useAgenticExploit.ts` was modified to use the extended
   `AttackState` shape (with `targetAmtdPort`, `payloadType`, `ambientCredentialsEnabled`) and
   non-spec status values (`ENUMERATING_PORTS`, `COMPILING_PAYLOAD`, `INJECTING_CSRF`). A
   parallel hook `useC2Attack.ts` was created for `page.tsx` to consume, further diverging from
   the spec.

3. **UI component swap**: `app/page.tsx` was updated to import `useC2Attack` instead of
   `useAgenticExploit`, losing the spec-defined hook contract. The button label, title, and
   missing modals are side effects of this swap — the new hook's API didn't include
   `SUCCESS_STOLEN` handling so those UI branches were never implemented.

4. **Design system injection**: `app/globals.css` had `@import "./styles/c3-tokens.css"` added,
   which defines a blue-centric CSS custom property system. This overrides the Tailwind-based
   black/red/orange palette that the spec requires.

5. **Extra file accumulation**: Three files (`CSRFInterceptConsole.tsx`, `useCSRFInterception.ts`,
   `useC2Attack.ts`) were created for the CSRF interception feature branch and never cleaned up.

---

## Correctness Properties

Property 1: Bug Condition — Drifted Files Match Spec After Restoration

_For any_ file X where `isBugCondition(X)` returns true, the restoration function SHALL produce
a file whose content exactly matches the spec-defined state: correct type names and values in
`types/exploit.ts`, correct `AttackState` shape and `executePayload` logic in
`hooks/useAgenticExploit.ts`, correct UI elements and labels in `app/page.tsx`, no
`c3-tokens.css` import in `app/globals.css`, and absence of the three extra files.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

Property 2: Preservation — Non-Drifted Files Are Unchanged

_For any_ file X where `isBugCondition(X)` returns false (i.e., `layout.tsx`,
`TerminalLogEntry.tsx`, `next.config.js`, `package.json`, `tailwind.config.js`, etc.), the
restoration process SHALL leave X byte-for-byte identical to its pre-fix state, preserving all
existing behavior including font loading, typewriter animation, auto-scroll, scenario toggling,
button disable state, and TypeScript compilation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

---

## Fix Implementation

### Changes Required

**File 1: `types/exploit.ts`**

**Specific Changes:**
1. Replace `ExploitStatus` — change `'SUCCESS'` to `'SUCCESS_STOLEN'`, add `'ENUMERATING'` between `'IDLE'` and `'INJECTING'`.
2. Remove `PayloadType` type entirely.
3. Remove `CSRFStatus` type entirely.
4. Remove `VictimPayment` interface entirely.
5. Remove `CSRFInterceptState` interface entirely.
6. Rename `Scenario` to `ScenarioMode` and change values from `'LEGACY' | 'AEGIS'` to `'LEGACY_VULNERABLE' | 'AEGIS_SECURED'`.
7. Rewrite `AttackState` interface to `{ status: ExploitStatus; scenario: ScenarioMode; targetUrl: string; logs: LogEntry[]; }`.
8. Remove `C2AttackState` interface entirely.

**File 2: `hooks/useAgenticExploit.ts`**

**Specific Changes:**
1. Update import to use `ScenarioMode` instead of `Scenario`.
2. Rewrite initial state to use spec-defined `AttackState` shape: `{ status: 'IDLE', scenario: 'LEGACY_VULNERABLE', targetUrl: '', logs: [] }`.
3. Accept `aegisIp` and `scenario` as parameters (or derive `targetUrl` from `aegisIp`).
4. Replace non-spec status values (`ENUMERATING_PORTS`, `COMPILING_PAYLOAD`, `INJECTING_CSRF`) with spec-defined values (`ENUMERATING`, `INJECTING`).
5. Add `SUCCESS_STOLEN` branch: when `response.ok`, set status to `'SUCCESS_STOLEN'` and add success log.
6. Keep `FAILED_BLURRED` branch for 403 responses.
7. Remove `targetAmtdPort`, `payloadType`, `ambientCredentialsEnabled` from state entirely.

**File 3: `app/page.tsx`**

**Specific Changes:**
1. Replace `import { useC2Attack }` with `import { useAgenticExploit }`.
2. Add `animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}` to the `<Skull>` icon (pulsing).
3. Update title to `"AGENTIC_SWARM_C2 // v4.2.0-BETA_BUILD"`.
4. Update scenario toggle to use `'AEGIS_SECURED'` / `'LEGACY_VULNERABLE'` values.
5. Change button label from `"LAUNCH CSRF PAYLOAD"` to `"SIMULATE CSRF ATTACK"`.
6. Add success modal: `AnimatePresence` block for `status === 'SUCCESS_STOLEN'` showing green modal with `"FUNDS ACQUIRED: ₹50,000 REDIRECTED TO OFFSHORE ACCOUNT."`.
7. Ensure the catastrophic blur overlay (`backdrop-blur-3xl bg-black/80`) triggers after the `skewX + filter:invert(1)` animation completes (1.5s delay before overlay appears).

**File 4: `app/globals.css`**

**Specific Changes:**
1. Remove the line `@import "./styles/c3-tokens.css";`.
2. Remove all CSS custom property references (`var(--c3-*)`) since they will no longer be defined.
3. Retain the CRT scanline `main::after` keyframe and scrollbar styling using hardcoded red/black values.
4. Retain `@import "tailwindcss";` as the sole import.

**Deletions:**
- Delete `app/CSRFInterceptConsole.tsx`
- Delete `hooks/useCSRFInterception.ts`
- Delete `hooks/useC2Attack.ts`

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate
the bug on the unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm
or refute the root cause analysis.

**Test Plan**: Inspect the current file contents and assert they do NOT match the spec. Run
TypeScript type-checking (`tsc --noEmit`) on the unfixed code to observe type errors caused by
the wrong `AttackState` shape and missing `ScenarioMode` type.

**Test Cases:**
1. **Type Export Check** (will fail on unfixed code): Assert `ExploitStatus` includes `'SUCCESS_STOLEN'` — currently it has `'SUCCESS'` instead.
2. **ScenarioMode Check** (will fail on unfixed code): Assert `ScenarioMode` is exported with values `'LEGACY_VULNERABLE' | 'AEGIS_SECURED'` — currently exported as `Scenario = 'LEGACY' | 'AEGIS'`.
3. **AttackState Shape Check** (will fail on unfixed code): Assert `AttackState` has no `targetAmtdPort` field — currently it does.
4. **Button Label Check** (will fail on unfixed code): Assert `page.tsx` contains `"SIMULATE CSRF ATTACK"` — currently it has `"LAUNCH CSRF PAYLOAD"`.
5. **CSS Import Check** (will fail on unfixed code): Assert `globals.css` does NOT contain `c3-tokens.css` import — currently it does.
6. **Extra File Check** (will fail on unfixed code): Assert `hooks/useC2Attack.ts` does not exist — currently it does.

**Expected Counterexamples:**
- `tsc --noEmit` will report errors because `page.tsx` imports `useC2Attack` which uses the wrong `AttackState` shape.
- File content assertions will fail for all five drifted files.

### Fix Checking

**Goal**: Verify that for all files where the bug condition holds, the restored file matches the spec.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := restore(X)
  ASSERT result.content matches spec-defined content
  ASSERT tsc --noEmit passes with no errors
END FOR
```

### Preservation Checking

**Goal**: Verify that for all files where the bug condition does NOT hold, the file is unchanged.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT hash(X.before) = hash(X.after)
END FOR
```

**Testing Approach**: File hash comparison for unchanged files, plus `tsc --noEmit` to confirm
TypeScript compilation still passes end-to-end.

**Test Cases:**
1. **layout.tsx Preservation**: Verify `app/layout.tsx` is byte-for-byte identical before and after fix.
2. **TerminalLogEntry Preservation**: Verify `app/TerminalLogEntry.tsx` is unchanged.
3. **TypeScript Compilation**: Run `tsc --noEmit` after fix — must pass with zero errors.
4. **Package.json Preservation**: Verify `package.json` is unchanged (no new dependencies added).

### Unit Tests

- Assert `ExploitStatus` union includes exactly: `'IDLE' | 'ENUMERATING' | 'INJECTING' | 'SUCCESS_STOLEN' | 'FAILED_BLURRED'`
- Assert `ScenarioMode` union includes exactly: `'LEGACY_VULNERABLE' | 'AEGIS_SECURED'`
- Assert `AttackState` interface has exactly four fields: `status`, `scenario`, `targetUrl`, `logs`
- Assert `useAgenticExploit` hook sets `status: 'SUCCESS_STOLEN'` when `response.ok` is true
- Assert `useAgenticExploit` hook sets `status: 'FAILED_BLURRED'` when response is 403
- Assert `page.tsx` renders button with label `"SIMULATE CSRF ATTACK"`
- Assert `page.tsx` renders success modal when `status === 'SUCCESS_STOLEN'`

### Property-Based Tests

- Generate random `ExploitStatus` values and verify only spec-defined values are accepted by TypeScript (compile-time property).
- Generate random fetch response scenarios (ok, 403, network error) and verify `useAgenticExploit` always transitions to a valid `ExploitStatus` state.
- Verify that for any non-buggy file X, `restore(X)` is a no-op (content unchanged).

### Integration Tests

- Full app render: verify the page loads without console errors after fix.
- Scenario toggle: click toggle and verify label switches between `LEGACY_VULNERABLE` and `AEGIS_SECURED`.
- Attack flow (LEGACY_VULNERABLE): simulate successful fetch response, verify success modal appears with correct text.
- Attack flow (AEGIS_SECURED): simulate 403 response, verify skewX animation fires then blur overlay appears.
- Reset flow: verify reset button in `FAILED_BLURRED` state returns app to `IDLE` with empty logs.

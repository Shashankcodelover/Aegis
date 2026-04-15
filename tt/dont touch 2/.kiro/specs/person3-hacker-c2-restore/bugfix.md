# Bugfix Requirements Document

## Introduction

The Person 3 "Node 3: The Threat Actor Command & Control (C2) Exploitation Framework" application has drifted significantly from its intended design. The app was meant to be a brutalist red-team hacker dashboard demonstrating CSRF attacks against the AEGIS API Gateway, but the current state contains wrong type definitions, extra unintended files, a mismatched blue-themed design token system, and broken scenario logic. This document captures what is broken, what the correct behavior should be, and what must be preserved.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the app loads THEN the system renders with a blue-themed design token system (`c3-tokens.css`) instead of the specified "BRUTALIST RED TEAM KINETIC" black/red/orange palette

1.2 WHEN `types/exploit.ts` is read THEN the system exposes incorrect types: `ExploitStatus` is missing `'ENUMERATING'` and `'SUCCESS_STOLEN'`, has a wrong `'SUCCESS'` value instead, and `ScenarioMode` is named `Scenario` with wrong values `'LEGACY' | 'AEGIS'` instead of `'LEGACY_VULNERABLE' | 'AEGIS_SECURED'`

1.3 WHEN `types/exploit.ts` is read THEN the system contains extra unspecified types (`PayloadType`, `CSRFStatus`, `VictimPayment`, `CSRFInterceptState`, `C2AttackState`) that do not belong in the spec

1.4 WHEN `hooks/useAgenticExploit.ts` is read THEN the system uses the wrong `AttackState` shape (with `targetAmtdPort`, `payloadType`, `ambientCredentialsEnabled` fields) instead of the spec-defined shape with `status`, `scenario`, `targetUrl`, `logs`

1.5 WHEN the app directory is inspected THEN the system contains extra unintended files: `app/CSRFInterceptConsole.tsx` and `hooks/useCSRFInterception.ts` and `hooks/useC2Attack.ts` that are not part of the original spec

1.6 WHEN the LEGACY_VULNERABLE scenario succeeds THEN the system does NOT display the required success modal: "FUNDS ACQUIRED: ₹50,000 REDIRECTED TO OFFSHORE ACCOUNT."

1.7 WHEN the AEGIS_SECURED scenario fails THEN the system does NOT trigger the specified catastrophic blur animation (violent skewX + filter:invert(1) flashes for 1.5s before the backdrop-blur-3xl overlay)

1.8 WHEN `app/page.tsx` renders the header THEN the system shows the title without the required subtitle `// v4.2.0-BETA_BUILD` and the Skull icon does not pulse

1.9 WHEN `app/page.tsx` renders the attack button THEN the system shows "LAUNCH CSRF PAYLOAD" instead of the required label "SIMULATE CSRF ATTACK" with the specified styling (`bg-red-700 text-black font-black text-xl uppercase py-6`)

1.10 WHEN `app/globals.css` is read THEN the system imports `./styles/c3-tokens.css` which defines a blue-centric design system, overriding the required black/red/orange brutalist palette

### Expected Behavior (Correct)

2.1 WHEN the app loads THEN the system SHALL render with background `#000000`, radial gradient from `red-950/20`, primary accents Neon Blood Orange (`#ea580c`) and Deep Crimson Red (`#dc2626`), terminal text Phosphor Green (`#22c55e`) and Glitch Red (`#ef4444`), and borders `1px solid border-red-500/40` with no soft rounded corners

2.2 WHEN `types/exploit.ts` is read THEN the system SHALL export exactly: `ExploitStatus = 'IDLE' | 'ENUMERATING' | 'INJECTING' | 'SUCCESS_STOLEN' | 'FAILED_BLURRED'`, `ScenarioMode = 'LEGACY_VULNERABLE' | 'AEGIS_SECURED'`, `LogEntry`, and `AttackState` — matching the spec exactly with no extra types

2.3 WHEN `hooks/useAgenticExploit.ts` is read THEN the system SHALL export a hook using `AttackState` with fields `status`, `scenario`, `targetUrl`, `logs`, an `addLog` function, and an `executePayload` async function that POSTs to `targetUrl` with `credentials: 'include'`

2.4 WHEN the LEGACY_VULNERABLE scenario fetch succeeds (response.ok) THEN the system SHALL set status to `SUCCESS_STOLEN` and display a green success modal with the text "FUNDS ACQUIRED: ₹50,000 REDIRECTED TO OFFSHORE ACCOUNT."

2.5 WHEN the AEGIS_SECURED scenario fetch returns 403 THEN the system SHALL first trigger a violent skewX + filter:invert(1) animation for 1.5s, then show a `backdrop-blur-3xl bg-black/80` overlay with a red modal containing "ACCESS FAILED: ZERO-TRUST INTERCEPTION. CONNECTION SEVERED BY AEGIS SECURITY SYSTEM."

2.6 WHEN `app/page.tsx` renders the header THEN the system SHALL display a pulsing Skull icon, the title "AGENTIC_SWARM_C2 // v4.2.0-BETA_BUILD", and a toggle for LEGACY_VULNERABLE vs AEGIS_SECURED scenarios

2.7 WHEN `app/page.tsx` renders the attack button THEN the system SHALL show the label "SIMULATE CSRF ATTACK" with styling `bg-red-700 text-black font-black text-xl uppercase py-6`

2.8 WHEN `app/globals.css` is read THEN the system SHALL NOT import `c3-tokens.css` and SHALL use only the brutalist red/black/orange design tokens defined inline or via Tailwind config

2.9 WHEN the app directory is inspected THEN the system SHALL contain only the spec-required files: `types/exploit.ts`, `hooks/useAgenticExploit.ts`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/TerminalLogEntry.tsx`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the app is built THEN the system SHALL CONTINUE TO compile without TypeScript errors using Next.js 15 App Router with strict TypeScript

3.2 WHEN the terminal receives log entries THEN the system SHALL CONTINUE TO render `TerminalLogEntry` components with character-by-character typewriter animation

3.3 WHEN the page loads THEN the system SHALL CONTINUE TO auto-scroll the terminal to the bottom on new log entries

3.4 WHEN the scenario toggle is clicked THEN the system SHALL CONTINUE TO switch between the two scenario modes and update the UI label accordingly

3.5 WHEN the attack is in progress THEN the system SHALL CONTINUE TO disable the launch button and show an "INJECTING..." state

3.6 WHEN the failure overlay is active THEN the system SHALL CONTINUE TO show a reset button that returns the app to IDLE state

3.7 WHEN `app/layout.tsx` is read THEN the system SHALL CONTINUE TO load JetBrains Mono font from Google Fonts and set the correct metadata title "AGENTIC_SWARM_C2 v4.2.0"

---

## Bug Condition Pseudocode

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AppFile (any file in the person 3 workspace)
  OUTPUT: boolean

  RETURN (
    X is types/exploit.ts AND X.content does not match spec-defined types
    OR X is hooks/useAgenticExploit.ts AND X.content uses wrong AttackState shape
    OR X is app/page.tsx AND X.content missing required UI elements or wrong labels
    OR X is app/globals.css AND X.content imports c3-tokens.css
    OR X is an extra file not in the spec (CSRFInterceptConsole.tsx, useCSRFInterception.ts, useC2Attack.ts)
  )
END FUNCTION
```

```pascal
// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← restore(X)
  ASSERT result matches spec-defined content exactly
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)  // layout.tsx, TerminalLogEntry.tsx, next.config.js, package.json unchanged
END FOR
```

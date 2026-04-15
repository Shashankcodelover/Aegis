#!/usr/bin/env node
/**
 * Bug Condition Exploration Test — Person 3 Hacker C2 Dashboard
 *
 * This script asserts the EXPECTED SPEC STATE of the codebase.
 * On UNFIXED code, these assertions FAIL — that failure CONFIRMS the bug exists.
 * After the fix is applied (Tasks 3.x), re-running this script should produce ALL PASS.
 *
 * Task 1 of bugfix spec: person3-hacker-c2-restore
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const counterexamples = [];

function assert(name, condition, counterexample) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`         Counterexample: ${counterexample}`);
    failed++;
    counterexamples.push({ name, counterexample });
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

console.log('\n══════════════════════════════════════════════════════');
console.log('  BUG CONDITION EXPLORATION TEST — C2 Dashboard');
console.log('  Expected: ALL assertions FAIL on unfixed code');
console.log('══════════════════════════════════════════════════════\n');

// ── 1. types/exploit.ts ──────────────────────────────────────────────────────
console.log('── [1] types/exploit.ts ────────────────────────────────');
const exploitTs = readFile('types/exploit.ts');

assert(
  'ExploitStatus contains SUCCESS_STOLEN',
  exploitTs && exploitTs.includes("'SUCCESS_STOLEN'"),
  exploitTs
    ? `ExploitStatus found: ${(exploitTs.match(/ExploitStatus\s*=\s*[^;]+;/) || ['<not found>'])[0]}`
    : 'File not found'
);

assert(
  'ScenarioMode exported with LEGACY_VULNERABLE | AEGIS_SECURED',
  exploitTs && exploitTs.includes('ScenarioMode') && exploitTs.includes("'LEGACY_VULNERABLE'") && exploitTs.includes("'AEGIS_SECURED'"),
  exploitTs
    ? `Found: ${(exploitTs.match(/(?:Scenario|ScenarioMode)[^;]+;/) || ['<not found>'])[0]}`
    : 'File not found'
);

assert(
  'types/exploit.ts does NOT export PayloadType',
  exploitTs && !exploitTs.includes('PayloadType'),
  'PayloadType is present in types/exploit.ts — should not exist in spec'
);

assert(
  'types/exploit.ts does NOT export CSRFStatus',
  exploitTs && !exploitTs.includes('CSRFStatus'),
  'CSRFStatus is present in types/exploit.ts — should not exist in spec'
);

assert(
  'types/exploit.ts does NOT export VictimPayment',
  exploitTs && !exploitTs.includes('VictimPayment'),
  'VictimPayment is present in types/exploit.ts — should not exist in spec'
);

assert(
  'types/exploit.ts does NOT export CSRFInterceptState',
  exploitTs && !exploitTs.includes('CSRFInterceptState'),
  'CSRFInterceptState is present in types/exploit.ts — should not exist in spec'
);

assert(
  'types/exploit.ts does NOT export C2AttackState',
  exploitTs && !exploitTs.includes('C2AttackState'),
  'C2AttackState is present in types/exploit.ts — should not exist in spec'
);

// ── 2. hooks/useAgenticExploit.ts ────────────────────────────────────────────
console.log('\n── [2] hooks/useAgenticExploit.ts ──────────────────────');
const useAgenticExploit = readFile('hooks/useAgenticExploit.ts');

assert(
  'useAgenticExploit does NOT reference targetAmtdPort',
  useAgenticExploit && !useAgenticExploit.includes('targetAmtdPort'),
  'targetAmtdPort found in hooks/useAgenticExploit.ts — wrong AttackState shape'
);

assert(
  'useAgenticExploit does NOT reference payloadType',
  useAgenticExploit && !useAgenticExploit.includes('payloadType'),
  'payloadType found in hooks/useAgenticExploit.ts — wrong AttackState shape'
);

assert(
  'useAgenticExploit does NOT reference ambientCredentialsEnabled',
  useAgenticExploit && !useAgenticExploit.includes('ambientCredentialsEnabled'),
  'ambientCredentialsEnabled found in hooks/useAgenticExploit.ts — wrong AttackState shape'
);

// ── 3. app/page.tsx ──────────────────────────────────────────────────────────
console.log('\n── [3] app/page.tsx ─────────────────────────────────────');
const pageTsx = readFile('app/page.tsx');

assert(
  'app/page.tsx imports useAgenticExploit (not useC2Attack)',
  pageTsx && pageTsx.includes('useAgenticExploit') && !pageTsx.includes('useC2Attack'),
  pageTsx
    ? `Import found: ${(pageTsx.match(/import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"]/) || ['<not found>'])[0]}`
    : 'File not found'
);

assert(
  'app/page.tsx contains "SIMULATE CSRF ATTACK"',
  pageTsx && pageTsx.includes('SIMULATE CSRF ATTACK'),
  pageTsx
    ? `Button label found: ${(pageTsx.match(/LAUNCH[^'"<]+|SIMULATE[^'"<]+/) || ['<not found>'])[0]}`
    : 'File not found'
);

assert(
  'app/page.tsx contains SUCCESS_STOLEN (success modal branch)',
  pageTsx && pageTsx.includes('SUCCESS_STOLEN'),
  'SUCCESS_STOLEN not found in app/page.tsx — success modal branch is missing'
);

// ── 4. app/globals.css ───────────────────────────────────────────────────────
console.log('\n── [4] app/globals.css ──────────────────────────────────');
const globalsCss = readFile('app/globals.css');

assert(
  'app/globals.css does NOT contain c3-tokens.css import',
  globalsCss && !globalsCss.includes('c3-tokens.css'),
  globalsCss
    ? `Found import: ${(globalsCss.match(/@import[^;]+c3-tokens[^;]+;/) || ['<not found>'])[0]}`
    : 'File not found'
);

// ── 5. Extra files that should NOT exist ─────────────────────────────────────
console.log('\n── [5] Extra files (should NOT exist) ───────────────────');

assert(
  'app/CSRFInterceptConsole.tsx does NOT exist',
  !fileExists('app/CSRFInterceptConsole.tsx'),
  'app/CSRFInterceptConsole.tsx EXISTS — should be deleted (not in spec)'
);

assert(
  'hooks/useCSRFInterception.ts does NOT exist',
  !fileExists('hooks/useCSRFInterception.ts'),
  'hooks/useCSRFInterception.ts EXISTS — should be deleted (not in spec)'
);

assert(
  'hooks/useC2Attack.ts does NOT exist',
  !fileExists('hooks/useC2Attack.ts'),
  'hooks/useC2Attack.ts EXISTS — should be deleted (not in spec)'
);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n  COUNTEREXAMPLES FOUND (bug confirmed):');
  counterexamples.forEach((ce, i) => {
    console.log(`\n  [${i + 1}] ${ce.name}`);
    console.log(`      ${ce.counterexample}`);
  });
  console.log('\n  ✅ BUG CONDITION CONFIRMED — all failures above prove the drift exists.');
  console.log('     This is the EXPECTED outcome for Task 1 (unfixed code).');
  console.log('     Re-run after applying fixes (Tasks 3.x) to verify restoration.\n');
  process.exit(1); // non-zero exit to signal failures
} else {
  console.log('\n  ✅ ALL ASSERTIONS PASS — code matches spec state.');
  console.log('     (This means the fix has been applied successfully.)\n');
  process.exit(0);
}

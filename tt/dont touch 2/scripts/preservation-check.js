#!/usr/bin/env node
/**
 * Preservation Property Test — Task 2
 * Property 2: Unchanged Files Remain Byte-for-Byte Identical
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 *
 * Baseline SHA-256 hashes recorded from unfixed code BEFORE any fix is applied.
 * Re-reads each file and compares against the stored baseline.
 * PASS = hash matches baseline (file untouched)
 * FAIL = hash differs (file was modified)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Baseline hashes — recorded from unfixed code (do NOT edit these)
// ---------------------------------------------------------------------------
const BASELINE_HASHES = {
  'app/layout.tsx':
    'FDAA275275C21089D9D0E9A0EFC4574B72FB41A7D503F2FE1742C9D20AFA4A8D',
  'app/TerminalLogEntry.tsx':
    '400F798EC807B7B832E836802397334A5AA9F01307B7A936100CB7C28F38121E',
  'next.config.js':
    '3949DA87AEEC71D47BA47972D0AB38598982A38C02A5D3D81D23920195426834',
  'package.json':
    'EB0C02038266C044B86B27DC3DDD1351AA018786F84593A1EAB211B185D89BF6',
  'tailwind.config.js':
    '3B31BF30FC9B21D1216CAD179C517F92CD03EF1A06B98B944F8B7C079F6FDE8A',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 hash of a file's raw bytes.
 * @param {string} filePath  Absolute or relative path to the file.
 * @returns {string} Uppercase hex digest.
 */
function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

// ---------------------------------------------------------------------------
// Run preservation checks
// ---------------------------------------------------------------------------

const workspaceRoot = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

console.log('');
console.log('=== Preservation Property Tests ===');
console.log('Property 2: Unchanged Files Remain Byte-for-Byte Identical');
console.log('');

for (const [relPath, expectedHash] of Object.entries(BASELINE_HASHES)) {
  const absPath = path.join(workspaceRoot, relPath);

  let actualHash;
  try {
    actualHash = sha256File(absPath);
  } catch (err) {
    console.log(`  FAIL  ${relPath}`);
    console.log(`        ERROR: Could not read file — ${err.message}`);
    failed++;
    continue;
  }

  if (actualHash === expectedHash) {
    console.log(`  PASS  ${relPath}`);
    console.log(`        hash: ${actualHash}`);
    passed++;
  } else {
    console.log(`  FAIL  ${relPath}`);
    console.log(`        expected: ${expectedHash}`);
    console.log(`        actual:   ${actualHash}`);
    failed++;
  }
}

console.log('');
console.log(`Results: ${passed} PASS, ${failed} FAIL`);
console.log('');

if (failed === 0) {
  console.log('ALL PRESERVATION TESTS PASSED — baseline files are untouched.');
  process.exit(0);
} else {
  console.log('PRESERVATION TESTS FAILED — one or more baseline files were modified.');
  process.exit(1);
}

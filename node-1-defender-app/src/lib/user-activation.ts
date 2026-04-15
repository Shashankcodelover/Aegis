import type { DefenseLayerStatus } from '@/types/aegis-types'

/**
 * checkUserActivation — L1 Defense Gate
 *
 * Checks navigator.userActivation.isActive.
 * This API returns true only when the current task was initiated by a genuine
 * user gesture (click, keypress, etc.). Hidden iframes and automated scripts
 * cannot satisfy this check.
 */
export function checkUserActivation(): DefenseLayerStatus {
  // API not supported in this browser
  if (typeof navigator === 'undefined' || !navigator.userActivation) {
    return {
      layer: 'L1',
      passed: false,
      detail: 'navigator.userActivation API unsupported in this context',
    }
  }

  if (navigator.userActivation.isActive) {
    return {
      layer: 'L1',
      passed: true,
      detail: 'User activation confirmed — genuine gesture detected',
    }
  }

  return {
    layer: 'L1',
    passed: false,
    detail: 'navigator.userActivation.isActive = false — no user gesture detected',
  }
}

/**
 * checkUserActivationForced
 *
 * Used by the Attack Simulator to force an L1 failure regardless of real state.
 * Simulates what a CSRF attacker would see (no user activation).
 */
export function checkUserActivationForced(): DefenseLayerStatus {
  return {
    layer: 'L1',
    passed: false,
    detail: 'navigator.userActivation.isActive = false (simulated CSRF context)',
  }
}

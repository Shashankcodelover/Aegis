import type { EntropyPoint } from '@/types/aegis-types'

/**
 * generateZKProof
 *
 * Produces a SHA-256 hex digest of the serialized entropy trajectory.
 * Uses the browser-native Web Crypto API — zero extra dependencies.
 *
 * Returns "NULL_TRAJECTORY" when:
 *   - the input array is empty (no human interaction detected)
 *   - the Web Crypto API is unavailable
 */
export async function generateZKProof(points: EntropyPoint[]): Promise<string> {
  if (points.length === 0) return 'NULL_TRAJECTORY'

  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      console.warn('AEGIS: Web Crypto API unavailable')
      return 'NULL_TRAJECTORY'
    }

    const json    = JSON.stringify(points)
    const encoded = new TextEncoder().encode(json)
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded)

    // Convert ArrayBuffer → lowercase hex string (exactly 64 chars)
    return Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    console.warn('AEGIS: Web Crypto API unavailable')
    return 'NULL_TRAJECTORY'
  }
}

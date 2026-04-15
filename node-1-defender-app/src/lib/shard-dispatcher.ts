import type { TransactionPayload, ShardResult } from '@/types/aegis-types'

/**
 * dispatchShards — L4 Dual-Channel Defense
 *
 * Splits the transaction payload across two independent transport channels:
 *   Shard A → HTTP POST /api/transfer  (forgeable by CSRF attacker)
 *   Shard B → RTCDataChannel.send()    (NOT forgeable — out-of-band)
 *
 * Both must succeed. If either fails, the transaction is blocked.
 * A CSRF attacker can forge Shard A but cannot access the WebRTC channel.
 */
export async function dispatchShards(
  payload: TransactionPayload,
  channel: RTCDataChannel | null
): Promise<ShardResult> {
  // Guard: WebRTC channel must be open
  if (!channel || channel.readyState !== 'open') {
    const state = channel?.readyState ?? 'null'
    return {
      success: false,
      detail: `WebRTC channel not open: ${state}`,
    }
  }

  try {
    // Shard B — WebRTC (out-of-band, cannot be forged cross-origin)
    channel.send(JSON.stringify({ zkSignature: payload.zkProof }))

    // Shard A — HTTP POST (standard channel)
    const res = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:    payload.amount,
        recipient: payload.recipient,
        zkProof:   payload.zkProof,
      }),
    })

    if (!res.ok) {
      return {
        success: false,
        detail: `HTTP ${res.status} — Shard A rejected by server`,
      }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      detail: `Dispatch error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }
}

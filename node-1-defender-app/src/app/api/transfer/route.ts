import { NextRequest, NextResponse } from 'next/server'

/**
 * Mock Shard A endpoint.
 * In production this would be Node 2 (the bank server).
 * For the demo it validates the payload shape and returns approved.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      amount?: unknown
      recipient?: unknown
      zkProof?: unknown
    }

    if (
      typeof body.amount    !== 'number' ||
      typeof body.recipient !== 'string' ||
      typeof body.zkProof   !== 'string' ||
      body.zkProof === 'NULL_TRAJECTORY'
    ) {
      return NextResponse.json(
        { status: 'rejected', reason: 'Invalid or missing ZK-Proof' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: 'approved',
      shardA: true,
      zkProof: (body.zkProof as string).slice(0, 16) + '…',
    })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

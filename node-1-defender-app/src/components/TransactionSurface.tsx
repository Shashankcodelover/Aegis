'use client'

import { useState, useRef } from 'react'
import type { DefenseLayerStatus } from '@/types/aegis-types'
import { useEntropyCollector } from '@/hooks/useEntropyCollector'
import { checkUserActivation } from '@/lib/user-activation'
import { generateZKProof } from '@/lib/zk-proof'
import { dispatchShards } from '@/lib/shard-dispatcher'

interface TransactionSurfaceProps {
  onThreat: (log: DefenseLayerStatus[]) => void
  onZkProof: (proof: string) => void
  onLayersUpdate: (layers: DefenseLayerStatus[]) => void
  onPipelineStart?: (amount?: string) => void
  dataChannelRef: React.RefObject<RTCDataChannel | null>
  disabled: boolean
}

export default function TransactionSurface({
  onThreat,
  onZkProof,
  onLayersUpdate,
  onPipelineStart,
  dataChannelRef,
  disabled,
}: TransactionSurfaceProps) {
  const [amount, setAmount]         = useState('')
  const [recipient, setRecipient]   = useState('')
  const [amountErr, setAmountErr]   = useState('')
  const [recipientErr, setRecipientErr] = useState('')
  const [processing, setProcessing] = useState(false)
  const [successProof, setSuccessProof] = useState<string | null>(null)

  const { getBuffer, clearBuffer } = useEntropyCollector()
  const payBtnRef = useRef<HTMLButtonElement>(null)

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(): boolean {
    let ok = true
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || !isFinite(num) || num <= 0) {
      setAmountErr('Enter a valid positive number')
      ok = false
    } else {
      setAmountErr('')
    }
    if (!recipient.trim()) {
      setRecipientErr('Recipient cannot be empty')
      ok = false
    } else {
      setRecipientErr('')
    }
    return ok
  }

  // ── AEGIS Defense Pipeline ──────────────────────────────────────────────
  async function handlePay() {
    if (!validate()) return
    setProcessing(true)
    setSuccessProof(null)
    onPipelineStart?.(amount)

    const traceLog: DefenseLayerStatus[] = []

    // L1 — UserActivation Gate
    const l1 = checkUserActivation()
    traceLog.push(l1)
    if (!l1.passed) {
      onLayersUpdate([l1])
      onThreat(traceLog)
      setProcessing(false)
      return
    }

    // L2 — Entropy check
    const buffer = getBuffer()
    const l2: DefenseLayerStatus = {
      layer: 'L2',
      passed: buffer.length > 0,
      detail: buffer.length > 0
        ? `${buffer.length} entropy points captured in 500ms window`
        : 'Entropy buffer empty — move mouse before submitting',
    }
    traceLog.push(l2)
    if (!l2.passed) {
      onThreat(traceLog)
      setProcessing(false)
      return
    }

    // L3 — ZK-Behavioral Proof
    const zkProof = await generateZKProof([...buffer])
    const l3: DefenseLayerStatus = {
      layer: 'L3',
      passed: zkProof !== 'NULL_TRAJECTORY',
      detail: zkProof !== 'NULL_TRAJECTORY'
        ? `ZK-Proof: ${zkProof.slice(0, 16)}…`
        : 'ZK-Proof = NULL_TRAJECTORY — no entropy signature',
    }
    traceLog.push(l3)
    onZkProof(zkProof)
    if (!l3.passed) {
      onThreat(traceLog)
      setProcessing(false)
      return
    }

    // L4 — Dual-Channel Shard Dispatch
    const result = await dispatchShards(
      { amount: parseFloat(amount), recipient: recipient.trim(), zkProof },
      dataChannelRef.current
    )
    const l4: DefenseLayerStatus = {
      layer: 'L4',
      passed: result.success,
      detail: result.success
        ? 'Shard A (HTTP) + Shard B (WebRTC) — both channels confirmed'
        : result.detail ?? 'Dual-channel dispatch failed',
    }
    traceLog.push(l4)

    // L5 — always passes (visualization layer)
    const l5: DefenseLayerStatus = {
      layer: 'L5',
      passed: true,
      detail: 'Threat visualization active',
    }
    traceLog.push(l5)

    onLayersUpdate(traceLog)

    if (!l4.passed) {
      onThreat(traceLog)
      setProcessing(false)
      return
    }

    // ✅ All layers passed
    clearBuffer()
    setSuccessProof(zkProof)
    setAmount('')
    setRecipient('')
    setProcessing(false)
  }

  if (successProof) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-green-400 text-2xl">✦</span>
          <h2 className="text-lg font-bold text-green-300">Transaction Approved</h2>
        </div>
        <p className="text-xs text-slate-400 font-mono">ZK-PROOF VERIFIED</p>
        <p className="text-xs font-mono text-cyan-300 break-all">{successProof}</p>
        <button
          onClick={() => setSuccessProof(null)}
          className="mt-2 text-xs font-mono text-slate-400 hover:text-white underline"
        >
          New transaction
        </button>
      </div>
    )
  }

  return (
    <section
      className={`glass-card p-6 flex flex-col gap-5 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      aria-label="Protected transaction form"
    >
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Secure Transfer</h2>
        <p className="text-xs text-slate-500 font-mono">
          Protected by AEGIS — move mouse before submitting
        </p>
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono text-slate-400" htmlFor="amount">
          AMOUNT
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
        />
        {amountErr && (
          <p className="text-xs text-red-400 font-mono">{amountErr}</p>
        )}
      </div>

      {/* Recipient */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono text-slate-400" htmlFor="recipient">
          RECIPIENT
        </label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="wallet_id or address"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
        />
        {recipientErr && (
          <p className="text-xs text-red-400 font-mono">{recipientErr}</p>
        )}
      </div>

      {/* PAY button */}
      <button
        ref={payBtnRef}
        onClick={handlePay}
        disabled={processing}
        className={`w-full py-3 rounded-xl font-mono font-bold text-sm tracking-wider transition-all duration-200 ${
          processing
            ? 'opacity-50 cursor-not-allowed bg-cyan-900/30 text-cyan-600'
            : 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 glow-green'
        }`}
      >
        {processing ? '⟳ VERIFYING…' : '▶ PAY'}
      </button>

      <p className="text-xs text-slate-600 font-mono text-center">
        L1 → L2 → L3 → L4 pipeline active
      </p>
    </section>
  )
}

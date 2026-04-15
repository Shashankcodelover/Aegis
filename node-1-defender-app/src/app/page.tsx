'use client'

import { useState, useRef, useCallback } from 'react'
import AegisDashboard from '@/components/AegisDashboard'
import TransactionSurface from '@/components/TransactionSurface'
import DualTunnelVisualizer from '@/components/DualTunnelVisualizer'
import SimulationControls from '@/components/SimulationControls'
import AttackResultPanel from '@/components/AttackResultPanel'
import type { DefenseLayerStatus, SimulationPhase } from '@/types/aegis-types'
import { SIMULATION_PHASES } from '@/types/aegis-types'
import type { TunnelState, TunnelEvent } from '@/components/DualTunnelVisualizer'
import { generateZKProof } from '@/lib/zk-proof'

export default function HomePage() {
  // ── Result panel state (inline, no modal) ──────────────────────────────
  const [traceLog, setTraceLog]   = useState<DefenseLayerStatus[]>([])
  const [zkProof, setZkProof]     = useState('')
  const [simPhases, setSimPhases] = useState<SimulationPhase[] | undefined>()
  const [outcome, setOutcome]     = useState<'success' | 'blocked' | null>(null)

  // ── Tunnel visualizer ───────────────────────────────────────────────────
  const [tunnelState, setTunnelState]   = useState<TunnelState>('idle')
  const [tunnelEvents, setTunnelEvents] = useState<TunnelEvent[]>([])
  const [tunnelAmount, setTunnelAmount] = useState('')
  const [simRunning, setSimRunning]     = useState(false)

  // ── Shared refs from AegisDashboard ────────────────────────────────────
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const setLayersRef   = useRef<((l: DefenseLayerStatus[]) => void) | null>(null)
  const setZkProofRef  = useRef<((v: string) => void) | null>(null)

  const addEvent = useCallback((msg: string, type: TunnelEvent['type'] = 'info') => {
    setTunnelEvents(prev => [...prev.slice(-80), { ts: Date.now(), msg, type }])
  }, [])

  const handleReady = useCallback(
    (
      ref: React.RefObject<RTCDataChannel | null>,
      setZk: (v: string) => void,
      setLayers: (l: DefenseLayerStatus[]) => void
    ) => {
      Object.assign(dataChannelRef, ref)
      setLayersRef.current  = setLayers
      setZkProofRef.current = setZk
      addEvent('AEGIS engine initialized — WebRTC loopback establishing…', 'info')
    },
    [addEvent]
  )

  // ── Called when any pipeline detects a threat ───────────────────────────
  // No modal — just update inline result panel
  const handleThreat = useCallback(
    (log: DefenseLayerStatus[], phases?: SimulationPhase[]) => {
      setTraceLog(log)
      setSimPhases(phases)
      setOutcome('blocked')
      setTunnelState('blocked')
      const blocked = log.find(l => !l.passed)
      if (blocked) {
        addEvent(`🛑 BLOCKED at ${blocked.layer} — ${blocked.detail}`, 'error')
        addEvent('⚡ AEGIS intercepted forged request', 'error')
        addEvent('↩ Amount returned to sender — transaction voided', 'warn')
      }
    },
    [addEvent]
  )

  const handleZkProof = useCallback((proof: string) => {
    setZkProof(proof)
    setZkProofRef.current?.(proof)
    if (proof === 'NULL_TRAJECTORY') {
      addEvent('ZK-Proof = NULL_TRAJECTORY — no entropy signature', 'error')
    } else {
      addEvent(`ZK-Proof generated: ${proof.slice(0, 16)}…`, 'info')
    }
  }, [addEvent])

  const handleLayersUpdate = useCallback((layers: DefenseLayerStatus[]) => {
    setLayersRef.current?.(layers)
    const allPassed = layers.every(l => l.passed)
    if (allPassed) {
      setTunnelState('success')
      setOutcome('success')
      setTraceLog(layers)
      setSimPhases(undefined)
      addEvent('✦ Shard A (HTTP POST) — server confirmed receipt', 'success')
      addEvent('✦ Shard B (WebRTC OOB) — out-of-band channel confirmed', 'success')
      addEvent(`✦ Amount ₹${tunnelAmount} received by bank (Node 2) ✅`, 'success')
      setTimeout(() => setTunnelState('idle'), 4000)
    }
  }, [addEvent, tunnelAmount])

  const handlePipelineStart = useCallback((amt?: string) => {
    setTunnelState('sending')
    setTunnelEvents([])
    setOutcome(null)
    setTraceLog([])
    if (amt) setTunnelAmount(amt)
    addEvent('▶ Pipeline initiated — L1 UserActivation check…', 'info')
    addEvent('▶ Collecting entropy buffer (500ms window)…', 'info')
    addEvent('▶ Generating ZK-Behavioral Proof via SHA-256…', 'info')
    addEvent('▶ Splitting payload → Shard A (HTTP) + Shard B (WebRTC)…', 'info')
  }, [addEvent])

  const handleReset = useCallback(() => {
    setOutcome(null)
    setTraceLog([])
    setSimPhases(undefined)
    setZkProof('')
    setTunnelState('idle')
    setTunnelEvents([])
    setSimRunning(false)
  }, [])

  // ── Simulate secure transfer ────────────────────────────────────────────
  const handleSimulateSuccess = useCallback(async () => {
    if (simRunning) return
    setSimRunning(true)
    const demoAmount = '1,500'
    setTunnelAmount(demoAmount)
    setTunnelEvents([])
    setOutcome(null)
    setTraceLog([])
    setTunnelState('sending')
    setZkProof('')

    addEvent('▶ [DEMO] Secure transfer initiated', 'info')
    addEvent('▶ L1 UserActivation — genuine gesture confirmed', 'info')
    addEvent('▶ Entropy buffer: 42 points captured (500ms window)', 'info')

    await new Promise(r => setTimeout(r, 600))
    const fakePoints = Array.from({ length: 42 }, (_, i) => ({
      x: i * 3, y: i * 2, t: Date.now() - (41 - i) * 10,
    }))
    const proof = await generateZKProof(fakePoints)
    setZkProof(proof)
    setZkProofRef.current?.(proof)
    addEvent(`▶ ZK-Proof: ${proof.slice(0, 16)}…`, 'info')
    addEvent('▶ Dispatching Shard A → HTTP POST /api/transfer', 'info')
    addEvent('▶ Dispatching Shard B → RTCDataChannel (out-of-band)', 'info')

    await new Promise(r => setTimeout(r, 1800))

    const successLayers: DefenseLayerStatus[] = [
      { layer: 'L1', passed: true, detail: 'User activation confirmed — genuine gesture' },
      { layer: 'L2', passed: true, detail: '42 entropy points captured in 500ms window' },
      { layer: 'L3', passed: true, detail: `ZK-Proof: ${proof.slice(0, 16)}…` },
      { layer: 'L4', passed: true, detail: 'Shard A (HTTP) + Shard B (WebRTC) both confirmed' },
      { layer: 'L5', passed: true, detail: 'Threat visualization active' },
    ]
    setLayersRef.current?.(successLayers)
    setTraceLog(successLayers)
    setTunnelState('success')
    setOutcome('success')

    addEvent('✦ Shard A (HTTP POST) — server confirmed receipt', 'success')
    addEvent('✦ Shard B (WebRTC OOB) — out-of-band channel confirmed', 'success')
    addEvent(`✦ Amount ₹${demoAmount} received by bank (Node 2) ✅`, 'success')

    setTimeout(() => {
      setTunnelState('idle')
      setSimRunning(false)
    }, 4000)
  }, [simRunning, addEvent])

  // ── Simulate CSRF attack ────────────────────────────────────────────────
  const handleSimulateAttack = useCallback(async () => {
    if (simRunning) return
    setSimRunning(true)
    const demoAmount = '99,999'
    setTunnelAmount(demoAmount)
    setTunnelEvents([])
    setOutcome(null)
    setTraceLog([])
    setZkProof('NULL_TRAJECTORY')

    addEvent('☠ [ATTACKER] Scanning target — found SameSite=None cookie', 'error')
    addEvent(`☠ [ATTACKER] Forging POST /api/transfer { amount: 99999 }`, 'error')
    addEvent('☠ [ATTACKER] Injecting via hidden <iframe> cross-origin…', 'error')

    await new Promise(r => setTimeout(r, 400))
    setTunnelState('sending')

    await new Promise(r => setTimeout(r, 900))
    setTunnelState('blocked')

    const attackLayers: DefenseLayerStatus[] = [
      { layer: 'L1', passed: false, detail: 'navigator.userActivation.isActive = false (CSRF context)' },
      { layer: 'L2', passed: false, detail: 'Entropy buffer empty — no mouse trajectory' },
      { layer: 'L3', passed: false, detail: 'ZK-Proof = NULL_TRAJECTORY' },
      { layer: 'L4', passed: false, detail: 'WebRTC Shard B missing — asymmetric transport failure' },
    ]
    setLayersRef.current?.(attackLayers)
    setTraceLog(attackLayers)
    setSimPhases(SIMULATION_PHASES)
    setOutcome('blocked')

    addEvent('🛑 AEGIS L1: navigator.userActivation.isActive = false → BLOCKED', 'error')
    addEvent('🛑 AEGIS L3: ZK-Proof = NULL_TRAJECTORY → No entropy signature', 'error')
    addEvent('🛑 AEGIS L4: WebRTC Shard B missing → Asymmetric transport failure', 'error')
    addEvent('⚡ AEGIS intercepted forged request — all channels rejected', 'error')
    addEvent(`↩ Amount ₹${demoAmount} returned to sender — transaction voided`, 'warn')

    setTimeout(() => setSimRunning(false), 500)
  }, [simRunning, addEvent])

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* ── Header ── */}
      <header className="mb-6 text-center">
        <p className="text-xs font-mono text-slate-600 tracking-widest uppercase">
          Node 1 — Defender
        </p>
        <h1 className="text-3xl font-bold text-white tracking-tight mt-1">AEGIS</h1>
        <p className="text-sm text-slate-500 mt-1">
          Zero-Knowledge Behavioral Proof CSRF Defense System
        </p>
        <p className="text-[10px] font-mono text-slate-700 mt-1">
          Dual-Channel Payload Sharding · ZK-Behavioral Proof · WebRTC Out-of-Band
        </p>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col gap-5">

        {/* 1. Dual-Tunnel Visualizer — always visible, full width */}
        <DualTunnelVisualizer
          state={tunnelState}
          events={tunnelEvents}
          zkProof={zkProof}
          amount={tunnelAmount}
        />

        {/* 2. Simulation buttons — one click, no form needed */}
        <SimulationControls
          onSimulateSuccess={handleSimulateSuccess}
          onSimulateAttack={handleSimulateAttack}
          disabled={simRunning}
        />

        {/* 3. Inline result panel — appears after any simulation, no modal */}
        {outcome && (
          <AttackResultPanel
            traceLog={traceLog}
            zkProof={zkProof}
            simulationPhases={simPhases}
            outcome={outcome}
            amount={tunnelAmount}
            onReset={handleReset}
          />
        )}

        {/* 4. Dashboard + Transaction — always visible, never locked */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <AegisDashboard
            onThreat={handleThreat}
            onReady={handleReady}
          />
          <TransactionSurface
            onThreat={handleThreat}
            onZkProof={handleZkProof}
            onLayersUpdate={handleLayersUpdate}
            onPipelineStart={handlePipelineStart}
            dataChannelRef={dataChannelRef}
            disabled={false}
          />
        </div>

        {/* 5. How it works — always visible reference */}
        <div className="glass-card p-5">
          <p className="text-xs font-mono text-slate-400 tracking-widest uppercase mb-4">
            How AEGIS Works — Signal Flow Reference
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Normal flow */}
            <div>
              <p className="text-xs font-mono text-green-400 font-bold mb-2">
                ✦ Secure Transfer Flow
              </p>
              <ol className="text-[10px] font-mono text-slate-400 space-y-1.5">
                <li><span className="text-green-500">1.</span> User moves mouse → entropy buffer fills (500ms)</li>
                <li><span className="text-green-500">2.</span> User clicks PAY → L1 checks <code className="text-cyan-400">navigator.userActivation.isActive</code></li>
                <li><span className="text-green-500">3.</span> L2 verifies entropy buffer is non-empty</li>
                <li><span className="text-green-500">4.</span> L3 generates ZK-Proof = SHA-256(trajectory)</li>
                <li><span className="text-green-500">5.</span> Shard A → HTTP POST /api/transfer &#123; zkProof &#125;</li>
                <li><span className="text-green-500">6.</span> Shard B → RTCDataChannel.send() &#123; zkSignature &#125;</li>
                <li><span className="text-green-500">7.</span> Bank validates BOTH channels → ✅ Amount received</li>
              </ol>
            </div>

            {/* Attack flow */}
            <div>
              <p className="text-xs font-mono text-red-400 font-bold mb-2">
                🛑 CSRF Attack Flow
              </p>
              <ol className="text-[10px] font-mono text-slate-400 space-y-1.5">
                <li><span className="text-red-500">1.</span> Attacker finds SameSite=None session cookie</li>
                <li><span className="text-red-500">2.</span> Forges POST via hidden &lt;iframe&gt; cross-origin</li>
                <li><span className="text-red-500">3.</span> L1 fails — no real user gesture in CSRF context</li>
                <li><span className="text-red-500">4.</span> L3 fails — ZK-Proof = NULL_TRAJECTORY (no entropy)</li>
                <li><span className="text-red-500">5.</span> L4 fails — attacker cannot access WebRTC channel</li>
                <li><span className="text-red-500">6.</span> AEGIS blocks all channels simultaneously</li>
                <li><span className="text-red-500">7.</span> ↩ Amount returned to sender — transaction voided</li>
              </ol>
            </div>
          </div>

          {/* Defense layers table */}
          <div className="mt-5 border-t border-white/5 pt-4">
            <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-3">
              Defense Layers
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {[
                { l: 'L1', name: 'UserActivation', defeats: 'Scripts, iframes' },
                { l: 'L2', name: 'Entropy Buffer', defeats: 'Ghost clicks' },
                { l: 'L3', name: 'ZK-Proof', defeats: 'Replay attacks' },
                { l: 'L4', name: 'Dual-Channel', defeats: 'Cross-origin CSRF' },
                { l: 'L5', name: 'Visualization', defeats: 'Demo impact' },
              ].map(({ l, name, defeats }) => (
                <div key={l} className="bg-white/3 rounded-lg border border-white/5 p-2.5">
                  <p className="text-[10px] font-mono text-cyan-400 font-bold">{l}</p>
                  <p className="text-[10px] font-mono text-slate-300 mt-0.5">{name}</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-1">Defeats: {defeats}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}

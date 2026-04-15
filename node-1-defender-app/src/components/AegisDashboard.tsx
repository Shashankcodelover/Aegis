'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import DefenseLayerCard from './DefenseLayerCard'
import type { DefenseLayerStatus, SimulationPhase } from '@/types/aegis-types'
import { SIMULATION_PHASES } from '@/types/aegis-types'
import { checkUserActivation } from '@/lib/user-activation'
import { generateZKProof } from '@/lib/zk-proof'

// Default layer statuses shown on load (all inactive until user interacts)
const DEFAULT_LAYERS: DefenseLayerStatus[] = [
  { layer: 'L1', passed: false, detail: 'Awaiting user interaction' },
  { layer: 'L2', passed: false, detail: 'Entropy buffer empty' },
  { layer: 'L3', passed: false, detail: 'No ZK-Proof generated' },
  { layer: 'L4', passed: false, detail: 'WebRTC channel initializing' },
  { layer: 'L5', passed: true,  detail: 'Threat visualization ready' },
]

interface AegisDashboardProps {
  onThreat: (log: DefenseLayerStatus[], phases?: SimulationPhase[]) => void
  onPipelineStart?: () => void
  /** Called by parent to expose dataChannelRef and zkProof setter */
  onReady?: (ref: React.RefObject<RTCDataChannel | null>, setZk: (v: string) => void, setLayers: (l: DefenseLayerStatus[]) => void) => void
}

export default function AegisDashboard({ onThreat, onReady }: AegisDashboardProps) {
  const [layers, setLayers] = useState<DefenseLayerStatus[]>(DEFAULT_LAYERS)
  const [zkProof, setZkProof] = useState<string>('')
  const [rtcState, setRtcState] = useState<string>('connecting')
  const [simRunning, setSimRunning] = useState(false)

  // useRef — no re-renders on channel state changes
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  // Expose refs/setters to parent (HomePage) so TransactionSurface can use them
  useEffect(() => {
    if (onReady) onReady(dataChannelRef, setZkProof, setLayers)
  }, [onReady])

  // ── Loopback RTCPeerConnection (demo) ──────────────────────────────────
  useEffect(() => {
    let pc1: RTCPeerConnection | null = null
    let pc2: RTCPeerConnection | null = null

    async function setupLoopback() {
      try {
        pc1 = new RTCPeerConnection()
        pc2 = new RTCPeerConnection()

        // ICE candidate exchange
        pc1.onicecandidate = (e) => { if (e.candidate) pc2?.addIceCandidate(e.candidate) }
        pc2.onicecandidate = (e) => { if (e.candidate) pc1?.addIceCandidate(e.candidate) }

        const channel = pc1.createDataChannel('aegis-shard-b')
        dataChannelRef.current = channel

        channel.onopen  = () => {
          setRtcState('open')
          setLayers(prev => prev.map(l =>
            l.layer === 'L4' ? { ...l, passed: true, detail: 'WebRTC channel open' } : l
          ))
        }
        channel.onclose = () => setRtcState('closed')
        channel.onerror = () => setRtcState('failed')

        const offer = await pc1.createOffer()
        await pc1.setLocalDescription(offer)
        await pc2.setRemoteDescription(offer)

        const answer = await pc2.createAnswer()
        await pc2.setLocalDescription(answer)
        await pc1.setRemoteDescription(answer)

        pcRef.current = pc1
      } catch {
        setRtcState('failed')
        setLayers(prev => prev.map(l =>
          l.layer === 'L4' ? { ...l, passed: false, detail: 'WebRTC setup failed' } : l
        ))
      }
    }

    setupLoopback()

    return () => {
      dataChannelRef.current?.close()
      pc1?.close()
      pc2?.close()
      dataChannelRef.current = null
      pcRef.current = null
    }
  }, [])

  // ── System status ──────────────────────────────────────────────────────
  const inactiveCount = layers.filter(l => !l.passed).length
  const isProtected   = inactiveCount === 0

  // ── Simulate Attack ────────────────────────────────────────────────────
  const handleSimulateAttack = useCallback(async () => {
    if (simRunning) return
    setSimRunning(true)

    // Force L1 failure (no userActivation)
    const l1: DefenseLayerStatus = {
      layer: 'L1', passed: false,
      detail: 'navigator.userActivation.isActive = false (simulated)',
    }
    // Force L2 failure (empty buffer)
    const l2: DefenseLayerStatus = {
      layer: 'L2', passed: false,
      detail: 'Entropy buffer empty — no mouse trajectory',
    }
    // Force L3 failure (NULL_TRAJECTORY)
    const zkNull = await generateZKProof([])
    const l3: DefenseLayerStatus = {
      layer: 'L3', passed: false,
      detail: `ZK-Proof = ${zkNull}`,
    }
    // Force L4 failure (no OOB channel)
    const l4: DefenseLayerStatus = {
      layer: 'L4', passed: false,
      detail: 'WebRTC Shard B missing — asymmetric transport failure',
    }

    const traceLog: DefenseLayerStatus[] = [l1, l2, l3, l4]

    // Small delay so button feedback is visible before modal fires
    await new Promise(r => setTimeout(r, 200))

    onThreat(traceLog, SIMULATION_PHASES)
    setSimRunning(false)
  }, [simRunning, onThreat])
  return (
    <aside className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold tracking-tight text-white">
            AEGIS
          </h1>
          <span
            className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${
              isProtected
                ? 'bg-green-500/20 text-green-300 glow-green'
                : 'bg-amber-500/20 text-amber-300 glow-amber'
            }`}
          >
            {isProtected ? '● PROTECTED' : `⚠ DEGRADED (${inactiveCount})`}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          Zero-Knowledge Behavioral Proof CSRF Defense — Node 1
        </p>
      </div>

      {/* ── Defense Layers ── */}
      <div className="flex flex-col gap-3">
        {layers.map(s => (
          <DefenseLayerCard key={s.layer} status={s} />
        ))}
      </div>

      {/* ── ZK Proof + WebRTC state ── */}
      <div className="glass-card p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-slate-500 font-mono mb-1">LAST ZK-PROOF</p>
          <p className="text-xs font-mono text-cyan-300 break-all">
            {zkProof ? zkProof.slice(0, 16) + '…' : 'AWAITING ENTROPY'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-mono mb-1">WEBRTC CHANNEL</p>
          <p className={`text-xs font-mono font-bold ${
            rtcState === 'open'       ? 'text-green-400' :
            rtcState === 'failed'     ? 'text-red-400'   :
            rtcState === 'closed'     ? 'text-slate-400' :
                                        'text-amber-400'
          }`}>
            {rtcState.toUpperCase()}
          </p>
        </div>
      </div>

      {/* ── Simulate Attack ── */}
      <button
        onClick={handleSimulateAttack}
        disabled={simRunning}
        title="For demonstration purposes only"
        className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-sm tracking-wider transition-all duration-200 border ${
          simRunning
            ? 'opacity-50 cursor-not-allowed border-red-800 text-red-800'
            : 'border-red-500/60 text-red-400 hover:bg-red-500/10 glow-red'
        }`}
      >
        {simRunning ? '⟳ SIMULATING…' : '⚡ SIMULATE CSRF ATTACK'}
        <span className="block text-xs font-normal text-red-600 mt-0.5">
          demo only
        </span>
      </button>
    </aside>
  )
}

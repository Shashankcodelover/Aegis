'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type TunnelState = 'idle' | 'sending' | 'success' | 'blocked'

export interface TunnelEvent {
  ts: number
  msg: string
  type: 'info' | 'success' | 'error' | 'warn'
}

interface DualTunnelVisualizerProps {
  state: TunnelState
  events: TunnelEvent[]
  zkProof: string
  amount?: string
}

// ── Canvas ─────────────────────────────────────────────────────────────────
const W = 820
const H = 240

const N = {
  client:   { x: 65,  y: 120 },
  splitter: { x: 210, y: 120 },
  shardA:   { x: 400, y: 52  },
  shardB:   { x: 400, y: 188 },
  aegis:    { x: 590, y: 120 },
  bank:     { x: 740, y: 120 },
}

const SEGS = {
  inbound:  { p0: N.client,   cp: { x: 137, y: 120 }, p1: N.splitter },
  splitA:   { p0: N.splitter, cp: { x: 305, y: 28  }, p1: N.shardA   },
  splitB:   { p0: N.splitter, cp: { x: 305, y: 212 }, p1: N.shardB   },
  mergeA:   { p0: N.shardA,   cp: { x: 495, y: 28  }, p1: N.aegis    },
  mergeB:   { p0: N.shardB,   cp: { x: 495, y: 212 }, p1: N.aegis    },
  outbound: { p0: N.aegis,    cp: { x: 665, y: 120 }, p1: N.bank     },
  returnC:  { p0: N.aegis,    cp: { x: 400, y: 120 }, p1: N.client   },
  hackInfo: { p0: N.aegis,    cp: { x: 665, y: 90  }, p1: N.bank     },
}

type SegName = keyof typeof SEGS

interface Packet {
  id: number
  seg: SegName
  t: number
  speed: number
  done: boolean
  nextSeg?: SegName
  color: string
  r: number
  label: string
  labelColor?: string
}

let _pid = 0
function mkPkt(
  seg: SegName, speed: number, label: string,
  color: string, r = 5, nextSeg?: SegName, labelColor?: string
): Packet {
  return { id: _pid++, seg, t: 0, speed, done: false, nextSeg, color, r, label, labelColor }
}

function bezier(
  seg: { p0: { x: number; y: number }; cp: { x: number; y: number }; p1: { x: number; y: number } },
  t: number
) {
  const mt = 1 - t
  return {
    x: mt * mt * seg.p0.x + 2 * mt * t * seg.cp.x + t * t * seg.p1.x,
    y: mt * mt * seg.p0.y + 2 * mt * t * seg.cp.y + t * t * seg.p1.y,
  }
}

function segPath(seg: (typeof SEGS)[SegName]) {
  return `M ${seg.p0.x} ${seg.p0.y} Q ${seg.cp.x} ${seg.cp.y} ${seg.p1.x} ${seg.p1.y}`
}

// ── SVG Node ───────────────────────────────────────────────────────────────
function SvgNode({ x, y, label, sub, color, pulse, icon, isLock }: {
  x: number; y: number; label: string; sub: string
  color: string; pulse?: boolean; icon?: string; isLock?: boolean
}) {
  return (
    <g>
      {pulse && (
        <circle cx={x} cy={y} r={24} fill="none" stroke={color} strokeWidth={1} opacity={0.3}>
          <animate attributeName="r" values="24;38;24" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}
      {isLock && (
        <circle cx={x} cy={y} r={22} fill="none" stroke={color}
          strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
      )}
      <circle cx={x} cy={y} r={19} fill="#060e1a" stroke={color} strokeWidth={2} />
      {icon
        ? <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={14}>{icon}</text>
        : <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fontFamily="monospace" fill={color} fontWeight="bold">{label}</text>
      }
      <text x={x} y={y + 12} textAnchor="middle" dominantBaseline="middle"
        fontSize={6.5} fontFamily="monospace" fill="#475569">{sub}</text>
    </g>
  )
}

// ── Packet renderer ────────────────────────────────────────────────────────
function PacketEl({ p }: { p: Packet }) {
  const seg = SEGS[p.seg]
  if (!seg) return null
  const pos = bezier(seg, Math.min(p.t, 1))
  const isBottom = p.seg === 'splitB' || p.seg === 'mergeB'
  const labelY = isBottom ? pos.y + p.r + 13 : pos.y - p.r - 6
  return (
    <g>
      <circle cx={pos.x} cy={pos.y} r={p.r + 5} fill={p.color} opacity={0.10} />
      <circle cx={pos.x} cy={pos.y} r={p.r} fill={p.color} opacity={0.95} />
      {p.label && (
        <text x={pos.x} y={labelY} textAnchor="middle"
          fontSize={9} fontFamily="monospace"
          fill={p.labelColor ?? p.color} fontWeight="bold">
          {p.label}
        </text>
      )}
    </g>
  )
}

// ── Amount bubble ──────────────────────────────────────────────────────────
function AmountBubble({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const w = Math.max(56, text.length * 7)
  return (
    <g>
      <rect x={x - w / 2} y={y - 11} width={w} height={20} rx={5}
        fill={color + '22'} stroke={color} strokeWidth={1} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fontFamily="monospace" fill={color} fontWeight="bold">{text}</text>
    </g>
  )
}

export default function DualTunnelVisualizer({ state, events, zkProof, amount }: DualTunnelVisualizerProps) {
  const packetsRef = useRef<Packet[]>([])
  const rafRef     = useRef<number>(0)
  const logRef     = useRef<HTMLDivElement>(null)
  const [, setTick] = useState(0)

  // ── RAF loop ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const next: Packet[] = []
    let changed = false
    for (const p of packetsRef.current) {
      if (p.done) continue
      p.t += p.speed
      if (p.t >= 1) {
        if (p.nextSeg) {
          p.seg = p.nextSeg
          p.t = 0
          p.nextSeg = undefined
          next.push(p)
        } else {
          p.done = true
        }
      } else {
        next.push(p)
      }
      changed = true
    }
    packetsRef.current = next
    if (changed) setTick(t => t + 1)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  // ── Packet sequences ──────────────────────────────────────────────────────
  const prevState = useRef<TunnelState>('idle')
  useEffect(() => {
    if (state === prevState.current) return
    prevState.current = state
    packetsRef.current = []

    // ── NORMAL FLOW ──────────────────────────────────────────────────────────
    // Timing: inbound(~900ms) → split both shards(~900ms each) → AEGIS validates → outbound
    if (state === 'sending') {
      const amtLabel = amount ? `₹${amount}` : 'TX_REQ'

      // Step 1 — TX_REQ: CLIENT → SPLITTER (~900ms at speed 0.014)
      packetsRef.current.push(mkPkt('inbound', 0.014, amtLabel, '#38bdf8', 5))

      // Step 2 — after inbound arrives at SPLITTER, split into HTTP + WebRTC
      setTimeout(() => {
        // HTTP shard travels top arc → AEGIS (~1100ms at speed 0.013)
        packetsRef.current.push(mkPkt('splitA', 0.013, 'HTTP', '#38bdf8', 4, 'mergeA'))
        // WebRTC shard travels bottom arc → AEGIS (~1300ms at speed 0.011)
        packetsRef.current.push(mkPkt('splitB', 0.011, 'WebRTC', '#a78bfa', 4, 'mergeB'))
      }, 950)

      // Step 3 — AEGIS validates BOTH shards, then sends to BANK
      // Wait for slower shard (WebRTC ~1300ms) + AEGIS processing delay (500ms)
      setTimeout(() => {
        packetsRef.current.push(mkPkt('outbound', 0.013, 'TX_OK', '#22c55e', 5))
      }, 3400)
    }

    // ── ATTACK FLOW ──────────────────────────────────────────────────────────
    // Timing: FORGED_REQ travels to SPLITTER → shards travel to AEGIS
    // AEGIS detects mismatch → waits full validation window → then returns
    if (state === 'blocked') {
      const amtLabel = amount ? `₹${amount}` : 'FORGED'

      // Step 1 — FORGED_REQ: CLIENT → SPLITTER (~1100ms at speed 0.011)
      packetsRef.current.push(mkPkt('inbound', 0.011, 'FORGED_REQ', '#f97316', 5))

      // Step 2 — forged shards travel toward AEGIS (they arrive but fail validation)
      setTimeout(() => {
        packetsRef.current.push(mkPkt('splitA', 0.012, 'HTTP', '#ef4444', 4, 'mergeA'))
        packetsRef.current.push(mkPkt('splitB', 0.010, 'NO_OOB', '#ef4444', 4, 'mergeB'))
      }, 1100)

      // Step 3 — AEGIS holds for full validation window (both shards must arrive)
      // Then: AMT_RETURN to CLIENT + HACK_INFO to BANK (no APPROVED ever sent)
      setTimeout(() => {
        packetsRef.current.push(mkPkt('returnC', 0.009, amtLabel, '#ef4444', 5))
      }, 3200)

      setTimeout(() => {
        packetsRef.current.push(mkPkt('hackInfo', 0.011, 'HACK_INFO', '#f97316', 3, undefined, '#f97316'))
      }, 3400)
    }
  }, [state, amount])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  const isActive  = state === 'sending'
  const isSuccess = state === 'success'
  const isBlocked = state === 'blocked'

  const pathA = isBlocked ? '#ef444444' : isActive ? '#38bdf8' : isSuccess ? '#22c55e' : '#1e293b'
  const pathB = isBlocked ? '#ef444444' : isActive ? '#a78bfa' : isSuccess ? '#22c55e' : '#1e293b'

  const clientColor   = isSuccess ? '#22c55e' : isActive ? '#38bdf8' : isBlocked ? '#ef4444' : '#334155'
  const splitterColor = isActive ? '#38bdf8' : isBlocked ? '#f97316' : '#334155'
  const shardAColor   = isBlocked ? '#ef4444' : isActive ? '#38bdf8' : isSuccess ? '#22c55e' : '#334155'
  const shardBColor   = isBlocked ? '#ef4444' : isActive ? '#a78bfa' : isSuccess ? '#22c55e' : '#334155'
  const aegisColor    = isBlocked ? '#ef4444' : isSuccess ? '#22c55e' : isActive ? '#38bdf8' : '#334155'
  const bankColor     = isSuccess ? '#22c55e' : '#1e293b'

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-mono text-slate-400 tracking-widest font-bold">
            DUAL-CHANNEL PAYLOAD SHARDING
          </p>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">
            CLIENT → SPLITTER → [HTTP + WebRTC] → AEGIS 🔒 → BANK
          </p>
        </div>
        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border transition-all duration-500 ${
          isBlocked ? 'border-red-500/60 text-red-400 bg-red-500/10 shadow-[0_0_14px_rgba(239,68,68,0.35)]' :
          isSuccess ? 'border-green-500/60 text-green-400 bg-green-500/10 shadow-[0_0_14px_rgba(34,197,94,0.35)]' :
          isActive  ? 'border-cyan-500/60 text-cyan-400 bg-cyan-500/10' :
                      'border-slate-700 text-slate-500'
        }`}>
          {isBlocked ? '🛑 BLOCKED AT AEGIS — AMT RETURNED'
           : isSuccess ? '✦ APPROVED — AMT RECEIVED BY BANK'
           : isActive  ? '⟳ TRANSMITTING…'
           :             '● IDLE'}
        </span>
      </div>

      {/* SVG */}
      <div className="w-full overflow-x-auto rounded-xl bg-black/40 border border-white/5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full"
          style={{ minWidth: 400, maxHeight: 240 }}
          aria-label="AEGIS dual-channel signal flow">

          {/* ── Static paths ── */}
          {/* CLIENT → SPLITTER */}
          <path d={segPath(SEGS.inbound)}
            stroke={isActive || isBlocked ? '#38bdf8' : '#1e293b'}
            strokeWidth={1.5} fill="none"
            strokeDasharray={isActive || isBlocked ? '5 3' : '0'} opacity={0.55} />

          {/* SPLITTER → SHARD A → AEGIS */}
          <path d={segPath(SEGS.splitA)} stroke={pathA} strokeWidth={1.5} fill="none" opacity={0.7} />
          <path d={segPath(SEGS.mergeA)} stroke={pathA} strokeWidth={1.5} fill="none" opacity={0.7} />

          {/* SPLITTER → SHARD B → AEGIS (dashed = WebRTC OOB) */}
          <path d={segPath(SEGS.splitB)} stroke={pathB} strokeWidth={1.5} fill="none"
            strokeDasharray="6 3" opacity={0.7} />
          <path d={segPath(SEGS.mergeB)} stroke={pathB} strokeWidth={1.5} fill="none"
            strokeDasharray="6 3" opacity={0.7} />

          {/* AEGIS → BANK (only lit on success) */}
          <path d={segPath(SEGS.outbound)}
            stroke={isSuccess ? '#22c55e' : '#1a2535'}
            strokeWidth={isSuccess ? 2 : 1.5} fill="none"
            strokeDasharray={isSuccess ? '0' : '4 4'}
            opacity={isSuccess ? 0.9 : 0.25} />

          {/* Return path (blocked) — AEGIS → CLIENT */}
          {isBlocked && (
            <path d={segPath(SEGS.returnC)} stroke="#ef4444"
              strokeWidth={1.5} fill="none" strokeDasharray="4 3" opacity={0.5} />
          )}

          {/* Hack info path — AEGIS → BANK (thin orange, blocked only) */}
          {isBlocked && (
            <path d={segPath(SEGS.hackInfo)} stroke="#f97316"
              strokeWidth={1} fill="none" strokeDasharray="3 4" opacity={0.4} />
          )}

          {/* ── Path labels ── */}
          <text x={305} y={14} textAnchor="middle" fontSize={8} fontFamily="monospace"
            fill={pathA} opacity={0.85}>HTTP POST /api/transfer</text>
          <text x={305} y={228} textAnchor="middle" fontSize={8} fontFamily="monospace"
            fill={pathB} opacity={0.85}>WebRTC OOB (RTCDataChannel)</text>

          {/* ── AEGIS block label ── */}
          {isBlocked && (
            <g>
              <rect x={N.aegis.x - 62} y={N.aegis.y - 44} width={124} height={18} rx={3}
                fill="#ef444418" stroke="#ef4444" strokeWidth={0.8} />
              <text x={N.aegis.x} y={N.aegis.y - 32} textAnchor="middle"
                fontSize={8} fontFamily="monospace" fill="#ef4444" fontWeight="bold">
                🔒 BLOCKED — NO SIGNAL TO BANK
              </text>
            </g>
          )}

          {/* ── Animated packets ── */}
          {packetsRef.current.map(p => <PacketEl key={p.id} p={p} />)}

          {/* ── Nodes ── */}
          <SvgNode x={N.client.x}   y={N.client.y}   label="CLIENT"   sub="Node 1"   color={clientColor}   pulse={isActive} icon="💻" />
          <SvgNode x={N.splitter.x} y={N.splitter.y} label="SPLIT"    sub="Splitter" color={splitterColor} pulse={isActive} />
          <SvgNode x={N.shardA.x}   y={N.shardA.y}   label="SHARD A"  sub="HTTP"     color={shardAColor} />
          <SvgNode x={N.shardB.x}   y={N.shardB.y}   label="SHARD B"  sub="WebRTC"   color={shardBColor} />
          <SvgNode x={N.aegis.x}    y={N.aegis.y}    label="AEGIS"    sub="Security" color={aegisColor}    pulse={isActive || isBlocked} icon="🔒" isLock />
          <SvgNode x={N.bank.x}     y={N.bank.y}     label="BANK"     sub="Node 2"   color={bankColor}     pulse={isSuccess} icon={isSuccess ? '🏦' : undefined} />

          {/* Bank dim when blocked */}
          {isBlocked && (
            <text x={N.bank.x} y={N.bank.y + 1} textAnchor="middle"
              dominantBaseline="middle" fontSize={10} opacity={0.15}>🏦</text>
          )}

          {/* ── ZK proof tag ── */}
          {zkProof && zkProof !== 'NULL_TRAJECTORY' && isActive && (
            <text x={N.shardA.x} y={N.shardA.y - 30} textAnchor="middle"
              fontSize={7} fontFamily="monospace" fill="#38bdf8" opacity={0.75}>
              zkp_{zkProof.slice(0, 10)}…
            </text>
          )}
          {zkProof === 'NULL_TRAJECTORY' && (
            <text x={N.shardA.x} y={N.shardA.y - 30} textAnchor="middle"
              fontSize={7.5} fontFamily="monospace" fill="#ef4444" fontWeight="bold">
              ✕ NULL_TRAJECTORY
            </text>
          )}

          {/* ── Amount bubbles ── */}
          {isSuccess && amount && (
            <AmountBubble x={N.bank.x} y={N.bank.y - 34} text={`₹${amount} ✦`} color="#22c55e" />
          )}
          {isBlocked && amount && (
            <AmountBubble x={N.client.x} y={N.client.y - 34} text={`₹${amount} ↩`} color="#ef4444" />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-cyan-400 font-bold">TX_REQ / HTTP</span> — normal signal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-violet-400 font-bold">WebRTC</span> — OOB channel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-orange-400 font-bold">FORGED_REQ</span> — attacker signal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
          <span className="text-red-400 font-bold">AMT_RETURN</span> — blocked, returned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-300" />
          <span className="text-orange-300 font-bold">HACK_INFO</span> — alert to bank
        </span>
      </div>

      {/* Live log */}
      <div>
        <p className="text-[10px] font-mono text-slate-600 mb-1 tracking-widest uppercase">Channel Log</p>
        <div ref={logRef}
          className="bg-black/60 rounded-lg border border-white/5 p-3 h-28 overflow-y-auto font-mono text-[10px] leading-5">
          {events.length === 0
            ? <span className="text-slate-700">Awaiting transaction…</span>
            : events.map((e, i) => (
              <div key={i} className={
                e.type === 'success' ? 'text-green-400' :
                e.type === 'error'   ? 'text-red-400'   :
                e.type === 'warn'    ? 'text-amber-400' : 'text-slate-400'
              }>
                <span className="text-slate-700 select-none mr-1">
                  [{new Date(e.ts).toISOString().slice(11, 23)}]
                </span>
                {e.msg}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

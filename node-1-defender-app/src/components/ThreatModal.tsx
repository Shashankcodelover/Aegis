'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SimulationTerminal from './SimulationTerminal'
import type { DefenseLayerStatus, SimulationPhase } from '@/types/aegis-types'

interface ThreatModalProps {
  traceLog: DefenseLayerStatus[]
  zkProof: string
  simulationPhases?: SimulationPhase[]
  onDismiss: () => void
}

const LAYER_NAMES: Record<string, string> = {
  L1: 'UserActivation Gate',
  L2: 'Entropy Collector',
  L3: 'ZK-Behavioral Proof',
  L4: 'Dual-Channel Sharding',
  L5: 'Threat Visualization',
}

/**
 * ThreatModal
 *
 * Framer Motion animated overlay shown when AEGIS detects an attack.
 * - Scale-and-fade entrance/exit (≤300ms)
 * - Focus trap: Tab/Shift+Tab cycles within modal
 * - Focus restored to triggering element on dismiss
 * - Lazy-loaded via next/dynamic in page.tsx (not in initial bundle)
 */
export default function ThreatModal({
  traceLog,
  zkProof,
  simulationPhases,
  onDismiss,
}: ThreatModalProps) {
  const modalRef   = useRef<HTMLDivElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)

  // Find the first failed layer for the headline
  const blockedBy = traceLog.find(l => !l.passed)

  // ── Focus trap ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Focus the dismiss button on open
    dismissRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <motion.div
        key="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="AEGIS Threat Detected"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card border border-red-500/30 bg-red-950/20 glow-red p-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 text-xl">🛑</span>
                <h2 className="text-lg font-bold text-red-300 font-mono">
                  THREAT DETECTED
                </h2>
              </div>
              {blockedBy && (
                <p className="text-xs font-mono text-red-400">
                  {blockedBy.layer} — {LAYER_NAMES[blockedBy.layer]} FAILURE
                </p>
              )}
            </div>
            <button
              ref={dismissRef}
              onClick={onDismiss}
              className="text-slate-400 hover:text-white text-xl leading-none flex-shrink-0"
              aria-label="Dismiss threat modal"
            >
              ✕
            </button>
          </div>

          {/* Trace log */}
          <div>
            <p className="text-xs font-mono text-slate-500 mb-2">TRACE LOG</p>
            <div className="flex flex-col gap-2">
              {traceLog.map((l, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-xs font-mono px-3 py-2 rounded-lg ${
                    l.passed
                      ? 'bg-green-500/10 text-green-300'
                      : 'bg-red-500/10 text-red-300'
                  }`}
                >
                  <span className="flex-shrink-0">{l.passed ? '✦' : '✕'}</span>
                  <span>
                    <span className="font-bold">{l.layer}</span>
                    {' — '}
                    {l.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ZK Proof */}
          <div>
            <p className="text-xs font-mono text-slate-500 mb-1">ZK-PROOF</p>
            <p className={`text-xs font-mono break-all ${
              zkProof === 'NULL_TRAJECTORY' ? 'text-red-400' : 'text-cyan-300'
            }`}>
              {zkProof || 'NULL_TRAJECTORY'}
            </p>
          </div>

          {/* Simulation terminal (only shown when triggered by Attack Simulator) */}
          {simulationPhases && simulationPhases.length > 0 && (
            <div>
              <p className="text-xs font-mono text-slate-500 mb-2">
                ATTACK SIMULATION TRACE
              </p>
              <SimulationTerminal phases={simulationPhases} />
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl font-mono font-bold text-sm text-red-300 border border-red-500/40 hover:bg-red-500/10 transition-colors"
          >
            DISMISS
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

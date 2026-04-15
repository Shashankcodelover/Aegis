'use client'

import type { SimulationPhase } from '@/types/aegis-types'

interface SimulationTerminalProps {
  phases: SimulationPhase[]
}

/**
 * SimulationTerminal
 *
 * Renders the 7-phase CSRF attack sequence as a terminal log.
 * Each line appears with a CSS-only typewriter animation — zero JS animation library.
 * Attacker lines: green (#22c55e)
 * AEGIS block lines: red (#ef4444)
 */
export default function SimulationTerminal({ phases }: SimulationTerminalProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/80 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs font-mono text-slate-500">
          aegis-threat-trace — bash
        </span>
      </div>

      {/* Terminal body */}
      <pre
        className="bg-black p-4 text-xs font-mono leading-6 overflow-x-auto"
        aria-label="Attack simulation trace log"
      >
        {phases.map((phase, i) => (
          <span
            key={i}
            className="terminal-line"
            style={
              {
                '--delay': `${phase.offsetMs}ms`,
                color: phase.type === 'attacker' ? '#22c55e' : '#ef4444',
              } as React.CSSProperties
            }
          >
            <span className="text-slate-600 select-none">
              [{String(phase.offsetMs).padStart(4, '0')}ms]&nbsp;
            </span>
            {phase.text}
            {'\n'}
          </span>
        ))}
      </pre>
    </div>
  )
}

'use client'

import type { DefenseLayerStatus } from '@/types/aegis-types'

const LAYER_LABELS: Record<string, string> = {
  L1: 'UserActivation Gate',
  L2: 'Entropy Collector',
  L3: 'ZK-Behavioral Proof',
  L4: 'Dual-Channel Sharding',
  L5: 'Threat Visualization',
}

interface DefenseLayerCardProps {
  status: DefenseLayerStatus
}

export default function DefenseLayerCard({ status }: DefenseLayerCardProps) {
  const { layer, passed, detail } = status
  const label = LAYER_LABELS[layer] ?? layer

  return (
    <div
      className={`glass-card p-4 flex items-start gap-3 transition-all duration-300 ${
        passed ? 'glow-green' : 'glow-red'
      }`}
    >
      {/* Status icon */}
      <span
        className={`mt-0.5 text-lg leading-none select-none ${
          passed ? 'text-green-400' : 'text-red-400'
        }`}
        aria-hidden="true"
      >
        {passed ? '✦' : '✕'}
      </span>

      <div className="flex-1 min-w-0">
        {/* Layer badge + name */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              passed
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {layer}
          </span>
          <span className="text-sm font-medium text-slate-200 truncate">
            {label}
          </span>
        </div>

        {/* Detail string */}
        <p className="text-xs text-slate-400 font-mono leading-relaxed break-words">
          {detail || (passed ? 'Active' : 'Inactive')}
        </p>
      </div>
    </div>
  )
}

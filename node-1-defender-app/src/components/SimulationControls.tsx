'use client'

interface SimulationControlsProps {
  onSimulateSuccess: () => void
  onSimulateAttack: () => void
  disabled: boolean
}

/**
 * SimulationControls
 *
 * Two prominent one-click buttons to trigger either scenario instantly:
 *   ✦ Simulate Secure Transfer  — normal flow, amount reaches bank
 *   ⚡ Simulate CSRF Attack      — attack flow, amount bounced back
 */
export default function SimulationControls({
  onSimulateSuccess,
  onSimulateAttack,
  disabled,
}: SimulationControlsProps) {
  return (
    <div className="glass-card p-4">
      <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-3">
        Quick Simulation Controls
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* ── Secure Transfer button ── */}
        <button
          onClick={onSimulateSuccess}
          disabled={disabled}
          className={`group relative flex flex-col items-center gap-2 py-4 px-5 rounded-xl border transition-all duration-200 ${
            disabled
              ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-600'
              : 'border-green-500/40 text-green-300 hover:bg-green-500/10 hover:border-green-400/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]'
          }`}
        >
          {/* Glow ring on hover */}
          <span className="text-2xl">✦</span>
          <span className="font-mono font-bold text-sm tracking-wide">
            Simulate Secure Transfer
          </span>
          <span className="text-[10px] font-mono text-slate-500 text-center leading-4">
            Both tunnels active · ZK-Proof valid<br />
            Amount reaches bank ✅
          </span>
          {/* Animated indicator */}
          <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            disabled ? 'bg-slate-700' : 'bg-green-500'
          }`}>
            {!disabled && (
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />
            )}
          </span>
        </button>

        {/* ── CSRF Attack button ── */}
        <button
          onClick={onSimulateAttack}
          disabled={disabled}
          className={`group relative flex flex-col items-center gap-2 py-4 px-5 rounded-xl border transition-all duration-200 ${
            disabled
              ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-600'
              : 'border-red-500/40 text-red-300 hover:bg-red-500/10 hover:border-red-400/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]'
          }`}
        >
          <span className="text-2xl">⚡</span>
          <span className="font-mono font-bold text-sm tracking-wide">
            Simulate CSRF Attack
          </span>
          <span className="text-[10px] font-mono text-slate-500 text-center leading-4">
            No entropy · NULL_TRAJECTORY<br />
            Amount bounced back 🛑
          </span>
          <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            disabled ? 'bg-slate-700' : 'bg-red-500'
          }`}>
            {!disabled && (
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
            )}
          </span>
        </button>

      </div>

      <p className="text-[9px] font-mono text-slate-700 text-center mt-3">
        For demonstration purposes only — simulates both AEGIS defense scenarios
      </p>
    </div>
  )
}

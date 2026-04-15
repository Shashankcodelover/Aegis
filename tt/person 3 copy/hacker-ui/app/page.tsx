'use client';

import { motion } from 'framer-motion';
import { Skull, Radio, Zap, ShieldOff, Terminal } from 'lucide-react';
import { useAgenticExploit } from '../hooks/useAgenticExploit';
import { useAegisSync } from '../hooks/useAegisSync';
import { TerminalLog } from '../components/TerminalLog';
import { FailureOverlay } from '../components/FailureOverlay';
import { SuccessOverlay } from '../components/SuccessOverlay';

export default function HackerDashboard() {
  const { state, runSimulation1, runSimulation2, reset, setScenario } = useAgenticExploit();
  useAegisSync(setScenario);

  const isRunning = state.status === 'ENUMERATING' || state.status === 'INJECTING';
  const isDone = state.status === 'SUCCESS_STOLEN' || state.status === 'FAILED_BLURRED';

  const statusLabel: Record<string, string> = {
    IDLE: 'STANDBY',
    ENUMERATING: 'ENUMERATING...',
    INJECTING: 'INJECTING PAYLOAD...',
    SUCCESS_STOLEN: 'FUNDS ACQUIRED',
    FAILED_BLURRED: 'ACCESS DENIED',
  };

  const statusColor: Record<string, string> = {
    IDLE: '#dc2626',
    ENUMERATING: '#facc15',
    INJECTING: '#fb923c',
    SUCCESS_STOLEN: '#4ade80',
    FAILED_BLURRED: '#f87171',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0000',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div style={{
        pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 5,
        background: 'repeating-linear-gradient(transparent 50%, rgba(0,0,0,0.12) 50%)',
        backgroundSize: '100% 3px',
      }} />

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '2px solid rgba(220,38,38,0.6)',
        background: 'rgba(10,0,0,0.95)',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 0 8px #dc2626)' }}
          >
            <Skull style={{ width: 32, height: 32, color: '#ef4444' }} strokeWidth={1.5} />
          </motion.div>
          <div>
            <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 900, letterSpacing: '0.25em', textShadow: '0 0 10px rgba(239,68,68,0.6)' }}>
              AGENTIC_SWARM_C2
            </div>
            <div style={{ color: '#9ca3af', fontSize: 10, letterSpacing: '0.15em', marginTop: 2 }}>
              STATUS: <span style={{ color: statusColor[state.status], fontWeight: 700 }}>{statusLabel[state.status]}</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
            border: state.scenario === 'AEGIS_SECURED' ? '1px solid rgba(239,68,68,0.7)' : '1px solid rgba(74,222,128,0.7)',
            color: state.scenario === 'AEGIS_SECURED' ? '#f87171' : '#4ade80',
            background: state.scenario === 'AEGIS_SECURED' ? 'rgba(60,0,0,0.5)' : 'rgba(0,40,0,0.5)',
          }}>
            {state.scenario === 'AEGIS_SECURED' ? '🛡 AEGIS: ACTIVE' : '⚡ AEGIS: OFFLINE'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div animate={{ opacity: [1, 0.1, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
              <Radio style={{ width: 14, height: 14, color: '#ef4444' }} />
            </motion.div>
            <span style={{ color: '#d1d5db', fontSize: 11 }}>TARGET: {state.targetUrl}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── ATTACK BUTTONS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* SIM 1 — No AEGIS */}
          <div style={{
            border: '1px solid rgba(74,222,128,0.4)',
            background: 'rgba(0,20,0,0.6)',
            padding: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Simulation 1 — No AEGIS
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.6 }}>
              Bank has no protection. Hacker forges a POST request with stolen cookies. Funds are stolen silently.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(74,222,128,0.2)', padding: '10px 14px', fontSize: 11, color: '#6b7280' }}>
              <div>AMOUNT: <span style={{ color: '#4ade80' }}>₹5,000</span></div>
              <div>TARGET: <span style={{ color: '#4ade80' }}>attacker_offshore_acct</span></div>
              <div>PROTECTION: <span style={{ color: '#f87171' }}>NONE</span></div>
            </div>
            <motion.button
              onClick={runSimulation1}
              disabled={isRunning || isDone}
              whileHover={!isRunning && !isDone ? { scale: 1.02, boxShadow: '0 0 30px rgba(74,222,128,0.5)' } : {}}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 0',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 900, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase',
                border: isRunning || isDone ? '2px solid rgba(74,222,128,0.2)' : '2px solid #4ade80',
                background: isRunning || isDone ? 'rgba(0,20,0,0.3)' : 'rgba(0,40,0,0.8)',
                color: isRunning || isDone ? '#374151' : '#4ade80',
                cursor: isRunning || isDone ? 'not-allowed' : 'pointer',
                boxShadow: !isRunning && !isDone ? '0 0 20px rgba(74,222,128,0.3)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Zap style={{ width: 18, height: 18 }} />
              {isRunning && state.scenario === 'LEGACY_VULNERABLE' ? '⏳ EXECUTING...' : 'LAUNCH — NO AEGIS'}
            </motion.button>
            <p style={{ color: '#4ade80', fontSize: 11, textAlign: 'center', opacity: 0.7 }}>
              Expected: ✔ FUNDS ACQUIRED (green modal)
            </p>
          </div>

          {/* SIM 2 — AEGIS Active */}
          <div style={{
            border: '1px solid rgba(239,68,68,0.5)',
            background: 'rgba(20,0,0,0.6)',
            padding: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
              <span style={{ color: '#f87171', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Simulation 2 — AEGIS Active
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.6 }}>
              AEGIS Zero-Trust is ON. Hacker sends forged request but has no WebRTC ZK-Proof. AEGIS blocks it.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', fontSize: 11, color: '#6b7280' }}>
              <div>AMOUNT: <span style={{ color: '#fb923c' }}>₹5,000</span></div>
              <div>TARGET: <span style={{ color: '#fb923c' }}>attacker_offshore_acct</span></div>
              <div>PROTECTION: <span style={{ color: '#4ade80' }}>AEGIS ACTIVE</span></div>
            </div>
            <motion.button
              onClick={runSimulation2}
              disabled={isRunning || isDone}
              whileHover={!isRunning && !isDone ? { scale: 1.02, boxShadow: '0 0 30px rgba(239,68,68,0.6)' } : {}}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 0',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 900, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase',
                border: isRunning || isDone ? '2px solid rgba(239,68,68,0.2)' : '2px solid #ef4444',
                background: isRunning || isDone ? 'rgba(20,0,0,0.3)' : 'rgba(40,0,0,0.8)',
                color: isRunning || isDone ? '#374151' : '#f87171',
                cursor: isRunning || isDone ? 'not-allowed' : 'pointer',
                boxShadow: !isRunning && !isDone ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <ShieldOff style={{ width: 18, height: 18 }} />
              {isRunning && state.scenario === 'AEGIS_SECURED' ? '⏳ ATTACKING...' : 'LAUNCH — WITH AEGIS'}
            </motion.button>
            <p style={{ color: '#f87171', fontSize: 11, textAlign: 'center', opacity: 0.7 }}>
              Expected: ✖ ACCESS DENIED (red modal)
            </p>
          </div>
        </div>

        {/* Reset button */}
        {isDone && (
          <motion.button
            onClick={reset}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 0', width: '100%',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
              border: '1px solid rgba(220,38,38,0.5)', color: '#f87171',
              background: 'transparent', cursor: 'pointer',
            }}
          >
            ↺ RESET TERMINAL
          </motion.button>
        )}

        {/* ── PAYLOAD INFO ── */}
        <div style={{
          border: '1px solid rgba(220,38,38,0.3)',
          background: 'rgba(10,0,0,0.7)',
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Terminal style={{ width: 14, height: 14, color: '#f87171' }} />
            <span style={{ color: '#f87171', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Attack Configuration
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { k: 'BANK PORT', v: '3002', c: '#fb923c' },
              { k: 'AMOUNT', v: '₹5,000', c: '#facc15' },
              { k: 'METHOD', v: 'POST + cookies:include', c: '#d1d5db' },
              { k: 'TECHNIQUE', v: 'MITRE T1189 CSRF', c: '#f87171' },
            ].map(row => (
              <div key={row.k} style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', border: '1px solid rgba(220,38,38,0.15)' }}>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>{row.k}</div>
                <div style={{ color: row.c, fontSize: 12, fontWeight: 700 }}>{row.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TERMINAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal style={{ width: 14, height: 14, color: '#22c55e', filter: 'drop-shadow(0 0 4px #16a34a)' }} />
            <span style={{ color: '#d1d5db', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Live Execution Terminal
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(34,197,94,0.2)' }} />
            <motion.div
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #16a34a' }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700 }}>LIVE</span>
          </div>
          <div style={{ height: 320 }}>
            <TerminalLog logs={state.logs} />
          </div>
        </div>

      </div>

      <FailureOverlay visible={state.status === 'FAILED_BLURRED'} onReset={reset} />
      <SuccessOverlay visible={state.status === 'SUCCESS_STOLEN'} onReset={reset} />
    </div>
  );
}

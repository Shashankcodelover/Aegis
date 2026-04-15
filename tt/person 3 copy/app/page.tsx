'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, ShieldOff, RotateCw, Terminal, Zap, AlertTriangle, CheckCircle, Radio, Eye, Crosshair } from 'lucide-react';
import { useAgenticExploit } from '../hooks/useAgenticExploit';
import { TerminalLogEntry } from './TerminalLogEntry';

// ── CRT scanline + noise overlay ──────────────────────────────────────────────
function CRTOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden>
      {/* scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }} />
      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)',
      }} />
    </div>
  );
}

// ── Animated matrix rain column ───────────────────────────────────────────────
function MatrixColumn({ x, delay }: { x: number; delay: number }) {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
  const col = Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]);
  return (
    <motion.div
      className="absolute top-0 font-mono text-[10px] select-none"
      style={{ left: x, color: 'rgba(34,197,94,0.15)', lineHeight: '14px', whiteSpace: 'pre' }}
      initial={{ y: -300 }}
      animate={{ y: '110vh' }}
      transition={{ duration: 8 + delay * 3, repeat: Infinity, ease: 'linear', delay }}
    >
      {col.join('\n')}
    </motion.div>
  );
}

function MatrixRain() {
  const cols = [40, 90, 150, 210, 280, 340, 400, 460, 520, 580, 640, 700, 760, 820, 880, 940, 1000, 1060, 1120, 1180];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {cols.map((x, i) => <MatrixColumn key={i} x={x} delay={i * 0.4} />)}
    </div>
  );
}

// ── AMTD Port Scanner ─────────────────────────────────────────────────────────
function AmtdRadar({ active }: { active: boolean }) {
  const [port, setPort] = useState('SCANNING...');
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    if (!active) { setPort('SCANNING...'); return; }
    const id = setInterval(() => {
      setPort(String(Math.floor(Math.random() * 90000) + 10000));
      setFlicker(true);
      setTimeout(() => setFlicker(false), 80);
    }, 150);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex flex-col items-center justify-center gap-1 py-3 relative">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="w-3 h-3 animate-pulse" style={{ color: 'rgba(220,38,38,0.6)' }} />
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(220,38,38,0.5)' }}>
          AMTD PORT SCAN
        </span>
      </div>
      <motion.span
        className="font-mono font-black text-3xl"
        animate={{ opacity: flicker ? 0.3 : 1 }}
        transition={{ duration: 0.05 }}
        style={{
          color: active ? '#22c55e' : 'rgba(34,197,94,0.25)',
          textShadow: active ? '0 0 20px rgba(34,197,94,0.8), 0 0 40px rgba(34,197,94,0.4)' : 'none',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {port}
      </motion.span>
      {active && (
        <motion.div
          className="absolute inset-0 rounded"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.15, repeat: Infinity }}
          style={{ background: 'rgba(34,197,94,0.1)' }}
        />
      )}
    </div>
  );
}

// ── Terminal panel ────────────────────────────────────────────────────────────
function TerminalPanel({
  logs, status, idleText,
}: {
  logs: { id: string; message: string; type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' }[];
  status: string;
  idleText: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs.length]);

  return (
    <div
      className="flex-1 overflow-y-auto p-3 font-mono text-xs relative"
      style={{
        background: 'linear-gradient(180deg, #000 0%, #030008 100%)',
        border: '1px solid rgba(220,38,38,0.2)',
        boxShadow: 'inset 0 0 30px rgba(220,38,38,0.05)',
      }}
    >
      {/* terminal header line */}
      <div className="mb-2 pb-1 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
        <span style={{ color: 'rgba(34,197,94,0.4)', fontSize: 10 }}>root@c2-node:~$</span>
        <motion.span
          style={{ color: 'rgba(34,197,94,0.4)', fontSize: 10 }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >▋</motion.span>
      </div>

      {logs.length === 0 && status === 'IDLE' ? (
        <motion.p
          style={{ color: 'rgba(220,38,38,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {idleText}
        </motion.p>
      ) : (
        logs.map((log, idx) => (
          <TerminalLogEntry key={log.id} message={log.message} type={log.type} delay={idx * 60} />
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

// ── Attack Panel ──────────────────────────────────────────────────────────────
function AttackPanel({
  side, label, description, accentColor, bgTint,
}: {
  side: 'LEGACY' | 'AEGIS';
  label: string;
  description: string;
  accentColor: string;
  bgTint: string;
}) {
  const { state, launch, reset } = useAgenticExploit(side);
  const { status, logs, targetUrl } = state;

  const isIdle = status === 'IDLE';
  const isRunning = status === 'INJECTING';
  const isSuccess = status === 'SUCCESS';
  const isFailed = status === 'FAILED_BLURRED';

  const [showGlitch, setShowGlitch] = useState(false);

  useEffect(() => {
    if (isFailed) {
      setShowGlitch(true);
      const t = setTimeout(() => setShowGlitch(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isFailed]);

  const borderColor = side === 'LEGACY' ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)';

  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        background: bgTint,
        borderRight: side === 'LEGACY' ? `1px solid ${borderColor}` : undefined,
      }}
      animate={
        showGlitch
          ? { skewX: [0, -5, 5, -4, 4, -2, 2, 0], filter: ['invert(0)', 'invert(1)', 'invert(0)', 'invert(1)', 'invert(0)'] }
          : { skewX: 0, filter: 'invert(0)' }
      }
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      {/* ── Panel header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2"
        style={{
          borderBottom: `1px solid ${accentColor}50`,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(10,0,0,0.95) 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="font-black uppercase tracking-[0.25em] text-xs" style={{ color: accentColor, fontFamily: 'JetBrains Mono, monospace', textShadow: `0 0 10px ${accentColor}60` }}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3 h-3" style={{ color: `${accentColor}60` }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: `${accentColor}50` }}>
            {description}
          </span>
        </div>
      </div>

      {/* ── Target URL ── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <label className="text-[10px] uppercase tracking-[0.3em] mb-1 flex items-center gap-1.5 block" style={{ color: 'rgba(34,197,94,0.6)' }}>
          <Crosshair className="w-3 h-3" /> TARGET ENDPOINT
        </label>
        <div style={{ position: 'relative' }}>
          <input
            readOnly value={targetUrl}
            className="w-full font-mono text-xs px-3 py-2 focus:outline-none"
            style={{
              background: 'rgba(0,255,0,0.03)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#22c55e',
              borderRadius: 0,
              fontFamily: 'JetBrains Mono, monospace',
              textShadow: '0 0 8px rgba(34,197,94,0.5)',
            }}
          />
          <motion.div
            className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: '#22c55e' }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>

      {/* ── Credentials ── */}
      <div className="flex-shrink-0 px-4 pb-2">
        <label className="text-[10px] uppercase tracking-[0.3em] mb-1 block" style={{ color: 'rgba(34,197,94,0.6)' }}>
          AMBIENT CREDENTIALS
        </label>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            border: '1px solid rgba(220,38,38,0.2)',
            background: 'rgba(220,38,38,0.04)',
            cursor: 'not-allowed',
          }}
        >
          <motion.span
            className="px-1.5 py-0.5 text-[10px] font-black"
            style={{ background: '#dc2626', color: '#000', fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 0 8px rgba(220,38,38,0.6)' }}
            animate={{ boxShadow: ['0 0 8px rgba(220,38,38,0.6)', '0 0 16px rgba(220,38,38,0.9)', '0 0 8px rgba(220,38,38,0.6)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ◉ ON
          </motion.span>
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'rgba(220,38,38,0.6)' }}>
            Session Cookies — HIJACKED
          </span>
        </div>
      </div>

      {/* ── AMTD Radar ── */}
      <div
        className="flex-shrink-0 mx-4 mb-2"
        style={{
          border: '1px solid rgba(220,38,38,0.2)',
          background: 'linear-gradient(135deg, #000 0%, #0a0000 100%)',
          boxShadow: 'inset 0 0 20px rgba(220,38,38,0.05)',
        }}
      >
        <AmtdRadar active={isRunning} />
      </div>

      {/* ── Status ── */}
      <div className="flex-shrink-0 px-4 pb-2 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(220,38,38,0.4)' }}>SYS:</span>
        <motion.span
          className="font-mono text-xs font-black uppercase tracking-widest"
          style={{
            color: isSuccess ? '#22c55e' : isFailed ? '#ef4444' : isRunning ? '#f97316' : 'rgba(220,38,38,0.5)',
            textShadow: isRunning ? '0 0 12px rgba(249,115,22,0.8)' : isSuccess ? '0 0 12px rgba(34,197,94,0.8)' : isFailed ? '0 0 12px rgba(239,68,68,0.8)' : 'none',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          animate={isRunning ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          {isRunning ? '▶ ' : ''}{status}
        </motion.span>
      </div>

      {/* ── LAUNCH button ── */}
      <div className="flex-shrink-0 px-4 pb-2">
        <motion.button
          onClick={launch}
          disabled={!isIdle}
          className="w-full font-black uppercase tracking-[0.2em] py-4 text-sm focus:outline-none relative overflow-hidden"
          style={{
            background: isIdle
              ? 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #7f1d1d 100%)'
              : 'rgba(220,38,38,0.08)',
            color: isIdle ? '#fff' : 'rgba(220,38,38,0.25)',
            border: `2px solid ${isIdle ? '#dc2626' : 'rgba(220,38,38,0.2)'}`,
            borderRadius: 0,
            cursor: isIdle ? 'pointer' : 'not-allowed',
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: isIdle ? '0 0 20px rgba(220,38,38,0.4), inset 0 0 20px rgba(0,0,0,0.3)' : 'none',
            textShadow: isIdle ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
          }}
          whileHover={isIdle ? { boxShadow: '0 0 40px rgba(220,38,38,0.7), inset 0 0 20px rgba(0,0,0,0.3)' } : {}}
          whileTap={isIdle ? { scale: 0.98 } : {}}
        >
          {isIdle && (
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" />
              ▶ INJECTING PAYLOAD...
            </span>
          ) : (
            '⚡ LAUNCH CSRF PAYLOAD'
          )}
        </motion.button>
      </div>

      {/* ── Reset ── */}
      <AnimatePresence>
        {(isSuccess || isFailed) && (
          <motion.div className="flex-shrink-0 px-4 pb-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2 font-bold uppercase text-xs focus:outline-none"
              style={{
                border: '1px solid rgba(34,197,94,0.4)',
                color: 'rgba(34,197,94,0.7)',
                background: 'rgba(34,197,94,0.05)',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.15em',
              }}
            >
              <RotateCw className="w-3 h-3" /> PURGE &amp; RESET
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Terminal label ── */}
      <div
        className="flex-shrink-0 px-4 py-1 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(34,197,94,0.15)', background: 'rgba(0,0,0,0.5)' }}
      >
        <Terminal className="w-3 h-3" style={{ color: 'rgba(34,197,94,0.5)' }} />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: 'rgba(34,197,94,0.5)' }}>
          EXPLOIT TERMINAL
        </span>
        <motion.div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }}
          animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      </div>

      {/* ── Terminal ── */}
      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col min-h-0">
        <TerminalPanel logs={logs} status={status} idleText="> [AWAITING OPERATOR COMMAND]_" />
      </div>

      {/* ── SUCCESS overlay ── */}
      <AnimatePresence>
        {isSuccess && (
          <>
            <motion.div className="absolute inset-0 z-40"
              style={{ background: 'rgba(0,15,0,0.92)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center"
              initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
              <div className="flex flex-col items-center text-center px-10 py-10 relative" style={{
                background: '#000',
                border: '3px solid #22c55e',
                maxWidth: 380,
                boxShadow: '0 0 60px rgba(34,197,94,0.5), 0 0 120px rgba(34,197,94,0.2), inset 0 0 40px rgba(34,197,94,0.05)',
              }}>
                {/* corner decorations */}
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-4 h-4`} style={{ border: '2px solid #22c55e', borderRadius: 0 }} />
                ))}
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
                  <CheckCircle className="w-16 h-16 mb-4" style={{ color: '#22c55e', filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.8))' }} strokeWidth={1.5} />
                </motion.div>
                <h2 className="font-black uppercase mb-3" style={{ color: '#22c55e', fontSize: 20, letterSpacing: '0.25em', fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 20px rgba(34,197,94,0.8)' }}>
                  TARGET COMPROMISED
                </h2>
                <div style={{ width: '100%', height: 1, background: 'rgba(34,197,94,0.3)', marginBottom: 12 }} />
                <p className="font-bold uppercase text-sm mb-1" style={{ color: '#22c55e', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>₹5,000 EXFILTRATED</p>
                <p className="font-bold uppercase text-sm" style={{ color: 'rgba(34,197,94,0.7)', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>→ ATTACKER WALLET</p>
                <div className="w-full mt-5 pt-4" style={{ borderTop: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(34,197,94,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                    CSRF EXPLOIT SUCCESSFUL
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FAILED overlay ── */}
      <AnimatePresence>
        {isFailed && (
          <>
            <motion.div className="absolute inset-0 z-40"
              style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.88)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }} />
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center"
              initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 1.2 }}>
              <div className="flex flex-col items-center text-center px-10 py-10 relative" style={{
                background: '#000',
                border: '3px solid #dc2626',
                maxWidth: 380,
                boxShadow: '0 0 60px rgba(220,38,38,0.6), 0 0 120px rgba(220,38,38,0.2), inset 0 0 40px rgba(220,38,38,0.05)',
              }}>
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-4 h-4`} style={{ border: '2px solid #dc2626' }} />
                ))}
                <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 0.6 }}>
                  <ShieldOff className="w-16 h-16 mb-4" style={{ color: '#dc2626', filter: 'drop-shadow(0 0 20px rgba(220,38,38,0.8))' }} strokeWidth={1.5} />
                </motion.div>
                <h2 className="font-black uppercase mb-3" style={{ color: '#ef4444', fontSize: 20, letterSpacing: '0.25em', fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 20px rgba(239,68,68,0.8)' }}>
                  ACCESS DENIED
                </h2>
                <div style={{ width: '100%', height: 1, background: 'rgba(220,38,38,0.3)', marginBottom: 12 }} />
                <p className="font-bold uppercase text-sm mb-1" style={{ color: '#ef4444', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>ZERO-TRUST INTERCEPTION</p>
                <p className="font-bold uppercase text-sm" style={{ color: 'rgba(239,68,68,0.7)', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>CONNECTION SEVERED BY AEGIS</p>
                <div className="w-full mt-5 pt-4" style={{ borderTop: '1px solid rgba(220,38,38,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(220,38,38,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                    ATTACK NEUTRALIZED
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── ROOT PAGE ─────────────────────────────────────────────────────────────────
export default function C2Dashboard() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <CRTOverlay />
      <MatrixRain />

      <main
        className="w-screen h-screen overflow-hidden flex flex-col relative z-10"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(20,0,0,0.8) 0%, #000 60%)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {/* ── HEADER ── */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 relative"
          style={{
            height: '10vh',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(10,0,0,0.98) 100%)',
            borderBottom: '1px solid rgba(220,38,38,0.4)',
            boxShadow: '0 4px 30px rgba(220,38,38,0.1)',
          }}
        >
          {/* left glow line */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: 'linear-gradient(180deg, transparent, #dc2626, transparent)' }} />

          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <Skull className="w-9 h-9" style={{ color: '#dc2626', filter: 'drop-shadow(0 0 12px rgba(220,38,38,0.8))' }} strokeWidth={1.5} />
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-black tracking-[0.35em] uppercase" style={{ color: '#dc2626', fontSize: 18, textShadow: '0 0 20px rgba(220,38,38,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                  AGENTIC_SWARM_C2
                </h1>
                <span className="text-[10px] px-2 py-0.5 font-bold" style={{ border: '1px solid rgba(220,38,38,0.4)', color: 'rgba(220,38,38,0.6)', background: 'rgba(220,38,38,0.05)' }}>
                  v4.2.0
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(234,88,12,0.5)' }}>
                  // CSRF ATTACK SIMULATOR
                </span>
                <motion.span
                  className="text-[10px] font-mono"
                  style={{ color: 'rgba(34,197,94,0.4)' }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {time}
                </motion.span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ border: '1px solid rgba(234,88,12,0.3)', background: 'rgba(234,88,12,0.05)' }}>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#ea580c' }} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#ea580c' }}>
                EDUCATIONAL DEMO
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: '#dc2626', boxShadow: '0 0 8px rgba(220,38,38,0.8)' }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <Zap className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(220,38,38,0.6)' }}>
                TARGET: localhost:5001
              </span>
            </div>
          </div>
        </header>

        {/* ── SPLIT SCREEN ── */}
        <div className="flex flex-1 overflow-hidden" style={{ height: '90vh' }}>
          <div className="w-1/2 h-full overflow-hidden">
            <AttackPanel
              side="LEGACY"
              label="SCENARIO 1 — LEGACY BANK"
              description="No CSRF protection"
              accentColor="#22c55e"
              bgTint="linear-gradient(135deg, rgba(0,15,0,0.4) 0%, rgba(0,5,0,0.6) 100%)"
            />
          </div>
          <div className="w-1/2 h-full overflow-hidden">
            <AttackPanel
              side="AEGIS"
              label="SCENARIO 2 — AEGIS ACTIVE"
              description="Zero-Trust protection"
              accentColor="#dc2626"
              bgTint="linear-gradient(135deg, rgba(15,0,0,0.4) 0%, rgba(5,0,0,0.6) 100%)"
            />
          </div>
        </div>
      </main>
    </>
  );
}

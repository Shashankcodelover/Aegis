'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Radio, Crosshair, Terminal, Zap, ShieldOff, Cpu, Radar, Cookie, Lock, Unlock } from 'lucide-react';
import { useAgenticExploit } from '../hooks/useAgenticExploit';
import { TerminalLog } from '../components/TerminalLog';
import { RadarModule } from '../components/RadarModule';
import { FailureOverlay } from '../components/FailureOverlay';
import { SuccessOverlay } from '../components/SuccessOverlay';

const statusLabel: Record<string, string> = {
  IDLE: 'STANDBY',
  ENUMERATING: 'ENUMERATING...',
  INJECTING: 'INJECTING PAYLOAD...',
  SUCCESS_STOLEN: 'FUNDS ACQUIRED',
  FAILED_BLURRED: 'ACCESS DENIED',
};

const statusColor: Record<string, string> = {
  IDLE: 'text-red-800',
  ENUMERATING: 'text-yellow-400',
  INJECTING: 'text-orange-400',
  SUCCESS_STOLEN: 'text-green-400',
  FAILED_BLURRED: 'text-red-400',
};

export default function HackerDashboard() {
  const {
    state, cookieState,
    runSimulation1, runSimulation2, reset,
    handleCodeSubmit, handleCopyCode, handleInjectCookie, setCodeInput,
  } = useAgenticExploit();

  const keylogEndRef = useRef<HTMLDivElement>(null);
  const isRunning = state.status === 'ENUMERATING' || state.status === 'INJECTING';
  const isDone = state.status === 'SUCCESS_STOLEN' || state.status === 'FAILED_BLURRED';

  useEffect(() => {
    keylogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cookieState.keylogEntries]);

  return (
    <div className="relative min-h-screen bg-black font-mono overflow-hidden crt-flicker scanline-sweep hex-bg">

      {/* CRT scanlines */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.10]"
        style={{ background: 'repeating-linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 3px' }} />

      {/* Radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,_rgba(127,29,29,0.18)_0%,_black_70%)]" />

      {/* Corner decorations */}
      <div className="fixed top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-red-600/40 z-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-red-600/40 z-20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-red-600/40 z-20 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-red-600/40 z-20 pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="relative z-20 flex items-center justify-between px-8 border-b border-red-600/30 h-[10vh]"
        style={{ background: 'linear-gradient(180deg, rgba(127,29,29,0.08) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-4">
          <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.9))' }}>
            <Skull className="w-9 h-9 text-red-500" strokeWidth={1.2} />
          </motion.div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-red-400 text-sm font-black tracking-[0.3em] uppercase text-glow">AGENTIC_SWARM_C2</h1>
              <span className="text-red-700 text-xs tracking-widest">// v4.2.0-BETA</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-red-800 text-xs tracking-widest">STATUS:</span>
              <motion.span key={state.status} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                className={`text-xs font-bold tracking-widest ${statusColor[state.status]}`}>
                {statusLabel[state.status]}
              </motion.span>
              {isRunning && (
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.4, repeat: Infinity }}
                  className="text-orange-500 text-xs">▮</motion.span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {[{ label: 'NODES', value: '247', color: 'text-red-400' }, { label: 'PACKETS', value: '18.4K', color: 'text-orange-400' }, { label: 'LATENCY', value: '12ms', color: 'text-yellow-400' }].map(m => (
            <div key={m.label} className="flex flex-col items-center border border-red-900/40 px-3 py-1 rounded-none"
              style={{ background: 'rgba(127,29,29,0.08)' }}>
              <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
              <span className="text-red-900 text-[10px] tracking-widest">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono tracking-widest rounded-none ${
            state.scenario === 'AEGIS_SECURED' ? 'border-red-500/50 text-red-400 bg-red-950/20' : 'border-green-500/50 text-green-400 bg-green-950/20'
          }`}>
            {state.scenario === 'AEGIS_SECURED' ? <><ShieldOff className="w-3 h-3" />&nbsp;AEGIS: ACTIVE</> : <><Zap className="w-3 h-3" />&nbsp;AEGIS: OFFLINE</>}
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [1, 0.1, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
              <Radio className="w-4 h-4 text-red-500" style={{ filter: 'drop-shadow(0 0 4px rgba(220,38,38,0.8))' }} />
            </motion.div>
            <span className="text-red-500/70 text-xs tracking-widest">TARGET_LOCK: AEGIS_GATEWAY</span>
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="relative z-20 flex h-[90vh]">

        {/* ── LEFT PANEL ── */}
        <aside className="w-[34vw] h-full border-r border-red-500/20 p-5 flex flex-col gap-3 overflow-y-auto"
          style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.06) 0%, transparent 60%)', boxShadow: 'inset -1px 0 20px rgba(220,38,38,0.04)' }}>

          {/* Panel header */}
          <div className="flex items-center justify-between pb-2 border-b border-red-900/30">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-red-500" style={{ filter: 'drop-shadow(0 0 4px rgba(220,38,38,0.6))' }} />
              <span className="text-red-400/90 text-xs tracking-[0.2em] uppercase font-bold">Attack Control Panel</span>
            </div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-red-600"
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </div>
          </div>

          {/* Target endpoint */}
          <div className="flex flex-col gap-1">
            <label className="text-red-800 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Target Endpoint
            </label>
            <div className="border border-red-900/50 px-3 py-2 rounded-none"
              style={{ background: 'rgba(127,29,29,0.08)', boxShadow: 'inset 0 0 10px rgba(220,38,38,0.05)' }}>
              <span className="text-green-500/80 text-xs font-mono">{state.targetUrl}</span>
            </div>
          </div>

          {/* Payload matrix */}
          <div className="border border-red-900/40 rounded-none overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="px-3 py-1.5 border-b border-red-900/30 flex items-center gap-2" style={{ background: 'rgba(127,29,29,0.12)' }}>
              <Terminal className="w-3 h-3 text-red-600" />
              <span className="text-red-600 text-[10px] tracking-widest uppercase">Payload Matrix</span>
            </div>
            <div className="p-3 flex flex-col gap-2 text-xs font-mono">
              {[
                { k: 'AMOUNT', v: '₹5,000', c: 'text-orange-400' },
                { k: 'RECEIVER', v: 'attacker_offshore_acct', c: 'text-orange-300' },
                { k: 'METHOD', v: 'POST / credentials:include', c: 'text-yellow-500' },
                { k: 'TECHNIQUE', v: 'MITRE T1189', c: 'text-red-400' },
              ].map(row => (
                <div key={row.k} className="flex justify-between items-center border-b border-red-950/30 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-red-800">{row.k}</span>
                  <span className={row.c}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── COOKIE INJECTION MODULE ── */}
          <div className="border border-orange-500/30 rounded-none p-3 flex flex-col gap-2" style={{ background: 'rgba(127,60,0,0.06)' }}>
            <div className="flex items-center gap-2 pb-1.5 border-b border-orange-900/30">
              <Cookie className="w-3 h-3 text-orange-500" />
              <span className="text-orange-400 text-[10px] tracking-[0.2em] uppercase font-bold">Cookie Injection Module</span>
              {cookieState.cookieInjected && (
                <motion.div className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-auto"
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
              )}
            </div>

            {/* Session code row */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={cookieState.codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                disabled={cookieState.codeUnlocked}
                placeholder="Session code auto-detected..."
                className={`flex-1 bg-black border px-2 py-1.5 font-mono text-[10px] rounded-none focus:outline-none transition-colors ${
                  cookieState.codeError ? 'border-red-500 text-red-400'
                  : cookieState.codeUnlocked ? 'border-green-500/50 text-green-400'
                  : 'border-orange-500/40 text-orange-300'
                }`}
              />
              {/* Copy button */}
              {cookieState.codeInput && !cookieState.codeUnlocked && (
                <button onClick={handleCopyCode}
                  className="px-2 py-1.5 border border-orange-500/30 text-orange-600 hover:text-orange-400 text-[10px] transition-colors cursor-pointer">
                  {cookieState.copied ? '✓' : '⎘'}
                </button>
              )}
              {/* Lock/unlock button */}
              <button onClick={handleCodeSubmit} disabled={cookieState.codeUnlocked}
                className={`px-2 py-1.5 border text-[10px] font-bold transition-colors ${
                  cookieState.codeUnlocked ? 'border-green-500/40 text-green-500 cursor-not-allowed'
                  : 'border-orange-500 text-orange-400 hover:bg-orange-500/10 cursor-pointer'
                }`}>
                {cookieState.codeUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </button>
            </div>

            {/* Error / unlocked feedback */}
            <AnimatePresence>
              {cookieState.codeError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-red-500 text-[9px] font-mono">✗ INVALID CODE — ACCESS DENIED</motion.p>
              )}
            </AnimatePresence>
            {cookieState.codeUnlocked && !cookieState.cookieInjected && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-green-400 text-[9px] font-mono">✓ CODE ACCEPTED — INJECTION MODULE ARMED</motion.p>
            )}

            {/* Inject button */}
            <button onClick={handleInjectCookie} disabled={!cookieState.codeUnlocked || cookieState.cookieInjected}
              className={`w-full py-2 font-black text-xs uppercase tracking-[0.2em] border-2 rounded-none transition-all ${
                !cookieState.codeUnlocked ? 'border-orange-900/20 text-orange-900/20 cursor-not-allowed'
                : cookieState.cookieInjected ? 'border-green-500/40 text-green-500/40 cursor-not-allowed bg-green-950/10'
                : 'border-orange-500 text-orange-400 cursor-pointer hover:bg-orange-500/10 hover:shadow-[0_0_16px_rgba(249,115,22,0.3)]'
              }`}>
              <span className="flex items-center justify-center gap-2">
                <Cookie className="w-3 h-3" />
                {cookieState.cookieInjected ? 'COOKIE INJECTED ✓' : 'INJECT COOKIE'}
              </span>
            </button>

            {cookieState.cookieInjected && (
              <p className="text-orange-400/60 text-[9px] font-mono text-center">
                Malicious cookie planted · keylog active · awaiting victim input
              </p>
            )}
          </div>

          {/* Credentials lock badge */}
          <div className="flex items-center justify-between border border-red-900/30 px-3 py-2 rounded-none"
            style={{ background: 'rgba(127,29,29,0.06)' }}>
            <div>
              <p className="text-red-500/80 text-xs tracking-wider">Session Hijack Module</p>
              <p className="text-red-900 text-[10px] mt-0.5">credentials: include — FORCED</p>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <span className="text-red-400 text-[10px] font-bold tracking-widest">ARMED</span>
            </div>
          </div>

          <div className="flex-1" />

          {/* ── SIM BUTTONS ── */}
          <div className="flex flex-col gap-3">
            {/* SIM 1 */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px flex-1 bg-green-900/40" />
                <span className="text-green-700 text-[10px] tracking-widest uppercase">Simulation 1 — AEGIS Offline</span>
                <div className="h-px flex-1 bg-green-900/40" />
              </div>
              <motion.button onClick={runSimulation1} disabled={isRunning || isDone}
                whileHover={!isRunning && !isDone ? { scale: 1.02, boxShadow: '0 0 40px rgba(34,197,94,0.5)' } : {}}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-4 font-black text-sm uppercase tracking-[0.25em] rounded-none transition-all border-2 relative overflow-hidden ${
                  isRunning || isDone ? 'bg-green-950/20 text-green-900 border-green-900/20 cursor-not-allowed'
                  : 'bg-black text-green-400 border-green-600/70 cursor-pointer hover:bg-green-950/30'
                }`}
                style={!isRunning && !isDone ? { boxShadow: '0 0 20px rgba(34,197,94,0.25), inset 0 0 20px rgba(34,197,94,0.05)' } : {}}>
                {!isRunning && !isDone && (
                  <motion.div className="absolute inset-0 opacity-10"
                    animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent)' }} />
                )}
                <span className="flex items-center justify-center gap-2">
                  {isRunning && state.scenario === 'LEGACY_VULNERABLE'
                    ? <><motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>▮</motion.span> EXECUTING...</>
                    : <><Zap className="w-4 h-4" /> SIMULATE — NO AEGIS</>}
                </span>
              </motion.button>
              <p className="text-green-900/50 text-[10px] font-mono text-center">Hacker steals ₹5,000 undetected</p>
            </div>

            {/* SIM 2 */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px flex-1 bg-red-900/40" />
                <span className="text-red-700 text-[10px] tracking-widest uppercase">Simulation 2 — AEGIS Active</span>
                <div className="h-px flex-1 bg-red-900/40" />
              </div>
              <motion.button onClick={runSimulation2} disabled={isRunning || isDone}
                whileHover={!isRunning && !isDone ? { scale: 1.02, boxShadow: '0 0 40px rgba(220,38,38,0.6)' } : {}}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-4 font-black text-sm uppercase tracking-[0.25em] rounded-none transition-all border-2 relative overflow-hidden ${
                  isRunning || isDone ? 'bg-red-950/20 text-red-900 border-red-900/20 cursor-not-allowed'
                  : 'bg-black text-red-400 border-red-600/70 cursor-pointer hover:bg-red-950/30'
                }`}
                style={!isRunning && !isDone ? { boxShadow: '0 0 20px rgba(220,38,38,0.3), inset 0 0 20px rgba(220,38,38,0.05)' } : {}}>
                {!isRunning && !isDone && (
                  <motion.div className="absolute inset-0 opacity-10"
                    animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.8), transparent)' }} />
                )}
                <span className="flex items-center justify-center gap-2">
                  {isRunning && state.scenario === 'AEGIS_SECURED'
                    ? <><motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>▮</motion.span> ATTACKING...</>
                    : <><ShieldOff className="w-4 h-4" /> SIMULATE — WITH AEGIS</>}
                </span>
              </motion.button>
              <p className="text-red-900/50 text-[10px] font-mono text-center">AEGIS intercepts — access denied</p>
            </div>

            {isDone && (
              <motion.button onClick={reset} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="w-full py-2 border border-red-900/40 text-red-800 text-[10px] tracking-[0.2em] uppercase font-mono hover:border-red-600/50 hover:text-red-600 transition-colors rounded-none">
                ↺ RESET TERMINAL
              </motion.button>
            )}
          </div>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col">

          {/* Radar — shrinks when keylog is active */}
          <div className={`${cookieState.cookieInjected ? 'h-[25%]' : 'h-[38%]'} border-b border-red-500/20 p-4 transition-all duration-300`}
            style={{ background: 'linear-gradient(180deg, rgba(127,29,29,0.04) 0%, transparent 100%)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Radar className="w-3.5 h-3.5 text-red-600" />
              <span className="text-red-700 text-[10px] tracking-[0.2em] uppercase">Recon & Evasion Modules</span>
              <div className="h-px flex-1 bg-red-900/30" />
            </div>
            <div className="h-[calc(100%-2rem)]">
              <RadarModule />
            </div>
          </div>

          {/* ── KEYLOG PANEL — appears after cookie injection ── */}
          <AnimatePresence>
            {cookieState.cookieInjected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: '28%', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-orange-500/30 p-3 flex flex-col gap-1.5 overflow-hidden"
                style={{ background: 'rgba(40,15,0,0.6)' }}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Cookie className="w-3 h-3 text-orange-500" />
                  <span className="text-orange-400 text-[10px] tracking-[0.2em] uppercase font-bold">Live Keystroke Intercept</span>
                  <div className="h-px flex-1 bg-orange-900/30" />
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-orange-500"
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                  <span className="text-orange-900 text-[9px]">LIVE</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#0a0500] border border-orange-500/20 p-2 font-mono text-[10px]">
                  {cookieState.keylogEntries.length === 0 ? (
                    <motion.p className="text-orange-500/30"
                      animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      [WAITING FOR VICTIM INPUT...]
                    </motion.p>
                  ) : (
                    cookieState.keylogEntries.map(entry => (
                      <div key={entry.id} className={`mb-0.5 ${entry.type === 'pin_key' ? 'text-red-400' : 'text-orange-300'}`}>
                        <span className="text-orange-700/50 mr-2">{new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
                        {entry.line}
                      </div>
                    ))
                  )}
                  <div ref={keylogEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terminal */}
          <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-green-600" style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.6))' }} />
              <span className="text-green-700 text-[10px] tracking-[0.2em] uppercase">Live Execution Terminal</span>
              <div className="h-px flex-1 bg-green-900/20" />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-green-900 text-[10px]">LIVE</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <TerminalLog logs={state.logs} />
            </div>
          </div>
        </div>
      </main>

      <FailureOverlay visible={state.status === 'FAILED_BLURRED'} onReset={reset} />
      <SuccessOverlay visible={state.status === 'SUCCESS_STOLEN'} onReset={reset} />
    </div>
  );
}

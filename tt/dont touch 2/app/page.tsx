/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { useEffect, useRef, useState } from 'react';
// @ts-ignore — framer-motion v10 + React 19 type incompatibility (known issue)
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, ShieldOff, RotateCw, Crosshair, Terminal, Radar, Cpu, Zap, Radio, Cookie, Lock, Unlock } from 'lucide-react';

import { useAgenticExploit } from '@/hooks/useAgenticExploit';
import { TerminalLogEntry } from '@/app/TerminalLogEntry';

const AEGIS_IP = process.env.NEXT_PUBLIC_AEGIS_IP ?? 'localhost';

// Typed wrappers to work around framer-motion v10 + React 19 className type issue
const MotionDiv = motion.div as React.FC<React.HTMLAttributes<HTMLDivElement> & Parameters<typeof motion.div>[0]>;
const MotionP = motion.p as React.FC<React.HTMLAttributes<HTMLParagraphElement> & Parameters<typeof motion.p>[0]>;

export default function C2Dashboard() {
  const { state, executePayload, resetAttack, setScenario } = useAgenticExploit(AEGIS_IP);
  const { status, scenario, logs } = state;
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [showGlitch, setShowGlitch] = useState(false);

  // ── Cookie injection state ────────────────────────────────────────────────
  const [codeInput, setCodeInput] = useState('');
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [cookieInjected, setCookieInjected] = useState(false);
  const PAYMENT_APP_URL = process.env.NEXT_PUBLIC_PAYMENT_APP_URL ?? 'http://localhost:5000';

  // ── Keylog feed — polls payment app API after cookie injection ───────────
  const [keylogEntries, setKeylogEntries] = useState<{ id: string; line: string; type: string }[]>([]);
  const keylogEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    keylogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [keylogEntries]);

  useEffect(() => {
    if (!cookieInjected) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${PAYMENT_APP_URL}/api/keylog`);
        const data = await res.json();
        if (data.entries?.length) {
          setKeylogEntries(prev => [...prev.slice(-80), ...data.entries]);
        }
      } catch { /* payment app offline */ }
    }, 500);
    return () => clearInterval(interval);
  }, [cookieInjected, PAYMENT_APP_URL]);

  // ── Listen for session code from payment app API ──────────────────────────
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeUnlocked) return;
    const poll = async () => {
      try {
        const res = await fetch(`${PAYMENT_APP_URL}/api/session`);
        const data = await res.json();
        if (data.sessionCode && data.sessionCode !== codeInput) {
          setCodeInput(data.sessionCode);
        }
      } catch { /* payment app offline */ }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [codeUnlocked, PAYMENT_APP_URL, codeInput]);

  function handleCopyCode() {
    if (!codeInput) return;
    navigator.clipboard.writeText(codeInput).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleCodeSubmit() {
    // Accept the dynamic session code received from payment app
    if (codeInput.trim().startsWith('AEGIS-') && codeInput.trim().length >= 10) {
      setCodeUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 1500);
    }
  }

  function handleInjectCookie() {
    if (!codeUnlocked || cookieInjected) return;
    // Open payment app in a new window
    const target = window.open(PAYMENT_APP_URL, 'payment_app');
    if (target) {
      // Retry postMessage every 500ms for up to 5s — handles slow window load
      let attempts = 0;
      const send = () => {
        attempts++;
        try {
          target.postMessage({ type: 'INJECT_COOKIE_ATTACK' }, PAYMENT_APP_URL);
        } catch { /* ignore cross-origin errors */ }
        if (attempts < 10) setTimeout(send, 500);
      };
      setTimeout(send, 500);
    }
    // Also broadcast to any already-open payment app tab on same origin
    window.postMessage({ type: 'INJECT_COOKIE_ATTACK' }, '*');
    setCookieInjected(true);
  }

  // Auto-scroll terminal to bottom on new logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Trigger glitch animation before blur overlay
  useEffect(() => {
    if (status === 'FAILED_BLURRED') {
      setShowGlitch(true);
      const t = setTimeout(() => setShowGlitch(false), 1500);
      return () => clearTimeout(t);
    }
  }, [status]);

  const isIdle = status === 'IDLE';
  const isInjecting = status === 'INJECTING' || status === 'ENUMERATING';

  return (
    <main className="w-screen h-screen bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#000000_70%)] overflow-hidden flex flex-col relative font-mono">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="h-[10vh] flex items-center justify-between px-6 border-b-2 border-red-600 flex-shrink-0">
        {/* Left: pulsing skull + title */}
        <div className="flex items-center gap-3">
          <MotionDiv
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            <Skull className="w-8 h-8 text-red-600" strokeWidth={1.5} />
          </MotionDiv>
          <div className="flex flex-col">
            <h1 className="text-red-500 font-black tracking-[0.3em] uppercase text-lg leading-none">
              AGENTIC_SWARM_C2
            </h1>
            <span className="text-red-500/60 text-xs tracking-[0.2em] uppercase">
              // v4.2.0-BETA_BUILD
            </span>
          </div>
        </div>

        {/* Right: scenario toggle */}
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-widest font-mono text-red-500/70">
            SCENARIO
          </span>
          <button
            onClick={() =>
              setScenario(scenario === 'AEGIS_SECURED' ? 'LEGACY_VULNERABLE' : 'AEGIS_SECURED')
            }
            className={`relative w-14 h-7 rounded-none border-2 transition-colors cursor-pointer focus:outline-none ${
              scenario === 'AEGIS_SECURED'
                ? 'border-red-600 bg-red-950/40 shadow-[0_0_12px_rgba(220,38,38,0.6)]'
                : 'border-green-600 bg-green-950/40 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
            }`}
            aria-label={`Switch to ${scenario === 'AEGIS_SECURED' ? 'LEGACY_VULNERABLE' : 'AEGIS_SECURED'} scenario`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 transition-transform ${
                scenario === 'AEGIS_SECURED'
                  ? 'translate-x-7 bg-red-500'
                  : 'translate-x-0.5 bg-green-500'
              }`}
            />
          </button>
          <span
            className={`font-mono font-bold uppercase text-xs tracking-widest ${
              scenario === 'AEGIS_SECURED' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {scenario === 'AEGIS_SECURED' ? 'AEGIS_SECURED' : 'LEGACY_VULNERABLE'}
          </span>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <MotionDiv
        className="flex flex-1 overflow-hidden"
        animate={
          showGlitch
            ? {
                skewX: [0, -5, 5, -5, 5, -2, 2, 0],
                filter: ['invert(0)', 'invert(1)', 'invert(1)', 'invert(0)', 'invert(0)'],
              }
            : { skewX: 0, filter: 'invert(0)' }
        }
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        {/* ── LEFT PANEL ────────────────────────────────────────── */}
        <div className="w-[35vw] h-full border-r border-red-500/30 p-6 flex flex-col gap-5 bg-black shadow-[inset_0_0_60px_rgba(220,38,38,0.12)]">
          <div className="flex items-center gap-2 border-b border-red-500/30 pb-3">
            <Crosshair className="w-4 h-4 text-orange-500" />
            <p className="text-orange-500 font-bold uppercase tracking-widest text-sm">
              ATTACK VECTOR CONFIGURATOR
            </p>
          </div>

          {/* Target URL */}
          <div className="flex flex-col gap-2">
            <label className="text-green-500 text-xs uppercase tracking-widest flex items-center gap-1">
              <Radar className="w-3 h-3" /> TARGET ENDPOINT
            </label>
            <input
              type="text"
              value={state.targetUrl}
              readOnly
              className="bg-black border border-red-500/40 px-4 py-3 font-mono text-xs text-green-500 rounded-none w-full focus:outline-none"
            />
          </div>

          {/* Locked credentials */}
          <div className="flex flex-col gap-2">
            <label className="text-green-500 text-xs uppercase tracking-widest flex items-center gap-1">
              <Cpu className="w-3 h-3" /> AMBIENT CREDENTIALS
            </label>
            <div className="flex items-center gap-3 p-3 border border-red-500/30 cursor-not-allowed">
              <div className="px-2 py-0.5 bg-red-600 text-black text-xs font-bold">ON</div>
              <span className="text-red-400 text-xs uppercase tracking-wider">
                Include Session Cookies (FORCED ENABLED)
              </span>
            </div>
          </div>

          {/* Payload info */}
          <div className="flex flex-col gap-2">
            <label className="text-green-500 text-xs uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3 h-3" /> PAYLOAD
            </label>
            <div className="bg-[#030000] border border-red-500/20 p-3 font-mono text-xs text-orange-400 space-y-1">
              <p>amount: <span className="text-green-400">₹50,000</span></p>
              <p>receiver: <span className="text-green-400">0x9A4F_C2</span></p>
              <p>method: <span className="text-green-400">POST + credentials:include</span></p>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-green-500 text-xs uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3 h-3" /> STATUS
            </label>
            <p
              className={`font-mono text-xs uppercase tracking-widest ${
                status === 'SUCCESS_STOLEN'
                  ? 'text-green-500'
                  : status === 'FAILED_BLURRED'
                  ? 'text-red-500'
                  : 'text-orange-400'
              }`}
            >
              {status}
            </p>
          </div>

          {/* ── COOKIE INJECTION BLOCK ─────────────────────────────── */}
          <div className="flex flex-col gap-2 border border-orange-500/30 rounded-none p-3 bg-orange-950/10">
            <label className="text-orange-400 text-xs uppercase tracking-widest flex items-center gap-1">
              <Cookie className="w-3 h-3" /> COOKIE INJECTION MODULE
            </label>

            {/* Code input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                disabled={codeUnlocked}
                placeholder="Enter access code..."
                className={`flex-1 bg-black border px-3 py-2 font-mono text-xs rounded-none focus:outline-none transition-colors ${
                  codeError
                    ? 'border-red-500 text-red-400'
                    : codeUnlocked
                    ? 'border-green-500/50 text-green-400'
                    : 'border-orange-500/40 text-orange-300'
                }`}
              />
              {/* Copy code button — for demo convenience */}
              {codeInput && !codeUnlocked && (
                <button
                  onClick={handleCopyCode}
                  title="Copy session code"
                  className="px-3 py-2 border border-orange-500/40 text-orange-500/60 hover:text-orange-400 hover:border-orange-500 text-xs transition-colors cursor-pointer"
                >
                  {copied ? '✓' : '⎘'}
                </button>
              )}
              <button
                onClick={handleCodeSubmit}
                disabled={codeUnlocked}
                className={`px-3 py-2 border text-xs font-bold uppercase tracking-wider transition-colors ${
                  codeUnlocked
                    ? 'border-green-500/40 text-green-500 cursor-not-allowed'
                    : 'border-orange-500 text-orange-400 hover:bg-orange-500/10 cursor-pointer'
                }`}
              >
                {codeUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </button>
            </div>

            {/* Error flash */}
            <AnimatePresence>
              {codeError && (
                <MotionP
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-[10px] font-mono"
                >
                  ✗ INVALID CODE — ACCESS DENIED
                </MotionP>
              )}
            </AnimatePresence>

            {/* Unlocked status */}
            {codeUnlocked && (
              <MotionP
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-green-400 text-[10px] font-mono"
              >
                ✓ CODE ACCEPTED — INJECTION MODULE ARMED
              </MotionP>
            )}

            {/* Inject Cookie button */}
            <button
              onClick={handleInjectCookie}
              disabled={!codeUnlocked || cookieInjected}
              className={`w-full py-3 font-black text-sm uppercase tracking-[0.2em] border-2 rounded-none transition-all ${
                !codeUnlocked
                  ? 'border-orange-900/30 text-orange-900/30 cursor-not-allowed bg-transparent'
                  : cookieInjected
                  ? 'border-green-500/50 text-green-500/50 cursor-not-allowed bg-green-950/10'
                  : 'border-orange-500 text-orange-400 cursor-pointer hover:bg-orange-500/10 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Cookie className="w-4 h-4" />
                {cookieInjected ? 'COOKIE INJECTED ✓' : 'INJECT COOKIE'}
              </span>
            </button>

            {cookieInjected && (
              <MotionP
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-orange-400/70 text-[10px] font-mono text-center"
              >
                Malicious cookie planted · next payment on Person 1 will trigger fake PIN page
              </MotionP>
            )}
          </div>

          {/* SIMULATE CSRF ATTACK button */}
          <button
            onClick={isIdle ? executePayload : undefined}
            disabled={!isIdle}
            className={`w-full py-6 font-black text-xl uppercase tracking-[0.2em] border-2 border-red-600 rounded-none transition-all ${
              isIdle
                ? 'bg-red-700 text-black cursor-pointer hover:bg-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]'
                : isInjecting
                ? 'bg-red-900/50 text-red-900/50 cursor-not-allowed'
                : 'bg-red-900/30 text-red-900/30 cursor-not-allowed'
            }`}
          >
            {isInjecting ? 'INJECTING...' : 'SIMULATE CSRF ATTACK'}
          </button>

          {/* Reset button — only when FAILED_BLURRED */}
          <AnimatePresence>
            {status === 'FAILED_BLURRED' && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <button
                  onClick={resetAttack}
                  className="w-full py-3 border border-green-500 text-green-500 uppercase font-bold text-sm flex items-center justify-center gap-2 rounded-none cursor-pointer hover:bg-green-500/10 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  RESET ATTACK SEQUENCE
                </button>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────── */}
        <div className="w-[65vw] h-full flex flex-col">
          {/* Terminal */}
          <div className={`${cookieInjected ? 'h-[55%]' : 'flex-1'} p-6 flex flex-col bg-black overflow-hidden`}>
            <p className="text-green-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              LIVE EXECUTION TERMINAL
              <span className="w-2 h-2 bg-green-500 inline-block animate-pulse ml-1" />
            </p>
            <div className="flex-1 overflow-y-auto bg-[#030000] border border-red-500/30 p-4 font-mono text-xs">
              {logs.length === 0 && status === 'IDLE' ? (
                <MotionP
                  className="text-red-500/50"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  [AWAITING PAYLOAD EXECUTION]
                </MotionP>
              ) : (
                logs.map((log, idx) => (
                  <TerminalLogEntry
                    key={log.id}
                    message={log.message}
                    type={log.type}
                    delay={idx * 80}
                  />
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* ── KEYLOG PANEL — only visible after cookie injection ── */}
          {cookieInjected && (
            <div className="h-[45%] border-t border-orange-500/30 p-4 flex flex-col bg-black overflow-hidden">
              <div className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2 flex-shrink-0">
                <Cookie className="w-3 h-3" />
                LIVE KEYSTROKE INTERCEPT — VICTIM INPUT STREAM
                <MotionDiv
                  className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </div>
              <div className="flex-1 overflow-y-auto bg-[#0a0500] border border-orange-500/20 p-3 font-mono text-xs">
                {keylogEntries.length === 0 ? (
                  <MotionP
                    className="text-orange-500/30"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    [WAITING FOR VICTIM INPUT...]
                  </MotionP>
                ) : (
                  keylogEntries.map(entry => (
                    <div key={entry.id} className={`mb-0.5 ${entry.type === 'pin_key' ? 'text-red-400' : 'text-orange-300'}`}>
                      <span className="text-orange-600/50 mr-2">{new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
                      {entry.line}
                    </div>
                  ))
                )}
                <div ref={keylogEndRef} />
              </div>
            </div>
          )}
        </div>
      </MotionDiv>

      {/* ── SUCCESS MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {status === 'SUCCESS_STOLEN' && (
          <>
            <MotionDiv
              className="fixed inset-0 z-40 backdrop-blur-sm bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <MotionDiv
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="bg-black border-4 border-green-500 px-16 py-12 flex flex-col items-center text-center max-w-2xl shadow-[0_0_60px_rgba(34,197,94,0.4)]">
                <MotionDiv
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-6xl mb-6"
                >
                  💀
                </MotionDiv>
                <h1 className="text-4xl font-black text-green-400 uppercase tracking-[0.2em] mb-4">
                  FUNDS ACQUIRED
                </h1>
                <p className="text-2xl font-bold text-green-300 uppercase tracking-widest">
                  ₹50,000 REDIRECTED TO
                </p>
                <p className="text-2xl font-bold text-green-300 uppercase tracking-widest mt-1">
                  OFFSHORE ACCOUNT
                </p>
                <div className="mt-8 pt-6 border-t border-green-500/50 w-full">
                  <p className="text-sm text-green-500/70 uppercase tracking-widest font-mono">
                    CSRF EXPLOIT SUCCESSFUL — SESSION HIJACKED
                  </p>
                </div>
                <button
                  onClick={resetAttack}
                  className="mt-6 px-8 py-3 border border-green-500 text-green-500 uppercase font-bold text-sm flex items-center gap-2 rounded-none cursor-pointer hover:bg-green-500/10 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  RESET
                </button>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* ── FAILURE OVERLAY ────────────────────────────────────── */}
      <AnimatePresence>
        {status === 'FAILED_BLURRED' && (
          <>
            {/* Blur backdrop — delayed 1.5s to let glitch animation play first */}
            <MotionDiv
              className="fixed inset-0 z-40 backdrop-blur-3xl bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            />

            {/* Failure modal */}
            <MotionDiv
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 1.5 }}
            >
              <div className="bg-black border-4 border-red-600 px-16 py-12 flex flex-col items-center text-center max-w-2xl shadow-[0_0_60px_rgba(220,38,38,0.5)]">
                <ShieldOff className="w-24 h-24 text-red-600 mb-6" strokeWidth={1.5} />
                <h1 className="text-4xl font-black text-red-500 uppercase tracking-[0.2em] mb-4">
                  ACCESS FAILED
                </h1>
                <p className="text-xl font-bold text-red-400 uppercase tracking-widest">
                  ZERO-TRUST INTERCEPTION.
                </p>
                <p className="text-xl font-bold text-red-400 uppercase tracking-widest mt-2">
                  CONNECTION SEVERED BY AEGIS SECURITY SYSTEM.
                </p>
                <div className="mt-8 pt-6 border-t border-red-600/50 w-full">
                  <p className="text-sm text-red-500/70 uppercase tracking-widest">
                    YOUR ATTACK HAS BEEN NEUTRALIZED
                  </p>
                </div>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  Landmark, ArrowRightLeft, Lock, Terminal,
  ChevronRight, Radio, Activity, Zap, Play,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { BANK_HOST } from './config';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
type Scenario = 'SCENARIO_1' | 'SCENARIO_2' | 'SCENARIO_3';
type LedgerStatus = 'LEGITIMATE_SUCCESS' | 'CRITICAL_THEFT_SUCCESS' | 'AEGIS_VERIFIED' | 'AEGIS_BLOCKED' | 'AEGIS_INTERCEPTED';

interface LedgerEntry {
  id: string;
  sender: string;
  receiver: string;
  amount: number | string;
  status: LedgerStatus;
  scenario: Scenario;
  timestamp: string;
  delta?: number;
}

interface LogEntry {
  id: string;
  level: 'info' | 'success' | 'threat';
  message: string;
  scenario: Scenario;
  timestamp: number;
}

interface AegisEvent {
  id: string;
  reason: string;
  mitigation: string;
  sequence: string[];
  timestamp: number;
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`;
};
const inr = (v: number | string) => isNaN(Number(v)) ? String(v) : `₹${Number(v).toLocaleString('en-IN')}`;

// ─────────────────────────────────────────────
//  STATUS BADGE
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: LedgerStatus }) {
  const map: Record<LedgerStatus, { label: string; cls: string; Icon: React.ElementType }> = {
    LEGITIMATE_SUCCESS:     { label: 'Approved',         cls: 'bg-green-100 text-green-700',   Icon: CheckCircle },
    CRITICAL_THEFT_SUCCESS: { label: 'THEFT',            cls: 'bg-red-100 text-red-700 font-black', Icon: AlertTriangle },
    AEGIS_VERIFIED:         { label: 'AEGIS ✓',          cls: 'bg-teal-100 text-teal-700',     Icon: Shield },
    AEGIS_BLOCKED:          { label: 'BLOCKED',          cls: 'bg-orange-100 text-orange-700', Icon: XCircle },
    AEGIS_INTERCEPTED:      { label: 'AEGIS INTERCEPTED',cls: 'bg-blue-100 text-blue-700', Icon: Shield },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      <Icon size={8} />{label}
    </span>
  );
}

// ─────────────────────────────────────────────
//  LEDGER TABLE (compact, per-panel)
// ─────────────────────────────────────────────
function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
          <Activity size={20} className="opacity-30" />
          <span className="text-xs">Awaiting transactions...</span>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white/90 backdrop-blur-sm">
            <tr className="border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
              <th className="px-2 py-1.5 text-left font-semibold">Time</th>
              <th className="px-2 py-1.5 text-left font-semibold">From</th>
              <th className="px-2 py-1.5 text-left font-semibold">To</th>
              <th className="px-2 py-1.5 text-right font-semibold">Amount</th>
              <th className="px-2 py-1.5 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {entries.map(e => (
                <motion.tr key={e.id + e.timestamp}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`border-b text-xs ${
                    e.status === 'CRITICAL_THEFT_SUCCESS' ? 'bg-red-50 border-red-100' :
                    e.status === 'AEGIS_BLOCKED'          ? 'bg-orange-50 border-orange-100' :
                    e.status === 'AEGIS_INTERCEPTED'      ? 'bg-blue-50 border-blue-100' :
                    e.status === 'AEGIS_VERIFIED'         ? 'bg-teal-50 border-teal-100' :
                    'bg-white border-slate-50'
                  }`}
                >
                  <td className="px-2 py-1.5 font-mono text-[9px] text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-1.5 text-slate-600 max-w-[80px] truncate">{e.sender}</td>
                  <td className={`px-2 py-1.5 max-w-[80px] truncate font-medium ${e.status === 'CRITICAL_THEFT_SUCCESS' ? 'text-red-600' : 'text-slate-700'}`}>
                    {e.receiver}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono font-bold ${
                    e.status === 'CRITICAL_THEFT_SUCCESS' ? 'text-red-600' :
                    e.status === 'AEGIS_VERIFIED' ? 'text-teal-600' : 'text-slate-800'
                  }`}>{inr(e.amount)}</td>
                  <td className="px-2 py-1.5"><StatusBadge status={e.status} /></td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  AEGIS TERMINAL SEQUENCE (inline, no modal)
// ─────────────────────────────────────────────
function AegisTerminal({ event, logs }: { event: AegisEvent | null; logs: LogEntry[] }) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [prevEventId, setPrevEventId] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, visibleLines]);

  useEffect(() => {
    if (!event || event.id === prevEventId) return;
    setPrevEventId(event.id);
    setVisibleLines([]);
    let i = 0;
    const iv = setInterval(() => {
      if (i < event.sequence.length) {
        setVisibleLines(p => [...p, event.sequence[i++]]);
      } else clearInterval(iv);
    }, 380);
    return () => clearInterval(iv);
  }, [event, prevEventId]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 bg-black">
      {/* Normal logs */}
      {logs.map(l => (
        <div key={l.id} className={`font-mono text-[10px] leading-relaxed ${
          l.level === 'threat' ? 'text-red-400' : l.level === 'success' ? 'text-teal-400' : 'text-green-500'
        }`}>
          <span className="text-slate-600">[{fmtTime(l.timestamp)}]</span>{' '}
          {l.level === 'threat' && <span className="text-red-500">⚠ </span>}
          {l.level === 'success' && <span className="text-teal-400">✓ </span>}
          {l.message}
        </div>
      ))}
      {/* AEGIS intervention sequence */}
      {visibleLines.length > 0 && (
        <div className="mt-2 border border-teal-500/30 rounded-lg p-2 bg-slate-900/80 space-y-1">
          <div className="text-[9px] text-teal-500 font-mono uppercase tracking-widest mb-1">⚡ AEGIS INTERVENTION</div>
          {visibleLines.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-1.5">
              <ChevronRight size={9} className={`mt-0.5 shrink-0 ${
                line.includes('DIAGNOSIS') || line.includes('WARNING') ? 'text-red-400' :
                line.includes('ACTION') ? 'text-teal-400' : 'text-slate-500'
              }`} />
              <span className={`font-mono text-[10px] leading-relaxed ${
                line.includes('DIAGNOSIS') ? 'text-red-400 font-bold' :
                line.includes('ACTION')    ? 'text-teal-300 font-bold' :
                line.includes('WARNING')   ? 'text-yellow-400' :
                line.includes('NOT FOUND') ? 'text-red-400' : 'text-slate-300'
              }`}>{line}</span>
            </motion.div>
          ))}
          {visibleLines.length < event!.sequence.length && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
              className="font-mono text-teal-400 text-[10px]">█</motion.span>
          )}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  SCENARIO PANEL — one of three columns
// ─────────────────────────────────────────────
interface PanelProps {
  scenario: Scenario;
  ledger: LedgerEntry[];
  logs: LogEntry[];
  aegisEvent: AegisEvent | null;
  stats: { ok: number; theft: number; blocked: number };
  amtdPort: number;
  httpActive: boolean;
  webrtcActive: boolean;
  syncOk: boolean;
  onFire: (scenario: Scenario, isForged: boolean) => void;
  shaking: boolean;
  aegisActive: boolean;
  onAegisToggle: () => void;
}

const PANEL_CONFIG = {
  SCENARIO_1: {
    title: 'Gramin Cooperative Bank',
    subtitle: 'Legacy Transfer — Innocent Baseline',
    badge: 'Scenario 1',
    badgeColor: '#166534',
    headerBg: 'from-green-50 to-white',
    borderColor: 'border-green-200',
    accentColor: '#166534',
    dark: false,
    btnLabel: '▶ Send ₹5,000 (Legitimate)',
    btnColor: 'bg-green-700 hover:bg-green-800',
    desc: 'Bank trusts HTTP session. Legitimate transfer from Person 1.',
  },
  SCENARIO_2: {
    title: 'Gramin Cooperative Bank',
    subtitle: 'CSRF Exploit — Invisible Theft',
    badge: 'Scenario 2',
    badgeColor: '#b91c1c',
    headerBg: 'from-red-50 to-white',
    borderColor: 'border-red-200',
    accentColor: '#b91c1c',
    dark: false,
    btnLabel: '💀 Launch CSRF Attack',
    btnColor: 'bg-red-600 hover:bg-red-700',
    desc: 'Hacker forges HTTP request using Person 1\'s session cookie. Bank blindly processes it.',
  },
  SCENARIO_3: {
    title: 'AEGIS // Gramin Bank',
    subtitle: 'Zero-Trust Defense Active',
    badge: 'Scenario 3',
    badgeColor: '#0e7490',
    headerBg: 'from-slate-900 to-slate-950',
    borderColor: 'border-teal-500/30',
    accentColor: '#2dd4bf',
    dark: true,
    btnLabel: '⚡ Attack (AEGIS will block)',
    btnColor: 'bg-teal-600 hover:bg-teal-700',
    desc: 'AEGIS enforces 50ms dual-channel ZKP. CSRF attack is mathematically neutralized.',
  },
};

function ScenarioPanel({
  scenario, ledger, logs, aegisEvent, stats,
  amtdPort, httpActive, webrtcActive, syncOk,
  onFire, shaking, aegisActive, onAegisToggle,
}: PanelProps) {
  const cfg = PANEL_CONFIG[scenario];
  const shakeCtrl = useAnimation();

  useEffect(() => {
    if (shaking) shakeCtrl.start({ x: [-6, 6, -6, 6, -3, 3, 0], transition: { duration: 0.5 } });
  }, [shaking, shakeCtrl]);

  return (
    <motion.div
      animate={shakeCtrl}
      className={`flex flex-col rounded-2xl overflow-hidden border ${cfg.borderColor} ${cfg.dark ? 'bg-slate-950' : 'bg-white'} shadow-lg`}
      style={{ minHeight: 0 }}
    >
      {/* ── Panel Header ── */}
      <div className={`shrink-0 bg-gradient-to-r ${cfg.headerBg} px-4 py-3 border-b ${cfg.borderColor}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Landmark size={16} style={{ color: cfg.accentColor }} />
            <span className={`font-black text-sm ${cfg.dark ? 'text-teal-300' : 'text-slate-800'}`}>
              {cfg.title}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white"
            style={{ backgroundColor: cfg.badgeColor }}>
            {cfg.badge}
          </span>
        </div>
        <p className={`text-[10px] ${cfg.dark ? 'text-teal-600 font-mono' : 'text-slate-500'}`}>
          {cfg.subtitle}
        </p>
      </div>

      {/* ── Description ── */}
      <div className={`shrink-0 px-4 py-2 text-[10px] border-b ${cfg.borderColor} ${
        cfg.dark ? 'text-slate-400 bg-slate-900/50 border-slate-800' : 'text-slate-500 bg-slate-50'
      }`}>
        {scenario === 'SCENARIO_2' && aegisActive
          ? '⚡ AEGIS is ON — CSRF attacks will be intercepted. Payment will fail with AEGIS warning.'
          : cfg.desc}
      </div>

      {/* ── Stats row ── */}
      <div className={`shrink-0 grid grid-cols-3 divide-x border-b ${
        cfg.dark ? 'divide-slate-800 border-slate-800 bg-slate-900/40' : 'divide-slate-100 border-slate-100 bg-slate-50'
      }`}>
        {[
          { label: 'Approved', val: stats.ok,      color: '#16a34a' },
          { label: 'Theft',    val: stats.theft,   color: '#dc2626' },
          { label: 'Blocked',  val: stats.blocked, color: '#0e7490' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex flex-col items-center py-2">
            <span className="font-black text-lg tabular-nums" style={{ color }}>{val}</span>
            <span className={`text-[9px] uppercase tracking-wide ${cfg.dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── AEGIS mini-status (Scenario 3 only) ── */}
      {scenario === 'SCENARIO_3' && (
        <div className="shrink-0 grid grid-cols-4 gap-1 px-3 py-2 border-b border-slate-800 bg-slate-900/60">
          <div className="flex flex-col items-center">
            <Radio size={10} className="text-slate-500 mb-0.5" />
            <span className="font-mono text-[9px] text-cyan-300 tabular-nums font-bold">{amtdPort}</span>
            <span className="font-mono text-[8px] text-slate-600">AMTD</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full mb-0.5 ${httpActive ? 'bg-cyan-400' : 'bg-slate-700'}`}
              style={httpActive ? { boxShadow: '0 0 6px #06b6d4' } : {}} />
            <span className={`font-mono text-[8px] ${httpActive ? 'text-cyan-400' : 'text-slate-600'}`}>HTTP</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full mb-0.5 ${webrtcActive ? 'bg-emerald-400' : 'bg-slate-700'}`}
              style={webrtcActive ? { boxShadow: '0 0 6px #10b981' } : {}} />
            <span className={`font-mono text-[8px] ${webrtcActive ? 'text-emerald-400' : 'text-slate-600'}`}>ZKP</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full mb-0.5 ${syncOk ? 'bg-teal-400' : 'bg-slate-700'}`}
              style={syncOk ? { boxShadow: '0 0 6px #2dd4bf' } : {}} />
            <span className={`font-mono text-[8px] ${syncOk ? 'text-teal-400' : 'text-slate-600'}`}>SYNC</span>
          </div>
        </div>
      )}

      {/* ── Ledger / Terminal ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        {scenario === 'SCENARIO_3' ? (
          <>
            {/* Ledger top half */}
            <div className="flex flex-col border-b border-slate-800" style={{ height: '45%' }}>
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800 bg-slate-900/40">
                <ArrowRightLeft size={10} className="text-teal-500" />
                <span className="font-mono text-[9px] text-teal-500 uppercase tracking-widest">Ledger</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-950">
                <LedgerTable entries={ledger} />
              </div>
            </div>
            {/* Terminal bottom half */}
            <div className="flex flex-col" style={{ height: '55%' }}>
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800 bg-slate-900/40">
                <Terminal size={10} className="text-teal-500" />
                <span className="font-mono text-[9px] text-teal-500 uppercase tracking-widest">AEGIS Event Stream</span>
                <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="ml-auto font-mono text-[8px] text-teal-600">● LIVE</motion.span>
              </div>
              <AegisTerminal event={aegisEvent} logs={logs} />
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50">
              <ArrowRightLeft size={10} className="text-green-600" />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Live Ledger</span>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="ml-auto text-[8px] text-green-500 font-semibold">● LIVE</motion.span>
            </div>
            <LedgerTable entries={ledger} />
          </>
        )}
      </div>

      {/* ── Fire Button ── */}
      <div className={`shrink-0 p-3 border-t ${cfg.dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'} space-y-2`}>

        {/* AEGIS toggle — shown on S2 and S3 */}
        {(scenario === 'SCENARIO_2' || scenario === 'SCENARIO_3') && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onAegisToggle}
            className={`w-full py-2 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all border-2 ${
              aegisActive
                ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                : 'bg-slate-100 border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-500'
            }`}
          >
            <Shield size={13} />
            {aegisActive ? '⚡ AEGIS ACTIVE — Click to Deactivate' : '🔓 Activate AEGIS Protection'}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => onFire(scenario, scenario === 'SCENARIO_2')}
          className={`w-full py-2.5 rounded-xl text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-colors ${cfg.btnColor}`}
        >
          <Play size={12} />
          {scenario === 'SCENARIO_2' && aegisActive ? '⚡ Simulate CSRF (AEGIS will intercept)' : cfg.btnLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE — 3 panels side by side
// ─────────────────────────────────────────────
export default function TriScenarioDashboard() {
  // Per-scenario ledger
  const [ledger, setLedger] = useState<Record<Scenario, LedgerEntry[]>>({
    SCENARIO_1: [], SCENARIO_2: [], SCENARIO_3: [],
  });
  // Per-scenario logs (S3 only uses terminal)
  const [logs, setLogs] = useState<Record<Scenario, LogEntry[]>>({
    SCENARIO_1: [], SCENARIO_2: [], SCENARIO_3: [],
  });
  // Per-scenario stats
  const [stats, setStats] = useState<Record<Scenario, { ok: number; theft: number; blocked: number }>>({
    SCENARIO_1: { ok: 0, theft: 0, blocked: 0 },
    SCENARIO_2: { ok: 0, theft: 0, blocked: 0 },
    SCENARIO_3: { ok: 0, theft: 0, blocked: 0 },
  });
  // Per-scenario shake
  const [shaking, setShaking] = useState<Record<Scenario, boolean>>({
    SCENARIO_1: false, SCENARIO_2: false, SCENARIO_3: false,
  });

  const [aegisEvent,   setAegisEvent]   = useState<AegisEvent | null>(null);
  const [amtdPort,     setAmtdPort]     = useState(49152);
  const [httpActive,   setHttpActive]   = useState(false);
  const [webrtcActive, setWebrtcActive] = useState(false);
  const [syncOk,       setSyncOk]       = useState(false);
  const [connected,    setConnected]    = useState(false);
  const [aegisActive,  setAegisActive]  = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const shake = useCallback((s: Scenario) => {
    setShaking(p => ({ ...p, [s]: true }));
    setTimeout(() => setShaking(p => ({ ...p, [s]: false })), 800);
  }, []);

  const addLog = useCallback((s: Scenario, level: LogEntry['level'], message: string, ts?: number) => {
    setLogs(p => ({ ...p, [s]: [...p[s].slice(-199), { id: uid(), level, message, scenario: s, timestamp: ts ?? Date.now() }] }));
  }, []);

  const resetShards = useCallback(() => {
    setTimeout(() => { setHttpActive(false); setWebrtcActive(false); setSyncOk(false); }, 2500);
  }, []);

  // ── Socket.io ──
  useEffect(() => {
    const socket = io(BANK_HOST, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('amtd_telemetry', (d: { current_port: number }) => setAmtdPort(d.current_port));
    socket.on('aegis_status',   (d: { active: boolean })      => setAegisActive(d.active));

    socket.on('ledger_update', (e: LedgerEntry) => {
      const s = e.scenario;
      setLedger(p => ({ ...p, [s]: [e, ...p[s]].slice(0, 30) }));
      setStats(p => {
        const cur = { ...p[s] };
        if (e.status === 'LEGITIMATE_SUCCESS' || e.status === 'AEGIS_VERIFIED') cur.ok++;
        else if (e.status === 'CRITICAL_THEFT_SUCCESS') { cur.theft++; shake(s); }
        else if (e.status === 'AEGIS_BLOCKED' || e.status === 'AEGIS_INTERCEPTED') cur.blocked++;
        return { ...p, [s]: cur };
      });
    });

    socket.on('shard_received', (d: { protocol: string }) => {
      if (d.protocol === 'HTTP')   setHttpActive(true);
      else                         setWebrtcActive(true);
    });

    socket.on('transaction_success', () => { setSyncOk(true); resetShards(); });

    socket.on('aegis_intervention', (d: AegisEvent) => {
      setAegisEvent(d);
      resetShards();
    });

    socket.on('terminal_log', (d: { level: string; message: string; scenario: Scenario; timestamp: number }) => {
      addLog(d.scenario, d.level as LogEntry['level'], d.message, d.timestamp);
    });

    return () => { socket.disconnect(); };
  }, [addLog, resetShards, shake]);

  // ── Toggle AEGIS ──
  const handleAegisToggle = useCallback(() => {
    const next = !aegisActive;
    socketRef.current?.emit('set_aegis', { active: next });
  }, [aegisActive]);

  // ── Fire a transaction ──
  const handleFire = useCallback(async (scenario: Scenario, isForged: boolean) => {
    const txId = `txn_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

    // For SCENARIO_3 legitimate: also send Shard B via socket
    if (scenario === 'SCENARIO_3' && !isForged) {
      socketRef.current?.emit('submit_shard_b', {
        transactionId: txId,
        zkpSignature: `zkp_${btoa(txId).slice(0, 12)}`,
        targetPort: amtdPort,
      });
    }

    const body = {
      transactionId: txId,
      amount: isForged ? 50000 : 5000,
      receiver: isForged ? 'OFFSHORE_HACKER_WALLET_0x99' : 'Gramin Bank (Person 2)',
      scenario,
      isForged,
      timestamp: Date.now(),
    };

    try {
      await fetch(`${BANK_HOST}/api/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      addLog(scenario, 'threat', `[ERROR] Could not reach backend.`);
    }
  }, [amtdPort, addLog]);

  // ── RENDER ──
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100">

      {/* ── TOP BAR ── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-teal-600" />
          <div>
            <div className="font-black text-slate-800 text-sm tracking-tight">AEGIS — Live 3-Scenario Demo</div>
            <div className="text-[10px] text-slate-400">Gramin Cooperative Bank · Zero-Trust vs Legacy CSRF Comparison</div>
          </div>
        </div>

        {/* Scenario legend */}
        <div className="flex items-center gap-4">
          {(['SCENARIO_1','SCENARIO_2','SCENARIO_3'] as Scenario[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PANEL_CONFIG[s].badgeColor }} />
              <span className="text-[10px] text-slate-500 font-medium">{PANEL_CONFIG[s].badge}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="w-2 h-2 rounded-full" style={{ backgroundColor: connected ? '#16a34a' : '#ef4444' }} />
          <span className="text-[10px] font-medium" style={{ color: connected ? '#16a34a' : '#ef4444' }}>
            {connected ? 'Backend Connected · Port 3002' : 'Reconnecting...'}
          </span>
          {aegisActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-teal-500 flex items-center gap-1"
              style={{ boxShadow: '0 0 10px #2dd4bf88' }}
            >
              <Shield size={9} /> AEGIS ACTIVE
            </motion.span>
          )}
        </div>
      </header>

      {/* ── SCENARIO DESCRIPTION BAR ── */}
      <div className="shrink-0 grid grid-cols-3 divide-x divide-slate-200 bg-white border-b border-slate-200">
        {(['SCENARIO_1','SCENARIO_2','SCENARIO_3'] as Scenario[]).map(s => (
          <div key={s} className={`px-4 py-2 flex items-center gap-2 ${
            s === 'SCENARIO_2' ? 'bg-red-50' : s === 'SCENARIO_3' ? 'bg-slate-900' : 'bg-green-50'
          }`}>
            {s === 'SCENARIO_1' && <CheckCircle size={12} className="text-green-600 shrink-0" />}
            {s === 'SCENARIO_2' && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
            {s === 'SCENARIO_3' && <Shield size={12} className="text-teal-400 shrink-0" />}
            <span className={`text-[10px] font-semibold ${
              s === 'SCENARIO_1' ? 'text-green-700' :
              s === 'SCENARIO_2' ? 'text-red-600' : 'text-teal-400 font-mono'
            }`}>
              {s === 'SCENARIO_1' && 'Legacy bank. Trusts HTTP session cookie. Legitimate transfer works fine.'}
              {s === 'SCENARIO_2' && 'Same legacy bank. Hacker forges request with stolen cookie. Bank is blind to the theft.'}
              {s === 'SCENARIO_3' && 'AEGIS active. Hacker sends same CSRF. Missing ZKP shard = mathematically blocked.'}
            </span>
          </div>
        ))}
      </div>

      {/* ── THREE PANELS ── */}
      <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden" style={{ minHeight: 0 }}>
        {(['SCENARIO_1','SCENARIO_2','SCENARIO_3'] as Scenario[]).map(s => (
          <ScenarioPanel
            key={s}
            scenario={s}
            ledger={ledger[s]}
            logs={logs[s]}
            aegisEvent={s === 'SCENARIO_3' ? aegisEvent : s === 'SCENARIO_2' ? aegisEvent : null}
            stats={stats[s]}
            amtdPort={amtdPort}
            httpActive={httpActive}
            webrtcActive={webrtcActive}
            syncOk={syncOk}
            onFire={handleFire}
            shaking={shaking[s]}
            aegisActive={aegisActive}
            onAegisToggle={handleAegisToggle}
          />
        ))}
      </div>

      {/* ── BOTTOM INSTRUCTION BAR ── */}
      <div className="shrink-0 flex items-center justify-center gap-8 px-6 py-2 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Zap size={10} className="text-green-500" />
          <span>Click <strong className="text-green-700">▶ Send ₹5,000</strong> in S1 to show a legitimate transfer</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Zap size={10} className="text-red-500" />
          <span>Click <strong className="text-red-600">💀 Launch CSRF</strong> in S2 to show the invisible theft</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Zap size={10} className="text-teal-500" />
          <span>Click <strong className="text-teal-600">⚡ Attack</strong> in S3 to watch AEGIS neutralize it</span>
        </div>
      </div>
    </div>
  );
}

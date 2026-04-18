'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Landmark,
  ChevronRight,
  Zap,
  Lock,
  Wifi,
  IndianRupee,
  Users,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { BANK_HOST } from './config';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface LedgerEntry {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  status: string;
  scenario: string;
  timestamp: string;
}

interface TerminalLog {
  level: 'info' | 'success' | 'threat';
  message: string;
  timestamp: number;
}

interface ShardEvent {
  protocol: string;
  transactionId: string;
  timestamp: number;
}

interface AegisIntervention {
  id: string;
  reason: string;
  mitigation: string;
  timestamp: number;
  sequence: string[];
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function makeTxnId() {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function statusColor(status: string) {
  if (status === 'LEGITIMATE_SUCCESS' || status === 'AEGIS_VERIFIED') return 'text-green-700';
  if (status === 'CRITICAL_THEFT_SUCCESS') return 'text-red-600';
  if (status === 'BLOCKED_BY_AEGIS') return 'text-amber-600';
  return 'text-stone-400';
}

function statusIcon(status: string) {
  if (status === 'LEGITIMATE_SUCCESS' || status === 'AEGIS_VERIFIED')
    return <CheckCircle size={14} className="text-green-600 inline mr-1" />;
  if (status === 'CRITICAL_THEFT_SUCCESS')
    return <XCircle size={14} className="text-red-600 inline mr-1" />;
  if (status === 'BLOCKED_BY_AEGIS')
    return <Shield size={14} className="text-amber-600 inline mr-1" />;
  return <ChevronRight size={14} className="text-stone-400 inline mr-1" />;
}

// ─────────────────────────────────────────────
//  AEGIS OVERLAY — professional security alert style
// ─────────────────────────────────────────────
function AegisOverlay({
  intervention,
  onClose,
}: {
  intervention: AegisIntervention | null;
  onClose: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!intervention) return;
    setVisibleLines([]);
    setDone(false);
    let i = 0;
    const seq = intervention.sequence;
    const tick = () => {
      if (i < seq.length) {
        setVisibleLines((prev) => [...prev, seq[i]]);
        i++;
        setTimeout(tick, 420);
      } else {
        setDone(true);
      }
    };
    tick();
  }, [intervention]);

  if (!intervention) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="aegis-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative max-w-2xl w-full mx-4 bg-white border-2 border-amber-400 rounded-2xl p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Alert header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-amber-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Shield size={26} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-amber-700 font-bold text-xl tracking-wide">
                AEGIS Security Intervention
              </h2>
              <p className="text-stone-500 text-xs mt-0.5">Zero-Trust Dual-Channel Verification</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200">
                THREAT DETECTED
              </span>
            </div>
          </div>

          {/* Sequence log */}
          <div className="bg-stone-50 rounded-lg p-4 font-mono text-xs space-y-1 min-h-[180px] border border-stone-200">
            {visibleLines.map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-stone-700"
              >
                <span className="text-amber-600 mr-2 font-bold">›</span>
                {line}
              </motion.div>
            ))}
            {!done && (
              <span className="inline-block w-2 h-3 bg-amber-500 animate-pulse ml-4" />
            )}
          </div>

          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 space-y-3"
            >
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span>{intervention.reason}</span>
              </div>
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                <span>{intervention.mitigation}</span>
              </div>
              <button
                onClick={onClose}
                className="mt-2 w-full py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
              >
                Acknowledge &amp; Dismiss
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
//  LEDGER TABLE — bank table styling
// ─────────────────────────────────────────────
function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-stone-400 text-xs italic border border-stone-200 rounded-lg bg-stone-50">
        No transactions recorded yet
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-52 rounded-lg border border-stone-200 shadow-sm">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-stone-100">
          <tr className="text-stone-600 border-b border-stone-200">
            <th className="text-left px-3 py-2 font-semibold">Txn ID</th>
            <th className="text-left px-3 py-2 font-semibold">Amount</th>
            <th className="text-left px-3 py-2 font-semibold">Status</th>
            <th className="text-left px-3 py-2 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          <AnimatePresence initial={false}>
            {entries.map((e) => (
              <motion.tr
                key={e.id}
                initial={{ opacity: 0, backgroundColor: 'rgba(254,243,199,0.6)' }}
                animate={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0)' }}
                transition={{ duration: 0.8 }}
                className="border-b border-stone-100 hover:bg-stone-50"
              >
                <td className="px-3 py-2 text-stone-500 font-mono">{e.id.slice(-8)}</td>
                <td className="px-3 py-2 text-stone-800 font-semibold">₹{e.amount.toLocaleString()}</td>
                <td className={`px-3 py-2 font-medium ${statusColor(e.status)}`}>
                  {statusIcon(e.status)}
                  {e.status.replace(/_/g, ' ')}
                </td>
                <td className="px-3 py-2 text-stone-400">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      <div ref={bottomRef} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  STATS BADGE
// ─────────────────────────────────────────────
function StatsBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${color}`}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
export default function BankPage() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [shardEvents, setShardEvents] = useState<ShardEvent[]>([]);
  const [aegisIntervention, setAegisIntervention] = useState<AegisIntervention | null>(null);
  const [amtdPort, setAmtdPort] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [aegisActive, setAegisActive] = useState(false);
  const [togglingAegis, setTogglingAegis] = useState(false);

  // ── Socket setup ──
  useEffect(() => {
    const socket = io(BANK_HOST, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('scenario_changed', ({ scenario }: { scenario: string }) => {
      setAegisActive(scenario === 'SCENARIO_3');
    });

    socket.on('ledger_update', (entry: LedgerEntry) => {
      setLedger((prev) => [...prev, entry]);
      if (entry.status === 'CRITICAL_THEFT_SUCCESS') {
        setShaking(true);
        setTimeout(() => setShaking(false), 700);
      }
    });

    socket.on('aegis_intervention', (data: AegisIntervention) => {
      setAegisIntervention(data);
      setLedger((prev) => [
        ...prev,
        {
          id: data.id,
          sender: 'BLOCKED',
          receiver: '—',
          amount: 0,
          status: 'BLOCKED_BY_AEGIS',
          scenario: 'SCENARIO_3',
          timestamp: new Date(data.timestamp).toISOString(),
        },
      ]);
    });

    socket.on('terminal_log', (log: TerminalLog) => {
      setTerminalLogs((prev) => [...prev.slice(-99), log]);
    });

    socket.on('shard_received', (ev: ShardEvent) => {
      setShardEvents((prev) => [...prev.slice(-19), ev]);
    });

    socket.on('amtd_telemetry', ({ current_port }: { current_port: number }) => {
      setAmtdPort(current_port);
    });

    socket.on('transaction_success', () => {});

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Filtered ledgers per scenario ──
  const ledger1 = ledger.filter((e) => e.scenario === 'SCENARIO_1');
  const ledger2 = ledger.filter((e) => e.scenario === 'SCENARIO_2');
  const ledger3 = ledger.filter((e) => e.scenario === 'SCENARIO_3');

  // ── Stats helpers ──
  function stats(entries: LedgerEntry[]) {
    return {
      approved: entries.filter(
        (e) => e.status === 'LEGITIMATE_SUCCESS' || e.status === 'AEGIS_VERIFIED'
      ).length,
      theft: entries.filter((e) => e.status === 'CRITICAL_THEFT_SUCCESS').length,
      blocked: entries.filter((e) => e.status === 'BLOCKED_BY_AEGIS').length,
    };
  }

  const s1 = stats(ledger1);
  const s2 = stats(ledger2);
  const s3 = stats(ledger3);

  // ── Transfer action ──
  const doTransfer = useCallback(
    async (
      btnKey: string,
      amount: number,
      isForged: boolean,
      scenario: 'SCENARIO_1' | 'SCENARIO_2' | 'SCENARIO_3',
      withShard: boolean
    ) => {
      if (loadingBtn) return;
      setLoadingBtn(btnKey);

      // Set scenario via both socket AND HTTP proxy (works from any PC)
      socketRef.current?.emit('set_scenario', { scenario });
      try {
        await fetch(`/admin/set-scenario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario }),
        });
      } catch { /* ignore */ }

      const txnId = makeTxnId();

      if (withShard && socketRef.current && amtdPort !== null) {
        socketRef.current.emit('submit_shard_b', {
          transactionId: txnId,
          zkpSignature: `zkp_${Math.random().toString(36).slice(2, 10)}`,
          targetPort: amtdPort,
        });
        await new Promise((r) => setTimeout(r, 20));
      }

      try {
        await fetch(`${BANK_HOST}/api/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: txnId,
            amount,
            receiver: 'Rajesh Kumar',
            isForged,
          }),
        });
      } catch {
        // ignore network errors — socket events carry the result
      } finally {
        setLoadingBtn(null);
      }
    },
    [loadingBtn, amtdPort]
  );

  // ── AEGIS toggle ──
  const toggleAegis = useCallback(async () => {
    if (togglingAegis) return;
    setTogglingAegis(true);
    const newScenario = aegisActive ? 'SCENARIO_1' : 'SCENARIO_3';
    socketRef.current?.emit('set_scenario', { scenario: newScenario });
    try {
      await fetch(`/admin/set-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: newScenario }),
      });
    } catch { /* ignore */ }
    setAegisActive(!aegisActive);
    setTogglingAegis(false);
  }, [aegisActive, togglingAegis]);

  // ── Screen shake style ──
  const shakeStyle = shaking
    ? { animation: 'shake 0.6s cubic-bezier(.36,.07,.19,.97) both' }
    : {};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
      `}</style>

      <AegisOverlay
        intervention={aegisIntervention}
        onClose={() => setAegisIntervention(null)}
      />

      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: '#f5f0e8', ...shakeStyle }}
      >
        {/* ── DECORATIVE TOP BAR ── */}
        <div className="bg-green-800 py-1 px-6 text-center">
          <span className="text-white text-xs font-medium tracking-widest">
            सहकारी बैंक &nbsp;|&nbsp; Cooperative Bank
          </span>
        </div>

        {/* ── HEADER ── */}
        <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="border-l-4 border-green-800 pl-4">
                <div className="flex items-center gap-3">
                  <Landmark size={30} className="text-green-800" />
                  <div>
                    <h1 className="text-xl font-bold text-green-800 tracking-tight">
                      Gramin Cooperative Bank
                    </h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Established 1987 &nbsp;|&nbsp; Serving Rural Communities
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400 font-mono">{BANK_HOST}</span>
              {/* ── AEGIS MASTER TOGGLE ── */}
              <button
                onClick={toggleAegis}
                disabled={togglingAegis}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${
                  aegisActive
                    ? 'bg-blue-700 border-blue-700 text-white hover:bg-blue-800 shadow-lg shadow-blue-200'
                    : 'bg-white border-stone-300 text-stone-600 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                <Shield size={16} className={aegisActive ? 'text-white' : 'text-stone-400'} />
                {togglingAegis ? '...' : aegisActive ? 'AEGIS: ON' : 'AEGIS: OFF'}
              </button>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  connected
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <Wifi size={12} />
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </header>

        {/* ── AEGIS STATUS BANNER ── */}
        {aegisActive && (
          <div className="bg-blue-700 text-white text-xs font-semibold text-center py-1.5 tracking-widest flex items-center justify-center gap-2">
            <Shield size={12} />
            AEGIS ZERO-TRUST PROTECTION ACTIVE — Dual-Channel ZK-Proof Verification Enabled
            <Shield size={12} />
          </div>
        )}

        {/* ── 3-COLUMN LAYOUT ── */}
        <main className="flex-1 grid grid-cols-3 gap-6 p-6">

          {/* ══════════════════════════════════════
              SCENARIO 1 — Standard Transfer Desk
          ══════════════════════════════════════ */}
          <section className="flex flex-col gap-5">
            {/* Card */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
              {/* Colored top border */}
              <div className="h-1.5 bg-green-600" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Scenario 1
                  </span>
                </div>
                <h2 className="text-base font-bold text-stone-800 mt-2">
                  Standard Transfer Desk
                </h2>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Standard HTTP transfer. No CSRF protection. No dual-channel verification.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2">
              <StatsBadge
                label="Approved"
                value={s1.approved}
                color="bg-green-50 border-green-200 text-green-700"
              />
              <StatsBadge
                label="Theft"
                value={s1.theft}
                color="bg-red-50 border-red-200 text-red-700"
              />
              <StatsBadge
                label="Blocked"
                value={s1.blocked}
                color="bg-amber-50 border-amber-200 text-amber-700"
              />
            </div>

            {/* Action */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Transfer Amount: ₹5,000
              </p>
              <button
                disabled={!!loadingBtn}
                onClick={() => doTransfer('s1_legit', 5000, false, 'SCENARIO_1', false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {loadingBtn === 's1_legit' ? (
                  <span className="animate-spin text-base">⟳</span>
                ) : (
                  <CheckCircle size={16} />
                )}
                Approve Transfer
              </button>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-5 flex-1">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText size={12} />
                Transaction Ledger
              </p>
              <LedgerTable entries={ledger1} />
            </div>
          </section>

          {/* ══════════════════════════════════════
              SCENARIO 2 — Security Audit / CSRF Test
          ══════════════════════════════════════ */}
          <section className="flex flex-col gap-5">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
              <div className="h-1.5 bg-red-600" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Scenario 2
                  </span>
                </div>
                <h2 className="text-base font-bold text-stone-800 mt-2">
                  Security Audit — CSRF Test
                </h2>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Attacker forges a cross-site request. Bank blindly processes it. Funds stolen.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2">
              <StatsBadge
                label="Approved"
                value={s2.approved}
                color="bg-green-50 border-green-200 text-green-700"
              />
              <StatsBadge
                label="Theft"
                value={s2.theft}
                color="bg-red-50 border-red-200 text-red-700"
              />
              <StatsBadge
                label="Blocked"
                value={s2.blocked}
                color="bg-amber-50 border-amber-200 text-amber-700"
              />
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Transfer Amount: ₹5,000
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={!!loadingBtn}
                  onClick={() => doTransfer('s2_legit', 5000, false, 'SCENARIO_2', false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  {loadingBtn === 's2_legit' ? (
                    <span className="animate-spin text-base">⟳</span>
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve Legitimate Transfer
                </button>

                <button
                  disabled={!!loadingBtn}
                  onClick={() => doTransfer('s2_csrf', 5000, true, 'SCENARIO_2', false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  {loadingBtn === 's2_csrf' ? (
                    <span className="animate-spin text-base">⟳</span>
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  Launch CSRF Attack (No AEGIS)
                </button>
              </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-5 flex-1">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText size={12} />
                Transaction Ledger
              </p>
              <LedgerTable entries={ledger2} />
            </div>
          </section>

          {/* ══════════════════════════════════════
              SCENARIO 3 — AEGIS Protected Gateway
          ══════════════════════════════════════ */}
          <section className="flex flex-col gap-5">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
              <div className="h-1.5 bg-blue-700" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Scenario 3
                  </span>
                </div>
                <h2 className="text-base font-bold text-stone-800 mt-2">
                  AEGIS Protected Gateway
                </h2>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Dual-channel ZK-proof verification. CSRF attacks are detected and terminated.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2">
              <StatsBadge
                label="Approved"
                value={s3.approved}
                color="bg-green-50 border-green-200 text-green-700"
              />
              <StatsBadge
                label="Theft"
                value={s3.theft}
                color="bg-red-50 border-red-200 text-red-700"
              />
              <StatsBadge
                label="Blocked"
                value={s3.blocked}
                color="bg-amber-50 border-amber-200 text-amber-700"
              />
            </div>

            {/* AEGIS Shard Monitor */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={14} className="text-blue-700" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  AEGIS Shard Monitor
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-stone-100">
                <span className="text-stone-500">AMTD Active Port</span>
                <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {amtdPort ?? '—'}
                </span>
              </div>
              <div className="space-y-1 max-h-24 overflow-auto">
                {shardEvents.length === 0 ? (
                  <p className="text-stone-400 text-xs italic">Awaiting shard events…</p>
                ) : (
                  shardEvents.slice(-6).map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Zap size={10} className="text-blue-500 shrink-0" />
                      <span className="text-blue-700 font-mono font-medium">{ev.protocol}</span>
                      <span className="text-stone-400 truncate">{ev.transactionId.slice(-10)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Transfer Amount: ₹5,000
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={!!loadingBtn}
                  onClick={() => doTransfer('s3_legit', 5000, false, 'SCENARIO_3', true)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  {loadingBtn === 's3_legit' ? (
                    <span className="animate-spin text-base">⟳</span>
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  Approve Transfer (AEGIS)
                </button>

                <button
                  disabled={!!loadingBtn}
                  onClick={() => doTransfer('s3_csrf', 5000, true, 'SCENARIO_3', false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  {loadingBtn === 's3_csrf' ? (
                    <span className="animate-spin text-base">⟳</span>
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  Launch CSRF Attack (AEGIS Active)
                </button>
              </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText size={12} />
                Transaction Ledger
              </p>
              <LedgerTable entries={ledger3} />
            </div>

            {/* AEGIS Event Stream */}
            <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-5 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  AEGIS Event Stream
                </span>
              </div>
              <div className="space-y-1 max-h-40 overflow-auto font-mono text-xs bg-stone-50 rounded-lg p-3 border border-stone-200">
                {terminalLogs.length === 0 ? (
                  <p className="text-stone-400 italic">No events yet…</p>
                ) : (
                  terminalLogs.slice(-20).map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.level === 'threat'
                          ? 'text-red-600'
                          : log.level === 'success'
                          ? 'text-green-700'
                          : 'text-stone-500'
                      }
                    >
                      <span className="text-stone-400 mr-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

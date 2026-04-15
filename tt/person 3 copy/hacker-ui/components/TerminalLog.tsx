'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '../types/exploit';

// Bright, fully visible colors on black background
const colorMap: Record<LogEntry['type'], string> = {
  INFO:     '#22c55e',   // bright green
  WARNING:  '#facc15',   // bright yellow
  CRITICAL: '#f87171',   // bright red
  SUCCESS:  '#4ade80',   // bright emerald
};

const prefixMap: Record<LogEntry['type'], string> = {
  INFO:     '[INFO]    ',
  WARNING:  '[WARN]    ',
  CRITICAL: '[CRITICAL]',
  SUCCESS:  '[SUCCESS] ',
};

function TypewriterLine({ entry }: { entry: LogEntry }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const speed = entry.type === 'CRITICAL' ? 10 : 14;
    const interval = setInterval(() => {
      i++;
      setDisplayed(entry.message.slice(0, i));
      if (i >= entry.message.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [entry.message, entry.type]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.1 }}
      style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: '13px',
        lineHeight: '1.7',
        display: 'flex',
        gap: '10px',
        marginBottom: '2px',
      }}
    >
      {/* Timestamp */}
      <span style={{ color: '#6b7280', flexShrink: 0, fontSize: '11px', paddingTop: '1px' }}>
        {entry.timestamp}
      </span>
      {/* Prefix */}
      <span style={{ color: colorMap[entry.type], flexShrink: 0, fontWeight: 700 }}>
        {prefixMap[entry.type]}
      </span>
      {/* Message */}
      <span style={{ color: colorMap[entry.type] }}>
        {displayed}
        {displayed.length < entry.message.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            style={{ color: colorMap[entry.type] }}
          >█</motion.span>
        )}
      </span>
    </motion.div>
  );
}

export function TerminalLog({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      style={{
        height: '100%',
        background: '#050505',
        border: '1px solid rgba(220,38,38,0.5)',
        borderRadius: 0,
        padding: '12px 16px',
        overflowY: 'auto',
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 10px rgba(220,38,38,0.1)',
      }}
    >
      {/* Terminal chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(220,38,38,0.3)',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', boxShadow: '0 0 6px #eab308' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
        </div>
        <span style={{ color: '#6b7280', fontSize: '11px', letterSpacing: '0.1em' }}>root@c2-node-3:~#</span>
        <motion.div
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>

      {/* Logs */}
      {logs.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '13px' }}>
          <span>root@c2-node-3:~#</span>
          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>█</motion.span>
        </div>
      ) : (
        <AnimatePresence>
          {logs.map(entry => (
            <TypewriterLine key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

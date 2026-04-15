'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '../types/exploit';

const colorMap: Record<LogEntry['type'], string> = {
  INFO:     'text-green-400',
  WARNING:  'text-yellow-400',
  CRITICAL: 'text-red-400',
  SUCCESS:  'text-green-300',
};

const prefixMap: Record<LogEntry['type'], string> = {
  INFO:     '  ',
  WARNING:  '⚠ ',
  CRITICAL: '✖ ',
  SUCCESS:  '✔ ',
};

function TypewriterLine({ entry }: { entry: LogEntry }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const speed = entry.type === 'CRITICAL' ? 12 : 16;
    const interval = setInterval(() => {
      i++;
      setDisplayed(entry.message.slice(0, i));
      if (i >= entry.message.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [entry.message, entry.type]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`font-mono text-xs leading-relaxed flex gap-2 ${colorMap[entry.type]}`}
    >
      <span className="text-red-900/50 shrink-0 tabular-nums">[{entry.timestamp}]</span>
      <span className="text-red-700/60 shrink-0">{prefixMap[entry.type]}</span>
      <span>
        {displayed}
        {displayed.length < entry.message.length && (
          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>█</motion.span>
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
    <div className="h-full rounded-none p-4 overflow-y-auto font-mono border border-red-900/30"
      style={{
        background: 'linear-gradient(180deg, #020000 0%, #000 100%)',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), inset 0 0 1px rgba(220,38,38,0.1)',
      }}
    >
      {/* Terminal chrome */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-900/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600/80" style={{ boxShadow: '0 0 4px rgba(220,38,38,0.6)' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-600/80" style={{ boxShadow: '0 0 4px rgba(202,138,4,0.6)' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-green-600/80" style={{ boxShadow: '0 0 4px rgba(22,163,74,0.6)' }} />
        </div>
        <span className="text-red-900/60 text-[10px] tracking-widest">root@c2-node-3 ~ #</span>
        <motion.div className="w-1.5 h-1.5 rounded-full bg-red-600"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>

      {logs.length === 0 ? (
        <div className="flex items-center gap-2 text-red-900/40 text-xs">
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

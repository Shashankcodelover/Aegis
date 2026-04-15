'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldOff } from 'lucide-react';

interface Props {
  visible: boolean;
  onReset: () => void;
}

export function FailureOverlay({ visible, onReset }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Blur backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'rgba(0,0,0,0.85)' }}
          />

          {/* Glitch flash */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              skewX: [0, -5, 5, -3, 3, -1, 1, 0],
              filter: ['invert(0)', 'invert(1)', 'invert(0)', 'invert(1)', 'invert(0)', 'invert(0)'],
              opacity: [1, 0.8, 1, 0.9, 1],
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* Scanlines on overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'repeating-linear-gradient(transparent 50%, rgba(220,38,38,0.15) 50%)',
              backgroundSize: '100% 4px',
            }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 border-2 border-red-500 max-w-xl w-full mx-6 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a0000 0%, #0d0000 100%)',
              boxShadow: '0 0 100px rgba(220,38,38,1), 0 0 40px rgba(220,38,38,0.6), inset 0 0 40px rgba(220,38,38,0.1)',
            }}
            initial={{ scale: 0.3, opacity: 0, y: 80 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 18 }}
          >
            {/* Top bar */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-red-800/50"
              style={{ background: 'rgba(220,38,38,0.15)' }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-[10px] tracking-widest font-mono uppercase">AEGIS Security System — Threat Response</span>
            </div>

            <div className="p-8 text-center flex flex-col items-center gap-5">
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ filter: 'drop-shadow(0 0 20px rgba(220,38,38,0.9))' }}
              >
                <ShieldOff className="w-16 h-16 text-red-400" strokeWidth={1.2} />
              </motion.div>

              <div>
                <motion.h2
                  className="text-white font-mono font-black text-xl tracking-[0.2em] uppercase"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ textShadow: '0 0 20px rgba(220,38,38,0.8)' }}
                >
                  ACCESS FAILED
                </motion.h2>
                <p className="text-red-300 font-mono text-sm tracking-wider uppercase mt-2">
                  ZERO-TRUST INTERCEPTION
                </p>
                <p className="text-red-500/80 font-mono text-xs tracking-widest uppercase mt-1">
                  CONNECTION SEVERED BY AEGIS SECURITY SYSTEM
                </p>
              </div>

              <div className="w-full border border-red-900/50 p-3 text-left"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                {[
                  'HTTP 403 FORBIDDEN',
                  'ZK-PROOF VALIDATION: FAILED',
                  'WEBRTC SHARD: NOT FOUND',
                  'ORIGIN: FLAGGED AS AUTOMATED BOT',
                ].map((line, i) => (
                  <motion.p key={line} className="text-red-600/80 text-[10px] font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                  >
                    ✖ {line}
                  </motion.p>
                ))}
              </div>

              <button onClick={onReset}
                className="border border-red-800/50 text-red-800 font-mono text-[10px] tracking-widest px-6 py-2 hover:border-red-600/60 hover:text-red-600 transition-colors rounded-none uppercase">
                ↺ RESET TERMINAL
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

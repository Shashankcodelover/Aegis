'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface Props {
  visible: boolean;
  onReset: () => void;
}

export function SuccessOverlay({ visible, onReset }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: 'rgba(0,0,0,0.80)' }}
          />

          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background: 'repeating-linear-gradient(transparent 50%, rgba(34,197,94,0.15) 50%)',
              backgroundSize: '100% 4px',
            }}
          />

          <motion.div
            className="relative z-10 border-2 border-green-500 max-w-xl w-full mx-6 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #001a00 0%, #000d00 100%)',
              boxShadow: '0 0 80px rgba(34,197,94,0.8), 0 0 30px rgba(34,197,94,0.4), inset 0 0 40px rgba(34,197,94,0.08)',
            }}
            initial={{ scale: 0.3, opacity: 0, y: 80 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 18 }}
          >
            {/* Top bar */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-green-900/50"
              style={{ background: 'rgba(34,197,94,0.1)' }}>
              <motion.div className="w-2 h-2 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <span className="text-green-600 text-[10px] tracking-widest font-mono uppercase">Exploit Successful — Funds Transferred</span>
            </div>

            <div className="p-8 text-center flex flex-col items-center gap-5">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.9, delay: 0.3 }}
                style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.9))' }}
              >
                <Zap className="w-16 h-16 text-green-400" strokeWidth={1.2} />
              </motion.div>

              <div>
                <motion.h2
                  className="text-green-400 font-mono font-black text-xl tracking-[0.2em] uppercase"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ textShadow: '0 0 20px rgba(34,197,94,0.8)' }}
                >
                  FUNDS ACQUIRED
                </motion.h2>
                <p className="text-green-300 font-mono text-lg tracking-wider uppercase mt-2">
                  ₹5,000 REDIRECTED TO OFFSHORE ACCOUNT
                </p>
                <p className="text-green-700/80 font-mono text-xs tracking-widest uppercase mt-1">
                  LEGACY BANK COMPROMISED — NO CSRF PROTECTION
                </p>
              </div>

              <div className="w-full border border-green-900/50 p-3 text-left"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                {[
                  'HTTP 200 OK — REQUEST ACCEPTED',
                  'SESSION COOKIES: HIJACKED',
                  'CSRF TOKEN: ABSENT',
                  'BANK TRANSACTION: PROCESSED SILENTLY',
                ].map((line, i) => (
                  <motion.p key={line} className="text-green-700/80 text-[10px] font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                  >
                    ✔ {line}
                  </motion.p>
                ))}
              </div>

              <button onClick={onReset}
                className="border border-green-900/50 text-green-900 font-mono text-[10px] tracking-widest px-6 py-2 hover:border-green-600/50 hover:text-green-600 transition-colors rounded-none uppercase">
                ↺ RESET TERMINAL
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

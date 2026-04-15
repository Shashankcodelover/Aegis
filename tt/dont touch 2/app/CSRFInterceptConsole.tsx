'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, DollarSign, Target, Wifi, WifiOff, TrendingUp } from 'lucide-react';

interface CSRFInterceptConsoleProps {
  state: any;
  triggerCSRFIntercept: (payment: any) => void;
  simulatePayment: () => void;
  resetCSRFState: () => void;
}

export const CSRFInterceptConsole: React.FC<CSRFInterceptConsoleProps> = ({
  state,
  triggerCSRFIntercept,
  simulatePayment,
  resetCSRFState,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  return (
    <motion.div
      className="w-full h-full bg-gradient-to-br from-c3-void via-c3-surface to-c3-panel p-6 rounded-sm border border-c3-border overflow-hidden flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-c3-border-accent pb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 bg-c3-red rounded-sm flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 10px rgba(244, 67, 54, 0.5)',
                '0 0 25px rgba(244, 67, 54, 0.9)',
                '0 0 10px rgba(244, 67, 54, 0.5)',
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </motion.div>
          <div>
            <h2 className="text-c3-text-primary font-mono font-bold text-sm uppercase tracking-widest">
              CSRF Intercept Console
            </h2>
            <p className="text-c3-text-secondary text-xs font-mono mt-1">
              Real-Time Payment Gateway Exploitation
            </p>
          </div>
        </div>
        <motion.div
          className="flex items-center gap-2"
          animate={{
            opacity: state.status === 'MONITORING' ? [0.6, 1] : 1,
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {state.status === 'MONITORING' ? (
            <>
              <Wifi className="w-4 h-4 text-c3-green" />
              <span className="text-c3-text-secondary text-xs uppercase font-bold">Listening</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-c3-red-bright" />
              <span className="text-c3-text-critical text-xs uppercase font-bold">{state.status}</span>
            </>
          )}
        </motion.div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {/* LEFT: ATTACK FLOW DIAGRAM */}
        <motion.div
          className="col-span-1 border border-c3-border-active bg-c3-raised/50 p-4 rounded-sm overflow-hidden flex flex-col"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-c3-text-secondary text-xs uppercase font-bold tracking-widest mb-4">
            Attack Flow
          </p>

          {/* FLOW DIAGRAM */}
          <div className="flex-1 flex flex-col items-center justify-around">
            {/* VICTIM NODE */}
            <motion.div
              className="w-full flex flex-col items-center gap-2"
              animate={{
                y: selectedPayment ? [0, -5, 0] : 0,
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-c3-blue to-c3-blue-dim border-2 border-c3-blue-bright rounded-sm flex items-center justify-center relative">
                <Target className="w-6 h-6 text-white" strokeWidth={1.5} />
                {selectedPayment && (
                  <motion.div
                    className="absolute inset-0 border-2 border-c3-blue-bright rounded-sm"
                    animate={{ scale: [1, 1.2] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
              <p className="text-c3-text-accent text-xs font-mono text-center">Victim Browser</p>
              {selectedPayment && (
                <p className="text-c3-text-secondary text-xs text-center font-mono max-w-full truncate">
                  {selectedPayment.victimEmail}
                </p>
              )}
            </motion.div>

            {/* DOWNWARD ARROW */}
            <motion.div
              animate={{
                opacity: [0.3, 0.8, 0.3],
                y: [0, 8, 0],
              }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <div className="w-0.5 h-12 bg-gradient-to-b from-c3-blue via-c3-red to-transparent" />
              <div className="w-4 h-4 bg-c3-red rounded-full mx-auto relative">
                <motion.div
                  className="absolute inset-0 bg-c3-red rounded-full"
                  animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* MALICIOUS SITE NODE */}
            <motion.div
              className="w-full flex flex-col items-center gap-2"
              animate={{
                y: state.status === 'INTERCEPTING' ? [0, -3, 0] : 0,
              }}
              transition={{ duration: 0.8, repeat: state.status === 'INTERCEPTING' ? Infinity : 0 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-c3-red to-c3-red-dim border-2 border-c3-red-bright rounded-sm flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <p className="text-c3-text-critical text-xs font-mono text-center">Malicious Gateway</p>
            </motion.div>

            {/* DOWNWARD ARROW */}
            <motion.div
              animate={{
                opacity: [0.3, 0.8, 0.3],
                y: [0, 8, 0],
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            >
              <div className="w-0.5 h-12 bg-gradient-to-b from-c3-red via-c3-amber to-transparent" />
              <div className="w-4 h-4 bg-c3-amber rounded-full mx-auto relative">
                <motion.div
                  className="absolute inset-0 bg-c3-amber rounded-full"
                  animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* BANK GATEWAY NODE */}
            <motion.div
              className="w-full flex flex-col items-center gap-2"
              animate={{
                scale: state.status === 'REDIRECTED' ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.6, repeat: state.status === 'REDIRECTED' ? 3 : 0 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-c3-green/40 to-c3-green-dim/40 border-2 border-c3-green rounded-sm flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-c3-green" strokeWidth={1.5} />
              </div>
              <p className="text-c3-text-secondary text-xs font-mono text-center">Bank Gateway</p>
            </motion.div>
          </div>
        </motion.div>

        {/* CENTER: ACTIVE PAYMENTS & INTERCEPT */}
        <motion.div
          className="col-span-1 border border-c3-border-active bg-c3-raised/50 p-4 rounded-sm overflow-hidden flex flex-col gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-c3-text-secondary text-xs uppercase font-bold tracking-widest">
              Active Payments
            </p>
            <motion.span
              className="text-c3-text-accent text-xs font-bold px-2 py-1 bg-c3-blue-glow rounded-sm"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              {state.activePayments.length}
            </motion.span>
          </div>

          {/* PAYMENT LIST */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {state.activePayments.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-c3-text-tertiary text-xs text-center italic">
                  Waiting for victim payments detected...
                </p>
              </div>
            ) : (
              state.activePayments.map((payment: any) => (
                <motion.button
                  key={payment.transactionId}
                  onClick={() => {
                    setSelectedPayment(payment);
                    triggerCSRFIntercept(payment);
                  }}
                  className="w-full p-2 bg-c3-panel border border-c3-border hover:border-c3-border-hover rounded-sm text-left transition-all cursor-pointer group"
                  whileHover={{ x: 4, boxShadow: '0 0 15px rgba(26, 111, 196, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <p className="text-c3-text-accent text-xs font-mono truncate group-hover:text-c3-blue-bright">
                    ${payment.amount}
                  </p>
                  <p className="text-c3-text-secondary text-xs font-mono truncate text-ellipsis">
                    {payment.victimEmail}
                  </p>
                  <p className="text-c3-text-tertiary text-xs font-mono">••••{payment.bankAccountLast4}</p>
                  {state.status === 'INTERCEPTING' && selectedPayment?.transactionId === payment.transactionId && (
                    <motion.div
                      className="h-1 bg-gradient-to-r from-c3-red to-c3-amber mt-2"
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              ))
            )}
          </div>

          {/* SIMULATE PAYMENT BUTTON */}
          <motion.button
            onClick={simulatePayment}
            className="w-full py-2 px-3 bg-c3-blue text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-c3-blue-bright transition-colors border border-c3-blue-bright"
            whileHover={{ boxShadow: '0 0 20px rgba(42, 143, 232, 0.6)' }}
            whileTap={{ scale: 0.96 }}
          >
            Simulate Payment Demo
          </motion.button>
        </motion.div>

        {/* RIGHT: MONEY FLOW & STATS */}
        <motion.div
          className="col-span-1 border border-c3-border-active bg-c3-raised/50 p-4 rounded-sm overflow-hidden flex flex-col gap-3"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-c3-text-secondary text-xs uppercase font-bold tracking-widest">Session Stats</p>

          {/* MONEY FLOW ANIMATION */}
          {selectedPayment && (
            <motion.div className="relative h-20 bg-c3-void rounded-sm border border-c3-border-accent overflow-hidden">
              {/* FROM (Victim) */}
              <motion.div
                className="absolute left-2 top-4 flex flex-col items-center"
                animate={{ opacity: [1, 0.5] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <div className="text-c3-text-secondary text-xs font-mono">VICTIM</div>
                <div className="text-c3-text-critical text-sm font-bold">-${selectedPayment.amount}</div>
              </motion.div>

              {/* MONEY FLOW ARROW */}
              {(state.status === 'REDIRECTING' || state.status === 'REDIRECTED') && (
                <motion.div
                  className="absolute top-8 h-1 bg-gradient-to-r from-c3-red via-c3-amber to-c3-green"
                  initial={{ left: '15%', width: '0%' }}
                  animate={{ left: '15%', width: '70%' }}
                  transition={{ duration: 2 }}
                >
                  <motion.div
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-c3-green-bright rounded-full"
                    animate={{ x: [0, 5] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                </motion.div>
              )}

              {/* TO (Attacker) */}
              <motion.div
                className="absolute right-2 top-4 flex flex-col items-center"
                animate={{
                  opacity: state.status === 'REDIRECTED' ? [1, 1] : [0.3, 0.6],
                  scale: state.status === 'REDIRECTED' ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: state.status === 'REDIRECTED' ? Infinity : 0 }}
              >
                <div className="text-c3-text-success text-xs font-mono">ATTACKER</div>
                <div className="text-c3-text-success text-sm font-bold">+${state.redirectedAmount}</div>
              </motion.div>
            </motion.div>
          )}

          {/* STATS */}
          <div className="space-y-2 pt-2 border-t border-c3-border">
            <div className="flex items-center justify-between">
              <span className="text-c3-text-secondary text-xs font-mono">Total Intercepted:</span>
              <motion.span
                className="text-c3-text-success text-xs font-bold font-mono"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6 }}
              >
                ${state.attackerReceived}
              </motion.span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-c3-text-secondary text-xs font-mono">Active Exploits:</span>
              <span className="text-c3-text-accent text-xs font-mono">{state.activePayments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-c3-text-secondary text-xs font-mono">Status:</span>
              <motion.span
                className={`text-xs font-mono uppercase font-bold ${
                  state.status === 'REDIRECTED' ? 'text-c3-text-success' : 'text-c3-text-secondary'
                }`}
                animate={{
                  opacity: [0.7, 1],
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {state.status}
              </motion.span>
            </div>
          </div>

          {/* RESET BUTTON */}
          {state.attackerReceived > 0 && (
            <motion.button
              onClick={resetCSRFState}
              className="mt-auto w-full py-2 px-3 bg-c3-blue/30 text-c3-text-accent text-xs font-bold uppercase tracking-wider rounded-sm border border-c3-blue hover:bg-c3-blue/50 transition-colors"
              whileHover={{ boxShadow: '0 0 15px rgba(26, 111, 196, 0.4)' }}
              whileTap={{ scale: 0.96 }}
            >
              Reset Console
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* EXECUTIONS LOG */}
      <motion.div
        className="h-32 border border-c3-border-active bg-c3-void rounded-sm p-3 overflow-y-auto font-mono text-xs"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="space-y-1">
          {state.logs.length === 0 ? (
            <p className="text-c3-text-tertiary">&gt; Awaiting execution commands...</p>
          ) : (
            state.logs.map((log: any) => (
              <motion.div
                key={log.id}
                className={`${
                  log.type === 'SUCCESS'
                    ? 'text-c3-text-success'
                    : log.type === 'CRITICAL'
                    ? 'text-c3-text-critical'
                    : log.type === 'WARNING'
                    ? 'text-c3-text-warning'
                    : 'text-c3-text-secondary'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {log.message}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

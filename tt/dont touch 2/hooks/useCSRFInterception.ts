z'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CSRFInterceptState, VictimPayment, LogEntry, CSRFStatus } from '@/types/exploit';

export const useCSRFInterception = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<CSRFInterceptState>({
    status: 'MONITORING',
    activePayments: [],
    interceptedPayment: null,
    redirectedAmount: 0,
    attackerReceived: 0,
    logs: [],
  });

  const addLog = (message: string, type: LogEntry['type']) => {
    const newEntry: LogEntry = {
      id: `csrf_log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-50), newEntry], // Keep last 50
    }));
  };

  // Initialize WebSocket connection to listen for Person 1's payments
  useEffect(() => {
    const PAYMENT_SERVER = process.env.NEXT_PUBLIC_PAYMENT_SERVER || 'ws://localhost:3003';
    
    try {
      wsRef.current = new WebSocket(PAYMENT_SERVER);
      
      wsRef.current.onopen = () => {
        addLog('> Payment gateway listener ACTIVE. Monitoring Person 1 transactions...', 'INFO');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'PAYMENT_INITIATED') {
            const victimPayment: VictimPayment = {
              transactionId: data.transactionId,
              victimEmail: data.email,
              victimAccountId: data.accountId,
              amount: data.amount,
              bankAccountLast4: data.accountLast4,
              timestamp: new Date().toISOString(),
              status: 'PROCESSING',
            };

            setState(prev => ({
              ...prev,
              activePayments: [...prev.activePayments, victimPayment],
              status: 'PAYMENT_DETECTED',
            }));

            addLog(
              `> PAYMENT DETECTED: ${data.email} | Amount: $${data.amount} | Account: ••••${data.accountLast4}`,
              'WARNING'
            );
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        addLog('> WebSocket connection error. Falling back to demo mode...', 'CRITICAL');
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        addLog('> Payment gateway listener disconnected.', 'INFO');
      };
    } catch (err) {
      addLog('> Could not establish payment monitoring connection. Using demo mode.', 'WARNING');
      console.error('WebSocket init error:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const triggerCSRFIntercept = useCallback(async (payment: VictimPayment) => {
    setState(prev => ({
      ...prev,
      status: 'INTERCEPTING',
      interceptedPayment: payment,
    }));

    addLog(`> Initiating CSRF interception for transaction ${payment.transactionId}...`, 'INFO');
    await new Promise(r => setTimeout(r, 300));

    addLog(
      `> Injecting malicious request into payment gateway iframe layer (credentials: 'include')...`,
      'WARNING'
    );
    await new Promise(r => setTimeout(r, 400));

    addLog(
      `> Forging hidden form submission from ${payment.victimEmail}'s authenticated session...`,
      'CRITICAL'
    );
    await new Promise(r => setTimeout(r, 400));

    try {
      // Simulated attack execution
      setState(prev => ({
        ...prev,
        status: 'REDIRECTING',
      }));

      addLog(`> Intercepting $${payment.amount} payment redirect...`, 'CRITICAL');
      await new Promise(r => setTimeout(r, 600));

      setState(prev => ({
        ...prev,
        status: 'REDIRECTED',
        redirectedAmount: payment.amount,
        attackerReceived: prev.attackerReceived + payment.amount,
        interceptedPayment: {
          ...payment,
          status: 'INTERCEPTED',
        },
      }));

      addLog(
        `> SUCCESS: $${payment.amount} redirected to attacker offshore wallet (0x9A4F_C2_AEGIS_DRAIN).`,
        'SUCCESS'
      );
      addLog(`> Total stolen (this session): $${state.attackerReceived + payment.amount}`, 'SUCCESS');

      // Remove from active payments
      setState(prev => ({
        ...prev,
        activePayments: prev.activePayments.filter(p => p.transactionId !== payment.transactionId),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'FAILED',
      }));
      addLog(
        `> CSRF Interception FAILED: Bank's zero-trust defense detected payment manipulation.`,
        'CRITICAL'
      );
    }
  }, [state.attackerReceived]);

  const simulatePayment = useCallback(() => {
    const randomEmail = `victim${Math.floor(Math.random() * 10000)}@bank.com`;
    const randomAmount = Math.floor(Math.random() * 15000) + 5000;
    
    const victimPayment: VictimPayment = {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      victimEmail: randomEmail,
      victimAccountId: `ACC_${Math.floor(Math.random() * 1000000)}`,
      amount: randomAmount,
      bankAccountLast4: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
      timestamp: new Date().toISOString(),
      status: 'PROCESSING',
    };

    setState(prev => ({
      ...prev,
      activePayments: [...prev.activePayments, victimPayment],
      status: 'PAYMENT_DETECTED',
    }));

    addLog(
      `> DEMO PAYMENT: ${randomEmail} | Amount: $${randomAmount} | Account: ••••${victimPayment.bankAccountLast4}`,
      'WARNING'
    );
  }, []);

  const resetCSRFState = useCallback(() => {
    setState({
      status: 'MONITORING',
      activePayments: [],
      interceptedPayment: null,
      redirectedAmount: 0,
      attackerReceived: 0,
      logs: [],
    });
    addLog('> CSRF intercept console reset. Ready for new operations.', 'INFO');
  }, []);

  return {
    state,
    triggerCSRFIntercept,
    simulatePayment,
    resetCSRFState,
    addLog,
  };
};

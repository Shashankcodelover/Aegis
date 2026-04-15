'use client';

import { useState, useCallback, useRef } from 'react';
import { ExploitStatus, Scenario, LogEntry, C2AttackState } from '@/types/exploit';

export interface UseC2AttackReturn {
  status: ExploitStatus;
  scenario: Scenario;
  logs: LogEntry[];
  targetUrl: string;
  launchPayload: () => Promise<void>;
  setScenario: (s: Scenario) => void;
  reset: () => void;
}

const INITIAL_TARGET_URL = `http://${process.env.NEXT_PUBLIC_AEGIS_IP ?? 'localhost'}:3002/gateway/shard-a`;

const initialState: C2AttackState = {
  status: 'IDLE',
  scenario: 'LEGACY',
  logs: [],
  targetUrl: INITIAL_TARGET_URL,
};

export function useC2Attack(): UseC2AttackReturn {
  const [state, setState] = useState<C2AttackState>(initialState);
  const stateRef = useRef<C2AttackState>(initialState);

  // Keep ref in sync so launchPayload can read current values without stale closures
  const syncedSetState = useCallback((updater: (prev: C2AttackState) => C2AttackState) => {
    setState(prev => {
      const next = updater(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    syncedSetState(prev => ({ ...prev, logs: [...prev.logs, entry] }));
  }, [syncedSetState]);

  const setScenario = useCallback((s: Scenario) => {
    syncedSetState(prev => ({ ...prev, scenario: s }));
  }, [syncedSetState]);

  const reset = useCallback(() => {
    syncedSetState(prev => ({ ...prev, status: 'IDLE', logs: [] }));
  }, [syncedSetState]);

  const launchPayload = useCallback(async () => {
    if (stateRef.current.status !== 'IDLE') return;

    const { scenario, targetUrl } = stateRef.current;

    syncedSetState(prev => ({ ...prev, status: 'INJECTING' }));
    addLog('Forging CSRF request...', 'INFO');
    addLog('Hijacking session cookies...', 'WARNING');

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 99999, isForged: true, scenario }),
      });

      if (response.ok && scenario === 'LEGACY') {
        syncedSetState(prev => ({ ...prev, status: 'SUCCESS' }));
        addLog('TARGET COMPROMISED. FUNDS TRANSFERRED.', 'SUCCESS');
      } else {
        syncedSetState(prev => ({ ...prev, status: 'FAILED_BLURRED' }));
        addLog('ACCESS DENIED: ZERO-TRUST INTERCEPTION BY AEGIS.', 'CRITICAL');
      }
    } catch {
      syncedSetState(prev => ({ ...prev, status: 'FAILED_BLURRED' }));
      addLog('ACCESS DENIED: ZERO-TRUST INTERCEPTION BY AEGIS.', 'CRITICAL');
    }
  }, [addLog, syncedSetState]);

  return {
    status: state.status,
    scenario: state.scenario,
    logs: state.logs,
    targetUrl: state.targetUrl,
    launchPayload,
    setScenario,
    reset,
  };
}

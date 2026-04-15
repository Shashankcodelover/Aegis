'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScenarioMode } from '../types/exploit';

const AEGIS_GATEWAY = `http://${process.env.NEXT_PUBLIC_AEGIS_IP ?? 'localhost'}:5002`;

// Module-level singleton — survives StrictMode double-mount
let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(AEGIS_GATEWAY, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      autoConnect: true,
    });
    _socket.on('connect', () => console.log('[Hacker C2] Connected to AEGIS Gateway'));
    _socket.on('disconnect', () => console.log('[Hacker C2] AEGIS Gateway disconnected'));
  }
  return _socket;
}

export const useAegisSync = (onModeChange: (mode: ScenarioMode) => void) => {
  const cbRef = useRef(onModeChange);
  cbRef.current = onModeChange;

  useEffect(() => {
    const socket = getSocket();

    const onStatus = ({ active }: { active: boolean }) => {
      cbRef.current(active ? 'AEGIS_SECURED' : 'LEGACY_VULNERABLE');
    };
    const onScenario = ({ scenario }: { scenario: string }) => {
      cbRef.current(scenario === 'SCENARIO_3' ? 'AEGIS_SECURED' : 'LEGACY_VULNERABLE');
    };

    socket.on('aegis_status', onStatus);
    socket.on('scenario_changed', onScenario);

    return () => {
      socket.off('aegis_status', onStatus);
      socket.off('scenario_changed', onScenario);
      // Don't disconnect — keep singleton alive
    };
  }, []); // empty deps — singleton handles reconnection
};

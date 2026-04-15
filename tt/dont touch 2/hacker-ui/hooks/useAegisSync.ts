'use client';

import { useEffect } from 'react';
import { ScenarioMode } from '../types/exploit';

const WS_URL = 'ws://192.168.1.100:3003'; // AEGIS machine WebSocket signal server

export const useAegisSync = (onModeChange: (mode: ScenarioMode) => void) => {
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.aegisActive === true) {
              onModeChange('AEGIS_SECURED');
            } else if (data.aegisActive === false) {
              onModeChange('LEGACY_VULNERABLE');
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onerror = () => {
          // silently fail — manual toggle still works
        };

        ws.onclose = () => {
          // retry connection every 5s
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {
        retryTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      ws?.close();
    };
  }, [onModeChange]);
};

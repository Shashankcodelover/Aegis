'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, Cpu } from 'lucide-react';

const FAKE_IPS = [
  '10.0.0.47', '172.16.4.23', '192.168.1.100',
  '10.10.5.88', '172.31.0.12', '192.168.43.1',
];

export function RadarModule() {
  const [port, setPort] = useState('SCANNING...');
  const [ip, setIp] = useState(FAKE_IPS[0]);
  const [gpuWarning, setGpuWarning] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const portInterval = setInterval(() => {
      setPort(String(Math.floor(10000 + Math.random() * 55535)));
      setAttempts(a => a + 1);
    }, 110);
    const ipInterval = setInterval(() => {
      setIp(FAKE_IPS[Math.floor(Math.random() * FAKE_IPS.length)]);
    }, 1800);
    return () => { clearInterval(portInterval); clearInterval(ipInterval); };
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setGpuWarning(p => !p), 850);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="flex gap-3 h-full">

      {/* Port Scanner */}
      <div className="flex-1 border border-red-900/50 rounded-none flex flex-col overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.7)', boxShadow: 'inset 0 0 20px rgba(220,38,38,0.04)' }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-red-900/30"
          style={{ background: 'rgba(127,29,29,0.1)' }}>
          <Radar className="w-3 h-3 text-red-500" />
          <span className="text-red-600 text-[10px] tracking-widest uppercase">AMTD Port Scanner</span>
          <div className="ml-auto flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div key={i} className="w-1 h-1 rounded-full bg-red-600"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3">
          <motion.div
            key={port}
            initial={{ opacity: 0.4, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-400 font-mono text-3xl font-black tracking-[0.15em]"
            style={{ textShadow: '0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3)' }}
          >
            :{port}
          </motion.div>
          <div className="text-red-800 text-[10px] font-mono">{ip}</div>
          <div className="w-full bg-red-950/30 h-1 rounded-none overflow-hidden">
            <motion.div className="h-full bg-red-600"
              animate={{ width: ['0%', '100%'] }}
              transition={{ duration: 0.11, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="text-red-900/60 text-[10px] font-mono">
            {attempts.toLocaleString()} ATTEMPTS
          </div>
        </div>
      </div>

      {/* GPU Spoof */}
      <div className="flex-1 border border-yellow-900/40 rounded-none flex flex-col overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.7)', boxShadow: 'inset 0 0 20px rgba(202,138,4,0.03)' }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-yellow-900/30"
          style={{ background: 'rgba(78,52,0,0.15)' }}>
          <Cpu className="w-3 h-3 text-yellow-600" />
          <span className="text-yellow-700 text-[10px] tracking-widest uppercase">Hardware Attestation</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3">
          <motion.div
            animate={{ opacity: gpuWarning ? 1 : 0.25 }}
            className="border border-yellow-600/40 px-4 py-3 text-center w-full"
            style={{ background: 'rgba(78,52,0,0.2)', boxShadow: gpuWarning ? '0 0 15px rgba(202,138,4,0.2)' : 'none' }}
          >
            <p className="text-yellow-400 text-xs font-mono font-bold tracking-wider">⚠ WebGPU FAILED</p>
            <p className="text-yellow-700/80 text-[10px] font-mono mt-1">Attestation handshake rejected</p>
          </motion.div>

          <div className="w-full flex flex-col gap-1.5 text-[10px] font-mono">
            {[
              { label: 'GPU EMULATION', status: 'ACTIVE', ok: true },
              { label: 'ZK-PROOF',      status: 'MISSING', ok: false },
              { label: 'WEBRTC SHARD',  status: 'FAILED',  ok: false },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center border-b border-yellow-950/30 pb-1">
                <span className="text-yellow-900">{row.label}</span>
                <span className={row.ok ? 'text-yellow-400' : 'text-red-500'}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

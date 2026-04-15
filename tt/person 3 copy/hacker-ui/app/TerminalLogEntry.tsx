'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  delay?: number;
}

const colorMap = {
  INFO:     'text-green-400',
  WARNING:  'text-yellow-400',
  CRITICAL: 'text-red-400',
  SUCCESS:  'text-green-300',
};

export function TerminalLogEntry({ message, type, delay = 0 }: Props) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0;
      const speed = type === 'CRITICAL' ? 12 : 18;
      const interval = setInterval(() => {
        i++;
        setDisplayed(message.slice(0, i));
        if (i >= message.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [message, type, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: delay / 1000 }}
      className={`font-mono text-xs leading-relaxed ${colorMap[type]}`}
    >
      {displayed}
      {displayed.length < message.length && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>█</motion.span>
      )}
    </motion.div>
  );
}

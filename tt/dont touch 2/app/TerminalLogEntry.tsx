'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TerminalLogEntryProps {
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  delay?: number;
}

// Typed wrappers to work around framer-motion v10 + React 19 className type issue
const MotionP = motion.p as React.FC<React.HTMLAttributes<HTMLParagraphElement> & Parameters<typeof motion.p>[0]>;
const MotionSpan = motion.span as React.FC<React.HTMLAttributes<HTMLSpanElement> & Parameters<typeof motion.span>[0]>;

/**
 * Character-by-character typing animation for terminal logs
 * Creates theatrical "hacking" effect with precise timing
 */
export const TerminalLogEntry: React.FC<TerminalLogEntryProps> = ({ 
  message, 
  type, 
  delay = 0 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let charIndex = 0;
    setDisplayedText('');
    setIsComplete(false);

    // Start delay before typing begins
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        if (charIndex < message.length) {
          setDisplayedText(prev => prev + message[charIndex]);
          charIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, 15); // 15ms per character = theatrical hacking speed

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startDelay);
  }, [message, delay]);

  const getTextColor = () => {
    switch (type) {
      case 'INFO':
        return 'text-green-400';
      case 'WARNING':
        return 'text-yellow-500';
      case 'CRITICAL':
        return 'text-red-500';
      case 'SUCCESS':
        return 'text-green-500';
      default:
        return 'text-green-400';
    }
  };

  return (
    <MotionP
      className={`font-mono text-xs ${getTextColor()}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {displayedText}
      {!isComplete && (
        <MotionSpan
          className="inline-block w-0.5 h-4 bg-green-400 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </MotionP>
  );
};

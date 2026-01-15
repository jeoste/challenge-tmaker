'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GoldScoreBadgeProps {
  score: number;
  size?: number;
}

export function GoldScoreBadge({ score, size = 64 }: GoldScoreBadgeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(score, increment * step);
      setDisplayScore(Math.round(current));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayScore(score);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return '#00FF41'; // accent-success
    if (score >= 50) return '#F59E0B'; // accent-warning
    return '#6B7280'; // text-muted
  };

  const circumference = 2 * Math.PI * (size / 2 - 4);
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-secondary"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono font-bold"
        style={{ fontSize: size * 0.3, color: getColor() }}
      >
        {displayScore}
      </div>
    </div>
  );
}

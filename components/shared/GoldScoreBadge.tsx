'use client';

import { motion } from 'framer-motion';

interface GoldScoreBadgeProps {
  score: number;
  size?: number;
}

export function GoldScoreBadge({ score, size = 64 }: GoldScoreBadgeProps) {
  const getScoreColor = () => {
    if (score >= 80) return {
      bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'
    };
    if (score >= 50) return {
      bg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
    };
    return {
      bg: 'bg-gradient-to-br from-gray-500/20 to-slate-500/20',
      border: 'border-gray-500/50',
      text: 'text-gray-400',
      glow: 'shadow-[0_0_20px_rgba(107,114,128,0.2)]'
    };
  };

  const colors = getScoreColor();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative ${colors.bg} ${colors.border} ${colors.glow} border-2 rounded-xl px-4 py-2 backdrop-blur-sm`}
    >
      <div className="flex flex-col items-center justify-center">
        <div className={`text-xs font-semibold uppercase tracking-wider ${colors.text} mb-0.5`}>
          Gold Score
        </div>
        <div className={`text-2xl font-bold ${colors.text} leading-none`}>
          {score}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          /100
        </div>
      </div>
    </motion.div>
  );
}

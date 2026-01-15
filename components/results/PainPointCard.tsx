'use client';

import { motion } from 'framer-motion';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoldScoreBadge } from '@/components/shared/GoldScoreBadge';
import { ShareButton } from '@/components/shared/ShareButton';
import { PainPoint } from '@/types';
import { toast } from 'sonner';

interface PainPointCardProps {
  painPoint: PainPoint;
  niche: string;
  analysisId?: string;
  index: number;
}

export function PainPointCard({
  painPoint,
  niche,
  analysisId,
  index,
}: PainPointCardProps) {
  const handleCopyBlueprint = () => {
    const blueprintText = `Problem: ${painPoint.blueprint.problem}\n\nSolution: ${painPoint.blueprint.solutionName}\n${painPoint.blueprint.solutionPitch}\n\nMarket Size: ${painPoint.blueprint.marketSize}\nFirst Channel: ${painPoint.blueprint.firstChannel}\nMRR Estimate: ${painPoint.blueprint.mrrEstimate}\nTech Stack: ${painPoint.blueprint.techStack}`;
    
    navigator.clipboard.writeText(blueprintText);
    toast.success('Blueprint copié !');
  };

  const getMarketSizeColor = (size: string) => {
    switch (size) {
      case 'Large':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const calculateDifficulty = (blueprint: PainPoint['blueprint']): number => {
    // If difficulty is already provided, use it
    if (blueprint.difficulty !== undefined) {
      return Math.max(1, Math.min(5, blueprint.difficulty));
    }

    // Calculate difficulty based on market size and tech stack complexity
    let difficulty = 3; // Default medium difficulty

    // Market size impact: Larger markets = easier to enter (lower difficulty)
    // Smaller markets = harder to enter (higher difficulty)
    switch (blueprint.marketSize) {
      case 'Large':
        difficulty = 2; // Easier - large market means more opportunities
        break;
      case 'Medium':
        difficulty = 3; // Medium
        break;
      case 'Small':
        difficulty = 4; // Harder - niche market requires more expertise
        break;
    }

    // Tech stack complexity adjustment
    const techStack = blueprint.techStack.toLowerCase();
    
    // Simple stacks (Next.js + Supabase, etc.) = easier
    if (techStack.includes('next.js') && techStack.includes('supabase')) {
      difficulty = Math.max(1, difficulty - 1);
    }
    
    // Complex stacks (microservices, kubernetes, etc.) = harder
    if (techStack.includes('kubernetes') || techStack.includes('microservices') || 
        techStack.includes('docker') || techStack.includes('aws')) {
      difficulty = Math.min(5, difficulty + 1);
    }

    // MRR estimate impact: Higher estimates might indicate more complexity
    const mrrMatch = blueprint.mrrEstimate.match(/\$?(\d+)k?/i);
    if (mrrMatch) {
      const mrrValue = parseInt(mrrMatch[1], 10);
      if (mrrValue > 10) {
        // Higher MRR potential might mean more competition or complexity
        difficulty = Math.min(5, difficulty + 1);
      }
    }

    return Math.max(1, Math.min(5, difficulty));
  };

  const renderDifficulty = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass-card p-6 hover:border-primary/50 transition-all"
    >
      {/* Top Row: Badge and Share */}
      <div className="flex items-start justify-between mb-4">
        <GoldScoreBadge score={painPoint.goldScore} size={64} />
        <ShareButton
          painPoint={painPoint}
          niche={niche}
          analysisId={analysisId}
        />
      </div>

      {/* Center: Title and Summary */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">
          {painPoint.title}
        </h3>
        <p className="text-base italic text-muted-foreground line-clamp-2">
          {painPoint.blueprint.solutionPitch}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          📊 {painPoint.postsCount} post{painPoint.postsCount > 1 ? 's' : ''} similaire{painPoint.postsCount > 1 ? 's' : ''} cette semaine
        </p>
      </div>

      {/* Bottom Bento Row: Market, Difficulty, Revenue */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Market</div>
          <Badge
            variant="outline"
            className={getMarketSizeColor(painPoint.blueprint.marketSize)}
          >
            {painPoint.blueprint.marketSize}
          </Badge>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
          <div className="text-sm font-mono">
            {renderDifficulty(calculateDifficulty(painPoint.blueprint))}
          </div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Revenue Pot.</div>
          <div className="text-sm font-semibold text-primary">
            {painPoint.blueprint.mrrEstimate}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyBlueprint}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copier Blueprint
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Use ShareButton logic for consistency
            let shareUrl: string;
            if (analysisId) {
              shareUrl = `${window.location.origin}/share/${analysisId}?pain=${encodeURIComponent(painPoint.id)}`;
            } else {
              shareUrl = `${window.location.origin}/results/${encodeURIComponent(niche)}#pain-${painPoint.id}`;
            }
            
            const text = `🔥 ${painPoint.blueprint.solutionName} - Gold Score: ${painPoint.goldScore}/100`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(twitterUrl, '_blank', 'width=550,height=420');
          }}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </div>
    </motion.div>
  );
}

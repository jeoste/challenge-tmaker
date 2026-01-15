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

  const renderDifficulty = (difficulty: number = 3) => {
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
            {renderDifficulty()}
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
            const shareUrl = analysisId
              ? `${window.location.origin}/share/${analysisId}?pain=${painPoint.id}`
              : window.location.href;
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 ${painPoint.blueprint.solutionName} - Gold Score: ${painPoint.goldScore}/100`)}&url=${encodeURIComponent(shareUrl)}`,
              '_blank'
            );
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

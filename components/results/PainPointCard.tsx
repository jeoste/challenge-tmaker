'use client';

import { motion } from 'framer-motion';
import { Copy, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoldScoreBadge } from '@/components/shared/GoldScoreBadge';
import { ShareButton } from '@/components/shared/ShareButton';
import { PainPoint } from '@/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface PainPointCardProps {
  painPoint: PainPoint;
  niche: string;
  analysisId?: string;
  index: number;
  sessionToken?: string | null;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

export function PainPointCard({
  painPoint,
  niche,
  analysisId,
  index,
  sessionToken,
  isFavorited: initialIsFavorited = false,
  onFavoriteToggle,
}: PainPointCardProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited]);

  const handleToggleFavorite = async () => {
    if (!sessionToken || !analysisId) {
      toast.error('Vous devez être connecté pour ajouter aux favoris');
      return;
    }

    setIsToggling(true);
    try {
      if (isFavorited) {
        // Remove favorite
        const response = await fetch(`/api/favorites?analysis_id=${analysisId}&pain_point_id=${painPoint.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });

        if (response.ok) {
          setIsFavorited(false);
          toast.success('Retiré des favoris');
          onFavoriteToggle?.();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erreur lors de la suppression');
        }
      } else {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            analysis_id: analysisId,
            pain_point_id: painPoint.id,
            pain_point_data: painPoint,
          }),
        });

        if (response.ok) {
          setIsFavorited(true);
          toast.success('Ajouté aux favoris');
          onFavoriteToggle?.();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erreur lors de l\'ajout aux favoris');
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setIsToggling(false);
    }
  };
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
        <p className="text-base text-foreground mb-2">
          💡 <span className="font-semibold">{painPoint.blueprint.solutionName}</span>
        </p>
        <p className="text-base text-muted-foreground mb-3 leading-relaxed">
          {painPoint.blueprint.solutionPitch}
        </p>
        
        {/* Key Features if available */}
        {painPoint.blueprint.keyFeatures && painPoint.blueprint.keyFeatures.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Fonctionnalités clés :</p>
            <div className="flex flex-wrap gap-1.5">
              {painPoint.blueprint.keyFeatures.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded bg-secondary/50 border border-border text-muted-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Target Audience if available */}
        {painPoint.blueprint.targetAudience && (
          <p className="text-xs text-muted-foreground mb-2">
            🎯 Cible: {painPoint.blueprint.targetAudience}
          </p>
        )}
        
        {/* Pricing Model if available */}
        {painPoint.blueprint.pricingModel && (
          <p className="text-xs text-muted-foreground mb-2">
            💰 Pricing: {painPoint.blueprint.pricingModel}
          </p>
        )}
        
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
        {sessionToken && analysisId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFavorite}
            disabled={isToggling}
            className={`flex items-center gap-2 ${
              isFavorited ? 'text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10' : ''
            }`}
          >
            <Star className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            {isFavorited ? 'Favori' : 'Favoris'}
          </Button>
        )}
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

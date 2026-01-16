'use client';

import { motion } from 'framer-motion';
import { Copy, Share2, Star, ExternalLink } from 'lucide-react';
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
      toast.error('You must be logged in to add to favorites');
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
          toast.success('Removed from favorites');
          onFavoriteToggle?.();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Error during removal');
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
          toast.success('Added to favorites');
          onFavoriteToggle?.();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Error during addition');
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('An error occurred');
    } finally {
      setIsToggling(false);
    }
  };
  const handleCopyBlueprint = () => {
    const blueprintText = `Problem: ${painPoint.blueprint.problem}\n\nSolution: ${painPoint.blueprint.solutionName}\n${painPoint.blueprint.solutionPitch}\n\nMarket Size: ${painPoint.blueprint.marketSize}\nFirst Channel: ${painPoint.blueprint.firstChannel}\nMRR Estimate: ${painPoint.blueprint.mrrEstimate}\nTech Stack: ${painPoint.blueprint.techStack}`;
    
    navigator.clipboard.writeText(blueprintText);
    toast.success('Blueprint copied!');
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
        <h3 className="text-xl font-bold text-foreground mb-3">
          {painPoint.title}
        </h3>
        
        {/* Problem Analysis */}
        <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            🔍 Problem Identified
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {painPoint.blueprint.problem}
          </p>
          {painPoint.blueprint.whyPainPoint && (
            <p className="text-xs text-muted-foreground italic">
              💡 {painPoint.blueprint.whyPainPoint}
            </p>
          )}
        </div>

        {/* Solution */}
        <div className="mb-4">
          <p className="text-base text-foreground mb-2">
            💡 <span className="font-semibold">{painPoint.blueprint.solutionName}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            {painPoint.blueprint.solutionPitch}
          </p>
          {painPoint.blueprint.howItSolves && (
            <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">How it solves the problem:</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {painPoint.blueprint.howItSolves}
              </p>
            </div>
          )}
        </div>
        
        {/* Key Features if available */}
        {painPoint.blueprint.keyFeatures && painPoint.blueprint.keyFeatures.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Key Features:</p>
            <div className="flex flex-wrap gap-1.5">
              {painPoint.blueprint.keyFeatures.map((feature, idx) => (
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

        {/* Roadmap if available */}
        {painPoint.blueprint.roadmap && (
          <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              🗺️ Roadmap
            </h4>
            <div className="space-y-3">
              {painPoint.blueprint.roadmap.phase1 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Phase 1: {painPoint.blueprint.roadmap.phase1.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {painPoint.blueprint.roadmap.phase1.timeline}
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                    {painPoint.blueprint.roadmap.phase1.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              {painPoint.blueprint.roadmap.phase2 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Phase 2: {painPoint.blueprint.roadmap.phase2.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {painPoint.blueprint.roadmap.phase2.timeline}
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                    {painPoint.blueprint.roadmap.phase2.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Target Audience if available */}
        {painPoint.blueprint.targetAudience && (
          <p className="text-xs text-muted-foreground mb-2">
            🎯 Target: {painPoint.blueprint.targetAudience}
          </p>
        )}
        
        {/* Pricing Model if available */}
        {painPoint.blueprint.pricingModel && (
          <p className="text-xs text-muted-foreground mb-2">
            💰 Pricing: {painPoint.blueprint.pricingModel}
          </p>
        )}
        
        <p className="text-sm text-muted-foreground mt-2">
          📊 {painPoint.postsCount} similar post{painPoint.postsCount > 1 ? 's' : ''} this week
        </p>
        
        {/* Reddit Post Link */}
        {painPoint.permalink && (
          <div className="mt-3">
            <a
              href={painPoint.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View original Reddit post</span>
            </a>
          </div>
        )}
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
            {isFavorited ? 'Favorite' : 'Favorites'}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyBlueprint}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy Blueprint
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
          Share
        </Button>
      </div>
    </motion.div>
  );
}

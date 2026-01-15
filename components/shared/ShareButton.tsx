'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonProps {
  painPoint: {
    id: string;
    title: string;
    goldScore: number;
    blueprint: {
      solutionName: string;
    };
  };
  niche: string;
  analysisId?: string;
}

export function ShareButton({ painPoint, niche, analysisId }: ShareButtonProps) {
  const handleShare = async () => {
    // Generate share URL with fallback
    let shareUrl: string;
    if (analysisId) {
      shareUrl = `${window.location.origin}/share/${analysisId}?pain=${encodeURIComponent(painPoint.id)}`;
    } else {
      // Fallback: use current results page with pain point ID in hash
      shareUrl = `${window.location.origin}/results/${encodeURIComponent(niche)}#pain-${painPoint.id}`;
    }

    // Generate OG image URL (always accessible)
    const ogImageUrl = `${window.location.origin}/api/og/${encodeURIComponent(niche)}?pain=${encodeURIComponent(painPoint.title)}&score=${painPoint.goldScore}`;

    // Share text optimized for Twitter/X
    const text = `🔥 ${painPoint.blueprint.solutionName}\n\nGold Score: ${painPoint.goldScore}/100\n\n${shareUrl}`;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: painPoint.blueprint.solutionName,
          text: `🔥 ${painPoint.blueprint.solutionName} - Gold Score: ${painPoint.goldScore}/100`,
          url: shareUrl,
        });
        toast.success('Partagé avec succès !');
        return;
      } catch (error: any) {
        // User cancelled is not an error
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        } else {
          return; // User cancelled, don't show error
        }
      }
    }

    // Fallback: Twitter/X share
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      className="hover:bg-secondary"
      title="Partager"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}

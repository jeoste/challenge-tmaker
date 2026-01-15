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
    const shareUrl = analysisId
      ? `${window.location.origin}/share/${analysisId}?pain=${painPoint.id}`
      : window.location.href;

    const ogImageUrl = `${window.location.origin}/api/og/${encodeURIComponent(niche)}?pain=${encodeURIComponent(painPoint.title)}&score=${painPoint.goldScore}`;

    const text = `🔥 Top Opportunity: ${painPoint.blueprint.solutionName}\n\nGold Score: ${painPoint.goldScore}/100\n\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: painPoint.blueprint.solutionName,
          text,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share error:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      toast.success('Lien copié dans le presse-papier !');
    }
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

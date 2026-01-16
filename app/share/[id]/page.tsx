'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import Image from 'next/image';
import { AnalyzeResponse, PainPoint } from '@/types';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/share/${id}`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Share not found');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching share data:', err);
        setError('Share not found');
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Share not found
          </h2>
          <Button onClick={() => router.push('/')}>Back to home</Button>
        </div>
      </div>
    );
  }

  // Get pain point from URL query or default to first
  const painId = searchParams.get('pain');
  
  const selectedPain = painId
    ? data.pains?.find((p: PainPoint) => p.id === painId) || data.pains?.[0]
    : data.pains?.[0];

  if (!selectedPain || !data.pains || data.pains.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            No data available
          </h2>
          <Button onClick={() => router.push('/')}>Back to home</Button>
        </div>
      </div>
    );
  }

  const ogImageUrl = `/api/og/${encodeURIComponent(data.niche)}?pain=${encodeURIComponent(selectedPain.title)}&score=${selectedPain.goldScore}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = ogImageUrl;
    link.download = `unearth-${data.niche}-${selectedPain.goldScore}.png`;
    link.click();
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const text = `🔥 ${selectedPain.blueprint.solutionName} - Gold Score: ${selectedPain.goldScore}/100`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=550,height=420'
    );
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            🎉 Your Gold Card is ready!
          </h1>

          {/* Show pain point selector if multiple pain points */}
          {data.pains && data.pains.length > 1 && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Select a pain point to share:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.pains.map((pain: PainPoint) => (
                  <Button
                    key={pain.id}
                    variant={selectedPain.id === pain.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      router.push(`/share/${id}?pain=${encodeURIComponent(pain.id)}`);
                    }}
                  >
                    {pain.blueprint.solutionName} ({pain.goldScore})
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 rounded-lg overflow-hidden border border-border">
            <div className="relative w-full aspect-video bg-black">
              <Image
                src={ogImageUrl}
                alt={`Gold Card for ${selectedPain.title}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Partager sur X
            </Button>
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push(`/results/${encodeURIComponent(data.niche)}`)}
            >
              View full analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

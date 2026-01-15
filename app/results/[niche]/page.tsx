'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ResultsHeader } from '@/components/results/ResultsHeader';
import { LoadingState } from '@/components/results/LoadingState';
import { PainPointCard } from '@/components/results/PainPointCard';
import { Button } from '@/components/ui/button';
import { AnalyzeResponse } from '@/types';
import { useRouter } from 'next/navigation';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const niche = decodeURIComponent(params.niche as string);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ niche }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 429) {
            setError('Trop de requêtes. Veuillez réessayer dans une heure.');
            return;
          }
          throw new Error('Erreur lors du scan');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Une erreur est survenue lors du scan.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [niche, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <ResultsHeader niche={niche} />
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <ResultsHeader niche={niche} />
          <div className="glass-card p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Erreur
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/')}>
              Nouvelle Recherche
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.pains.length === 0) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <ResultsHeader niche={niche} />
          <div className="glass-card p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Aucun pain point trouvé
            </h2>
            <p className="text-muted-foreground mb-6">
              Essaie une autre niche ou vérifie plus tard.
            </p>
            <Button onClick={() => router.push('/')}>
              Nouvelle Recherche
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <ResultsHeader niche={niche} />
        
        <div className="mb-6 text-sm text-muted-foreground">
          Scanné {data.totalPosts} posts Reddit • Mis à jour il y a{' '}
          {Math.round(
            (Date.now() - new Date(data.scannedAt).getTime()) / 60000
          )}{' '}
          min
        </div>

        <div className="space-y-6">
          {data.pains.map((pain, index) => (
            <PainPointCard
              key={pain.id}
              painPoint={pain}
              niche={niche}
              analysisId={data.id}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

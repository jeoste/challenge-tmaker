'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ResultsHeader } from '@/components/results/ResultsHeader';
import { LoadingState } from '@/components/results/LoadingState';
import { PainPointCard } from '@/components/results/PainPointCard';
import { Button } from '@/components/ui/button';
import { AnalyzeResponse } from '@/types';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const niche = decodeURIComponent(params.niche as string);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const painPointRefs = useRef<Record<string, HTMLDivElement>>({});

  // Scroll to pain point if hash is present
  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        const painId = hash.replace('#pain-', '');
        const element = painPointRefs.current[painId];
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      }
    }
  }, [data]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ niche }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            setError('Authentification requise');
            setErrorDetails('Vous devez être connecté pour effectuer un scan.');
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
          
          if (response.status === 429) {
            setError('Limite de requêtes atteinte');
            setErrorDetails('Vous avez atteint la limite de 5 scans par heure. Veuillez réessayer plus tard.');
            return;
          }
          
          if (response.status === 400) {
            setError('Requête invalide');
            setErrorDetails(errorData.error || 'La niche spécifiée est invalide.');
            return;
          }
          
          setError('Erreur lors du scan');
          setErrorDetails(errorData.error || 'Une erreur est survenue. Veuillez réessayer.');
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        console.error('Error fetching results:', err);
        setError('Erreur de connexion');
        setErrorDetails(err.message || 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
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
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl" />
                <div className="relative w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {error}
            </h2>
            {errorDetails && (
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {errorDetails}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Nouvelle Recherche
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setError(null);
                  setErrorDetails(null);
                  setLoading(true);
                  // Retry fetch
                  fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ niche }),
                  })
                    .then(res => res.json())
                    .then(result => {
                      setData(result);
                      setLoading(false);
                    })
                    .catch(() => {
                      setError('Erreur lors du scan');
                      setLoading(false);
                    });
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
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
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Aucune opportunité SaaS n'a été trouvée pour cette niche. 
              Essayez une autre niche ou vérifiez plus tard.
            </p>
            {data && (
              <p className="text-sm text-muted-foreground mb-6">
                {data.totalPosts} posts scannés • Aucun résultat valide
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Nouvelle Recherche
              </Button>
            </div>
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
            <div
              key={pain.id}
              ref={(el) => {
                if (el) painPointRefs.current[pain.id] = el;
              }}
              id={`pain-${pain.id}`}
            >
              <PainPointCard
                painPoint={pain}
                niche={niche}
                analysisId={data.id}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="glass-card p-6 inline-block">
            <p className="text-muted-foreground mb-4">
              Vous voulez analyser une autre niche ?
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Nouvelle Recherche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

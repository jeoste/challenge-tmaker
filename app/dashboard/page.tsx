'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Analysis {
  id: string;
  niche: string;
  scanned_at: string;
  total_posts: number;
  pains: any[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (user) {
      fetchAnalyses();
    }
  }, [user, authLoading, router]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/analyses');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=/dashboard');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement des analyses');
      }

      const data = await response.json();
      console.log('Fetched analyses:', data); // Debug log
      setAnalyses(data.analyses || []);
    } catch (err: any) {
      console.error('Error fetching analyses:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Mon Dashboard
              </h1>
              <p className="text-muted-foreground">
                Historique de vos analyses Reddit
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Accueil
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 mb-6 border-destructive/50">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Stats Summary */}
        {analyses.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total d'analyses: </span>
                <span className="font-semibold text-foreground">{analyses.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total d'opportunités: </span>
                <span className="font-semibold text-foreground">
                  {analyses.reduce((sum, a) => sum + (a.pains?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Analyses List */}
        {analyses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Aucune analyse pour le moment
            </h2>
            <p className="text-muted-foreground mb-4">
              Commencez par analyser une niche pour voir vos résultats ici.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              💡 Astuce: Assurez-vous d'être connecté lors de l'analyse pour qu'elle soit sauvegardée dans votre historique.
            </p>
            <Link href="/">
              <Button>Nouvelle Analyse</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="glass-card p-6 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-foreground">
                        {analysis.niche}
                      </h3>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(analysis.scanned_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>{analysis.total_posts} posts scannés</span>
                      <span>•</span>
                      <span>{analysis.pains?.length || 0} opportunités trouvées</span>
                    </div>

                    {analysis.pains && analysis.pains.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Top opportunités :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.pains.slice(0, 3).map((pain: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-secondary/50 border border-border"
                            >
                              {pain.blueprint?.solutionName || pain.title}
                            </span>
                          ))}
                          {analysis.pains.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded bg-secondary/50 border border-border">
                              +{analysis.pains.length - 3} autres
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/results/${encodeURIComponent(analysis.niche)}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Voir
                      </Button>
                    </Link>
                    {analysis.id && (
                      <Link href={`/share/${analysis.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          Partager
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

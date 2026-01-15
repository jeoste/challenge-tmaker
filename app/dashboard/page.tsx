'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Calendar, RefreshCw, TrendingUp, Target, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Analysis {
  id: string;
  niche: string;
  scanned_at: string;
  total_posts: number;
  pains: any[];
}

export default function DashboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (user && !authLoading) {
      fetchAnalyses();
    } else if (!authLoading && !user) {
      // If no user after auth loading, stop loading state
      setLoading(false);
    }
  }, [user, authLoading, router]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/analyses', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

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
      // Set analyses to empty array to show empty state instead of nothing
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-9 w-48 bg-secondary/50 rounded-lg animate-pulse mb-2" />
                <div className="h-5 w-64 bg-secondary/30 rounded animate-pulse" />
              </div>
              <div className="h-10 w-24 bg-secondary/50 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-6">
              <div className="h-5 w-32 bg-secondary/30 rounded animate-pulse" />
              <div className="h-5 w-40 bg-secondary/30 rounded animate-pulse" />
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-7 w-40 bg-secondary/50 rounded animate-pulse" />
                      <div className="h-5 w-32 bg-secondary/30 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-4 w-28 bg-secondary/30 rounded animate-pulse" />
                      <div className="h-4 w-36 bg-secondary/30 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="h-6 w-20 bg-secondary/20 rounded animate-pulse" />
                      <div className="h-6 w-24 bg-secondary/20 rounded animate-pulse" />
                      <div className="h-6 w-16 bg-secondary/20 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <div className="h-9 w-16 bg-secondary/50 rounded animate-pulse" />
                    <div className="h-9 w-20 bg-secondary/50 rounded animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading skeleton while auth or data is loading
  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  // If user is not authenticated, show a redirect message instead of null
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-12 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Redirection en cours...
              </h2>
              <p className="text-muted-foreground mb-6">
                Vous allez être redirigé vers la page de connexion.
              </p>
              <Link href="/login?redirect=/dashboard">
                <Button>Se connecter</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 px-6 py-12">
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
              <div className="flex items-center justify-between">
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAnalyses}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>
              </div>
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
            <div className="space-y-6">
              {/* Empty state hero */}
              <div className="glass-card p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Bienvenue sur votre Dashboard
                </h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  C'est ici que vous retrouverez l'historique de toutes vos analyses Reddit.
                  Commencez par analyser une niche pour débloquer tout le potentiel de Reddit Goldmine.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  💡 Astuce: Assurez-vous d'être connecté lors de l'analyse pour qu'elle soit sauvegardée automatiquement.
                </p>
                <Link href="/">
                  <Button size="lg" className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Lancer ma première analyse
                  </Button>
                </Link>
              </div>

              {/* Features preview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-4">
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Analyses sauvegardées</h3>
                  <p className="text-sm text-muted-foreground">
                    Retrouvez toutes vos analyses passées et leurs résultats
                  </p>
                </Card>

                <Card className="glass-card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Suivi des opportunités</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualisez le nombre d'opportunités découvertes par analyse
                  </p>
                </Card>

                <Card className="glass-card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-4">
                    <ExternalLink className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Partage facile</h3>
                  <p className="text-sm text-muted-foreground">
                    Partagez vos analyses avec votre équipe en un clic
                  </p>
                </Card>
              </div>
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
    </div>
  );
}

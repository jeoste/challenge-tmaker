'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  RefreshCw, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Star, 
  Sparkles,
  Zap,
  Award,
  Clock,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { GoldScoreBadge } from '@/components/shared/GoldScoreBadge';
import { motion } from 'framer-motion';

interface Analysis {
  id: string;
  niche: string;
  scanned_at: string;
  total_posts: number;
  pains: any[];
}

interface Favorite {
  id: string;
  analysis_id: string;
  pain_point_id: string;
  pain_point_data: any;
  created_at: string;
}

interface PainPointWithAnalysis {
  painPoint: any;
  analysis: Analysis;
  analysisId: string;
}

export default function DashboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ideas' | 'favorites'>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (user && !authLoading) {
      fetchAnalyses();
      fetchFavorites();
      setLoading(false);
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  const fetchAnalyses = async () => {
    try {
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
      // Deduplicate analyses by ID to prevent duplicates
      const uniqueAnalyses = Array.from(
        new Map((data.analyses || []).map((a: Analysis) => [a.id, a])).values()
      );
      setAnalyses(uniqueAnalyses);
    } catch (err: any) {
      console.error('Error fetching analyses:', err);
      setError(err.message || 'Une erreur est survenue');
      setAnalyses([]);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          return;
        }
        console.error('Error fetching favorites');
        return;
      }

      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
    }
  };

  const toggleFavorite = async (analysisId: string, painPoint: any) => {
    if (!session?.access_token) return;

    const isFavorited = favorites.some(
      f => f.analysis_id === analysisId && f.pain_point_id === painPoint.id
    );

    try {
      if (isFavorited) {
        const favorite = favorites.find(
          f => f.analysis_id === analysisId && f.pain_point_id === painPoint.id
        );
        const response = await fetch(`/api/favorites?id=${favorite?.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          setFavorites(favorites.filter(f => f.id !== favorite?.id));
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            analysis_id: analysisId,
            pain_point_id: painPoint.id,
            pain_point_data: painPoint,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setFavorites([...favorites, data.favorite]);
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Erreur lors de l\'ajout aux favoris');
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalAnalyses = analyses.length;
    const totalOpportunities = analyses.reduce((sum, a) => sum + (a.pains?.length || 0), 0);
    const totalFavorites = favorites.length;
    const avgScore = analyses.reduce((sum, a) => {
      const scores = a.pains?.map((p: any) => p.goldScore || 0) || [];
      const avg = scores.length > 0 ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length : 0;
      return sum + avg;
    }, 0) / (totalAnalyses || 1);

    return {
      totalAnalyses,
      totalOpportunities,
      totalFavorites,
      avgScore: Math.round(avgScore),
    };
  }, [analyses, favorites]);

  // Flatten all pain points with their analysis info, sorted by score
  const allPainPoints: PainPointWithAnalysis[] = useMemo(() => {
    const points: PainPointWithAnalysis[] = [];
    analyses.forEach(analysis => {
      analysis.pains?.forEach((pain: any) => {
        points.push({
          painPoint: pain,
          analysis,
          analysisId: analysis.id,
        });
      });
    });
    return points.sort((a, b) => (b.painPoint.goldScore || 0) - (a.painPoint.goldScore || 0));
  }, [analyses]);

  // Loading skeleton
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-mesh bg-grid">
        <Header />
        <div className="pt-24 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="h-9 w-48 bg-secondary/50 rounded-lg animate-pulse mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-card p-6 h-32 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-mesh bg-grid">
        <Header />
        <div className="pt-24 px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <Card className="glass-card p-12 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Redirection en cours...
              </h2>
              <p className="text-muted-foreground mb-6">
                Vous allez être redirigé vers la page de connexion.
              </p>
              <Link href="/login?redirect=/dashboard">
                <Button>Se connecter</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh bg-grid">
      <Header />
      <div className="pt-24 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">
                  Métriques d'utilisation et historique de vos idées
                </p>
              </div>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Accueil
                </Button>
              </Link>
            </div>

            {error && (
              <Card className="glass-card p-4 mb-6 border-destructive/50">
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
              </Card>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Analyses
                      </CardTitle>
                      <BarChart3 className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {metrics.totalAnalyses}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Analyses effectuées
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Opportunités
                      </CardTitle>
                      <Sparkles className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {metrics.totalOpportunities}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Idées découvertes
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Score moyen
                      </CardTitle>
                      <Award className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {metrics.avgScore}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      / 100 points
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Favoris
                      </CardTitle>
                      <Star className="h-5 w-5 text-yellow-500/60" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {metrics.totalFavorites}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.totalFavorites >= 3 ? 'Limite atteinte' : 'Idées sauvegardées'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="glass-card p-1 w-fit">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="ideas" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Idées ({allPainPoints.length})
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Favoris ({favorites.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                {analyses.length === 0 ? (
                  <Card className="glass-card p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Bienvenue sur votre Dashboard
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Commencez par analyser une niche pour débloquer tout le potentiel d'Unearth.
                    </p>
                    <Link href="/">
                      <Button size="lg" className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Lancer ma première analyse
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {analyses.map((analysis, idx) => (
                      <motion.div
                        key={analysis.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-foreground">
                                  {analysis.niche}
                                </h3>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(analysis.scanned_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  {analysis.total_posts} posts
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-4 w-4" />
                                  {analysis.pains?.length || 0} opportunités
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Link href={`/results/${encodeURIComponent(analysis.niche)}`}>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4" />
                                  Voir
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ideas" className="mt-6">
                {allPainPoints.length === 0 ? (
                  <Card className="glass-card p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Aucune idée pour le moment
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      Analysez une niche pour découvrir des opportunités SaaS.
                    </p>
                    <Link href="/">
                      <Button size="lg">Lancer une analyse</Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {allPainPoints.map((item, idx) => {
                      const isFavorited = favorites.some(
                        f => f.analysis_id === item.analysisId && f.pain_point_id === item.painPoint.id
                      );
                      return (
                        <motion.div
                          key={`${item.analysisId}-${item.painPoint.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                            <div className="flex items-start gap-4">
                              <GoldScoreBadge score={item.painPoint.goldScore} size={56} />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-foreground">
                                    {item.painPoint.blueprint?.solutionName || item.painPoint.title}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {item.analysis.niche}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {item.painPoint.blueprint?.problem || item.painPoint.title}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                  {item.painPoint.blueprint?.marketSize && (
                                    <span>Marché: {item.painPoint.blueprint.marketSize}</span>
                                  )}
                                  {item.painPoint.blueprint?.mrrEstimate && (
                                    <span>• MRR: {item.painPoint.blueprint.mrrEstimate}</span>
                                  )}
                                  <span>• {item.painPoint.postsCount || 1} posts similaires</span>
                                </div>
                                <div className="flex gap-2">
                                  <Link href={`/results/${encodeURIComponent(item.analysis.niche)}#pain-${item.painPoint.id}`}>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                      <ExternalLink className="h-3 w-3" />
                                      Voir
                                    </Button>
                                  </Link>
                                  {session?.access_token && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleFavorite(item.analysisId, item.painPoint)}
                                      className={`flex items-center gap-2 ${
                                        isFavorited ? 'text-yellow-500 border-yellow-500/30' : ''
                                      }`}
                                    >
                                      <Star className={`h-3 w-3 ${isFavorited ? 'fill-current' : ''}`} />
                                      {isFavorited ? 'Favori' : 'Favoris'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="favorites" className="mt-6">
                {favorites.length === 0 ? (
                  <Card className="glass-card p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-6">
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Aucun favori pour le moment
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Ajoutez des opportunités à vos favoris depuis vos idées pour les retrouver facilement.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('ideas')}
                      className="flex items-center gap-2"
                    >
                      Voir mes idées
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {favorites.map((favorite, idx) => {
                      const painPoint = favorite.pain_point_data;
                      const analysis = analyses.find(a => a.id === favorite.analysis_id);
                      return (
                        <motion.div
                          key={favorite.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="glass-card p-6 hover:border-primary/50 transition-all">
                            <div className="flex items-start gap-4">
                              <GoldScoreBadge score={painPoint.goldScore} size={56} />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                  <h3 className="text-lg font-bold text-foreground">
                                    {painPoint.blueprint?.solutionName || painPoint.title}
                                  </h3>
                                  {analysis && (
                                    <Badge variant="outline" className="text-xs">
                                      {analysis.niche}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {painPoint.blueprint?.problem || painPoint.title}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                  {painPoint.blueprint?.marketSize && (
                                    <span>Marché: {painPoint.blueprint.marketSize}</span>
                                  )}
                                  {painPoint.blueprint?.mrrEstimate && (
                                    <span>• MRR: {painPoint.blueprint.mrrEstimate}</span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {analysis && (
                                    <Link href={`/results/${encodeURIComponent(analysis.niche)}#pain-${painPoint.id}`}>
                                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <ExternalLink className="h-3 w-3" />
                                        Voir
                                      </Button>
                                    </Link>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleFavorite(favorite.analysis_id, painPoint)}
                                    className="flex items-center gap-2 text-yellow-500"
                                  >
                                    <Star className="h-3 w-3 fill-current" />
                                    Retirer
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

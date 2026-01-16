'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ResultsHeader } from '@/components/results/ResultsHeader';
import { LoadingState } from '@/components/results/LoadingState';
import { PainPointCard } from '@/components/results/PainPointCard';
import { Button } from '@/components/ui/button';
import { AnalyzeResponse } from '@/types';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const niche = decodeURIComponent(params.niche as string);
  const analysisId = searchParams.get('id');
  const source = searchParams.get('source');
  const problemType = searchParams.get('type');
  const engagementLevel = searchParams.get('engagement');
  const { session, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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

  const fetchFavorites = async () => {
    if (!session?.access_token || !data?.id) return;
    
    try {
      const response = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      if (response.ok) {
        const favoritesData = await response.json();
        const favoriteSet = new Set<string>();
        interface Favorite {
          analysis_id: string;
          pain_point_id: string;
        }
        favoritesData.favorites?.forEach((f: Favorite) => {
          if (f.analysis_id === data.id) {
            favoriteSet.add(f.pain_point_id);
          }
        });
        setFavorites(favoriteSet);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  // Fetch favorites when user is authenticated and data is loaded
  useEffect(() => {
    if (session?.access_token && data?.id) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, data?.id]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (authLoading) return;
        if (!session?.access_token) {
          setError('Authentication required');
          setErrorDetails('You must be logged in to perform a scan.');
          setTimeout(() => router.push('/login'), 2000);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        setErrorDetails(null);

        // If analysisId is provided, fetch that specific analysis
        if (analysisId) {
          console.log('Fetching analysis by ID:', analysisId, 'for niche:', niche);
          const analysisResponse = await fetch(
            `/api/analyze/id/${analysisId}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setData(analysisData);
            setLoading(false);
            console.log('✅ Using analysis from ID:', analysisId, 'with', analysisData.pains?.length || 0, 'pain points');
            return;
          } else {
            // If we have an analysisId but the fetch failed, don't create a new analysis
            const errorText = await analysisResponse.text();
            console.warn('❌ Failed to fetch analysis by ID:', analysisId, 'Status:', analysisResponse.status, 'Response:', errorText);
            
            if (analysisResponse.status === 404) {
              setError('Analysis not found');
              setErrorDetails('The requested analysis could not be found. It may have been deleted.');
            } else if (analysisResponse.status === 401) {
              setError('Authentication required');
              setErrorDetails('You must be logged in to view this analysis.');
              setTimeout(() => router.push('/login'), 2000);
            } else {
              setError('Error loading analysis');
              setErrorDetails('Failed to load the analysis. Please try again later.');
            }
            setLoading(false);
            return;
          }
        }

        // Otherwise, try to fetch existing analysis from database by niche
        console.log('Fetching existing analysis by niche:', niche);
        const existingAnalysisResponse = await fetch(
          `/api/analyze/${encodeURIComponent(niche)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (existingAnalysisResponse.ok) {
          // Analysis exists, use it
          const existingData = await existingAnalysisResponse.json();
          setData(existingData);
          setLoading(false);
          console.log('✅ Using existing analysis from database:', existingData.id, 'with', existingData.pains?.length || 0, 'pain points');
          return;
        } else {
          const errorText = await existingAnalysisResponse.text();
          console.warn('❌ No existing analysis found for niche:', niche, 'Status:', existingAnalysisResponse.status, 'Response:', errorText);
        }

        // If analysis doesn't exist (404), create a new one
        if (existingAnalysisResponse.status !== 404) {
          // If it's not a 404, there might be an error
          const errorData = await existingAnalysisResponse.json().catch(() => ({}));
          console.warn('Error fetching existing analysis:', errorData);
          // Continue to create new analysis
        }

        console.log('🔄 Creating new analysis for niche:', niche);

        // Create new analysis with query params
        interface RequestBody {
          niche: string;
          source?: string;
          problemType?: string;
          engagementLevel?: string;
        }
        const requestBody: RequestBody = { niche };
        if (source) requestBody.source = source;
        if (problemType) requestBody.problemType = problemType;
        if (engagementLevel) requestBody.engagementLevel = engagementLevel;

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            setError('Authentification requise');
            setErrorDetails('You must be logged in to perform a scan.');
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
          
          if (response.status === 429) {
            setError('Request limit reached');
            const resetTime = errorData.reset ? new Date(errorData.reset).toLocaleTimeString('fr-FR') : null;
            const remaining = errorData.remaining !== undefined ? errorData.remaining : 0;
            let details = 'You have reached the limit of 5 scans per hour.';
            if (resetTime) {
              details += ` You can try again after ${resetTime}.`;
            } else {
              details += ' Please try again later.';
            }
            if (remaining === 0) {
              details += ' If you just created an account, you may have already used your quota before logging in.';
            }
            setErrorDetails(details);
            return;
          }
          
          if (response.status === 400) {
            setError('Invalid request');
            setErrorDetails(errorData.error || 'The specified niche is invalid.');
            return;
          }
          
          setError('Erreur lors du scan');
          setErrorDetails(errorData.error || 'An error occurred. Please try again.');
          return;
        }

        const result = await response.json();
        setData(result);
        
        // Log if analysis was saved (has id)
        if (result.id) {
          console.log('Analysis saved with ID:', result.id);
        } else {
          console.log('Analysis not saved (user not authenticated or save failed)');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unable to connect to server. Check your internet connection.';
        console.error('Error fetching results:', err);
        setError('Erreur de connexion');
        setErrorDetails(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [niche, analysisId, router, session?.access_token, authLoading]);

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
                onClick={async () => {
                  setError(null);
                  setErrorDetails(null);
                  setLoading(true);
                  try {
                    if (!session?.access_token) {
                      setError('Authentification requise');
                      setErrorDetails('You must be logged in to perform a scan.');
                      setTimeout(() => router.push('/login'), 2000);
                      setLoading(false);
                      return;
                    }

                    // Retry fetch
                    const response = await fetch('/api/analyze', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ niche }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      
                      if (response.status === 429) {
                        setError('Request limit reached');
                        const resetTime = errorData.reset ? new Date(errorData.reset).toLocaleTimeString('en-US') : null;
                        const remaining = errorData.remaining !== undefined ? errorData.remaining : 0;
                        let details = 'You have reached the limit of 5 scans per hour.';
                        if (resetTime) {
                          details += ` You can try again after ${resetTime}.`;
                        } else {
                          details += ' Please try again later.';
                        }
                        if (remaining === 0) {
                          details += ' If you just created an account, you may have already used your quota before logging in.';
                        }
                        setErrorDetails(details);
                        setLoading(false);
                        return;
                      }
                      
                      setError('Scan error');
                      setErrorDetails(errorData.error || 'An error occurred. Please try again.');
                      setLoading(false);
                      return;
                    }

                    const result = await response.json();
                    setData(result);
                    setLoading(false);
                  } catch (err: unknown) {
                    console.error('Error retrying fetch:', err);
                    setError('Erreur de connexion');
                    setErrorDetails(err instanceof Error ? err.message : 'Impossible de se connecter au serveur.');
                    setLoading(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.pains || data.pains.length === 0) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <ResultsHeader niche={niche} />
          <div className="glass-card p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              No pain points found
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No SaaS opportunity was found for this niche.
              Try another niche or check back later.
            </p>
            {data && (
              <p className="text-sm text-muted-foreground mb-6">
                {data.totalPosts} posts scanned • No valid results
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
          Scanned {data.totalPosts} Reddit posts • Updated{' '}
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
                sessionToken={session?.access_token || null}
                isFavorited={favorites.has(pain.id)}
                onFavoriteToggle={fetchFavorites}
              />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="glass-card p-6 inline-block">
            <p className="text-muted-foreground mb-4">
              {data.id ? 'Analysis saved' : 'Want to analyze another niche?'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Nouvelle Recherche
              </Button>
              {data.id && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2"
                >
                  Voir dans Dashboard
                </Button>
              )}
              {data.id && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Force a new analysis by adding a query parameter
                    setLoading(true);
                    setError(null);
                    setErrorDetails(null);
                    try {
                      const response = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({ niche, forceNew: true }),
                      });
                      if (response.ok) {
                        const newData = await response.json();
                        setData(newData);
                      } else {
                        const errorData = await response.json().catch(() => ({}));
                        setError('Erreur lors de la nouvelle analyse');
                        setErrorDetails(errorData.error || 'Une erreur est survenue.');
                      }
                    } catch (err: unknown) {
                      setError('Erreur de connexion');
                      setErrorDetails(err instanceof Error ? err.message : 'Impossible de se connecter au serveur.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Nouvelle Analyse
                </Button>
              )}
            </div>
            {!data.id && (
              <p className="text-xs text-muted-foreground mt-4">
                💡 Connectez-vous pour sauvegarder cette analyse dans votre dashboard
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

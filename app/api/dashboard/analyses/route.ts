import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Authentication required for dashboard
    const authHeader = request.headers.get('authorization');
    const bearerToken =
      authHeader && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice('bearer '.length).trim()
        : null;

    let userId: string | null = null;
    if (bearerToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
      if (error) {
        console.warn('Invalid bearer token for /api/dashboard/analyses:', error.message);
      }
      userId = data?.user?.id ?? null;
    }

    if (!userId) {
      const session = await getServerSession();
      userId = session?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's analyses, ordered by most recent first
    console.log(`[Dashboard API] Fetching analyses for user ${userId}`);
    const { data, error } = await supabaseAdmin
      .from('reddit_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(50); // Limit to 50 most recent

    if (error) {
      // If migrations haven't been run yet, PostgREST typically returns PGRST205 / "not found".
      // In that case (and to avoid blocking the dashboard), return an empty list with 200.
      if (error.code === 'PGRST205' || error.message?.toLowerCase().includes('not found')) {
        console.log(`[Dashboard API] Table not found for user ${userId}`);
        return NextResponse.json({ analyses: [] });
      }

      // For unexpected errors, keep a 500 (the client already renders an error state).
      console.error('[Dashboard API] Error fetching analyses:', error);
      return NextResponse.json(
        {
          error: 'Error fetching analyses',
          details: error.message,
          analyses: [],
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log(`[Dashboard API] No analyses found for user ${userId}`);
      return NextResponse.json({ analyses: [] });
    }

    // Log each analysis found
    console.log(`[Dashboard API] Found ${data.length} raw analyses for user ${userId}:`);
    data.forEach((analysis: { id: string; niche: string; scanned_at: string; pains?: unknown[] }) => {
      const painsCount = Array.isArray(analysis.pains) ? analysis.pains.length : 0;
      console.log(`  - ID: ${analysis.id}, niche: "${analysis.niche}", scanned_at: ${analysis.scanned_at}, pains: ${painsCount}`);
    });

    // Deduplicate analyses: prioritize analyses with pain points, then most recent
    interface Analysis {
      user_id: string;
      niche: string;
      scanned_at: string;
      pains?: unknown[];
      [key: string]: unknown;
    }
    
    // Group by niche and select the best one for each niche
    const analysesByNiche = new Map<string, Analysis>();
    
    data.forEach((analysis: Analysis) => {
      const nicheKey = `${analysis.user_id}-${analysis.niche.toLowerCase().trim()}`;
      const existing = analysesByNiche.get(nicheKey);
      const currentPainsCount = Array.isArray(analysis.pains) ? analysis.pains.length : 0;
      const existingPainsCount = existing && Array.isArray(existing.pains) ? existing.pains.length : 0;
      
      if (!existing) {
        // First analysis for this niche
        analysesByNiche.set(nicheKey, analysis);
      } else {
        // Prefer analysis with pain points, or most recent if both have same pain count
        if (currentPainsCount > existingPainsCount) {
          // Current has more pain points, prefer it
          analysesByNiche.set(nicheKey, analysis);
        } else if (currentPainsCount === existingPainsCount && currentPainsCount > 0) {
          // Both have pain points, prefer most recent
          const currentDate = new Date(analysis.scanned_at).getTime();
          const existingDate = new Date(existing.scanned_at).getTime();
          if (currentDate > existingDate) {
            analysesByNiche.set(nicheKey, analysis);
          }
        } else if (currentPainsCount === 0 && existingPainsCount === 0) {
          // Both have no pain points, prefer most recent
          const currentDate = new Date(analysis.scanned_at).getTime();
          const existingDate = new Date(existing.scanned_at).getTime();
          if (currentDate > existingDate) {
            analysesByNiche.set(nicheKey, analysis);
          }
        }
        // If existing has more pain points, keep it
      }
    });
    
    const uniqueAnalyses = Array.from(analysesByNiche.values()).sort((a: Analysis, b: Analysis) => 
      new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    );

    console.log(`[Dashboard API] After deduplication: ${uniqueAnalyses.length} unique analyses`);
    uniqueAnalyses.forEach((analysis: { id: string; niche: string; scanned_at: string; pains?: unknown[] }) => {
      const painsCount = Array.isArray(analysis.pains) ? analysis.pains.length : 0;
      console.log(`  - ID: ${analysis.id}, niche: "${analysis.niche}", scanned_at: ${analysis.scanned_at}, pains: ${painsCount}`);
    });

    return NextResponse.json({ analyses: uniqueAnalyses });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[API] Fetching analysis by ID:', id);

    // Authentication required
    const authHeader = request.headers.get('authorization');
    const bearerToken =
      authHeader && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice('bearer '.length).trim()
        : null;

    let userId: string | null = null;
    if (bearerToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
      if (error) {
        console.warn('Invalid bearer token for /api/analyze/id/[id]:', error.message);
      }
      userId = data?.user?.id ?? null;
    }

    if (!userId) {
      const session = await getServerSession();
      userId = session?.user?.id ?? null;
    }

    if (!userId) {
      console.log('[API] No user ID found for analysis ID:', id);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[API] Fetching analysis ID:', id, 'for user:', userId);

    // Fetch analysis by ID, ensuring it belongs to the user
    const { data, error } = await supabaseAdmin
      .from('reddit_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('[API] Error fetching analysis ID:', id, 'Error:', error);
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.log('[API] Analysis not found for ID:', id);
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }
      if (error.code === 'PGRST205' || error.message?.includes('not found')) {
        console.log('[API] Database table not found');
        return NextResponse.json(
          { error: 'Database table not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching analysis:', error);
      return NextResponse.json(
        { error: 'Error fetching analysis', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('[API] No data returned for analysis ID:', id);
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Check if pains is an array and has content
    const painsArray = Array.isArray(data.pains) ? data.pains : (data.pains ? [data.pains] : []);
    console.log('[API] ✅ Found analysis ID:', id, 'niche:', data.niche, 'pains count:', painsArray.length);
    
    if (painsArray.length === 0) {
      console.warn('[API] ⚠️ Analysis found but no pain points in data.pains:', data.pains);
    }

    // Transform the database record to match AnalyzeResponse format
    const response = {
      id: data.id,
      niche: data.niche,
      scannedAt: data.scanned_at,
      totalPosts: data.total_posts,
      pains: painsArray,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Get analysis by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

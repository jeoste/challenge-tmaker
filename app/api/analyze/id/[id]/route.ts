import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch analysis by ID, ensuring it belongs to the user
    const { data, error } = await supabaseAdmin
      .from('reddit_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }
      if (error.code === 'PGRST205' || error.message?.includes('not found')) {
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
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Transform the database record to match AnalyzeResponse format
    const response = {
      id: data.id,
      niche: data.niche,
      scannedAt: data.scanned_at,
      totalPosts: data.total_posts,
      pains: data.pains || [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get analysis by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

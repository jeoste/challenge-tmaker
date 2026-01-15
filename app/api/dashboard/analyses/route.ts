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
        return NextResponse.json({ analyses: [] });
      }

      // For unexpected errors, keep a 500 (the client already renders an error state).
      console.error('Error fetching analyses:', error);
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
      console.log(`No analyses found for user ${userId}`);
    } else {
      console.log(`Found ${data.length} analyses for user ${userId}`);
    }

    return NextResponse.json({ analyses: data || [] });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

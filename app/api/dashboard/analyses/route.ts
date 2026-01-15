import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Authentication required for dashboard
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch user's analyses, ordered by most recent first
    const { data, error } = await supabaseAdmin
      .from('reddit_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(50); // Limit to 50 most recent

    if (error) {
      console.error('Error fetching analyses:', error);
      // Log detailed error for debugging
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { 
          error: 'Error fetching analyses',
          details: error.message,
          analyses: [] // Return empty array instead of failing
        },
        { status: 500 }
      );
    }

    console.log(`Found ${data?.length || 0} analyses for user ${userId}`); // Debug log
    return NextResponse.json({ analyses: data || [] });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

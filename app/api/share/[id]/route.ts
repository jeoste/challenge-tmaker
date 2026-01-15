
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Authentication check
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Fetch from Supabase using admin client
        const { data, error } = await supabaseAdmin
            .from('reddit_analyses')
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.id) // Ensure user can only access their own analyses
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Share not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Share fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

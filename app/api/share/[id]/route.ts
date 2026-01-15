
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Assuming we store share pages in a table 'shares' or 'analyses'
        // For now, let's assume we are fetching from 'reddit_analyses' or a similar table
        // Adjust table name as per your actual Supabase schema
        const { data, error } = await supabase
            .from('reddit_analyses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
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

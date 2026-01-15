import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession, getUserPlan } from '@/lib/supabase-server';

// GET: Fetch user's favorites
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const bearerToken =
            authHeader && authHeader.toLowerCase().startsWith('bearer ')
                ? authHeader.slice('bearer '.length).trim()
                : null;

        let userId: string | null = null;
        if (bearerToken) {
            const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
            if (error) {
                console.warn('Invalid bearer token for /api/favorites:', error.message);
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

        // Fetch user's favorites, ordered by most recent first
        const { data, error } = await supabaseAdmin
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === 'PGRST205' || error.message?.toLowerCase().includes('not found')) {
                return NextResponse.json({ favorites: [] });
            }
            console.error('Error fetching favorites:', error);
            return NextResponse.json(
                { error: 'Error fetching favorites', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ favorites: data || [] });
    } catch (error) {
        console.error('Favorites API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Add a favorite
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const bearerToken =
            authHeader && authHeader.toLowerCase().startsWith('bearer ')
                ? authHeader.slice('bearer '.length).trim()
                : null;

        let userId: string | null = null;
        if (bearerToken) {
            const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
            if (error) {
                console.warn('Invalid bearer token for /api/favorites:', error.message);
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

        // Get user plan to check limits
        const userPlan = await getUserPlan(userId);

        // Check current favorites count for free users
        if (userPlan === 'free') {
            const { count, error: countError } = await supabaseAdmin
                .from('favorites')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (countError) {
                console.error('Error counting favorites:', countError);
            } else if (count && count >= 3) {
                return NextResponse.json(
                    { 
                        error: 'Limite de favoris atteinte. Maximum 3 favoris pour le plan gratuit.',
                        limit: 3,
                        current: count
                    },
                    { status: 403 }
                );
            }
        }

        const body = await request.json();
        const { analysis_id, pain_point_id, pain_point_data } = body;

        if (!analysis_id || !pain_point_id || !pain_point_data) {
            return NextResponse.json(
                { error: 'Missing required fields: analysis_id, pain_point_id, pain_point_data' },
                { status: 400 }
            );
        }

        // Check if already favorited
        const { data: existing } = await supabaseAdmin
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('analysis_id', analysis_id)
            .eq('pain_point_id', pain_point_id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Already favorited', favorite: existing },
                { status: 409 }
            );
        }

        // Insert favorite
        const { data, error } = await supabaseAdmin
            .from('favorites')
            .insert({
                user_id: userId,
                analysis_id,
                pain_point_id,
                pain_point_data
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding favorite:', error);
            return NextResponse.json(
                { error: 'Error adding favorite', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ favorite: data });
    } catch (error) {
        console.error('Favorites API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a favorite
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const bearerToken =
            authHeader && authHeader.toLowerCase().startsWith('bearer ')
                ? authHeader.slice('bearer '.length).trim()
                : null;

        let userId: string | null = null;
        if (bearerToken) {
            const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
            if (error) {
                console.warn('Invalid bearer token for /api/favorites:', error.message);
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

        const { searchParams } = new URL(request.url);
        const favoriteId = searchParams.get('id');
        const analysisId = searchParams.get('analysis_id');
        const painPointId = searchParams.get('pain_point_id');

        if (!favoriteId && (!analysisId || !painPointId)) {
            return NextResponse.json(
                { error: 'Missing required parameter: id or (analysis_id and pain_point_id)' },
                { status: 400 }
            );
        }

        let query = supabaseAdmin
            .from('favorites')
            .delete()
            .eq('user_id', userId);

        if (favoriteId) {
            query = query.eq('id', favoriteId);
        } else {
            query = query.eq('analysis_id', analysisId).eq('pain_point_id', painPointId);
        }

        const { error } = await query;

        if (error) {
            console.error('Error removing favorite:', error);
            return NextResponse.json(
                { error: 'Error removing favorite', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Favorites API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

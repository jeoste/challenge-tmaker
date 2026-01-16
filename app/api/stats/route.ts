import { NextResponse } from 'next/server';
import { redis } from '@/lib/cache';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Check cache first (5 min TTL) - only if Redis is configured
    const cacheKey = 'stats:posts_24h';
    let cached = null;
    if (redis) {
      try {
        cached = await redis.get(cacheKey);
      } catch {
        // Redis not available, continue without cache (silent fallback)
      }
    }
    
    if (cached) {
      return NextResponse.json({ postsScanned24h: parseInt(cached as string, 10) });
    }

    // Calculate total posts scanned in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Try to fetch from scan_logs, but handle gracefully if table doesn't exist
    let totalPosts = 0;
    try {
      const { data, error } = await supabaseAdmin
        .from('scan_logs')
        .select('posts_found')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (error) {
        // Table might not exist yet (migrations not run) or other issues:
        // do not fail the UI, and do not spam logs.
        return NextResponse.json({ postsScanned24h: 0 });
      }

      totalPosts = data?.reduce((sum, log) => sum + (log.posts_found || 0), 0) || 0;
    } catch {
      // Handle any other errors gracefully (silent fallback)
      return NextResponse.json({ postsScanned24h: 0 });
    }

    // Cache for 5 minutes - only if Redis is configured
    if (redis) {
      try {
        await redis.setex(cacheKey, 300, totalPosts.toString());
      } catch {
        // Redis not available, continue without caching (silent fallback)
      }
    }

    return NextResponse.json({ postsScanned24h: totalPosts });
  } catch {
    // Silent fallback: stats should never break pages.
    return NextResponse.json({ postsScanned24h: 0 });
  }
}

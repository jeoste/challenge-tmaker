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
      } catch (error) {
        // Redis not available, continue without cache
        console.warn('Redis not available, skipping cache');
      }
    }
    
    if (cached) {
      return NextResponse.json({ postsScanned24h: parseInt(cached as string, 10) });
    }

    // Calculate total posts scanned in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabaseAdmin
      .from('scan_logs')
      .select('posts_found')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (error) {
      console.error('Error fetching stats:', error);
      // Return cached or default value
      return NextResponse.json({ postsScanned24h: 0 });
    }

    const totalPosts = data?.reduce((sum, log) => sum + (log.posts_found || 0), 0) || 0;

    // Cache for 5 minutes - only if Redis is configured
    if (redis) {
      try {
        await redis.setex(cacheKey, 300, totalPosts.toString());
      } catch (error) {
        // Redis not available, continue without caching
        console.warn('Redis not available, skipping cache write');
      }
    }

    return NextResponse.json({ postsScanned24h: totalPosts });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ postsScanned24h: 0 });
  }
}

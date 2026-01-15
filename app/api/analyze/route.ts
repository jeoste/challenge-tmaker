
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { fetchRedditPosts, getSubredditsForNiche } from '@/lib/reddit';
import { quickFilter, calculateGoldScore } from '@/lib/scoring';
import { batchLLMAnalysis, generateBlueprint } from '@/lib/llm';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-server';

// Helper to remove duplicates based on title and selftext
function removeDuplicates(posts: any[]) {
    const seen = new Set();
    return posts.filter(post => {
        const key = `${post.title}-${post.selftext}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        // Authentication is optional (per PRD: "100% gratuit • Pas de compte requis")
        // If authenticated, use user_id; otherwise use IP for rate limiting
        const session = await getServerSession();
        const userId = session?.user?.id || null;
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'anonymous';
        
        const { niche } = await request.json();

        if (!niche) {
            return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
        }

        // 1. Rate limiting (using user_id if authenticated, otherwise IP)
        const rateLimitIdentifier = userId || ip;
        const rateLimit = await checkRateLimit(rateLimitIdentifier);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Max 5 scans per hour.' },
                { status: 429 }
            );
        }

        // 2. Check cache (only if Redis is configured)
        const cacheKey = `scan:${niche.toLowerCase()}`;
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    // Redis might return string or object depending on how it was set/client config. 
                    // Upstash client usually parses JSON automatically if it was set as JSON object, 
                    // but if set as stringified JSON, we might need to parse.
                    // Ideally we store stringified, so let's check.
                    try {
                        // If cached is already an object, return it. If string, parse it.
                        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
                        return NextResponse.json(data);
                    } catch (e) {
                        console.error("Cache parse error", e);
                        // If cache is corrupted, proceed to fetch fresh data
                    }
                }
            } catch (error) {
                // Redis not available, continue without cache
                console.warn('Redis not available, skipping cache check');
            }
        }

        // 3. Fetch Reddit
        const subreddits = getSubredditsForNiche(niche);
        // Fetch from all subreddits in parallel
        const postsResults = await Promise.all(
            subreddits.map(sub => fetchRedditPosts(sub, 'week'))
        );
        const posts = removeDuplicates(postsResults.flat());

        // 4. Quick filter
        const filtered = posts.filter(quickFilter);

        // 4.5. Group similar posts for counting
        function groupSimilarPosts(posts: any[]): Map<string, number> {
            const groups = new Map<string, number>();
            const processed = new Set<string>();
            
            posts.forEach((post, i) => {
                if (processed.has(post.id)) return;
                
                const titleWords = post.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
                let count = 1;
                const similarIds = [post.id];
                
                posts.slice(i + 1).forEach((otherPost) => {
                    if (processed.has(otherPost.id)) return;
                    
                    const otherWords = otherPost.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
                    const commonWords = titleWords.filter((w: string) => otherWords.includes(w));
                    const similarity = commonWords.length / Math.max(titleWords.length, otherWords.length);
                    
                    // If similarity > 0.3, consider them similar
                    if (similarity > 0.3) {
                        count++;
                        similarIds.push(otherPost.id);
                    }
                });
                
                similarIds.forEach(id => {
                    groups.set(id, count);
                    processed.add(id);
                });
            });
            
            return groups;
        }
        
        const similarCounts = groupSimilarPosts(filtered);

        // 5. Score & sort (Initial scoring for prioritization before expensive LLM)
        const scored = filtered
            .map(post => ({
                ...post,
                goldScore: calculateGoldScore(post),
                similarPostsCount: similarCounts.get(post.id) || 1
            }))
            .sort((a, b) => b.goldScore - a.goldScore)
            .slice(0, 20);  // Top 20 for LLM analysis

        // 6. LLM batch analysis
        let llmFiltered: Array<any & { relevanceScore: number }> = [];
        if (scored.length > 0) {
            llmFiltered = await batchLLMAnalysis(scored);
        } else {
            // Fallback if no posts pass filters - maybe try unfiltered top posts?
            // or just return empty result
            console.log(`No posts passed quick filter for ${niche}`);
        }

        // 7. Recalculate scores with LLM relevance and sort
        const rescored = llmFiltered
            .map(post => ({
                ...post,
                goldScore: Math.round(calculateGoldScore(post, post.relevanceScore)),
                postsCount: post.similarPostsCount || 1
            }))
            .sort((a, b) => b.goldScore - a.goldScore);

        // 8. Generate blueprints (top 10 confirmed opportunities)
        const top10 = rescored.slice(0, 10);
        const pains = await Promise.all(
            top10.map(async (post, index) => {
                const blueprint = await generateBlueprint(post);
                return {
                    id: `pain-${index}-${Date.now()}`,
                    title: post.title,
                    selftext: post.selftext || '',
                    subreddit: post.subreddit,
                    goldScore: post.goldScore,
                    postsCount: post.postsCount || 1,
                    blueprint
                };
            })
        );

        // 9. Cache results
        const result = {
            niche,
            scannedAt: new Date().toISOString(),
            totalPosts: posts.length,
            pains
        };

        // Store in Redis (1 hour expiration) - only if Redis is configured
        if (redis) {
            try {
                await redis.setex(cacheKey, 3600, JSON.stringify(result));
            } catch (error) {
                // Redis not available, continue without caching
                console.warn('Redis not available, skipping cache write');
            }
        }

        // 10. Save to Supabase (only if authenticated)
        let analysisData = null;
        if (userId) {
            const { data, error: analysisError } = await supabaseAdmin
                .from('reddit_analyses')
                .insert({
                    user_id: userId,
                    niche,
                    scanned_at: new Date().toISOString(),
                    total_posts: posts.length,
                    pains: pains
                })
                .select()
                .single();

            if (analysisError) {
                console.error('Error saving to Supabase:', analysisError);
                // Continue even if Supabase save fails
            } else {
                analysisData = data;
            }
        }

        // 11. Log metrics (only if table exists and user is authenticated)
        if (userId) {
            const duration = Date.now() - startTime;
            await supabaseAdmin
                .from('scan_logs')
                .insert({
                    user_id: userId,
                    niche,
                    duration_ms: duration,
                    posts_found: posts.length,
                    pains_generated: pains.length,
                    ip_address: ip
                })
                .catch(err => {
                    // Silently fail if table doesn't exist (migrations not run)
                    if (err.code !== 'PGRST205' && !err.message?.includes('not found')) {
                        console.error('Error logging metrics:', err);
                    }
                });
        }

        // Include analysis ID in response if saved successfully
        const response = analysisData 
            ? { ...result, id: analysisData.id }
            : result;

        return NextResponse.json(response);
    } catch (error) {
        console.error('Analyze error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

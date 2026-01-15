
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache';
import { checkRateLimit, isIPWhitelisted } from '@/lib/rate-limit';
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
        // Authentication is required.
        // In local dev / some setups, the browser client may only have the session in localStorage
        // (no Supabase auth cookies), so we support both cookie-based session and Bearer token.
        const authHeader = request.headers.get('authorization');
        const bearerToken =
            authHeader && authHeader.toLowerCase().startsWith('bearer ')
                ? authHeader.slice('bearer '.length).trim()
                : null;

        let userId: string | null = null;
        if (bearerToken) {
            const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
            if (error) {
                console.warn('Invalid bearer token for /api/analyze:', error.message);
            }
            userId = data?.user?.id ?? null;
        }

        if (!userId) {
            const session = await getServerSession();
            userId = session?.user?.id ?? null;
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in to perform an analysis.' },
                { status: 401 }
            );
        }

        // Extract IP from various headers (supporting proxies and load balancers)
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIP = request.headers.get('x-real-ip');
        const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
        const trueClientIP = request.headers.get('true-client-ip'); // Some proxies
        
        const ip = forwardedFor?.split(',')[0]?.trim() ||
            realIP?.trim() ||
            cfConnectingIP?.trim() ||
            trueClientIP?.trim() ||
            'anonymous';

        console.log('[Rate Limit] IP detection - x-forwarded-for:', forwardedFor, 'x-real-ip:', realIP, 'cf-connecting-ip:', cfConnectingIP, 'true-client-ip:', trueClientIP, '-> final IP:', ip);

        const { niche } = await request.json();

        if (!niche) {
            return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
        }

        // 1. Rate limiting (using user_id since authentication is required)
        // Check if IP is whitelisted for testing
        const ipWhitelisted = isIPWhitelisted(ip);
        console.log('[Rate Limit] IP whitelist check result:', ipWhitelisted, 'for IP:', ip);

        // Use user_id for rate limiting
        const rateLimitIdentifier = `user:${userId}`;
        console.log('[Rate Limit] Checking rate limit for identifier:', rateLimitIdentifier, 'isWhitelisted:', ipWhitelisted);
        const rateLimit = await checkRateLimit(rateLimitIdentifier, ipWhitelisted);
        
        if (!rateLimit.allowed) {
            // Log for debugging
            console.log(`[Rate Limit] BLOCKED - Rate limit exceeded for user:${userId}, IP:${ip}, remaining: ${rateLimit.remaining}, reset: ${new Date(rateLimit.reset).toISOString()}`);
            console.log(`[Rate Limit] IP whitelist status was: ${ipWhitelisted}`);
            return NextResponse.json(
                {
                    error: `Rate limit exceeded. Max 5 scans per hour. Detected IP: ${ip}`,
                    remaining: rateLimit.remaining,
                    reset: rateLimit.reset
                },
                { status: 429 }
            );
        }

        // Log if IP is whitelisted (for debugging)
        if (ipWhitelisted) {
            console.log(`[Rate Limit] ALLOWED - IP ${ip} is whitelisted - rate limit bypassed`);
        } else {
            console.log(`[Rate Limit] ALLOWED - Rate limit check passed for user:${userId}, remaining: ${rateLimit.remaining}`);
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

        // 10. Save to Supabase
        let analysisData = null;
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
            console.error('CRITICAL: Error saving to Supabase:', analysisError);
            console.error('Payload was:', {
                niche,
                scanned_at: new Date().toISOString(),
                total_posts: posts.length,
                pains_count: pains.length
            });
            throw new Error(`Failed to save analysis: ${analysisError.message}`);
        }

        analysisData = data;

        // 11. Log metrics (only if table exists)
        const duration = Date.now() - startTime;


        // Use standard await pattern instead of .catch() for clearer error handling and better compatibility
        const { error: metricsError } = await supabaseAdmin
            .from('scan_logs')
            .insert({
                user_id: userId,
                niche,
                duration_ms: duration,
                posts_found: posts.length,
                pains_generated: pains.length,
                ip_address: ip
            });

        if (metricsError) {
            // Silently fail if table doesn't exist (migrations not run)
            if (metricsError.code !== 'PGRST205' && !metricsError.message?.includes('not found')) {
                console.error('Error logging metrics:', metricsError);
            }
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


import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache';
import { checkRateLimit, checkSerperRateLimit, checkRapidApiRateLimit, isIPWhitelisted } from '@/lib/rate-limit';
import { fetchRedditPosts, getSubredditsForNiche } from '@/lib/reddit';
import { searchRedditViaSerper, serperResultToRedditPost } from '@/lib/serper';
import { getSubredditInfo, searchRedditPosts, rapidApiPostToRedditPost } from '@/lib/rapidapi-reddit';
import { quickFilter, calculateGoldScore } from '@/lib/scoring';
import { batchLLMAnalysis, generateBlueprint } from '@/lib/llm';
import { supabaseAdmin, getServerSession, getUserPlan } from '@/lib/supabase-server';

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

        const body = await request.json();
        const { niche, forceNew } = body;

        // Validate niche
        if (!niche || typeof niche !== 'string') {
            return NextResponse.json(
                { error: 'Niche parameter is required' },
                { status: 400 }
            );
        }

        // If not forcing a new analysis, check if one exists
        if (!forceNew && userId) {
            const { data: existingAnalysis, error: fetchError } = await supabaseAdmin
                .from('reddit_analyses')
                .select('*')
                .eq('user_id', userId)
                .eq('niche', niche)
                .order('scanned_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // If analysis exists and no error (or error is just "no rows"), return it
            if (existingAnalysis && !fetchError) {
                console.log(`[Cache] Returning existing analysis for niche: ${niche}`);
                return NextResponse.json({
                    id: existingAnalysis.id,
                    niche: existingAnalysis.niche,
                    scannedAt: existingAnalysis.scanned_at,
                    totalPosts: existingAnalysis.total_posts,
                    pains: existingAnalysis.pains || [],
                });
            }
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

        // 1. Get user plan (defaults to 'free')
        const userPlan = await getUserPlan(userId);
        console.log(`[Plan] User ${userId} has plan: ${userPlan}`);

        // 2. Rate limiting (using user_id since authentication is required)
        // Check if IP is whitelisted for testing
        const ipWhitelisted = isIPWhitelisted(ip);
        console.log('[Rate Limit] IP whitelist check result:', ipWhitelisted, 'for IP:', ip);

        // Use user_id for rate limiting
        const rateLimitIdentifier = `user:${userId}`;
        console.log('[Rate Limit] Checking rate limit for identifier:', rateLimitIdentifier, 'plan:', userPlan, 'isWhitelisted:', ipWhitelisted);
        const rateLimit = await checkRateLimit(rateLimitIdentifier, ipWhitelisted, userPlan);
        
        if (!rateLimit.allowed) {
            // Log for debugging
            const maxScans = userPlan === 'free' ? 3 : 5;
            console.log(`[Rate Limit] BLOCKED - Rate limit exceeded for user:${userId} (plan: ${userPlan}), IP:${ip}, remaining: ${rateLimit.remaining}, reset: ${new Date(rateLimit.reset).toISOString()}`);
            console.log(`[Rate Limit] IP whitelist status was: ${ipWhitelisted}`);
            return NextResponse.json(
                {
                    error: `Rate limit exceeded. Max ${maxScans} scans per hour for ${userPlan} plan. Detected IP: ${ip}`,
                    remaining: rateLimit.remaining,
                    reset: rateLimit.reset,
                    plan: userPlan
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
        // Use a shorter cache TTL (15 minutes instead of 1 hour) to get fresher results
        // Also include timestamp in cache key to allow for cache busting
        const cacheKey = `scan:${niche.toLowerCase()}:${Math.floor(Date.now() / (15 * 60 * 1000))}`; // 15-minute buckets
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log(`[Cache] Returning cached results for ${niche} (15min bucket)`);
                    try {
                        // If cached is already an object, return it. If string, parse it.
                        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
                        return NextResponse.json(data);
                    } catch (e) {
                        console.error("Cache parse error", e);
                        // If cache is corrupted, proceed to fetch fresh data
                    }
                } else {
                    console.log(`[Cache] Cache miss for ${niche}, fetching fresh data`);
                }
            } catch (error) {
                // Redis not available, continue without cache
                console.warn('Redis not available, skipping cache check');
            }
        }

        // 3. Fetch Reddit data
        const subreddits = getSubredditsForNiche(niche);
        
        // 3.0. Optionally enrich with RapidAPI (VERY limited - 50/month total)
        // Use reddit3 for search and reddit34 for subreddit metadata
        let subredditMetadata: Record<string, any> = {};
        const rapidApiRateLimit = await checkRapidApiRateLimit(
            `rapidapi:user:${userId}`,
            ipWhitelisted,
            userPlan
        );
        
        if (rapidApiRateLimit.allowed && process.env.RAPID_API_KEY && subreddits.length > 0) {
            try {
                // 3.0.1. Search posts using reddit3 (high-value operation)
                // Use niche as search query on primary subreddit
                const primarySubreddit = subreddits[0];
                const rapidApiPosts = await searchRedditPosts(
                    niche,
                    primarySubreddit,
                    'week',
                    'relevance'
                );
                
                if (rapidApiPosts.length > 0) {
                    console.log(`[RapidAPI] Found ${rapidApiPosts.length} posts via reddit3 search`);
                    const convertedPosts = rapidApiPosts.map(rapidApiPostToRedditPost);
                    // Merge with existing posts, avoiding duplicates
                    const existingIds = new Set(posts.map(p => p.id));
                    const newPosts = convertedPosts.filter(p => !existingIds.has(p.id));
                    if (newPosts.length > 0) {
                        posts = removeDuplicates([...posts, ...newPosts]);
                        console.log(`[RapidAPI] Added ${newPosts.length} new posts from reddit3`);
                    }
                }
                
                // 3.0.2. Get subreddit metadata using reddit34 (only if premium and quota allows)
                // For free users, skip metadata to conserve quota for search
                if (userPlan === 'premium') {
                    // Check if we still have quota after the search
                    const rapidApiRateLimitAfter = await checkRapidApiRateLimit(
                        `rapidapi:user:${userId}`,
                        ipWhitelisted,
                        userPlan
                    );
                    
                    if (rapidApiRateLimitAfter.allowed) {
                        const subredditInfo = await getSubredditInfo(primarySubreddit);
                        if (subredditInfo) {
                            subredditMetadata[primarySubreddit] = subredditInfo;
                            console.log(`[RapidAPI] Fetched metadata for r/${primarySubreddit}: ${subredditInfo.subscribers || 'unknown'} subscribers`);
                        }
                    }
                } else {
                    console.log('[RapidAPI] Skipping subreddit metadata for free plan to conserve quota for search');
                }
            } catch (error) {
                console.error('[RapidAPI] Error enriching with RapidAPI data:', error);
                // Continue without RapidAPI data - not critical
            }
        } else {
            if (!process.env.RAPID_API_KEY) {
                console.log('[RapidAPI] RAPID_API_KEY not configured. Skipping RapidAPI enrichment.');
            } else {
                console.log(`[RapidAPI] Rate limit exceeded. Remaining: ${rapidApiRateLimit.remaining}. Skipping RapidAPI enrichment.`);
            }
        }
        
        // 3.1. Fetch from Reddit API directly (primary source)
        const postsResults = await Promise.all(
            subreddits.map(sub => fetchRedditPosts(sub, 'week'))
        );
        let posts = removeDuplicates(postsResults.flat());
        
        // 3.2. Enrich with Serper API (if rate limit allows and API key is configured)
        const serperRateLimit = await checkSerperRateLimit(
            `serper:user:${userId}`,
            ipWhitelisted,
            userPlan
        );
        
        if (serperRateLimit.allowed && process.env.SERPER_DEV_API_KEY) {
            console.log(`[Serper] Rate limit check passed. Remaining: ${serperRateLimit.remaining}`);
            
            try {
                // Search via Serper for each subreddit (limit to avoid quota exhaustion)
                const serperSearches = subreddits.slice(0, 2).map(async (subreddit) => {
                    const serperResults = await searchRedditViaSerper(niche, subreddit);
                    return serperResults.map(result => {
                        const partialPost = serperResultToRedditPost(result);
                        // Try to match with existing posts by URL
                        const existingPost = posts.find(p => 
                            p.permalink === partialPost.permalink || 
                            p.permalink?.includes(partialPost.id || '')
                        );
                        
                        if (existingPost) {
                            // Merge snippet into existing post if it has more context
                            if (result.snippet && result.snippet.length > existingPost.selftext.length) {
                                existingPost.selftext = result.snippet;
                            }
                            return null; // Don't add duplicate
                        }
                        
                        return partialPost;
                    }).filter(Boolean);
                });
                
                const serperPosts = (await Promise.all(serperSearches)).flat().filter(Boolean);
                
                // Add Serper posts to the collection
                if (serperPosts.length > 0) {
                    console.log(`[Serper] Added ${serperPosts.length} additional posts from Serper`);
                    posts = removeDuplicates([...posts, ...serperPosts]);
                }
            } catch (error) {
                console.error('[Serper] Error enriching with Serper data:', error);
                // Continue without Serper data - not critical
            }
        } else {
            if (!process.env.SERPER_DEV_API_KEY) {
                console.log('[Serper] SERPER_DEV_API_KEY not configured. Skipping Serper enrichment.');
            } else {
                console.log(`[Serper] Rate limit exceeded. Remaining: ${serperRateLimit.remaining}. Skipping Serper enrichment.`);
            }
        }

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

        // 7.5. Fallback: If LLM filtered everything, use top scored posts
        // Always ensure we have at least 1-3 results
        let filteredResults = rescored;
        
        if (filteredResults.length === 0 && scored.length > 0) {
            console.warn(`[Fallback] LLM filtered all posts. Using top ${Math.min(3, scored.length)} posts by engagement score.`);
            // Use top posts by engagement (score + comments) from different subreddits
            const subredditGroups = new Map<string, typeof scored>();
            scored.forEach(post => {
                if (!subredditGroups.has(post.subreddit)) {
                    subredditGroups.set(post.subreddit, []);
                }
                subredditGroups.get(post.subreddit)!.push(post);
            });
            
            // Take top post from each subreddit, then fill with best overall
            const topBySubreddit: typeof scored = [];
            subredditGroups.forEach((posts, subreddit) => {
                const top = posts.sort((a, b) => {
                    const aEng = (a.score * 1.0) + (a.num_comments * 3.0);
                    const bEng = (b.score * 1.0) + (b.num_comments * 3.0);
                    return bEng - aEng;
                })[0];
                if (top) topBySubreddit.push(top);
            });
            
            // Sort by engagement and take top 3
            const topByEngagement = scored.sort((a, b) => {
                const aEng = (a.score * 1.0) + (a.num_comments * 3.0);
                const bEng = (b.score * 1.0) + (b.num_comments * 3.0);
                return bEng - aEng;
            });
            
            // Combine: prioritize diversity (different subreddits), then best engagement
            const combined = [...topBySubreddit, ...topByEngagement];
            const unique = combined.filter((post, index, self) => 
                index === self.findIndex(p => p.id === post.id)
            );
            
            filteredResults = unique.slice(0, 3).map(post => ({
                ...post,
                isOpportunity: true,
                relevanceScore: 1.0, // Default relevance
                goldScore: Math.round(calculateGoldScore(post, 1.0)),
                postsCount: post.similarPostsCount || 1
            }));
            
            console.log(`[Fallback] Selected ${filteredResults.length} posts from ${subredditGroups.size} subreddits`);
        }

        // 7.6. Apply plan-based limitations for free users
        if (userPlan === 'free') {
            // Free plan: only results with score < 80 (80 is the maximum)
            const beforeFilter = filteredResults.length;
            filteredResults = filteredResults.filter(post => post.goldScore < 80);
            console.log(`[Plan] Free plan: Filtered ${beforeFilter} results to ${filteredResults.length} (score < 80)`);
            
            // If free plan filtered everything, still return at least 1 result
            if (filteredResults.length === 0 && beforeFilter > 0) {
                console.warn(`[Plan] Free plan filtered all results. Returning top result anyway.`);
                const fallbackPost = rescored[0] || scored[0];
                if (fallbackPost) {
                    filteredResults = [{
                        ...fallbackPost,
                        goldScore: Math.min(79, fallbackPost.goldScore || 70) // Cap at 79 for free plan
                    }];
                }
            }
        }
        
        // 7.7. Ensure we always have at least 1 result (minimum viable response)
        if (filteredResults.length === 0 && scored.length > 0) {
            console.warn(`[Fallback] No results after all filters. Using top post by engagement.`);
            const topPost = scored.sort((a, b) => {
                const aEng = (a.score * 1.0) + (a.num_comments * 3.0);
                const bEng = (b.score * 1.0) + (b.num_comments * 3.0);
                return bEng - aEng;
            })[0];
            
            if (topPost) {
                filteredResults = [{
                    ...topPost,
                    isOpportunity: true,
                    relevanceScore: 1.0,
                    goldScore: Math.round(calculateGoldScore(topPost, 1.0)),
                    postsCount: topPost.similarPostsCount || 1
                }];
            }
        }

        // 8. Generate blueprints (top 10 for premium, top 3 for free)
        const maxResults = userPlan === 'free' ? 3 : 10;
        const topResults = filteredResults.slice(0, maxResults);
        console.log(`[Plan] Generating ${topResults.length} blueprints for ${userPlan} plan`);
        const pains = await Promise.all(
            topResults.map(async (post, index) => {
                const blueprint = await generateBlueprint(post);
                // Build Reddit URL from permalink
                const redditUrl = post.permalink 
                    ? (post.permalink.startsWith('http') 
                        ? post.permalink 
                        : `https://www.reddit.com${post.permalink}`)
                    : undefined;
                
                return {
                    id: `pain-${index}-${Date.now()}`,
                    title: post.title,
                    selftext: post.selftext || '',
                    subreddit: post.subreddit,
                    goldScore: post.goldScore,
                    postsCount: post.postsCount || 1,
                    permalink: redditUrl,
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

        // Store in Redis (15 minutes expiration) - only if Redis is configured
        // Using shorter TTL to get fresher results more frequently
        if (redis) {
            try {
                await redis.setex(cacheKey, 900, JSON.stringify(result)); // 15 minutes = 900 seconds
                console.log(`[Cache] Cached results for ${niche} with 15min TTL`);
            } catch (error) {
                // Redis not available, continue without caching
                console.warn('Redis not available, skipping cache write');
            }
        }

        // 10. Save to Supabase (optional - don't fail if table doesn't exist)
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
            // If table doesn't exist (PGRST205), log but don't fail
            // This allows the app to work even if migrations haven't been run
            if (analysisError.code === 'PGRST205' || analysisError.message?.includes('not found')) {
                console.warn('Warning: reddit_analyses table not found. Skipping database save. Run migrations to enable persistence.');
                console.warn('Error details:', {
                    code: analysisError.code,
                    message: analysisError.message,
                    niche,
                    total_posts: posts.length,
                    pains_count: pains.length
                });
            } else {
                // For other errors, log but continue - don't fail the entire request
                console.error('Error saving to Supabase (non-critical):', analysisError);
                console.error('Payload was:', {
                    niche,
                    scanned_at: new Date().toISOString(),
                    total_posts: posts.length,
                    pains_count: pains.length
                });
            }
            // Continue without saving to database
            analysisData = null;
        } else {
            analysisData = data;
        }

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

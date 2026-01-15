
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { fetchRedditPosts, getSubredditsForNiche } from '@/lib/reddit';
import { quickFilter, calculateGoldScore } from '@/lib/scoring';
import { batchLLMAnalysis, generateBlueprint } from '@/lib/llm';

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
    try {
        const { niche } = await request.json();

        if (!niche) {
            return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
        }

        // 1. Rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        // In dev, sometimes we might want to bypass strict rate limiting or use a dummy IP
        const rateLimit = await checkRateLimit(ip);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Max 5 scans per hour.' },
                { status: 429 }
            );
        }

        // 2. Check cache
        const cacheKey = `scan:${niche.toLowerCase()}`;
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

        // 3. Fetch Reddit
        const subreddits = getSubredditsForNiche(niche);
        // Fetch from all subreddits in parallel
        const postsResults = await Promise.all(
            subreddits.map(sub => fetchRedditPosts(sub, 'week'))
        );
        const posts = removeDuplicates(postsResults.flat());

        // 4. Quick filter
        const filtered = posts.filter(quickFilter);

        // 5. Score & sort (Initial scoring for prioritization before expensive LLM)
        const scored = filtered
            .map(post => ({
                ...post,
                goldScore: calculateGoldScore(post)
            }))
            .sort((a, b) => b.goldScore - a.goldScore)
            .slice(0, 20);  // Top 20 for LLM analysis

        // 6. LLM batch analysis
        let llmFiltered = [];
        if (scored.length > 0) {
            llmFiltered = await batchLLMAnalysis(scored);
        } else {
            // Fallback if no posts pass filters - maybe try unfiltered top posts?
            // or just return empty result
            console.log(`No posts passed quick filter for ${niche}`);
        }

        // 7. Generate blueprints (top 10 confirmed opportunities)
        const top10 = llmFiltered.slice(0, 10);
        const pains = await Promise.all(
            top10.map(async (post, index) => {
                const blueprint = await generateBlueprint(post);
                // Recalculate score with LLM relevance if we had that data (simplified here)
                return {
                    id: `pain-${index}-${Date.now()}`,
                    title: post.title,
                    selftext: post.selftext || '',
                    subreddit: post.subreddit,
                    goldScore: Math.round(calculateGoldScore(post, 1.2)), // Assume slightly higher relevance if it passed LLM
                    postsCount: 1, // Simplified for now
                    blueprint
                };
            })
        );

        // 8. Cache results
        const result = {
            niche,
            scannedAt: new Date().toISOString(),
            totalPosts: posts.length,
            pains
        };

        // Store in Redis (1 hour expiration)
        await redis.setex(cacheKey, 3600, JSON.stringify(result));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Analyze error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

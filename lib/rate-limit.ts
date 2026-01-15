
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis is optional for rate limiting - if not configured, allow all requests
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

export const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
    })
    : null;

export async function checkRateLimit(identifier: string) {
    // If rate limiting is not configured, allow all requests
    if (!ratelimit) {
        return {
            allowed: true,
            limit: 999,
            remaining: 999,
            reset: Date.now() + 3600000
        };
    }
    
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    return {
        allowed: success,
        limit,
        remaining,
        reset
    };
}

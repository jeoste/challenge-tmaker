
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
});

export async function checkRateLimit(identifier: string) {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    return {
        allowed: success,
        limit,
        remaining,
        reset
    };
}

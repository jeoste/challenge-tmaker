
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis is optional for rate limiting - if not configured, allow all requests
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Rate limiters for different plans
export const ratelimitPremium = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour for premium
    })
    : null;

export const ratelimitFree = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 requests per hour for free plan
    })
    : null;

// Serper API rate limiters (separate from main rate limit)
// Quota: 2500/month, so we limit to 3-5 requests per user
export const serperRateLimitFree = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 Serper requests per hour for free plan
        prefix: 'serper:', // Separate namespace
    })
    : null;

export const serperRateLimitPremium = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 Serper requests per hour for premium
        prefix: 'serper:', // Separate namespace
    })
    : null;

// RapidAPI Reddit rate limiters (VERY strict quotas)
// Two separate subscriptions:
// - reddit3: 100 requests/month (search posts, user data)
// - reddit34: 50 requests/month (subreddit info)
// Use global rate limiting to share quota across all users
// Free: 1 request per user per day, Premium: 2 requests per user per day
export const rapidApiRateLimitFree = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1, '24 h'), // 1 request per day for free plan
        prefix: 'rapidapi:', // Separate namespace
    })
    : null;

export const rapidApiRateLimitPremium = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2, '24 h'), // 2 requests per day for premium
        prefix: 'rapidapi:', // Separate namespace
    })
    : null;

// Global RapidAPI quota trackers (shared across all users)
// Separate trackers for reddit3 (100/month) and reddit34 (50/month)
// Note: Currently using conservative 50/month limit for both to be safe
// TODO: Implement separate quota tracking for reddit3 (100) and reddit34 (50)
export const rapidApiGlobalQuota = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, '30 d'), // Conservative 50 requests per 30 days globally (reddit34 limit)
        prefix: 'rapidapi:global:', // Global namespace
    })
    : null;

export const rapidApiGlobalQuotaReddit3 = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '30 d'), // 100 requests per 30 days for reddit3
        prefix: 'rapidapi:global:reddit3:', // Separate namespace for reddit3
    })
    : null;

/**
 * Check if an IP address is whitelisted for testing
 * Supports both IPv4 and IPv6 addresses
 */
// Helper logic for IP normalization
function normalizeIP(ip: string): string {
    if (!ip) return '';

    // Remove ::ffff: prefix if present (IPv4 mapped to IPv6)
    let normalized = ip.replace(/^::ffff:/, '');

    // Remove brackets for IPv6 (e.g., [2001:db8::1])
    normalized = normalized.replace(/^\[|\]$/g, '');

    // Remove port number if present (only for IPv4 addresses to avoid breaking IPv6)
    // IPv4 format: xxx.xxx.xxx.xxx:port
    const ipv4WithPort = /^(\d+\.\d+\.\d+\.\d+):\d+$/;
    if (ipv4WithPort.test(normalized)) {
        normalized = normalized.split(':')[0];
    }

    // Trim whitespace and convert to lowercase for consistency
    normalized = normalized.trim().toLowerCase();

    return normalized;
}

export function isIPWhitelisted(ip: string): boolean {
    if (!ip || ip === 'anonymous') {
        console.log('[Whitelist] IP is empty or anonymous:', ip);
        return false;
    }

    const whitelistedIPs: string[] = [];

    // Add IPv4 from environment variable
    if (process.env.IPV4_PUBLIC_TESTING) {
        const normalizedIPv4 = normalizeIP(process.env.IPV4_PUBLIC_TESTING);
        whitelistedIPs.push(normalizedIPv4);
        console.log('[Whitelist] Added IPv4 from env:', process.env.IPV4_PUBLIC_TESTING, '-> normalized:', normalizedIPv4);
    } else {
        console.log('[Whitelist] IPV4_PUBLIC_TESTING not set in environment');
    }

    // Add IPv6 from environment variable
    if (process.env.IPV6_PUBLIC_TESTING) {
        const normalizedIPv6 = normalizeIP(process.env.IPV6_PUBLIC_TESTING);
        whitelistedIPs.push(normalizedIPv6);
        console.log('[Whitelist] Added IPv6 from env:', process.env.IPV6_PUBLIC_TESTING, '-> normalized:', normalizedIPv6);
    } else {
        console.log('[Whitelist] IPV6_PUBLIC_TESTING not set in environment');
    }

    const normalizedInputIP = normalizeIP(ip);
    console.log('[Whitelist] Checking IP:', ip, '-> normalized:', normalizedInputIP);
    console.log('[Whitelist] Whitelisted IPs:', whitelistedIPs);

    // Check if IP matches any whitelisted IP
    const isWhitelisted = whitelistedIPs.some(whitelistedIP => normalizedInputIP === whitelistedIP);
    console.log('[Whitelist] Result:', isWhitelisted ? 'MATCH - IP is whitelisted' : 'NO MATCH - IP not whitelisted');

    return isWhitelisted;
}

export async function checkRateLimit(
    identifier: string,
    isWhitelisted: boolean = false,
    userPlan: 'free' | 'premium' = 'free'
) {
    // If IP is whitelisted, bypass rate limiting
    if (isWhitelisted) {
        console.log('[Rate Limit] Bypassing rate limit for whitelisted IP, identifier:', identifier);
        return {
            allowed: true,
            limit: 999,
            remaining: 999,
            reset: Date.now() + 3600000
        };
    }

    // Select the appropriate rate limiter based on user plan
    const ratelimit = userPlan === 'premium' ? ratelimitPremium : ratelimitFree;
    const expectedLimit = userPlan === 'premium' ? 5 : 3;

    // If rate limiting is not configured, allow all requests
    if (!ratelimit) {
        return {
            allowed: true,
            limit: expectedLimit,
            remaining: expectedLimit,
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

/**
 * Check Serper API rate limit (separate from main rate limit)
 * Free: 3 requests/hour, Premium: 5 requests/hour
 */
export async function checkSerperRateLimit(
    identifier: string,
    isWhitelisted: boolean = false,
    userPlan: 'free' | 'premium' = 'free'
) {
    // If IP is whitelisted, bypass rate limiting
    if (isWhitelisted) {
        return {
            allowed: true,
            limit: 999,
            remaining: 999,
            reset: Date.now() + 3600000
        };
    }

    // Select the appropriate Serper rate limiter based on user plan
    const ratelimit = userPlan === 'premium' ? serperRateLimitPremium : serperRateLimitFree;
    const expectedLimit = userPlan === 'premium' ? 5 : 3;

    // If rate limiting is not configured, allow all requests
    if (!ratelimit) {
        return {
            allowed: true,
            limit: expectedLimit,
            remaining: expectedLimit,
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

/**
 * Check RapidAPI Reddit rate limit (VERY strict quotas)
 * Two separate subscriptions: reddit3 (100/month) and reddit34 (50/month)
 * Checks both per-user limit and global quota
 * Free: 1 request/day, Premium: 2 requests/day
 * 
 * @param apiType - 'reddit3' or 'reddit34' to use appropriate quota (default: 'reddit34' for backward compatibility)
 */
export async function checkRapidApiRateLimit(
    identifier: string,
    isWhitelisted: boolean = false,
    userPlan: 'free' | 'premium' = 'free',
    apiType: 'reddit3' | 'reddit34' = 'reddit34'
) {
    // Select appropriate global quota based on API type
    const globalQuota = apiType === 'reddit3' ? rapidApiGlobalQuotaReddit3 : rapidApiGlobalQuota;
    const quotaLimit = apiType === 'reddit3' ? 100 : 50;
    const quotaName = apiType === 'reddit3' ? 'reddit3 (100/month)' : 'reddit34 (50/month)';

    // If IP is whitelisted, still check global quota
    if (isWhitelisted) {
        // Still check global quota even for whitelisted IPs
        if (globalQuota) {
            const globalCheck = await globalQuota.limit('quota');
            if (!globalCheck.success) {
                console.warn(`[RapidAPI] Global quota ${quotaName} exceeded. Blocking request.`);
                return {
                    allowed: false,
                    limit: quotaLimit,
                    remaining: globalCheck.remaining,
                    reset: globalCheck.reset
                };
            }
        }
        return {
            allowed: true,
            limit: 999,
            remaining: 999,
            reset: Date.now() + 86400000 // 24 hours
        };
    }

    // First check global quota (shared across all users)
    if (globalQuota) {
        const globalCheck = await globalQuota.limit('quota');
        if (!globalCheck.success) {
            console.warn(`[RapidAPI] Global quota ${quotaName} exceeded. Blocking request.`);
            return {
                allowed: false,
                limit: quotaLimit,
                remaining: globalCheck.remaining,
                reset: globalCheck.reset
            };
        }
    }

    // Then check per-user limit
    const ratelimit = userPlan === 'premium' ? rapidApiRateLimitPremium : rapidApiRateLimitFree;
    const expectedLimit = userPlan === 'premium' ? 2 : 1;

    // If rate limiting is not configured, still check global quota
    if (!ratelimit) {
        return {
            allowed: true,
            limit: expectedLimit,
            remaining: expectedLimit,
            reset: Date.now() + 86400000 // 24 hours
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

// Gemini API rate limiters (GLOBAL - shared across all users)
// Hybrid strategy: Gemini 2.0 Flash Thinking (blueprints) + Gemini 1.5 Flash (batch filtering)
// Free tier limits: 10 RPM for Flash models, 1000 RPD for Flash models
// We use conservative limits: 5 RPM, 95 RPD to stay safe and avoid quota issues
export const geminiRateLimitPerMinute = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute (conservative limit)
        prefix: 'gemini:rpm:', // Requests per minute namespace
    })
    : null;

export const geminiRateLimitPerDay = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(95, '24 h'), // 95 requests per day (safe margin)
        prefix: 'gemini:rpd:', // Requests per day namespace
    })
    : null;

/**
 * Check Gemini API rate limits (GLOBAL - shared across all users)
 * Limits: 5 RPM, 95 RPD (free tier limits)
 * Returns both RPM and RPD status
 */
export async function checkGeminiRateLimit() {
    // If rate limiting is not configured, allow but log warning
    if (!geminiRateLimitPerMinute || !geminiRateLimitPerDay) {
        console.warn('[Gemini Rate Limit] Redis not configured, allowing request (no rate limiting)');
        return {
            allowed: true,
            rpm: { allowed: true, limit: 5, remaining: 5, reset: Date.now() + 60000 },
            rpd: { allowed: true, limit: 95, remaining: 95, reset: Date.now() + 86400000 }
        };
    }

    // Check both RPM and RPD limits
    const rpmCheck = await geminiRateLimitPerMinute.limit('global');
    const rpdCheck = await geminiRateLimitPerDay.limit('global');

    const allowed = rpmCheck.success && rpdCheck.success;

    if (!allowed) {
        console.warn('[Gemini Rate Limit] BLOCKED:', {
            rpm: { allowed: rpmCheck.success, remaining: rpmCheck.remaining, reset: new Date(rpmCheck.reset).toISOString() },
            rpd: { allowed: rpdCheck.success, remaining: rpdCheck.remaining, reset: new Date(rpdCheck.reset).toISOString() }
        });
    }

    return {
        allowed,
        rpm: {
            allowed: rpmCheck.success,
            limit: 5,
            remaining: rpmCheck.remaining,
            reset: rpmCheck.reset
        },
        rpd: {
            allowed: rpdCheck.success,
            limit: 95,
            remaining: rpdCheck.remaining,
            reset: rpdCheck.reset
        }
    };
}

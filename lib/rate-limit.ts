
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

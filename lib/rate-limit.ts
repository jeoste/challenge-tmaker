
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

/**
 * Check if an IP address is whitelisted for testing
 * Supports both IPv4 and IPv6 addresses
 */
export function isIPWhitelisted(ip: string): boolean {
    if (!ip || ip === 'anonymous') {
        return false;
    }

    const whitelistedIPs: string[] = [];
    
    // Add IPv4 from environment variable
    if (process.env.IPV4_PUBLIC_TESTING) {
        whitelistedIPs.push(process.env.IPV4_PUBLIC_TESTING.trim());
    }
    
    // Add IPv6 from environment variable
    if (process.env.IPV6_PUBLIC_TESTING) {
        whitelistedIPs.push(process.env.IPV6_PUBLIC_TESTING.trim());
    }

    // Check if IP matches any whitelisted IP
    return whitelistedIPs.some(whitelistedIP => {
        // Exact match
        if (ip === whitelistedIP) {
            return true;
        }
        
        // For IPv6, also check without brackets and normalized formats
        const normalizedIP = ip.replace(/^\[|\]$/g, '');
        const normalizedWhitelisted = whitelistedIP.replace(/^\[|\]$/g, '');
        if (normalizedIP === normalizedWhitelisted) {
            return true;
        }
        
        return false;
    });
}

export async function checkRateLimit(identifier: string, isWhitelisted: boolean = false) {
    // If IP is whitelisted, bypass rate limiting
    if (isWhitelisted) {
        return {
            allowed: true,
            limit: 999,
            remaining: 999,
            reset: Date.now() + 3600000
        };
    }

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

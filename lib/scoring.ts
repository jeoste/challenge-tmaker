
import { RedditPost } from './reddit';

export function quickFilter(post: RedditPost): boolean {
    const text = `${post.title} ${post.selftext}`.toLowerCase();

    const businessPatterns = [
        /(need|want|looking for) (a|an) (tool|app|software|saas|solution|platform)/i,
        /(wish|hate|frustrated) (that|when|because) .{20,}/i,
        /(problem|issue|pain) (with|in) .{10,}/i,
        /is there (a|an) (tool|app|way) (to|for)/i,
        /how do i (track|manage|automate|find)/i
    ];

    return businessPatterns.some(pattern => pattern.test(text));
}

export function calculateGoldScore(post: RedditPost, llmRelevance?: number): number {
    const engagement = (post.score * 1.5) + (post.num_comments * 2.5);
    const ageInHours = (Date.now() / 1000 - post.created_utc) / 3600;
    const recency = Math.max(1, 168 - ageInHours); // Bonus if < 7 days

    // Base score
    let score = (engagement * recency) / 10;

    // Bonus for length (more context = better)
    if (post.selftext.length > 100) {
        score *= 1.2;
    }

    // LLM Relevance Multiplier (0.5 to 1.5 based on monetization potential)
    if (llmRelevance !== undefined) {
        score *= llmRelevance;
    }

    // Cap at 100
    return Math.min(100, Math.round(score));
}

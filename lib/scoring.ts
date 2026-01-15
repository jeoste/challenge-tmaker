
import { RedditPost } from './reddit';

// Patterns that indicate a business opportunity
const BUSINESS_PATTERNS = [
    // Direct needs
    /(need|want|looking for|searching for) (a|an|the) (tool|app|software|saas|solution|platform|service|product)/i,
    // Alternatives and replacements
    /(best|good|better) alternative (to|for)/i,
    /looking for (an|a) alternative/i,
    /replace(ment)? (for|with)/i,
    /better than .{5,}/i,
    // Pain points
    /(wish|hate|frustrated|annoyed|tired of) (that|when|because|with) .{15,}/i,
    /(problem|issue|pain|struggle|difficulty) (with|in|using) .{10,}/i,
    // Requests and recommendations
    /(does anyone know|is there|can anyone recommend|suggest|recommend) (a|an) (tool|app|software|solution)/i,
    /(which|what) (tool|app|software|solution) (should|do|can) (i|you) (use|try|recommend)/i,
    // Comparisons
    /(comparing|which is better|should i use|recommendations? for)/i,
    // Specific actions
    /how (do|can) (i|you) (track|manage|automate|find|organize|handle)/i
];

// Patterns that indicate non-business content (to exclude)
const EXCLUDE_PATTERNS = [
    // Technical tutorials/explanations
    /^(how|why|what) (does|is|are|do|did|will)/i,
    /tutorial|guide|explanation|how to (build|create|make|code)/i,
    // Educational content
    /learn|teaching|education|course|lesson/i,
    // Personal stories without business need
    /^(i|we) (just|recently|finally) (built|created|made|launched|released)/i,
    /check out (my|our|this) (project|app|tool|website)/i,
    // Security warnings (like the API key example)
    /(stop|don't|never|warning|security|api key|password|credential)/i,
    // Meta discussions
    /(discussion|thoughts|opinion|what do you think|meta)/i,
    // Job postings
    /(hiring|job|position|career|apply)/i
];

export function quickFilter(post: RedditPost): boolean {
    const text = `${post.title} ${post.selftext}`.toLowerCase();
    
    // First check: exclude non-business content
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(text))) {
        // But allow if it also contains business patterns (might be relevant)
        const hasBusinessPattern = BUSINESS_PATTERNS.some(pattern => pattern.test(text));
        if (!hasBusinessPattern) {
            return false;
        }
    }
    
    // Second check: must match at least one business pattern
    const matchesBusinessPattern = BUSINESS_PATTERNS.some(pattern => pattern.test(text));
    
    // Third check: must have minimum engagement (at least 1 upvote or 1 comment)
    const hasEngagement = (post.score > 0 || post.num_comments > 0);
    
    // Fourth check: must have some content (title + selftext should be meaningful)
    const hasContent = post.title.length > 20 || post.selftext.length > 50;
    
    return matchesBusinessPattern && hasEngagement && hasContent;
}

// Patterns that indicate high business value
const HIGH_VALUE_PATTERNS = [
    /(need|want|looking for|searching for) (a|an|the) (tool|app|software|saas|solution|platform)/i,
    /(best|good|better) alternative (to|for)/i,
    /looking for (an|a) alternative/i,
    /(which|what) (tool|app|software|solution) (should|do|can) (i|you) (use|try|recommend)/i,
    /(does anyone know|is there|can anyone recommend|suggest) (a|an) (tool|app|software|solution)/i
];

// Patterns that indicate low business value (warnings, educational, etc.)
const LOW_VALUE_PATTERNS = [
    /^(stop|don't|never|warning|security|api key|password|credential)/i,
    /(tutorial|guide|explanation|how to (build|create|make|code))/i,
    /(learn|teaching|education|course|lesson)/i,
    /^(i|we) (just|recently|finally) (built|created|made|launched|released)/i,
    /check out (my|our|this) (project|app|tool|website)/i
];

export function calculateGoldScore(post: RedditPost, llmRelevance?: number): number {
    const text = `${post.title} ${post.selftext}`.toLowerCase();
    
    // Check for high-value patterns (indicates clear business opportunity)
    const hasHighValuePattern = HIGH_VALUE_PATTERNS.some(pattern => pattern.test(text));
    
    // Check for low-value patterns (indicates non-business content)
    const hasLowValuePattern = LOW_VALUE_PATTERNS.some(pattern => pattern.test(text));
    
    // Calculate engagement score
    const engagement = (post.score * 1.5) + (post.num_comments * 2.5);
    const ageInHours = (Date.now() / 1000 - post.created_utc) / 3600;
    const recency = Math.max(1, 168 - ageInHours); // Bonus if < 7 days

    // Base score
    let score = (engagement * recency) / 10;

    // Apply pattern-based multipliers
    if (hasHighValuePattern) {
        score *= 1.3; // Boost for clear business opportunity signals
    }
    
    if (hasLowValuePattern && !hasHighValuePattern) {
        score *= 0.3; // Heavy penalty for non-business content
    }

    // Bonus for length (more context = better, but only if relevant)
    if (post.selftext.length > 100 && !hasLowValuePattern) {
        score *= 1.2;
    }

    // LLM Relevance Multiplier (0.5 to 1.5 based on monetization potential)
    // This is the most important filter - LLM has analyzed the content
    if (llmRelevance !== undefined) {
        score *= llmRelevance;
        // If LLM says it's not an opportunity (relevance < 0.7), heavily penalize
        if (llmRelevance < 0.7) {
            score *= 0.2;
        }
    }

    // Ensure minimum engagement threshold for high scores
    // A post with score 100 should have significant engagement
    if (score > 80 && engagement < 10) {
        score *= 0.6; // Penalize high scores with low engagement
    }

    // Cap at 100
    return Math.min(100, Math.round(score));
}

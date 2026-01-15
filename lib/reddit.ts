
const REDDIT_BASE = 'https://www.reddit.com';

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
}

// Multiple query patterns to get diverse results
const QUERY_PATTERNS = [
  // Direct needs and problems
  'I wish OR looking for OR need a tool OR need an app OR need software OR need a solution',
  // Alternatives and replacements
  'best alternative to OR looking for alternative OR replace OR better than OR alternative to',
  // Pain points and frustrations
  'hate when OR frustrated with OR problem with OR issue with OR pain point',
  // Specific requests
  'does anyone know OR is there a tool OR is there an app OR recommend a tool OR suggest a tool',
  // Comparison and evaluation
  'comparing OR which is better OR should I use OR recommend OR suggestions for'
];

export async function fetchRedditPosts(
  subreddit: string,
  timeFilter: 'day' | 'week' | 'month' = 'week'
): Promise<RedditPost[]> {
  // Fetch posts using multiple query patterns to get diverse results
  const allPosts: RedditPost[] = [];
  const seenIds = new Set<string>();

  // Fetch with each pattern and combine results
  for (const query of QUERY_PATTERNS) {
    try {
      const url = `${REDDIT_BASE}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=${timeFilter}&limit=50&restrict_sr=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Unearth/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Subreddit r/${subreddit} not found.`);
          continue; // Skip this pattern, try next
        }
        console.warn(`Reddit API error for pattern "${query}": ${response.status}`);
        continue; // Skip this pattern, try next
      }
      
      const data = await response.json();
      
      if (data.data && data.data.children) {
        for (const child of data.data.children) {
          const postId = child.data.id;
          // Avoid duplicates across different query patterns
          if (!seenIds.has(postId)) {
            seenIds.add(postId);
            allPosts.push({
              id: postId,
              title: child.data.title,
              selftext: child.data.selftext || '',
              score: child.data.score || 0,
              num_comments: child.data.num_comments || 0,
              created_utc: child.data.created_utc,
              subreddit: child.data.subreddit,
              permalink: child.data.permalink
            });
          }
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching ${subreddit} with pattern "${query}":`, error);
      // Continue with next pattern
    }
  }

  // Also fetch top posts from the subreddit (without search query) to get fresh content
  try {
    const topUrl = `${REDDIT_BASE}/r/${subreddit}/top.json?t=${timeFilter}&limit=50`;
    const response = await fetch(topUrl, {
      headers: {
        'User-Agent': 'Unearth/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.children) {
        for (const child of data.data.children) {
          const postId = child.data.id;
          if (!seenIds.has(postId)) {
            seenIds.add(postId);
            allPosts.push({
              id: postId,
              title: child.data.title,
              selftext: child.data.selftext || '',
              score: child.data.score || 0,
              num_comments: child.data.num_comments || 0,
              created_utc: child.data.created_utc,
              subreddit: child.data.subreddit,
              permalink: child.data.permalink
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching top posts from ${subreddit}:`, error);
  }

  console.log(`[Reddit] Fetched ${allPosts.length} unique posts from r/${subreddit} using ${QUERY_PATTERNS.length} query patterns`);
  return allPosts;
}

export function getSubredditsForNiche(niche: string): string[] {
    const mapping: Record<string, string[]> = {
        'saas': ['SaaS', 'microsaas', 'startups', 'entrepreneur'],
        'crm': ['salesforce', 'sales', 'CRM', 'SaaS'],
        'analytics': ['analytics', 'dataisbeautiful', 'BusinessIntelligence', 'SaaS'],
        'automation': ['automation', 'zapier', 'n8n', 'SaaS'],
        'devtools': ['webdev', 'programming', 'SideProject', 'reactjs'],
        // Keep old mappings for backward compatibility
        'recruitment': ['recruitinghell', 'jobs', 'careerguidance', 'humanresources'],
        'recrutement': ['recruitinghell', 'jobs', 'careerguidance', 'humanresources'],
        'notion': ['Notion', 'productivity', 'selfhosted'],
        'fitness': ['fitness', 'bodyweightfitness', 'nutrition', 'personaltraining']
    };
    
    // Normalize niche to lowercase for lookup
    const normalizedNiche = niche.toLowerCase().trim();
    
    // Return mapped subreddits or fallback
    return mapping[normalizedNiche] || [normalizedNiche.replace(/\s+/g, ''), 'Entrepreneur', 'SaaS']; 
}

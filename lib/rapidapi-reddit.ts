/**
 * RapidAPI Reddit integration
 * Very limited quota: 50 requests/month
 * Use sparingly and intelligently - only for high-value operations
 * 
 * APIs used:
 * - reddit3: https://rapidapi.com/socialminer/api/reddit3 (search posts)
 * - reddit34: https://rapidapi.com/socialminer/api/reddit34 (subreddit info)
 */

export interface SubredditInfo {
  name: string;
  displayName: string;
  subscribers?: number;
  activeUsers?: number;
  description?: string;
  publicDescription?: string;
  createdUtc?: number;
  over18?: boolean;
  subredditType?: string;
}

export interface RapidApiRedditPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  url?: string;
  author?: string;
}

/**
 * Search Reddit posts using RapidAPI reddit3
 * Use this sparingly - only 50 requests/month available
 * 
 * @param search - Search query
 * @param subreddit - Subreddit to search in
 * @param timeFilter - Time filter (day, week, month, year, all)
 * @param sortType - Sort type (relevance, hot, top, new, comments)
 * @returns Array of Reddit posts or empty array if error
 */
export async function searchRedditPosts(
  search: string,
  subreddit: string,
  timeFilter: 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
  sortType: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance'
): Promise<RapidApiRedditPost[]> {
  const apiKey = process.env.RAPID_API_KEY;
  
  if (!apiKey) {
    console.warn('[RapidAPI] RAPID_API_KEY not configured. Skipping RapidAPI search.');
    return [];
  }

  try {
    const url = new URL('https://reddit3.p.rapidapi.com/v1/reddit/search');
    url.searchParams.set('search', search);
    url.searchParams.set('subreddit', subreddit);
    url.searchParams.set('filter', 'posts');
    url.searchParams.set('timeFilter', timeFilter);
    url.searchParams.set('sortType', sortType);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'reddit3.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });

    if (!response.ok) {
      // Check for quota/rate limit errors
      if (response.status === 429 || response.status === 402) {
        console.warn('[RapidAPI] Quota exceeded or payment required. Skipping RapidAPI search.');
        return [];
      }
      
      const errorText = await response.text();
      console.error(`[RapidAPI] Search API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    
    // Parse the response (structure may vary)
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((post: any) => ({
        id: post.id || post.name || '',
        title: post.title || '',
        selftext: post.selftext || post.self_text || '',
        score: post.score || 0,
        num_comments: post.num_comments || post.numComments || 0,
        created_utc: post.created_utc || post.created || 0,
        subreddit: post.subreddit || subreddit,
        permalink: post.permalink || post.url || '',
        url: post.url,
        author: post.author,
      }));
    }

    return [];
  } catch (error) {
    console.error('[RapidAPI] Error searching Reddit posts:', error);
    return [];
  }
}

/**
 * Get subreddit information from RapidAPI reddit34
 * Use this sparingly - only 50 requests/month available
 * 
 * @param subreddit - Subreddit name (without r/)
 * @returns Subreddit information or null if error/quota exceeded
 */
export async function getSubredditInfo(subreddit: string): Promise<SubredditInfo | null> {
  const apiKey = process.env.RAPID_API_KEY;
  
  if (!apiKey) {
    console.warn('[RapidAPI] RAPID_API_KEY not configured. Skipping RapidAPI call.');
    return null;
  }

  try {
    const response = await fetch(
      `https://reddit34.p.rapidapi.com/getSubredditInfo?subreddit=${encodeURIComponent(subreddit)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'reddit34.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      // Check for quota/rate limit errors
      if (response.status === 429 || response.status === 402) {
        console.warn('[RapidAPI] Quota exceeded or payment required. Skipping RapidAPI call.');
        return null;
      }
      
      const errorText = await response.text();
      console.error(`[RapidAPI] API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    // Parse the response (structure may vary)
    if (data && data.data) {
      const subredditData = data.data;
      return {
        name: subredditData.name || subreddit,
        displayName: subredditData.display_name || subredditData.title || subreddit,
        subscribers: subredditData.subscribers || subredditData.subscriber_count,
        activeUsers: subredditData.active_user_count,
        description: subredditData.description || subredditData.public_description,
        publicDescription: subredditData.public_description,
        createdUtc: subredditData.created_utc,
        over18: subredditData.over18,
        subredditType: subredditData.subreddit_type,
      };
    }

    return null;
  } catch (error) {
    console.error('[RapidAPI] Error fetching subreddit info:', error);
    // Don't throw - return null to allow fallback
    return null;
  }
}

/**
 * Get subreddit info for multiple subreddits (batch)
 * Use this VERY sparingly - consumes multiple quota units
 * 
 * @param subreddits - Array of subreddit names
 * @returns Map of subreddit name to info
 */
export async function getMultipleSubredditInfo(
  subreddits: string[]
): Promise<Map<string, SubredditInfo>> {
  const results = new Map<string, SubredditInfo>();
  
  // Limit to top 3 subreddits to conserve quota
  const limitedSubreddits = subreddits.slice(0, 3);
  
  for (const subreddit of limitedSubreddits) {
    const info = await getSubredditInfo(subreddit);
    if (info) {
      results.set(subreddit, info);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Convert RapidAPI reddit3 post to standard RedditPost format
 */
export function rapidApiPostToRedditPost(post: RapidApiRedditPost): import('./reddit').RedditPost {
  return {
    id: post.id,
    title: post.title,
    selftext: post.selftext,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    subreddit: post.subreddit,
    permalink: post.permalink || post.url || '',
  };
}

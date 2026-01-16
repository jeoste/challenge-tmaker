/**
 * RapidAPI Reddit integration
 * Two separate subscriptions with different quotas:
 * - reddit3: 100 requests/month (search posts, user data)
 * - reddit34: 50 requests/month (subreddit info)
 * 
 * Both use the same API key but have separate quotas
 * Use sparingly and intelligently - only for high-value operations
 * 
 * APIs used:
 * - reddit3: https://rapidapi.com/socialminer/api/reddit3 (search posts, user data) - 100/month
 * - reddit34: https://rapidapi.com/socialminer/api/reddit34 (subreddit info) - 50/month
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

export interface RedditUserComment {
  id: string;
  body: string;
  score: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  link_title?: string;
  link_id?: string;
  parent_id?: string;
}

export interface RedditUserData {
  username: string;
  comments?: RedditUserComment[];
  posts?: RapidApiRedditPost[];
  total_karma?: number;
  comment_karma?: number;
  link_karma?: number;
  created_utc?: number;
}

/**
 * Search Reddit posts using RapidAPI reddit3
 * Quota: 100 requests/month (separate from reddit34)
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
    interface RapidApiPost {
      id?: string;
      name?: string;
      title?: string;
      selftext?: string;
      self_text?: string;
      score?: number;
      num_comments?: number;
      numComments?: number;
      created_utc?: number;
      created?: number;
      subreddit?: string;
      permalink?: string;
      url?: string;
      author?: string;
    }
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((post: RapidApiPost) => ({
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
 * Get Reddit user data (comments, posts) using RapidAPI reddit3
 * Quota: 100 requests/month (separate from reddit34, shares quota with searchRedditPosts)
 * 
 * @param username - Reddit username
 * @param filter - Filter type: 'comments', 'posts', or 'all' (default: 'comments')
 * @param sortType - Sort type: 'new', 'top', 'hot' (default: 'new')
 * @returns User data with comments/posts or null if error/quota exceeded
 */
export async function getRedditUserData(
  username: string,
  filter: 'comments' | 'posts' | 'all' = 'comments',
  sortType: 'new' | 'top' | 'hot' = 'new'
): Promise<RedditUserData | null> {
  const apiKey = process.env.RAPID_API_KEY;
  
  if (!apiKey) {
    console.warn('[RapidAPI] RAPID_API_KEY not configured. Skipping RapidAPI user data call.');
    return null;
  }

  try {
    const url = new URL('https://reddit3.p.rapidapi.com/v1/reddit/user-data');
    url.searchParams.set('username', username);
    url.searchParams.set('filter', filter);
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
        console.warn('[RapidAPI] Quota exceeded or payment required. Skipping RapidAPI user data call.');
        return null;
      }
      
      const errorText = await response.text();
      console.error(`[RapidAPI] User data API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    // Parse the response (structure may vary)
    if (data && data.data) {
      const userData = data.data;
      const result: RedditUserData = {
        username: userData.name || username,
        total_karma: userData.total_karma,
        comment_karma: userData.comment_karma,
        link_karma: userData.link_karma,
        created_utc: userData.created_utc,
      };

      // Parse comments if available
      interface RapidApiComment {
        id?: string;
        name?: string;
        body?: string;
        body_text?: string;
        score?: number;
        created_utc?: number;
        created?: number;
        subreddit?: string;
        permalink?: string;
        link_title?: string;
        link_id?: string;
        parent_id?: string;
      }
      if (userData.comments && Array.isArray(userData.comments)) {
        result.comments = userData.comments.map((comment: RapidApiComment) => ({
          id: comment.id || comment.name || '',
          body: comment.body || comment.body_text || '',
          score: comment.score || 0,
          created_utc: comment.created_utc || comment.created || 0,
          subreddit: comment.subreddit || '',
          permalink: comment.permalink || '',
          link_title: comment.link_title,
          link_id: comment.link_id,
          parent_id: comment.parent_id,
        }));
      }

      // Parse posts if available
      interface RapidApiUserPost {
        id?: string;
        name?: string;
        title?: string;
        selftext?: string;
        self_text?: string;
        score?: number;
        num_comments?: number;
        numComments?: number;
        created_utc?: number;
        created?: number;
        subreddit?: string;
        permalink?: string;
        url?: string;
      }
      if (userData.posts && Array.isArray(userData.posts)) {
        result.posts = userData.posts.map((post: RapidApiUserPost) => ({
          id: post.id || post.name || '',
          title: post.title || '',
          selftext: post.selftext || post.self_text || '',
          score: post.score || 0,
          num_comments: post.num_comments || post.numComments || 0,
          created_utc: post.created_utc || post.created || 0,
          subreddit: post.subreddit || '',
          permalink: post.permalink || post.url || '',
          url: post.url,
          author: post.author || username,
        }));
      }

      return result;
    }

    return null;
  } catch (error) {
    console.error('[RapidAPI] Error fetching Reddit user data:', error);
    return null;
  }
}

/**
 * Get subreddit information from RapidAPI reddit34
 * Quota: 50 requests/month (separate from reddit3)
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

/**
 * Convert Reddit user comment to RedditPost format (for analysis)
 * Uses the comment body as selftext and link_title as title
 */
export function userCommentToRedditPost(comment: RedditUserComment): import('./reddit').RedditPost {
  return {
    id: comment.id,
    title: comment.link_title || `Comment in r/${comment.subreddit}`,
    selftext: comment.body,
    score: comment.score,
    num_comments: 0, // Comments don't have nested comments in this context
    created_utc: comment.created_utc,
    subreddit: comment.subreddit,
    permalink: comment.permalink || '',
  };
}

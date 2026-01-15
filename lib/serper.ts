/**
 * Serper API integration for enhanced Reddit data scraping
 * Serper allows searching Google for Reddit content, providing more comprehensive results
 * 
 * Rate limit: 3-5 requests per user (quota: 2500/month)
 * See: https://serper.dev/
 */

export interface SerperRedditResult {
  title: string;
  link: string;
  snippet: string;
  redditUrl?: string;
  subreddit?: string;
}

export interface SerperSearchResponse {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    redditUrl?: string;
  }>;
}

/**
 * Search Reddit posts via Google using Serper API
 * This complements direct Reddit API calls by finding more content
 * 
 * @param niche - The niche to search for
 * @param subreddit - Optional subreddit to restrict search
 * @returns Array of Reddit results from Google search
 */
export async function searchRedditViaSerper(
  niche: string,
  subreddit?: string
): Promise<SerperRedditResult[]> {
  const apiKey = process.env.SERPER_DEV_API_KEY;
  
  if (!apiKey) {
    console.warn('[Serper] SERPER_DEV_API_KEY not configured. Skipping Serper search.');
    return [];
  }

  try {
    // Build search query - focus on Reddit content
    const siteFilter = subreddit ? `site:reddit.com/r/${subreddit}` : 'site:reddit.com';
    const query = `${niche} ${siteFilter} (need OR looking for OR want OR problem OR issue OR alternative)`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 20, // Get up to 20 results
        gl: 'us', // Country code
        hl: 'en', // Language
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Serper] API error: ${response.status} - ${errorText}`);
      
      // If quota exceeded, return empty array
      if (response.status === 429 || response.status === 402) {
        console.warn('[Serper] Quota exceeded or payment required. Skipping Serper search.');
        return [];
      }
      
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data: SerperSearchResponse = await response.json();
    
    // Filter and format results
    const results: SerperRedditResult[] = [];
    
    if (data.organic) {
      for (const item of data.organic) {
        // Extract subreddit from URL if possible
        const redditMatch = item.link.match(/reddit\.com\/r\/([^/]+)/);
        const extractedSubreddit = redditMatch ? redditMatch[1] : undefined;
        
        // Only include Reddit links
        if (item.link.includes('reddit.com')) {
          results.push({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            redditUrl: item.link,
            subreddit: extractedSubreddit,
          });
        }
      }
    }

    console.log(`[Serper] Found ${results.length} Reddit results for niche "${niche}"${subreddit ? ` in r/${subreddit}` : ''}`);
    return results;
  } catch (error) {
    console.error('[Serper] Error searching Reddit via Serper:', error);
    // Don't throw - return empty array to allow fallback to direct Reddit API
    return [];
  }
}

/**
 * Convert Serper results to RedditPost format (partial)
 * Note: Serper doesn't provide all Reddit metadata, so we'll need to fetch full post data
 */
export function serperResultToRedditPost(result: SerperRedditResult): import('./reddit').RedditPost {
  // Extract post ID from Reddit URL if possible
  // Format: https://www.reddit.com/r/subreddit/comments/POST_ID/title/
  const postIdMatch = result.redditUrl?.match(/\/comments\/([^/]+)/);
  const postId = postIdMatch ? postIdMatch[1] : result.link.split('/').pop() || `serper-${Date.now()}`;
  
  return {
    id: postId,
    title: result.title,
    selftext: result.snippet, // Use snippet as selftext
    subreddit: result.subreddit || 'unknown',
    permalink: result.redditUrl || result.link,
    // These will need to be fetched from Reddit API if needed
    // Default values to allow processing
    score: 0,
    num_comments: 0,
    created_utc: Math.floor(Date.now() / 1000) - 7 * 24 * 3600, // Default to 7 days ago
  };
}

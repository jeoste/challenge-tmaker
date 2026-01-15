
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

export async function fetchRedditPosts(
  subreddit: string,
  timeFilter: 'day' | 'week' | 'month' = 'week'
): Promise<RedditPost[]> {
  // Query for business ideas/pain points
  const query = 'I wish OR looking for OR need a tool OR hate when OR problem with';
  const url = `${REDDIT_BASE}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=${timeFilter}&limit=100&restrict_sr=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditGoldmine/1.0'
      }
    });
    
    if (!response.ok) {
        // Handle 404 (subreddit not found) or other errors gracefully
        if (response.status === 404) {
            console.warn(`Subreddit r/${subreddit} not found.`);
            return [];
        }
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.children) {
        return [];
    }

    return data.data.children.map((child: any) => ({
      id: child.data.id,
      title: child.data.title,
      selftext: child.data.selftext || '',
      score: child.data.score || 0,
      num_comments: child.data.num_comments || 0,
      created_utc: child.data.created_utc,
      subreddit: child.data.subreddit,
      permalink: child.data.permalink
    }));
  } catch (error) {
    console.error(`Error fetching ${subreddit}:`, error);
    return [];
  }
}

export function getSubredditsForNiche(niche: string): string[] {
  const mapping: Record<string, string[]> = {
    'recrutement': ['recruitinghell', 'jobs', 'careerguidance', 'humanresources'],
    'notion': ['Notion', 'productivity', 'selfhosted'],
    'fitness': ['fitness', 'bodyweightfitness', 'nutrition', 'personaltraining'],
    'saas': ['SaaS', 'microsaas', 'startups', 'entrepreneur'],
    'devtools': ['webdev', 'programming', 'SideProject', 'reactjs']
  };
  
  // Default fallback if niche isn't pre-mapped: try to use the niche itself as a subreddit + 'all' isn't quite right for a specific niche scan, 
  // maybe just return the niche itself as a subreddit + related generic ones?
  // For now, let's treat the niche key as a generic search term or direct subreddit if applicable, 
  // but strictly following PRD fallback:
  return mapping[niche.toLowerCase()] || [niche.replace(/\s+/g, ''), 'Entrepreneur', 'SaaS']; 
}

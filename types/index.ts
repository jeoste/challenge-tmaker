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

export interface Blueprint {
  problem: string;
  solutionName: string;
  solutionPitch: string;
  marketSize: 'Small' | 'Medium' | 'Large';
  firstChannel: string;
  mrrEstimate: string;
  techStack: string;
}

export interface PainPoint {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  goldScore: number;
  postsCount: number;
  blueprint: Blueprint;
}

export interface AnalyzeResponse {
  id?: string;
  niche: string;
  scannedAt: string;
  totalPosts: number;
  pains: PainPoint[];
}

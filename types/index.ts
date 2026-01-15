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
  whyPainPoint?: string; // Why this is a validated pain point
  solutionName: string;
  solutionPitch: string;
  howItSolves?: string; // How the solution specifically solves the problem
  marketSize: 'Small' | 'Medium' | 'Large';
  firstChannel: string;
  mrrEstimate: string;
  techStack: string;
  difficulty?: number; // 1-5, optional (can be calculated if not provided)
  keyFeatures?: string[]; // Optional: key features of the solution
  targetAudience?: string; // Optional: target audience description
  pricingModel?: string; // Optional: suggested pricing model
  roadmap?: {
    phase1: {
      name: string;
      features: string[];
      timeline: string;
    };
    phase2?: {
      name: string;
      features: string[];
      timeline: string;
    };
  };
}

export interface PainPoint {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  goldScore: number;
  postsCount: number;
  permalink?: string; // Reddit post permalink
  blueprint: Blueprint;
}

export interface AnalyzeResponse {
  id?: string;
  niche: string;
  scannedAt: string;
  totalPosts: number;
  pains: PainPoint[];
}

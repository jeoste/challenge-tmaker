
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { RedditPost } from './reddit';
import { calculateGoldScore } from './scoring';

export interface LLMAnalysis {
    isOpportunity: boolean;
    reason: string;
    intensity: 'high' | 'medium' | 'low';
}

export async function batchLLMAnalysis(
    posts: RedditPost[]
): Promise<Array<RedditPost & { isOpportunity: boolean }>> {
    const postsList = posts.map((p, i) => `${i}. "${p.title}"`).join('\n');
    const prompt = `Analyse ces posts Reddit et identifie ceux qui sont de VRAIES opportunités business (pas juste des plaintes).

Posts:
${postsList}

Réponds en JSON:
[
  {"index": 0, "isOpportunity": true, "intensity": "high"},
  {"index": 1, "isOpportunity": false, "reason": "..."},
  ...
]`;

    try {
        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            prompt,
            temperature: 0.3,
        });

        // Clean up potentially messy markdown code block if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const analysis = JSON.parse(jsonString) as Array<{
            index: number;
            isOpportunity: boolean;
            intensity?: string;
        }>;

        return posts
            .map((post, i) => ({
                ...post,
                isOpportunity: analysis.find(a => a.index === i)?.isOpportunity ?? false
            }))
            .filter(p => p.isOpportunity);
    } catch (error) {
        console.error('LLM batch analysis error:', error);
        // Fallback: return all posts if LLM fails, don't block the app
        return posts.map(p => ({ ...p, isOpportunity: true }));
    }
}

export async function generateBlueprint(post: RedditPost) {
    const prompt = `Tu es un expert en micro-SaaS. Transforme ce pain point Reddit en blueprint actionnable.

PAIN POINT: "${post.title}"
CONTEXTE: "${post.selftext.substring(0, 500)}"
SCORE: ${calculateGoldScore(post)}/100

Génère un JSON avec:
{
  "problem": "1 ligne claire du problème",
  "solutionName": "Nom du SaaS suggéré (créatif, mémorable)",
  "solutionPitch": "2-3 lignes expliquant la solution",
  "marketSize": "Small|Medium|Large",
  "firstChannel": "Premier canal d'acquisition (ex: Product Hunt, Reddit ads)",
  "mrrEstimate": "Estimation MRR (ex: $2k-$5k)",
  "techStack": "Stack suggérée (ex: Next.js + Supabase)"
}

Réponds UNIQUEMENT en JSON, pas de markdown.`;

    try {
        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            prompt,
            temperature: 0.7,
        });

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Blueprint generation error:', error);
        return {
            problem: post.title,
            solutionName: 'Solution à développer',
            solutionPitch: 'Analyse le problème et développe une solution.',
            marketSize: 'Medium',
            firstChannel: 'Reddit',
            mrrEstimate: '$2k-$5k',
            techStack: 'Next.js + Supabase'
        };
    }
}

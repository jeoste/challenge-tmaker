
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { RedditPost } from './reddit';
import { calculateGoldScore } from './scoring';

// Get Gemini API key from environment
const getGeminiModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return google('gemini-1.5-flash', { apiKey });
};

export interface LLMAnalysis {
    isOpportunity: boolean;
    reason: string;
    intensity: 'high' | 'medium' | 'low';
}

export async function batchLLMAnalysis(
    posts: RedditPost[]
): Promise<Array<RedditPost & { isOpportunity: boolean; relevanceScore: number }>> {
    const postsList = posts.map((p, i) => `${i}. "${p.title}" - ${p.selftext.substring(0, 200)}`).join('\n');
    const prompt = `Analyse ces posts Reddit et identifie ceux qui sont de VRAIES opportunités business (pas juste des plaintes).

Pour chaque post, évalue sa monétisabilité avec un relevanceScore entre 0.5 et 1.5:
- 1.5 = Problème très monétisable, demande claire et urgente
- 1.0 = Problème valide mais générique ou déjà partiellement résolu
- 0.5 = Problème peu monétisable ou déjà résolu par des solutions existantes

Posts:
${postsList}

Réponds en JSON:
[
  {"index": 0, "isOpportunity": true, "relevanceScore": 1.5, "intensity": "high"},
  {"index": 1, "isOpportunity": false, "relevanceScore": 0.5, "reason": "..."},
  ...
]`;

    try {
        const { text } = await generateText({
            model: getGeminiModel(),
            prompt,
            temperature: 0.3,
        });

        // Clean up potentially messy markdown code block if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const analysis = JSON.parse(jsonString) as Array<{
            index: number;
            isOpportunity: boolean;
            relevanceScore?: number;
            intensity?: string;
        }>;

        return posts
            .map((post, i) => {
                const analysisItem = analysis.find(a => a.index === i);
                return {
                    ...post,
                    isOpportunity: analysisItem?.isOpportunity ?? false,
                    relevanceScore: analysisItem?.relevanceScore ?? 1.0
                };
            })
            .filter(p => p.isOpportunity);
    } catch (error) {
        console.error('LLM batch analysis error:', error);
        // Fallback: return all posts if LLM fails, don't block the app
        return posts.map(p => ({ ...p, isOpportunity: true, relevanceScore: 1.0 }));
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
            model: getGeminiModel(),
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

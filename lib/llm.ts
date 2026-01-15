
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { RedditPost } from './reddit';
import { calculateGoldScore } from './scoring';

// Get Gemini API key from environment
// The @ai-sdk/google package looks for GOOGLE_GENERATIVE_AI_API_KEY by default
// but we also support GEMINI_API_KEY for backward compatibility
const getGeminiModel = (usePro: boolean = false) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Don't throw, return a model that will fail gracefully
        // This allows the app to continue even if API key is missing
        console.warn('Warning: GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set. LLM features will not work.');
        // Return model with empty key - it will fail at call time but won't crash the app startup
        return google(usePro ? 'gemini-1.5-pro' : 'gemini-1.5-flash', { apiKey: '' });
    }
    // Use Pro for better quality analysis and blueprint generation
    return google(usePro ? 'gemini-1.5-pro' : 'gemini-1.5-flash', { apiKey });
};

export interface LLMAnalysis {
    isOpportunity: boolean;
    reason: string;
    intensity: 'high' | 'medium' | 'low';
}

export async function batchLLMAnalysis(
    posts: RedditPost[]
): Promise<Array<RedditPost & { isOpportunity: boolean; relevanceScore: number }>> {
    // Include engagement metrics in the prompt to help prioritize viral posts
    const postsList = posts.map((p, i) => 
        `${i}. "${p.title}" (${p.score} upvotes, ${p.num_comments} comments, r/${p.subreddit})\n   Contexte: ${p.selftext.substring(0, 300)}`
    ).join('\n\n');
    
    const prompt = `Tu es un expert en identification d'opportunités SaaS. Analyse ces posts Reddit et identifie ceux qui représentent des opportunités business monétisables.

IMPORTANT - PRIORISATION :
1. PRIORISE les posts VIRAUX avec beaucoup de likes (score élevé) et commentaires (engagement élevé)
2. PRIORISE les posts qui génèrent de la DISCUSSION (beaucoup de commentaires = besoin validé)
3. DIVERSIFIE les résultats entre différents subreddits (ne pas tout prendre d'un seul subreddit)
4. Tu DOIS identifier AU MOINS 3 opportunités valides parmi ces posts

CRITÈRES pour une opportunité valide :
✅ L'utilisateur exprime un BESOIN ou un PROBLÈME qui peut être résolu par un SaaS
✅ Il y a une DEMANDE pour un outil/solution (ex: "looking for", "need a tool", "best alternative to", "wish there was")
✅ Le post génère de l'ENGAGEMENT (likes/comments = validation du besoin)
✅ Il y a un POTENTIEL de marché (même si le problème est partiellement résolu)
✅ Le post exprime une FRUSTRATION ou un BESOIN récurrent

ACCEPTE aussi :
- Posts avec beaucoup d'engagement même si la demande n'est pas explicite (les commentaires peuvent révéler le besoin)
- Posts qui comparent des solutions existantes (besoin d'alternative)
- Posts qui décrivent un problème récurrent (opportunité de SaaS)
- Posts avec des plaintes légitimes sur des outils existants (opportunité d'amélioration)

❌ REJETER SEULEMENT si :
- C'est clairement un avertissement de sécurité sans contexte business
- C'est uniquement un tutoriel technique sans demande
- C'est une annonce de projet/lancement sans contexte de besoin
- Le post a 0 engagement (pas de likes ni commentaires)

Pour chaque post, évalue avec un relevanceScore entre 0.7 et 1.5:
- 1.5 = Post viral (100+ upvotes ou 50+ comments) avec demande claire de solution SaaS
- 1.3 = Post avec bon engagement (20+ upvotes ou 10+ comments) et besoin identifié
- 1.1 = Post avec engagement modéré et problème valide
- 0.9 = Post avec peu d'engagement mais problème intéressant
- 0.7 = Post marginal mais avec potentiel
- 0.5 = Pas une opportunité (rejeter seulement si vraiment pas pertinent)

IMPORTANT : Tu DOIS identifier au moins 3 opportunités. Si tu ne trouves pas 3 posts évidents, choisis les 3 meilleurs même s'ils ne sont pas parfaits.

Posts:
${postsList}

Réponds en JSON strict (uniquement le tableau, pas de texte avant/après):
[
  {"index": 0, "isOpportunity": true, "relevanceScore": 1.5, "intensity": "high", "reason": "Post viral avec demande claire"},
  {"index": 1, "isOpportunity": true, "relevanceScore": 1.2, "reason": "Bon engagement et besoin identifié"},
  ...
]`;

    try {
        const { text } = await generateText({
            model: getGeminiModel(true), // Use Pro for better filtering
            prompt,
            temperature: 0.2, // Lower temperature for more consistent filtering
        });

        // Clean up JSON string - remove markdown code blocks and whitespace
        let jsonString = text.trim();
        jsonString = jsonString.replace(/```json/gi, '');
        jsonString = jsonString.replace(/```/g, '');
        jsonString = jsonString.trim();
        
        // Try to extract JSON array if wrapped in other text
        const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        const analysis = JSON.parse(jsonString) as Array<{
            index: number;
            isOpportunity: boolean;
            relevanceScore?: number;
            intensity?: string;
        }>;
        
        // Validate analysis array
        if (!Array.isArray(analysis)) {
            throw new Error('LLM returned invalid format: expected array');
        }

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
    } catch (error: any) {
        // Check if it's an API key error
        if (error?.message?.includes('API key') || error?.message?.includes('LoadAPIKeyError')) {
            console.warn('LLM API key missing or invalid. Using fallback: all posts will be marked as opportunities.');
            console.warn('To enable LLM filtering, set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.');
        } else {
            console.error('LLM batch analysis error:', error);
        }
        // Fallback: return all posts if LLM fails, don't block the app
        return posts.map(p => ({ ...p, isOpportunity: true, relevanceScore: 1.0 }));
    }
}

export async function generateBlueprint(post: RedditPost) {
    const prompt = `Tu es un expert en micro-SaaS et entrepreneur. Transforme ce pain point Reddit en blueprint actionnable et détaillé.

PAIN POINT: "${post.title}"
CONTEXTE COMPLET: "${post.selftext.substring(0, 800)}"
SCORE: ${calculateGoldScore(post)}/100
SUBREDDIT: r/${post.subreddit}

Analyse en profondeur et génère un JSON détaillé avec:
{
  "problem": "Description claire et concise du problème (1-2 phrases)",
  "solutionName": "Nom créatif et mémorable du SaaS (ex: 'ResumeTracker', 'APIKeyGuard')",
  "solutionPitch": "Description détaillée de la solution (3-4 lignes). Explique COMMENT le SaaS résout le problème, les fonctionnalités clés, et la valeur apportée.",
  "marketSize": "Small|Medium|Large",
  "firstChannel": "Canal d'acquisition spécifique et actionnable (ex: 'Reddit ads sur r/recruitinghell', 'Post sur Product Hunt', 'Partnership avec r/webdev')",
  "mrrEstimate": "Estimation réaliste basée sur le marché (ex: '$1k-$3k MRR', '$5k-$10k MRR')",
  "techStack": "Stack technique concrète et réaliste (ex: 'Next.js 15 + Supabase + Stripe + Resend', 'React + Firebase + OpenAI API')",
  "difficulty": 3,
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "targetAudience": "Description de la cible (ex: 'Développeurs qui utilisent plusieurs APIs', 'Recruteurs tech')",
  "pricingModel": "Modèle de pricing suggéré (ex: 'Freemium avec $9/mois premium', 'One-time $49')"
}

IMPORTANT:
- solutionPitch doit être DÉTAILLÉ et ACTIONNABLE, pas générique
- keyFeatures doit lister 3-5 fonctionnalités concrètes
- targetAudience doit être spécifique
- pricingModel doit être réaliste pour le marché
- difficulty: 1-2 = Facile, 3 = Moyen, 4-5 = Difficile

Réponds UNIQUEMENT en JSON valide, pas de markdown, pas de texte avant ou après.`;

    try {
        const { text } = await generateText({
            model: getGeminiModel(true), // Use Pro for better blueprint generation
            prompt,
            temperature: 0.6, // Balanced creativity and consistency
        });

        // Clean up JSON string - remove markdown code blocks and whitespace
        let jsonString = text.trim();
        jsonString = jsonString.replace(/```json/gi, '');
        jsonString = jsonString.replace(/```/g, '');
        jsonString = jsonString.trim();
        
        // Try to extract JSON if wrapped in other text
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        const blueprint = JSON.parse(jsonString);
        
        // Validate and normalize blueprint
        return {
            problem: blueprint.problem || post.title,
            solutionName: blueprint.solutionName || 'Solution à développer',
            solutionPitch: blueprint.solutionPitch || 'Analyse le problème et développe une solution.',
            marketSize: (blueprint.marketSize === 'Small' || blueprint.marketSize === 'Medium' || blueprint.marketSize === 'Large') 
                ? blueprint.marketSize 
                : 'Medium',
            firstChannel: blueprint.firstChannel || 'Reddit',
            mrrEstimate: blueprint.mrrEstimate || '$2k-$5k',
            techStack: blueprint.techStack || 'Next.js + Supabase',
            difficulty: typeof blueprint.difficulty === 'number' 
                ? Math.max(1, Math.min(5, Math.round(blueprint.difficulty)))
                : undefined, // Will be calculated in PainPointCard if not provided
            // Optional new fields
            keyFeatures: Array.isArray(blueprint.keyFeatures) ? blueprint.keyFeatures : undefined,
            targetAudience: blueprint.targetAudience || undefined,
            pricingModel: blueprint.pricingModel || undefined
        };
    } catch (error: any) {
        // Check if it's an API key error
        if (error?.message?.includes('API key') || error?.message?.includes('LoadAPIKeyError')) {
            console.warn('LLM API key missing or invalid. Using fallback blueprint.');
            console.warn('To enable LLM blueprint generation, set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.');
        } else {
            console.error('Blueprint generation error:', error);
        }
        // Return fallback blueprint
        return {
            problem: post.title,
            solutionName: 'Solution à développer',
            solutionPitch: 'Analyse le problème et développe une solution.',
            marketSize: 'Medium' as const,
            firstChannel: 'Reddit',
            mrrEstimate: '$2k-$5k',
            techStack: 'Next.js + Supabase',
            // difficulty will be calculated in PainPointCard
        };
    }
}

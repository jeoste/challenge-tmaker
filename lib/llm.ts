
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { RedditPost } from './reddit';
import { calculateGoldScore } from './scoring';

// Get Gemini API key from environment
const getGeminiModel = (usePro: boolean = false) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
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
    const postsList = posts.map((p, i) => `${i}. "${p.title}"\n   Contexte: ${p.selftext.substring(0, 300)}`).join('\n\n');
    const prompt = `Tu es un expert en identification d'opportunités SaaS. Analyse ces posts Reddit et identifie UNIQUEMENT ceux qui représentent de VRAIES opportunités business monétisables.

CRITÈRES STRICTS pour une opportunité valide :
✅ L'utilisateur exprime un BESOIN ou un PROBLÈME récurrent qui peut être résolu par un SaaS
✅ Il y a une DEMANDE claire pour un outil/solution (ex: "looking for", "need a tool", "best alternative to")
✅ Le problème n'est PAS déjà résolu par des solutions majeures existantes
✅ Il y a un POTENTIEL de marché (plusieurs personnes ont le même problème)
✅ Le post cherche activement une solution, pas juste une discussion

❌ REJETER ABSOLUMENT si :
- C'est un avertissement de sécurité ou un conseil (ex: "Stop pasting API keys", "Don't do X")
- C'est un tutoriel, guide ou explication technique
- C'est un partage d'expérience sans demande de solution
- C'est une annonce de projet/lancement ("I just built...", "Check out my...")
- C'est une discussion métier sans demande concrète
- C'est une plainte sans demande de solution
- Le problème est déjà bien résolu par des solutions établies
- Pas de potentiel business monétisable clair

Pour chaque post, évalue avec un relevanceScore entre 0.5 et 1.5:
- 1.5 = Problème très monétisable, demande claire et urgente, marché validé
- 1.2 = Problème monétisable avec demande claire
- 1.0 = Problème valide mais générique ou déjà partiellement résolu
- 0.5 = Pas une opportunité business (rejeter)

Posts:
${postsList}

Réponds en JSON strict (uniquement le tableau, pas de texte avant/après):
[
  {"index": 0, "isOpportunity": true, "relevanceScore": 1.5, "intensity": "high", "reason": "Demande claire pour un outil SaaS"},
  {"index": 1, "isOpportunity": false, "relevanceScore": 0.5, "reason": "Discussion technique, pas de demande business"},
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
    } catch (error) {
        console.error('LLM batch analysis error:', error);
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
    } catch (error) {
        console.error('Blueprint generation error:', error);
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

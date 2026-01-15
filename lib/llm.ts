
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { RedditPost } from './reddit';
import { calculateGoldScore } from './scoring';
import { checkGeminiRateLimit } from './rate-limit';

// Get Gemini API key from environment
// IMPORTANT: @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default
// We support both GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_API_KEY for flexibility
const getGeminiModel = (usePro: boolean = false) => {
    // Get API key from either variable
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.warn('[LLM] Warning: GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set. LLM features will not work.');
        // Return model without explicit API key - will try to read from env at call time
        return google(usePro ? 'gemini-1.5-pro' : 'gemini-1.5-flash');
    }
    
    // Log which API key is being used (first 10 chars for security)
    console.log(`[LLM] Using Gemini API key: ${apiKey.substring(0, 10)}...`);
    
    // CRITICAL: @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default
    // If user has GEMINI_API_KEY, we need to set it as GOOGLE_GENERATIVE_AI_API_KEY
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
        // Set it so @ai-sdk/google can read it
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
        console.log('[LLM] Set GOOGLE_GENERATIVE_AI_API_KEY from GEMINI_API_KEY');
    }
    
    // Use models that are confirmed to work with the Generative AI API
    // gemini-1.5-pro and gemini-1.5-flash are the most reliable
    // Note: gemini-2.0-flash may have quota issues on free tier
    if (usePro) {
        return google('gemini-1.5-pro');
    }
    return google('gemini-1.5-flash');
};

export interface LLMAnalysis {
    isOpportunity: boolean;
    reason: string;
    intensity: 'high' | 'medium' | 'low';
}

export async function batchLLMAnalysis(
    posts: RedditPost[]
): Promise<Array<RedditPost & { isOpportunity: boolean; relevanceScore: number }>> {
    // Check Gemini API rate limits before making the call
    const rateLimitCheck = await checkGeminiRateLimit();
    if (!rateLimitCheck.allowed) {
        console.warn('[LLM] Gemini API rate limit exceeded. RPM remaining:', rateLimitCheck.rpm.remaining, 'RPD remaining:', rateLimitCheck.rpd.remaining);
        // Return all posts as opportunities (fallback behavior)
        return posts.map(p => ({ ...p, isOpportunity: true, relevanceScore: 1.0 }));
    }
    
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
        // Check for quota errors
        if (error?.message?.includes('429') || 
            error?.message?.includes('quota') ||
            error?.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn('[LLM] ⚠️ QUOTA EXCEEDED: Gemini API quota exceeded. Using fallback.');
        }
        // Check if it's an API key error
        else if (error?.message?.includes('API key') || error?.message?.includes('LoadAPIKeyError')) {
            console.warn('[LLM] API key missing or invalid. Using fallback: all posts will be marked as opportunities.');
            console.warn('[LLM] To enable LLM filtering, set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
            console.warn('[LLM] Note: @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default');
        } else {
            console.error('[LLM] Batch analysis error:', error);
        }
        // Fallback: return all posts if LLM fails, don't block the app
        return posts.map(p => ({ ...p, isOpportunity: true, relevanceScore: 1.0 }));
    }
}

export async function generateBlueprint(post: RedditPost) {
    const prompt = `Tu es un expert en micro-SaaS, entrepreneur et analyste de marché. Analyse ce pain point Reddit en profondeur et génère une feuille de route complète, claire et actionnable.

POST REDDIT:
Titre: "${post.title}"
Contenu: "${post.selftext.substring(0, 1200)}"
Subreddit: r/${post.subreddit}
Engagement: ${post.score} upvotes, ${post.num_comments} commentaires
Score d'opportunité: ${calculateGoldScore(post)}/100

⚠️ CRITÈRES DE QUALITÉ CRITIQUES - RESPECTE CES RÈGLES ABSOLUMENT:

1. "problem" : NE RÉPÈTE PAS le titre. Analyse le VRAI problème sous-jacent. 
   - Si le titre dit "Got my first order, losing money", le problème n'est PAS "Got my first order, losing money"
   - Le VRAI problème est: "Manque de visibilité sur la rentabilité réelle des commandes (coûts cachés, frais, marge réelle), absence d'outils de calcul automatique, risque de prendre des décisions basées sur des données incomplètes"
   - Sois SPÉCIFIQUE et DÉTAILLÉ (3-4 phrases minimum)

2. "whyPainPoint" : Explique POURQUOI c'est validé avec des DÉTAILS CONCRETS
   - Ne dis pas juste "Post avec X upvotes" - explique ce que ça signifie
   - Exemple: "Post avec 1 upvote mais 20 commentaires montre que le problème résonne fortement. Les commentaires révèlent que c'est un problème récurrent pour les nouveaux dropshippers qui sous-estiment les coûts réels (frais de transaction, marketing, retours)."
   - Mentionne la récurrence, les patterns dans les commentaires, ou les solutions existantes insuffisantes

3. "solutionName" : Nom CRÉATIF, MÉMORABLE et qui reflète la valeur
   - Pas de noms génériques comme "Solution à développer"
   - Exemples: "ProfitGuard", "OrderOptimizer", "MarginCalculator", "CostTracker Pro"

4. "solutionPitch" : Description DÉTAILLÉE de 5-7 lignes qui explique:
   - QUOI: Ce que fait le SaaS concrètement
   - COMMENT: Le mécanisme/processus spécifique
   - POURQUOI: La valeur unique et différenciation
   - QUI: Qui l'utilise et dans quel contexte
   - Exemple concret d'utilisation si possible

5. "howItSolves" : Explication CONCRÈTE et SPÉCIFIQUE du mécanisme de résolution
   - Ne dis pas "La solution adresse directement le problème"
   - Détaille le workflow: "L'utilisateur connecte sa boutique, le SaaS analyse automatiquement chaque commande en temps réel, calcule tous les coûts (produit, shipping, frais Stripe, marketing), affiche la marge réelle avant validation, et envoie une alerte si la commande est non-rentable avec suggestions d'ajustement"
   - Sois PRÉCIS sur le processus (3-4 phrases)

6. "keyFeatures" : Fonctionnalités qui résolvent DIRECTEMENT le problème identifié
   - Pas de features génériques
   - Chaque feature doit être liée au problème spécifique
   - Exemple pour le problème de pricing: ["Calcul automatique de marge en temps réel", "Intégration avec Stripe/PayPal pour frais réels", "Alertes avant commande non-rentable", "Dashboard de rentabilité par produit"]

ÉTAPE 1 - ANALYSE DU PROBLÈME (obligatoire):
- Identifie le VRAI problème sous-jacent (pas juste le symptôme visible dans le titre)
- Explique POURQUOI c'est un pain point récurrent et validé avec des détails concrets
- Décris l'impact concret sur les utilisateurs (conséquences, frustrations, coûts)
- Identifie les solutions existantes et leurs limites spécifiques

ÉTAPE 2 - SOLUTION DÉTAILLÉE (obligatoire):
- Décris COMMENT la solution SaaS résout spécifiquement ce problème avec un mécanisme clair
- Explique la valeur unique apportée et la différenciation
- Détaille les fonctionnalités clés qui adressent directement le pain point
- Montre pourquoi cette solution est meilleure que les alternatives

ÉTAPE 3 - FEUILLE DE ROUTE (obligatoire):
- Phase 1 (MVP): Les 3 fonctionnalités essentielles pour résoudre le problème core
- Phase 2 (Growth): Les fonctionnalités pour scaler et différencier
- Timeline réaliste: Estimation du temps de développement

Génère un JSON structuré avec TOUS ces champs:
{
  "problem": "Description DÉTAILLÉE du problème sous-jacent (3-4 phrases minimum). N'utilise PAS le titre du post. Analyse le problème réel: qu'est-ce qui cause la situation décrite? Quels sont les symptômes vs la cause racine? Quel est l'impact concret sur les utilisateurs?",
  "whyPainPoint": "Explication DÉTAILLÉE de POURQUOI c'est un pain point validé (2-3 phrases). Mentionne l'engagement Reddit avec contexte (ex: '20 commentaires montrent que...'), la récurrence du problème, les patterns observés, ou les solutions existantes insuffisantes. Sois SPÉCIFIQUE.",
  "solutionName": "Nom créatif et mémorable du SaaS qui reflète la valeur (ex: 'ProfitGuard', 'OrderOptimizer', 'MarginCalculator'). PAS de noms génériques.",
  "solutionPitch": "Description TRÈS DÉTAILLÉE de la solution (5-7 lignes). Explique QUOI fait le SaaS concrètement, COMMENT il fonctionne (mécanisme/processus), POURQUOI c'est unique, QUI l'utilise, et donne un exemple concret d'utilisation si possible.",
  "howItSolves": "Explication CONCRÈTE et SPÉCIFIQUE du mécanisme de résolution (3-4 phrases). Détaille le workflow étape par étape: comment l'utilisateur utilise le SaaS, quelles actions automatiques se produisent, quels résultats sont obtenus. Sois PRÉCIS sur le processus.",
  "keyFeatures": ["Feature 1 qui résout DIRECTEMENT le problème spécifique", "Feature 2 qui différencie et adresse le pain point", "Feature 3 essentielle pour la résolution", "Feature 4 pour scaler et améliorer l'expérience"],
  "roadmap": {
    "phase1": {
      "name": "MVP - Résolution du problème core",
      "features": ["Feature MVP 1 spécifique au problème", "Feature MVP 2 essentielle", "Feature MVP 3 pour validation"],
      "timeline": "2-3 mois"
    },
    "phase2": {
      "name": "Growth - Différenciation et scale",
      "features": ["Feature Growth 1 pour différenciation", "Feature Growth 2 pour scale"],
      "timeline": "3-6 mois"
    }
  },
  "marketSize": "Small|Medium|Large",
  "targetAudience": "Description PRÉCISE et SPÉCIFIQUE de la cible basée sur le problème identifié (ex: 'Dropshippers débutants qui font leur première commande et perdent de l'argent car ils ne calculent pas tous les coûts cachés', 'E-commerçants avec problèmes de pricing qui sous-estiment les frais de transaction')",
  "firstChannel": "Canal d'acquisition spécifique et actionnable (ex: 'Reddit ads sur r/dropshipping ciblant les posts sur les premières commandes', 'Post sur r/entrepreneur partageant un cas d'usage', 'Partnership avec influenceurs dropshipping')",
  "mrrEstimate": "Estimation réaliste basée sur le marché (ex: '$1k-$3k MRR', '$5k-$10k MRR')",
  "techStack": "Stack technique concrète et réaliste (ex: 'Next.js 15 + Supabase + Stripe + Resend', 'React + Firebase + OpenAI API')",
  "difficulty": 3,
  "pricingModel": "Modèle de pricing suggéré avec justification détaillée (ex: 'Freemium avec $19/mois premium - justifié par les économies générées: un utilisateur qui évite une seule commande non-rentable économise $50+, le SaaS paie pour lui-même')"
}

RÈGLES ABSOLUES - VÉRIFIE AVANT DE RÉPONDRE:
✅ "problem" explique le problème SOUS-JACENT, pas le titre
✅ "whyPainPoint" donne des détails concrets sur la validation (pas juste "X upvotes")
✅ "solutionName" est créatif et mémorable (pas générique)
✅ "solutionPitch" fait 5-7 lignes avec QUOI/COMMENT/POURQUOI/QUI
✅ "howItSolves" détaille le workflow étape par étape (pas générique)
✅ "keyFeatures" sont spécifiques au problème identifié
✅ Toutes les descriptions sont DÉTAILLÉES et SPÉCIFIQUES

Réponds UNIQUEMENT en JSON valide, pas de markdown, pas de texte avant ou après.`;

    try {
        // Check Gemini API rate limits before making the call
        const rateLimitCheck = await checkGeminiRateLimit();
        if (!rateLimitCheck.allowed) {
            console.warn('[LLM] Gemini API rate limit exceeded. RPM remaining:', rateLimitCheck.rpm.remaining, 'RPD remaining:', rateLimitCheck.rpd.remaining);
            throw new Error('QUOTA_EXCEEDED: Gemini API rate limit exceeded. Please wait before retrying.');
        }
        
        // Ensure GOOGLE_GENERATIVE_AI_API_KEY is set (required by @ai-sdk/google)
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set in environment variables');
        }
        
        // Set GOOGLE_GENERATIVE_AI_API_KEY if we have GEMINI_API_KEY
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
            process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
        }
        
        // Try to use the best model, with fallback if model name doesn't exist
        let model = getGeminiModel(true);
        let text: string;
        let modelUsed = 'gemini-1.5-pro';
        
        try {
            console.log('[LLM] Attempting to generate blueprint with gemini-1.5-pro...');
            console.log('[LLM] Rate limit status - RPM remaining:', rateLimitCheck.rpm.remaining, 'RPD remaining:', rateLimitCheck.rpd.remaining);
            const result = await generateText({
                model,
                prompt,
                temperature: 0.6, // Balanced creativity and consistency
            });
            text = result.text;
            console.log('[LLM] Successfully generated blueprint');
        } catch (modelError: any) {
            // Log the full error for debugging
            console.error('[LLM] Error generating blueprint:', {
                message: modelError?.message,
                status: modelError?.status,
                statusText: modelError?.statusText,
                cause: modelError?.cause,
                stack: modelError?.stack?.substring(0, 500)
            });
            
            // Check for quota errors (429) - common with free tier
            if (modelError?.message?.includes('429') || 
                modelError?.message?.includes('quota') ||
                modelError?.message?.includes('RESOURCE_EXHAUSTED') ||
                modelError?.status === 429) {
                console.warn('[LLM] Quota exceeded (429). This is common on free tier. Consider upgrading or waiting.');
                throw new Error('QUOTA_EXCEEDED: Gemini API quota exceeded. Please check your plan and billing details.');
            }
            
            // If model name doesn't exist or API key is invalid, try fallback
            if (modelError?.message?.includes('model') || 
                modelError?.message?.includes('not found') ||
                modelError?.message?.includes('404') ||
                modelError?.message?.includes('API key') ||
                modelError?.message?.includes('401') ||
                modelError?.message?.includes('403') ||
                modelError?.message?.includes('LoadAPIKeyError')) {
                console.warn('[LLM] Primary model failed, trying gemini-1.5-flash as fallback...');
                modelUsed = 'gemini-1.5-flash';
                model = google('gemini-1.5-flash');
                const result = await generateText({
                    model,
                    prompt,
                    temperature: 0.6,
                });
                text = result.text;
                console.log('[LLM] Successfully generated blueprint with fallback model');
            } else {
                // Re-throw if it's not a model/API key error
                throw modelError;
            }
        }

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
            whyPainPoint: blueprint.whyPainPoint || `Post avec ${post.score} upvotes et ${post.num_comments} commentaires, indiquant un besoin validé.`,
            solutionName: blueprint.solutionName || 'Solution à développer',
            solutionPitch: blueprint.solutionPitch || 'Analyse le problème et développe une solution.',
            howItSolves: blueprint.howItSolves || blueprint.solutionPitch || 'La solution adresse directement le problème identifié.',
            marketSize: (blueprint.marketSize === 'Small' || blueprint.marketSize === 'Medium' || blueprint.marketSize === 'Large') 
                ? blueprint.marketSize 
                : 'Medium',
            firstChannel: blueprint.firstChannel || 'Reddit',
            mrrEstimate: blueprint.mrrEstimate || '$2k-$5k',
            techStack: blueprint.techStack || 'Next.js + Supabase',
            difficulty: typeof blueprint.difficulty === 'number' 
                ? Math.max(1, Math.min(5, Math.round(blueprint.difficulty)))
                : undefined, // Will be calculated in PainPointCard if not provided
            // Enhanced fields
            keyFeatures: Array.isArray(blueprint.keyFeatures) && blueprint.keyFeatures.length > 0 
                ? blueprint.keyFeatures 
                : undefined,
            targetAudience: blueprint.targetAudience || undefined,
            pricingModel: blueprint.pricingModel || undefined,
            // Roadmap (new)
            roadmap: blueprint.roadmap || undefined
        };
    } catch (error: any) {
        // Log detailed error information for debugging
        console.error('[LLM] Blueprint generation failed with error:', {
            message: error?.message,
            status: error?.status,
            statusText: error?.statusText,
            cause: error?.cause,
            name: error?.name,
            // Log first 200 chars of stack for debugging
            stack: error?.stack?.substring(0, 200)
        });
        
        // Check for quota errors first
        if (error?.message?.includes('QUOTA_EXCEEDED') ||
            error?.message?.includes('429') ||
            error?.message?.includes('quota') ||
            error?.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn('[LLM] ⚠️ QUOTA EXCEEDED: Gemini API quota exceeded.');
            console.warn('[LLM] This is common on free tier. Solutions:');
            console.warn('[LLM] 1. Wait for quota reset (check error message for retry time)');
            console.warn('[LLM] 2. Upgrade to paid plan in Google AI Studio');
            console.warn('[LLM] 3. Use a different API key with available quota');
        }
        // Check if it's an API key error
        else if (error?.message?.includes('API key') || 
            error?.message?.includes('LoadAPIKeyError') ||
            error?.message?.includes('401') ||
            error?.message?.includes('403') ||
            error?.message?.includes('not set')) {
            console.warn('[LLM] API key issue detected. Using fallback blueprint.');
            console.warn('[LLM] To enable LLM blueprint generation, set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
            console.warn('[LLM] Current API key check:', apiKey ? `Set (${apiKey.substring(0, 10)}...)` : 'NOT SET');
            console.warn('[LLM] Note: @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default');
        } else if (error?.message?.includes('404') || error?.message?.includes('not found')) {
            console.warn('[LLM] Model not found. Check if the model name is correct for your API key.');
        } else {
            console.error('[LLM] Unexpected error during blueprint generation:', error);
        }
        // Return fallback blueprint
        return {
            problem: post.title,
            whyPainPoint: `Post avec ${post.score} upvotes et ${post.num_comments} commentaires, indiquant un besoin validé par la communauté.`,
            solutionName: 'Solution à développer',
            solutionPitch: 'Analyse le problème et développe une solution.',
            howItSolves: 'La solution adresse directement le problème identifié dans le post Reddit.',
            marketSize: 'Medium' as const,
            firstChannel: 'Reddit',
            mrrEstimate: '$2k-$5k',
            techStack: 'Next.js + Supabase',
            // difficulty will be calculated in PainPointCard
        };
    }
}

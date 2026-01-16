
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { RedditPost } from './reddit';
import { calculateGoldScore } from './scoring';
import { checkGeminiRateLimit } from './rate-limit';

// Get Gemini API key from environment
// IMPORTANT: @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default
// We support both GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_API_KEY for flexibility

/**
 * Get Gemini model with hybrid strategy:
 * - Fast filtering: Gemini 1.5 Flash (economical, fast)
 * - Deep analysis: Gemini 2.0 Flash Thinking (better reasoning)
 * 
 * @param modelType - 'fast' for batch filtering, 'thinking' for blueprints
 */
const getGeminiModel = (modelType: 'fast' | 'thinking' = 'fast') => {
    // Get API key from either variable
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[LLM] Warning: GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set. LLM features will not work.');
        // Return model without explicit API key - will try to read from env at call time
        // Use correct model format for v1beta API
        return google(modelType === 'thinking' ? 'models/gemini-2.0-flash-thinking-exp' : 'models/gemini-1.5-flash');
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

    // HYBRID STRATEGY:
    // - 'fast': Gemini 1.5 Flash for batch filtering (economical, ~$0.075/1M tokens)
    // - 'thinking': Gemini 2.0 Flash Thinking for blueprints (better reasoning, ~$0.15/1M tokens)
    // 
    // IMPORTANT: For v1beta API, model names must include 'models/' prefix
    // See: https://ai.google.dev/gemini-api/docs/models/gemini
    if (modelType === 'thinking') {
        // Use Gemini 2.0 Flash Thinking for deep analysis (blueprints)
        // This model has explicit reasoning capabilities for better quality
        return google('models/gemini-2.0-flash-thinking-exp');
    }

    // Use Gemini 1.5 Flash for fast batch filtering
    // Economical and fast for simple filtering tasks
    return google('models/gemini-1.5-flash');
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

    const prompt = `You are an expert in SaaS opportunity identification. Analyze these Reddit posts and identify those that represent monetizable business opportunities.

IMPORTANT - PRIORITIZATION:
1. PRIORITIZE VIRAL posts with many likes (high score) and comments (high engagement)
2. PRIORITIZE posts that generate DISCUSSION (many comments = validated need)
3. DIVERSIFY results across different subreddits (don't take everything from a single subreddit)
4. You MUST identify AT LEAST 3 valid opportunities among these posts

CRITERIA for a valid opportunity:
✅ User expresses a NEED or PROBLEM that can be solved by a SaaS
✅ There is a DEMAND for a tool/solution (e.g., "looking for", "need a tool", "best alternative to", "wish there was")
✅ The post generates ENGAGEMENT (likes/comments = need validation)
✅ There is MARKET POTENTIAL (even if the problem is partially solved)
✅ The post expresses FRUSTRATION or a recurring NEED

ALSO ACCEPT:
- Posts with high engagement even if the demand is not explicit (comments may reveal the need)
- Posts comparing existing solutions (need for alternative)
- Posts describing a recurring problem (SaaS opportunity)
- Posts with legitimate complaints about existing tools (improvement opportunity)

❌ REJECT ONLY if:
- It's clearly a security warning without business context
- It's only a technical tutorial without demand
- It's a project/launch announcement without need context
- The post has 0 engagement (no likes or comments)

For each post, evaluate with a relevanceScore between 0.7 and 1.5:
- 1.5 = Viral post (100+ upvotes or 50+ comments) with clear SaaS solution demand
- 1.3 = Post with good engagement (20+ upvotes or 10+ comments) and identified need
- 1.1 = Post with moderate engagement and valid problem
- 0.9 = Post with low engagement but interesting problem
- 0.7 = Marginal post but with potential
- 0.5 = Not an opportunity (reject only if really not relevant)

IMPORTANT: You MUST identify at least 3 opportunities. If you don't find 3 obvious posts, choose the 3 best even if they're not perfect.

Posts:
${postsList}

Respond in strict JSON (array only, no text before/after):
[
  {"index": 0, "isOpportunity": true, "relevanceScore": 1.5, "intensity": "high", "reason": "Viral post with clear demand"},
  {"index": 1, "isOpportunity": true, "relevanceScore": 1.2, "reason": "Good engagement and identified need"},
  ...
]`;

    try {
        const { text } = await generateText({
            model: getGeminiModel('fast'), // Use Gemini 1.5 Flash for fast batch filtering
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check for quota errors
        if (errorMessage.includes('429') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('RESOURCE_EXHAUSTED')) {
            console.warn('[LLM] ⚠️ QUOTA EXCEEDED: Gemini API rate limit exceeded. Using fallback.');
        }
        // Check if it's an API key error
        else if (errorMessage.includes('API key') || errorMessage.includes('LoadAPIKeyError')) {
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
    const prompt = `You are an expert in micro-SaaS, entrepreneurship, and market analysis. Analyze this Reddit pain point in depth and generate a complete, clear, and actionable roadmap.

REDDIT POST:
Title: "${post.title}"
Content: "${post.selftext.substring(0, 1200)}"
Subreddit: r/${post.subreddit}
Engagement: ${post.score} upvotes, ${post.num_comments} comments
Opportunity Score: ${calculateGoldScore(post)}/100

⚠️ CRITICAL QUALITY CRITERIA - ABSOLUTELY FOLLOW THESE RULES:

1. "problem": DO NOT REPEAT the title. Analyze the REAL underlying problem.
   - If the title says "Got my first order, losing money", the problem is NOT "Got my first order, losing money"
   - The REAL problem is: "Lack of visibility into actual order profitability (hidden costs, fees, real margin), absence of automatic calculation tools, risk of making decisions based on incomplete data"
   - Be SPECIFIC and DETAILED (minimum 3-4 sentences)

2. "whyPainPoint": Explain WHY it's validated with CONCRETE DETAILS
   - Don't just say "Post with X upvotes" - explain what it means
   - Example: "Post with 1 upvote but 20 comments shows the problem resonates strongly. Comments reveal this is a recurring problem for new dropshippers who underestimate real costs (transaction fees, marketing, returns)."
   - Mention recurrence, patterns in comments, or insufficient existing solutions

3. "solutionName": CREATIVE, MEMORABLE name that reflects value
   - No generic names like "Solution to develop"
   - Examples: "ProfitGuard", "OrderOptimizer", "MarginCalculator", "CostTracker Pro"

4. "solutionPitch": DETAILED description of 5-7 lines that explains:
   - WHAT: What the SaaS does concretely
   - HOW: The specific mechanism/process
   - WHY: Unique value and differentiation
   - WHO: Who uses it and in what context
   - Concrete usage example if possible

5. "howItSolves": CONCRETE and SPECIFIC explanation of the resolution mechanism
   - Don't say "The solution directly addresses the problem"
   - Detail the workflow: "User connects their store, the SaaS automatically analyzes each order in real-time, calculates all costs (product, shipping, Stripe fees, marketing), displays real margin before validation, and sends an alert if the order is unprofitable with adjustment suggestions"
   - Be PRECISE about the process (3-4 sentences)

6. "keyFeatures": Features that DIRECTLY solve the identified problem
   - No generic features
   - Each feature must be linked to the specific problem
   - Example for pricing problem: ["Real-time automatic margin calculation", "Stripe/PayPal integration for real fees", "Alerts before unprofitable orders", "Product profitability dashboard"]

STEP 1 - PROBLEM ANALYSIS (mandatory):
- Identify the REAL underlying problem (not just the visible symptom in the title)
- Explain WHY it's a recurring and validated pain point with concrete details
- Describe concrete impact on users (consequences, frustrations, costs)
- Identify existing solutions and their specific limitations

STEP 2 - DETAILED SOLUTION (mandatory):
- Describe HOW the SaaS solution specifically solves this problem with a clear mechanism
- Explain unique value brought and differentiation
- Detail key features that directly address the pain point
- Show why this solution is better than alternatives

STEP 3 - ROADMAP (mandatory):
- Phase 1 (MVP): The 3 essential features to solve the core problem
- Phase 2 (Growth): Features to scale and differentiate
- Realistic timeline: Development time estimate

Generate a structured JSON with ALL these fields:
{
  "problem": "DETAILED description of the underlying problem (minimum 3-4 sentences). DO NOT USE the post title. Analyze the real problem: what causes the described situation? What are symptoms vs root cause? What is the concrete impact on users?",
  "whyPainPoint": "DETAILED explanation of WHY this is a validated pain point (2-3 sentences). Mention Reddit engagement with context (e.g., '20 comments show that...'), problem recurrence, observed patterns, or insufficient existing solutions. Be SPECIFIC.",
  "solutionName": "Creative and memorable SaaS name that reflects value (e.g., 'ProfitGuard', 'OrderOptimizer', 'MarginCalculator'). NO generic names.",
  "solutionPitch": "VERY DETAILED solution description (5-7 lines). Explain WHAT the SaaS does concretely, HOW it works (mechanism/process), WHY it's unique, WHO uses it, and provide a concrete usage example if possible.",
  "howItSolves": "CONCRETE and SPECIFIC explanation of the resolution mechanism (3-4 sentences). Detail the step-by-step workflow: how the user uses the SaaS, what automatic actions occur, what results are obtained. Be PRECISE about the process.",
  "keyFeatures": ["Feature 1 that DIRECTLY solves the specific problem", "Feature 2 that differentiates and addresses the pain point", "Feature 3 essential for resolution", "Feature 4 to scale and improve experience"],
  "roadmap": {
    "phase1": {
      "name": "MVP - Core problem resolution",
      "features": ["MVP Feature 1 specific to the problem", "MVP Feature 2 essential", "MVP Feature 3 for validation"],
      "timeline": "2-3 months"
    },
    "phase2": {
      "name": "Growth - Differentiation and scale",
      "features": ["Growth Feature 1 for differentiation", "Growth Feature 2 for scale"],
      "timeline": "3-6 months"
    }
  },
  "marketSize": "Small|Medium|Large",
  "targetAudience": "PRECISE and SPECIFIC target description based on the identified problem (e.g., 'Beginner dropshippers making their first order and losing money because they don't calculate all hidden costs', 'E-commerce merchants with pricing problems who underestimate transaction fees')",
  "firstChannel": "Specific and actionable acquisition channel (e.g., 'Reddit ads on r/dropshipping targeting posts about first orders', 'Post on r/entrepreneur sharing a use case', 'Partnership with dropshipping influencers')",
  "mrrEstimate": "Realistic market-based estimate (e.g., '$1k-$3k MRR', '$5k-$10k MRR')",
  "techStack": "Concrete and realistic tech stack (e.g., 'Next.js 15 + Supabase + Stripe + Resend', 'React + Firebase + OpenAI API')",
  "difficulty": 3,
  "pricingModel": "Suggested pricing model with detailed justification (e.g., 'Freemium with $19/month premium - justified by generated savings: a user avoiding a single unprofitable order saves $50+, the SaaS pays for itself')"
}

ABSOLUTE RULES - VERIFY BEFORE RESPONDING:
✅ "problem" explains the UNDERLYING problem, not the title
✅ "whyPainPoint" gives concrete details on validation (not just "X upvotes")
✅ "solutionName" is creative and memorable (not generic)
✅ "solutionPitch" is 5-7 lines with WHAT/HOW/WHY/WHO
✅ "howItSolves" details the step-by-step workflow (not generic)
✅ "keyFeatures" are specific to the identified problem
✅ All descriptions are DETAILED and SPECIFIC

Respond ONLY in valid JSON, no markdown, no text before or after.`;

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

        // Use Gemini 2.0 Flash Thinking for blueprint generation (better reasoning)
        // Fallback to Gemini 1.5 Flash if thinking model fails
        let text: string = '';

        // List of models to try in order (with correct v1beta format)
        // Priority: Gemini 2.0 Flash Thinking (best reasoning) -> Gemini 1.5 Flash (fallback)
        const modelsToTry = [
            { name: 'models/gemini-2.0-flash-thinking-exp', model: google('models/gemini-2.0-flash-thinking-exp') },
            { name: 'models/gemini-1.5-flash', model: google('models/gemini-1.5-flash') },
        ];

        let lastError: unknown = null;

        for (const { name, model: modelToTry } of modelsToTry) {
            try {
                console.log(`[LLM] Attempting to generate blueprint with ${name}...`);
                console.log('[LLM] Rate limit status - RPM remaining:', rateLimitCheck.rpm.remaining, 'RPD remaining:', rateLimitCheck.rpd.remaining);
                const result = await generateText({
                    model: modelToTry,
                    prompt,
                    temperature: 0.6, // Balanced creativity and consistency
                });
                text = result.text;
                console.log(`[LLM] Successfully generated blueprint with ${name}`);
                break; // Success, exit loop
            } catch (modelError: unknown) {
                lastError = modelError;

                // Log the error for debugging
                const modelErrorMessage = modelError instanceof Error ? modelError.message : String(modelError);
                console.warn(`[LLM] ${name} failed:`, modelErrorMessage.substring(0, 200));

                // Check for quota errors (429) - common with free tier
                const modelErrorStatus = (modelError as { status?: number })?.status;
                if (modelErrorMessage.includes('429') ||
                    modelErrorMessage.includes('quota') ||
                    modelErrorMessage.includes('RESOURCE_EXHAUSTED') ||
                    modelErrorStatus === 429) {
                    console.warn('[LLM] Quota exceeded (429). This is common on free tier. Consider upgrading or waiting.');
                    throw new Error('QUOTA_EXCEEDED: Gemini API quota exceeded. Please check your plan and billing details.');
                }

                // If it's not a model/API key error, re-throw immediately
                if (!modelErrorMessage.includes('model') &&
                    !modelErrorMessage.includes('not found') &&
                    !modelErrorMessage.includes('404') &&
                    !modelErrorMessage.includes('API key') &&
                    !modelErrorMessage.includes('401') &&
                    !modelErrorMessage.includes('403') &&
                    !modelErrorMessage.includes('LoadAPIKeyError')) {
                    throw modelError;
                }

                // Continue to next model if this one failed
                continue;
            }
        }

        // If all models failed, throw the last error
        if (!text && lastError) {
            const lastErrorObj = lastError instanceof Error ? lastError : new Error(String(lastError));
            const lastErrorWithStatus = lastError as { status?: number; statusText?: string; cause?: unknown; stack?: string };
            console.error('[LLM] All models failed. Last error:', {
                message: lastErrorObj.message,
                status: lastErrorWithStatus?.status,
                statusText: lastErrorWithStatus?.statusText,
                cause: lastErrorWithStatus?.cause,
                stack: lastErrorObj.stack?.substring(0, 500)
            });
            throw lastError;
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
            whyPainPoint: blueprint.whyPainPoint || `Post with ${post.score} upvotes and ${post.num_comments} comments, indicating a validated need.`,
            solutionName: blueprint.solutionName || 'Solution to develop',
            solutionPitch: blueprint.solutionPitch || 'Analyze the problem and develop a solution.',
            howItSolves: blueprint.howItSolves || blueprint.solutionPitch || 'The solution directly addresses the identified problem.',
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
    } catch (error: unknown) {
        // Log detailed error information for debugging
        const errorObj = error instanceof Error ? error : new Error(String(error));
        const errorWithStatus = error as { status?: number; statusText?: string; cause?: unknown; name?: string; stack?: string };
        console.error('[LLM] Blueprint generation failed with error:', {
            message: errorObj.message,
            status: errorWithStatus?.status,
            statusText: errorWithStatus?.statusText,
            cause: errorWithStatus?.cause,
            name: errorWithStatus?.name || errorObj.name,
            // Log first 200 chars of stack for debugging
            stack: errorObj.stack?.substring(0, 200)
        });

        const errorMessage = errorObj.message;
        // Check for quota errors first
        if (errorMessage.includes('QUOTA_EXCEEDED') ||
            errorMessage.includes('429') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('RESOURCE_EXHAUSTED')) {
            console.warn('[LLM] ⚠️ QUOTA EXCEEDED: Gemini API quota exceeded.');
            console.warn('[LLM] This is common on free tier. Solutions:');
            console.warn('[LLM] 1. Wait for quota reset (check error message for retry time)');
            console.warn('[LLM] 2. Upgrade to paid plan in Google AI Studio');
            console.warn('[LLM] 3. Use a different API key with available quota');
        }
        // Check if it's an API key error
        else if (errorMessage.includes('API key') ||
            errorMessage.includes('LoadAPIKeyError') ||
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('not set')) {
            console.warn('[LLM] API key issue detected. Using fallback blueprint.');
            console.warn('[LLM] To enable LLM blueprint generation, set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
            console.warn('[LLM] Current API key check:', apiKey ? `Set (${apiKey.substring(0, 10)}...)` : 'NOT SET');
            console.warn('[LLM] Note: @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default');
        } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            console.warn('[LLM] Model not found. Check if the model name is correct for your API key.');
        } else {
            console.error('[LLM] Unexpected error during blueprint generation:', error);
        }
        // Return fallback blueprint
        return {
            problem: post.title,
            whyPainPoint: `Post with ${post.score} upvotes and ${post.num_comments} comments, indicating a need validated by the community.`,
            solutionName: 'Solution to develop',
            solutionPitch: 'Analyze the problem and develop a solution.',
            howItSolves: 'The solution directly addresses the problem identified in the Reddit post.',
            marketSize: 'Medium' as const,
            firstChannel: 'Reddit',
            mrrEstimate: '$2k-$5k',
            techStack: 'Next.js + Supabase',
            // difficulty will be calculated in PainPointCard
        };
    }
}

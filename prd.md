# Reddit Goldmine - Product Requirements Document (PRD)

**Version** : 3.1 (Inspiré par Mobbin.com)  
**Date** : January 14, 2026  
**Objectif** : Build un mini-tool production-ready en 48h pour le test "Mini-Tools Maker" chez TMAKER  
**Stack** : Next.js 15 (uniquement), Tailwind CSS, shadcn/ui, Vercel AI SDK, Upstash Redis, Supabase (base de données principale)  
**Inspirations** : Perplexity, Linear, Raycast (via Mobbin.com)

---

# PARTIE 1 : DESIGN & UX

## 🎨 Design System "High-End Data" (Inspiration : Mobbin.com)

### 1.1 La "Vibe" Visuelle (Inspiration : Linear & Perplexity)

L'esthétique globale doit être **"High-End Data"**. On oublie le look "site web" classique pour un look "Software/App".

* **L'effet "Glass-Border" (Inspiration : Linear) :** Pas de bordures unies. Utilise des bordures en `rgba(255, 255, 255, 0.05)` avec un `backdrop-blur` sur les cartes.
* **La Barre de Recherche "Floating" (Inspiration : Perplexity) :** Sur la landing, la barre de recherche ne doit pas être un simple input, mais un élément central massif avec des icônes d'action rapides (presets).

### 1.2 Palette de Couleurs "Deep Night"

```css
/* Couleurs Principales - Style "OLED Deep" */
--canvas: #000000               /* Fond d'écran pur (Noir OLED) */
--surface: #080808              /* Cartes et conteneurs */
--surface-elevated: #0F0F0F      /* Surfaces élevées (hover) */
--border: #1A1A1A               /* Bordures subtiles (Linear style) */
--border-glass: rgba(255, 255, 255, 0.05)  /* Bordures glassmorphism */

/* Accents */
--accent-reddit: #FF4500        /* Orange Reddit (Actions critiques) */
--accent-ai: #8B5CF6            /* Violet (Génération de Blueprints) */
--accent-success: #00FF41        /* Vert fluo terminal (Raycast style) */
--accent-warning: #F59E0B       /* Orange (scores moyens) */

/* Texte */
--text-primary: #E5E5E5         /* Texte principal */
--text-secondary: #A0A0A0       /* Texte secondaire */
--text-muted: #6B7280           /* Texte désactivé */
--text-terminal: #00FF41        /* Texte terminal (loading states) */

/* Effets Glassmorphism (Linear style) */
--glass-bg: rgba(8, 8, 8, 0.8)
--glass-border: rgba(255, 255, 255, 0.05)
--backdrop-blur: blur(12px)

/* Glows */
--glow-reddit: 0 0 20px rgba(255, 69, 0, 0.3)
--glow-ai: 0 0 20px rgba(139, 92, 246, 0.3)
--glow-terminal: 0 0 10px rgba(0, 255, 65, 0.4)

/* Gradients */
--gradient-primary: linear-gradient(135deg, #FF4500 0%, #8B5CF6 100%)
--gradient-card: linear-gradient(135deg, rgba(255, 69, 0, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)
```

### 1.3 Typographie "Developer-Centric"

```css
/* Fonts */
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace  /* Headers, scores, terminal (Data/Terminal vibe) */
--font-sans: 'Inter', -apple-system, sans-serif          /* Body text (lisibilité longs textes Reddit) */

/* Sizes */
--text-xs: 0.75rem    /* 12px - Labels */
--text-sm: 0.875rem   /* 14px - Secondary text */
--text-base: 1rem     /* 16px - Body */
--text-lg: 1.125rem   /* 18px - Subheadings */
--text-xl: 1.25rem    /* 20px - Headings */
--text-2xl: 1.5rem    /* 24px - Large headings */
--text-3xl: 1.875rem  /* 30px - Hero */
--text-4xl: 2.25rem   /* 36px - Display */

/* Weights */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Espacements & Layout

```css
/* Spacing Scale */
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */

/* Container */
--container-max: 1280px
--container-padding: 1.5rem

/* Border Radius */
--radius-sm: 0.375rem   /* 6px */
--radius-md: 0.5rem     /* 8px */
--radius-lg: 0.75rem    /* 12px */
--radius-xl: 1rem       /* 16px */
```

### Composants UI de Base

#### Button Primary
```tsx
// Style: Fond gradient, texte blanc, glow effect au hover
- Background: gradient-primary
- Text: white, font-semibold
- Padding: 12px 24px
- Border-radius: 8px
- Hover: glow-reddit, scale(1.02)
- Transition: all 0.2s ease
```

#### Button Secondary
```tsx
// Style: Bordure, fond transparent, glow au hover
- Background: transparent
- Border: 1px solid border-color
- Text: text-primary
- Padding: 12px 24px
- Border-radius: 8px
- Hover: border-accent-ai, glow-ai
```

#### Input Field "Floating Search" (Inspiration : Perplexity)
```tsx
// Style: Barre de recherche centrale massive avec presets
- Background: surface (avec backdrop-blur)
- Border: 1px solid border-glass
- Text: text-primary, font-sans
- Padding: 16px 24px
- Border-radius: 12px
- Width: 600px+ (centré)
- Focus: border-accent-reddit, glow-reddit (subtle)
- Placeholder: text-muted
- Interaction: Au clic, suggestions niches (Bento Grid) apparaissent en dessous avec fade-in
- Badge "Live": Indique nombre de posts scannés 24h (prouve fraîcheur data)
```

#### Card "Opportunity Blueprint" (Inspiration : Bento Grid & Linear)
```tsx
// Style: Carte structurée avec Bento Grid layout
- Background: glass-bg (avec backdrop-blur)
- Border: 1px solid border-glass (Linear style)
- Border-radius: 16px
- Padding: 24px
- Layout: Grid avec zones définies

Structure de la Card:
- Top-Left: Badge score (circulaire, anneau progression coloré)
- Top-Right: Bouton "Share to X" (icône minimaliste)
- Centre: Titre Problème (Bold) + Résumé IA (Italique)
- Bottom (Bento Row): 3 petites cases:
  1. Market Size (Badge: "Huge", "Niche", "Medium")
  2. Difficulty (Barre 1-5 étoiles)
  3. Revenue Pot. (Estimation $)

Hover: border-accent-reddit (subtle), glow-reddit (very subtle)
Transition: all 0.3s ease
```

#### Badge (Score)
```tsx
// Style: Badge circulaire avec score, couleur selon valeur
- Score 80-100: accent-success + glow-success
- Score 50-79: accent-warning
- Score 0-49: text-muted
- Font: font-mono, font-bold
- Size: 48px diameter
- Border-radius: 50%
```

---

## 📱 Pages & Composants

### Page 1 : Landing Page "Minimalist Search" (Inspiration : Perplexity Web)

#### Hero Section
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│              [Logo/Icon Reddit Goldmine]                 │
│                                                           │
│         🔥 Trouve des Idées SaaS Validées                │
│              par Reddit en 10 Secondes                    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔍 Tape une niche (ex: "Recrutement", "Notion")│   │
│  │  [Input field massive 600px+ avec icônes]       │   │
│  │  [Badge "Live: 12.4k posts scannés 24h"]       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  [Bento Grid de suggestions niches - apparaît au clic]  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │Notion│ │Fitness│ │Recrut│ │ SaaS │ │Devtools│          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                           │
│  ✨ 100% gratuit • Pas de compte requis                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Spécifications détaillées :**
- **Hero Title** : `text-4xl`, `font-bold`, `font-mono`, `text-primary`, centré
- **Subtitle** : `text-lg`, `text-secondary`, centré, max-width 600px
- **Input Field "Floating"** : Largeur 600px+, max-width 800px, centré, avec icône de recherche à gauche, border-radius 12px
- **Badge "Live"** : Petit badge en haut à droite de l'input, indique "Live: X posts scannés 24h" (prouve fraîcheur data)
- **Bento Grid Presets** : Apparaît en fade-in au clic sur l'input, 5 niches en grid responsive
- **Background** : Canvas (#000000) pur avec gradient subtil

#### Features Section (optionnel, si espace)
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  🎯 Gold Score Data-Backed                                │
│  💡 Blueprints Prêts à Lancer                            │
│  🚀 Partageable sur X                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Page 2 : Results Page (`/results/[niche]`)

#### Header
```
┌─────────────────────────────────────────────────────────┐
│  ← Retour                    Niche: [Recrutement]        │
│                                                           │
│  🔥 Top 10 Opportunities                                  │
│  Scanné 1,247 posts Reddit • Mis à jour il y a 5 min    │
└─────────────────────────────────────────────────────────┘
```

#### Loading State "Terminal Logic" (Inspiration : Raycast)
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ⚡ Scan en cours...                                      │
│                                                           │
│  [Liste de tâches avec checkmarks animées]              │
│  [✓] Accessing r/recruitinghell...                      │
│  [✓] Extracting 452 pain points...                      │
│  [⏳] LLM Scoring in progress...                        │
│  [ ] Generating blueprints...                           │
│                                                           │
│  [Progress bar animée avec pourcentage]                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Spécifications détaillées :**
- **Police Terminal** : `font-mono`, couleur `text-terminal` (#00FF41), très fine
- **Checkmarks** : Animation de checkmark verte qui apparaît quand la tâche est complète
- **Format** : `[OK]` ou `[✓]` pour terminé, `[⏳]` pour en cours, `[ ]` pour à venir
- **Progress Bar** : Barre de progression avec pourcentage, style terminal

#### Results List (Top 10 Cards)
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │  [Badge: 87]  Problem: Recruiters ignore my CV   │ │
│  │                                                    │ │
│  │  📊 23 posts similaires cette semaine             │ │
│  │                                                    │ │
│  │  💡 Solution: "CV Tracker Pro"                    │ │
│  │     Notifie quand ton CV est ouvert par un        │ │
│  │     recruteur. Analytics détaillés.               │ │
│  │                                                    │ │
│  │  📈 Market: Medium | 💰 ~$3k-$5k MRR               │ │
│  │  🚀 First Channel: Reddit ads (r/recruitinghell)  │ │
│  │  🛠️ Stack: Next.js + Supabase + Resend           │ │
│  │                                                    │ │
│  │  [Button: Copier Blueprint] [Button: Partager]    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │  [Badge: 72]  Problem: ...                        │ │
│  │  ... (card suivante)                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  ... (8 autres cards)                                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Spécifications détaillées de la Card "Opportunity Blueprint" :**
- **Layout** : Grid avec zones définies (Bento Grid style)
- **Top-Left** : Badge score circulaire 64px, anneau de progression coloré selon score (80-100: vert, 50-79: orange, 0-49: gris)
- **Top-Right** : Bouton "Share to X" minimaliste (icône seule, hover reveal text)
- **Centre** : 
  - Titre Problème : `text-xl`, `font-bold`, `text-primary`
  - Résumé IA : `text-base`, `font-italic`, `text-secondary`, max 2 lignes
- **Bottom Bento Row** : 3 petites cases côte à côte
  1. **Market Size** : Badge coloré ("Huge" = vert, "Medium" = orange, "Niche" = gris)
  2. **Difficulty** : Barre d'étoiles 1-5 (⭐️⭐️⭐️⭐️☆)
  3. **Revenue Pot.** : Estimation $ (ex: "$3k-$5k MRR")
- **Actions** : 2 boutons (secondary style), alignés à droite
- **Animation** : Stagger entrance (apparition une par une, 0.1s delay)
- **Hover** : Border glow subtil, légère élévation

#### Empty State
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  🔍 Aucun pain point trouvé                              │
│                                                           │
│  Essaie une autre niche ou vérifie plus tard.          │
│                                                           │
│  [Button: Nouvelle Recherche]                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Page 3 : Share Page (`/share/[id]`)

#### Share Card Preview
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  🎉 Ton Gold Card est prête !                            │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Preview de l'OG Image]                        │   │
│  │  (Format 16:9, style terminal moderne)          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  [Button: Télécharger] [Button: Partager sur X]         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Micro-interactions & Animations

### 1. Landing Page
- **Hero Title** : Fade in + slide up (0.6s delay)
- **Input Field** : Focus glow (accent-reddit)
- **CTA Button** : Hover scale(1.02) + glow
- **Preset Buttons** : Hover border accent + glow

### 2. Loading State "Terminal Logic"
- **Terminal Tasks** : Liste de tâches avec checkmarks animées (style Raycast)
  - Format: `[OK]` ou `[✓]` pour terminé, `[⏳]` pour en cours
  - Police: `font-mono`, couleur `text-terminal` (#00FF41)
  - Animation: Checkmark apparaît avec fade-in quand tâche complète
- **Progress Bar** : Animation de remplissage (0-100%) avec pourcentage
- **Typewriter Effect** : Texte qui s'écrit progressivement pour chaque ligne

### 3. Results Page
- **Cards Entrance** : Stagger animation (chaque card apparaît avec 0.1s delay)
  - Animation: slide up + fade in
  - Duration: 0.4s per card
- **Badge Score** : Compteur animé (0 → score final, 1s duration) + anneau de progression
- **Card Hover** : Border glow (glass-border devient accent-reddit) + légère élévation
- **Bento Grid Bottom** : Les 3 cases (Market/Difficulty/Revenue) apparaissent avec stagger
- **Button Actions** : Hover scale(1.05) + glow effect

### 4. Transitions Globales
- **Page Transitions** : Fade (0.2s)
- **Route Changes** : Smooth scroll to top

---

## 📐 Responsive Design

### Breakpoints
```css
--mobile: 640px
--tablet: 768px
--desktop: 1024px
--wide: 1280px
```

### Mobile (< 640px)
- Hero title: `text-2xl` (au lieu de 4xl)
- Input: Full width, padding réduit
- Cards: Stack vertical, badge en haut
- Preset buttons: 2 colonnes

### Tablet (640px - 1024px)
- Hero title: `text-3xl`
- Cards: 1 colonne, badge à gauche
- Preset buttons: 3 colonnes

### Desktop (> 1024px)
- Hero title: `text-4xl`
- Cards: Full width avec badge à gauche
- Preset buttons: 5 en ligne
- Container: max-width 1280px, centré

---

# PARTIE 2 : TECHNIQUE

## 🏗️ Architecture Technique

### Stack Complet
```
Frontend:
  - Next.js 15 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - shadcn/ui (composants)
  - Framer Motion (animations)
  - @vercel/og (OG images)

Backend:
  - Next.js API Routes (uniquement)
  - Vercel AI SDK (OpenAI/Claude)
  - Upstash Redis (cache + rate limiting)
  - Supabase (base de données principale)

APIs Externes:
  - Reddit API (JSON)
  - OpenAI API (GPT-4o-mini)
```

### Structure des Dossiers
```
/app
  /(routes)
    /page.tsx                    # Landing page
    /results
      /[niche]
        /page.tsx                # Results page
    /share
      /[id]
        /page.tsx                # Share page
  /api
    /analyze
      /route.ts                  # POST: Scan Reddit + Analyse
    /og
      /[niche]
        /route.tsx               # GET: OG Image dynamique
    /share
      /[id]
        /route.ts                # GET: Share data
  /components
    /ui                          # shadcn/ui components
    /landing
      /Hero.tsx
      /NicheInput.tsx
      /PresetButtons.tsx
    /results
      /ResultsHeader.tsx
      /PainPointCard.tsx
      /LoadingState.tsx
    /shared
      /GoldScoreBadge.tsx
      /ShareButton.tsx
  /lib
    /reddit.ts                   # Reddit API client
    /llm.ts                      # LLM prompts & calls
    /scoring.ts                  # Gold Score calculation
    /cache.ts                    # Redis cache helpers
    /rate-limit.ts               # Rate limiting
    /supabase.ts                 # Supabase client (base de données principale)
  /types
    /index.ts                    # TypeScript types
```

---

## 🔌 APIs & Routes

### 1. POST `/api/analyze`

**Endpoint** : `POST /api/analyze`

**Request Body** :
```typescript
{
  niche: string;  // Ex: "Recrutement", "Notion"
}
```

**Response** :
```typescript
{
  niche: string;
  scannedAt: string;  // ISO timestamp
  totalPosts: number;
  pains: Array<{
    id: string;
    title: string;
    selftext: string;
    subreddit: string;
    goldScore: number;  // 0-100
    postsCount: number;  // Nombre de posts similaires
    blueprint: {
      problem: string;
      solutionName: string;
      solutionPitch: string;
      marketSize: "Small" | "Medium" | "Large";
      firstChannel: string;
      mrrEstimate: string;
      techStack: string;
    };
  }>;
}
```

**Flow Technique** :
```typescript
1. Check rate limit (5 req/IP/heure via Upstash)
2. Check cache (1h TTL, key: `scan:${niche}`)
3. If cached → return cached data
4. Fetch Reddit posts (3 subreddits, last 7 days)
5. Quick filter (Regex patterns)
6. Calculate Gold Score
7. Sort by score, take top 20
8. LLM batch analysis (filter real opportunities)
9. Generate blueprints (top 10, parallel LLM calls)
10. Cache results
11. Return JSON
```

**Code Structure** :
```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { fetchRedditPosts } from '@/lib/reddit';
import { quickFilter } from '@/lib/scoring';
import { calculateGoldScore } from '@/lib/scoring';
import { batchLLMAnalysis } from '@/lib/llm';
import { generateBlueprint } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { niche } = await request.json();
    
    // 1. Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 5 scans per hour.' },
        { status: 429 }
      );
    }
    
    // 2. Check cache
    const cacheKey = `scan:${niche.toLowerCase()}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
    
    // 3. Fetch Reddit
    const subreddits = getSubredditsForNiche(niche);
    const posts = await Promise.all(
      subreddits.map(sub => fetchRedditPosts(sub, 'week'))
    ).then(results => results.flat());
    
    // 4. Quick filter
    const filtered = posts.filter(quickFilter);
    
    // 5. Score & sort
    const scored = filtered
      .map(post => ({
        ...post,
        goldScore: calculateGoldScore(post)
      }))
      .sort((a, b) => b.goldScore - a.goldScore)
      .slice(0, 20);  // Top 20 for LLM analysis
    
    // 6. LLM batch analysis
    const llmFiltered = await batchLLMAnalysis(scored);
    
    // 7. Generate blueprints (top 10)
    const top10 = llmFiltered.slice(0, 10);
    const pains = await Promise.all(
      top10.map(async (post, index) => ({
        id: `pain-${index}`,
        title: post.title,
        selftext: post.selftext || '',
        subreddit: post.subreddit,
        goldScore: Math.round(post.goldScore),
        postsCount: post.similarPostsCount || 1,
        blueprint: await generateBlueprint(post)
      }))
    );
    
    // 8. Cache results
    const result = {
      niche,
      scannedAt: new Date().toISOString(),
      totalPosts: posts.length,
      pains
    };
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. GET `/api/og/[niche]` (OG Image Dynamique)

**Endpoint** : `GET /api/og/[niche]?pain=0&score=87`

**Response** : Image (PNG, 1200x630px)

**Design "High-End"** : Fond noir pur, titre du pain point en gros au centre, en bas à droite : "Analyzed by Reddit Goldmine AI"

**Code Structure** :
```typescript
// app/api/og/[niche]/route.tsx
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { niche: string } }
) {
  const { searchParams } = new URL(request.url);
  const pain = searchParams.get('pain') || 'Opportunity';
  const score = searchParams.get('score') || '0';
  const niche = params.niche;
  
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000', // Canvas pur
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '60px',
            fontSize: '24px',
            color: '#FF4500',
          }}
        >
          🔥 TOP OPPORTUNITY
        </div>
        
        {/* Main Title */}
        <div
          style={{
            fontSize: '56px',
            color: '#E5E5E5',
            marginBottom: '30px',
            textAlign: 'center',
            maxWidth: '900px',
            fontWeight: 'bold',
          }}
        >
          {pain}
        </div>
        
        {/* Score Badge */}
        <div
          style={{
            fontSize: '96px',
            color: score >= 80 ? '#00FF41' : score >= 50 ? '#F59E0B' : '#6B7280',
            fontWeight: 'bold',
            marginBottom: '40px',
          }}
        >
          Gold Score: {score}/100
        </div>
        
        {/* Bottom Right Attribution */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '18px',
            color: '#6B7280',
          }}
        >
          Analyzed by Reddit Goldmine AI
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

---

## 🛠️ Spécifications Techniques Détaillées

### 3.1 Algorithme du "Gold Score" (Scientifique & Data-Backed)

Le score doit être perçu comme scientifique. Utilise cette formule pour la pondération :

**Formule complète :**
```typescript
Gold Score = Base Score × LLM_Relevance × Context Bonus

Où:
- Base Score = (Engagement × Recency) / 10
  - Engagement = (upvotes × 1.5) + (comments × 2.5)
  - Recency = max(1, 168 - ageInHours) // Bonus si < 7 jours
  
- LLM_Relevance = Multiplicateur de 0.5 à 1.5
  - 1.5 = Problème très monétisable, demande claire
  - 1.0 = Problème valide mais générique
  - 0.5 = Problème peu monétisable ou déjà résolu
  
- Context Bonus = 1.2 si selftext.length > 100
  - Plus de contexte = meilleure compréhension du problème

Final Score = min(100, round(Gold Score))
```

**Intégration dans le flow :**
1. Calcul du Base Score après quick filter
2. LLM batch analysis retourne un `relevanceScore` (0.5-1.5) pour chaque post
3. Application du multiplicateur au Base Score
4. Tri final par Gold Score

---

## 📚 Libraries & Utilitaires

### 1. Reddit API Client (`lib/reddit.ts`)

```typescript
// lib/reddit.ts
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
  const url = `${REDDIT_BASE}/r/${subreddit}/search.json?q=I+wish+OR+looking+for+OR+need+a+tool&sort=relevance&t=${timeFilter}&limit=100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditGoldmine/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
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
    'recrutement': ['recruitinghell', 'jobs', 'careerguidance'],
    'notion': ['Notion', 'productivity', 'selfhosted'],
    'fitness': ['fitness', 'bodyweightfitness', 'nutrition'],
    'saas': ['SaaS', 'microsaas', 'startups'],
    'devtools': ['webdev', 'programming', 'SideProject']
  };
  
  return mapping[niche.toLowerCase()] || ['all'];
}
```

### 2. Scoring System (`lib/scoring.ts`)

```typescript
// lib/scoring.ts
import { RedditPost } from './reddit';

export function quickFilter(post: RedditPost): boolean {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  
  const businessPatterns = [
    /(need|want|looking for) (a|an) (tool|app|software|saas|solution|platform)/i,
    /(wish|hate|frustrated) (that|when|because) .{20,}/i,
    /(problem|issue|pain) (with|in) .{10,}/i,
    /is there (a|an) (tool|app|way) (to|for)/i,
    /how do i (track|manage|automate|find)/i
  ];
  
  return businessPatterns.some(pattern => pattern.test(text));
}

export function calculateGoldScore(post: RedditPost, llmRelevance?: number): number {
  const engagement = (post.score * 1.5) + (post.num_comments * 2.5);
  const ageInHours = (Date.now() / 1000 - post.created_utc) / 3600;
  const recency = Math.max(1, 168 - ageInHours); // Bonus si < 7 jours
  
  // Score de base
  let score = (engagement * recency) / 10;
  
  // Bonus pour longueur (plus de contexte = mieux)
  if (post.selftext.length > 100) {
    score *= 1.2;
  }
  
  // Multiplicateur LLM Relevance (0.5 à 1.5 selon monétisabilité)
  // Si LLM a analysé le post, appliquer le multiplicateur
  if (llmRelevance !== undefined) {
    score *= llmRelevance;
  }
  
  // Cap à 100
  return Math.min(100, Math.round(score));
}
```

### 3. LLM Integration (`lib/llm.ts`)

```typescript
// lib/llm.ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { RedditPost } from './reddit';

export interface LLMAnalysis {
  isOpportunity: boolean;
  reason: string;
  intensity: 'high' | 'medium' | 'low';
}

export async function batchLLMAnalysis(
  posts: RedditPost[]
): Promise<Array<RedditPost & { isOpportunity: boolean }>> {
  const prompt = `Analyse ces posts Reddit et identifie ceux qui sont de VRAIES opportunités business (pas juste des plaintes).

Posts:
${posts.map((p, i) => `${i}. "${p.title}"`).join('\n')}

Réponds en JSON:
[
  {"index": 0, "isOpportunity": true, "intensity": "high"},
  {"index": 1, "isOpportunity": false, "reason": "..."},
  ...
]`;

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(text) as Array<{
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
    // Fallback: return all posts
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
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.7,
    });
    
    return JSON.parse(text);
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
```

### 4. Supabase Client (`lib/supabase.ts`)

**Supabase est la base de données principale** du projet (PostgreSQL hébergé).

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Pour les opérations serveur
);

// Tables principales (schéma Supabase) :
// - reddit_analyses : Cache des analyses Reddit (niche, scannedAt, totalPosts, pains JSONB)
// - blueprints : Blueprints générés par IA (id, painPointId, solutionName, pitch, etc.)
// - logs : Logs d'activité (event, niche, duration, timestamp)
```

### 5. Cache & Rate Limiting (`lib/cache.ts`, `lib/rate-limit.ts`)

**Note importante** : 
- **Upstash Redis** : Utilisé uniquement pour le cache temporaire (1h TTL) et le rate limiting
- **Supabase** : Base de données principale pour stocker les résultats d'analyse, les logs, et les données persistantes

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 req/heure
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return {
    allowed: success,
    limit,
    remaining,
    reset
  };
}
```

---

## 🗄️ Types TypeScript

```typescript
// types/index.ts
export interface PainPoint {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  goldScore: number;
  postsCount: number;
  blueprint: Blueprint;
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

export interface AnalyzeResponse {
  niche: string;
  scannedAt: string;
  totalPosts: number;
  pains: PainPoint[];
}
```

---

## 🔐 Variables d'Environnement

```env
# .env.local
# Reddit (pas besoin d'API key pour search public)
# Utiliser User-Agent dans les headers

# OpenAI
OPENAI_API_KEY=sk-...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Supabase (base de données principale)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Pour les opérations serveur

# App
NEXT_PUBLIC_APP_URL=https://...
```

---

## 🚀 Deployment Checklist

### Vercel Setup
1. Connecter le repo GitHub
2. Ajouter les variables d'environnement
3. Deploy automatique sur push

### Optimisations
- [ ] ISR pour les résultats (revalidate: 3600)
- [ ] Edge runtime pour les API routes
- [ ] Compression des images OG
- [ ] Monitoring (Vercel Analytics)

---

## 📊 Métriques & Monitoring

### Métriques à Tracker
- Temps de scan moyen (< 10s target)
- Taux de succès des scans
- Nombre de scans par niche
- Taux d'erreur API Reddit
- Coût LLM par scan

### Logging
```typescript
// Log chaque scan
console.log(JSON.stringify({
  event: 'scan_completed',
  niche,
  duration: Date.now() - startTime,
  postsFound: posts.length,
  painsGenerated: pains.length
}));
```

---

## ⚠️ Gestion d'Erreurs

### Scénarios d'Erreur
1. **Reddit API down** : Retourner message d'erreur clair
2. **LLM timeout** : Fallback sur résultats sans blueprint
3. **Rate limit** : Message clair + countdown
4. **Cache miss** : Proceed avec scan normal

### Error Boundaries
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## ✅ Checklist Finale (48h) - Roadmap Mobbin-Style

### Heures 0-12h : Data Engine
- [ ] Setup Next.js + Tailwind + shadcn/ui
- [ ] Reddit API integration
- [ ] Quick filter + Gold Score (avec LLM Relevance multiplier)
- [ ] Cache setup (Upstash Redis)

### Heures 12-24h : Core UI
- [ ] Design system "Deep Night" (palette complète)
- [ ] Landing page "Minimalist Search" (Input Floating + Bento Grid presets)
- [ ] Results page structure (Cards Bento Grid style)
- [ ] Loading state "Terminal Logic" (checkmarks animées)

### Heures 24-36h : The "Wow"
- [ ] LLM integration (batch analysis + blueprints)
- [ ] Animations Framer Motion (stagger, terminal typing)
- [ ] Opportunity Cards complètes (Market/Difficulty/Revenue)
- [ ] Glassmorphism effects (Linear style)

### Heures 36-48h : Viral Loop
- [ ] OG Image generator dynamique (@vercel/og)
- [ ] Share functionality (Twitter/X)
- [ ] Rate limiting
- [ ] Error handling
- [ ] Polish & testing
- [ ] Deployment Vercel
- [ ] Post X de lancement préparé

---

**Fin du PRD**

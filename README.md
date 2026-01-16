# Unearth

Unearth is a production-ready platform that automatically scans Reddit and other social media platforms to identify validated SaaS opportunities and generate ready-to-launch micro-SaaS blueprints.

## Overview

Unearth helps entrepreneurs and developers discover profitable SaaS ideas by analyzing Reddit posts for pain points, requests for alternatives, and validated needs. The platform uses AI to generate comprehensive blueprints including solution names, market analysis, tech stack recommendations, and revenue estimates.

## Features

- **Reddit Analysis**: Scans multiple subreddits to find pain points and business opportunities
- **AI-Powered Blueprints**: Generates detailed SaaS blueprints with solution names, market size, and tech stack recommendations
- **Gold Score System**: Ranks opportunities based on engagement, relevance, and market potential
- **User Authentication**: Secure authentication with Supabase
- **Dashboard**: View and manage your saved analyses
- **Favorites System**: Save and organize your favorite pain points
- **Sharing**: Share analysis results with shareable links and OG images
- **Rate Limiting**: Per-user rate limiting to manage API costs
- **Caching**: Redis-based caching for improved performance
- **Subscription Plans**: Free and Pro plans with Polar.sh integration

## Tech Stack

### Frontend
- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Animation library
- **TanStack Query** - Server state management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Database and authentication
- **Vercel AI SDK** - AI integration with Google Gemini
- **Upstash Redis** - Caching and rate limiting

### External Services
- **Google Gemini** - AI model for blueprint generation
- **Reddit API** - Post fetching
- **Serper API** - Search result enrichment
- **RapidAPI** - Additional Reddit data sources
- **Polar.sh** - Subscription management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google AI Studio API key (for Gemini)
- (Optional) Upstash Redis account
- (Optional) Serper API key
- (Optional) RapidAPI key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd challenge-tmaker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Redis (Optional)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Serper API (Optional)
SERPER_DEV_API_KEY=your_serper_key

# RapidAPI (Optional)
RAPID_API_KEY=your_rapidapi_key

# Polar.sh (Optional, for subscriptions)
POLAR_ACCESS_TOKEN=your_polar_token
POLAR_WEBHOOK_SECRET=your_webhook_secret
UNEARTH_MONTHLY_PLAN=your_plan_variant_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:
Run the Supabase migrations:
```bash
supabase db push
```

Or manually execute the SQL files in `supabase/migrations/`:
- `001_initial_schema.sql` - Creates reddit_analyses and scan_logs tables
- `002_add_favorites.sql` - Creates favorites table
- `003_add_polar_subscriptions.sql` - Creates polar_subscriptions table

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api
    /analyze              # Analysis API endpoints
    /dashboard            # Dashboard data endpoints
    /favorites            # Favorites management
    /og                   # OG image generation
    /polar                # Polar.sh webhooks
    /share                # Share link endpoints
    /stats                # Statistics endpoints
  /dashboard              # User dashboard page
  /login                  # Login page
  /signup                 # Signup page
  /results/[niche]        # Results display page
  /share/[id]             # Shared analysis page
  /pricing                # Pricing page
  /settings               # User settings
  /page.tsx               # Landing page
  /layout.tsx             # Root layout
  /providers.tsx          # React providers
  /globals.css            # Global styles

/components
  /auth                   # Authentication components
  /results                # Results display components
  /shared                 # Shared components
  /ui                     # shadcn/ui components
  Header.tsx              # Site header
  SearchBar.tsx           # Search functionality
  NicheSuggestions.tsx    # Niche selection UI
  Footer.tsx              # Site footer

/lib
  /supabase.ts            # Supabase client
  /supabase-server.ts     # Server-side Supabase
  /llm.ts                 # AI blueprint generation
  /reddit.ts              # Reddit API integration
  /serper.ts              # Serper API integration
  /rapidapi-reddit.ts     # RapidAPI integration
  /scoring.ts             # Gold score calculation
  /cache.ts               # Redis caching
  /rate-limit.ts          # Rate limiting logic
  /polar.ts               # Polar.sh integration
  /utils.ts               # Utility functions

/supabase
  /migrations              # Database migrations
```

## API Endpoints

### Analysis
- `POST /api/analyze` - Create a new analysis for a niche
- `GET /api/analyze/[niche]` - Get existing analysis by niche
- `GET /api/analyze/id/[id]` - Get analysis by ID

### Dashboard
- `GET /api/dashboard/analyses` - Get user's saved analyses
- `GET /api/stats` - Get user statistics

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add a favorite
- `DELETE /api/favorites` - Remove a favorite

### Sharing
- `GET /api/share/[id]` - Get shared analysis data
- `GET /api/og/[niche]` - Generate OG image for sharing

### Payments
- `POST /api/polar/checkout` - Create checkout session
- `POST /api/polar/webhook` - Handle Polar.sh webhooks

## Configuration

### Rate Limiting

The application implements rate limiting to manage API costs:
- Free plan: 3 scans per hour
- Pro plan: 5 scans per hour
- IP whitelisting available for testing

Rate limits are configured in `lib/rate-limit.ts`.

### Caching

Redis caching is used to:
- Cache analysis results (15-minute TTL)
- Store rate limit counters
- Improve response times

If Redis is not configured, the app will work without caching.

### AI Configuration

The application uses Google Gemini for:
- Filtering relevant posts
- Generating SaaS blueprints
- Scoring opportunities

Configure your API key in `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY`.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

See `DEPLOYMENT.md` for detailed deployment instructions.

### Database Migrations

Make sure to run migrations on your production database:
```bash
supabase db push
```

## Development

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Design System

The application uses a custom "Deep Night" design system with:
- Dark theme color palette (HSL)
- Glassmorphism effects
- Smooth animations and transitions
- Responsive design

Styles are defined in `app/globals.css` and use Tailwind CSS utilities.

## License

MIT

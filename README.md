# Reddit Goldmine

Mini-tool production-ready pour trouver des idées SaaS validées par Reddit en 10 secondes.

## Stack

- **Next.js 15** (App Router) - Framework principal
- **TypeScript** - Typage statique
- **Tailwind CSS** - Design system "Deep Night" avec glassmorphism
- **shadcn/ui** - Composants UI
- **Framer Motion** - Animations
- **TanStack Query** - Gestion d'état serveur
- **Supabase** - Base de données (à configurer)
- **Vercel AI SDK** - Génération de blueprints IA (à configurer)
- **Upstash Redis** - Cache et rate limiting (à configurer)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure

```
/app
  /page.tsx                    # Landing page
  /layout.tsx                  # Layout root avec providers
  /providers.tsx               # Providers (QueryClient, Toaster, etc.)
  /globals.css                 # Design system CSS
  /not-found.tsx              # Page 404
/components
  /ui                          # Composants shadcn/ui
  /Header.tsx                  # Header avec navigation
  /SearchBar.tsx               # Barre de recherche floating
  /NicheSuggestions.tsx        # Suggestions de niches
  /Logo.tsx                    # Logo
  /LiveBadge.tsx               # Badge Live avec stats
/lib
  /utils.ts                    # Utilitaires (cn, etc.)
```

## Design System

Le design system "Deep Night" est défini dans `app/globals.css` avec :
- Palette de couleurs dark theme (HSL)
- Effets glassmorphism (Linear inspired)
- Gradients et glows
- Animations (fade-in, stagger, pulse)

## Prochaines étapes

1. Créer la page `/results/[niche]` pour afficher les résultats
2. Implémenter l'API `/api/analyze` pour scanner Reddit
3. Configurer Supabase pour la base de données
4. Configurer Vercel AI SDK pour les blueprints
5. Configurer Upstash Redis pour le cache

## License

MIT

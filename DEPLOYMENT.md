# Guide de Déploiement - Unearth

## Déploiement sur Vercel

### ✅ Intégration GitHub Native (Recommandé - Plus Simple)

Vercel se connecte directement à votre repository GitHub et déploie automatiquement :
- **Push sur `main`** → Déploiement en **Production** 🚀
- **Push sur `dev`** (ou toute autre branche) → Déploiement en **Preview** 🔍

#### Étapes de configuration :

1. **Connecter le repository**
   - Va sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique sur "Add New Project"
   - Importe ton repository GitHub
   - Vercel détectera automatiquement Next.js 15

2. **Configuration automatique**
   - Framework Preset : Next.js (détecté automatiquement)
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)
   - Install Command : `npm install` (par défaut)

3. **Configuration des branches**
   - **Production** : `main` ou `master` (configuré automatiquement)
   - **Preview** : Toutes les autres branches (dont `dev`) - configuré automatiquement
   
   > 💡 **Note** : Une fois connecté, chaque push sur `dev` ou `main` déclenchera automatiquement un déploiement. Aucune configuration supplémentaire n'est nécessaire !

4. **Variables d'environnement**
   - Va dans `Settings > Environment Variables`
   - Ajoute les variables pour chaque environnement :
     - **Production** : Variables pour la prod (utilisées pour `main`)
     - **Preview** : Variables pour les previews (utilisées pour `dev` et autres branches)
     - **Development** : Variables pour le dev local (optionnel)

## Variables d'environnement requises

### Pour tous les environnements

```env
# Gemini (pour les blueprints IA)
# IMPORTANT: @ai-sdk/google lit GOOGLE_GENERATIVE_AI_API_KEY par défaut
# Le code supporte aussi GEMINI_API_KEY et le convertit automatiquement
GOOGLE_GENERATIVE_AI_API_KEY=...
# OU (sera automatiquement converti en GOOGLE_GENERATIVE_AI_API_KEY)
GEMINI_API_KEY=...

# Serper API (optionnel - pour enrichir les données Reddit via Google)
# Quota: 2500 requêtes/mois - Limité à 3-5 requêtes par utilisateur
SERPER_DEV_API_KEY=...

# RapidAPI Reddit (optionnel - pour enrichir les données Reddit)
# Quota: 50 requêtes/mois - TRÈS LIMITÉ - Limité à 1-2 requêtes par utilisateur/jour
# APIs utilisées:
# - reddit3: Recherche de posts Reddit (prioritaire)
# - reddit34: Métadonnées des subreddits (uniquement premium)
# Free: 1 requête/jour (recherche uniquement)
# Premium: 2 requêtes/jour (recherche + métadonnées)
RAPID_API_KEY=...

# Upstash Redis (cache + rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Supabase (base de données)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App URL
NEXT_PUBLIC_APP_URL=https://unearth.vercel.app

# Reddit User-Agent (optionnel - format recommandé: 'AppName/Version by Username')
# Par défaut: 'Unearth/1.0 by unearth-app'
# Important pour éviter les blocages Reddit - voir: https://www.reddit.com/r/redditdev/wiki/api
REDDIT_USER_AGENT=Unearth/1.0 by unearth-app

# IP Whitelist (optionnel - pour bypasser le rate limit lors des tests)
# Format: IPv4 (ex: 192.168.1.1) ou IPv6 (ex: 2001:db8::1)
IPV4_PUBLIC_TESTING=...
IPV6_PUBLIC_TESTING=...
```

### Configuration par environnement

Dans Vercel, configure les variables pour chaque environnement :

- **Production** : Utilise les vraies clés de production
- **Preview** : Peut utiliser des clés de staging/test
- **Development** : Variables locales (`.env.local`)

## Commandes de déploiement manuel

### Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer en preview
vercel

# Déployer en production
vercel --prod
```

### Déploiements automatiques via GitHub

Avec l'intégration native Vercel, les déploiements se déclenchent automatiquement :
- **Push sur `dev`** → Déploiement Preview (URL unique par commit)
- **Push sur `main`** → Déploiement Production (URL principale)

Vercel gère tout automatiquement via l'intégration GitHub.

## Vérification du déploiement

1. **Vérifier les logs**
   - Dans Vercel Dashboard > Deployments
   - Clique sur un déploiement pour voir les logs

2. **Tester l'application**
   - Preview : URL unique générée pour chaque PR/branch
   - Production : URL principale du projet

3. **Vérifier les erreurs**
   - Vercel Dashboard > Functions > Logs
   - Vérifier que les API routes fonctionnent

## Troubleshooting

### Erreur : "Module not found"
- Vérifier que toutes les dépendances sont dans `package.json`
- Relancer `npm install` localement

### Erreur : "Environment variables missing"
- Vérifier que toutes les variables sont configurées dans Vercel
- Vérifier l'environnement (Production vs Preview)

### Erreur : "Build failed"
- Vérifier les logs de build dans Vercel
- Tester le build localement : `npm run build`

## Domaine personnalisé

1. Va dans `Settings > Domains`
2. Ajoute ton domaine
3. Suis les instructions DNS

## Monitoring

- **Analytics** : Vercel Analytics (activé par défaut)
- **Logs** : Vercel Dashboard > Functions > Logs
- **Performance** : Vercel Dashboard > Analytics

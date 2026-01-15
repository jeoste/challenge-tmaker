# GitHub Actions - Déploiement Vercel

Ce dossier contient les workflows GitHub Actions pour automatiser les déploiements sur Vercel.

## Workflows

### 1. `deploy-preview.yml`
- **Déclencheur** : Push sur `dev`/`develop` ou Pull Request vers `main`/`dev`
- **Environnement** : Preview (Vercel)
- **URL** : Génère une URL de preview unique pour chaque déploiement

### 2. `deploy-production.yml`
- **Déclencheur** : Push sur `main`/`master`
- **Environnement** : Production (Vercel)
- **URL** : Déploie sur le domaine de production

## Configuration requise

### Secrets GitHub à configurer

Dans les paramètres de ton repository GitHub (`Settings > Secrets and variables > Actions`), ajoute :

1. **`VERCEL_TOKEN`**
   - Va sur [Vercel Settings > Tokens](https://vercel.com/account/tokens)
   - Crée un nouveau token
   - Copie-le dans les secrets GitHub

2. **`VERCEL_ORG_ID`**
   - Va sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Sélectionne ton organisation
   - L'ID est dans l'URL ou dans les paramètres de l'organisation

3. **`VERCEL_PROJECT_ID`**
   - Va sur ton projet Vercel
   - L'ID est dans l'URL : `vercel.com/[org]/[project]`
   - Ou dans les paramètres du projet

### Alternative : Utiliser l'intégration GitHub native de Vercel

Si tu préfères une solution plus simple, tu peux :
1. Connecter ton repo GitHub directement dans Vercel
2. Vercel détectera automatiquement les branches et déploiera
3. Les workflows GitHub Actions ne seront alors pas nécessaires

## Utilisation

Une fois les secrets configurés :

1. **Pour preview** : Push sur `dev` → Déploiement automatique en preview
2. **Pour production** : Merge sur `main` → Déploiement automatique en production

## Variables d'environnement

Assure-toi d'avoir configuré les variables d'environnement dans Vercel :
- Pour Preview : `Settings > Environment Variables` (sélectionne "Preview")
- Pour Production : `Settings > Environment Variables` (sélectionne "Production")

Variables nécessaires (selon le PRD) :
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

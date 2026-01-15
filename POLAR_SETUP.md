# Configuration Polar.sh

Ce document explique comment configurer l'intégration Polar.sh pour les paiements récurrents mensuels.

## Variables d'environnement requises

### Pour le développement local (`.env.local`)

```env
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
UNEARTH_MONTHLY_PLAN=your_monthly_plan_variant_id_here

# Optionnel: URL de base de l'application (pour les redirections)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Pour Vercel (Production)

1. Allez dans votre projet Vercel : **Settings** > **Environment Variables**
2. Ajoutez les variables suivantes pour **Production**, **Preview**, et **Development** :

```env
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
UNEARTH_MONTHLY_PLAN=your_monthly_plan_variant_id_here
NEXT_PUBLIC_APP_URL=https://challenge-tmaker-reddit-goldmine-gamma.vercel.app
```

**Note :** Pour les webhooks, Vercel expose automatiquement votre application via l'URL de déploiement. Les webhooks fonctionnent même avec les URLs de preview automatiques de Vercel.

## Étapes de configuration

### 1. Créer un compte Polar.sh

1. Allez sur [polar.sh](https://polar.sh) et créez un compte
2. Créez une organisation
3. Configurez votre compte de paiement (Stripe Connect)

### 2. Créer un produit et un plan mensuel

1. Dans le dashboard Polar.sh, allez dans **Products**
2. Créez un nouveau produit (ex: "Unearth Pro")
3. Créez une variante de prix mensuelle :
   - Prix : $19 (ou votre prix)
   - Intervalle : Monthly
   - Devise : USD (ou votre devise)
4. Copiez l'ID de la variante (variant ID) - c'est ce que vous mettrez dans `UNEARTH_MONTHLY_PLAN`

### 3. Obtenir votre Access Token

1. Dans le dashboard Polar.sh, allez dans **Settings** > **API**
2. Créez un nouveau token d'accès
3. Copiez le token - c'est ce que vous mettrez dans `POLAR_ACCESS_TOKEN`

### 4. Configurer les webhooks

**Important :** Vercel fonctionne parfaitement pour les webhooks Polar.sh. C'est même la plateforme recommandée pour Next.js.

1. Dans le dashboard Polar.sh, allez dans **Settings** > **Webhooks**
2. Ajoutez une nouvelle URL de webhook avec votre URL Vercel :
   - **Pour la production** : `https://challenge-tmaker-reddit-goldmine-gamma.vercel.app/api/polar/webhook`
   - **Pour les previews** (optionnel) : Vous pouvez créer un webhook séparé pour chaque environnement de preview si nécessaire
3. Sélectionnez les événements suivants :
   - `subscription.created` - Quand un abonnement est créé
   - `subscription.updated` - Quand un abonnement est mis à jour
   - `subscription.active` - Quand un abonnement devient actif
   - `subscription.canceled` - Quand un abonnement est annulé
   - `subscription.past_due` - Quand un paiement est en retard
   - `order.paid` - Quand une commande/facture est payée
4. Copiez le secret du webhook - c'est ce que vous mettrez dans `POLAR_WEBHOOK_SECRET` dans les variables d'environnement Vercel

**Note :** Si vous utilisez plusieurs environnements (production, preview), vous pouvez configurer plusieurs webhooks dans Polar.sh, un pour chaque environnement. Assurez-vous que chaque environnement a sa propre variable `POLAR_WEBHOOK_SECRET` configurée dans Vercel.

### 5. Appliquer la migration de base de données

Exécutez la migration pour créer la table `polar_subscriptions` :

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou exécutez manuellement la migration
# supabase/migrations/003_add_polar_subscriptions.sql
```

## Installation du SDK

Installez le SDK Polar.sh :

```bash
npm install @polar-sh/sdk
```

## Test de l'intégration

1. Assurez-vous que toutes les variables d'environnement sont configurées
2. Démarrez votre application en développement
3. Connectez-vous à votre application
4. Allez sur la page `/pricing`
5. Cliquez sur le bouton "Subscribe now" du plan Pro
6. Vous devriez être redirigé vers la page de checkout Polar.sh

## Mode Sandbox

Pour tester sans utiliser de vraies cartes de crédit :

1. Utilisez le mode sandbox de Polar.sh
2. Utilisez les cartes de test fournies par Polar.sh
3. Les webhooks sandbox seront envoyés à votre URL de webhook

## Gestion des abonnements

Les abonnements sont automatiquement synchronisés via les webhooks. Le statut de l'abonnement est vérifié dans la fonction `getUserPlan()` qui :

1. Vérifie d'abord les abonnements actifs dans la table `polar_subscriptions`
2. Vérifie ensuite les métadonnées utilisateur comme fallback

## Dépannage

### Le checkout ne se crée pas

- Vérifiez que `POLAR_ACCESS_TOKEN` est correct
- Vérifiez que `UNEARTH_MONTHLY_PLAN` contient un ID de variante valide
- Vérifiez les logs du serveur pour les erreurs

### Les webhooks ne fonctionnent pas

- Vérifiez que `POLAR_WEBHOOK_SECRET` est correct
- Vérifiez que l'URL du webhook est accessible publiquement
- Vérifiez les logs du serveur pour les erreurs de signature

### L'utilisateur n'a pas accès premium après paiement

- Vérifiez que le webhook a bien été reçu et traité
- Vérifiez la table `polar_subscriptions` pour voir si l'abonnement a été créé
- Vérifiez les logs du webhook pour les erreurs

## Support

Pour plus d'informations, consultez la [documentation Polar.sh](https://polar.sh/docs).

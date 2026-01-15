# Configuration Polar.sh avec Vercel - Guide Rapide

## URL de votre application

Votre application est déployée sur : **https://challenge-tmaker-reddit-goldmine-gamma.vercel.app**

## Configuration des webhooks dans Polar.sh

### Étape 1 : Accéder aux paramètres de webhooks

1. Connectez-vous à votre dashboard Polar.sh
2. Allez dans **Settings** (Paramètres) > **Webhooks**

### Étape 2 : Ajouter l'URL du webhook

Dans le champ **Webhook URL**, entrez :

```
https://challenge-tmaker-reddit-goldmine-gamma.vercel.app/api/polar/webhook
```

### Étape 3 : Sélectionner les événements

Cochez les événements suivants que vous souhaitez recevoir :

- ✅ `subscription.created` - Quand un abonnement est créé
- ✅ `subscription.updated` - Quand un abonnement est mis à jour
- ✅ `subscription.active` - Quand un abonnement devient actif
- ✅ `subscription.canceled` - Quand un abonnement est annulé
- ✅ `subscription.past_due` - Quand un paiement est en retard
- ✅ `order.paid` - Quand une commande/facture est payée

### Étape 4 : Copier le secret du webhook

Après avoir créé le webhook, Polar.sh vous donnera un **Webhook Secret**. Copiez-le, vous en aurez besoin pour la prochaine étape.

## Configuration dans Vercel

### Étape 1 : Ajouter les variables d'environnement

1. Allez sur [vercel.com](https://vercel.com) et ouvrez votre projet
2. Allez dans **Settings** > **Environment Variables**
3. Ajoutez les variables suivantes :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `POLAR_ACCESS_TOKEN` | Votre token d'accès Polar.sh | Production, Preview, Development |
| `POLAR_WEBHOOK_SECRET` | Le secret du webhook copié précédemment | Production, Preview, Development |
| `UNEARTH_MONTHLY_PLAN` | L'ID de votre plan mensuel (variant ID) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://challenge-tmaker-reddit-goldmine-gamma.vercel.app` | Production uniquement |

### Étape 2 : Redéployer l'application

Après avoir ajouté les variables d'environnement, Vercel vous proposera de redéployer. Cliquez sur **Redeploy** pour que les nouvelles variables soient prises en compte.

## Tester les webhooks

### Option 1 : Utiliser le mode test de Polar.sh

1. Dans le dashboard Polar.sh, allez dans **Settings** > **Webhooks**
2. Cliquez sur votre webhook
3. Utilisez le bouton **Send test event** pour envoyer un événement de test

### Option 2 : Créer un abonnement de test

1. Créez un abonnement de test via votre application
2. Vérifiez les logs Vercel pour voir si le webhook a été reçu
3. Vérifiez votre base de données Supabase pour voir si l'abonnement a été créé dans la table `polar_subscriptions`

## Vérifier que ça fonctionne

### Dans Vercel

1. Allez dans **Deployments** > Sélectionnez votre dernier déploiement
2. Cliquez sur **Functions** > `api/polar/webhook`
3. Vérifiez les logs pour voir les requêtes entrantes

### Dans Supabase

1. Allez dans votre dashboard Supabase
2. Ouvrez l'éditeur SQL
3. Exécutez cette requête pour voir les abonnements :

```sql
SELECT * FROM polar_subscriptions ORDER BY created_at DESC;
```

## Gestion des environnements multiples

Si vous avez plusieurs environnements (production, preview, développement) :

### Production
- URL webhook : `https://challenge-tmaker-reddit-goldmine-gamma.vercel.app/api/polar/webhook`
- Utilisez les variables d'environnement de **Production** dans Vercel

### Preview (branches)
- Polar.sh peut envoyer des webhooks vers les URLs de preview
- Vous pouvez créer un webhook séparé dans Polar.sh pour chaque environnement de preview si nécessaire
- Ou utiliser le même webhook et filtrer par domaine dans votre code

### Développement local
- Pour tester localement, utilisez un outil comme [ngrok](https://ngrok.com) pour exposer votre localhost
- Créez un webhook de test dans Polar.sh pointant vers votre URL ngrok

## Dépannage

### Le webhook ne fonctionne pas

1. **Vérifiez l'URL** : Assurez-vous que l'URL dans Polar.sh correspond exactement à votre URL Vercel
2. **Vérifiez les variables d'environnement** : Assurez-vous que `POLAR_WEBHOOK_SECRET` est correct dans Vercel
3. **Vérifiez les logs Vercel** : Regardez les logs de la fonction `api/polar/webhook` pour voir les erreurs
4. **Vérifiez la signature** : Le webhook vérifie la signature, assurez-vous que le secret correspond

### Erreur "Invalid signature"

- Vérifiez que `POLAR_WEBHOOK_SECRET` dans Vercel correspond exactement au secret dans Polar.sh
- Les secrets sont sensibles à la casse et aux espaces

### Le webhook fonctionne mais l'abonnement n'est pas créé

- Vérifiez que la migration `003_add_polar_subscriptions.sql` a été appliquée dans Supabase
- Vérifiez que `user_id` est présent dans les métadonnées du checkout
- Vérifiez les logs du webhook pour voir les erreurs de base de données

## Support

Pour plus d'aide :
- [Documentation Polar.sh](https://polar.sh/docs)
- [Documentation Vercel](https://vercel.com/docs)
- Logs Vercel : Votre projet > Deployments > Functions

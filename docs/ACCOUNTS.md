# Comptes et droits BillPay

L’espace `/compte/` utilise un code e-mail à usage unique et Turnstile. Un compte de base ne peut pas choisir ses rôles. Les espaces protégés vérifient les droits auprès du serveur à chaque ouverture et ne disposent pas d’actions d’achat, de retrait, d’approbation ou de paiement.

| Accès | Preuve requise | Accès disponible |
| --- | --- | --- |
| Compte de base | E-mail confirmé | Voir ses statuts, associer un wallet, lire son solde BILL après raccordement officiel |
| Demandeur | Identité vérifiée par un tiers et facture du dossier vérifiée | Consulter la référence du dernier dossier vérifié |
| Gold | Wallet associé avec au moins un lot enregistré dans `CommunityLots` (acheté ou attribué) | Consulter le nombre de lots enregistrés sur Base |
| Conseil | Wallet associé figurant au registre du conseil, deuxième facteur validé | Consulter son mandat, en lecture seule |
| Fondateur | UUID d’un compte désigné via une opération administrative, deuxième facteur validé | Consulter l’état de configuration des sources publiques, sans clé de paiement ni privilège contractuel supplémentaire |

Les droits sont indépendants. Le statut Gold ne confère pas le droit de valider : `SolidarityWallet` exige un achat et au moins 30 jours d’ancienneté. À la rotation du conseil, la lecture du registre retire l’accès dès la prochaine vérification. Les statuts sont des informations de session, pas des attestations exportables.

## Activation avant production

1. Utiliser d’abord un projet Supabase de test, appliquer la migration additive et déployer `billpay-account`. Vérifier qu’un visiteur non authentifié n’obtient rien et que les rôles `anon` et `authenticated` ne lisent ni ne modifient directement les tables. La fonction valide elle-même le jeton d’accès auprès de Supabase Auth et refuse les requêtes d’une autre origine.
2. Dans Supabase Auth, activer la connexion e-mail, la confirmation d’e-mail, le MFA TOTP et [la vérification CAPTCHA Turnstile](https://supabase.com/docs/guides/auth/auth-captcha). Restreindre le widget à `billpaytoken.com` en production. Choisir un service SMTP fiable, régler les limites de débit et configurer les modèles **Confirm signup** et **Magic Link** pour afficher `{{ .Token }}` (code), pas un lien de connexion. Tester les adresses réelles autorisées en environnement de test et vérifier qu’une tentative directe sans jeton CAPTCHA est refusée avant toute ouverture.
3. Configurer explicitement `BILLPAY_ORIGIN` dans les secrets de la fonction : une seule origine HTTPS exacte, sans chemin ni barre oblique finale (`https://billpaytoken.com` uniquement pour la production). Sans origine valide, l’API reste fermée. Supabase injecte ses variables serveur par défaut. Ne mettre aucune clé d’administration, secret Turnstile ou URL RPC privée dans GitHub Variables ou dans le Hub.
4. Dans GitHub Actions, renseigner les **variables publiques** `BILLPAY_SUPABASE_URL`, `BILLPAY_SUPABASE_PUBLISHABLE_KEY` (nouveau format `sb_publishable_`), `BILLPAY_TURNSTILE_SITE_KEY`. Ne passer `BILLPAY_ACCOUNTS_ENABLED` à `true` qu’après les contrôles de l’étape 2. Relancer le workflow Pages. En l’absence des quatre paramètres, le formulaire reste fermé.
5. Pour le fondateur, faire créer son compte puis l’enrôler dans le MFA à l’aide d’un processus administratif contrôlé. Vérifier l’UUID et le facteur enrôlé avant d’insérer la seule ligne de `billpay_founder_account`. Ne jamais utiliser un nom, une adresse saisie dans le navigateur ou un wallet seul pour ce rôle. Prévoir une procédure de récupération contrôlée et documentée.

La session n’est pas stockée sur l’appareil : elle est conservée dans l’onglet pendant la navigation du Hub et une actualisation complète demande un nouveau code. Le navigateur du portefeuille ou une extension compatible EIP-1193 est requis pour l’association. Si le wallet ne signe pas sur ce navigateur, aucune autre méthode n’est tentée. Une adresse ne peut être associée qu’à un compte ; ce MVP ne permet pas le remplacement en libre-service. Les challenges expirent en cinq minutes, sont propres au compte et consommés atomiquement. Prévoir une purge des challenges expirés et une procédure de changement de wallet qui vérifie le compte et la nouvelle adresse avant toute réassociation.

## Chaîne et vérification documentaire

- Après déploiement et vérification des contrats sur Base, renseigner côté serveur `BILLPAY_BASE_RPC_URL`, `BILLPAY_TOKEN_ADDRESS`, `BILLPAY_LOTS_ADDRESS` et `BILLPAY_COUNCIL_ADDRESS`. La fonction lit le solde ERC-20 réel, les lots et le registre, sans clé privée. Un RPC erroné ou indisponible ne confirme aucun droit Gold ou Conseil. Une lecture réussie d’un solde nul est distincte d’une lecture indisponible.
- **Aucun document n’est reçu par le Hub.** Pour ouvrir la vérification demandeur, choisir un prestataire autorisé, préciser la zone de traitement et la durée de conservation, mettre en place un parcours chez ce tiers et un webhook signé avec idempotence, puis donner au service d’intégration uniquement les droits d’écriture nécessaires sur les deux tables de statuts. Les fichiers, images, factures et données brutes restent hors du Hub, de GitHub et de Base. La vérification de facture est propre à chaque dossier.
- Avant d’ajouter une action réservée à un rôle, réévaluer la preuve côté serveur au moment de l’action. Pour tout acte sur chaîne, le contrat demeure l’autorité ; la session BillPay ne remplace pas la signature du portefeuille.

Documentation : [sessions Supabase](https://supabase.com/docs/guides/auth/sessions), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [connexion sans mot de passe](https://supabase.com/docs/guides/auth/auth-email-passwordless).

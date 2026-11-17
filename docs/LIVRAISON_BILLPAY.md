# Livraison BillPay V3

Objectif : relier BillPayToken.com au programme d’aide aux factures d’énergie, sans chiffres fictifs ni promesse de rendement. Le parcours part d’un compte vérifié, sépare la vérification du dossier des décisions de gouvernance et distingue un transfert de BILL du règlement effectif chez le fournisseur. Ce document fixe les conditions de livraison ; il ne modifie ni les seuils ni les contrats.

## État au démarrage

| Brique | État vérifiable | Limite |
| --- | --- | --- |
| Hub public | GitHub Pages publie `hub/` ; correction initiale : [PR #34](https://github.com/trevio-TRVO/billpay-protocol/pull/34) | Comptes non activés ; pas de chiffres d’impact sans source vérifiée |
| Comptes | Code du Hub, politique des rôles et API Edge suivis dans le dépôt | Auth e-mail, Turnstile et parcours réel non homologués |
| Supabase test | [`billpay-accounts-test`](https://supabase.com/dashboard/project/gjligcsvdcfxfthxdluq), région Francfort ; migration `billpay_accounts` enregistrée `20261117210953` | Pas de fondateur désigné ni de justificatif importé ; la version distante de la migration ne doit pas être rejouée |
| Contrats | Sources, script de déploiement et tests dans le dépôt | Aucun déploiement officiel vérifié dans le cadre de cette livraison ; Base Sepolia puis audit avant Base mainnet |
| Automatismes | Relay en lecture seule, file de brouillons et tests ; workflow n8n d’exemple dans `relay/n8n` | Pas de planificateur, de canal public ou de paiement activé par cette livraison |

Recette locale du socle : 58 tests de contrats (`forge test --skip script`), 22 tests Relay sous Node 22, build statique et 5 tests Hub, contrôle de types et test simulé de l’API Edge. La CI répète ces vérifications sans clé de chaîne, sans e-mail réel et sans canal de diffusion. L’audit npm des dépendances de production du Relay ne signale aucun avis à la date de la recette ; un avis subsiste dans l’outillage de test pour `picomatch` et doit être revu à la publication d’une version corrigée. Ces tests ne valent pas essai de déploiement sur Base Sepolia ni audit de sécurité.

## Planning par jalons

Les jours ouvrés sont des fenêtres indicatives de travail **après** la levée des dépendances, pas une date d’ouverture. Les lots de travail non dépendants peuvent avancer en parallèle. On ne passe pas au jalon suivant si sa recette échoue.

| Jalon | Fenêtre indicative | Responsable et dépendance | Livrable et condition de passage |
| --- | --- | --- | --- |
| J0 : socle et traçabilité | 1–2 jours | Mainteneur GitHub ; projet Supabase de test existant | PR avec compte fermé par défaut, tests du Hub, de l’API et du relais ; identifiant de migration et procédures dans GitHub |
| J1 : comptes de test réels | 2–4 jours | Mainteneur + propriétaire des services e-mail/Turnstile ; une origine HTTPS de test isolée et une solution e-mail compatible avec le budget validé | Inscription avec captcha côté serveur, réception/expiration du code, connexion et MFA ; différences de rôles et refus de changement de compte ; aucun accès public |
| J2 : dossier demandeur | 3–6 jours d’intégration, hors sélection du tiers | Responsable BillPay + prestataire ; décision sur identité, facture, hébergement, conservation et recours | Parcours chez le tiers, intégration signée et idempotente ; tests identité seule, facture refusée, dossier doublon et correction ; seuls statuts/références minimales chez BillPay |
| J3 : contrats et gouvernance sur Base Sepolia | 3–5 jours après réception des paramètres | Responsable contrats + conseil ; adresses et paramètres de test approuvés | Contrats vérifiés, wallet lié, lecture de BILL et lots ; Gold ≠ validateur ; révocation d’un siège, MFA, seuils, délai, plafond, cooldown et transfert testés sans fonds réels |
| J4 : automatismes en préproduction | 2–4 jours après sources de test | Exploitant Relay ; RPC, hôte et canal privé autorisés | Statistiques vérifiables et fraîcheur visible ; indisponible ≠ zéro ; exposer uniquement des agrégats publics et exclure les adresses de bénéficiaires et références individuelles de `/api/stats` avant raccordement public ; essai des brouillons, approbations, refus, échecs et reprise |
| J5 : ouverture progressive | Après J1 à J4 et validations externes | Propriétaire, responsable contrats, exploitant ; décision de lancement et revue sécurité/confidentialité | Ouvrir par fonctionnalité : comptes, vérification, lectures mainnet, publications. Les actions qui touchent aux fonds restent désactivées tant que les preuves de règlement et l’autorisation de mise en service ne sont pas en place |

## Programme des automatismes BillPay

| Déclencheur | Ce que BillPay automatise | Ce qu’il ne fait pas |
| --- | --- | --- |
| Inscription, connexion, wallet | Code e-mail + Turnstile côté Auth ; association par message signé ; vérification indépendante des droits Demandeur, Gold, Conseil et Fondateur | Ne demande pas de clé privée ; ne donne aucun rôle sur simple déclaration ; Gold ne remplace pas l’achat et l’ancienneté requis pour la validation on-chain |
| Retour du tiers de vérification | Après intégration, enregistrer les statuts validés via webhook signé, contrôlé contre les doublons ; notifier l’état du dossier si homologué | Ne juge pas ni ne copie les justificatifs par défaut ; ne crée pas de transaction et n’approuve pas les dossiers à la place des acteurs |
| Cycle de traitement et gouvernance | Relever les dossiers éligibles et les statuts vérifiés ; présenter clairement le délai, les seuils et l’action requise | Un délai de 24 h n’est pas une garantie de paiement quotidien. `execute()` nécessite un appel on-chain ; ni le compte fondateur ni le relais ne se substituent aux règles du contrat |
| Lecture du réseau | Le relais lit les contrats et génère des brouillons de faits observables ; conserver fraîcheur et provenance | `Paid` atteste un transfert de BILL, pas le règlement d’une facture chez le fournisseur. Pas d’identifiant de dossier ni de bénéficiaire dans le message |
| Publication | Un opérateur approuve chaque brouillon ; le relais publie seulement si `APPROVE=true` et `DRY_RUN=false` ; reprise par destination et surveillance des erreurs | Pas de publication sur refus/absence d’accord. Pas de planificateur concurrent sur la même file. n8n est une option à homologuer, pas une seconde source de publication |
| Incertitude ou panne | Suspendre le flux touché ; montrer « indisponible » ou une donnée datée ; consigner l’incident et reprendre après contrôle | Pas de zéro fictif, de doublon volontaire, ni d’envoi automatique lors d’un état ambigu |

## Recette, exploitation et retour arrière

- **Preuves à joindre aux PR** : scénario, environnement, commit, résultat attendu/mesuré, lien vers le contrôle CI ou journal expurgé. Cas minimaux : code incorrect/expiré, captcha absent, mauvais wallet/réseau, signature expirée/rejouée, facture en attente, lot gratuit et droit de validation refusé, rotation du conseil, MFA manquant, RPC indisponible, refus de publication, reprise après échec partiel.
- **Données et secrets** : GitHub reçoit les fichiers, modèles de variables, décisions et comptes rendus expurgés, jamais les pièces d’identité, factures, OTP, clés ou journaux bruts. Supabase, Cloudflare, l’hébergeur et n8n gardent leurs secrets dans leurs coffres. Aucun identifiant technique de compte fondateur n’est publié. Les changements de configuration sans secret sont documentés par environnement.
- **Migrations** : avant une nouvelle migration, comparer l’historique distant et l’état du schéma, notamment si une migration a déjà été appliquée avec une version distante différente. Ne pas lancer `db push` sans résoudre cet écart sur le projet de test. Tester restauration et migration suivante sans suppression de données.
- **Arrêt d’urgence** : mettre `BILLPAY_ACCOUNTS_ENABLED=false` et republier le Hub si le parcours compte doit être fermé ; traiter séparément le blocage des inscriptions et des appels API dans le backend. Pour les publications, arrêter le planificateur, remettre `DRY_RUN=true`, `APPROVE=false`, préserver la file et vérifier le canal avant toute reprise. Revenir au dernier commit stable pour le Hub/Relay ; pas d’annulation d’un transfert déjà exécuté sur chaîne.
- **Décision de mise en service** : le responsable BillPay valide par écrit le prestataire, les paramètres officiels des contrats, le mode de règlement et sa preuve, le canal/public exact, l’exploitation et le périmètre activé. Les discussions sur le vote consultatif, la stratégie V4 et la priorité de dossiers restent dans [les décisions V3](DECISIONS.md) ; ne pas les transformer en règles actives sans décision explicite.

Chaque jalon est suivi dans GitHub : une issue ou checklist de PR, une branche de changement, une recette et un état livré/non livré. Toute activation manuelle est consignée avec son environnement et ses preuves, hors secrets et données personnelles.

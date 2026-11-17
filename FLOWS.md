# Vérification BillPay Hub

## Point de départ en production
- La racine sert le README Jekyll. `/site/` sert l'ancienne maquette et `/hub/` retourne une 404.
- La maquette présente le portefeuille, les votes, les règles, la gouvernance, les risques et les langues FR/EN/RU. Sa configuration n'indique aucune source active pour les chiffres, les votes ou les achats.
- Le Hub Next.js du dépôt n'est pas déployé et ses modules de données et de connexion ne sont pas suivis par Git.

## Parcours de la version corrigée
- Accueil : le projet d'aide aux factures d'énergie est identifiable, les pourcentages sont des règles et non des statistiques, le solde non vérifié n'est jamais affiché comme zéro.
- Suivre « Voir l’état des demandes », puis le parcours du dossier ; aucun champ de facture, de données personnelles ou de vote fictif.
- Ouvrir chaque rubrique depuis la navigation et directement via son adresse ; sur mobile, ouvrir le menu et vérifier qu'il se ferme après navigation.
- Transparence : aucune transaction d'exemple ; ouvrir la documentation officielle du projet.
- Mon wallet : sans extension, un message d'aide apparaît. Avec un fournisseur simulé, vérifier le réseau Base, le changement de compte et la déconnexion locale ; aucune méthode de signature ou d'envoi.
- Anciennes adresses `/site/` (avec et sans fragment), `/hub/`, `/site/wallets.html` : rediriger vers les rubriques pertinentes, y compris sans JavaScript vers une destination de repli.
- Route inconnue : proposer le retour à l'accueil. Vérifier les erreurs réseau, le débordement horizontal et la console sur ordinateur et à 375 px.

## Comptes
- Mon compte : sans configuration, afficher un état fermé, sans saisie ni faux compte.
- Avec configuration : choisir « Créer un compte » ou « Se connecter », passer Turnstile, demander un code, confirmer le code et voir les droits vérifiés. Tester échec et renvoi ; se déconnecter sans conserver les données.
- Demandeur : identité et facture contrôlées séparément ; aucun téléversement public. Gold : justificatif on-chain uniquement ; conseil : registre et MFA ; fondateur : compte désigné et MFA. Les droits ne s’héritent pas.
- Wallet : vérifier Base avant la signature, demander uniquement une signature de message d’association, tester absence/refus/mauvais réseau, puis lier l’adresse et vérifier la lecture de BILL si configurée.

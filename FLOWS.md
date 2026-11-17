# Vérification BillPay Hub

## Recette de la V2 statique (`site/`)

- Ouvrir le tableau de bord et chacune des neuf rubriques ; contrôler les URL canoniques, les anciens accès, le menu mobile et le retour depuis une 404.
- Changer de langue puis naviguer : le choix suit le parcours, l’arabe active RTL, les nombres et les dates suivent la langue. En navigation privée ou sans stockage, le site reste utilisable.
- Sans configuration : aucun chiffre opérationnel, aucune transaction, aucun dépôt de justificatif, aucun vote public. Sans wallet et sur un mauvais réseau : instructions visibles, aucune signature ni transaction.
- Tester les lectures avec un RPC simulé ; vérifier les dossiers, le lot et ses étapes, le refus de changement de réseau et l’export. Ouvrir le formulaire local avec une image factice, vérifier le résultat sans transfert, puis effacer.
- À 375 px et sur ordinateur : visibilité du focus, absence de débordement, textes et métriques lisibles, animation désactivable et repli sans WebGL.

## Point de départ historique avant la première correction
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

# BillPay Hub sur BillPayToken.com

## Publication

GitHub Pages servait la racine de la branche `site-pro` : le README apparaissait en page d'accueil et l'ancienne maquette sous `/site/`. Le Hub Next.js est dans `hub/` sur `main`. Le workflow `nextjs-pages.yml` construit et vérifie son export. Seule une exécution sur `main` peut déployer `hub/out/` ; les PR lancent uniquement le build et les tests.

1. Intégrer les modifications dans `main`.
2. Dans [Settings → Pages](https://github.com/trevio-TRVO/billpay-protocol/settings/pages), sélectionner **GitHub Actions** dans **Build and deployment → Source**. Conserver `billpaytoken.com` dans **Custom domain** et conserver HTTPS. Le domaine fonctionne déjà : ne pas remplacer ses enregistrements DNS pour changer la source de build.
3. Dans [Actions → Déployer BillPay Hub](https://github.com/trevio-TRVO/billpay-protocol/actions/workflows/nextjs-pages.yml), lancer le workflow sur `main` s'il n'a pas déjà réussi après le changement de source. Vérifier la page d'accueil, `/demande/`, `/tribunal/`, `/site/#apply` et la redirection `www` → domaine principal.
4. Si la bascule doit être annulée, rétablir temporairement la source `site-pro` / `(root)`. Cette branche et l'ancienne maquette restent intactes.

Référence : [Configurer la source de publication GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Sources à raccorder avant ouverture

- **Impact** : obtenir le réseau, les adresses Base officielles de BILL et du `SolidarityWallet`, ainsi que le bloc de déploiement ; vérifier le code déployé. L'interface doit afficher le solde dans l'unité du contrat (BILL) et sourcer chaque versement sur chaîne. Une adresse ayant reçu un versement ne suffit pas à compter une famille.
- **Dépôt de factures** : mettre en place un service protégé, un stockage chiffré et une politique de conservation, de masquage et d'accès. Ne pas publier les dossiers ni envoyer de factures sur chaîne.
- **Vote public** : mettre en place l'identification et le stockage partagé des votes, appliqués côté serveur. Le vote reste consultatif.
- **Versements** : vérifier le circuit réel entre le paiement en BILL par `SolidarityWallet` et le règlement d'une facture, ainsi que le mécanisme chargé d'exécuter la transaction éligible. Le contrat impose un délai par dossier, pas une échéance globale garantie.
- **Lots et gouvernance** : vérifier les contrats et leurs paramètres avant d'activer une lecture ou une transaction.

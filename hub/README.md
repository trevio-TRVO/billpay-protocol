# BillPay Hub

Interface publique de BillPay Protocol. Elle explique l'aide aux factures d'énergie, les règles de contribution et les étapes d'un dossier. Les routes sans source raccordée affichent un état indisponible, jamais une simulation d'activité.

```sh
cd hub
npm ci
npm run build
npm run test:export
```

`npm run dev` lance le développement local. `npm run build` produit `hub/out/` et ajoute les anciennes adresses de redirection, ainsi que le favicon existant. Tester l'export nécessite de servir ce dossier à la racine d'un serveur HTTP statique.

L'interface est en français. Le portefeuille est facultatif et utilise le fournisseur injecté par le navigateur pour lire l'adresse et le réseau, sur action explicite. Il ne demande pas de signature et n'envoie pas de transaction. Rien n'est stocké dans le navigateur par le Hub.

Voir [le guide de déploiement et les prérequis](../docs/SITE_NEXTJS.md).
Pour `/compte/` (connexion e-mail, Turnstile, droits et wallet), voir [le guide des comptes](../docs/ACCOUNTS.md).

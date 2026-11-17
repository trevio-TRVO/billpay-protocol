# Site web Next.js — BillPay Hub

Remplace progressivement le site statique Jekyll (`site/`) par une application **Next.js 15 en export statique**, hébergée sur GitHub Pages avec le domaine personnalisé **billpaytoken.com**.

## Ce qui a été fait

- Portage complet du BillPay Hub en Next.js (App Router, TypeScript, Tailwind, shadcn/radix, Recharts), dossier `hub/`.
- Export statique pur (`output: "export"`, `trailingSlash: true`) : aucune dépendance serveur, compatible GitHub Pages.
- Persistance des données de démonstration dans `localStorage` (clé `billpay-hub-db-v1`) — identique au seed du backend de la version précédente.
- Persistance de la session wallet et de l'identification de vote (`localStorage`) : survit aux rechargements et navigations directes.
- Workflow de déploiement `.github/workflows/nextjs-pages.yml` : build `hub/out/` puis publication via `actions/deploy-pages`. L'ancien workflow Jekyll (`jekyll-gh-pages.yml`) est retiré dans la même PR.
- `hub/public/CNAME` contient `billpaytoken.com` ; `.nojekyll` évite le traitement Jekyll (dossier `_next/`).

## Pages

| Route | Contenu |
|---|---|
| `/` | Tableau de bord — compteur d'impact, fonds, prochaine échéance |
| `/token/` | Token BILL — tokenomique, répartition 10 %, charts |
| `/wallet/` | Interface wallet — soldes, claim des lots, vesting |
| `/lots/` | Lots communautaires — pionniers, séries, achat |
| `/demande/` | Dépôt de candidature (factures) |
| `/tribunal/` | Vote préliminaire public (1 voix/compte identifié) |
| `/validateurs/` | Espace validateurs — 5 validations on-chain |
| `/conseil/` | Gouvernance — conseil d'administration, approbations, cycle 24 h |
| `/antibot/` | Contrôle IA & anti-bot — pipeline 5 barrières, journal d'audit |
| `/transparence/` | Paiements, journal, risque |

## Déploiement

1. La PR fusionne `hub-nextjs` → `main`.
2. Le workflow `nextjs-pages.yml` se déclenche (chemins `hub/**`), construit `hub/out/` et déploie.
3. Pré-requis unique : **Settings → Pages → Build and deployment → Source = GitHub Actions**.
4. Le DNS est déjà en place : `billpaytoken.com` (CNAME → `trevio-TRVO.github.io/billpay-protocol`, proxy Cloudflare actif). Le fichier `CNAME` dans `hub/public/` déclare le domaine côté Pages.

Note : avec le proxy Cloudflare, le site est servi en HTTPS ; vérifier que « Always Use HTTPS » est actif.

## Après la fusion

- Le dossier `site/` (maquette Jekyll) n'est plus déployé mais reste dans l'historique du dépôt.
- Prochaine étape naturelle : brancher wagmi/viem sur les contrats réels (Base) en remplacement des wallets de démonstration.

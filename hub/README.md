# BillPay Hub — Next.js

Interface web du BillPay Protocol (token BILL, Base) : tableau de bord, token, wallet, lots communautaires, dépôt de candidature, tribunal solidaire, espace validateurs, conseil & gouvernance, contrôle IA & anti-bot, transparence.

## Stack

- **Next.js 15** (App Router, export statique : `output: "export"`, `trailingSlash: true`)
- **React 18** + Tailwind CSS + composants shadcn/radix
- **Recharts** pour les graphiques du token
- Aucun backend : les données de démonstration vivent dans le navigateur (`localStorage`, clé `billpay-hub-db-v1`). Les actions (dépôt, vote, validation, achat de lot, cycle de paiement) sont des simulations locales fidèles aux règles des contrats.

## Développement local

```bash
cd hub
npm install
npm run dev        # http://localhost:3000
npm run build      # export statique dans hub/out/
```

## Structure

```
hub/
├── app/                  # pages (App Router) — toutes "use client"
│   ├── page.tsx          # tableau de bord
│   ├── token/            # token BILL (tokenomique, charts)
│   ├── wallet/           # interface wallet
│   ├── lots/             # lots communautaires
│   ├── demande/          # dépôt de candidature (factures)
│   ├── tribunal/         # vote préliminaire public
│   ├── validateurs/      # espace validateurs (5 validations)
│   ├── conseil/          # gouvernance & conseil d'administration
│   ├── antibot/          # contrôle IA & anti-bot
│   └── transparence/     # paiements & journal
├── components/           # app-shell, status-badge, ui/ (shadcn)
├── lib/                  # store.tsx (données + logique), wallet.tsx, utils.ts
└── public/               # CNAME (billpaytoken.com), .nojekyll
```

## Déploiement GitHub Pages

Le workflow `.github/workflows/nextjs-pages.yml` construit `hub/out/` et le publie via `actions/deploy-pages`. Le domaine personnalisé `billpaytoken.com` est déclaré dans `hub/public/CNAME` (copié dans `out/` à l'export).

Dans les réglages du dépôt : Settings → Pages → Source = **GitHub Actions**.

## Limites de la démonstration

- Les wallets sont simulés (adresses de démonstration) — en production, brancher wagmi/viem sur les contrats réels.
- L'identification Google est simulée par saisie d'e-mail.
- Les données sont locales au navigateur : « Réinitialiser la démo » (pied de page) restaure l'état initial.

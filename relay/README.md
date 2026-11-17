# BillPay Relay

Relais **lecture seule** pour BillPay Protocol ($BILL, Base) : API JSON publique + agent de publication (FR/EN/RU) avec file d'approbation humaine.

> Le relais **ne signe jamais, ne paie jamais, ne détient aucune clé privée**. Il n'utilise que `eth_call` et `eth_getLogs`.

## Démarrage

```bash
cd relay
npm ci
cp .env.example .env   # renseigner les adresses de contrats ; ne jamais commiter .env
npm test && npm run typecheck
npm start              # API sur :8787 (charger .env via `node --env-file=.env` ou l'environnement)
```

## 1. API publique (`node:http`)

| Route | Contenu |
|---|---|
| `GET /api/stats` | offre totale, **brûlé** (offre initiale − offre actuelle), **circulant** (offre − soldes exclus : solidarité, ops, réserve de liquidité, AutoLiquidity, lots, paires, dead), liquidité USDC et ETH (réserves des paires), détenteurs **approximatifs**, demandes solidaires en attente |
| `GET /api/lots` | état des lots : lot pionnier, séries ouvertes (14 × 90 lots payants + 10 gratuits), disponibilité, calendrier, `lotTokens` (null tant que le TWAP n'a pas de prix) |
| `GET /api/health` | `{ ok: true }` |

Montants en chaînes décimales (wei / unités natives), pour éviter toute perte de précision. CORS (`CORS_ORIGIN`), `Cache-Control` + cache mémoire (`CACHE_TTL_SECONDS`), réponse périmée servie si le RPC échoue (`X-Cache-Stale`). Les erreurs ne révèlent jamais l'URL RPC.

Approximations : « détenteurs » = nombre d'adresses ayant déjà reçu des BILL (borne haute du nombre de détenteurs actuels), scanné progressivement depuis `DEPLOY_BLOCK` ; le brûlé suppose `INITIAL_SUPPLY` correct.

## 2. Publisher (équivalent d'un flux n8n, en code)

```bash
npm run publisher -- collect        # lit les évènements on-chain → brouillons FR/EN/RU (statut pending)
npm run publisher -- list
npm run publisher -- approve <id>   # approbation HUMAINE
npm run publisher -- reject <id>
npm run publisher -- flush          # envoie les brouillons approuvés
```

Évènements : lot vendu (`Purchased`), transfert solidaire de BILL (`Paid`), jalons de burn (`BURN_MILESTONES`). `Paid` ne prouve pas le règlement de la facture par le fournisseur ; aucun identifiant de dossier, wallet bénéficiaire ou montant individuel ne figure dans le message. Premier lancement : démarre à la tête de chaîne, pas de rattrapage.

**Garde-fous** (testés) :
- `DRY_RUN=true` par défaut : les posts sont seulement affichés.
- Publication réelle uniquement si `DRY_RUN=false` **et** `APPROVE=true` **et** le brouillon a été approuvé par un humain. Sans `APPROVE=true`, rien ne part, jamais.
- Canaux enfichables (`Channel`) : Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) et X (`X_ACCESS_TOKEN`, ≤ 280 caractères). Secrets uniquement par variables d'environnement, masqués dans les erreurs.
- Textes déterministes (pas de LLM), adresses abrégées.
- En cas d’échec partiel, le relais enregistre chaque envoi confirmé et le prochain `flush` saute ces destinations. Une erreur d’envoi entraîne un code de sortie non nul. En cas de réponse perdue ou d’arrêt entre l’envoi et son enregistrement, vérifier manuellement le canal avant de relancer : il n’existe pas de garantie « exactement une fois ». Exécuter une seule instance d’écriture par fichier d’état, sans chevauchement des commandes `collect`, `approve`, `reject` ou `flush`.
- Les textes des brouillons déjà en file ne sont pas réécrits par une mise à jour du code. Examiner et rejeter les anciens brouillons dont le texte ne satisfait pas la règle ci-dessus avant toute activation.

## 3. n8n

Modèle d’intégration à vérifier en préproduction : `n8n/billpay-stats-approval.json`. Il prévoit un planificateur, `GET /api/stats`, un texte FR/EN/RU et une approbation Telegram avant toute publication. Variables : `RELAY_API_URL`, `TELEGRAM_APPROVER_CHAT_ID`, `TELEGRAM_PUBLIC_CHAT_ID`, `APPROVE`. Les identifiants restent dans le coffre n8n. Ne pas activer le workflow avant la recette du [plan de livraison](../docs/LIVRAISON_BILLPAY.md) ni l’utiliser en parallèle du publisher pour le même contenu.

---

## EN (short)
Read-only relay for BillPay Protocol: JSON API and a publisher turning on-chain events into FR/EN/RU drafts. A fund transfer is not evidence of an invoice settlement. Real publication requires human approval per draft, `APPROVE=true` and `DRY_RUN=false`. No signing or payments. Run `npm test && npm run typecheck`.

## RU (кратко)
Релей BillPay Protocol только для чтения: JSON API и черновики FR/EN/RU. Перевод фонда не подтверждает оплату счёта. Публикация требует одобрения черновика человеком, `APPROVE=true` и `DRY_RUN=false`. Релей не подписывает и не выполняет платежи.

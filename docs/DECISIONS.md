# Dossier de décisions V3 (issues #2, #3, #4, #7)

Document de travail : chaque section présente les options, une recommandation argumentée et les points restant à trancher par le propriétaire du projet. Rien ici n'est effectif tant que la recommandation n'est pas validée (fusion de ce document = validation).

## #2 — Phase 0 : attribution des 100 lots pionniers

**État actuel** : `buyPioneer()` est ouvert dès le lancement, 1 lot par wallet, 10 USDC pour 100 000 BILL (quantité fixe). Premier arrivé, premier servi.

**Options** :

| Option | Avantage | Inconvénient |
|---|---|---|
| A. Statu quo : premier arrivé, premier servi | Aucune clé, aucun admin, immuable, déjà implémenté et testé | Favorise les bots rapides (faible impact, voir ci-dessous) |
| B. Fenêtre d'inscription puis tirage au sort | Équité apparente | Exige de l'aléatoire fiable : VRF = clé d'abonnement (admin) ; blockhash = manipulable par un validateur |
| C. Liste blanche (allowlist) | Contrôle total | Réintroduit un décideur privilégié, contraire à la règle d'or « sans admin » |
| D. Vente à créneau (Dutch/escalade) | Auto-équilibrage | Complexité et paramètres supplémentaires pour un gain marginal |

**Recommandation : A (statu quo)**. Le lot pionnier est vendu **au prix juste** (10 USDC pour 10 USDC de BILL au prix de lancement 0,0001) : il n'y a aucune remise à capturer, donc aucune incitation au sniping rentable. La protection de lancement de 7 jours (0,1 % par vente, 0,2 % par wallet/jour) limite déjà la revente immédiate. Les 100 places à 10 USDC sont un filtre d'engagement, pas une enchère.

**À trancher** : rien, si la recommandation est acceptée — la Phase 0 est alors « définie » et l'issue #2 peut être fermée.

## #4 — Anti-sybil et paramètres finaux

### Anti-sybil (1 achat par wallet)

**État actuel** : `hasBought` limite à 1 lot par wallet ; contournable en créant plusieurs wallets.

**Analyse du risque** : un attaquant multi-wallets doit payer le prix plein pour chaque lot (50 USDC pour 100 USDC de valeur au TWAP). Le coût d'un sybil à N wallets est donc 50 × N USDC, et la valeur captée est plafonnée à 100 USDC par lot. Le risque n'est pas la perte de fonds mais la **concentration des validateurs** (5 wallets d'un même acteur peuvent valider une demande de complaisance).

**Recommandation : défense en profondeur, sans clé** :
1. **On-chain (implémenté)** : 1 lot/wallet, pool plafonné, séries limitées à 90 lots/30 j — la saturation est bornée dans le temps.
2. **On-chain (issue #10)** : ancienneté minimale de 30 jours du lot pour pouvoir valider une demande — un sybil doit verrouiller son capital un mois avant de pouvoir agir, et reste visible sur chaîne.
3. **Off-chain (issue #11)** : l'IA signale les comportements en grappe (fonds d'origine commune, horaires identiques, descriptions similaires) ; elle signale, ne paie pas.
4. **Gouvernance (existant)** : le conseil peut annuler toute demande à poids 5 ; le fondateur peut annuler seul. Un validateur n'est jamais payeur.

**À trancher** : valider la défense en profondeur ci-dessus (l'ancienneté de 30 j est livrée avec l'issue #10).

### Paramètres finaux (prix/quantités)

Les constantes de `CommunityLots.sol` sont déjà fixées et immuables après déploiement :

| Paramètre | Valeur | Commentaire |
|---|---|---|
| Lot pionnier | 10 USDC pour 100 000 BILL | Quantité fixe, prix de lancement 0,0001 USDC/BILL |
| Lot de série (`LOT_PRICE`) | 50 USDC | Recommandation : valeur finale |
| Valeur livrée (`LOT_VALUE`) | 100 USDC au TWAP (x2) | Recommandation : valeur finale |
| Plafond de sécurité (`MAX_LOT_TOKENS`) | 1 000 000 BILL | Empêche un lot démesuré si le TWAP est cassé |
| Déclenchement des séries | TWAP ≥ 0,001 USDC/BILL (x10) | Validé le 2026-11-09 |
| Séries | 14 × (90 payants + 10 gratuits), une par 30 j | |

**Recommandation** : figer `pricePerSeries` = 50 USDC et `tokensPerSeries` = valeur TWAP de 100 USDC (plafonnée à 1 M BILL). Toute modification après cette validation exigerait de redéployer le contrat avant mise en production — c'est le dernier moment où changer ces valeurs est gratuit.

**À trancher** : valider les deux constantes (ou proposer d'autres valeurs avant le déploiement).

## #7 — Vote public et attestation sans clé privilégiée

**Tension** : le vote public (une voix par compte identifié) est hors chaîne ; pour qu'il *autorise* un paiement, il faut traduire son résultat sur la chaîne, ce qui exige un signataire, un oracle ou un comité — c'est-à-dire une clé privilégiée, contraire à « sans admin ».

**Options** :

| Option | Mécanisme | Conformité « sans admin » |
|---|---|---|
| A. Vote consultatif (signal) | Le vote public est affiché (Arène de Vote) mais n'est pas une condition du paiement on-chain | Totale — aucune clé |
| B. Comité de signataires | Un comité fixe (type signataires d'élection de `CouncilRegistry`) publie une attestation « vote favorable » qui conditionne `execute()` | Partielle — confiance déléguée à un ensemble fixe |
| C. Multisig 3 signataires tirés au sort | Comme B, mais rotation du comité | Partielle — l'aléatoire du tirage exige VRF ou blockhash (manipulable) |

**Recommandation : A (vote consultatif)**. Les garde-fous de paiement restent entièrement on-chain et sans clé : ≥ 5 validateurs (acquéreurs de lots, ancienneté 30 j), poids conseil ≥ 5 (le fondateur seul ne peut pas valider), délai de 24 h, plafond de 20 % du solde, 1 paiement par bénéficiaire/30 j. Le vote public devient un **signal fort** : le conseil (10 sièges élus/partiellement tirés au sort, rotation mensuelle) est légitimé à le suivre ou à annuler (poids 5). Cette option est la seule qui ne réintroduit aucune confiance.

**À trancher** : accepter A (recommandé), ou exiger B/C en acceptant une confiance déléguée.

## #3 — V4 : programme de participation et 3 admins par lot

**État actuel** : les 10 sous-wallets `freeWallets` sont fixés à la construction de `CommunityLots` (immuables) et reçoivent les 10 lots gratuits de chaque série via `allocateFree()`.

**Recommandation** :
- **Wallet spécial et sous-wallets** : chaque sous-wallet est un multisig (Safe 3/5) sur Base, dont les 5 signataires sont des acquéreurs de lots tirés au sort lors des élections mensuelles (publiés par les signataires d'élection existants du `CouncilRegistry` — pas de mécanisme nouveau).
- **3 admins aléatoires par lot** : interprétés comme les 3 signataires requis sur 5 du multisig du sous-wallet — pas de « 3 admins » supplémentaires à créer.
- **Distribution des lots gratuits** : décision du multisig (campagne, concours, aide directe) — hors chaîne, les tokens restant soumis au vesting standard (cliff 45 j + linéaire 30 j).
- À définir avant déploiement : les 10 adresses des sous-wallets (elles sont immuables après construction).

**À trancher** : valider l'architecture multisig, désigner les 10 sous-wallets, rédiger la charte du programme V4.

## Règle de priorité si le fonds est insuffisant

Question ouverte du tableau de bord (distribution toutes les 24 h).

**Recommandation** : file d'attente FIFO (ordre d'arrivée des demandes *validées*). Raisons : neutre, vérifiable sur chaîne, aucune clé de tri. Les bornes existantes (plafond 20 %/paiement, 1 paiement/bénéficiaire/30 j) limitent déjà le débit quotidien ; l'urgence est couverte par le fait que chaque cycle de 24 h règle la file.

---

## Suivi

| Issue | Décision proposée | Statut |
|---|---|---|
| #2 Phase 0 | Statu quo FCFS, prix juste | À valider |
| #4 anti-sybil | Défense en profondeur (1/wallet + ancienneté 30 j + IA + conseil) | À valider |
| #4 paramètres | 50 USDC / 100 USDC de valeur, plafond 1 M BILL | À valider |
| #7 vote public | Consultatif (signal), paiement sans clé | À valider |
| #3 V4 | Multisigs 3/5 tirés au sort via les élections | À valider |
| #10 anti-collusion | Ancienneté de lot de 30 j pour valider | Implémenté (PR séparée) |
| #11 IA | Signale, ne paie pas ; intégration relay/site | À implémenter |

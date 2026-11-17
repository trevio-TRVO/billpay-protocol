# BillPay Hub V2 statique

Les dix URL publiques sont générées à la racine du dossier `site/`. Les variantes `/lang/{en,ru,es,ar}/` ont leur propre HTML, titre, description, balises Open Graph et `hreflang` ; `/` et les routes historiques restent les URL françaises. Le menu, l’en-tête, le pied de page et toutes les traductions sont générés à partir d’une seule source.

## Vérifier et publier

```sh
# Depuis la racine du dépôt, avec Node 22
node site-tools/build.mjs
node --test site-tools/static.test.mjs
python3 -m http.server 4178 --directory site
```

1. Une fois la V2 relue et fusionnée, laisser **Settings → Pages → Source** sur « GitHub Actions ». Dans les variables du dépôt, définir `BILLPAY_PAGES_SOURCE=static-v2`. Lancer le workflow « Vérifier et déployer BillPay Hub sur GitHub Pages » sur `main`. La racine de l’artefact est alors `site/`, pas une adresse publique `/site/`. Le CNAME reste `billpaytoken.com`.
2. Pour revenir à l’actuel Hub, supprimer la variable `BILLPAY_PAGES_SOURCE` et relancer le workflow. Ne pas changer le domaine ni le DNS.
3. Sans déploiement confirmé, conserver les six adresses vides. Une adresse ajoutée dans `config.json` doit correspondre au contrat vérifié sur Base, avec ses liens croisés confirmés. Pour l’historique des gros volumes, renseigner le bloc de déploiement du fonds ; les agrégats s’affichent uniquement si la lecture est complète dans la fenêtre prise en charge. Le RPC Base public est limité en débit ; une lecture interrompue n’est jamais annoncée comme un zéro. L’export CSV présente uniquement les événements effectivement lus dans la fenêtre récente, sans pièce, adresse de bénéficiaire ni hash de facture.
4. Laisser `transactionsEnabled: false` jusqu’à un test des contrats et à la validation du responsable. Lorsque l’option est activée, l’achat demande éventuellement une approbation distincte du montant USDC exact, puis une seconde action pour l’achat après confirmation. Vérifier l’adresse, le réseau, le montant et le destinataire dans le wallet. Le site ne signe ni ne soumet automatiquement. `claim()` et `openSeries()` sont simulés sur le RPC avant sollicitation du wallet.
5. WalletConnect requiert un `walletConnectProjectId` public, un domaine autorisé par le projet et un test réel avant activation. Le site ne requiert aucun secret côté HTML. Un portefeuille externe est un service distinct.

Si des adresses vérifiées doivent être activées dans une future PR, adapter en même temps le test des valeurs de configuration de livraison et joindre les preuves de vérification. La V2 ne partage ni les sessions ni les formulaires avec la branche des comptes Supabase.
Si les travaux de la PR comptes nº 35 et ceux de la V2 sont rassemblés, conserver ses contrôles et ses garde-fous de publication en réconciliant le workflow Pages. Ne pas faire dépendre la V2 de l’API comptes sans revoir l’exigence de site 100 % statique.

## Limites voulues

- Un site statique ne vérifie ni l’identité d’un demandeur ni l’unicité d’un votant. Le formulaire traite une image masquée et une description dans l’onglet sans téléversement, et le Tribunal ne simule aucun vote public ni aucun résultat.
- Les signaux locaux anti-bot sont indicatifs et contournables ; ils ne collectent rien et n’autorisent ni ne refusent aucun transfert. L’interface ne propose aucun paiement ou vote de gouvernance.
- « Dossiers exécutés » et « total transféré » décrivent des transferts en BILL, pas des factures dont le règlement est attesté par un fournisseur. La date de lecture est celle de l’observation ; les dossiers sont paginés, et les valeurs indisponibles n’ont aucun substitut fictif.
- Seule la langue est mémorisée par le Hub. Le RPC et WalletConnect peuvent appliquer leurs propres politiques. L’hébergement n’envoie aucun justificatif vers GitHub, Base ou un tiers.

## Checklist de recette

| Scénario | Attendu |
|---|---|
| 375 px et ordinateur | Menu clavier, focus visible, aucun débordement, toutes les routes et liens de retour |
| EN / RU / ES / AR | Changement persistant, textes et méta localisés, AR en RTL ; préférence FR explicitement conservée |
| Pas de wallet | Information claire, chemins WalletConnect et actions financières désactivés si non configurés |
| Wallet sur mauvais réseau | Pas de transaction ; action de bascule sur Base ; refus propre si l’utilisateur annule |
| RPC / contrat absent | Non disponible, pas de chiffre fictif ; état partiel si certaines lectures réussissent |
| Lot et fonds (données de test) | Délai, plafond, cooldown, états, vesting ; transaction possible seulement si configuration valide |
| Facture de test | Import PNG/JPEG/WebP masqué, aucun envoi observable, signal local, remise à zéro |
| WebGL, économie, mouvement réduit | SVG et graphique CSS lisibles sans animation ; autorisation du capteur demandée seulement sur action |
| Lighthouse mobile | Mesurer sans extension ni wallet, avec et sans 3D, objectif performance ≥ 90 ; ne pas publier en prétendant le seuil atteint sans mesure |

Mesure de recette locale : Lighthouse 12.8.2, profil mobile simulé, accueil `/?locale=fr` sans adresses configurées, performance 99/100 et accessibilité automatisée 100/100. Cette mesure n’est ni un audit WCAG AA complet ni une mesure sur le domaine public.

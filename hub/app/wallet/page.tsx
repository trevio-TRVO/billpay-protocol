"use client";

import { StatusBadge } from "@/components/status-badge";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@/lib/wallet";
import { useStore } from "@/lib/store";
import { Wallet as WalletIcon, Package, FileText, Landmark, HandCoins, Zap } from "lucide-react";

const fmt = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const DAY = 86400000;

export default function WalletPage() {
  const { address } = useWallet();
  const { db, myLot, claimLot, councilMemberByWallet, walletBalance } = useStore();

  if (!address) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-display font-bold">Mon wallet</h1>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <WalletIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">
                Connectez votre wallet (bouton « Connecter » en haut à droite) pour voir vos soldes BILL et USDC, vos lots, votre vesting et vos demandes d'aide.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Connecter un wallet Base", body: "Comptes de démonstration disponibles, ou adresse personnalisée." },
                { step: "2", title: "Acheter un lot", body: "10 USDC pour 100 000 BILL au lancement — vous devenez validateur des dossiers d'aide." },
                { step: "3", title: "Participer", body: "Valider les dossiers, voter au Tribunal, siéger au conseil si votre wallet est élu." },
              ].map((s) => (
                <div key={s.step} className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="font-mono text-xs text-primary tnum">{s.step}</p>
                  <p className="mt-1 text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lot = myLot(address);
  const balance = walletBalance(address);
  const member = councilMemberByWallet(address);
  const myApps = db.applications.filter((a) => a.wallet === address);
  const vesting = lot
    ? Math.min(1, Math.max(0, (Date.now() - (lot.boughtAt ?? Date.now()) - DAY * 45) / (DAY * 30)))
    : 0;
  const cliffDone = lot ? Date.now() - (lot.boughtAt ?? Date.now()) >= DAY * 45 : false;
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold">Mon wallet</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground tnum" data-testid="text-wallet-address">{address}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card data-testid="card-balance-bill">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Solde BILL</p>
            <p className="mt-2 font-display text-2xl font-bold tnum">{fmt(balance.bill, 0)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-balance-usdc">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Solde USDC</p>
            <p className="mt-2 font-display text-2xl font-bold tnum">{fmt(balance.usdc)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-balance-lot">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Lot communautaire</p>
            <p className="mt-2 font-display text-2xl font-bold">
              {lot ? `${lot.series} #${lot.lotIndex}` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
          <Package className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Mon lot et calendrier de vesting</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {lot ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span>Série <strong>{lot.series}</strong> · lot n°{lot.lotIndex}</span>
                <Badge variant="outline" className="border-primary/40 text-primary">{lot.type === "pionnier" ? "Pionnier" : lot.type === "paye" ? "Payé" : "Gratuit"}</Badge>
                <span className="text-muted-foreground">Prix : <span className="font-mono tnum">{fmt(lot.priceUsdc)} USDC</span></span>
                <span className="text-muted-foreground">Quantité : <span className="font-mono tnum">{fmt(lot.billAmount, 0)} BILL</span></span>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vesting — cliff 45 jours, puis linéaire sur 30 jours</span>
                  <span className="font-mono tnum">{Math.round(vesting * 100)} % débloqué · {fmt(lot.claimedBill, 0)} BILL réclamés</span>
                </div>
                <Progress value={Math.max(2, vesting * 100)} className="h-2" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  disabled={!cliffDone}
                  onClick={() => {
                    const r = claimLot(address);
                    setClaimMsg(r.ok ? `Claim réussi : ${fmt(r.claimed ?? 0, 0)} BILL` : r.error ?? "Erreur");
                  }}
                  data-testid="button-claim-lot"
                >
                  <HandCoins className="mr-1.5 h-4 w-4" />
                  {cliffDone ? "Réclamer les BILL débloqués (claim)" : `Cliff actif — ${Math.ceil((DAY * 45 - (Date.now() - (lot.boughtAt ?? Date.now()))) / DAY)} jours restants`}
                </Button>
                {claimMsg && <p className="text-xs" data-testid="text-claim-result">{claimMsg}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous ne détenez pas encore de lot. Les acquéreurs de lots deviennent validateurs des dossiers d'aide — voir la page « Lots communautaires ».
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Mes demandes d'aide</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myApps.length > 0 ? (
              <ul className="divide-y divide-border">
                {myApps.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span>{a.provider} — <span className="font-mono text-xs tnum text-muted-foreground">{fmt(a.amount)} USDC</span></span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">Aucune demande déposée depuis ce wallet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
            <Landmark className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Mes rôles dans le protocole</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-muted-foreground" /> Validateur (acquéreur de lot)</span>
              <Badge variant="outline" className={lot ? "border-success/40 text-success" : "text-muted-foreground"}>
                {lot ? "Oui" : "Non"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Membre du conseil</span>
              <Badge variant="outline" className={member ? "border-primary/40 text-primary" : "text-muted-foreground"}>
                {member ? `${member.seat} (poids ${member.weight})` : "Non"}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Un wallet peut valider les dossiers s'il détient un lot (preuve vérifiable dans CommunityLots.grants). Les membres du conseil approuvent les paiements ; il faut un poids cumulé d'au moins 5.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@/lib/wallet";
import { useStore } from "@/lib/store";
import { Lock, Package, Clock, Users } from "lucide-react";

const fmt = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function LotsPage() {
  const { address } = useWallet();
  const { db, myLot, buyLot } = useStore();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pionniers = db.lots.filter((l) => l.series === "Pionniers");
  const pionniersRemaining = pionniers.filter((l) => !l.buyerWallet).length;
  const autresSeries = ["Série 1"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold">Lots communautaires</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          15 % de l'offre est distribuée en lots : 100 lots pionniers au lancement, puis une série de 100 lots tous les 30 jours. Un seul lot par wallet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Package className="h-3.5 w-3.5" /> Lots pionniers</div>
            <p className="mt-2 font-display text-2xl font-bold tnum">{pionniersRemaining}/{pionniers.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">10 USDC · 100 000 BILL fixés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Vesting</div>
            <p className="mt-2 font-display text-lg font-bold">45 j + 30 j linéaire</p>
            <p className="mt-1 text-xs text-muted-foreground">Cliff de 45 jours puis déblocage progressif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Users className="h-3.5 w-3.5" /> Règle anti-sybil</div>
            <p className="mt-2 font-display text-lg font-bold">1 lot / wallet</p>
            <p className="mt-1 text-xs text-muted-foreground">Vérifié par le contrat, achat impossible ensuite</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-series-pionniers">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">Série Pionniers — ouverte au lancement</CardTitle>
            <Badge variant="outline" className="border-primary/40 text-primary">Disponible</Badge>
          </div>
          <CardDescription>
            100 lots · 10 USDC par lot · 100 000 BILL livrés par lot (prix fixe, jamais réduit). Les acquéreurs deviennent validateurs des dossiers d'aide.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Disponibilité</span>
                <span className="font-mono tnum">{pionniersRemaining} lots restants sur {pionniers.length}</span>
              </div>
              <Progress value={(pionniersRemaining / pionniers.length) * 100} className="h-2" />
            </div>
            {address ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  disabled={pionniersRemaining === 0}
                  onClick={() => {
                    const r = buyLot("Pionniers", address);
                    if (r.ok) { setError(""); setMessage("Lot réservé — vesting démarré."); }
                    else { setMessage(""); setError(r.error ?? "Erreur"); }
                  }}
                  data-testid="button-buy-pioneer"
                >
                  Acheter un lot pionnier — 10 USDC
                </Button>
                {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
                {message && !error && <p className="text-xs text-success" data-testid="text-buy-success">{message}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Connectez votre wallet pour acheter un lot.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-series-1">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">Séries suivantes — 90 payées + 10 gratuites</CardTitle>
            <Badge variant="outline" className="border-muted text-muted-foreground"><Lock className="mr-1 h-3 w-3" /> Verrouillées</Badge>
          </div>
          <CardDescription>
            Une série tous les 30 jours, ouverte par openSeries() lorsque le prix TWAP atteint 10 × le prix de lancement (0,001 USDC/BILL). Chaque lot payé coûte 50 USDC et livre exactement 100 USDC de BILL au prix TWAP (×2), jamais plus. Les lots gratuits sont réservés aux demandeurs d'aide.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {autresSeries.map((s) => {
              const lots = db.lots.filter((l) => l.series === s);
              const remaining = lots.filter((l) => !l.buyerWallet).length;
              return (
                <div key={s} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-sm">
                  <span className="font-semibold">{s}</span>
                  <span className="text-muted-foreground">90 payés (50 USDC) · 10 gratuits</span>
                  <span className="font-mono text-xs text-muted-foreground tnum">{remaining}/{lots.length} disponibles</span>
                  <Badge variant="outline" className="ml-auto border-chart-3/40 text-chart-3">S'ouvre à ×10 du prix de lancement</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Comment fonctionne le vesting</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3"><span className="font-mono text-primary">1.</span> Achat du lot — la quantité de BILL est fixée pour les pionniers (100 000) ou calculée au TWAP pour les séries suivantes.</li>
            <li className="flex gap-3"><span className="font-mono text-primary">2.</span> Cliff de 45 jours : aucun BILL n'est réclamable.</li>
            <li className="flex gap-3"><span className="font-mono text-primary">3.</span> Libération linéaire sur 30 jours après le cliff — claim quand vous voulez, sans contribution de 10 % sur les claims.</li>
            <li className="flex gap-3"><span className="font-mono text-primary">4.</span> Les lots invendus restent dans le contrat — aucun remboursement, aucune redistribution.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

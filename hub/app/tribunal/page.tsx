"use client";

import { StatusBadge } from "@/components/status-badge";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/lib/wallet";
import { useStore } from "@/lib/store";
import { Scale, ThumbsUp, ThumbsDown, ShieldCheck, Timer, UserRound } from "lucide-react";

const fmt = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const CATEGORIES: Record<string, string> = { electricite: "Électricité", gaz: "Gaz", chauffage: "Chauffage", eau: "Eau" };

export default function TribunalPage() {
  const { googleUser } = useWallet();
  const { db, vote, validationsCount, councilWeightFor } = useStore();
  const [filter, setFilter] = useState("actifs");
  const [error, setError] = useState("");
  const [voted, setVoted] = useState<Record<number, string>>({});

  const list = db.applications
    .filter((a) => (filter === "actifs" ? a.status !== "paye" : filter === "payes" ? a.status === "paye" : true))
    .sort((a, b) => b.createdAt - a.createdAt);

  const doVote = (id: number, choice: "oui" | "non") => {
    if (!googleUser) return;
    const r = vote(id, googleUser, choice);
    if (!r.ok) setError(r.error ?? "Erreur");
    else {
      setError("");
      setVoted((v) => ({ ...v, [id]: choice }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold">Tribunal solidaire</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cartes anonymes : montant, fournisseur, urgence. Un dossier signalé par l'IA (score inférieur à 50) reste visible mais la validation est suspendue.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="actifs" data-testid="tab-active">Dossiers actifs</TabsTrigger>
            <TabsTrigger value="tous" data-testid="tab-all">Tous</TabsTrigger>
            <TabsTrigger value="payes" data-testid="tab-paid">Payés</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          {googleUser ? (
            <Badge variant="outline" className="border-success/40 text-success" data-testid="badge-identified">
              <UserRound className="mr-1 h-3 w-3" /> Identifié : {googleUser}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground" data-testid="badge-not-identified">
              Identification requise pour voter (menu en haut)
            </Badge>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert" data-testid="text-vote-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => {
          const myVote = voted[a.id];
          const closed = a.status === "paye" || a.status === "rejete";
          return (
            <Card key={a.id} data-testid={`card-dossier-${a.id}`} className={a.aiFlag ? "border-destructive/30" : undefined}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-display text-lg font-bold">{fmt(a.amount)} USDC</span>
                  <Badge variant="outline" className="text-xs">{CATEGORIES[a.category] ?? a.category}</Badge>
                  <Badge variant="outline" className={`text-xs ${a.urgency === 3 ? "border-destructive/40 text-destructive" : "text-muted-foreground"}`}>
                    {a.urgency === 3 ? "Coupure imminente" : a.urgency === 2 ? "Urgence élevée" : "Normale"}
                  </Badge>
                  <span className="ml-auto"><StatusBadge status={a.status} /></span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Fournisseur : <span className="text-foreground">{a.provider}</span>
                </p>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  « {a.description.length > 180 ? a.description.slice(0, 180) + "…" : a.description} »
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Validations détenteurs de lots : <span className={`font-mono tnum ${validationsCount(a.id) >= 5 ? "text-success" : ""}`}>{validationsCount(a.id)}/5</span></span>
                  <span>Conseil : <span className={`font-mono tnum ${councilWeightFor(a.id) >= 5 ? "text-success" : ""}`}>{councilWeightFor(a.id)}/5</span></span>
                  <span className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" /> Paiement au cycle de 24 h</span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> IA {a.aiScore}/100
                    {a.aiFlag ? <span className="text-destructive"> — signalé</span> : null}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="text-xs tnum">
                    <span className="text-success font-medium">{a.yesVotes} OUI</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className="text-destructive font-medium">{a.noVotes} NON</span>
                    {myVote ? <span className="ml-2 text-muted-foreground">(votre voix : {myVote === "oui" ? "OUI" : "NON"})</span> : null}
                  </div>
                  {!closed ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        className="border-success/40 text-success hover:bg-success/10"
                        disabled={!googleUser || !!myVote}
                        onClick={() => doVote(a.id, "oui")}
                        data-testid={`button-vote-yes-${a.id}`}
                      >
                        <ThumbsUp className="mr-1 h-3.5 w-3.5" /> OUI
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={!googleUser || !!myVote}
                        onClick={() => doVote(a.id, "non")}
                        data-testid={`button-vote-no-${a.id}`}
                      >
                        <ThumbsDown className="mr-1 h-3.5 w-3.5" /> NON
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

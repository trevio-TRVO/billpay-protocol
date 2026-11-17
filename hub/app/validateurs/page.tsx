"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/wallet";
import { useStore } from "@/lib/store";
import { ShieldCheck, ShieldX, Lock } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ValidateursPage() {
  const { address } = useWallet();
  const { db, myLot, validate, validationsCount } = useStore();
  const [message, setMessage] = useState("");

  const isValidator = address ? !!myLot(address) : false;
  const open = db.applications.filter((a) => a.status === "en_vote" || a.status === "valide");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold">Espace validateurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réservé aux acquéreurs de lots : seuls les wallets figurant dans CommunityLots.grants peuvent valider un dossier. Cinq validations distinctes sont nécessaires.
        </p>
      </div>

      {!address ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Lock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Connectez votre wallet pour vérifier votre statut de validateur.</p>
          </CardContent>
        </Card>
      ) : !isValidator ? (
        <Card className="border-chart-4/40">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <ShieldX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="max-w-md text-sm text-muted-foreground">
              Ce wallet ne détient pas de lot communautaire. Achetez un lot (page « Lots communautaires ») pour devenir validateur — la preuve est vérifiable on-chain dans CommunityLots.grants.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Badge variant="outline" className="w-fit border-success/40 text-success" data-testid="badge-validator">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Wallet validateur confirmé
        </Badge>
      )}

      {message ? (
        <p className={`text-sm ${message.includes("enregistrée") ? "text-success" : "text-destructive"}`} role="status" data-testid="text-validate-result">{message}</p>
      ) : null}

      <div className="grid gap-4">
        {open.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Aucun dossier en attente de validation.</CardContent></Card>
        ) : (
          open.map((a) => (
            <Card key={a.id} data-testid={`card-validate-${a.id}`} className={a.aiFlag ? "border-destructive/30" : undefined}>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {a.provider} — <span className="font-mono tnum text-muted-foreground">{fmt(a.amount)} USDC</span>
                  </p>
                  <p className="mt-1 max-w-xl text-xs text-muted-foreground">{a.description}</p>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span>Validations : <span className={`font-mono tnum ${validationsCount(a.id) >= 5 ? "text-success" : ""}`}>{validationsCount(a.id)}/5</span></span>
                  <span>IA : <span className="font-mono tnum">{a.aiScore}/100</span>{a.aiFlag ? <span className="text-destructive"> — signalé, validation suspendue</span> : null}</span>
                  <Button
                    size="sm"
                    disabled={!isValidator || a.aiFlag === 1 || validationsCount(a.id) >= 5}
                    onClick={() => {
                      if (!address) return;
                      const r = validate(a.id, address);
                      setMessage(r.ok ? "Validation enregistrée sur la chaîne (simulation)." : r.error ?? "Erreur");
                    }}
                    data-testid={`button-validate-${a.id}`}
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Valider on-chain
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Règles de validation</CardTitle>
          <CardDescription>Conçues pour résister à la collusion et aux faux comptes.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>· Les 5 validations sont sur chaîne : signatures de wallets détenant un lot, vérifiées par le contrat — sans admin.</li>
            <li>· Un wallet ne peut valider qu'une fois par dossier ; les dossiers signalés par l'IA suspendent la validation.</li>
            <li>· Pistes anti-collusion : validateurs tirés au sort, ancienneté minimale du lot, rotation.</li>
            <li>· Le veto de l'IA est contestable par les validateurs (règle à définir par le conseil).</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

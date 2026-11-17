"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/lib/wallet";
import { useStore } from "@/lib/store";
import { Landmark, KeyRound, Timer, Users } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ConseilPage() {
  const { address } = useWallet();
  const { db, councilApprove, runCycle, validationsCount, councilWeightFor, councilMemberByWallet } = useStore();
  const [message, setMessage] = useState("");

  const council = db.council;
  const pending = db.applications.filter((a) => a.status === "valide" || a.status === "approuve");
  const me = address ? councilMemberByWallet(address) : undefined;
  const isCouncil = !!me;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold">Conseil & gouvernance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          10 sièges, sans owner. Rotation possible au maximum tous les 30 jours après confirmation par un nombre fixe de signataires d'élection. Les membres sortis perdent leurs droits.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Composition du mois</CardTitle>
          <CardDescription>3 pionniers · influenceur · contributeurs X, Facebook, TikTok · trader · top wallet · siège élu</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siège</TableHead>
                <TableHead className="hidden md:table-cell">Rôle</TableHead>
                <TableHead>Poids</TableHead>
                <TableHead className="hidden lg:table-cell">Depuis</TableHead>
                <TableHead>Wallet (données d'accès)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {council.map((m) => (
                <TableRow key={m.id} data-testid={`row-council-${m.id}`} className={m.wallet === address ? "bg-primary/5" : undefined}>
                  <TableCell className="font-medium">{m.seat}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{m.role}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono tnum">{m.weight}</Badge></TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{m.since}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground tnum">
                      {m.wallet.slice(0, 8)}…{m.wallet.slice(-4)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Accès membre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {!address ? (
            <p className="text-sm text-muted-foreground">Connectez le wallet d'un membre du conseil (ex. le Fondateur de démonstration) pour accéder aux outils de gouvernance.</p>
          ) : !isCouncil ? (
            <p className="text-sm text-muted-foreground">Ce wallet ne siège pas au conseil ce mois-ci. Les données d'accès (wallet + poids) sont listées dans le tableau ci-dessus.</p>
          ) : (
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary/40 text-primary" data-testid="badge-council-member">
                <Landmark className="mr-1 h-3.5 w-3.5" /> {me?.seat} — poids {me?.weight}
              </Badge>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const r = runCycle(address);
                    setMessage(r.ok ? `Cycle exécuté : ${r.paid} facture(s) payée(s) pour ${fmt(r.total ?? 0)} USDC.` : r.error ?? "Erreur");
                  }}
                  data-testid="button-run-cycle"
                >
                  <Timer className="mr-1.5 h-3.5 w-3.5" /> Exécuter le cycle de distribution (24 h)
                </Button>
              </div>
            </div>
          )}
          {message ? (
            <p className={`text-sm ${message.startsWith("Cycle") ? "text-success" : "text-destructive"}`} role="status" data-testid="text-council-result">{message}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Dossiers validés — approbation du conseil</CardTitle>
          <CardDescription>Le conseil doit atteindre un poids cumulé d'au moins 5 pour autoriser le paiement. Plafond de 20 % du solde par cycle, un paiement par bénéficiaire tous les 30 jours.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun dossier validé en attente d'approbation.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-sm">
                  <span className="font-semibold">{a.provider}</span>
                  <span className="font-mono text-xs tnum text-muted-foreground">{fmt(a.amount)} USDC</span>
                  <span className="text-xs text-muted-foreground">Validations {validationsCount(a.id)}/5</span>
                  <span className="text-xs text-muted-foreground">Vote <span className="text-success">{a.yesVotes}</span>/<span className="text-destructive">{a.noVotes}</span></span>
                  <span className="text-xs text-muted-foreground">Poids conseil : <span className={`font-mono tnum ${councilWeightFor(a.id) >= 5 ? "text-success" : ""}`}>{councilWeightFor(a.id)}/5</span></span>
                  <Button
                    size="sm"
                    className="ml-auto"
                    disabled={!isCouncil}
                    onClick={() => {
                      if (!address) return;
                      const r = councilApprove(a.id, address);
                      setMessage(r.ok ? "Approbation enregistrée." : r.error ?? "Erreur");
                    }}
                    data-testid={`button-council-approve-${a.id}`}
                  >
                    Approuver
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Le conseil lit les membres depuis CouncilRegistry.sol : les membres retirés perdent leurs droits et leurs approbations ne comptent plus. Le fondateur (poids 3) a besoin de deux membres pour atteindre le seuil de 5. La rotation mensuelle est ouverte après confirmation par les signataires d'élection fixes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { Eye, BookOpen, ExternalLink } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = (a: string) => a.slice(0, 6) + "…" + a.slice(-4);

export default function TransparencePage() {
  const { db } = useStore();
  const payments = [...db.payments].sort((a, b) => b.paidAt - a.paidAt);
  const journal = [...db.journal].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : String(b.id) > String(a.id) ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold">Transparence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique des paiements, journal du projet et liens vers les contrats et le code. Les bénéficiaires sont affichés sous forme d'adresses raccourcies.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
          <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="hidden sm:table-cell">Bénéficiaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="hidden md:table-cell">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                  <TableCell className="whitespace-nowrap text-muted-foreground tnum" suppressHydrationWarning>
                    {new Date(p.paidAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="font-medium">{p.provider}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground tnum sm:table-cell">{short(p.beneficiary)}</TableCell>
                  <TableCell className="text-right font-mono tnum">{fmt(p.amount)} USDC</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{short(p.txHash)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Journal du projet</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ol className="divide-y divide-border">
            {journal.map((j) => (
              <li key={j.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-xs text-muted-foreground tnum">{j.date}</span>
                  <h3 className="text-sm font-semibold">{j.title}</h3>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{j.body}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Contrats et code</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="https://github.com/trevio-TRVO/billpay-protocol" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline" data-testid="link-github-repo">
                Dépôt GitHub — billpay-protocol <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a href="https://github.com/trevio-TRVO/billpay-protocol/blob/main/docs/SOLIDARITY_DASHBOARD.md" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                Spécification du tableau de bord de solidarité <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a href="https://github.com/trevio-TRVO/billpay-protocol/blob/main/docs/DEPLOY_V3.md" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                Guide de déploiement V3 <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li className="text-muted-foreground">
              Contrats : BillPayProtocol, CommunityLots, SolidarityWallet, CouncilRegistry, AutoLiquidity, MonthlyVesting — testés avec Foundry (49 tests), compilateur 0.8.26. Les adresses seront publiées ici au déploiement sur Base.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

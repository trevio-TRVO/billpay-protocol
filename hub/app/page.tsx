"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/lib/wallet";
import { useStore, type Application } from "@/lib/store";
import { HeartHandshake, Flame, Timer, Banknote, Users, TrendingUp, Droplets, Package, ArrowRight } from "lucide-react";

const fmt = (n: number, d = 2) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

const STATUS_LABEL: Record<string, string> = {
  controle_ia: "Contrôle IA", en_vote: "En vote", valide: "Validé (5/5)",
  approuve: "Approuvé par le conseil", paye: "Payé", rejete: "Rejeté",
};

export default function Dashboard() {
  const { db, validationsCount, councilWeightFor } = useStore();
  const stats = db.stats;
  const countdown = useCountdown(stats.lastCycleAt + 86400000);

  const active = db.applications
    .filter((a) => a.status !== "paye")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const kpis = [
    { label: "Total versé aux familles", value: `${fmt(stats.totalPaidUsdc)} USDC`, icon: Banknote, testid: "kpi-total-paid" },
    { label: "Familles aidées", value: String(stats.familiesHelped), icon: Users, testid: "kpi-families" },
    { label: "Dossiers en cours", value: String(db.applications.filter((a) => ["en_vote", "valide", "approuve"].includes(a.status)).length), icon: Package, testid: "kpi-pending" },
    { label: "BILL brûlés", value: fmt(stats.burnedBill, 0), icon: Flame, testid: "kpi-burned" },
    { label: "Prix BILL", value: `${fmt(stats.priceUsdc, 5)} USDC`, icon: TrendingUp, testid: "kpi-price" },
    { label: "Liquidité de la paire", value: `${fmt(stats.liquidityUsdc)} USDC`, icon: Droplets, testid: "kpi-liquidity" },
    { label: "Voix exprimées", value: String(db.applications.reduce((n, a) => n + a.yesVotes + a.noVotes, 0)), icon: Users, testid: "kpi-votes" },
    { label: "Dossiers signalés par l'IA", value: String(db.applications.filter((a) => a.aiFlag && a.status === "controle_ia").length), icon: Flame, testid: "kpi-flagged" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque échange BILL prélève 10 % de contribution : 5 % paient des factures d'énergie de familles en difficulté.
        </p>
      </div>

      {/* Compteur d'Impact */}
      <Card className="overflow-hidden" data-testid="card-impact-counter">
        <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
              Compteur d'Impact — solde du solidarityWallet
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold text-primary tnum lg:text-5xl" data-testid="text-impact-balance">
              {fmt(stats.solidarityBalanceUsdc)} <span className="text-xl font-bold text-muted-foreground lg:text-2xl">USDC</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Alimenté en temps réel par les 5 % d'aide directe prélevés sur chaque échange via la paire de liquidité. Distribution automatique toutes les 24 heures.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                <Timer className="mr-1 h-3 w-3" /> Prochain cycle dans <span className="font-mono tnum ml-1">{countdown}</span>
              </Badge>
              <Badge variant="outline" className="border-chart-2/40 text-chart-2">Réseau Base</Badge>
            </div>
          </div>
          <div className="border-t border-border bg-secondary/40 p-6 md:border-l md:border-t-0 lg:p-8">
            <h2 className="text-sm font-semibold">Répartition de la contribution (10 % par échange)</h2>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Aide directe (factures)", value: 5, icon: HeartHandshake, color: "bg-primary" },
                { label: "Brûlage (rareté)", value: 2, icon: Flame, color: "bg-chart-4" },
                { label: "Support opérationnel", value: 2, icon: Banknote, color: "bg-chart-3" },
                { label: "Liquidité automatique", value: 1, icon: Droplets, color: "bg-chart-2" },
              ].map((row) => (
                <li key={row.label} className="text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <row.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {row.label}
                    </span>
                    <span className="font-mono tnum text-muted-foreground">{row.value} %</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.value * 10}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} data-testid={kpi.testid}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <kpi.icon className="h-3.5 w-3.5" aria-hidden="true" /> {kpi.label}
              </div>
              <p className="mt-2 font-display text-lg font-bold tnum" data-testid={`${kpi.testid}-value`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dossiers en cours */}
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b border-border pb-3">
          <CardTitle className="text-base">Dossiers en cours de traitement</CardTitle>
          <Link href="/tribunal" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline" data-testid="link-tribunal-from-dashboard">
            Tribunal solidaire <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {active.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm sm:px-6">
                <span className="font-medium">{a.provider}</span>
                <span className="font-mono text-xs text-muted-foreground tnum">{fmt(a.amount)} USDC</span>
                <Badge variant="outline" className={a.aiFlag ? "border-destructive/40 text-destructive" : "border-success/40 text-success"}>
                  IA {a.aiScore}/100
                </Badge>
                <span className="text-xs text-muted-foreground">Validations {validationsCount(a.id)}/5</span>
                <span className="text-xs text-muted-foreground">Conseil {councilWeightFor(a.id)}/5</span>
                <span className="text-xs text-muted-foreground">
                  Vote <span className="text-success">{a.yesVotes}</span> / <span className="text-destructive">{a.noVotes}</span>
                </span>
                <span className="ml-auto"><StatusBadge status={a.status} /></span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

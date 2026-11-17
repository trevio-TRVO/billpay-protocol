"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";
import { ShieldAlert, Droplets, Flame, Banknote, HeartHandshake, Lock, Percent } from "lucide-react";

const ALLOCATION = [
  { name: "Liquidité (50 %)", value: 50, color: "hsl(215 90% 62%)" },
  { name: "Fondateur — vesting 90 j + 36 mois (20 %)", value: 20, color: "hsl(38 95% 56%)" },
  { name: "Lots communautaires (15 %)", value: 15, color: "hsl(172 60% 45%)" },
  { name: "Croissance — vesting 48 mois (15 %)", value: 15, color: "hsl(45 90% 60%)" },
];

const MECHANISMS = [
  {
    icon: Percent,
    title: "Contribution de solidarité — 10 %",
    body: "Prélevée uniquement sur les échanges via la paire de liquidité. Les transferts ordinaires et les claims des lots communautaires en sont exemptés.",
    detail: "5 % aide · 2 % brûlage · 2 % support · 1 % auto-LP",
  },
  {
    icon: ShieldAlert,
    title: "Anti-crash — 1 %",
    body: "Un mécanisme de 1 % conçu pour freiner les effondrements de prix. Il ne crée ni plancher ni garantie de prix.",
    detail: "Spécifié dans le journal du projet",
  },
  {
    icon: Lock,
    title: "Protection de lancement — 7 jours",
    body: "0,1 % maximum par vente et 0,2 % par wallet et par jour, sur les paires de trading uniquement. Les transferts P2P restent libres.",
    detail: "Durée : 7 jours après le lancement",
  },
  {
    icon: Flame,
    title: "Déflation — 2 % brûlés",
    body: "Chaque échange détruit définitivement 2 % du montant échangé. La réduction de l'offre ne garantit aucun effet sur le prix.",
    detail: "Définitif, aucune remise en circulation",
  },
  {
    icon: Droplets,
    title: "Liquidité automatique — 1 %",
    body: "499,5 millions de BILL en réserve sont injectés progressivement dans la paire au fil des contributions collectées.",
    detail: "Lancement : 500 000 BILL + 50 USDC",
  },
  {
    icon: Banknote,
    title: "Sans admin",
    body: "Aucune clé privilégiée ne peut modifier le contrat après le déploiement. Le token route les 5 % d'aide vers le solidarityWallet, rien d'autre.",
    detail: "Contrats vérifiables sur Basescan",
  },
];

const CONTRACTS = [
  { name: "BillPayProtocol (BILL)", role: "Token ERC-20 — contribution 10 %, anti-crash, protections", address: "À déployer" },
  { name: "CommunityLots", role: "Lots communautaires — 1 lot/wallet, vesting 45 j + 30 j linéaire", address: "À déployer" },
  { name: "SolidarityWallet", role: "Paie uniquement le bénéficiaire validé — plafond 20 % du solde", address: "À déployer" },
  { name: "CouncilRegistry", role: "Conseil de 10 sièges, rotation max tous les 30 jours", address: "À déployer" },
  { name: "AutoLiquidity", role: "Injection progressive de la réserve dans la paire BILL/USDC", address: "À déployer" },
  { name: "MonthlyVesting", role: "Vesting fondateur (90 j + 36 mois) et croissance (48 mois)", address: "À déployer" },
];

// Série de prix simulée pour la démonstration
const priceData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  price: 0.0001 * (1 + 0.004 * i + Math.sin(i / 3.2) * 0.00035),
}));

export default function TokenPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold">Token BILL</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Token déflationnaire sur Base, sans admin. Aucune promesse de prix ni de rendement : le token est risqué et peut perdre toute sa valeur.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Cours BILL/USDC — démonstration</CardTitle>
            <CardDescription>Prix TWAP indicatif (données simulées pour l'aperçu)</CardDescription>
          </CardHeader>
          <CardContent className="h-64 p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38 95% 56%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(38 95% 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(215 12% 62%)" }} tickFormatter={(v) => `J${v}`} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215 12% 62%)" }} tickFormatter={(v) => v.toFixed(5)} axisLine={false} tickLine={false} width={52} domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 28% 10%)", border: "1px solid hsl(220 18% 17%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(5)} USDC`, "Prix"]}
                />
                <Area type="monotone" dataKey="price" stroke="hsl(38 95% 56%)" strokeWidth={2} fill="url(#priceFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Allocation de l'offre — 1 000 M BILL</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ALLOCATION} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2} strokeWidth={0} isAnimationActive={false}>
                    {ALLOCATION.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(222 28% 10%)", border: "1px solid hsl(220 18% 17%)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => `${v} %`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs">
              {ALLOCATION.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden="true" />
                  <span className="text-muted-foreground">{a.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Mécanismes du protocole</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MECHANISMS.map((m, i) => (
            <Card key={m.title} data-testid={`card-mechanism-${i}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <m.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-sm font-semibold">{m.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                <p className="mt-3 font-mono text-xs text-muted-foreground tnum">{m.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Contrats du protocole</CardTitle>
          <CardDescription>
            Solidity 0.8.26 · testés avec Foundry (49 tests) · code vérifiable sur{" "}
            <a href="https://github.com/trevio-TRVO/billpay-protocol" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              GitHub
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrat</TableHead>
                <TableHead className="hidden md:table-cell">Rôle</TableHead>
                <TableHead>État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONTRACTS.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-mono text-xs">{c.name}</TableCell>
                  <TableCell className="hidden max-w-sm text-muted-foreground md:table-cell">{c.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-chart-3/40 text-chart-3">{c.address}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-5">
          <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Avertissement risques.</strong> La contribution de 10 % réduit la valeur nette reçue lors d'un échange. Le brûlage et la liquidité automatique ne garantissent aucun prix. Ce site est une interface de démonstration : les contrats ne sont pas encore déployés et aucune donnée financière réelle n'est affichée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

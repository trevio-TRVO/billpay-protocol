"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { Bot, ClipboardX, Gauge, ShieldAlert, UserCheck, Database } from "lucide-react";

const LEVEL_STYLES: Record<string, string> = {
  block: "border-destructive/40 text-destructive",
  warn: "border-chart-4/50 text-chart-4",
  info: "text-muted-foreground",
};

export default function AntibotPage() {
  const { db } = useStore();
  const audit = [...db.audit].sort((a, b) => b.at - a.at);
  const flagged = db.applications.filter((a) => a.aiFlag === 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold">Contrôle IA & anti-bot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Objectif : protéger le fonds contre les faux bénéficiaires et les bots, sans clé privilégiée. L'IA classe et signale — elle ne paie jamais.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Pipeline de protection</CardTitle>
          <CardDescription>Cinq barrières entre le dépôt et le paiement — la décision finale reste on-chain et sans admin.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <ol className="grid gap-4 md:grid-cols-2">
            {[
              { icon: ClipboardX, title: "1. Saisie manuelle", body: "Collage et glisser-déposer bloqués dans le champ description (contrôle navigateur — un frein, pas une garantie)." },
              { icon: Bot, title: "2. Contrôle IA automatique", body: "Analyse facture + description : cohérence, doublons, falsification, texte généré en masse, comportement de bot (vitesse de soumission, honeypot). L'IA classe et signale ; elle ne détient aucune clé de paiement." },
              { icon: ShieldAlert, title: "3. Validations on-chain", body: "Au moins 5 acquéreurs de lots distincts doivent approuver (preuve dans CommunityLots.grants). Un dossier signalé suspend la validation." },
              { icon: UserCheck, title: "4. Vote public identifié", body: "Une voix par compte Google (ou équivalent). Journal d'audit, limitation de débit : plus de 5 votes par minute déclenchent un blocage temporaire." },
              { icon: Database, title: "5. Paiement automatique", body: "Dès que les conditions sont réunies (non signalé, ≥ 5 validations, vote favorable, conseil ≥ 5), le solidarityWallet paie au cycle de 24 h. Aucune intervention manuelle." },
            ].map((step, i) => (
              <li key={i} className={`flex gap-3 ${i === 4 ? "md:col-span-2" : ""}`}>
                <step.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Dossiers signalés par l'IA</CardTitle>
          <CardDescription>Publication suspendue — le veto est contestable par les validateurs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {flagged.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun dossier signalé actuellement.</p>
          ) : (
            <ul className="divide-y divide-border">
              {flagged.map((a) => (
                <li key={a.id} className="px-5 py-4" data-testid={`row-flagged-${a.id}`}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="font-semibold">{a.provider}</span>
                    <span className="font-mono text-xs tnum text-muted-foreground">{a.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                    <Badge variant="outline" className="border-destructive/40 text-destructive">
                      <Gauge className="mr-1 h-3 w-3" /> Score IA {a.aiScore}/100
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.aiNotes}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Journal d'audit anti-bot</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {audit.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <Badge variant="outline" className={`text-xs ${LEVEL_STYLES[e.level] ?? LEVEL_STYLES.info}`}>
                  {e.level === "block" ? "Blocage" : e.level === "warn" ? "Signalement" : "Info"}
                </Badge>
                <span className="font-medium">{e.action}</span>
                <span className="min-w-0 flex-1 text-xs text-muted-foreground">{e.detail}</span>
                <span className="font-mono text-xs text-muted-foreground tnum" suppressHydrationWarning>
                  {new Date(e.at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Risques assumés.</strong> Le blocage du collage est contournable — c'est un frein, pas une garantie. Cinq validateurs peuvent s'entendre ou être un même acteur multi-wallet (1 achat par wallet) : pistes — tirage au sort, ancienneté minimale, rotation. Un vote public à une voix par compte reste vulnérable aux faux comptes : pistes — vérification d'identité, ancienneté minimale, quorum. Aucun document ni identité n'est inscrit sur la chaîne ; un dossier par adresse et par période, contre la revente de factures.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

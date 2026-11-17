"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/wallet";
import { useStore, type Application } from "@/lib/store";
import { Bot, FileText, ShieldCheck, Upload, ClipboardX } from "lucide-react";

export default function DemandePage() {
  const { address } = useWallet();
  const { submitApplication } = useStore();
  const openedAt = useRef(Date.now());
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("electricite");
  const [amount, setAmount] = useState("");
  const [urgency, setUrgency] = useState("2");
  const [description, setDescription] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [fileName, setFileName] = useState("");
  const [pasteBlocked, setPasteBlocked] = useState(0);
  const [aiResult, setAiResult] = useState<{ application: Application; ai: { score: number; flag: boolean; notes: string } } | null>(null);
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) { setError("Connectez d'abord votre wallet."); return; }
    if (!provider || !amount || description.trim().split(/\s+/).length < 12) {
      setError("Fournisseur, montant et description d'au moins 12 mots sont requis.");
      return;
    }
    const result = submitApplication({
      wallet: address, provider, category, urgency: Number(urgency),
      amount: Number(amount), description,
      elapsedMs: Date.now() - openedAt.current, honeypot,
    });
    setAiResult(result);
    setError("");
  };

  const words = description.trim() ? description.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold">Espace demandeurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Déposez une demande de paiement de facture d'énergie. Les données privées ne sont jamais publiées ni inscrites sur la chaîne : seule l'empreinte du dossier y figure.
        </p>
      </div>

      {aiResult && (
        <Card data-testid="card-ai-result" className={aiResult.ai.flag ? "border-destructive/40" : "border-success/40"}>
          <CardHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Bot className={`h-4 w-4 ${aiResult.ai.flag ? "text-destructive" : "text-success"}`} aria-hidden="true" />
              <CardTitle className="text-base">Contrôle IA — dossier #{aiResult.application.id}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-display text-3xl font-bold tnum" data-testid="text-ai-score">{aiResult.ai.score}<span className="text-lg text-muted-foreground">/100</span></p>
              <Badge variant="outline" className={aiResult.ai.flag ? "border-destructive/40 text-destructive" : "border-success/40 text-success"}>
                {aiResult.ai.flag ? "Signalé — publication suspendue" : "Publié au Tribunal solidaire"}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{aiResult.ai.notes}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              L'IA classe et signale, elle ne détient aucune clé de paiement. Un dossier signalé peut être réexaminé par les validateurs (droit de veto contestable).
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Formulaire de demande</CardTitle>
          <CardDescription>Saisie manuelle uniquement — le collage est bloqué pour freiner les demandes automatisées.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="provider">Fournisseur d'énergie</Label>
                <Input id="provider" placeholder="EDF, İGDAŞ, Engie…" value={provider} onChange={(e) => setProvider(e.target.value)} data-testid="input-provider" />
              </div>
              <div>
                <Label htmlFor="category">Type de facture</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricite">Électricité</SelectItem>
                    <SelectItem value="gaz">Gaz</SelectItem>
                    <SelectItem value="chauffage">Chauffage</SelectItem>
                    <SelectItem value="eau">Eau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Montant à payer (USDC)</Label>
                <Input id="amount" type="number" min="1" step="0.01" placeholder="145.80" value={amount} onChange={(e) => setAmount(e.target.value)} className="tnum" data-testid="input-amount" />
              </div>
              <div>
                <Label>Niveau d'urgence</Label>
                <RadioGroup value={urgency} onValueChange={setUrgency} className="mt-2 flex gap-4" aria-label="Urgence">
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="1" id="u1" /><Label htmlFor="u1" className="text-xs font-normal">Normale</Label></div>
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="2" id="u2" /><Label htmlFor="u2" className="text-xs font-normal">Élevée</Label></div>
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="3" id="u3" /><Label htmlFor="u3" className="text-xs font-normal">Coupure imminente</Label></div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Votre situation (description)</Label>
                <span className={`text-xs tnum ${words >= 12 ? "text-success" : "text-muted-foreground"}`}>{words} mots</span>
              </div>
              <Textarea
                id="description"
                placeholder="Décrivez votre situation à la main : contexte, difficultés, échéances…"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onPaste={(e) => { e.preventDefault(); setPasteBlocked((n) => n + 1); }}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setPasteBlocked((n) => n + 1); }}
                data-testid="input-description"
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ClipboardX className="h-3.5 w-3.5" aria-hidden="true" />
                Coller est bloqué (contrôle navigateur — frein, pas garantie).
                {pasteBlocked > 0 ? <span className="text-chart-4"> · {pasteBlocked} tentative(s) de collage bloquée(s)</span> : null}
              </p>
            </div>

            <div>
              <Label htmlFor="bill-upload">Facture (PDF ou image)</Label>
              <label
                htmlFor="bill-upload"
                className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-center hover:border-primary/50"
                data-testid="label-bill-upload"
              >
                <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {fileName ? `Facture jointe : ${fileName}` : "Téléverser la facture — chiffrée au repos, données privées masquées, jamais publiée"}
                </span>
                <input
                  id="bill-upload" type="file" accept=".pdf,image/*" className="sr-only"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                />
              </label>
              {fileName ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aperçu masqué : seul le montant et le fournisseur seront visibles des validateurs et votants.
                </p>
              ) : null}
            </div>

            {/* Honeypot anti-bot : invisible pour les humains */}
            <div className="sr-only" aria-hidden="true">
              <Label htmlFor="website">Site web (laisser vide)</Label>
              <Input id="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {error ? <p className="text-sm text-destructive" role="alert" data-testid="text-form-error">{error}</p> : null}

            <Button type="submit" size="lg" data-testid="button-submit-application">
              <FileText className="mr-1.5 h-4 w-4" />
              Déposer la demande
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Ce qui se passe après le dépôt</p>
              <p className="mt-1">
                1. L'IA analyse la facture et la description (cohérence, doublons, texte généré, comportement de bot) et attribue un score. 2. Si le dossier n'est pas signalé, il est publié anonymement au Tribunal solidaire. 3. Au moins 5 acquéreurs de lots doivent le valider on-chain. 4. Le public vote (une voix par compte identifié). 5. Le conseil approuve (poids ≥ 5). 6. Le solidarityWallet paie la facture au prochain cycle de 24 h — plafond de 20 % du solde, un paiement par bénéficiaire tous les 30 jours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

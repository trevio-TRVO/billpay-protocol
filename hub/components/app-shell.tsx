"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWallet, DEMO_ACCOUNTS, shortAddress } from "@/lib/wallet";
import { useStore } from "@/lib/store";
import {
  Zap, LayoutDashboard, Coins, Wallet, Package, FileText, Scale, ShieldCheck,
  Landmark, Bot, Eye, Menu, LogIn, LogOut, UserRound, RotateCcw,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/token", label: "Token BILL", icon: Coins },
  { href: "/wallet", label: "Mon wallet", icon: Wallet },
  { href: "/lots", label: "Lots communautaires", icon: Package },
  { href: "/demande", label: "Espace demandeurs", icon: FileText },
  { href: "/tribunal", label: "Tribunal solidaire", icon: Scale },
  { href: "/validateurs", label: "Espace validateurs", icon: ShieldCheck },
  { href: "/conseil", label: "Conseil & gouvernance", icon: Landmark },
  { href: "/antibot", label: "Contrôle IA & anti-bot", icon: Bot },
  { href: "/transparence", label: "Transparence", icon: Eye },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2" data-testid="link-brand">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-bold leading-none">
        BillPay <span className="text-primary">Hub</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Navigation principale">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            data-testid={`link-nav-${href.replace(/\//g, "").replace("-", "") || "dashboard"}`}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ConnectWalletDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { connect } = useWallet();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");

  const pick = (address: string) => {
    connect(address);
    onOpenChange(false);
    setCustom("");
    setError("");
  };

  const submitCustom = () => {
    if (/^0x[a-zA-Z0-9]{6,40}$/.test(custom.trim())) pick(custom.trim());
    else setError("Adresse invalide — doit commencer par 0x");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connexion wallet — réseau Base</DialogTitle>
          <DialogDescription>
            Démonstration : sélectionnez un wallet de démonstration ou saisissez une adresse. En production, cette étape utilise votre wallet réel (MetaMask, Coinbase Wallet…) via wagmi/viem.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Comptes de démonstration</Label>
            <div className="mt-2 space-y-1.5">
              {DEMO_ACCOUNTS.map((acc, i) => (
                <button
                  key={acc.address}
                  onClick={() => pick(acc.address)}
                  data-testid={`button-demo-account-${i}`}
                  className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-left text-sm hover:border-primary/50"
                >
                  <span className="font-semibold">{acc.label}</span>
                  <span className="block font-mono text-xs text-muted-foreground tnum">{acc.address}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="custom-address" className="text-xs uppercase tracking-wide text-muted-foreground">
              Adresse personnalisée
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="custom-address"
                placeholder="0x…"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setError(""); }}
                className="font-mono tnum"
                data-testid="input-custom-address"
              />
              <Button onClick={submitCustom} data-testid="button-connect-custom">Connecter</Button>
            </div>
            {error && <p className="mt-1.5 text-xs text-destructive" role="alert">{error}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoogleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { identify } = useWallet();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      identify(email.trim());
      onOpenChange(false);
    } else setError("Adresse e-mail invalide");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Identification pour voter</DialogTitle>
          <DialogDescription>
            Une seule voix par compte. En production : connexion Google OAuth (ou équivalent). Démonstration : saisie d'e-mail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="google-email">Compte Google</Label>
            <Input
              id="google-email"
              type="email"
              placeholder="vous@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              data-testid="input-google-email"
            />
          </div>
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
          <Button onClick={submit} className="w-full" data-testid="button-google-submit">
            <LogIn className="h-4 w-4 mr-1.5" /> S'identifier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { address, googleUser, disconnect } = useWallet();
  const { reset } = useStore();
  const [walletOpen, setWalletOpen] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar bureau */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex" aria-label="Barre latérale">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Brand />
        </div>
        <ScrollArea className="flex-1 py-3">
          <NavLinks />
        </ScrollArea>
        <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground leading-relaxed">
          Réseau <span className="text-primary font-medium">Base</span> · Contrats sans admin ·{" "}
          <a href="https://github.com/trevio-TRVO/billpay-protocol" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Code source
          </a>
          <button
            onClick={reset}
            className="mt-2 flex items-center gap-1.5 rounded-md px-1 py-1 text-xs text-muted-foreground hover:text-foreground"
            data-testid="button-reset-demo"
          >
            <RotateCcw className="h-3 w-3" /> Réinitialiser la démo
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                <Brand />
              </div>
              <div className="py-3">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Badge variant="outline" className="hidden shrink-0 border-primary/30 text-primary sm:inline-flex">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
            Base
          </Badge>

          <div className="flex-1" />

          {googleUser ? (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" data-testid="text-google-user">
              <UserRound className="h-3.5 w-3.5" /> {googleUser}
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setGoogleOpen(true)} className="hidden sm:inline-flex" data-testid="button-google-login">
              <UserRound className="h-4 w-4 mr-1.5" /> S'identifier pour voter
            </Button>
          )}

          {address ? (
            <Button variant="secondary" size="sm" onClick={disconnect} data-testid="button-wallet-connected" title="Déconnecter">
              <span className="font-mono text-xs tnum">{shortAddress(address)}</span>
              <LogOut className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setWalletOpen(true)} data-testid="button-connect-wallet">
              <Wallet className="h-4 w-4 mr-1.5" /> Connecter
            </Button>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="border-t border-border px-4 py-5 text-xs leading-relaxed text-muted-foreground lg:px-8">
          BillPay Protocol (BILL) — token de solidarité sur Base. La contribution de 10 % s'applique aux échanges via la paire de liquidité, pas aux transferts ordinaires ni aux claims des lots. Aucune promesse de prix ni de rendement : le token est risqué et peut perdre toute sa valeur. Interface de démonstration — les contrats ne sont pas encore déployés en production.
        </footer>
      </div>

      <ConnectWalletDialog open={walletOpen} onOpenChange={setWalletOpen} />
      <GoogleDialog open={googleOpen} onOpenChange={setGoogleOpen} />
    </div>
  );
}

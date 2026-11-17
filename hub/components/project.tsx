import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const REPO = "https://github.com/trevio-TRVO/billpay-protocol";
export const DOCS = `${REPO}/blob/main/docs`;

export function PageIntro({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <header className="page-intro">
    <p className="eyebrow">{label}</p>
    <h1>{title}</h1>
    <p>{children}</p>
  </header>;
}

export function StatusPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="data-panel">
    <span className="status-marker"><span aria-hidden="true" /> Non disponible</span>
    <h2>{title}</h2>
    <p>{children}</p>
  </section>;
}

export function ProjectLink({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  const className = primary ? "action-link primary-action" : "action-link";
  return href.startsWith("/") ?
    <Link className={className} href={href}>{children}<ArrowRight size={17} aria-hidden="true" /></Link> :
    <a className={className} href={href}>{children}<ArrowUpRight size={17} aria-hidden="true" /></a>;
}

export const contributions = [
  ["5 %", "Aide aux factures"],
  ["2 %", "Brûlage de jetons"],
  ["2 %", "Fonctionnement du projet"],
  ["1 %", "Liquidité automatique"],
];

export function ContributionPanel() {
  return <section className="data-panel contribution-panel">
    <p className="eyebrow">Règle du protocole</p>
    <h2>10 % par échange</h2>
    <p>Uniquement sur les achats et ventes via la paire de liquidité, pas sur les transferts ordinaires.</p>
    <dl>{contributions.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>;
}

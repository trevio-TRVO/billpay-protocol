"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, Zap } from "lucide-react";

const nav = [
  { title: "Solidarité", pages: [
    ["/", "Tableau de bord"], ["/demande/", "Espace demandeurs"],
    ["/tribunal/", "Tribunal solidaire"], ["/transparence/", "Transparence"],
  ] },
  { title: "Protocole", pages: [
    ["/token/", "Jeton BILL"], ["/lots/", "Lots communautaires"],
    ["/wallet/", "Mon wallet"], ["/validateurs/", "Espace validateurs"],
    ["/conseil/", "Conseil"], ["/antibot/", "Contrôle des dossiers"],
  ] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const current = pathname.replace(/\/$/, "") || "/";

  return (
    <div className="hub">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header className="hub-header">
        <Link href="/" className="hub-brand" onClick={() => setOpen(false)}>
          <Zap size={21} aria-hidden="true" />
          <span>BillPay <strong>Hub</strong></span>
        </Link>
        <span className="header-network"><span className="network-dot" aria-hidden="true" /> Réseau Base</span>
        <button className="menu-toggle" type="button" aria-controls="navigation" aria-expanded={open}
          onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />} Menu
        </button>
      </header>
      <nav id="navigation" aria-label="Navigation principale" className={`hub-nav${open ? " is-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            setOpen(false);
            document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
          }
        }}>
        {nav.map(({ title, pages }) => (
          <div key={title} className="nav-group">
            <p>{title}</p>
            <ul>{pages.map(([href, label]) => (
              <li key={href}><Link href={href} onClick={() => setOpen(false)}
                aria-current={(href.replace(/\/$/, "") || "/") === current ? "page" : undefined}>{label}</Link></li>
            ))}</ul>
          </div>
        ))}
      </nav>
      <main id="contenu" tabIndex={-1} className="hub-main">
        {children}
        <footer className="hub-footer">
          <span>BillPay Protocol · BILL</span>
          <a href="https://github.com/trevio-TRVO/billpay-protocol">Code et documentation <ArrowUpRight size={15} aria-hidden="true" /></a>
        </footer>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { WalletProvider } from "@/lib/wallet";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "BillPay Hub — Protocole de solidarité sur Base",
  description:
    "BillPay Protocol (BILL) : contribution de solidarité de 10 % sur les échanges, paiement direct de factures d'énergie, validation par 5 acquéreurs de lots, vote public et conseil communautaire. Réseau Base.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>
          <WalletProvider>
            <AppShell>{children}</AppShell>
          </WalletProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

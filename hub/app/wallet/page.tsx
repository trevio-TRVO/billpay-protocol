import { PageIntro } from "@/components/project";
import { WalletConnect } from "@/components/wallet-connect";

export const metadata = { title: "Mon wallet" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Protocole" title="Mon wallet">
      Vérifiez l’adresse publique et le réseau de votre portefeuille. Cette page ne demande aucune signature, n’envoie aucune transaction et n’affiche aucun solde fictif.
    </PageIntro>
    <WalletConnect />
  </div>;
}

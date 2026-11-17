import { AccountPanel } from "@/components/account-panel";
import { PageIntro, ProjectLink } from "@/components/project";

export const metadata = { title: "Mon compte", robots: { index: false, follow: true } };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Compte BillPay" title="Mon compte">
      Un seul compte pour consulter vos vérifications, associer un portefeuille Base et accéder aux espaces pour lesquels vous êtes admissible.
    </PageIntro>
    <AccountPanel />
    <section className="data-panel">
      <h2>Comment les accès sont attribués</h2>
      <dl className="account-rules">
        <div><dt>Demandeur</dt><dd>Une tierce partie doit vérifier votre identité et la facture de chaque dossier. Ne transmettez pas de document ici.</dd></div>
        <div><dt>Gold</dt><dd>Un lot acheté ou attribué doit être enregistré dans le contrat officiel. Détenir des BILL ne suffit pas. La validation des dossiers a des conditions distinctes.</dd></div>
        <div><dt>Conseil</dt><dd>Votre wallet associé doit occuper un siège actif dans le registre. Une deuxième vérification est requise à la connexion.</dd></div>
        <div><dt>Fondateur</dt><dd>Accès réservé au compte désigné, avec deuxième vérification. Ce statut ne donne pas de pouvoir supplémentaire sur les contrats.</dd></div>
      </dl>
      <ProjectLink href="/demande/">Voir le parcours d’aide</ProjectLink>
    </section>
  </div>;
}

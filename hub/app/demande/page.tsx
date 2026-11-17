import { PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Espace demandeurs" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Solidarité" title="Espace demandeurs">
      Le dispositif vise à aider des familles à payer une facture d’électricité ou de chauffage.
    </PageIntro>
    <StatusPanel title="Le dépôt de factures n’est pas ouvert">
      Le service de traitement sécurisé des factures n’est pas connecté à ce site.
      N’envoyez pas de facture, de pièce d’identité ni de données personnelles via GitHub ou les réseaux sociaux.
    </StatusPanel>
    <section className="data-panel">
      <h2>Parcours prévu d’un dossier</h2>
      <ol className="steps">
        <li><strong>Dépôt privé.</strong> Le demandeur indique le fournisseur, le montant et l’urgence, puis joint un justificatif.</li>
        <li><strong>Contrôle et validation.</strong> Un contrôle signale les anomalies ; les validateurs examinent le dossier.</li>
        <li><strong>Approbation et versement.</strong> Le conseil intervient selon les règles du contrat. Le vote public reste consultatif.</li>
      </ol>
      <ProjectLink href="/tribunal/">Voir le rôle du Tribunal</ProjectLink>
      <div><ProjectLink href="/compte/">Comprendre la vérification du compte demandeur</ProjectLink></div>
    </section>
  </div>;
}

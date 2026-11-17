import { ContributionPanel, DOCS, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Jeton BILL" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Protocole" title="Jeton BILL">
      BILL est le jeton du protocole prévu sur Base. Les pourcentages ci-dessous sont des règles de conception, pas des mesures de marché.
    </PageIntro>
    <ContributionPanel />
    <StatusPanel title="Aucun cours ni achat vérifié dans le Hub">
      Le Hub n’affiche ni prix simulé ni lien d’achat non vérifié. BILL présente un risque de perte totale ; le brûlage et la liquidité ne garantissent aucun prix ni rendement.
    </StatusPanel>
    <ProjectLink href={`${DOCS}/DEPLOY_V3.md`}>Consulter le guide V3</ProjectLink>
  </div>;
}

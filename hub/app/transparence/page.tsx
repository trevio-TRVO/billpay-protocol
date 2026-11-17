import { DOCS, REPO, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Transparence" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Solidarité" title="Transparence">
      Consultez le code, les décisions et les règles de versement du projet.
    </PageIntro>
    <StatusPanel title="Historique des versements non connecté">
      Le Hub ne dispose pas d’une source vérifiée pour afficher les transactions et le solde du fonds sur Base. Cela ne signifie pas que le solde est nul.
    </StatusPanel>
    <section className="data-panel">
      <h2>Sources du projet</h2>
      <ul className="resource-list">
        <li><ProjectLink href={`${REPO}/tree/main/contracts`}>Code des contrats Solidity</ProjectLink></li>
        <li><ProjectLink href={`${DOCS}/SOLIDARITY_DASHBOARD.md`}>Fonctionnement du dispositif d’aide</ProjectLink></li>
        <li><ProjectLink href={`${DOCS}/DECISIONS.md`}>Décisions du projet</ProjectLink></li>
        <li><ProjectLink href={`${DOCS}/DEPLOY_V3.md`}>Guide de déploiement V3</ProjectLink></li>
      </ul>
    </section>
  </div>;
}

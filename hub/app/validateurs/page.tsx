import { DOCS, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Espace validateurs" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Protocole" title="Espace validateurs">
      Le contrat prévoit au moins cinq validations distinctes. Pour être admissible, un portefeuille doit avoir acheté un lot détenu depuis au moins 30 jours.
    </PageIntro>
    <StatusPanel title="La validation n’est pas ouverte dans le Hub">
      Aucun dossier à examiner ni action de validation sur Base n’est disponible depuis ce site.
    </StatusPanel>
    <ProjectLink href={`${DOCS}/SOLIDARITY_DASHBOARD.md`}>Lire les conditions de validation</ProjectLink>
  </div>;
}

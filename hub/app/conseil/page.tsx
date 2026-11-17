import { DOCS, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Conseil" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Protocole" title="Conseil et gouvernance">
      Le modèle prévoit dix sièges. Les approbations du conseil participent aux conditions de versement et sont distinctes du vote public.
    </PageIntro>
    <StatusPanel title="Composition et approbations non connectées">
      Le Hub n’affiche pas de liste de membres non vérifiée et ne permet pas de signer une approbation.
    </StatusPanel>
    <ProjectLink href={`${DOCS}/COUNCIL.md`}>Lire les règles du conseil</ProjectLink>
  </div>;
}

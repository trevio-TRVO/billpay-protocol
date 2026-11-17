import { DOCS, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Tribunal solidaire" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Solidarité" title="Tribunal solidaire">
      La communauté pourra donner un avis sur des dossiers anonymisés. Cet avis ne déclenche ni n’autorise un versement.
    </PageIntro>
    <StatusPanel title="Le vote public n’est pas ouvert">
      Le service d’identification et de décompte des voix n’est pas connecté. Aucun dossier ni résultat de démonstration n’est affiché.
    </StatusPanel>
    <section className="data-panel">
      <h2>Ce que décide le contrat</h2>
      <p>Le versement exige au moins cinq validations admissibles, des approbations d’un poids total d’au moins cinq, un délai d’au moins 24 h à partir de la cinquième validation et des fonds suffisants. Une transaction doit ensuite exécuter le versement.</p>
      <ProjectLink href={`${DOCS}/DECISIONS.md`}>Lire la décision sur le vote public</ProjectLink>
    </section>
  </div>;
}

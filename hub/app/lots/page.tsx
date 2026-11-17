import { DOCS, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Lots communautaires" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Protocole" title="Lots communautaires">
      Les lots sont un mécanisme de distribution du jeton distinct du dispositif d’aide aux factures.
    </PageIntro>
    <StatusPanel title="Achat et retrait indisponibles dans le Hub">
      La disponibilité n’est pas vérifiée. Le Hub ne propose pas de transaction d’achat ou de retrait.
    </StatusPanel>
    <section className="data-panel">
      <h2>Règles prévues</h2>
      <p>La distribution prévoit des lots pionniers, puis des séries conditionnelles. Un lot par portefeuille, avec blocage de 45 jours, puis déblocage progressif sur 30 jours.</p>
      <ProjectLink href={`${DOCS}/V3_COMMUNITY_DISTRIBUTION.md`}>Lire la spécification des lots</ProjectLink>
    </section>
  </div>;
}

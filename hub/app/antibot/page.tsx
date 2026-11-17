import { DOCS, PageIntro, ProjectLink, StatusPanel } from "@/components/project";

export const metadata = { title: "Contrôle des dossiers" };

export default function Page() {
  return <div className="page-stack">
    <PageIntro label="Protocole" title="Contrôle des dossiers">
      Le projet prévoit un contrôle hors chaîne pour signaler les anomalies. Ce contrôle ne détient pas de clé de paiement et ne peut pas exécuter un versement.
    </PageIntro>
    <StatusPanel title="Le service de contrôle n’est pas connecté">
      Le Hub ne reçoit ni justificatif ni résultat d’analyse. Aucun score ni journal de contrôle fictif n’est affiché.
    </StatusPanel>
    <ProjectLink href={`${DOCS}/SOLIDARITY_DASHBOARD.md`}>Lire les règles de contrôle</ProjectLink>
  </div>;
}

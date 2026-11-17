import { ContributionPanel, ProjectLink } from "@/components/project";

const metrics = [
  ["Solde du fonds", "Aucune lecture du contrat du fonds n’est configurée."],
  ["Total versé", "L’historique des versements n’est pas connecté."],
  ["Familles aidées", "Aucun décompte vérifiable n’est disponible."],
  ["Prochaine échéance", "Le délai de 24 h s’applique à chaque dossier, pas à un compte à rebours global."],
];

export default function Dashboard() {
  return <div className="page-stack">
    <section className="mission-grid">
      <div className="mission-copy">
        <p className="eyebrow">BillPay Protocol · Solidarité sur Base</p>
        <h1>Aider les familles à payer leurs factures d’énergie.</h1>
        <p>BillPay prévoit d’alimenter un fonds d’aide avec 5 % du montant des échanges de BILL. Le fonds est destiné aux factures d’électricité et de chauffage.</p>
        <ProjectLink href="/demande/" primary>Voir l’état des demandes</ProjectLink>
      </div>
      <ContributionPanel />
    </section>
    <section className="impact-section" aria-labelledby="impact">
      <div className="section-heading">
        <div><p className="eyebrow">Suivi du fonds</p><h2 id="impact">Compteur d’impact</h2></div>
        <ProjectLink href="/transparence/">Voir les sources</ProjectLink>
      </div>
      <dl className="metric-grid">{metrics.map(([name, reason]) =>
        <div className="data-panel metric" key={name}><dt>{name}</dt><dd><span>Non disponible</span><p>{reason}</p></dd></div>,
      )}</dl>
    </section>
    <section className="data-panel inline-section">
      <div><h2>Comment une demande est-elle validée ?</h2>
        <p>Le vote public éclaire le conseil. L’autorisation d’un versement dépend du contrat, pas du résultat de ce vote.</p></div>
      <ProjectLink href="/tribunal/">Découvrir le Tribunal</ProjectLink>
    </section>
  </div>;
}

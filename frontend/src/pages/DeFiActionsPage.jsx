import React from "react";
import PageLayout from "../components/PageLayout";

const checks = [
  "Définir le protocole, les actifs concernés et les limites de risque.",
  "Créer une proposition multi-actions avec les données vérifiées.",
  "Attendre le vote, le délai de sécurité et l’exécution par le Safe.",
];

export default function DeFiActionsPage() {
  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Préparation d’investissement</p>
        <h1 className="page-title">Investissements DeFi</h1>
        <p className="page-intro">Préparez une opération pour la gouvernance. Les dépôts, swaps et interactions avec les protocoles ne sont jamais exécutés directement depuis cet écran.</p>
      </div>
      <div className="notice notice-warning" role="status">
        <div><strong>Exécution protégée</strong>Une opération DeFi ne peut être réalisée qu’après validation de la DAO et du Safe multisignature.</div>
      </div>
      <section className="card content-section" aria-labelledby="defi-checklist-heading">
        <div className="card-header">
          <h2 id="defi-checklist-heading" className="card-title">Checklist de proposition</h2>
          <p className="card-description">Conservez les détails de l’opération dans la proposition afin que les membres puissent les examiner.</p>
        </div>
        <ol className="simple-list">
          {checks.map((check, index) => <li key={check}><strong>{index + 1}.</strong> {check}</li>)}
        </ol>
      </section>
    </PageLayout>
  );
}

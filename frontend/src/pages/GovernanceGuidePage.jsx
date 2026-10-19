import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";

const stages = [
  {
    title: "1. Regles verifiables",
    status: "En place",
    description: "Le pouvoir de vote est calcule sur un snapshot, avec quorum, majorite et delai. Les fonds ne sont executes qu'apres validation du Safe.",
  },
  {
    title: "2. Deliberation publique",
    status: "En place",
    description: "Une proposition peut referencer une discussion HTTPS ou IPFS. Les membres peuvent joindre un motif facultatif a leur vote, inscrit publiquement on-chain.",
  },
  {
    title: "3. Mandat collectif",
    status: "En place",
    description: "Le mandat actif encadre categories, contreparties, plafonds, delais et expiration au moment de l'execution des investissements.",
  },
  {
    title: "4. Transmission a la communaute",
    status: "A preparer",
    description: "Avant la production, publier la distribution du token, utiliser un Safe de production avec des signataires diversifies et definir une procedure de rotation.",
  },
];

export default function GovernanceGuidePage() {
  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Modele DAO</p>
        <h1 className="page-title">Une decentralisation progressive et verifiable</h1>
        <p className="page-intro">Une DAO ne se limite pas a un token : ses regles, ses discussions, sa tresorerie et la transmission de son controle doivent etre compris par sa communaute.</p>
      </div>

      <section className="space-y-6" aria-label="Etapes de decentralisation">
        {stages.map((stage) => (
          <Card key={stage.title}>
            <CardHeader>
              <CardTitle>{stage.title}</CardTitle>
              <CardDescription><strong>{stage.status}</strong></CardDescription>
            </CardHeader>
            <CardContent><p>{stage.description}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="content-section card" aria-labelledby="participation-heading">
        <div className="card-header">
          <h2 id="participation-heading" className="card-title">Participer de maniere eclairee</h2>
          <p className="card-description">La coordination peut avoir lieu dans un forum externe, mais les consequences de la decision restent verifiables sur la blockchain.</p>
        </div>
        <ol className="simple-list">
          <li>Consultez le contexte public et le mandat applicable avant de voter.</li>
          <li>Utilisez un motif de vote seulement s'il ne contient aucune information personnelle ou confidentielle.</li>
          <li>Verifiez la cible, le montant, les plafonds et la validation Safe avant toute execution.</li>
        </ol>
        <div className="form-actions">
          <Link className="button button-primary" to="/dashboard">Consulter la gouvernance</Link>
        </div>
      </section>
    </PageLayout>
  );
}

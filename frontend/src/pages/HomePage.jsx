import React from "react";
import PageLayout from "../components/PageLayout";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Decision Studio",
    description: "Cadrez un mandat, visualisez une orientation de risque et préparez sa gouvernance, localement.",
    icon: "◎",
    link: "/decision-studio",
  },
  {
    title: "Gouvernance",
    description: "Consultez la trésorerie, les propositions et les paramètres de gouvernance.",
    icon: "◫",
    link: "/dashboard",
  },
  {
    title: "Modele DAO",
    description: "Comprenez les regles on-chain, la deliberation publique et les etapes de decentralisation.",
    icon: "◇",
    link: "/governance-guide",
  },
  {
    title: "Mandats",
    description: "Contrôlez les plafonds, allocations et contreparties autorisées par la DAO.",
    icon: "▧",
    link: "/mandates",
  },
  {
    title: "Journal d’audit",
    description: "Suivez le cycle des propositions et la configuration du Safe en lecture seule.",
    icon: "▤",
    link: "/audit",
  },
  {
    title: "Investissements NFT",
    description: "Préparez une proposition d’investissement NFT à faire examiner par la DAO.",
    icon: "◇",
    link: "/nft",
  },
  {
    title: "Investissements DeFi",
    description: "Cadrez une opération DeFi avant son vote et son exécution par le Safe.",
    icon: "◌",
    link: "/defi",
  },
  {
    title: "Rapports",
    description: "Retrouvez les rapports publiés après leur validation par la gouvernance.",
    icon: "▤",
    link: "/reports",
  }
];

const HomePage = () => (
  <PageLayout>
    <div className="page-header">
      <p className="eyebrow">Gouvernance d’investissement</p>
      <h1 className="page-title">Décidez ensemble. Exécutez en sécurité.</h1>
      <p className="page-intro">NexusDAO centralise le suivi de la gouvernance. Les investissements sont proposés, votés, puis exécutés uniquement après validation du Safe.</p>
      <div className="home-onboarding-cta">
        <div>
          <strong>Vous démarrez ?</strong>
          <span>Préparez un cadre de décision adapté à votre organisation.</span>
        </div>
        <Link to="/onboarding" className="button button-primary">Créer mon cadre de gouvernance</Link>
      </div>
    </div>
    <section aria-label="Espaces NexusDAO">
      <div className="feature-grid">
        {features.map(f => (
          <Link to={f.link} key={f.title} className="feature-card">
            <span className="feature-icon" aria-hidden="true">{f.icon}</span>
            <h2>{f.title}</h2>
            <p>{f.description}</p>
            <span className="feature-link">Ouvrir l’espace <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
    </section>
  </PageLayout>
);

export default HomePage;

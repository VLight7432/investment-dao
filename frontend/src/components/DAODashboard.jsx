import React, { useContext } from "react";
import PageLayout from "./PageLayout";
import DAOSummary from "./DAOSummary";
import DAOActions from "./DAOActions";
import { WalletContext } from "./WalletContext";

const DAODashboard = () => {
  const {
    account, walletAvailable, isSupportedNetwork, chainId, connectWallet, loading,
  } = useContext(WalletContext);

  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Espace membre</p>
        <h1 className="page-title">Gouvernance</h1>
        <p className="page-intro">Suivez les informations de la DAO et participez aux propositions. Les opérations d’investissement restent soumises au vote, au délai de sécurité et au Safe.</p>
      </div>
      {!walletAvailable && (
        <div className="notice notice-warning" role="status">
          <div><strong>Wallet non détecté</strong>Installez un wallet compatible pour consulter les données connectées et participer à la gouvernance.</div>
        </div>
      )}
      {walletAvailable && !account && (
        <div className="notice notice-info" role="status">
          <div><strong>Connectez votre wallet</strong>La connexion est nécessaire pour lire les données liées à votre compte et signer un vote.</div>
          <button className="button button-primary" onClick={connectWallet} disabled={loading}>{loading ? "Connexion…" : "Connecter"}</button>
        </div>
      )}
      {account && !isSupportedNetwork && (
        <div className="notice notice-warning" role="alert">
          <div><strong>Mauvais réseau</strong>Votre wallet est connecté au réseau {chainId ?? "inconnu"}. Basculez vers le réseau configuré avant toute action de gouvernance.</div>
        </div>
      )}
      <section className="content-section" aria-label="Synthèse de la DAO">
        <DAOSummary />
      </section>
      <section className="content-section" aria-label="Actions de gouvernance">
        <DAOActions />
      </section>
    </PageLayout>
  );
};

export default DAODashboard;

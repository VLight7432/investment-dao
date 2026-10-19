import React from "react";
import PageLayout from "../components/PageLayout";
import NFTTradingPanel from "../components/NFTTradingPanel";

export default function NFTTradingPage() {
  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Préparation d’investissement</p>
        <h1 className="page-title">Investissements NFT</h1>
        <p className="page-intro">Documentez l’opération proposée avant de la soumettre au vote. Cette interface ne signe ni n’exécute d’achat NFT depuis votre wallet.</p>
      </div>
      <div className="notice notice-info" role="status">
        <div><strong>Flux sécurisé</strong>Chaque investissement NFT doit être approuvé par une proposition, respecter le délai de sécurité, puis être exécuté par le Safe.</div>
      </div>
      <section className="content-section" aria-labelledby="nft-actions-heading">
        <h2 id="nft-actions-heading" className="section-heading">Prochaine étape</h2>
        <NFTTradingPanel />
      </section>
    </PageLayout>
  );
}

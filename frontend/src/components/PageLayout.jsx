import React, { useState } from "react";
import Sidebar from "./Sidebar";
import WalletStatus from "./WalletStatus";
import { isDemoMode } from "../config-addresses";

const PageLayout = ({ children }) => {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />
      <div className="app-content">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setNavigationOpen(true)}
            aria-label="Ouvrir la navigation"
            aria-expanded={navigationOpen}
          >
            ☰
          </button>
          <span className="mobile-brand">NexusDAO</span>
          {isDemoMode ? <span className="network-badge network-warning">Simulation</span> : <WalletStatus />}
        </header>
        <main className="page-main">
          {isDemoMode && (
            <div className="notice notice-warning" role="status">
              <div><strong>Démo simulée</strong>Données fictives, sans blockchain ni wallet. Aucun vote, fonds ou transaction ne sera créé.</div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;

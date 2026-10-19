import React, { useState } from "react";
import Sidebar from "./Sidebar";
import WalletStatus from "./WalletStatus";

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
          <WalletStatus />
        </header>
        <main className="page-main">{children}</main>
      </div>
    </div>
  );
};

export default PageLayout;

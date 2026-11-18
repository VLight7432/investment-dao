import React, { Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { DemoWalletProvider, WalletProvider } from "./components/WalletContext";
import { isDemoMode } from "./config-addresses";
import { DemoProvider } from "./components/DemoContext";
import { NotificationsProvider } from "./components/NotificationsContext";
import Notifications from "./components/Notifications";
import ErrorBoundary from "./components/ErrorBoundary";
import Loader from "./components/Loader";
import "./App.css";

const DAODashboard = React.lazy(() => import("./components/DAODashboard"));
const NFTTradingPage = React.lazy(() => import("./pages/NFTTradingPage"));
const DeFiActionsPage = React.lazy(() => import("./pages/DeFiActionsPage"));
const QuarterlyReportsPage = React.lazy(() => import("./pages/QuarterlyReportsPage"));
const HomePage = React.lazy(() => import("./pages/HomePage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage"));
const DecisionStudioPage = React.lazy(() => import("./pages/DecisionStudioPage"));
const GovernanceGuidePage = React.lazy(() => import("./pages/GovernanceGuidePage"));
const MandateControlPage = React.lazy(() => import("./pages/MandateControlPage"));
const AuditTrailPage = React.lazy(() => import("./pages/AuditTrailPage"));
const DemoDashboardPage = React.lazy(() => import("./pages/DemoPages").then((module) => ({ default: module.DemoDashboardPage })));
const DemoMandatePage = React.lazy(() => import("./pages/DemoPages").then((module) => ({ default: module.DemoMandatePage })));
const DemoAuditPage = React.lazy(() => import("./pages/DemoPages").then((module) => ({ default: module.DemoAuditPage })));
const DemoNFTPage = React.lazy(() => import("./pages/DemoPages").then((module) => ({ default: module.DemoNFTPage })));
const DemoDeFiPage = React.lazy(() => import("./pages/DemoPages").then((module) => ({ default: module.DemoDeFiPage })));
const DemoReportsPage = React.lazy(() => import("./pages/DemoPages").then((module) => ({ default: module.DemoReportsPage })));

function App() {
  const Provider = isDemoMode ? DemoWalletProvider : WalletProvider;
  const Simulation = isDemoMode ? DemoProvider : React.Fragment;
  return (
    <NotificationsProvider>
      <Provider>
        <ErrorBoundary><Simulation>
          <Router basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<div className="app-loading"><Loader label="Chargement de la page" /></div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/decision-studio" element={<DecisionStudioPage />} />
                <Route path="/governance-guide" element={<GovernanceGuidePage />} />
                <Route path="/mandates" element={isDemoMode ? <DemoMandatePage /> : <MandateControlPage />} />
                <Route path="/audit" element={isDemoMode ? <DemoAuditPage /> : <AuditTrailPage />} />
                <Route path="/dashboard" element={isDemoMode ? <DemoDashboardPage /> : <DAODashboard />} />
                <Route path="/nft" element={isDemoMode ? <DemoNFTPage /> : <NFTTradingPage />} />
                <Route path="/defi" element={isDemoMode ? <DemoDeFiPage /> : <DeFiActionsPage />} />
                <Route path="/reports" element={isDemoMode ? <DemoReportsPage /> : <QuarterlyReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Notifications />
          </Router>
        </Simulation></ErrorBoundary>
      </Provider>
    </NotificationsProvider>
  );
}

export default App;

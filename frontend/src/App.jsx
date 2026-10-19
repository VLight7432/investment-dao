import React, { Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { WalletProvider } from "./components/WalletContext";
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

function App() {
  return (
    <NotificationsProvider>
      <WalletProvider>
        <ErrorBoundary>
          <Router>
            <Suspense fallback={<div className="app-loading"><Loader label="Chargement de la page" /></div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/decision-studio" element={<DecisionStudioPage />} />
                <Route path="/governance-guide" element={<GovernanceGuidePage />} />
                <Route path="/mandates" element={<MandateControlPage />} />
                <Route path="/audit" element={<AuditTrailPage />} />
                <Route path="/dashboard" element={<DAODashboard />} />
                <Route path="/nft" element={<NFTTradingPage />} />
                <Route path="/defi" element={<DeFiActionsPage />} />
                <Route path="/reports" element={<QuarterlyReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Notifications />
          </Router>
        </ErrorBoundary>
      </WalletProvider>
    </NotificationsProvider>
  );
}

export default App;

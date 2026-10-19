import React from "react";
import PageLayout from "../components/PageLayout";
import QuarterlyReportsPanel from "../components/QuarterlyReportsPanel";

export default function QuarterlyReportsPage() {
  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Transparence</p>
        <h1 className="page-title">Rapports trimestriels</h1>
        <p className="page-intro">Les rapports publiés par la gouvernance apparaîtront ici. Cette page ne lit pas directement un contrat de rapports depuis le wallet.</p>
      </div>
      <QuarterlyReportsPanel />
    </PageLayout>
  );
}

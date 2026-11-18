import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";

const demo = {
  treasury: "25 ETH fictifs",
  mandateVersion: "2",
  transactionCap: "4 ETH fictifs",
  allocation: "3 ETH fictifs",
  allocationCap: "10 ETH fictifs",
  proposal: {
    description: "Investissement DeFi auprès de la contrepartie Alpha",
    amount: "2 ETH fictifs",
    snapshotVersion: "1",
    votesFor: "280 000",
    votesAgainst: "40 000",
  },
};

function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-intro">{description}</p>
    </div>
  );
}

export function DemoDashboardPage() {
  return (
    <PageLayout>
      <PageHeader eyebrow="Espace membre" title="Gouvernance" description="Explorez un exemple fictif de trésorerie et de proposition d’investissement." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Trésorerie de la DAO fictive</CardTitle></CardHeader>
          <CardContent><p>{demo.treasury}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Paramètres de gouvernance</CardTitle></CardHeader>
          <CardContent><p>Vote : 3 jours · Quorum : 20 % · Majorité : 50 % · Safe fictif : 2 signatures sur 3</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proposition fictive #1</CardTitle>
            <CardDescription>{demo.proposal.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Montant : {demo.proposal.amount} · Pour : {demo.proposal.votesFor} · Contre : {demo.proposal.votesAgainst}</p>
            <p>Vote approuvé · En attente du Safe fictif</p>
            <div className="form-actions"><Link className="button button-secondary" to="/audit">Voir le journal simulé</Link></div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export function DemoMandatePage() {
  return (
    <PageLayout>
      <PageHeader eyebrow="Contrôle de trésorerie" title="Centre de contrôle des mandats" description="Exemple fictif de règles applicables à une proposition." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mandat fictif actif · version {demo.mandateVersion}</CardTitle>
            <CardDescription>Ces valeurs illustrent un mandat ; elles ne sont pas lues sur une blockchain.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="governance-grid">
              <div><dt>Catégorie autorisée</dt><dd>DeFi</dd></div>
              <div><dt>Délai d’exécution</dt><dd>2 jours</dd></div>
              <div><dt>Plafond par opération</dt><dd>{demo.transactionCap}</dd></div>
              <div><dt>Allocation cumulée</dt><dd>{demo.allocation} / {demo.allocationCap}</dd></div>
              <div><dt>Contrepartie autorisée</dt><dd>Alpha (fictive)</dd></div>
            </dl>
          </CardContent>
        </Card>
        <div className="notice notice-info">
          <div><strong>Changement de version</strong>Dans cet exemple, la proposition approuvée sous la version 1 reste soumise aux règles de la version 2 avant toute exécution.</div>
        </div>
        <Link className="button button-secondary" to="/audit">Comparer les versions dans le journal</Link>
      </div>
    </PageLayout>
  );
}

export function DemoAuditPage() {
  return (
    <PageLayout>
      <PageHeader eyebrow="Transparence" title="Journal DAO et Safe" description="Exemple fictif du suivi d’une proposition après un changement de mandat." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Safe fictif</CardTitle>
            <CardDescription>2 approbations requises parmi 3 signataires fictifs.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cycle des propositions</CardTitle>
            <CardDescription>La version au snapshot donne le contexte du vote ; la version active s’applique à l’exécution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Proposition</th><th>Mandat au snapshot</th><th>Mandat actif</th><th>État fictif</th><th>Approbations Safe fictives</th></tr></thead>
                <tbody><tr><td>#1 · {demo.proposal.description}</td><td>Version {demo.proposal.snapshotVersion}</td><td>Version {demo.mandateVersion}</td><td>Vote approuvé · En attente du Safe</td><td>1/2</td></tr></tbody>
              </table>
            </div>
            <p>La transaction fictive respecte les limites illustrées, mais aucune exécution réelle n’est possible dans cette démo.</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

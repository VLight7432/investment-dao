import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { useDemo } from "../demoContext";
import { DEMO_CATEGORIES, DEMO_MEMBERS, formatDemoAmount, voteTotals } from "../demoState";
import { readDecisionDraft } from "../decisionStudio";

function PageHeader({ eyebrow, title, description }) {
  const { error } = useDemo();
  return (
    <>
      <div className="page-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-intro">{description}</p>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
    </>
  );
}

function MemberSelect({ id, label, value, onChange }) {
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{DEMO_MEMBERS.map((member) => <option key={member}>{member}</option>)}</select></div>;
}

function ProposalCard({ proposal }) {
  const { data, run } = useDemo();
  const [member, setMember] = useState(DEMO_MEMBERS[0]);
  const totals = voteTotals(proposal);
  const statuses = { voting: "Vote en cours", approved: "Vote approuvé", rejected: "Vote rejeté", executed: "Exécutée" };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposition fictive #{proposal.id} · {proposal.description}</CardTitle>
        <CardDescription>{statuses[proposal.status]} · Mandat au snapshot : version {proposal.snapshotVersion}</CardDescription>
      </CardHeader>
      <CardContent>
        {proposal.kind === "investment" && <p>{proposal.category} · {formatDemoAmount(proposal.amount)} · Contrepartie : {proposal.counterparty}</p>}
        {proposal.kind === "mandate" && <p>Nouvelle version de mandat fictif</p>}
        {proposal.kind === "report" && <p>Publication d’un rapport fictif</p>}
        <p>Pour : {totals.for.toLocaleString("fr-FR")} · Contre : {totals.against.toLocaleString("fr-FR")} · Safe : {proposal.approvals.length}/2</p>
        <p>Fin du vote fictif : {new Date(proposal.deadline).toLocaleString("fr-FR")}</p>
        {["voting", "approved"].includes(proposal.status) && <MemberSelect id={`member-${proposal.id}`} label="Membre / signataire fictif" value={member} onChange={setMember} />}
        {proposal.status === "voting" && (
          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={() => run({ type: "vote", id: proposal.id, member, support: true })}>Voter pour</button>
            <button type="button" className="button button-secondary" onClick={() => run({ type: "vote", id: proposal.id, member, support: false })}>Voter contre</button>
            <button type="button" className="button button-primary" disabled={data.clock < proposal.deadline} onClick={() => run({ type: "close", id: proposal.id })}>Clôturer le vote</button>
          </div>
        )}
        {proposal.status === "approved" && (
          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={() => run({ type: "approve", id: proposal.id, member })}>Approuver dans le Safe fictif</button>
            <button type="button" className="button button-primary" disabled={proposal.approvals.length < 2} onClick={() => run({ type: "execute", id: proposal.id })}>Exécuter fictivement</button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvestmentForm({ category: initialCategory, allowCategory = false }) {
  const { run } = useDemo();
  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState("");
  const [counterparty, setCounterparty] = useState("Alpha");
  const [amount, setAmount] = useState("");
  const [created, setCreated] = useState(false);
  const [draft] = useState(readDecisionDraft);
  const id = allowCategory ? "governance" : initialCategory.toLowerCase();
  const submit = (event) => {
    event.preventDefault();
    if (run({ type: "create", proposal: { kind: "investment", description, counterparty, amount, category } })) {
      setDescription("");
      setAmount("");
      setCreated(true);
    }
  };
  return (
    <Card>
      <CardHeader><CardTitle>Créer une proposition {allowCategory ? "d’investissement" : category} fictive</CardTitle><CardDescription>Elle doit être votée et approuvée par deux signataires fictifs avant exécution.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          {allowCategory && draft.record && (
            <div className="notice notice-info">
              <div><strong>Brouillon Decision Studio disponible</strong>Préremplissez la catégorie et la description ; le montant et la contrepartie restent à vérifier.</div>
              <button type="button" className="button button-secondary" onClick={() => {
                const asset = draft.record.mandate.assetCategory;
                setCategory(asset === "nft" ? "NFT" : asset === "defi" ? "DeFi" : "Trésorerie");
                setDescription(draft.record.mandate.objective.slice(0, 200));
              }}>Utiliser le brouillon</button>
            </div>
          )}
          {allowCategory && draft.error && <div className="notice notice-error" role="alert">{draft.error}</div>}
          <div className="form-grid">
            {allowCategory && <div className="field"><label htmlFor={`${id}-category`}>Catégorie fictive</label><select id={`${id}-category`} value={category} onChange={(event) => setCategory(event.target.value)}>{DEMO_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>}
            <div className="field"><label htmlFor={`${id}-description`}>Description {allowCategory ? "de l’investissement" : category}</label><input id={`${id}-description`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength="200" required /></div>
            <div className="field"><label htmlFor={`${id}-counterparty`}>Contrepartie fictive</label><input id={`${id}-counterparty`} value={counterparty} onChange={(event) => setCounterparty(event.target.value)} required /></div>
            <div className="field"><label htmlFor={`${id}-amount`}>Montant en ETH fictifs</label><input id={`${id}-amount`} type="number" min="0.001" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit">Créer la proposition fictive</button></div>
          {created && <p role="status">Proposition créée dans ce navigateur. <Link to="/dashboard">Ouvrir la gouvernance</Link>.</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function DemoDashboardPage() {
  const { data, run, reset } = useDemo();
  const [deposit, setDeposit] = useState("");
  const [days, setDays] = useState("3");
  const [delegator, setDelegator] = useState(DEMO_MEMBERS[0]);
  const [delegatee, setDelegatee] = useState(DEMO_MEMBERS[0]);
  return (
    <PageLayout>
      <PageHeader eyebrow="Espace membre" title="Gouvernance" description="Créez des propositions, simulez les votes et les signatures, puis exécutez-les avec des ETH fictifs." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Trésorerie de la DAO fictive</CardTitle><CardDescription>Solde et historique enregistrés uniquement dans ce navigateur.</CardDescription></CardHeader>
          <CardContent>
            <p>{formatDemoAmount(data.treasury)}</p>
            <form onSubmit={(event) => { event.preventDefault(); if (run({ type: "deposit", amount: deposit })) setDeposit(""); }}>
              <div className="field"><label htmlFor="demo-deposit">Ajouter des ETH fictifs</label><input id="demo-deposit" type="number" min="0.001" step="0.001" value={deposit} onChange={(event) => setDeposit(event.target.value)} required /></div>
              <div className="form-actions"><button className="button button-secondary" type="submit">Ajouter fictivement</button><button className="button button-secondary" type="button" onClick={reset}>Réinitialiser la simulation</button></div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Horloge fictive</CardTitle><CardDescription>Temps simulé : {new Date(data.clock).toLocaleString("fr-FR")}. Faites avancer le temps pour terminer les votes et les délais de sécurité.</CardDescription></CardHeader>
          <CardContent><form onSubmit={(event) => { event.preventDefault(); run({ type: "advance", days }); }}>
            <div className="field"><label htmlFor="demo-days">Nombre de jours à avancer</label><input id="demo-days" type="number" min="1" max="3650" step="1" value={days} onChange={(event) => setDays(event.target.value)} required /></div>
            <div className="form-actions"><button className="button button-secondary" type="submit">Avancer le temps fictif</button></div>
          </form></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Délégation fictive</CardTitle><CardDescription>Les changements ne modifient pas les snapshots des propositions déjà créées.</CardDescription></CardHeader>
          <CardContent>
            <p>{DEMO_MEMBERS.map((member) => `${member} → ${data.delegations[member]}`).join(" · ")}</p>
            <form onSubmit={(event) => { event.preventDefault(); run({ type: "delegate", member: delegator, delegatee }); }}>
              <div className="form-grid"><MemberSelect id="demo-delegator" label="Membre délégant" value={delegator} onChange={setDelegator} /><MemberSelect id="demo-delegatee" label="Délégué fictif" value={delegatee} onChange={setDelegatee} /></div>
              <div className="form-actions"><button className="button button-secondary" type="submit">Déléguer fictivement</button></div>
            </form>
          </CardContent>
        </Card>
        <div className="notice notice-info"><div><strong>Règles simplifiées</strong>Trois membres fictifs possèdent respectivement 40 %, 30 % et 30 % des voix. Vote : 3 jours fictifs ; quorum : 20 % ; approbation : au moins 50 % ; Safe : 2 signatures sur 3. Le vote est clôturé manuellement après sa date de fin.</div></div>
        <InvestmentForm category="DeFi" allowCategory />
        <div className="form-actions"><Link className="button button-secondary" to="/defi">Proposer une opération DeFi</Link><Link className="button button-secondary" to="/nft">Proposer un NFT</Link><Link className="button button-secondary" to="/mandates">Proposer un mandat</Link><Link className="button button-secondary" to="/reports">Proposer un rapport</Link></div>
        {data.proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)}
      </div>
    </PageLayout>
  );
}

export function DemoMandatePage() {
  const { data, run } = useDemo();
  const [draft, setDraft] = useState({
    description: "Mettre à jour le mandat",
    transactionCap: String(data.mandate.transactionCap / 1000),
    expiryDays: "90",
    delayDays: String(data.mandate.delayDays),
    caps: Object.fromEntries(DEMO_CATEGORIES.map((category) => [category, String(data.mandate.caps[category] / 1000)])),
    counterparties: data.mandate.counterparties.join(", "),
  });
  const [created, setCreated] = useState(false);
  const change = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });
  return (
    <PageLayout>
      <PageHeader eyebrow="Contrôle de trésorerie" title="Centre de contrôle des mandats" description="Consultez et proposez les règles fictives appliquées aux investissements simulés." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Mandat fictif actif · version {data.mandate.version}</CardTitle><CardDescription>Les allocations sont remises à zéro lors de l’exécution d’une nouvelle version.</CardDescription></CardHeader>
          <CardContent>
            <dl className="governance-grid">
              <div><dt>Plafond par opération</dt><dd>{formatDemoAmount(data.mandate.transactionCap)}</dd></div>
              <div><dt>Expiration fictive</dt><dd>{new Date(data.mandate.expiresAt).toLocaleString("fr-FR")}{data.clock > data.mandate.expiresAt ? " · expiré" : ""}</dd></div>
              <div><dt>Délai d’exécution</dt><dd>{data.mandate.delayDays} jour(s) fictif(s)</dd></div>
              {DEMO_CATEGORIES.map((category) => <div key={category}><dt>Allocation {category}</dt><dd>{formatDemoAmount(data.mandate.allocated[category])} / {formatDemoAmount(data.mandate.caps[category])}</dd></div>)}
              <div><dt>Contreparties autorisées</dt><dd>{data.mandate.counterparties.join(", ")}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Proposer une nouvelle version</CardTitle><CardDescription>Un plafond de catégorie à zéro la désactive. La proposition nécessite un vote et le Safe fictif.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={(event) => { event.preventDefault(); if (run({ type: "create", proposal: { kind: "mandate", ...draft } })) setCreated(true); }}>
              <div className="form-grid">
                <div className="field"><label htmlFor="demo-mandate-description">Description</label><input id="demo-mandate-description" value={draft.description} onChange={change("description")} required /></div>
                <div className="field"><label htmlFor="demo-cap">Plafond par opération (ETH fictifs)</label><input id="demo-cap" type="number" min="0.001" step="0.001" value={draft.transactionCap} onChange={change("transactionCap")} required /></div>
                <div className="field"><label htmlFor="demo-expiry">Expiration dans (jours fictifs)</label><input id="demo-expiry" type="number" min="1" max="3650" step="1" value={draft.expiryDays} onChange={change("expiryDays")} required /></div>
                <div className="field"><label htmlFor="demo-delay">Délai minimal (jours fictifs)</label><input id="demo-delay" type="number" min="1" max="365" step="1" value={draft.delayDays} onChange={change("delayDays")} required /></div>
                {DEMO_CATEGORIES.map((category) => <div className="field" key={category}><label htmlFor={`demo-cap-${category}`}>Plafond {category} (ETH fictifs)</label><input id={`demo-cap-${category}`} type="number" min="0" step="0.001" value={draft.caps[category]} onChange={(event) => setDraft({ ...draft, caps: { ...draft.caps, [category]: event.target.value } })} required /></div>)}
                <div className="field"><label htmlFor="demo-counterparties">Contreparties fictives, séparées par des virgules</label><input id="demo-counterparties" value={draft.counterparties} onChange={change("counterparties")} required /></div>
              </div>
              <div className="form-actions"><button className="button button-primary" type="submit">Créer la proposition de mandat</button></div>
              {created && <p role="status">Proposition créée. <Link to="/dashboard">Ouvrir la gouvernance</Link>.</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export function DemoAuditPage() {
  const { data } = useDemo();
  const statuses = { voting: "Vote en cours", approved: "Vote approuvé", rejected: "Vote rejeté", executed: "Exécutée" };
  return (
    <PageLayout>
      <PageHeader eyebrow="Transparence" title="Journal DAO et Safe" description="Suivez les opérations fictives enregistrées dans ce navigateur." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Cycle des propositions</CardTitle><CardDescription>La version au snapshot donne le contexte du vote ; la version active est vérifiée à l’exécution.</CardDescription></CardHeader>
          <CardContent><div className="table-wrap"><table>
            <thead><tr><th>Proposition</th><th>Mandat au snapshot</th><th>Mandat actif actuel</th><th>État fictif</th><th>Safe fictif</th><th>Mandat à l’exécution</th></tr></thead>
            <tbody>{data.proposals.map((proposal) => <tr key={proposal.id}><td>#{proposal.id} · {proposal.description}</td><td>Version {proposal.snapshotVersion}</td><td>Version {data.mandate.version}</td><td>{statuses[proposal.status]}</td><td>{proposal.approvals.length}/2</td><td>{proposal.executedMandateVersion ? `Version ${proposal.executedMandateVersion}` : "—"}</td></tr>)}</tbody>
          </table></div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Historique fictif</CardTitle></CardHeader>
          <CardContent><ul className="simple-list">{data.events.map((event) => <li key={event.id}>{event.message}</li>)}</ul></CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

function DemoInvestmentPage({ category }) {
  const { data } = useDemo();
  const holdings = data.holdings.filter((item) => item.category === category);
  return (
    <PageLayout>
      <PageHeader eyebrow="Investissement simulé" title={`Investissements ${category}`} description="Créez une proposition fictive, puis votez et validez-la dans la gouvernance simulée." />
      <div className="space-y-6">
        <InvestmentForm category={category} />
        <Card>
          <CardHeader><CardTitle>Positions {category} fictives</CardTitle></CardHeader>
          <CardContent>{holdings.length ? <ul className="simple-list">{holdings.map((item) => <li key={item.id}>{item.description} · {item.counterparty} · {formatDemoAmount(item.amount)}</li>)}</ul> : <p>Aucune position fictive.</p>}</CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export function DemoNFTPage() {
  return <DemoInvestmentPage category="NFT" />;
}

export function DemoDeFiPage() {
  return <DemoInvestmentPage category="DeFi" />;
}

export function DemoReportsPage() {
  const { data, run } = useDemo();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [created, setCreated] = useState(false);
  return (
    <PageLayout>
      <PageHeader eyebrow="Transparence" title="Rapports trimestriels" description="Proposez et consultez des rapports fictifs publiés après vote et validation Safe simulés." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Proposer un rapport fictif</CardTitle></CardHeader>
          <CardContent><form onSubmit={(event) => {
            event.preventDefault();
            if (run({ type: "create", proposal: { kind: "report", description: title, content } })) {
              setTitle("");
              setContent("");
              setCreated(true);
            }
          }}>
            <div className="field"><label htmlFor="demo-report-title">Titre du rapport</label><input id="demo-report-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength="200" required /></div>
            <div className="field"><label htmlFor="demo-report-content">Contenu du rapport</label><textarea id="demo-report-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength="2000" required /></div>
            <div className="form-actions"><button className="button button-primary" type="submit">Créer la proposition de rapport</button></div>
            {created && <p role="status">Proposition créée. <Link to="/dashboard">Ouvrir la gouvernance</Link>.</p>}
          </form></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rapports fictifs publiés</CardTitle></CardHeader>
          <CardContent>{data.reports.length ? data.reports.map((report) => <article key={report.id}><h3>{report.title}</h3><p>{report.content}</p></article>) : <p>Aucun rapport fictif publié.</p>}</CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

import React, { useContext, useMemo } from "react";
import { ethers } from "ethers";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/Card";
import { Alert } from "./ui/Alert";
import { WalletContext } from "./WalletContext";
import { ADDRESSES } from "../config-addresses";
import { Pie, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useGlobalDataFetcher } from "../hooks/useGlobalDataFetcher";
import AdvancedInvestmentDAOABI from "../abis/AdvancedInvestmentDAO.json";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DAO_ADDRESS = ADDRESSES.DAO;
const TOKEN_ADDRESS = ADDRESSES.TOKEN;
const DAO_ABI = AdvancedInvestmentDAOABI.abi;

const TOKEN_ABI = [
  "function owner() view returns (address)",
  "function getVotes(address) view returns (uint256)"
];
const EMPTY_DAO_DATA = {
  treasury: "-",
  owner: "-",
  governance: { votingPeriod: "-", quorum: "-", approval: "-", proposalThreshold: "-" },
  paused: false,
  timelock: "-",
  owners: [],
  proposals: [],
  multiProposals: [],
  votingPower: null,
  mandate: { active: false, expiresAt: "-", executionDelay: "-", transactionCap: "-", version: "-" }
};

const fetchDAOData = async (provider, account) => {
  if (!provider) return EMPTY_DAO_DATA;
  if (!DAO_ADDRESS || !TOKEN_ADDRESS) {
    throw new Error("Les adresses DAO ou token ne sont pas configurées.");
  }
  const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
  const treasuryBalance = await dao.getTreasuryBalance();
  const tokenOwner = await token.owner();
  const votingPeriod = await dao.VOTING_PERIOD();
  const quorum = await dao.QUORUM_PERCENTAGE();
  const approval = await dao.APPROVAL_THRESHOLD();
  const proposalThreshold = await dao.PROPOSAL_THRESHOLD_PERCENTAGE();
  const paused = await dao.paused();
  const timelock = Number(await dao.timelockDelay()) / (60 * 60 * 24);
  const mandate = await dao.getInvestmentMandate();
  // Propositions classiques
  const count = await dao.proposalCount();
  const props = [];
  for (let i = 1; i <= Number(count); i++) {
    const p = await dao.getProposal(i);
    const discussionUri = await dao.proposalDiscussionURI(i);
    props.push({
      id: i, proposer: p[0], target: p[1], amount: ethers.formatEther(p[2]) + " ETH",
      deadline: new Date(Number(p[4]) * 1000).toLocaleString(), votesFor: p[6],
      votesAgainst: p[7], executed: p[8], description: p[9], category: p[10], discussionUri
    });
  }
  // Propositions multi-actions
  const multiCount = await dao.multiActionProposalCount();
  const multiProps = [];
  for (let i = 1; i <= Number(multiCount); i++) {
    const mp = await dao.getMultiActionProposal(i);
    const discussionUri = await dao.multiActionProposalDiscussionURI(i);
    multiProps.push({
      id: i, proposer: mp[0], deadline: new Date(Number(mp[2]) * 1000).toLocaleString(),
      votesFor: mp[4], votesAgainst: mp[5], executed: mp[6], description: mp[8], category: mp[9], discussionUri
    });
  }
  let votingPower = null;
  if (provider && account) {
    try {
      votingPower = (await token.getVotes(account)).toString();
    } catch {
      votingPower = null;
    }
  }
  return {
    treasury: ethers.formatEther(treasuryBalance) + " ETH",
    owner: tokenOwner,
    governance: {
      votingPeriod: Number(votingPeriod) / (60 * 60 * 24) + " jours",
      quorum: quorum + "%",
      approval: approval + "%",
      proposalThreshold: proposalThreshold + "%"
    },
    paused,
    timelock,
    mandate: {
      active: mandate.active,
      expiresAt: mandate.active ? new Date(Number(mandate.expiresAt) * 1000).toLocaleString() : "-",
      executionDelay: Number(mandate.executionDelay) / (60 * 60 * 24),
      transactionCap: ethers.formatEther(mandate.transactionCap) + " ETH",
      version: mandate.version.toString()
    },
    owners: [],
    proposals: props,
    multiProposals: multiProps,
    votingPower
  };
};

const DAOSummary = () => {
  const {
    provider, notification, account, chainId, isSupportedNetwork,
  } = useContext(WalletContext);
  const { data: daoDataRaw, loading, error } = useGlobalDataFetcher(
    () => (isSupportedNetwork ? fetchDAOData(provider, account) : Promise.resolve(EMPTY_DAO_DATA)),
    [provider, account, chainId, isSupportedNetwork],
    { cacheKey: `dao-summary:${chainId ?? "disconnected"}` }
  );
  const daoData = {
    ...EMPTY_DAO_DATA,
    ...daoDataRaw,
    governance: {
      ...EMPTY_DAO_DATA.governance,
      ...daoDataRaw?.governance
    },
    mandate: {
      ...EMPTY_DAO_DATA.mandate,
      ...daoDataRaw?.mandate
    },
    owners: Array.isArray(daoDataRaw?.owners) ? daoDataRaw.owners : [],
    proposals: Array.isArray(daoDataRaw?.proposals) ? daoDataRaw.proposals : [],
    multiProposals: Array.isArray(daoDataRaw?.multiProposals) ? daoDataRaw.multiProposals : []
  };

  // Memoization des données pour le Pie (Répartition des votes)
  const votesPieData = useMemo(() => ({
    labels: ["Pour", "Contre"],
    datasets: [
      {
        data: [
          daoData.proposals.reduce((acc, p) => acc + Number(p.votesFor), 0),
          daoData.proposals.reduce((acc, p) => acc + Number(p.votesAgainst), 0)
        ],
        backgroundColor: ["#4f46e5", "#f59e42"],
      },
    ],
  }), [daoData.proposals]);

  // Memoization des données pour le Bar (Participation des membres)
  const memberBarData = useMemo(() => ({
    labels: daoData.proposals.map(p => p.proposer),
    datasets: [
      {
        label: "Votes Pour",
        data: daoData.proposals.map(p => Number(p.votesFor)),
        backgroundColor: "#4f46e5",
      },
      {
        label: "Votes Contre",
        data: daoData.proposals.map(p => Number(p.votesAgainst)),
        backgroundColor: "#f59e42",
      },
    ],
  }), [daoData.proposals]);

  // Memo pour le mapping des propositions classiques
  const proposalRows = useMemo(() => daoData.proposals.map((p) => (
    <tr key={p.id} className={p.executed ? "bg-green-50" : "bg-white"}>
      <td className="p-2 font-mono">{p.id}</td>
      <td className="p-2">{p.description}</td>
      <td className="p-2">{p.discussionUri ? <a href={p.discussionUri} target="_blank" rel="noreferrer">Contexte</a> : "—"}</td>
      <td className="p-2 font-mono">{p.proposer}</td>
      <td className="p-2">{p.amount}</td>
      <td className="p-2">{p.votesFor.toString()}</td>
      <td className="p-2">{p.votesAgainst.toString()}</td>
      <td className="p-2">{p.category}</td>
      <td className="p-2">{p.deadline}</td>
      <td className="p-2">{p.executed ? <span className="px-2 py-1 rounded bg-green-200 text-green-800">Exécutée</span> : <span className="px-2 py-1 rounded bg-yellow-200 text-yellow-800">Active</span>}</td>
    </tr>
  )), [daoData.proposals]);

  // Memo pour le mapping des propositions multi-actions
  const multiProposalRows = useMemo(() => daoData.multiProposals.map((mp) => (
    <tr key={mp.id} className={mp.executed ? "bg-green-50" : "bg-white"}>
      <td className="p-2 font-mono">{mp.id}</td>
      <td className="p-2">{mp.description}</td>
      <td className="p-2">{mp.discussionUri ? <a href={mp.discussionUri} target="_blank" rel="noreferrer">Contexte</a> : "—"}</td>
      <td className="p-2 font-mono">{mp.proposer}</td>
      <td className="p-2">{mp.votesFor.toString()}</td>
      <td className="p-2">{mp.votesAgainst.toString()}</td>
      <td className="p-2">{mp.category}</td>
      <td className="p-2">{mp.deadline}</td>
      <td className="p-2">{mp.executed ? <span className="px-2 py-1 rounded bg-green-200 text-green-800">Exécutée</span> : <span className="px-2 py-1 rounded bg-yellow-200 text-yellow-800">Active</span>}</td>
    </tr>
  )), [daoData.multiProposals]);

  return (
    <div className="space-y-6">
      {notification && (
        <Alert type={notification.startsWith("Erreur") ? "error" : "success"}>
          {notification}
        </Alert>
      )}
      {error && (
        <Alert type="error">
          Impossible de charger les données de la DAO : {error.message}
        </Alert>
      )}
      {loading && <div className="status-row" role="status"><span className="spinner" aria-hidden="true" />Chargement des données de gouvernance…</div>}
      {provider && !isSupportedNetwork && (
        <div className="notice notice-warning" role="status">
          <div><strong>Données indisponibles sur ce réseau</strong>Connectez-vous au réseau configuré pour actualiser la synthèse.</div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Trésorerie de la DAO</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="font-mono text-lg">{daoData.treasury}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Propriétaire du Token</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="font-mono">{daoData.owner}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Gouvernance</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            <li>Période de vote : {daoData.governance.votingPeriod}</li>
            <li>Quorum : {daoData.governance.quorum}</li>
            <li>Seuil d'approbation : {daoData.governance.approval}</li>
            <li>Seuil de proposition : {daoData.governance.proposalThreshold}</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sécurité DAO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">Timelock : <span className="font-mono">{daoData.timelock} jours</span></div>
          <div className="mb-2">Pause : <span className="font-mono">{daoData.paused ? "Active" : "Inactive"}</span></div>
          <p>Les exécutions sont confirmées par le Safe multisignature après le vote et le délai de sécurité. Cette interface ne contacte pas directement le Safe.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Mandat d’investissement vérifiable</CardTitle>
        </CardHeader>
        <CardContent>
          {daoData.mandate.active ? (
            <ul className="space-y-1">
              <li>Statut : <strong>Actif</strong> (version {daoData.mandate.version})</li>
              <li>Expire le : {daoData.mandate.expiresAt}</li>
              <li>Délai minimal d’exécution : {daoData.mandate.executionDelay} jours</li>
              <li>Plafond par opération : {daoData.mandate.transactionCap}</li>
            </ul>
          ) : (
            <p>Aucun mandat actif. Les plafonds, catégories et contreparties ne sont pas encore appliqués on-chain.</p>
          )}
          <p className="field-help">Un mandat ne peut être créé ou modifié que par une proposition DAO approuvée puis exécutée par le Safe. Les règles détaillées par catégorie et contrepartie sont contrôlées au moment de l’exécution.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pouvoir de vote</CardTitle>
        </CardHeader>
        <CardContent>
          {daoData.votingPower !== null ? (
            <span className="font-mono text-lg">{daoData.votingPower}</span>
          ) : (
            <span className="text-gray-400">Non disponible</span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Statistiques clés NexusDAO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-indigo-100 rounded p-3">
              <div className="text-2xl font-bold text-indigo-700">—</div>
              <div className="text-xs text-indigo-700">Signataires Safe</div>
            </div>
            <div className="bg-cyan-100 rounded p-3">
              <div className="text-2xl font-bold text-cyan-700">{daoData.proposals.length + daoData.multiProposals.length}</div>
              <div className="text-xs text-cyan-700">Propositions totales</div>
            </div>
            <div className="bg-green-100 rounded p-3">
              <div className="text-2xl font-bold text-green-700">{daoData.proposals.filter(p => p.executed).length + daoData.multiProposals.filter(mp => mp.executed).length}</div>
              <div className="text-xs text-green-700">Propositions exécutées</div>
            </div>
            <div className="bg-yellow-100 rounded p-3">
              <div className="text-2xl font-bold text-yellow-700">{daoData.proposals.reduce((acc, p) => acc + Number(p.votesFor) - Number(p.votesAgainst), 0)}</div>
              <div className="text-xs text-yellow-700">Votes nets</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Propositions classiques</CardTitle>
        </CardHeader>
        <CardContent>
          {daoData.proposals.length === 0 ? (
            <span>Aucune proposition</span>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Discussion</th>
                    <th className="p-2">Proposeur</th>
                    <th className="p-2">Montant</th>
                    <th className="p-2">Votes Pour</th>
                    <th className="p-2">Votes Contre</th>
                    <th className="p-2">Catégorie</th>
                    <th className="p-2">Deadline</th>
                    <th className="p-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalRows}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Propositions Multi-Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {daoData.multiProposals.length === 0 ? (
            <span>Aucune proposition multi-actions</span>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Discussion</th>
                    <th className="p-2">Proposeur</th>
                    <th className="p-2">Votes Pour</th>
                    <th className="p-2">Votes Contre</th>
                    <th className="p-2">Catégorie</th>
                    <th className="p-2">Deadline</th>
                    <th className="p-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {multiProposalRows}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Répartition des votes (propositions classiques)</CardTitle>
        </CardHeader>
        <CardContent>
          {daoData.proposals.length > 0 ? (
            <Pie data={votesPieData} options={{ plugins: { legend: { position: "bottom" } } }} />
          ) : <span className="text-gray-400">Pas de données</span>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Participation des membres (bar chart)</CardTitle>
        </CardHeader>
        <CardContent>
          {daoData.proposals.length > 0 ? (
            <Bar data={memberBarData} options={{ plugins: { legend: { position: "bottom" } }, responsive: true }} />
          ) : <span className="text-gray-400">Pas de données</span>}
        </CardContent>
      </Card>
    </div>
  );
};

export default DAOSummary;

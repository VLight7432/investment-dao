import React, { useContext, useMemo } from "react";
import { ethers } from "ethers";
import PageLayout from "../components/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { WalletContext } from "../components/WalletContext";
import { ADDRESSES, SAFE_TRANSACTION_SERVICE } from "../config-addresses";
import AdvancedInvestmentDAO from "../abis/AdvancedInvestmentDAO.json";
import { useGlobalDataFetcher } from "../hooks/useGlobalDataFetcher";

const SAFE_ABI = [
  "function getOwners() view returns (address[])",
  "function getThreshold() view returns (uint256)",
  "function getTransactionHash(address target, uint256 value, bytes data) view returns (bytes32)",
  "function approvalCount(bytes32 transactionHash) view returns (uint256)",
];
const TOKEN_ABI = ["function getPastTotalSupply(uint256 blockNumber) view returns (uint256)"];
const EMPTY_AUDIT = { safe: null, proposals: [], mockApprovalsAvailable: false };

const lifecycle = (proposal, now, timelock, mandateDelay) => {
  if (proposal.executed) return "Exécutée";
  if (now < proposal.deadline) return "Vote en cours";
  if (!proposal.approved) return "Vote non approuvé";
  const delay = proposal.category === 4 ? timelock : Math.max(timelock, mandateDelay);
  return now < proposal.deadline + delay ? "Délai de sécurité actif" : "Prête pour le Safe";
};

const readSafeServiceApprovals = async (proposals) => {
  if (SAFE_TRANSACTION_SERVICE.error) {
    return { configured: false, error: SAFE_TRANSACTION_SERVICE.error, approvals: new Map() };
  }
  if (!SAFE_TRANSACTION_SERVICE.url) {
    return { configured: false, error: "", approvals: new Map() };
  }

  try {
    const response = await fetch(
      `${SAFE_TRANSACTION_SERVICE.url}/safes/${ADDRESSES.SAFE}/multisig-transactions/?executed=false&limit=100`
    );
    if (!response.ok) {
      throw new Error(`Le service Safe a répondu ${response.status}.`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.results)) {
      throw new Error("Le service Safe a renvoyé un format inattendu.");
    }
    const transactions = new Map(
      payload.results
        .filter((transaction) => (
          transaction.to?.toLowerCase() === ADDRESSES.DAO.toLowerCase()
          && transaction.value === "0"
          && typeof transaction.data === "string"
        ))
        .map((transaction) => [transaction.data.toLowerCase(), {
          approvals: Array.isArray(transaction.confirmations) ? transaction.confirmations.length : 0,
          threshold: transaction.confirmationsRequired,
        }])
    );
    return {
      configured: true,
      error: "",
      approvals: new Map(proposals.map((proposal) => [
        proposal.executionData.toLowerCase(),
        transactions.get(proposal.executionData.toLowerCase()) || null,
      ])),
    };
  } catch (serviceError) {
    return { configured: true, error: serviceError.message, approvals: new Map() };
  }
};

const fetchAudit = async (provider) => {
  if (!provider) return EMPTY_AUDIT;
  if (!ADDRESSES.DAO || !ADDRESSES.TOKEN || !ADDRESSES.SAFE) {
    throw new Error("Configurez les adresses DAO, token et Safe pour consulter le journal.");
  }
  const dao = new ethers.Contract(ADDRESSES.DAO, AdvancedInvestmentDAO.abi, provider);
  const safe = new ethers.Contract(ADDRESSES.SAFE, SAFE_ABI, provider);
  const token = new ethers.Contract(ADDRESSES.TOKEN, TOKEN_ABI, provider);
  const [owners, threshold, mandate, timelock, simpleCount, multiCount, block] = await Promise.all([
    safe.getOwners(), safe.getThreshold(), dao.getInvestmentMandate(), dao.timelockDelay(),
    dao.proposalCount(), dao.multiActionProposalCount(), provider.getBlock("latest"),
  ]);
  const now = Number(block.timestamp);
  const mandateDelay = mandate.active ? Number(mandate.executionDelay) : 0;
  const thresholdValue = Number(threshold);
  const proposals = [];

  for (let id = 1; id <= Number(simpleCount); id++) {
    const proposal = await dao.getProposal(id);
    const supply = await token.getPastTotalSupply(proposal.snapshotBlock);
    const votes = proposal.votesFor + proposal.votesAgainst;
    const approved = votes > 0n && votes * 100n >= supply * 20n && proposal.votesFor * 100n >= votes * 50n;
    const executionData = dao.interface.encodeFunctionData("executeProposal", [id]);
    proposals.push({
      id, type: "Proposition", description: proposal.description, category: Number(proposal.category),
      deadline: Number(proposal.deadline), executed: proposal.executed, approved,
      lifecycle: lifecycle({ deadline: Number(proposal.deadline), executed: proposal.executed, approved, category: Number(proposal.category) }, now, Number(timelock), mandateDelay),
      executionData,
    });
  }
  for (let id = 1; id <= Number(multiCount); id++) {
    const proposal = await dao.getMultiActionProposal(id);
    const supply = await token.getPastTotalSupply(proposal.snapshotBlock);
    const votes = proposal.votesFor + proposal.votesAgainst;
    const approved = votes > 0n && votes * 100n >= supply * 20n && proposal.votesFor * 100n >= votes * 50n;
    const executionData = dao.interface.encodeFunctionData("executeMultiActionProposal", [id]);
    proposals.push({
      id, type: "Multi-actions", description: proposal.description, category: Number(proposal.category),
      deadline: Number(proposal.deadline), executed: proposal.executed, approved,
      lifecycle: lifecycle({ deadline: Number(proposal.deadline), executed: proposal.executed, approved, category: Number(proposal.category) }, now, Number(timelock), mandateDelay),
      executionData,
    });
  }

  let mockApprovalsAvailable = true;
  const withApprovals = await Promise.all(proposals.map(async (proposal) => {
    if (proposal.executed) return { ...proposal, approvals: null };
    try {
      const transactionHash = await safe.getTransactionHash(ADDRESSES.DAO, 0, proposal.executionData);
      const approvals = await safe.approvalCount(transactionHash);
      return { ...proposal, approvals: Number(approvals) };
    } catch {
      mockApprovalsAvailable = false;
      return { ...proposal, approvals: null };
    }
  }));

  const safeService = await readSafeServiceApprovals(withApprovals);
  const enrichedProposals = withApprovals.map((proposal) => {
    const serviceApproval = safeService.approvals.get(proposal.executionData.toLowerCase());
    return serviceApproval
      ? { ...proposal, approvals: serviceApproval.approvals, serviceThreshold: serviceApproval.threshold }
      : proposal;
  });

  return {
    safe: { owners, threshold: thresholdValue },
    proposals: enrichedProposals.sort((left, right) => right.deadline - left.deadline),
    mockApprovalsAvailable,
    safeService: { configured: safeService.configured, error: safeService.error },
  };
};

export default function AuditTrailPage() {
  const { provider, chainId, isSupportedNetwork } = useContext(WalletContext);
  const { data: auditRaw, loading, error, refetch } = useGlobalDataFetcher(
    () => (isSupportedNetwork ? fetchAudit(provider) : Promise.resolve(EMPTY_AUDIT)),
    [provider, chainId, isSupportedNetwork],
    { cacheKey: `safe-audit:${chainId ?? "disconnected"}` }
  );
  const audit = { ...EMPTY_AUDIT, ...auditRaw, proposals: Array.isArray(auditRaw?.proposals) ? auditRaw.proposals : [], safeService: auditRaw?.safeService || { configured: false, error: "" } };
  const date = useMemo(() => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }), []);

  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Transparence</p>
        <h1 className="page-title">Journal DAO et Safe</h1>
        <p className="page-intro">Suivez l’état vérifiable des propositions et la configuration du coffre-fort. Cette page est strictement en lecture seule.</p>
      </div>
      {!isSupportedNetwork && provider && <div className="notice notice-warning" role="status"><div><strong>Mauvais réseau</strong>Connectez-vous au réseau configuré pour lire le journal on-chain.</div></div>}
      {error && <div className="notice notice-error" role="alert"><div><strong>Journal indisponible</strong>{error.message}</div></div>}
      {loading && <div className="status-row" role="status"><span className="spinner" aria-hidden="true" />Lecture des propositions et du Safe…</div>}
      {!loading && !error && audit.safe && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Configuration du Safe</CardTitle><CardDescription>{audit.safe.threshold} approbation(s) requise(s) parmi {audit.safe.owners.length} signataire(s).</CardDescription></CardHeader>
            <CardContent><ul className="simple-list">{audit.safe.owners.map((owner) => <li key={owner} className="wallet-account">{owner}</li>)}</ul></CardContent>
          </Card>
          {audit.safeService.error && <div className="notice notice-warning" role="status"><div><strong>Safe Transaction Service indisponible</strong>{audit.safeService.error} Le journal conserve les données on-chain et, si disponible, le suivi local MockSafe.</div></div>}
          {!audit.mockApprovalsAvailable && !audit.safeService.configured && <div className="notice notice-info" role="status"><div><strong>Suivi des approbations indisponible</strong>Configurez `VITE_SAFE_TX_SERVICE_URL` vers l’API HTTPS du Safe Transaction Service pour afficher les confirmations d’un Safe réel. Le journal affiche toujours l’état on-chain de la DAO.</div></div>}
          <Card>
            <CardHeader><CardTitle>Cycle des propositions</CardTitle><CardDescription>Le statut combine le vote, le délai de sécurité, le mandat actif et l’état d’exécution on-chain.</CardDescription></CardHeader>
            <CardContent>
              {audit.proposals.length ? <div className="table-wrap"><table><thead><tr><th>Type</th><th>Description</th><th>Fin du vote</th><th>État DAO</th><th>Approbations Safe</th></tr></thead><tbody>
                {audit.proposals.map((proposal) => <tr key={`${proposal.type}-${proposal.id}`}><td>{proposal.type} #{proposal.id}</td><td>{proposal.description}</td><td>{date.format(new Date(proposal.deadline * 1000))}</td><td>{proposal.lifecycle}</td><td>{proposal.approvals === null ? "Non indexé" : `${proposal.approvals}/${proposal.serviceThreshold || audit.safe.threshold}`}</td></tr>)}
              </tbody></table></div> : <p>Aucune proposition on-chain n’a été trouvée.</p>}
              <div className="form-actions"><button className="button button-secondary" type="button" onClick={() => void refetch()}>Actualiser</button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}

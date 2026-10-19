import React, { useContext, useState } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { WalletContext } from "./WalletContext";
import { ADDRESSES } from "../config-addresses";
import AdvancedInvestmentDAO from "../abis/AdvancedInvestmentDAO.json";
import { getDecisionProposalPrefill, readDecisionDraft } from "../decisionStudio";

const categories = ["Investissement NFT", "Investissement DeFi", "Venture capital", "Trésorerie", "Gouvernance"];
const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value);
const isPositiveAmount = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const isDiscussionUri = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "ipfs:";
  } catch {
    return false;
  }
};

const DAOActions = () => {
  const {
    provider, chainId, setNotification, loading: walletLoading,
  } = useContext(WalletContext);
  const [proposal, setProposal] = useState({ description: "", target: "", amount: "", category: "0", discussionUri: "" });
  const [vote, setVote] = useState({ id: "", support: "true", reason: "" });
  const [delegate, setDelegate] = useState("");
  const [submitting, setSubmitting] = useState("");
  const [decisionDraftState] = useState(readDecisionDraft);
  const [prefillStatus, setPrefillStatus] = useState("");
  const ready = Boolean(provider && ADDRESSES.DAO && ADDRESSES.TOKEN && chainId === ADDRESSES.CHAIN_ID);
  const decisionPrefill = getDecisionProposalPrefill(decisionDraftState.record);

  const prefillProposalFromDraft = () => {
    if (!decisionPrefill) return;
    setProposal((current) => ({
      ...current,
      description: decisionPrefill.description,
      category: decisionPrefill.category,
    }));
    setPrefillStatus("Description et catégorie préremplies depuis le brief local. L’adresse cible et le montant restent vides ou inchangés et doivent être saisis puis vérifiés par une personne.");
  };

  const signer = async () => {
    if (!ready) throw new Error("Connectez un wallet au réseau configuré avant de continuer.");
    return provider.getSigner();
  };

  const submit = async (action, task) => {
    setSubmitting(action);
    try {
      await task();
    } catch (error) {
      setNotification(`Action impossible : ${error.shortMessage || error.message}`);
    } finally {
      setSubmitting("");
    }
  };

  const createProposal = (event) => {
    event.preventDefault();
    if (!proposal.description.trim() || !isAddress(proposal.target) || !isPositiveAmount(proposal.amount) || !isDiscussionUri(proposal.discussionUri)) {
      setNotification("Renseignez une description, une adresse cible, un montant supérieur à zéro et, si présent, un lien HTTPS ou IPFS valide.");
      return;
    }
    void submit("proposal", async () => {
      const dao = new ethers.Contract(ADDRESSES.DAO, AdvancedInvestmentDAO.abi, await signer());
      const tx = await dao.createProposalWithContext(
        proposal.description.trim(),
        proposal.target,
        ethers.parseEther(proposal.amount),
        Number(proposal.category),
        proposal.discussionUri.trim()
      );
      await tx.wait();
      setProposal({ description: "", target: "", amount: "", category: "0", discussionUri: "" });
      setNotification("Proposition créée et soumise au processus de gouvernance.");
    });
  };

  const castVote = (event) => {
    event.preventDefault();
    if (!Number.isInteger(Number(vote.id)) || Number(vote.id) < 1 || vote.reason.length > 280) {
      setNotification("Saisissez un identifiant valide et un motif de 280 caractères maximum.");
      return;
    }
    void submit("vote", async () => {
      const dao = new ethers.Contract(ADDRESSES.DAO, AdvancedInvestmentDAO.abi, await signer());
      const reason = vote.reason.trim();
      const tx = reason
        ? await dao.voteWithReason(Number(vote.id), vote.support === "true", reason)
        : await dao.vote(Number(vote.id), vote.support === "true");
      await tx.wait();
      setVote({ id: "", support: "true", reason: "" });
      setNotification(reason ? "Votre vote et son motif public ont été envoyés." : "Votre vote a été envoyé.");
    });
  };

  const updateDelegation = (event) => {
    event.preventDefault();
    if (!isAddress(delegate)) {
      setNotification("Saisissez une adresse de délégation valide.");
      return;
    }
    void submit("delegate", async () => {
      const token = new ethers.Contract(ADDRESSES.TOKEN, ["function delegate(address delegatee) external"], await signer());
      const tx = await token.delegate(delegate);
      await tx.wait();
      setDelegate("");
      setNotification("Délégation mise à jour.");
    });
  };

  return (
    <div className="space-y-6">
      {!ready && (
        <div className="notice notice-warning" role="status">
          <div><strong>Actions désactivées</strong>Connectez un wallet au réseau {ADDRESSES.CHAIN_ID} et vérifiez que les adresses de gouvernance sont configurées.</div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Soumettre une proposition</CardTitle>
          <CardDescription>Une proposition ne déclenche aucune exécution directe : elle suit le vote, le délai de sécurité puis la validation du Safe.</CardDescription>
        </CardHeader>
        <CardContent>
          {decisionDraftState.error && <div className="notice notice-error" role="alert">{decisionDraftState.error}</div>}
          {decisionPrefill ? (
            <div className="notice notice-info decision-proposal-prefill" role="status">
              <div>
                <strong>Brouillon Decision Studio disponible</strong>
                Préremplissez uniquement la description et la catégorie à partir du brief local. L’adresse cible et le montant ne sont jamais préremplis : ils sont obligatoires, à saisir et à vérifier par une personne.
                <div className="form-actions">
                  <button className="button button-secondary" type="button" onClick={prefillProposalFromDraft}>Préremplir depuis le brouillon</button>
                </div>
                {prefillStatus && <p className="proposal-prefill-status" role="status">{prefillStatus}</p>}
              </div>
            </div>
          ) : !decisionDraftState.error && (
            <div className="notice notice-warning decision-proposal-prefill" role="status">
              <div>
                <strong>Aucun brouillon Decision Studio enregistré</strong>
                Créez et enregistrez un mandat local pour préparer une description de proposition. Rien ne sera soumis automatiquement.
                <div className="form-actions">
                  <Link className="button button-secondary" to="/decision-studio">Ouvrir Decision Studio</Link>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={createProposal}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="proposal-description">Description</label>
                <input id="proposal-description" value={proposal.description} onChange={(event) => setProposal({ ...proposal, description: event.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="proposal-target">Adresse cible</label>
                <input id="proposal-target" inputMode="text" placeholder="0x…" value={proposal.target} onChange={(event) => setProposal({ ...proposal, target: event.target.value })} aria-describedby="proposal-manual-fields-help" required />
              </div>
              <div className="field">
                <label htmlFor="proposal-amount">Montant (ETH)</label>
                <input id="proposal-amount" type="number" min="0" step="any" value={proposal.amount} onChange={(event) => setProposal({ ...proposal, amount: event.target.value })} aria-describedby="proposal-manual-fields-help" required />
              </div>
              <div className="field">
                <label htmlFor="proposal-category">Catégorie</label>
                <select id="proposal-category" value={proposal.category} onChange={(event) => setProposal({ ...proposal, category: event.target.value })}>
                  {categories.map((category, index) => <option key={category} value={index}>{category}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="proposal-discussion">Discussion publique (facultatif)</label>
                <input id="proposal-discussion" type="url" placeholder="https://... ou ipfs://..." value={proposal.discussionUri} onChange={(event) => setProposal({ ...proposal, discussionUri: event.target.value })} />
              </div>
            </div>
            <p id="proposal-manual-fields-help" className="field-help proposal-manual-fields-help">L’adresse cible et le montant sont obligatoires et doivent toujours être saisis et vérifiés manuellement. Le lien de discussion est enregistré publiquement : n’y ajoutez aucune donnée personnelle ou confidentielle. Le préremplissage ne déclenche aucune soumission.</p>
            <div className="form-actions"><button className="button button-primary" type="submit" disabled={!ready || walletLoading || submitting !== ""}>{submitting === "proposal" ? "Soumission…" : "Soumettre la proposition"}</button></div>
          </form>
        </CardContent>
      </Card>
      <div className="form-grid">
        <Card>
          <CardHeader><CardTitle>Voter</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={castVote}>
              <div className="field"><label htmlFor="vote-id">Identifiant de proposition</label><input id="vote-id" type="number" min="1" value={vote.id} onChange={(event) => setVote({ ...vote, id: event.target.value })} required /></div>
              <div className="field"><label htmlFor="vote-choice">Votre vote</label><select id="vote-choice" value={vote.support} onChange={(event) => setVote({ ...vote, support: event.target.value })}><option value="true">Pour</option><option value="false">Contre</option></select></div>
              <div className="field">
                <label htmlFor="vote-reason">Motif public (facultatif)</label>
                <textarea id="vote-reason" rows="3" maxLength="280" value={vote.reason} onChange={(event) => setVote({ ...vote, reason: event.target.value })} aria-describedby="vote-reason-help" />
                <span id="vote-reason-help" className="field-help">{vote.reason.length}/280 · Ce texte est inscrit publiquement sur la blockchain : n’y indiquez aucune donnée personnelle ou confidentielle.</span>
              </div>
              <div className="form-actions"><button className="button button-secondary" type="submit" disabled={!ready || walletLoading || submitting !== ""}>{submitting === "vote" ? "Envoi…" : "Envoyer mon vote"}</button></div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Déléguer mon vote</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={updateDelegation}>
              <div className="field"><label htmlFor="delegate-address">Adresse du délégué</label><input id="delegate-address" placeholder="0x…" value={delegate} onChange={(event) => setDelegate(event.target.value)} required /></div>
              <div className="form-actions"><button className="button button-secondary" type="submit" disabled={!ready || walletLoading || submitting !== ""}>{submitting === "delegate" ? "Envoi…" : "Mettre à jour"}</button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DAOActions;
export { DAOActions };

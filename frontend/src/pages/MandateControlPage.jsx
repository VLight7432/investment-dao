import React, { useContext, useMemo, useState } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { WalletContext } from "../components/WalletContext";
import { ADDRESSES } from "../config-addresses";
import AdvancedInvestmentDAO from "../abis/AdvancedInvestmentDAO.json";
import { useGlobalDataFetcher } from "../hooks/useGlobalDataFetcher";

const categories = ["NFT", "DeFi", "Venture capital", "Trésorerie"];
const EMPTY_MANDATE = { active: false, categories: [], counterparties: [], error: "" };
const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value);
const toDateTimeLocal = (date) => date.toISOString().slice(0, 16);
const createMandateDraft = () => ({
  description: "Mettre à jour le mandat d’investissement",
  expiresAt: toDateTimeLocal(new Date(Date.now() + 90 * 86_400_000)),
  executionDelayHours: "48",
  transactionCap: "",
  categories: categories.map(() => ({ allowed: false, cap: "" })),
  counterparties: "",
});

const fetchMandate = async (provider) => {
  if (!provider) return EMPTY_MANDATE;
  if (!ADDRESSES.DAO) throw new Error("L’adresse de la DAO n’est pas configurée.");

  const dao = new ethers.Contract(ADDRESSES.DAO, AdvancedInvestmentDAO.abi, provider);
  const mandate = await dao.getInvestmentMandate();
  if (!mandate.active) return EMPTY_MANDATE;

  const categoriesData = await Promise.all(categories.map(async (name, category) => {
    const [allowed, cap, allocated] = await Promise.all([
      dao.mandateCategoryAllowed(category),
      dao.mandateCategoryCap(category),
      dao.mandateCategoryAllocated(category),
    ]);
    return {
      name,
      allowed,
      cap: ethers.formatEther(cap),
      allocated: ethers.formatEther(allocated),
      remaining: ethers.formatEther(cap - allocated),
    };
  }));
  const counterparties = await dao.getActiveMandateCounterparties();

  return {
    active: true,
    expiresAt: Number(mandate.expiresAt),
    executionDelay: Number(mandate.executionDelay) / 86_400,
    transactionCap: ethers.formatEther(mandate.transactionCap),
    version: mandate.version.toString(),
    categories: categoriesData,
    counterparties,
  };
};

export default function MandateControlPage() {
  const {
    provider, chainId, isSupportedNetwork, setNotification, loading: walletLoading,
  } = useContext(WalletContext);
  const [draft, setDraft] = useState(createMandateDraft);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState("");
  const { data: mandateRaw, loading, error, refetch } = useGlobalDataFetcher(
    () => (isSupportedNetwork ? fetchMandate(provider) : Promise.resolve(EMPTY_MANDATE)),
    [provider, chainId, isSupportedNetwork],
    { cacheKey: `mandate-control:${chainId ?? "disconnected"}` }
  );
  const mandate = {
    ...EMPTY_MANDATE,
    ...mandateRaw,
    categories: Array.isArray(mandateRaw?.categories) ? mandateRaw.categories : [],
    counterparties: Array.isArray(mandateRaw?.counterparties) ? mandateRaw.counterparties : [],
  };
  const expiryLabel = useMemo(() => (
    mandate.active
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(mandate.expiresAt * 1000))
      : ""
  ), [mandate.active, mandate.expiresAt]);
  const ready = Boolean(provider && isSupportedNetwork && ADDRESSES.DAO);

  const updateCategory = (index, field, value) => {
    setDraft((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) => (
        categoryIndex === index ? { ...category, [field]: value } : category
      )),
    }));
  };

  const submitMandateProposal = async (event) => {
    event.preventDefault();
    setComposerError("");
    const expiresAt = Math.floor(new Date(draft.expiresAt).getTime() / 1000);
    const executionDelay = Number(draft.executionDelayHours) * 3600;
    const counterparties = [...new Set(
      draft.counterparties.split(/\s|,|\n/).map((address) => address.trim()).filter(Boolean)
    )];
    let transactionCap;
    let categoryCaps;
    try {
      transactionCap = ethers.parseEther(draft.transactionCap);
      categoryCaps = draft.categories.map((category) => (
        category.allowed ? ethers.parseEther(category.cap) : 0n
      ));
    } catch {
      setComposerError("Les plafonds doivent être des montants ETH valides.");
      return;
    }
    if (
      !draft.description.trim()
      || !Number.isFinite(expiresAt)
      || expiresAt <= Math.floor(Date.now() / 1000)
      || !Number.isInteger(executionDelay)
      || executionDelay < 3600
      || transactionCap <= 0n
      || draft.categories.some((category, index) => category.allowed && categoryCaps[index] <= 0n)
      || counterparties.some((address) => !isAddress(address))
    ) {
      setComposerError("Renseignez une description, une expiration future, un délai d’au moins une heure, des plafonds positifs pour les catégories autorisées et des adresses de contrepartie valides.");
      return;
    }

    setSubmitting(true);
    try {
      const dao = new ethers.Contract(ADDRESSES.DAO, AdvancedInvestmentDAO.abi, await provider.getSigner());
      const data = [
        dao.interface.encodeFunctionData("configureInvestmentMandate", [expiresAt, executionDelay, transactionCap]),
        ...draft.categories.map((category, index) => dao.interface.encodeFunctionData(
          "setMandateCategory",
          [index, category.allowed, categoryCaps[index]]
        )),
        ...counterparties.map((address) => dao.interface.encodeFunctionData("setMandateCounterparty", [address, true])),
      ];
      const tx = await dao.createMultiActionProposal(
        draft.description.trim(),
        Array(data.length).fill(ADDRESSES.DAO),
        Array(data.length).fill(0),
        data,
        4
      );
      await tx.wait();
      setDraft(createMandateDraft());
      setNotification("La proposition de mandat a été créée. Elle doit être votée puis exécutée par le Safe.");
    } catch (submissionError) {
      setNotification(`Création impossible : ${submissionError.shortMessage || submissionError.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Contrôle de trésorerie</p>
        <h1 className="page-title">Centre de contrôle des mandats</h1>
        <p className="page-intro">Consultez les règles exécutoires de la DAO avant une décision. Cette page lit le contrat : elle ne peut ni modifier le mandat ni exécuter une transaction.</p>
      </div>

      {!isSupportedNetwork && provider && <div className="notice notice-warning" role="status"><div><strong>Mauvais réseau</strong>Connectez-vous au réseau configuré pour consulter le mandat actif.</div></div>}
      {error && <div className="notice notice-error" role="alert"><div><strong>Mandat indisponible</strong>{error.message}</div></div>}
      {loading && <div className="status-row" role="status"><span className="spinner" aria-hidden="true" />Lecture du mandat on-chain…</div>}

      {!loading && !error && !mandate.active && (
        <div className="empty-state">
          <h2>Aucun mandat actif</h2>
          <p>Les plafonds et listes blanches ne sont pas encore appliqués on-chain. Leur activation exige une proposition de gouvernance approuvée puis exécutée par le Safe.</p>
          <Link className="button button-primary" to="/dashboard">Ouvrir la gouvernance</Link>
        </div>
      )}

      {mandate.active && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mandat actif · version {mandate.version}</CardTitle>
              <CardDescription>Ces limites sont vérifiées par le contrat lors de chaque exécution d’investissement.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="governance-grid">
                <div><dt>Expiration</dt><dd>{expiryLabel}</dd></div>
                <div><dt>Délai d’exécution</dt><dd>{mandate.executionDelay} jours</dd></div>
                <div><dt>Plafond par opération</dt><dd>{mandate.transactionCap} ETH</dd></div>
                <div><dt>Contreparties actives</dt><dd>{mandate.counterparties.length}</dd></div>
              </dl>
              <div className="form-actions"><button className="button button-secondary" type="button" onClick={() => void refetch()}>Actualiser</button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Capacité par catégorie</CardTitle></CardHeader>
            <CardContent>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Catégorie</th><th>Statut</th><th>Plafond</th><th>Alloué</th><th>Disponible</th></tr></thead>
                  <tbody>
                    {mandate.categories.map((category) => (
                      <tr key={category.name}>
                        <td>{category.name}</td>
                        <td>{category.allowed ? "Autorisée" : "Bloquée"}</td>
                        <td>{category.cap} ETH</td>
                        <td>{category.allocated} ETH</td>
                        <td>{category.remaining} ETH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contreparties autorisées</CardTitle>
              <CardDescription>Cette liste est liée à la version active du mandat. Une nouvelle version invalide les autorisations précédentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {mandate.counterparties.length ? (
                <ul className="simple-list">{mandate.counterparties.map((address) => <li key={address} className="wallet-account">{address}</li>)}</ul>
              ) : <p>Aucune contrepartie n’est autorisée : les investissements soumis au mandat seront bloqués.</p>}
            </CardContent>
          </Card>

          <div className="notice notice-info" role="status">
            <div><strong>Modifier le mandat</strong>La modification doit être encodée dans une proposition multi-actions de catégorie Gouvernance, puis approuvée par le vote et le Safe. Aucun bouton de cette page ne contourne ce processus.</div>
          </div>
        </div>
      )}

      <section className="content-section" aria-labelledby="mandate-composer-heading">
        <Card>
          <CardHeader>
            <CardTitle id="mandate-composer-heading">Proposer une nouvelle version</CardTitle>
            <CardDescription>Cette action crée uniquement une proposition multi-actions de gouvernance. Elle ne modifie pas le mandat tant que le vote et le Safe ne l’ont pas validée.</CardDescription>
          </CardHeader>
          <CardContent>
            {composerError && <div className="notice notice-error" role="alert"><div>{composerError}</div></div>}
            <form onSubmit={submitMandateProposal}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="mandate-description">Description de la proposition</label>
                  <input id="mandate-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="mandate-expiry">Expiration du mandat</label>
                  <input id="mandate-expiry" type="datetime-local" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="mandate-delay">Délai minimal (heures)</label>
                  <input id="mandate-delay" type="number" min="1" step="1" value={draft.executionDelayHours} onChange={(event) => setDraft({ ...draft, executionDelayHours: event.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="mandate-transaction-cap">Plafond par opération (ETH)</label>
                  <input id="mandate-transaction-cap" type="number" min="0" step="any" value={draft.transactionCap} onChange={(event) => setDraft({ ...draft, transactionCap: event.target.value })} required />
                </div>
              </div>
              <fieldset className="template-fieldset">
                <legend className="section-heading">Catégories et plafonds cumulés</legend>
                <div className="form-grid">
                  {categories.map((name, index) => (
                    <div className="field" key={name}>
                      <label><input type="checkbox" checked={draft.categories[index].allowed} onChange={(event) => updateCategory(index, "allowed", event.target.checked)} /> Autoriser {name}</label>
                      <input type="number" min="0" step="any" placeholder="Plafond ETH" disabled={!draft.categories[index].allowed} value={draft.categories[index].cap} onChange={(event) => updateCategory(index, "cap", event.target.value)} />
                    </div>
                  ))}
                </div>
              </fieldset>
              <div className="field">
                <label htmlFor="mandate-counterparties">Contreparties autorisées</label>
                <textarea id="mandate-counterparties" rows="4" placeholder="Une adresse 0x… par ligne ou séparée par des virgules" value={draft.counterparties} onChange={(event) => setDraft({ ...draft, counterparties: event.target.value })} />
                <span className="field-help">Laisser vide bloque toute nouvelle exécution d’investissement. Une nouvelle version invalide les contreparties et allocations de la version précédente.</span>
              </div>
              <div className="notice notice-warning" role="status"><div><strong>Vérification requise</strong>Contrôlez les adresses et les plafonds avant de soumettre. La proposition déclenche un vote, puis une validation Safe ; aucune modification n’est immédiate.</div></div>
              <div className="form-actions"><button className="button button-primary" type="submit" disabled={!ready || walletLoading || submitting}>{submitting ? "Création…" : "Créer la proposition de mandat"}</button></div>
            </form>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}

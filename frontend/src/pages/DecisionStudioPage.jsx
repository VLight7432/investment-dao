import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import {
  ASSET_CATEGORIES,
  EMPTY_MANDATE,
  LIQUIDITY_HORIZONS,
  RISK_TOLERANCES,
  formatAmount,
  generateDecisionBrief,
  getAssistantContent,
  getGovernanceRecommendation,
  getRiskAssessment,
  readDecisionDraft,
  removeDecisionDraft,
  saveDecisionDraft,
  validateMandate,
} from "../decisionStudio";

function formatSavedAt(updatedAt) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt));
}

export default function DecisionStudioPage() {
  const [storedDraft] = useState(readDecisionDraft);
  const [savedDraft, setSavedDraft] = useState(storedDraft.record);
  const [mandate, setMandate] = useState(() => storedDraft.record?.mandate || EMPTY_MANDATE);
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState(storedDraft.error || "");
  const [savedAt, setSavedAt] = useState(storedDraft.record?.updatedAt || "");
  const [status, setStatus] = useState("");
  const [briefFeedback, setBriefFeedback] = useState(null);

  const assessment = getRiskAssessment(mandate);
  const recommendation = getGovernanceRecommendation(mandate, assessment);
  const assistant = getAssistantContent(mandate, assessment);
  const decisionBrief = generateDecisionBrief(savedDraft);

  const updateMandate = (field, value) => {
    setMandate((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus("");
  };

  const saveDraft = (event) => {
    event.preventDefault();
    const nextErrors = validateMandate(mandate);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus("");
      return;
    }

    const { record, error } = saveDecisionDraft(mandate);
    if (error) {
      setStorageError(error);
      return;
    }

    setStorageError("");
    setSavedDraft(record);
    setSavedAt(record.updatedAt);
    setBriefFeedback(null);
    setStatus("Brouillon local enregistré. Aucune proposition, transaction ou règle active n’a été créée.");
  };

  const resetDraft = () => {
    const { error } = removeDecisionDraft();
    if (error) {
      setStorageError(error);
      return;
    }

    setMandate(EMPTY_MANDATE);
    setSavedDraft(null);
    setErrors({});
    setStorageError("");
    setSavedAt("");
    setStatus("Brouillon local réinitialisé et supprimé de cet appareil.");
    setBriefFeedback(null);
  };

  const copyBrief = async () => {
    if (!decisionBrief) {
      setBriefFeedback({ type: "error", message: "Le brief n’est pas disponible : enregistrez d’abord un mandat complet." });
      return;
    }
    if (!navigator.clipboard?.writeText) {
      setBriefFeedback({ type: "error", message: "La copie n’est pas prise en charge par ce navigateur. Téléchargez le brief pour le conserver." });
      return;
    }

    try {
      await navigator.clipboard.writeText(decisionBrief);
      setBriefFeedback({ type: "success", message: "Brief copié dans le presse-papiers." });
    } catch {
      setBriefFeedback({ type: "error", message: "La copie a échoué. Vérifiez l’autorisation du presse-papiers ou téléchargez le brief." });
    }
  };

  const downloadBrief = () => {
    if (!decisionBrief) {
      setBriefFeedback({ type: "error", message: "Le brief n’est pas disponible : enregistrez d’abord un mandat complet." });
      return;
    }

    try {
      const file = new Blob([decisionBrief], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "brief-decision-nexusdao.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBriefFeedback({ type: "success", message: "Brief téléchargé au format texte." });
    } catch {
      setBriefFeedback({ type: "error", message: "Le téléchargement a échoué. Réessayez dans un navigateur autorisant les téléchargements." });
    }
  };

  return (
    <PageLayout>
      <div className="page-header decision-header">
        <p className="eyebrow">Decision Studio</p>
        <h1 className="page-title">Préparez une décision d’investissement.</h1>
        <p className="page-intro">
          Un espace local pour cadrer un mandat, comprendre ses points de vigilance et préparer une gouvernance adaptée.
          Rien ici ne constitue un conseil financier, une proposition active ou une instruction blockchain.
        </p>
      </div>

      <div className="notice notice-warning decision-disclaimer" role="note">
        <div><strong>Mode préparation locale</strong>Ce MVP ne fournit ni conseil financier, ni KYC, ni paiement, ni IA externe. Il ne déclenche aucune transaction : toute exécution reste soumise à une proposition approuvée et au Safe.</div>
      </div>

      <form onSubmit={saveDraft} noValidate>
        {storageError && <div className="notice notice-error" role="alert">{storageError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="notice notice-error" role="alert">Corrigez les champs signalés avant d’enregistrer le brouillon.</div>
        )}

        <div className="decision-workspace">
          <section className="card decision-mandate" aria-labelledby="mandate-heading">
            <div className="card-header">
              <h2 id="mandate-heading" className="card-title">Mandat programmable</h2>
              <p className="card-description">Définissez des repères de décision. Ils restent modifiables et enregistrés uniquement dans ce navigateur.</p>
            </div>
            <div className="form-grid">
              <div className="field decision-objective">
                <label htmlFor="decision-objective">Objectif d’investissement</label>
                <textarea
                  id="decision-objective"
                  value={mandate.objective}
                  onChange={(event) => updateMandate("objective", event.target.value)}
                  rows="4"
                  aria-invalid={Boolean(errors.objective)}
                  aria-describedby={errors.objective ? "decision-objective-error" : "decision-objective-help"}
                  required
                />
                <span id="decision-objective-help" className="field-help">Ex. : diversifier une réserve à long terme tout en préservant une sortie documentée.</span>
                {errors.objective && <span id="decision-objective-error" className="field-error">{errors.objective}</span>}
              </div>
              <div className="field">
                <label htmlFor="asset-category">Catégorie d’actifs</label>
                <select id="asset-category" value={mandate.assetCategory} onChange={(event) => updateMandate("assetCategory", event.target.value)} aria-invalid={Boolean(errors.assetCategory)} aria-describedby={errors.assetCategory ? "asset-category-error" : undefined} required>
                  <option value="">Choisir une catégorie</option>
                  {ASSET_CATEGORIES.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}
                </select>
                {errors.assetCategory && <span id="asset-category-error" className="field-error">{errors.assetCategory}</span>}
              </div>
              <div className="field">
                <label htmlFor="investment-amount">Montant indicatif (EUR)</label>
                <input id="investment-amount" type="number" min="1" step="1" inputMode="decimal" value={mandate.amount} onChange={(event) => updateMandate("amount", event.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "investment-amount-error" : undefined} required />
                <span className="field-help">Un montant de préparation, sans paiement ni mouvement de fonds.</span>
                {errors.amount && <span id="investment-amount-error" className="field-error">{errors.amount}</span>}
              </div>
              <div className="field">
                <label htmlFor="max-allocation">Allocation maximale (%)</label>
                <input id="max-allocation" type="number" min="1" max="100" step="1" inputMode="numeric" value={mandate.maxAllocation} onChange={(event) => updateMandate("maxAllocation", event.target.value)} aria-invalid={Boolean(errors.maxAllocation)} aria-describedby={errors.maxAllocation ? "max-allocation-error" : undefined} required />
                <span className="field-help">Part maximale envisagée de la trésorerie, à vérifier par la DAO.</span>
                {errors.maxAllocation && <span id="max-allocation-error" className="field-error">{errors.maxAllocation}</span>}
              </div>
              <div className="field">
                <label htmlFor="liquidity-horizon">Horizon de liquidité</label>
                <select id="liquidity-horizon" value={mandate.liquidityHorizon} onChange={(event) => updateMandate("liquidityHorizon", event.target.value)} aria-invalid={Boolean(errors.liquidityHorizon)} aria-describedby={errors.liquidityHorizon ? "liquidity-horizon-error" : undefined} required>
                  <option value="">Choisir un horizon</option>
                  {LIQUIDITY_HORIZONS.map((horizon) => <option value={horizon.value} key={horizon.value}>{horizon.label}</option>)}
                </select>
                {errors.liquidityHorizon && <span id="liquidity-horizon-error" className="field-error">{errors.liquidityHorizon}</span>}
              </div>
              <div className="field">
                <label htmlFor="risk-tolerance">Tolérance au risque</label>
                <select id="risk-tolerance" value={mandate.riskTolerance} onChange={(event) => updateMandate("riskTolerance", event.target.value)} aria-invalid={Boolean(errors.riskTolerance)} aria-describedby={errors.riskTolerance ? "risk-tolerance-error" : undefined} required>
                  <option value="">Choisir une tolérance</option>
                  {RISK_TOLERANCES.map((tolerance) => <option value={tolerance.value} key={tolerance.value}>{tolerance.label}</option>)}
                </select>
                {errors.riskTolerance && <span id="risk-tolerance-error" className="field-error">{errors.riskTolerance}</span>}
              </div>
            </div>
            <div className="form-actions decision-actions">
              <button className="button button-primary" type="submit">Enregistrer le brouillon local</button>
              <button className="button button-secondary" type="button" onClick={resetDraft}>Réinitialiser</button>
              {savedDraft && <Link className="button button-secondary" to="/dashboard">Préparer une proposition avec ce brouillon</Link>}
              {savedAt && <span className="status-row">Dernière sauvegarde : {formatSavedAt(savedAt)}</span>}
            </div>
            {status && <p className="status-row decision-status" role="status">{status}</p>}
          </section>

          <section className="card decision-risk" aria-labelledby="risk-heading">
            <div className="card-header">
              <h2 id="risk-heading" className="card-title">Moteur de risque explicable</h2>
              <p className="card-description">Orientation déterministe fondée uniquement sur les champs ci-contre. Ce n’est pas un conseil financier.</p>
            </div>
            {assessment ? (
              <>
                <div className={`risk-score risk-${assessment.level.toLowerCase().replace(" ", "-")}`}>
                  <span>Score d’orientation</span>
                  <strong>{assessment.score}<small>/100</small></strong>
                  <b>{assessment.level}</b>
                </div>
                <ul className="risk-factors" aria-label="Détail du calcul du risque">
                  {assessment.factors.map((factor) => (
                    <li key={factor.label}><span><strong>{factor.label}</strong>{factor.detail}</span><b>{factor.value}</b></li>
                  ))}
                </ul>
                <p className="field-help">Score = somme des facteurs, plafonnée à 100. Il sert uniquement à structurer la discussion collective.</p>
              </>
            ) : <p className="empty-inline">Complétez le mandat pour afficher une orientation de risque transparente.</p>}
          </section>
        </div>
      </form>

      <section className="decision-section" aria-labelledby="brief-heading">
        <div className="section-intro">
          <p className="eyebrow">Brief de décision</p>
          <h2 id="brief-heading" className="section-heading">Partagez une synthèse de préparation</h2>
          <p>Le brief reprend uniquement le dernier mandat enregistré localement. Il reste non contraignant et n’envoie aucune donnée ni transaction.</p>
        </div>
        {decisionBrief ? (
          <div className="card decision-brief">
            <div className="brief-actions" aria-label="Actions sur le brief de décision">
              <button className="button button-secondary" type="button" onClick={() => void copyBrief()}>Copier le brief</button>
              <button className="button button-secondary" type="button" onClick={downloadBrief}>Télécharger le fichier texte</button>
            </div>
            {briefFeedback && (
              <p className={`decision-brief-feedback ${briefFeedback.type === "error" ? "is-error" : "is-success"}`} role={briefFeedback.type === "error" ? "alert" : "status"}>
                {briefFeedback.message}
              </p>
            )}
            <pre className="decision-brief-preview" aria-label="Aperçu du brief de décision">{decisionBrief}</pre>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Enregistrez le mandat pour créer le brief</h3>
            <p>Le brief est produit uniquement à partir d’un brouillon local complet et sauvegardé.</p>
          </div>
        )}
      </section>

      <section className="decision-section" aria-labelledby="governance-heading">
        <div className="section-intro">
          <p className="eyebrow">Gouvernance adaptative</p>
          <h2 id="governance-heading" className="section-heading">Repères de contrôle à discuter</h2>
        </div>
        {recommendation ? (
          <div className="governance-recommendation card">
            <dl className="governance-grid">
              <div><dt>Quorum recommandé</dt><dd>{recommendation.quorum}</dd></div>
              <div><dt>Seuil d’approbation</dt><dd>{recommendation.approval}</dd></div>
              <div><dt>Délai indicatif</dt><dd>{recommendation.timelock}</dd></div>
              <div><dt>Seuil Safe indicatif</dt><dd>{recommendation.safe}</dd></div>
            </dl>
            <p className="governance-rationale"><strong>Pourquoi ?</strong> {recommendation.rationale}</p>
          </div>
        ) : <div className="empty-state"><h3>Des repères après le mandat</h3><p>Complétez le mandat pour obtenir une recommandation locale basée sur le risque et le montant.</p></div>}
      </section>

      <section className="decision-section" aria-labelledby="assistant-heading">
        <div className="section-intro">
          <p className="eyebrow">Assistant de décision</p>
          <h2 id="assistant-heading" className="section-heading">Préparez l’examen collectif</h2>
          <p>Assistant local fondé sur des règles : il utilise uniquement votre formulaire, sans modèle d’IA, données live ni recommandation personnalisée.</p>
        </div>
        {assistant ? (
          <div className="assistant-grid">
            <article className="card">
              <h3 className="card-title">Questions à documenter</h3>
              <ol className="decision-list">{assistant.questions.map((question) => <li key={question}>{question}</li>)}</ol>
            </article>
            <article className="card">
              <h3 className="card-title">Checklist de préparation</h3>
              <ul className="decision-list checklist">{assistant.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="card">
              <h3 className="card-title">Prompts de scénarios</h3>
              <ul className="decision-list">{assistant.scenarios.map((scenario) => <li key={scenario}>{scenario}</li>)}</ul>
            </article>
          </div>
        ) : <div className="empty-state"><h3>Assistant prêt quand le mandat l’est</h3><p>Les questions, la checklist et les scénarios seront générés localement à partir de vos six champs.</p></div>}
      </section>

      {assessment && <p className="decision-footnote">Montant de référence : {formatAmount(mandate.amount)}. Ce studio ne remplace pas une analyse professionnelle ou les règles actives de votre DAO.</p>}
    </PageLayout>
  );
}

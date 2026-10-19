import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import {
  GOVERNANCE_TEMPLATES,
  getTemplateById,
  readOnboardingProfile,
  saveOnboardingProfile,
} from "../onboardingProfile";

const STEPS = ["Votre organisation", "Votre modèle", "Votre récapitulatif"];

const initialProfile = {
  organizationName: "",
  governanceGoal: "",
  templateId: "",
};

function validateProfile(profile, step) {
  const errors = {};

  if (step === 0 || step === 2) {
    if (!profile.organizationName.trim()) errors.organizationName = "Indiquez le nom de votre organisation.";
    if (!profile.governanceGoal.trim()) errors.governanceGoal = "Décrivez l’objectif de gouvernance.";
  }
  if ((step === 1 || step === 2) && !getTemplateById(profile.templateId)) {
    errors.templateId = "Sélectionnez un modèle de gouvernance.";
  }

  return errors;
}

export default function OnboardingPage() {
  const [storedProfile] = useState(readOnboardingProfile);
  const [profile, setProfile] = useState(() => (
    storedProfile.profile
      ? {
        organizationName: storedProfile.profile.organizationName,
        governanceGoal: storedProfile.profile.governanceGoal,
        templateId: storedProfile.profile.templateId,
      }
      : initialProfile
  ));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState(storedProfile.error || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateProfile = (field, value) => {
    setProfile((currentProfile) => ({ ...currentProfile, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSaved(false);
  };

  const nextStep = () => {
    const nextErrors = validateProfile(profile, step);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setStep((currentStep) => currentStep + 1);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const nextErrors = validateProfile(profile, 2);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const { error } = saveOnboardingProfile(profile);
    setSaving(false);
    if (error) {
      setStorageError(error);
      return;
    }

    setStorageError("");
    setSaved(true);
  };

  const selectedTemplate = getTemplateById(profile.templateId);

  return (
    <PageLayout>
      <div className="page-header onboarding-header">
        <p className="eyebrow">Premiers repères</p>
        <h1 className="page-title">Préparez votre cadre de décision.</h1>
        <p className="page-intro">
          Ce parcours enregistre uniquement vos choix sur cet appareil. Il ne crée ni compte, ni paiement, ni accès au Safe.
        </p>
      </div>

      <section className="onboarding-workflow surface" aria-labelledby="workflow-heading">
        <div>
          <p className="eyebrow">Un processus protégé</p>
          <h2 id="workflow-heading">De l’idée à l’exécution, en trois temps</h2>
        </div>
        <ol className="workflow-list">
          <li><strong>1. Proposer</strong><span>Une décision est préparée avec son contexte.</span></li>
          <li><strong>2. Voter</strong><span>Les membres l’examinent et se prononcent selon vos règles.</span></li>
          <li><strong>3. Exécuter via le Safe</strong><span>Après le délai prévu, les signataires désignés valident l’exécution.</span></li>
        </ol>
      </section>

      <form className="onboarding-form" onSubmit={saveProfile} noValidate>
        <nav className="onboarding-progress" aria-label="Étapes du parcours">
          <ol>
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={index === step ? "is-current" : index < step ? "is-complete" : ""}
                aria-current={index === step ? "step" : undefined}
              >
                <span aria-hidden="true">{index + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          <p aria-live="polite">Étape {step + 1} sur {STEPS.length} : {STEPS[step]}</p>
        </nav>

        {storageError && <div className="notice notice-error" role="alert">{storageError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="notice notice-error" role="alert">
            Corrigez les champs signalés avant de continuer.
          </div>
        )}

        {step === 0 && (
          <section className="card onboarding-step" aria-labelledby="organization-heading">
            <div className="card-header">
              <h2 id="organization-heading" className="card-title">Parlez-nous de votre organisation</h2>
              <p className="card-description">Ces informations restent dans le stockage local de ce navigateur.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="organization-name">Nom de l’organisation</label>
                <input
                  id="organization-name"
                  name="organizationName"
                  value={profile.organizationName}
                  onChange={(event) => updateProfile("organizationName", event.target.value)}
                  aria-invalid={Boolean(errors.organizationName)}
                  aria-describedby={errors.organizationName ? "organization-name-error" : undefined}
                  autoComplete="organization"
                  required
                />
                {errors.organizationName && <span id="organization-name-error" className="field-error">{errors.organizationName}</span>}
              </div>
              <div className="field">
                <label htmlFor="governance-goal">Objectif de gouvernance</label>
                <textarea
                  id="governance-goal"
                  name="governanceGoal"
                  value={profile.governanceGoal}
                  onChange={(event) => updateProfile("governanceGoal", event.target.value)}
                  aria-invalid={Boolean(errors.governanceGoal)}
                  aria-describedby={errors.governanceGoal ? "governance-goal-error" : "governance-goal-help"}
                  rows="4"
                  required
                />
                <span id="governance-goal-help" className="field-help">Ex. : décider ensemble des investissements à examiner chaque mois.</span>
                {errors.governanceGoal && <span id="governance-goal-error" className="field-error">{errors.governanceGoal}</span>}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-step" aria-labelledby="template-heading">
            <div className="section-intro">
              <h2 id="template-heading" className="section-heading">Choisissez un point de départ</h2>
              <p>Ces recommandations sont à discuter avec votre collectif. Elles ne modifient aucun paramètre actif.</p>
            </div>
            <fieldset className="template-fieldset" aria-describedby={errors.templateId ? "template-error" : "template-help"}>
              <legend className="sr-only">Modèle de gouvernance</legend>
              <p id="template-help" className="sr-only">Choisissez un modèle avec les touches fléchées ou en cliquant sur une carte.</p>
              <div className="template-grid">
                {GOVERNANCE_TEMPLATES.map((template) => (
                  <label className={`template-card ${profile.templateId === template.id ? "is-selected" : ""}`} key={template.id}>
                    <input
                      type="radio"
                      name="governanceTemplate"
                      value={template.id}
                      checked={profile.templateId === template.id}
                      onChange={(event) => updateProfile("templateId", event.target.value)}
                    />
                    <span className="template-card-title">{template.name}</span>
                    <span className="template-card-description">{template.description}</span>
                    <span className="template-details">
                      <span><strong>Quorum</strong>{template.quorum}</span>
                      <span><strong>Approbation</strong>{template.approval}</span>
                      <span><strong>Délai</strong>{template.timelock}</span>
                      <span><strong>Safe</strong>{template.safe}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.templateId && <span id="template-error" className="field-error">{errors.templateId}</span>}
            </fieldset>
          </section>
        )}

        {step === 2 && selectedTemplate && (
          <section className="card onboarding-step" aria-labelledby="summary-heading">
            <div className="card-header">
              <h2 id="summary-heading" className="card-title">Vérifiez votre récapitulatif</h2>
              <p className="card-description">Vous pourrez modifier ces informations plus tard depuis les paramètres.</p>
            </div>
            <dl className="profile-summary">
              <div><dt>Organisation</dt><dd>{profile.organizationName}</dd></div>
              <div><dt>Objectif</dt><dd>{profile.governanceGoal}</dd></div>
              <div><dt>Modèle choisi</dt><dd>{selectedTemplate.name}</dd></div>
              <div><dt>Recommandation Safe</dt><dd>{selectedTemplate.safe}</dd></div>
            </dl>
            <div className="notice notice-info">
              <div><strong>À retenir</strong>Cette étape sauvegarde un brouillon local. Elle n’applique aucune règle et ne déclenche aucune exécution.</div>
            </div>
          </section>
        )}

        <div className="form-actions onboarding-actions">
          {step > 0 && (
            <button className="button button-secondary" type="button" onClick={() => setStep((currentStep) => currentStep - 1)}>
              Retour
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="button button-primary" type="button" onClick={nextStep}>Continuer</button>
          ) : (
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer ce profil local"}
            </button>
          )}
          {saved && (
            <span className="status-row" role="status">
              Profil local enregistré. <Link to="/settings">Voir les paramètres</Link>
            </span>
          )}
        </div>
      </form>
    </PageLayout>
  );
}

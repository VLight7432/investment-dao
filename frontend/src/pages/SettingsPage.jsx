import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { getTemplateById, readOnboardingProfile } from "../onboardingProfile";
import { formatAmount, readDecisionDraft } from "../decisionStudio";

const applyTheme = (preference) => {
  const dark = preference === "dark"
    || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
};

export default function SettingsPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");
  const [saved, setSaved] = useState(false);
  const [profileState] = useState(() => {
    const { profile, error } = readOnboardingProfile();
    return { profile, error: error || "" };
  });
  const [decisionDraftState] = useState(readDecisionDraft);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const save = (event) => {
    event.preventDefault();
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    setSaved(true);
  };

  return (
    <PageLayout>
      <div className="page-header">
        <p className="eyebrow">Préférences</p>
        <h1 className="page-title">Paramètres</h1>
        <p className="page-intro">Personnalisez l’affichage de NexusDAO sur cet appareil. Aucun paramètre de gouvernance n’est modifié ici.</p>
      </div>
      <section className="card settings-profile" aria-labelledby="profile-heading">
        <div className="card-header">
          <h2 id="profile-heading" className="card-title">Profil de gouvernance</h2>
          <p className="card-description">Un repère local pour préparer votre organisation. Il ne modifie pas la gouvernance active.</p>
        </div>
        {profileState.error ? (
          <div className="notice notice-error" role="alert">{profileState.error}</div>
        ) : profileState.profile ? (
          (() => {
            const template = getTemplateById(profileState.profile.templateId);
            return (
              <div className="settings-profile-content">
                <dl className="profile-summary">
                  <div><dt>Organisation</dt><dd>{profileState.profile.organizationName}</dd></div>
                  <div><dt>Objectif</dt><dd>{profileState.profile.governanceGoal}</dd></div>
                  <div><dt>Modèle choisi</dt><dd>{template.name}</dd></div>
                  <div><dt>Quorum recommandé</dt><dd>{template.quorum}</dd></div>
                  <div><dt>Approbation recommandée</dt><dd>{template.approval}</dd></div>
                  <div><dt>Délai recommandé</dt><dd>{template.timelock}</dd></div>
                  <div><dt>Recommandation Safe</dt><dd>{template.safe}</dd></div>
                </dl>
                <Link className="button button-secondary" to="/onboarding">Modifier le profil</Link>
              </div>
            );
          })()
        ) : (
          <div className="empty-state">
            <h3>Pas encore de profil local</h3>
            <p>Choisissez un modèle de gouvernance pour conserver un point de départ sur cet appareil.</p>
            <Link className="button button-primary" to="/onboarding">Commencer le parcours</Link>
          </div>
        )}
      </section>
      <section className="card settings-decision-draft" aria-labelledby="decision-draft-heading">
        <div className="card-header">
          <h2 id="decision-draft-heading" className="card-title">Brouillon Decision Studio</h2>
          <p className="card-description">Statut du dernier mandat enregistré localement sur cet appareil.</p>
        </div>
        {decisionDraftState.error ? (
          <div className="notice notice-error" role="alert">{decisionDraftState.error}</div>
        ) : decisionDraftState.record ? (
          <div className="settings-draft-content">
            <p><strong>Brouillon et brief disponibles</strong> · {formatAmount(decisionDraftState.record.mandate.amount)} · sauvegardé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(decisionDraftState.record.updatedAt))}. Le brief reste local et non contraignant.</p>
            <Link className="button button-secondary" to="/decision-studio">Ouvrir le brief</Link>
          </div>
        ) : (
          <div className="settings-draft-content">
            <p>Aucun brouillon Decision Studio n’est enregistré localement.</p>
            <Link className="button button-secondary" to="/decision-studio">Créer un brouillon</Link>
          </div>
        )}
      </section>
      <section className="card" aria-labelledby="appearance-heading">
        <div className="card-header">
          <h2 id="appearance-heading" className="card-title">Apparence</h2>
          <p className="card-description">Votre préférence est enregistrée localement dans ce navigateur.</p>
        </div>
        <form onSubmit={save}>
          <div className="field">
            <label htmlFor="theme">Mode d’affichage</label>
            <select id="theme" value={theme} onChange={(event) => { setTheme(event.target.value); setSaved(false); }}>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="system">Système</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit">Enregistrer</button>
            {saved && <span className="status-row" role="status">Préférence enregistrée.</span>}
          </div>
        </form>
      </section>
    </PageLayout>
  );
}

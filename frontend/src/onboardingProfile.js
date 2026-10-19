import { readVersionedRecord, saveVersionedRecord } from "./localPersistence";

export const ONBOARDING_PROFILE_KEY = "nexusdao:onboarding-profile:v1";

export const GOVERNANCE_TEMPLATES = [
  {
    id: "investment-club",
    name: "Club d’investissement",
    description: "Pour un petit groupe qui examine des opportunités et décide régulièrement ensemble.",
    quorum: "60 % des membres ayant le droit de vote",
    approval: "Majorité simple des votes exprimés",
    timelock: "24 heures avant l’exécution",
    safe: "Prévoir 2 signataires sur 3 dans le Safe",
  },
  {
    id: "community-treasury",
    name: "Trésorerie communautaire",
    description: "Pour financer des initiatives partagées avec une participation large et transparente.",
    quorum: "40 % des membres ayant le droit de vote",
    approval: "Deux tiers des votes exprimés",
    timelock: "72 heures avant l’exécution",
    safe: "Prévoir 3 signataires sur 5 dans le Safe",
  },
  {
    id: "real-estate-collective",
    name: "Collectif immobilier",
    description: "Pour des décisions plus engageantes, préparées et vérifiées par plusieurs personnes.",
    quorum: "70 % des membres ayant le droit de vote",
    approval: "Deux tiers des votes exprimés",
    timelock: "7 jours avant l’exécution",
    safe: "Prévoir 3 signataires sur 4 dans le Safe",
  },
];

export const getTemplateById = (id) => GOVERNANCE_TEMPLATES.find((template) => template.id === id);

export function readOnboardingProfile() {
  const { record: profile, error } = readVersionedRecord({
    key: ONBOARDING_PROFILE_KEY,
    version: 1,
    label: "profil",
    validate: (record) => (
      typeof record.organizationName === "string"
      && typeof record.governanceGoal === "string"
      && Boolean(record.organizationName.trim())
      && Boolean(record.governanceGoal.trim())
      && Boolean(getTemplateById(record.templateId))
    ),
  });
  return { profile, error };
}

export function saveOnboardingProfile({ organizationName, governanceGoal, templateId }) {
  const profile = {
    version: 1,
    organizationName: organizationName.trim(),
    governanceGoal: governanceGoal.trim(),
    templateId,
    updatedAt: new Date().toISOString(),
  };

  return saveVersionedRecord({ key: ONBOARDING_PROFILE_KEY, record: profile, label: "profil" });
}

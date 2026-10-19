import {
  readVersionedRecord,
  removeLocalRecord,
  saveVersionedRecord,
} from "./localPersistence";

export const DECISION_DRAFT_KEY = "nexusdao:decision-draft:v1";
const DRAFT_VERSION = 1;

export const ASSET_CATEGORIES = [
  { value: "cash", label: "Liquidités et monétaire", risk: 5 },
  { value: "bonds", label: "Obligations", risk: 15 },
  { value: "equities", label: "Actions", risk: 30 },
  { value: "defi", label: "DeFi", risk: 45 },
  { value: "nft", label: "NFT et actifs numériques", risk: 50 },
];

export const LIQUIDITY_HORIZONS = [
  { value: "short", label: "Court terme (moins de 12 mois)", risk: 25 },
  { value: "medium", label: "Moyen terme (1 à 3 ans)", risk: 12 },
  { value: "long", label: "Long terme (plus de 3 ans)", risk: 5 },
];

export const RISK_TOLERANCES = [
  { value: "prudent", label: "Prudente", risk: 20 },
  { value: "balanced", label: "Équilibrée", risk: 10 },
  { value: "dynamic", label: "Dynamique", risk: 0 },
];

export const EMPTY_MANDATE = {
  objective: "",
  assetCategory: "",
  amount: "",
  maxAllocation: "",
  liquidityHorizon: "",
  riskTolerance: "",
};

const lookup = (items, value) => items.find((item) => item.value === value);

export function validateMandate(mandate) {
  const errors = {};
  const safeMandate = mandate && typeof mandate === "object" ? mandate : {};
  const amount = Number(safeMandate.amount);
  const maxAllocation = Number(safeMandate.maxAllocation);

  if (typeof safeMandate.objective !== "string" || !safeMandate.objective.trim()) {
    errors.objective = "Décrivez l’objectif d’investissement.";
  }
  if (!lookup(ASSET_CATEGORIES, safeMandate.assetCategory)) errors.assetCategory = "Choisissez une catégorie d’actifs.";
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Indiquez un montant supérieur à 0.";
  if (!Number.isFinite(maxAllocation) || maxAllocation <= 0 || maxAllocation > 100) {
    errors.maxAllocation = "Indiquez une allocation entre 1 et 100 %.";
  }
  if (!lookup(LIQUIDITY_HORIZONS, safeMandate.liquidityHorizon)) errors.liquidityHorizon = "Choisissez un horizon de liquidité.";
  if (!lookup(RISK_TOLERANCES, safeMandate.riskTolerance)) errors.riskTolerance = "Choisissez une tolérance au risque.";

  return errors;
}

export function isCompleteMandate(mandate) {
  return Object.keys(validateMandate(mandate)).length === 0;
}

function allocationRisk(maxAllocation) {
  if (maxAllocation <= 10) return 5;
  if (maxAllocation <= 25) return 12;
  if (maxAllocation <= 50) return 25;
  return 40;
}

function amountRisk(amount) {
  if (amount >= 100000) return 10;
  if (amount >= 25000) return 5;
  return 0;
}

export function getRiskAssessment(mandate) {
  if (!isCompleteMandate(mandate)) return null;

  const category = lookup(ASSET_CATEGORIES, mandate.assetCategory);
  const horizon = lookup(LIQUIDITY_HORIZONS, mandate.liquidityHorizon);
  const tolerance = lookup(RISK_TOLERANCES, mandate.riskTolerance);
  const allocation = allocationRisk(Number(mandate.maxAllocation));
  const amount = amountRisk(Number(mandate.amount));
  const score = Math.min(100, category.risk + horizon.risk + tolerance.risk + allocation + amount);
  const level = score <= 34 ? "Contenu" : score <= 64 ? "Élevé" : "Très élevé";

  return {
    score,
    level,
    factors: [
      { label: "Catégorie d’actifs", value: `+${category.risk}`, detail: category.label },
      { label: "Horizon de liquidité", value: `+${horizon.risk}`, detail: horizon.label },
      { label: "Tolérance déclarée", value: `+${tolerance.risk}`, detail: tolerance.label },
      { label: "Allocation maximale", value: `+${allocation}`, detail: `${mandate.maxAllocation} %` },
      { label: "Montant indicatif", value: `+${amount}`, detail: formatAmount(mandate.amount) },
    ],
  };
}

export function getGovernanceRecommendation(mandate, assessment) {
  if (!assessment) return null;

  const amount = Number(mandate.amount);
  const level = Math.max(
    assessment.score >= 65 ? 3 : assessment.score >= 35 ? 2 : 1,
    amount >= 100000 ? 3 : amount >= 25000 ? 2 : 1,
  );
  const recommendations = {
    1: {
      quorum: "50 %",
      approval: "Majorité simple",
      timelock: "24 heures",
      safe: "2 signataires sur 3",
    },
    2: {
      quorum: "60 %",
      approval: "Deux tiers",
      timelock: "72 heures",
      safe: "3 signataires sur 5",
    },
    3: {
      quorum: "70 %",
      approval: "Trois quarts",
      timelock: "7 jours",
      safe: "3 signataires sur 4",
    },
  };
  const driver = level === 3
    ? "Le niveau de contrôle renforcé répond à un risque ou à un montant élevé."
    : level === 2
      ? "Le niveau de contrôle intermédiaire répond à un risque ou à un montant modéré."
      : "Le niveau de contrôle de base correspond à ce brouillon à risque contenu.";

  return { ...recommendations[level], rationale: `${driver} Ces repères n’appliquent aucune règle et le Safe reste requis pour toute exécution.` };
}

export function getAssistantContent(mandate, assessment) {
  if (!assessment) return null;

  const category = lookup(ASSET_CATEGORIES, mandate.assetCategory);
  const isDigital = ["defi", "nft"].includes(mandate.assetCategory);
  return {
    questions: [
      `Comment l’objectif « ${mandate.objective.trim()} » sera-t-il mesuré avant et après la décision ?`,
      `Quelle part de ${mandate.maxAllocation} % est acceptable si ${category.label.toLowerCase()} devient moins liquide ?`,
      `Qui documente l’hypothèse de sortie pour l’horizon ${lookup(LIQUIDITY_HORIZONS, mandate.liquidityHorizon).label.toLowerCase()} ?`,
    ],
    checklist: [
      "Vérifier que le montant et l’allocation sont cohérents avec la trésorerie disponible.",
      "Documenter les sources, hypothèses, frais et conflits d’intérêts éventuels.",
      "Faire examiner le dossier, puis soumettre une proposition selon la gouvernance active.",
      isDigital
        ? "Ajouter les contrôles techniques et de conservation propres à l’actif numérique."
        : "Comparer les conditions de liquidité et de sortie avec l’horizon annoncé.",
      "Prévoir une revue après décision sans confondre ce brouillon avec une instruction d’exécution.",
    ],
    scenarios: [
      `Scénario défavorable : que fait la DAO si ${category.label.toLowerCase()} perd de la valeur ou devient indisponible avant la sortie ?`,
      `Scénario de concentration : quelle conséquence si l’allocation maximale de ${mandate.maxAllocation} % est atteinte ?`,
      `Scénario de gouvernance : quel élément doit être clarifié pendant le délai avant validation par le Safe ?`,
    ],
  };
}

function normalizeBriefText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function conciseObjective(value, maxLength = 180) {
  const objective = normalizeBriefText(value);
  return objective.length > maxLength ? `${objective.slice(0, maxLength - 1).trimEnd()}…` : objective;
}

export function generateDecisionBrief(draft) {
  if (!isValidDraft(draft)) return null;

  const { mandate } = draft;
  const assessment = getRiskAssessment(mandate);
  const recommendation = getGovernanceRecommendation(mandate, assessment);
  const assistant = getAssistantContent(mandate, assessment);
  const category = lookup(ASSET_CATEGORIES, mandate.assetCategory);
  const horizon = lookup(LIQUIDITY_HORIZONS, mandate.liquidityHorizon);
  const tolerance = lookup(RISK_TOLERANCES, mandate.riskTolerance);
  const proposalSummary = `Catégorie : ${category.label}. Objectif : ${conciseObjective(mandate.objective)}. Risque : ${assessment.level} (${assessment.score}/100). Contrôles à discuter : quorum ${recommendation.quorum}, ${recommendation.approval.toLowerCase()}, délai ${recommendation.timelock}.`;

  return [
    "BRIEF DE DÉCISION — NEXUSDAO",
    "",
    "STATUT LOCAL ET NON CONTRAIGNANT",
    "Ce brief est généré localement à partir d’un brouillon enregistré dans ce navigateur. Il ne constitue ni un conseil financier, ni une proposition active, ni une instruction d’exécution. Il ne déclenche aucune transaction : toute décision reste soumise à l’examen humain, à la gouvernance active et au Safe.",
    "",
    "SYNTHÈSE POUR UNE PROPOSITION",
    `Résumé de proposition : ${proposalSummary}`,
    "",
    "MANDAT ENREGISTRÉ",
    `Objectif : ${normalizeBriefText(mandate.objective)}`,
    `Catégorie d’actifs : ${category.label}`,
    `Montant indicatif : ${formatAmount(mandate.amount)}`,
    `Allocation maximale : ${mandate.maxAllocation} %`,
    `Horizon de liquidité : ${horizon.label}`,
    `Tolérance au risque : ${tolerance.label}`,
    "",
    "ÉVALUATION DU RISQUE",
    `Score d’orientation : ${assessment.score}/100 (${assessment.level})`,
    ...assessment.factors.map((factor) => `- ${factor.label} : ${factor.value} — ${factor.detail}`),
    "",
    "RECOMMANDATION DE GOUVERNANCE À DISCUTER",
    `Quorum recommandé : ${recommendation.quorum}`,
    `Seuil d’approbation : ${recommendation.approval}`,
    `Délai indicatif : ${recommendation.timelock}`,
    `Seuil Safe indicatif : ${recommendation.safe}`,
    `Justification : ${recommendation.rationale}`,
    "",
    "CHECKLIST DE PRÉPARATION",
    ...assistant.checklist.map((item) => `- ${item}`),
  ].join("\n");
}

const proposalCategoryByAssetCategory = {
  nft: "0",
  defi: "1",
  cash: "3",
  bonds: "3",
  equities: "3",
};

export function getDecisionProposalPrefill(draft) {
  const brief = generateDecisionBrief(draft);
  if (!brief) return null;

  const summaryPrefix = "Résumé de proposition : ";
  const summary = brief
    .split("\n")
    .find((line) => line.startsWith(summaryPrefix))
    ?.slice(summaryPrefix.length);
  if (!summary) return null;

  return {
    description: `Brouillon Decision Studio — ${summary} Résumé local et non contraignant : à vérifier et compléter par la DAO avant toute soumission.`,
    category: proposalCategoryByAssetCategory[draft.mandate.assetCategory] || "4",
  };
}

export function formatAmount(amount) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(amount));
}

function isValidDraft(draft) {
  return Boolean(draft)
    && typeof draft === "object"
    && Boolean(draft.mandate)
    && isCompleteMandate(draft.mandate)
    && typeof draft.updatedAt === "string";
}

export function readDecisionDraft() {
  return readVersionedRecord({
    key: DECISION_DRAFT_KEY,
    version: DRAFT_VERSION,
    validate: isValidDraft,
    label: "brouillon de décision",
  });
}

export function saveDecisionDraft(mandate) {
  const draft = {
    version: DRAFT_VERSION,
    mandate: { ...mandate, objective: mandate.objective.trim() },
    updatedAt: new Date().toISOString(),
  };
  return saveVersionedRecord({ key: DECISION_DRAFT_KEY, record: draft, label: "brouillon de décision" });
}

export function removeDecisionDraft() {
  return removeLocalRecord({ key: DECISION_DRAFT_KEY, label: "brouillon de décision" });
}

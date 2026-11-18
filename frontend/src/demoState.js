export const DEMO_STORAGE_KEY = "nexusdao:interactive-demo:v1";
export const DEMO_MEMBERS = ["Alice", "Bruno", "Chloé"];
export const DEMO_CATEGORIES = ["DeFi", "NFT", "Venture", "Trésorerie"];
export const DEMO_DAY = 86400000;
const VOTING_POWER = { Alice: 400000, Bruno: 300000, Chloé: 300000 };

export function parseDemoAmount(value, allowZero = false) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) throw new Error("Indiquez un montant valide avec au maximum trois décimales.");
  const [whole, fraction = ""] = text.split(".");
  const units = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  if (!Number.isSafeInteger(units) || units < 0 || (!allowZero && units === 0)) {
    throw new Error("Indiquez un montant positif valide.");
  }
  return units;
}

export const formatDemoAmount = (units) => `${Number((units / 1000).toFixed(3))} ETH fictifs`;

export function createDemoState() {
  const clock = Date.now();
  return {
    version: 1,
    clock,
    treasury: 25000,
    delegations: { Alice: "Alice", Bruno: "Bruno", Chloé: "Chloé" },
    mandate: { version: 2, expiresAt: clock + 90 * DEMO_DAY, delayDays: 2, transactionCap: 4000, caps: { DeFi: 10000, NFT: 10000, Venture: 10000, Trésorerie: 10000 }, allocated: { DeFi: 3000, NFT: 0, Venture: 0, Trésorerie: 0 }, counterparties: ["Alpha", "Beta"] },
    proposals: [{
      id: 1, kind: "investment", description: "Investissement DeFi auprès de la contrepartie Alpha",
      category: "DeFi", counterparty: "Alpha", amount: 2000, snapshotVersion: 1,
      votingPower: { ...VOTING_POWER }, votes: { Alice: true, Bruno: true }, status: "approved", approvals: ["Alice"], deadline: clock - 2 * DEMO_DAY,
    }],
    holdings: [{ id: 0, category: "DeFi", description: "Position initiale fictive", counterparty: "Alpha", amount: 3000 }],
    reports: [],
    events: [{ id: 1, message: "Scénario initial : proposition #1 approuvée sous le mandat 1 ; mandat actif 2." }],
  };
}

export function readDemoState() {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!stored) return createDemoState();
  const parsed = JSON.parse(stored);
  if (
    parsed.version !== 1 || !Number.isSafeInteger(parsed.treasury) || !Number.isSafeInteger(parsed.clock) || !parsed.mandate || !parsed.delegations
    || !Array.isArray(parsed.proposals) || !Array.isArray(parsed.holdings)
    || !Array.isArray(parsed.reports) || !Array.isArray(parsed.events)
  ) throw new Error("Les données de simulation enregistrées sont invalides.");
  return parsed;
}

export function voteTotals(proposal) {
  return Object.entries(proposal.votes).reduce((totals, [member, support]) => {
    totals[support ? "for" : "against"] += proposal.votingPower[member] || 0;
    return totals;
  }, { for: 0, against: 0 });
}

const descriptionOf = (value) => {
  const text = String(value || "").trim();
  if (!text || text.length > 200) throw new Error("La description doit contenir entre 1 et 200 caractères.");
  return text;
};

const findProposal = (state, id) => {
  const proposal = state.proposals.find((item) => item.id === id);
  if (!proposal) throw new Error("Proposition introuvable.");
  return proposal;
};

const requireMember = (member) => {
  if (!DEMO_MEMBERS.includes(member)) throw new Error("Membre fictif invalide.");
};

const record = (state, message) => {
  state.events.unshift({ id: (state.events[0]?.id || 0) + 1, message });
};

export function applyDemoAction(current, action) {
  const state = structuredClone(current);
  if (action.type === "create") {
    const data = action.proposal;
    const description = descriptionOf(data.description);
    const base = {
      id: Math.max(0, ...state.proposals.map((proposal) => proposal.id)) + 1,
      description, snapshotVersion: state.mandate.version, votes: {}, approvals: [], status: "voting", deadline: state.clock + 3 * DEMO_DAY,
      votingPower: Object.fromEntries(DEMO_MEMBERS.map((member) => [member, DEMO_MEMBERS.reduce((total, owner) => total + (state.delegations[owner] === member ? VOTING_POWER[owner] : 0), 0)])),
    };
    if (data.kind === "investment") {
      if (!DEMO_CATEGORIES.includes(data.category)) throw new Error("Catégorie invalide.");
      const counterparty = descriptionOf(data.counterparty);
      Object.assign(base, { kind: data.kind, category: data.category, counterparty, amount: parseDemoAmount(data.amount) });
    } else if (data.kind === "mandate") {
      const counterparties = [...new Set(String(data.counterparties || "").split(",").map((item) => item.trim()).filter(Boolean))];
      if (!counterparties.length) throw new Error("Indiquez au moins une contrepartie fictive.");
      const expiryDays = Number(data.expiryDays);
      const delayDays = Number(data.delayDays);
      if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 3650 || !Number.isInteger(delayDays) || delayDays < 1 || delayDays > 365) {
        throw new Error("Indiquez une expiration de 1 à 3 650 jours et un délai de 1 à 365 jours.");
      }
      Object.assign(base, {
        kind: data.kind,
        newMandate: {
          transactionCap: parseDemoAmount(data.transactionCap),
          expiresAt: state.clock + expiryDays * DEMO_DAY,
          delayDays,
          caps: Object.fromEntries(DEMO_CATEGORIES.map((category) => [category, parseDemoAmount(data.caps[category], true)])),
          counterparties,
        },
      });
    } else if (data.kind === "report") {
      const content = String(data.content || "").trim();
      if (!content || content.length > 2000) throw new Error("Le rapport doit contenir entre 1 et 2 000 caractères.");
      Object.assign(base, { kind: data.kind, content });
    } else {
      throw new Error("Type de proposition invalide.");
    }
    state.proposals.unshift(base);
    record(state, `Proposition fictive #${base.id} créée sous le mandat ${base.snapshotVersion}.`);
  } else if (action.type === "vote") {
    const proposal = findProposal(state, action.id);
    requireMember(action.member);
    if (proposal.status !== "voting") throw new Error("Le vote est clôturé.");
    if (state.clock >= proposal.deadline) throw new Error("La période de vote fictive est terminée.");
    if (Object.hasOwn(proposal.votes, action.member)) throw new Error("Ce membre fictif a déjà voté.");
    if (!proposal.votingPower[action.member]) throw new Error("Ce membre n’avait aucun pouvoir de vote au snapshot.");
    if (typeof action.support !== "boolean") throw new Error("Vote invalide.");
    proposal.votes[action.member] = action.support;
    record(state, `${action.member} a voté ${action.support ? "pour" : "contre"} la proposition #${proposal.id}.`);
  } else if (action.type === "close") {
    const proposal = findProposal(state, action.id);
    if (proposal.status !== "voting") throw new Error("Le vote est déjà clôturé.");
    if (state.clock < proposal.deadline) throw new Error("Avancez le temps jusqu’à la fin du vote fictif.");
    const totals = voteTotals(proposal);
    const total = totals.for + totals.against;
    proposal.status = total >= 200000 && totals.for * 2 >= total ? "approved" : "rejected";
    record(state, `Vote de la proposition #${proposal.id} clôturé : ${proposal.status === "approved" ? "approuvé" : "rejeté"}.`);
  } else if (action.type === "approve") {
    const proposal = findProposal(state, action.id);
    requireMember(action.member);
    if (proposal.status !== "approved") throw new Error("La proposition doit être approuvée par le vote.");
    if (proposal.approvals.includes(action.member)) throw new Error("Ce signataire fictif a déjà approuvé.");
    proposal.approvals.push(action.member);
    record(state, `${action.member} a approuvé la proposition #${proposal.id} dans le Safe fictif.`);
  } else if (action.type === "execute") {
    const proposal = findProposal(state, action.id);
    if (proposal.status !== "approved" || proposal.approvals.length < 2) throw new Error("Deux approbations Safe fictives sont nécessaires.");
    const delayDays = proposal.kind === "investment" ? Math.max(1, state.mandate.delayDays) : 1;
    if (state.clock < proposal.deadline + delayDays * DEMO_DAY) throw new Error("Le délai de sécurité fictif n’est pas terminé.");
    if (proposal.kind === "investment") {
      const { mandate } = state;
      if (state.clock > mandate.expiresAt) throw new Error("Le mandat fictif a expiré.");
      if (!mandate.counterparties.includes(proposal.counterparty)) throw new Error("Contrepartie non autorisée par le mandat actif.");
      if (!mandate.caps[proposal.category]) throw new Error("Catégorie non autorisée par le mandat actif.");
      if (proposal.amount > mandate.transactionCap) throw new Error("Plafond par opération dépassé.");
      if (mandate.allocated[proposal.category] + proposal.amount > mandate.caps[proposal.category]) throw new Error("Plafond de catégorie dépassé.");
      if (proposal.amount > state.treasury) throw new Error("Trésorerie fictive insuffisante.");
      state.treasury -= proposal.amount;
      mandate.allocated[proposal.category] += proposal.amount;
      state.holdings.push({ id: proposal.id, category: proposal.category, description: proposal.description, counterparty: proposal.counterparty, amount: proposal.amount });
    } else if (proposal.kind === "mandate") {
      if (state.clock >= proposal.newMandate.expiresAt) throw new Error("La nouvelle version du mandat a déjà expiré.");
      state.mandate = { ...proposal.newMandate, version: state.mandate.version + 1, allocated: Object.fromEntries(DEMO_CATEGORIES.map((category) => [category, 0])) };
    } else if (proposal.kind === "report") {
      state.reports.unshift({ id: proposal.id, title: proposal.description, content: proposal.content });
    }
    proposal.executedMandateVersion = state.mandate.version;
    proposal.status = "executed";
    record(state, `Proposition #${proposal.id} exécutée dans la simulation · mandat actif ${state.mandate.version}.`);
  } else if (action.type === "delegate") {
    requireMember(action.member);
    requireMember(action.delegatee);
    state.delegations[action.member] = action.delegatee;
    record(state, `${action.member} a délégué ses voix fictives à ${action.delegatee}. Les snapshots existants sont inchangés.`);
  } else if (action.type === "advance") {
    const days = Number(action.days);
    if (!Number.isInteger(days) || days < 1 || days > 3650 || !Number.isSafeInteger(state.clock + days * DEMO_DAY)) throw new Error("Indiquez un nombre entier de jours entre 1 et 3 650.");
    state.clock += days * DEMO_DAY;
    record(state, `Horloge fictive avancée de ${days} jour(s).`);
  } else if (action.type === "deposit") {
    const amount = parseDemoAmount(action.amount);
    if (!Number.isSafeInteger(state.treasury + amount)) throw new Error("Montant trop élevé.");
    state.treasury += amount;
    record(state, `Ajout fictif de ${formatDemoAmount(amount)} à la trésorerie.`);
  } else {
    throw new Error("Action de simulation inconnue.");
  }
  return state;
}

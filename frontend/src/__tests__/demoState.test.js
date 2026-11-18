import { describe, expect, it } from "vitest";
import { applyDemoAction, createDemoState, parseDemoAmount } from "../demoState";

const apply = (state, type, fields = {}) => applyDemoAction(state, { type, ...fields });
const approveProposal = (state, id) => {
  state = apply(state, "vote", { id, member: "Alice", support: true });
  state = apply(state, "advance", { days: 3 });
  state = apply(state, "close", { id });
  state = apply(state, "approve", { id, member: "Alice" });
  state = apply(state, "approve", { id, member: "Bruno" });
  return apply(state, "advance", { days: 2 });
};

describe("gouvernance simulée", () => {
  it("crée, vote et exécute un investissement NFT avec deux signatures distinctes", () => {
    let state = createDemoState();
    state = apply(state, "create", { proposal: { kind: "investment", category: "NFT", description: "NFT exemple", counterparty: "Alpha", amount: "1.25" } });
    state = apply(state, "vote", { id: 2, member: "Alice", support: true });
    expect(() => apply(state, "vote", { id: 2, member: "Alice", support: false })).toThrow("déjà voté");
    expect(() => apply(state, "close", { id: 2 })).toThrow("Avancez le temps");
    state = apply(state, "advance", { days: 3 });
    state = apply(state, "close", { id: 2 });
    state = apply(state, "approve", { id: 2, member: "Alice" });
    expect(() => apply(state, "execute", { id: 2 })).toThrow("Deux approbations");
    expect(() => apply(state, "approve", { id: 2, member: "Alice" })).toThrow("déjà approuvé");
    state = apply(state, "approve", { id: 2, member: "Bruno" });
    expect(() => apply(state, "execute", { id: 2 })).toThrow("délai de sécurité");
    state = apply(state, "advance", { days: 2 });
    state = apply(state, "execute", { id: 2 });
    expect(state.treasury).toBe(23750);
    expect(state.mandate.allocated.NFT).toBe(1250);
    expect(state.holdings.at(-1)).toMatchObject({ description: "NFT exemple", amount: 1250 });
    expect(() => apply(state, "execute", { id: 2 })).toThrow();
  });

  it("réévalue une proposition approuvée après changement du mandat", () => {
    let state = createDemoState();
    state = apply(state, "create", { proposal: { kind: "mandate", description: "Mandat Beta", transactionCap: "4", expiryDays: "90", delayDays: "2", caps: { DeFi: "10", NFT: "10", Venture: "10", Trésorerie: "10" }, counterparties: "Beta" } });
    state = approveProposal(state, 2);
    state = apply(state, "execute", { id: 2 });
    expect(state.mandate).toMatchObject({ version: 3, allocated: { DeFi: 0, NFT: 0, Venture: 0, Trésorerie: 0 }, counterparties: ["Beta"] });
    state = apply(state, "approve", { id: 1, member: "Bruno" });
    expect(() => apply(state, "execute", { id: 1 })).toThrow("Contrepartie non autorisée");
    expect(state.treasury).toBe(25000);
  });

  it("permet une proposition ancienne si elle respecte le nouveau mandat", () => {
    let state = createDemoState();
    state = apply(state, "create", { proposal: { kind: "mandate", description: "Mandat Alpha", transactionCap: "3", expiryDays: "90", delayDays: "2", caps: { DeFi: "5", NFT: "0", Venture: "0", Trésorerie: "0" }, counterparties: "Alpha" } });
    state = approveProposal(state, 2);
    state = apply(state, "execute", { id: 2 });
    state = apply(state, "approve", { id: 1, member: "Bruno" });
    state = apply(state, "execute", { id: 1 });
    expect(state.treasury).toBe(23000);
    expect(state.mandate.allocated.DeFi).toBe(2000);
    expect(state.proposals.find((proposal) => proposal.id === 1)).toMatchObject({ status: "executed", snapshotVersion: 1, executedMandateVersion: 3 });
  });

  it("publie un rapport uniquement après vote et Safe", () => {
    let state = createDemoState();
    state = apply(state, "create", { proposal: { kind: "report", description: "Bilan", content: "Contenu fictif" } });
    expect(() => apply(state, "execute", { id: 2 })).toThrow();
    state = approveProposal(state, 2);
    state = apply(state, "execute", { id: 2 });
    expect(state.reports).toEqual([{ id: 2, title: "Bilan", content: "Contenu fictif" }]);
  });

  it("bloque une exécution après expiration du mandat fictif", () => {
    let state = createDemoState();
    state = apply(state, "approve", { id: 1, member: "Bruno" });
    state = apply(state, "advance", { days: 91 });
    expect(() => apply(state, "execute", { id: 1 })).toThrow("expiré");
  });

  it("fige le pouvoir de vote lors de la création malgré une délégation ultérieure", () => {
    let state = createDemoState();
    state = apply(state, "create", { proposal: { kind: "investment", category: "DeFi", description: "Test", counterparty: "Alpha", amount: "1" } });
    state = apply(state, "delegate", { member: "Alice", delegatee: "Bruno" });
    state = apply(state, "vote", { id: 2, member: "Alice", support: true });
    expect(state.proposals.find((proposal) => proposal.id === 2).votingPower.Alice).toBe(400000);
    state = apply(state, "create", { proposal: { kind: "investment", category: "DeFi", description: "Après délégation", counterparty: "Alpha", amount: "1" } });
    expect(() => apply(state, "vote", { id: 3, member: "Alice", support: true })).toThrow("aucun pouvoir");
    expect(state.proposals.find((proposal) => proposal.id === 3).votingPower.Bruno).toBe(700000);
  });

  it("rejette les montants invalides sans perte de précision", () => {
    expect(parseDemoAmount("0.001")).toBe(1);
    expect(() => parseDemoAmount("0.0001")).toThrow();
    expect(() => parseDemoAmount("0")).toThrow();
    expect(() => parseDemoAmount("99999999999999999")).toThrow();
  });
});

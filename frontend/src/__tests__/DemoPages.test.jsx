import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { applyDemoAction, createDemoState, DEMO_STORAGE_KEY } from "../demoState";

vi.mock("../config-addresses", async (importOriginal) => ({
  ...await importOriginal(),
  isDemoMode: true,
}));

const demoPath = (path) => `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

describe("démo simulée", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    delete window.ethereum;
    vi.restoreAllMocks();
  });

  it.each([
    ["/dashboard", "Trésorerie de la DAO fictive"],
    ["/mandates", "Mandat fictif actif · version 2"],
    ["/audit", "Cycle des propositions"],
  ])("affiche %s sans contacter le wallet", async (path, title) => {
    const request = vi.fn();
    window.ethereum = { request, on: vi.fn(), removeListener: vi.fn() };
    window.history.pushState({}, "", demoPath(path));

    render(<App />);

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(screen.getByText("Démo simulée")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /connecter le wallet/i })).not.toBeInTheDocument();
  });

  it("compare les versions du mandat dans le journal simulé", async () => {
    window.history.pushState({}, "", demoPath("/audit"));
    render(<App />);

    expect(await screen.findByText("Version 1")).toBeInTheDocument();
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("guide le visiteur dans le scénario de gouvernance", async () => {
    window.history.pushState({}, "", demoPath("/dashboard"));
    render(<App />);

    expect(await screen.findByText("Parcours guidé de la démo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "journal d’audit" })).toHaveAttribute("href", "/audit");
    expect(screen.getByRole("link", { name: "proposition #1" })).toHaveAttribute("href", "#demo-proposal-1");
    expect(screen.getByText("Créer une proposition d’investissement")).toBeInTheDocument();
    expect(screen.getByText("Obtenir les signatures Safe (0/2)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consulter ou avancer l’horloge" })).toHaveAttribute("href", "#demo-clock");
  });

  it("relie le parcours à la proposition créée et met à jour son avancement", async () => {
    const state = applyDemoAction(createDemoState(), {
      type: "create",
      proposal: { kind: "investment", category: "DeFi", description: "Prêt communautaire", counterparty: "Alpha", amount: "1" },
    });
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    window.history.pushState({}, "", demoPath("/dashboard"));
    render(<App />);

    expect(await screen.findByText("Voter sur la proposition")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Accéder aux signatures" })).toHaveAttribute("href", "#demo-proposal-2");
  });

  it("réinitialise le scénario guidé après confirmation", async () => {
    const changed = applyDemoAction(createDemoState(), { type: "deposit", amount: "5" });
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(changed));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    window.history.pushState({}, "", demoPath("/dashboard"));
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Réinitialiser et recommencer le parcours" }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)).treasury).toBe(25000);
    expect(await screen.findByText("25 ETH fictifs")).toBeInTheDocument();
  });

  it("conserve une proposition et son exécution après rechargement", async () => {
    window.history.pushState({}, "", demoPath("/defi"));
    render(<App />);
    fireEvent.change(await screen.findByLabelText("Description DeFi"), { target: { value: "Prêt fictif" } });
    fireEvent.change(screen.getByLabelText("Montant en ETH fictifs"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer la proposition fictive" }));
    expect(screen.getByText(/Proposition créée dans ce navigateur/)).toBeInTheDocument();

    cleanup();
    window.history.pushState({}, "", demoPath("/dashboard"));
    render(<App />);
    const heading = await screen.findByText("Proposition fictive #2 · Prêt fictif");
    const card = within(heading.closest(".card"));
    fireEvent.click(card.getByRole("button", { name: "Voter pour" }));
    fireEvent.click(screen.getByRole("button", { name: "Avancer le temps fictif" }));
    fireEvent.click(card.getByRole("button", { name: "Clôturer le vote" }));
    fireEvent.click(card.getByRole("button", { name: "Approuver dans le Safe fictif" }));
    fireEvent.change(card.getByLabelText("Membre / signataire fictif"), { target: { value: "Bruno" } });
    fireEvent.click(card.getByRole("button", { name: "Approuver dans le Safe fictif" }));
    fireEvent.change(screen.getByLabelText("Nombre de jours à avancer"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Avancer le temps fictif" }));
    fireEvent.click(card.getByRole("button", { name: "Exécuter fictivement" }));

    cleanup();
    render(<App />);
    expect(await screen.findByText("24 ETH fictifs")).toBeInTheDocument();
    expect(await screen.findByText(/Exécutée · Mandat au snapshot/)).toBeInTheDocument();
  });

  it("affiche les modifications proposées du mandat avant le vote", async () => {
    const state = applyDemoAction(createDemoState(), {
      type: "create",
      proposal: {
        kind: "mandate", description: "Nouveau mandat", expiryDays: "90", delayDays: "3",
        transactionCap: "2", caps: { DeFi: "5", NFT: "0", Venture: "0", Trésorerie: "0" },
        counterparties: "Beta",
      },
    });
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    window.history.pushState({}, "", demoPath("/dashboard"));
    render(<App />);
    const card = within((await screen.findByText("Proposition fictive #2 · Nouveau mandat")).closest(".card"));
    expect(card.getByText(/délai 3 jour/)).toBeInTheDocument();
    expect(card.getByText("Contreparties : Beta")).toBeInTheDocument();
    expect(card.getByText(/DeFi : 5 ETH fictifs/)).toBeInTheDocument();
  });
});

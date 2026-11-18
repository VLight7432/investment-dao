import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";

vi.mock("../config-addresses", async (importOriginal) => ({
  ...await importOriginal(),
  isDemoMode: true,
}));

const demoPath = (path) => `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

describe("démo simulée", () => {
  afterEach(() => {
    cleanup();
    delete window.ethereum;
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
});

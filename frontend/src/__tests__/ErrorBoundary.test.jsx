import React, { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ErrorBoundary from "../components/ErrorBoundary";

describe('ErrorBoundary', () => {
  it("affiche une action de reprise et restaure ses enfants", () => {
    const boundary = createRef();

    render(<ErrorBoundary ref={boundary}><div>Contenu de la page</div></ErrorBoundary>);
    act(() => {
      boundary.current.setState({ hasError: true, error: new Error("test") });
    });

    expect(screen.getByRole("alert")).toHaveTextContent("La page n’a pas pu être affichée.");
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(screen.getByText("Contenu de la page")).toBeInTheDocument();
  });

  it("rend ses enfants lorsqu’aucune erreur ne survient", () => {
    render(<ErrorBoundary><div>Test</div></ErrorBoundary>);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
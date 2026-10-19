import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

function applySavedTheme() {
  try {
    const preference = localStorage.getItem("theme");
    const isDark = preference === "dark"
      || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  } catch (error) {
    console.warn("Impossible d'appliquer le thème enregistré", error);
  }
}

applySavedTheme();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Le conteneur racine NexusDAO est introuvable.");
}

createRoot(rootElement, {
  onRecoverableError(error, errorInfo) {
    console.error("Erreur React récupérable", error, errorInfo);
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

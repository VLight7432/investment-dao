import React, { useEffect, useState } from "react";
import { applyDemoAction, createDemoState, DEMO_STORAGE_KEY, readDemoState } from "../demoState";
import { DemoContext } from "../demoContext";

export function DemoProvider({ children }) {
  const [initial] = useState(() => {
    try {
      return { data: readDemoState(), error: "" };
    } catch (error) {
      return { data: null, error: `Impossible de lire la simulation : ${error.message}` };
    }
  });
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== DEMO_STORAGE_KEY) return;
      try {
        setData(readDemoState());
        setError("");
      } catch (storageError) {
        setError(`Impossible de synchroniser la simulation : ${storageError.message}`);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const run = (action) => {
    try {
      const current = localStorage.getItem(DEMO_STORAGE_KEY) ? readDemoState() : data;
      const next = applyDemoAction(current, action);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
      setData(next);
      setError("");
      return true;
    } catch (actionError) {
      setError(`Action impossible : ${actionError.message}`);
      return false;
    }
  };

  const reset = () => {
    if (!window.confirm("Réinitialiser toutes les données fictives de ce navigateur ?")) return;
    try {
      const next = createDemoState();
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
      setData(next);
      setError("");
    } catch (resetError) {
      setError(`Réinitialisation impossible : ${resetError.message}`);
    }
  };

  if (!data) {
    return <main className="page-main"><div className="notice notice-error" role="alert">{error}</div><button className="button button-secondary" onClick={reset}>Réinitialiser la simulation</button></main>;
  }

  return <DemoContext.Provider value={{ data, error, run, reset }}>{children}</DemoContext.Provider>;
}


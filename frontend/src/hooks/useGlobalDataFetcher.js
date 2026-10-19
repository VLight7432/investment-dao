import { useState, useEffect } from "react";

/**
 * Hook global pour centraliser les fetchs, le cache local et la gestion avancée des erreurs/notifications.
 * Usage : const { data, loading, error, refetch } = useGlobalDataFetcher(fetchFn, deps, options)
 * fetchFn : fonction async qui retourne les données
 * deps : dépendances pour relancer le fetch
 * options : { cacheKey, onError }
 */
export function useGlobalDataFetcher(fetchFn, deps = [], options = {}) {
  const { cacheKey, onError } = options;
  const key = cacheKey || (fetchFn.name + JSON.stringify(deps));
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn("Impossible de lire le cache local", err);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      try {
        localStorage.setItem(key, JSON.stringify(result));
      } catch (err) {
        console.warn("Impossible d'écrire le cache local", err);
      }
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
}

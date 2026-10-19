import { useMemo } from "react";

export function useDeFiInvestments() {
  return useMemo(() => ({
    investments: [],
    loading: false,
    error: "Les investissements DeFi sont consultés via les propositions de gouvernance, pas directement depuis le wallet.",
  }), []);
}

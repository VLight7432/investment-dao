const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value ?? "");
const useLocalDefaults = import.meta.env.DEV || import.meta.env.VITE_USE_LOCAL_DEFAULTS === "true";
const addressFromEnv = (name, fallback = "") => {
  const value = import.meta.env[name] || fallback;
  return isAddress(value) ? value : "";
};

const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || 31337);
const configuredSafeServiceUrl = import.meta.env.VITE_SAFE_TX_SERVICE_URL || "";
const safeServiceConfiguration = (() => {
  if (!configuredSafeServiceUrl) return { url: "", error: "" };
  try {
    const url = new URL(configuredSafeServiceUrl);
    return url.protocol === "https:"
      ? { url: configuredSafeServiceUrl.replace(/\/+$/, ""), error: "" }
      : { url: "", error: "VITE_SAFE_TX_SERVICE_URL doit utiliser HTTPS." };
  } catch {
    return { url: "", error: "VITE_SAFE_TX_SERVICE_URL n’est pas une URL valide." };
  }
})();

export const ADDRESSES = {
  CHAIN_ID: Number.isSafeInteger(configuredChainId) && configuredChainId > 0 ? configuredChainId : 31337,
  DAO: addressFromEnv("VITE_DAO_ADDRESS", useLocalDefaults ? "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853" : ""),
  TOKEN: addressFromEnv("VITE_TOKEN_ADDRESS", useLocalDefaults ? "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" : ""),
  SAFE: addressFromEnv("VITE_SAFE_ADDRESS", useLocalDefaults ? "0x0165878A594ca255338adfa4d48449f69242Eb8F" : ""),
  DEFI_INTEGRATION: addressFromEnv("VITE_DEFI_INTEGRATION_ADDRESS"),
  QUARTERLY_REPORT: addressFromEnv("VITE_QUARTERLY_REPORT_ADDRESS", useLocalDefaults ? "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318" : ""),
};

export const isConfiguredAddress = isAddress;
export const SAFE_TRANSACTION_SERVICE = safeServiceConfiguration;

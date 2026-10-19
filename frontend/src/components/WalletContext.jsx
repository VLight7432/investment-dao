import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { ADDRESSES } from "../config-addresses";

const disconnectedWallet = {
  account: "",
  provider: null,
  network: "",
  chainId: null,
  connectWallet: async () => {},
  loading: false,
  notification: "",
  setNotification: () => {},
  walletAvailable: false,
  isSupportedNetwork: false,
};

export const WalletContext = createContext(disconnectedWallet);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [provider] = useState(() => (
    typeof window !== "undefined" && window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null
  ));
  const [network, setNetwork] = useState("");
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");

  const refreshNetwork = useCallback(async () => {
    if (!provider) return;
    try {
      const net = await provider.getNetwork();
      setNetwork(net.name === "unknown" ? `Réseau ${net.chainId}` : net.name);
      setChainId(Number(net.chainId));
    } catch {
      setNotification("Impossible de lire le réseau du wallet");
    }
  }, [provider]);

  useEffect(() => {
    if (!provider) return undefined;

    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || "");
    const handleChainChanged = () => void refreshNetwork();
    window.ethereum.request({ method: "eth_accounts" })
      .then((accounts) => setAccount(accounts[0] || ""))
      .catch(() => setAccount(""));
    void refreshNetwork();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, refreshNetwork]);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      setLoading(true);
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0] || "");
        await refreshNetwork();
        setNotification("Wallet connecté.");
      } catch {
        setNotification("Connexion à MetaMask refusée");
      } finally {
        setLoading(false);
      }
    } else {
      setNotification("MetaMask n'est pas installé");
    }
  }, [refreshNetwork]);

  const value = useMemo(() => ({
    account,
    provider,
    network,
    chainId,
    connectWallet,
    loading,
    notification,
    setNotification,
    walletAvailable: Boolean(provider),
    isSupportedNetwork: chainId === ADDRESSES.CHAIN_ID,
  }), [account, provider, network, chainId, connectWallet, loading, notification]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;

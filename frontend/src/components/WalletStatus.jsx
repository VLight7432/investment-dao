import React, { useContext } from "react";
import { WalletContext } from "./WalletContext";
import { ADDRESSES } from "../config-addresses";

const shortAddress = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export default function WalletStatus() {
  const {
    account, network, connectWallet, loading, walletAvailable, isSupportedNetwork,
  } = useContext(WalletContext);

  return (
    <div className="wallet-status" aria-live="polite">
      {account ? (
        <span title={account} className="wallet-account">{shortAddress(account)}</span>
      ) : (
        <button className="button button-primary" onClick={connectWallet} disabled={loading || !walletAvailable}>
          {loading ? "Connexion…" : walletAvailable ? "Connecter le wallet" : "Wallet indisponible"}
        </button>
      )}
      {account && (
        <span className={isSupportedNetwork ? "network-badge network-ok" : "network-badge network-warning"}>
          {isSupportedNetwork ? network || "Réseau vérifié" : `Réseau requis : ${ADDRESSES.CHAIN_ID}`}
        </span>
      )}
    </div>
  );
}

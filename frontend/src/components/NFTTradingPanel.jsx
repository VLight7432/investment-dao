import React from "react";
import { Link } from "react-router-dom";

export default function NFTTradingPanel() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Créer une proposition d’investissement</h2>
        <p className="card-description">Ajoutez la collection, le token, le budget maximum, les critères de vérification et les données d’exécution à la proposition.</p>
      </div>
      <div className="form-actions">
        <Link className="button button-primary" to="/dashboard">Ouvrir la gouvernance</Link>
      </div>
    </div>
  );
}

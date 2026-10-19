import React from "react";

const Loader = ({ label = "Chargement…" }) => (
  <div className="loader" role="status" aria-live="polite">
    <div className="loader-content">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  </div>
);

export default Loader;

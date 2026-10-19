import React from "react";

const FiltersPanel = ({ filters, setFilters, extraFields = [] }) => (
  <fieldset className="form-grid card">
    <legend className="section-heading">Filtrer les résultats</legend>
    <div className="field">
      <label htmlFor="filter-category">Catégorie</label>
      <select id="filter-category" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
      <option value="">Toutes catégories</option>
      <option value="NFT">NFT</option>
      <option value="DeFi">DeFi</option>
      <option value="Rapport">Rapport</option>
      </select>
    </div>
    <div className="field">
      <label htmlFor="filter-status">Statut</label>
      <select id="filter-status" value={filters.status ?? ""} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
      <option value="">Tous statuts</option>
      <option value="active">Actif</option>
      <option value="sold">Vendu</option>
      </select>
    </div>
    <div className="field">
      <label htmlFor="filter-search">Recherche</label>
      <input id="filter-search" type="search" placeholder="Rechercher…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
    </div>
    {extraFields}
  </fieldset>
);

export default FiltersPanel;

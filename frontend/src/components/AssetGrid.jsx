import React, { useState } from "react";
import AssetCard from "./AssetCard";
import AssetDetailsModal from "./AssetDetailsModal";

const AssetGrid = React.memo(({ assets }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  // Sécurise le mapping : filtre les assets incomplets
  const assetItems = React.useMemo(() => (Array.isArray(assets)
    ? assets.filter(asset => asset && asset.id && asset.title)
    : []).map(asset => (
    <button
      key={asset.id}
      type="button"
      onClick={() => setSelectedAsset(asset)}
      aria-label={`Voir les détails de ${asset.title}`}
      className="asset-grid-item"
    >
      <AssetCard asset={asset} />
    </button>
  )), [assets]);

  return (
    <>
      {assetItems.length ? <div className="asset-grid">{assetItems}</div> : <div className="empty-state">Aucun élément ne correspond aux filtres sélectionnés.</div>}
      <AssetDetailsModal open={!!selectedAsset} asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </>
  );
});

export default AssetGrid;

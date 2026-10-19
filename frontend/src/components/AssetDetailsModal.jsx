import React from "react";

const AssetDetailsModal = ({ open, asset, onClose }) => {
  if (!open || !asset) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" role="presentation" onMouseDown={onClose}>
      <div className="bg-white rounded shadow-lg p-6 min-w-[350px] relative" role="dialog" aria-modal="true" aria-label={`Détails de ${asset.title}`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" type="button" onClick={onClose} aria-label="Fermer les détails">✕</button>
        <img src={asset.image} alt={asset.title} className="h-40 w-full object-cover rounded mb-4" />
        <div className="font-bold text-xl mb-2">{asset.title}</div>
        <div className="text-sm text-gray-500 mb-2">Catégorie : {asset.category}</div>
        {asset.address && <div className="mb-2">Adresse : <span className="font-mono text-xs">{asset.address}</span></div>}
        <div className="mb-2">Prix : <span className="font-mono text-indigo-600">{asset.price === "-" || asset.price == null ? "Non renseigné" : `${asset.price} ETH`}</span></div>
        <div className="mb-2">Description : {asset.description || "-"}</div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded mt-4" type="button" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
};

export default AssetDetailsModal;

import React from "react";

const AssetCard = ({ asset }) => (
  <div className="bg-white rounded shadow p-4 flex flex-col gap-2 hover:shadow-lg transition">
    {asset.image && <img src={asset.image} alt="" className="h-40 w-full object-cover rounded" />}
    <div className="font-bold text-lg truncate">{asset.title}
      <span className="ml-2 cursor-pointer group relative">
        <span className="text-gray-400">&#9432;</span>
        <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          Voir les détails
        </span>
      </span>
    </div>
    <div className="text-sm text-gray-500">{asset.category}
      <span className="ml-2 cursor-pointer group relative">
        <span className="text-gray-400">&#9432;</span>
        <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          Catégorie de l'asset
        </span>
      </span>
    </div>
    <div className="flex justify-between items-center mt-2">
      <span className="font-mono text-indigo-600">{asset.price === "-" || asset.price == null ? "Prix non renseigné" : `${asset.price} ETH`}
        <span className="ml-2 cursor-pointer group relative">
          <span className="text-gray-400">&#9432;</span>
          <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
            Prix estimé ou dernier prix
          </span>
        </span>
      </span>
      <span className="asset-card-action">Détails</span>
    </div>
  </div>
);

export default AssetCard;

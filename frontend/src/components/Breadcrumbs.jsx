import React from "react";
import { useLocation, Link } from "react-router-dom";

const routeNames = {
  "/": "Toutes les fonctionnalités",
  "/dashboard": "Dashboard",
  "/nft": "NFT Marketplace",
  "/defi": "Actions DeFi",
  "/reports": "Rapports Trimestriels",
  "/settings": "Paramètres"
};

const Breadcrumbs = () => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);
  const crumbs = ["/", ...paths.map((_, i) => `/${paths.slice(0, i + 1).join("/")}`)];

  return (
    <nav aria-label="Fil d'Ariane" className="mb-6">
      <ol className="flex gap-2 text-sm text-gray-500">
        {crumbs.map((path, idx) => (
          <li key={path} className="flex items-center gap-1">
            {idx > 0 && <span>/</span>}
            {idx === crumbs.length - 1 ? (
              <span className="font-semibold text-indigo-700">{routeNames[path] || path}</span>
            ) : (
              <Link to={path} className="hover:underline">{routeNames[path] || path}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

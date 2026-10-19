import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { href: "/", label: "Accueil", icon: "⌂" },
  { href: "/onboarding", label: "Bien démarrer", icon: "◌" },
  { href: "/decision-studio", label: "Decision Studio", icon: "◎" },
  { href: "/governance-guide", label: "Modele DAO", icon: "◇" },
  { href: "/dashboard", label: "Gouvernance", icon: "◫" },
  { href: "/mandates", label: "Mandats", icon: "▧" },
  { href: "/audit", label: "Journal d’audit", icon: "▤" },
  { href: "/nft", label: "NFT", icon: "◇" },
  { href: "/defi", label: "DeFi", icon: "◌" },
  { href: "/reports", label: "Rapports", icon: "▤" },
  { href: "/settings", label: "Paramètres", icon: "⚙" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <button
        className={`nav-backdrop ${open ? "is-visible" : ""}`}
        aria-label="Fermer la navigation"
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Navigation principale">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NexusDAO</span>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Fermer la navigation">×</button>
        </div>
        <p className="sidebar-label">Espace membre</p>
        <nav>
          <ul className="nav-list">
            {links.map((link) => (
              <li key={link.href}>
                <NavLink
                  end={link.href === "/"}
                  to={link.href}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="sidebar-footer">Les opérations d'investissement passent par une proposition approuvée et le Safe.</p>
      </aside>
    </>
  );
}

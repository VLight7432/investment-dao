import React from "react";

const ProfileMenu = ({ user }) => (
  <div className="flex flex-col gap-2 p-4 bg-white rounded shadow w-56">
    <div className="flex items-center gap-2">
      <img src={user?.avatar || "/assets/profile.png"} alt="Profil" className="h-10 w-10 rounded-full" />
      <div>
        <div className="font-bold">{user?.name || "Utilisateur"}</div>
        <div className="text-xs text-gray-500">{user?.address}</div>
      </div>
    </div>
    <hr className="my-2" />
    <button className="text-left px-2 py-1 hover:bg-gray-100 rounded">Mon portefeuille</button>
    <button className="text-left px-2 py-1 hover:bg-gray-100 rounded">Paramètres</button>
    <button className="text-left px-2 py-1 hover:bg-gray-100 rounded">Déconnexion</button>
  </div>
);

export default ProfileMenu;

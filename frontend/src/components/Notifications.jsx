import React, { useContext } from "react";
import { NotificationsContext } from "./NotificationsContext";

const Notifications = ({ notifications: propNotifications }) => {
  const { notifications: contextNotifications, dismissNotification } = useContext(NotificationsContext) || {};
  const notifications = propNotifications || contextNotifications || [];

  if (!Array.isArray(notifications) || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n, i) => (
        <div
          key={n.id ?? i}
          className={`px-4 py-2 rounded shadow transition-all duration-300 animate-fade-in
            ${n.type === "error"
              ? "bg-red-100 text-red-700 border border-red-300"
              : n.type === "info"
                ? "bg-cyan-100 text-cyan-700 border border-cyan-300"
                : "bg-indigo-100 text-indigo-700 border border-indigo-300"}
          `}
          style={{ minWidth: 220, position: "relative" }}
        >
          {n.message}
          <button
            className="absolute top-1 right-2 text-gray-400 hover:text-indigo-700 text-lg"
            aria-label="Fermer la notification"
            onClick={() => {
              dismissNotification?.(n.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;

// Ajoute dans index.css :
// .animate-fade-in { animation: fadeIn 0.4s; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

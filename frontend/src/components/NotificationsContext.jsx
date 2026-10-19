import React, { createContext, useState, useCallback } from "react";

const emptyNotificationsContext = {
  notifications: [],
  addNotification: () => {},
  dismissNotification: () => {},
};

export const NotificationsContext = createContext(emptyNotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "success") => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setNotifications(n => [...n, { id, message, type }]);
    setTimeout(() => {
      setNotifications(n => n.filter((notification) => notification.id !== id));
    }, 4000);
  }, []);
  const dismissNotification = useCallback((id) => {
    setNotifications((items) => items.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, dismissNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;

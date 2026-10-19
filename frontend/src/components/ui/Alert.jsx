// Alert.jsx
import React from "react";

const Alert = ({ children, className = "", type = "info", ...props }) => (
  <div className={`notice notice-${type} ${className}`} role="alert" {...props}>
    {children}
  </div>
);

const AlertDescription = ({ children, className = "", ...props }) => (
  <div className={`alert-description ${className}`} {...props}>
    {children}
  </div>
);

export { Alert, AlertDescription };

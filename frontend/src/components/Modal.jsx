import React from "react";

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" role="presentation" onMouseDown={onClose}>
      <div className="bg-white rounded shadow-lg p-6 min-w-[300px] relative" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" type="button" onClick={onClose} aria-label="Fermer">✕</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;

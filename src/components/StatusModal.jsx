import React from "react";
import "./StatusModal.css";

export default function StatusModal({
  open,
  title,
  message,
  type = "info", // success | error | warning | info
  buttonText = "OK",
  onClose,
}) {
  if (!open) return null;

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i",
  };

  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div
        className="status-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`status-modal-icon ${type}`}>
          {iconMap[type] || "i"}
        </div>

        <h2 className="status-modal-title">{title}</h2>
        <p className="status-modal-message">{message}</p>

        <button className={`status-modal-button ${type}`} onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}
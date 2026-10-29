import React from 'react';

/**
 * Tizimdan chiqishni tasdiqlash modali
 */
export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      className="add-station-overlay"
      onClick={onClose}
    >
      <div
        className="reopen-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            marginBottom: "10px",
          }}
        >
          Tizimdan chiqish
        </h3>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            marginBottom: "20px",
          }}
        >
          Rostdan ham tizimdan (dasturdan) chiqmoqchimisiz?
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="add-st-submit-btn"
            style={{
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              boxShadow: "none",
            }}
            onClick={onClose}
          >
            Yo'q
          </button>
          <button
            className="add-st-submit-btn"
            style={{
              background: "#ef4444",
              color: "white",
              boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
            }}
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            Ha, chiqish
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Phone } from 'lucide-react';

/**
 * Telefon raqamini o'zgartirish modali
 */
export default function PhoneEditModal({
  isOpen,
  onClose,
  phone,
  onChangePhone,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="profile-overlay"
      onClick={onClose}
    >
      <div
        className="station-bell-modal-card phone-confirm-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="station-bell-icon-halo"
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            borderColor: "rgba(16, 185, 129, 0.3)",
            color: "#10b981",
          }}
        >
          <Phone size={28} />
        </div>
        <h3 className="station-bell-modal-title">Telefon raqamni o'zgartirish</h3>
        <p className="station-bell-modal-text">
          Rostdan ham telefon raqamni o'zgartirmoqchimisiz?
        </p>
        <div className="phone-modal-input-wrap">
          <label className="phone-modal-input-label">Yangi telefon raqam:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => onChangePhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="phone-modal-input-box"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onConfirm();
              }
            }}
          />
        </div>
        <div className="phone-confirm-btns-row">
          <button
            type="button"
            className="phone-confirm-cancel-btn"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button
            type="button"
            className="phone-confirm-agree-btn"
            onClick={onConfirm}
          >
            Ha, o'zgartirish
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Bell } from 'lucide-react';

/**
 * Shahobcha eslatmalar modali
 */
export default function StationBellModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="profile-overlay"
      onClick={onClose}
    >
      <div
        className="station-bell-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="station-bell-icon-halo">
          <Bell size={30} color="#f59e0b" />
        </div>
        <h3 className="station-bell-modal-title">Eslatmalar</h3>
        <p className="station-bell-modal-text">
          Hozircha eslatma yo'q
        </p>
        <button
          type="button"
          className="station-bell-modal-btn"
          onClick={onClose}
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}

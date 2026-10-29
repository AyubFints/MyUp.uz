import React from 'react';
import { X, Menu } from 'lucide-react';

/**
 * Xizmatlar tez kunda ishga tushishi haqidagi bildirishnoma modali
 */
export default function ServicesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="services-modal-overlay" 
      onClick={onClose}
    >
      <div 
        className="services-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button" 
          className="services-modal-close-btn" 
          onClick={onClose}
          aria-label="Yopish"
        >
          <X size={18} />
        </button>

        <div className="services-modal-icon-bubble">
          <Menu size={28} />
        </div>

        <h3 className="services-modal-title">
          Xizmatlar hozircha tayyor emas
        </h3>

        <p className="services-modal-desc">
          Ushbu bo'lim tez orada yangi va qulay servislar (avtomoyka, ustaxona, evakuator va boshqalar) bilan ishga tushiriladi.
        </p>

        <div className="services-modal-actions">
          <button 
            type="button" 
            className="services-modal-ok-btn" 
            onClick={onClose}
          >
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
}

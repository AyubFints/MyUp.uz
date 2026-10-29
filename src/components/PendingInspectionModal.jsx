import React from 'react';
import { Clock } from 'lucide-react';

/**
 * Tasdiqlanmagan joylashuv haqida ma'lumot beruvchi modal
 */
export default function PendingInspectionModal({ station, isOpen, onClose }) {
  if (!isOpen || !station) return null;

  return (
    <div 
      className="profile-overlay" 
      style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}
      onClick={onClose}
    >
      <div 
        className="station-bell-modal-card" 
        style={{
          maxWidth: '430px',
          width: '100%',
          textAlign: 'center',
          padding: '2.25rem 1.75rem',
          background: '#0f172a',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(245, 158, 11, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#f59e0b',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
          }}
        >
          <Clock size={36} />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 700,
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#f59e0b',
          marginBottom: '0.85rem'
        }}>
          <span>Hozirda kutilmoqda</span>
        </div>

        <h3 style={{ fontSize: '1.28rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
          Hozirda ko'rib chiqilmoqda
        </h3>

        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          Siz kiritgan <strong>"{station.name}"</strong> manzili hozirda Dastur Administratsiyasi tomonidan ko'rib chiqilmoqda. Administratsiya tasdiqlaganidan keyin, manzil ichiga kirib uni to'liq boshqarishingiz (narxlarni o'zgartirish, ochiq/yopiq holati va boshqa onlayn ma'lumotlar) mumkin bo'ladi.
        </p>

        <button
          type="button"
          className="station-bell-modal-btn"
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#0f172a',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)'
          }}
          onClick={onClose}
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}

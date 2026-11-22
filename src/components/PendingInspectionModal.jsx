import React from 'react';
import { Clock, XCircle } from 'lucide-react';

/**
 * Tasdiqlanmagan yoki rad etilgan joylashuv haqida ma'lumot beruvchi modal
 */
export default function PendingInspectionModal({ station, isOpen, onClose }) {
  if (!isOpen || !station) return null;

  const isRejected = station.status === 'rejected' || station.isRejected === true;

  let timeLeftText = "24 soat ichida";
  if (isRejected && (station.rejectedAt || station.rejected_at)) {
    const rejTime = station.rejectedAt || station.rejected_at;
    const msLeft = (new Date(rejTime).getTime() + 24 * 3600 * 1000) - Date.now();
    const hoursLeft = Math.max(1, Math.ceil(msLeft / (3600 * 1000)));
    timeLeftText = `${hoursLeft} soatdan so'ng`;
  }

  const accentColor = isRejected ? '#ef4444' : '#f59e0b';
  const accentBorder = isRejected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
  const accentBg = isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  const btnGradient = isRejected 
    ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

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
          border: `1px solid ${accentBorder}`,
          borderRadius: '24px',
          boxShadow: `0 25px 60px rgba(0,0,0,0.85), 0 0 35px ${accentBg}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: accentBg,
            border: `2px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: accentColor,
            boxShadow: `0 0 25px ${accentBg}`
          }}
        >
          {isRejected ? <XCircle size={36} /> : <Clock size={36} />}
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 700,
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          color: accentColor,
          marginBottom: '0.85rem'
        }}>
          <span>{isRejected ? 'Rad etildi' : 'Hozirda kutilmoqda'}</span>
        </div>

        <h3 style={{ fontSize: '1.28rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
          {isRejected ? 'Joylashuv rad etildi' : "Hozirda ko'rib chiqilmoqda"}
        </h3>

        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {isRejected ? (
            <>
              Siz kiritgan <strong>"{station.name}"</strong> manzili Dastur Administratsiyasi (Super Admin) tomonidan rad etildi. Ushbu manzil 24 soat davomida profilingizda qoladi va <strong>{timeLeftText}</strong> avtomatik ravishda butunlay o'chiriladi.
            </>
          ) : (
            <>
              Siz kiritgan <strong>"{station.name}"</strong> manzili hozirda Dastur Administratsiyasi tomonidan ko'rib chiqilmoqda. Administratsiya tasdiqlaganidan keyin, manzil ichiga kirib uni to'liq boshqarishingiz (narxlarni o'zgartirish, ochiq/yopiq holati va boshqa onlayn ma'lumotlar) mumkin bo'ladi.
            </>
          )}
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
            background: btnGradient,
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 4px 18px ${accentBg}`
          }}
          onClick={onClose}
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}

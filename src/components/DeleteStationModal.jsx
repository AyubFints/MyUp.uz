import React from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';

/**
 * Shahobcha/manzilni o'chirishni tasdiqlovchi modal
 */
export default function DeleteStationModal({
  station,
  isOpen,
  onClose,
  onConfirm,
  deleteReason,
  setDeleteReason,
  deleteReasonError,
  setDeleteReasonError,
  isDeleting,
  isThemeLight,
  appTheme,
}) {
  if (!isOpen || !station) return null;

  return (
    <div 
      className={`delete-confirm-overlay ${isThemeLight ? "is-light" : ""}`}
      style={{
        '--theme-bg': appTheme?.bg || '#0e0e10',
        '--theme-panel': appTheme?.panel || '#161618',
        '--theme-card': appTheme?.card || '#1c1c1e',
        '--theme-border': appTheme?.border || 'rgba(255, 255, 255, 0.12)',
        '--theme-text': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
        '--theme-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
      }}
      onClick={() => {
        if (!isDeleting) {
          onClose();
        }
      }}
    >
      <div 
        className="delete-confirm-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: appTheme?.bg || '#0e0e10',
          color: appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
          borderColor: appTheme?.border || 'rgba(239, 68, 68, 0.35)',
        }}
      >
        <button 
          type="button" 
          className="delete-confirm-close-btn" 
          onClick={() => {
            if (!isDeleting) {
              onClose();
            }
          }}
          aria-label="Yopish"
          disabled={isDeleting}
        >
          <X size={18} />
        </button>

        <div className="delete-confirm-icon-bubble">
          <Trash2 size={28} />
        </div>

        <h3 className="delete-confirm-title">
          Joylashuvni o'chirish
        </h3>

        <p className="delete-confirm-desc">
          <strong>"{station.name}"</strong> manzili A-Maps tizimidan butunlay o'chiriladi.
        </p>

        {/* O'chirish sababi kiritish maydoni */}
        <div className="delete-reason-input-group" style={{ width: '100%', marginTop: '14px', textAlign: 'left' }}>
          <label 
            style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--text-muted, #94a3b8)',
              marginBottom: '6px'
            }}
          >
            Nima sababdan o'chirmoqchisiz? <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => {
              setDeleteReason(e.target.value);
              if (deleteReasonError) setDeleteReasonError("");
            }}
            placeholder="Masalan: Faoliyatimiz to'xtatildi yoki boshqa manzilga ko'chdik..."
            rows={3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: deleteReasonError ? '1.5px solid #ef4444' : '1.5px solid var(--border-color, rgba(255, 255, 255, 0.14))',
              color: 'var(--text-main, #ffffff)',
              fontSize: '0.9rem',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          {deleteReasonError && (
            <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={14} />
              <span>{deleteReasonError}</span>
            </div>
          )}
        </div>

        <div className="delete-confirm-actions" style={{ marginTop: '18px' }}>
          <button 
            type="button" 
            className="delete-btn-cancel" 
            style={{
              backgroundColor: isThemeLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              borderColor: appTheme?.border || (isThemeLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'),
              color: appTheme?.text || (isThemeLight ? '#334155' : '#ffffff'),
            }}
            onClick={onClose}
            disabled={isDeleting}
          >
            Bekor qilish
          </button>

          <button 
            type="button" 
            className="delete-btn-confirm" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

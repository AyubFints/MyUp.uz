import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Phone, Calendar, User, FileText, LogOut, Edit3, ImagePlus, MapPin } from 'lucide-react';
import { api } from '../api/client';

export default function ProfileDetailModal({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
  isLight = false,
  appTheme,
}) {
  const [bio, setBio] = useState(user?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.bio) setBio(user.bio);
  }, [user?.bio]);

  if (!isOpen || !user) return null;

  const hasRealPhoto = user.avatar && !user.avatar.includes('dicebear');
  const isLocationActive = Boolean(user?.hasLocation || user?.has_location);

  const panelBg = isLight ? '#ffffff' : (appTheme?.panel || '#18181b');
  const cardBg = isLight ? '#f1f5f9' : (appTheme?.card || '#222226');
  const borderColor = isLight ? '#e2e8f0' : (appTheme?.border || 'rgba(255, 255, 255, 0.1)');
  const textPrimary = isLight ? '#0f172a' : (appTheme?.text || '#ffffff');
  const textMuted = isLight ? '#64748b' : (appTheme?.textMuted || '#94a3b8');

  const handleToggleLocation = async () => {
    const nextState = !isLocationActive;
    const updated = {
      ...user,
      hasLocation: nextState,
      has_location: nextState,
      canAddStation: nextState,
      can_add_station: nextState,
    };
    localStorage.setItem('myup_user', JSON.stringify(updated));
    if (typeof onUpdateUser === 'function') {
      onUpdateUser(updated);
    }

    try {
      await api.auth.updateProfile({
        hasLocation: nextState,
        canAddStation: nextState,
        userId: user?.id,
        phone: user?.phoneNumber || user?.phone,
      });
    } catch (err) {
      console.warn("Location toggle sync error:", err.message);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rasmni yumaloq formatga avtomatik crop qilish (400x400)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Rasmni markazdan qirqib olish (square crop)
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const newUser = { ...user, avatar: croppedDataUrl, avatarUrl: croppedDataUrl };
        localStorage.setItem('myup_user', JSON.stringify(newUser));
        onUpdateUser(newUser);

        // Multi-device sync: PostgreSQL bazasiga saqlaymiz (boshqa barcha telefonlarda ham ko'rinadi)
        api.auth.updateProfile({
          avatarUrl: croppedDataUrl,
          userId: user?.id,
          phone: user?.phoneNumber || user?.phone,
        })
          .then((res) => {
            if (res.success && res.user) {
              const syncedUser = {
                ...newUser,
                avatar: res.user.avatarUrl || res.user.avatar || croppedDataUrl,
              };
              localStorage.setItem('myup_user', JSON.stringify(syncedUser));
              onUpdateUser(syncedUser);
            }
          })
          .catch((err) => {
            console.warn("Avatar sync error:", err.message);
          });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBio = async () => {
    const newUser = { ...user, bio };
    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onUpdateUser(newUser);
    setEditingBio(false);

    try {
      await api.auth.updateProfile({
        bio,
        userId: user?.id,
        phone: user?.phoneNumber || user?.phone,
      });
    } catch (err) {
      console.warn("Bio sync error:", err.message);
    }
  };

  return (
    <div className={`profile-detail-overlay ${isLight ? 'is-light' : ''}`} onClick={onClose}>
      <div 
        className={`profile-detail-sheet ${isLight ? 'is-light' : ''}`} 
        onClick={e => e.stopPropagation()}
        style={{
          background: panelBg,
          borderColor: borderColor,
          color: textPrimary,
        }}
      >
        {/* Close button */}
        <button 
          className="profile-detail-close" 
          onClick={onClose}
          style={{
            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
            borderColor: borderColor,
            color: textMuted,
          }}
        >
          <X size={20} />
        </button>

        {/* Profile photo area */}
        <div className="profile-detail-photo-section">
          <div className="profile-detail-avatar-row">
            {/* Katta yumaloq rasm */}
            <div
              className="profile-detail-avatar-large"
              onClick={() => hasRealPhoto && setViewingPhoto(true)}
              style={{
                borderColor: borderColor,
              }}
            >
              {hasRealPhoto ? (
                <img src={user.avatar} alt={user.firstName} />
              ) : (
                <div className="profile-detail-avatar-placeholder">
                  <User size={56} />
                </div>
              )}
            </div>

            {/* O'zgartirish tugmasi — yumaloq rasmdan tashqarida */}
            <button
              className="profile-change-photo-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={18} />
              <span>{hasRealPhoto ? "O'zgartirish" : "Rasm yuklash"}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
          <h2 className="profile-detail-name" style={{ color: textPrimary }}>
            {user.firstName} {user.lastName}
          </h2>
        </div>

        {/* Rasmni katta ko'rish */}
        {viewingPhoto && hasRealPhoto && (
          <div className="photo-fullview-overlay" onClick={() => setViewingPhoto(false)}>
            <div className="photo-fullview-circle">
              <img src={user.avatar} alt={user.firstName} />
            </div>
          </div>
        )}

        {/* Bio */}
        <div 
          className="profile-detail-bio-box"
          style={{
            background: cardBg,
            borderColor: borderColor,
          }}
        >
          <div className="profile-detail-bio-header">
            <FileText size={16} />
            <span style={{ color: textMuted }}>O'zim haqimda</span>
            <button className="bio-edit-btn" onClick={() => setEditingBio(!editingBio)}>
              <Edit3 size={14} />
            </button>
          </div>
          {editingBio ? (
            <div className="bio-edit-area">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="O'zingiz haqingizda yozing..."
                maxLength={200}
                rows={3}
                style={{
                  background: isLight ? '#ffffff' : (appTheme?.bg || '#14161f'),
                  borderColor: borderColor,
                  color: textPrimary,
                }}
              />
              <button className="bio-save-btn" onClick={handleSaveBio}>Saqlash</button>
            </div>
          ) : (
            <p className="profile-detail-bio-text" style={{ color: textPrimary }}>
              {user.bio || "Hali hech narsa yozilmagan..."}
            </p>
          )}
        </div>

        {/* Info list */}
        <div className="profile-detail-info-list">
          <div 
            className="profile-detail-info-item"
            style={{
              background: cardBg,
              borderColor: borderColor,
            }}
          >
            <div className="info-item-icon phone-icon">
              <Phone size={18} />
            </div>
            <div className="info-item-content">
              <span className="info-item-label" style={{ color: textMuted }}>Telefon raqam</span>
              <span className="info-item-value" style={{ color: textPrimary }}>{user.phoneNumber}</span>
            </div>
          </div>

          <div 
            className="profile-detail-info-item"
            style={{
              background: cardBg,
              borderColor: borderColor,
            }}
          >
            <div className="info-item-icon calendar-icon">
              <Calendar size={18} />
            </div>
            <div className="info-item-content">
              <span className="info-item-label" style={{ color: textMuted }}>Tug'ilgan sana</span>
              <span className="info-item-value" style={{ color: textPrimary }}>{user.birthDate || '—'}</span>
            </div>
          </div>
        </div>

        {/* AX-Map xizmat markazi / Joylashuv holati */}
        <div className="profile-detail-info-list" style={{ marginTop: '0.75rem' }}>
          <div 
            className="profile-detail-info-item" 
            style={{ 
              cursor: 'pointer',
              background: cardBg,
              borderColor: borderColor,
            }} 
            onClick={handleToggleLocation}
            title="Joylashuv qo'shish bo'limini yoqish yoki o'chirish"
          >
            <div className="info-item-icon" style={{ background: isLocationActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.1)', color: isLocationActive ? '#38bdf8' : textMuted }}>
              <MapPin size={18} />
            </div>
            <div className="info-item-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <span className="info-item-label" style={{ color: textMuted }}>AX-Map da xizmat ko'rsatish markazi</span>
                <span className="info-item-value" style={{ color: isLocationActive ? '#38bdf8' : textMuted, fontSize: '0.86rem' }}>
                  {isLocationActive ? "Bor (Joylashuvlar ko'rinadi)" : "Yo'q (Joylashuvlar yashiringan)"}
                </span>
              </div>
              <div className={`profile-toggle-switch ${isLocationActive ? 'active' : ''}`}>
                <div className="toggle-switch-circle" />
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button className="profile-detail-logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Profildan chiqish</span>
        </button>
      </div>
    </div>
  );
}

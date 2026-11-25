import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Phone, Calendar, User, FileText, LogOut, Edit3 } from 'lucide-react';
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setBio(user?.bio || '');
  }, [user?.bio, user?.id]);

  // Modal ochilganda serverdagi eng so'nggi rasm va bio ma'lumotlarini sinxronlash
  useEffect(() => {
    if (!isOpen || !user) return;
    const token = localStorage.getItem('myup_token');
    if (!token) return;

    let isActive = true;
    api.auth
      .getMe()
      .then((res) => {
        if (!isActive || !res?.success || !res?.user) return;
        const srv = res.user;
        const srvAvatar = srv.avatarUrl || srv.avatar_url || srv.avatar || null;
        const srvBio = typeof srv.bio === 'string' ? srv.bio : user.bio || '';
        const merged = {
          ...user,
          bio: srvBio,
          ...(srvAvatar ? { avatar: srvAvatar, avatarUrl: srvAvatar } : {}),
        };
        if (merged.bio !== user.bio || merged.avatar !== user.avatar) {
          try {
            localStorage.setItem('myup_user', JSON.stringify(merged));
          } catch {}
          onUpdateUser(merged);
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const avatarSrc = user.avatar || user.avatarUrl || user.avatar_url || null;
  const hasRealPhoto = Boolean(avatarSrc && !String(avatarSrc).includes('dicebear'));

  const panelBg = isLight ? '#ffffff' : (appTheme?.panel || '#18181b');
  const cardBg = isLight ? '#f1f5f9' : (appTheme?.card || '#222226');
  const borderColor = isLight ? '#e2e8f0' : (appTheme?.border || 'rgba(255, 255, 255, 0.1)');
  const textPrimary = isLight ? '#0f172a' : (appTheme?.text || '#ffffff');
  const textMuted = isLight ? '#64748b' : (appTheme?.textMuted || '#94a3b8');

  const savePendingProfileUpdate = (patch) => {
    try {
      const prev = JSON.parse(localStorage.getItem('myup_pending_profile_update') || '{}');
      localStorage.setItem('myup_pending_profile_update', JSON.stringify({
        ...prev,
        ...patch,
        userId: user?.id,
        phone: user?.phoneNumber || user?.phone,
      }));
    } catch {}
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rasmni yumaloq formatga avtomatik crop qilish (360x360)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 360;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');

        // Rasmni markazdan qirqib olish (square crop)
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 360, 360);

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
        const newUser = { ...user, avatar: croppedDataUrl, avatarUrl: croppedDataUrl };
        try {
          localStorage.setItem('myup_user', JSON.stringify(newUser));
        } catch {}
        onUpdateUser(newUser);
        setIsSavingProfile(true);
        setSaveFeedback("Rasm serverga saqlanmoqda...");

        // Multi-device sync: PostgreSQL bazasiga saqlaymiz (boshqa barcha telefonlarda ham ko'rinadi)
        try {
          const res = await api.auth.updateProfile({
            avatarUrl: croppedDataUrl,
            userId: user?.id,
            phone: user?.phoneNumber || user?.phone,
          });
          if (res?.success && res?.user) {
            const finalAv = res.user.avatarUrl || res.user.avatar_url || res.user.avatar || croppedDataUrl;
            const syncedUser = {
              ...newUser,
              avatar: finalAv,
              avatarUrl: finalAv,
            };
            try {
              localStorage.setItem('myup_user', JSON.stringify(syncedUser));
            } catch {}
            onUpdateUser(syncedUser);
            setSaveFeedback("Rasm muvaffaqiyatli saqlandi!");
          } else {
            savePendingProfileUpdate({ avatarUrl: croppedDataUrl });
            setSaveFeedback("Rasm vaqtincha lokal saqlandi, internet ulanganda serverga yuklanadi.");
          }
        } catch (err) {
          console.warn("Avatar sync error:", err.message);
          savePendingProfileUpdate({ avatarUrl: croppedDataUrl });
          setSaveFeedback("Rasm saqlandi (sinxronlash navbatda).");
        } finally {
          setIsSavingProfile(false);
          setTimeout(() => setSaveFeedback(''), 3000);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBio = async () => {
    const cleanBio = bio.trim();
    const newUser = { ...user, bio: cleanBio };
    try {
      localStorage.setItem('myup_user', JSON.stringify(newUser));
    } catch {}
    onUpdateUser(newUser);
    setEditingBio(false);
    setIsSavingProfile(true);
    setSaveFeedback("Ma'lumot saqlanmoqda...");

    try {
      const res = await api.auth.updateProfile({
        bio: cleanBio,
        userId: user?.id,
        phone: user?.phoneNumber || user?.phone,
      });
      if (res?.success && res?.user) {
        const syncedUser = {
          ...newUser,
          bio: typeof res.user.bio === 'string' ? res.user.bio : cleanBio,
        };
        try {
          localStorage.setItem('myup_user', JSON.stringify(syncedUser));
        } catch {}
        onUpdateUser(syncedUser);
        setSaveFeedback("Ma'lumot serverga saqlandi!");
      } else {
        savePendingProfileUpdate({ bio: cleanBio });
      }
    } catch (err) {
      console.warn("Bio sync error:", err.message);
      savePendingProfileUpdate({ bio: cleanBio });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setSaveFeedback(''), 3000);
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
        {/* Sticky Header: Har doim yuqorida qotib turuvchi panel va X yopish tugmasi */}
        <div 
          className="profile-detail-sticky-header"
          style={{
            background: panelBg,
            borderBottomColor: borderColor,
          }}
        >
          <div className="profile-detail-header-indicator" />
          <div className="profile-detail-header-row">
            <span className="profile-detail-header-title" style={{ color: textPrimary }}>
              Profil ma'lumotlari
            </span>
            <button 
              type="button"
              className="profile-detail-close" 
              onClick={onClose}
              aria-label="Yopish"
              title="Yopish"
            >
              <X size={20} />
            </button>
          </div>
        </div>

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
                <img src={avatarSrc} alt={user.firstName} />
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
              disabled={isSavingProfile}
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
          {saveFeedback && (
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '6px' }}>
              {saveFeedback}
            </div>
          )}
          <h2 className="profile-detail-name" style={{ color: textPrimary }}>
            {user.firstName} {user.lastName}
          </h2>
        </div>

        {/* Rasmni katta ko'rish */}
        {viewingPhoto && hasRealPhoto && (
          <div className="photo-fullview-overlay" onClick={() => setViewingPhoto(false)}>
            <div className="photo-fullview-circle">
              <img src={avatarSrc} alt={user.firstName} />
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

        {/* Yopish tugmasi */}
        <button 
          type="button" 
          className="profile-detail-exit-btn" 
          onClick={onClose}
        >
          <X size={18} />
          <span>Yopish</span>
        </button>

        {/* Logout */}
        <button className="profile-detail-logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Profildan chiqish</span>
        </button>
      </div>
    </div>
  );
}

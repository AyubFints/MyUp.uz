import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Phone, Calendar, User, FileText, LogOut, Edit3, ImagePlus } from 'lucide-react';

export default function ProfileDetailModal({ user, isOpen, onClose, onUpdateUser, onLogout }) {
  const [bio, setBio] = useState(user?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.bio) setBio(user.bio);
  }, [user?.bio]);

  if (!isOpen || !user) return null;

  const hasRealPhoto = user.avatar && !user.avatar.includes('dicebear');

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rasmni yumaloq formatga avtomatik crop qilish
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
        const newUser = { ...user, avatar: croppedDataUrl };
        localStorage.setItem('myup_user', JSON.stringify(newUser));
        onUpdateUser(newUser);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBio = () => {
    const newUser = { ...user, bio };
    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onUpdateUser(newUser);
    setEditingBio(false);
  };

  return (
    <div className="profile-detail-overlay" onClick={onClose}>
      <div className="profile-detail-sheet" onClick={e => e.stopPropagation()}>
        
        {/* Close button */}
        <button className="profile-detail-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Profile photo area */}
        <div className="profile-detail-photo-section">
          <div className="profile-detail-avatar-row">
            {/* Katta yumaloq rasm */}
            <div
              className="profile-detail-avatar-large"
              onClick={() => hasRealPhoto && setViewingPhoto(true)}
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
          <h2 className="profile-detail-name">{user.firstName} {user.lastName}</h2>
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
        <div className="profile-detail-bio-box">
          <div className="profile-detail-bio-header">
            <FileText size={16} />
            <span>O'zim haqimda</span>
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
              />
              <button className="bio-save-btn" onClick={handleSaveBio}>Saqlash</button>
            </div>
          ) : (
            <p className="profile-detail-bio-text">
              {user.bio || "Hali hech narsa yozilmagan..."}
            </p>
          )}
        </div>

        {/* Info list */}
        <div className="profile-detail-info-list">
          <div className="profile-detail-info-item">
            <div className="info-item-icon phone-icon">
              <Phone size={18} />
            </div>
            <div className="info-item-content">
              <span className="info-item-label">Telefon raqam</span>
              <span className="info-item-value">{user.phoneNumber}</span>
            </div>
          </div>

          <div className="profile-detail-info-item">
            <div className="info-item-icon calendar-icon">
              <Calendar size={18} />
            </div>
            <div className="info-item-content">
              <span className="info-item-label">Tug'ilgan sana</span>
              <span className="info-item-value">{user.birthDate || '—'}</span>
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

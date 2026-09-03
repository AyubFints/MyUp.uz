import React from 'react';
import { 
  X, User, Phone, Calendar, LogOut, Heart, ShieldCheck, 
  MapPin, Star, Sparkles, Trash2, ArrowRight
} from 'lucide-react';

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
  favoritesList,
  onRemoveFavorite,
  onSelectStation,
}) {
  if (!isOpen || !user) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* CLOSE BUTTON */}
        <button className="profile-close-btn" onClick={onClose} aria-label="Yopish">
          <X size={20} />
        </button>

        {/* PROFILE HEADER */}
        <div className="profile-header-banner">
          <div className="profile-avatar-box">
            {user.avatar ? (
              <img src={user.avatar} alt={user.firstName} />
            ) : (
              <User size={36} />
            )}
          </div>
          <div className="profile-names-block">
            <h3>{user.firstName} {user.lastName}</h3>
            <span className="profile-user-phone">{user.phoneNumber}</span>
            <div className="verified-badge">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>SMS orqali tasdiqlangan</span>
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS GRID */}
        <div className="profile-info-grid">
          <div className="profile-info-item">
            <User size={16} className="text-cyan-400" />
            <div>
              <span className="info-label">To'liq ism</span>
              <strong>{user.firstName} {user.lastName}</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <Phone size={16} className="text-emerald-400" />
            <div>
              <span className="info-label">Telefon raqam</span>
              <strong>{user.phoneNumber}</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <Calendar size={16} className="text-amber-400" />
            <div>
              <span className="info-label">Tug'ilgan sana</span>
              <strong>{user.birthDate || 'Belgilanmagan'}</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <Sparkles size={16} className="text-purple-400" />
            <div>
              <span className="info-label">A'zolik holati</span>
              <strong className="text-cyan-400">MyUp Premium Foydalanuvchi</strong>
            </div>
          </div>
        </div>

        {/* FAVORITE PLACES LIST */}
        <div className="profile-favorites-section">
          <div className="fav-sec-header">
            <div className="flex items-center gap-2">
              <Heart size={18} fill="#ef4444" color="#ef4444" />
              <h4>Saqlangan joylar ({favoritesList.length})</h4>
            </div>
          </div>

          {favoritesList.length === 0 ? (
            <div className="empty-fav-box">
              <p>Hozircha hech qanday zapravka yoki joy saqlanmagan.</p>
              <span className="text-xs text-muted">Kartochkalardagi yurakcha belgisini bosib saqlab qo'yishingiz mumkin.</span>
            </div>
          ) : (
            <div className="profile-fav-list">
              {favoritesList.map((st) => (
                <div 
                  key={st.id} 
                  className="fav-item-row"
                  onClick={() => {
                    onSelectStation(st);
                    onClose();
                  }}
                >
                  <img src={st.image} alt={st.name} className="fav-thumb" />
                  <div className="fav-info">
                    <strong>{st.name}</strong>
                    <span>{st.address}</span>
                  </div>
                  <button
                    className="fav-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(st.id);
                    }}
                    title="O'chirish"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <div className="profile-footer-bar">
          <button className="profile-logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Profildan chiqish</span>
          </button>
        </div>
      </div>
    </div>
  );
}

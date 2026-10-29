import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  ChevronDown,
  User,
  CheckCircle2,
  Clock,
  Trash2,
  X,
} from 'lucide-react';
import amapsEmptyMascot from '../assets/amaps-empty-notif.png';
import api from '../api/client';

// Sana formatlovchi yordamchi funksiya: masalan, "25-okt 14:30"
const formatNotifDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month} ${hours}:${mins}`;
};

// 12 ta maxsus tanlangan zamonaviy ranglar (Telegram uslubida)
export const TWELVE_PRESETS = [
  {
    id: 'classic-dark',
    name: 'Klassik Qora',
    bg: '#0e0e10',
    panel: '#1a1a1c',
    card: '#222225',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textMuted: '#a0a0a5',
    accent: '#38bdf8',
    isLight: false,
  },
  {
    id: 'pure-black',
    name: 'Sof Qora (AMOLED)',
    bg: '#000000',
    panel: '#121212',
    card: '#1c1c1c',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#38bdf8',
    isLight: false,
  },
  {
    id: 'midnight-blue',
    name: "Tungi Ko'k",
    bg: '#0a1128',
    panel: '#121e42',
    card: '#1a2955',
    border: 'rgba(56, 189, 248, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#38bdf8',
    isLight: false,
  },
  {
    id: 'deep-indigo',
    name: "To'q Indigo",
    bg: '#110e26',
    panel: '#1e1840',
    card: '#2a2258',
    border: 'rgba(129, 140, 248, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#818cf8',
    isLight: false,
  },
  {
    id: 'emerald-night',
    name: 'Zumrad Kecha',
    bg: '#071a14',
    panel: '#0f2e24',
    card: '#163f32',
    border: 'rgba(52, 211, 153, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#34d399',
    isLight: false,
  },
  {
    id: 'deep-purple',
    name: "To'q Binafsha",
    bg: '#180b20',
    panel: '#281335',
    card: '#381c4a',
    border: 'rgba(192, 132, 252, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#c084fc',
    isLight: false,
  },
  {
    id: 'graphite',
    name: 'Grafit',
    bg: '#18191c',
    panel: '#24262b',
    card: '#2f3238',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#94a3b8',
    isLight: false,
  },
  {
    id: 'deep-ruby',
    name: 'Qoramtir Qizil',
    bg: '#1a0a0f',
    panel: '#2c121b',
    card: '#3d1a26',
    border: 'rgba(244, 63, 94, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#f43f5e',
    isLight: false,
  },
  {
    id: 'ocean-teal',
    name: "To'q Firuza",
    bg: '#05181a',
    panel: '#0d2a2e',
    card: '#153c42',
    border: 'rgba(45, 212, 191, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#2dd4bf',
    isLight: false,
  },
  {
    id: 'dark-amber',
    name: "To'q Oltin",
    bg: '#1a1408',
    panel: '#2a2010',
    card: '#3a2d18',
    border: 'rgba(245, 158, 11, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#f59e0b',
    isLight: false,
  },
  {
    id: 'espresso',
    name: "To'q Qahva",
    bg: '#17100b',
    panel: '#261b14',
    card: '#35271e',
    border: 'rgba(217, 119, 6, 0.18)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#d97706',
    isLight: false,
  },
  {
    id: 'default-white',
    name: 'Standart Oq',
    bg: '#f8fafc',
    panel: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    accent: '#0284c7',
    isLight: true,
  },
];

export const THEME_PRESETS = TWELVE_PRESETS;

// Hex rangdan panel va card ranglarini avtomatik hisoblash
export function generateThemeFromHex(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.55;

  if (isLight) {
    const darken = (p) => {
      const nr = Math.max(0, Math.round(r * (1 - p)));
      const ng = Math.max(0, Math.round(g * (1 - p)));
      const nb = Math.max(0, Math.round(b * (1 - p)));
      return '#' + [nr, ng, nb].map((x) => x.toString(16).padStart(2, '0')).join('');
    };
    return {
      id: 'custom-' + c,
      name: 'Maxsus rang',
      bg: hex,
      panel: darken(0.04),
      card: '#ffffff',
      border: 'rgba(0, 0, 0, 0.1)',
      text: '#0f172a',
      textMuted: '#64748b',
      accent: '#0284c7',
      isLight: true,
    };
  }

  const brighten = (p) => {
    const nr = Math.min(255, Math.round(r + (255 - r) * p));
    const ng = Math.min(255, Math.round(g + (255 - g) * p));
    const nb = Math.min(255, Math.round(b + (255 - b) * p));
    return '#' + [nr, ng, nb].map((x) => x.toString(16).padStart(2, '0')).join('');
  };

  return {
    id: 'custom-' + c,
    name: 'Maxsus rang',
    bg: hex,
    panel: brighten(0.08),
    card: brighten(0.14),
    border: brighten(0.25),
    text: '#ffffff',
    textMuted: '#94a3b8',
    accent: brighten(0.4),
    isLight: false,
  };
}

// HSL rangni Hex ga o'tkazish
function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function SettingsSection({
  currentTheme,
  onSaveTheme,
  user,
  onLogout,
  onNavigateProfile,
  onOpenNotifications,
  hasUnreadNotification,
  unreadCount = 0,
}) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || TWELVE_PRESETS[0]);
  const [customHex, setCustomHex] = useState(selectedTheme?.bg || '#0e0e10');
  const [hueValue, setHueValue] = useState(210);
  const [toastMessage, setToastMessage] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Menga kelgan bildirishnomalar holati
  const [incomingNotifications, setIncomingNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_incoming_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        return parsed.filter((item) => {
          if (item.readAt) {
            const age = Date.now() - new Date(item.readAt).getTime();
            if (age >= ONE_DAY_MS) return false;
          }
          return item.id !== "sys_amaps_welcome" && !item.id?.startsWith("incoming_reply_");
        });
      }
    } catch {}
    return [];
  });

  // PostgreSQL bazasidan kelgan bildirishnomalarni olish
  useEffect(() => {
    let isMounted = true;
    const userPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;

    if (!userPhone && !userId) return;

    api.notifications
      ?.getAll({ userId: userId || "", phone: userPhone })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.notifications)) {
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;
          const apiNotifs = res.notifications
            .map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              badge: n.badge || (n.type === 'station_approved' ? "Tasdiqlandi" : "Moderatsiya"),
              date: formatNotifDate(n.createdAt),
              type: n.type,
              stationId: n.stationId,
              isRead: true,
              readAt: n.readAt || new Date().toISOString(),
              sender: "Super Administrator",
            }))
            .filter((n) => {
              if (n.readAt) {
                const age = Date.now() - new Date(n.readAt).getTime();
                return age < ONE_DAY_MS;
              }
              return true;
            });

          setIncomingNotifications(apiNotifs);
          try {
            localStorage.setItem("myup_incoming_notifications", JSON.stringify(apiNotifs));
          } catch (e) {}

          api.notifications?.markAllRead({ userId: userId || "", phone: userPhone }).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("API notifications error:", err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Kelgan bildirishnomani o'chirish
  const handleDeleteIncoming = async (id) => {
    const updated = incomingNotifications.filter((n) => n.id !== id);
    setIncomingNotifications(updated);
    try {
      localStorage.setItem("myup_incoming_notifications", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    try {
      if (api.notifications?.delete) {
        await api.notifications.delete(id);
      }
    } catch (err) {
      console.warn("Serverdan o'chirish xatosi:", err.message);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedTheme(preset);
    setCustomHex(preset.bg);
  };

  // Rangni yurg'izib tanlaydigan slider harakatlanganda
  const handleSliderHueChange = (e) => {
    const hue = parseInt(e.target.value);
    setHueValue(hue);
    // Chuqur va chiroyli to'q fon rangini hisoblash (Telegram dark uslubida)
    const newHex = hslToHex(hue, 50, 7);
    setCustomHex(newHex);
    const customTheme = generateThemeFromHex(newHex);
    setSelectedTheme(customTheme);
  };

  const handleNativeColorChange = (e) => {
    const hex = e.target.value;
    setCustomHex(hex);
    const customTheme = generateThemeFromHex(hex);
    setSelectedTheme(customTheme);
  };

  const handleConfirmTheme = () => {
    if (onSaveTheme) {
      onSaveTheme(selectedTheme);
    }
    setToastMessage("Rang muvaffaqiyatli saqlandi va qo'llanildi!");
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const isLight = selectedTheme?.isLight ?? currentTheme?.isLight ?? false;

  // Profil ma'lumotlari: ism va telefon kiritilgan bo'lsa ularni olish
  const displayName = (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    ''
  ).trim();

  const displayPhone = user?.phone || user?.phoneNumber || '';
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : null;

  return (
    <div className={`new-settings-wrapper ${isLight ? 'is-light' : ''}`}>
      {/* 1. TEPADAGI QATOR: "Sozlamalar" (chapda A-Maps.uz tagida) va Kalakolchik (o'ng burchakda 10px joy bilan) */}
      <div className="new-settings-header-row">
        <h1 className="new-settings-title">Sozlamalar</h1>
        <button
          className="new-settings-bell-btn"
          onClick={onOpenNotifications}
          title="Bildirishnomalar"
          type="button"
          style={{ position: 'relative' }}
          aria-label="Bildirishnomalar"
        >
          <Bell size={22} color={isLight ? '#475569' : '#ffffff'} />
          {(unreadCount > 0 || hasUnreadNotification) && (
            <span className="profile-hero-bell-badge">{unreadCount > 0 ? unreadCount : 1}</span>
          )}
        </button>
      </div>

      <div className="new-settings-container">

        {/* Muvaffaqiyat xabari (Toast) */}
        {toastMessage && (
          <div className="settings-toast-banner">
            <CheckCircle2 size={18} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. PROFIL QISMI (Ja uzun emas, bosilsa profil bo'limiga o'tadi) */}
        <div
          className="new-settings-profile-card"
          onClick={onNavigateProfile}
          role="button"
          tabIndex={0}
          title="Profil bo'limiga o'tish"
        >
          <div className="new-profile-avatar-wrap">
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName || "Avatar"} className="new-profile-avatar-img" />
            ) : (
              <div className="new-profile-avatar-circle">
                {initialLetter ? (
                  initialLetter) : (
                  <User size={22} color={isLight ? "#475569" : "#38bdf8"} />
                )}
              </div>
            )}
          </div>

          <div className="new-profile-details">
            <span className="new-profile-name">{displayName || 'Foydalanuvchi'}</span>
            <span className="new-profile-phone">{displayPhone || '+998 90 123 45 67'}</span>
          </div>

          <ChevronRight size={20} className="new-profile-arrow" />
        </div>

        {/* 3. FON RANGI BO'LIMI:
            Dastlab faqat "Fon rangi" yozuvi va o'ng tomonda "O'zgartirish" tugmasi turadi.
            Bosilganda pastga qarab animatsiya bilan ochiladi */}
        <div className="new-settings-color-card">
          <div className="new-color-section-heading">
            <div className="new-color-title-wrap">
              <span className="new-color-title">Fon rangi</span>
            </div>
            <button
              type="button"
              className="new-color-toggle-btn"
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              aria-expanded={isColorPickerOpen}
              title="Fon rangini o'zgartirish"
            >
              <span>{isColorPickerOpen ? "Yopish" : "O'zgartirish"}</span>
              <ChevronDown
                size={16}
                className={`color-toggle-chevron ${isColorPickerOpen ? "is-open" : ""}`}
              />
            </button>
          </div>

          {/* Ranglar tanlanadigan va ko'rinadigan joylar: animatsiyalik qilib pastga qarab sekin tushadi */}
          <div className={`new-color-collapsible-wrapper ${isColorPickerOpen ? "is-open" : ""}`}>
            <div className="new-color-collapsible-inner">
              {/* 12 ta yumaloq rang */}
              <div className="new-twelve-circles-grid">
                {TWELVE_PRESETS.map((preset) => {
                  const isSelected = selectedTheme.bg.toLowerCase() === preset.bg.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      className={`new-color-dot ${isSelected ? 'active' : ''}`}
                      style={{
                        backgroundColor: preset.bg,
                        border: preset.isLight ? '1.5px solid #cbd5e1' : '1.5px solid rgba(255, 255, 255, 0.15)',
                      }}
                      onClick={() => handleSelectPreset(preset)}
                      title={preset.name}
                      type="button"
                    >
                      {isSelected && (
                        <Check
                          size={18}
                          color={preset.isLight ? '#0f172a' : '#ffffff'}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Rangni yurg'izib tanlaydigan joy (Slider va rang namunasi) */}
              <div className="new-color-slider-section">
                <div className="new-slider-row">
                  <div className="new-slider-track-wrap">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hueValue}
                      onChange={handleSliderHueChange}
                      className="new-hue-slider"
                      title="Rangni yurg'izib tanlang"
                    />
                  </div>

                  {/* Tanlagan rangni ko'rsatuvchi doira va to'liq palitra tanlagich */}
                  <div
                    className="new-chosen-swatch"
                    style={{ backgroundColor: customHex }}
                    title="Batafsil rang tanlash uchun bosing"
                  >
                    <input
                      type="color"
                      value={customHex}
                      onChange={handleNativeColorChange}
                      className="new-native-color-picker"
                      id="nativeColorInput"
                    />
                    <label htmlFor="nativeColorInput" className="new-swatch-clickable-overlay" />
                  </div>
                </div>

                <div className="new-chosen-hex-row">
                  <span>
                    Tanlangan rang: <strong>{customHex.toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              {/* Tanlagan rangi qanday turishini ko'rsatadigan joy (Live Preview) */}
              <div className="new-live-preview-box">
                <span className="new-preview-title">Tanlangan rang ko'rinishi:</span>
                
                <div
                  className="new-preview-card-frame"
                  style={{
                    backgroundColor: selectedTheme.bg,
                    borderColor: selectedTheme.border,
                  }}
                >
                  {/* Ichki kichik panel */}
                  <div
                    className="new-preview-inner-bar"
                    style={{
                      backgroundColor: selectedTheme.panel,
                      borderColor: selectedTheme.border,
                    }}
                  >
                    <span style={{ color: selectedTheme.accent, fontWeight: 700, fontSize: '0.85rem' }}>
                      ⛽ Metan Gaz
                    </span>
                    <span style={{ color: selectedTheme.text || '#ffffff', fontSize: '0.8rem' }}>
                      📍 150 m yaqin
                    </span>
                  </div>

                  {/* Ichki namuna kartochkasi */}
                  <div
                    className="new-preview-inner-card"
                    style={{
                      backgroundColor: selectedTheme.card,
                      borderColor: selectedTheme.border,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: selectedTheme.text || '#ffffff', fontSize: '0.9rem' }}>
                        Mustaqillik Zapravkasi
                      </strong>
                      <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                        Ochiq
                      </span>
                    </div>
                    <div style={{ color: selectedTheme.textMuted || '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>
                      Metan: 3,800 so'm • Bosim: 210 atm
                    </div>
                  </div>
                </div>
              </div>

              {/* Rangni tasdiqlaydigan joy */}
              <button
                className="new-confirm-theme-btn"
                onClick={handleConfirmTheme}
                type="button"
              >
                <Check size={18} strokeWidth={2.5} />
                <span>Rangni tasdiqlash</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. FON RANGINING TAGIDA: MENGA KELGAN BILDIRISHNOMALAR
            Kalakolchik ichida qanday tursa huddi shunday tursin tagidagi rasmlar bilan bir xil */}
        <div className="notif-section-block settings-notifs-section">
          <div className="notif-list-heading-bar">
            <div className="notif-section-title-wrap">
              <Bell size={16} className="notif-heading-icon incoming-icon" />
              <h4 className="notif-list-title">Menga kelgan bildirishnomalar</h4>
            </div>
            {incomingNotifications.length > 0 && (
              <span className="notif-count-pill incoming-pill">
                {incomingNotifications.length}
              </span>
            )}
          </div>

          {incomingNotifications.length > 0 ? (
            <div className="notif-items-vertical-stack">
              {incomingNotifications.map((item) => {
                const isApprovedNotif = item.type === 'station_approved' || item.badge === 'Tasdiqlandi' || (item.title && item.title.includes('tasdiqlandi'));
                const isRejectedNotif = item.type === 'station_rejected' || item.badge === 'Rad etildi' || (item.title && item.title.includes('rad etildi'));

                return (
                  <div 
                    key={item.id} 
                    className={`notif-message-card incoming-card ${isApprovedNotif ? 'notif-approved-card' : ''}`}
                    style={isApprovedNotif ? {
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                      borderRadius: '16px'
                    } : isRejectedNotif ? {
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      borderRadius: '16px'
                    } : {}}
                  >
                    <div className="notif-message-top">
                      <span 
                        className="notif-message-badge notif-badge-incoming"
                        style={isApprovedNotif ? {
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                          color: '#10b981',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        } : isRejectedNotif ? {
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#ef4444',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        } : {}}
                      >
                        {isApprovedNotif ? <CheckCircle2 size={13} color="#10b981" /> : isRejectedNotif ? <X size={13} color="#ef4444" /> : null}
                        {item.badge || (isApprovedNotif ? "Tasdiqlandi" : "A-Maps Tizimi")}
                      </span>
                      <div className="notif-message-date-box">
                        <Clock size={12} />
                        <span>{item.date}</span>
                        <button
                          type="button"
                          className="notif-msg-delete-btn"
                          onClick={() => handleDeleteIncoming(item.id)}
                          title="O'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h5 
                      className="incoming-notif-title"
                      style={isApprovedNotif ? { color: '#10b981', fontWeight: 700, fontSize: '0.96rem' } : isRejectedNotif ? { color: '#ef4444', fontWeight: 700 } : {}}
                    >
                      {item.title}
                    </h5>
                    <p className="notif-message-content" style={{ lineHeight: 1.55 }}>{item.message}</p>

                    <div className="notif-message-footer">
                      <span className="notif-author-label">
                        Yuboruvchi: {item.sender || "Super Administrator"}
                      </span>
                      <span 
                        className="notif-status-indicator incoming-status"
                        style={isApprovedNotif ? { color: '#10b981' } : {}}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isApprovedNotif ? "Tasdiqlandi" : "Yetkazildi"}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* BO'SH HOLAT: A-Maps Limon personaji */
            <div className="notif-empty-state-box">
              <div className="notif-empty-illustration-wrapper">
                <img
                  src={amapsEmptyMascot}
                  alt="A-Maps bildirishnoma yo'q"
                  className="notif-empty-character-img"
                />
              </div>

              <h4 className="notif-empty-title">Sizga kelgan bildirishnoma yo'q</h4>
              <p className="notif-empty-subtitle">
                Hozircha sizga hech qanday xabar yoki eslatma kelmagan. Agar tizimdan yangilik yoki javob kelsa, shu yerda ko'rinadi.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

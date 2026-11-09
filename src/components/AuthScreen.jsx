import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Phone, ArrowRight, CheckCircle2, AlertCircle, 
  Eye, EyeOff, LogIn, UserPlus, MapPin, Building2, Upload, 
  Image as ImageIcon, X, ArrowLeft, SkipForward, Info
} from 'lucide-react';
import api from '../api/client';

export default function AuthScreen({ 
  onLoginSuccess, 
  isLight = false, 
  initialMode = 'register' 
}) {
  const [authMode, setAuthMode] = useState(initialMode); // 'register' | 'location_register' | 'login'
  const [step, setStep] = useState(1); // Oddiy register uchun: 1: Ma'lumotlar, 2: Sana va Telefon
  const [locationStep, setLocationStep] = useState(1); // Joylashuv register uchun: 1: Ma'lumotlar, 2: Rasm
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  // initialMode o'zgarganda (masalan kalakolchikdan yoki sozlamalardan qaytganda) rejimni yangilash
  useEffect(() => {
    setAuthMode(initialMode);
    if (initialMode === 'register') {
      setStep(1);
    } else if (initialMode === 'location_register') {
      setLocationStep(1);
    }
    setErrorMsg('');
  }, [initialMode]);
  
  // 1. Oddiy foydalanuvchi ro'yxatdan o'tish formasi
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    bDay: '',
    bMonth: '',
    bYear: '',
    phone: '+998 ',
  });

  // 2. Joylashuv egasi ("Joylashuv joylash") formasi
  const [locationData, setLocationData] = useState({
    locationName: '',
    responsiblePerson: '',
    locationAddress: '',
    password: '',
    phone: '+998 ',
    locationImage: null,
  });

  // 3. Kirish (Login) formasi
  const [loginPhone, setLoginPhone] = useState('+998 ');
  const [loginPassword, setLoginPassword] = useState('');

  // Telefon raqamni chiroyli formatlash: +998 90 123 45 67
  const formatPhoneNumber = (val) => {
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+998')) cleaned = '+998' + cleaned.replace('+', '');
    let formatted = '+998 ';
    const numbersOnly = cleaned.slice(4);
    for (let i = 0; i < numbersOnly.length; i++) {
      if (i === 2 || i === 5 || i === 7) formatted += ' ';
      formatted += numbersOnly[i];
    }
    if (formatted.length > 17) formatted = formatted.slice(0, 17);
    return formatted;
  };

  const handlePhoneChange = (val) => {
    setFormData({ ...formData, phone: formatPhoneNumber(val) });
  };

  const handleLocationPhoneChange = (val) => {
    setLocationData({ ...locationData, phone: formatPhoneNumber(val) });
  };

  const handleLoginPhoneChange = (val) => {
    setLoginPhone(formatPhoneNumber(val));
  };

  // ========================================================
  // ODDIY USER RO'YXATDAN O'TISH BOSQICHLARI
  // ========================================================
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg("Ism va familiyangizni kiriting!");
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setErrorMsg("Parol kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    setStep(2);
  };

  // 2-qadam: Tug'ilgan sana va telefon raqam -> SMS-SIZ TO'G'RIDAN-TO'G'RI REGISTER
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.bDay || !formData.bMonth || !formData.bYear) {
      setErrorMsg("Tug'ilgan sanangizni to'liq kiriting!");
      return;
    }
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Telefon raqamni to'liq kiriting (+998 90 123 45 67)!");
      return;
    }

    try {
      const res = await api.auth.register({
        phone: cleanPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
        hasLocation: false,
        role: 'user',
      });

      if (res.success && res.token && res.user) {
        localStorage.setItem('myup_token', res.token);

        // Yangi foydalanuvchi uchun 2 kunlik maxsus yo'riqnoma bildirishnoma yaratamiz
        const welcomeNotif = {
          id: "sys_location_guide_" + Date.now(),
          title: "Manzil qo'shish imkoniyati",
          message: "Agar sizning ham dasturga qo'shmoqchi bo'lgan manzilingiz bo'lsa, ushbu bildirishnomalarning eng tagida joylashuv qo'shishni faollashtiradigan joy bor.",
          badge: "Qo'llanma",
          type: "location_guide",
          isRead: false,
          createdAt: new Date().toISOString(),
          date: "Hozir",
          sender: "AX-Map Tizimi",
        };

        try {
          const existingNotifs = JSON.parse(localStorage.getItem("myup_incoming_notifications") || "[]");
          const updatedNotifs = [welcomeNotif, ...existingNotifs.filter((n) => n.type !== 'location_guide')];
          localStorage.setItem("myup_incoming_notifications", JSON.stringify(updatedNotifs));
          localStorage.setItem("myup_notif_unread", "true");
          localStorage.setItem("myup_notif_unread_count", "1");
        } catch (e) {}

        const newUser = {
          id: res.user.id,
          firstName: res.user.first_name || formData.firstName.trim(),
          lastName: res.user.last_name || formData.lastName.trim(),
          phoneNumber: res.user.phone || formData.phone,
          birthDate: `${formData.bYear}-${String(formData.bMonth).padStart(2, '0')}-${String(formData.bDay).padStart(2, '0')}`,
          registeredAt: res.user.created_at || new Date().toISOString(),
          avatar: res.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
          role: res.user.role || 'user',
          hasLocation: false,
          registeredViaLocation: false,
          userProfileCompleted: true,
        };
        localStorage.setItem('myup_user', JSON.stringify(newUser));
        onLoginSuccess(newUser, null, []);
        return;
      } else {
        setErrorMsg(res.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }
    } catch (apiErr) {
      console.warn("Ro'yxatdan o'tish xatosi:", apiErr.message);
      setErrorMsg(apiErr.message || "Ushbu telefon raqam allaqachon ro'yxatdan o'tgan bo'lishi mumkin.");
    }
  };

  // ========================================================
  // JOYLASHUV JOYLASh (LOCATION REGISTRATION) BOSQICHLARI
  // ========================================================
  const handleLocationStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!locationData.locationName.trim()) {
      setErrorMsg("Joylashuv nomini kiriting!");
      return;
    }
    if (!locationData.responsiblePerson.trim()) {
      setErrorMsg("Mas'ul inson ismini kiriting!");
      return;
    }
    if (!locationData.password || locationData.password.length < 4) {
      setErrorMsg("Maxfiy parol kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    const cleanPhone = locationData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Joylashuv asosiy telefon raqamini to'liq kiriting!");
      return;
    }
    setLocationStep(2);
  };

  // Rasm faylini o'qish
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLocationData({ ...locationData, locationImage: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  // Joylashuv registratsiyasini yakunlash (Tasdiqlash yoki Tashlab ketish)
  const handleFinishLocationRegister = async (chosenImage = null) => {
    setErrorMsg('');
    const finalImage = chosenImage || locationData.locationImage || null;
    const cleanPhone = locationData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Joylashuv telefon raqamini to'liq kiriting!");
      return;
    }
    if (!locationData.password || locationData.password.length < 4) {
      setErrorMsg("Parol kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    try {
      const regPayload = {
        phone: cleanPhone,
        firstName: locationData.responsiblePerson.trim(),
        lastName: '',
        password: locationData.password,
        hasLocation: true,
        canAddStation: true,
        registeredViaLocation: true,
        role: 'owner',
        locationName: locationData.locationName.trim(),
        responsiblePerson: locationData.responsiblePerson.trim(),
        locationPhone: locationData.phone,
        locationImage: finalImage || null,
        avatarUrl: finalImage || null,
      };

      let regRes;
      try {
        regRes = await api.auth.register(regPayload);
      } catch (err) {
        // Agar ushbu telefon raqam bilan avval oddiy foydalanuvchi bo'lib ro'yxatdan o'tilgan bo'lsa:
        // Avtomatik tizimga kirib, joylashuv profilini faollashtiramiz va egasi (owner) qilib yangilaymiz!
        if (err.message?.includes('allaqachon') || err.message?.includes('mavjud') || err.message?.includes('400')) {
          const logRes = await api.auth.login(cleanPhone, locationData.password);
          if (logRes.success && logRes.token) {
            localStorage.setItem('myup_token', logRes.token);
            const upd = await api.auth.updateProfile(regPayload);
            regRes = {
              success: true,
              token: logRes.token,
              user: upd.user || logRes.user,
              stations: logRes.stations || []
            };
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (!regRes.success || !regRes.user || !regRes.token) {
        setErrorMsg(regRes.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
        return;
      }

      const realUser = regRes.user;
      localStorage.setItem('myup_token', regRes.token);

      // 2. DIQQAT: Bu yerda hech qanday soxta shahobcha (joylashuv) yaratilmaydi!
      // Faqat foydalanuvchiga joylashuv/shahobcha qo'shish huquqi (canAddStation) beriladi.
      const newUser = {
        id: realUser.id,
        role: 'owner',
        hasLocation: true,
        canAddStation: true,
        registeredViaLocation: true,
        isLocationOnly: true,
        userProfileCompleted: false,
        firstName: locationData.responsiblePerson.trim(),
        lastName: '',
        locationName: locationData.locationName.trim(),
        organizationName: locationData.locationName.trim(),
        responsiblePerson: locationData.responsiblePerson.trim(),
        locationPhone: locationData.phone,
        locationImage: finalImage,
        phoneNumber: locationData.phone,
        registeredAt: realUser.created_at || realUser.createdAt || new Date().toISOString(),
        avatar: finalImage || realUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
      };

      localStorage.setItem('myup_user', JSON.stringify(newUser));
      const userStations = Array.isArray(regRes.stations) ? regRes.stations : [];
      localStorage.setItem('myup_my_stations', JSON.stringify(userStations));
      onLoginSuccess(newUser, userStations[0] || null, userStations);
    } catch (err) {
      console.error("Joylashuv ro'yxatdan o'tish xatosi:", err);
      setErrorMsg(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi. Parol noto'g'ri bo'lishi mumkin.");
    }
  };

  // ========================================================
  // TIZIMGA KIRISH (LOGIN - Har qanday qurilmadan o'z hisobiga kirish)
  // ========================================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = loginPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 13 && !['admin', 'ayubxon', 'superadmin', 'admin@amaps.uz', 'ayub'].includes(loginPhone.trim().toLowerCase())) {
      setErrorMsg("Telefon raqamingizni to'liq kiriting!");
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setErrorMsg("Parol kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    // PostgreSQL Backend API orqali tekshirish
    try {
      const res = await api.auth.login(loginPhone, loginPassword);
      if (res.success && res.token && res.user) {
        localStorage.setItem('myup_token', res.token);
        const userStations = Array.isArray(res.stations) ? res.stations : [];
        const primaryStation = userStations[0] || null;

        const loggedUser = {
          id: res.user.id,
          firstName: res.user.firstName || res.user.first_name || 'Foydalanuvchi',
          lastName: res.user.lastName || res.user.last_name || '',
          phoneNumber: res.user.phone || res.user.phoneNumber || loginPhone,
          role: res.user.role || 'user',
          hasLocation: Boolean(res.user.hasLocation ?? res.user.has_location ?? (userStations.length > 0)),
          canAddStation: Boolean(res.user.canAddStation ?? res.user.can_add_station ?? res.user.hasLocation ?? res.user.has_location),
          registeredViaLocation: Boolean(res.user.registeredViaLocation ?? res.user.registered_via_location ?? res.user.locationName ?? res.user.location_name),
          locationName: res.user.locationName || res.user.location_name || primaryStation?.name || '',
          organizationName: res.user.locationName || res.user.location_name || primaryStation?.name || '',
          responsiblePerson: res.user.responsiblePerson || res.user.responsible_person || primaryStation?.responsiblePerson || (res.user.first_name ? `${res.user.first_name} ${res.user.last_name || ''}`.trim() : ''),
          locationAddress: primaryStation?.address || '',
          locationPhone: res.user.locationPhone || res.user.location_phone || primaryStation?.phone || res.user.phone || loginPhone,
          locationImage: res.user.locationImage || res.user.location_image || primaryStation?.image || (Array.isArray(primaryStation?.images) ? primaryStation.images[0] : null) || null,
          bio: res.user.bio || '',
          avatar: res.user.avatarUrl || res.user.avatar_url || res.user.avatar || primaryStation?.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
          registeredAt: res.user.createdAt || res.user.created_at || new Date().toISOString(),
        };

        localStorage.setItem('myup_user', JSON.stringify(loggedUser));
        localStorage.setItem('myup_my_stations', JSON.stringify(userStations));

        if (Array.isArray(res.notifications)) {
          localStorage.setItem('myup_incoming_notifications', JSON.stringify(res.notifications));
          const unreadCount = res.notifications.filter(n => !n.isRead && !n.readAt).length;
          localStorage.setItem('myup_notif_unread_count', String(unreadCount));
          localStorage.setItem('myup_notif_unread', unreadCount > 0 ? 'true' : 'false');
        }

        onLoginSuccess(loggedUser, primaryStation, userStations);
        return;
      } else {
        setErrorMsg(res.message || "Kirishda xatolik yuz berdi.");
      }
    } catch (apiErr) {
      console.warn("Backend login javobi:", apiErr.message);
      setErrorMsg(apiErr.message || "Telefon raqam yoki parol noto'g'ri.");
    }
  };

  // Demo foydalanuvchi bilan tezkor kirish
  const handleQuickDemoLogin = () => {
    const demoUser = {
      id: 'usr_demo_777',
      firstName: 'Sardor',
      lastName: 'Rahimov',
      phoneNumber: '+998 77 278 18 08',
      registeredAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'business',
      hasLocation: true,
      registeredViaLocation: true,
      userProfileCompleted: true,
      locationName: "Grand Metan Servis",
      responsiblePerson: "Sardor Rahimov",
      locationAddress: "Toshkent sh., Chilonzor tumani",
      locationPhone: "+998 77 278 18 08",
    };
    localStorage.setItem('myup_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  };

  return (
    <div className={`modern-auth-screen-wrapper ${isLight ? 'is-light' : ''}`}>
      {/* Orqa fon nur effekti */}
      <div className="modern-auth-ambient-glow" />

      <div className="modern-auth-card">
        {/* Tepa-pastga surish indikatori (Drag Handle) */}
        <div className="notif-modal-drag-indicator-bar" />

        {/* HEADER */}
        <div className="modern-auth-header">
          <h2 className="modern-auth-title">
            {authMode === 'location_register'
              ? "Joylashuvlaringizning asosiy qismi"
              : authMode === 'register'
              ? "Ro'yxatdan o'tish"
              : "Tizimga kirish"}
          </h2>
          <p className="modern-auth-subtitle">
            {authMode === 'location_register'
              ? (locationStep === 1 
                  ? "Joylashuvingiz ma'lumotlarini kiriting" 
                  : "Joylashuvingiz uchun asosiy rasm qo'yib keting")
              : authMode === 'register' 
              ? (step === 1 
                  ? "Ism, familiya va maxfiy parolingizni belgilang"
                  : "Tug'ilgan sana va telefon raqamingizni kiriting")
              : "Telefon raqamingiz va parolingiz orqali profilingizga kiring"}
          </p>

          {/* REJIM ALMASHTIRGICH (Register / Login Tabs) */}
          {authMode !== 'location_register' && (
            <div className="modern-auth-mode-tabs">
              <button
                type="button"
                className={`modern-auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setStep(1);
                  setErrorMsg('');
                }}
              >
                <UserPlus size={16} />
                <span>Ro'yxatdan o'tish</span>
              </button>
              <button
                type="button"
                className={`modern-auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                }}
              >
                <LogIn size={16} />
                <span>Kirish</span>
              </button>
            </div>
          )}

          {/* ODDIY RO'YXATDAN O'TISH BOSQICHLARI (2 ta bosqich: Ma'lumot va Aloqa - SMS YO'Q!) */}
          {authMode === 'register' && (
            <div className="modern-auth-stepper">
              <div className={`modern-step-node ${step >= 1 ? 'active' : ''}`}>
                <span className="step-circle">{step > 1 ? <CheckCircle2 size={14} /> : '1'}</span>
                <span className="step-title">Ma'lumot</span>
              </div>
              <div className={`modern-step-line ${step >= 2 ? 'active' : ''}`} />
              <div className={`modern-step-node ${step >= 2 ? 'active' : ''}`}>
                <span className="step-circle">{step === 2 ? '2' : '2'}</span>
                <span className="step-title">Aloqa</span>
              </div>
            </div>
          )}

          {/* JOYLASHUV JOYLASh BOSQICHLARI (1: Ma'lumotlar, 2: Asosiy rasm) */}
          {authMode === 'location_register' && (
            <div className="modern-auth-stepper">
              <div className={`modern-step-node ${locationStep >= 1 ? 'active' : ''}`}>
                <span className="step-circle">{locationStep > 1 ? <CheckCircle2 size={14} /> : '1'}</span>
                <span className="step-title">Joylashuv</span>
              </div>
              <div className={`modern-step-line ${locationStep >= 2 ? 'active' : ''}`} />
              <div className={`modern-step-node ${locationStep >= 2 ? 'active' : ''}`}>
                <span className="step-circle">2</span>
                <span className="step-title">Asosiy rasm</span>
              </div>
            </div>
          )}
        </div>

        {/* XATOLIK BILDIRISHNOMASI */}
        {errorMsg && (
          <div className="modern-auth-error-alert">
            <AlertCircle size={18} className="error-icon" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span>{errorMsg}</span>
              {errorMsg.toLowerCase().includes('allaqachon') && authMode !== 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    if (formData.phone && formData.phone.length > 5) setLoginPhone(formData.phone);
                    else if (locationData.phone && locationData.phone.length > 5) setLoginPhone(locationData.phone);
                    setErrorMsg('');
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Profilga kirish (Login) ga o'tish →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            A) JOYLASHUV JOYLASh (LOCATION REGISTRATION) FORMASI
            1. Joylashuv nomi
            2. Mas'ul inson
            3. Maxfiy parol
            4. Joylashuv asosiy telefon raqami
            5. Asosiy rasm qo'yish (va Tashlab ketish)
            ======================================================== */}
        {authMode === 'location_register' && locationStep === 1 && (
          <div 
            style={{
              margin: '12px 0 16px',
              padding: '12px 14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#e2e8f0',
              fontSize: '0.84rem',
              lineHeight: '1.45',
              textAlign: 'left',
            }}
          >
            <Info size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px', fontSize: '0.86rem' }}>
                Muhim eslatma:
              </strong>
              Siz bu yerda avval registratsiyadan o'tib olasiz, shundan keyin o'zingizning haqiqiy yoqilg'i shahobchalaringizni xaritaga erkin qo'shish va narxlarini boshqarish huquqiga ega bo'lasiz.
            </div>
          </div>
        )}

        {authMode === 'location_register' && locationStep === 1 && (
          <form onSubmit={handleLocationStep1Submit} className="modern-auth-form">
            {/* 1. Joylashuv nomi */}
            <div className="modern-field-group">
              <label className="modern-field-label">Joylashuv nomi *</label>
              <div className="modern-input-wrap">
                <Building2 size={18} className="modern-input-icon text-sky-400" />
                <input 
                  type="text" 
                  placeholder="Masalan: Grand Metan Servis" 
                  value={locationData.locationName}
                  onChange={e => setLocationData({ ...locationData, locationName: e.target.value })}
                  className="modern-input-field"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* 2. Mas'ul inson */}
            <div className="modern-field-group">
              <label className="modern-field-label">Mas'ul inson ismi *</label>
              <div className="modern-input-wrap">
                <User size={18} className="modern-input-icon" />
                <input 
                  type="text" 
                  placeholder="Masalan: Sardor Rahimov" 
                  value={locationData.responsiblePerson}
                  onChange={e => setLocationData({ ...locationData, responsiblePerson: e.target.value })}
                  className="modern-input-field"
                  required
                />
              </div>
            </div>

            {/* 3. Maxfiy parol */}
            <div className="modern-field-group">
              <label className="modern-field-label">Maxfiy parol *</label>
              <div className="modern-input-wrap">
                <Lock size={18} className="modern-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kamida 4 ta belgi" 
                  value={locationData.password}
                  onChange={e => setLocationData({ ...locationData, password: e.target.value })}
                  className="modern-input-field"
                  required
                />
                <button 
                  type="button" 
                  className="modern-pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Parolni ko'rsatish/yashirish"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 5. Joylashuv asosiy telefon raqami */}
            <div className="modern-field-group">
              <label className="modern-field-label">Joylashuv asosiy telefon raqami *</label>
              <div className="modern-input-wrap">
                <Phone size={18} className="modern-input-icon text-emerald-400" />
                <input 
                  type="tel" 
                  placeholder="+998 90 123 45 67" 
                  value={locationData.phone}
                  onChange={e => handleLocationPhoneChange(e.target.value)}
                  className="modern-input-field"
                  required
                />
              </div>
            </div>

            <button type="submit" className="modern-auth-submit-btn">
              <span>Davom etish</span>
              <ArrowRight size={18} />
            </button>

            <div className="auth-location-bottom-prompt">
              <button
                type="button"
                className="auth-location-bluish-link back-link"
                onClick={() => {
                  setAuthMode('register');
                  setStep(1);
                  setErrorMsg('');
                }}
                title="Oddiy foydalanuvchi registratsiyasiga qaytish"
              >
                <ArrowLeft size={15} />
                <span>Oddiy foydalanuvchi sifatida ro'yxatdan o'tish</span>
              </button>
            </div>
          </form>
        )}

        {/* Joylashuv 2-bosqich: Asosiy rasm qo'yish (va Tashlab ketish) */}
        {authMode === 'location_register' && locationStep === 2 && (
          <div className="modern-auth-form location-photo-step-form">
            <div className="location-photo-prompt-box">
              <div className="photo-prompt-icon-wrap">
                <ImageIcon size={32} className="text-sky-400" />
              </div>
              <h3 className="photo-prompt-title">Joylashuvingiz uchun asosiy rasm qo'yib keting</h3>
              <p className="photo-prompt-subtitle">
                Shahobchangiz ko'rinishi yoki logotipini rasm sifatida yuklashingiz mumkin.
              </p>
            </div>

            {/* Rasm tanlash yoki preview */}
            <div className="location-photo-picker-area">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              {locationData.locationImage ? (
                <div className="location-photo-preview-wrap">
                  <img 
                    src={locationData.locationImage} 
                    alt="Joylashuv rasmi" 
                    className="location-photo-preview-img" 
                  />
                  <div className="photo-preview-overlay-actions">
                    <button 
                      type="button" 
                      className="change-photo-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      <span>Almashtirish</span>
                    </button>
                    <button 
                      type="button" 
                      className="remove-photo-btn"
                      onClick={() => setLocationData({ ...locationData, locationImage: null })}
                    >
                      <X size={14} />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="location-photo-upload-placeholder clickable"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-arrow-circle">
                    <Upload size={22} color="#38bdf8" />
                  </div>
                  <span className="upload-main-text">Rasm yuklash uchun bosing</span>
                  <span className="upload-sub-text">PNG, JPG, WEBP (maksimal 5MB)</span>
                </div>
              )}
            </div>

            {/* Pastki harakat tugmalari: Tashlab ketish va Tasdiqlash */}
            <div className="location-photo-actions-row">
              <button 
                type="button" 
                className="location-skip-action-btn"
                onClick={() => handleFinishLocationRegister(null)}
                title="Rasmsiz davom etish"
              >
                <SkipForward size={16} />
                <span>Tashlab ketish</span>
              </button>

              <button 
                type="button" 
                className="modern-auth-submit-btn flex-1"
                onClick={() => handleFinishLocationRegister(locationData.locationImage)}
              >
                <CheckCircle2 size={18} />
                <span>Tasdiqlash</span>
              </button>
            </div>

            <button 
              type="button" 
              className="location-step-back-btn"
              onClick={() => setLocationStep(1)}
            >
              ← Ma'lumotlarni o'zgartirish
            </button>
          </div>
        )}

        {/* ========================================================
            B) ODDIY RO'YXATDAN O'TISH - 1-BOSQICH: ISM, FAMILIYA, PAROL
            "Joylashuvingiz bormi?" savoli BUTKUL OLIB TASHLANGAN!
            ======================================================== */}
        {authMode === 'register' && step === 1 && (
          <form onSubmit={handleStep1Submit} className="modern-auth-form">
            <div className="modern-field-group">
              <label className="modern-field-label">Ismingiz *</label>
              <div className="modern-input-wrap">
                <User size={18} className="modern-input-icon" />
                <input 
                  type="text" 
                  placeholder="Masalan: Sardor" 
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value.replace(/[0-9]/g, '') })}
                  className="modern-input-field"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="modern-field-group">
              <label className="modern-field-label">Familiyangiz *</label>
              <div className="modern-input-wrap">
                <User size={18} className="modern-input-icon" />
                <input 
                  type="text" 
                  placeholder="Masalan: Rahimov" 
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value.replace(/[0-9]/g, '') })}
                  className="modern-input-field"
                  required
                />
              </div>
            </div>

            <div className="modern-field-group">
              <label className="modern-field-label">Parol yarating *</label>
              <div className="modern-input-wrap">
                <Lock size={18} className="modern-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kamida 4 ta belgi" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="modern-input-field"
                  required
                />
                <button 
                  type="button" 
                  className="modern-pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Parolni ko'rsatish/yashirish"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="modern-auth-submit-btn">
              <span>Davom etish</span>
              <ArrowRight size={18} />
            </button>

            {/* "Davom etish" tugmasining pastida: "Joylashuvingiz bormi?" */}
            <div className="auth-location-bottom-prompt">
              <button
                type="button"
                className="auth-location-bluish-link"
                onClick={() => {
                  setAuthMode('location_register');
                  setLocationStep(1);
                  setErrorMsg('');
                }}
                title="Joylashuvingiz bormi? Uni joylash uchun shu yerni bosing"
              >
                <MapPin size={15} />
                <span>Joylashuvingiz bormi?</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            C) ODDIY RO'YXATDAN O'TISH - 2-BOSQICH: TUG'ILGAN SANA VA TELEFON
            SMS KOD OLIB TASHLANDI! TELEFON KIRITGANDAN SO'NG REGISTRATSIYA TUGAYDI!
            ======================================================== */}
        {authMode === 'register' && step === 2 && (
          <form onSubmit={handleStep2Submit} className="modern-auth-form">
            <div className="modern-field-group">
              <label className="modern-field-label">Tug'ilgan sanangiz *</label>
              <div className="modern-dob-grid">
                <div className="modern-input-wrap">
                  <input 
                    type="number" 
                    placeholder="Kun" 
                    value={formData.bDay}
                    onChange={e => setFormData({ ...formData, bDay: e.target.value })}
                    min="1" 
                    max="31"
                    className="modern-input-field dob-input"
                    autoFocus
                    required
                  />
                </div>
                <div className="modern-input-wrap">
                  <input 
                    type="number" 
                    placeholder="Oy" 
                    value={formData.bMonth}
                    onChange={e => setFormData({ ...formData, bMonth: e.target.value })}
                    min="1" 
                    max="12"
                    className="modern-input-field dob-input"
                    required
                  />
                </div>
                <div className="modern-input-wrap" style={{ flex: 1.3 }}>
                  <input 
                    type="number" 
                    placeholder="Yil (1995)" 
                    value={formData.bYear}
                    onChange={e => setFormData({ ...formData, bYear: e.target.value })}
                    min="1900" 
                    max="2026"
                    className="modern-input-field dob-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modern-field-group">
              <label className="modern-field-label">Telefon raqamingiz *</label>
              <div className="modern-input-wrap">
                <Phone size={18} className="modern-input-icon text-sky-400" />
                <input 
                  type="tel" 
                  placeholder="+998 90 123 45 67" 
                  value={formData.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  className="modern-input-field"
                  required
                />
              </div>
            </div>

            <div className="modern-form-actions-row">
              <button 
                type="button" 
                className="modern-auth-back-action-btn"
                onClick={() => setStep(1)}
              >
                Orqaga
              </button>
              <button type="submit" className="modern-auth-submit-btn flex-1">
                <CheckCircle2 size={18} />
                <span>Ro'yxatdan o'tish</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            D) TIZIMGA KIRISH (LOGIN FORM)
            ======================================================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="modern-auth-form">
            <div className="modern-field-group">
              <label className="modern-field-label">Telefon raqam *</label>
              <div className="modern-input-wrap">
                <Phone size={18} className="modern-input-icon" />
                <input 
                  type="tel" 
                  placeholder="+998 90 123 45 67" 
                  value={loginPhone}
                  onChange={e => handleLoginPhoneChange(e.target.value)}
                  className="modern-input-field"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="modern-field-group">
              <label className="modern-field-label">Parolingiz *</label>
              <div className="modern-input-wrap">
                <Lock size={18} className="modern-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Parolingizni kiriting" 
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="modern-input-field"
                  required
                />
                <button 
                  type="button" 
                  className="modern-pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Parolni ko'rsatish/yashirish"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="modern-auth-submit-btn">
              <LogIn size={18} />
              <span>Tizimga kirish</span>
            </button>

            {/* Tezkor demo login tugmasi */}
            <div className="modern-quick-login-divider">
              <span>yoki</span>
            </div>

            <button 
              type="button" 
              className="modern-demo-user-btn"
              onClick={handleQuickDemoLogin}
            >
              <span>Demo foydalanuvchi bilan tezkor kirish</span>
            </button>
          </form>
        )}

        {/* FOOTER QISMI */}
        {authMode !== 'location_register' && (
          <div className="modern-auth-card-footer">
            {authMode === 'register' ? (
              <p>
                Akkauntingiz bormi?{' '}
                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                  }}
                >
                  Tizimga kiring
                </button>
              </p>
            ) : (
              <p>
                Hali ro'yxatdan o'tmaganmisiz?{' '}
                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => {
                    setAuthMode('register');
                    setStep(1);
                    setErrorMsg('');
                  }}
                >
                  Ro'yxatdan o'ting
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

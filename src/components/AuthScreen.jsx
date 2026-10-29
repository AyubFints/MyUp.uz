import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Phone, ArrowRight, CheckCircle2, AlertCircle, 
  Eye, EyeOff, LogIn, UserPlus, MapPin, Building2, Upload, 
  Image as ImageIcon, X, ArrowLeft, SkipForward
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

    let newUser = {
      id: 'usr_' + Date.now(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: formData.phone,
      birthDate: `${formData.bYear}-${String(formData.bMonth).padStart(2, '0')}-${String(formData.bDay).padStart(2, '0')}`,
      registeredAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.firstName}`,
      role: 'user',
      hasLocation: false, // Joylashuvi yo'q, oddiy foydalanuvchi
      registeredViaLocation: false,
      userProfileCompleted: true,
    };

    try {
      const res = await api.auth.register({
        phone: cleanPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
        hasLocation: false,
      });

      if (res.success && res.token && res.user) {
        localStorage.setItem('myup_token', res.token);
        newUser = {
          ...newUser,
          id: res.user.id,
          role: res.user.role || 'user',
          hasLocation: false,
        };
      }
    } catch (apiErr) {
      console.warn("PostgreSQL ga ro'yxatdan o'tkazishda xato (offline zaxira ishlatildi):", apiErr.message);
    }
    
    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
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
    if (!locationData.locationAddress.trim()) {
      setErrorMsg("Joylashuv manzilini kiriting!");
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
    const finalImage = chosenImage || locationData.locationImage || null;
    const locId = 'st_' + Date.now();
    const userId = 'usr_' + Date.now();

    // 1. Yangi joylashuv obyekti
    const newLocation = {
      id: locId,
      name: locationData.locationName.trim(),
      responsiblePerson: locationData.responsiblePerson.trim(),
      address: locationData.locationAddress.trim(),
      city: "Toshkent",
      phone: locationData.phone,
      isOpen: true,
      status: 'approved',
      isApproved: true,
      image: finalImage,
      images: finalImage ? [finalImage] : [],
      lat: 41.311081,
      lng: 69.240562,
      prices: { metan: '3800' },
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    // Mening joylashuvlarim (myStations) ga qo'shish
    try {
      const savedStations = localStorage.getItem('myup_my_stations');
      const list = savedStations ? JSON.parse(savedStations) : [];
      const updatedList = [newLocation, ...list.filter(s => s.id !== locId)];
      localStorage.setItem('myup_my_stations', JSON.stringify(updatedList));
    } catch (err) {
      console.error("Local joylashuv saqlash xatosi:", err);
    }

    // Backend PostgreSQL ga ham yuborish
    try {
      await api.stations.create({
        name: newLocation.name,
        address: newLocation.address,
        phone: newLocation.phone,
        isOpen: true,
        images: newLocation.images,
        prices: newLocation.prices,
        createdBy: userId,
      });
    } catch (apiErr) {
      console.warn("Backend shahobcha yaratish:", apiErr.message);
    }

    // 2. Yangi foydalanuvchi (Joylashuv egasi - hali shaxsiy user profile to'ldirilmagan)
    const newUser = {
      id: userId,
      role: 'business',
      hasLocation: true,
      registeredViaLocation: true, // "Joylashuv joylash" orqali ro'yxatdan o'tgan
      isLocationOnly: true, // Hali pastdagi oddiy user registratsiyasidan o'tmagan
      userProfileCompleted: false,
      firstName: '', // Oddiy user ma'lumotlari kiritilmagan
      lastName: '',
      locationName: locationData.locationName.trim(),
      responsiblePerson: locationData.responsiblePerson.trim(),
      locationAddress: locationData.locationAddress.trim(),
      locationPhone: locationData.phone,
      locationImage: finalImage,
      phoneNumber: locationData.phone,
      password: locationData.password,
      registeredAt: new Date().toISOString(),
      avatar: finalImage || null,
    };

    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onLoginSuccess(newUser, newLocation);
  };

  // ========================================================
  // TIZIMGA KIRISH (LOGIN)
  // ========================================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = loginPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Telefon raqamingizni to'liq kiriting!");
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setErrorMsg("Parol kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    // 1. PostgreSQL Backend API orqali tekshirish
    try {
      const res = await api.auth.login(loginPhone, loginPassword);
      if (res.success && res.token && res.user) {
        localStorage.setItem('myup_token', res.token);
        const loggedUser = {
          id: res.user.id,
          firstName: res.user.first_name || 'Foydalanuvchi',
          lastName: res.user.last_name || '',
          phoneNumber: res.user.phone || loginPhone,
          role: res.user.role || 'user',
          hasLocation: Boolean(res.user.has_location),
          bio: res.user.bio || '',
          avatar: res.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
          registeredAt: res.user.created_at || new Date().toISOString(),
        };
        localStorage.setItem('myup_user', JSON.stringify(loggedUser));
        onLoginSuccess(loggedUser);
        return;
      }
    } catch (apiErr) {
      console.warn("Backend login javobi:", apiErr.message);
      if (apiErr.message && !apiErr.message.includes('Failed to fetch') && !apiErr.message.includes('NetworkError')) {
        setErrorMsg(apiErr.message);
        return;
      }
    }

    // 2. Offline / local fallback rejim
    const saved = localStorage.getItem('myup_user');
    let userToLogin = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phoneNumber === loginPhone || parsed.locationPhone === loginPhone) {
          userToLogin = parsed;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!userToLogin) {
      userToLogin = {
        id: 'usr_' + Date.now(),
        firstName: 'Foydalanuvchi',
        lastName: '',
        phoneNumber: loginPhone,
        registeredAt: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
        role: 'user',
        hasLocation: false,
      };
      localStorage.setItem('myup_user', JSON.stringify(userToLogin));
    }

    onLoginSuccess(userToLogin);
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

        {/* LOGO VA HEADER */}
        <div className="modern-auth-header">
          <div className="modern-auth-brand-badge">
            <img 
              src="/amaps-logo.png" 
              alt="A-Maps Logo" 
              className="modern-auth-badge-logo" 
            />
            <span>A-Maps.uz</span>
          </div>

          <h2 className="modern-auth-title">
            {authMode === 'location_register'
              ? "Joylashuv joylash"
              : authMode === 'register'
              ? "Ro'yxatdan o'tish"
              : "Tizimga kirish"}
          </h2>
          <p className="modern-auth-subtitle">
            {authMode === 'location_register'
              ? (locationStep === 1 
                  ? "Joylashuvingiz ma'lumotlarini to'ldiring" 
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
            <AlertCircle size={18} className="error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================
            A) JOYLASHUV JOYLASh (LOCATION REGISTRATION) FORMASI
            1. Joylashuv nomi
            2. Mas'ul inson
            3. Joylashuv manzili
            4. Maxfiy parol
            5. Joylashuv asosiy telefon raqami
            6. Asosiy rasm qo'yish (va Tashlab ketish)
            ======================================================== */}
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

            {/* 3. Joylashuv manzili */}
            <div className="modern-field-group">
              <label className="modern-field-label">Joylashuv manzili *</label>
              <div className="modern-input-wrap">
                <MapPin size={18} className="modern-input-icon text-amber-400" />
                <input 
                  type="text" 
                  placeholder="Masalan: Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi" 
                  value={locationData.locationAddress}
                  onChange={e => setLocationData({ ...locationData, locationAddress: e.target.value })}
                  className="modern-input-field"
                  required
                />
              </div>
            </div>

            {/* 4. Maxfiy parol */}
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

import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Calendar, Phone, MessageSquare, ArrowRight, 
  CheckCircle2, AlertCircle, Sparkles, Eye, EyeOff, LogIn, UserPlus 
} from 'lucide-react';

export default function AuthScreen({ onLoginSuccess, isLight = false }) {
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [step, setStep] = useState(1); // 1: Ma'lumotlar, 2: Aloqa, 3: SMS
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Ro'yxatdan o'tish formasi
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    bDay: '',
    bMonth: '',
    bYear: '',
    phone: '+998 '
  });

  // Kirish (Login) formasi
  const [loginPhone, setLoginPhone] = useState('+998 ');
  const [loginPassword, setLoginPassword] = useState('');

  // OTP (SMS) holatlari
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showSmsToast, setShowSmsToast] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 3 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

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

  const handleLoginPhoneChange = (val) => {
    setLoginPhone(formatPhoneNumber(val));
  };

  // 1-qadamni tekshirish (Ism, Familiya, Parol)
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

  // 2-qadamni tekshirish (Sana va Telefon) -> SMS yuborish
  const handleStep2Submit = (e) => {
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

    // Yangi SMS kod generatsiya qilish
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpTimer(60);
    setStep(3);
    setShowSmsToast(true);
  };

  // 3-qadam: SMS kodni tasdiqlash
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg("SMS kodi noto'g'ri! Iltimos, qayta tekshiring.");
      return;
    }
    
    // Yangi foydalanuvchi yaratish
    const newUser = {
      id: 'usr_' + Date.now(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: formData.phone,
      birthDate: `${formData.bYear}-${String(formData.bMonth).padStart(2, '0')}-${String(formData.bDay).padStart(2, '0')}`,
      registeredAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.firstName}`,
    };
    
    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
  };

  // Tizimga kirish (Login)
  const handleLoginSubmit = (e) => {
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

    // Saqlangan profilni tekshirish yoki yangi ochish
    const saved = localStorage.getItem('myup_user');
    let userToLogin = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phoneNumber === loginPhone) {
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
            {authMode === 'register' ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
          </h2>
          <p className="modern-auth-subtitle">
            {authMode === 'register' 
              ? (step === 1 
                  ? "Ism, familiya va maxfiy parolingizni belgilang"
                  : step === 2 
                    ? "Tug'ilgan sana va telefon raqamingizni kiriting"
                    : "Telefoningizga yuborilgan tasdiqlash kodini kiriting")
              : "Telefon raqamingiz va parolingiz orqali profilingizga kiring"}
          </p>

          {/* REJIM ALMASHTIRGICH (Register / Login Tabs) */}
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

          {/* RO'YXATDAN O'TISH BOSQICHLARI (STEPPER) */}
          {authMode === 'register' && (
            <div className="modern-auth-stepper">
              <div className={`modern-step-node ${step >= 1 ? 'active' : ''}`}>
                <span className="step-circle">{step > 1 ? <CheckCircle2 size={14} /> : '1'}</span>
                <span className="step-title">Ma'lumot</span>
              </div>
              <div className={`modern-step-line ${step >= 2 ? 'active' : ''}`} />
              <div className={`modern-step-node ${step >= 2 ? 'active' : ''}`}>
                <span className="step-circle">{step > 2 ? <CheckCircle2 size={14} /> : '2'}</span>
                <span className="step-title">Aloqa</span>
              </div>
              <div className={`modern-step-line ${step >= 3 ? 'active' : ''}`} />
              <div className={`modern-step-node ${step >= 3 ? 'active' : ''}`}>
                <span className="step-circle">3</span>
                <span className="step-title">SMS Kod</span>
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

        {/* SIMULATED SMS TOAST BILDIRISHNOMASI (3-bosqichda avtomatik chiqadi) */}
        {showSmsToast && step === 3 && (
          <div className="modern-sms-toast">
            <div className="sms-toast-header">
              <div className="sms-toast-title">
                <MessageSquare size={15} />
                <span>Yangi SMS (A-Maps.uz)</span>
              </div>
              <span className="sms-toast-time">Hozirgina</span>
            </div>
            <p className="sms-toast-body">
              Sizning tasdiqlash kodingiz: <strong>{generatedOtp}</strong>. Hech kimga bermang!
            </p>
            <button 
              type="button" 
              className="sms-autofill-action"
              onClick={() => setOtpCode(generatedOtp)}
            >
              Kodni avtomatik to'ldirish
            </button>
          </div>
        )}

        {/* ========================================================
            A) RO'YXATDAN O'TISH - 1-BOSQICH: ISM, FAMILIYA, PAROL
            ======================================================== */}
        {authMode === 'register' && step === 1 && (
          <form onSubmit={handleStep1Submit} className="modern-auth-form">
            <div className="modern-field-group">
              <label className="modern-field-label">Ismingiz *</label>
              <div className="modern-input-wrap">
                <User size={18} className="modern-input-icon" />
                <input 
                  type="text" 
                  placeholder="Masalan: Pistonchi" 
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
                  placeholder="Masalan: Pistonchiyev" 
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
          </form>
        )}

        {/* ========================================================
            B) RO'YXATDAN O'TISH - 2-BOSQICH: TUG'ILGAN SANA VA TELEFON
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
                <Phone size={18} className="modern-input-icon" />
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
                <span>SMS kod olish</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            C) RO'YXATDAN O'TISH - 3-BOSQICH: SMS KODNI TASDIQLASH
            ======================================================== */}
        {authMode === 'register' && step === 3 && (
          <form onSubmit={handleVerifyOtp} className="modern-auth-form">
            <div className="modern-field-group">
              <label className="modern-field-label">
                SMS tasdiqlash kodi ({formData.phone}):
              </label>
              <div className="modern-input-wrap">
                <Lock size={18} className="modern-input-icon" />
                <input 
                  type="text" 
                  maxLength={6} 
                  placeholder="6 xonali SMS kod" 
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="modern-input-field otp-input"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="modern-resend-timer-box">
              {otpTimer > 0 ? (
                <span className="timer-text">Kodni qayta yuborish: <b>{otpTimer}s</b></span>
              ) : (
                <button 
                  type="button" 
                  className="resend-code-btn"
                  onClick={() => {
                    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(randomOtp);
                    setOtpTimer(60);
                    setShowSmsToast(true);
                  }}
                >
                  Kodni qayta yuborish
                </button>
              )}
            </div>

            <div className="modern-form-actions-row">
              <button 
                type="button" 
                className="modern-auth-back-action-btn"
                onClick={() => setStep(2)}
              >
                Orqaga
              </button>
              <button type="submit" className="modern-auth-submit-btn flex-1">
                <CheckCircle2 size={18} />
                <span>Tasdiqlash</span>
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
      </div>
    </div>
  );
}

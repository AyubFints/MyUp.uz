import React, { useState, useEffect } from 'react';
import { 
  X, User, Lock, Phone, Calendar, ShieldCheck, ArrowRight, ArrowLeft, 
  CheckCircle2, Eye, EyeOff, Sparkles, MessageSquare, AlertCircle
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [step, setStep] = useState(1); // 1: Name/Password, 2: DOB/Phone, 3: SMS OTP
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registration Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    birthDate: '',
    phoneNumber: '+998 ',
  });

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('+998 ');
  const [loginPassword, setLoginPassword] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('749215');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [simulatedSmsBanner, setSimulatedSmsBanner] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 3 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  if (!isOpen) return null;

  const handlePhoneChange = (val, isLogin = false) => {
    // Basic phone formatting for Uzbekistan: +998 (XX) XXX-XX-XX
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+998')) {
      cleaned = '+998' + cleaned.replace('+', '');
    }
    if (cleaned.length > 13) cleaned = cleaned.slice(0, 13);
    
    if (isLogin) {
      setLoginPhone(cleaned);
    } else {
      setFormData({ ...formData, phoneNumber: cleaned });
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.firstName.trim()) {
      setErrorMsg('Iltimos, ismingizni kiriting!');
      return;
    }
    if (!formData.lastName.trim()) {
      setErrorMsg('Iltimos, familiyangizni kiriting!');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Parol kamida 6 ta belgidan iborat bo‘lishi lozim!');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.birthDate) {
      setErrorMsg("Tug'ilgan sanangizni tanlang!");
      return;
    }
    const cleanPhone = formData.phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Telefon raqamingizni to'liq kiriting (+998 XX XXX XX XX)!");
      return;
    }
    
    // Generate random 6-digit OTP for SMS simulation
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpTimer(60);
    setCanResend(false);
    setStep(3);
    
    // Show simulated SMS notification banner after 1s
    setTimeout(() => {
      setSimulatedSmsBanner(true);
    }, 800);
  };

  const handleResendSms = () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpTimer(60);
    setCanResend(false);
    setSimulatedSmsBanner(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg("Kiritilgan SMS kodi noto'g'ri. Iltimos qayta tekshiring!");
      return;
    }

    // Save user to LocalStorage
    const newUser = {
      id: 'usr_' + Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      birthDate: formData.birthDate,
      registeredAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.firstName}`,
    };

    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
    onClose();
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = loginPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Telefon raqamingizni to'liq kiriting!");
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Parolni kiriting!');
      return;
    }

    // Existing user or quick login demo
    const existingUser = localStorage.getItem('myup_user') 
      ? JSON.parse(localStorage.getItem('myup_user'))
      : {
          id: 'usr_demo',
          firstName: 'Azizbek',
          lastName: 'Rahimov',
          phoneNumber: loginPhone,
          birthDate: '1998-05-14',
          registeredAt: new Date().toISOString(),
        };

    localStorage.setItem('myup_user', JSON.stringify(existingUser));
    onLoginSuccess(existingUser);
    onClose();
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        {/* Background ambient lighting */}
        <div className="auth-ambient-glow"></div>

        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose} aria-label="Yopish">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Sparkles size={20} className="text-cyan-400" />
            <span>MyUp.uz</span>
          </div>
          <h2>
            {authMode === 'login' ? 'Tizimga kirish' : 'Ro‘yxatdan o‘tish'}
          </h2>
          <p className="auth-subtitle">
            {authMode === 'login' 
              ? 'Telefon raqam va parolingiz orqali profilingizga kiring'
              : step === 1 
                ? 'Ism, familiya va xavfsiz parolingizni belgilang'
                : step === 2 
                  ? 'Tug‘ilgan sana va telefon raqamingizni kiriting'
                  : 'Telefoningizga yuborilgan SMS kodini kiriting'}
          </p>

          {/* Stepper indicator for registration */}
          {authMode === 'register' && (
            <div className="auth-stepper">
              <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                <span className="step-num">{step > 1 ? <CheckCircle2 size={14} /> : '1'}</span>
                <span className="step-label">Ma'lumotlar</span>
              </div>
              <div className={`step-divider ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                <span className="step-num">{step > 2 ? <CheckCircle2 size={14} /> : '2'}</span>
                <span className="step-label">Aloqa</span>
              </div>
              <div className={`step-divider ${step >= 3 ? 'active' : ''}`}></div>
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span className="step-label">SMS Kod</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="auth-error-badge">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Simulated incoming SMS Toast Notification */}
        {simulatedSmsBanner && step === 3 && (
          <div className="simulated-sms-banner">
            <div className="sms-banner-header">
              <div className="sms-banner-title">
                <MessageSquare size={16} />
                <span>Yangi SMS (MyUp.uz)</span>
              </div>
              <span className="sms-banner-time">Hozirgina</span>
            </div>
            <p className="sms-banner-text">
              Sizning tasdiqlash kodingiz: <strong>{generatedOtp}</strong>. Hech kimga bermang!
            </p>
            <button 
              type="button" 
              className="sms-auto-fill-btn"
              onClick={() => setOtpCode(generatedOtp)}
            >
              Kodni avtomatik to'ldirish
            </button>
          </div>
        )}

        {/* REGISTRATION FORM - STEP 1 */}
        {authMode === 'register' && step === 1 && (
          <form onSubmit={handleStep1Submit} className="auth-form">
            <div className="form-group">
              <label>Ismingiz *</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Masalan: Sardor"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Familiyangiz *</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Masalan: Karimov"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Xavfsiz parol *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Kamida 6 ta belgi"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="input-hint">Ismlar bir xil bo'lishi mumkin, ammo parol mustahkam bo'lsin.</span>
            </div>

            <button type="submit" className="auth-primary-btn">
              <span>Keyingisi</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* REGISTRATION FORM - STEP 2 */}
        {authMode === 'register' && step === 2 && (
          <form onSubmit={handleStep2Submit} className="auth-form">
            <div className="form-group">
              <label>Tug'ilgan sana *</label>
              <div className="input-icon-wrapper">
                <Calendar size={18} className="input-icon" />
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Telefon raqam (SMS yuboriladi) *</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                />
              </div>
              <span className="input-hint">Raqamingizga 6 xonali tasdiqlash kodi jo'natiladi.</span>
            </div>

            <div className="auth-buttons-row">
              <button 
                type="button" 
                className="auth-secondary-btn"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={18} />
                <span>Orqaga</span>
              </button>
              <button type="submit" className="auth-primary-btn flex-1">
                <span>SMS kod yuborish</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* REGISTRATION FORM - STEP 3 (SMS OTP) */}
        {authMode === 'register' && step === 3 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <label>6 xonali SMS kodni kiriting *</label>
              <div className="input-icon-wrapper">
                <ShieldCheck size={18} className="input-icon" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="749215"
                  className="otp-input-field"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="otp-timer-box">
                {otpTimer > 0 ? (
                  <span>Kodni qayta yuborish: <strong>{otpTimer}s</strong></span>
                ) : (
                  <button 
                    type="button" 
                    className="resend-sms-link" 
                    onClick={handleResendSms}
                  >
                    Kodni qayta jo'natish
                  </button>
                )}
              </div>
            </div>

            <div className="auth-buttons-row">
              <button 
                type="button" 
                className="auth-secondary-btn"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={18} />
                <span>Orqaga</span>
              </button>
              <button type="submit" className="auth-primary-btn flex-1">
                <CheckCircle2 size={18} />
                <span>Tasdiqlash va Kirish</span>
              </button>
            </div>
          </form>
        )}

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label>Telefon raqamingiz</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={loginPhone}
                  onChange={(e) => handlePhoneChange(e.target.value, true)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Parolingiz</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parolingizni kiriting"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-primary-btn">
              <span>Tizimga kirish</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Switch mode footer */}
        <div className="auth-footer">
          {authMode === 'register' ? (
            <p>
              Profilingiz bormi?{' '}
              <button 
                type="button" 
                className="auth-switch-link"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                }}
              >
                Tizimga kirish
              </button>
            </p>
          ) : (
            <p>
              Profilingiz yo'qmi?{' '}
              <button 
                type="button" 
                className="auth-switch-link"
                onClick={() => {
                  setAuthMode('register');
                  setStep(1);
                  setErrorMsg('');
                }}
              >
                Ro'yxatdan o'tish
              </button>
            </p>
          )}

          <button 
            type="button" 
            className="guest-mode-btn"
            onClick={onClose}
          >
            Mehmon sifatida davom etish
          </button>
        </div>
      </div>
    </div>
  );
}

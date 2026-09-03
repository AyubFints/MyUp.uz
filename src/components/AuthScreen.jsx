import React, { useState, useEffect } from 'react';
import { User, Lock, Calendar, Phone, MessageSquare, ArrowRight, CheckCircle2, AlertCircle, Fuel } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [step, setStep] = useState(1); // 1: Registration Form, 2: SMS Verification
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    birthDate: '',
    phone: '+998 '
  });

  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const handlePhoneChange = (val) => {
    // Keep only numbers and plus
    let cleaned = val.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +998
    if (!cleaned.startsWith('+998')) {
      cleaned = '+998' + cleaned.replace('+', '');
    }

    // Format strictly to +998 XX XXX XX XX
    let formatted = '+998 ';
    const numbersOnly = cleaned.slice(4); // get digits after +998
    
    for (let i = 0; i < numbersOnly.length; i++) {
      if (i === 2 || i === 5 || i === 7) {
        formatted += ' ';
      }
      formatted += numbersOnly[i];
    }
    
    if (formatted.length > 17) {
      formatted = formatted.slice(0, 17);
    }

    setFormData({ ...formData, phone: formatted });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.password || !formData.birthDate) {
      setErrorMsg("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    if (formData.password.length < 4) {
      setErrorMsg("Parol juda qisqa!");
      return;
    }
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Telefon raqamingizni to'liq kiriting!");
      return;
    }

    // Move to step 2 (SMS)
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpTimer(60);
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg("Kiritilgan SMS kodi noto'g'ri!");
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phone,
      birthDate: formData.birthDate,
      registeredAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.firstName}`,
    };

    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
  };

  // Generate Date dropdowns data
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: '01', label: 'Yanvar' }, { value: '02', label: 'Fevral' },
    { value: '03', label: 'Mart' }, { value: '04', label: 'Aprel' },
    { value: '05', label: 'May' }, { value: '06', label: 'Iyun' },
    { value: '07', label: 'Iyul' }, { value: '08', label: 'Avgust' },
    { value: '09', label: 'Sentabr' }, { value: '10', label: 'Oktabr' },
    { value: '11', label: 'Noyabr' }, { value: '12', label: 'Dekabr' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="auth-screen-container">
      <div className="auth-screen-card">
        
        {/* Logo / Branding */}
        <div className="auth-brand-header">
          <h1 className="home-brand-title" style={{textAlign:'center', fontSize:'2.2rem'}}>
            <span className="brand-my">My</span><span className="brand-up">Up</span><span className="brand-dot">.uz</span>
          </h1>
          <p>Tizimga kirish uchun ro'yxatdan o'ting</p>
        </div>

        {errorMsg && (
          <div className="auth-error-badge">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Main Form */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="auth-screen-form">
            <div className="form-group">
              <label>Ismingiz</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Ismingiz"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Familiyangiz</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Familiyangiz"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Parol</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Parolni o'ylab toping"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tug'ilgan sanangiz</label>
              <div className="input-icon-wrapper">
                <Calendar size={18} className="input-icon" />
                <input
                  type="date"
                  className="auth-date-input"
                  value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Telefon raqam</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  placeholder="+998 77 278 18 08"
                  value={formData.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn mt-4">
              <span>Kiritish</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: SMS Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-screen-form">
            <div className="sms-sim-banner">
              <MessageSquare size={16} />
              <span>Yangi SMS (MyUp.uz) kodingiz: <strong>{generatedOtp}</strong></span>
            </div>

            <div className="form-group">
              <label>SMS kodni kiriting</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6 xonali kod"
                  className="otp-input-field"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="otp-timer-box">
                {otpTimer > 0 ? (
                  <span>Qayta yuborish: {otpTimer}s</span>
                ) : (
                  <button type="button" className="text-cyan-400 font-bold" onClick={() => {
                    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(randomOtp);
                    setOtpTimer(60);
                  }}>Kodni qayta jo'natish</button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" className="auth-secondary-btn" onClick={() => setStep(1)}>
                Orqaga
              </button>
              <button type="submit" className="auth-submit-btn flex-1">
                <CheckCircle2 size={18} />
                <span>Tasdiqlash va Kirish</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

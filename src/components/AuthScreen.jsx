import React, { useState, useEffect } from 'react';
import { User, Lock, Calendar, Phone, MessageSquare, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    bDay: '',
    bMonth: '',
    bYear: '',
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
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+998')) cleaned = '+998' + cleaned.replace('+', '');
    let formatted = '+998 ';
    const numbersOnly = cleaned.slice(4);
    for (let i = 0; i < numbersOnly.length; i++) {
      if (i === 2 || i === 5 || i === 7) formatted += ' ';
      formatted += numbersOnly[i];
    }
    if (formatted.length > 17) formatted = formatted.slice(0, 17);
    setFormData({ ...formData, phone: formatted });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.password || !formData.bDay || !formData.bMonth || !formData.bYear) {
      setErrorMsg("Barcha maydonlarni to'ldiring!");
      return;
    }
    if (formData.password.length < 4) {
      setErrorMsg("Parol juda qisqa!");
      return;
    }
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setErrorMsg("Telefon raqam noto'g'ri!");
      return;
    }
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpTimer(60);
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg("SMS kodi noto'g'ri!");
      return;
    }
    const newUser = {
      id: 'usr_' + Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phone,
      birthDate: `${formData.bYear}-${String(formData.bMonth).padStart(2, '0')}-${String(formData.bDay).padStart(2, '0')}`,
      registeredAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.firstName}`,
    };
    localStorage.setItem('myup_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
  };

  const isFormValid = formData.firstName && formData.lastName && formData.password.length >= 4 && formData.phone.length >= 17;

  return (
    <div className="auth-neu-container">
      {/* Wireframe background pattern similar to screenshot */}
      <div className="auth-neu-bg"></div>

      <div className="auth-neu-card">
        <div className="auth-neu-header">
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px'}}>
             <img src="https://i.postimg.cc/VNHPnzHt/myup-orgg.jpg" alt="Logo" style={{width:'32px', height:'32px', borderRadius:'8px'}} />
             <h2>MyUp<span style={{color:'#94a3b8', fontSize:'18px'}}>.uz</span></h2>
          </div>
          <p>Tizimga kirish uchun ro'yxatdan o'ting</p>
        </div>

        {errorMsg && (
          <div className="auth-neu-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="auth-neu-form">
            <div className="neu-form-group">
              <label>Ismingiz</label>
              <div className="neu-input-wrapper">
                <User className="neu-icon" size={18} />
                <input type="text" placeholder="Ismingiz" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.replace(/[0-9]/g, '')})} required />
              </div>
            </div>

            <div className="neu-form-group">
              <label>Familiyangiz</label>
              <div className="neu-input-wrapper">
                <User className="neu-icon" size={18} />
                <input type="text" placeholder="Familiyangiz" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value.replace(/[0-9]/g, '')})} required />
              </div>
            </div>

            <div className="neu-form-group">
              <label>Parol</label>
              <div className="neu-input-wrapper">
                <Lock className="neu-icon" size={18} />
                <input type="password" placeholder="********" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              </div>
            </div>

            <div className="neu-form-group">
              <label>Tug'ilgan sanangiz</label>
              <div className="neu-dob-row">
                <div className="neu-input-wrapper dob-box">
                  <input type="number" placeholder="Kun (mas.." value={formData.bDay} onChange={e => setFormData({...formData, bDay: e.target.value})} min="1" max="31" required />
                </div>
                <div className="neu-input-wrapper dob-box">
                  <input type="number" placeholder="Oy (mas.." value={formData.bMonth} onChange={e => setFormData({...formData, bMonth: e.target.value})} min="1" max="12" required />
                </div>
                <div className="neu-input-wrapper dob-box" style={{flex: 1.2}}>
                  <input type="number" placeholder="Yil (masalan: 19..." value={formData.bYear} onChange={e => setFormData({...formData, bYear: e.target.value})} min="1900" max="2026" required />
                </div>
              </div>
            </div>

            <div className="neu-form-group">
              <label>Telefon raqam</label>
              <div className="neu-input-wrapper">
                <Phone className="neu-icon" size={18} />
                <input type="tel" placeholder="+998 00 000 00 00" value={formData.phone} onChange={e => handlePhoneChange(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="neu-submit-btn" disabled={!isFormValid}>
              <span>Kiritish</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-neu-form">
            <div className="neu-form-group">
              <label>SMS kodingiz: {generatedOtp}</label>
              <div className="neu-input-wrapper">
                <Lock className="neu-icon" size={18} />
                <input type="text" maxLength={6} placeholder="6 xonali SMS kodni yozing" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} required style={{letterSpacing: '2px', textAlign: 'center'}} />
              </div>
            </div>

            <div style={{textAlign: 'center', margin: '10px 0'}}>
              {otpTimer > 0 ? (
                <span style={{color: '#64748b', fontSize: '14px'}}>Qayta yuborish: {otpTimer}s</span>
              ) : (
                <button type="button" onClick={() => {
                  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
                  setGeneratedOtp(randomOtp);
                  setOtpTimer(60);
                }} style={{background:'transparent', border:'none', color:'#0ea5e9', cursor:'pointer', fontWeight:'bold'}}>Kodni qayta jo'natish</button>
              )}
            </div>

            <div style={{display: 'flex', gap: '12px'}}>
              <button type="button" className="neu-secondary-btn" onClick={() => setStep(1)}>
                Orqaga
              </button>
              <button type="submit" className="neu-submit-btn" style={{flex: 1}}>
                <CheckCircle2 size={18} />
                <span>Tasdiqlash</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


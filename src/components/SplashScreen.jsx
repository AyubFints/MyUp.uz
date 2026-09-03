import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    // 1.5 soniyadan keyin "kattalashib yaqinlashish" fazasiga o'tadi
    const scaleTimer = setTimeout(() => {
      setPhase('scaling');
    }, 1500);

    // 3 soniyadan keyin tugatadi
    const finishTimer = setTimeout(() => {
      setPhase('exiting');
      setTimeout(onComplete, 400); // 400ms fade-out uchun
    }, 3000);

    return () => {
      clearTimeout(scaleTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${phase === 'exiting' ? 'fade-out' : ''}`}>
      {/* Orqa fondagi harakatlanuvchi katta shakllar */}
      <div className="splash-shape shape-1"></div>
      <div className="splash-shape shape-2"></div>
      <div className="splash-shape shape-3"></div>
      <div className="splash-shape shape-4"></div>
      <div className="splash-shape shape-5"></div>
      
      <div className="splash-content">
        {/* Yozuv animatsiyasi */}
        <div className={`splash-logo ${phase === 'scaling' ? 'scale-up' : 'bounce-in'}`}>
          <span className="splash-brand-my">My</span>
          <span className="splash-brand-up">Up</span>
          <span className="splash-brand-dot">.uz</span>
        </div>
        
        {/* Aylanuvchi nuqtalar */}
        <div className="splash-loader">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
}

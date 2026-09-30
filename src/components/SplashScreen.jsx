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
      {/* Blurred background logo */}
      <div className="splash-background-image" style={{ backgroundImage: 'url(https://i.postimg.cc/VNHPnzHt/myup-orgg.jpg)' }}></div>
      
      {/* Orqa fondagi harakatlanuvchi katta shakllar */}
      <div className="splash-shape shape-1"></div>
      <div className="splash-shape shape-2"></div>
      <div className="splash-shape shape-3"></div>
      <div className="splash-shape shape-4"></div>
      <div className="splash-shape shape-5"></div>
      
      <div className="splash-content" style={{ zIndex: 2, position: 'relative' }}>
        {/* Yozuv animatsiyasi */}
        <div className={`splash-logo ${phase === 'scaling' ? 'scale-up' : 'bounce-in'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <img src="https://i.postimg.cc/VNHPnzHt/myup-orgg.jpg" alt="MyUp Logo" className="brand-logo-icon" style={{ width: '72px', height: '72px', borderRadius: '16px' }} />
          <div>
            <span className="splash-brand-my">My</span>
            <span className="splash-brand-up">Up</span>
            <span className="splash-brand-dot">.uz</span>
          </div>
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

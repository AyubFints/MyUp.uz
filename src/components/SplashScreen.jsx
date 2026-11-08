import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  // Fazalar: 'center' (markazda erkin suzadi) -> 'docked' (sekin chapga surilib, yozuvlar silliq ochiladi) -> 'zooming' (katta bo'lib dasturga o'tadi)
  const [phase, setPhase] = useState('center');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasFinishedRef = useRef(false);

  const safeComplete = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (typeof onCompleteRef.current === 'function') {
      onCompleteRef.current();
    }
  };

  useEffect(() => {
    // 1. Dastlab rasm markazda salobatli va erkin suzadi, 1.25 soniyada sekin va mayin chapga surilishni boshlaydi
    const dockTimer = setTimeout(() => {
      setPhase('docked');
    }, 1250);

    // 2. 2.9 soniyada brend bloki butun ekran bo'ylab bitta katta bo'lib (portal zoom) kengayib dasturga kirib ketadi
    const zoomTimer = setTimeout(() => {
      setPhase('zooming');
    }, 2900);

    // 3. 3.55 soniyada silliq ravishda dasturga o'tkazadi
    const finishTimer = setTimeout(() => {
      safeComplete();
    }, 3550);

    // Favqulodda xavfsizlik (telefon qotib qolmasligi uchun)
    const emergencyTimer = setTimeout(() => {
      safeComplete();
    }, 4200);

    return () => {
      clearTimeout(dockTimer);
      clearTimeout(zoomTimer);
      clearTimeout(finishTimer);
      clearTimeout(emergencyTimer);
    };
  }, []);

  // Ekranni bir marta bosganda tezkor dasturga o'tish (Skip)
  const handleFastSkip = () => {
    setPhase('zooming');
    setTimeout(() => {
      safeComplete();
    }, 200);
  };

  return (
    <div
      className={`splash-cinematic-screen ${phase === 'zooming' ? 'is-zooming' : ''}`}
      onClick={handleFastSkip}
      role="button"
      tabIndex={0}
      title="Dasturga tezkor o'tish uchun bosing"
    >
      {/* 1. Orqa fon: Chuqur qora va to'lqinlanuvchi to'q ko'k nurlar */}
      <div className="splash-ambient-bg">
        <div className="splash-dark-overlay" />
        <div className="splash-deep-blue-glow glow-center" />
        <div className="splash-deep-blue-glow glow-bottom" />
        <div className="splash-deep-blue-glow glow-orbital" />
        <div className="splash-grid-mesh" />
      </div>

      {/* 2. Asosiy Animatsion Brend Sahnasi */}
      <div className={`splash-brand-stage stage-${phase}`}>
        {/* Metallik Uchburchak Emblem Logo */}
        <div className="splash-emblem-wrap">
          <div className="splash-emblem-glow-behind" />
          <div className="splash-emblem-neon-ring" />
          {/* Metall yuzasidagi yaltiroq yorug'lik to'lqini */}
          <div className="splash-emblem-sheen" />
          <img
            src="/ax-splash-logo.jpg"
            alt="AX-Map Emblem"
            className="splash-emblem-img"
          />
        </div>

        {/* Sekin va mayin surilganda ochiladigan matnlar bloki */}
        <div className="splash-text-lockup">
          {/* AX (To'q ko'k rangda, neon jilosi bilan) */}
          <div className="splash-title-ax">
            <span>AX</span>
            <div className="splash-ax-glow-underline" />
          </div>

          {/* Pastida MAP */}
          <div className="splash-title-map">
            <span className="map-text">MAP</span>
            <span className="map-dot">.uz</span>
          </div>

          {/* Nozik shior */}
          <div className="splash-sub-caption">AQLLI NAVIGATSIYA & METAN</div>
        </div>
      </div>

      {/* 3. Pastdagi nozik yuklanish chizig'i (sekin, ravon to'ladi) */}
      <div className="splash-cinematic-bottom">
        <div className="splash-cinematic-track">
          <div className="splash-cinematic-progress" />
        </div>
      </div>
    </div>
  );
}

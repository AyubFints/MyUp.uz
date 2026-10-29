import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sparkles, Play } from 'lucide-react';

function isVideoUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.mov') ||
    lower.includes('video') ||
    lower.startsWith('data:video/')
  );
}

/**
 * 3D Qavatdagi alohida video slayd:
 * Hech qanday qora ekran bo'lmaydi - 1-video o'sha holatida aylanib chiqib ketadi,
 * 2-video esa o'sha zahoti aylanib kirib keladi!
 */
function DesktopAdSlideItem({ item, isActive, isPrev, isSingle, onEnded, onSelect, onClick }) {
  const videoRef = useRef(null);
  const mediaUrl = item?.video_url || item?.media_url || item?.imageUrl || '';
  const isVideo = isVideoUrl(mediaUrl);

  // Har safar reklama ekranda faol bo'lib ko'ringanda ko'rishlar sonini oshirish
  useEffect(() => {
    if (!item?.id || !isActive) return;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiBase}/ads/${item.id}/view`, { method: 'POST' }).catch(() => {});
  }, [item?.id, isActive]);

  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } else {
      // Faol bo'lmaganda videoni to'xtatib turadi
      videoRef.current.pause();
    }
  }, [isActive, isVideo]);

  return (
    <div
      className={`ad-3d-slide ${isActive ? 'is-active' : ''} ${isPrev ? 'is-prev' : ''}`}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay={isActive}
          loop={isSingle}
          muted
          playsInline
          onEnded={isActive ? onEnded : undefined}
          onError={isActive ? onEnded : undefined}
          className="side-ad-media-bg"
        />
      ) : (
        <img
          src={mediaUrl}
          alt={item.title || "Reklama"}
          className="side-ad-media-bg"
        />
      )}
      <div className="side-ad-media-overlay" />

      <div className="side-video-bottom-content">
        <div className="side-video-text-box">
          <h4 className="video-ad-title">{item.title}</h4>
          {item.description && (
            <p className="video-ad-desc">{item.description}</p>
          )}
        </div>

        <div className="side-video-bottom-bar" style={{ marginTop: '6px' }}>
          <button className="side-video-cta" onClick={() => onClick(item)}>
            {item?.target_link ? "Batafsil ma'lumot" : "Bog'lanish"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop Side Video Ad Banner:
 * Orada qora joy bo'lmasdan, 3D aylanma holatda almashadi
 */
export function DesktopSideBanner({ ads = [], ad = null, side = 'left', customClass = '' }) {
  const playlist = useMemo(() => {
    const rawList = Array.isArray(ads) && ads.length > 0 ? ads : (ad ? [ad] : []);
    return rawList.filter(item => Boolean(item && (item.video_url || item.media_url || item.imageUrl)));
  }, [ads, ad]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);

  const safeIndex = playlist.length > 0 ? (currentIndex % playlist.length) : 0;
  const currentAd = playlist[safeIndex] || null;
  const hasAd = Boolean(currentAd);
  const isVideo = isVideoUrl(currentAd?.video_url || currentAd?.media_url || currentAd?.imageUrl);

  // Keyingi reklamaga sekin 3D aylanma o'tish (hech qanday qora uzilishsiz)
  const handleNext = useCallback(() => {
    if (playlist.length <= 1) return;
    setPrevIndex(safeIndex);
    setCurrentIndex(prev => (prev + 1) % playlist.length);
  }, [playlist.length, safeIndex]);

  const handleSelect = (idx) => {
    if (idx === safeIndex || playlist.length <= 1) return;
    setPrevIndex(safeIndex);
    setCurrentIndex(idx);
  };

  // Rasm bo'lsa 5 soniya kutib keyingisiga aylanadi
  useEffect(() => {
    if (playlist.length <= 1 || isVideo || !hasAd) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [safeIndex, isVideo, playlist.length, hasAd, handleNext]);

  const handleClick = (item) => {
    const target = item || currentAd;
    if (!target) return;

    if (target.id) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiBase}/ads/${target.id}/click`, { method: 'POST' }).catch(() => {});
    }

    if (target.target_link) {
      window.open(target.target_link, '_blank');
    } else {
      alert("Reklama berish uchun: @amaps_support");
    }
  };

  return (
    <aside className={`profile-side-video-banner ${side}-banner ${customClass}`}>
      <div className="side-banner-inner">
        <div className="side-banner-tag">
          <Sparkles size={13} />
          <span>{hasAd ? "Hamkor Reklamasi" : "Reklama"}</span>
          {playlist.length > 1 && (
            <span className="side-banner-count-badge" title="${playlist.length} ta reklama navbat bilan aylanmoqda">
              {safeIndex + 1}/{playlist.length}
            </span>
          )}
        </div>

        <div className={`side-video-box ${hasAd ? 'has-ad-playing' : ''}`}>
          {hasAd ? (
            <div className="side-video-3d-stage">
              {/* Bir nechta reklama bo'lganda ko'rsatkich nuqtalari */}
              {playlist.length > 1 && (
                <div className="side-ad-indicators" title="Reklamani tanlash">
                  {playlist.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      type="button"
                      className={`side-ad-dot ${idx === safeIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(idx);
                      }}
                      aria-label={`Reklama ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Barcha videolar 3D qavatlarda tayyor turadi. 
                  1-video qora bo'lib o'chmaydi, aylanib chiqadi va 2-video aylanib kiradi! */}
              {playlist.map((item, idx) => (
                <DesktopAdSlideItem
                  key={item.id || idx}
                  item={item}
                  isActive={idx === safeIndex}
                  isPrev={idx === prevIndex && playlist.length > 1}
                  isSingle={playlist.length === 1}
                  onEnded={handleNext}
                  onClick={handleClick}
                />
              ))}
            </div>
          ) : (
            /* Reklama yo'q holatda (placeholder) */
            <>
              <div className="side-video-center-content">
                <div className="video-play-button-ring" onClick={() => handleClick(null)}>
                  <div className="video-play-pulse"></div>
                  <Play size={24} className="video-play-icon" fill="currentColor" />
                </div>
                <h4 className="video-ad-title">
                  Bu yerda sizning reklamangiz bo'lishi mumkin
                </h4>
                <p className="video-ad-desc">
                  A-Maps ilovasida minglab faol haydovchilarga o'z biznesingizni video orqali taniting
                </p>
              </div>

              <div className="side-video-bottom-bar">
                <button className="side-video-cta" onClick={() => handleClick(null)}>
                  Reklama berish
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * Mobil banner uchun ham aynan shunday uzilishsiz silliq almashuv
 */
export function MobileAdBanner({ ads = [], ad = null }) {
  const playlist = useMemo(() => {
    const rawList = Array.isArray(ads) && ads.length > 0 ? ads : (ad ? [ad] : []);
    return rawList.filter(item => Boolean(item && (item.video_url || item.media_url || item.imageUrl)));
  }, [ads, ad]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);

  const safeIndex = playlist.length > 0 ? (currentIndex % playlist.length) : 0;
  const currentAd = playlist[safeIndex] || null;

  const handleNext = useCallback(() => {
    if (playlist.length <= 1) return;
    setPrevIndex(safeIndex);
    setCurrentIndex(prev => (prev + 1) % playlist.length);
  }, [playlist.length, safeIndex]);

  const handleSelect = (idx) => {
    if (idx === safeIndex || playlist.length <= 1) return;
    setPrevIndex(safeIndex);
    setCurrentIndex(idx);
  };

  const isVideo = isVideoUrl(currentAd?.video_url || currentAd?.media_url || currentAd?.imageUrl);

  useEffect(() => {
    if (playlist.length <= 1 || isVideo || !currentAd) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [safeIndex, isVideo, playlist.length, currentAd, handleNext]);

  // Mobil reklamada ko'rishlar sonini oshirish
  useEffect(() => {
    if (!currentAd?.id) return;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiBase}/ads/${currentAd.id}/view`, { method: 'POST' }).catch(() => {});
  }, [currentAd?.id, safeIndex]);

  if (!currentAd) return null;

  const handleClick = (item) => {
    const target = item || currentAd;
    if (!target) return;

    if (target.id) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiBase}/ads/${target.id}/click`, { method: 'POST' }).catch(() => {});
    }

    if (target.target_link) {
      window.open(target.target_link, '_blank');
    } else {
      alert("Reklama berish uchun: @amaps_support");
    }
  };

  return (
    <div className="mobile-ad-banner-box">
      <div className="mobile-ad-header">
        <span className="side-banner-tag">
          <Sparkles size={12} /> Hamkor Reklamasi
          {playlist.length > 1 && (
            <span className="side-banner-count-badge">
              {safeIndex + 1}/{playlist.length}
            </span>
          )}
        </span>
        {playlist.length > 1 && (
          <div className="mobile-ad-indicators">
            {playlist.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                className={`mobile-ad-dot ${idx === safeIndex ? 'active' : ''}`}
                onClick={() => handleSelect(idx)}
                aria-label={`Reklama ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mobile-ad-content-stage">
        {playlist.map((item, idx) => {
          const isActive = idx === safeIndex;
          const isPrev = idx === prevIndex && playlist.length > 1;
          const mediaUrl = item?.video_url || item?.media_url || item?.imageUrl || '';
          const isVid = isVideoUrl(mediaUrl);

          return (
            <div
              key={item.id || idx}
              className={`mobile-ad-slide ${isActive ? 'is-active' : ''} ${isPrev ? 'is-prev' : ''}`}
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
            >
              <div className="mobile-ad-content">
                {mediaUrl && (
                  <div className="mobile-ad-media-wrap">
                    {isVid ? (
                      <video
                        src={mediaUrl}
                        autoPlay={isActive}
                        loop={playlist.length === 1}
                        muted
                        playsInline
                        onEnded={isActive ? handleNext : undefined}
                        onError={isActive ? handleNext : undefined}
                        className="mobile-ad-media"
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={item.title || "Reklama"}
                        className="mobile-ad-media"
                      />
                    )}
                  </div>
                )}
                <div className="mobile-ad-info">
                  <h4 className="mobile-ad-title">{item.title}</h4>
                  {item.description && <p className="mobile-ad-desc">{item.description}</p>}
                  <button className="mobile-ad-cta" onClick={() => handleClick(item)}>
                    {item.target_link ? "Batafsil ma'lumot" : "Reklama berish"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Fuel, ArrowRight, Megaphone, Sparkles, Zap, X, Phone, Send, Image as ImageIcon } from 'lucide-react';

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

function formatTelUri(phone) {
  if (!phone) return 'tel:+998901234567';
  let cleaned = phone.toString().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('998')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+998' + cleaned;
    }
  }
  return `tel:${cleaned}`;
}

function getInitials(name) {
  if (!name) return 'AX';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

/**
 * Reklama bosilishini (Click) PostgreSQL bazasida qayd etish
 */
export function sendAdClick(slide) {
  if (!slide?.id) return;
  const slideId = String(slide.id);
  if (slideId.startsWith('sample')) return;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined;
  fetch(`${apiBase}/ads/${slideId}/click`, { method: 'POST', signal }).catch(() => {});
}

/**
 * Reklama ko'rilishini (View/Impression) PostgreSQL bazasida qayd etish
 */
export function sendAdView(slide) {
  if (!slide?.id) return;
  const slideId = String(slide.id);
  if (slideId.startsWith('sample')) return;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined;
  fetch(`${apiBase}/ads/${slideId}/view`, { method: 'POST', signal }).catch(() => {});
}

// Standart gradient ranglar (Rasmsiz haqiqiy reklamalar foni uchun)
const DEFAULT_BG_GRADIENTS = [
  'radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.35) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.28) 0%, transparent 50%), linear-gradient(175deg, #0e3b54 0%, #082333 55%, #04141e 100%)',
  'radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.35) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.28) 0%, transparent 50%), linear-gradient(175deg, #1e1b4b 0%, #0f172a 55%, #080d1a 100%)',
  'radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.35) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.28) 0%, transparent 50%), linear-gradient(175deg, #064e3b 0%, #022c22 55%, #021a14 100%)',
];

/**
 * Reklama haqida modal oyna (Foydalanuvchi yuborgan rasmdagi holatda)
 */
export function AdDetailModal({ slide, onClose, onOpenAdvertising }) {
  useEffect(() => {
    if (!slide) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slide, onClose]);

  if (!slide || typeof document === 'undefined') return null;

  const telUri = formatTelUri(slide.phone);

  const handleCallClick = () => {
    sendAdClick(slide);
  };

  const handleTelegramClick = (e) => {
    e.stopPropagation();
    sendAdClick(slide);
    if (slide.telegram) {
      window.open(slide.telegram, '_blank', 'noopener,noreferrer');
    } else if (slide.phone) {
      const cleanNum = slide.phone.replace(/[^\d]/g, '');
      window.open(`https://t.me/+${cleanNum}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open('https://t.me/amaps_support', '_blank', 'noopener,noreferrer');
    }
  };

  const handleFooterAdPlace = (e) => {
    e.stopPropagation();
    onClose();
    if (typeof onOpenAdvertising === 'function') {
      onOpenAdvertising();
    }
  };

  return createPortal(
    <div
      className="ad-detail-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="ad-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Yuqori qatori: [REKLAMA] va [X] yopish tugmasi */}
        <div className="ad-detail-modal-header">
          <div className="ad-detail-modal-badge-reklama">
            REKLAMA
          </div>

          <button
            type="button"
            className="ad-detail-modal-close-btn"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>

        {/* 16:9 Reklama Rasmi / Videosi */}
        <div className="ad-detail-modal-media-wrap">
          {slide.mediaUrl ? (
            isVideoUrl(slide.mediaUrl) ? (
              <video
                src={slide.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="ad-detail-modal-video"
              />
            ) : (
              <img
                src={slide.mediaUrl}
                alt={slide.title}
                className="ad-detail-modal-image"
              />
            )
          ) : (
            <div
              className="ad-detail-modal-placeholder-box"
              style={{ background: slide.bgGradient || DEFAULT_BG_GRADIENTS[0] }}
            >
              <div className="side-banner-glow-circle-1" />
              <div className="side-banner-glow-circle-2" />
              <div className="ad-detail-modal-placeholder-content">
                <div className="ad-detail-modal-placeholder-icon-wrap">
                  <ImageIcon size={34} color="#ffffff" strokeWidth={1.8} />
                </div>
                <span className="ad-detail-modal-placeholder-text">
                  Reklama rasmi (16:9)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Matnlari va Bog'lanish Tugmalari */}
        <div className="ad-detail-modal-body">
          {/* Avatar, Brend nomi va kategoriya qatori */}
          <div className="ad-detail-modal-advertiser-row">
            <div className="ad-detail-modal-avatar">
              {getInitials(slide.brand)}
            </div>
            <span className="ad-detail-modal-brand-name">
              {slide.brand || "AX-Map Hamkor"}
            </span>
            {slide.category && (
              <span className="ad-detail-modal-category">
                {slide.category}
              </span>
            )}
          </div>

          {/* Qalin Katta Sarlavha (Smart Do'kon dasturi) */}
          <h3 className="ad-detail-modal-title">
            {slide.title}
          </h3>

          {/* Tavsif matni */}
          {slide.description && (
            <p className="ad-detail-modal-desc">
              {slide.description}
            </p>
          )}

          {/* Asosiy Amallar Qatori: Moviy [Qo'ng'iroq qilish] va [Telegram] */}
          <div className="ad-detail-modal-actions-row">
            <a
              href={telUri}
              className="ad-detail-modal-btn-call"
              onClick={handleCallClick}
              title="Qo'ng'iroq qilish (bosing)"
            >
              <Phone size={18} />
              <span>Qo'ng'iroq qilish</span>
            </a>

            <button
              type="button"
              className="ad-detail-modal-btn-telegram"
              onClick={handleTelegramClick}
              title="Telegram orqali bog'lanish"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Telefon Raqami (bosganda telefon terish ochiladi) */}
          <div className="ad-detail-modal-phone-row">
            <a
              href={telUri}
              className="ad-detail-modal-phone-text-link"
              onClick={handleCallClick}
            >
              {slide.phone || "+998 90 123 45 67"}
            </a>
          </div>
        </div>

        {/* Modal Pastki Qatori: [Reklama] va [Reklama joylash] */}
        <div className="ad-detail-modal-footer">
          <span className="ad-detail-modal-footer-tag">Reklama</span>
          <button
            type="button"
            className="ad-detail-modal-footer-link"
            onClick={handleFooterAdPlace}
          >
            Reklama joylash
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Desktop Side Graphic/Video Ad Banner
 */
export function DesktopSideBanner({
  ads = [],
  ad = null,
  side = 'left',
  customClass = '',
  onOpenAdvertising,
}) {
  const slides = useMemo(() => {
    const rawList = Array.isArray(ads) && ads.length > 0 ? ads : (ad ? [ad] : []);
    const valid = rawList.filter(item => Boolean(item && (item.title || item.video_url || item.media_url || item.imageUrl)));
    if (valid.length > 0) {
      return valid.map((item, idx) => ({
        id: item.id || `ad-${idx}`,
        brand: item.brand || item.company_name || item.advertiser_name || item.advertiserName || "AX-Map Hamkor",
        category: item.category || item.target_audience || "",
        title: item.title || "Reklama",
        highlightWord: item.highlightWord || (item.title ? item.title.split(' ')[2] : null),
        description: item.description || "",
        mediaUrl: item.video_url || item.media_url || item.imageUrl || null,
        target_link: item.target_link || item.targetLink || item.link || null,
        phone: item.advertiser_phone || item.advertiserPhone || item.phone || item.phone_number || "+998 90 123 45 67",
        telegram: item.telegram || item.telegram_link || null,
        bgGradient: DEFAULT_BG_GRADIENTS[idx % DEFAULT_BG_GRADIENTS.length],
        iconType: 'fuel',
      }));
    }
    // Faqat admin kiritgan haqiqiy reklamalar ko'rsatiladi (namuna slaydlar yo'q)
    return [];
  }, [ads, ad]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeModalSlide, setActiveModalSlide] = useState(null);

  const totalCount = slides.length;
  const safeIndex = totalCount > 0 ? (currentIndex % totalCount) : 0;
  const currentSlide = totalCount > 0 ? slides[safeIndex] : null;

  const handleNext = useCallback(() => {
    if (totalCount <= 1) return;
    setCurrentIndex(prev => (prev + 1) % totalCount);
  }, [totalCount]);

  // Avtomatik 6 soniyada keyingi slaydga o'tish
  useEffect(() => {
    if (totalCount <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [totalCount, handleNext]);

  // Slayd kamida 1 soniya ko'rsatilganda ko'rishlar sonini avtomatik qayd etish (view tracking)
  useEffect(() => {
    if (!currentSlide?.id) return;
    const timer = setTimeout(() => {
      sendAdView(currentSlide);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentSlide?.id]);

  /**
   * Reklama yoki Batafsil bosilganda:
   * 1. Click hisoblagichiga yoziladi (POST /ads/:id/click)
   * 2. Reklama bo'limiga OLIB BORMAYDI!
   * 3. Agar Havolasi bo'lsa -> havola yangi oynada ochiladi.
   * 4. Agar Havolasi bo'lmasa -> modal oyna ochiladi.
   */
  const handleAdAction = (slide) => {
    if (!slide) return;
    sendAdClick(slide);

    const hasLink = Boolean(slide.target_link && slide.target_link.trim());
    if (hasLink) {
      window.open(slide.target_link, '_blank', 'noopener,noreferrer');
    } else {
      setActiveModalSlide(slide);
    }
  };

  /**
   * FAQAT "Reklama joylash" tugmasi bosilganda reklama bo'limiga olib boradi
   */
  const handleOpenAdSection = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onOpenAdvertising === 'function') {
      onOpenAdvertising();
    }
  };

  // AGAR REKLAMA BO'LMASA:
  // Faqat o'rtada "Reklama joylash" yozuvi va icon tursin xolos (hech qanday namuna reklamalarsiz)
  if (totalCount === 0) {
    return (
      <aside className={`profile-side-video-banner ${side}-banner ${customClass}`}>
        <div
          className="side-banner-card-wrap is-empty"
          onClick={handleOpenAdSection}
          role="button"
          tabIndex={0}
          title="Reklama joylash"
        >
          <div className="side-banner-empty-box">
            <div className="side-banner-empty-icon-wrap">
              <Megaphone size={28} className="side-banner-empty-icon" />
            </div>
            <span className="side-banner-empty-text">Reklama joylash</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className={`profile-side-video-banner ${side}-banner ${customClass}`}>
        <div className="side-banner-card-wrap">
          {/* Yuqori qator: Chapda [• Reklama] va o'ngda [1/3] (faqat 1 tadan ko'p bo'lsa) */}
          <div className="side-banner-top-bar">
            <div className="side-banner-badge-reklama">
              <span className="side-banner-badge-dot" />
              <span>Reklama</span>
            </div>

            {totalCount > 1 && (
              <div className="side-banner-badge-count">
                {safeIndex + 1}/{totalCount}
              </div>
            )}
          </div>

          {/* Asosiy grafik karta (bosilganda havola ochiladi yoki modal chiqadi) */}
          <div
            className="side-banner-visual-box"
            style={{ background: currentSlide.bgGradient }}
            onClick={() => handleAdAction(currentSlide)}
            role="button"
            tabIndex={0}
            title={currentSlide.target_link ? "Havolani ochish" : "Batafsil ma'lumot"}
          >
            <div className="side-banner-glow-circle-1" />
            <div className="side-banner-glow-circle-2" />

            {/* Markazdagi muzlatilgan shisha (frosted glass) kvadrati yoki media */}
            {currentSlide.mediaUrl ? (
              isVideoUrl(currentSlide.mediaUrl) ? (
                <video
                  src={currentSlide.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="side-banner-media-fill"
                />
              ) : (
                <img
                  src={currentSlide.mediaUrl}
                  alt={currentSlide.title}
                  className="side-banner-media-fill"
                />
              )
            ) : (
              <div key={currentSlide.id || safeIndex} className="side-banner-frosted-icon-wrap is-animated">
                {currentSlide.iconType === 'fuel' && <Fuel size={42} color="#ffffff" strokeWidth={2.2} />}
                {currentSlide.iconType === 'sparkles' && <Sparkles size={42} color="#38bdf8" strokeWidth={2.2} />}
                {currentSlide.iconType === 'zap' && <Zap size={42} color="#10b981" strokeWidth={2.2} />}
              </div>
            )}
          </div>

          {/* Reklama tagida FAQAT reklama nomi (Kim berayotgan sarlavhalarsiz) */}
          <div
            key={currentSlide.id || safeIndex}
            className="side-banner-info-below is-animated"
            onClick={() => handleAdAction(currentSlide)}
            style={{ cursor: 'pointer' }}
          >
            <h4 className="side-banner-main-title">
              {currentSlide.highlightWord && currentSlide.title.includes(currentSlide.highlightWord) ? (
                currentSlide.title.split(currentSlide.highlightWord).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="side-banner-title-highlight">
                        {currentSlide.highlightWord}
                      </span>
                    )}
                  </React.Fragment>
                ))
              ) : (
                currentSlide.title
              )}
            </h4>
          </div>

          {/* 1-Tugma: Batafsil -> */}
          <button
            type="button"
            className="side-banner-btn-batafsil"
            onClick={() => handleAdAction(currentSlide)}
          >
            <span>Batafsil</span>
            <ArrowRight size={16} />
          </button>

          {/* 2-Tugma: FAQAT shu tugma reklama joylash bo'limiga olib boradi */}
          <button
            type="button"
            className="side-banner-btn-joylash"
            onClick={handleOpenAdSection}
            title="Reklama joylashtirish bo'limiga o'tish"
          >
            <Megaphone size={15} />
            <span>Reklama joylash</span>
          </button>

          {/* Sahifalash indikatorlari (faqat 1 tadan ko'p bo'lsa) */}
          {totalCount > 1 && (
            <div className="side-banner-pagination">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`side-banner-pagination-dot ${idx === safeIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Slayd ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Modal Dialog */}
      {activeModalSlide && (
        <AdDetailModal
          slide={activeModalSlide}
          onClose={() => setActiveModalSlide(null)}
          onOpenAdvertising={onOpenAdvertising}
        />
      )}
    </>
  );
}

/**
 * Mobil banner uchun ham moslashtirilgan ko'rinish
 */
export function MobileAdBanner({ ads = [], ad = null, onOpenAdvertising }) {
  const slides = useMemo(() => {
    const rawList = Array.isArray(ads) && ads.length > 0 ? ads : (ad ? [ad] : []);
    const valid = rawList.filter(item => Boolean(item && (item.title || item.video_url || item.media_url || item.imageUrl)));
    if (valid.length > 0) {
      return valid.map((item, idx) => ({
        id: item.id || `ad-${idx}`,
        brand: item.brand || item.company_name || item.advertiser_name || item.advertiserName || "AX-Map Hamkor",
        category: item.category || item.target_audience || "",
        title: item.title || "Reklama",
        highlightWord: item.highlightWord || (item.title ? item.title.split(' ')[2] : null),
        description: item.description || "",
        mediaUrl: item.video_url || item.media_url || item.imageUrl || null,
        target_link: item.target_link || item.targetLink || item.link || null,
        phone: item.advertiser_phone || item.advertiserPhone || item.phone || item.phone_number || "+998 90 123 45 67",
        telegram: item.telegram || item.telegram_link || null,
        bgGradient: DEFAULT_BG_GRADIENTS[idx % DEFAULT_BG_GRADIENTS.length],
        iconType: 'fuel',
      }));
    }
    return [];
  }, [ads, ad]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeModalSlide, setActiveModalSlide] = useState(null);

  const totalCount = slides.length;
  const safeIndex = totalCount > 0 ? (currentIndex % totalCount) : 0;
  const currentSlide = totalCount > 0 ? slides[safeIndex] : null;

  const handleNext = useCallback(() => {
    if (totalCount <= 1) return;
    setCurrentIndex(prev => (prev + 1) % totalCount);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [totalCount, handleNext]);

  // Slayd ko'rilganda view tracking
  useEffect(() => {
    if (!currentSlide?.id) return;
    const timer = setTimeout(() => {
      sendAdView(currentSlide);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentSlide?.id]);

  const handleAdAction = (slide) => {
    if (!slide) return;
    sendAdClick(slide);

    const hasLink = Boolean(slide.target_link && slide.target_link.trim());
    if (hasLink) {
      window.open(slide.target_link, '_blank', 'noopener,noreferrer');
    } else {
      setActiveModalSlide(slide);
    }
  };

  const handleOpenAdSection = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onOpenAdvertising === 'function') {
      onOpenAdvertising();
    }
  };

  if (totalCount === 0) {
    return (
      <div className="mobile-ad-banner-box">
        <div
          className="side-banner-card-wrap is-empty mobile-version"
          onClick={handleOpenAdSection}
          role="button"
          tabIndex={0}
          title="Reklama joylash"
        >
          <div className="side-banner-empty-box">
            <div className="side-banner-empty-icon-wrap">
              <Megaphone size={24} className="side-banner-empty-icon" />
            </div>
            <span className="side-banner-empty-text">Reklama joylash</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-ad-banner-box">
        <div className="side-banner-card-wrap mobile-version">
          <div className="side-banner-top-bar">
            <div className="side-banner-badge-reklama">
              <span className="side-banner-badge-dot" />
              <span>Reklama</span>
            </div>
            {totalCount > 1 && (
              <div className="side-banner-badge-count">
                {safeIndex + 1}/{totalCount}
              </div>
            )}
          </div>

          <div
            className="side-banner-visual-box"
            style={{ background: currentSlide.bgGradient, minHeight: '180px', height: '190px' }}
            onClick={() => handleAdAction(currentSlide)}
          >
            <div className="side-banner-frosted-icon-wrap" style={{ margin: 'auto' }}>
              {currentSlide.iconType === 'fuel' && <Fuel size={36} color="#ffffff" strokeWidth={2.2} />}
              {currentSlide.iconType === 'sparkles' && <Sparkles size={36} color="#38bdf8" strokeWidth={2.2} />}
              {currentSlide.iconType === 'zap' && <Zap size={36} color="#10b981" strokeWidth={2.2} />}
            </div>
          </div>

          {/* Faqat reklama nomi */}
          <div
            key={currentSlide.id || safeIndex}
            className="side-banner-info-below is-animated"
            onClick={() => handleAdAction(currentSlide)}
          >
            <h4 className="side-banner-main-title">{currentSlide.title}</h4>
          </div>

          <button
            type="button"
            className="side-banner-btn-batafsil"
            onClick={() => handleAdAction(currentSlide)}
          >
            <span>Batafsil</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="side-banner-btn-joylash"
            onClick={handleOpenAdSection}
          >
            <Megaphone size={15} />
            <span>Reklama joylash</span>
          </button>
        </div>
      </div>

      {activeModalSlide && (
        <AdDetailModal
          slide={activeModalSlide}
          onClose={() => setActiveModalSlide(null)}
          onOpenAdvertising={onOpenAdvertising}
        />
      )}
    </>
  );
}

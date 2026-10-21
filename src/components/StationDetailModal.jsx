import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, MapPin, Phone, Info, Navigation, X, Maximize2
} from 'lucide-react';
import { formatDistance } from '../utils/distance';

// 1. Maxsus SVG ikonlar
const RestroomIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <circle cx="8" cy="4.5" r="2.2" fill="#0891b2" />
    <path d="M5.5 8.5C5.5 7.95 5.95 7.5 6.5 7.5H9.5C10.05 7.5 10.5 7.95 10.5 8.5V14.5H9V20H7V14.5H5.5V8.5Z" fill="#0891b2" />
    <circle cx="16" cy="4.5" r="2.2" fill="#06b6d4" />
    <path d="M14 7.5C13.45 7.5 13 7.95 13 8.5L14 14.5H15V20H17V14.5H18L19 8.5C19 7.95 18.55 7.5 18 7.5H14Z" fill="#06b6d4" />
  </svg>
);

const GaugeMeterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 14 3.5-3.5" />
    <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    <circle cx="12" cy="14" r="1.5" fill="#0284c7" />
  </svg>
);

const CoffeeSteamIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

const ShopBagColorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// Standart yuqori sifatli gaz/benzin quyish shoxobchasi rasmi
const DEFAULT_STATION_IMG = "https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1200&q=80";

export default function StationDetailModal({
  station,
  userDistance,
  onClose,
  onStartNavigation,
  isMyStation = false,
  onDeleteStation,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!station) return null;

  // Rasmlar ro'yxatini yig'ish
  const images = (station.images && station.images.length > 0)
    ? station.images
    : (station.image ? [station.image] : [DEFAULT_STATION_IMG]);

  const currentImage = images[activeImageIndex] || DEFAULT_STATION_IMG;

  const nextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Manzil ma'lumotlari
  const stationName = station.name || "Shaffof";
  const stationAddress = station.address || station.city || "Besh-Yog`och mahallasi, Chilonzor Tumani, Toshkent, 100000";
  const stationPhone = station.phone || "+998 77 278 18 08";

  // Narx formatlash
  const formatPrice = (val, fallback = 20000) => {
    const num = Number(val || fallback);
    return isNaN(num) ? `${val} so'm` : `${num.toLocaleString('en-US')} so'm`;
  };

  const metanPrice = formatPrice(station.prices?.metan, 20000);
  const propanPrice = formatPrice(station.prices?.propan, 20000);
  const gasPressureVal = station.gasPressure || station.pressure || 220;

  // Qulayliklar va to'lov turlarining mavjudligi
  const amenities = station.amenities || {
    coffee: true,
    toilet: true,
    shop: true,
  };

  const payments = station.payments || {
    cash: true,
    uzcard: true,
    humo: true,
    visa: true,
  };

  const hasCoffee = amenities.coffee !== false;
  const hasToilet = amenities.toilet !== false;
  const hasShop = amenities.shop !== false;

  const hasCash = payments.cash !== false;
  const hasUzcard = payments.uzcard !== false;
  const hasHumo = payments.humo !== false;
  const hasVisa = payments.visa !== false;

  return (
    <div className="sd-modal-backdrop" onClick={onClose}>
      <div 
        className="sd-modal-sheet" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            STICKY ORTGA TUGMASI (Scroll qilinganda ham tepada saqlanadi)
            ======================================================== */}
        <div className="sd-sticky-top-bar">
          <button 
            type="button" 
            className="sd-round-back-btn" 
            onClick={onClose}
            aria-label="Ortga"
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        {/* ========================================================
            1. TEPADA RASM BO'LIMI (Bosganda rasm markazda kattalashib chiqadi)
            ======================================================== */}
        <div 
          className="sd-hero-media"
          onClick={() => setIsImageModalOpen(true)}
          title="Rasmni yaqindan ko'rish uchun bosing"
        >
          <img 
            src={currentImage} 
            alt={stationName} 
            className="sd-hero-image"
          />

          {/* Yaqindan ko'rish ishorasi */}
          <div className="sd-hero-zoom-badge">
            <Maximize2 size={13} />
            <span>Kattalashtirish</span>
          </div>

          {images.length > 1 && (
            <>
              <button 
                type="button" 
                className="sd-slider-btn prev" 
                onClick={(e) => { e.stopPropagation(); prevImage(e); }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                type="button" 
                className="sd-slider-btn next" 
                onClick={(e) => { e.stopPropagation(); nextImage(e); }}
              >
                <ChevronRight size={20} />
              </button>
              <div className="sd-slider-dots" onClick={(e) => e.stopPropagation()}>
                {images.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`sd-slider-dot ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            2. ASOSIY MA'LUMOTLAR KONTENYERI (Rasm tagida 5% yopib turadi,
               ekranni tepaga sursa rasm ustiga chiqib ketadi)
            ======================================================== */}
        <div className="sd-sheet-body">
          
          {/* Manzil nomi */}
          <h2 className="sd-station-name">{stationName}</h2>

          {/* Manzil (Location) */}
          <div className="sd-meta-line">
            <div className="sd-meta-icon-pin">
              <MapPin size={18} />
            </div>
            <span className="sd-meta-address-text">{stationAddress}</span>
          </div>

          {/* Telefon raqam */}
          {stationPhone && (
            <div className="sd-meta-line sd-meta-phone-line">
              <Phone size={17} className="sd-meta-phone-icon" />
              <a href={`tel:${stationPhone}`} className="sd-meta-phone-link">
                {stationPhone}
              </a>
            </div>
          )}

          {/* ========================================================
              3. YOQILG'I NARXLARI (Ruchka iconsiz toza kartochkalar)
              ======================================================== */}
          <div className="sd-section-block">
            <div className="sd-sec-title-row">
              <h3 className="sd-sec-heading">Yoqilg'i narxlari</h3>
              <Info size={16} className="sd-info-circle-icon" />
            </div>

            <div className="sd-fuel-grid">
              {/* Metan kartochkasi */}
              <div className="sd-fuel-card">
                <span className="sd-fuel-card-title">Metan</span>
                <span className="sd-fuel-card-price">{metanPrice}</span>
              </div>

              {/* Propan kartochkasi */}
              <div className="sd-fuel-card">
                <span className="sd-fuel-card-title">Propan</span>
                <span className="sd-fuel-card-price">{propanPrice}</span>
              </div>
            </div>

            {/* Gaz bosimi (Ruchka iconsiz) */}
            <div className="sd-pressure-card">
              <div className="sd-pressure-meter-halo">
                <GaugeMeterIcon />
              </div>
              <div className="sd-pressure-text-wrap">
                <span className="sd-pressure-label">Gaz bosimi:</span>
                <strong className="sd-pressure-val">{gasPressureVal} atm</strong>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. QULAYLIKLAR (Qahva, Hojatxona, Do'kon)
              ======================================================== */}
          <div className="sd-section-block">
            <h3 className="sd-sec-heading">Qulayliklar</h3>
            <div className="sd-amenities-row">
              {/* Qahva */}
              <div className={`sd-amenity-chip ${!hasCoffee ? 'is-unavailable' : ''}`}>
                <div className="sd-amenity-icon-box coffee-box">
                  <CoffeeSteamIcon />
                  {!hasCoffee && (
                    <div className="sd-unavailable-badge" title="Mavjud emas">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-amenity-text">Qahva</span>
              </div>

              {/* Hojatxona */}
              <div className={`sd-amenity-chip ${!hasToilet ? 'is-unavailable' : ''}`}>
                <div className="sd-amenity-icon-box toilet-box">
                  <RestroomIcon />
                  {!hasToilet && (
                    <div className="sd-unavailable-badge" title="Mavjud emas">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-amenity-text">Hojatxona</span>
              </div>

              {/* Do'kon */}
              <div className={`sd-amenity-chip ${!hasShop ? 'is-unavailable' : ''}`}>
                <div className="sd-amenity-icon-box shop-box">
                  <ShopBagColorIcon />
                  {!hasShop && (
                    <div className="sd-unavailable-badge" title="Mavjud emas">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-amenity-text">Do'kon</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              5. TO'LOV TURLARI (cash, Uzcard, Humo, Visa/bank)
              ======================================================== */}
          <div className="sd-section-block">
            <h3 className="sd-sec-heading">To'lov turlari</h3>
            <div className="sd-payments-row">
              {/* cash */}
              <div className={`sd-pay-item ${!hasCash ? 'is-unavailable' : ''}`}>
                <div className="sd-pay-icon-box cash-box">
                  <svg width="30" height="20" viewBox="0 0 34 22" fill="none">
                    <rect x="1" y="1" width="32" height="20" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="17" cy="11" r="4.5" fill="#10b981" />
                    <circle cx="6" cy="6" r="1.5" fill="#10b981" />
                    <circle cx="28" cy="6" r="1.5" fill="#10b981" />
                    <circle cx="6" cy="16" r="1.5" fill="#10b981" />
                    <circle cx="28" cy="16" r="1.5" fill="#10b981" />
                  </svg>
                  {!hasCash && (
                    <div className="sd-unavailable-badge" title="Qabul qilinmaydi">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-pay-title">cash</span>
              </div>

              {/* Uzcard */}
              <div className={`sd-pay-item ${!hasUzcard ? 'is-unavailable' : ''}`}>
                <div className="sd-pay-icon-box uzcard-box">
                  <span className="uzcard-logo-txt">Uzcard</span>
                  {!hasUzcard && (
                    <div className="sd-unavailable-badge" title="Qabul qilinmaydi">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-pay-title">Uzcard</span>
              </div>

              {/* Humo */}
              <div className={`sd-pay-item ${!hasHumo ? 'is-unavailable' : ''}`}>
                <div className="sd-pay-icon-box humo-box">
                  <span className="humo-logo-txt">HUMO</span>
                  {!hasHumo && (
                    <div className="sd-unavailable-badge" title="Qabul qilinmaydi">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-pay-title">Humo</span>
              </div>

              {/* Visa/bank */}
              <div className={`sd-pay-item ${!hasVisa ? 'is-unavailable' : ''}`}>
                <div className="sd-pay-icon-box visa-box">
                  <span className="visa-logo-txt">VISA</span>
                  {!hasVisa && (
                    <div className="sd-unavailable-badge" title="Qabul qilinmaydi">
                      <X size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="sd-pay-title">Visa/bank</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              6. BORISH TUGMASI
              ======================================================== */}
          <div className="sd-bottom-actions">
            <button
              type="button"
              className="sd-borish-action-btn"
              onClick={() => {
                onClose();
                if (onStartNavigation) {
                  onStartNavigation(station);
                } else {
                  window.open(`https://yandex.uz/maps/?rtext=~${station.lat},${station.lng}&rtt=auto`, "_blank");
                }
              }}
            >
              <Navigation size={20} />
              <span>Borish {userDistance ? `(${formatDistance(userDistance)})` : ''}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================
          7. RASMNI YAQINDAN KO'RISH MODAL OYNASI (IMAGE LIGHTBOX)
          Orqa tomoni xiralashgan holda rasm markazda yaqindan ko'rinadi
          ======================================================== */}
      {isImageModalOpen && (
        <div 
          className="sd-image-lightbox-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setIsImageModalOpen(false);
          }}
        >
          <div 
            className="sd-image-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Yopish tugmasi */}
            <button 
              type="button"
              className="sd-lightbox-close-btn"
              onClick={() => setIsImageModalOpen(false)}
              aria-label="Yopish"
            >
              <X size={22} />
            </button>

            {/* Kattalashtirilgan rasm */}
            <img 
              src={currentImage} 
              alt={stationName} 
              className="sd-lightbox-full-img"
            />

            {/* Bir nechta rasm bo'lsa navigatsiya */}
            {images.length > 1 && (
              <>
                <button 
                  type="button" 
                  className="sd-lightbox-nav prev"
                  onClick={(e) => { e.stopPropagation(); prevImage(e); }}
                  aria-label="Oldingi rasm"
                >
                  <ChevronLeft size={26} />
                </button>
                <button 
                  type="button" 
                  className="sd-lightbox-nav next"
                  onClick={(e) => { e.stopPropagation(); nextImage(e); }}
                  aria-label="Keyingi rasm"
                >
                  <ChevronRight size={26} />
                </button>
                <div className="sd-lightbox-counter">
                  {activeImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

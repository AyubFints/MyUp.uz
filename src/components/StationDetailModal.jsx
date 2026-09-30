import React, { useState } from 'react';
import { 
  X, Navigation, Phone, MapPin, Star, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function StationDetailModal({
  station,
  userDistance,
  onClose,
  onStartNavigation,
  onRateStation
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  if (!station) return null;

  // Rasmlar ro'yxatini yig'ish (faqat bitta asosiy rasm bo'lsa, uni massivga o'ramiz)
  const images = station.images || [station.image];

  const nextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleRate = (star) => {
    if (hasRated) return;
    onRateStation(station.id, star);
    setHasRated(true);
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-card-v2" onClick={(e) => e.stopPropagation()}>
        
        <button className="detail-close-btn-v2" onClick={onClose} aria-label="Yopish">
          <X size={20} />
        </button>

        {/* TOP: Image Viewer (Telegram style) */}
        <div className="sd-image-viewer">
          <img src={images[activeImageIndex]} alt={station.name} className="sd-main-img" />
          
          {images.length > 1 && (
            <>
              <button className="sd-img-nav left" onClick={prevImage}><ChevronLeft size={24} /></button>
              <button className="sd-img-nav right" onClick={nextImage}><ChevronRight size={24} /></button>
              <div className="sd-img-dots">
                {images.map((_, idx) => (
                  <span key={idx} className={`sd-img-dot ${idx === activeImageIndex ? 'active' : ''}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* BODY: Info */}
        <div className="sd-info-section">
          <h2 className="sd-title">{station.name}</h2>
          
          <div className="sd-info-row">
            <MapPin size={16} className="sd-icon" />
            <span>{station.address || station.city || 'Manzil yo\'q'}</span>
          </div>

          <div className="sd-info-row">
            <Navigation size={16} className="sd-icon" />
            <span>Sizdan {formatDistance(userDistance)} uzoqlikda</span>
          </div>

          {station.phone && (
            <div className="sd-info-row">
              <Phone size={16} className="sd-icon" />
              <a href={`tel:${station.phone}`} className="sd-phone-link">
                {station.phone}
              </a>
            </div>
          )}

          {station.gasPressure && (
            <div style={{ 
              marginTop: '12px', 
              fontSize: '1rem', 
              color: '#082f49', 
              backgroundColor: '#e0f2fe', 
              padding: '12px 16px',
              borderRadius: '16px',
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid #bae6fd'
            }}>
              <Zap size={20} color="#0284c7" /> 
              <span style={{ flex: 1 }}>Hozirgi gaz bosimi:</span>
              <span style={{color: '#0284c7', fontSize: '1.15rem'}}>{station.gasPressure} atm</span>
            </div>
          )}
        </div>

        {/* RATING SECTION (Modest) */}
        <div className="sd-rating-section">
          {hasRated ? (
            <p className="sd-rating-thanks">Bahoingiz uchun rahmat!</p>
          ) : (
            <>
              <p className="sd-rating-text">Fikringiz biz uchun muhim:</p>
              <div className="sd-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={28}
                    className={`sd-star ${(ratingHover || 0) >= star ? 'filled' : ''}`}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    onClick={() => handleRate(star)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* BOTTOM: Navigate Button */}
        <div className="sd-footer">
          <button 
            className="sd-borish-btn" 
            onClick={() => {
              onClose();
              onStartNavigation(station);
            }}
          >
            Borish
          </button>
        </div>

      </div>
    </div>
  );
}

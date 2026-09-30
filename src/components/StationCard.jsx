import React from 'react';
import { 
  Navigation, Clock, MapPin, Heart, Star, Zap
} from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function StationCard({
  station,
  userDistance,
  isFavorite,
  onToggleFavorite,
  onSelectStation
}) {
  const isCurrentlyOpen = station.isOpen !== false;

  return (
    <div className="home-station-card">
      <div className="hsc-header">
        <h3 className="hsc-name">{station.name}</h3>
        {/* Bookmark */}
        <button
          className={`hsc-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(station.id);
          }}
        >
          <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : '#a1a1aa'} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <Star size={14} fill="#f59e0b" color="#f59e0b" />
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {station.rating ? station.rating.toFixed(1) : '0.0'}
        </span>
      </div>

      <p className="hsc-address">
        <MapPin size={14} className="inline-icon" />
        {station.address || station.city || 'Manzil kiritilmagan'}
      </p>

      <div className="hsc-distance">
        <Navigation size={14} className="inline-icon" />
        Sizdan <strong>{formatDistance(userDistance)}</strong> uzoqlikda
      </div>

      <div className="hsc-status-row">
        {isCurrentlyOpen ? (
          <span className="hsc-status open"><Clock size={14} /> Hozir ochiq</span>
        ) : (
          <span className="hsc-status closed">
            🔴 Yopiq 
            {station.reopenTime && ` (Taxminan ${station.reopenTime} da ochiladi)`}
          </span>
        )}
      </div>

      {station.gasPressure && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '0.9rem', 
          color: '#082f49', 
          backgroundColor: '#e0f2fe', 
          padding: '8px 12px',
          borderRadius: '12px',
          fontWeight: '700', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          border: '1px solid #bae6fd'
        }}>
          <Zap size={16} color="#0284c7" /> 
          <span style={{ flex: 1 }}>Hozirgi gaz bosimi:</span>
          <span style={{color: '#0284c7', fontSize: '1rem'}}>{station.gasPressure} atm</span>
        </div>
      )}

      {station.category === 'fuel' && station.prices && (
        <div className="hsc-prices">
          {station.prices.metan && (
             <div className="hsc-price-item bg-gaz">
               <span>Gaz</span>
               <strong>{station.prices.metan.toLocaleString()} so'm</strong>
             </div>
          )}
          {station.prices.propan && (
             <div className="hsc-price-item bg-propan">
               <span>Propan</span>
               <strong>{station.prices.propan.toLocaleString()} so'm</strong>
             </div>
          )}
          {station.prices.ai92 && (
             <div className="hsc-price-item bg-benzin">
               <span>Benzin (AI-92)</span>
               <strong>{station.prices.ai92.toLocaleString()} so'm</strong>
             </div>
          )}
          {station.prices.ai80 && (
             <div className="hsc-price-item bg-benzin">
               <span>Benzin (AI-80)</span>
               <strong>{station.prices.ai80.toLocaleString()} so'm</strong>
             </div>
          )}
          {station.prices.elektr && (
             <div className="hsc-price-item bg-elektr">
               <span>Elektr</span>
               <strong>{station.prices.elektr.toLocaleString()} so'm</strong>
             </div>
          )}
        </div>
      )}

      <button className="hsc-yonalish-btn" onClick={() => onSelectStation(station)}>
        Kirish
      </button>
    </div>
  );
}

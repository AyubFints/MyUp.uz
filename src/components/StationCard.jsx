import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, MapPin, Heart, Star, Zap, Flame, Droplets, Fuel } from 'lucide-react';
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
    <div className="home-station-card-neu" onClick={() => onSelectStation(station)} style={{ cursor: 'pointer' }}>
      {/* Header Row: Title, Rating, Fav */}
      <div className="hsc-neu-header-row">
        <h3 className="hsc-neu-name">{station.name}</h3>
        <div className="hsc-neu-rating-fav">
          <div className="hsc-neu-rating">
            <Star size={16} fill="#f59e0b" color="#f59e0b" />
            <span>{station.rating ? station.rating.toFixed(1) : '0.0'}</span>
          </div>
          <button
            className={`hsc-neu-fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(station.id);
            }}
          >
            <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : '#a1a1aa'} />
          </button>
        </div>
      </div>

      {/* Address Row */}
      <div className="hsc-neu-address-row">
        <MapPin size={18} className="hsc-neu-icon-shrink" />
        <span>{station.address || station.city || 'Besh-Yog\'och mahallasi, Chilonzor Tumani, Toshkent, 100000'}</span>
      </div>

      {/* Prices Row (Compact) */}
      {station.prices && Object.keys(station.prices).length > 0 && (
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', marginBottom: '2px', marginLeft: '26px' }}>
          {Object.entries(station.prices).map(([key, value]) => {
             let label = key;
             if (key === 'metan') label = 'Metan';
             if (key === 'propan') label = 'Propan';
             if (key === 'benzin' || key === 'ai92' || key === 'ai80') label = 'Benzin';
             if (key === 'elektr') label = 'Elektr';
             return (
               <div key={key} style={{ display: 'inline-block', marginRight: '15px' }}>
                 {label}: <strong style={{color: '#0ea5e9'}}>{value ? Number(value).toLocaleString() : '—'} so'm</strong>
               </div>
             );
          })}
        </div>
      )}

      {/* Split Section: Distance & Status on left, Map on right */}
      <div className="hsc-neu-split-section" style={{ marginTop: '-8px', alignItems: 'center' }}>
        <div className="hsc-neu-split-left">
          <div className="hsc-neu-distance-stacked">
            <Navigation size={18} className="hsc-neu-nav-icon" />
            <span className="hsc-neu-dist-text">Sizdan <strong>{formatDistance(userDistance)}</strong><br/> uzoqlikda</span>
          </div>

          <div className="hsc-neu-status-wrapper">
            {isCurrentlyOpen ? (
              <div className="hsc-neu-status open">
                <Clock size={12} /> Hozir ochiq
              </div>
            ) : (
              <div className="hsc-neu-status closed">
                Yopiq {station.reopenTime && ` (${station.reopenTime} da ochiladi)`}
              </div>
            )}
          </div>
        </div>

        <div className="hsc-neu-split-right" style={{ transform: "translateY(-5px)" }}>
          <div className="hsc-neu-minimap-ring" onClick={(e) => e.stopPropagation()}>
            <div className="hsc-neu-minimap-inner">
              <MapContainer 
                center={[station.lat || 41.311081, station.lng || 69.240562]} 
                zoom={14} 
                zoomControl={false} 
                dragging={true} 
                scrollWheelZoom={true} 
                touchZoom={true} 
                doubleClickZoom={true}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={[station.lat || 41.311081, station.lng || 69.240562]} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      

      <button className="hsc-neu-action-btn" onClick={(e) => {
        e.stopPropagation();
        onSelectStation(station);
      }}>
        Batafsil
      </button>
    </div>
  );
}

import React from 'react';
import { Map } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function StationCard({
  station,
  userDistance,
  onSelectStation
}) {
  const isCurrentlyOpen = station.isOpen !== false;
  
  let detailsText = '';
  if (station.prices) {
    const prices = [];
    if (station.prices.metan) prices.push(`Metan ${station.prices.metan} so'm/kg`);
    if (station.prices.benzin) prices.push(`Al-92 ${station.prices.benzin} so'm/l`);
    if (station.prices.elektr) prices.push(`Elektr ${station.prices.elektr} so'm/kVt`);
    if (prices.length > 0) {
      detailsText += `Narx: ${prices.join(', ')}\n`;
    }
  }
  if (station.pressure) {
    detailsText += `Bosim: ${station.pressure} atm`;
  } else if (station.type && station.type.includes('metan')) {
    detailsText += `Bosim: 210 atm`;
  }

  return (
    <div className="custom-station-card" onClick={() => onSelectStation(station)} style={{ cursor: 'pointer' }}>
      {isCurrentlyOpen ? (
        <>
          <div className="custom-sc-header">
            <h3 className="custom-sc-title">{station.name} {station.type && `(${station.type.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('/')})`}</h3>
            <span className="custom-sc-status custom-open">Ochiq</span>
          </div>
          
          <div className="custom-sc-distance">
            {formatDistance(userDistance)} uzog'liq
          </div>
          
          <div className="custom-sc-details">
            {detailsText.split('\n').map((line, i) => (
              line ? <div key={i}>{line}</div> : null
            ))}
          </div>

          <div className="custom-sc-actions">
            <button className="custom-btn-details" onClick={(e) => { e.stopPropagation(); onSelectStation(station); }}>
              Batafsil
            </button>
            <button className="custom-btn-navigate" onClick={(e) => { e.stopPropagation(); /* Navigation logic here */ }}>
              Borish <Map size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="custom-sc-header">
            <h3 className="custom-sc-title">{station.name} {station.type && `(${station.type.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('/')})`}</h3>
            <span className="custom-sc-distance" style={{ margin: 0, fontSize: '0.85rem' }}>
              {formatDistance(userDistance)}
            </span>
          </div>
          
          <div className="custom-sc-details">
            {detailsText.split('\n').map((line, i) => (
              line ? <div key={i}>{line}</div> : null
            ))}
            <div style={{ color: '#ef4444', marginTop: '4px' }}>
              Yopiq {station.reopenTime && `(Ochiladi ${station.reopenTime})`}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

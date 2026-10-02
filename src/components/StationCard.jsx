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
    if (station.prices.benzin) prices.push(`Al-95 ${station.prices.benzin} so'm/l`);
    detailsText += `Narx: ${prices.join(', ')}\n`;
  }
  if (station.pressure) {
    detailsText += `Bosim: ${station.pressure} atm`;
  } else {
    detailsText += `Bosim: 210 atm`;
  }

  return (
    <div className="station-card-dark" onClick={() => onSelectStation(station)} style={{ cursor: 'pointer' }}>
      <div className="sc-header">
        <h3 className="sc-title">{station.name} {station.type && `(${station.type.join('/')})`}</h3>
        {isCurrentlyOpen ? (
          <span className="sc-status open">Ochiq</span>
        ) : (
          <span className="sc-status closed">Yopiq {station.reopenTime && `(${station.reopenTime} gacha)`}</span>
        )}
      </div>
      
      <div className="sc-distance">
        {formatDistance(userDistance)} uzog'liq
      </div>
      
      <div className="sc-details" style={{ whiteSpace: 'pre-line' }}>
        {detailsText}
      </div>

      <div className="sc-actions">
        <button className="btn-details" onClick={(e) => { e.stopPropagation(); onSelectStation(station); }}>
          Batafsil
        </button>
        <button className="btn-navigate" onClick={(e) => { e.stopPropagation(); /* Navigation logic here */ }}>
          Borish <Map size={16} />
        </button>
      </div>
    </div>
  );
}

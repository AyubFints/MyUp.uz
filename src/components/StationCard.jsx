import React from 'react';
import { Map } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function StationCard({
  station,
  userDistance,
  onSelectStation,
  onNavigate
}) {
  const isCurrentlyOpen = station.isOpen !== false;
  
  let detailsText = '';
  if (station.prices && Object.keys(station.prices).length > 0) {
    const prices = [];
    if (station.prices.metan) prices.push(`Metan ${station.prices.metan} so'm/kg`);
    if (station.prices.benzin) prices.push(`Al-92 ${station.prices.benzin} so'm/l`);
    if (station.prices.elektr) prices.push(`Elektr ${station.prices.elektr} so'm/kVt`);
    if (station.prices.propan) prices.push(`Propan ${station.prices.propan} so'm/l`);
    if (prices.length > 0) {
      detailsText += `Narx: ${prices.join(', ')}\n`;
    }
  } else if (station.price) {
    detailsText += `Narx: ${station.price.toLocaleString()} so'm\n`;
  }

  const currentPressure = station.gasPressure || station.pressure;
  if (currentPressure) {
    detailsText += `Bosim: ${currentPressure} atm`;
  } else if (station.type && (Array.isArray(station.type) ? station.type.includes('metan') : station.type === 'metan')) {
    detailsText += `Bosim: 210 atm`;
  }

  const rawTypes = Array.isArray(station?.type)
    ? station.type
    : (station?.type ? [station.type] : (station?.fuelType ? [station.fuelType] : []));

  const formatTypeName = (t) => {
    if (!t) return '';
    const lower = typeof t === 'string' ? t.toLowerCase() : String(t).toLowerCase();
    if (lower === 'metan') return 'Metan';
    if (lower === 'propan') return 'Propan';
    if (lower === 'benzin') return 'Benzin';
    if (lower === 'elektr') return 'Elektr';
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const fuelTypeText = rawTypes.map(formatTypeName).filter(Boolean).join(' / ');

  const handleNavClick = (e) => {
    e.stopPropagation();
    if (onSelectStation) {
      onSelectStation(station);
    } else if (onNavigate) {
      onNavigate(station);
    } else {
      const url = `https://yandex.uz/maps/?rtext=~${station.lat},${station.lng}&rtt=auto`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="custom-station-card" onClick={() => onSelectStation(station)} style={{ cursor: 'pointer' }}>
      {/* 1. Manzil nomi (chapda) va masofa / ochiqlik holati (o'ng tomon burchakda) */}
      <div className="custom-sc-header">
        <h3 className="custom-sc-title">{station.name}</h3>
        <div className="custom-sc-header-right">
          {isCurrentlyOpen && <span className="custom-sc-status custom-open">Ochiq</span>}
          <span className="custom-sc-distance-val">
            {formatDistance(userDistance)}
          </span>
        </div>
      </div>

      {/* 2. Manzil nomi tagida nima sotishi (Metan, Gaz, Benzin, Elektr...) */}
      {fuelTypeText && (
        <div className="custom-sc-fuel-type">
          {fuelTypeText}
        </div>
      )}

      {/* 3. Nima sotishining tagida xaritadagi manzil / ko'cha nomlari */}
      {station.address && (
        <div className="custom-sc-address">
          {station.address}
        </div>
      )}

      {/* 4. Narx va Bosim (va yopiq bo'lsa qachon ochilishi) */}
      <div className="custom-sc-details">
        {detailsText.split('\n').map((line, i) => (
          line ? <div key={i}>{line}</div> : null
        ))}
        {!isCurrentlyOpen && (
          <div className="custom-sc-closed-info">
            Yopiq {station.reopenTime && `(Ochiladi ${station.reopenTime})`}
          </div>
        )}
      </div>

      {/* 5. Tugmalar (Faqat manzil ochiq bo'lganda chiqadi) */}
      {isCurrentlyOpen && (
        <div className="custom-sc-actions">
          <button className="custom-btn-details" onClick={(e) => { e.stopPropagation(); onSelectStation(station); }}>
            Batafsil
          </button>
          <button className="custom-btn-navigate" onClick={handleNavClick}>
            Borish <Map size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

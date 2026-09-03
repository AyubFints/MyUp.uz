import React from 'react';
import { 
  Fuel, Flame, Droplets, Zap, Clock, Sparkles, 
  Map, List, Compass, Layers, Check, ArrowDownUp
} from 'lucide-react';
import { FUEL_TYPES } from '../data/mockData';

export default function FilterBar({
  activeCategory,
  fuelFilter,
  setFuelFilter,
  filterOpen24,
  setFilterOpen24,
  filterEmptyQueue,
  setFilterEmptyQueue,
  filterNamozxona,
  setFilterNamozxona,
  filterAvtoyuvish,
  setFilterAvtoyuvish,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}) {
  const getFuelIcon = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame size={15} />;
      case 'Droplets': return <Droplets size={15} />;
      case 'Zap': return <Zap size={15} />;
      case 'Fuel': return <Fuel size={15} />;
      default: return <Sparkles size={15} />;
    }
  };

  return (
    <div className="filter-bar-wrapper">
      <div className="filter-bar-content">
        {/* FUEL SUB-FILTERS (Only shown if activeCategory === 'fuel') */}
        {activeCategory === 'fuel' && (
          <div className="fuel-filters-group">
            {FUEL_TYPES.map((type) => {
              const isSelected = fuelFilter === type.id;
              return (
                <button
                  key={type.id}
                  className={`fuel-pill-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setFuelFilter(type.id)}
                  style={{
                    '--fuel-color': type.color || '#0ea5e9'
                  }}
                >
                  {getFuelIcon(type.icon)}
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* QUICK AMENITY & STATUS TOGGLES */}
        <div className="quick-toggles-group">
          {/* Sort By Dropdown */}
          <div className="sort-by-box">
            <ArrowDownUp size={14} className="text-muted" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown"
            >
              <option value="nearest">📍 Eng yaqin</option>
              <option value="rating">⭐ Eng yuqori baho</option>
              <option value="queue">🟢 Navbatsiz (Tez)</option>
              <option value="price">💰 Eng arzon narx</option>
            </select>
          </div>

          {/* 24/7 Toggle */}
          <button
            className={`toggle-chip ${filterOpen24 ? 'active' : ''}`}
            onClick={() => setFilterOpen24(!filterOpen24)}
          >
            <Clock size={14} />
            <span>24/7 Ochiq</span>
            {filterOpen24 && <Check size={12} />}
          </button>

          {/* Empty Queue Toggle (for fuel) */}
          {activeCategory === 'fuel' && (
            <button
              className={`toggle-chip ${filterEmptyQueue ? 'active' : ''}`}
              onClick={() => setFilterEmptyQueue(!filterEmptyQueue)}
            >
              <span className="dot-green"></span>
              <span>Navbatsiz</span>
              {filterEmptyQueue && <Check size={12} />}
            </button>
          )}

          {/* Namozxona */}
          <button
            className={`toggle-chip ${filterNamozxona ? 'active' : ''}`}
            onClick={() => setFilterNamozxona(!filterNamozxona)}
          >
            <span>🕌 Namozxona</span>
            {filterNamozxona && <Check size={12} />}
          </button>

          {/* Avtoyuvish */}
          {activeCategory === 'fuel' && (
            <button
              className={`toggle-chip ${filterAvtoyuvish ? 'active' : ''}`}
              onClick={() => setFilterAvtoyuvish(!filterAvtoyuvish)}
            >
              <span>🚿 Avtoyuvish</span>
              {filterAvtoyuvish && <Check size={12} />}
            </button>
          )}
        </div>

        {/* VIEW MODE SWITCHER (List / Map / Split) */}
        <div className="view-mode-group">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Faqat Ro'yxat ko'rinishi"
          >
            <List size={16} />
            <span className="hide-sm">Ro'yxat</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Ikkala ko'rinish (Xarita + Ro'yxat)"
          >
            <Layers size={16} />
            <span className="hide-sm">Kombinatsiya</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            title="Faqat Xarita ko'rinishi"
          >
            <Map size={16} />
            <span className="hide-sm">Xarita</span>
          </button>
        </div>
      </div>
    </div>
  );
}

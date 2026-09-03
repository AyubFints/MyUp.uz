import React from 'react';
import { Fuel, HeartPulse, Utensils, Wrench, Bookmark, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

export default function CategoryTabs({ activeCategory, onSelectCategory, counts }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Fuel': return <Fuel size={20} />;
      case 'Cross': return <HeartPulse size={20} />;
      case 'Utensils': return <Utensils size={20} />;
      case 'Wrench': return <Wrench size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  return (
    <div className="category-tabs-container">
      <div className="category-tabs-scroll">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = counts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              className={`category-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="category-icon-box" style={{ color: isActive ? '#fff' : cat.color }}>
                {getIcon(cat.icon)}
              </span>
              <div className="category-tab-info">
                <span className="category-title">{cat.label}</span>
                <span className="category-badge">{count} ta joy</span>
              </div>
              {isActive && <div className="active-indicator-glow"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

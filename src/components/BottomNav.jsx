import React from 'react';
import { Home, Search, Map, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav-bar">
      <button 
        className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <Home size={22} className="nav-icon" />
        <span>Asosiy</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => setActiveTab('search')}
      >
        <Search size={22} className="nav-icon" />
        <span>Qidiruv</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
      >
        <Map size={22} className="nav-icon" />
        <span>Xarita</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'my' ? 'active' : ''}`}
        onClick={() => setActiveTab('my')}
      >
        <User size={22} className="nav-icon" />
        <span>Profilim</span>
      </button>
    </nav>
  );
}

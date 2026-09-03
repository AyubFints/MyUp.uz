import React from 'react';
import { 
  Search, MapPin, Moon, Sun, User as UserIcon, PlusCircle, 
  Fuel, Sparkles, Navigation, Bookmark, Heart
} from 'lucide-react';
import { CITIES } from '../data/mockData';

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedCity,
  setSelectedCity,
  theme,
  setTheme,
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenAddModal,
  onDetectLocation,
  isDetectingLocation,
  activeTab,
  setActiveTab,
  favoritesCount,
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* LOGO BRAND */}
        <div className="brand-section" onClick={() => setActiveTab('fuel')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo-icon">
            <Fuel size={24} className="fuel-icon-glow" />
            <span className="logo-pulse"></span>
          </div>
          <div className="brand-titles">
            <div className="brand-name-row">
              <span className="brand-main">MyUp</span>
              <span className="brand-domain">.uz</span>
            </div>
            <span className="brand-tagline">Eng yaqin zapravka va xizmatlar</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="header-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Zapravka, metan bosimi, benzin, oshxona yoki shifoxona qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* CONTROLS (City selector, Locate me, Theme, Auth/Profile) */}
        <div className="header-actions">
          {/* City Selector */}
          <div className="city-select-box">
            <MapPin size={16} className="city-pin-icon" />
            <select
              value={selectedCity.id}
              onChange={(e) => {
                const city = CITIES.find((c) => c.id === e.target.value);
                if (city) setSelectedCity(city);
              }}
              className="city-dropdown"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Detect Location Button */}
          <button 
            className={`locate-btn ${isDetectingLocation ? 'loading' : ''}`}
            onClick={onDetectLocation}
            title="Mening jonli joylashuvimni aniqlash"
          >
            <Navigation size={16} className={isDetectingLocation ? 'spin-anim' : ''} />
            <span className="hide-mobile">Eng yaqin</span>
          </button>

          {/* Favorites quick button */}
          <button 
            className={`fav-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'favorites' ? 'fuel' : 'favorites')}
            title="Saqlangan sevimlilar"
          >
            <Heart size={18} fill={favoritesCount > 0 ? '#ef4444' : 'none'} color={favoritesCount > 0 ? '#ef4444' : 'currentColor'} />
            {favoritesCount > 0 && <span className="fav-badge">{favoritesCount}</span>}
          </button>

          {/* Add Station Button */}
          <button 
            className="add-place-btn"
            onClick={onOpenAddModal}
            title="Yangi zapravka yoki joy qo'shish"
          >
            <PlusCircle size={18} />
            <span className="hide-mobile">Joy qo'shish</span>
          </button>

          {/* Theme Switcher */}
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘u rejim'}
            aria-label="Rejimni o'zgartirish"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Auth / Profile Button */}
          {user ? (
            <button className="user-profile-btn" onClick={onOpenProfile}>
              <div className="user-avatar-small">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.firstName} />
                ) : (
                  <span>{user.firstName ? user.firstName[0].toUpperCase() : 'U'}</span>
                )}
              </div>
              <span className="user-name-text hide-mobile">{user.firstName}</span>
            </button>
          ) : (
            <button className="login-trigger-btn" onClick={onOpenAuth}>
              <UserIcon size={16} />
              <span>Kirish</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

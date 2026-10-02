import React, { useState, useEffect, useMemo } from 'react';
import AuthScreen from './components/AuthScreen';
import BottomNav from './components/BottomNav';
import StationCard from './components/StationCard';
import StationDetailModal from './components/StationDetailModal';
import ProfileDetailModal from './components/ProfileDetailModal';
import AddStationModal from './components/AddStationModal';
import MapView from './components/MapView';
import NavigationMode from './components/NavigationMode';
import SplashScreen from './components/SplashScreen';
import { CITIES, INITIAL_STATIONS } from './data/mockData';
import { calculateDistance } from './utils/distance';
import { Fuel, Flame, Droplets, Zap, User, ChevronRight, Plus, Edit3, MapPin, Star, Clock, Phone, Settings, Home, Search, Map } from 'lucide-react';
import './App.css';

export default function App() {
  // Eski dark temani tozalash va light ga o'tkazish
  const [theme] = useState(() => {
    localStorage.setItem('myup_theme', 'light');
    return 'light';
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('myup_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showSplash, setShowSplash] = useState(() => {
    const savedUser = localStorage.getItem('myup_user');
    const splashShown = sessionStorage.getItem('myup_splash_shown');
    return Boolean(savedUser) && !splashShown;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('myup_splash_shown', 'true');
    setShowSplash(false);
  };

  const [activeTab, setActiveTab] = useState('home');

  // Telefon ortga tugmasi uchun (Back Button)
  useEffect(() => {
    window.history.replaceState({ tab: 'home' }, '');
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    window.history.pushState({ tab: newTab }, '');
    setActiveTab(newTab);
  };

  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('myup_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Foydalanuvchi yaratgan shahobchalar
  const [myStations, setMyStations] = useState(() => {
    try {
      const saved = localStorage.getItem('myup_my_stations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddStation, setShowAddStation] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  
  // Custom Reopen Modal
  const [reopenModal, setReopenModal] = useState({ isOpen: false, stationId: null });
  const [reopenTimeInput, setReopenTimeInput] = useState('');

  // Quick Gas Pressure Edit
  const [editingPressureId, setEditingPressureId] = useState(null);
    const [tempPressure, setTempPressure] = useState('');
    
    // Quick Price Edit
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [editingPriceType, setEditingPriceType] = useState(null);
    const [tempPrice, setTempPrice] = useState('');

  // In-App Navigation State
  const [navigationTarget, setNavigationTarget] = useState(null);

  const [selectedCity] = useState(CITIES[0]);
  const [userCoords, setUserCoords] = useState({ lat: 41.311081, lng: 69.240562 });

  // Category & sub-filter (global — hamma tabda ishlaydi)
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'fuel'
  const [fuelSubFilter, setFuelSubFilter] = useState('all');
  const [fuelSortBy, setFuelSortBy] = useState('nearest'); // nearest, nearest_cheap, cheapest, nearest_best

  const [searchQuery, setSearchQuery] = useState('');
  const [detailStation, setDetailStation] = useState(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('myup_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('myup_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('myup_my_stations', JSON.stringify(myStations));
  }, [myStations]);

  useEffect(() => {
    setUserCoords({ lat: selectedCity.lat, lng: selectedCity.lng });
  }, [selectedCity]);

  const handleToggleFavorite = (stationId) => {
    if (favorites.includes(stationId)) {
      setFavorites(favorites.filter((id) => id !== stationId));
    } else {
      setFavorites([...favorites, stationId]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('myup_user');
    setUser(null);
  };

  const handleRateStation = (stationId, newRating) => {
    const updateFn = (st) => {
      if (st.id === stationId) {
        const currentCount = st.reviewsCount || 1;
        const currentRating = st.rating || 5.0;
        const newCount = currentCount + 1;
        const newAvg = ((currentRating * currentCount) + newRating) / newCount;
        return { ...st, rating: newAvg, reviewsCount: newCount };
      }
      return st;
    };
    setStations(stations.map(updateFn));
    setMyStations(myStations.map(updateFn));
  };

  const handleNavigate = (station) => {
    const url = `https://yandex.uz/maps/?rtext=~${station.lat},${station.lng}&rtt=auto`;
    window.open(url, '_blank');
  };

  // Shahobcha saqlash / tahrirlash
  const handleSaveStation = (station) => {
    station.createdBy = user?.id;
    const exists = myStations.find(s => s.id === station.id);
    if (exists) {
      setMyStations(myStations.map(s => s.id === station.id ? station : s));
    } else {
      setMyStations([...myStations, station]);
    }
  };

  const handleEditStation = (station) => {
    setEditingStation(station);
    setShowAddStation(true);
  };

  const handleSaveQuickPressure = (e, stId) => {
      e.stopPropagation();
      if (editingPressureId === stId) {
        const p = parseInt(tempPressure);
        setMyStations(myStations.map(s => 
          s.id === stId ? { ...s, gasPressure: p || null } : s
        ));
        setEditingPressureId(null);
      }
    };

    const handleSaveQuickPrice = (e, stId) => {
      e.stopPropagation();
      if (editingPriceId === stId && editingPriceType) {
        const p = parseInt(tempPrice);
        setMyStations(myStations.map(s => {
          if (s.id === stId) {
            const updatedPrices = { ...(s.prices || {}) };
            if (!isNaN(p) && p > 0) updatedPrices[editingPriceType] = p;
            else delete updatedPrices[editingPriceType];
            return { ...s, prices: updatedPrices };
          }
          return s;
        }));
        setEditingPriceId(null);
        setEditingPriceType(null);
      }
    };

  const handleSetStatus = (e, stationId, makeOpen) => {
    e.stopPropagation();
    const station = myStations.find(s => s.id === stationId);
    if (!station) return;

    if (station.isOpen === makeOpen) return;

    if (!makeOpen) {
      // Yopish modalini chaqirish
      setReopenTimeInput('');
      setReopenModal({ isOpen: true, stationId });
    } else {
      // Ochish
      setMyStations(myStations.map(s =>
        s.id === stationId ? { ...s, isOpen: true, reopenTime: '' } : s
      ));
    }
  };

  const submitReopenTime = () => {
    setMyStations(myStations.map(s =>
      s.id === reopenModal.stationId ? { ...s, isOpen: false, reopenTime: reopenTimeInput || '' } : s
    ));
    setReopenModal({ isOpen: false, stationId: null });
  };

  const filteredStations = useMemo(() => {
    const allStations = [...stations, ...myStations];
    let result = allStations
      .map((st) => ({
        ...st,
        calculatedDistance: calculateDistance(userCoords.lat, userCoords.lng, st.lat, st.lng),
      }))
      .filter((st) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = st.name.toLowerCase().includes(q) || st.brand?.toLowerCase().includes(q) || st.address?.toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (activeCategory === 'fuel' && fuelSubFilter !== 'all' && !st.type?.includes(fuelSubFilter)) return false;
        return true;
      });

    if (activeCategory === 'fuel') {
      const getPrice = (st) => {
        if (!st.prices) return Infinity;
        if (fuelSubFilter === 'all') {
          const vals = Object.values(st.prices).filter(p => p > 0);
          return vals.length > 0 ? Math.min(...vals) : Infinity;
        }
        return st.prices[fuelSubFilter] || Infinity;
      };

      if (fuelSortBy === 'nearest') {
        result.sort((a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0));
      } else if (fuelSortBy === 'cheapest') {
        result.sort((a, b) => {
          const pA = getPrice(a);
          const pB = getPrice(b);
          if (pA < pB) return -1;
          if (pA > pB) return 1;
          return (a.calculatedDistance || 0) - (b.calculatedDistance || 0);
        });
      } else if (fuelSortBy === 'nearest_cheap') {
        result.sort((a, b) => {
          const aNear = (a.calculatedDistance || 0) <= 20;
          const bNear = (b.calculatedDistance || 0) <= 20;
          if (aNear && !bNear) return -1;
          if (!aNear && bNear) return 1;
          const pA = getPrice(a);
          const pB = getPrice(b);
          if (pA < pB) return -1;
          if (pA > pB) return 1;
          return (a.calculatedDistance || 0) - (b.calculatedDistance || 0);
        });
      } else if (fuelSortBy === 'nearest_best') {
        result.sort((a, b) => {
          const aNear = (a.calculatedDistance || 0) <= 28;
          const bNear = (b.calculatedDistance || 0) <= 28;
          if (aNear && !bNear) return -1;
          if (!aNear && bNear) return 1;
          const rA = a.rating || 0;
          const rB = b.rating || 0;
          if (rA !== rB) return rB - rA;
          return (a.calculatedDistance || 0) - (b.calculatedDistance || 0);
        });
      }
    } else {
      result.sort((a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0));
    }
    
    return result;
  }, [stations, myStations, searchQuery, activeCategory, fuelSubFilter, fuelSortBy, userCoords]);



  if (navigationTarget) {
    return (
      <NavigationMode 
        targetStation={navigationTarget} 
        userCoords={userCoords}
        onClose={() => setNavigationTarget(null)} 
      />
    );
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="top-header">
        <div className="logo-text">myup.uz</div>
        
        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <button className={`desktop-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleTabChange('home')}>
            <Search size={18} /> <span>Qidiruv</span>
          </button>
          <button className={`desktop-nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => handleTabChange('map')}>
            <Map size={18} /> <span>Xarita</span>
          </button>
          <button className={`desktop-nav-item ${activeTab === 'services' ? 'active' : ''}`} onClick={() => handleTabChange('services')}>
            <Settings size={18} /> <span>Xizmatlar</span>
          </button>
          <button className={`desktop-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            <User size={18} /> <span>Profil</span>
          </button>
          <button className="desktop-nav-item" onClick={() => setShowSettingsModal(true)}>
            <Settings size={18} /> <span>Sozlamalar</span>
          </button>
        </nav>
        
        {/* Mobile Profile Btn */}
        <button className="mobile-profile-btn">
          <User size={20} />
        </button>
      </header>

      <div className="app-content">
        {/* LEFT PANEL / MOBILE MAIN */}
        <div className="left-panel" style={{ display: (activeTab === 'home' || activeTab === 'search') ? 'flex' : 'none' }}>
          
          {/* FUEL TYPE GRID */}
          <div className="fuel-filters-grid">
            <button 
              className={`fuel-btn ${fuelSubFilter === 'metan' ? 'active' : ''}`} 
              onClick={() => { setActiveCategory('fuel'); setFuelSubFilter('metan'); }}
            >
              <Fuel className="fuel-icon" size={20} /> Metan Gaz
            </button>
            <button 
              className={`fuel-btn ${fuelSubFilter === 'benzin' ? 'active' : ''}`} 
              onClick={() => { setActiveCategory('fuel'); setFuelSubFilter('benzin'); }}
            >
              <Droplets className="fuel-icon" size={20} /> Benzin
            </button>
            <button 
              className={`fuel-btn ${fuelSubFilter === 'propan' ? 'active' : ''}`} 
              onClick={() => { setActiveCategory('fuel'); setFuelSubFilter('propan'); }}
            >
              <Flame className="fuel-icon" size={20} /> Propan
            </button>
            <button 
              className={`fuel-btn ${fuelSubFilter === 'elektr' ? 'active' : ''}`} 
              onClick={() => { setActiveCategory('fuel'); setFuelSubFilter('elektr'); }}
            >
              <Zap className="fuel-icon" size={20} /> Elektr Zaryadlash
            </button>
          </div>

          {/* SORT PILLS */}
          <div className="sort-pills-scroll">
            <button 
              className={`sort-pill ${fuelSortBy === 'nearest' ? 'active' : ''}`}
              onClick={() => setFuelSortBy('nearest')}
            >Eng Yaqin</button>
            <button 
              className={`sort-pill ${fuelSortBy === 'nearest_best' ? 'active' : ''}`}
              onClick={() => setFuelSortBy('nearest_best')}
            >Eng Sifatli</button>
            <button 
              className={`sort-pill ${fuelSortBy === 'cheapest' ? 'active' : ''}`}
              onClick={() => setFuelSortBy('cheapest')}
            >Eng Arzon</button>
          </div>

          {/* LIST */}
          <div className="station-list">
            {filteredStations.map(station => (
              <StationCard
                key={station.id}
                station={station}
                userDistance={station.calculatedDistance}
                isFavorite={favorites.includes(station.id)}
                onToggleFavorite={null} 
                onSelectStation={setDetailStation}
              />
            ))}
            
            {/* MOBILE MAP PREVIEW */}
            <div className="mobile-map-preview" onClick={() => handleTabChange('map')}>
              <div className="mmp-text">
                <h3>Xaritada ko'rish</h3>
                <p>Top un Karitadi korls.</p>
              </div>
              <div className="mmp-image">
                <img src="/map-preview.jpg" alt="Map" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL MAP (Desktop) */}
        <div className="right-panel-map" style={{ display: activeTab === 'map' ? 'block' : '' }}>
          <MapView />
        </div>
      </div>
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal
        user={user}
        isOpen={showProfileDetail}
        onClose={() => setShowProfileDetail(false)}
        onUpdateUser={setUser}
        onLogout={handleLogout}
      />

      {/* Add / Edit Station Modal */}
      <AddStationModal
        isOpen={showAddStation}
        onClose={() => { setShowAddStation(false); setEditingStation(null); }}
        onSave={handleSaveStation}
        editStation={editingStation}
      />

      <StationDetailModal
        station={detailStation}
        userDistance={detailStation ? calculateDistance(userCoords.lat, userCoords.lng, detailStation.lat, detailStation.lng) : 0}
        onClose={() => setDetailStation(null)}
        onStartNavigation={(target) => setNavigationTarget(target)}
        onRateStation={handleRateStation}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="add-station-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="reopen-modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Sozlamalar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="add-st-submit-btn" 
                style={{ background: '#fee2e2', color: '#ef4444', boxShadow: 'none' }}
                onClick={() => { setShowSettingsModal(false); setShowLogoutConfirm(true); }}
              >
                Dasturdan chiqish
              </button>
              <button 
                className="add-st-submit-btn" 
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', boxShadow: 'none' }}
                onClick={() => setShowSettingsModal(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="add-station-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="reopen-modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Tizimdan chiqish
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Rostdan ham tizimdan (dasturdan) chiqmoqchimisiz?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="add-st-submit-btn" 
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', boxShadow: 'none' }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Yo'q
              </button>
              <button 
                className="add-st-submit-btn" 
                style={{ background: '#ef4444', color: 'white', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yopish vaqti Modali */}
      {reopenModal.isOpen && (
        <div className="add-station-overlay" onClick={() => setReopenModal({ isOpen: false, stationId: null })}>
          <div className="reopen-modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Qachon ochiladi?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Foydalanuvchilarga ma'lumot berish uchun taxminiy vaqtni yozing.
            </p>
            <input 
              type="text" 
              placeholder="Masalan: 08:00, Ertaga ertalab" 
              value={reopenTimeInput}
              onChange={e => setReopenTimeInput(e.target.value)}
              className="add-st-input"
              style={{ marginBottom: '16px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="add-st-submit-btn" 
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', boxShadow: 'none' }}
                onClick={() => setReopenModal({ isOpen: false, stationId: null })}
              >
                Bekor qilish
              </button>
              <button className="add-st-submit-btn" onClick={submitReopenTime}>
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}



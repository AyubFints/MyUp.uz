import React, { useState, useEffect, useMemo } from "react";
import AuthScreen from "./components/AuthScreen";
import BottomNav from "./components/BottomNav";
import StationCard from "./components/StationCard";
import StationDetailModal from "./components/StationDetailModal";
import ProfileDetailModal from "./components/ProfileDetailModal";
import AddStationModal from "./components/AddStationModal";
import MapView from "./components/MapView";
import NavigationMode from "./components/NavigationMode";
import SplashScreen from "./components/SplashScreen";
import { CITIES, INITIAL_STATIONS } from "./data/mockData";
import { calculateDistance } from "./utils/distance";
import {
  Menu,
  Fuel,
  Flame,
  Droplets,
  Zap,
  User,
  ChevronRight,
  Plus,
  Edit3,
  MapPin,
  Star,
  Clock,
  Phone,
  Settings,
  Home,
  Search,
  Map,
} from "lucide-react";
import "./App.css";

export default function App() {
  // Eski dark temani tozalash va light ga o'tkazish
  const [theme] = useState(() => {
    localStorage.setItem("myup_theme", "light");
    return "light";
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showSplash, setShowSplash] = useState(() => {
    const savedUser = localStorage.getItem("myup_user");
    const splashShown = sessionStorage.getItem("myup_splash_shown");
    return Boolean(savedUser) && !splashShown;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("myup_splash_shown", "true");
    setShowSplash(false);
  };

  const [activeTab, setActiveTab] = useState("home");

  // Telefon ortga tugmasi uchun (Back Button)
  useEffect(() => {
    window.history.replaceState({ tab: "home" }, "");
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        setActiveTab("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    window.history.pushState({ tab: newTab }, "");
    setActiveTab(newTab);
  };

  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Foydalanuvchi yaratgan shahobchalar
  const [myStations, setMyStations] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_my_stations");
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
  const [reopenModal, setReopenModal] = useState({
    isOpen: false,
    stationId: null,
  });
  const [reopenTimeInput, setReopenTimeInput] = useState("");

  // Quick Gas Pressure Edit
  const [editingPressureId, setEditingPressureId] = useState(null);
  const [tempPressure, setTempPressure] = useState("");

  // Quick Price Edit
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceType, setEditingPriceType] = useState(null);
  const [tempPrice, setTempPrice] = useState("");

  // In-App Navigation State
  const [navigationTarget, setNavigationTarget] = useState(null);

  const [selectedCity] = useState(CITIES[0]);
  const [userCoords, setUserCoords] = useState({
    lat: 41.311081,
    lng: 69.240562,
  });

  // Category & sub-filter (global — hamma tabda ishlaydi)
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'fuel'
  const [fuelSubFilter, setFuelSubFilter] = useState("all");
  const [fuelSortBy, setFuelSortBy] = useState("nearest"); // nearest, nearest_cheap, cheapest, nearest_best

  const [searchQuery, setSearchQuery] = useState("");
  const [detailStation, setDetailStation] = useState(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("myup_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("myup_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("myup_my_stations", JSON.stringify(myStations));
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
    localStorage.removeItem("myup_user");
    setUser(null);
  };

  const handleRateStation = (stationId, newRating) => {
    const updateFn = (st) => {
      if (st.id === stationId) {
        const currentCount = st.reviewsCount || 1;
        const currentRating = st.rating || 5.0;
        const newCount = currentCount + 1;
        const newAvg = (currentRating * currentCount + newRating) / newCount;
        return { ...st, rating: newAvg, reviewsCount: newCount };
      }
      return st;
    };
    setStations(stations.map(updateFn));
    setMyStations(myStations.map(updateFn));
  };

  const handleNavigate = (station) => {
    const url = `https://yandex.uz/maps/?rtext=~${station.lat},${station.lng}&rtt=auto`;
    window.open(url, "_blank");
  };

  // Shahobcha saqlash / tahrirlash
  const handleSaveStation = (station) => {
    station.createdBy = user?.id;
    const exists = myStations.find((s) => s.id === station.id);
    if (exists) {
      setMyStations(myStations.map((s) => (s.id === station.id ? station : s)));
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
      setMyStations(
        myStations.map((s) =>
          s.id === stId ? { ...s, gasPressure: p || null } : s,
        ),
      );
      setEditingPressureId(null);
    }
  };

  const handleSaveQuickPrice = (e, stId) => {
    e.stopPropagation();
    if (editingPriceId === stId && editingPriceType) {
      const p = parseInt(tempPrice);
      setMyStations(
        myStations.map((s) => {
          if (s.id === stId) {
            const updatedPrices = { ...(s.prices || {}) };
            if (!isNaN(p) && p > 0) updatedPrices[editingPriceType] = p;
            else delete updatedPrices[editingPriceType];
            return { ...s, prices: updatedPrices };
          }
          return s;
        }),
      );
      setEditingPriceId(null);
      setEditingPriceType(null);
    }
  };

  const handleSetStatus = (e, stationId, makeOpen) => {
    e.stopPropagation();
    const station = myStations.find((s) => s.id === stationId);
    if (!station) return;

    if (station.isOpen === makeOpen) return;

    if (!makeOpen) {
      // Yopish modalini chaqirish
      setReopenTimeInput("");
      setReopenModal({ isOpen: true, stationId });
    } else {
      // Ochish
      setMyStations(
        myStations.map((s) =>
          s.id === stationId ? { ...s, isOpen: true, reopenTime: "" } : s,
        ),
      );
    }
  };

  const submitReopenTime = () => {
    setMyStations(
      myStations.map((s) =>
        s.id === reopenModal.stationId
          ? { ...s, isOpen: false, reopenTime: reopenTimeInput || "" }
          : s,
      ),
    );
    setReopenModal({ isOpen: false, stationId: null });
  };

  const filteredStations = useMemo(() => {
    const allStations = [...stations, ...myStations];
    let result = allStations
      .map((st) => ({
        ...st,
        calculatedDistance: calculateDistance(
          userCoords.lat,
          userCoords.lng,
          st.lat,
          st.lng,
        ),
      }))
      .filter((st) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            st.name.toLowerCase().includes(q) ||
            st.brand?.toLowerCase().includes(q) ||
            st.address?.toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (
          activeCategory === "fuel" &&
          fuelSubFilter !== "all" &&
          !st.type?.includes(fuelSubFilter)
        )
          return false;
        return true;
      });

    if (activeCategory === "fuel") {
      const getPrice = (st) => {
        if (!st.prices) return Infinity;
        if (fuelSubFilter === "all") {
          const vals = Object.values(st.prices).filter((p) => p > 0);
          return vals.length > 0 ? Math.min(...vals) : Infinity;
        }
        return st.prices[fuelSubFilter] || Infinity;
      };

      if (fuelSortBy === "nearest") {
        result.sort(
          (a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0),
        );
      } else if (fuelSortBy === "cheapest") {
        result.sort((a, b) => {
          const pA = getPrice(a);
          const pB = getPrice(b);
          if (pA < pB) return -1;
          if (pA > pB) return 1;
          return (a.calculatedDistance || 0) - (b.calculatedDistance || 0);
        });
      } else if (fuelSortBy === "nearest_cheap") {
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
      } else if (fuelSortBy === "nearest_best") {
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
      result.sort(
        (a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0),
      );
    }

    return result;
  }, [
    stations,
    myStations,
    searchQuery,
    activeCategory,
    fuelSubFilter,
    fuelSortBy,
    userCoords,
  ]);

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
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Ambient background light */}
      <div className="ambient-glow-top"></div>
      <div className="ambient-glow-bottom"></div>

      {/* NEW DARK HOME SPLIT LAYOUT */}

      {/* NEW GLOBAL DARK HEADER */}
      <header className="top-header">
        <div
          className="logo"
          onClick={() => handleTabChange("home")}
          style={{ cursor: "pointer" }}
        >
          <h1>
            myup.<span style={{ color: "#38bdf8" }}>uz</span>
          </h1>
        </div>
        <nav className="desktop-nav">
          <button
            className={`desktop-nav-item ${activeTab === "search" ? "active" : ""}`}
            onClick={() => handleTabChange("search")}
          >
            <Search size={18} className="desktop-nav-icon" />
            <span>Qidiruv</span>
          </button>
          <button
            className={`desktop-nav-item ${activeTab === "map" ? "active" : ""}`}
            onClick={() => handleTabChange("map")}
          >
            <Map size={18} className="desktop-nav-icon" />
            <span>Xarita</span>
          </button>
          <button
            className={`desktop-nav-item ${activeTab === "services" ? "active" : ""}`}
            onClick={() => alert("Xizmatlar hozircha tayyor emas")}
          >
            <Menu size={18} className="desktop-nav-icon" />
            <span>Xizmatlar</span>
          </button>
          <button
            className={`desktop-nav-item ${activeTab === "my" ? "active" : ""}`}
            onClick={() => handleTabChange("my")}
          >
            <User size={18} className="desktop-nav-icon" />
            <span>Profil</span>
          </button>
          <button
            className="desktop-nav-item"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={18} className="desktop-nav-icon" />
            <span>Sozlamalar</span>
          </button>
        </nav>
      </header>

      {activeTab === "home" && (
        <div className="dark-theme-home">
          <div className="app-content">
            {/* LEFT PANEL */}
            <div className="left-panel">
              <div className="fuel-filter-grid">
                <button
                  className={`fuel-btn ${fuelSubFilter === "metan" ? "active" : ""}`}
                  onClick={() => setFuelSubFilter("metan")}
                >
                  <Flame className="fuel-icon" size={20} /> Metan Gaz
                </button>
                <button
                  className={`fuel-btn ${fuelSubFilter === "benzin" ? "active" : ""}`}
                  onClick={() => setFuelSubFilter("benzin")}
                >
                  <Droplets className="fuel-icon" size={20} /> Benzin
                </button>
                <button
                  className={`fuel-btn ${fuelSubFilter === "propan" ? "active" : ""}`}
                  onClick={() => setFuelSubFilter("propan")}
                >
                  <Flame className="fuel-icon" size={20} /> Propan
                </button>
                <button
                  className={`fuel-btn ${fuelSubFilter === "elektr" ? "active" : ""}`}
                  onClick={() => setFuelSubFilter("elektr")}
                >
                  <Zap className="fuel-icon" size={20} /> Elektr Zaryadlash
                </button>
              </div>

              <div className="station-list">
                {filteredStations.map((station) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    userDistance={station.calculatedDistance}
                    isFavorite={favorites.includes(station.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectStation={setDetailStation}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT PANEL MAP */}
            <div className="right-panel-map">
              <MapView />
            </div>
          </div>
        </div>
      )}

      {activeTab !== "home" && (
        <main className="content-area pb-20">
          {/* ===== GLOBAL: Category Tabs (faqat Home va Qidiruvda) ===== */}
          {activeTab === "search" && (
            <>
              <div className="home-category-tabs layout-padding">
                <button
                  className={`home-cat-btn ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory("all");
                    setFuelSubFilter("all");
                  }}
                >
                  Barchasi
                </button>
                <button
                  className={`home-cat-btn ${activeCategory === "fuel" ? "active" : ""}`}
                  onClick={() => setActiveCategory("fuel")}
                >
                  <Fuel size={16} />
                  Yoqilg'i shahobchasi
                </button>
                {/* Keyinchalik boshqa kategoriyalar shu yerga qo'shiladi */}
              </div>

              {/* Sub-filters (faqat Yoqilg'i shahobchasi tanlanganda) */}
              <div
                className={`fuel-filters-wrapper smooth-transition ${activeCategory === "fuel" ? "show" : "hide"}`}
              >
                <div className="transition-inner">
                  <div className="home-sub-filters layout-padding">
                    <button
                      className={`sub-filter-pill ${fuelSubFilter === "all" ? "active" : ""}`}
                      onClick={() => setFuelSubFilter("all")}
                    >
                      Barchasi
                    </button>
                    <button
                      className={`sub-filter-pill gaz ${fuelSubFilter === "metan" ? "active" : ""}`}
                      onClick={() => setFuelSubFilter("metan")}
                    >
                      <Flame size={14} />
                      Gaz (Metan)
                    </button>
                    <button
                      className={`sub-filter-pill propan ${fuelSubFilter === "propan" ? "active" : ""}`}
                      onClick={() => setFuelSubFilter("propan")}
                    >
                      <Droplets size={14} />
                      Propan
                    </button>
                    <button
                      className={`sub-filter-pill benzin ${fuelSubFilter === "benzin" ? "active" : ""}`}
                      onClick={() => setFuelSubFilter("benzin")}
                    >
                      <Fuel size={14} />
                      Benzin
                    </button>
                    <button
                      className={`sub-filter-pill elektr ${fuelSubFilter === "elektr" ? "active" : ""}`}
                      onClick={() => setFuelSubFilter("elektr")}
                    >
                      <Zap size={14} />
                      Elektr
                    </button>
                  </div>

                  {/* SORTING TABS (Turtinchi qator) */}
                  {/* SORTING TABS (Turtinchi qator) */}
                  <div
                    className={`home-sort-filters-wrapper ${fuelSubFilter !== "all" ? "expanded" : "collapsed"}`}
                  >
                    <div className="home-sort-filters layout-padding mt-2 mb-2">
                      <button
                        className={`sort-pill ${fuelSortBy === "nearest" ? "active" : ""}`}
                        onClick={() => setFuelSortBy("nearest")}
                      >
                        Eng yaqini
                      </button>
                      <button
                        className={`sort-pill ${fuelSortBy === "nearest_cheap" ? "active" : ""}`}
                        onClick={() => setFuelSortBy("nearest_cheap")}
                      >
                        Eng yaqin va arzoni
                      </button>
                      <button
                        className={`sort-pill ${fuelSortBy === "cheapest" ? "active" : ""}`}
                        onClick={() => setFuelSortBy("cheapest")}
                      >
                        Eng arzoni
                      </button>
                      <button
                        className={`sort-pill ${fuelSortBy === "nearest_best" ? "active" : ""}`}
                        onClick={() => setFuelSortBy("nearest_best")}
                      >
                        Eng yaqin va sifatligi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== TAB CONTENT ===== */}

          {/* HOME */}
          {activeTab === "search" && (
            <div className="tab-view fade-in layout-padding">
              <div className="search-page-header mt-4">
                <div className="search-input-box">
                  <input
                    type="text"
                    placeholder="Zapravka nomini yozing..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-full-input"
                  />
                </div>
              </div>
              <div className="cards-stream-container mt-4">
                {filteredStations.map((st) => (
                  <StationCard
                    key={st.id}
                    station={st}
                    userDistance={st.calculatedDistance}
                    isFavorite={favorites.includes(st.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectStation={(s) => setDetailStation(s)}
                    onNavigate={handleNavigate}
                  />
                ))}
                {filteredStations.length === 0 && (
                  <div className="empty-home-state">
                    <Fuel size={48} className="empty-icon" />
                    <p>Natija topilmadi</p>
                    <span>Boshqa nom bilan qidirib ko'ring</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAP */}
          {activeTab === "map" && (
            <div className="tab-view fade-in">
              <div className="map-full-container">
                <MapView />
              </div>
            </div>
          )}

          {/* MY (PROFILE) */}
          {activeTab === "my" && !user && (
            <div
              className="tab-view fade-in layout-padding"
              style={{
                height: "100vh",
                paddingBottom: "70px",
                overflowY: "auto",
              }}
            >
              <AuthScreen onLoginSuccess={setUser} />
            </div>
          )}
          {activeTab === "my" && user && (
            <div className="tab-view fade-in layout-padding">
              {/* Header */}
              <div style={{ marginTop: "16px" }}>
                <h2
                  style={{
                    fontSize: "1.2rem",
                    color: "var(--text-primary)",
                    margin: 0,
                    fontWeight: "700",
                  }}
                >
                  Profil
                </h2>
              </div>

              {/* Profil kartochkasi */}
              <div className="profile-page-card mt-3">
                <div className="profile-header-banner">
                  <div className="profile-names-block">
                    <h3>
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <span className="profile-user-phone">
                      {user?.phoneNumber}
                    </span>
                  </div>
                  <div
                    className="profile-avatar-box clickable"
                    onClick={() => setShowProfileDetail(true)}
                  >
                    {user?.avatar && !user?.avatar.includes("dicebear") ? (
                      <img src={user?.avatar} alt={user?.firstName} />
                    ) : (
                      <User size={28} />
                    )}
                    <div className="profile-avatar-arrow">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mening manzillarim ro'yxati (tepada) */}
              {myStations.length > 0 && (
                <div className="my-stations-list mt-4">
                  <h4 className="my-stations-title">Mening manzillarim</h4>
                  {myStations.map((st) => {
                    const fuelLabel = (st.type || [])
                      .map((t) => {
                        if (t === "metan") return "Gaz";
                        if (t === "propan") return "Propan";
                        if (t === "benzin") return "Benzin";
                        if (t === "elektr") return "Elektr";
                        return t;
                      })
                      .join(", ");

                    return (
                      <div
                        key={st.id}
                        className="my-station-card-v2 clickable-card"
                        onClick={() => handleEditStation(st)}
                      >
                        {/* Chap: Ma'lumotlar */}
                        <div className="my-st-left">
                          <h5 className="my-st-name">{st.name}</h5>
                          <span className="my-st-type">
                            <Fuel size={12} />{" "}
                            {fuelLabel || "Yoqilg'i shahobchasi"}
                          </span>

                          {/* Yulduzcha reyting */}
                          <div className="my-st-rating">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={
                                  i <= (st.rating || 0) ? "#f59e0b" : "none"
                                }
                                color={
                                  i <= (st.rating || 0) ? "#f59e0b" : "#cbd5e1"
                                }
                              />
                            ))}
                            <span className="my-st-rating-num">
                              {st.rating || "—"}
                            </span>
                          </div>

                          {st.phone && (
                            <span className="my-st-phone">
                              <Phone size={12} /> {st.phone}
                            </span>
                          )}

                          {/* Ochiq / Yopiq */}
                          <div className="my-st-status-row">
                            <div className="status-toggle-group">
                              <button
                                className={`status-toggle-btn ${st.isOpen ? "active-open" : ""}`}
                                onClick={(e) => handleSetStatus(e, st.id, true)}
                              >
                                Ochiq
                              </button>
                              <button
                                className={`status-toggle-btn ${!st.isOpen ? "active-closed" : ""}`}
                                onClick={(e) =>
                                  handleSetStatus(e, st.id, false)
                                }
                              >
                                Yopiq
                              </button>
                            </div>
                            {!st.isOpen && st.reopenTime && (
                              <span className="my-st-reopen">
                                <Clock size={11} /> {st.reopenTime} gacha
                              </span>
                            )}
                          </div>

                          {/* Narxlar */}
                          {st.prices && Object.keys(st.prices).length > 0 && (
                            <div className="my-st-prices">
                              {Object.entries(st.prices).map(([key, val]) => (
                                <span key={key} className="my-st-price-badge">
                                  <strong>
                                    {key === "metan" ? "Gaz" : key}:
                                  </strong>{" "}
                                  {val} so'm
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Quick Edit Gas Pressure */}
                          {(st.type || []).includes("metan") && (
                            <div
                              className="my-st-quick-pressure"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {editingPressureId === st.id ? (
                                <div
                                  className="flex items-center gap-2 mt-3"
                                  style={{
                                    background: "#e0f2fe",
                                    padding: "8px",
                                    borderRadius: "12px",
                                    border: "1px solid #bae6fd",
                                  }}
                                >
                                  <input
                                    type="number"
                                    value={tempPressure}
                                    onChange={(e) =>
                                      setTempPressure(e.target.value)
                                    }
                                    autoFocus
                                    max={210}
                                    className="search-full-input"
                                    style={{
                                      width: "70px",
                                      padding: "4px 8px",
                                      height: "32px",
                                      border: "1px solid #0ea5e9",
                                    }}
                                  />
                                  <button
                                    className="status-toggle-btn active-open"
                                    style={{
                                      padding: "4px 8px",
                                      minHeight: "32px",
                                    }}
                                    onClick={(e) =>
                                      handleSaveQuickPressure(e, st.id)
                                    }
                                  >
                                    Saqlash
                                  </button>
                                  <button
                                    className="status-toggle-btn"
                                    style={{
                                      padding: "4px 8px",
                                      minHeight: "32px",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPressureId(null);
                                    }}
                                  >
                                    Bekor
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="mt-2"
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background:
                                      "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                                    padding: "8px 10px",
                                    borderRadius: "14px",
                                    border: "1px solid #bae6fd",
                                    boxShadow:
                                      "0 2px 8px rgba(2, 132, 199, 0.08)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        background: "#bae6fd",
                                        padding: "5px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Zap size={14} color="#0284c7" />
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "0.8rem",
                                        color: "#082f49",
                                        fontWeight: "600",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      Gaz bosimi:{" "}
                                      <strong
                                        style={{
                                          color: "#0284c7",
                                          fontSize: "0.85rem",
                                          marginLeft: "2px",
                                        }}
                                      >
                                        {st.gasPressure || "—"} atm
                                      </strong>
                                    </span>
                                  </div>
                                  <button
                                    style={{
                                      fontSize: "0.75rem",
                                      padding: "6px 10px",
                                      background:
                                        "linear-gradient(135deg, #0ea5e9, #0284c7)",
                                      color: "white",
                                      fontWeight: "bold",
                                      borderRadius: "16px",
                                      border: "none",
                                      cursor: "pointer",
                                      boxShadow:
                                        "0 2px 8px rgba(14, 165, 233, 0.3)",
                                      transition: "all 0.2s ease",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      whiteSpace: "nowrap",
                                      flexShrink: 0,
                                    }}
                                    onMouseOver={(e) =>
                                      (e.currentTarget.style.transform =
                                        "translateY(-2px)")
                                    }
                                    onMouseOut={(e) =>
                                      (e.currentTarget.style.transform =
                                        "translateY(0)")
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPressureId(st.id);
                                      setTempPressure(st.gasPressure || "");
                                    }}
                                  >
                                    <Edit3 size={12} />
                                    O'zgartirish
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Edit Price */}
                          {st.type &&
                            (st.type.includes("metan") ||
                              st.type.includes("propan")) && (
                              <div
                                className="my-st-quick-price mt-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {["metan", "propan"]
                                  .filter((t) => st.type.includes(t))
                                  .map((fuelType) => (
                                    <div key={fuelType} className="mb-2">
                                      {editingPriceId === st.id &&
                                      editingPriceType === fuelType ? (
                                        <div
                                          className="flex items-center gap-2 mt-1"
                                          style={{
                                            background: "#f8fafc",
                                            padding: "8px",
                                            borderRadius: "12px",
                                            border: "1px solid #e2e8f0",
                                          }}
                                        >
                                          <input
                                            type="number"
                                            value={tempPrice}
                                            onChange={(e) =>
                                              setTempPrice(e.target.value)
                                            }
                                            autoFocus
                                            className="search-full-input"
                                            style={{
                                              width: "90px",
                                              padding: "4px 8px",
                                              height: "32px",
                                              border: "1px solid #94a3b8",
                                              borderRadius: "8px",
                                              outline: "none",
                                            }}
                                            placeholder="Narx"
                                          />
                                          <button
                                            className="status-toggle-btn active-open"
                                            style={{
                                              padding: "4px 8px",
                                              minHeight: "32px",
                                              border: "none",
                                              background: "#3b82f6",
                                              color: "white",
                                              borderRadius: "8px",
                                              cursor: "pointer",
                                            }}
                                            onClick={(e) =>
                                              handleSaveQuickPrice(e, st.id)
                                            }
                                          >
                                            Saqlash
                                          </button>
                                          <button
                                            className="status-toggle-btn"
                                            style={{
                                              padding: "4px 8px",
                                              minHeight: "32px",
                                              border: "1px solid #cbd5e1",
                                              background: "transparent",
                                              borderRadius: "8px",
                                              cursor: "pointer",
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingPriceId(null);
                                              setEditingPriceType(null);
                                            }}
                                          >
                                            Bekor
                                          </button>
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            background:
                                              fuelType === "metan"
                                                ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                                                : "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                                            padding: "8px 10px",
                                            borderRadius: "14px",
                                            border:
                                              fuelType === "metan"
                                                ? "1px solid #bae6fd"
                                                : "1px solid #e9d5ff",
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.03)",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "6px",
                                            }}
                                          >
                                            <div
                                              style={{
                                                background:
                                                  fuelType === "metan"
                                                    ? "#bae6fd"
                                                    : "#e9d5ff",
                                                padding: "5px",
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              {fuelType === "metan" ? (
                                                <Flame
                                                  size={14}
                                                  color="#0284c7"
                                                />
                                              ) : (
                                                <Droplets
                                                  size={14}
                                                  color="#9333ea"
                                                />
                                              )}
                                            </div>
                                            <span
                                              style={{
                                                fontSize: "0.8rem",
                                                color:
                                                  fuelType === "metan"
                                                    ? "#082f49"
                                                    : "#3b0764",
                                                fontWeight: "600",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {fuelType === "metan"
                                                ? "Metan"
                                                : "Propan"}
                                              :{" "}
                                              <strong
                                                style={{
                                                  color:
                                                    fuelType === "metan"
                                                      ? "#0284c7"
                                                      : "#9333ea",
                                                  fontSize: "0.85rem",
                                                  marginLeft: "2px",
                                                }}
                                              >
                                                {st.prices?.[fuelType]
                                                  ? `${st.prices[fuelType].toLocaleString()} so'm`
                                                  : "—"}
                                              </strong>
                                            </span>
                                          </div>
                                          <button
                                            style={{
                                              fontSize: "0.75rem",
                                              padding: "6px 10px",
                                              background:
                                                fuelType === "metan"
                                                  ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                                                  : "linear-gradient(135deg, #a855f7, #9333ea)",
                                              color: "white",
                                              fontWeight: "bold",
                                              borderRadius: "16px",
                                              border: "none",
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "4px",
                                              whiteSpace: "nowrap",
                                              flexShrink: 0,
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingPriceId(st.id);
                                              setEditingPriceType(fuelType);
                                              setTempPrice(
                                                st.prices?.[fuelType] || "",
                                              );
                                            }}
                                          >
                                            <Edit3 size={12} /> O'zgartirish
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>

                        {/* O'ng: Rasm */}
                        <div className="my-st-right">
                          {st.image ? (
                            <img
                              src={st.image}
                              alt={st.name}
                              className="my-st-thumb"
                            />
                          ) : (
                            <div className="my-st-thumb-empty">
                              <Fuel size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Joylashuv qo'shish tugmasi (pastda) */}
              <button
                className="my-add-station-btn mt-4"
                onClick={() => {
                  setEditingStation(null);
                  setShowAddStation(true);
                }}
              >
                <div className="my-add-icon-circle">
                  <Plus size={20} />
                </div>
                <span>Joylashuv qo'shish</span>
              </button>
            </div>
          )}
        </main>
      )}

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
        onClose={() => {
          setShowAddStation(false);
          setEditingStation(null);
        }}
        onSave={handleSaveStation}
        editStation={editingStation}
      />

      <StationDetailModal
        station={detailStation}
        userDistance={
          detailStation
            ? calculateDistance(
                userCoords.lat,
                userCoords.lng,
                detailStation.lat,
                detailStation.lng,
              )
            : 0
        }
        onClose={() => setDetailStation(null)}
        onStartNavigation={(target) => setNavigationTarget(target)}
        onRateStation={handleRateStation}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="add-station-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Sozlamalar
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button
                className="add-st-submit-btn"
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  boxShadow: "none",
                }}
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowLogoutConfirm(true);
                }}
              >
                Dasturdan chiqish
              </button>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  boxShadow: "none",
                }}
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
        <div
          className="add-station-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              Tizimdan chiqish
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "20px",
              }}
            >
              Rostdan ham tizimdan (dasturdan) chiqmoqchimisiz?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  boxShadow: "none",
                }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Yo'q
              </button>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "#ef4444",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                }}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yopish vaqti Modali */}
      {reopenModal.isOpen && (
        <div
          className="add-station-overlay"
          onClick={() => setReopenModal({ isOpen: false, stationId: null })}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              Qachon ochiladi?
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              Foydalanuvchilarga ma'lumot berish uchun taxminiy vaqtni yozing.
            </p>
            <input
              type="text"
              placeholder="Masalan: 08:00, Ertaga ertalab"
              value={reopenTimeInput}
              onChange={(e) => setReopenTimeInput(e.target.value)}
              className="add-st-input"
              style={{ marginBottom: "16px" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  boxShadow: "none",
                }}
                onClick={() =>
                  setReopenModal({ isOpen: false, stationId: null })
                }
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

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSettings={() => setShowSettingsModal(true)}
      />
    </div>
  );
}

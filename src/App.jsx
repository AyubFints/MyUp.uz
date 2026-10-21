import React, { useState, useEffect, useMemo } from "react";
import AuthScreen from "./components/AuthScreen";
import BottomNav from "./components/BottomNav";
import StationCard from "./components/StationCard";
import StationCardSkeleton from "./components/StationCardSkeleton";
import StationDetailModal from "./components/StationDetailModal";
import ProfileDetailModal from "./components/ProfileDetailModal";
import AddStationModal from "./components/AddStationModal";
import MapView, { stationMatchesFuel, DEFAULT_DEMO_STATIONS } from "./components/MapView";
import NavigationMode from "./components/NavigationMode";
import SplashScreen from "./components/SplashScreen";
import SettingsSection, { THEME_PRESETS } from "./components/SettingsSection";
import { CITIES, INITIAL_STATIONS } from "./data/mockData";
import { calculateDistance } from "./utils/distance";
import {
  Menu,
  Fuel,
  Flame,
  Container,
  Cylinder,
  Plug,
  Droplets,
  Zap,
  User,
  ChevronRight,
  ChevronDown,
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
  X,
  Bookmark,
  Newspaper,
  Trash2,
  Play,
  Sparkles,
  Info,
  ArrowLeft,
  Bell,
  Check,
  Coffee,
  ShoppingBag,
  CreditCard,
  Banknote,
} from "lucide-react";
import "./App.css";


const MOCK_NEWS = [
  {
    id: 1,
    title: "Metan gaz bosimi barqaror",
    desc: "Toshkent shahridagi AGTKSh shahobchalarida gaz bosimi 200-210 atm darajasida me'yorda ishlamoqda.",
    date: "Bugun, 09:30",
    tag: "Metan",
    tagColor: "#0284c7",
  },
  {
    id: 2,
    title: "Yangi tezkor zaryadlash stansiyalari",
    desc: "Poytaxt va viloyat markazlarida 120 kVt quvvatli yangi elektromobil zaryadlash stansiyalari ishga tushirildi.",
    date: "Kecha, 18:45",
    tag: "Elektr",
    tagColor: "#10b981",
  },
  {
    id: 3,
    title: "AI-92 va AI-95 benzin narxlari",
    desc: "Barcha yoqilg'i shahobchalarida sifat va narx nazorati monitoringi olib borilmoqda.",
    date: "14 Oktabr",
    tag: "Benzin",
    tagColor: "#f59e0b",
  },
];

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

  // Telegram uslubidagi mavzu rangi (Sozlamalar bo'limi uchun)
  const [appTheme, setAppTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_theme_palette");
      return saved ? JSON.parse(saved) : THEME_PRESETS[0];
    } catch {
      return THEME_PRESETS[0];
    }
  });

  const isThemeLight = Boolean(
    appTheme?.isLight ||
    appTheme?.id === "default-white" ||
    appTheme?.bg === "#f8fafc" ||
    appTheme?.bg === "#ffffff"
  );

  const handleSaveTheme = (newTheme) => {
    setAppTheme(newTheme);
    localStorage.setItem("myup_theme_palette", JSON.stringify(newTheme));
  };

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
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [stationToDelete, setStationToDelete] = useState(null);

  // Custom Reopen Modal
  const [reopenModal, setReopenModal] = useState({
    isOpen: false,
    stationId: null,
  });
  const [reopenTimeInput, setReopenTimeInput] = useState("");

  // Station Manage Page state (Mening joylarim -> Alohida boshqarish bo'limi)
  const [selectedManageStationId, setSelectedManageStationId] = useState(null);
  const [showStationBellModal, setShowStationBellModal] = useState(false);
  const [editingPriceKey, setEditingPriceKey] = useState(null);
  const [tempPriceVal, setTempPriceVal] = useState("");
  const [showPhoneEditModal, setShowPhoneEditModal] = useState(false);
  const [pendingPhoneStationId, setPendingPhoneStationId] = useState(null);
  const [tempPhone, setTempPhone] = useState("");

  const currentManageStation = useMemo(() => {
    return myStations.find((s) => s.id === selectedManageStationId) || null;
  }, [myStations, selectedManageStationId]);

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
  const [activeCategory, setActiveCategory] = useState("fuel"); // 'all' | 'fuel'
  const [fuelSubFilter, setFuelSubFilter] = useState("metan");
  const [fuelSortBy, setFuelSortBy] = useState("nearest"); // nearest, nearest_cheap, cheapest, nearest_best

  const [searchQuery, setSearchQuery] = useState("");
  // Qidiruv tarixi
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddSearchHistory = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("myup_search_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleRemoveSearchHistory = (e, term) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem("myup_search_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem("myup_search_history");
    } catch (e) {}
  };

  const [detailStation, setDetailStation] = useState(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("myup_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("myup_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const [isLocating, setIsLocating] = useState(true);

  // Dasturga kirganda fon rejimida foydalanuvchi joylashuvini avtomatik aniqlash (xaritasiz)
  useEffect(() => {
    let hasResolved = false;

    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos && pos.coords) {
          const { latitude, longitude } = pos.coords;
          setUserCoords({ lat: latitude, lng: longitude });

          // 70% aniqlikdayoq (birinchi olingan aniq koordinatalar) pastdagi manzillar chiqishni boshlaydi
          if (!hasResolved) {
            hasResolved = true;
            setIsLocating(false);
          }
        }
      },
      (err) => {
        console.warn("Avtomatik geolokatsiya:", err?.message || err);
        if (!hasResolved) {
          hasResolved = true;
          setIsLocating(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 30000,
      }
    );

    // Agar geolokatsiya uzoq vaqt cho'zilsa, sahifa qotib turmasligi uchun fallback
    const fallbackTimer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        setIsLocating(false);
      }
    }, 2200);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimer);
    };
  }, []);

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
    setNavigationTarget(station);
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

  const handleConfirmDeleteStation = () => {
    if (!stationToDelete) return;
    const stId = stationToDelete.id;

    // Mening joylarim va umumiy ro'yxatdan o'chirish
    setMyStations((prev) => prev.filter((s) => s.id !== stId));
    setStations((prev) => prev.filter((s) => s.id !== stId));

    // Agar boshqaruv sahifasida turgan bo'lsa, chiqib ketish
    if (selectedManageStationId === stId) {
      setSelectedManageStationId(null);
    }
    // Agar tafsilotlar modali ochilgan bo'lsa, yopish
    if (detailStation?.id === stId) {
      setDetailStation(null);
    }

    setStationToDelete(null);
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
    if (e && e.stopPropagation) e.stopPropagation();
    const station = myStations.find((s) => s.id === stationId);
    if (!station) return;

    if (station.isOpen === makeOpen) return;

    if (!makeOpen) {
      // Yopish modalini chaqirish
      setReopenTimeInput("");
      setReopenModal({ isOpen: true, stationId });
    } else {
      // Ochish
      const updateFn = (s) =>
        s.id === stationId ? { ...s, isOpen: true, reopenTime: "" } : s;
      setMyStations((prev) => prev.map(updateFn));
      setStations((prev) => prev.map(updateFn));
    }
  };

  const submitReopenTime = () => {
    const updateFn = (s) =>
      s.id === reopenModal.stationId
        ? { ...s, isOpen: false, reopenTime: reopenTimeInput || "" }
        : s;
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));
    setReopenModal({ isOpen: false, stationId: null });
  };

  const allAvailableFuels = [
    { id: "metan", label: "Gaz (Metan)", icon: Flame, color: "#0ea5e9" },
    { id: "propan", label: "Propan", icon: Droplets, color: "#a855f7" },
    { id: "benzin", label: "Benzin", icon: Fuel, color: "#f59e0b" },
    { id: "elektr", label: "Elektr", icon: Zap, color: "#10b981" },
  ];

  const activeFuelsList = useMemo(() => {
    if (!currentManageStation) return [];
    const types = currentManageStation.type || [];
    if (types.length === 0) {
      return allAvailableFuels.slice(0, 2);
    }
    const matched = allAvailableFuels.filter((f) => types.includes(f.id));
    return matched.length > 0 ? matched : allAvailableFuels.slice(0, 2);
  }, [currentManageStation]);

  const pressureFuelsList = useMemo(() => {
    if (!currentManageStation) return [];
    const types = currentManageStation.type || [];
    const gasOnly = allAvailableFuels.filter(
      (f) =>
        (f.id === "metan" || f.id === "propan") &&
        (types.length === 0 || types.includes(f.id))
    );
    return gasOnly.length > 0 ? gasOnly : allAvailableFuels.slice(0, 2);
  }, [currentManageStation]);

  const getPressureStatus = (pressure) => {
    const p = Number(pressure);
    if (!p || isNaN(p) || p <= 0) {
      return {
        label: "Kiritilmagan",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.1)",
      };
    }
    if (p > 170) {
      return {
        label: "Me'yorida",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.15)",
      };
    }
    if (p >= 150) {
      return {
        label: "O'rtacha",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)",
      };
    }
    if (p >= 100) {
      return {
        label: "Past",
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.15)",
      };
    }
    return {
      label: "Juda past",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.15)",
    };
  };

  const getFuelPressure = (station, fuelKey) => {
    if (!station) return "";
    if (station.pressures && station.pressures[fuelKey] !== undefined) {
      return station.pressures[fuelKey];
    }
    if (fuelKey === "metan" || !station.pressures) {
      return station.gasPressure !== undefined && station.gasPressure !== null
        ? station.gasPressure
        : "";
    }
    return "";
  };

  const updateStationField = (stationId, fieldsToUpdate) => {
    const updateFn = (s) =>
      s.id === stationId ? { ...s, ...fieldsToUpdate } : s;
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));
  };

  const handleConfirmSavePhone = () => {
    if (pendingPhoneStationId) {
      updateStationField(pendingPhoneStationId, {
        phone: tempPhone ? tempPhone.trim() : "",
      });
    }
    setShowPhoneEditModal(false);
    setPendingPhoneStationId(null);
    setTempPhone("");
  };

  const handleUpdatePressure = (stationId, fuelKey, val) => {
    let num = val === "" ? "" : parseInt(val, 10);
    if (num !== "") {
      num = Math.min(205, Math.max(0, num));
    }

    const updateFn = (s) => {
      if (s.id !== stationId) return s;
      const newPressures = { ...(s.pressures || {}) };
      if (num === "") delete newPressures[fuelKey];
      else newPressures[fuelKey] = num;

      const updated = { ...s, pressures: newPressures };
      if (fuelKey === "metan" || !s.pressures) {
        updated.gasPressure = num === "" ? null : num;
      }
      return updated;
    };

    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));
  };

  const handleUpdatePrice = (stationId, fuelKey, priceVal) => {
    let num = parseInt(priceVal, 10);
    const updateFn = (s) => {
      if (s.id !== stationId) return s;
      const newPrices = { ...(s.prices || {}) };
      if (isNaN(num) || num <= 0) delete newPrices[fuelKey];
      else newPrices[fuelKey] = num;
      return { ...s, prices: newPrices };
    };
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));
  };

  const handleToggleAmenity = (stationId, amenityKey) => {
    const updateFn = (s) => {
      if (s.id !== stationId) return s;
      const cur = s.amenities?.[amenityKey] ?? true;
      return {
        ...s,
        amenities: {
          ...(s.amenities || { coffee: true, toilet: true, shop: true }),
          [amenityKey]: !cur,
        },
      };
    };
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));
  };

  const handleTogglePayment = (stationId, payKey) => {
    const updateFn = (s) => {
      if (s.id !== stationId) return s;
      const cur = s.payments?.[payKey] ?? true;
      return {
        ...s,
        payments: {
          ...(s.payments || { cash: true, uzcard: true, humo: true, visa: true }),
          [payKey]: !cur,
        },
      };
    };
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));
  };

  const allStationsList = useMemo(() => {
    const baseList = [...stations, ...myStations];
    const sourceList = baseList.length > 0 ? baseList : DEFAULT_DEMO_STATIONS;
    return sourceList.map((st) => ({
      ...st,
      calculatedDistance: calculateDistance(
        userCoords.lat,
        userCoords.lng,
        st.lat,
        st.lng,
      ),
    }));
  }, [stations, myStations, userCoords]);

  const filteredStations = useMemo(() => {
    const baseList = [...stations, ...myStations];
    const allStations = baseList.length > 0 ? baseList : DEFAULT_DEMO_STATIONS;
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

  // Telefon va kompyuterda dastlab faqat 5 ta manzil ko'rsatish
  const [visibleStationCount, setVisibleStationCount] = useState(5);

  // Filtrlash (Metan, Benzin...) yoki saralash (Eng Yaqin...) o'zgarganda yana 5 tadan boshlash
  useEffect(() => {
    setVisibleStationCount(5);
  }, [fuelSubFilter, fuelSortBy, activeCategory, searchQuery]);

  const displayedStations = useMemo(() => {
    return filteredStations.slice(0, visibleStationCount);
  }, [filteredStations, visibleStationCount]);

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
    <div
      className={`app-container ${isThemeLight ? "is-light" : ""}`}
      style={{
        '--bg-color': appTheme.bg,
        '--panel-bg': appTheme.panel,
        '--card-bg': appTheme.card,
        '--border-color': appTheme.border,
        '--text-main': appTheme.text || (appTheme.isLight ? '#0f172a' : '#ffffff'),
        '--text-muted': appTheme.textMuted || (appTheme.isLight ? '#64748b' : '#94a3b8'),
        '--accent-blue': appTheme.accent,
        backgroundColor: appTheme.bg,
        color: appTheme.text || (appTheme.isLight ? '#0f172a' : '#ffffff'),
      }}
    >
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
          style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <h1>
            A-maps.<span style={{ color: "#38bdf8" }}>uz</span>
          </h1>
        </div>

        {/* HEADER QIDIRUV (A-Maps.uz va Asosiy o'rtasidagi uzun qidiruv) */}
        <div className="header-search-center">
          <div className="header-search-bar">
            <Search size={18} className="header-search-icon" />
            <input
              type="text"
              placeholder="Manzil yoki zapravka qidiring..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "home" && activeTab !== "map") {
                  setActiveTab("home");
                }
              }}
              className="header-search-input"
            />
            {searchQuery && (
              <button
                className="header-search-clear"
                onClick={() => setSearchQuery("")}
                title="Tozalash"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        
        <button
          className="mobile-header-profile"
          onClick={() => handleTabChange("my")}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          title="Profil"
        >
          <User size={22} color={activeTab === "my" ? "#38bdf8" : "#d1d5db"} />
        </button>
        <nav className="desktop-nav" style={{ flexShrink: 0 }}>
          <button
            className={`desktop-nav-item ${activeTab === "home" ? "active" : ""}`}
            onClick={() => handleTabChange("home")}
          >
            <Home size={18} className="desktop-nav-icon" />
            <span>Asosiy</span>
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
            onClick={() => setShowServicesModal(true)}
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
            className={`desktop-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleTabChange("settings")}
          >
            <Settings size={18} className="desktop-nav-icon" />
            <span>Sozlamalar</span>
          </button>
        </nav>
      </header>

      {activeTab === "home" && (
        <div
          className={`dark-theme-home ${isThemeLight ? "is-light" : ""}`}
          style={{
            '--bg-color': appTheme.bg,
            '--panel-bg': appTheme.panel,
            '--card-bg': appTheme.card,
            '--border-color': appTheme.border,
            '--text-main': appTheme.text || (appTheme.isLight ? '#0f172a' : '#ffffff'),
            '--text-muted': appTheme.textMuted || (appTheme.isLight ? '#64748b' : '#94a3b8'),
            '--accent-blue': appTheme.accent,
            backgroundColor: appTheme.bg,
            color: appTheme.text || (appTheme.isLight ? '#0f172a' : '#ffffff'),
          }}
        >
          <div className="app-content">
            {/* LEFT PANEL */}
            <div className="left-panel">
              <div className="fuel-filter-grid">
                <button
                  className={`fuel-btn ${fuelSubFilter === "metan" ? "active" : ""}`}
                  onClick={() => { setFuelSubFilter(fuelSubFilter === "metan" ? "all" : "metan"); setActiveCategory("fuel"); }}
                >
                  <Fuel className="fuel-icon" size={24} /> <span>Metan Gaz</span>
                </button>
                <button
                  className={`fuel-btn ${fuelSubFilter === "benzin" ? "active" : ""}`}
                  onClick={() => { setFuelSubFilter(fuelSubFilter === "benzin" ? "all" : "benzin"); setActiveCategory("fuel"); }}
                >
                  <Fuel className="fuel-icon" size={24} /> <span>Benzin</span>
                </button>
                <button
                  className={`fuel-btn ${fuelSubFilter === "propan" ? "active" : ""}`}
                  onClick={() => { setFuelSubFilter(fuelSubFilter === "propan" ? "all" : "propan"); setActiveCategory("fuel"); }}
                >
                  <Fuel className="fuel-icon" size={24} /> <span>Propan</span>
                </button>
                <button
                  className={`fuel-btn ${fuelSubFilter === "elektr" ? "active" : ""}`}
                  onClick={() => { setFuelSubFilter(fuelSubFilter === "elektr" ? "all" : "elektr"); setActiveCategory("fuel"); }}
                >
                  <Plug className="fuel-icon" size={24} /> <span>Elektr Zaryadlash</span>
                </button>
              </div>

              <div className={`custom-sort-row ${isThemeLight ? "is-light" : ""}`}>
                <button
                  className={`custom-sort-btn ${fuelSortBy === "nearest" ? "active" : ""}`}
                  onClick={() => setFuelSortBy("nearest")}
                >
                  Eng Yaqin
                </button>
                <button
                  className={`custom-sort-btn ${fuelSortBy === "nearest_best" ? "active" : ""}`}
                  onClick={() => setFuelSortBy("nearest_best")}
                >
                  Eng Sifatli
                </button>
                <button
                  className={`custom-sort-btn ${fuelSortBy === "cheapest" ? "active" : ""}`}
                  onClick={() => setFuelSortBy("cheapest")}
                >
                  Eng Arzon
                </button>
              </div>

              <div className="station-list">
                {/* TELEFONDA HAR QANDAY HOLATDA DOIM TURADIGAN HARITA RASMI */}
                <div
                  className="mobile-map-find-banner"
                  onClick={() => handleTabChange("map")}
                  role="button"
                  tabIndex={0}
                  title="Xaritadan topish"
                >
                  <picture>
                    <source media="(min-width: 769px)" srcSet="/map-preview-desktop.png" />
                    <img
                      src="/map-preview.jpg"
                      alt="Xaritadan topish"
                      className="mobile-map-banner-img"
                    />
                  </picture>
                  <div className="mobile-map-banner-overlay">
                    <div className="mobile-map-banner-badge">
                      <Map size={18} className="mobile-map-badge-icon" />
                      <span>Xaritadan topish</span>
                    </div>
                  </div>
                </div>

                {isLocating ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <StationCardSkeleton key={`skeleton-${idx}`} />
                  ))
                ) : (
                  <>
                    {displayedStations.map((station) => (
                      <StationCard
                        key={station.id}
                        station={station}
                        userDistance={station.calculatedDistance}
                        isFavorite={favorites.includes(station.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectStation={setDetailStation}
                        onNavigate={handleNavigate}
                      />
                    ))}

                    {filteredStations.length > visibleStationCount && (
                      <div className="load-more-stations-container">
                        <button
                          type="button"
                          className="load-more-stations-btn"
                          onClick={() => setVisibleStationCount((prev) => prev + 5)}
                        >
                          <span>Yana</span>
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT PANEL MAP */}
            <div className="right-panel-map">
              <MapView
                stations={[...stations, ...myStations]}
                activeFuelFilter={fuelSubFilter}
                onFuelFilterChange={(newFilter) => {
                  setFuelSubFilter(newFilter);
                  setActiveCategory(newFilter === "all" ? "all" : "fuel");
                }}
                onSelectStation={setDetailStation}
                searchQuery={searchQuery}
                showSidebar={false}
                userCoords={userCoords}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab !== "home" && activeTab !== "map" && activeTab !== "settings" && (
        <main className={`content-area pb-20 ${activeTab === "my" ? "profile-content-area" : ""}`}>
          {/* MY (PROFILE) */}
          {activeTab === "my" && !user && (
            <div
              className={`auth-three-col-layout profile-three-col-layout ${isThemeLight ? "is-light" : ""}`}
              style={{
                '--theme-accent': appTheme?.accent || '#38bdf8',
                '--theme-bg': appTheme?.bg || '#0e0e10',
                '--theme-card': appTheme?.card || '#1c1c1e',
                '--theme-border': appTheme?.border || 'rgba(255, 255, 255, 0.08)',
                '--theme-panel': appTheme?.panel || '#161618',
                '--theme-text': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
                '--theme-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
                minHeight: "100vh",
                backgroundColor: appTheme?.bg || "var(--bg-primary, #0b0f19)",
                color: appTheme?.text || (isThemeLight ? "#0f172a" : "#ffffff"),
              }}
            >
              {/* CHAP TOMON REKLAMA (Faqat kompyuter holatida) */}
              <aside className="profile-side-video-banner left-banner auth-desktop-side-banner">
                <div className="side-banner-inner">
                  <div className="side-banner-tag">
                    <Sparkles size={13} />
                    <span>Reklama</span>
                  </div>

                  <div className="side-video-box">
                    <div className="side-video-ambient-glow"></div>
                    <div className="side-video-header-badge">
                      <span className="live-dot"></span>
                      <span>HD • 0:30</span>
                    </div>

                    <div className="side-video-center-content">
                      <div className="video-play-button-ring">
                        <div className="video-play-pulse"></div>
                        <Play size={24} className="video-play-icon" fill="currentColor" />
                      </div>
                      <h4 className="video-ad-title">
                        Bu yerda sizning reklamangiz bo'lishi mumkin
                      </h4>
                      <p className="video-ad-desc">
                        A-Maps ilovasida minglab faol haydovchilarga o'z biznesingizni video orqali taniting
                      </p>
                    </div>

                    <div className="side-video-bottom-bar">
                      <button
                        className="side-video-cta"
                        onClick={() => alert("Reklama berish uchun: @amaps_support")}
                      >
                        Reklama berish
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* O'RTA ASOSIY RO'YXATDAN O'TISH / KIRISH QISMI */}
              <div className="auth-center-col profile-center-main-col">
                <AuthScreen onLoginSuccess={setUser} isLight={isThemeLight} />
              </div>

              {/* O'NG TOMON REKLAMA (Faqat kompyuter holatida) */}
              <aside className="profile-side-video-banner right-banner auth-desktop-side-banner">
                <div className="side-banner-inner">
                  <div className="side-banner-tag">
                    <Sparkles size={13} />
                    <span>Reklama</span>
                  </div>

                  <div className="side-video-box">
                    <div className="side-video-ambient-glow"></div>
                    <div className="side-video-header-badge">
                      <span className="live-dot"></span>
                      <span>HD • 0:30</span>
                    </div>

                    <div className="side-video-center-content">
                      <div className="video-play-button-ring">
                        <div className="video-play-pulse"></div>
                        <Play size={24} className="video-play-icon" fill="currentColor" />
                      </div>
                      <h4 className="video-ad-title">
                        Bu yerda sizning reklamangiz bo'lishi mumkin
                      </h4>
                      <p className="video-ad-desc">
                        A-Maps ilovasida minglab faol haydovchilarga o'z biznesingizni video orqali taniting
                      </p>
                    </div>

                    <div className="side-video-bottom-bar">
                      <button
                        className="side-video-cta"
                        onClick={() => alert("Reklama berish uchun: @amaps_support")}
                      >
                        Reklama berish
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
          {activeTab === "my" && user && (
            <div
              className={`profile-three-col-layout ${isThemeLight ? "is-light" : ""}`}
              style={{
                '--theme-accent': appTheme?.accent || '#38bdf8',
                '--theme-bg': appTheme?.bg || '#0e0e10',
                '--theme-card': appTheme?.card || '#1c1c1e',
                '--theme-border': appTheme?.border || 'rgba(255, 255, 255, 0.08)',
                '--theme-panel': appTheme?.panel || '#161618',
                '--theme-text': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
                '--theme-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
              }}
            >
              {/* CHAP TOMON REKLAMA VIDEOSI (Left Side Video Ad Banner) */}
              <aside className="profile-side-video-banner left-banner">
                <div className="side-banner-inner">
                  <div className="side-banner-tag">
                    <Sparkles size={13} />
                    <span>Reklama</span>
                  </div>

                  <div className="side-video-box">
                    <div className="side-video-ambient-glow"></div>
                    <div className="side-video-header-badge">
                      <span className="live-dot"></span>
                      <span>HD • 0:30</span>
                    </div>

                    <div className="side-video-center-content">
                      <div className="video-play-button-ring">
                        <div className="video-play-pulse"></div>
                        <Play size={24} className="video-play-icon" fill="currentColor" />
                      </div>
                      <h4 className="video-ad-title">
                        Bu yerda sizning reklamangiz bo'lishi mumkin
                      </h4>
                      <p className="video-ad-desc">
                        A-Maps ilovasida minglab faol haydovchilarga o'z biznesingizni video orqali taniting
                      </p>
                    </div>

                    <div className="side-video-bottom-bar">
                      <button
                        className="side-video-cta"
                        onClick={() => alert("Reklama berish uchun: @amaps_support")}
                      >
                        Reklama berish
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* O'RTA ASOSIY PROFIL BO'LIMI (Center Main Profile Section) */}
              <div className="profile-center-main-col">
                {selectedManageStationId && currentManageStation ? (
                  /* ========================================================
                     ALOHIDA BO'LIM: SHAHOBCHANI BOSHQARISH (Separate Station View)
                     ======================================================== */
                  <div className="station-manage-page-view">
                    {/* 1. ENG TEPADA: Strelka + Ortga, O'rtada Joylashuv nomi, O'ngda Kalakolchik */}
                    <div className="station-manage-top-header">
                      <button
                        className="station-manage-back-btn"
                        onClick={() => setSelectedManageStationId(null)}
                      >
                        <ArrowLeft size={18} />
                        <span>Ortga</span>
                      </button>

                      <h3 className="station-manage-header-name">
                        {currentManageStation.name}
                      </h3>

                      <div className="station-manage-top-actions">
                        <button
                          type="button"
                          className="station-manage-header-action-btn"
                          onClick={() => handleEditStation(currentManageStation)}
                          title="Shahobchani to'liq tahrirlash"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          type="button"
                          className="station-manage-bell-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowStationBellModal(true);
                          }}
                          title="Eslatmalar"
                          aria-label="Eslatmalar"
                        >
                          <Bell size={19} />
                        </button>
                        <button
                          type="button"
                          className="station-manage-header-action-btn delete-action"
                          onClick={() => setStationToDelete(currentManageStation)}
                          title="Joylashuvni o'chirish"
                          aria-label="Joylashuvni o'chirish"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    {/* 2. ALOHIDA TURGAN KARTOTCHKA: Manzil nomi, Yiqqan yulduzlari, Ochiq/Yopiq, Telefon */}
                    <div className="station-manage-main-card">
                      {/* Manzil nomi */}
                      <div className="manage-main-address-block">
                        <div className="manage-main-address-text">
                          <h4 className="manage-main-title">
                            {currentManageStation.name}
                          </h4>
                          <span className="manage-main-address">
                            {currentManageStation.address || "Manzil ko'rsatilmagan"}
                          </span>
                        </div>
                      </div>

                      {/* Tagida: Yiqqan yulduzlari */}
                      <div className="manage-main-stars-row">
                        <div className="stars-cluster">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={
                                i <= Math.round(currentManageStation.rating || 5)
                                  ? "#f59e0b"
                                  : "none"
                              }
                              color={
                                i <= Math.round(currentManageStation.rating || 5)
                                  ? "#f59e0b"
                                  : "#94a3b8"
                              }
                            />
                          ))}
                        </div>
                        <strong className="manage-stars-num">
                          {Number(currentManageStation.rating || 5.0).toFixed(1)}
                        </strong>
                      </div>

                      {/* Tagida: Ochiq va Yopiq qilib qo'yish joyi */}
                      <div className="manage-status-control-box">
                        <div className="manage-status-toggle-row">
                          <span className="manage-status-label">Holati:</span>
                          <div className="status-toggle-group">
                            <button
                              className={`status-toggle-btn ${
                                currentManageStation.isOpen ? "active-open" : ""
                              }`}
                              onClick={(e) =>
                                handleSetStatus(e, currentManageStation.id, true)
                              }
                            >
                              Ochiq
                            </button>
                            <button
                              className={`status-toggle-btn ${
                                !currentManageStation.isOpen ? "active-closed" : ""
                              }`}
                              onClick={(e) =>
                                handleSetStatus(e, currentManageStation.id, false)
                              }
                            >
                              Yopiq
                            </button>
                          </div>
                        </div>

                        {!currentManageStation.isOpen && (
                          <div className="manage-reopen-time-badge">
                            <Clock size={13} />
                            <span>
                              {currentManageStation.reopenTime
                                ? `Qachon ochiladi: ${currentManageStation.reopenTime}`
                                : "Qachon ochilishi ko'rsatilmagan"}
                            </span>
                            <button
                              className="manage-reopen-edit-btn"
                              onClick={() => {
                                setReopenTimeInput(
                                  currentManageStation.reopenTime || ""
                                );
                                setReopenModal({
                                  isOpen: true,
                                  stationId: currentManageStation.id,
                                });
                              }}
                              title="Ochilish vaqtini o'zgartirish"
                            >
                              <Edit3 size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tagida: Manzilni o'zining telefon nomeri */}
                      <div className="manage-phone-row">
                        <div className="manage-phone-left">
                          <Phone size={15} className="text-emerald-400" />
                          <span className="manage-phone-val">
                            {currentManageStation.phone || "Telefon kiritilmagan"}
                          </span>
                        </div>
                        <button
                          className="manage-phone-edit-icon-btn"
                          onClick={() => {
                            setPendingPhoneStationId(currentManageStation.id);
                            setTempPhone(currentManageStation.phone || "");
                            setShowPhoneEditModal(true);
                          }}
                          title="Telefon raqamni o'zgartirish"
                          aria-label="Telefon raqamni o'zgartirish"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* 3. SAL PASTDA: YOQILG'I NARXLARI */}
                    {/* Sotadigan yoqilg'i 2 yoki undan ko'p bo'lsa har biri bitta pastda bo'lib tursin, orqa foni bir xil, orada bo'lim foni ko'rinadigan */}
                    <div className="station-manage-fuel-section">
                      <div className="manage-sec-header">
                        <h4>Yoqilg'i narxlari</h4>
                        <span className="manage-sec-sub">
                          Sotiladigan yoqilg'ilar ro'yxati
                        </span>
                      </div>

                      <div className="fuel-prices-vertical-stack">
                        {activeFuelsList.map((fuel) => {
                          const currentPrice =
                            currentManageStation.prices?.[fuel.id];
                          const isEditing = editingPriceKey === fuel.id;

                          return (
                            <div key={fuel.id} className="fuel-price-row-card">
                              <div className="fuel-row-left">
                                <div
                                  className="fuel-type-icon-halo"
                                  style={{
                                    backgroundColor: `${fuel.color}22`,
                                    color: fuel.color,
                                  }}
                                >
                                  <fuel.icon size={16} />
                                </div>
                                <div className="fuel-row-title-block">
                                  <span className="fuel-row-name">
                                    {fuel.label}
                                  </span>
                                  <span className="fuel-row-unit">
                                    1{" "}
                                    {fuel.id === "metan"
                                      ? "m³"
                                      : fuel.id === "elektr"
                                      ? "kVt/soat"
                                      : "litr"}{" "}
                                    uchun
                                  </span>
                                </div>
                              </div>

                              <div className="fuel-row-right">
                                {isEditing ? (
                                  <div className="fuel-price-inline-edit">
                                    <input
                                      type="number"
                                      value={tempPriceVal}
                                      onChange={(e) =>
                                        setTempPriceVal(e.target.value)
                                      }
                                      placeholder="Narx"
                                      className="fuel-price-input"
                                      autoFocus
                                    />
                                    <button
                                      className="manage-save-btn-small"
                                      onClick={() => {
                                        handleUpdatePrice(
                                          currentManageStation.id,
                                          fuel.id,
                                          tempPriceVal
                                        );
                                        setEditingPriceKey(null);
                                      }}
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      className="manage-cancel-btn-small"
                                      onClick={() => setEditingPriceKey(null)}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="fuel-price-display-pill"
                                    onClick={() => {
                                      setEditingPriceKey(fuel.id);
                                      setTempPriceVal(currentPrice || "");
                                    }}
                                    title="Narxni o'zgartirish uchun bosing"
                                  >
                                    <strong className="fuel-price-val">
                                      {currentPrice
                                        ? `${Number(
                                            currentPrice
                                          ).toLocaleString()} so'm`
                                        : "Narx belgilanmagan"}
                                    </strong>
                                    <Edit3
                                      size={12}
                                      className="fuel-price-edit-icon"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. SAL PASTDA: GAZ BOSIMI */}
                    {/* Sotadigan yoqilg'i ikkta bo'lsa ikklasiniham bosimini sorasin, 205 gacha kiritsa bo'lsin, tagida nuqta va Me'yorida / O'rtacha / Past / Juda past */}
                    {pressureFuelsList.length > 0 && (
                      <div className="station-manage-pressure-section">
                        <div className="manage-sec-header">
                          <h4>Gaz bosimi</h4>
                          <span className="manage-sec-sub">
                            Maksimal ruxsat etilgan bosim: 205 atm gacha
                          </span>
                        </div>

                        <div className="pressure-cards-stack">
                          {pressureFuelsList.map((fuel) => {
                            const rawPressure = getFuelPressure(
                              currentManageStation,
                              fuel.id
                            );

                            return (
                              <div
                                key={fuel.id}
                                className="gas-pressure-card"
                              >
                                <div className="pressure-card-top-row">
                                  <div className="pressure-fuel-info">
                                    <div
                                      className="pressure-icon-wrap"
                                      style={{
                                        backgroundColor: `${fuel.color}22`,
                                        color: fuel.color,
                                      }}
                                    >
                                      <fuel.icon size={16} />
                                    </div>
                                    <div>
                                      <span className="pressure-fuel-title">
                                        {pressureFuelsList.length > 1
                                          ? `${fuel.label} bosimi`
                                          : "Gaz bosimi"}
                                      </span>
                                      <span className="pressure-limit-hint">
                                        Cheklov: 0 – 205 atm
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pressure-input-control">
                                    <input
                                      type="number"
                                      min={0}
                                      max={205}
                                      value={
                                        rawPressure === undefined ||
                                        rawPressure === null
                                          ? ""
                                          : rawPressure
                                      }
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (val !== "") {
                                          val = Math.min(
                                            205,
                                            Math.max(
                                              0,
                                              parseInt(val, 10) || 0
                                            )
                                          );
                                        }
                                        handleUpdatePressure(
                                          currentManageStation.id,
                                          fuel.id,
                                          val
                                        );
                                      }}
                                      placeholder="0"
                                      className="pressure-number-input"
                                    />
                                    <span className="pressure-unit-label">
                                      atm
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. SAL PASTDA: QULAYLIKLAR VA TO'LOV TURLARI */}
                    <div className="station-manage-services-section">
                      <div className="manage-sec-header">
                        <h4>Qulayliklar va to'lov turlari</h4>
                        <span className="manage-sec-sub">
                          Mijozlarga ko'rinadigan xizmatlar (bosing va o'zgartiring)
                        </span>
                      </div>

                      <div className="manage-services-quick-grid">
                        {[
                          { key: 'coffee', label: 'Qahva', icon: Coffee, isAmenity: true },
                          { key: 'toilet', label: 'Hojatxona', icon: User, isAmenity: true },
                          { key: 'shop', label: "Do'kon", icon: ShoppingBag, isAmenity: true },
                          { key: 'cash', label: 'cash', icon: Banknote, isAmenity: false },
                          { key: 'uzcard', label: 'Uzcard', icon: CreditCard, isAmenity: false },
                          { key: 'humo', label: 'HUMO', icon: CreditCard, isAmenity: false },
                          { key: 'visa', label: 'VISA', icon: CreditCard, isAmenity: false },
                        ].map((item) => {
                          const isAvail = item.isAmenity
                            ? (currentManageStation.amenities?.[item.key] !== false)
                            : (currentManageStation.payments?.[item.key] !== false);
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              className={`manage-service-chip ${isAvail ? 'is-active' : 'is-disabled'}`}
                              onClick={() => {
                                if (item.isAmenity) {
                                  handleToggleAmenity(currentManageStation.id, item.key);
                                } else {
                                  handleTogglePayment(currentManageStation.id, item.key);
                                }
                              }}
                              title={isAvail ? "Mavjud (O'chirish uchun bosing)" : "Mavjud emas (Yoqish uchun bosing)"}
                            >
                              <div className="manage-chip-icon-box">
                                <Icon size={15} />
                                {!isAvail && (
                                  <span className="manage-chip-x-mark"><X size={10} strokeWidth={3} /></span>
                                )}
                              </div>
                              <span className="manage-chip-label">{item.label}</span>
                              <span className={`manage-chip-badge ${isAvail ? 'badge-yes' : 'badge-no'}`}>
                                {isAvail ? 'Bor' : "Yo'q"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. JOYLASHUVNI O'CHIRISH TUGMASI */}
                    <div className="station-manage-delete-section">
                      <button
                        type="button"
                        className="station-manage-delete-btn"
                        onClick={() => setStationToDelete(currentManageStation)}
                      >
                        <Trash2 size={17} />
                        <span>Joylashuvni o'chirish</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ========================================================
                     ASOSIY PROFIL BO'LIMI: PROFIL KARTASI VA MENING JOYLAShUVLARIM
                     ======================================================== */
                  <>
                    {/* 1. BOSHIDA PROFIL KARTASI: Rasm, Ism-familiya, Telefon, va O'ng burchakda to'liq ma'lumot */}
                    <div className="profile-hero-card">
                      <div className="profile-hero-left">
                        <div
                          className="profile-hero-avatar-box clickable"
                          onClick={() => setShowProfileDetail(true)}
                          title="Rasmni ko'rish yoki tahrirlash"
                        >
                          {user?.avatar && !user?.avatar.includes("dicebear") ? (
                            <img
                              src={user?.avatar}
                              alt={user?.firstName}
                              className="profile-hero-avatar-img"
                            />
                          ) : (
                            <User size={32} color="#3b82f6" />
                          )}
                          <div className="profile-hero-avatar-edit-icon">
                            <Edit3 size={11} />
                          </div>
                        </div>

                        <div className="profile-hero-user-info">
                          <h3 className="profile-hero-name">
                            {user?.firstName} {user?.lastName}
                          </h3>
                          <div className="profile-hero-phone-row">
                            <Phone size={13} />
                            <span>{user?.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* O'ng tomon burchagida profil egasi haqidagi to'liq ma'lumot */}
                      <button
                        className="profile-full-details-btn"
                        onClick={() => setShowProfileDetail(true)}
                        title="Profil egasi haqidagi to'liq ma'lumot"
                      >
                        <div className="full-details-icon-wrap">
                          <Info size={16} />
                        </div>
                        <div className="full-details-text-group">
                          <span className="full-details-title">
                            To'liq ma'lumot
                          </span>
                          <span className="full-details-subtitle">
                            Profil sozlamalari
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className="full-details-chevron"
                        />
                      </button>
                    </div>

                    {/* 2. PROFIL PASTIDA JOYLASHUV QO'SHISH DEGAN JOY */}
                    <button
                      className="profile-add-station-banner-btn"
                      onClick={() => {
                        setEditingStation(null);
                        setShowAddStation(true);
                      }}
                    >
                      <div className="add-station-icon-halo">
                        <Plus size={22} />
                      </div>
                      <div className="add-station-banner-text">
                        <span className="add-station-banner-title">
                          Joylashuv qo'shish
                        </span>
                        <span className="add-station-banner-subtitle">
                          O'z xizmat ko'rsatish markazingizni A-Maps ga joylashtiring
                        </span>
                      </div>
                      <div className="add-station-banner-arrow">
                        <ChevronRight size={18} />
                      </div>
                    </button>

                    {/* 3. PASTIDA UNING JOYLASHUVLARI (Mening joylashuvlarim) */}
                    <div className="profile-my-locations-wrapper">
                      <div className="my-locations-header-bar">
                        <div className="my-locations-title-cluster">
                          <MapPin size={18} color="#3b82f6" />
                          <h4>Mening joylashuvlarim</h4>
                          <span className="my-locations-count-pill">
                            {myStations.length}
                          </span>
                        </div>
                      </div>

                      {myStations.length === 0 ? (
                        <div className="profile-no-locations-empty">
                          <button
                            className="create-demo-station-btn profile-add-location-empty-btn"
                            onClick={() => {
                              setEditingStation(null);
                              setShowAddStation(true);
                            }}
                          >
                            <Plus size={16} />
                            <span>Joylashuv qo'shish</span>
                          </button>
                        </div>
                      ) : (
                        <div className="my-stations-list mt-2">
                          {myStations.map((st) => (
                            <div
                              key={st.id}
                              className="my-station-simple-card"
                              onClick={() => setSelectedManageStationId(st.id)}
                            >
                              <div className="my-station-simple-info">
                                <h5 className="my-station-simple-title">
                                  {st.name}
                                </h5>
                              </div>

                              <button
                                className="my-station-edit-pencil-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedManageStationId(st.id);
                                }}
                                title="Tahrirlash va boshqarish"
                                aria-label="Tahrirlash"
                              >
                                <Edit3 size={17} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* O'NG TOMON REKLAMA VIDEOSI (Right Side Video Ad Banner) */}
              <aside className="profile-side-video-banner right-banner">
                <div className="side-banner-inner">
                  <div className="side-banner-tag">
                    <Sparkles size={13} />
                    <span>Homiylik</span>
                  </div>

                  <div className="side-video-box right-glow">
                    <div className="side-video-ambient-glow right-theme"></div>
                    <div className="side-video-header-badge">
                      <span className="live-dot purple-dot"></span>
                      <span>4K • 0:15</span>
                    </div>

                    <div className="side-video-center-content">
                      <div className="video-play-button-ring">
                        <div className="video-play-pulse"></div>
                        <Play size={24} className="video-play-icon" fill="currentColor" />
                      </div>
                      <h4 className="video-ad-title">
                        Bu yerda sizning reklamangiz bo'lishi mumkin
                      </h4>
                      <p className="video-ad-desc">
                        A-Maps platformasida eng faol mijozlarni jalb qiling va brendingizni ommalashtiring
                      </p>
                    </div>

                    <div className="side-video-bottom-bar">
                      <button
                        className="side-video-cta"
                        onClick={() => alert("Reklama berish uchun: @amaps_support")}
                      >
                        Reklama berish
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      )}

      {/* MAP - Full Screen (content-area tashqarisida) */}
      {activeTab === "map" && (
        <div
          className="map-fullscreen-wrapper"
          style={{
            position: 'fixed',
            top: '75px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
        >
          <MapView
            stations={filteredStations}
            onSelectStation={setDetailStation}
            showSidebar={true}
            userCoords={userCoords}
          />
        </div>
      )}

      {/* SETTINGS - Dedicated Section */}
      {activeTab === "settings" && (
        <div
          className={`settings-three-col-layout profile-three-col-layout ${isThemeLight ? "is-light" : ""}`}
          style={{
            '--theme-accent': appTheme?.accent || '#38bdf8',
            '--theme-bg': appTheme?.bg || '#0e0e10',
            '--theme-card': appTheme?.card || '#1c1c1e',
            '--theme-border': appTheme?.border || 'rgba(255, 255, 255, 0.08)',
            '--theme-panel': appTheme?.panel || '#161618',
            '--theme-text': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
            '--theme-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
            minHeight: "100vh",
            backgroundColor: appTheme?.bg || "var(--bg-primary, #0e0e10)",
            color: appTheme?.text || (isThemeLight ? "#0f172a" : "#ffffff"),
          }}
        >
          {/* CHAP TOMON REKLAMA (Faqat kompyuter holatida) */}
          <aside className="profile-side-video-banner left-banner settings-desktop-side-banner">
            <div className="side-banner-inner">
              <div className="side-banner-tag">
                <Sparkles size={13} />
                <span>Reklama</span>
              </div>

              <div className="side-video-box">
                <div className="side-video-ambient-glow"></div>
                <div className="side-video-header-badge">
                  <span className="live-dot"></span>
                  <span>HD • 0:30</span>
                </div>

                <div className="side-video-center-content">
                  <div className="video-play-button-ring">
                    <div className="video-play-pulse"></div>
                    <Play size={24} className="video-play-icon" fill="currentColor" />
                  </div>
                  <h4 className="video-ad-title">
                    Bu yerda sizning reklamangiz bo'lishi mumkin
                  </h4>
                  <p className="video-ad-desc">
                    A-Maps ilovasida minglab faol haydovchilarga o'z biznesingizni video orqali taniting
                  </p>
                </div>

                <div className="side-video-bottom-bar">
                  <button
                    className="side-video-cta"
                    onClick={() => alert("Reklama berish uchun: @amaps_support")}
                  >
                    Reklama berish
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* O'RTA ASOSIY SOZLAMALAR BO'LIMI */}
          <div className="settings-center-col profile-center-main-col">
            <SettingsSection
              currentTheme={appTheme}
              onSaveTheme={handleSaveTheme}
              user={user}
              onLogout={() => setShowLogoutConfirm(true)}
              onNavigateProfile={() => { if (user) { setShowProfileDetail(true); } else { handleTabChange("my"); } }}
            />
          </div>

          {/* O'NG TOMON REKLAMA (Faqat kompyuter holatida) */}
          <aside className="profile-side-video-banner right-banner settings-desktop-side-banner">
            <div className="side-banner-inner">
              <div className="side-banner-tag">
                <Sparkles size={13} />
                <span>Reklama</span>
              </div>

              <div className="side-video-box">
                <div className="side-video-ambient-glow"></div>
                <div className="side-video-header-badge">
                  <span className="live-dot"></span>
                  <span>HD • 0:30</span>
                </div>

                <div className="side-video-center-content">
                  <div className="video-play-button-ring">
                    <div className="video-play-pulse"></div>
                    <Play size={24} className="video-play-icon" fill="currentColor" />
                  </div>
                  <h4 className="video-ad-title">
                    Bu yerda sizning reklamangiz bo'lishi mumkin
                  </h4>
                  <p className="video-ad-desc">
                    A-Maps ilovasida minglab faol haydovchilarga o'z biznesingizni video orqali taniting
                  </p>
                </div>

                <div className="side-video-bottom-bar">
                  <button
                    className="side-video-cta"
                    onClick={() => alert("Reklama berish uchun: @amaps_support")}
                  >
                    Reklama berish
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
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
        isLight={isThemeLight}
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
        isMyStation={myStations.some((s) => s.id === detailStation?.id)}
        onDeleteStation={(st) => setStationToDelete(st)}
      />

      {/* ========================================================
          ROSTDAN HAM O'CHIRMOQCHIMISIZ? MODAL OYNASI
          ======================================================== */}
      {stationToDelete && (
        <div 
          className="delete-confirm-overlay" 
          onClick={() => setStationToDelete(null)}
        >
          <div 
            className="delete-confirm-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="delete-confirm-close-btn" 
              onClick={() => setStationToDelete(null)}
              aria-label="Yopish"
            >
              <X size={18} />
            </button>

            <div className="delete-confirm-icon-bubble">
              <Trash2 size={28} />
            </div>

            <h3 className="delete-confirm-title">
              Rostdan ham o'chirmoqchimisiz?
            </h3>

            <p className="delete-confirm-desc">
              <strong>"{stationToDelete.name}"</strong> joylashuvi A-Maps tizimidan butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </p>

            <div className="delete-confirm-actions">
              <button 
                type="button" 
                className="delete-btn-cancel" 
                onClick={() => setStationToDelete(null)}
              >
                Yo'q, bekor qilish
              </button>

              <button 
                type="button" 
                className="delete-btn-confirm" 
                onClick={handleConfirmDeleteStation}
              >
                <Trash2 size={16} />
                <span>Ha, o'chirish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          XIZMATLAR HOZIRCHA TAYYOR EMAS - MODAL OYNASI
          ======================================================== */}
      {showServicesModal && (
        <div 
          className="services-modal-overlay" 
          onClick={() => setShowServicesModal(false)}
        >
          <div 
            className="services-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="services-modal-close-btn" 
              onClick={() => setShowServicesModal(false)}
              aria-label="Yopish"
            >
              <X size={18} />
            </button>

            <div className="services-modal-icon-bubble">
              <Menu size={28} />
            </div>

            <h3 className="services-modal-title">
              Xizmatlar hozircha tayyor emas
            </h3>

            <p className="services-modal-desc">
              Ushbu bo'lim tez orada yangi va qulay servislar (avtomoyka, ustaxona, evakuator va boshqalar) bilan ishga tushiriladi.
            </p>

            <div className="services-modal-actions">
              <button 
                type="button" 
                className="services-modal-ok-btn" 
                onClick={() => setShowServicesModal(false)}
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="add-st-submit-btn reopen-cancel-btn"
                onClick={() =>
                  setReopenModal({ isOpen: false, stationId: null })
                }
              >
                Bekor qilish
              </button>
              <button
                className="add-st-submit-btn reopen-confirm-btn"
                onClick={submitReopenTime}
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHAHOBCHA ESLATMALAR MODAL OYNASI (Bell Modal) */}
      {showStationBellModal && (
        <div
          className="profile-overlay"
          onClick={() => setShowStationBellModal(false)}
        >
          <div
            className="station-bell-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="station-bell-icon-halo">
              <Bell size={30} color="#f59e0b" />
            </div>
            <h3 className="station-bell-modal-title">Eslatmalar</h3>
            <p className="station-bell-modal-text">
              Hozircha eslatma yo'q
            </p>
            <button
              type="button"
              className="station-bell-modal-btn"
              onClick={() => setShowStationBellModal(false)}
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}

      {/* TELEFON RAQAMNI O'ZGARTIRISH MODAL OYNASI */}
      {showPhoneEditModal && (
        <div
          className="profile-overlay"
          onClick={() => setShowPhoneEditModal(false)}
        >
          <div
            className="station-bell-modal-card phone-confirm-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="station-bell-icon-halo"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                borderColor: "rgba(16, 185, 129, 0.3)",
                color: "#10b981",
              }}
            >
              <Phone size={28} />
            </div>
            <h3 className="station-bell-modal-title">Telefon raqamni o'zgartirish</h3>
            <p className="station-bell-modal-text">
              Rostdan ham telefon raqamni o'zgartirmoqchimisiz?
            </p>
            <div className="phone-modal-input-wrap">
              <label className="phone-modal-input-label">Yangi telefon raqam:</label>
              <input
                type="text"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="phone-modal-input-box"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmSavePhone();
                  }
                }}
              />
            </div>
            <div className="phone-confirm-btns-row">
              <button
                type="button"
                className="phone-confirm-cancel-btn"
                onClick={() => setShowPhoneEditModal(false)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="phone-confirm-agree-btn"
                onClick={handleConfirmSavePhone}
              >
                Ha, o'zgartirish
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenServices={() => setShowServicesModal(true)}
      />
    </div>
  );
}

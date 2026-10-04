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
}

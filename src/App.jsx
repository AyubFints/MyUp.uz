import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AuthScreen from "./components/AuthScreen";
import BottomNav from "./components/BottomNav";
import StationCard from "./components/StationCard";
import StationCardSkeleton from "./components/StationCardSkeleton";
import StationDetailModal from "./components/StationDetailModal";
import ProfileDetailModal from "./components/ProfileDetailModal";
import NotificationsView from "./components/NotificationsView";
import AddStationModal from "./components/AddStationModal";
import MapView, { stationMatchesFuel, DEFAULT_DEMO_STATIONS } from "./components/MapView";
import NavigationMode from "./components/NavigationMode";
import SplashScreen from "./components/SplashScreen";
import SettingsSection, { THEME_PRESETS } from "./components/SettingsSection";
import { DesktopSideBanner, MobileAdBanner } from "./components/AdBannerCard";
import { CITIES, INITIAL_STATIONS } from "./data/mockData";
import { calculateDistance } from "./utils/distance";
import api from "./api/client";
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
  ShieldCheck,
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
  Building2,
  Upload,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  Lock,
} from "lucide-react";
import "./App.css";

// Har bir sahifa ochilganda yoki refresh bo'lganda faqat 1 marta kirish signali yuboriladi
let hasSentVisitOnThisLoad = false;

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

// Web Audio orqali xabarnoma ovozi (Telefon va kompyuterda aniq eshitiladi)
const playReopenAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // 1-ohang (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // 2-ohang (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.16);
    gain2.gain.setValueAtTime(0.4, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.warn("Audio play error:", e);
  }
};

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
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === "object" && parsed.bg) return parsed;
      return THEME_PRESETS?.[0] || { bg: '#0e0e10', panel: '#1a1a1c', card: '#222225', border: 'rgba(255,255,255,0.08)', accent: '#38bdf8' };
    } catch {
      return THEME_PRESETS?.[0] || { bg: '#0e0e10', panel: '#1a1a1c', card: '#222225', border: 'rgba(255,255,255,0.08)', accent: '#38bdf8' };
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
      setAuthInitialMode("register");
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        setActiveTab("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (newTab, customAuthMode = "register") => {
    setAuthInitialMode(customAuthMode);
    if (newTab === activeTab) return;
    window.history.pushState({ tab: newTab }, "");
    setActiveTab(newTab);
    if (newTab !== "my") {
      setShowNotificationsPage(false);
      setSelectedManageStationId(null);
    }
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
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
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
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonError, setDeleteReasonError] = useState("");
  const [isDeletingStation, setIsDeletingStation] = useState(false);

  // Bildirishnomalar holati va avtomatik tekshiruv (faqat o'qilmagan xabar bo'lsagina kalakolchik tepasida 1 chiqadi)
  useEffect(() => {
    const userPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;
    if (!userPhone && !userId) return;

    const checkUnread = () => {
      api.notifications
        ?.getAll({ userId: userId || "", phone: userPhone })
        .then((res) => {
          if (res.success && Array.isArray(res.notifications)) {
            const unreadItems = res.notifications.filter((n) => !n.isRead && !n.readAt);
            const count = unreadItems.length;
            setUnreadNotifCount(count);
            setHasUnreadNotification(count > 0);
            try {
              localStorage.setItem("myup_notif_unread_count", String(count));
              localStorage.setItem("myup_notif_unread", count > 0 ? "true" : "false");
            } catch (e) {}
          }
        })
        .catch(() => {});
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Bildirishnomalar holati
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [pendingInspectionModalStation, setPendingInspectionModalStation] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(() => {
    try {
      const savedCount = localStorage.getItem("myup_notif_unread_count");
      if (savedCount !== null) return parseInt(savedCount, 10) || 0;
      const saved = localStorage.getItem("myup_notif_unread");
      return saved === "true" ? 1 : 0;
    } catch {
      return 0;
    }
  });
  const [hasUnreadNotification, setHasUnreadNotification] = useState(() => {
    try {
      const savedCount = localStorage.getItem("myup_notif_unread_count");
      if (savedCount !== null) return parseInt(savedCount, 10) > 0;
      const saved = localStorage.getItem("myup_notif_unread");
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });

  const handleOpenNotifications = () => {
    setShowNotificationsPage(true);
    setUnreadNotifCount(0);
    setHasUnreadNotification(false);
    try {
      localStorage.setItem("myup_notif_unread_count", "0");
      localStorage.setItem("myup_notif_unread", "false");
    } catch (e) {}
    const userPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;
    if (userPhone || userId) {
      api.notifications?.markAllRead({ userId: userId || "", phone: userPhone }).catch(() => {});
    }
  };

  // Vaqt yetib kelganda Web Notification va markaziy modalni ochish
  useEffect(() => {
    const handleSwMsg = (event) => {
      if (event.data?.type === "OPEN_REOPEN_STATION_MODAL") {
        const targetId = event.data?.stationId;
        const st = myStations.find((s) => s.id === targetId);
        if (st) {
          setReopenDueModalStation({
            id: st.id,
            name: st.name,
            reopenTime: st.reopenTime || "",
          });
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSwMsg);

    // Agar URL da ?reopenDue= bo'lsa
    try {
      const params = new URLSearchParams(window.location.search);
      const dueId = params.get("reopenDue");
      if (dueId) {
        const st = myStations.find((s) => s.id === dueId);
        if (st) {
          setReopenDueModalStation({
            id: st.id,
            name: st.name,
            reopenTime: st.reopenTime || "",
          });
        }
      }
    } catch (e) {}

    // Har 2.5 soniyada rejalashtirilgan vaqtlarni tekshirib turish
    const checkTimer = setInterval(() => {
      try {
        const savedAlerts = JSON.parse(localStorage.getItem("myup_reopen_alerts") || "{}");
        const now = Date.now();
        let changed = false;

        Object.keys(savedAlerts).forEach((stId) => {
          const item = savedAlerts[stId];
          if (!item || item.alerted) return;

          // Agar shahobcha allaqachon ochiq bo'lsa, eslatmani tozalaymiz
          const currentSt = myStations.find((s) => s.id === stId);
          if (currentSt && currentSt.isOpen) {
            delete savedAlerts[stId];
            changed = true;
            return;
          }

          if (now >= item.targetTimestamp) {
            item.alerted = true;
            changed = true;

            // 1. Bildirishnoma ovozini chalish
            playReopenAlertSound();

            // 2. Tizim Web Notification yuborish (telefon/kompyuter foni yoki dasturdan tashqarida bo'lsa ham)
            const notifTitle = "A-Maps Tizimi";
            const notifBody = "Kiritilgan vaqtga yetib kelindi! Manzilingiz ochildimi? Foydalanuvchilar kutmoqda";

            if ("Notification" in window && Notification.permission === "granted") {
              try {
                if (navigator.serviceWorker?.controller) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification(notifTitle, {
                      body: notifBody,
                      icon: "/favicon.svg",
                      badge: "/favicon.svg",
                      data: { stationId: stId },
                      vibrate: [200, 100, 200, 100, 300],
                      tag: `station-reopen-${stId}`,
                      requireInteraction: true,
                    });
                  });
                } else {
                  const n = new Notification(notifTitle, {
                    body: notifBody,
                    icon: "/favicon.svg",
                    tag: `station-reopen-${stId}`,
                    requireInteraction: true,
                  });
                  n.onclick = () => {
                    window.focus();
                    setReopenDueModalStation({
                      id: stId,
                      name: item.stationName || currentSt?.name || "Shahobchangiz",
                      reopenTime: item.reopenTime || currentSt?.reopenTime || "",
                    });
                    n.close();
                  };
                }
              } catch (err) {
                console.warn("Notification yaratishda ogohlantirish:", err);
              }
            }

            // 3. Markaziy modalni ochish
            setReopenDueModalStation({
              id: stId,
              name: item.stationName || currentSt?.name || "Shahobchangiz",
              reopenTime: item.reopenTime || currentSt?.reopenTime || "",
            });
          }
        });

        if (changed) {
          localStorage.setItem("myup_reopen_alerts", JSON.stringify(savedAlerts));
        }
      } catch (e) {}
    }, 2500);

    return () => {
      clearInterval(checkTimer);
      navigator.serviceWorker?.removeEventListener("message", handleSwMsg);
    };
  }, [myStations]);

  // Joylashuv va Oddiy foydalanuvchi registratsiya holatlari
  const [authInitialMode, setAuthInitialMode] = useState("register"); // 'register' | 'location_register'
  
  // Faqat joylashuvdan ro'yxatdan o'tgan user uchun oddiy profilni to'ldirish modali
  const [showCompleteUserProfileModal, setShowCompleteUserProfileModal] = useState(false);
  const [compUserForm, setCompUserForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998 ",
    bDay: "",
    bMonth: "",
    bYear: "",
  });
  const [completeUserError, setCompleteUserError] = useState("");

  // Sozlamalar / kalakolchikdan "Joylashuv qo'shishni tasdiqlash" bosilganda chiqadigan Joylashuv joylash modali
  const [showLocationRegisterModal, setShowLocationRegisterModal] = useState(false);
  const [locModalStep, setLocModalStep] = useState(1);
  const [locModalData, setLocModalData] = useState({
    locationName: "",
    responsiblePerson: "",
    locationAddress: "",
    password: "",
    phone: "+998 ",
    locationImage: null,
  });
  const [locModalError, setLocModalError] = useState("");
  const [showLocModalPassword, setShowLocModalPassword] = useState(false);
  const locModalFileInputRef = useRef(null);

  // Joylashuv ma'lumotlarini (nom, mas'ul shaxs, telefon, rasm) tahrirlash modali
  const [showEditLocationHeroModal, setShowEditLocationHeroModal] = useState(false);
  const [editLocationForm, setEditLocationForm] = useState({
    locationName: "",
    responsiblePerson: "",
    locationPhone: "",
    locationImage: null,
  });
  const [editLocationError, setEditLocationError] = useState("");
  const editLocationFileInputRef = useRef(null);

  // Telefon raqamni formatlash yordamchisi: +998 90 123 45 67
  const formatUzPhone = (val) => {
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+998')) cleaned = '+998' + cleaned.replace('+', '');
    let formatted = '+998 ';
    const numbersOnly = cleaned.slice(4);
    for (let i = 0; i < numbersOnly.length; i++) {
      if (i === 2 || i === 5 || i === 7) formatted += ' ';
      formatted += numbersOnly[i];
    }
    if (formatted.length > 17) formatted = formatted.slice(0, 17);
    return formatted;
  };

  const handleAuthSuccess = (loggedUser, newStation) => {
    setUser(loggedUser);
    if (newStation) {
      setMyStations((prev) => {
        const exists = prev.find((s) => s.id === newStation.id);
        const updated = exists ? prev.map((s) => (s.id === newStation.id ? newStation : s)) : [newStation, ...prev];
        try {
          localStorage.setItem("myup_my_stations", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  };

  const handleGoToLocationRegister = () => {
    setShowNotificationsPage(false);
    if (!user) {
      handleTabChange("my", "location_register");
    } else {
      handleTabChange("my", "register");
      setLocModalStep(1);
      setLocModalError("");
      setLocModalData({
        locationName: "",
        responsiblePerson: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "",
        locationAddress: "",
        password: "",
        phone: user.phoneNumber || "+998 ",
        locationImage: null,
      });
      setShowLocationRegisterModal(true);
    }
  };

  const handleCompleteUserProfileSubmit = (e) => {
    e.preventDefault();
    setCompleteUserError("");
    if (!compUserForm.firstName.trim() || !compUserForm.lastName.trim()) {
      setCompleteUserError("Ism va familiyangizni kiriting!");
      return;
    }
    if (!compUserForm.bDay || !compUserForm.bMonth || !compUserForm.bYear) {
      setCompleteUserError("Tug'ilgan sanangizni to'liq kiriting!");
      return;
    }
    const cleanPhone = compUserForm.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setCompleteUserError("Telefon raqamingizni to'liq kiriting (+998 90 123 45 67)!");
      return;
    }

    const updatedUser = {
      ...user,
      firstName: compUserForm.firstName.trim(),
      lastName: compUserForm.lastName.trim(),
      phoneNumber: compUserForm.phone,
      birthDate: `${compUserForm.bYear}-${String(compUserForm.bMonth).padStart(2, '0')}-${String(compUserForm.bDay).padStart(2, '0')}`,
      isLocationOnly: false,
      userProfileCompleted: true,
      avatar: user?.avatar && !user?.avatar.includes("dicebear")
        ? user.avatar
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${compUserForm.firstName.trim()}`,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem("myup_user", JSON.stringify(updatedUser));
    } catch (e) {}
    setShowCompleteUserProfileModal(false);
  };

  const handleLocationModalStep1Submit = (e) => {
    e.preventDefault();
    setLocModalError("");
    if (!locModalData.locationName.trim()) {
      setLocModalError("Joylashuv nomini kiriting!");
      return;
    }
    if (!locModalData.responsiblePerson.trim()) {
      setLocModalError("Mas'ul inson ismini kiriting!");
      return;
    }
    if (!locModalData.locationAddress.trim()) {
      setLocModalError("Joylashuv manzilini kiriting!");
      return;
    }
    if (!locModalData.password || locModalData.password.length < 4) {
      setLocModalError("Maxfiy parol kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    const cleanPhone = locModalData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setLocModalError("Joylashuv asosiy telefon raqamini to'liq kiriting!");
      return;
    }
    setLocModalStep(2);
  };

  const handleFinishLocationModalRegister = async (chosenImg = null) => {
    const finalImg = chosenImg || locModalData.locationImage || null;
    const locId = "st_" + Date.now();
    const userId = user?.id || ("usr_" + Date.now());

    const newLocation = {
      id: locId,
      name: locModalData.locationName.trim(),
      responsiblePerson: locModalData.responsiblePerson.trim(),
      address: locModalData.locationAddress.trim(),
      city: "Toshkent",
      phone: locModalData.phone,
      isOpen: true,
      status: "approved",
      isApproved: true,
      image: finalImg,
      images: finalImg ? [finalImg] : [],
      lat: 41.311081,
      lng: 69.240562,
      prices: { metan: "3800" },
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    setMyStations((prev) => {
      const updated = [newLocation, ...prev.filter((s) => s.id !== locId)];
      try {
        localStorage.setItem("myup_my_stations", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const updatedUser = {
      ...user,
      id: userId,
      role: "business",
      hasLocation: true,
      has_location: true,
      registeredViaLocation: true,
      locationName: locModalData.locationName.trim(),
      responsiblePerson: locModalData.responsiblePerson.trim(),
      locationAddress: locModalData.locationAddress.trim(),
      locationPhone: locModalData.phone,
      locationImage: finalImg,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem("myup_user", JSON.stringify(updatedUser));
    } catch (e) {}
    setShowLocationRegisterModal(false);
    setLocModalStep(1);
  };

  const handleOpenEditLocationModal = () => {
    setEditLocationError("");
    setEditLocationForm({
      locationName: user?.locationName || myStations[0]?.name || "",
      responsiblePerson: user?.responsiblePerson || myStations[0]?.responsiblePerson || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : ""),
      locationPhone: user?.locationPhone || myStations[0]?.phone || user?.phoneNumber || "+998 ",
      locationImage: user?.locationImage || myStations[0]?.image || null,
    });
    setShowEditLocationHeroModal(true);
  };

  const handleSaveEditLocationModal = (e) => {
    e.preventDefault();
    setEditLocationError("");
    if (!editLocationForm.locationName.trim()) {
      setEditLocationError("Joylashuv nomini kiriting!");
      return;
    }
    if (!editLocationForm.responsiblePerson.trim()) {
      setEditLocationError("Mas'ul inson ismini kiriting!");
      return;
    }
    const cleanPhone = editLocationForm.locationPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setEditLocationError("Telefon raqamingizni to'liq kiriting (+998 90 123 45 67)!");
      return;
    }

    const updatedUser = {
      ...user,
      locationName: editLocationForm.locationName.trim(),
      responsiblePerson: editLocationForm.responsiblePerson.trim(),
      locationPhone: editLocationForm.locationPhone,
      locationImage: editLocationForm.locationImage,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem("myup_user", JSON.stringify(updatedUser));
    } catch (err) {}

    // Agar myStations mavjud bo'lsa, asosiy shahobcha ma'lumotlarini ham sinxronlash
    if (myStations.length > 0) {
      setMyStations((prev) => {
        const updated = prev.map((st, idx) => {
          if (idx === 0) {
            return {
              ...st,
              name: editLocationForm.locationName.trim(),
              responsiblePerson: editLocationForm.responsiblePerson.trim(),
              phone: editLocationForm.locationPhone,
              image: editLocationForm.locationImage,
            };
          }
          return st;
        });
        try {
          localStorage.setItem("myup_my_stations", JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
    }

    // Backend PostgreSQL ga ham yuborish
    try {
      api.auth.updateProfile({
        locationName: editLocationForm.locationName.trim(),
        responsiblePerson: editLocationForm.responsiblePerson.trim(),
        locationPhone: editLocationForm.locationPhone,
      }).catch(() => {});
    } catch (err) {}

    setShowEditLocationHeroModal(false);
  };

  // Custom Reopen Modal
  const [reopenModal, setReopenModal] = useState({
    isOpen: false,
    stationId: null,
  });
  const [reopenHours, setReopenHours] = useState("");
  const [reopenMinutes, setReopenMinutes] = useState("");
  const reopenHoursRef = useRef(null);
  const reopenMinutesRef = useRef(null);

  const openReopenModal = (stationId, existingTime = "") => {
    let h = "";
    let m = "";
    if (existingTime && typeof existingTime === "string") {
      const match = existingTime.match(/(\d{1,2})[:.\s]?(\d{1,2})?/);
      if (match) {
        if (match[1]) h = match[1].slice(0, 2);
        if (match[2]) m = match[2].slice(0, 2);
      }
    }
    setReopenHours(h);
    setReopenMinutes(m);
    setReopenModal({ isOpen: true, stationId });
    setTimeout(() => {
      reopenHoursRef.current?.focus();
      reopenHoursRef.current?.select();
    }, 120);
  };

  const handleHoursChange = (val) => {
    let digits = val.replace(/\D/g, "").slice(0, 2);
    if (digits.length > 0) {
      const num = parseInt(digits, 10);
      if (num > 23) digits = "23";
    }
    setReopenHours(digits);
    if (digits.length === 2) {
      reopenMinutesRef.current?.focus();
      reopenMinutesRef.current?.select();
    }
  };

  const handleHoursKeyDown = (e) => {
    // O'ng tomonga strelka (ArrowRight) bosilsa o'ngdagi minut 00 ga kelsin
    if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault();
      reopenMinutesRef.current?.focus();
      reopenMinutesRef.current?.select();
    }
  };

  const handleMinutesChange = (val) => {
    let digits = val.replace(/\D/g, "").slice(0, 2);
    if (digits.length > 0) {
      const num = parseInt(digits, 10);
      if (num > 59) digits = "59";
    }
    setReopenMinutes(digits);
  };

  const handleMinutesKeyDown = (e) => {
    // Chap tomonga strelka yoki bo'sh turganda backspace bosilsa soatga qaytsin
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      reopenHoursRef.current?.focus();
      reopenHoursRef.current?.select();
    } else if (e.key === "Backspace" && !reopenMinutes) {
      e.preventDefault();
      reopenHoursRef.current?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      submitReopenTime();
    }
  };

  const applyTimePreset = (minutesToAdd) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesToAdd);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    setReopenHours(h);
    setReopenMinutes(m);
  };

  // ========================================================
  // BELGILANGAN VAQTGA YETIB KELINDI! MARKAZIY MODAL OYNASI HOLATLARI
  // ========================================================
  const [reopenDueModalStation, setReopenDueModalStation] = useState(null);
  const [isEditingDueTime, setIsEditingDueTime] = useState(false);
  const [editDueHours, setEditDueHours] = useState("");
  const [editDueMinutes, setEditDueMinutes] = useState("");

  const applyDueTimePreset = (minutesToAdd) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesToAdd);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    setEditDueHours(h);
    setEditDueMinutes(m);
  };

  const handleConfirmStationOpened = async (stationId) => {
    try {
      await api.stations.updateStatus(stationId, { isOpen: true, reopenTime: "" });
    } catch (err) {
      console.warn("Status yangilashda xato:", err.message);
    }
    const updateFn = (s) => (s.id === stationId ? { ...s, isOpen: true, reopenTime: "" } : s);
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));

    try {
      const alerts = JSON.parse(localStorage.getItem("myup_reopen_alerts") || "{}");
      delete alerts[stationId];
      localStorage.setItem("myup_reopen_alerts", JSON.stringify(alerts));
    } catch (e) {}

    setReopenDueModalStation(null);
    setIsEditingDueTime(false);
  };

  const handleUpdateReopenDueTime = async (stationId, newH, newM) => {
    const h = (newH || "00").padStart(2, "0");
    const m = (newM || "00").padStart(2, "0");
    const finalTime = `${h}:${m}`;

    const now = new Date();
    const target = new Date();
    target.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const targetTimestamp = target.getTime();

    try {
      await api.stations.updateStatus(stationId, { isOpen: false, reopenTime: finalTime });
    } catch (err) {
      console.warn("Status yangilashda xato:", err.message);
    }
    const updateFn = (s) => (s.id === stationId ? { ...s, isOpen: false, reopenTime: finalTime } : s);
    setMyStations((prev) => prev.map(updateFn));
    setStations((prev) => prev.map(updateFn));

    try {
      const alerts = JSON.parse(localStorage.getItem("myup_reopen_alerts") || "{}");
      const st = myStations.find((s) => s.id === stationId);
      alerts[stationId] = {
        stationId,
        stationName: st?.name || "Shahobchangiz",
        reopenTime: finalTime,
        targetTimestamp,
        alerted: false,
      };
      localStorage.setItem("myup_reopen_alerts", JSON.stringify(alerts));
    } catch (e) {}

    setReopenDueModalStation(null);
    setIsEditingDueTime(false);
  };

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

  // Jonli video reklamalar (A-Maps Super Admin orqali boshqariladi)
  const [activeAds, setActiveAds] = useState([]);
  useEffect(() => {
    let isMounted = true;
    api.ads.getActive()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.ads)) {
          setActiveAds(res.ads);
        }
      })
      .catch((err) => console.warn("Reklamalarni olishda xato:", err.message));
    return () => { isMounted = false; };
  }, []);

  // 1-YO'L & 2-YO'L: Super Admin uchun Jonli Trafik (BroadcastChannel + Backend)
  useEffect(() => {
    // Har bir sahifa ochilganda yoki refresh bo'lganda faqat 1 marta kirish yuboriladi
    if (hasSentVisitOnThisLoad) return;
    hasSentVisitOnThisLoad = true;

    // Har bir kirish va sahifa refresh (F5) qilinganda yangi va takrorlanmas sessiya ID
    // Shunda bitta refresh bo'lganda ham qayta kirdi deb hisoblanadi va hisoblagichga qo'shiladi
    const sessionVisitId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1-yo'l: Brauzerlararo to'g'ridan-to'g'ri kanal (BroadcastChannel 'amaps_traffic_channel')
    let trafficChannel = null;
    try {
      trafficChannel = new BroadcastChannel("amaps_traffic_channel");
      trafficChannel.postMessage({
        action: "ENTER",
        visitorId: sessionVisitId,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn("BroadcastChannel xatosi:", e);
    }

    // 2-yo'l: Backend (PostgreSQL) ga kunlik tashrif va onlayn foydalanuvchi signalini yuborish
    const sendBackendVisit = (action) => {
      api.analytics?.sendVisit({ visitorId: sessionVisitId, action }).catch(() => {});
    };

    // Har safar kirganda yoki sahifa yangilanganda (refresh) ENTER yuboriladi
    sendBackendVisit("ENTER");

    // Har 2 daqiqada onlayn ekanligini tasdiqlash
    const pingTimer = setInterval(() => {
      sendBackendVisit("PING");
    }, 120000);

    const handleBeforeUnload = () => {
      try {
        if (trafficChannel) {
          trafficChannel.postMessage({
            action: "LEAVE",
            visitorId: sessionVisitId,
            timestamp: Date.now(),
          });
        }
      } catch (e) {}

      const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/analytics/visit`;
      const blob = new Blob(
        [JSON.stringify({ visitorId: sessionVisitId, action: "LEAVE" })],
        { type: "application/json" }
      );
      navigator.sendBeacon?.(url, blob);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(pingTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      try {
        if (trafficChannel) {
          trafficChannel.postMessage({
            action: "LEAVE",
            visitorId: sessionVisitId,
            timestamp: Date.now(),
          });
          trafficChannel.close();
        }
      } catch (e) {}
    };
  }, []);

  // PostgreSQL (Backend) dan barcha tasdiqlangan shahobchalarni yuklab olish
  const loadStationsFromDb = useCallback(async () => {
    try {
      const res = await api.stations.getAll({
        userLat: userCoords?.lat,
        userLng: userCoords?.lng,
      });
      if (res.success && Array.isArray(res.stations)) {
        setStations(res.stations);

        // myStations ro'yxatini bazadagi jonli tasdiqlangan shahobchalar bilan sinxronlashtirish
        setMyStations((prev) => {
          return prev.map((mySt) => {
            const dbSt = res.stations.find((s) => s.id === mySt.id || s.name === mySt.name);
            if (dbSt) {
              return {
                ...mySt,
                ...dbSt,
                isApproved: true,
                is_approved: true,
                status: 'approved'
              };
            }
            return mySt;
          });
        });

        if (user?.id) {
          const userSts = res.stations.filter(
            (s) => s.ownerId === user.id || s.owner_id === user.id || s.createdBy === user.id
          );
          if (userSts.length > 0) {
            setMyStations((prev) => {
              const dict = {};
              [...prev, ...userSts].forEach((item) => {
                if (item && item.id) dict[item.id] = { ...dict[item.id], ...item };
              });
              return Object.values(dict);
            });
          }
        }
      }
    } catch (err) {
      console.warn("Shahobchalarni bazadan yuklashda xato:", err.message);
    }
  }, [userCoords, user?.id]);

  useEffect(() => {
    loadStationsFromDb();
    const handleFocus = () => loadStationsFromDb();
    window.addEventListener("focus", handleFocus);
    const pollInterval = setInterval(loadStationsFromDb, 6000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(pollInterval);
    };
  }, [loadStationsFromDb]);

  // myStations o'zgarganda localStorage ga saqlash
  useEffect(() => {
    try {
      localStorage.setItem("myup_my_stations", JSON.stringify(myStations));
    } catch (e) {
      console.error(e);
    }
  }, [myStations]);

  // Super Admin reklamalarini tartiblash (1-joylangan reklama, 2-joylangan va h.k. tartibida):
  const sortedAds = useMemo(() => {
    if (!Array.isArray(activeAds)) return [];
    return [...activeAds].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : (Number(a.id) || 0);
      const timeB = b.created_at ? new Date(b.created_at).getTime() : (Number(b.id) || 0);
      return timeA - timeB;
    });
  }, [activeAds]);

  // Chap tomon reklamalari (faqat chap yoki ikkala tomon uchun ko'rsatiladi)
  const leftAds = useMemo(() => {
    return sortedAds.filter((a) => {
      const s = String(a.side || '').toLowerCase();
      return s === "left" || s === "both" || s === "all";
    });
  }, [sortedAds]);

  // O'ng tomon reklamalari (faqat o'ng yoki ikkala tomon uchun ko'rsatiladi)
  const rightAds = useMemo(() => {
    return sortedAds.filter((a) => {
      const s = String(a.side || '').toLowerCase();
      return s === "right" || s === "both" || s === "all";
    });
  }, [sortedAds]);

  const featuredAd = sortedAds.length > 0 ? sortedAds[0] : null;
  const leftAd = leftAds[0] || null;
  const rightAd = rightAds[0] || null;
  const mobileAds = sortedAds;
  const mobileAd = mobileAds[0] || null;

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
    localStorage.removeItem("myup_token");
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

  // Shahobcha saqlash / tahrirlash (PostgreSQL ga to'g'ridan-to'g'ri saqlash)
  const handleSaveStation = async (station) => {
    station.createdBy = user?.id;

    try {
      const res = await api.stations.create({
        name: station.name,
        lat: station.lat,
        lng: station.lng,
        address: station.address,
        city: station.city || "Toshkent",
        phone: station.phone,
        isOpen: station.isOpen,
        prices: station.prices,
        pressures: station.pressures,
        gasPressure: station.gasPressure,
        types: station.type,
        description: station.description,
        images: station.images,
        verificationImages: station.verificationImages,
        amenities: station.amenities,
        payments: station.payments,
      });

      if (res.success && res.station) {
        const savedSt = res.station;
        console.log("✅ Shahobcha muvaffaqiyatli PostgreSQL ga saqlandi:", savedSt.id, savedSt.name);
        setMyStations((prev) => {
          const exists = prev.find((s) => s.id === savedSt.id || s.id === station.id);
          return exists
            ? prev.map((s) => (s.id === savedSt.id || s.id === station.id ? savedSt : s))
            : [savedSt, ...prev];
        });
        // Faqat admin tasdiqlagan bo'lsa (masalan Super Admin yaratgan bo'lsa), asosiy ro'yxatga qo'shiladi!
        const isApprovedBool = savedSt.isApproved === true || savedSt.is_approved === true;
        if (isApprovedBool) {
          setStations((prev) => {
            const exists = prev.find((s) => s.id === savedSt.id || s.id === station.id);
            return exists
              ? prev.map((s) => (s.id === savedSt.id || s.id === station.id ? savedSt : s))
              : [savedSt, ...prev];
          });
        } else {
          // Hali admin tasdiqlamagan bo'lsa, asosiy ro'yxatdan chiqarib tashlanadi
          setStations((prev) => prev.filter((s) => s.id !== savedSt.id && s.id !== station.id));
        }
        return;
      }
    } catch (err) {
      console.error("❌ Shahobchani PostgreSQL ga saqlashda xato:", err);
      alert(`Shahobchani saqlashda xatolik: ${err.message}`);
    }

    // Fallback: Agar backend vaqtinchalik javob bermasa
    const isApprovedFallback = station.isApproved === true || station.is_approved === true;
    const exists = myStations.find((s) => s.id === station.id);
    if (exists) {
      setMyStations(myStations.map((s) => (s.id === station.id ? station : s)));
    } else {
      setMyStations([...myStations, station]);
    }

    if (isApprovedFallback) {
      setStations((prev) => {
        const ex = prev.find((s) => s.id === station.id);
        return ex ? prev.map((s) => (s.id === station.id ? station : s)) : [...prev, station];
      });
    } else {
      setStations((prev) => prev.filter((s) => s.id !== station.id));
    }
  };

  const handleEditStation = (station) => {
    setEditingStation(station);
    setShowAddStation(true);
  };

  const handleConfirmDeleteStation = async () => {
    if (!stationToDelete) return;
    if (!deleteReason.trim()) {
      setDeleteReasonError("Iltimos, manzilni nima sababdan o'chirayotganingizni yozing.");
      return;
    }

    const stId = stationToDelete.id;
    const stName = stationToDelete.name || "Noma'lum shahobcha";
    const stAddress = stationToDelete.address || "Manzil ko'rsatilmagan";
    const reasonText = deleteReason.trim();

    setIsDeletingStation(true);
    setDeleteReasonError("");

    const authorName = `${user?.firstName || user?.first_name || "Foydalanuvchi"} ${user?.lastName || user?.last_name || ""}`.trim() || user?.name || "Foydalanuvchi";
    const authorPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;

    // 1. Backenddan shahobchani o'chirish (o'chirish sababi bilan birga)
    try {
      await api.stations.delete(stId, {
        reason: reasonText,
        authorName,
        authorPhone,
        userId,
      });
    } catch (err) {
      console.warn("Shahobchani o'chirishda backend xatosi:", err.message);
    }

    // 2. Fikrlar/Bildirishnomalarga "Manzil o'chirildi" deb sababini saqlash
    const deleteFeedbackMessage = `[O'chirilgan manzil]: ${stName} (${stAddress})\n[O'chirish sababi]: ${reasonText}`;
    const formatNotifDateLocal = (d) => {
      const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
      const dateObj = new Date(d);
      return `${dateObj.getDate()}-${months[dateObj.getMonth()]} ${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
    };

    const localFeedbackItem = {
      id: "fb_del_" + Date.now(),
      userId,
      type: "ochirish",
      text: deleteFeedbackMessage,
      author: authorName,
      phone: authorPhone,
      date: formatNotifDateLocal(new Date()),
      status: "Yuborildi",
      adminReply: null,
    };

    // Foydalanuvchining o'zi yuborgan bildirishnomalari ro'yxatiga darhol saqlash
    try {
      const savedFeedbacks = localStorage.getItem("myup_my_sent_feedbacks");
      const parsedFeedbacks = savedFeedbacks ? JSON.parse(savedFeedbacks) : [];
      const updatedFeedbacks = [localFeedbackItem, ...parsedFeedbacks];
      localStorage.setItem("myup_my_sent_feedbacks", JSON.stringify(updatedFeedbacks));
    } catch (e) {}

    // Server bazasiga ham fikr/bildirishnoma sifatida yuborish
    try {
      await api.feedbacks.create({
        type: "shikoyat",
        message: deleteFeedbackMessage,
        authorName,
        authorPhone,
        userId,
      });
    } catch (e) {
      console.warn("O'chirish sababini serverga yuborishda ogohlantirish:", e.message);
    }

    // 3. Mening joylarim va umumiy ro'yxatdan zudlik bilan avtomatik o'chirish
    setMyStations((prev) => {
      const updated = prev.filter((s) => s.id !== stId);
      try {
        localStorage.setItem("myup_my_stations", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setStations((prev) => prev.filter((s) => s.id !== stId));

    // 4. Agar boshqaruv sahifasida turgan bo'lsa, chiqib ketish
    if (selectedManageStationId === stId) {
      setSelectedManageStationId(null);
    }
    // Agar tafsilotlar modali ochilgan bo'lsa, yopish
    if (detailStation?.id === stId) {
      setDetailStation(null);
    }

    setIsDeletingStation(false);
    setStationToDelete(null);
    setDeleteReason("");
  };

  const handleSaveQuickPressure = async (e, stId) => {
    e.stopPropagation();
    if (editingPressureId === stId) {
      const p = parseInt(tempPressure);
      try {
        await api.stations.updateFuelPrice(stId, "metan", { pressure: p || 0 });
      } catch (err) {
        console.warn("Gaz bosimini yangilashda xato:", err.message);
      }
      setMyStations(
        myStations.map((s) =>
          s.id === stId ? { ...s, gasPressure: p || null } : s,
        ),
      );
      setStations(
        stations.map((s) =>
          s.id === stId ? { ...s, gasPressure: p || null } : s,
        ),
      );
      setEditingPressureId(null);
    }
  };

  const handleSaveQuickPrice = async (e, stId) => {
    e.stopPropagation();
    if (editingPriceId === stId && editingPriceType) {
      const p = parseInt(tempPrice);
      try {
        await api.stations.updateFuelPrice(stId, editingPriceType, { price: p || 0 });
      } catch (err) {
        console.warn("Narxni yangilashda xato:", err.message);
      }
      const updateFn = (s) => {
        if (s.id !== stId) return s;
        const updatedPrices = { ...(s.prices || {}) };
        if (!isNaN(p) && p > 0) updatedPrices[editingPriceType] = p;
        else delete updatedPrices[editingPriceType];
        return { ...s, prices: updatedPrices };
      };
      setMyStations(myStations.map(updateFn));
      setStations(stations.map(updateFn));
      setEditingPriceId(null);
      setEditingPriceType(null);
    }
  };

  const handleSetStatus = async (e, stationId, makeOpen) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const station = myStations.find((s) => s.id === stationId);
    if (!station) return;

    if (station.isOpen === makeOpen) return;

    if (!makeOpen) {
      // Yopish modalini chaqirish
      openReopenModal(stationId, station.reopenTime || "");
    } else {
      // Ochish
      try {
        await api.stations.updateStatus(stationId, { isOpen: true, reopenTime: "" });
      } catch (err) {
        console.warn("Status yangilashda xato:", err.message);
      }
      try {
        const alerts = JSON.parse(localStorage.getItem("myup_reopen_alerts") || "{}");
        delete alerts[stationId];
        localStorage.setItem("myup_reopen_alerts", JSON.stringify(alerts));
      } catch (e) {}
      const updateFn = (s) =>
        s.id === stationId ? { ...s, isOpen: true, reopenTime: "" } : s;
      setMyStations((prev) => prev.map(updateFn));
      setStations((prev) => prev.map(updateFn));
    }
  };

  const submitReopenTime = async () => {
    const stId = reopenModal.stationId;
    let finalTime = "";
    if (reopenHours || reopenMinutes) {
      const h = (reopenHours || "00").padStart(2, "0");
      const m = (reopenMinutes || "00").padStart(2, "0");
      finalTime = `${h}:${m}`;
    }

    if (finalTime) {
      const now = new Date();
      const target = new Date();
      const [hStr, mStr] = finalTime.split(":");
      target.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const targetTimestamp = target.getTime();

      try {
        const alerts = JSON.parse(localStorage.getItem("myup_reopen_alerts") || "{}");
        const st = myStations.find((s) => s.id === stId);
        alerts[stId] = {
          stationId: stId,
          stationName: st?.name || "Shahobchangiz",
          reopenTime: finalTime,
          targetTimestamp,
          alerted: false,
        };
        localStorage.setItem("myup_reopen_alerts", JSON.stringify(alerts));
      } catch (e) {}

      // Tizim bildirishnomasiga (Notification) ruxsat so'rash
      if ("Notification" in window && Notification.permission === "default") {
        try {
          Notification.requestPermission();
        } catch (e) {}
      }
    }

    try {
      await api.stations.updateStatus(stId, { isOpen: false, reopenTime: finalTime });
    } catch (err) {
      console.warn("Status yangilashda xato:", err.message);
    }
    const updateFn = (s) =>
      s.id === stId
        ? { ...s, isOpen: false, reopenTime: finalTime }
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

  // Dublikatlarsiz birlashtirilgan yagona shahobchalar ro'yxati (har bir shahobcha faqat 1 marta chiqadi)
  // DIQQAT: Hali admin tasdiqlamagan (isApproved === false) shahobchalar asosiy xarita va qidiruvda ko'rinmaydi!
  const combinedUniqueStations = useMemo(() => {
    const stationDict = {};
    const stList = Array.isArray(stations) ? stations : [];
    const myStList = Array.isArray(myStations) ? myStations : [];

    stList.forEach((st) => {
      if (st && st.id && st.isApproved !== false && st.is_approved !== false) {
        stationDict[st.id] = st;
      }
    });

    myStList.forEach((st) => {
      // Foydalanuvchining o'z shahobchasi faqat admin tasdiqlagan bo'lsagina asosiy xaritaga chiqadi!
      if (st && st.id && typeof st === 'object' && (st.isApproved === true || st.is_approved === true)) {
        const prev = stationDict[st.id];
        stationDict[st.id] = prev && typeof prev === 'object' ? { ...prev, ...st } : st;
      }
    });

    return Object.values(stationDict);
  }, [stations, myStations]);

  const allStationsList = useMemo(() => {
    const sourceList =
      combinedUniqueStations.length > 0
        ? combinedUniqueStations
        : (Array.isArray(DEFAULT_DEMO_STATIONS) ? DEFAULT_DEMO_STATIONS : []);
    return sourceList.map((st) => ({
      ...st,
      calculatedDistance: calculateDistance(
        userCoords?.lat,
        userCoords?.lng,
        Number(st.lat),
        Number(st.lng),
      ),
    }));
  }, [combinedUniqueStations, userCoords]);

  const filteredStations = useMemo(() => {
    const allStations =
      combinedUniqueStations.length > 0
        ? combinedUniqueStations
        : (Array.isArray(DEFAULT_DEMO_STATIONS) ? DEFAULT_DEMO_STATIONS : []);

    let result = (Array.isArray(allStations) ? allStations : [])
      .filter((st) => st && typeof st === "object" && st.id)
      .map((st) => ({
        ...st,
        calculatedDistance: calculateDistance(
          userCoords?.lat,
          userCoords?.lng,
          Number(st.lat),
          Number(st.lng),
        ),
      }))
      .filter((st) => {
        if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            (st.name || "").toLowerCase().includes(q) ||
            (st.brand || "").toLowerCase().includes(q) ||
            (st.address || "").toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (
          activeCategory === "fuel" &&
          fuelSubFilter !== "all"
        ) {
          const tList = Array.isArray(st.type)
            ? st.type
            : (st.type ? [st.type] : (st.types ? st.types : []));
          if (!tList.some((t) => String(t).toLowerCase() === String(fuelSubFilter).toLowerCase())) {
            return false;
          }
        }
        return true;
      });

    if (activeCategory === "fuel") {
      const getPrice = (st) => {
        if (!st || !st.prices || typeof st.prices !== "object") return Infinity;
        if (fuelSubFilter === "all") {
          const vals = Object.values(st.prices)
            .map(Number)
            .filter((p) => !isNaN(p) && p > 0);
          return vals.length > 0 ? Math.min(...vals) : Infinity;
        }
        const p = Number(st.prices[fuelSubFilter]);
        return !isNaN(p) && p > 0 ? p : Infinity;
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
          const rA = Number(a.rating) || 0;
          const rB = Number(b.rating) || 0;
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
    combinedUniqueStations,
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
        '--bg-color': appTheme?.bg || '#0e0e10',
        '--panel-bg': appTheme?.panel || '#1a1a1c',
        '--card-bg': appTheme?.card || '#222225',
        '--border-color': appTheme?.border || 'rgba(255, 255, 255, 0.08)',
        '--text-main': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
        '--text-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
        '--accent-blue': appTheme?.accent || '#38bdf8',
        backgroundColor: appTheme?.bg || '#0e0e10',
        color: appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
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
            '--bg-color': appTheme?.bg || '#0e0e10',
            '--panel-bg': appTheme?.panel || '#1a1a1c',
            '--card-bg': appTheme?.card || '#222225',
            '--border-color': appTheme?.border || 'rgba(255, 255, 255, 0.08)',
            '--text-main': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
            '--text-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
            '--accent-blue': appTheme?.accent || '#38bdf8',
            backgroundColor: appTheme?.bg || '#0e0e10',
            color: appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
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
                stations={combinedUniqueStations}
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
              <DesktopSideBanner ads={leftAds} ad={leftAd} side="left" customClass="auth-desktop-side-banner" />

              {/* O'RTA ASOSIY RO'YXATDAN O'TISH / KIRISH QISMI */}
              <div className="auth-center-col profile-center-main-col">
                <AuthScreen 
                  key={authInitialMode}
                  onLoginSuccess={handleAuthSuccess} 
                  isLight={isThemeLight} 
                  initialMode={authInitialMode} 
                />
              </div>

              {/* O'NG TOMON REKLAMA (Faqat kompyuter holatida) */}
              <DesktopSideBanner ads={rightAds} ad={rightAd} side="right" customClass="auth-desktop-side-banner" />
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
              <DesktopSideBanner ads={leftAds} ad={leftAd} side="left" />

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
                                openReopenModal(
                                  currentManageStation.id,
                                  currentManageStation.reopenTime || ""
                                );
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
                ) : showNotificationsPage ? (
                  /* ========================================================
                     ALOHIDA BO'LIM: BILDIRISHNOMALAR (Notifications View)
                     ======================================================== */
                  <NotificationsView
                    user={user}
                    onBack={() => setShowNotificationsPage(false)}
                    hasUnread={unreadNotifCount > 0 || hasUnreadNotification}
                    onClearUnread={() => {
                      setUnreadNotifCount(0);
                      setHasUnreadNotification(false);
                      try {
                        localStorage.setItem("myup_notif_unread_count", "0");
                        localStorage.setItem("myup_notif_unread", "false");
                        localStorage.setItem("myup_notif_intro_seen", "true");
                      } catch (e) {}
                    }}
                    onUpdateUser={setUser}
                    onGoToAuth={() => {
                      setShowNotificationsPage(false);
                      handleTabChange("my");
                    }}
                    onGoToLocationRegister={handleGoToLocationRegister}
                    isThemeLight={isThemeLight}
                    appTheme={appTheme}
                  />
                ) : (
                  /* ========================================================
                     ASOSIY PROFIL BO'LIMI: JOYLASHUV VA FOYDALANUVCHI KARTALARI
                     ======================================================== */
                  <>
                    {(() => {
                      const isLocationRegistered = Boolean(
                        user?.registeredViaLocation ||
                        user?.locationName ||
                        (user?.hasLocation && myStations.length > 0)
                      );

                      const isLocationOnlyUser = Boolean(
                        user?.isLocationOnly ||
                        (!user?.firstName && !user?.userProfileCompleted)
                      );

                      const currentLocationName = user?.locationName || myStations[0]?.name || "Shahobcha";
                      const currentResponsiblePerson = user?.responsiblePerson || myStations[0]?.responsiblePerson || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Mas'ul inson");
                      const currentLocationPhone = user?.locationPhone || myStations[0]?.phone || user?.phoneNumber || "+998 90 123 45 67";
                      const currentLocationImage = user?.locationImage || myStations[0]?.image || null;
                      const branchCount = Math.max(myStations.length, user?.registeredViaLocation ? 1 : 0);

                      return (
                        <>
                          {/* 1. AGAR JOYLASHUV JOYLAShDAN RO'YXATDAN O'TGAN BO'LSA: ENG TEPADA JOYLASHUV KARTASI */}
                          {isLocationRegistered && (
                            <div className="profile-top-location-hero-card">
                              {/* Ruchka ikonasi: kichikroq qilib o'ng yuqorida */}
                              <button
                                type="button"
                                className="location-hero-edit-top-btn"
                                onClick={handleOpenEditLocationModal}
                                title="Joylashuv ma'lumotlarini o'zgartirish"
                                aria-label="Tahrirlash"
                              >
                                <Edit3 size={14} />
                              </button>

                              <div className="location-hero-left">
                                <div className="location-hero-image-wrap">
                                  {currentLocationImage ? (
                                    <img 
                                      src={currentLocationImage} 
                                      alt={currentLocationName} 
                                      className="location-hero-cover-img" 
                                    />
                                  ) : (
                                    <div className="location-hero-placeholder-icon">
                                      <Building2 size={28} color="#38bdf8" />
                                    </div>
                                  )}
                                </div>

                                <div className="location-hero-info">
                                  <div className="location-hero-badge">
                                    <MapPin size={12} />
                                    <span>Joylashuv</span>
                                  </div>
                                  <h3 className="location-hero-title">
                                    {currentLocationName}
                                  </h3>
                                  <div className="location-hero-meta-row">
                                    <span className="location-hero-responsible">
                                      Mas'ul inson: <strong>{currentResponsiblePerson}</strong>
                                    </span>
                                  </div>
                                  <div className="location-hero-phone-row">
                                    <Phone size={13} className="text-emerald-400" />
                                    <span>{currentLocationPhone}</span>
                                  </div>
                                  {/* Eng pastida: Jami filiallar soni (kichikroq) */}
                                  <div className="location-hero-bottom-branch-row">
                                    <span className="location-hero-branch-badge-mini">
                                      Jami {branchCount} filial bor
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. JOYLASHUV KARTASI TAGIDA: FOYDALANUVCHI KARTASI */}
                          {isLocationOnlyUser ? (
                            /* Faqat joylashuvdan ro'yxatdan o'tgan bo'lsa:
                               Rasm turadigan joy yonida "Foydalanuvchi", tagida "+998 91 000 00 00",
                               yonida kichikroq kalakolchik va "Registratsiyadan o'tish" tugmasi */
                            <div className="profile-unregistered-user-card">
                              <div className="unregistered-user-left">
                                <div className="unregistered-avatar-box">
                                  <User size={26} color="#94a3b8" />
                                </div>
                                <div className="unregistered-user-info">
                                  <h4 className="unregistered-user-name">Foydalanuvchi</h4>
                                  <div className="unregistered-user-phone">
                                    <Phone size={12} color="#94a3b8" />
                                    <span>+998 91 000 00 00</span>
                                  </div>
                                </div>
                              </div>

                              <div className="unregistered-user-right-actions">
                                <button
                                  type="button"
                                  className="profile-user-card-bell-btn"
                                  onClick={handleOpenNotifications}
                                  title="Bildirishnomalar"
                                  aria-label="Bildirishnomalar"
                                >
                                  <Bell size={18} />
                                  {(unreadNotifCount > 0 || hasUnreadNotification) && (
                                    <span className="profile-user-bell-badge">
                                      {unreadNotifCount > 0 ? unreadNotifCount : 1}
                                    </span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="unregistered-signup-btn"
                                  onClick={() => {
                                    setCompleteUserError("");
                                    setCompUserForm({
                                      firstName: "",
                                      lastName: "",
                                      phone: "+998 ",
                                      bDay: "",
                                      bMonth: "",
                                      bYear: "",
                                    });
                                    setShowCompleteUserProfileModal(true);
                                  }}
                                  title="Oddiy foydalanuvchi sifatida ro'yxatdan o'tish"
                                >
                                  <UserPlus size={14} />
                                  <span>Registratsiyadan o'tish</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Oddiy foydalanuvchi ro'yxatdan o'tgan bo'lsa: Ism-familiya va shaxsiy telefon */
                            <div className="profile-hero-card">
                              <div className="profile-hero-top-row">
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

                                <button
                                  type="button"
                                  className="profile-user-card-bell-btn"
                                  onClick={handleOpenNotifications}
                                  title="Bildirishnomalar"
                                  aria-label="Bildirishnomalar"
                                >
                                  <Bell size={18} />
                                  {(unreadNotifCount > 0 || hasUnreadNotification) && (
                                    <span className="profile-user-bell-badge">
                                      {unreadNotifCount > 0 ? unreadNotifCount : 1}
                                    </span>
                                  )}
                                </button>
                              </div>

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
                          )}

                          {/* 3. FAQAT JOYLAShUV JOYLAShDAN RO'YXATDAN O'TGAN BO'LSA:
                                 Joylashuv qo'shish va Mening joylashuvlarim ko'rinadi.
                                 Oddiy user bo'lsa butkul olib tashlanadi! */}
                          {isLocationRegistered && (
                            <>
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
                                    {myStations.map((st) => {
                                      const isApproved = st.isApproved === true || st.is_approved === true || st.status === 'approved' || stations.some((s) => s.id === st.id || s.name === st.name);
                                      const isRejected = st.status === 'rejected' || st.isRejected === true;
                                      return (
                                        <div
                                          key={st.id}
                                          className="my-station-simple-card"
                                          onClick={() => {
                                            if (!isApproved) {
                                              setPendingInspectionModalStation(st);
                                            } else {
                                              setSelectedManageStationId(st.id);
                                            }
                                          }}
                                        >
                                          <div className="my-station-simple-info">
                                            <h5 className="my-station-simple-title">
                                              {st.name}
                                            </h5>
                                            {!isApproved || isRejected ? (
                                              <div style={{ marginTop: '4px' }}>
                                                {isRejected ? (
                                                  <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                                    color: '#ef4444',
                                                  }}>
                                                    <X size={11} /> Rad etildi
                                                  </span>
                                                ) : (
                                                  <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                    background: 'rgba(245, 158, 11, 0.15)',
                                                    border: '1px solid rgba(245, 158, 11, 0.35)',
                                                    color: '#f59e0b',
                                                  }}>
                                                    <Clock size={11} /> Ko'rib chiqilmoqda
                                                  </span>
                                                )}
                                              </div>
                                            ) : null}
                                          </div>

                                          <button
                                            className="my-station-edit-pencil-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isApproved) {
                                                setPendingInspectionModalStation(st);
                                              } else {
                                                setSelectedManageStationId(st.id);
                                              }
                                            }}
                                            title={!isApproved ? "Ko'rib chiqilmoqda" : "Tahrirlash va boshqarish"}
                                            aria-label="Tahrirlash"
                                          >
                                            <Edit3 size={17} />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* O'NG TOMON REKLAMA VIDEOSI (Right Side Video Ad Banner) */}
              <DesktopSideBanner ads={rightAds} ad={rightAd} side="right" />
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
          <DesktopSideBanner ads={leftAds} ad={leftAd} side="left" customClass="settings-desktop-side-banner" />

          {/* O'RTA ASOSIY SOZLAMALAR BO'LIMI */}
          <div className="settings-center-col profile-center-main-col">
            {showNotificationsPage ? (
              <NotificationsView
                    user={user}
                    onBack={() => setShowNotificationsPage(false)}
                    hasUnread={unreadNotifCount > 0 || hasUnreadNotification}
                    onClearUnread={() => {
                      setUnreadNotifCount(0);
                      setHasUnreadNotification(false);
                      try {
                        localStorage.setItem("myup_notif_unread_count", "0");
                        localStorage.setItem("myup_notif_unread", "false");
                        localStorage.setItem("myup_notif_intro_seen", "true");
                      } catch (e) {}
                    }}
                    onUpdateUser={setUser}
                    onGoToAuth={() => {
                      setShowNotificationsPage(false);
                      handleTabChange("my");
                    }}
                    onGoToLocationRegister={handleGoToLocationRegister}
                    isThemeLight={isThemeLight}
                    appTheme={appTheme}
                  />
            ) : (
              <SettingsSection
                currentTheme={appTheme}
                onSaveTheme={handleSaveTheme}
                user={user}
                onLogout={() => setShowLogoutConfirm(true)}
                onNavigateProfile={() => {
                  if (user) {
                    setShowProfileDetail(true);
                  } else {
                    handleTabChange("my");
                  }
                }}
                onOpenNotifications={handleOpenNotifications}
                hasUnreadNotification={unreadNotifCount > 0 || hasUnreadNotification}
                unreadCount={unreadNotifCount}
              />
            )}
          </div>

          {/* O'NG TOMON REKLAMA (Faqat kompyuter holatida) */}
          <DesktopSideBanner ads={rightAds} ad={rightAd} side="right" customClass="settings-desktop-side-banner" />
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
        userCoords={userCoords}
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
          className={`delete-confirm-overlay ${isThemeLight ? "is-light" : ""}`}
          style={{
            '--theme-bg': appTheme?.bg || '#0e0e10',
            '--theme-panel': appTheme?.panel || '#161618',
            '--theme-card': appTheme?.card || '#1c1c1e',
            '--theme-border': appTheme?.border || 'rgba(255, 255, 255, 0.12)',
            '--theme-text': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
            '--theme-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
          }}
          onClick={() => {
            if (!isDeletingStation) {
              setStationToDelete(null);
              setDeleteReason("");
              setDeleteReasonError("");
            }
          }}
        >
          <div 
            className="delete-confirm-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: appTheme?.bg || '#0e0e10',
              color: appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
              borderColor: appTheme?.border || 'rgba(239, 68, 68, 0.35)',
            }}
          >
            <button 
              type="button" 
              className="delete-confirm-close-btn" 
              onClick={() => {
                if (!isDeletingStation) {
                  setStationToDelete(null);
                  setDeleteReason("");
                  setDeleteReasonError("");
                }
              }}
              aria-label="Yopish"
              disabled={isDeletingStation}
            >
              <X size={18} />
            </button>

            <div className="delete-confirm-icon-bubble">
              <Trash2 size={28} />
            </div>

            <h3 className="delete-confirm-title">
              Joylashuvni o'chirish
            </h3>

            <p className="delete-confirm-desc">
              <strong>"{stationToDelete.name}"</strong> manzili A-Maps tizimidan butunlay o'chiriladi.
            </p>

            {/* O'chirish sababi kiritish maydoni */}
            <div className="delete-reason-input-group" style={{ width: '100%', marginTop: '14px', textAlign: 'left' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--text-muted, #94a3b8)',
                  marginBottom: '6px'
                }}
              >
                Nima sababdan o'chirmoqchisiz? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  if (deleteReasonError) setDeleteReasonError("");
                }}
                placeholder="Masalan: Faoliyatimiz to'xtatildi yoki boshqa manzilga ko'chdik..."
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: deleteReasonError ? '1.5px solid #ef4444' : '1.5px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                  color: 'var(--text-main, #ffffff)',
                  fontSize: '0.9rem',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              {deleteReasonError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertCircle size={14} />
                  <span>{deleteReasonError}</span>
                </div>
              )}
            </div>

            <div className="delete-confirm-actions" style={{ marginTop: '18px' }}>
              <button 
                type="button" 
                className="delete-btn-cancel" 
                style={{
                  backgroundColor: isThemeLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                  borderColor: appTheme?.border || (isThemeLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'),
                  color: appTheme?.text || (isThemeLight ? '#334155' : '#ffffff'),
                }}
                onClick={() => {
                  setStationToDelete(null);
                  setDeleteReason("");
                  setDeleteReasonError("");
                }}
                disabled={isDeletingStation}
              >
                Bekor qilish
              </button>

              <button 
                type="button" 
                className="delete-btn-confirm" 
                onClick={handleConfirmDeleteStation}
                disabled={isDeletingStation}
              >
                <Trash2 size={16} />
                <span>{isDeletingStation ? "O'chirilmoqda..." : "Ha, o'chirish"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          HALI TASDIQLANMAGAN MANZIL: "HOZIRDA KO'RIB CHIQILMOQDA" MODAL OYNASI
          ======================================================== */}
      {pendingInspectionModalStation && (
        <div 
          className="profile-overlay" 
          style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}
          onClick={() => setPendingInspectionModalStation(null)}
        >
          <div 
            className="station-bell-modal-card" 
            style={{
              maxWidth: '430px',
              width: '100%',
              textAlign: 'center',
              padding: '2.25rem 1.75rem',
              background: '#0f172a',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(245, 158, 11, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#f59e0b',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
              }}
            >
              <Clock size={36} />
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              marginBottom: '0.85rem'
            }}>
              <span>Hozirda kutilmoqda</span>
            </div>

            <h3 style={{ fontSize: '1.28rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
              Hozirda ko'rib chiqilmoqda
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Siz kiritgan <strong>"{pendingInspectionModalStation.name}"</strong> manzili hozirda Dastur Administratsiyasi tomonidan ko'rib chiqilmoqda. Administratsiya tasdiqlaganidan keyin, manzil ichiga kirib uni to'liq boshqarishingiz (narxlarni o'zgartirish, ochiq/yopiq holati va boshqa onlayn ma'lumotlar) mumkin bo'ladi.
            </p>

            <button
              type="button"
              className="station-bell-modal-btn"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)'
              }}
              onClick={() => setPendingInspectionModalStation(null)}
            >
              Tushunarli
            </button>
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

      {/* Yopish vaqti Modali (Segmented 00:00 time picker) */}
      {reopenModal.isOpen && (
        <div
          className="add-station-overlay"
          onClick={() => setReopenModal({ isOpen: false, stationId: null })}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "380px" }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "8px",
                fontSize: "1.25rem",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Qachon ochiladi?
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "20px",
                textAlign: "center",
                lineHeight: "1.4",
              }}
            >
              Foydalanuvchilarga ma'lumot berish uchun taxminiy ochilish vaqtini kiriting:
            </p>

            <div className="reopen-time-segmented-container">
              <div className="reopen-time-segment">
                <input
                  ref={reopenHoursRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="00"
                  maxLength={2}
                  value={reopenHours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  onKeyDown={handleHoursKeyDown}
                  className="reopen-digit-input"
                  autoFocus
                />
                <span className="reopen-segment-label">Soat</span>
              </div>

              <div className="reopen-time-colon-box">
                <span className="reopen-time-colon">:</span>
              </div>

              <div className="reopen-time-segment">
                <input
                  ref={reopenMinutesRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="00"
                  maxLength={2}
                  value={reopenMinutes}
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  onKeyDown={handleMinutesKeyDown}
                  className="reopen-digit-input"
                />
                <span className="reopen-segment-label">Daqiqa</span>
              </div>
            </div>

            {/* Tezkor vaqt shablonlari */}
            <div className="reopen-quick-presets">
              <button type="button" onClick={() => applyTimePreset(30)}>+30 daq</button>
              <button type="button" onClick={() => applyTimePreset(60)}>+1 soat</button>
              <button type="button" onClick={() => applyTimePreset(120)}>+2 soat</button>
              <button type="button" onClick={() => { setReopenHours("06"); setReopenMinutes("00"); }}>06:00</button>
              <button type="button" onClick={() => { setReopenHours("08"); setReopenMinutes("00"); }}>08:00</button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
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

      {/* ========================================================
          BELGILANGAN VAQTGA YETIB KELINDI! MANZILINGIZ OCHILDIMI? MODAL OYNASI
          ======================================================== */}
      {reopenDueModalStation && (
        <div
          className="profile-overlay reopen-due-overlay"
          onClick={() => setReopenDueModalStation(null)}
        >
          <div
            className="reopen-due-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: appTheme?.bg || "#0e0e10",
              color: appTheme?.text || (isThemeLight ? "#0f172a" : "#ffffff"),
              borderColor: "rgba(245, 158, 11, 0.45)",
            }}
          >
            {/* Yopish tugmasi */}
            <button
              type="button"
              className="delete-confirm-close-btn"
              onClick={() => setReopenDueModalStation(null)}
              aria-label="Yopish"
            >
              <X size={18} />
            </button>

            {/* Tepada animatsiyali ogohlantirish belgisi */}
            <div className="reopen-due-icon-halo">
              <Clock size={34} color="#f59e0b" className="reopen-due-pulse-icon" />
            </div>

            {/* 1. TEPADA TURSIN: Sarlavha va asosiy savol */}
            <h3 className="reopen-due-modal-title">
              Kiritilgan vaqtga yetib kelindi!
            </h3>
            
            <p className="reopen-due-main-question">
              Manzilingiz ochildimi? Foydalanuvchilar kutmoqda!
            </p>

            {/* 2. PASTIDA: Belgilangan vaqtga yetib kelindi indikatori */}
            <div className="reopen-due-info-banner">
              <div className="reopen-due-time-tag">
                <Clock size={15} color="#f59e0b" />
                <span>Belgilangan vaqtga yetib kelindi: <strong>{reopenDueModalStation.reopenTime || "Kiritilgan vaqt"}</strong></span>
              </div>
              <div className="reopen-due-station-name">
                <MapPin size={15} color="#38bdf8" />
                <span>{reopenDueModalStation.name}</span>
              </div>
            </div>

            {/* 3. OCHILISH VAQTINI O'ZGARTIRISH BO'LIMI */}
            <div className="reopen-due-change-box">
              {!isEditingDueTime ? (
                <button
                  type="button"
                  className="reopen-due-toggle-edit-btn"
                  onClick={() => {
                    setIsEditingDueTime(true);
                    setEditDueHours("");
                    setEditDueMinutes("");
                  }}
                >
                  <Edit3 size={15} />
                  <span>Ochilish vaqtini o'zgartirish</span>
                </button>
              ) : (
                <div className="reopen-due-edit-expanded">
                  <div className="reopen-due-edit-header">
                    <span className="reopen-due-edit-label">
                      Yangi ochilish vaqtini kiriting:
                    </span>
                    <button
                      type="button"
                      className="reopen-due-edit-close"
                      onClick={() => setIsEditingDueTime(false)}
                    >
                      Bekor qilish
                    </button>
                  </div>
                  
                  <div className="reopen-due-time-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00"
                      maxLength={2}
                      value={editDueHours}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        if (val && parseInt(val, 10) > 23) val = "23";
                        setEditDueHours(val);
                      }}
                      className="reopen-due-small-input"
                      autoFocus
                    />
                    <span className="reopen-due-colon">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00"
                      maxLength={2}
                      value={editDueMinutes}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        if (val && parseInt(val, 10) > 59) val = "59";
                        setEditDueMinutes(val);
                      }}
                      className="reopen-due-small-input"
                    />
                    <button
                      type="button"
                      className="reopen-due-save-time-btn"
                      onClick={() => handleUpdateReopenDueTime(reopenDueModalStation.id, editDueHours, editDueMinutes)}
                      disabled={!editDueHours && !editDueMinutes}
                    >
                      Vaqtni yangilash
                    </button>
                  </div>

                  {/* Tezkor qo'shish tugmalari */}
                  <div className="reopen-due-presets-row">
                    <button type="button" onClick={() => applyDueTimePreset(15)}>+15 daq</button>
                    <button type="button" onClick={() => applyDueTimePreset(30)}>+30 daq</button>
                    <button type="button" onClick={() => applyDueTimePreset(60)}>+1 soat</button>
                    <button type="button" onClick={() => applyDueTimePreset(120)}>+2 soat</button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. TAGIDA: OCHILDI DEB BELGILASH TUGMASI */}
            <div className="reopen-due-actions-wrap">
              <button
                type="button"
                className="reopen-due-confirm-open-btn"
                onClick={() => handleConfirmStationOpened(reopenDueModalStation.id)}
              >
                <CheckCircle2 size={20} strokeWidth={2.5} />
                <span>Ochildi deb belgilash</span>
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

      {/* ========================================================
          ODDIY FOYDALANUVCHI PROFILINI TO'LDIRISH MODALI
          (Faqat joylashuvdan ro'yxatdan o'tgan userlar uchun)
          Hech qanday SMS yo'q, Joylashuvingiz bormi degan joy yo'q!
          ======================================================== */}
      {showCompleteUserProfileModal && (
        <div 
          className="notif-modal-overlay location-register-modal-overlay" 
          onClick={() => setShowCompleteUserProfileModal(false)}
        >
          <div 
            className="notif-modal-card complete-profile-modal-card location-register-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="notif-modal-close-btn"
              onClick={() => setShowCompleteUserProfileModal(false)}
            >
              <X size={18} />
            </button>

            <div className="notif-modal-header">
              <div className="notif-modal-badge-icon auth-warning-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <UserPlus size={24} color="#38bdf8" />
              </div>
              <h3 className="notif-modal-title">Foydalanuvchi sifatida ro'yxatdan o'tish</h3>
              <p className="notif-modal-sub-text" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
                Shaxsiy profilingiz uchun ism, familiya va telefon raqamingizni kiriting
              </p>
            </div>

            {completeUserError && (
              <div className="modern-auth-error-alert" style={{ margin: '14px 0 0' }}>
                <AlertCircle size={16} />
                <span>{completeUserError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteUserProfileSubmit} className="modern-auth-form" style={{ marginTop: '16px' }}>
              <div className="modern-field-group">
                <label className="modern-field-label">Ismingiz *</label>
                <div className="modern-input-wrap">
                  <User size={18} className="modern-input-icon" />
                  <input 
                    type="text" 
                    placeholder="Masalan: Sardor" 
                    value={compUserForm.firstName}
                    onChange={e => setCompUserForm({ ...compUserForm, firstName: e.target.value.replace(/[0-9]/g, '') })}
                    className="modern-input-field"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="modern-field-group">
                <label className="modern-field-label">Familiyangiz *</label>
                <div className="modern-input-wrap">
                  <User size={18} className="modern-input-icon" />
                  <input 
                    type="text" 
                    placeholder="Masalan: Rahimov" 
                    value={compUserForm.lastName}
                    onChange={e => setCompUserForm({ ...compUserForm, lastName: e.target.value.replace(/[0-9]/g, '') })}
                    className="modern-input-field"
                    required
                  />
                </div>
              </div>

              <div className="modern-field-group">
                <label className="modern-field-label">Tug'ilgan sanangiz *</label>
                <div className="modern-dob-grid">
                  <div className="modern-input-wrap">
                    <input 
                      type="number" 
                      placeholder="Kun" 
                      value={compUserForm.bDay}
                      onChange={e => setCompUserForm({ ...compUserForm, bDay: e.target.value })}
                      min="1" 
                      max="31"
                      className="modern-input-field dob-input"
                      required
                    />
                  </div>
                  <div className="modern-input-wrap">
                    <input 
                      type="number" 
                      placeholder="Oy" 
                      value={compUserForm.bMonth}
                      onChange={e => setCompUserForm({ ...compUserForm, bMonth: e.target.value })}
                      min="1" 
                      max="12"
                      className="modern-input-field dob-input"
                      required
                    />
                  </div>
                  <div className="modern-input-wrap" style={{ flex: 1.3 }}>
                    <input 
                      type="number" 
                      placeholder="Yil (1995)" 
                      value={compUserForm.bYear}
                      onChange={e => setCompUserForm({ ...compUserForm, bYear: e.target.value })}
                      min="1900" 
                      max="2026"
                      className="modern-input-field dob-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modern-field-group">
                <label className="modern-field-label">Telefon raqamingiz *</label>
                <div className="modern-input-wrap">
                  <Phone size={18} className="modern-input-icon text-sky-400" />
                  <input 
                    type="tel" 
                    placeholder="+998 90 123 45 67" 
                    value={compUserForm.phone}
                    onChange={e => setCompUserForm({ ...compUserForm, phone: formatUzPhone(e.target.value) })}
                    className="modern-input-field"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="modern-auth-submit-btn" style={{ marginTop: '8px' }}>
                <CheckCircle2 size={18} />
                <span>Tasdiqlash</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          JOYLASHUV JOYLASh MODALI (Notifications / Settings kalakolchikdan)
          1. Joylashuv nomi, Mas'ul inson, Manzil, Parol, Telefon
          2. Asosiy rasm (va Tashlab ketish)
          SMS BORISHI SHART EMAS!
          ======================================================== */}
      {showLocationRegisterModal && (
        <div 
          className="notif-modal-overlay location-register-modal-overlay" 
          onClick={() => setShowLocationRegisterModal(false)}
        >
          <div 
            className="notif-modal-card location-register-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="notif-modal-close-btn"
              onClick={() => setShowLocationRegisterModal(false)}
            >
              <X size={18} />
            </button>

            <div className="notif-modal-header">
              <div className="notif-modal-badge-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <MapPin size={24} color="#38bdf8" />
              </div>
              <h3 className="notif-modal-title">Joylashuv joylash</h3>
              <p className="notif-modal-sub-text" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
                {locModalStep === 1 
                  ? "Joylashuvingiz ma'lumotlarini kiriting" 
                  : "Joylashuvingiz uchun asosiy rasm qo'yib keting"}
              </p>
            </div>

            {locModalError && (
              <div className="modern-auth-error-alert" style={{ margin: '14px 0 0' }}>
                <AlertCircle size={16} />
                <span>{locModalError}</span>
              </div>
            )}

            {locModalStep === 1 && (
              <form onSubmit={handleLocationModalStep1Submit} className="modern-auth-form" style={{ marginTop: '16px' }}>
                <div className="modern-field-group">
                  <label className="modern-field-label">Joylashuv nomi *</label>
                  <div className="modern-input-wrap">
                    <Building2 size={18} className="modern-input-icon text-sky-400" />
                    <input 
                      type="text" 
                      placeholder="Masalan: Grand Metan Servis" 
                      value={locModalData.locationName}
                      onChange={e => setLocModalData({ ...locModalData, locationName: e.target.value })}
                      className="modern-input-field"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-field-label">Mas'ul inson ismi *</label>
                  <div className="modern-input-wrap">
                    <User size={18} className="modern-input-icon" />
                    <input 
                      type="text" 
                      placeholder="Masalan: Sardor Rahimov" 
                      value={locModalData.responsiblePerson}
                      onChange={e => setLocModalData({ ...locModalData, responsiblePerson: e.target.value })}
                      className="modern-input-field"
                      required
                    />
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-field-label">Joylashuv manzili *</label>
                  <div className="modern-input-wrap">
                    <MapPin size={18} className="modern-input-icon text-amber-400" />
                    <input 
                      type="text" 
                      placeholder="Masalan: Toshkent sh., Chilonzor tumani" 
                      value={locModalData.locationAddress}
                      onChange={e => setLocModalData({ ...locModalData, locationAddress: e.target.value })}
                      className="modern-input-field"
                      required
                    />
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-field-label">Maxfiy parol *</label>
                  <div className="modern-input-wrap">
                    <Lock size={18} className="modern-input-icon" />
                    <input 
                      type={showLocModalPassword ? "text" : "password"} 
                      placeholder="Kamida 4 ta belgi" 
                      value={locModalData.password}
                      onChange={e => setLocModalData({ ...locModalData, password: e.target.value })}
                      className="modern-input-field"
                      required
                    />
                    <button 
                      type="button" 
                      className="modern-pwd-toggle-btn"
                      onClick={() => setShowLocModalPassword(!showLocModalPassword)}
                      aria-label="Parolni ko'rsatish/yashirish"
                    >
                      {showLocModalPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-field-label">Joylashuv asosiy telefon raqami *</label>
                  <div className="modern-input-wrap">
                    <Phone size={18} className="modern-input-icon text-emerald-400" />
                    <input 
                      type="tel" 
                      placeholder="+998 90 123 45 67" 
                      value={locModalData.phone}
                      onChange={e => setLocModalData({ ...locModalData, phone: formatUzPhone(e.target.value) })}
                      className="modern-input-field"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="modern-auth-submit-btn" style={{ marginTop: '8px' }}>
                  <span>Davom etish</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {locModalStep === 2 && (
              <div className="modern-auth-form location-photo-step-form" style={{ marginTop: '16px' }}>
                <input 
                  type="file" 
                  ref={locModalFileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setLocModalData({ ...locModalData, locationImage: ev.target.result });
                    };
                    reader.readAsDataURL(file);
                  }} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />

                <div className="location-photo-picker-area">
                  {locModalData.locationImage ? (
                    <div className="location-photo-preview-wrap">
                      <img 
                        src={locModalData.locationImage} 
                        alt="Joylashuv rasmi" 
                        className="location-photo-preview-img" 
                      />
                      <div className="photo-preview-overlay-actions">
                        <button 
                          type="button" 
                          className="change-photo-btn"
                          onClick={() => locModalFileInputRef.current?.click()}
                        >
                          <Upload size={14} />
                          <span>Almashtirish</span>
                        </button>
                        <button 
                          type="button" 
                          className="remove-photo-btn"
                          onClick={() => setLocModalData({ ...locModalData, locationImage: null })}
                        >
                          <X size={14} />
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="location-photo-upload-placeholder clickable"
                      onClick={() => locModalFileInputRef.current?.click()}
                    >
                      <div className="upload-arrow-circle">
                        <Upload size={22} color="#38bdf8" />
                      </div>
                      <span className="upload-main-text">Rasm yuklash uchun bosing</span>
                      <span className="upload-sub-text">PNG, JPG, WEBP (maksimal 5MB)</span>
                    </div>
                  )}
                </div>

                <div className="location-photo-actions-row" style={{ marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="location-skip-action-btn"
                    onClick={() => handleFinishLocationModalRegister(null)}
                    title="Rasmsiz davom etish"
                  >
                    <SkipForward size={16} />
                    <span>Tashlab ketish</span>
                  </button>

                  <button 
                    type="button" 
                    className="modern-auth-submit-btn flex-1"
                    onClick={() => handleFinishLocationModalRegister(locModalData.locationImage)}
                  >
                    <CheckCircle2 size={18} />
                    <span>Tasdiqlash</span>
                  </button>
                </div>

                <button 
                  type="button" 
                  className="location-step-back-btn"
                  onClick={() => setLocModalStep(1)}
                  style={{ marginTop: '12px', textAlign: 'center', width: '100%' }}
                >
                  ← Ma'lumotlarni o'zgartirish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          JOYLASHUV MA'LUMOTLARINI O'ZGARTIRISH (TAHRIRLASH) MODALI
          Nom, mas'ul shaxs, telefon raqam va rasmni o'zgartirish
          ======================================================== */}
      {showEditLocationHeroModal && (
        <div 
          className="notif-modal-overlay location-register-modal-overlay location-edit-hero-modal-overlay" 
          onClick={() => setShowEditLocationHeroModal(false)}
        >
          <div 
            className="notif-modal-card location-register-modal-card location-edit-hero-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="notif-modal-close-btn"
              onClick={() => setShowEditLocationHeroModal(false)}
            >
              <X size={18} />
            </button>

            <div className="notif-modal-header">
              <div className="notif-modal-badge-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <Edit3 size={24} color="#38bdf8" />
              </div>
              <h3 className="notif-modal-title">Joylashuvni tahrirlash</h3>
              <p className="notif-modal-sub-text" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
                Joylashuv nomi, mas'ul inson, telefon va asosiy rasmni o'zgartiring
              </p>
            </div>

            {editLocationError && (
              <div className="modern-auth-error-alert" style={{ margin: '14px 0 0' }}>
                <AlertCircle size={16} />
                <span>{editLocationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditLocationModal} className="modern-auth-form" style={{ marginTop: '16px' }}>
              {/* Asosiy rasm tanlash / almashtirish */}
              <div className="modern-field-group">
                <label className="modern-field-label">Joylashuv rasmi</label>
                <input 
                  type="file" 
                  ref={editLocationFileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setEditLocationForm({ ...editLocationForm, locationImage: ev.target.result });
                    };
                    reader.readAsDataURL(file);
                  }} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />

                <div className="location-photo-picker-area" style={{ marginTop: '4px' }}>
                  {editLocationForm.locationImage ? (
                    <div className="location-photo-preview-wrap">
                      <img 
                        src={editLocationForm.locationImage} 
                        alt="Joylashuv rasmi" 
                        className="location-photo-preview-img" 
                      />
                      <div className="photo-preview-overlay-actions">
                        <button 
                          type="button" 
                          className="change-photo-btn"
                          onClick={() => editLocationFileInputRef.current?.click()}
                        >
                          <Upload size={14} />
                          <span>Almashtirish</span>
                        </button>
                        <button 
                          type="button" 
                          className="remove-photo-btn"
                          onClick={() => setEditLocationForm({ ...editLocationForm, locationImage: null })}
                        >
                          <X size={14} />
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="location-photo-upload-placeholder clickable"
                      onClick={() => editLocationFileInputRef.current?.click()}
                      style={{ padding: '16px 12px' }}
                    >
                      <div className="upload-arrow-circle" style={{ width: '40px', height: '40px' }}>
                        <Upload size={20} color="#38bdf8" />
                      </div>
                      <span className="upload-main-text" style={{ fontSize: '0.88rem' }}>Rasm yuklash yoki almashtirish</span>
                      <span className="upload-sub-text">PNG, JPG, WEBP (maksimal 5MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Joylashuv nomi */}
              <div className="modern-field-group">
                <label className="modern-field-label">Joylashuv nomi *</label>
                <div className="modern-input-wrap">
                  <Building2 size={18} className="modern-input-icon text-sky-400" />
                  <input 
                    type="text" 
                    placeholder="Masalan: Grand Metan Servis" 
                    value={editLocationForm.locationName}
                    onChange={e => setEditLocationForm({ ...editLocationForm, locationName: e.target.value })}
                    className="modern-input-field"
                    required
                  />
                </div>
              </div>

              {/* Mas'ul inson ismi */}
              <div className="modern-field-group">
                <label className="modern-field-label">Mas'ul inson ismi *</label>
                <div className="modern-input-wrap">
                  <User size={18} className="modern-input-icon" />
                  <input 
                    type="text" 
                    placeholder="Masalan: Sardor Rahimov" 
                    value={editLocationForm.responsiblePerson}
                    onChange={e => setEditLocationForm({ ...editLocationForm, responsiblePerson: e.target.value })}
                    className="modern-input-field"
                    required
                  />
                </div>
              </div>

              {/* Joylashuv asosiy telefoni */}
              <div className="modern-field-group">
                <label className="modern-field-label">Joylashuv asosiy telefon raqami *</label>
                <div className="modern-input-wrap">
                  <Phone size={18} className="modern-input-icon text-emerald-400" />
                  <input 
                    type="tel" 
                    placeholder="+998 90 123 45 67" 
                    value={editLocationForm.locationPhone}
                    onChange={e => setEditLocationForm({ ...editLocationForm, locationPhone: formatUzPhone(e.target.value) })}
                    className="modern-input-field"
                    required
                  />
                </div>
              </div>

              <div className="modern-form-actions-row" style={{ marginTop: '14px' }}>
                <button 
                  type="button" 
                  className="modern-auth-back-action-btn"
                  onClick={() => setShowEditLocationHeroModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="modern-auth-submit-btn flex-1">
                  <CheckCircle2 size={18} />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
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

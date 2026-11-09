import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Navigation,
  Loader,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Fuel,
  Zap,
  Sparkles,
  MapPin,
  Utensils,
  Coffee,
  ShoppingBag,
  Route,
  BadgePercent,
  Gauge,
  AlertTriangle,
  Radio,
  Megaphone,
  ExternalLink,
  User,
} from 'lucide-react';
import { calculateDistance, formatDistance } from '../utils/distance';
import { stationMatchesFuel } from '../utils/fuel';
import { getAppMapStyle } from '../utils/mapStyle';

// Vite muhitida MapLibre web workerini to'g'ri ulash
maplibregl.setWorkerUrl(workerUrl);

// PMTiles protokolini qo'shish
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// Shahobchalar ko'rinishi uchun masshtab chegarasi:
const MIN_STATION_ZOOM = 12.0;

// Metan gaz, Benzin, Propan va Elektr uchun SVG ikonlar
const FUEL_SVG = `
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <line x1="3" x2="15" y1="22" y2="22"/>
    <line x1="4" x2="14" y1="9" y2="9"/>
    <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
  </svg>
`;

const PLUG_SVG = `
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22v-5"/>
    <path d="M9 8V2"/>
    <path d="M15 8V2"/>
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>
  </svg>
`;

function getStationSvgIcon(station) {
  const types = Array.isArray(station.type)
    ? station.type
    : [station.fuelType || station.type || 'benzin'];

  if (types.includes('elektr')) {
    return PLUG_SVG;
  }
  return FUEL_SVG;
}

export { stationMatchesFuel };

// Zaxira demo shahobchalar (agar ro'yxat bo'sh bo'lsa darhol ishlashi uchun)
export const DEFAULT_DEMO_STATIONS = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStationPopupContent(station, onSelectStation, onNavigate, popup) {
  const popupContent = document.createElement('div');
  popupContent.className = 'myup-popup-card';
  popupContent.addEventListener('click', (e) => e.stopPropagation());

  const stationName = escapeHtml(station.name || "Yoqilg'i shahobchasi");
  const stationAddress = escapeHtml(
    station.address || station.city || "104, Qoratosh ko'chasi, Qoratosh, Shayxontohur tumani"
  );
  const isOpen = station.isOpen !== false;
  const hoursText = escapeHtml(
    station.workHours ||
      station.workingHours ||
      (isOpen ? '23:00 gacha' : (station.reopenTime ? `Ochiladi: ${station.reopenTime}` : 'Yopiq'))
  );

  let distText = '1,2 km';
  if (station.distanceKm !== undefined && station.distanceKm !== null && !isNaN(station.distanceKm)) {
    distText = formatDistance(station.distanceKm).replace('.', ',');
  }

  // Gaz bosimi hisoblash
  const rawPressure = station.gasPressure || station.pressure;
  const pressureNum = Number(rawPressure);
  let pressureLabel = 'Yaxshi';
  let activeBars = 3;

  if (!isNaN(pressureNum) && pressureNum > 0) {
    if (pressureNum >= 215) {
      pressureLabel = "A'lo";
      activeBars = 4;
    } else if (pressureNum >= 185) {
      pressureLabel = 'Yaxshi';
      activeBars = 3;
    } else if (pressureNum >= 150) {
      pressureLabel = "O'rtacha";
      activeBars = 2;
    } else {
      pressureLabel = 'Past';
      activeBars = 1;
    }
  } else {
    pressureLabel = 'Yaxshi';
    activeBars = 3;
  }

  const updatedAgo = escapeHtml(station.updatedAgo || '5 daqiqa oldin yangilangan');

  // Yoqilg'i turlari
  const isElectricOnly =
    station.type === 'elektr' ||
    (Array.isArray(station.type) && station.type.length === 1 && station.type[0] === 'elektr');

  const hasMetan = stationMatchesFuel(station, 'metan') || Number(station.prices?.metan) > 0;
  const hasBenzin = stationMatchesFuel(station, 'benzin') || stationMatchesFuel(station, 'ai92') || stationMatchesFuel(station, 'ai95') || Number(station.prices?.benzin) > 0;
  const hasPropan = stationMatchesFuel(station, 'propan') || Number(station.prices?.propan) > 0;
  const hasElektr = stationMatchesFuel(station, 'elektr') || Number(station.prices?.elektr) > 0;

  const fuelList = [];
  if (hasBenzin) {
    fuelList.push({ name: 'AI-92', active: true });
    fuelList.push({ name: 'AI-95', active: true });
  }
  if (hasMetan) {
    fuelList.push({ name: 'Metan', active: true });
  }
  if (hasPropan) {
    fuelList.push({ name: 'Propan', active: true });
  }
  if (hasElektr) {
    fuelList.push({ name: 'Elektr', active: true });
  }
  if (fuelList.length === 0) {
    fuelList.push({ name: "Yoqilg'i mavjud", active: true });
  }

  const categoryTitle = isElectricOnly ? 'ELEKTR QUVVATLASH' : "YOQILG'I SHAHOBCHASI";

  const pumpSvg = isElectricOnly
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#11286b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22v-5"/>
        <path d="M9 8V2"/>
        <path d="M15 8V2"/>
        <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>
      </svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#11286b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" x2="15" y1="22" y2="22"/>
        <line x1="4" x2="14" y1="9" y2="9"/>
        <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
        <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
      </svg>`;

  popupContent.innerHTML = `
    <!-- HEADER -->
    <div class="myup-popup-header">
      <div class="myup-popup-header-left">
        <div class="myup-popup-icon-box">
          ${pumpSvg}
        </div>
        <div class="myup-popup-title-wrap">
          <span class="myup-popup-subtitle">${categoryTitle}</span>
          <h3 class="myup-popup-title" title="${stationName}">${stationName}</h3>
        </div>
      </div>
      <button type="button" id="btn-close-${station.id}" class="myup-popup-close-btn" aria-label="Yopish">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- STATUS VA MASOFA -->
    <div class="myup-popup-status-row">
      <div class="myup-popup-status-left">
        <span class="myup-popup-status-badge ${isOpen ? 'open' : 'closed'}">
          <span class="myup-popup-status-dot"></span>
          <span>${isOpen ? 'Ochiq' : 'Yopiq'}</span>
        </span>
        <span class="myup-popup-hours-text">${hoursText}</span>
      </div>
      <span class="myup-popup-dist-text">${distText}</span>
    </div>

    <!-- MANZIL -->
    <div class="myup-popup-address-row">
      <svg class="myup-popup-pin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span class="myup-popup-address-text">${stationAddress}</span>
    </div>

    <!-- GAZ BOSIMI QUTISI (Faqat metan yoki propan sotilsa va bosim mavjud bo'lsa) -->
    ${(hasMetan || hasPropan) && Number(rawPressure) > 0 ? `
    <div class="myup-popup-pressure-box">
      <div class="myup-popup-pressure-header">
        <span class="myup-popup-pressure-title">Gaz bosimi</span>
        <span class="myup-popup-pressure-status">${pressureLabel}</span>
      </div>
      <div class="myup-popup-pressure-bars">
        <div class="myup-popup-meter-bar ${activeBars >= 1 ? 'active' : ''}"></div>
        <div class="myup-popup-meter-bar ${activeBars >= 2 ? 'active' : ''}"></div>
        <div class="myup-popup-meter-bar ${activeBars >= 3 ? 'active' : ''}"></div>
        <div class="myup-popup-meter-bar ${activeBars >= 4 ? 'active' : ''}"></div>
      </div>
      <span class="myup-popup-pressure-updated">${updatedAgo}</span>
    </div>` : ''}

    <!-- YOQILG'I TURLARI -->
    <div class="myup-popup-fuels-section">
      <div class="myup-popup-fuels-title">Yoqilg'i turlari</div>
      <div class="myup-popup-fuels-grid">
        ${fuelList
          .map(
            (f) => `
          <span class="myup-popup-fuel-chip ${f.active ? 'active' : 'inactive'}">
            <span class="myup-popup-fuel-dot ${f.active ? 'dot-active' : 'dot-inactive'}"></span>
            <span>${f.name}</span>
          </span>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- TUGMALAR -->
    <div class="myup-popup-actions-row">
      <button type="button" id="btn-nav-${station.id}" class="myup-popup-btn-nav">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
        <span>Yo'nalish</span>
      </button>
      <button type="button" id="btn-detail-${station.id}" class="myup-popup-btn-detail">
        <span>Batafsil</span>
      </button>
    </div>

    <!-- XATOLIK BILDIRISH -->
    <div class="myup-popup-report-row">
      <span>Ma'lumot noto'g'rimi? </span>
      <button type="button" id="btn-report-${station.id}" class="myup-popup-report-btn">Xabar bering</button>
    </div>
  `;

  // Listenerlar
  const closeBtn = popupContent.querySelector(`#btn-close-${station.id}`);
  if (closeBtn && popup) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.remove();
    });
  }

  const navBtn = popupContent.querySelector(`#btn-nav-${station.id}`);
  if (navBtn) {
    navBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup) {
        popup.remove();
      }
      if (onNavigate) {
        onNavigate(station);
      } else {
        const url = `https://yandex.uz/maps/?rtext=~${station.lat},${station.lng}&rtt=auto`;
        window.open(url, '_blank');
      }
    });
  }

  const detailBtn = popupContent.querySelector(`#btn-detail-${station.id}`);
  if (detailBtn && onSelectStation) {
    detailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectStation(station);
    });
  }

  const reportBtn = popupContent.querySelector(`#btn-report-${station.id}`);
  if (reportBtn) {
    reportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const originalText = btn.innerHTML;
      btn.innerText = 'Xabar qabul qilindi! ✓';
      btn.style.color = '#10b981';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 3500);
    });
  }

  return popupContent;
}

export default function MapView({
  stations = [],
  activeFuelFilter = 'all',
  onFuelFilterChange,
  onSelectStation,
  onNavigate,
  searchQuery = '',
  showSidebar = false, // Faqat xarita bo'limida (activeTab === 'map') ko'rsatiladi
  userCoords = null,
  ads = [],
  onOpenAdvertising,
  onOpenProfile,
  isDarkTheme = true,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const hasAutoCentered = useRef(false);

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [mobileSortMode, setMobileSortMode] = useState('nearest'); // 'nearest' | 'quality' | 'cheapest'
  const [mobileActiveStationId, setMobileActiveStationId] = useState(null);
  const [sheetMode, setSheetMode] = useState('peek'); // 'peek' | 'mid' | 'full'
  const sheetModeRef = useRef(sheetMode);
  sheetModeRef.current = sheetMode;
  const isSheetExpanded = sheetMode !== 'peek';
  const sheetRef = useRef(null);
  const grabAreaRef = useRef(null);
  const listRef = useRef(null);
  const isSheetDragging = useRef(false);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const touchStartTime = useRef(0);
  const startTranslateY = useRef(0);
  const didDragRef = useRef(false);

  const PEEK_HEIGHT = 170; // 170px peek: faqat eng yaqin manzilning yarmigacha ko'rinadi

  const getSnapTranslates = () => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const sheetHeight = sheetRef.current?.offsetHeight || Math.round(vh * 0.80);
    const midVisible = Math.round(vh * 0.46); // Instagram comments kabi ekranning 46% qismi
    return {
      sheetHeight,
      full: 0,
      mid: Math.max(0, sheetHeight - midVisible),
      peek: Math.max(0, sheetHeight - PEEK_HEIGHT),
    };
  };

  const handleSheetTouchStart = (e) => {
    if (!e.touches || !e.touches[0]) return;
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    isSheetDragging.current = true;
    didDragRef.current = false;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    touchStartTime.current = Date.now();

    const snaps = getSnapTranslates();
    startTranslateY.current = snaps[sheetModeRef.current] ?? snaps.peek;
    sheetEl.classList.add('is-dragging');
  };

  const handleSheetTouchMove = (e) => {
    if (!isSheetDragging.current || !e.touches || !e.touches[0]) return;
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    touchDeltaY.current = deltaY;

    if (Math.abs(deltaY) > 4) {
      didDragRef.current = true;
    }

    const snaps = getSnapTranslates();
    const targetTranslate = startTranslateY.current + deltaY;
    const clampedTranslate = Math.max(-15, Math.min(snaps.peek + 25, targetTranslate));

    sheetEl.style.transform = `translateY(${clampedTranslate}px)`;
  };

  const handleSheetTouchEnd = () => {
    if (!isSheetDragging.current) return;
    isSheetDragging.current = false;

    const sheetEl = sheetRef.current;
    if (sheetEl) {
      sheetEl.classList.remove('is-dragging');
      sheetEl.style.transform = '';
    }

    const deltaY = touchDeltaY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = deltaY / (deltaTime || 1); // < 0: yuqoriga, > 0: pastga

    // Aniq va yumshoq Snap Points (Peek <-> Mid <-> Full)
    setSheetMode((prevMode) => {
      // 1. Agar avval "peek" (pastda) bo'lsa:
      if (prevMode === 'peek') {
        if (velocity < -0.7 || deltaY < -200) {
          return 'full';
        }
        if (velocity < -0.15 || deltaY < -20) {
          return 'mid';
        }
        return 'peek';
      }

      // 2. Agar avval "mid" (o'rtada) bo'lsa:
      if (prevMode === 'mid') {
        if (velocity < -0.15 || deltaY < -20) {
          return 'full';
        }
        if (velocity > 0.15 || deltaY > 20) {
          return 'peek';
        }
        return 'mid';
      }

      // 3. Agar avval "full" (eng tepada) bo'lsa:
      if (prevMode === 'full') {
        if (velocity > 0.7 || deltaY > 220) {
          return 'peek';
        }
        if (velocity > 0.15 || deltaY > 20) {
          return 'mid';
        }
        return 'full';
      }

      return prevMode;
    });

    setTimeout(() => {
      didDragRef.current = false;
      touchDeltaY.current = 0;
    }, 120);
  };

  // Brauzerning noo'rin pull-to-refresh reload qilishini to'xtatuvchi native event listener
  useEffect(() => {
    if (!isMobile) return;
    const grabEl = grabAreaRef.current;
    const listEl = listRef.current;
    if (!grabEl) return;

    const onGrabTouchStart = (e) => {
      handleSheetTouchStart(e);
    };

    const onGrabTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault(); // Brauzer sahifani pull-to-refresh reload qilishini butunlay to'xtatadi
      }
      handleSheetTouchMove(e);
    };

    const onGrabTouchEnd = () => {
      handleSheetTouchEnd();
    };

    grabEl.addEventListener('touchstart', onGrabTouchStart, { passive: true });
    grabEl.addEventListener('touchmove', onGrabTouchMove, { passive: false });
    grabEl.addEventListener('touchend', onGrabTouchEnd, { passive: true });
    grabEl.addEventListener('touchcancel', onGrabTouchEnd, { passive: true });

    let listTouchStartY = 0;
    let isPullingDownSheet = false;

    const onListTouchStart = (e) => {
      if (!e.touches || !e.touches[0]) return;
      listTouchStartY = e.touches[0].clientY;
      isPullingDownSheet = false;
      if (sheetModeRef.current === 'peek') {
        handleSheetTouchStart(e);
      }
    };

    const onListTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - listTouchStartY;

      if (sheetModeRef.current === 'peek') {
        if (e.cancelable) e.preventDefault();
        handleSheetTouchMove(e);
        return;
      }

      // Agar ro'yxat eng tepada bo'lsa (scrollTop <= 2) va foydalanuvchi pastga tortsa:
      if (listEl && listEl.scrollTop <= 2 && delta > 0) {
        if (e.cancelable) {
          e.preventDefault(); // Brauzer refresh qilmaydi, aksincha xarita ochilishi uchun sheet pastga suriladi!
        }
        if (!isPullingDownSheet) {
          isPullingDownSheet = true;
          handleSheetTouchStart(e);
        } else {
          handleSheetTouchMove(e);
        }
      }
    };

    const onListTouchEnd = () => {
      if (sheetModeRef.current === 'peek' || isPullingDownSheet) {
        handleSheetTouchEnd();
      }
      isPullingDownSheet = false;
    };

    if (listEl) {
      listEl.addEventListener('touchstart', onListTouchStart, { passive: true });
      listEl.addEventListener('touchmove', onListTouchMove, { passive: false });
      listEl.addEventListener('touchend', onListTouchEnd, { passive: true });
      listEl.addEventListener('touchcancel', onListTouchEnd, { passive: true });
    }

    return () => {
      grabEl.removeEventListener('touchstart', onGrabTouchStart);
      grabEl.removeEventListener('touchmove', onGrabTouchMove);
      grabEl.removeEventListener('touchend', onGrabTouchEnd);
      grabEl.removeEventListener('touchcancel', onGrabTouchEnd);
      if (listEl) {
        listEl.removeEventListener('touchstart', onListTouchStart);
        listEl.removeEventListener('touchmove', onListTouchMove);
        listEl.removeEventListener('touchend', onListTouchEnd);
        listEl.removeEventListener('touchcancel', onListTouchEnd);
      }
    };
  }, [isMobile]);

  const handleGrabClick = () => {
    if (didDragRef.current) return;
    setSheetMode((prev) => {
      if (prev === 'peek') return 'mid';
      if (prev === 'mid') return 'full';
      return 'peek';
    });
  };

  const [userPos, setUserPos] = useState(() => {
    return userCoords && userCoords.lat && userCoords.lng
      ? [userCoords.lat, userCoords.lng]
      : null;
  }); // [lat, lng]
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(!userCoords);
  const [errorMsg, setErrorMsg] = useState('');
  const watchRef = useRef(null);

  useEffect(() => {
    if (userCoords && userCoords.lat && userCoords.lng) {
      setUserPos([userCoords.lat, userCoords.lng]);
      setLocating(false);
    }
  }, [userCoords]);

  // Yandex uslubidagi chap panel holatlari
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quickSortMode, setQuickSortMode] = useState(null); // 'nearest' | 'cheapest' | null
  const [selectedFuelType, setSelectedFuelType] = useState(() => {
    if (activeFuelFilter && activeFuelFilter !== 'all') return activeFuelFilter;
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return 'metan';
    return 'all';
  });
  const [highlightedStationId, setHighlightedStationId] = useState(null);
  const [isBottomBannerClosed, setIsBottomBannerClosed] = useState(false);

  // Kompyuter xaritasi uchun reklamalar: Xarita tagidagi katta banner va chap panel tagidagi to'rtburchak reklama
  const mapBottomAd = useMemo(() => {
    const list = Array.isArray(ads) ? ads : [];
    return list.find((a) => a && a.is_active !== false && (a.side === 'map_bottom' || a.slot === 'map_bottom')) || null;
  }, [ads]);

  const mapSidebarAd = useMemo(() => {
    const list = Array.isArray(ads) ? ads : [];
    return list.find((a) => a && a.is_active !== false && (a.side === 'map_sidebar' || a.slot === 'map_sidebar')) || null;
  }, [ads]);

  useEffect(() => {
    const targetAd = mapBottomAd || mapSidebarAd;
    if (targetAd?.id && !String(targetAd.id).startsWith('sample')) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const timer = setTimeout(() => {
        fetch(`${apiBase}/ads/${targetAd.id}/view`, { method: 'POST' }).catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mapBottomAd?.id, mapSidebarAd?.id]);

  const handleOpenAdLink = (adItem) => {
    if (adItem && adItem.id) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiBase}/ads/${adItem.id}/click`, { method: 'POST' }).catch(() => {});
    }
    const link = adItem?.target_link || adItem?.targetLink || 'https://t.me/amaps_support';
    window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
  };

  useEffect(() => {
    if (activeFuelFilter) {
      setSelectedFuelType(activeFuelFilter);
    }
  }, [activeFuelFilter]);
  const [highlightBadgeText, setHighlightBadgeText] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapFadingOut, setIsMapFadingOut] = useState(false);
  const [highlightBadgeType, setHighlightBadgeType] = useState('selected'); // 'cheapest' | 'nearest' | 'selected'
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Masofalarni hisoblash
  const effectiveStations = useMemo(() => {
    const rawList = Array.isArray(stations) ? stations : [];
    // Dublikatlarni tozalash (har bir id bo'yicha faqat 1 ta unikal nusxa olinadi)
    const stationDict = {};
    rawList.forEach((st) => {
      if (st && st.id) stationDict[st.id] = st;
    });
    const baseList = Object.values(stationDict);
    const refLat = userPos ? userPos[0] : 41.311081;
    const refLng = userPos ? userPos[1] : 69.240562;

    return baseList.map((st) => ({
      ...st,
      distanceKm: calculateDistance(refLat, refLng, Number(st.lat), Number(st.lng)),
    }));
  }, [stations, userPos]);

  // Saralangan va filtrlangan shahobchalar ro'yxati
  const filteredStationList = useMemo(() => {
    let list = [...effectiveStations];

    const q = (sidebarSearch || searchQuery || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (st) =>
          st.name?.toLowerCase().includes(q) ||
          st.brand?.toLowerCase().includes(q) ||
          st.address?.toLowerCase().includes(q)
      );
    }

    if (selectedFuelType && selectedFuelType !== 'all') {
      list = list.filter((st) => stationMatchesFuel(st, selectedFuelType));
    }

    const currentSort = isMobile ? mobileSortMode : quickSortMode;
    if (currentSort === 'nearest') {
      list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (currentSort === 'cheapest') {
      const getPrice = (st) => {
        if (selectedFuelType !== 'all' && st.prices?.[selectedFuelType]) {
          return Number(st.prices[selectedFuelType]);
        }
        if (st.prices && Object.keys(st.prices).length > 0) {
          const vals = Object.values(st.prices).filter((p) => Number(p) > 0);
          if (vals.length > 0) return Math.min(...vals.map(Number));
        }
        return Number(st.price) || 999999;
      };
      list.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (currentSort === 'quality') {
      const getQuality = (st) => {
        const pressure = Number(st.gasPressure || st.pressure || 0);
        const rating = Number(st.rating || 0);
        return pressure + rating * 40;
      };
      list.sort((a, b) => getQuality(b) - getQuality(a));
    }

    return list;
  }, [effectiveStations, sidebarSearch, searchQuery, selectedFuelType, quickSortMode, mobileSortMode, isMobile]);

  // Faol tanlangan shahobcha
  const highlightedStation = useMemo(() => {
    if (!highlightedStationId) return null;
    return effectiveStations.find((s) => s.id === highlightedStationId) || null;
  }, [effectiveStations, highlightedStationId]);

  // Mobil telefon holatida pastki kartada ko'rsatiladigan tanlangan shahobcha
  const activeMobileStation = useMemo(() => {
    if (mobileActiveStationId) {
      const found = filteredStationList.find((s) => s.id === mobileActiveStationId);
      if (found) return found;
    }
    return filteredStationList[0] || effectiveStations[0] || null;
  }, [filteredStationList, effectiveStations, mobileActiveStationId]);

  // Rasmdagi kabi 2 qatorli yoqilg'i narxi qutilari (Propan | AI-92 yoki Metan | Propan)
  const getStationFuelBoxes = (st) => {
    if (!st) {
      return [
        { label: 'Propan', price: '5 500', unit: "so'm/l" },
        { label: 'AI-92', price: '10 500', unit: "so'm/l" },
      ];
    }
    const p = st.prices || {};
    const boxes = [];

    if (p.metan || st.types?.includes('metan')) {
      boxes.push({
        label: 'Metan',
        price: (Number(p.metan) || 3800).toLocaleString('ru-RU').replace(',', ' '),
        unit: "so'm/m³",
      });
    }
    if (p.propan || st.types?.includes('propan')) {
      boxes.push({
        label: 'Propan',
        price: (Number(p.propan) || 5500).toLocaleString('ru-RU').replace(',', ' '),
        unit: "so'm/l",
      });
    }
    if (p.ai92 || p.benzin || st.types?.includes('benzin')) {
      boxes.push({
        label: 'AI-92',
        price: (Number(p.ai92 || p.benzin) || 10500).toLocaleString('ru-RU').replace(',', ' '),
        unit: "so'm/l",
      });
    }
    if (p.ai95) {
      boxes.push({
        label: 'AI-95',
        price: Number(p.ai95).toLocaleString('ru-RU').replace(',', ' '),
        unit: "so'm/l",
      });
    }
    if (p.elektr || st.types?.includes('elektr')) {
      boxes.push({
        label: 'Elektr',
        price: (Number(p.elektr) || 1800).toLocaleString('ru-RU').replace(',', ' '),
        unit: "so'm/kVt",
      });
    }
    if (p.dizel || st.types?.includes('dizel')) {
      boxes.push({
        label: 'Dizel',
        price: (Number(p.dizel) || 11500).toLocaleString('ru-RU').replace(',', ' '),
        unit: "so'm/l",
      });
    }

    if (boxes.length === 0) {
      boxes.push({ label: 'Metan', price: '3 800', unit: "so'm/m³" });
      boxes.push({ label: 'Propan', price: '5 500', unit: "so'm/l" });
    } else if (boxes.length === 1) {
      if (boxes[0].label === 'Propan') {
        boxes.push({ label: 'AI-92', price: '10 500', unit: "so'm/l" });
      } else {
        boxes.push({ label: 'Propan', price: '5 500', unit: "so'm/l" });
      }
    }

    return boxes.slice(0, 2);
  };

  const travelDurationMinutes = Math.max(
    1,
    Math.round(((activeMobileStation?.distanceKm || 0.6) / 35) * 60)
  );

  function formatCardDistance(km) {
    if (km === undefined || km === null || isNaN(km)) return '354 m';
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1).replace('.', ',')} km`;
  }

  // Protomaps sozlamalari
  const protomapsKey = import.meta.env.VITE_PROTOMAPS_KEY;

  // 1. Xaritani initsializatsiya qilish (MapLibre GL JS)
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let isMounted = true;

    function initMap() {
      try {
        const mapStyle = getAppMapStyle(protomapsKey);

        if (!isMounted || !mapContainerRef.current) return;

        const initialCenter = userPos ? [userPos[1], userPos[0]] : [69.240562, 41.311081];

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: initialCenter,
          zoom: 13.5,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapInstance(map);

          map.on('zoom', () => {
            const z = map.getZoom();
            const markers = document.querySelectorAll('.yandex-station-marker');
            markers.forEach((m) => {
              if (m.classList.contains('station-highlight-pulse')) {
                m.classList.remove('station-hidden');
              } else if (z < MIN_STATION_ZOOM) {
                m.classList.add('station-hidden');
              } else {
                m.classList.remove('station-hidden');
              }
            });
          });
        });
      } catch (err) {
        console.error('Xaritani yuklashda xatolik:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [protomapsKey]);

  // Xarita konteyneri o'lchami o'zgarganda (balandlik oshirilganda) MapLibre'ni darhol qayta moslash
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstance) return;
    const ro = new ResizeObserver(() => {
      if (mapInstance && typeof mapInstance.resize === 'function') {
        mapInstance.resize();
      }
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, [mapInstance]);

  // Xarita va barcha shahobchalar xaritaga to'liq tushguncha yarqirab turishi (Foydalanuvchi talabi)
  useEffect(() => {
    if (!mapInstance) return;
    const timer = setTimeout(() => {
      setIsMapFadingOut(true);
      const finishTimer = setTimeout(() => {
        setIsMapReady(true);
      }, 500);
      return () => clearTimeout(finishTimer);
    }, 1800);

    return () => clearTimeout(timer);
  }, [mapInstance, filteredStationList?.length]);

  // 2. Foydalanuvchi GPS joylashuvini kuzatish
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Brauzeringizda geolokatsiya qo'llab-quvvatlanmaydi");
      setLocating(false);
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos && pos.coords) {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserPos([lat, lng]);
          setAccuracy(pos.coords.accuracy);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setErrorMsg('Joylashuvga ruxsat berilmadi');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  // 3. Foydalanuvchi joylashuvi markerini MapLibre'ga chizish
  useEffect(() => {
    const map = mapRef.current || mapInstance;
    if (!map || !userPos) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'maplibre-user-marker';
      el.innerHTML = `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(56,189,248,0.22);animation:uPulse 2s ease-out infinite;"></div>
          <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(56,189,248,0.35);animation:uPulse 2s ease-out infinite 0.4s;"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:#0284c7;border:3px solid #fff;box-shadow:0 0 10px rgba(56,189,248,0.9);z-index:10;"></div>
        </div>
      `;

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userPos[1], userPos[0]])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPos[1], userPos[0]]);
    }

    if (!hasAutoCentered.current) {
      hasAutoCentered.current = true;
      map.flyTo({
        center: [userPos[1], userPos[0]],
        zoom: 14.5,
        duration: 1500,
        essential: true,
      });
    }
  }, [userPos, mapInstance]);

  // 4. Shahobchalar markerlarini chizish (va faol tanlanganni yonib-yonib turgandek ko'rsatish)
  useEffect(() => {
    const map = mapRef.current || mapInstance;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!filteredStationList || filteredStationList.length === 0) return;

    const currentZoom = map.getZoom();
    const shouldShow = currentZoom >= (isMobile ? 10.0 : MIN_STATION_ZOOM);

    // Shahobchalar uchun tanlangan yoqilg'i narxlarini hisoblash va eng arzonini aniqlash
    const stationPrices = {};
    let minPrice = Infinity;

    filteredStationList.forEach((station) => {
      let p = null;
      if (selectedFuelType && selectedFuelType !== 'all') {
        if (station.prices && station.prices[selectedFuelType]) {
          p = Number(station.prices[selectedFuelType]);
        } else if (selectedFuelType === 'benzin' && station.prices?.ai92) {
          p = Number(station.prices.ai92);
        }
      }
      if (!p && station.prices && Object.keys(station.prices).length > 0) {
        const vals = Object.values(station.prices).map(Number).filter((v) => v > 0);
        if (vals.length > 0) p = Math.min(...vals);
      }
      if (!p && Number(station.price) > 0) {
        p = Number(station.price);
      }
      if (!p) {
        if (selectedFuelType === 'metan') p = 3800;
        else if (selectedFuelType === 'propan') p = 5500;
        else if (selectedFuelType === 'benzin') p = 10500;
        else if (selectedFuelType === 'elektr') p = 1800;
        else if (selectedFuelType === 'dizel') p = 11500;
        else p = 3800;
      }
      stationPrices[station.id] = p;
      if (p < minPrice) minPrice = p;
    });

    filteredStationList.forEach((station) => {
      if (!station.lat || !station.lng) return;

      const isCurrentActive = (activeMobileStation?.id === station.id) || (highlightedStationId === station.id);
      const isVisible = shouldShow || isCurrentActive;
      const price = stationPrices[station.id] || 3800;
      const isBestPrice = price === minPrice;

      const el = document.createElement('div');
      const svgIcon = getStationSvgIcon(station);
      el.className = `yandex-station-marker ${isVisible ? '' : 'station-hidden'} ${isCurrentActive ? 'station-highlight-pulse' : ''}`;
      el.innerHTML = `
        <div class="ym-icon-pin ${isCurrentActive ? 'pin-pulse' : ''}">
          ${svgIcon}
        </div>
        <span class="ym-name-label ${isCurrentActive ? 'label-pulse' : ''}">${station.name || 'Zapravka'}</span>
      `;

      el.addEventListener('click', (e) => {
        setMobileActiveStationId(station.id);
        triggerStationHighlight(station, 'Tanlangan', 'selected');
      });

      // Popup kontenti
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        className: 'myup-station-maplibre-popup',
        maxWidth: '340px',
      });

      const popupContent = renderStationPopupContent(station, onSelectStation, onNavigate, popup);
      popup.setDOMContent(popupContent);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'top-left',
        offset: [-12, -12],
      })
        .setLngLat([Number(station.lng), Number(station.lat)])
        .setPopup(popup)
        .addTo(map);

      // Popap faqat marker bosilganda ochiladi
      marker.station = station;
      markersRef.current.push(marker);
    });
  }, [filteredStationList, onSelectStation, onNavigate, mapInstance, highlightedStationId, highlightBadgeText, isMobile, selectedFuelType, activeMobileStation?.id]);

  // Shahobchani tanlash va unga sal yaqinlashtirib yonib-yonib ko'rsatish
  const triggerStationHighlight = (station, badgeText, badgeType = 'selected') => {
    setHighlightedStationId(station.id);
    setHighlightBadgeText(badgeText);
    setHighlightBadgeType(badgeType);

    const map = mapRef.current || mapInstance;
    if (map && station.lat && station.lng) {
      // Sal yaqinlashtirib (zoom 15.4) o'sha joyga avto o'tish
      map.flyTo({
        center: [Number(station.lng), Number(station.lat)],
        zoom: 15.4,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });

      // Tanlangan shahobcha markerining popupini ochish
      const targetMarker = markersRef.current.find((m) => m.station && m.station.id === station.id);
      if (targetMarker && targetMarker.getPopup) {
        const p = targetMarker.getPopup();
        if (p && !p.isOpen()) {
          targetMarker.togglePopup();
        }
      }

      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  // "Eng yaqin" tugmasi bosilganda
  const handleSelectNearest = () => {
    setQuickSortMode('nearest');
    let list = [...effectiveStations];
    if (selectedFuelType !== 'all') {
      list = list.filter((st) => stationMatchesFuel(st, selectedFuelType));
    }
    list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    if (list.length > 0) {
      const best = list[0];
      triggerStationHighlight(best, "Eng yaqin shahobcha", "nearest");
    }
  };

  // "Eng arzon" tugmasi bosilganda
  const handleSelectCheapest = () => {
    setQuickSortMode('cheapest');
    let list = [...effectiveStations];
    if (selectedFuelType !== 'all') {
      list = list.filter((st) => stationMatchesFuel(st, selectedFuelType));
    }
    const getPrice = (st) => {
      if (selectedFuelType !== 'all' && st.prices?.[selectedFuelType]) {
        return st.prices[selectedFuelType];
      }
      if (st.prices && Object.keys(st.prices).length > 0) {
        const vals = Object.values(st.prices).filter((p) => p > 0);
        if (vals.length > 0) return Math.min(...vals);
      }
      return st.price || 999999;
    };
    list.sort((a, b) => getPrice(a) - getPrice(b));

    if (list.length > 0) {
      const best = list[0];
      triggerStationHighlight(best, "Eng arzon shahobcha", "cheapest");
    }
  };

  // "Mening joylashuvim" tugmasi
  const handleLocateMe = () => {
    const map = mapRef.current || mapInstance;
    if (!map) return;
    if (userPos) {
      map.flyTo({
        center: [userPos[1], userPos[0]],
        zoom: 15,
        duration: 1500,
        essential: true,
      });
    } else if (effectiveStations.length > 0 && effectiveStations[0].lat) {
      map.flyTo({
        center: [Number(effectiveStations[0].lng), Number(effectiveStations[0].lat)],
        zoom: 15,
        duration: 1500,
        essential: true,
      });
    }
  };

  return (
    <div className="real-map-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes uPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .real-map-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .maplibregl-map {
          width: 100%;
          height: 100%;
        }

        /* MOBIL TELEFON HOLATIDA HARITA BO'LIMI */
        @media (max-width: 768px) {
          .map-fullscreen-wrapper {
            top: 64px !important;
          }

          /* Panel telefonda butun ekranni to'sib turmaydi, yuqoridagi floating boshqaruvga aylanadi */
          .yandex-map-sidebar {
            position: absolute !important;
            top: 12px !important;
            left: 0 !important;
            right: 0 !important;
            bottom: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
            pointer-events: none !important;
            z-index: 25 !important;
          }

          .yandex-map-sidebar > * {
            pointer-events: auto !important;
          }

          .hide-on-mobile,
          .yandex-sidebar-toggle-btn,
          .yandex-sidebar-ad-slot-wrapper,
          .map-bottom-ad-banner-slot {
            display: none !important;
          }

          /* 1. Eng tepada faqat qidiruv va yonidagi tugma */
          .yandex-sidebar-search-header {
            background: #ffffff !important;
            margin: 0 12px !important;
            padding: 8px 10px !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16) !important;
            border: 1px solid #e2e8f0 !important;
          }

          .yandex-search-box {
            padding: 6px 10px !important;
            border-radius: 12px !important;
            background: #f8fafc !important;
          }

          .yandex-search-input {
            font-size: 0.86rem !important;
          }

          .yandex-route-icon-btn {
            width: 36px !important;
            height: 36px !important;
            border-radius: 12px !important;
            background: #ef4444 !important;
            color: #ffffff !important;
            border-color: #ef4444 !important;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3) !important;
          }

          /* 2. Pastida kichikroq bo'lib shahobcha, oshxona va boshqalar chiqishi */
          .yandex-categories-scroll-area {
            margin: 8px 12px 0 12px !important;
            padding: 8px 12px !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 14px !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
          }

          .yandex-categories-scroll-area::-webkit-scrollbar {
            display: none !important;
          }

          .yandex-categories-grid {
            justify-content: flex-start !important;
            gap: 14px !important;
          }

          .yandex-cat-circle {
            width: 38px !important;
            height: 38px !important;
          }

          .yandex-cat-circle svg {
            width: 18px !important;
            height: 18px !important;
          }

          .yandex-cat-name {
            font-size: 0.68rem !important;
            margin-top: 2px !important;
          }

          /* 3. "Eng yaqin" va "Eng arzon" telefonda chiqmaydi */
          .desktop-only-actions,
          .desktop-only-highlight {
            display: none !important;
          }

          /* 4. Shahobcha tanlanganda tagidan metan gazlar kichik bo'lib chiqishi */
          .yandex-shahobcha-subpanel {
            padding: 0 !important;
            margin: 6px 12px 0 12px !important;
          }

          .yandex-fuel-pills-row {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            padding: 6px 10px !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            justify-content: flex-start !important;
            overflow-x: auto !important;
            gap: 6px !important;
          }

          .yandex-pill-chip {
            padding: 4px 10px !important;
            font-size: 0.72rem !important;
            border-radius: 9999px !important;
          }

          .yandex-no-data-box {
            margin: 6px 12px 0 12px !important;
            padding: 10px 14px !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
            flex-direction: row !important;
            gap: 8px !important;
            border: 1px solid #e2e8f0 !important;
          }

          .yandex-no-data-icon {
            font-size: 1.2rem !important;
            margin: 0 !important;
          }

          .yandex-no-data-title {
            font-size: 0.82rem !important;
          }

          .yandex-no-data-desc {
            display: none !important;
          }
        }

        /* YANDEX USLUBIDAGI CHAP PANEL */
        .yandex-map-sidebar {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 380px;
          max-width: 86vw;
          background: #ffffff;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          z-index: 30;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e2e8f0;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .yandex-map-sidebar.closed {
          transform: translateX(-100%);
        }

        .yandex-sidebar-toggle-btn {
          position: absolute;
          top: 14px;
          right: -36px;
          width: 36px;
          height: 38px;
          background: #1e293b;
          color: #ffffff;
          border: none;
          border-radius: 0 10px 10px 0;
          box-shadow: 3px 2px 10px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 31;
        }

        .yandex-sidebar-toggle-btn:hover {
          background: #0f172a;
          color: #38bdf8;
        }

        /* 1. Qidiruv qatori */
        .yandex-sidebar-search-header {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #f1f5f9;
        }

        .yandex-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 12px;
          gap: 8px;
          transition: border-color 0.2s;
        }

        .yandex-search-box:focus-within {
          border-color: #ef4444;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }

        .yandex-search-pin-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .yandex-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.9rem;
          color: #1e293b;
          outline: none;
        }

        .yandex-search-input::placeholder {
          color: #94a3b8;
        }

        .yandex-search-submit-icon {
          color: #64748b;
          flex-shrink: 0;
        }

        .yandex-search-clear-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }

        .yandex-route-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .yandex-route-icon-btn:hover {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
        }

        /* 2. Dumaloq menyular qatori */
        .yandex-categories-scroll-area {
          padding: 14px 12px 10px 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .yandex-categories-grid {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 10px;
        }

        .yandex-cat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .yandex-cat-item:hover {
          transform: translateY(-2px);
        }

        .yandex-cat-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transition: all 0.2s;
        }

        .shahobcha-circle {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .food-circle {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        }

        .cafe-circle {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        }

        .shop-circle {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .yandex-cat-item.active .yandex-cat-circle {
          box-shadow: 0 0 0 3px #ef4444, 0 6px 18px rgba(239, 68, 68, 0.45);
          transform: scale(1.08);
        }

        .yandex-cat-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: #334155;
          text-align: center;
        }

        .yandex-cat-item.dimmed {
          opacity: 0.6;
        }

        /* 3. Sub-panel: "Eng yaqin" va "Eng arzon" */
                @keyframes slideDownFade {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .yandex-shahobcha-subpanel {
          animation: slideDownFade 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12px;
          overflow-y: auto;
          gap: 12px;
        }

        .yandex-action-btn-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .yandex-action-card-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          text-align: left;
        }

        .yandex-action-card-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }

        /* Tanlanganda tugmaning orqa foni kulrangroq bo'lishi, tanlanmagani oqligicha turishi */
        .yandex-action-card-btn.active {
          background: #e2e8f0 !important;
          border: 1.5px solid #94a3b8 !important;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08) !important;
        }

        .yandex-action-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .yandex-action-card-btn.active .yandex-action-icon-wrap {
          background: #cbd5e1 !important;
          color: #0f172a !important;
        }

        .yandex-action-title {
          display: block;
          font-weight: 700;
          font-size: 0.88rem;
          color: #0f172a;
        }

        .yandex-action-card-btn.active .yandex-action-title {
          color: #0f172a !important;
          font-weight: 800;
        }

        .yandex-action-sub {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
        }

        .yandex-action-card-btn.active .yandex-action-sub {
          color: #475569 !important;
        }

        /* Yoqilg'i filtr chiplari */
        .yandex-fuel-pills-row {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .yandex-fuel-pills-row::-webkit-scrollbar {
          display: none;
        }

        .yandex-pill-chip {
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .yandex-pill-chip.active {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
        }

        /* Modern Highlight Card (Faol tanlangan zapravka) */
        .yandex-highlight-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 14px;
          padding: 13px 15px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -3px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease-in-out;
          margin-top: 6px;
        }

        .yandex-highlight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .yandex-highlight-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .yandex-highlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: -0.01em;
        }

        .yandex-highlight-badge.badge-cheapest {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .yandex-highlight-badge.badge-nearest {
          background: #f0f9ff;
          color: #0284c7;
          border: 1px solid #bae6fd;
        }

        .yandex-highlight-badge.badge-selected {
          background: #eef2ff;
          color: #4f46e5;
          border: 1px solid #c7d2fe;
        }

        .yandex-highlight-dist {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
          background: #f1f5f9;
          padding: 3px 7px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .yandex-highlight-close-btn {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }

        .yandex-highlight-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .yandex-highlight-name {
          font-size: 0.96rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px 0;
          line-height: 1.3;
        }

        .yandex-highlight-address {
          font-size: 0.74rem;
          color: #64748b;
          margin: 0 0 10px 0;
          line-height: 1.35;
        }

        .yandex-highlight-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .yandex-highlight-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .yandex-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .yandex-status-pill.open {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .yandex-status-pill.closed {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .yandex-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .yandex-status-pill.open .yandex-status-dot {
          background: #22c55e;
          box-shadow: 0 0 5px rgba(34, 197, 94, 0.6);
        }

        .yandex-status-pill.closed .yandex-status-dot {
          background: #ef4444;
        }

        .yandex-metric-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 7px;
          border-radius: 6px;
        }

        .yandex-metric-pill.price {
          background: #faf5ff;
          color: #7e22ce;
          border: 1px solid #e9d5ff;
        }

        .yandex-metric-pill.pressure {
          background: #f0f9ff;
          color: #0284c7;
          border: 1px solid #bae6fd;
        }

        .yandex-highlight-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .yandex-highlight-btn-route {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          font-size: 0.72rem;
          font-weight: 600;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .yandex-highlight-btn-route:hover {
          background: #1d4ed8;
        }

        .yandex-highlight-btn-detail {
          padding: 5px 9px;
          font-size: 0.72rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .yandex-highlight-btn-detail:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        [data-theme='dark'] .yandex-highlight-card,
        .is-dark .yandex-highlight-card {
          background: #1e293b;
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
        }

        [data-theme='dark'] .yandex-highlight-name,
        .is-dark .yandex-highlight-name {
          color: #f8fafc;
        }

        [data-theme='dark'] .yandex-highlight-address,
        .is-dark .yandex-highlight-address {
          color: #94a3b8;
        }

        [data-theme='dark'] .yandex-highlight-footer,
        .is-dark .yandex-highlight-footer {
          border-top-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme='dark'] .yandex-highlight-dist,
        .is-dark .yandex-highlight-dist {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme='dark'] .yandex-highlight-close-btn,
        .is-dark .yandex-highlight-close-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }

        /* Hali ma'lumot yo'q kartochkasi */
        .yandex-no-data-box {
          animation: slideDownFade 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          text-align: center;
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 16px;
          margin: 12px;
          gap: 6px;
        }

        .yandex-no-data-icon {
          font-size: 2.2rem;
          margin-bottom: 2px;
        }

        .yandex-no-data-title {
          font-size: 0.96rem;
          font-weight: 700;
          color: #334155;
        }

        .yandex-no-data-desc {
          font-size: 0.78rem;
          color: #94a3b8;
          margin: 0;
        }

        /* Shahobchalar ro'yxati */
        .yandex-stations-list-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .yandex-stations-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .yandex-station-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .yandex-station-list-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .yandex-station-list-item.selected {
          border-color: #ef4444;
          background: #fff5f5;
        }

        .yandex-st-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .yandex-st-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fee2e2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .yandex-st-icon-circle.selected {
          background: #ef4444;
          color: #ffffff;
        }

        .yandex-st-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .yandex-st-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yandex-st-addr {
          font-size: 0.74rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yandex-st-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
          margin-top: 2px;
        }

        .yandex-st-dist {
          color: #0284c7;
        }

        .yandex-st-pressure {
          color: #059669;
        }

        .yandex-st-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .yandex-st-price-tag {
          font-size: 0.82rem;
          font-weight: 800;
          color: #ef4444;
        }

        .yandex-st-arrow {
          font-size: 1.2rem;
          color: #cbd5e1;
        }

        /* XARITADAGI MARKERLAR (YANDEX USLUBI) */
        .yandex-station-marker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          white-space: nowrap !important;
        }

        .yandex-station-marker.station-hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .yandex-station-marker:hover .ym-icon-pin {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35) !important;
        }

        .yandex-station-marker .ym-icon-pin {
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28) !important;
          border: 1.5px solid #ef4444 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          transition: transform 0.2s;
        }

        .yandex-station-marker .ym-name-label {
          color: #ef4444 !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          text-shadow:
            -1.5px -1.5px 0 #ffffff,
             1.5px -1.5px 0 #ffffff,
            -1.5px  1.5px 0 #ffffff,
             1.5px  1.5px 0 #ffffff,
             0 1px 3px rgba(0, 0, 0, 0.35) !important;
          pointer-events: auto !important;
        }

        /* YONIB-YONIB TURGANDAY ENG YAQIN MEN MAN EFFEKTI */
        .ym-beacon-badge {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6), 0 0 10px rgba(255, 255, 255, 0.5);
          border: 1.5px solid #ffffff;
          animation: beaconBadgeFloat 1.2s infinite ease-in-out;
          pointer-events: none;
          z-index: 100;
        }

        .ym-beacon-badge::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: #b91c1c transparent transparent transparent;
        }

        @keyframes beaconBadgeFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }

        .station-highlight-pulse .ym-icon-pin {
          background: #ef4444 !important;
          border: 2.5px solid #ffffff !important;
          animation: yandexBeaconPulse 1.2s infinite ease-in-out !important;
        }

        .station-highlight-pulse .ym-icon-pin svg {
          stroke: #ffffff !important;
        }

        @keyframes yandexBeaconPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8), 0 0 16px rgba(239, 68, 68, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 16px rgba(239, 68, 68, 0), 0 0 30px rgba(239, 68, 68, 1);
            transform: scale(1.22);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 0 16px rgba(239, 68, 68, 0.7);
            transform: scale(1);
          }
        }

        .station-highlight-pulse .ym-name-label {
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #dc2626 !important;
          animation: yandexNameGlow 1.2s infinite ease-in-out !important;
        }

        @keyframes yandexNameGlow {
          0%, 100% {
            transform: scale(1);
            text-shadow:
              -2px -2px 0 #ffffff,
               2px -2px 0 #ffffff,
              -2px  2px 0 #ffffff,
               2px  2px 0 #ffffff,
               0 0 10px rgba(239, 68, 68, 0.8),
               0 0 20px rgba(239, 68, 68, 0.5);
          }
          50% {
            transform: scale(1.08);
            text-shadow:
              -2px -2px 0 #ffffff,
               2px -2px 0 #ffffff,
              -2px  2px 0 #ffffff,
               2px  2px 0 #ffffff,
               0 0 18px rgba(239, 68, 68, 1),
               0 0 32px rgba(239, 68, 68, 0.9);
          }
        }

        .locate-me-btn {
          position: absolute;
          bottom: 24px;
          right: 16px;
          z-index: 10;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: all 0.2s;
        }
        .locate-me-btn:hover {
          background: #ef4444;
          color: #ffffff;
          transform: scale(1.05);
        }
        .map-status-banner {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          white-space: nowrap;
        }
        .map-accuracy-badge {
          position: absolute;
          bottom: 80px;
          right: 16px;
          z-index: 10;
          background: rgba(15, 23, 42, 0.8);
          color: #94a3b8;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* ===================================================
           MAXSUS MYUP SHAHOBCHA POPUP (DIZAYN ASOSIDA)
           =================================================== */
        .myup-station-maplibre-popup {
          z-index: 1000 !important;
        }

        .myup-station-maplibre-popup .maplibregl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 20px !important;
        }

        .myup-station-maplibre-popup .maplibregl-popup-close-button {
          display: none !important;
        }

        .myup-station-maplibre-popup .maplibregl-popup-tip {
          border-width: 10px !important;
        }

        .myup-station-maplibre-popup[class*="maplibregl-popup-anchor-bottom"] .maplibregl-popup-tip {
          border-top-color: #ffffff !important;
        }
        .myup-station-maplibre-popup[class*="maplibregl-popup-anchor-top"] .maplibregl-popup-tip {
          border-bottom-color: #ffffff !important;
        }
        .myup-station-maplibre-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip {
          border-right-color: #ffffff !important;
        }
        .myup-station-maplibre-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip {
          border-left-color: #ffffff !important;
        }

        .myup-popup-card {
          width: 320px;
          max-width: calc(100vw - 32px);
          background: #ffffff;
          border-radius: 20px;
          padding: 18px 18px 16px 18px;
          box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.05);
          font-family: inherit;
          color: #0f172a;
          box-sizing: border-box;
          text-align: left;
          user-select: text;
        }

        .myup-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          position: relative;
        }

        .myup-popup-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .myup-popup-icon-box {
          width: 44px;
          height: 44px;
          min-width: 44px;
          background: #eff4fe;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .myup-popup-title-wrap {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .myup-popup-subtitle {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #64748b;
          text-transform: uppercase;
        }

        .myup-popup-title {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          margin: 1px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
        }

        .myup-popup-close-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 3px 5px;
          color: #64748b;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .myup-popup-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .myup-popup-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
        }

        .myup-popup-status-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .myup-popup-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }

        .myup-popup-status-badge.open {
          background: #e6f7ef;
          color: #047857;
        }

        .myup-popup-status-badge.closed {
          background: #fee2e2;
          color: #b91c1c;
        }

        .myup-popup-status-dot {
          width: 6.5px;
          height: 6.5px;
          border-radius: 50%;
          background: currentColor;
        }

        .myup-popup-hours-text {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .myup-popup-dist-text {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f2868;
        }

        .myup-popup-address-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
        }

        .myup-popup-pin-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .myup-popup-address-text {
          font-size: 12px;
          line-height: 1.45;
          color: #475569;
          font-weight: 500;
        }

        .myup-popup-pressure-box {
          background: #f3f6fb;
          border-radius: 14px;
          padding: 12px 14px;
          margin-top: 13px;
        }

        .myup-popup-pressure-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .myup-popup-pressure-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #0f172a;
        }

        .myup-popup-pressure-status {
          font-size: 12px;
          font-weight: 700;
          color: #059669;
        }

        .myup-popup-pressure-bars {
          display: flex;
          gap: 6px;
          margin: 8px 0;
        }

        .myup-popup-meter-bar {
          flex: 1;
          height: 5px;
          border-radius: 3px;
          background: #cbd5e1;
          transition: background 0.2s;
        }

        .myup-popup-meter-bar.active {
          background: #10b981;
        }

        .myup-popup-pressure-updated {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .myup-popup-fuels-section {
          margin-top: 13px;
        }

        .myup-popup-fuels-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .myup-popup-fuels-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .myup-popup-fuel-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 11.5px;
          font-weight: 600;
        }

        .myup-popup-fuel-chip.active {
          color: #0f172a;
          border-color: #e2e8f0;
        }

        .myup-popup-fuel-chip.inactive {
          color: #64748b;
          border-color: #edf2f7;
        }

        .myup-popup-fuel-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .myup-popup-fuel-dot.dot-active {
          background: #10b981;
        }

        .myup-popup-fuel-dot.dot-inactive {
          background: #94a3b8;
        }

        .myup-popup-actions-row {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .myup-popup-btn-nav {
          flex: 1.15;
          background: #11286b;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 9.5px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s, transform 0.1s;
        }

        .myup-popup-btn-nav:hover {
          background: #0d1e52;
        }

        .myup-popup-btn-nav:active {
          transform: scale(0.98);
        }

        .myup-popup-btn-detail {
          flex: 1;
          background: #ffffff;
          color: #11286b;
          border: 1.5px solid #11286b;
          border-radius: 12px;
          padding: 9.5px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, transform 0.1s;
        }

        .myup-popup-btn-detail:hover {
          background: #f8fafc;
        }

        .myup-popup-btn-detail:active {
          transform: scale(0.98);
        }

        .myup-popup-report-row {
          margin-top: 13px;
          text-align: center;
          font-size: 11.5px;
          color: #475569;
          font-weight: 500;
        }

        .myup-popup-report-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 11.5px;
          color: #11286b;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.15s;
        }

        .myup-popup-report-btn:hover {
          color: #0d1e52;
        }

        /* ========================================================
           AD SLOTS STYLES (DESKTOP)
           1. Sidebar Bottom Rectangular Ad
           2. Map Bottom Leaderboard Banner
           ======================================================== */

        /* 1. Sidebar Bottom Rectangular Ad */
        .yandex-sidebar-ad-slot-wrapper {
          margin-top: auto;
          padding: 14px 16px 16px 16px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .yandex-sidebar-ad-card {
          border-radius: 14px;
          padding: 16px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .yandex-sidebar-ad-card.placeholder-ad {
          background: #eef2f6;
          border: 1.5px dashed #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .yandex-sidebar-ad-card.placeholder-ad:hover {
          border-color: #2563eb;
          background: #e2e8f0;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.16);
        }

        .yandex-sidebar-ad-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .yandex-sidebar-ad-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .yandex-sidebar-ad-size {
          font-size: 0.68rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .yandex-sidebar-ad-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4px 0;
        }

        .yandex-sidebar-ad-icon-ring {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
          margin-bottom: 6px;
        }

        .yandex-sidebar-ad-cta-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .yandex-sidebar-ad-cta-sub {
          font-size: 0.72rem;
          color: #64748b;
          line-height: 1.3;
          max-width: 240px;
        }

        .yandex-sidebar-ad-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 7px 12px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .yandex-sidebar-ad-action-btn:hover {
          background: #1d4ed8;
        }

        /* Sidebar active ad */
        .yandex-sidebar-ad-card.active-ad {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          padding: 8px;
        }

        .yandex-sidebar-ad-media-wrap {
          position: relative;
          width: 100%;
          height: 90px;
          border-radius: 8px;
          overflow: hidden;
          background: #000000;
        }

        .yandex-sidebar-ad-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yandex-sidebar-ad-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          font-size: 0.62rem;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .yandex-sidebar-ad-info {
          padding: 8px 4px 4px 4px;
        }

        .yandex-sidebar-ad-title {
          font-size: 0.86rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px 0;
        }

        .yandex-sidebar-ad-desc {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0 0 8px 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .yandex-sidebar-ad-cta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: #f1f5f9;
          color: #2563eb;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* 2. Map Bottom Leaderboard Banner */
        .map-bottom-ad-banner-slot {
          position: absolute;
          bottom: 14px;
          z-index: 25;
          min-height: 72px;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 16px;
          box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.05);
          display: flex;
          align-items: center;
          padding: 8px 18px;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), right 0.3s ease;
          overflow: hidden;
        }

        .map-bottom-ad-banner-slot.sidebar-open {
          left: 400px;
          right: 76px;
        }

        .map-bottom-ad-banner-slot.sidebar-closed {
          left: 20px;
          right: 76px;
        }

        .map-bottom-ad-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 16px;
          cursor: pointer;
        }

        .map-bottom-ad-left-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .map-bottom-ad-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .map-bottom-ad-text {
          flex: 1;
          min-width: 0;
        }

        .map-bottom-ad-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .map-bottom-ad-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .map-bottom-ad-badge-promo,
        .map-bottom-ad-tag {
          font-size: 0.65rem;
          font-weight: 700;
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          padding: 2px 7px;
          border-radius: 5px;
          white-space: nowrap;
        }

        .map-bottom-ad-desc {
          font-size: 0.76rem;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.35;
        }

        .map-bottom-ad-media-thumb {
          position: relative;
          width: 80px;
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          background: #000000;
          flex-shrink: 0;
        }

        .map-bottom-thumb-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-bottom-badge-label {
          position: absolute;
          bottom: 3px;
          left: 4px;
          font-size: 0.58rem;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.7);
          color: #ffffff;
          padding: 1px 4px;
          border-radius: 3px;
        }

        .map-bottom-ad-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .map-bottom-ad-btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .map-bottom-ad-btn-cta.primary-cta {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .map-bottom-ad-btn-cta.primary-cta:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .map-bottom-ad-btn-close {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .map-bottom-ad-btn-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Dark Mode Support for Ad Slots */
        [data-theme='dark'] .yandex-sidebar-ad-slot-wrapper,
        .is-dark .yandex-sidebar-ad-slot-wrapper {
          background: #1e293b;
          border-top-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme='dark'] .yandex-sidebar-ad-card.placeholder-ad,
        .is-dark .yandex-sidebar-ad-card.placeholder-ad {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(255, 255, 255, 0.15);
        }

        [data-theme='dark'] .yandex-sidebar-ad-cta-title,
        .is-dark .yandex-sidebar-ad-cta-title,
        [data-theme='dark'] .map-bottom-ad-title,
        .is-dark .map-bottom-ad-title {
          color: #f8fafc;
        }

        [data-theme='dark'] .yandex-sidebar-ad-cta-sub,
        .is-dark .yandex-sidebar-ad-cta-sub,
        [data-theme='dark'] .map-bottom-ad-desc,
        .is-dark .map-bottom-ad-desc {
          color: #94a3b8;
        }

        [data-theme='dark'] .map-bottom-ad-banner-slot,
        .is-dark .map-bottom-ad-banner-slot {
          background: #1e293b;
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
        }

        [data-theme='dark'] .map-bottom-ad-icon-box,
        .is-dark .map-bottom-ad-icon-box {
          background: rgba(37, 99, 235, 0.15);
          border-color: rgba(37, 99, 235, 0.3);
        }

        [data-theme='dark'] .map-bottom-ad-btn-close,
        .is-dark .map-bottom-ad-btn-close {
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .yandex-sidebar-ad-slot-wrapper,
          .map-bottom-ad-banner-slot {
            display: none !important;
          }
        }
      `}</style>

      {/* YANDEX USLUBIDAGI CHAP PANEL (Faqat xarita bo'limida va faqat kompyuterda) */}
      {showSidebar && !isMobile && (
        <div className={`yandex-map-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        {/* Ochish / yopish ko'rsatkich tugmasi */}
        <button
          className="yandex-sidebar-toggle-btn hide-on-mobile"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Panelni yopish' : 'Panelni ochish'}
          type="button"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* 1. Tepadagi Qidiruv qatori (Yandex Maps uslubida) */}
        <div className="yandex-sidebar-search-header">
          <div className="yandex-search-box">
            <MapPin size={18} className="yandex-search-pin-icon" />
            <input
              type="text"
              placeholder="Joy va tanlov..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="yandex-search-input"
            />
            {sidebarSearch ? (
              <button
                className="yandex-search-clear-btn"
                onClick={() => setSidebarSearch('')}
                type="button"
              >
                <X size={15} />
              </button>
            ) : (
              <Search size={17} className="yandex-search-submit-icon" />
            )}
          </div>
          <button
            className="yandex-route-icon-btn"
            title="Mening joylashuvimga o'tish"
            type="button"
            onClick={handleLocateMe}
          >
            <Route size={18} />
          </button>
        </div>

        {/* 2. Yumaloq menyular qatori (Rasmdagi kabi) */}
        <div className="yandex-categories-scroll-area">
          <div className="yandex-categories-grid">
            {/* SHAHOBCHA (Bosilganda ochiladi / qayta bosilsa yopiladi) */}
            <div
              className={`yandex-cat-item ${selectedCategory === 'shahobcha' ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'shahobcha' ? null : 'shahobcha')}
              role="button"
              tabIndex={0}
              title="Shahobchalarni ko'rish / yopish"
            >
              <div className="yandex-cat-circle shahobcha-circle">
                <Fuel size={24} color="#ffffff" strokeWidth={2.3} />
              </div>
              <span className="yandex-cat-name">Shahobcha</span>
            </div>

            {/* Oshxona */}
            <div
              className={`yandex-cat-item ${selectedCategory === 'oshxona' ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'oshxona' ? null : 'oshxona')}
              role="button"
              tabIndex={0}
            >
              <div className="yandex-cat-circle food-circle">
                <Utensils size={22} color="#ffffff" />
              </div>
              <span className="yandex-cat-name">Oshxona</span>
            </div>

            {/* Kafelar */}
            <div
              className={`yandex-cat-item ${selectedCategory === 'kafe' ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'kafe' ? null : 'kafe')}
              role="button"
              tabIndex={0}
            >
              <div className="yandex-cat-circle cafe-circle">
                <Coffee size={22} color="#ffffff" />
              </div>
              <span className="yandex-cat-name">Kafelar</span>
            </div>

            {/* Do'konlar */}
            <div
              className={`yandex-cat-item ${selectedCategory === 'shop' ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'shop' ? null : 'shop')}
              role="button"
              tabIndex={0}
            >
              <div className="yandex-cat-circle shop-circle">
                <ShoppingBag size={22} color="#ffffff" />
              </div>
              <span className="yandex-cat-name">Do'konlar</span>
            </div>
          </div>
        </div>

        {/* 3. SHAHOBCHA BOSILGANDA TAGIDAN ANIMATSIYA BILAN CHIQADIGAN BO'LIM */}
        {selectedCategory === 'shahobcha' && (
          <div className="yandex-shahobcha-subpanel">
            {/* "Eng yaqin" va "Eng arzon" tanlov tugmalari */}
            <div className="yandex-action-btn-group desktop-only-actions">
              <button
                className={`yandex-action-card-btn nearest ${quickSortMode === 'nearest' ? 'active' : ''}`}
                onClick={handleSelectNearest}
                type="button"
              >
                <div className="yandex-action-icon-wrap">
                  <Navigation size={18} />
                </div>
                <div className="yandex-action-text-wrap">
                  <span className="yandex-action-title">Eng yaqin</span>
                  <span className="yandex-action-sub">Sizga yaqin joy</span>
                </div>
              </button>

              <button
                className={`yandex-action-card-btn cheapest ${quickSortMode === 'cheapest' ? 'active' : ''}`}
                onClick={handleSelectCheapest}
                type="button"
              >
                <div className="yandex-action-icon-wrap">
                  <Sparkles size={18} />
                </div>
                <div className="yandex-action-text-wrap">
                  <span className="yandex-action-title">Eng arzon</span>
                  <span className="yandex-action-sub">Hamyonbop narx</span>
                </div>
              </button>
            </div>

            {/* Yoqilg'i turlari filtr chiplari */}
            <div className="yandex-fuel-pills-row">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'metan', label: 'Metan' },
                { id: 'benzin', label: 'Benzin' },
                { id: 'propan', label: 'Propan' },
                { id: 'elektr', label: 'Elektr' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  className={`yandex-pill-chip ${selectedFuelType === pill.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFuelType(pill.id);
                    if (typeof onFuelFilterChange === 'function') {
                      onFuelFilterChange(pill.id);
                    }
                  }}
                  type="button"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Faol tanlangan shahobcha ko'rinishi (Highlight Banner) */}
            {highlightedStation && (
              <div className="yandex-highlight-card desktop-only-highlight">
                <div className="yandex-highlight-header">
                  <div className="yandex-highlight-header-left">
                    <span className={`yandex-highlight-badge badge-${highlightBadgeType || 'selected'}`}>
                      {highlightBadgeType === 'cheapest' ? (
                        <BadgePercent size={13} strokeWidth={2.4} />
                      ) : highlightBadgeType === 'nearest' ? (
                        <Navigation size={13} strokeWidth={2.4} />
                      ) : (
                        <Sparkles size={13} strokeWidth={2.4} />
                      )}
                      <span>{highlightBadgeText || "Tanlangan shahobcha"}</span>
                    </span>
                    <span className="yandex-highlight-dist">
                      <MapPin size={11} strokeWidth={2.2} />
                      <span>{formatDistance(highlightedStation.distanceKm)}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="yandex-highlight-close-btn"
                    onClick={() => setHighlightedStationId(null)}
                    title="Yopish"
                    aria-label="Yopish"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="yandex-highlight-body">
                  <h4 className="yandex-highlight-name">{highlightedStation.name}</h4>
                  <p className="yandex-highlight-address">
                    {highlightedStation.address || highlightedStation.city || "Manzil ko'rsatilmagan"}
                  </p>

                  <div className="yandex-highlight-footer">
                    <div className="yandex-highlight-tags">
                      <span className={`yandex-status-pill ${highlightedStation.isOpen !== false ? 'open' : 'closed'}`}>
                        <span className="yandex-status-dot"></span>
                        <span>{highlightedStation.isOpen !== false ? 'Ochiq' : 'Yopiq'}</span>
                      </span>

                      {highlightedStation.price && (
                        <span className="yandex-metric-pill price">
                          <span className="pill-val">{Number(highlightedStation.price).toLocaleString()} so'm</span>
                        </span>
                      )}

                      {highlightedStation.gasPressure && (
                        <span className="yandex-metric-pill pressure">
                          <Gauge size={12} strokeWidth={2.2} />
                          <span>{highlightedStation.gasPressure} atm</span>
                        </span>
                      )}
                    </div>

                    <div className="yandex-highlight-actions">
                      {typeof onNavigate === 'function' && (
                        <button
                          type="button"
                          className="yandex-highlight-btn-route"
                          onClick={() => onNavigate(highlightedStation)}
                          title="Marshrut tuzish"
                        >
                          <Navigation size={12} strokeWidth={2.4} />
                          <span>Borish</span>
                        </button>
                      )}
                      {typeof onSelectStation === 'function' && (
                        <button
                          type="button"
                          className="yandex-highlight-btn-detail"
                          onClick={() => onSelectStation(highlightedStation)}
                          title="Batafsil ma'lumot"
                        >
                          <span>Batafsil</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

                      </div>
        )}

        {/* 4. OSHXONA, KAFELAR YOKI BOSHQA JOYLAR BOSILGANDA: HALI MA'LUMOT YO'Q */}
        {selectedCategory && selectedCategory !== 'shahobcha' && (
          <div className="yandex-no-data-box">
            <div className="yandex-no-data-icon">
              <MapPin size={24} color="#64748b" />
            </div>
            <span className="yandex-no-data-title">Hali ma'lumot yo'q</span>
            <p className="yandex-no-data-desc">
              Ushbu bo'lim bo'yicha ma'lumotlar tez kunda qo'shiladi
            </p>
          </div>
        )}

        {/* 5. REKLAMA JOYLASHTIRISH UCHUN TO'RTBURCHAK BLOK (Eng tagida, rasmdagi joy) */}
        <div className="yandex-sidebar-ad-slot-wrapper hide-on-mobile">
          {mapSidebarAd ? (
            (() => {
              const mediaUrl = mapSidebarAd.video_url || mapSidebarAd.media_url || mapSidebarAd.image_url || '';
              const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.startsWith('data:video'));
              return (
                <div
                  className="yandex-sidebar-ad-card active-ad"
                  onClick={() => handleOpenAdLink(mapSidebarAd)}
                  role="button"
                  tabIndex={0}
                >
                  {mediaUrl && (
                    <div className="yandex-sidebar-ad-media-wrap">
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          className="yandex-sidebar-ad-media"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={mapSidebarAd.title || 'Reklama'}
                          className="yandex-sidebar-ad-media"
                        />
                      )}
                      <span className="yandex-sidebar-ad-badge">Reklama</span>
                    </div>
                  )}
                  <div className="yandex-sidebar-ad-info">
                    <h5 className="yandex-sidebar-ad-title">{mapSidebarAd.title || "Maxsus taklif"}</h5>
                    {mapSidebarAd.description && (
                      <p className="yandex-sidebar-ad-desc">{mapSidebarAd.description}</p>
                    )}
                    <div className="yandex-sidebar-ad-cta">
                      <span>Batafsil ko'rish</span>
                      <ExternalLink size={11} />
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div
              className="yandex-sidebar-ad-card placeholder-ad"
              onClick={() => (onOpenAdvertising ? onOpenAdvertising() : handleOpenAdLink())}
              role="button"
              tabIndex={0}
              title="Batafsil ma'lumot olish"
            >
              <div className="yandex-sidebar-ad-center">
                <div className="yandex-sidebar-ad-icon-ring">
                  <Megaphone size={20} color="#2563eb" />
                </div>
                <span className="yandex-sidebar-ad-cta-title">Reklama joylash</span>
                <span className="yandex-sidebar-ad-cta-sub">
                  Bu yerda sizning biznesingiz reklamasi bo'lishi mumkin
                </span>
              </div>
              <button
                type="button"
                className="yandex-sidebar-ad-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof onOpenAdvertising === 'function') {
                    onOpenAdvertising();
                  } else {
                    handleOpenAdLink();
                  }
                }}
              >
                <span>Batafsil</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Status banner */}
      {locating && (
        <div className="map-status-banner">
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Joylashuvingiz aniqlanmoqda...</span>
        </div>
      )}
      {errorMsg && !locating && (
        <div className="map-status-banner" style={{ background: 'rgba(239,68,68,0.9)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={14} /> {errorMsg}
          </span>
        </div>
      )}

      {/* Xarita konteyneri */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* 0. HARITA VA SHAHOBCHALAR TO'LIQ YETIB KELGUNCHA YARQIRAB TURUVCHI HOLOGRAFIK SKELETON */}
      {!isMapReady && (
        <div className={`map-shimmer-fullscreen-overlay ${isMapFadingOut ? 'map-shimmer-fade-out' : ''}`}>
          {/* Xarita to'r chiziqlari */}
          <div className="map-shimmer-grid-pattern" />

          {/* Diagional yarqiroq lazer nuri */}
          <div className="map-shimmer-laser-beam" />

          {/* Markaziy futuristik Radar */}
          <div className="map-shimmer-center-radar">
            <div className="map-shimmer-radar-circle">
              <div className="map-radar-pulse-ring ring-one" />
              <div className="map-radar-pulse-ring ring-two" />
              <div className="map-radar-pulse-ring ring-three" />
              <div className="map-radar-compass-center">
                <Navigation size={28} className="map-radar-compass-icon" />
              </div>
            </div>
            <h3 className="map-shimmer-main-title">Xarita va Shahobchalar yuklanmoqda...</h3>
            <p className="map-shimmer-sub-text">
              GPS koordinatalar va barcha shahobchalar xaritaga tushirilmoqda
            </p>
            <div className="map-shimmer-progress-track">
              <div className="map-shimmer-progress-fill" />
            </div>
          </div>

          {/* Xarita tepasidagi skelet qidiruv va filtrlar */}
          <div className="map-ghost-top-bar">
            <div className="map-ghost-search-box" />
            <div className="map-ghost-pills-row">
              <div className="map-ghost-pill pill-accent" />
              <div className="map-ghost-pill" />
              <div className="map-ghost-pill" />
              <div className="map-ghost-pill" />
              <div className="map-ghost-pill" />
            </div>
          </div>

          {/* Xarita ustida yarqirab miltillab turuvchi shahobcha pinlari */}
          <div className="map-ghost-station-marker ghost-pin-1">
            <div className="ghost-pin-dot" />
            <div className="ghost-pin-wave" />
          </div>
          <div className="map-ghost-station-marker ghost-pin-2">
            <div className="ghost-pin-dot" />
            <div className="ghost-pin-wave" />
          </div>
          <div className="map-ghost-station-marker ghost-pin-3">
            <div className="ghost-pin-dot" />
            <div className="ghost-pin-wave" />
          </div>
          <div className="map-ghost-station-marker ghost-pin-4">
            <div className="ghost-pin-dot" />
            <div className="ghost-pin-wave" />
          </div>

          {/* O'ng tarafdagi boshqaruv tugmalari skeleti */}
          <div className="map-ghost-right-controls">
            <div className="map-ghost-round-btn" />
            <div className="map-ghost-round-btn" />
            <div className="map-ghost-round-btn" />
          </div>
        </div>
      )}

      {/* Aniqlik ko'rsatkichi */}
      {accuracy && !locating && (
        <div className="map-accuracy-badge">
          <Radio size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
          ~{Math.round(accuracy)} m aniqlik
        </div>
      )}

      {/* 4. MOBIL BOTTOM SHEET (RASMDAGI KABI PASTKI KARTA VA SARALASH) */}
      {isMobile && filteredStationList.length > 0 && (
        <div
          ref={sheetRef}
          className={`mobile-map-bottom-sheet sheet-${sheetMode}`}
        >
          {/* Ushlagich va sarlavha zonasi - silliq surish va bosish uchun */}
          <div
            ref={grabAreaRef}
            className="mobile-sheet-grab-area"
            onClick={handleGrabClick}
          >
            {/* Tutqich (Drag handle) */}
            <div className="mobile-sheet-drag-handle" />

            {/* Sarlavha qatori: Yaqin atrofda (chapda) | [ ⌄ Xaritani ko'rish ] (o'ngda) */}
            <div className="mobile-sheet-header-row">
              <div className="mobile-sheet-title-group">
                <span className="mobile-sheet-title">Yaqin atrofda</span>
                <span className="mobile-sheet-count">{filteredStationList.length} ta natija</span>
              </div>

              {sheetMode !== 'peek' ? (
                <button
                  type="button"
                  className="mobile-sheet-collapse-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetMode('peek');
                  }}
                  title="Xaritani ko'rish"
                >
                  <ChevronDown size={15} strokeWidth={2.6} />
                  <span>Xaritani ko'rish</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="mobile-sheet-collapse-btn peek-mode"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetMode('mid');
                  }}
                  title="Ro'yxatni ochish"
                >
                  <ChevronUp size={15} strokeWidth={2.6} />
                  <span>Ro'yxat</span>
                </button>
              )}
            </div>
          </div>

          {/* Saralash tugmalari: [ Eng yaqin ] [ Eng sifatli ] [ Eng arzon ] */}
          <div className="mobile-sheet-sort-row">
            <button
              type="button"
              className={`mobile-sort-pill-btn ${mobileSortMode === 'nearest' ? 'active' : ''}`}
              onClick={() => {
                setMobileSortMode('nearest');
                setQuickSortMode('nearest');
                if (filteredStationList.length > 0) {
                  const sorted = [...filteredStationList].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
                  if (sorted[0]) {
                    setMobileActiveStationId(sorted[0].id);
                    mapRef.current?.flyTo({
                      center: [Number(sorted[0].lng), Number(sorted[0].lat)],
                      zoom: 15.2,
                      essential: true,
                    });
                  }
                }
              }}
            >
              Eng yaqin
            </button>

            <button
              type="button"
              className={`mobile-sort-pill-btn ${mobileSortMode === 'quality' ? 'active' : ''}`}
              onClick={() => {
                setMobileSortMode('quality');
                const sorted = [...filteredStationList].sort((a, b) => {
                  const qA = Number(a.gasPressure || a.pressure || 0) + Number(a.rating || 0) * 40;
                  const qB = Number(b.gasPressure || b.pressure || 0) + Number(b.rating || 0) * 40;
                  return qB - qA;
                });
                if (sorted[0]) {
                  setMobileActiveStationId(sorted[0].id);
                  mapRef.current?.flyTo({
                    center: [Number(sorted[0].lng), Number(sorted[0].lat)],
                    zoom: 15.2,
                    essential: true,
                  });
                }
              }}
            >
              Eng sifatli
            </button>

            <button
              type="button"
              className={`mobile-sort-pill-btn ${mobileSortMode === 'cheapest' ? 'active' : ''}`}
              onClick={() => {
                setMobileSortMode('cheapest');
                setQuickSortMode('cheapest');
                const sorted = [...filteredStationList].sort((a, b) => {
                  const pA = a.prices?.[selectedFuelType] || a.price || 999999;
                  const pB = b.prices?.[selectedFuelType] || b.price || 999999;
                  return Number(pA) - Number(pB);
                });
                if (sorted[0]) {
                  setMobileActiveStationId(sorted[0].id);
                  mapRef.current?.flyTo({
                    center: [Number(sorted[0].lng), Number(sorted[0].lat)],
                    zoom: 15.2,
                    essential: true,
                  });
                }
              }}
            >
              Eng arzon
            </button>
          </div>

          {/* Shahobchalar ro'yxati: pastga tushirganda qolgan yaqinroq manzillar chiqadi va xarita ustiga kengayadi */}
          <div
            ref={listRef}
            className="mobile-sheet-stations-list"
          >
            {filteredStationList.map((station, index) => {
              const boxes = getStationFuelBoxes(station);
              const duration = Math.max(1, Math.round(((station.distanceKm || 0.6) / 35) * 60));
              const isSelected = (activeMobileStation?.id === station.id) || (index === 0 && !mobileActiveStationId);
              const rankTag = index === 0
                ? (mobileSortMode === 'cheapest' ? 'ENG ARZON' : mobileSortMode === 'quality' ? 'ENG SIFATLI' : 'ENG YAQIN')
                : null;

              return (
                <div
                  key={station.id || index}
                  className={`mobile-sheet-station-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (didDragRef.current) return;
                    setMobileActiveStationId(station.id);
                    triggerStationHighlight(station, 'Tanlangan', 'selected');
                    mapRef.current?.flyTo({
                      center: [Number(station.lng), Number(station.lat)],
                      zoom: 15.2,
                      essential: true,
                    });
                  }}
                >
                  {/* 1-qator: Shahobcha nomi + [ Ochiq ] | [ ENG YAQIN ] 354 m */}
                  <div className="mobile-card-top-row">
                    <div className="mobile-card-name-group">
                      <h3 className="mobile-card-station-name">{station.name || 'Zapravka'}</h3>
                      <span className={`mobile-card-status-badge ${station.isOpen !== false ? 'open' : 'closed'}`}>
                        {station.isOpen !== false ? 'Ochiq' : 'Yopiq'}
                      </span>
                    </div>

                    <div className="mobile-card-meta-right">
                      {rankTag && <span className="mobile-card-rank-tag">{rankTag}</span>}
                      <span className="mobile-card-distance-val">
                        {formatCardDistance(station.distanceKm)}
                      </span>
                    </div>
                  </div>

                  {/* 2-qator: 2 ta yoqilg'i narxi qutisi (Propan 5 500 so'm/l | AI-92 10 500 so'm/l) */}
                  <div className="mobile-card-prices-grid">
                    {boxes.map((box, bIdx) => (
                      <div key={bIdx} className="mobile-card-price-box">
                        <div className="mobile-price-box-label">{box.label}</div>
                        <div className="mobile-price-box-value-row">
                          <span className="mobile-price-box-num">{box.price}</span>
                          <span className="mobile-price-box-unit">{box.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 3-qator: [ Batafsil ] va [ < Borish · X daq ] */}
                  <div className="mobile-card-actions-row">
                    <button
                      type="button"
                      className="mobile-card-btn-detail"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onSelectStation === 'function') {
                          onSelectStation(station);
                        }
                      }}
                    >
                      Batafsil
                    </button>

                    <button
                      type="button"
                      className="mobile-card-btn-route"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onNavigate === 'function') {
                          onNavigate(station);
                        }
                      }}
                    >
                      <Navigation size={16} strokeWidth={2.4} style={{ transform: 'rotate(-45deg)' }} />
                      <span>Borish · {duration} daq</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Joylashuvni aniqlash tugmasi */}
      <button
        className={`locate-me-btn sheet-${sheetMode}`}
        onClick={handleLocateMe}
        title="Mening joylashuvim"
      >
        <Navigation size={22} />
      </button>
    </div>
  );
}

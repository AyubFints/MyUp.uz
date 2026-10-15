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
  Fuel,
  Zap,
  Sparkles,
  MapPin,
  Utensils,
  Coffee,
  ShoppingBag,
  Route,
} from 'lucide-react';
import { calculateDistance, formatDistance } from '../utils/distance';

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

export function stationMatchesFuel(st, fuel) {
  if (!fuel || fuel === 'all') return true;
  const target = fuel.toLowerCase();

  if (Array.isArray(st.type) && st.type.some((t) => String(t).toLowerCase() === target)) return true;
  if (typeof st.type === 'string' && st.type.toLowerCase().includes(target)) return true;
  if (typeof st.fuelType === 'string' && st.fuelType.toLowerCase() === target) return true;
  if (Array.isArray(st.fuelTypes) && st.fuelTypes.some((t) => String(t).toLowerCase() === target)) return true;
  if (st.prices && typeof st.prices === 'object' && st.prices[target] > 0) return true;

  if (target === 'gaz') {
    return stationMatchesFuel(st, 'metan') || stationMatchesFuel(st, 'propan');
  }
  return false;
}

// Zaxira demo shahobchalar (agar ro'yxat bo'sh bo'lsa darhol ishlashi uchun)
const DEFAULT_DEMO_STATIONS = [
  {
    id: 'demo-1',
    name: 'Mustaqillik Metan Gaz',
    brand: 'UzMetan',
    type: ['metan'],
    lat: 41.3145,
    lng: 69.2485,
    address: 'Mustaqillik shoh koʻchasi, Toshkent',
    isOpen: true,
    price: 3750,
    prices: { metan: 3750 },
    gasPressure: 215,
    rating: 4.9,
  },
  {
    id: 'demo-2',
    name: 'UNG Petro Benzin AI-92',
    brand: 'UNG Petro',
    type: ['benzin'],
    lat: 41.3050,
    lng: 69.2320,
    address: 'Amir Temur shoh koʻchasi, Toshkent',
    isOpen: true,
    price: 9500,
    prices: { benzin: 9500 },
    rating: 4.8,
  },
  {
    id: 'demo-3',
    name: 'Carvon Gaz (Metan & Propan)',
    brand: 'Carvon',
    type: ['metan', 'propan'],
    lat: 41.3210,
    lng: 69.2550,
    address: 'Navoiy koʻchasi, Toshkent',
    isOpen: true,
    price: 3600,
    prices: { metan: 3600, propan: 5200 },
    gasPressure: 220,
    rating: 4.7,
  },
  {
    id: 'demo-4',
    name: 'EcoCharge 120kW EV Stansiya',
    brand: 'EcoCharge',
    type: ['elektr'],
    lat: 41.2980,
    lng: 69.2450,
    address: 'Shota Rustaveli koʻchasi, Toshkent',
    isOpen: true,
    price: 1950,
    prices: { elektr: 1950 },
    rating: 4.9,
  },
  {
    id: 'demo-5',
    name: 'Shoxona Metan Gaz',
    brand: 'Shoxona',
    type: ['metan'],
    lat: 41.3320,
    lng: 69.2390,
    address: 'Kichik halqa yoʻli, Toshkent',
    isOpen: true,
    price: 3700,
    prices: { metan: 3700 },
    gasPressure: 210,
    rating: 4.8,
  },
  {
    id: 'demo-6',
    name: 'Samarqand Markaziy Metan',
    brand: 'SamGaz',
    type: ['metan'],
    lat: 39.6580,
    lng: 66.9650,
    address: 'Registon koʻchasi, Samarqand',
    isOpen: true,
    price: 3700,
    prices: { metan: 3700 },
    gasPressure: 210,
    rating: 4.8,
  },
];

export default function MapView({
  stations = [],
  activeFuelFilter = 'all',
  onSelectStation,
  searchQuery = '',
  showSidebar = false, // Faqat xarita bo'limida (activeTab === 'map') ko'rsatiladi
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const hasAutoCentered = useRef(false);

  const [userPos, setUserPos] = useState(null); // [lat, lng]
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const watchRef = useRef(null);

  // Yandex uslubidagi chap panel holatlari
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quickSortMode, setQuickSortMode] = useState(null); // 'nearest' | 'cheapest' | null
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [highlightedStationId, setHighlightedStationId] = useState(null);
  const [highlightBadgeText, setHighlightBadgeText] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Masofalarni hisoblash
  const effectiveStations = useMemo(() => {
    const baseList = stations && stations.length > 0 ? stations : DEFAULT_DEMO_STATIONS;
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

    if (quickSortMode === 'nearest') {
      list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (quickSortMode === 'cheapest') {
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
    }

    return list;
  }, [effectiveStations, sidebarSearch, searchQuery, selectedFuelType, quickSortMode]);

  // Faol tanlangan shahobcha
  const highlightedStation = useMemo(() => {
    if (!highlightedStationId) return null;
    return effectiveStations.find((s) => s.id === highlightedStationId) || null;
  }, [effectiveStations, highlightedStationId]);

  // Protomaps sozlamalari
  const protomapsKey = import.meta.env.VITE_PROTOMAPS_KEY;

  // 1. Xaritani initsializatsiya qilish (MapLibre GL JS)
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        let mapStyle;

        if (protomapsKey) {
          try {
            const styleUrl = `https://api.protomaps.com/styles/v5/light/en.json?key=${protomapsKey}`;
            const res = await fetch(styleUrl);
            if (res.ok) {
              mapStyle = await res.json();
              if (mapStyle.layers && Array.isArray(mapStyle.layers)) {
                mapStyle.layers = mapStyle.layers.filter((l) => l['source-layer'] !== 'pois');
              }
            }
          } catch (e) {
            console.warn("Protomaps yuklanmadi, OSM ga o'tilmoqda:", e);
          }
        }

        if (!mapStyle) {
          mapStyle = {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              },
            },
            layers: [
              {
                id: 'osm-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          };
        }

        if (!isMounted) return;

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
    const shouldShow = currentZoom >= MIN_STATION_ZOOM;

    filteredStationList.forEach((station) => {
      if (!station.lat || !station.lng) return;

      const svgIcon = getStationSvgIcon(station);
      const isHighlighted = highlightedStationId === station.id;
      const isVisible = shouldShow || isHighlighted;

      const el = document.createElement('div');
      el.className = `yandex-station-marker ${isVisible ? '' : 'station-hidden'} ${isHighlighted ? 'station-highlight-pulse' : ''}`;

      el.innerHTML = `
        <div class="ym-icon-pin ${isHighlighted ? 'pin-pulse' : ''}">
          ${svgIcon}
        </div>
        <span class="ym-name-label ${isHighlighted ? 'label-pulse' : ''}">${station.name || 'Zapravka'}</span>
      `;

      // Popup kontenti
      const popupContent = document.createElement('div');
      popupContent.style.padding = '8px';
      popupContent.style.fontFamily = 'inherit';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; color: #ef4444; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ${svgIcon}
          <span>${station.name}</span>
        </div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">📍 ${station.address || 'Manzil koʻrsatilmagan'}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${station.isOpen ? '#dcfce7' : '#fee2e2'}; color: ${station.isOpen ? '#15803d' : '#b91c1c'}; font-weight: 600;">
            ${station.isOpen ? 'Ochiq' : 'Yopiq'}
          </span>
          ${station.price ? `<span style="font-size: 12px; font-weight: 700; color: #ef4444;">${station.price.toLocaleString()} so'm</span>` : ''}
        </div>
        <button id="btn-station-${station.id}" style="width: 100%; padding: 7px 10px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
          Batafsil ko'rish
        </button>
      `;

      const actionBtn = popupContent.querySelector(`#btn-station-${station.id}`);
      if (actionBtn && onSelectStation) {
        actionBtn.addEventListener('click', () => {
          onSelectStation(station);
        });
      }

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true }).setDOMContent(popupContent);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'top-left',
        offset: [-12, -12],
      })
        .setLngLat([Number(station.lng), Number(station.lat)])
        .setPopup(popup)
        .addTo(map);

      // Popap faqat marker bosilganda ochiladi

      markersRef.current.push(marker);
    });
  }, [filteredStationList, onSelectStation, mapInstance, highlightedStationId, highlightBadgeText]);

  // Shahobchani tanlash va unga sal yaqinlashtirib yonib-yonib ko'rsatish
  const triggerStationHighlight = (station, badgeText) => {
    setHighlightedStationId(station.id);
    setHighlightBadgeText(badgeText);

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
      triggerStationHighlight(best, '⚡ Eng yaqin shahobcha');
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
      triggerStationHighlight(best, '💰 Eng arzon shahobcha');
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
          .yandex-sidebar-toggle-btn {
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

        /* Highlight Card (Faol tanlangan zapravka) */
        .yandex-highlight-card {
          background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
          border: 1.5px solid #fca5a5;
          border-radius: 14px;
          padding: 12px;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.15);
        }

        .yandex-highlight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .yandex-highlight-badge {
          font-size: 0.78rem;
          font-weight: 800;
          color: #dc2626;
        }

        .yandex-highlight-dist {
          font-size: 0.76rem;
          font-weight: 700;
          color: #0f172a;
          background: rgba(255, 255, 255, 0.75);
          padding: 2px 6px;
          border-radius: 6px;
        }

        .yandex-highlight-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #991b1b;
          margin: 0 0 2px 0;
        }

        .yandex-highlight-address {
          font-size: 0.76rem;
          color: #64748b;
          margin: 0 0 8px 0;
        }

        .yandex-highlight-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          font-weight: 600;
        }

        .yandex-highlight-price {
          color: #dc2626;
          font-weight: 800;
        }

        .yandex-highlight-pressure {
          color: #0284c7;
          font-weight: 700;
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
      `}</style>

      {/* YANDEX USLUBIDAGI CHAP PANEL (Faqat xarita bo'limida) */}
      {showSidebar && (
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
                  onClick={() => setSelectedFuelType(pill.id)}
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
                  <span className="yandex-highlight-badge">
                    {highlightBadgeText || '⚡ Tanlangan shahobcha'}
                  </span>
                  <span className="yandex-highlight-dist">
                    📍 {formatDistance(highlightedStation.distanceKm)}
                  </span>
                </div>
                <div className="yandex-highlight-body">
                  <h4 className="yandex-highlight-name">{highlightedStation.name}</h4>
                  <p className="yandex-highlight-address">{highlightedStation.address}</p>
                  <div className="yandex-highlight-footer">
                    <span className="yandex-highlight-status">
                      {highlightedStation.isOpen ? '🟢 Ochiq' : '🔴 Yopiq'}
                    </span>
                    {highlightedStation.price && (
                      <span className="yandex-highlight-price">
                        {highlightedStation.price.toLocaleString()} so'm
                      </span>
                    )}
                    {highlightedStation.gasPressure && (
                      <span className="yandex-highlight-pressure">
                        ⚡ {highlightedStation.gasPressure} atm
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

                      </div>
        )}

        {/* 4. OSHXONA, KAFELAR YOKI BOSHQA JOYLAR BOSILGANDA: HALI MA'LUMOT YO'Q */}
        {selectedCategory && selectedCategory !== 'shahobcha' && (
          <div className="yandex-no-data-box">
            <div className="yandex-no-data-icon">📍</div>
            <span className="yandex-no-data-title">Hali ma'lumot yo'q</span>
            <p className="yandex-no-data-desc">
              Ushbu bo'lim bo'yicha ma'lumotlar tez kunda qo'shiladi
            </p>
          </div>
        )}
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
          <span>⚠️ {errorMsg}</span>
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

      {/* Aniqlik ko'rsatkichi */}
      {accuracy && !locating && <div className="map-accuracy-badge">📡 ~{Math.round(accuracy)} m aniqlik</div>}

      {/* Joylashuvni aniqlash tugmasi */}
      <button className="locate-me-btn" onClick={handleLocateMe} title="Mening joylashuvim">
        <Navigation size={22} />
      </button>
    </div>
  );
}

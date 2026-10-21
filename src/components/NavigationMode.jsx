import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  X, CheckCircle, 
  CornerUpRight, CornerUpLeft, ArrowUp, RotateCcw, Crosshair
} from 'lucide-react';
import { calculateDistance } from '../utils/distance';

// MapLibre Web Worker va PMTiles protokoli
maplibregl.setWorkerUrl(workerUrl);
try {
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
} catch (e) {}

// Ikki nuqta orasidagi harakat yo'nalishi (bearing / burchak)
function getBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Nuqtadan yo'l chizig'igacha bo'lgan eng qisqa masofani hisoblash (km)
function getMinDistanceToRoute(point, coordsList) {
  if (!coordsList || coordsList.length === 0) return 0;
  let minKm = Infinity;
  for (let i = 0; i < coordsList.length; i++) {
    const d = calculateDistance(point.lat, point.lng, coordsList[i][0], coordsList[i][1]);
    if (d < minKm) minKm = d;
  }
  return minKm;
}

// Burilish masofasini butun qilib formatlash (masalan: 1 km dan keyin burilish, 900 metrdan keyin burilish)
function getRoundedTurnInstruction(distKm, maneuver, streetName) {
  const modifier = maneuver?.modifier || '';
  const type = maneuver?.type || '';

  if (type === 'arrive') {
    return {
      header: "Manzilga yetib keldingiz",
      sub: streetName || "Siz tanlangan shahobcha oldidasiz",
    };
  }

  let turnDirection = "burilish";
  let turnAction = "buriling";
  if (modifier.includes('right')) {
    turnDirection = "o'ngga burilish";
    turnAction = "o'ngga buriling";
  } else if (modifier.includes('left')) {
    turnDirection = "chapga burilish";
    turnAction = "chapga buriling";
  } else if (modifier.includes('uturn')) {
    turnDirection = "orqaga qaytish";
    turnAction = "orqaga qayting";
  } else {
    turnDirection = "to'g'riga harakatlanish";
    turnAction = "to'g'riga harakatlaning";
  }

  const meters = (distKm || 0) * 1000;
  let distPhrase = "";

  if (meters >= 950) {
    const kmVal = Math.round(distKm * 10) / 10;
    if (kmVal <= 1.05) {
      distPhrase = "1 km dan keyin";
    } else {
      distPhrase = `${kmVal} km dan keyin`;
    }
  } else if (meters <= 35) {
    distPhrase = "Hozir";
  } else if (meters <= 75) {
    distPhrase = "50 metrdan keyin";
  } else {
    // 100, 200, 300, 400, 500, 600, 700, 800, 900 metrdan keyin
    const roundedHundred = Math.round(meters / 100) * 100;
    distPhrase = `${roundedHundred} metrdan keyin`;
  }

  const header = distPhrase === "Hozir" 
    ? `Hozir ${turnAction}` 
    : `${distPhrase} ${turnDirection}`;

  const sub = streetName 
    ? `${streetName} bo'yicha ${turnAction}` 
    : turnAction.charAt(0).toUpperCase() + turnAction.slice(1);

  return { header, sub };
}

export default function NavigationMode({ targetStation, userCoords, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const carIconRef = useRef(null);
  const destMarkerRef = useRef(null);

  const [currentPos, setCurrentPos] = useState(userCoords || { lat: 41.311081, lng: 69.240562 });
  const [routeCoords, setRouteCoords] = useState([]); // [[lat, lng], ...]
  const routeCoordsRef = useRef([]);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [distanceToTarget, setDistanceToTarget] = useState(0); // km
  const [speed, setSpeed] = useState(0); // km/h
  const [isArrived, setIsArrived] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [isReroutedNotice, setIsReroutedNotice] = useState(false);

  const prevPosRef = useRef(currentPos);
  const lastRerouteTimeRef = useRef(0);

  // 1. O'zimizning MapLibre GL vektor xaritasini initsializatsiya qilish
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let isMounted = true;

    async function initMap() {
      const protomapsKey = import.meta.env.VITE_PROTOMAPS_KEY || '9fc0781e9f3a803f';
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
              attribution: '&copy; OpenStreetMap',
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

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [currentPos.lng, currentPos.lat],
        zoom: 16.5,
        pitch: 45, // 3D ko'rinish
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

      map.on('load', () => {
        if (!isMounted) return;
        mapRef.current = map;

        // Foydalanuvchi mashina/navigator yo'nalish belgisi
        const carEl = document.createElement('div');
        carEl.className = 'nav-user-car-marker';
        carEl.innerHTML = `
          <div class="nav-car-pulse"></div>
          <div class="nav-car-icon" id="nav-car-rotate-target">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#38bdf8" stroke="#ffffff" stroke-width="2">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        `;
        carIconRef.current = carEl.querySelector('#nav-car-rotate-target');

        userMarkerRef.current = new maplibregl.Marker({ element: carEl })
          .setLngLat([currentPos.lng, currentPos.lat])
          .addTo(map);

        // Manzil bayroq belgisi
        if (targetStation && targetStation.lat && targetStation.lng) {
          const destEl = document.createElement('div');
          destEl.className = 'nav-dest-marker';
          destEl.innerHTML = `
            <div class="nav-dest-pin">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
            </div>
            <div class="nav-dest-label">${targetStation.name || 'Manzil'}</div>
          `;

          destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
            .setLngLat([targetStation.lng, targetStation.lat])
            .addTo(map);
        }

        // Marshrut chizig'ini yangilash
        if (routeCoordsRef.current && routeCoordsRef.current.length > 0) {
          drawRouteOnMap(map, routeCoordsRef.current);
        }
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Marshrut chizig'ini MapLibre GL ga chizish
  const drawRouteOnMap = (map, coordsList) => {
    if (!map || !map.isStyleLoaded() || !coordsList || coordsList.length === 0) return;

    // GeoJSON format: [[lng, lat], [lng, lat], ...]
    const geojsonCoords = coordsList.map(([lat, lng]) => [lng, lat]);

    const sourceData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: geojsonCoords,
      },
    };

    if (map.getSource('route-source')) {
      map.getSource('route-source').setData(sourceData);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: sourceData,
      });

      // Orqa qalin ko'k yo'l chizig'i
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0284c7',
          'line-width': 10,
          'line-opacity': 0.65,
        },
      });

      // Asosiy yorqin neon yo'l chizig'i
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 6,
          'line-opacity': 0.95,
        },
      });
    }

    // Butun marshrutni ekranga chiroyli sig'dirish
    const bounds = new maplibregl.LngLatBounds();
    geojsonCoords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, {
      padding: { top: 120, bottom: 140, left: 45, right: 45 },
      maxZoom: 17,
      duration: 1000,
    });
  };

  // 3. OSRM orqali marshrutni hisoblash (yo'nalish, yangi masofa va burilishlar)
  const fetchRoute = async (startPos) => {
    if (!targetStation || !targetStation.lat || !targetStation.lng) return;
    try {
      setIsRerouting(true);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startPos.lng},${startPos.lat};${targetStation.lng},${targetStation.lat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
        setRouteCoords(coords);
        routeCoordsRef.current = coords;

        if (route.legs && route.legs[0] && route.legs[0].steps) {
          setSteps(route.legs[0].steps);
          setCurrentStepIndex(0);
        }

        setDistanceToTarget(route.distance / 1000); // km

        if (mapRef.current) {
          drawRouteOnMap(mapRef.current, coords);
        }
      }
    } catch (err) {
      console.error('OSRM Xatosi:', err);
    } finally {
      setIsRerouting(false);
    }
  };

  useEffect(() => {
    if (targetStation && userCoords) {
      fetchRoute(userCoords);
    }
  }, [targetStation]);

  // 4. HAQIQIY HARAKAT (Real GPS Tracking + Avtomatik Rerouting)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!pos || !pos.coords) return;
        const { latitude, longitude, speed: geoSpeed, heading: geoHeading } = pos.coords;
        const nextPos = { lat: latitude, lng: longitude };

        // 1. Mashina qayoqqa qarab ketayotgan bo'lsa, o'sha tomonga burish (heading / bearing)
        let brng = null;
        if (geoHeading != null && !isNaN(geoHeading) && geoHeading >= 0) {
          brng = geoHeading;
        } else if (prevPosRef.current) {
          const moveDist = calculateDistance(
            prevPosRef.current.lat,
            prevPosRef.current.lng,
            nextPos.lat,
            nextPos.lng
          );
          if (moveDist > 0.002) { // kamida 2 metr harakatlanganda
            brng = getBearing(prevPosRef.current.lat, prevPosRef.current.lng, nextPos.lat, nextPos.lng);
          }
        }

        if (brng !== null && carIconRef.current) {
          carIconRef.current.style.transform = `rotate(${brng}deg)`;
        }

        setCurrentPos(nextPos);
        prevPosRef.current = nextPos;

        // 2. Xarita markeri va kamerani mashina orqasidan ergashish
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([nextPos.lng, nextPos.lat]);
        }

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [nextPos.lng, nextPos.lat],
            bearing: brng !== null ? brng : (mapRef.current.getBearing() || 0),
            pitch: 45,
            duration: 800,
          });
        }

        // 3. Tezlikni yangilash
        if (geoSpeed != null && geoSpeed >= 0) {
          setSpeed(Math.round(geoSpeed * 3.6)); // m/s -> km/h
        }

        // 4. TASDIQLANGAN YO'LDAN CHIQIB KETSA -> YO'L QAYTADAN TUZILDI (Avtomatik Rerouting)
        if (routeCoordsRef.current && routeCoordsRef.current.length > 0) {
          const offDist = getMinDistanceToRoute(nextPos, routeCoordsRef.current);
          const now = Date.now();
          // Agar 45 metrdan uzoqlashsa va so'nggi yangilanishdan 5 soniya o'tgan bo'lsa
          if (offDist > 0.045 && now - lastRerouteTimeRef.current > 5000) {
            lastRerouteTimeRef.current = now;
            setIsReroutedNotice(true);
            fetchRoute(nextPos);
            setTimeout(() => setIsReroutedNotice(false), 4000);
          }
        }
      },
      (err) => console.warn('Nav GPS xatosi:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 6000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 5. Yetib kelish va burilish qadamlarini tekshirish
  useEffect(() => {
    if (!steps || steps.length === 0 || !targetStation) return;

    const distToTarget = calculateDistance(
      currentPos.lat,
      currentPos.lng,
      targetStation.lat,
      targetStation.lng
    );
    setDistanceToTarget(distToTarget);

    if (distToTarget <= 0.02) { // 20 metr
      setIsArrived(true);
      setSpeed(0);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.maneuver && currentStep.maneuver.location) {
      const stepLoc = currentStep.maneuver.location; // [lng, lat]
      const distToStep = calculateDistance(currentPos.lat, currentPos.lng, stepLoc[1], stepLoc[0]);

      if (distToStep < 0.03 && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  }, [currentPos, steps, currentStepIndex, targetStation]);

  // Markazlashtirish (Foydalanuvchi joyiga qaytish)
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [currentPos.lng, currentPos.lat],
        zoom: 17,
        pitch: 45,
        duration: 800,
      });
    }
  };

  // 6. Burilish ko'rsatmalari (faqat butun-butun: masalan 1 km dan keyin burilish, 900 metrdan keyin burilish)
  const currentStep = steps[currentStepIndex];
  let distToManeuver = 0;
  if (currentStep && currentStep.maneuver && currentStep.maneuver.location) {
    distToManeuver = calculateDistance(
      currentPos.lat,
      currentPos.lng,
      currentStep.maneuver.location[1],
      currentStep.maneuver.location[0]
    );
  }

  const turnInfo = getRoundedTurnInstruction(
    distToManeuver,
    currentStep?.maneuver,
    currentStep?.name
  );

  let InstructionIcon = ArrowUp;
  const modifier = currentStep?.maneuver?.modifier || '';
  if (modifier.includes('right')) InstructionIcon = CornerUpRight;
  else if (modifier.includes('left')) InstructionIcon = CornerUpLeft;

  return (
    <div className="nav-mode-container">
      {/* 1. O'ZIMIZNING MAPLIBRE VEKTOR XARITAMIZ */}
      <div 
        ref={mapContainerRef} 
        className="nav-maplibregl-container" 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} 
      />

      {/* 2. TEPADAGI KO'RSATMALAR PANELI */}
      <div className="nav-top-bar v2-nav-bar">
        {isRerouting ? (
          <div className="nav-instruction rerouting">
            <RotateCcw className="spin-icon" size={28} />
            <div className="nav-inst-text">
              <h2>Yo'l qaytadan tuzilmoqda...</h2>
              <span>Yangi yo'nalish qidirilmoqda</span>
            </div>
          </div>
        ) : (
          <div className="nav-instruction">
            <div className="nav-turn-icon-box">
              <InstructionIcon size={32} color="#fff" />
            </div>
            <div className="nav-inst-text">
              <h2>{turnInfo.header}</h2>
              <span>{turnInfo.sub}</span>
            </div>
          </div>
        )}

        {/* Yo'ldan chiqqanda avtomatik qayta tuzilganlik bildirishnomasi */}
        {isReroutedNotice && !isRerouting && (
          <div className="nav-rerouted-badge">
            <RotateCcw size={16} />
            <span>Yo'l qaytadan tuzildi! Yangi yo'nalish bo'yicha harakatlaning</span>
          </div>
        )}
      </div>

      {/* 3. TEZLIK KORSATGICHI (Speedometer) */}
      <div className="nav-speedometer">
        <div className="speed-val">{speed}</div>
        <div className="speed-unit">km/s</div>
      </div>

      {/* 4. MARKAZLASHTIRISH TUGMASI */}
      <button 
        type="button" 
        className="nav-recenter-btn" 
        onClick={handleRecenter} 
        title="Mening joyimga qaytish"
      >
        <Crosshair size={22} />
      </button>

      {/* 5. PASTKI QULAY QISQICHA MA'LUMOT VA YAKUNLASH PANELI */}
      <div className="nav-bottom-panel">
        <div className="nav-trip-summary">
          <div className="nav-dest-title">{targetStation?.name || "Manzil"}</div>
          <div className="nav-trip-metrics">
            <span className="nav-trip-dist">
              {distanceToTarget < 1 
                ? `${Math.round(distanceToTarget * 1000)} m` 
                : `${distanceToTarget.toFixed(1)} km`}
            </span>
            <span className="nav-trip-dot">•</span>
            <span className="nav-trip-time">
              {Math.max(1, Math.round(distanceToTarget * 2.2))} daqiqa
            </span>
          </div>
        </div>

        <button type="button" className="nav-exit-btn" onClick={onClose} title="Navigatsiyani to'xtatish">
          <X size={18} />
          <span>Yakunlash</span>
        </button>
      </div>

      {/* 6. YETIB KELISH MODAL OYNASI */}
      {isArrived && (
        <div className="arrival-overlay">
          <div className="arrival-card">
            <div className="arrival-icon-wrapper">
              <CheckCircle size={60} className="arrival-icon" />
            </div>
            <h2>Siz yetib keldingiz!</h2>
            <p><strong>{targetStation?.name}</strong> manziliga muvaffaqiyatli yetib keldingiz.</p>
            <button className="arrival-btn" onClick={onClose}>
              Ajoyib!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

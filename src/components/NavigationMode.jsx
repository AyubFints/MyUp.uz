import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import './NavigationMode.css';
import { 
  X, Check,
  CornerUpRight, CornerUpLeft, ArrowUp, RotateCcw, Crosshair,
  Volume2, VolumeX, Fuel, Navigation
} from 'lucide-react';
import { calculateDistance } from '../utils/distance';
import { getAppMapStyle } from '../utils/mapStyle';

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

// Ovozli xabarni aytish ("Siz yetib keldingiz!") va audio signal
function playArrivalVoiceAndChime(stationName = '', isMuted = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) {}

  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = stationName 
        ? `Siz yetib keldingiz! ${stationName} yoqilg'i shahobchasi oldidasiz.`
        : "Siz yetib keldingiz!";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uz-UZ';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn("Nutq xatosi:", err);
  }
}

// Burilish ko'rsatmasini 2-rasm dizayniga mos ravishda ajratib formatlash
function getRoundedTurnInstruction(distKm, maneuver, streetName) {
  const modifier = maneuver?.modifier || '';
  const type = maneuver?.type || '';

  let turnAction = "To'g'riga harakatlaning";
  if (modifier.includes('right')) {
    turnAction = "O'ngga buriling";
  } else if (modifier.includes('left')) {
    turnAction = "Chapga buriling";
  } else if (modifier.includes('uturn')) {
    turnAction = "Orqaga qayting";
  }

  const meters = Math.round((distKm || 0) * 1000);
  let distNum = "400";
  let distUnit = "m";

  if (meters >= 950) {
    const kmVal = Math.round((distKm || 1) * 10) / 10;
    distNum = kmVal.toFixed(1).replace('.', ',');
    distUnit = "km";
  } else if (meters <= 35) {
    distNum = "Hozir";
    distUnit = "";
  } else {
    // 50m qadami bilan yaxlitlash (masalan 400 m, 350 m...)
    const rounded = Math.max(50, Math.round(meters / 50) * 50);
    distNum = String(rounded);
    distUnit = "m";
  }

  const street = streetName ? `${streetName} ko'chasiga` : "Xadra ko'chasiga";

  return { distNum, distUnit, turnAction, street, modifier, type };
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

  const [distanceToTarget, setDistanceToTarget] = useState(1.3); // km
  const [speed, setSpeed] = useState(0); // km/h
  const [isArrived, setIsArrived] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [isReroutedNotice, setIsReroutedNotice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const prevPosRef = useRef(currentPos);
  const lastRerouteTimeRef = useRef(0);

  // Yoqilg'i turlari va gaz bosimi hisobi
  const targetTypes = useMemo(() => {
    if (!targetStation) return [];
    return Array.isArray(targetStation.types) && targetStation.types.length > 0
      ? targetStation.types
      : (Array.isArray(targetStation.type) && targetStation.type.length > 0
        ? targetStation.type
        : Object.keys(targetStation.prices || {}));
  }, [targetStation]);

  const navHasMetan = targetTypes.includes('metan') || Number(targetStation?.prices?.metan) > 0;
  const navHasPropan = targetTypes.includes('propan') || Number(targetStation?.prices?.propan) > 0;
  const navHasBenzin = targetTypes.includes('benzin') || targetTypes.includes('ai92') || targetTypes.includes('ai95') || Number(targetStation?.prices?.benzin) > 0;
  const navHasElektr = targetTypes.includes('elektr') || Number(targetStation?.prices?.elektr) > 0;
  const navHasGas = navHasMetan || navHasPropan;

  const navFuelPills = useMemo(() => {
    const list = [];
    if (navHasBenzin) {
      list.push({ id: 'ai92', label: 'AI-92', active: true });
      list.push({ id: 'ai95', label: 'AI-95', active: true });
    }
    if (navHasMetan) list.push({ id: 'metan', label: 'Metan', active: true });
    if (navHasPropan) list.push({ id: 'propan', label: 'Propan', active: true });
    if (navHasElektr) list.push({ id: 'elektr', label: 'Elektr', active: true });
    return list.length > 0 ? list : [{ id: 'default', label: "Yoqilg'i mavjud", active: true }];
  }, [navHasBenzin, navHasMetan, navHasPropan, navHasElektr]);

  const navGasPressure = targetStation?.gasPressure || targetStation?.pressure || targetStation?.pressures?.metan || null;

  // 1. O'zimizning MapLibre GL vektor xaritasini initsializatsiya qilish
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let isMounted = true;

    function initMap() {
      try {
        const mapStyle = getAppMapStyle();

        if (!isMounted || !mapContainerRef.current) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: [currentPos.lng, currentPos.lat],
          zoom: 16.5,
          pitch: 45, // 3D ko'rinish
          attributionControl: false,
        });

      map.on('load', () => {
        if (!isMounted) return;
        mapRef.current = map;

        // Foydalanuvchi mashina/navigator yo'nalish belgisi (2-rasm stili)
        const carEl = document.createElement('div');
        carEl.className = 'nav-user-car-marker';
        carEl.innerHTML = `
          <div class="nav-car-pulse"></div>
          <div class="nav-car-icon" id="nav-car-rotate-target">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" stroke-width="2.5">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        `;
        carIconRef.current = carEl.querySelector('#nav-car-rotate-target');

        userMarkerRef.current = new maplibregl.Marker({ element: carEl })
          .setLngLat([currentPos.lng, currentPos.lat])
          .addTo(map);

        // Manzil nishoni (2-rasmdagi to'q ko'k va to'q sariq nuqtali pin va oq yozuvli yorliq)
        if (targetStation && targetStation.lat && targetStation.lng) {
          const destEl = document.createElement('div');
          destEl.className = 'nav-dest-marker';
          destEl.innerHTML = `
            <div class="nav-dest-pin-modern">
              <div class="nav-dest-pin-dot"></div>
            </div>
            <div class="nav-dest-label-modern">${targetStation.name || 'Shaffof'}</div>
          `;

          destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
            .setLngLat([Number(targetStation.lng), Number(targetStation.lat)])
            .addTo(map);
        }

        // Marshrut chizig'ini yangilash
        if (routeCoordsRef.current && routeCoordsRef.current.length > 0) {
          drawRouteOnMap(map, routeCoordsRef.current);
        }
      });
    } catch (err) {
      console.error('Navigatsiya xaritasini yuklashda xatolik:', err);
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

      // Orqa ko'k yo'l chegarasi (casing)
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
          'line-opacity': 0.7,
        },
      });

      // Asosiy toza ko'k navigatsiya chizig'i (2-rasmdagidek)
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 6,
          'line-opacity': 1.0,
        },
      });
    }

    // Butun marshrutni ekranga chiroyli sig'dirish
    const bounds = new maplibregl.LngLatBounds();
    geojsonCoords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, {
      padding: { top: 120, bottom: 220, left: 45, right: 45 },
      maxZoom: 17,
      duration: 1000,
    });
  };

  // 3. OSRM orqali marshrutni hisoblash
  const fetchRoute = async (startPos) => {
    if (!targetStation || !targetStation.lat || !targetStation.lng || !startPos || !startPos.lat || !startPos.lng) return;
    const sLat = Number(startPos.lat);
    const sLng = Number(startPos.lng);
    const tLat = Number(targetStation.lat);
    const tLng = Number(targetStation.lng);
    if (isNaN(sLat) || isNaN(sLng) || isNaN(tLat) || isNaN(tLng)) return;

    try {
      setIsRerouting(true);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true`
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

        if (mapRef.current) {
          drawRouteOnMap(mapRef.current, coords);
        }
      }
    } catch (e) {
      console.warn("Marshrut yuklashda xatolik:", e);
    } finally {
      setIsRerouting(false);
    }
  };

  useEffect(() => {
    if (currentPos && targetStation) {
      fetchRoute(currentPos);
    }
  }, []);

  // 4. GPS kuzatuvi
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const nextPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        if (pos.coords.speed !== null && !isNaN(pos.coords.speed) && pos.coords.speed >= 0) {
          setSpeed(Math.round(pos.coords.speed * 3.6));
        }

        const bearing = getBearing(
          prevPosRef.current.lat,
          prevPosRef.current.lng,
          nextPos.lat,
          nextPos.lng
        );
        prevPosRef.current = nextPos;
        setCurrentPos(nextPos);

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([nextPos.lng, nextPos.lat]);
        }
        if (carIconRef.current) {
          carIconRef.current.style.transform = `rotate(${bearing}deg)`;
        }

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [nextPos.lng, nextPos.lat],
            duration: 1000,
          });
        }

        if (routeCoordsRef.current && routeCoordsRef.current.length > 0) {
          const offDist = getMinDistanceToRoute(nextPos, routeCoordsRef.current);
          const now = Date.now();
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

    if (distToTarget <= 0.025 && !isArrived) { // 25 metr
      setIsArrived(true);
      setSpeed(0);

      playArrivalVoiceAndChime(targetStation.name, isMuted);

      try {
        localStorage.setItem(
          'myup_pending_review_station',
          JSON.stringify({
            id: targetStation.id,
            name: targetStation.name,
            address: targetStation.address || targetStation.city || '',
            arrivedAt: Date.now(),
          })
        );
      } catch (e) {}
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.maneuver && currentStep.maneuver.location) {
      const stepLoc = currentStep.maneuver.location;
      const distToStep = calculateDistance(currentPos.lat, currentPos.lng, stepLoc[1], stepLoc[0]);

      if (distToStep < 0.03 && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  }, [currentPos, steps, currentStepIndex, targetStation, isMuted]);

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

  // Navigatsiyani to'xtatish
  const handleExitNav = () => {
    if (targetStation && (isArrived || distanceToTarget <= 0.25)) {
      try {
        localStorage.setItem(
          'myup_pending_review_station',
          JSON.stringify({
            id: targetStation.id,
            name: targetStation.name,
            address: targetStation.address || targetStation.city || '',
            arrivedAt: Date.now(),
          })
        );
      } catch (e) {}
    }
    onClose();
  };

  // 6. Hisoblangan metrikalar va burilish ko'rsatmalari
  const currentStep = steps[currentStepIndex];
  let distToManeuver = 0.4; // boshlang'ich default 400m
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

  let InstructionIcon = CornerUpRight;
  const modifier = currentStep?.maneuver?.modifier || 'right';
  if (modifier.includes('left')) InstructionIcon = CornerUpLeft;
  else if (modifier.includes('uturn')) InstructionIcon = RotateCcw;
  else if (modifier.includes('straight')) InstructionIcon = ArrowUp;

  // Keyingi qadam (Subbar)
  const nextStep = steps[currentStepIndex + 1];
  const nextStepName = nextStep?.name ? nextStep.name : (targetStation?.name || "Shaffof");
  const nextStepDist = nextStep && nextStep.distance 
    ? (nextStep.distance < 1000 ? `${Math.round(nextStep.distance)} m` : `${(nextStep.distance / 1000).toFixed(1).replace('.', ',')} km`)
    : "900 m";

  // Qolgan vaqt va taxminiy yetib borish soati (ETA)
  const remainingMinutes = Math.max(1, Math.round(distanceToTarget * 2.2));
  const etaDate = new Date(Date.now() + remainingMinutes * 60000);
  const etaTimeString = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDist = distanceToTarget < 1 
    ? `${Math.round(distanceToTarget * 1000)} m` 
    : `${distanceToTarget.toFixed(1).replace('.', ',')} km`;

  return (
    <div className="nav-mode-container">
      {/* 1. XARITA */}
      <div 
        ref={mapContainerRef} 
        className="nav-maplibregl-container" 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} 
      />

      {/* 2. TEPADAGI BURILISH VA YO'NALISH KARTASI (2-rasm stili) */}
      {!isArrived ? (
        <div className="nav-modern-top-banner">
          <div className="nav-top-main">
            <div className="nav-turn-squircle">
              <InstructionIcon size={28} color="#0c2340" strokeWidth={2.8} />
            </div>
            <div className="nav-inst-details">
              <div className="nav-dist-row">
                <span className="nav-dist-val">{turnInfo.distNum}</span>
                {turnInfo.distUnit && <span className="nav-dist-unit">{turnInfo.distUnit}</span>}
              </div>
              <div className="nav-action-text">{turnInfo.turnAction}</div>
              <div className="nav-street-text">{turnInfo.street}</div>
            </div>
          </div>
          <div className="nav-top-subbar">
            <Navigation size={12} color="#93c5fd" />
            <span>Keyin: {nextStepName}, {nextStepDist}</span>
          </div>
        </div>
      ) : (
        /* YETIB KELGANDAGI TEPADAGI BANNER (2-rasm o'ng tarafi) */
        <div className="nav-modern-top-banner nav-arrived-banner">
          <div className="nav-top-main" style={{ padding: '16px 18px' }}>
            <div className="nav-check-squircle">
              <Check size={28} color="#16a34a" strokeWidth={3} />
            </div>
            <div className="nav-inst-details">
              <div className="nav-arrived-title">Yetib keldingiz</div>
              <div className="nav-arrived-sub">{targetStation?.name || 'Shaffof'} yoqilg'i shahobchasi o'ngda</div>
            </div>
          </div>
        </div>
      )}

      {/* Yo'ldan chiqqanda qayta tuzish ogohlantirishi */}
      {isReroutedNotice && !isRerouting && (
        <div className="nav-rerouted-floating-badge">
          <RotateCcw size={15} />
          <span>Yo'l qaytadan tuzildi!</span>
        </div>
      )}

      {/* 3. O'NG TOMONDAGI DUMALOQ BOSHQARUV TUGMALARI (Ovoz va Markazlashtirish) */}
      <div className="nav-floating-right-controls">
        <button 
          type="button" 
          className="nav-circle-action-btn"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
        >
          {isMuted ? <VolumeX size={20} color="#1e293b" /> : <Volume2 size={20} color="#1e293b" />}
        </button>
        <button 
          type="button" 
          className="nav-circle-action-btn"
          onClick={handleRecenter}
          title="Mening joyimga qaytish"
        >
          <Crosshair size={20} color="#1e293b" />
        </button>
      </div>

      {/* 4. PASTKI CHAP TOMON: SPEEDOMETER VA TEZLIK CHEKLOVI (60) */}
      <div className="nav-floating-speed-group">
        <div className="nav-speed-circle">
          <span className="nav-speed-num">{speed}</span>
          <span className="nav-speed-lbl">km/soat</span>
        </div>
        <div className="nav-speed-limit-badge" title="Maksimal ruxsat etilgan tezlik 60 km/soat">
          60
        </div>
      </div>

      {/* 5. PASTKI ASOSIY KARTA (2-rasmdagi OQ KARTA) */}
      {!isArrived ? (
        /* HARAKATLANAYOTGANDAGI KARTA (2-rasm chap tomoni) */
        <div className="nav-modern-bottom-card">
          <div className="nav-card-header">
            <div className="nav-station-icon-box">
              <Fuel size={20} color="#2563eb" strokeWidth={2.4} />
            </div>
            <div className="nav-station-header-info">
              <div className="nav-station-name">{targetStation?.name || "Shaffof"}</div>
              <div className="nav-station-status-line">
                <span className="nav-status-dot green"></span>
                <span className="nav-status-open">{targetStation?.isOpen !== false ? 'Ochiq' : 'Yopiq'}</span>
                {navHasGas && navGasPressure && (
                  <>
                    <span className="nav-status-sep">·</span>
                    <span className="nav-status-pressure">Gaz bosimi: {navGasPressure} atm</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="nav-metrics-grid">
            <div className="nav-metric-col">
              <div className="nav-metric-val">{remainingMinutes} daq</div>
              <div className="nav-metric-lbl">Qolgan vaqt</div>
            </div>
            <div className="nav-metric-col">
              <div className="nav-metric-val">{formattedDist}</div>
              <div className="nav-metric-lbl">Masofa</div>
            </div>
            <div className="nav-metric-col">
              <div className="nav-metric-val">{etaTimeString}</div>
              <div className="nav-metric-lbl">Yetib borish</div>
            </div>
          </div>

          <button 
            type="button" 
            className="nav-btn-end-route" 
            onClick={handleExitNav}
          >
            <X size={18} strokeWidth={2.5} />
            <span>Yakunlash</span>
          </button>
        </div>
      ) : (
        /* YETIB KELGANDAGI MA'LUMOT KARTASI (2-rasm o'ng tomoni) */
        <div className="nav-modern-bottom-card nav-card-arrived">
          <div className="nav-card-header" style={{ alignItems: 'flex-start' }}>
            <div className="nav-station-icon-box">
              <Fuel size={20} color="#2563eb" strokeWidth={2.4} />
            </div>
            <div className="nav-station-header-info" style={{ flex: 1 }}>
              <div className="nav-station-name">{targetStation?.name || "Shaffof"}</div>
              <div className="nav-station-address">
                {targetStation?.address || targetStation?.city || "104, Qoratosh ko'chasi, Shayxontohur tumani"}
              </div>
            </div>
            <div className="nav-badge-pill-open">
              <span className="nav-status-dot green"></span>
              <span>Ochiq</span>
            </div>
          </div>

          {/* Gaz bosimi (Faqat metan yoki propan sotilsa va bosim mavjud bo'lsa) */}
          {navHasGas && navGasPressure && (
            <div className="nav-pressure-box">
              <div className="nav-pressure-header">
                <span className="nav-pressure-title">Gaz bosimi</span>
                <span className="nav-pressure-status">
                  {Number(navGasPressure) >= 180 ? 'Yaxshi' : Number(navGasPressure) >= 140 ? "O'rtacha" : 'Past'} ({navGasPressure} atm)
                </span>
              </div>
              <div className="nav-pressure-segments">
                <div className={`nav-seg ${Number(navGasPressure) >= 100 ? 'active' : 'inactive'}`}></div>
                <div className={`nav-seg ${Number(navGasPressure) >= 140 ? 'active' : 'inactive'}`}></div>
                <div className={`nav-seg ${Number(navGasPressure) >= 180 ? 'active' : 'inactive'}`}></div>
                <div className={`nav-seg ${Number(navGasPressure) >= 200 ? 'active' : 'inactive'}`}></div>
              </div>
              <div className="nav-pressure-time">
                {targetStation?.updatedAgo || "5 daqiqa oldin yangilangan"} · {targetStation?.isOpen !== false ? "23:00 gacha ochiq" : "Hozir yopiq"}
              </div>
            </div>
          )}

          {/* Sotiladigan yoqilg'ilar (dinamik) */}
          <div className="nav-fuels-row">
            {navFuelPills.map((pill) => (
              <span key={pill.id} className="nav-fuel-pill">
                <span className={`nav-dot ${pill.active ? 'green' : 'gray'}`}></span> {pill.label}
              </span>
            ))}
          </div>

          <button 
            type="button" 
            className="nav-btn-finish"
            onClick={handleExitNav}
          >
            Tugatish
          </button>

          <div className="nav-report-footer">
            Ma'lumot noto'g'rimi? <span className="nav-report-link" onClick={handleExitNav}>Xabar bering</span>
          </div>
        </div>
      )}
    </div>
  );
}

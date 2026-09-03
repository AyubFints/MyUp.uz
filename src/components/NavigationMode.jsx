import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, X, PlayCircle, CheckCircle, 
  CornerUpRight, CornerUpLeft, ArrowUp, Zap, RotateCcw
} from 'lucide-react';
import { calculateDistance } from '../utils/distance';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Car Icon for user
const carIcon = L.divIcon({
  html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(59,130,246,0.6); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: #fff; border-radius: 50%;"></div></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  html: `<div style="background: #10b981; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; border: 3px solid #fff; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><div style="width: 10px; height: 10px; background: #fff; border-radius: 50%;"></div></div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Map Updater Component
function MapUpdater({ currentPos, routeCoords }) {
  const map = useMap();
  
  useEffect(() => {
    if (currentPos) {
      map.setView([currentPos.lat, currentPos.lng], map.getZoom() || 17, { animate: true });
    }
  }, [currentPos, map]);

  useEffect(() => {
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoords, map]);

  return null;
}

export default function NavigationMode({ targetStation, userCoords, onClose }) {
  const [currentPos, setCurrentPos] = useState(userCoords);
  const [routeCoords, setRouteCoords] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const [distanceToTarget, setDistanceToTarget] = useState(0); // km
  const [speed, setSpeed] = useState(0); // km/h
  const [isArrived, setIsArrived] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  
  const simulationRef = useRef(null);
  const routeIndexRef = useRef(0);

  // OSRM orqali yo'nalish va burilishlarni (steps) olish
  const fetchRoute = async (startPos) => {
    try {
      setIsRerouting(true);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startPos.lng},${startPos.lat};${targetStation.lng},${targetStation.lat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Yo'nalish chizig'i
        const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
        setRouteCoords(coords);
        
        // Burilish ko'rsatmalari (Steps)
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          setSteps(route.legs[0].steps);
          setCurrentStepIndex(0);
        }
        
        setDistanceToTarget(route.distance / 1000); // km
        routeIndexRef.current = 0; // marshrut boshidan
      }
    } catch (err) {
      console.error('OSRM Xatosi:', err);
    } finally {
      setIsRerouting(false);
    }
  };

  useEffect(() => {
    if (targetStation) {
      fetchRoute(userCoords);
    }
  }, [targetStation]);

  // Joriy qadamni va masofani tekshirish
  useEffect(() => {
    if (!steps || steps.length === 0) return;

    // Asosiy manzilga yetib kelishni tekshirish
    const distToTarget = calculateDistance(currentPos.lat, currentPos.lng, targetStation.lat, targetStation.lng);
    setDistanceToTarget(distToTarget);
    
    if (distToTarget <= 0.015) { // 15 metr
      setIsArrived(true);
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        setIsSimulating(false);
      }
      setSpeed(0);
      return;
    }

    // Navbatdagi qadamga (burilishga) yetib kelishni tekshirish
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.maneuver && currentStep.maneuver.location) {
      const stepLoc = currentStep.maneuver.location; // [lng, lat]
      const distToStep = calculateDistance(currentPos.lat, currentPos.lng, stepLoc[1], stepLoc[0]); // km
      
      // Agar navbatdagi burilishga 20 metrdan yaqin kelsak, keyingi ko'rsatmaga o'tamiz
      if (distToStep < 0.02 && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }

  }, [currentPos, steps, currentStepIndex, targetStation]);

  // Simulyator
  const toggleSimulator = () => {
    if (isSimulating) {
      clearInterval(simulationRef.current);
      setIsSimulating(false);
      setSpeed(0);
    } else {
      if (routeCoords.length === 0) return;
      setIsSimulating(true);
      
      let lastTime = Date.now();
      let lastPos = currentPos;

      simulationRef.current = setInterval(() => {
        routeIndexRef.current += 3; // Harakat tezligi (qadam kattaligi)
        if (routeIndexRef.current >= routeCoords.length) {
          routeIndexRef.current = routeCoords.length - 1;
        }
        
        const nextCoord = routeCoords[routeIndexRef.current];
        const nextPos = { lat: nextCoord[0], lng: nextCoord[1] };
        
        // Tezlikni hisoblash (km/soat)
        const currentTime = Date.now();
        const timeDiffHrs = (currentTime - lastTime) / 3600000; // soat
        if (timeDiffHrs > 0) {
          const distDiffKm = calculateDistance(lastPos.lat, lastPos.lng, nextPos.lat, nextPos.lng);
          let calcSpeed = Math.round(distDiffKm / timeDiffHrs);
          // Sun'iy ravishda tezlikni realroq qilib ko'rsatish
          calcSpeed = calcSpeed > 0 ? calcSpeed + Math.floor(Math.random() * 5) : 0; 
          setSpeed(calcSpeed);
        }

        setCurrentPos(nextPos);
        lastPos = nextPos;
        lastTime = currentTime;
        
      }, 1000);
    }
  };

  // Sun'iy "Yo'ldan adashish" tugmasi (Rerouting test uchun)
  const simulateWrongTurn = () => {
    if (isSimulating) {
      clearInterval(simulationRef.current);
      setIsSimulating(false);
      setSpeed(0);
    }
    // Hozirgi joydan biroz uzoqqa sakraymiz (boshqa ko'chaga tushgandek)
    const wrongPos = {
      lat: currentPos.lat + 0.005,
      lng: currentPos.lng + 0.005
    };
    setCurrentPos(wrongPos);
    // Yangi joydan marshrutni qayta hisoblaymiz
    fetchRoute(wrongPos);
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  // Joriy burilish ma'lumotlari
  const currentStep = steps[currentStepIndex];
  let instructionText = "To'g'riga harakatlaning";
  let InstructionIcon = ArrowUp;
  let distToManeuver = 0;

  if (currentStep) {
    // Modifier: 'left', 'right', 'straight', 'uturn', vb.
    const modifier = currentStep.maneuver.modifier || '';
    if (modifier.includes('right')) InstructionIcon = CornerUpRight;
    else if (modifier.includes('left')) InstructionIcon = CornerUpLeft;
    
    // OSRM name or type
    const streetName = currentStep.name ? `${currentStep.name} ko'chasi` : '';
    const maneuverType = currentStep.maneuver.type;
    
    if (modifier.includes('right')) instructionText = streetName ? `O'ngga: ${streetName}` : "O'ngga buriling";
    else if (modifier.includes('left')) instructionText = streetName ? `Chapga: ${streetName}` : "Chapga buriling";
    else if (maneuverType === 'arrive') instructionText = "Manzilga yetib keldingiz";
    else instructionText = streetName ? `To'g'riga: ${streetName}` : "To'g'riga harakatlaning";

    // Qancha masofa qoldi shu burilishgacha?
    if (currentStep.maneuver.location) {
      distToManeuver = calculateDistance(currentPos.lat, currentPos.lng, currentStep.maneuver.location[1], currentStep.maneuver.location[0]);
    }
  }

  return (
    <div className="nav-mode-container">
      {/* MAP */}
      <MapContainer 
        center={[currentPos.lat, currentPos.lng]} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            color="#3b82f6" 
            weight={7} 
            opacity={0.9} 
            lineCap="round" 
            lineJoin="round" 
          />
        )}

        <Marker position={[currentPos.lat, currentPos.lng]} icon={carIcon} />
        <Marker position={[targetStation.lat, targetStation.lng]} icon={destIcon} />

        <MapUpdater currentPos={currentPos} routeCoords={routeCoords} />
      </MapContainer>

      {/* TOP INSTRUCTION BAR (Yandex/Telegram style) */}
      <div className="nav-top-bar v2-nav-bar">
        {isRerouting ? (
          <div className="nav-instruction rerouting">
            <RotateCcw className="spin-icon" size={28} />
            <div className="nav-inst-text">
              <h2>Marshrut yangilanmoqda...</h2>
              <span>Yangi yo'l qidirilmoqda</span>
            </div>
          </div>
        ) : (
          <div className="nav-instruction">
            <div className="nav-turn-icon-box">
              <InstructionIcon size={32} color="#fff" />
            </div>
            <div className="nav-inst-text">
              <h2>{distToManeuver < 1 ? `${Math.round(distToManeuver * 1000)} m` : `${distToManeuver.toFixed(1)} km`}</h2>
              <span>{instructionText}</span>
            </div>
          </div>
        )}
      </div>

      {/* SPEEDOMETER WIDGET */}
      <div className="nav-speedometer">
        <div className="speed-val">{speed}</div>
        <div className="speed-unit">km/s</div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="nav-bottom-actions">
        <button className="nav-wrong-turn-btn" onClick={simulateWrongTurn} title="Boshqa ko'chaga burilib ketishni test qilish">
          <RotateCcw size={20} />
        </button>
        <button className={`nav-sim-btn ${isSimulating ? 'active' : ''}`} onClick={toggleSimulator}>
          <PlayCircle size={20} />
          {isSimulating ? "To'xtatish" : 'Harakatlanish'}
        </button>
        <button className="nav-exit-btn" onClick={onClose}>
          <X size={20} />
          Chiqish
        </button>
      </div>

      {/* ARRIVAL MODAL */}
      {isArrived && (
        <div className="arrival-overlay">
          <div className="arrival-card">
            <div className="arrival-icon-wrapper">
              <CheckCircle size={60} className="arrival-icon" />
            </div>
            <h2>Siz yetib keldingiz!</h2>
            <p><strong>{targetStation.name}</strong> manziliga muvaffaqiyatli yetib keldingiz.</p>
            <button className="arrival-btn" onClick={onClose}>
              Ajoyib!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

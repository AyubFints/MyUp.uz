import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Loader } from 'lucide-react';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Ko'k pulsatsiya — foydalanuvchi joylashuvi
const userIcon = L.divIcon({
  className: 'leaflet-user-loc',
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(56,189,248,0.18);animation:uPulse 2s ease-out infinite;"></div>
      <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(56,189,248,0.3);animation:uPulse 2s ease-out infinite 0.4s;"></div>
      <div style="width:16px;height:16px;border-radius:50%;background:#38bdf8;border:3px solid #fff;box-shadow:0 0 10px rgba(56,189,248,0.9);z-index:10;"></div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Xaritani foydalanuvchi joylashuviga olib borish (real-time)
function LiveTracker({ position, accuracy, shouldFly }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (position && shouldFly && !hasFlown.current) {
      // Birinchi marta uchib borish
      map.flyTo(position, 17, { duration: 1.5 });
      hasFlown.current = true;
    } else if (position && shouldFly) {
      // Keyingi yangilanishlarda smooth pan
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, shouldFly, map]);

  return null;
}

export default function MapView() {
  const [userPos, setUserPos] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(true);
  const [shouldFly, setShouldFly] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const watchRef = useRef(null);
  const defaultCenter = [41.311081, 69.240562];

  // watchPosition — Telegramdek real-time kuzatish
  const startTracking = () => {
    setLocating(true);
    setErrorMsg('');
    setShouldFly(true);

    if (!navigator.geolocation) {
      setErrorMsg("Geolokatsiya qo'llab-quvvatlanmaydi");
      setUserPos(defaultCenter);
      setLocating(false);
      return;
    }

    // Avvalgi watchni tozalash
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(newPos);
        setAccuracy(pos.coords.accuracy); // metrda
        setLocating(false);
        setErrorMsg('');
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocating(false);
        if (err.code === 1) {
          setErrorMsg("Joylashuvga ruxsat bering (brauzer sozlamalarida)");
        } else if (err.code === 2) {
          setErrorMsg("Joylashuv aniqlanmadi. GPS ni yoqing.");
        } else {
          setErrorMsg("Joylashuvni aniqlash vaqti tugadi.");
        }
        if (!userPos) {
          setUserPos(defaultCenter);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Har doim yangi ma'lumot
      }
    );
  };

  useEffect(() => {
    startTracking();
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  // Locate me tugmasi bosilganda
  const handleLocateMe = () => {
    setShouldFly(true);
    startTracking();
  };

  return (
    <div className="real-map-wrapper">
      <style>{`
        @keyframes uPulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .leaflet-user-loc {
          background: none !important;
          border: none !important;
        }
        .real-map-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .real-map-wrapper .leaflet-container {
          width: 100%;
          height: 100%;
          background: #e8e0d8;
          font-family: inherit;
        }
        .locate-me-btn {
          position: absolute;
          bottom: 24px;
          right: 16px;
          z-index: 1000;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #fff;
          border: none;
          color: #0ea5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: all 0.2s;
        }
        .locate-me-btn:hover {
          background: #0ea5e9;
          color: #fff;
          transform: scale(1.05);
        }
        .locate-me-btn.spin svg {
          animation: spinIcon 1s linear infinite;
        }
        @keyframes spinIcon {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .map-status-banner {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
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
          z-index: 1000;
          background: rgba(15, 23, 42, 0.8);
          color: #94a3b8;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
        }
      `}</style>

      {/* Status banner (loading / error) */}
      {locating && (
        <div className="map-status-banner">
          <Loader size={14} style={{animation: 'spinIcon 1s linear infinite'}} />
          <span>Joylashuvingiz aniqlanmoqda...</span>
        </div>
      )}
      {errorMsg && !locating && (
        <div className="map-status-banner" style={{background: 'rgba(239,68,68,0.9)'}}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      <MapContainer
        center={userPos || defaultCenter}
        zoom={15}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Telegram uslubidagi toza, zamonaviy xarita */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>'
          maxZoom={19}
        />

        {/* Foydalanuvchi joylashuvi — ko'k nuqta */}
        {userPos && (
          <>
            {/* Aniqlik doirasi (accuracy radius) */}
            {accuracy && accuracy < 500 && (
              <Circle
                center={userPos}
                radius={accuracy}
                pathOptions={{
                  color: '#38bdf8',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.08,
                  weight: 1,
                  opacity: 0.3,
                }}
              />
            )}

            <Marker position={userPos} icon={userIcon}>
              <Popup>
                <div style={{fontWeight:700, fontSize:'0.9rem', textAlign:'center'}}>
                  📍 Siz shu yerdasiz
                  {accuracy && <div style={{fontSize:'0.75rem', color:'#64748b', marginTop:4}}>Aniqlik: ~{Math.round(accuracy)} m</div>}
                </div>
              </Popup>
            </Marker>

            <LiveTracker position={userPos} accuracy={accuracy} shouldFly={shouldFly} />
          </>
        )}
      </MapContainer>

      {/* Aniqlik ko'rsatgichi */}
      {accuracy && !locating && (
        <div className="map-accuracy-badge">
          📡 ~{Math.round(accuracy)} m aniqlik
        </div>
      )}

      {/* Joylashuvni aniqlash tugmasi */}
      <button
        className={`locate-me-btn ${locating ? 'spin' : ''}`}
        onClick={handleLocateMe}
        title="Mening joylashuvim"
      >
        <Navigation size={22} />
      </button>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapPin, Check, Plus, Trash2, Camera, Phone, User, Droplets, Zap, Flame, 
  Fuel, ChevronRight, ChevronLeft, Type, X, Sparkles, CheckCircle2, Clock, Crosshair
} from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

// MapLibre Web Worker va PMTiles protokoli
maplibregl.setWorkerUrl(workerUrl);
try {
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
} catch (e) {
  // Protocol allaqachon mavjud bo'lsa xatolik bermaydi
}

function AddStationMapPicker({ position, onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
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

      if (!isMounted || !mapContainerRef.current) return;

      const initialLngLat = [position[1], position[0]];

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: initialLngLat,
        zoom: 14.5,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

      // Zamonaviy A-Maps pin belgisi (draggable)
      const markerEl = document.createElement('div');
      markerEl.className = 'add-station-maplibre-pin';
      markerEl.style.cursor = 'grab';
      markerEl.innerHTML = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translateY(-8px);">
          <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg, #0284c7, #38bdf8);border:3px solid #ffffff;box-shadow:0 4px 16px rgba(2,132,199,0.7);display:flex;align-items:center;justify-content:center;color:#ffffff;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div style="width:4px;height:8px;background:#0284c7;border-radius:2px;"></div>
          <div style="width:14px;height:4px;background:rgba(0,0,0,0.35);border-radius:50%;filter:blur(1px);"></div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: markerEl, draggable: true })
        .setLngLat(initialLngLat)
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onLocationSelect([lngLat.lat, lngLat.lng]);
      });

      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        map.flyTo({ center: [lng, lat], duration: 400 });
        onLocationSelect([lat, lng]);
      });

      map.on('load', () => {
        if (!isMounted) return;
        map.resize();
        setTimeout(() => { if (isMounted && mapRef.current) mapRef.current.resize(); }, 150);
        setTimeout(() => { if (isMounted && mapRef.current) mapRef.current.resize(); }, 400);
      });

      mapRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    // Modal o'lchami o'zgarganda xaritani avtomatik moslashtirish
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    if (mapContainerRef.current) ro.observe(mapContainerRef.current);

    return () => {
      isMounted = false;
      ro.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Koordinata tashqi tomondan o'zgarganda harakatlanish
  useEffect(() => {
    if (!position || !mapRef.current || !markerRef.current) return;
    const targetLngLat = [position[1], position[0]];
    const currentLngLat = markerRef.current.getLngLat();
    const diff = Math.abs(currentLngLat.lat - position[0]) + Math.abs(currentLngLat.lng - position[1]);
    if (diff > 0.0001) {
      markerRef.current.setLngLat(targetLngLat);
      mapRef.current.flyTo({ center: targetLngLat, zoom: 14.5, duration: 600 });
    }
  }, [position]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height: '100%', position: 'relative' }} 
      className="add-station-maplibre-container"
    />
  );
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`);
    const data = await res.json();
    if (data?.display_name) {
      const parts = data.display_name.split(',').slice(0, 4).map(s => s.trim());
      return {
        full: parts.join(', '),
        city: data.address?.city || data.address?.town || data.address?.state || '',
        road: data.address?.road || data.address?.neighbourhood || '',
      };
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return { full: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '', road: '' };
}

const RestroomIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <circle cx="8" cy="4.5" r="2.2" fill="#0891b2" />
    <path d="M5.5 8.5C5.5 7.95 5.95 7.5 6.5 7.5H9.5C10.05 7.5 10.5 7.95 10.5 8.5V14.5H9V20H7V14.5H5.5V8.5Z" fill="#0891b2" />
    <circle cx="16" cy="4.5" r="2.2" fill="#06b6d4" />
    <path d="M14 7.5C13.45 7.5 13 7.95 13 8.5L14 14.5H15V20H17V14.5H18L19 8.5C19 7.95 18.55 7.5 18 7.5H14Z" fill="#06b6d4" />
  </svg>
);

const CoffeeSteamIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

const ShopBagColorIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CashBanknoteIcon = () => (
  <svg width="28" height="18" viewBox="0 0 34 22" fill="none">
    <rect x="1" y="1" width="32" height="20" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
    <circle cx="17" cy="11" r="4.5" fill="#10b981" />
    <circle cx="6" cy="6" r="1.5" fill="#10b981" />
    <circle cx="28" cy="6" r="1.5" fill="#10b981" />
    <circle cx="6" cy="16" r="1.5" fill="#10b981" />
    <circle cx="28" cy="16" r="1.5" fill="#10b981" />
  </svg>
);

const UzcardBadge = () => (
  <div style={{ background: '#0f4c81', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.02em' }}>Uzcard</span>
  </div>
);

const HumoBadge = () => (
  <div style={{ background: '#1e2d40', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#f59e0b', fontSize: '0.70rem', fontWeight: 900, letterSpacing: '0.06em' }}>HUMO</span>
  </div>
);

const VisaBadge = () => (
  <div style={{ background: '#1a1f71', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#ffffff', fontSize: '0.70rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '0.04em' }}>VISA</span>
  </div>
);

const AMENITIES_DATA = [
  { id: 'coffee', label: 'Qahva', icon: CoffeeSteamIcon },
  { id: 'toilet', label: 'Hojatxona', icon: RestroomIcon },
  { id: 'shop', label: "Do'kon", icon: ShopBagColorIcon },
];

const PAYMENTS_DATA = [
  { id: 'cash', label: 'cash', subLabel: "Naqd to'lov", icon: CashBanknoteIcon },
  { id: 'uzcard', label: 'Uzcard', subLabel: 'Uzcard plastik kartasi', badge: UzcardBadge },
  { id: 'humo', label: 'HUMO', subLabel: 'HUMO plastik kartasi', badge: HumoBadge },
  { id: 'visa', label: 'VISA', subLabel: 'Visa / bank kartasi', badge: VisaBadge },
];

const FUEL_TYPES = [
  { id: 'metan', label: 'Gaz (Metan)', icon: Flame, color: '#38bdf8' },
  { id: 'propan', label: 'Propan', icon: Droplets, color: '#c084fc' },
  { id: 'benzin', label: 'Benzin', icon: Fuel, color: '#fbbf24' },
  { id: 'elektr', label: 'Elektr', icon: Zap, color: '#34d399' },
];

export default function AddStationModal({ isOpen, onClose, onSave, editStation, isLight = false, userCoords = null }) {
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);

  // Form states
  const [stationType, setStationType] = useState('fuel');
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['metan']);
  const [fuelPrices, setFuelPrices] = useState({ metan: '3800' });
  const [phone, setPhone] = useState('+998 ');

  // Map states
  const [mapPos, setMapPos] = useState([41.311081, 69.240562]); // Default Tashkent
  const [isLocating, setIsLocating] = useState(false);

  // Foydalanuvchining joylashuvini avtomatik aniqlash
  const locateUser = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocating(false);
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapPos(coords);
          try {
            const addr = await reverseGeocode(coords[0], coords[1]);
            if (addr) setAddress(addr);
          } catch (e) {
            console.warn("Geocode error:", e);
          }
        },
        (err) => {
          setIsLocating(false);
          console.warn("Geolokatsiya aniqlanmadi:", err?.message);
          if (userCoords?.lat && userCoords?.lng) {
            const coords = [userCoords.lat, userCoords.lng];
            setMapPos(coords);
            reverseGeocode(coords[0], coords[1]).then(setAddress);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else if (userCoords?.lat && userCoords?.lng) {
      setIsLocating(false);
      const coords = [userCoords.lat, userCoords.lng];
      setMapPos(coords);
      reverseGeocode(coords[0], coords[1]).then(setAddress);
    } else {
      setIsLocating(false);
    }
  }, [userCoords]);
  const [address, setAddress] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isAddressCorrect, setIsAddressCorrect] = useState(null);

  // Final states
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState({
    coffee: true,
    toilet: true,
    shop: true,
  });
  const [payments, setPayments] = useState({
    cash: true,
    uzcard: true,
    humo: true,
    visa: true,
  });
  const [q1, setQ1] = useState(true);
  const [q2, setQ2] = useState(true);

  const imgInputRef = useRef(null);
  const [verificationImages, setVerificationImages] = useState({
    exterior: '',
    interior: '',
    roadside: '',
  });
  const [showSuccessSubmittedModal, setShowSuccessSubmittedModal] = useState(false);
  const [submittedCountdown, setSubmittedCountdown] = useState(5);

  const extInputRef = useRef(null);
  const intInputRef = useRef(null);
  const roadInputRef = useRef(null);

  const handleVerificationUpload = (slot, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setVerificationImages(prev => ({ ...prev, [slot]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeVerificationImage = (slot) => {
    setVerificationImages(prev => ({ ...prev, [slot]: '' }));
  };

  useEffect(() => {
    if (!showSuccessSubmittedModal) return;
    const interval = setInterval(() => {
      setSubmittedCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowSuccessSubmittedModal(false);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showSuccessSubmittedModal, onClose]);


  useEffect(() => {
    if (isOpen) {
      if (editStation) {
        setStep(2);
        setStationType('fuel');
        setName(editStation.name || '');
        setSelectedTypes(editStation.type || ['metan']);
        setFuelPrices(editStation.prices || {});
        setPhone(editStation.phone || '+998 ');
        setMapPos([editStation.lat || 41.311081, editStation.lng || 69.240562]);
        setAddress(editStation.address ? { full: editStation.address } : null);
        setLocationConfirmed(true);
        setIsAddressCorrect(true);
        setDescription(editStation.description || '');
        setImages(editStation.images || []);
        setVerificationImages({
          exterior: editStation.verificationImages?.exterior || '',
          interior: editStation.verificationImages?.interior || '',
          roadside: editStation.verificationImages?.roadside || '',
        });
        setShowSuccessSubmittedModal(false);
        setSubmittedCountdown(5);
        setAmenities(editStation.amenities || {
          coffee: true,
          toilet: true,
          shop: true,
        });
        setPayments(editStation.payments || {
          cash: true,
          uzcard: true,
          humo: true,
          visa: true,
        });
        setQ1(true);
        setQ2(true);
      } else {
        setStep(1);
        setStationType('fuel');
        setName('');
        setSelectedTypes(['metan']);
        setFuelPrices({ metan: '3800' });
        setPhone('+998 ');
        const initialCoords = (userCoords?.lat && userCoords?.lng)
          ? [userCoords.lat, userCoords.lng]
          : [41.311081, 69.240562];
        setMapPos(initialCoords);
        setAddress(null);
        setLocationConfirmed(false);
        setIsAddressCorrect(null);
        setDescription('');
        setImages([]);
        setVerificationImages({ exterior: '', interior: '', roadside: '' });
        setShowSuccessSubmittedModal(false);
        setSubmittedCountdown(5);
        setAmenities({
          coffee: true,
          toilet: true,
          shop: true,
        });
        setPayments({
          cash: true,
          uzcard: true,
          humo: true,
          visa: true,
        });
        setQ1(true);
        setQ2(true);

        // Avtomatik foydalanuvchi joylashuvini topish
        locateUser();
      }
    }
  }, [isOpen, editStation]);


  // 4-bosqichga o'tganda (xarita ochilganda) avtomatik odam qayerdaligini topib xaritani ko'rsatish
  useEffect(() => {
    if (step === 4 && !editStation) {
      locateUser();
    }
  }, [step, editStation, locateUser]);

  if (!isOpen) return null;

  const goToStep = (nextStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  };

  const handlePhoneChange = (val) => {
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+998')) cleaned = '+998' + cleaned.replace('+', '');
    let formatted = '+998 ';
    const nums = cleaned.slice(4);
    for (let i = 0; i < Math.min(nums.length, 9); i++) {
      if (i === 2 || i === 5 || i === 7) formatted += ' ';
      formatted += nums[i];
    }
    if (formatted.length > 17) formatted = formatted.slice(0, 17);
    setPhone(formatted);
  };

  const toggleType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== typeId));
      }
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
      if (!fuelPrices[typeId]) {
        const defaultPrice = typeId === 'metan' ? '3800' : typeId === 'propan' ? '5500' : '9500';
        setFuelPrices({ ...fuelPrices, [typeId]: defaultPrice });
      }
    }
  };

  const handleMapClick = async (pos) => {
    setMapPos(pos);
    setLocationConfirmed(false);
    setIsAddressCorrect(null);
    const addr = await reverseGeocode(pos[0], pos[1]);
    setAddress(addr);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert("Eng ko'pi bilan 5 ta rasm yuklash mumkin!");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const parsedPrices = Object.fromEntries(
      Object.entries(fuelPrices)
        .map(([k, v]) => [k, parseInt(v, 10)])
        .filter(([k, v]) => !isNaN(v) && v > 0)
    );

    const verificationList = [
      verificationImages.exterior,
      verificationImages.interior,
      verificationImages.roadside,
    ].filter(Boolean);

    // Barcha yuklangan rasmlar (umumiy rasmlar + tekshiruv uchun yuklangan 3 ta rasm)
    const combinedImgs = [...images];
    verificationList.forEach(v => {
      if (v && !combinedImgs.includes(v)) combinedImgs.push(v);
    });

    if (combinedImgs.length === 0) {
      combinedImgs.push('https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=600&q=80');
    }

    // Tekshiruv uchun 3 ta rasm:
    // Agar foydalanuvchi alohida 3 ta katakchaga yuklagan bo'lsa - o'shalar olinadi.
    // Agar umumiy rasmlar bo'limiga 3 ta rasm yuklagan bo'lsa - avtomatik ravishda 1-, 2-, 3-rasmlar moslashtiriladi!
    const finalVerification = {
      exterior: verificationImages.exterior || images[0] || combinedImgs[0] || '',
      interior: verificationImages.interior || images[1] || combinedImgs[1] || '',
      roadside: verificationImages.roadside || images[2] || combinedImgs[2] || '',
    };

    const newStation = {
      id: editStation?.id || `st_user_${Date.now()}`,
      name: name.trim() || 'A-Maps Shahobchasi',
      type: selectedTypes,
      prices: Object.keys(parsedPrices).length > 0 ? parsedPrices : { metan: 3800 },
      phone,
      lat: mapPos[0],
      lng: mapPos[1],
      address: address?.full || 'Toshkent sh., Chilonzor tumani',
      description,
      images: combinedImgs,
      verificationImages: finalVerification,
      gasPressure: selectedTypes.includes('metan') ? 200 : '',
      pressures: selectedTypes.includes('metan') ? { metan: 200 } : {},
      amenities: {
        coffee: !!amenities.coffee,
        toilet: !!amenities.toilet,
        shop: !!amenities.shop,
      },
      payments: {
        cash: !!payments.cash,
        uzcard: !!payments.uzcard,
        humo: !!payments.humo,
        visa: !!payments.visa,
      },
      dailyNotification: q1,
      priceUpdate: q2,
      isOpen: true,
      rating: 5.0,
      reviewsCount: 1,
    };
    onSave(newStation);
    setShowSuccessSubmittedModal(true);
    setSubmittedCountdown(5);
  };

  // Validations
  const isStep2Valid = stationType === 'fuel' && name.trim().length >= 2;
  const isStep3Valid = selectedTypes.length > 0 && phone.replace(/\s/g, '').length >= 13;
  const isStep4Valid = isAddressCorrect === true;
  const isStep5Valid = images.length > 0 || Boolean(verificationImages.exterior || verificationImages.interior || verificationImages.roadside);
  const isStep6Valid = true; // Qulayliklar va to'lov turlari
  const isStep7Valid = q1 !== null && q2 !== null;

  return (
    <div className={`modern-add-station-overlay ${isLight ? 'is-light' : ''}`} onClick={onClose}>
      <div 
        className={`modern-add-station-card ${animating ? 'step-exit' : 'step-enter'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Yopish tugmasi */}
        <button 
          type="button" 
          className="modern-add-station-close-btn" 
          onClick={onClose}
          title="Yopish"
        >
          <X size={18} />
        </button>

        {/* Tepadagi badge va bosqich sanagichi */}
        <div className="modern-add-station-header">
          <div className="modern-add-station-badge">
            <Sparkles size={14} className="badge-sparkle-icon" />
            <span>A-Maps • Yangi joylashuv</span>
          </div>

          <div className="modern-add-step-counter">
            <span>{step} / 7</span>
          </div>
        </div>

        {/* Progress chizig'i */}
        <div className="modern-add-progress-track">
          <div 
            className="modern-add-progress-fill" 
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* ========================================================
            1-BOSQICH: BOSHLASHNI TASDIQLASH
            ======================================================== */}
        {step === 1 && (
          <div className="modern-add-step-body text-center">
            <div className="modern-add-hero-icon-bubble">
              <MapPin size={38} className="text-cyan-400" />
            </div>
            <h2 className="modern-add-step-title">Joylashuv qo'shish</h2>
            <p className="modern-add-step-desc">
              O'zingizga tegishli yoki xaritada mavjud bo'lmagan yangi joylashuvni A-Maps xaritasiga qo'shishingiz mumkin.
            </p>

            <div className="modern-add-confirm-callout">
              <span>Yangi joylashuv qo'shishni boshlaysizmi?</span>
            </div>

            <div className="modern-add-actions-row">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={onClose}
              >
                Yo'q, bekor qilish
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                onClick={() => goToStep(2)}
              >
                Ha, boshlash <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            2-BOSQICH: MANZIL TURI VA SHAHOBCHA NOMI
            ======================================================== */}
        {step === 2 && (
          <div className="modern-add-step-body">
            <h2 className="modern-add-step-title">Manzil turi va nomi</h2>
            <p className="modern-add-step-desc">Joylashuv qanday turdagi manzil va uning nomi nima?</p>

            <div 
              className={`modern-add-type-card ${stationType === 'fuel' ? 'active' : ''}`}
              onClick={() => setStationType('fuel')}
            >
              <div className="type-card-icon-halo">
                <Fuel size={22} />
              </div>
              <div className="type-card-info">
                <span className="type-card-title">Yoqilg'i shahobchasi</span>
                <span className="type-card-subtitle">Metan, propan, benzin, elektr zaryadlash</span>
              </div>
              <div className="type-card-radio-ring">
                <div className="type-card-radio-dot" />
              </div>
            </div>

            <p className="type-note-text">
              * Boshqa xizmat turlari (moy almashtirish, avtoyuvish va h.k.) tez kunda qo'shiladi.
            </p>

            <div className="modern-field-group mt-3">
              <label className="modern-field-label">Yoqilg'i shahobchasi nomi *</label>
              <div className="modern-input-wrap">
                <Type size={18} className="modern-input-icon" />
                <input 
                  type="text" 
                  placeholder="Masalan: Mustang, UzGazOil, Real Gaz..." 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="modern-input-field"
                  autoFocus
                />
              </div>
            </div>

            <div className="modern-add-actions-row mt-4">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={() => goToStep(1)}
              >
                <ChevronLeft size={18} /> Orqaga
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                disabled={!isStep2Valid} 
                onClick={() => goToStep(3)}
              >
                Keyingisi <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            3-BOSQICH: YOQILG'I TURLARI, NARXLARI VA TELEFON
            ======================================================== */}
        {step === 3 && (
          <div className="modern-add-step-body">
            <h2 className="modern-add-step-title">Yoqilg'i turlari va aloqa</h2>
            <p className="modern-add-step-desc">Shahobchangizda sotiladigan yoqilg'i turlari va menejer telefoni:</p>

            <div className="modern-add-fuel-grid">
              {FUEL_TYPES.map(ft => {
                const Icon = ft.icon;
                const isActive = selectedTypes.includes(ft.id);
                return (
                  <button
                    key={ft.id}
                    type="button"
                    className={`modern-add-fuel-tile ${isActive ? 'active' : ''}`}
                    onClick={() => toggleType(ft.id)}
                    style={{ '--fuel-accent': ft.color }}
                  >
                    <Icon size={18} />
                    <span>{ft.label}</span>
                    {isActive && <Check size={14} className="tile-check-icon" />}
                  </button>
                );
              })}
            </div>

            {selectedTypes.length > 0 && (
              <div className="modern-add-prices-section mt-3">
                <label className="modern-field-label">Yoqilg'i narxlarini kiriting (so'm):</label>
                <div className="modern-add-prices-grid">
                  {selectedTypes.map(typeId => {
                    const item = FUEL_TYPES.find(f => f.id === typeId);
                    const label = item?.label || typeId;
                    return (
                      <div key={typeId} className="modern-add-price-item">
                        <span className="price-item-name">{label}:</span>
                        <div className="modern-input-wrap price-input-wrap">
                          <input 
                            type="number" 
                            placeholder="0"
                            value={fuelPrices[typeId] || ''}
                            onChange={e => setFuelPrices({ ...fuelPrices, [typeId]: e.target.value })}
                            className="modern-input-field text-right"
                          />
                          <span className="price-item-unit">so'm</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modern-field-group mt-3">
              <label className="modern-field-label">Ish boshqaruvchi (menejer) telefon raqami *</label>
              <div className="modern-input-wrap">
                <Phone size={18} className="modern-input-icon" />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => handlePhoneChange(e.target.value)}
                  className="modern-input-field"
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            <div className="modern-add-actions-row mt-4">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={() => goToStep(2)}
              >
                <ChevronLeft size={18} /> Orqaga
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                disabled={!isStep3Valid} 
                onClick={() => goToStep(4)}
              >
                Keyingisi <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            4-BOSQICH: ANIQ MANZIL (XARITA VA TASDIQLASH)
            ======================================================== */}
        {step === 4 && (
          <div className="modern-add-step-body">
            <h2 className="modern-add-step-title">Aniq manzil</h2>
            <p className="modern-add-step-desc">Xaritada shahobcha joylashgan aniq nuqtani bosing:</p>

            <div className="modern-add-map-box" style={{ position: 'relative' }}>
              {mapPos && (
                <AddStationMapPicker 
                  position={mapPos} 
                  onLocationSelect={handleMapClick} 
                />
              )}
              <button
                type="button"
                className={`add-map-gps-btn ${isLocating ? 'locating' : ''}`}
                onClick={locateUser}
                title="Mening hozirgi joylashuvim"
              >
                <Crosshair size={16} className={isLocating ? "animate-spin" : ""} />
                <span>{isLocating ? "Aniqlanmoqda..." : "Joylashuvim"}</span>
              </button>
            </div>

            {isAddressCorrect !== true ? (
              <div className="mt-3">
                <div 
                  className="modern-add-confirm-loc-btn" 
                  onClick={() => setLocationConfirmed(true)}
                >
                  <MapPin size={18} />
                  <span>Joylashuvni tasdiqlash</span>
                </div>

                {locationConfirmed && address && (
                  <div className="modern-add-verify-sheet mt-3">
                    <p className="verify-hint-label">Tanlangan manzil:</p>
                    <h4 className="verify-address-heading">{address.full}</h4>
                    <p className="verify-question-text">Shu manzil to'g'rimi?</p>
                    <div className="verify-btn-row">
                      <button 
                        type="button" 
                        className="modern-add-btn-secondary" 
                        onClick={() => { setLocationConfirmed(false); setIsAddressCorrect(false); }}
                      >
                        Yo'q, boshqa joy
                      </button>
                      <button 
                        type="button" 
                        className="modern-add-btn-primary" 
                        onClick={() => setIsAddressCorrect(true)}
                      >
                        Ha, to'g'ri
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="modern-add-address-confirmed-card mt-3">
                <CheckCircle2 size={30} className="text-emerald-400" />
                <div className="confirmed-info-col">
                  <h4 className="confirmed-heading">Manzil tasdiqlandi</h4>
                  <p className="confirmed-sub">{address?.full}</p>
                </div>
                <button 
                  type="button" 
                  className="confirmed-edit-link" 
                  onClick={() => setIsAddressCorrect(false)}
                >
                  O'zgartirish
                </button>
              </div>
            )}

            <div className="modern-add-actions-row mt-4">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={() => goToStep(3)}
              >
                <ChevronLeft size={18} /> Orqaga
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                disabled={!isStep4Valid} 
                onClick={() => goToStep(5)}
              >
                Keyingisi <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            5-BOSQICH: TAVSIF VA RASMLAR (KAMIDA 1 TA)
            ======================================================== */}
        {step === 5 && (
          <div className="modern-add-step-body">
            <h2 className="modern-add-step-title">Ma'lumotlar va rasmlar</h2>
            <p className="modern-add-step-desc">Shahobchangiz haqida qisqacha ma'lumot va rasmlar:</p>

            <div className="modern-field-group">
              <label className="modern-field-label">Shahobcha tavsifi</label>
              <div className="modern-input-wrap modern-textarea-wrap">
                <textarea 
                  placeholder="Foydalanuvchilar ko'rishi uchun qisqacha ma'lumot (qulayliklar, xizmatlar)..." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="modern-textarea-field"
                  rows={3}
                />
              </div>
            </div>

            <div className="modern-field-group mt-3">
              <label className="modern-field-label">Rasmlar (kamida 1 ta, ko'pi bilan 5 ta) *</label>
              <div className="modern-add-images-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="modern-add-image-thumb">
                    <img src={img} alt="Shahobcha" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(idx)} 
                      className="modern-add-image-remove-btn"
                      title="O'chirish"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <div 
                    onClick={() => imgInputRef.current?.click()}
                    className="modern-add-image-uploader-tile"
                    title="Rasm yuklash"
                  >
                    <Camera size={22} className="text-cyan-400" />
                    <span>Rasm qo'shish</span>
                  </div>
                )}
              </div>
              <input 
                ref={imgInputRef} 
                type="file" 
                accept="image/*" 
                multiple 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
            </div>

            {/* Dastur Administratsiyasi tekshiruvi uchun 3 ta rasm */}
            <div className="modern-verification-box mt-4" style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '14px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} color="#38bdf8" />
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                  Dastur Administratsiyasi tekshiruvi uchun 3 ta rasm
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.45, marginBottom: '14px' }}>
                Dastur Administratsiyasi manzilingizni dasturga qo'shish uchun unga manzil rostdan borligi bo'yicha manzilni tashqari tomondan, ichki tomondan va yo'l yuzi tomonidan olingan 3 ta rasm qo'ying.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {/* 1. Tashqari tomondan */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#e2e8f0' }}>
                    1. Tashqari tomondan
                  </span>
                  {verificationImages.exterior ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={verificationImages.exterior} alt="Tashqari" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeVerificationImage('exterior')}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}
                        title="O'chirish"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => extInputRef.current?.click()}
                      style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.06)' }}
                    >
                      <Camera size={20} color="#38bdf8" />
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Rasm yuklash</span>
                    </div>
                  )}
                  <input ref={extInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleVerificationUpload('exterior', e)} />
                </div>

                {/* 2. Ichki tomondan */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#e2e8f0' }}>
                    2. Ichki tomondan
                  </span>
                  {verificationImages.interior ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={verificationImages.interior} alt="Ichki" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeVerificationImage('interior')}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}
                        title="O'chirish"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => intInputRef.current?.click()}
                      style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.06)' }}
                    >
                      <Camera size={20} color="#38bdf8" />
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Rasm yuklash</span>
                    </div>
                  )}
                  <input ref={intInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleVerificationUpload('interior', e)} />
                </div>

                {/* 3. Yo'l yuzi tomon */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#e2e8f0' }}>
                    3. Yo'l yuzi tomon
                  </span>
                  {verificationImages.roadside ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={verificationImages.roadside} alt="Yo'l yuzi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeVerificationImage('roadside')}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}
                        title="O'chirish"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => roadInputRef.current?.click()}
                      style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.06)' }}
                    >
                      <Camera size={20} color="#38bdf8" />
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Rasm yuklash</span>
                    </div>
                  )}
                  <input ref={roadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleVerificationUpload('roadside', e)} />
                </div>
              </div>
            </div>

            <div className="modern-add-actions-row mt-4">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={() => goToStep(4)}
              >
                <ChevronLeft size={18} /> Orqaga
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                disabled={!isStep5Valid} 
                onClick={() => goToStep(6)}
              >
                Keyingisi <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            6-BOSQICH: QULAYLIKLAR VA TO'LOV TURLARI
            ======================================================== */}
        {step === 6 && (
          <div className="modern-add-step-body">
            <h2 className="modern-add-step-title">Qulayliklar va to'lov turlari</h2>
            <p className="modern-add-step-desc">
              Shahobchangizda mavjud qulayliklar va qabul qilinadigan to'lov usullarini tasdiqlang:
            </p>

            {/* 1. Qulayliklar (Qahva, Hojatxona, Do'kon) */}
            <div className="modern-add-sec-subheading">
              <span>Qulayliklar</span>
            </div>
            <div className="modern-services-list">
              {AMENITIES_DATA.map((item) => {
                const isAvail = amenities[item.id] !== false;
                const IconComponent = item.icon;
                return (
                  <div 
                    key={item.id} 
                    className={`modern-service-row-card ${isAvail ? 'is-available' : 'is-unavailable'}`}
                  >
                    <div className="service-card-left">
                      <div className="service-card-icon-box">
                        <IconComponent />
                        {!isAvail && (
                          <div className="service-card-unavailable-badge" title="Mavjud emas">
                            <X size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="service-card-info">
                        <span className="service-card-title">{item.label}</span>
                        <span className="service-card-status">
                          {isAvail ? "Mavjud (Bor)" : "Mavjud emas (Yo'q)"}
                        </span>
                      </div>
                    </div>

                    <div className="service-card-toggle-group">
                      <button
                        type="button"
                        className={`service-toggle-btn btn-yes ${isAvail ? 'active' : ''}`}
                        onClick={() => setAmenities({ ...amenities, [item.id]: true })}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Bor</span>
                      </button>
                      <button
                        type="button"
                        className={`service-toggle-btn btn-no ${!isAvail ? 'active' : ''}`}
                        onClick={() => setAmenities({ ...amenities, [item.id]: false })}
                      >
                        <X size={14} strokeWidth={2.5} />
                        <span>Yo'q</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. To'lov turlari (cash, Uzcard, HUMO, VISA/bank) */}
            <div className="modern-add-sec-subheading mt-3">
              <span>To'lov turlari</span>
            </div>
            <div className="modern-services-list">
              {PAYMENTS_DATA.map((item) => {
                const isAvail = payments[item.id] !== false;
                const BadgeComponent = item.badge;
                const IconComponent = item.icon;
                return (
                  <div 
                    key={item.id} 
                    className={`modern-service-row-card ${isAvail ? 'is-available' : 'is-unavailable'}`}
                  >
                    <div className="service-card-left">
                      <div className="service-card-icon-box pay-icon-box">
                        {BadgeComponent ? <BadgeComponent /> : <IconComponent />}
                        {!isAvail && (
                          <div className="service-card-unavailable-badge" title="Qabul qilinmaydi">
                            <X size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="service-card-info">
                        <span className="service-card-title">{item.label}</span>
                        <span className="service-card-status">
                          {isAvail ? "Qabul qilinadi (Bor)" : "Qabul qilinmaydi (Yo'q)"}
                        </span>
                      </div>
                    </div>

                    <div className="service-card-toggle-group">
                      <button
                        type="button"
                        className={`service-toggle-btn btn-yes ${isAvail ? 'active' : ''}`}
                        onClick={() => setPayments({ ...payments, [item.id]: true })}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Bor</span>
                      </button>
                      <button
                        type="button"
                        className={`service-toggle-btn btn-no ${!isAvail ? 'active' : ''}`}
                        onClick={() => setPayments({ ...payments, [item.id]: false })}
                      >
                        <X size={14} strokeWidth={2.5} />
                        <span>Yo'q</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modern-add-actions-row mt-4">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={() => goToStep(5)}
              >
                <ChevronLeft size={18} /> Orqaga
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                onClick={() => goToStep(7)}
              >
                Keyingisi <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            7-BOSQICH: SO'NGGI QADAM VA SAVOLLAR
            ======================================================== */}
        {step === 7 && (
          <div className="modern-add-step-body">
            <h2 className="modern-add-step-title">So'nggi qadam</h2>
            <p className="modern-add-step-desc">Iltimos, quyidagi savollarga javob bering:</p>

            <div className="modern-add-question-box">
              <p className="question-title">
                1. Har kuni yoqilg'i shahobchangiz ochiq yoki yopiqligini tasdiqlab tura olasizmi?
              </p>
              <div className="question-toggle-row">
                <button 
                  type="button" 
                  className={`question-toggle-btn yes ${q1 === true ? 'active' : ''}`}
                  onClick={() => setQ1(true)}
                >
                  <Check size={16} /> Ha, albatta
                </button>
                <button 
                  type="button" 
                  className={`question-toggle-btn no ${q1 === false ? 'active' : ''}`}
                  onClick={() => setQ1(false)}
                >
                  <X size={16} /> Yo'q
                </button>
              </div>
            </div>

            <div className="modern-add-question-box mt-3">
              <p className="question-title">
                2. Yoqilg'i narxi tushayotgan yoki ko'tarilayotgan bo'lsa, aniq narxlarni har kuni yozib yura olasizmi?
              </p>
              <div className="question-toggle-row">
                <button 
                  type="button" 
                  className={`question-toggle-btn yes ${q2 === true ? 'active' : ''}`}
                  onClick={() => setQ2(true)}
                >
                  <Check size={16} /> Ha, albatta
                </button>
                <button 
                  type="button" 
                  className={`question-toggle-btn no ${q2 === false ? 'active' : ''}`}
                  onClick={() => setQ2(false)}
                >
                  <X size={16} /> Yo'q
                </button>
              </div>
            </div>

            <div className="modern-add-actions-row mt-4">
              <button 
                type="button" 
                className="modern-add-btn-secondary" 
                onClick={() => goToStep(6)}
              >
                <ChevronLeft size={18} /> Orqaga
              </button>
              <button 
                type="button" 
                className="modern-add-btn-primary" 
                disabled={!isStep7Valid} 
                onClick={handleSubmit}
              >
                <Check size={18} /> Tasdiqlash va saqlash
              </button>
            </div>
          </div>
        )}
        {showSuccessSubmittedModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px',
              padding: '2rem 1.75rem',
              maxWidth: '430px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.2)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#10b981',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.6rem' }}>
                Manzilingiz Dastur Administratsiyasiga yuborildi
              </h3>

              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.4rem' }}>
                Administratsiya tasdiqlaganidan keyin manzilingiz dasturga joylanadi.
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '999px',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}>
                <Clock size={14} />
                <span>{submittedCountdown} soniyadan so'ng yopiladi...</span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessSubmittedModal(false);
                    onClose();
                  }}
                  className="modern-add-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 18px' }}
                >
                  Tushunarli
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

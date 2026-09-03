import React, { useState, useRef, useEffect } from 'react';
import {
  X, Fuel, Flame, Droplets, Zap, MapPin, Camera, Check,
  Phone, Type, FileText, ChevronDown, Plus, Trash2, Star
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Foydalanuvchi joylashuvi markeri
const locationIcon = L.divIcon({
  className: 'add-station-marker',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Xaritada bosish uchun komponent
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Xaritani joylashuvga olib borish
function FlyToPos({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1 });
  }, [position, map]);
  return null;
}

// Reverse geocoding (OpenStreetMap Nominatim)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`
    );
    const data = await res.json();
    if (data?.display_name) {
      // Qisqartirilgan manzil
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

const FUEL_TYPES = [
  { id: 'metan', label: 'Gaz (Metan)', icon: Flame, color: '#0ea5e9' },
  { id: 'propan', label: 'Propan', icon: Droplets, color: '#a855f7' },
  { id: 'benzin', label: 'Benzin', icon: Fuel, color: '#f59e0b' },
  { id: 'elektr', label: 'Elektr', icon: Zap, color: '#10b981' },
];

export default function AddStationModal({ isOpen, onClose, onSave, editStation }) {
  const defaultCenter = [41.311081, 69.240562];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [prices, setPrices] = useState({});
  const [mapPos, setMapPos] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [dailyNotif, setDailyNotif] = useState(true);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [locating, setLocating] = useState(true);
  const imgInputRef = useRef(null);

  // Tahrirlash rejimi — eski ma'lumotlarni yuklash
  useEffect(() => {
    if (editStation) {
      setName(editStation.name || '');
      setPhone(editStation.phone || '+998 ');
      setSelectedTypes(editStation.type || []);
      setPrices(editStation.prices || {});
      setMapPos([editStation.lat, editStation.lng]);
      setAddress({ full: editStation.address, city: '', road: '' });
      setLocationConfirmed(true);
      setDailyNotif(editStation.dailyNotification ?? true);
      setDescription(editStation.description || '');
      setImages(editStation.images || []);
      setMainImageIdx(editStation.mainImageIndex || 0);
      setLocating(false);
    } else {
      resetForm();
    }
  }, [editStation, isOpen]);

  // GPS joylashuvni aniqlash
  useEffect(() => {
    if (!isOpen || editStation) return;
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapPos(coords);
          const addr = await reverseGeocode(coords[0], coords[1]);
          setAddress(addr);
          setLocating(false);
        },
        () => {
          setMapPos(defaultCenter);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setMapPos(defaultCenter);
      setLocating(false);
    }
  }, [isOpen, editStation]);

  const resetForm = () => {
    setName('');
    setPhone('+998 ');
    setSelectedTypes([]);
    setPrices({});
    setMapPos(null);
    setAddress(null);
    setLocationConfirmed(false);
    setDailyNotif(true);
    setDescription('');
    setImages([]);
    setMainImageIdx(0);
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
    setPhone(formatted);
  };

  const toggleType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      setSelectedTypes(selectedTypes.filter(t => t !== typeId));
      const newPrices = { ...prices };
      delete newPrices[typeId];
      setPrices(newPrices);
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  const handleMapClick = async (pos) => {
    setMapPos(pos);
    setLocationConfirmed(false);
    const addr = await reverseGeocode(pos[0], pos[1]);
    setAddress(addr);
  };

  const handleConfirmLocation = () => {
    setLocationConfirmed(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 6) {
      alert("Eng ko'pi bilan 6 ta rasm yuklash mumkin!");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 600;
          let w = img.width, h = img.height;
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setImages(prev => [...prev, compressed]);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (mainImageIdx >= idx && mainImageIdx > 0) setMainImageIdx(mainImageIdx - 1);
  };

  const handleSubmit = () => {
    if (!name.trim()) { alert("Shahobcha nomini kiriting!"); return; }
    if (selectedTypes.length === 0) { alert("Yoqilg'i turini tanlang!"); return; }
    if (!mapPos) { alert("Joylashuvni aniqlang!"); return; }

    const station = {
      id: editStation?.id || 'st_' + Date.now(),
      name: name.trim(),
      phone: phone,
      category: 'fuel',
      type: selectedTypes,
      prices: prices,
      lat: mapPos[0],
      lng: mapPos[1],
      address: address?.full || '',
      description: description.trim(),
      images: images,
      mainImageIndex: mainImageIdx,
      image: images[mainImageIdx] || '',
      dailyNotification: dailyNotif,
      isOpen: editStation?.isOpen ?? true,
      createdAt: editStation?.createdAt || new Date().toISOString(),
    };

    onSave(station);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-station-overlay" onClick={onClose}>
      <div className="add-station-sheet" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="add-station-header">
          <h2>{editStation ? "Shahobchani tahrirlash" : "Manzil yaratish"}</h2>
          <button className="add-station-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Kategoriya tanlash */}
        <div className="add-st-section">
          <label className="add-st-label">Qanday turdagi manzil?</label>
          <div className="add-st-category-row">
            <button className="add-st-cat-btn active">
              <Fuel size={16} />
              Yoqilg'i shahobchasi
            </button>
            {/* Keyinchalik qo'shiladi */}
          </div>
        </div>

        {/* Nom */}
        <div className="add-st-section">
          <label className="add-st-label">Shahobcha nomi</label>
          <div className="add-st-input-wrap">
            <Type size={16} className="add-st-input-icon" />
            <input
              type="text"
              placeholder="Masalan: MegaGaz Chilonzor"
              value={name}
              onChange={e => setName(e.target.value)}
              className="add-st-input"
            />
          </div>
        </div>

        {/* Telefon */}
        <div className="add-st-section">
          <label className="add-st-label">Telefon raqami</label>
          <div className="add-st-input-wrap">
            <Phone size={16} className="add-st-input-icon" />
            <input
              type="tel"
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              className="add-st-input"
            />
          </div>
        </div>

        {/* Yoqilg'i turi */}
        <div className="add-st-section">
          <label className="add-st-label">Yoqilg'i turi (tanlang)</label>
          <div className="add-st-fuel-types">
            {FUEL_TYPES.map(ft => {
              const Icon = ft.icon;
              const isActive = selectedTypes.includes(ft.id);
              return (
                <button
                  key={ft.id}
                  className={`add-st-fuel-btn ${isActive ? 'active' : ''}`}
                  style={isActive ? { background: ft.color, borderColor: ft.color } : {}}
                  onClick={() => toggleType(ft.id)}
                >
                  <Icon size={15} />
                  {ft.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Narxlar */}
        {selectedTypes.length > 0 && (
          <div className="add-st-section">
            <label className="add-st-label">Narxlari (so'm)</label>
            <div className="add-st-prices-grid">
              {selectedTypes.map(typeId => {
                const ft = FUEL_TYPES.find(f => f.id === typeId);
                return (
                  <div key={typeId} className="add-st-price-item">
                    <span style={{ color: ft.color, fontWeight: 700, fontSize: '0.82rem' }}>
                      {ft.label}
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={prices[typeId] || ''}
                      onChange={e => setPrices({ ...prices, [typeId]: e.target.value })}
                      className="add-st-price-input"
                    />
                    <span className="add-st-price-som">so'm</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Joylashuv */}
        <div className="add-st-section">
          <label className="add-st-label">
            <MapPin size={15} /> Joylashuv
          </label>

          {!locationConfirmed ? (
            <div className="add-st-map-box">
              {mapPos && (
                <div className="add-st-map-container">
                  <MapContainer
                    center={mapPos}
                    zoom={16}
                    zoomControl={false}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      maxZoom={19}
                    />
                    <Marker position={mapPos} icon={locationIcon} />
                    <MapClickHandler onLocationSelect={handleMapClick} />
                    <FlyToPos position={mapPos} />
                  </MapContainer>
                </div>
              )}
              {locating && (
                <div className="add-st-map-loading">📡 Joylashuv aniqlanmoqda...</div>
              )}
              {address && (
                <div className="add-st-address-preview">
                  <MapPin size={14} />
                  <span>{address.full}</span>
                </div>
              )}
              {mapPos && !locating && (
                <button className="add-st-confirm-loc-btn" onClick={handleConfirmLocation}>
                  <Check size={16} />
                  Joylashuvni tasdiqlash
                </button>
              )}
            </div>
          ) : (
            <div className="add-st-address-confirmed">
              <div className="add-st-address-text">
                <MapPin size={16} />
                <div>
                  <strong>{address?.city || 'Shahar'}</strong>
                  <span>{address?.road || address?.full}</span>
                </div>
              </div>
              <button className="add-st-change-loc" onClick={() => setLocationConfirmed(false)}>
                O'zgartirish
              </button>
            </div>
          )}
        </div>

        {/* Har kuni savol */}
        <div className="add-st-section">
          <label className="add-st-label">
            Har kuni "Ochiqmiz/Yopiqmiz" savoli smartfoningizga kelishiga rozimisiz?
          </label>
          <div className="add-st-toggle-row">
            <button
              className={`add-st-toggle-btn ${dailyNotif ? 'active-yes' : ''}`}
              onClick={() => setDailyNotif(true)}
            >
              ✅ Ha, roziman
            </button>
            <button
              className={`add-st-toggle-btn ${!dailyNotif ? 'active-no' : ''}`}
              onClick={() => setDailyNotif(false)}
            >
              ❌ Yo'q
            </button>
          </div>
        </div>

        {/* Tavsif */}
        <div className="add-st-section">
          <label className="add-st-label">
            <FileText size={15} /> Shahobchangiz haqida yozing
          </label>
          <textarea
            className="add-st-textarea"
            placeholder="Foydalanuvchilar ko'rishi uchun gap yozib qo'ying..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        {/* Rasmlar */}
        <div className="add-st-section">
          <label className="add-st-label">
            <Camera size={15} /> Rasmlar (6 tagacha)
          </label>
          <div className="add-st-images-grid">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`add-st-img-thumb ${idx === mainImageIdx ? 'main-selected' : ''}`}
                onClick={() => setMainImageIdx(idx)}
              >
                <img src={img} alt={`Rasm ${idx + 1}`} />
                {idx === mainImageIdx && (
                  <div className="add-st-main-badge">
                    <Star size={10} fill="#fff" />
                  </div>
                )}
                <button
                  className="add-st-img-remove"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button className="add-st-img-add" onClick={() => imgInputRef.current?.click()}>
                <Plus size={22} />
              </button>
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
          {images.length > 0 && (
            <p className="add-st-img-hint">⭐ Asosiy rasm tanlash uchun bosing</p>
          )}
        </div>

        {/* Submit */}
        <button className="add-st-submit-btn" onClick={handleSubmit}>
          <Check size={18} />
          {editStation ? "O'zgarishlarni saqlash" : "Tasdiqlash va qo'shish"}
        </button>
      </div>
    </div>
  );
}

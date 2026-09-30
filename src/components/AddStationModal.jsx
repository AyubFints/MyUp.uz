import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin, Check, Plus, Trash2, Camera, Phone, User, Droplets, Zap, Flame, Fuel, ChevronRight, ChevronLeft, Info, HelpCircle, Type
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const locationIcon = L.divIcon({
  className: 'add-station-marker',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function FlyToPos({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1 });
  }, [position, map]);
  return null;
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

const FUEL_TYPES = [
  { id: 'metan', label: 'Gaz (Metan)', icon: Flame, color: '#0ea5e9' },
  { id: 'propan', label: 'Propan', icon: Droplets, color: '#a855f7' },
  { id: 'benzin', label: 'Benzin', icon: Fuel, color: '#f59e0b' },
  { id: 'elektr', label: 'Elektr', icon: Zap, color: '#10b981' },
];

export default function AddStationModal({ isOpen, onClose, onSave, editStation }) {
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);

  // Form states
  const [stationType, setStationType] = useState('');
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
    const [fuelPrices, setFuelPrices] = useState({});
  const [phone, setPhone] = useState('+998 ');
  
  // Map states
  const [mapPos, setMapPos] = useState(null);
  const [address, setAddress] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isAddressCorrect, setIsAddressCorrect] = useState(null);
  
  // Final states
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  
  const imgInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setStationType('');
      setName('');
      setSelectedTypes([]);
        setFuelPrices({});
      setPhone('+998 ');
      setMapPos([41.311081, 69.240562]); // Default Tashkent
      setAddress(null);
      setLocationConfirmed(false);
      setIsAddressCorrect(null);
      setDescription('');
      setImages([]);
      setQ1(null);
      setQ2(null);
      
      // Auto locate
      if (navigator.geolocation) {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapPos(coords);
          const addr = await reverseGeocode(coords[0], coords[1]);
          setAddress(addr);
          setLocating(false);
        }, () => { setLocating(false); });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const goToStep = (nextStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 300); // 300ms transition
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
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
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
    const newStation = {
      id: Date.now().toString(),
      name,
      type: selectedTypes,
        prices: Object.fromEntries(
          Object.entries(fuelPrices)
            .map(([k, v]) => [k, parseInt(v)])
            .filter(([k, v]) => !isNaN(v) && v > 0)
        ),
        phone,
      lat: mapPos[0],
      lng: mapPos[1],
      address: address?.full || 'Noma\'lum manzil',
      description,
      images,
      prices: {},
      gasPressure: '',
      dailyNotification: q1,
      priceUpdate: q2
    };
    onSave(newStation);
    onClose();
  };

  // Validation logic
  const isStep2Valid = stationType === 'fuel' && name.trim().length > 2;
  const isStep3Valid = selectedTypes.length > 0 && phone.replace(/\s/g, '').length >= 13;
  const isStep4Valid = isAddressCorrect === true;
  const isStep5Valid = images.length > 0;
  const isStep6Valid = q1 !== null && q2 !== null;

  return (
    <div className="add-station-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
      backgroundColor: 'rgba(240, 243, 246, 0.7)', backdropFilter: 'blur(10px)',
      overflowY: 'auto'
    }}>
      <div className={`auth-neu-card ${animating ? 'step-exit' : 'step-enter'}`} style={{margin: 'auto'}}>
        
        {step === 1 && (
          <div className="wizard-step">
            <div className="auth-neu-header">
              <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px'}}>
                <MapPin color="#0ea5e9" size={28} />
                <h2>Joylashuv qo'shish</h2>
              </div>
              <p>O'zingizga tegishli yoki xaritada mavjud bo'lmagan yangi joylashuvni dasturga qo'shishingiz mumkin.</p>
            </div>
            
            <h3 style={{textAlign:'center', color:'#334155', margin:'30px 0'}}>Joylashuv qo'shmoqchimisiz?</h3>
            
            <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
              <button className="neu-secondary-btn" style={{flex:1}} onClick={onClose}>
                Yo'q
              </button>
              <button className="neu-submit-btn" style={{flex:1, marginTop:0}} onClick={() => goToStep(2)}>
                Ha
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <div className="auth-neu-header">
              <h2>Manzil turi</h2>
              <p>Joylashuv qanday turdagi manzil?</p>
            </div>

            <div className="neu-form-group" style={{marginBottom:'20px'}}>
              <div 
                className="neu-input-wrapper" 
                style={{cursor:'pointer', padding:'15px', display:'flex', alignItems:'center', gap:'10px',
                background: stationType === 'fuel' ? '#e2e8f0' : '#f0f3f6',
                boxShadow: stationType === 'fuel' ? 'inset 5px 5px 10px #cbd5e1, inset -5px -5px 10px #ffffff' : '5px 5px 10px #d1d5db, -5px -5px 10px #ffffff',
                border: '2px solid transparent'}}
                onClick={() => setStationType('fuel')}
              >
                <Fuel color={stationType === 'fuel' ? '#0ea5e9' : '#94a3b8'} />
                <span style={{fontWeight:'bold', color: stationType === 'fuel' ? '#0ea5e9' : '#334155'}}>Yoqilg'i shahobchasi</span>
              </div>
              
              <div style={{marginTop:'15px', textAlign:'center'}}>
                <span style={{color:'#334155', fontSize: '13px', fontWeight: '500'}}>Boshqa manzillar ustida ishlanmoqda...</span>
              </div>
            </div>

            {stationType === 'fuel' && (
              <div className="neu-form-group slide-in-down" style={{marginBottom:'20px'}}>
                <label>Yoqilg'i shahobchasi nomi</label>
                <div className="neu-input-wrapper">
                  <Type className="neu-icon" size={18} />
                  <input type="text" placeholder="Masalan: Mustang, UzGazOil..." value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div style={{display:'flex', gap:'15px'}}>
              <button className="neu-secondary-btn" onClick={() => goToStep(1)}>Orqaga</button>
              <button className="neu-submit-btn" style={{flex:1, marginTop:0}} disabled={!isStep2Valid} onClick={() => goToStep(3)}>
                Keyingisi <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <div className="auth-neu-header">
              <h2>Yoqilg'i turlari</h2>
              <p>Avval yoqilg'i shahobchangizda qanday turdagi yoqilg'i sotiladi?</p>
            </div>

            <div className="neu-form-group" style={{marginBottom:'25px'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                {FUEL_TYPES.map(ft => {
                  const Icon = ft.icon;
                  const isActive = selectedTypes.includes(ft.id);
                  return (
                    <div 
                      key={ft.id}
                      className="neu-input-wrapper"
                      style={{
                        cursor:'pointer', padding:'12px', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px',
                        boxShadow: isActive ? 'inset 5px 5px 10px #d1d5db, inset -5px -5px 10px #ffffff' : '5px 5px 10px #d1d5db, -5px -5px 10px #ffffff',
                        background: isActive ? ft.color : 'transparent',
                        color: isActive ? '#fff' : '#475569'
                      }}
                      onClick={() => toggleType(ft.id)}
                    >
                      <Icon size={18} />
                      <span style={{fontWeight:'bold', fontSize:'13px'}}>{ft.label}</span>
                    </div>
                  );
                })}
              </div>
              </div>

              {selectedTypes.length > 0 && (
                <div style={{marginTop:'20px', marginBottom: '20px'}}>
                  <h4 style={{fontSize:'14px', color:'#334155', marginBottom:'10px'}}>Yoqilg'i narxlarini kiriting:</h4>
                  {selectedTypes.map(typeId => {
                    const label = FUEL_TYPES.find(f => f.id === typeId)?.label || typeId;
                    return (
                      <div key={typeId} className="neu-form-group" style={{marginBottom:'10px'}}>
                        <div className="neu-input-wrapper">
                          <input 
                            type="number" 
                            className="neu-input" 
                            placeholder={`${label} narxi (so'm)`}
                            value={fuelPrices[typeId] || ''}
                            onChange={(e) => setFuelPrices({...fuelPrices, [typeId]: e.target.value})}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="neu-form-group" style={{marginBottom:'25px'}}>
              <label>Ish boshqaruvchi (menejer) telefon raqami</label>
              <div className="neu-input-wrapper">
                <Phone className="neu-icon" size={18} />
                <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)} />
              </div>
            </div>

            <div style={{display:'flex', gap:'15px'}}>
              <button className="neu-secondary-btn" onClick={() => goToStep(2)}>Orqaga</button>
              <button className="neu-submit-btn" style={{flex:1, marginTop:0}} disabled={!isStep3Valid} onClick={() => goToStep(4)}>
                Keyingisi <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step">
            <div className="auth-neu-header">
              <h2>Aniq manzil</h2>
              <p>Yoqilg'i shahobchangizni aniq manzilini kiriting</p>
            </div>

            {isAddressCorrect !== true ? (
              <>
                <div style={{height: '250px', borderRadius: '20px', overflow: 'hidden', boxShadow: 'inset 5px 5px 10px #d1d5db, inset -5px -5px 10px #ffffff', marginBottom: '15px'}}>
                  {mapPos && (
                    <MapContainer center={mapPos} zoom={15} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={mapPos} icon={locationIcon} />
                      <MapClickHandler onLocationSelect={handleMapClick} />
                      <FlyToPos position={mapPos} />
                    </MapContainer>
                  )}
                </div>
                
                <div className="neu-input-wrapper" style={{padding:'15px', marginBottom:'15px', textAlign:'center', cursor:'pointer'}} onClick={() => setLocationConfirmed(true)}>
                  <MapPin color="#0ea5e9" size={18} style={{marginRight:'8px'}}/>
                  <span style={{fontWeight:'bold', color:'#0ea5e9'}}>Joylashuvni tasdiqlash</span>
                </div>

                {locationConfirmed && address && (
                  <div className="slide-in-down">
                    <div style={{textAlign:'center', marginBottom:'15px'}}>
                      <p style={{fontSize:'13px', color:'#64748b', marginBottom:'5px'}}>Tanlangan manzil:</p>
                      <h4 style={{color:'#334155'}}>{address.full}</h4>
                    </div>
                    <div style={{textAlign:'center', marginBottom:'15px'}}>
                      <p style={{fontWeight:'bold', color:'#334155', marginBottom:'10px'}}>Shu to'g'rimi?</p>
                      <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                        <button className="neu-secondary-btn" style={{flex:1}} onClick={() => { setLocationConfirmed(false); setIsAddressCorrect(false); }}>Yo'q</button>
                        <button className="neu-submit-btn" style={{flex:1, marginTop:0}} onClick={() => setIsAddressCorrect(true)}>Ha</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="slide-in-down" style={{textAlign:'center', marginBottom:'25px'}}>
                <div className="neu-input-wrapper" style={{padding:'20px', display:'flex', flexDirection:'column', gap:'10px', alignItems:'center'}}>
                  <Check color="#10b981" size={40} />
                  <h3 style={{color:'#334155', margin:0}}>Manzil tasdiqlandi</h3>
                  <p style={{color:'#64748b', fontSize:'13px', margin:0}}>{address?.full}</p>
                  <button className="neu-secondary-btn" style={{padding:'8px 15px', fontSize:'12px', marginTop:'10px'}} onClick={() => setIsAddressCorrect(false)}>
                    O'zgartirish
                  </button>
                </div>
              </div>
            )}

            <div style={{display:'flex', gap:'15px', marginTop:'20px'}}>
              <button className="neu-secondary-btn" onClick={() => goToStep(3)}>Orqaga</button>
              <button className="neu-submit-btn" style={{flex:1, marginTop:0}} disabled={!isStep4Valid} onClick={() => goToStep(5)}>
                Keyingisi <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="wizard-step">
            <div className="auth-neu-header">
              <h2>Ma'lumotlar</h2>
              <p>Shahobchangiz haqida yozing</p>
            </div>

            <div className="neu-form-group" style={{marginBottom:'20px'}}>
              <div className="neu-input-wrapper" style={{padding:'0'}}>
                <textarea 
                  placeholder="Foydalanuvchilar ko'rishi uchun qisqacha ma'lumot..." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{width:'100%', background:'transparent', border:'none', outline:'none', padding:'15px', minHeight:'80px', color:'#334155', resize:'none'}}
                />
              </div>
            </div>

            <div className="neu-form-group" style={{marginBottom:'20px'}}>
              <label>Rasmlar (5 tagacha rasm qo'yish mumkin)</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px'}}>
                {images.map((img, idx) => (
                  <div key={idx} style={{position:'relative', aspectRatio:'1', borderRadius:'15px', overflow:'hidden', boxShadow:'4px 4px 8px #d1d5db, -4px -4px 8px #ffffff'}}>
                    <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    <button onClick={() => removeImage(idx)} style={{position:'absolute', top:'5px', right:'5px', background:'rgba(255,255,255,0.8)', border:'none', borderRadius:'50%', padding:'5px', cursor:'pointer', color:'#ef4444'}}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <div 
                    onClick={() => imgInputRef.current?.click()}
                    style={{aspectRatio:'1', borderRadius:'15px', display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer',
                    boxShadow:'5px 5px 10px #d1d5db, -5px -5px 10px #ffffff', color:'#94a3b8'}}
                  >
                    <Plus size={24} />
                  </div>
                )}
              </div>
              <input ref={imgInputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleImageUpload} />
            </div>

            <div style={{display:'flex', gap:'15px'}}>
              <button className="neu-secondary-btn" onClick={() => goToStep(4)}>Orqaga</button>
              {isStep5Valid ? (
                <button className="neu-submit-btn slide-in-down" style={{flex:1, marginTop:0}} onClick={() => goToStep(6)}>
                  <Check size={18} /> Ma'lumotlarni tasdiqlash
                </button>
              ) : (
                <button className="neu-submit-btn" style={{flex:1, marginTop:0}} disabled>
                  Keyingisi <ChevronRight size={18}/>
                </button>
              )}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="wizard-step">
            <div className="auth-neu-header">
              <h2>So'nggi qadam</h2>
              <p>Iltimos, quyidagi savollarga javob bering</p>
            </div>

            <div className="neu-form-group" style={{marginBottom:'25px'}}>
              <label style={{fontSize:'13px', lineHeight:'1.4', marginBottom:'10px'}}>
                Har kuni yoqilg'i shahobchangiz ochiq yoki yopiqligini tasdiqlab tura olasizmi?
              </label>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="neu-secondary-btn" style={{flex:1, background: q1 === true ? '#10b981' : '', color: q1 === true ? '#fff' : ''}} onClick={() => setQ1(true)}>Ha</button>
                <button className="neu-secondary-btn" style={{flex:1, background: q1 === false ? '#ef4444' : '', color: q1 === false ? '#fff' : ''}} onClick={() => setQ1(false)}>Yo'q</button>
              </div>
            </div>

            <div className="neu-form-group" style={{marginBottom:'25px'}}>
              <label style={{fontSize:'13px', lineHeight:'1.4', marginBottom:'10px'}}>
                Yoqilg'i narxi tushayotgan yoki ko'tarilayotgan bo'lsa, aniq narxlarni har kuni yozib yura olasizmi?
              </label>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="neu-secondary-btn" style={{flex:1, background: q2 === true ? '#10b981' : '', color: q2 === true ? '#fff' : ''}} onClick={() => setQ2(true)}>Ha</button>
                <button className="neu-secondary-btn" style={{flex:1, background: q2 === false ? '#ef4444' : '', color: q2 === false ? '#fff' : ''}} onClick={() => setQ2(false)}>Yo'q</button>
              </div>
            </div>

            <div style={{display:'flex', gap:'15px', marginTop:'30px'}}>
              <button className="neu-secondary-btn" onClick={() => goToStep(5)}>Orqaga</button>
              <button className="neu-submit-btn" style={{flex:1, marginTop:0}} disabled={!isStep6Valid} onClick={handleSubmit}>
                <Check size={18} /> Tasdiqlash
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


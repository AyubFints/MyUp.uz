export const CITIES = [
  { id: 'tashkent', name: 'Toshkent shahri', lat: 41.311081, lng: 69.240562 },
  { id: 'samarkand', name: 'Samarqand', lat: 39.654167, lng: 66.959722 },
  { id: 'bukhara', name: 'Buxoro', lat: 39.774722, lng: 64.428611 },
  { id: 'fergana', name: "Farg'ona", lat: 40.384211, lng: 71.784322 },
  { id: 'andijan', name: 'Andijon', lat: 40.782056, lng: 72.344247 },
  { id: 'namangan', name: 'Namangan', lat: 40.9983, lng: 71.6726 },
];

export const FUEL_TYPES = [
  { id: 'all', label: 'Barchasi', icon: 'Zap' },
  { id: 'metan', label: 'Metan (CNG)', icon: 'Flame', color: '#0ea5e9' },
  { id: 'propan', label: 'Propan (LPG)', icon: 'Fuel', color: '#a855f7' },
  { id: 'benzin', label: 'Benzin (AI)', icon: 'Droplets', color: '#f59e0b' },
  { id: 'elektr', label: 'Elektr (EV)', icon: 'Zap', color: '#10b981' },
];

export const CATEGORIES = [
  { id: 'fuel', label: 'Yoqilg\'i', icon: 'Fuel', color: '#0ea5e9' },
  { id: 'service', label: 'Servis', icon: 'Wrench', color: '#f59e0b' },
  { id: 'food', label: 'Oshxona', icon: 'Utensils', color: '#10b981' },
  { id: 'medical', label: 'Tibbiyot', icon: 'Cross', color: '#ef4444' },
];

export const MOCK_NEWS = [
  {
    id: 1,
    title: "Metan gaz bosimi barqaror",
    desc: "Toshkent shahridagi AGTKSh shahobchalarida gaz bosimi 200-210 atm darajasida me'yorda ishlamoqda.",
    date: "Bugun",
    tag: "Metan",
    tagColor: "#0ea5e9",
  },
  {
    id: 2,
    title: "Yangi EV tez quvvatlash stansiyasi",
    desc: "Yunusobod tumanida 120 kVt quvvatga ega yangi elektr zaryadlash stansiyasi ishga tushirildi.",
    date: "Kecha",
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

// Startap dastlabki holatida hech qanday manzil ko'rsatilmasligi uchun ro'yxat bo'shatildi
export const INITIAL_STATIONS = [];

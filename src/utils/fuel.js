// Asosiy standart benzin markalari (A-92, A-90, A-95)
export const BENZIN_GRADES = [
  { id: 'ai92', label: 'A-92', badge: 'AI-92', defaultPrice: 10500 },
  { id: 'ai90', label: 'A-90', badge: 'AI-90', defaultPrice: 9800 },
  { id: 'ai95', label: 'A-95', badge: 'AI-95', defaultPrice: 12500 },
];

/**
 * Marka nomini chiroyli formatlash: "ai89" -> "A-89", "a89" -> "A-89", "a-89" -> "A-89"
 */
export function formatBenzinLabel(key) {
  if (!key) return '';
  const clean = String(key).trim();
  const lower = clean.toLowerCase();
  
  const m = lower.match(/^a(?:i)?[-_]?([0-9]{2,3})$/);
  if (m) {
    return `A-${m[1]}`;
  }
  if (lower === 'benzin') return 'A-92';
  return clean.toUpperCase();
}

/**
 * Marka kalitini normalizatsiya qilish: "A-89", "a89", "a_89" -> "ai89"
 */
export function normalizeBenzinKey(raw) {
  if (!raw) return '';
  const clean = String(raw).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.startsWith('a') && !clean.startsWith('ai') && !isNaN(clean.slice(1))) {
    return 'ai' + clean.slice(1);
  }
  return clean;
}

/**
 * Shahobchaning aniq benzin turlari va narxlarini qaytaruvchi yordamchi
 * (Har bir shahobchadagi A-92, A-90, A-89, A-95 va h.k. narxlarini dinamik oladi)
 */
export function getStationBenzinPrices(station) {
  if (!station) return [];
  const prices = station.prices || {};
  const basePrice = Number(prices.benzin) || Number(prices.ai92) || 10500;

  // 1. Shahobchaning narxlar obyektidagi barcha benzin markalarini qidirish
  const foundGrades = [];
  const seenIds = new Set();

  Object.keys(prices).forEach((key) => {
    const normKey = normalizeBenzinKey(key);
    // Metan, propan, elektr va boshqa yoqilg'ilarni o'tkazib yuboramiz
    if (['metan', 'propan', 'elektr', 'dizel', 'gas', 'tok'].includes(normKey)) return;

    if (/^a(?:i)?[-_]?[0-9]+/i.test(key) || normKey.startsWith('ai')) {
      const pVal = Number(prices[key]);
      if (pVal > 0 && !seenIds.has(normKey)) {
        seenIds.add(normKey);
        const lbl = formatBenzinLabel(key);
        foundGrades.push({
          id: normKey,
          label: lbl,
          badge: lbl,
          price: pVal,
          isCustom: !['ai92', 'ai90', 'ai95'].includes(normKey),
        });
      }
    }
  });

  // 2. Agar aniq markalar saqlanmagan bo'lsa, ammo benzin sotilsa - standart markalarni beramiz
  if (foundGrades.length === 0 && stationMatchesFuel(station, 'benzin')) {
    return [
      {
        id: 'ai92',
        label: 'A-92',
        badge: 'A-92',
        price: Number(prices.ai92) || Number(prices.benzin) || 10500,
        isCustom: false,
      },
      {
        id: 'ai90',
        label: 'A-90',
        badge: 'A-90',
        price: Number(prices.ai90) || Number(prices.ai80) || (basePrice ? Math.round((basePrice * 0.93) / 100) * 100 : 9800),
        isCustom: false,
      },
      {
        id: 'ai95',
        label: 'A-95',
        badge: 'A-95',
        price: Number(prices.ai95) || (basePrice ? Math.round((basePrice * 1.19) / 100) * 100 : 12500),
        isCustom: false,
      },
    ];
  }

  // Oktan soni bo'yicha saralash (80, 89, 90, 92, 95, 98, 100...)
  foundGrades.sort((a, b) => {
    const numA = parseInt(a.label.replace(/\D/g, ''), 10) || 92;
    const numB = parseInt(b.label.replace(/\D/g, ''), 10) || 92;
    return numA - numB;
  });

  return foundGrades;
}

/**
 * Mavjud shahobchalardan benzin markalarining umumiy/eng arzon narxlarini hisoblash
 */
export function getBenzinSummaryPrices(stations = []) {
  const benzinStations = (stations || []).filter((s) => stationMatchesFuel(s, 'benzin'));

  const gradeMap = new Map();

  // Standart markalarni kiritish
  BENZIN_GRADES.forEach((bg) => {
    gradeMap.set(bg.id, {
      id: bg.id,
      label: bg.label,
      badge: bg.badge,
      bestPrice: null,
      defaultPrice: bg.defaultPrice,
    });
  });

  // Shahobchalardagi barcha maxsus va standart markalarni yig'ish (A-89, A-90, A-92, A-95...)
  benzinStations.forEach((st) => {
    const gList = getStationBenzinPrices(st);
    gList.forEach((g) => {
      if (!gradeMap.has(g.id)) {
        gradeMap.set(g.id, {
          id: g.id,
          label: g.label,
          badge: g.badge || g.label,
          bestPrice: g.price,
          defaultPrice: g.price || 10500,
        });
      }
      const existing = gradeMap.get(g.id);
      if (g.price > 0 && (existing.bestPrice === null || g.price < existing.bestPrice)) {
        existing.bestPrice = g.price;
      }
    });
  });

  const allSummary = Array.from(gradeMap.values()).map((grade) => {
    const finalPrice = grade.bestPrice || grade.defaultPrice;
    return {
      ...grade,
      price: finalPrice,
      formattedPrice: `${Number(finalPrice).toLocaleString('ru-RU').replace(',', ' ')} so'm`,
    };
  });

  allSummary.sort((a, b) => {
    const numA = parseInt(a.label.replace(/\D/g, ''), 10) || 92;
    const numB = parseInt(b.label.replace(/\D/g, ''), 10) || 92;
    return numA - numB;
  });

  return allSummary;
}

// Yoqilg'i turlari va filtr mosligini tekshirish funksiyasi
export function stationMatchesFuel(st, fuel) {
  if (!fuel || fuel === 'all') return true;
  if (!st || typeof st !== 'object') return false;

  const target = fuel.toLowerCase();

  // 1. To'plangan barcha yoqilg'i turlari
  const typeList = [];
  if (Array.isArray(st.types)) typeList.push(...st.types);
  if (Array.isArray(st.type)) typeList.push(...st.type);
  if (typeof st.type === 'string') typeList.push(st.type);
  if (typeof st.fuelType === 'string') typeList.push(st.fuelType);
  if (Array.isArray(st.fuelTypes)) typeList.push(...st.fuelTypes);

  const cleanList = typeList.map((t) => String(t).toLowerCase());

  // 2. Narxlar obyekti (son yoki satr, masalan "5500.00")
  const prices = st.prices && typeof st.prices === 'object' ? st.prices : {};

  // Benzin umumiy
  if (target === 'benzin') {
    if (cleanList.some((t) => t.includes('benzin') || t.includes('ai80') || t.includes('ai89') || t.includes('ai90') || t.includes('ai92') || t.includes('ai95') || t.includes('ai98'))) return true;
    if (Number(prices.benzin) > 0 || Number(prices.ai92) > 0 || Number(prices.ai90) > 0 || Number(prices.ai89) > 0 || Number(prices.ai95) > 0 || Number(prices.ai80) > 0 || Number(prices.ai98) > 0) return true;
    return false;
  }

  // Aniq benzin markalari (A-92, A-90, A-95, A-89 va h.k.)
  if (target.startsWith('ai') || target.startsWith('a')) {
    const norm = normalizeBenzinKey(target);
    const bGrades = getStationBenzinPrices(st);
    if (bGrades.some((g) => g.id === norm || g.id === target || g.label.toLowerCase() === target)) {
      return true;
    }
    return stationMatchesFuel(st, 'benzin');
  }

  if (target === 'gaz') {
    return stationMatchesFuel(st, 'metan') || stationMatchesFuel(st, 'propan');
  }

  if (target === 'metan') {
    if (cleanList.some((t) => t === 'metan' || t.includes('metan') || t.includes('cng'))) return true;
    if (Number(prices.metan) > 0 || Number(prices.cng) > 0) return true;
    return false;
  }

  if (target === 'propan') {
    if (cleanList.some((t) => t === 'propan' || t.includes('propan') || t.includes('lpg'))) return true;
    if (Number(prices.propan) > 0 || Number(prices.lpg) > 0) return true;
    return false;
  }

  if (target === 'elektr' || target === 'electric' || target === 'ev') {
    if (cleanList.some((t) => t === 'elektr' || t === 'electric' || t.includes('elektr') || t.includes('electric') || t.includes('ev') || t.includes('charge'))) return true;
    if (Number(prices.elektr) > 0 || Number(prices.electric) > 0 || Number(prices.ev) > 0) return true;
    return false;
  }

  if (cleanList.some((t) => t === target || t.includes(target))) return true;
  if (Number(prices[target]) > 0) return true;

  return false;
}

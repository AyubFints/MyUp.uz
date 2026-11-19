// Asosiy benzin markalari (A-92, A-90, A-95)
export const BENZIN_GRADES = [
  { id: 'ai92', label: 'A-92', badge: 'AI-92', defaultPrice: 10500 },
  { id: 'ai90', label: 'A-90', badge: 'AI-90', defaultPrice: 9800 },
  { id: 'ai95', label: 'A-95', badge: 'AI-95', defaultPrice: 12500 },
];

/**
 * Shahobchaning aniq benzin turlari va narxlarini qaytaruvchi yordamchi
 */
export function getStationBenzinPrices(station) {
  if (!station) return [];
  const prices = station.prices || {};
  const basePrice = Number(prices.benzin) || Number(prices.ai92) || 10500;

  return [
    {
      id: 'ai92',
      label: 'A-92',
      badge: 'AI-92',
      price: Number(prices.ai92) || Number(prices.benzin) || 10500,
    },
    {
      id: 'ai90',
      label: 'A-90',
      badge: 'AI-90',
      price: Number(prices.ai90) || Number(prices.ai80) || (basePrice ? Math.round((basePrice * 0.93) / 100) * 100 : 9800),
    },
    {
      id: 'ai95',
      label: 'A-95',
      badge: 'AI-95',
      price: Number(prices.ai95) || (basePrice ? Math.round((basePrice * 1.19) / 100) * 100 : 12500),
    },
  ];
}

/**
 * Mavjud shahobchalardan benzin markalarining umumiy/eng arzon narxlarini hisoblash
 */
export function getBenzinSummaryPrices(stations = []) {
  const benzinStations = (stations || []).filter((s) => stationMatchesFuel(s, 'benzin'));

  return BENZIN_GRADES.map((grade) => {
    let bestPrice = null;
    benzinStations.forEach((st) => {
      const gList = getStationBenzinPrices(st);
      const match = gList.find((item) => item.id === grade.id);
      if (match && match.price > 0) {
        if (bestPrice === null || match.price < bestPrice) {
          bestPrice = match.price;
        }
      }
    });

    const finalPrice = bestPrice || grade.defaultPrice;
    return {
      ...grade,
      price: finalPrice,
      formattedPrice: `${Number(finalPrice).toLocaleString('ru-RU').replace(',', ' ')} so'm`,
    };
  });
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
    if (cleanList.some((t) => t.includes('benzin') || t.includes('ai80') || t.includes('ai90') || t.includes('ai92') || t.includes('ai95') || t.includes('ai98'))) return true;
    if (Number(prices.benzin) > 0 || Number(prices.ai92) > 0 || Number(prices.ai90) > 0 || Number(prices.ai95) > 0 || Number(prices.ai80) > 0 || Number(prices.ai98) > 0) return true;
    return false;
  }

  // Aniq benzin markalari (A-92, A-90, A-95)
  if (target === 'ai92' || target === 'a92') {
    return stationMatchesFuel(st, 'benzin');
  }
  if (target === 'ai90' || target === 'a90' || target === 'ai80' || target === 'a80') {
    return stationMatchesFuel(st, 'benzin');
  }
  if (target === 'ai95' || target === 'a95') {
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

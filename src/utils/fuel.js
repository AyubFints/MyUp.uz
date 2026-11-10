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

  if (target === 'benzin') {
    if (cleanList.some((t) => t.includes('benzin') || t.includes('ai80') || t.includes('ai92') || t.includes('ai95') || t.includes('ai98'))) return true;
    if (Number(prices.benzin) > 0 || Number(prices.ai92) > 0 || Number(prices.ai95) > 0 || Number(prices.ai80) > 0 || Number(prices.ai98) > 0) return true;
    return false;
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

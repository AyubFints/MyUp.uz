import baseProtomapsStyle from './protomapsDarkStyle.js';

const DEFAULT_KEY = '9fc0781e9f3a803f';

/**
 * A-Maps rasmiy xarita uslubi (Protomaps Dark Navy Vector).
 * Mahalliy paketlangan holda saqlanadi, shuning uchun tarmoq uzilsa yoki dasturga
 * anchadan keyin qayta kirilsa ham darhol (0ms) yuklanadi va dastur umumiy
 * to'q ko'k / qora dizayni bilan mukammal uyg'unlashadi.
 */
export function getAppMapStyle(customKey) {
  const key =
    customKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PROTOMAPS_KEY) ||
    DEFAULT_KEY;

  try {
    // Chuqur nusxa olish (import qilingan ob'ekt o'zgarmasligi uchun)
    const style = JSON.parse(JSON.stringify(baseProtomapsStyle));

    // Vektorli plitkalar (MVT) manziliga API kalitni o'rnatish
    if (style.sources && style.sources.protomaps) {
      style.sources.protomaps.tiles = [
        `https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt?key=${key}`,
      ];
    }

    // Shahobchalar bilan chalkashmasligi uchun standart POI qatlamlarini chiqarib tashlash
    if (style.layers && Array.isArray(style.layers)) {
      style.layers = style.layers.filter((l) => l['source-layer'] !== 'pois');
    }

    return style;
  } catch (err) {
    console.error('Xarita uslubini yaratishda xatolik:', err);

    // Kutilmagan favqulodda holatda ham CartoDB Dark Matter to'q ko'k uslubi ishlatiladi
    return {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; A-Maps &copy; CartoDB',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  }
}

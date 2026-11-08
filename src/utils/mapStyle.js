import baseProtomapsStyle from './protomapsLightStyle.js';

const DEFAULT_KEY = '9fc0781e9f3a803f';

/**
 * A-Maps rasmiy xarita uslubi (Protomaps Light Vector).
 * Mahalliy paketlangan holda saqlanadi, shuning uchun tarmoq uzilsa yoki dasturga
 * anchadan keyin qayta kirilsa ham darhol (0ms) yuklanadi va hech qachon
 * Super Admin'dagi rang-barang OpenStreetMap xaritasiga o'tib ketmaydi.
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

    // Kutilmagan favqulodda holatda ham Super Admin'dagi xom OSM emas,
    // A-Maps dizayniga 100% mos toza och CartoDB Positron uslubi ishlatiladi
    return {
      version: 8,
      sources: {
        'carto-light': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; A-Maps',
        },
      },
      layers: [
        {
          id: 'carto-light-layer',
          type: 'raster',
          source: 'carto-light',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  }
}

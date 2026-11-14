import fs from 'fs';
import path from 'path';
import { query } from '../server/src/config/db.js';

async function extract() {
  const dir = path.resolve('public/ads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. REKLAMALARNI EKSPORT QILISH
  const r = await query('SELECT * FROM ads WHERE is_active = true ORDER BY created_at ASC');
  const adsData = [];

  for (let i = 0; i < r.rows.length; i++) {
    const row = r.rows[i];
    let mediaUrl = row.video_url;

    if (mediaUrl && mediaUrl.startsWith('data:video/')) {
      const parts = mediaUrl.split('base64,');
      if (parts[1]) {
        const buf = Buffer.from(parts[1], 'base64');
        const fileName = 'ad-' + (i + 1) + '.webm';
        fs.writeFileSync(path.join(dir, fileName), buf);
        mediaUrl = '/ads/' + fileName;
        console.log('Saved ' + fileName + ' (' + buf.length + ' bytes)');
      }
    }

    adsData.push({
      id: row.id,
      title: row.title,
      description: row.description || '',
      video_url: mediaUrl,
      media_url: mediaUrl,
      target_link: row.target_link || '',
      side: row.side || 'both',
      is_active: row.is_active,
      views_count: row.views_count || 0,
      clicks_count: row.clicks_count || 0,
      price_uzs: row.price_uzs || '100.00',
      advertiser_name: row.advertiser_name || 'AX-Map Hamkor',
      brand: row.advertiser_name || 'AX-Map Hamkor',
      phone: row.advertiser_phone || '+998 77 278 18 08',
      advertiser_phone: row.advertiser_phone || '+998 77 278 18 08',
      created_at: row.created_at,
    });
  }

  fs.writeFileSync('src/data/defaultAds.js', 'export const DEFAULT_ACTIVE_ADS = ' + JSON.stringify(adsData, null, 2) + ';\n');
  console.log('Saved src/data/defaultAds.js with ' + adsData.length + ' ads');

  // 2. BARCHA TASDIQLANGAN SHAHOBCHALARNI OLISH
  const stQuery = `
    SELECT 
      s.id, s.name, s.lat, s.lng, s.address, s.city, s.phone,
      s.is_open AS "isOpen", s.reopen_time AS "reopenTime",
      s.rating, s.rating_count AS "ratingCount", s.owner_id AS "ownerId",
      s.is_approved AS "isApproved", s.status, s.rejected_at AS "rejectedAt", s.created_at AS "createdAt",
      s.description, s.images, s.verification_images AS "verificationImages", s.types, s.gas_pressure AS "gasPressure",
      COALESCE(
        json_object_agg(
          fp.fuel_type, fp.price
        ) FILTER (WHERE fp.fuel_type IS NOT NULL AND fp.is_available = true), '{}'::json
      ) AS prices,
      COALESCE(
        json_object_agg(
          fp.fuel_type, fp.pressure_atm
        ) FILTER (WHERE fp.fuel_type IS NOT NULL AND fp.pressure_atm > 0), '{}'::json
      ) AS pressures,
      to_jsonb(sa.*) - 'station_id' AS amenities,
      to_jsonb(sp.*) - 'station_id' AS payments
    FROM stations s
    LEFT JOIN fuel_prices fp ON s.id = fp.station_id
    LEFT JOIN station_amenities sa ON s.id = sa.station_id
    LEFT JOIN station_payments sp ON s.id = sp.station_id
    WHERE s.is_approved = true
    GROUP BY s.id, sa.station_id, sp.station_id
    ORDER BY s.created_at DESC
  `;

  const stRes = await query(stQuery);
  const stationsList = stRes.rows.map(st => {
    const typeList = Array.isArray(st.types) && st.types.length > 0 
      ? st.types 
      : Object.keys(st.prices || {});
    const metanP = st.pressures?.metan || st.gasPressure || (typeList.includes('metan') ? 200 : null);
    return {
      ...st,
      type: typeList,
      gasPressure: metanP,
      images: Array.isArray(st.images) && st.images.length > 0 
        ? st.images 
        : ['https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=600&q=80'],
    };
  });

  fs.writeFileSync('src/data/defaultStations.js', 'export const DEFAULT_APPROVED_STATIONS = ' + JSON.stringify(stationsList, null, 2) + ';\n');
  console.log('Saved src/data/defaultStations.js with ' + stationsList.length + ' stations');

  process.exit(0);
}

extract().catch(e => {
  console.error(e);
  process.exit(1);
});

import { query } from '../config/db.js';

// Barcha shahobchalarni olish (masofa hisoblash va filtrlar bilan)
export const getAllStations = async (req, res) => {
  try {
    const { userLat, userLng, fuelType, city, all } = req.query;
    const includeAll = all === 'true' || (req.user && req.user.role === 'super_admin');

    let baseQuery = `
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
      WHERE 1=1
    `;

    const params = [];
    if (!includeAll) {
      baseQuery += ` AND s.is_approved = true`;
    } else {
      baseQuery += ` AND (s.rejected_at IS NULL OR s.rejected_at >= NOW() - INTERVAL '1 day')`;
    }

    if (city) {
      params.push(city);
      baseQuery += ` AND s.city = $${params.length}`;
    }

    baseQuery += ` GROUP BY s.id, sa.station_id, sp.station_id ORDER BY s.created_at DESC`;

    const result = await query(baseQuery, params);
    let stations = result.rows.map((st) => {
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

    // Masofani hisoblash (Haversine km)
    if (userLat && userLng) {
      const uLat = parseFloat(userLat);
      const uLng = parseFloat(userLng);

      stations = stations.map((st) => {
        const R = 6371;
        const dLat = ((st.lat - uLat) * Math.PI) / 180;
        const dLng = ((st.lng - uLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((uLat * Math.PI) / 180) *
            Math.cos((st.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;
        return {
          ...st,
          distance: parseFloat(distanceKm.toFixed(1)),
        };
      });

      stations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    res.json({ success: true, count: stations.length, stations });
  } catch (err) {
    console.error('GetAllStations xatosi:', err);
    res.status(500).json({ success: false, message: 'Shahobchalarni yuklashda xatolik: ' + err.message });
  }
};

// Yangi shahobcha qo'shish
export const createStation = async (req, res) => {
  try {
    const {
      name,
      lat,
      lng,
      address,
      city,
      phone,
      isOpen,
      reopenTime,
      prices,
      pressures,
      gasPressure,
      types,
      description,
      images,
      verificationImages,
      amenities,
      payments,
    } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Nomi va geolokatsiya (lat/lng) kiritilishi shart.' });
    }

    const ownerId = req.user ? req.user.id : null;
    // Super admin yaratgan shahobcha avtomatik tasdiqlanadi
    const isApproved = req.user ? (req.user.role === 'super_admin') : false;

    const normalizedTypes = Array.isArray(types) && types.length > 0
      ? types
      : (prices && typeof prices === 'object' ? Object.keys(prices) : ['metan']);

    const finalGasPressure = Number(gasPressure || pressures?.metan || 200);

    // 1. Shahobcha yaratish
    const stResult = await query(
      `INSERT INTO stations (
        name, lat, lng, address, city, phone, is_open, reopen_time,
        owner_id, is_approved, description, images, types, gas_pressure, verification_images
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        name.trim(),
        parseFloat(lat),
        parseFloat(lng),
        address || 'Toshkent shahri',
        city || 'Toshkent',
        phone || '',
        isOpen ?? true,
        reopenTime || '',
        ownerId,
        isApproved,
        description || '',
        JSON.stringify(Array.isArray(images) && images.length > 0 ? images : []),
        JSON.stringify(normalizedTypes),
        finalGasPressure,
        JSON.stringify({
          exterior: verificationImages?.exterior || (Array.isArray(images) ? images[0] : '') || '',
          interior: verificationImages?.interior || (Array.isArray(images) ? images[1] : '') || '',
          roadside: verificationImages?.roadside || (Array.isArray(images) ? images[2] : '') || '',
        }),
      ]
    );

    const station = stResult.rows[0];

    // 2. Yoqilg'i narxlarini saqlash
    const savedPrices = {};
    const savedPressures = {};

    if (prices && typeof prices === 'object') {
      for (const [fuelType, pData] of Object.entries(prices)) {
        if (pData !== undefined && pData !== null) {
          const price = typeof pData === 'object' ? Number(pData.price || 0) : Number(pData || 0);
          const pressure = typeof pData === 'object' 
            ? Number(pData.pressure || pData.pressure_atm || 0) 
            : Number(pressures?.[fuelType] || (fuelType === 'metan' ? finalGasPressure : 0));

          if (price > 0 || pressure > 0) {
            await query(
              `INSERT INTO fuel_prices (station_id, fuel_type, price, pressure_atm, is_available)
               VALUES ($1, $2, $3, $4, true)
               ON CONFLICT (station_id, fuel_type) DO UPDATE SET price = $3, pressure_atm = $4, is_available = true`,
              [station.id, fuelType, price, pressure]
            );
            savedPrices[fuelType] = price;
            if (pressure > 0) savedPressures[fuelType] = pressure;
          }
        }
      }
    }

    // 3. Qulayliklarni saqlash
    let savedAmenities = null;
    if (amenities && typeof amenities === 'object') {
      const amRes = await query(
        `INSERT INTO station_amenities (station_id, coffee, toilet, shop, car_wash, prayer_room, wifi, food, tires)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (station_id) DO UPDATE SET 
           coffee = $2, toilet = $3, shop = $4, car_wash = $5, prayer_room = $6, wifi = $7, food = $8, tires = $9
         RETURNING coffee, toilet, shop, car_wash AS "carWash", prayer_room AS "prayerRoom", wifi, food, tires`,
        [
          station.id,
          Boolean(amenities.coffee),
          Boolean(amenities.toilet),
          Boolean(amenities.shop),
          Boolean(amenities.car_wash || amenities.carWash),
          Boolean(amenities.prayer_room || amenities.prayerRoom),
          Boolean(amenities.wifi),
          Boolean(amenities.food),
          Boolean(amenities.tires),
        ]
      );
      savedAmenities = amRes.rows[0];
    }

    // 4. To'lov turlarini saqlash
    let savedPayments = null;
    if (payments && typeof payments === 'object') {
      const pmRes = await query(
        `INSERT INTO station_payments (station_id, cash, uzcard, humo, visa, mastercard)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (station_id) DO UPDATE SET
           cash = $2, uzcard = $3, humo = $4, visa = $5, mastercard = $6
         RETURNING cash, uzcard, humo, visa, mastercard`,
        [
          station.id,
          payments.cash !== false,
          payments.uzcard !== false,
          payments.humo !== false,
          Boolean(payments.visa),
          Boolean(payments.mastercard),
        ]
      );
      savedPayments = pmRes.rows[0];
    }

    const fullStation = {
      id: station.id,
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      address: station.address,
      city: station.city,
      phone: station.phone,
      isOpen: station.is_open,
      reopenTime: station.reopen_time,
      rating: parseFloat(station.rating || 5.0),
      ratingCount: station.rating_count || 1,
      ownerId: station.owner_id,
      isApproved: station.is_approved,
      description: station.description,
      images: Array.isArray(station.images) ? station.images : (images || []),
      verificationImages: station.verification_images || verificationImages || {},
      types: normalizedTypes,
      type: normalizedTypes,
      gasPressure: finalGasPressure,
      prices: savedPrices,
      pressures: savedPressures,
      amenities: savedAmenities || amenities || {},
      payments: savedPayments || payments || {},
      createdAt: station.created_at,
    };

    res.status(201).json({
      success: true,
      station: fullStation,
      message: isApproved ? 'Shahobcha ma\'lumotlar bazasiga saqlandi!' : 'Shahobcha yuborildi, admin tasdig\'i kutilmoqda.',
    });
  } catch (err) {
    console.error('CreateStation xatosi:', err);
    res.status(500).json({ success: false, message: 'Shahobcha saqlashda server xatoligi: ' + err.message });
  }
};

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Holatni yangilash (ochiq/yopiq, ochilish vaqti, telefon)
export const updateStationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(404).json({ success: false, message: 'Shahobcha topilmadi.' });
    }
    const { isOpen, reopenTime, phone } = req.body;

    const result = await query(
      `UPDATE stations
       SET is_open = COALESCE($1, is_open),
           reopen_time = COALESCE($2, reopen_time),
           phone = COALESCE($3, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [isOpen, reopenTime, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shahobcha topilmadi.' });
    }

    res.json({ success: true, station: result.rows[0] });
  } catch (err) {
    console.error('UpdateStationStatus xatosi:', err);
    res.status(500).json({ success: false, message: 'Shahobcha holatini yangilashda xatolik.' });
  }
};

// Yoqilg'i narxi yoki gaz bosimini yangilash
export const updateFuelPrice = async (req, res) => {
  try {
    const { id, fuelType } = req.params;
    if (!isUuid(id)) {
      return res.status(404).json({ success: false, message: 'Shahobcha topilmadi.' });
    }
    const { price, pressure, isAvailable } = req.body;

    const result = await query(
      `INSERT INTO fuel_prices (station_id, fuel_type, price, pressure_atm, is_available, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (station_id, fuel_type) DO UPDATE SET
         price = COALESCE($3, fuel_prices.price),
         pressure_atm = COALESCE($4, fuel_prices.pressure_atm),
         is_available = COALESCE($5, fuel_prices.is_available),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, fuelType, price || 0, pressure || 0, isAvailable ?? true]
    );

    if (fuelType === 'metan' && pressure > 0) {
      await query(`UPDATE stations SET gas_pressure = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [pressure, id]);
    }

    res.json({ success: true, fuel: result.rows[0] });
  } catch (err) {
    console.error('UpdateFuelPrice xatosi:', err);
    res.status(500).json({ success: false, message: 'Yoqilg\'i ma\'lumotini yangilashda xatolik: ' + err.message });
  }
};

// Shahobchani o'chirish (Avtomatik o'chiriladi va sababi feedbacks jadvaliga yoziladi)
export const deleteStation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      // Agar eski frontend xotirasidagi demo ID bo'lsa, xatolik chiqarmasdan muvaffaqiyatli deb qaytarish
      return res.json({ success: true, message: 'Shahobcha muvaffaqiyatli o\'chirildi.' });
    }

    const { reason, authorName, authorPhone, userId } = req.body || {};

    // 1. O'chirilayotgan shahobcha nomini olamiz
    const stRes = await query('SELECT name, address, owner_id FROM stations WHERE id = $1', [id]);
    const stationName = stRes.rows[0]?.name || 'Noma\'lum shahobcha';
    const stationAddress = stRes.rows[0]?.address || '';

    // 2. Shahobchani bazadan butunlay o'chiramiz
    await query('DELETE FROM stations WHERE id = $1', [id]);

    // 3. Agar foydalanuvchi sababini kiritgan bo'lsa, Super Adminga bildirishnoma (feedbacks) sifatida saqlaymiz
    if (reason && String(reason).trim()) {
      const msg = `[O'chirilgan manzil]: ${stationName}${stationAddress ? ` (${stationAddress})` : ''}\n[O'chirish sababi]: ${String(reason).trim()}`;
      const uid = userId || req.user?.id || (isUuid(stRes.rows[0]?.owner_id) ? stRes.rows[0]?.owner_id : null);
      await query(
        `INSERT INTO feedbacks (user_id, author_name, author_phone, type, message, status)
         VALUES ($1, $2, $3, 'shikoyat', $4, 'yangi')`,
        [uid, authorName || 'Foydalanuvchi', authorPhone || '', msg]
      ).catch((e) => console.warn('O\'chirish sababini saqlashda ogohlantirish:', e.message));
    }

    res.json({ success: true, message: 'Shahobcha muvaffaqiyatli o\'chirildi.' });
  } catch (err) {
    console.error('DeleteStation xatosi:', err);
    res.status(500).json({ success: false, message: 'Shahobchani o\'chirishda xatolik.' });
  }
};

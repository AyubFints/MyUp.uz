import { query } from '../config/db.js';
import { getLiveTrafficStats } from './analyticsController.js';

// Super Admin Asosiy Statistikasi (Dashboard Stats)
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Foydalanuvchilar, Shahobchalar va Jonli trafik
    const [usersCount, stationsCount, openStationsCount, pendingStationsCount, feedbacksCount, newFeedbacksCount, traffic] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM users'),
      query('SELECT COUNT(*)::int AS count FROM stations'),
      query('SELECT COUNT(*)::int AS count FROM stations WHERE is_open = true'),
      query('SELECT COUNT(*)::int AS count FROM stations WHERE is_approved = false'),
      query('SELECT COUNT(*)::int AS count FROM feedbacks'),
      query('SELECT COUNT(*)::int AS count FROM feedbacks WHERE status = \'yangi\''),
      getLiveTrafficStats(),
    ]);

    // 2. Yoqilg'i turlari bo'yicha taqsimot
    const fuelStats = await query(`
      SELECT fuel_type AS "fuelType", COUNT(*)::int AS count
      FROM fuel_prices
      WHERE is_available = true
      GROUP BY fuel_type
    `);

    // 3. Metan gazining o'rtacha bosimi (atm)
    const metanAvg = await query(`
      SELECT ROUND(AVG(pressure_atm), 1) AS "avgPressure"
      FROM fuel_prices fp
      JOIN stations s ON fp.station_id = s.id
      WHERE fp.fuel_type = 'metan' AND s.is_open = true AND fp.pressure_atm > 0
    `);

    // 4. Oxirgi harakatlar (Loglar)
    const recentFeedbacks = await query(`
      SELECT id, author_name AS author, type, message, status, created_at AS "createdAt"
      FROM feedbacks
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        todayVisits: traffic.todayVisits,
        yesterdayVisits: traffic.yesterdayVisits,
        onlineUsers: traffic.onlineUsers,
        dailyHistory: traffic.dailyHistory,
        totalUsers: usersCount.rows[0].count,
        totalStations: stationsCount.rows[0].count,
        openStations: openStationsCount.rows[0].count,
        pendingStations: pendingStationsCount.rows[0].count,
        totalFeedbacks: feedbacksCount.rows[0].count,
        newFeedbacks: newFeedbacksCount.rows[0].count,
        averageMetanPressure: parseFloat(metanAvg.rows[0]?.avgPressure) || 0,
        fuelBreakdown: fuelStats.rows,
        recentFeedbacks: recentFeedbacks.rows,
      },
    });
  } catch (err) {
    console.error('GetDashboardStats xatosi:', err);
    res.status(500).json({ success: false, message: 'Statistikalarni hisoblashda xatolik.' });
  }
};

// Barcha shahobchalar ro'yxati (Super Admin uchun: tasdiqlangan va tasdiqlanmagan)
export const getAllStationsAdmin = async (req, res) => {
  try {
    // 1 kundan oshgan rad etilgan shahobchalarni admindan avtomatik tozalash
    await query(`
      DELETE FROM stations 
      WHERE status = 'rejected' 
        AND rejected_at IS NOT NULL 
        AND rejected_at < NOW() - INTERVAL '1 day'
    `).catch(() => {});

    const result = await query(`
      SELECT 
        s.id, s.name, s.lat, s.lng, s.address, s.city, s.phone,
        s.is_open AS "isOpen", s.reopen_time AS "reopenTime",
        s.rating, s.rating_count AS "ratingCount", s.owner_id AS "ownerId",
        s.is_approved AS "isApproved", s.created_at AS "createdAt",
        s.status, s.rejected_at AS "rejectedAt",
        s.description, s.images, s.verification_images AS "verificationImages", s.types, s.gas_pressure AS "gasPressure",
        u.first_name AS "ownerFirstName", u.last_name AS "ownerLastName", u.phone AS "ownerPhone",
        COALESCE(
          json_object_agg(
            fp.fuel_type, fp.price
          ) FILTER (WHERE fp.fuel_type IS NOT NULL), '{}'::json
        ) AS prices,
        to_jsonb(sa.*) - 'station_id' AS amenities,
        to_jsonb(sp.*) - 'station_id' AS payments
      FROM stations s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN fuel_prices fp ON s.id = fp.station_id
      LEFT JOIN station_amenities sa ON s.id = sa.station_id
      LEFT JOIN station_payments sp ON s.id = sp.station_id
      WHERE (s.rejected_at IS NULL OR s.rejected_at >= NOW() - INTERVAL '1 day')
      GROUP BY s.id, u.id, sa.station_id, sp.station_id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, count: result.rows.length, stations: result.rows });
  } catch (err) {
    console.error('GetAllStationsAdmin xatosi:', err);
    res.status(500).json({ success: false, message: 'Admin shahobchalarini yuklashda xatolik.' });
  }
};

export const approveStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const isApprovedBool = Boolean(isApproved);

    const result = await query(
      `UPDATE stations SET 
         is_approved = $1, 
         status = $2, 
         rejected_at = $3, 
         updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [
        isApprovedBool,
        isApprovedBool ? 'approved' : 'rejected',
        isApprovedBool ? null : new Date(),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shahobcha topilmadi.' });
    }

    const station = result.rows[0];

    // Foydalanuvchining kalakolchikiga bildirishnoma yuborish
    try {
      const notifTitle = isApprovedBool ? "Joylashuv tasdiqlandi!" : "Joylashuv rad etildi";
      const notifBadge = isApprovedBool ? "Tasdiqlandi" : "Rad etildi";
      const notifType = isApprovedBool ? "station_approved" : "station_rejected";
      const notifMsg = isApprovedBool
        ? "Joylashuv tasdiqlandi! Sizdan har kuni jonli ma'lumotlarni to'ldirib turishingizni so'rab qolamiz: gaz bosimini jonli kiritib turing, yoqilg'i narxlarini to'g'ri va jonli o'zgartirib turing hamda ochiq/yopiq holatlarini ham kiritib turing, iltimos!"
        : `Siz kiritgan "${station.name}" manzili Dastur Administratsiyasi tomonidan rad etildi.`;

      await query(
        `INSERT INTO user_notifications (user_id, user_phone, station_id, title, message, badge, type, is_read, read_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, NULL)`,
        [station.owner_id || null, station.phone || null, station.id, notifTitle, notifMsg, notifBadge, notifType]
      );
      console.log(`✅ Bildirishnoma yaratildi (${notifType}) station:`, station.name);
    } catch (notifErr) {
      console.warn("Bildirishnoma saqlashda xatolik:", notifErr.message);
    }

    res.json({
      success: true,
      station,
      message: isApprovedBool ? 'Shahobcha tasdiqlandi' : 'Shahobcha rad etildi (1 kundan so\'ng admindan o\'chiriladi)',
    });
  } catch (err) {
    console.error('ApproveStation xatosi:', err);
    res.status(500).json({ success: false, message: 'Tasdiqlashda xatolik.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await query(`
      SELECT id, phone, first_name AS "firstName", last_name AS "lastName", role, bio, created_at AS "createdAt"
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (err) {
    console.error('GetAllUsers xatosi:', err);
    res.status(500).json({ success: false, message: 'Foydalanuvchilarni yuklashda xatolik.' });
  }
};


// Foydalanuvchini o'chirish (Super Admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Tekshirish
    const userRes = await query('SELECT id, phone, role, first_name, last_name FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    const targetUser = userRes.rows[0];

    // Asosiy Super Adminni o'chirib yuborishdan himoyalash
    if (targetUser.role === 'super_admin' && targetUser.phone && targetUser.phone.includes('77 278 18 08')) {
      return res.status(400).json({ success: false, message: "Bosh Super Admin hisobini o'chirish taqiqlangan!" });
    }

    // O'chirish (bog'liq jadvallarda ON DELETE SET NULL bo'lgani sababli xavfsiz o'chadi)
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `${targetUser.first_name || 'Foydalanuvchi'} muvaffaqiyatli o'chirildi.`,
    });
  } catch (err) {
    console.error('DeleteUser xatosi:', err);
    res.status(500).json({ success: false, message: "Foydalanuvchini o'chirishda xatolik yuz berdi." });
  }
};


// Shahobcha tekshiruv rasmlarini yangilash / qo'shish (Super Admin)
export const updateStationVerificationPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { slot, image, verificationImages } = req.body;

    const stRes = await query('SELECT id, verification_images, images FROM stations WHERE id = $1', [id]);
    if (stRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shahobcha topilmadi.' });
    }

    let currentVerif = stRes.rows[0].verification_images || {};
    if (typeof currentVerif === 'string') {
      try { currentVerif = JSON.parse(currentVerif); } catch (e) { currentVerif = {}; }
    }

    if (slot && image) {
      currentVerif[slot] = image;
    } else if (verificationImages && typeof verificationImages === 'object') {
      currentVerif = { ...currentVerif, ...verificationImages };
    }

    const result = await query(
      `UPDATE stations SET verification_images = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(currentVerif), id]
    );

    res.json({
      success: true,
      message: 'Tekshiruv rasmi muvaffaqiyatli saqlandi!',
      station: result.rows[0],
    });
  } catch (err) {
    console.error('UpdateStationVerificationPhotos xatosi:', err);
    res.status(500).json({ success: false, message: 'Rasmni saqlashda xatolik.' });
  }
};

import { query } from '../config/db.js';

// Xotirada onlayn foydalanuvchilarni saqlash (tezkor real-time hisob uchun)
const activeVisitors = new Map(); // visitorId -> lastActiveTimestamp
const ONLINE_WINDOW_MS = 3 * 60 * 1000; // 3 daqiqa davomida faol bo'lsa onlayn hisoblanadi

// Faol bo'lmaganlarni tozalash
function cleanOldVisitors() {
  const now = Date.now();
  for (const [vId, lastSeen] of activeVisitors.entries()) {
    if (now - lastSeen > ONLINE_WINDOW_MS) {
      activeVisitors.delete(vId);
    }
  }
}

// Tashrif va onlaynlar sonini olish (adminController uchun ham xizmat qiladi)
export async function getLiveTrafficStats() {
  cleanOldVisitors();
  const onlineUsers = Math.max(activeVisitors.size, 0);

  let todayVisits = 0;
  let yesterdayVisits = 0;
  let dailyHistory = [];

  try {
    // 1. Bugungi tashriflar soni (Toshkent vaqti: Asia/Tashkent)
    const todayRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM app_visits
      WHERE DATE(visited_at AT TIME ZONE 'Asia/Tashkent') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent')
    `);
    todayVisits = todayRes.rows[0]?.count || 0;

    // 2. Kechagi kunlik to'liq tashriflar soni (Toshkent vaqti)
    const yestRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM app_visits
      WHERE DATE(visited_at AT TIME ZONE 'Asia/Tashkent') = (DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent') - 1)
    `);
    yesterdayVisits = yestRes.rows[0]?.count || 0;

    // 3. Oxirgi 30 kunlik to'liq tashriflar dinamikasi (kunma-kun tartibda)
    const histRes = await query(`
      SELECT 
        TO_CHAR(d.day, 'YYYY-MM-DD') AS date_str,
        COALESCE(COUNT(v.id), 0)::int AS visitors
      FROM generate_series(
        DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent') - 29,
        DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent'),
        '1 day'::interval
      ) AS d(day)
      LEFT JOIN app_visits v ON DATE(v.visited_at AT TIME ZONE 'Asia/Tashkent') = DATE(d.day)
      GROUP BY d.day
      ORDER BY d.day ASC
    `);
    dailyHistory = histRes.rows.map(r => r.visitors);
  } catch (err) {
    console.warn('Tashrif statistikasini olishda xato:', err.message);
    todayVisits = activeVisitors.size;
  }

  return {
    todayVisits,
    yesterdayVisits,
    onlineUsers,
    dailyHistory,
  };
}

// MyUp mijoz ilovasidan kelgan tashrif signali
export const recordVisit = async (req, res) => {
  try {
    const { visitorId, action } = req.body;
    const vId = visitorId || req.ip || `vis_${Date.now()}`;

    cleanOldVisitors();

    if (action === 'LEAVE') {
      activeVisitors.delete(vId);
      return res.json({ success: true, message: 'Foydalanuvchi chiqdi', onlineUsers: activeVisitors.size });
    }

    // ENTER bo'lganda (birinchi kirish yoki sahifa refresh qilinganda) yangi tashrif sifatida yoziladi
    if (action === 'ENTER') {
      activeVisitors.set(vId, Date.now());
      try {
        await query(
          `INSERT INTO app_visits (visitor_id, visited_at, last_seen)
           VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [vId]
        );
      } catch (dbErr) {
        console.warn('Tashrifni bazaga yozishda xato:', dbErr.message);
      }
    } else {
      // PING (faollikni yangilab turish)
      activeVisitors.set(vId, Date.now());
    }

    const stats = await getLiveTrafficStats();
    res.json({
      success: true,
      message: 'Tashrif qayd etildi',
      ...stats,
    });
  } catch (err) {
    console.error('RecordVisit xatosi:', err);
    res.status(500).json({ success: false, message: 'Tashrifni qayd etishda xatolik' });
  }
};

// Jonli trafik statistikasini olish (A-Maps Super Admin uchun ochiq)
export const getTrafficStats = async (req, res) => {
  try {
    const stats = await getLiveTrafficStats();
    res.json({
      success: true,
      ...stats,
    });
  } catch (err) {
    console.error('GetTrafficStats xatosi:', err);
    res.status(500).json({ success: false, message: 'Statistikani olishda xatolik' });
  }
};

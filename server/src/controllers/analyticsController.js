import { query } from '../config/db.js';

// Tashrif va onlaynlar sonini olish (PM2 klaster rejimiga to'liq mos, bazaga asoslangan)
export async function getLiveTrafficStats() {
  let onlineUsers = 0;
  let todayVisits = 0;
  let yesterdayVisits = 0;
  let dailyHistory = [];

  try {
    // 1. Jonli onlayn foydalanuvchilar (oxirgi 3 daqiqada faol bo'lgan unikal tashrifchilar - klaster xavfsiz)
    const onlineRes = await query(`
      SELECT COUNT(DISTINCT visitor_id)::int AS count
      FROM app_visits
      WHERE last_seen >= NOW() - INTERVAL '3 minutes'
    `);
    onlineUsers = onlineRes.rows[0]?.count || 0;

    // 2. Bugungi tashriflar soni (Toshkent vaqti: Asia/Tashkent)
    const todayRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM app_visits
      WHERE DATE(visited_at AT TIME ZONE 'Asia/Tashkent') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent')
    `);
    todayVisits = todayRes.rows[0]?.count || 0;

    // 3. Kechagi kunlik to'liq tashriflar soni (Toshkent vaqti)
    const yestRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM app_visits
      WHERE DATE(visited_at AT TIME ZONE 'Asia/Tashkent') = (DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent') - 1)
    `);
    yesterdayVisits = yestRes.rows[0]?.count || 0;

    // 4. Oxirgi 30 kunlik to'liq tashriflar dinamikasi (kunma-kun tartibda)
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

    if (action === 'LEAVE') {
      try {
        await query(
          `UPDATE app_visits 
           SET last_seen = NOW() - INTERVAL '10 minutes'
           WHERE visitor_id = $1 AND last_seen >= NOW() - INTERVAL '3 minutes'`,
          [vId]
        );
      } catch (dbErr) {
        console.warn('Foydalanuvchi chiqishini bazaga yozishda xato:', dbErr.message);
      }
      const stats = await getLiveTrafficStats();
      return res.json({
        success: true,
        message: 'Foydalanuvchi chiqdi',
        ...stats,
      });
    }

    if (action === 'ENTER') {
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
      try {
        const updateRes = await query(
          `UPDATE app_visits
           SET last_seen = CURRENT_TIMESTAMP
           WHERE id = (
             SELECT id FROM app_visits
             WHERE visitor_id = $1
             ORDER BY last_seen DESC
             LIMIT 1
           )
           RETURNING id`,
          [vId]
        );
        if (updateRes.rows.length === 0) {
          await query(
            `INSERT INTO app_visits (visitor_id, visited_at, last_seen)
             VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [vId]
          );
        }
      } catch (dbErr) {
        console.warn('Faollikni yangilashda xato:', dbErr.message);
      }
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


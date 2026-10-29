import { query } from '../config/db.js';

// Foydalanuvchi bildirishnomalarini olish (1 kundan oshgan o'qilgan xabarlar tozalanadi)
export const getUserNotifications = async (req, res) => {
  try {
    // Ko'rib bo'linganiga 1 kundan oshgan bildirishnomalarni avtomatik tozalash (o'chirish)
    await query(`
      DELETE FROM user_notifications 
      WHERE is_read = true 
        AND read_at IS NOT NULL 
        AND read_at < NOW() - INTERVAL '1 day'
    `).catch(() => {});

    const userId = req.user?.id || req.query.userId || null;
    const phone = req.query.phone || req.user?.phone || null;

    let sql = `
      SELECT id, user_id AS "userId", station_id AS "stationId",
             title, message, badge, type, is_read AS "isRead",
             read_at AS "readAt", created_at AS "createdAt"
      FROM user_notifications
      WHERE (read_at IS NULL OR read_at >= NOW() - INTERVAL '1 day')
    `;
    const params = [];

    const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (isUUID && phone) {
      params.push(userId, phone);
      sql += ` AND (user_id = $1 OR user_phone = $2)`;
    } else if (isUUID) {
      params.push(userId);
      sql += ` AND user_id = $1`;
    } else if (phone) {
      params.push(phone);
      sql += ` AND user_phone = $1`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await query(sql, params);
    const notifications = result.rows;
    const unreadCount = notifications.filter(n => !n.isRead && !n.readAt).length;
    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (err) {
    console.error('GetUserNotifications xatosi:', err);
    res.status(500).json({ success: false, message: 'Bildirishnomalarni yuklashda xatolik.' });
  }
};

// Bildirishnomalarni ko'rilgan (o'qilgan) deb belgilash va 1 kunlik avto-o'chish muddatini boshlash
export const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || null;
    const phone = req.body?.phone || req.user?.phone || null;
    const { id } = req.body || {};

    let sql = `
      UPDATE user_notifications 
      SET is_read = true, 
          read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE 1=1
    `;
    const params = [];

    if (id) {
      params.push(id);
      sql += ` AND id = $1`;
    } else {
      const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (isUUID && phone) {
        params.push(userId, phone);
        sql += ` AND (user_id = $1 OR user_phone = $2)`;
      } else if (isUUID) {
        params.push(userId);
        sql += ` AND user_id = $1`;
      } else if (phone) {
        params.push(phone);
        sql += ` AND user_phone = $1`;
      }
    }

    await query(sql, params);
    res.json({ success: true, message: "Bildirishnomalar o'qilgan deb belgilandi va 1 kundan so'ng o'chib ketadi." });
  } catch (err) {
    console.error('MarkNotificationsRead xatosi:', err);
    res.status(500).json({ success: false, message: 'Belgilashda xatolik.' });
  }
};

// Bildirishnomani o'chirish
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM user_notifications WHERE id = $1', [id]);
    res.json({ success: true, message: "Bildirishnoma o'chirildi." });
  } catch (err) {
    console.error('DeleteNotification xatosi:', err);
    res.status(500).json({ success: false, message: "O'chirishda xatolik." });
  }
};

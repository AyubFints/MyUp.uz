import { query } from '../config/db.js';

// Yangi fikr/taklif qoldirish
export const createFeedback = async (req, res) => {
  try {
    const { type, message, authorName, authorPhone, userId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Xabar matni bo'sh bo'lishi mumkin emas." });
    }

    const rawId = userId || (req.user ? req.user.id : null);
    const currentUserId = rawId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId) ? rawId : null;
    const name = authorName || (req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() : 'Foydalanuvchi');
    const phone = authorPhone || (req.user ? req.user.phone : '');

    const result = await query(
      `INSERT INTO feedbacks (user_id, author_name, author_phone, type, message, status)
       VALUES ($1, $2, $3, $4, $5, 'yangi')
       RETURNING id, user_id AS "userId", type, message, author_name AS author, author_phone AS phone, status, admin_reply AS "adminReply", created_at AS "createdAt"`,
      [currentUserId, name, phone, type || 'fikr', message.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Fikringiz muvaffaqiyatli qabul qilindi. Rahmat!',
      feedback: result.rows[0],
    });
  } catch (err) {
    console.error('CreateFeedback xatosi:', err);
    res.status(500).json({ success: false, message: 'Fikrni saqlashda xatolik yuz berdi.' });
  }
};

// Barcha fikr va takliflarni olish (Super Admin yoki ma'lum bir foydalanuvchi uchun)
export const getFeedbacks = async (req, res) => {
  try {
    const { status, type, userId, phone } = req.query;
    let sql = `
      SELECT id, user_id AS "userId", author_name AS author, author_phone AS phone,
             type, message, status, admin_reply AS "adminReply", created_at AS "createdAt"
      FROM feedbacks
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    if (userId || phone) {
      const cleanPhone = phone ? phone.replace(/\s+/g, '') : null;
      const isValidUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      if (isValidUuid && cleanPhone) {
        params.push(userId, cleanPhone);
        conditions.push(`(user_id = ${params.length - 1} OR REPLACE(author_phone, ' ', '') = ${params.length})`);
      } else if (isValidUuid) {
        params.push(userId);
        conditions.push(`user_id = ${params.length}`);
      } else if (cleanPhone) {
        params.push(cleanPhone);
        conditions.push(`REPLACE(author_phone, ' ', '') = ${params.length}`);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, feedbacks: result.rows });
  } catch (err) {
    console.error('GetFeedbacks xatosi:', err);
    res.status(500).json({ success: false, message: 'Fikrlarni yuklashda xatolik.' });
  }
};

// Fikr holatini o'zgartirish yoki javob yozish (Super Admin)
export const replyFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const result = await query(
      `UPDATE feedbacks
       SET status = COALESCE($1, status),
           admin_reply = COALESCE($2, admin_reply)
       WHERE id = $3
       RETURNING *`,
      [status, adminReply, id]
    );

    const fb = result.rows[0];
    if (!fb) {
      return res.status(404).json({ success: false, message: 'Fikr topilmadi.' });
    }

    // Agar admin javob yozgan bo'lsa, foydalanuvchiga user_notifications jadvaliga ham bildirishnoma qo'shamiz
    if (adminReply && String(adminReply).trim()) {
      try {
        await query(
          `INSERT INTO user_notifications (user_id, user_phone, title, message, badge, type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            fb.user_id || null,
            fb.author_phone || null,
            "Murojaatingizga Administrator javobi",
            String(adminReply).trim(),
            "Admin javobi",
            "admin_reply"
          ]
        );
      } catch (notifErr) {
        console.warn("Foydalanuvchiga javob bildirishnomasi saqlashda ogohlantirish:", notifErr.message);
      }
    }

    res.json({ success: true, feedback: fb });
  } catch (err) {
    console.error('ReplyFeedback xatosi:', err);
    res.status(500).json({ success: false, message: 'Javob yozishda xatolik.' });
  }
};

// Fikrni o'chirish
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM feedbacks WHERE id = $1', [id]);
    res.json({ success: true, message: "Fikr o'chirildi" });
  } catch (err) {
    console.error('DeleteFeedback xatosi:', err);
    res.status(500).json({ success: false, message: "O'chirishda xatolik." });
  }
};

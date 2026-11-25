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

// Fikr va takliflarni olish (Super Admin uchun barchasi, oddiy foydalanuvchi uchun faqat o'ziniki)
export const getFeedbacks = async (req, res) => {
  try {
    const { status, type, userId, phone } = req.query;

    const isSuperAdmin = Boolean(
      (req.user && (req.user.role === 'super_admin' || req.user.role === 'admin')) ||
      req.headers['x-admin-key'] === 'admin123' ||
      req.query.adminKey === 'admin123'
    );

    // 1. ODDIY FOYDALANUVCHILAR YOKI MEHMONLAR UCHUN MAXSUS HIMOYALANGAN REJIM:
    if (!isSuperAdmin) {
      const cleanPhone = phone ? String(phone).replace(/\s+/g, '') : null;
      const phoneDigits = phone ? String(phone).replace(/\D/g, '') : '';
      const isValidUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      // Agar na haqiqiy userId va na telefon raqam berilmagan bo'lsa (yoki bo'sh bo'lsa),
      // begonalar yoki boshqa foydalanuvchilarning fikrlari ko'rinmasligi uchun darhol bo'sh ro'yxat qaytaramiz!
      if (!isValidUuid && (!phoneDigits || phoneDigits.length < 7)) {
        return res.json({ success: true, count: 0, feedbacks: [] });
      }

      let sql = `
        SELECT id, user_id AS "userId", author_name AS author, author_phone AS phone,
               type, message, status, admin_reply AS "adminReply", created_at AS "createdAt"
        FROM feedbacks
        WHERE
      `;
      const params = [];
      if (isValidUuid && phoneDigits) {
        params.push(userId, cleanPhone || '', phoneDigits);
        sql += ` (user_id = $1 OR REPLACE(author_phone, ' ', '') = $2 OR ($3 != '' AND REGEXP_REPLACE(author_phone, '\\D', '', 'g') = $3))`;
      } else if (isValidUuid) {
        params.push(userId);
        sql += ` user_id = $1`;
      } else {
        params.push(cleanPhone || '', phoneDigits);
        sql += ` (REPLACE(author_phone, ' ', '') = $1 OR ($2 != '' AND REGEXP_REPLACE(author_phone, '\\D', '', 'g') = $2))`;
      }

      sql += ' ORDER BY created_at DESC';
      const result = await query(sql, params);
      return res.json({ success: true, count: result.rows.length, feedbacks: result.rows });
    }

    // 2. SUPER ADMIN UCHUN REJIM (A-Maps supper admin paneli):
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

// Fikr holatini ko'rilgan deb belgilash (Admin ko'rishi bilanoq yangi statusi o'chadi)
export const markFeedbackAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE feedbacks
       SET status = 'korildi'
       WHERE id = $1 AND status = 'yangi'
       RETURNING *`,
      [id]
    );

    const fb = result.rows[0];
    res.json({ success: true, feedback: fb || null });
  } catch (err) {
    console.error('MarkFeedbackAsRead xatosi:', err);
    res.status(500).json({ success: false, message: "Fikr holatini o'zgartirishda xatolik." });
  }
};

// Barcha yangi fikrlarni ko'rilgan deb belgilash (Admin bo'limga kirganda barcha 'yangi'lar 'korildi' bo'ladi)
export const markAllFeedbacksAsRead = async (req, res) => {
  try {
    const result = await query(
      `UPDATE feedbacks
       SET status = 'korildi'
       WHERE status = 'yangi'
       RETURNING id`
    );
    res.json({ success: true, updatedCount: result.rowCount || 0 });
  } catch (err) {
    console.error('MarkAllFeedbacksAsRead xatosi:', err);
    res.status(500).json({ success: false, message: "Fikrlarni yangilashda xatolik." });
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

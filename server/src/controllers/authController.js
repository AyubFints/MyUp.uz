import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'myup_super_secret_jwt_key_2026_uzbekistan';

// Ro'yxatdan o'tish (Register)
export const register = async (req, res) => {
  try {
    const { phone, firstName, lastName, password, hasLocation, role, avatarUrl, bio } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Telefon va parol kiritilishi shart.' });
    }

    const cleanInputPhone = phone.replace(/\s+/g, '');
    const existing = await query('SELECT id FROM users WHERE REPLACE(phone, \' \', \'\') = $1', [cleanInputPhone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ushbu telefon raqam bilan allaqachon ro\'yxatdan o\'tilgan. Iltimos, Kirish bo\'limidan kiring.',
      });
    }

    // Parolni xesh qilish
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userHasLocation = Boolean(hasLocation);
    const userRole = role === 'owner' || role === 'business' ? 'owner' : (role === 'super_admin' ? 'super_admin' : 'user');

    const result = await query(
      `INSERT INTO users (phone, first_name, last_name, password_hash, role, has_location, avatar_url, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, phone, first_name, last_name, role, has_location, avatar_url, bio, created_at`,
      [phone.trim(), firstName || '', lastName || '', passwordHash, userRole, userHasLocation, avatarUrl || null, bio || '']
    );

    const user = result.rows[0];

    // Agar ushbu telefon raqam bilan avval yaratilgan shahobchalar bo'lsa, ushbu yangi userga biriktiramiz
    await query(
      `UPDATE stations 
       SET owner_id = $1 
       WHERE owner_id IS NULL AND (REPLACE(phone, ' ', '') = $2 OR phone = $3)`,
      [user.id, cleanInputPhone, user.phone]
    ).catch(() => {});

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ success: true, token, user, stations: [] });
  } catch (err) {
    console.error('Register xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi ro\'yxatdan o\'tishda: ' + err.message });
  }
};

// Tizimga kirish (Login - Telefon, Username yoki Email orqali)
export const login = async (req, res) => {
  try {
    const inputLogin = (req.body.phone || req.body.username || req.body.email || req.body.login || '').toString().trim();
    const inputPassword = (req.body.password || '').toString();

    if (!inputLogin || !inputPassword) {
      return res.status(400).json({ success: false, message: 'Login (telefon yoki username) va parol kiritilishi shart.' });
    }

    const cleanInputPhone = inputLogin.replace(/\s+/g, '');
    const isSuperAdminAlias = ['admin', 'ayubxon', 'superadmin', 'admin@amaps.uz', 'ayub'].includes(inputLogin.toLowerCase());

    // Bazadan foydalanuvchini qidirish: telefon yoki super admin bo'yicha
    let result;
    if (isSuperAdminAlias) {
      result = await query(
        `SELECT id, phone, first_name, last_name, password_hash, role, has_location, avatar_url, bio
         FROM users WHERE role = 'super_admin' LIMIT 1`
      );
    } else {
      result = await query(
        `SELECT id, phone, first_name, last_name, password_hash, role, has_location, avatar_url, bio
         FROM users WHERE REPLACE(phone, ' ', '') = $1 OR phone = $2`,
        [cleanInputPhone, inputLogin]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ushbu telefon raqam ro\'yxatdan o\'tmagan. Iltimos, avval ro\'yxatdan o\'ting.' });
    }

    const user = result.rows[0];

    // Parolni tekshirish (Super Admin uchun admin123 yoki ayub1953 ham o'tadi)
    let isMatch = await bcrypt.compare(inputPassword, user.password_hash);
    if (!isMatch && user.role === 'super_admin') {
      if (inputPassword === 'admin123' || inputPassword === 'ayub1953') {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Telefon raqam yoki parol noto\'g\'ri.' });
    }

    // 1. Agar foydalanuvchining telefon raqami bilan avval ochilgan shahobchalar owner_id bo'lmasa, bog'lash
    await query(
      `UPDATE stations 
       SET owner_id = $1 
       WHERE owner_id IS NULL AND (REPLACE(phone, ' ', '') = $2 OR phone = $3)`,
      [user.id, cleanInputPhone, user.phone]
    ).catch(() => {});

    // 2. Foydalanuvchining barcha manzillarini (shahobchalarini) bazadan olish
    const stationsResult = await query(
      `SELECT 
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
      WHERE s.owner_id = $1 OR REPLACE(s.phone, ' ', '') = $2 OR s.phone = $3
      GROUP BY s.id, sa.station_id, sp.station_id
      ORDER BY s.created_at DESC`,
      [user.id, cleanInputPhone, user.phone]
    );

    const stations = stationsResult.rows.map((st) => {
      const typeList = Array.isArray(st.types) && st.types.length > 0 ? st.types : Object.keys(st.prices || {});
      const metanP = st.pressures?.metan || st.gasPressure || (typeList.includes('metan') ? 200 : null);
      return {
        ...st,
        type: typeList,
        gasPressure: metanP,
        images: Array.isArray(st.images) && st.images.length > 0 ? st.images : ['https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=600&q=80'],
      };
    });

    // Agar foydalanuvchida shahobchalar bo'lsa va has_location hali true bo'lmasa, yangilab qo'yish
    if (stations.length > 0 && !user.has_location) {
      await query('UPDATE users SET has_location = true WHERE id = $1', [user.id]).catch(() => {});
      user.has_location = true;
    }

    // 3. Foydalanuvchiga kelgan barcha bildirishnomalarni olish
    const notifsResult = await query(
      `SELECT id, user_id AS "userId", station_id AS "stationId",
              title, message, badge, type, is_read AS "isRead",
              read_at AS "readAt", created_at AS "createdAt"
       FROM user_notifications
       WHERE (user_id = $1 OR user_phone = $2 OR REPLACE(user_phone, ' ', '') = $3)
         AND (read_at IS NULL OR read_at >= NOW() - INTERVAL '1 day')
       ORDER BY created_at DESC LIMIT 50`,
      [user.id, user.phone, cleanInputPhone]
    );

    delete user.password_hash;
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user,
      stations,
      notifications: notifsResult.rows,
    });
  } catch (err) {
    console.error('Login xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi kirishda: ' + err.message });
  }
};

// Joriy foydalanuvchini olish (Get Me)
export const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, phone, first_name, last_name, role, has_location, avatar_url, bio, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('GetMe xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// Profilni yangilash (Update Profile)
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, avatarUrl, hasLocation } = req.body;
    const result = await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           bio = COALESCE($3, bio),
           avatar_url = COALESCE($4, avatar_url),
           has_location = COALESCE($5, has_location),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, phone, first_name, last_name, role, has_location, avatar_url, bio, updated_at`,
      [firstName, lastName, bio, avatarUrl, hasLocation !== undefined ? Boolean(hasLocation) : null, req.user.id]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('UpdateProfile xatosi:', err);
    res.status(500).json({ success: false, message: 'Profilni yangilashda xatolik.' });
  }
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'myup_super_secret_jwt_key_2026_uzbekistan';

// Ro'yxatdan o'tish (Register)
export const register = async (req, res) => {
  try {
    const { phone, firstName, lastName, password, hasLocation } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Telefon va parol kiritilishi shart.' });
    }

    const cleanInputPhone = phone.replace(/\s+/g, '');
    const existing = await query('SELECT id FROM users WHERE REPLACE(phone, \' \', \'\') = $1', [cleanInputPhone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ushbu telefon raqam bilan ro\'yxatdan o\'tilgan.' });
    }

    // Parolni xesh qilish
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userHasLocation = Boolean(hasLocation);

    const result = await query(
      `INSERT INTO users (phone, first_name, last_name, password_hash, role, has_location)
       VALUES ($1, $2, $3, $4, 'user', $5)
       RETURNING id, phone, first_name, last_name, role, has_location, avatar_url, bio, created_at`,
      [phone.trim(), firstName || '', lastName || '', passwordHash, userHasLocation]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('Register xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi ro\'yxatdan o\'tishda.' });
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
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
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
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri parol.' });
    }

    delete user.password_hash;
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Login xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi kirishda.' });
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

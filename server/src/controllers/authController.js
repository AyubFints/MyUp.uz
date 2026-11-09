import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'myup_super_secret_jwt_key_2026_uzbekistan';

// Yordamchi: Foydalanuvchi ma'lumotlarini qulay camelCase va snake_case formatda shakllantirish
const formatUserRow = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    phone: u.phone,
    phoneNumber: u.phone,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    role: u.role || 'user',
    hasLocation: Boolean(u.has_location),
    has_location: Boolean(u.has_location),
    canAddStation: Boolean(u.can_add_station || u.has_location || u.role === 'owner'),
    can_add_station: Boolean(u.can_add_station || u.has_location || u.role === 'owner'),
    registeredViaLocation: Boolean(u.registered_via_location || u.location_name),
    registered_via_location: Boolean(u.registered_via_location || u.location_name),
    locationName: u.location_name || '',
    location_name: u.location_name || '',
    responsiblePerson: u.responsible_person || '',
    responsible_person: u.responsible_person || '',
    locationPhone: u.location_phone || u.phone || '',
    location_phone: u.location_phone || u.phone || '',
    locationImage: u.location_image || null,
    location_image: u.location_image || null,
    avatar: u.avatar_url || null,
    avatarUrl: u.avatar_url || null,
    avatar_url: u.avatar_url || null,
    bio: u.bio || '',
    createdAt: u.created_at,
    created_at: u.created_at,
  };
};

const USER_FIELDS_SELECT = `
  id, phone, first_name, last_name, role, has_location, can_add_station,
  registered_via_location, location_name, responsible_person, location_phone,
  location_image, avatar_url, bio, created_at
`;

// 1. Ro'yxatdan o'tish (Register)
export const register = async (req, res) => {
  try {
    const { 
      phone, firstName, lastName, password, hasLocation, role, avatarUrl, bio,
      locationName, responsiblePerson, locationPhone, locationImage, canAddStation, registeredViaLocation 
    } = req.body;

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
    const userHasLocation = Boolean(hasLocation || locationName);
    const userCanAdd = Boolean(canAddStation || hasLocation || role === 'owner');
    const userRole = role === 'owner' || role === 'business' || locationName ? 'owner' : (role === 'super_admin' ? 'super_admin' : 'user');
    const userRegViaLoc = Boolean(registeredViaLocation || locationName);

    const result = await query(
      `INSERT INTO users (
        phone, first_name, last_name, password_hash, role, has_location, can_add_station,
        registered_via_location, location_name, responsible_person, location_phone, location_image,
        avatar_url, bio
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING ${USER_FIELDS_SELECT}`,
      [
        phone.trim(), 
        firstName || '', 
        lastName || '', 
        passwordHash, 
        userRole, 
        userHasLocation, 
        userCanAdd,
        userRegViaLoc,
        locationName ? locationName.trim() : null,
        responsiblePerson ? responsiblePerson.trim() : null,
        locationPhone || phone.trim(),
        locationImage || null,
        avatarUrl || null, 
        bio || ''
      ]
    );

    const user = formatUserRow(result.rows[0]);

    // Yangi foydalanuvchi oddiy registratsiyadan o'tganda kalakolchik uchun 2 kunlik maxsus yo'riqnoma bildirishnoma yaratamiz
    if (!userHasLocation) {
      const notifTitle = "Manzil qo'shish imkoniyati";
      const notifMsg = "Agar sizning ham dasturga qo'shmoqchi bo'lgan manzilingiz bo'lsa, ushbu bildirishnomalarning eng tagida joylashuv qo'shishni faollashtiradigan joy bor.";
      const notifBadge = "Qo'llanma";
      const notifType = "location_guide";

      await query(
        `INSERT INTO user_notifications (user_id, user_phone, title, message, badge, type, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)`,
        [user.id, user.phone, notifTitle, notifMsg, notifBadge, notifType]
      ).catch((e) => console.warn('Welcome notif insert error:', e.message));
    }

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

// 2. Tizimga kirish (Login - Telefon, Username yoki Email orqali)
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
        `SELECT ${USER_FIELDS_SELECT}, password_hash
         FROM users WHERE role = 'super_admin' LIMIT 1`
      );
    } else {
      result = await query(
        `SELECT ${USER_FIELDS_SELECT}, password_hash
         FROM users WHERE REPLACE(phone, ' ', '') = $1 OR phone = $2`,
        [cleanInputPhone, inputLogin]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ushbu telefon raqam ro\'yxatdan o\'tmagan. Iltimos, avval ro\'yxatdan o\'ting.' });
    }

    const rawUser = result.rows[0];

    // Parolni tekshirish (Super Admin uchun admin123 yoki ayub1953 ham o'tadi)
    let isMatch = await bcrypt.compare(inputPassword, rawUser.password_hash);
    if (!isMatch && rawUser.role === 'super_admin') {
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
      [rawUser.id, cleanInputPhone, rawUser.phone]
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
      [rawUser.id, cleanInputPhone, rawUser.phone]
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

    // 3. Foydalanuvchiga kelgan barcha bildirishnomalarni olish (location_guide 2 kun, boshqalari 1 kun)
    const notifsResult = await query(
      `SELECT id, user_id AS "userId", station_id AS "stationId",
              title, message, badge, type, is_read AS "isRead",
              read_at AS "readAt", created_at AS "createdAt"
       FROM user_notifications
       WHERE (user_id = $1 OR user_phone = $2 OR REPLACE(user_phone, ' ', '') = $3)
         AND (
           (type = 'location_guide' AND created_at >= NOW() - INTERVAL '2 days')
           OR (type != 'location_guide' AND (read_at IS NULL OR read_at >= NOW() - INTERVAL '1 day'))
         )
       ORDER BY created_at DESC LIMIT 50`,
      [rawUser.id, rawUser.phone, cleanInputPhone]
    );

    const user = formatUserRow(rawUser);
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

// 3. Joriy foydalanuvchini olish (Get Me)
export const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT ${USER_FIELDS_SELECT}
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    const user = formatUserRow(result.rows[0]);
    res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// 4. Profilni yangilash (Update Profile)
export const updateProfile = async (req, res) => {
  try {
    const { 
      firstName, lastName, bio, avatarUrl, avatar, hasLocation, 
      locationName, responsiblePerson, locationPhone, locationImage,
      canAddStation, registeredViaLocation, role, password 
    } = req.body;

    const finalAvatar = avatarUrl || avatar || null;

    let passwordHash = null;
    if (password && typeof password === 'string' && password.trim().length >= 4) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const result = await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           bio = COALESCE($3, bio),
           avatar_url = COALESCE($4, avatar_url),
           has_location = COALESCE($5, has_location),
           location_name = COALESCE($6, location_name),
           responsible_person = COALESCE($7, responsible_person),
           location_phone = COALESCE($8, location_phone),
           location_image = COALESCE($9, location_image),
           can_add_station = COALESCE($10, can_add_station),
           registered_via_location = COALESCE($11, registered_via_location),
           role = COALESCE($12, role),
           password_hash = COALESCE($13, password_hash),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING ${USER_FIELDS_SELECT}`,
      [
        firstName !== undefined ? firstName : null,
        lastName !== undefined ? lastName : null,
        bio !== undefined ? bio : null,
        finalAvatar !== undefined ? finalAvatar : null,
        hasLocation !== undefined ? Boolean(hasLocation) : null,
        locationName !== undefined ? locationName.trim() : null,
        responsiblePerson !== undefined ? responsiblePerson.trim() : null,
        locationPhone !== undefined ? locationPhone : null,
        locationImage !== undefined ? locationImage : null,
        canAddStation !== undefined ? Boolean(canAddStation) : null,
        registeredViaLocation !== undefined ? Boolean(registeredViaLocation) : null,
        role !== undefined ? role : null,
        passwordHash,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    const user = formatUserRow(result.rows[0]);
    res.json({ success: true, user });
  } catch (err) {
    console.error('UpdateProfile xatosi:', err);
    res.status(500).json({ success: false, message: 'Profilni yangilashda xatolik: ' + err.message });
  }
};

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'ayub1953',
  database: process.env.DB_NAME || 'amaps_db',
});

async function resetDb() {
  console.log('🔄 PostgreSQL bazasini tozalash va nol holatga keltirish boshlandi...');
  try {
    // 1. Schema yangilash: yangi ustunlar va cheklovlar
    console.log('🛠 Ustunlar va cheklovlarni tekshirish/yangilash...');
    await pool.query(`
      -- Yangi ustunlar
      ALTER TABLE stations ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE stations ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE stations ADD COLUMN IF NOT EXISTS types JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE stations ADD COLUMN IF NOT EXISTS gas_pressure INTEGER DEFAULT 0;

      -- fuel_type constraint ni 'benzin' bilan yangilash
      ALTER TABLE fuel_prices DROP CONSTRAINT IF EXISTS fuel_prices_fuel_type_check;
      ALTER TABLE fuel_prices ADD CONSTRAINT fuel_prices_fuel_type_check 
        CHECK (fuel_type IN ('metan', 'propan', 'benzin', 'ai92', 'ai95', 'dizel', 'elektr'));
    `);

    // 2. Barcha jadvallarni tozalash (TRUNCATE)
    console.log('🧹 Barcha ma\'lumotlar jadvallarini tozalash...');
    await pool.query(`
      TRUNCATE TABLE reviews CASCADE;
      TRUNCATE TABLE feedbacks CASCADE;
      TRUNCATE TABLE admin_logs CASCADE;
      TRUNCATE TABLE station_amenities CASCADE;
      TRUNCATE TABLE station_payments CASCADE;
      TRUNCATE TABLE fuel_prices CASCADE;
      TRUNCATE TABLE stations CASCADE;
      TRUNCATE TABLE ads CASCADE;
    `);

    // 3. Foydalanuvchilarni tozalab, faqat 1 ta Bosh Super Adminni qoldirish
    console.log('👤 Foydalanuvchilar jadvalini tozalash va faqat Super Adminni yaratish...');
    await pool.query(`TRUNCATE TABLE users CASCADE;`);

    const adminPhone = '+998 77 278 18 08';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    await pool.query(
      `INSERT INTO users (phone, first_name, last_name, password_hash, role, bio)
       VALUES ($1, $2, $3, $4, 'super_admin', 'Bosh administrator')`,
      [adminPhone, 'Ayubxon', 'Xamitov', hash]
    );

    // 4. Tekshiruv hisoboti
    const [u, s, fp, fb, ad] = await Promise.all([
      pool.query('SELECT count(*) FROM users'),
      pool.query('SELECT count(*) FROM stations'),
      pool.query('SELECT count(*) FROM fuel_prices'),
      pool.query('SELECT count(*) FROM feedbacks'),
      pool.query('SELECT count(*) FROM ads'),
    ]);

    console.log('==============================================');
    console.log('✅ BAZA TO\'LIQ NOLGA TUSHIRILDI!');
    console.log(`- Foydalanuvchilar (users): ${u.rows[0].count} ta (Super Admin: ${adminPhone})`);
    console.log(`- Shahobchalar (stations): ${s.rows[0].count} ta (0 ta toza)`);
    console.log(`- Yoqilg'i narxlari (fuel_prices): ${fp.rows[0].count} ta`);
    console.log(`- Fikrlar (feedbacks): ${fb.rows[0].count} ta`);
    console.log(`- Reklamalar (ads): ${ad.rows[0].count} ta`);
    console.log('==============================================');
  } catch (err) {
    console.error('❌ Xatolik:', err);
  } finally {
    await pool.end();
  }
}

resetDb();

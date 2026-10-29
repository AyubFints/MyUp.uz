import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const targetDb = process.env.DB_NAME || 'amaps_db';

async function init() {
  console.log(`🔌 PostgreSQL ga ulanish tekshirilmoqda (${dbConfig.host}:${dbConfig.port}, user: ${dbConfig.user})...`);

  // 1. Standart 'postgres' bazasiga ulanib, targetDb bor-yo'qligini tekshirish
  const clientRoot = new pg.Client({ ...dbConfig, database: 'postgres' });
  try {
    await clientRoot.connect();
    console.log(`✅ PostgreSQL serveriga ulandi!`);

    const checkDb = await clientRoot.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
    if (checkDb.rows.length === 0) {
      console.log(`📦 '${targetDb}' bazasi mavjud emas. Avtomatik yaratilmoqda...`);
      await clientRoot.query(`CREATE DATABASE ${targetDb}`);
      console.log(`🎉 '${targetDb}' bazasi muvaffaqiyatli yaratildi!`);
    } else {
      console.log(`ℹ️ '${targetDb}' bazasi allaqachon mavjud.`);
    }
  } catch (err) {
    console.error(`❌ PostgreSQL ga ulanishda xato:`, err.message);
    console.log(`\n💡 Eslatma: Agar parol noto'g'ri bo'lsa, 'server/.env' faylidagi DB_PASSWORD qiymatini PostgreSQL parolingizga o'zgartiring.`);
    process.exit(1);
  } finally {
    await clientRoot.end();
  }

  // 2. targetDb bazasiga ulanib, schema.sql ni ishga tushirish
  const clientApp = new pg.Client({ ...dbConfig, database: targetDb });
  try {
    await clientApp.connect();
    console.log(`📄 'schema.sql' fayli o'qilmoqda va jadvallar yaratilmoqda...`);

    const schemaPath = path.resolve(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await clientApp.query(schemaSql);
    console.log(`✅ Barcha jadvallar (users, stations, fuel_prices, feedbacks...) muvaffaqiyatli yaratildi!`);

    // 3. Super Admin hisobini yaratish (agar mavjud bo'lmasa)
    const adminPhone = '+998 77 278 18 08';
    const checkAdmin = await clientApp.query(`SELECT id FROM users WHERE phone = $1`, [adminPhone]);

    if (checkAdmin.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const defaultPass = 'admin123';
      const hash = await bcrypt.hash(defaultPass, salt);

      await clientApp.query(
        `INSERT INTO users (phone, first_name, last_name, password_hash, role, bio)
         VALUES ($1, $2, $3, $4, 'super_admin', 'Bosh administrator')`,
        [adminPhone, 'Ayubxon', 'Xamitov', hash]
      );
      console.log(`👑 Bosh Super Admin yaratildi:`);
      console.log(`   Telefon: ${adminPhone}`);
      console.log(`   Parol:   ${defaultPass}`);
      console.log(`   Rol:     super_admin`);
    } else {
      console.log(`ℹ️ Super Admin (${adminPhone}) allaqachon mavjud.`);
    }

    console.log(`\n🚀 Ma'lumotlar bazasi 100% tayyor!`);
  } catch (err) {
    console.error(`❌ Jadvallarni yaratishda xato:`, err.message);
  } finally {
    await clientApp.end();
  }
}

init();

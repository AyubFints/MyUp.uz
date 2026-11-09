import { pool } from '../src/config/db.js';

async function migrate() {
  try {
    console.log('🔄 Foydalanuvchilar jadvaliga joylashuv maydonlarini qo\'shish boshlandi...');
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS responsible_person VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_image TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS can_add_station BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS has_location BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS registered_via_location BOOLEAN DEFAULT false;
    `);
    console.log('✅ Foydalanuvchilar jadvali muvaffaqiyatli yangilandi (Multi-device sync tayyor)!');
  } catch (err) {
    console.error('❌ Joylashuv maydonlarini migratsiya qilishda xato:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

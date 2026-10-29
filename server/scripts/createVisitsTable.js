import { pool } from '../src/config/db.js';

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_visits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        visitor_id VARCHAR(100) NOT NULL,
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_visits_date ON app_visits (visited_at);
      CREATE INDEX IF NOT EXISTS idx_visits_last_seen ON app_visits (last_seen);
    `);
    console.log('✅ app_visits jadvali yaratildi!');
  } catch (err) {
    console.error('Xato:', err.message);
  } finally {
    await pool.end();
  }
}

run();

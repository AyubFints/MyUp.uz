import { pool } from '../src/config/db.js';

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_cards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        card_number VARCHAR(30) NOT NULL,
        holder_name VARCHAR(100),
        bank_name VARCHAR(100),
        card_type VARCHAR(20) DEFAULT 'uzcard',
        is_primary BOOLEAN DEFAULT false,
        balance NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ admin_cards table successfully ensured in PostgreSQL');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();

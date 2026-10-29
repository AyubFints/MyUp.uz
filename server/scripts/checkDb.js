import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function check() {
  try {
    const s = await pool.query('SELECT * FROM stations');
    console.log('STATIONS DETAIL:');
    console.log(JSON.stringify(s.rows, null, 2));

    const fp = await pool.query('SELECT * FROM fuel_prices');
    console.log('FUEL PRICES DETAIL:');
    console.log(JSON.stringify(fp.rows, null, 2));

    const am = await pool.query('SELECT * FROM station_amenities');
    console.log('AMENITIES:');
    console.log(JSON.stringify(am.rows, null, 2));

    const pm = await pool.query('SELECT * FROM station_payments');
    console.log('PAYMENTS:');
    console.log(JSON.stringify(pm.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();

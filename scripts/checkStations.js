import { pool } from '../server/src/config/db.js';
async function run() {
  try {
    const res = await pool.query('SELECT * FROM stations ORDER BY created_at DESC LIMIT 20;');
    console.log('Count:', res.rows.length);
    for (const row of res.rows) {
      console.log('ID:', row.id, 'Name:', row.name, 'Approved:', row.is_approved, 'Status:', row.status, 'Created:', row.created_at);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}
run();

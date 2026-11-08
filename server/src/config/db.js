import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prodEnvPath = path.resolve(__dirname, '../../.env.production');
const defaultEnvPath = path.resolve(__dirname, '../../.env');
if (process.env.NODE_ENV === 'production' && fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath });
} else {
  dotenv.config({ path: defaultEnvPath });
}

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';
const useSsl = process.env.DB_SSL === 'true' || (isProduction && process.env.DB_SSL !== 'false' && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1');

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'amaps_db',
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      }
);

pool.on('error', (err, client) => {
  console.error('Kutilmagan PostgreSQL xatosi (idle client):', err.message);
});

// Helper query function
export const query = (text, params) => pool.query(text, params);


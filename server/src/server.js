import path from 'path';
import { fileURLToPath } from 'url';
const __server_dir = path.dirname(fileURLToPath(import.meta.url));
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import apiRoutes from './routes/index.js';

dotenv.config({ path: path.join(__server_dir, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Productionda xavfsiz domenlar qo'yiladi
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Server sog'lig'ini tekshirish (Health Check)
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW() AS "currentTime"');
    res.json({
      success: true,
      status: 'Server ishlamoqda',
      database: 'PostgreSQL ulangan',
      dbTime: dbTest.rows[0].currentTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'Server ishlamoqda',
      database: 'PostgreSQL ga ulanishda xato: ' + err.message,
    });
  }
});

// API Marshrutlari (Routes)
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Bunday API marshrut mavjud emas.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Ichki server xatoligi:', err);
  res.status(500).json({ success: false, message: 'Server ichki xatoligi: ' + err.message });
});

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 MyUp Backend Server ishga tushdi!`);
  console.log(`🌐 Manzil: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

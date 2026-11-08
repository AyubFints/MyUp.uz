import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import apiRoutes from './routes/index.js';

const __server_dir = path.dirname(fileURLToPath(import.meta.url));

// Muhit o'zgaruvchilarini yuklash (.env.production yoki .env)
const prodEnvPath = path.join(__server_dir, '../.env.production');
const defaultEnvPath = path.join(__server_dir, '../.env');
if (process.env.NODE_ENV === 'production' && fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath });
} else {
  dotenv.config({ path: defaultEnvPath });
}

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Nginx teskari proksi ortida haqiqiy mijoz IP manzilini aniqlash
app.set('trust proxy', 1);

// 2. Helmet xavfsizlik sarlavhalari (xarita koshinlari va ommaviy media uchun cross-origin ruxsat etilgan)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 3. Dinamik CORS sozlamasi (CORS_ORIGIN vergul bilan ajratilgan domenlar)
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Brauzersiz (masalan curl, mobile app yoki server-to-server) so'rovlar
    if (!origin) return callback(null, true);

    // Ishlab chiqish muhitida lokal domenlarga ruxsat berish
    if (process.env.NODE_ENV !== 'production') {
      const isLocal =
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('https://localhost') ||
        origin.startsWith('https://127.0.0.1');
      if (isLocal) {
        return callback(null, true);
      }
    }

    // Sozlangan domenlar ro'yxatida mavjudligini tekshirish
    if (configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error(`CORS taqiqlangan manzil: ${origin}`);
    corsError.statusCode = 403;
    return callback(corsError, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};
app.use(cors(corsOptions));

// 4. HTTP javoblarni siqish (1KB dan katta javoblar gzip/brotli orqali siqiladi)
app.use(
  compression({
    threshold: 1024,
  })
);

// 5. Katta hajmdagi JSON va form ma'lumotlarini qabul qilish
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 6. To'liq tizim va ma'lumotlar bazasi holati (Health Check)
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  try {
    const dbTest = await pool.query('SELECT NOW() AS "currentTime"');
    const responseTimeMs = Date.now() - startTime;
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      responseTimeMs,
      database: 'connected',
      dbTime: dbTest.rows[0]?.currentTime,
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`,
      },
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: 'disconnected',
      error: err.message,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    });
  }
});

// 7. Rate Limiting sozlamalari
// Umumiy API cheklovi: har bir IP uchun 15 daqiqada 300 so'rov
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: "Juda ko'p so'rov yuborildi. Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring.",
  },
});

// Qat'iy autentifikatsiya cheklovi: login va register uchun 15 daqiqada 20 so'rov
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: "Kirish yoki ro'yxatdan o'tish bo'yicha limit oshirildi. Iltimos, 15 daqiqadan so'ng urinib ko'ring.",
  },
});

// Auth yo'nalishlariga qat'iy cheklov o'rnatish
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', strictAuthLimiter);

// Barcha /api/ yo'nalishlariga umumiy cheklov o'rnatish
app.use('/api/', generalApiLimiter);

// 8. Asosiy API marshrutlari
app.use('/api', apiRoutes);

// 9. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Bunday API marshrut mavjud emas.' });
});

// 10. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Ichki server xatoligi:', err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ success: false, message: err.message || 'Server ichki xatoligi' });
});

// 11. Serverni ishga tushirish va Graceful Shutdown
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 MyUp Backend Server ishga tushdi!`);
  console.log(`🌐 Manzil: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 ${signal} signali qabul qilindi. Server to'xtatilmoqda...`);

  server.close(async () => {
    console.log('🔒 HTTP server ulanishlari toza yopildi.');
    try {
      await pool.end();
      console.log('📦 PostgreSQL ulanishlar puli (pool) yopildi.');
      process.exit(0);
    } catch (err) {
      console.error('PostgreSQL pulini yopishda xato:', err.message);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Majburiy to'xtatildi (timeout).");
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


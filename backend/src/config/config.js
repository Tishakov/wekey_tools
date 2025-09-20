const path = require('path');

// Ищем .env файл в папке backend
require('dotenv').config({ 
  path: path.join(__dirname, '../../.env') 
});

// Определяем тип БД
const usesSQLite = process.env.DB_DIALECT === 'sqlite';

module.exports = {
  // Сервер
  PORT: process.env.PORT || 8880,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // База данных
  database: {
    development: usesSQLite ? {
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: console.log
    } : {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wekey_tools_dev',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log
    },
    production: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  
  // JWT токены
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS настройки
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 минут
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 запросов
    message: 'Слишком много запросов с этого IP'
  },
  
  // Админ настройки
  admin: {
    defaultEmail: process.env.ADMIN_EMAIL || 'admin@wekey.tools',
    defaultPassword: process.env.ADMIN_PASSWORD || 'admin123'
  },
  
  // Платежи (для будущего)
  payments: {
    stripeSecret: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
};
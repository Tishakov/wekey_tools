const path = require('path');
const fs = require('fs');

// Приоритет загрузки: .env.local → .env
// .env.local содержит реальные ключи (не коммитится в git)
// .env содержит шаблоны (коммитится в git)
const envLocalPath = path.join(__dirname, '../../.env.local');
const envPath = path.join(__dirname, '../../.env');

if (fs.existsSync(envLocalPath)) {
  console.log('✅ Loading environment from .env.local');
  require('dotenv').config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('⚠️  Loading environment from .env (using template values)');
  console.log('💡 Create .env.local for real API keys. See: SECURITY_QUICK_START.md');
  require('dotenv').config({ path: envPath });
} else {
  console.error('❌ No .env or .env.local file found!');
  console.error('📖 Please create .env.local from .env.example');
  process.exit(1);
}

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
  },
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8880/auth/google/callback'
  }
};
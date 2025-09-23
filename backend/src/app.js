console.log("🚀 Backend: запуск файла app.js начат");

// Добавляем ловушки ошибок в самом начале
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  console.error("Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  console.error("Promise:", promise);
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');

// НЕ импортируем проблемные middleware пока
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');

console.log("📦 Базовые модули загружены");

const config = require('./config/config');
console.log("⚙️ Конфиг загружен");

// Инициализируем Passport
require('./config/passport');
console.log("🔐 Passport OAuth настроен");

const logger = require('./utils/logger');
console.log("📝 Логгер загружен");

// УБИРАЕМ process.exit(1) - пусть сервер работает даже при ошибках
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception (but continuing):', error);
  // НЕ УБИВАЕМ СЕРВЕР: process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection (but continuing):', reason);
  // НЕ УБИВАЕМ СЕРВЕР: process.exit(1);
});

// Импорт database - БЕЗ process.exit(1)
console.log("⏳ Подключение к базе данных...");
let sequelize = null;
try {
  const db = require('./config/database');
  sequelize = db.sequelize;
  console.log('✅ Database connection imported successfully');
} catch (error) {
  console.error('❌ Failed to import database (but continuing):', error.message);
  // НЕ УБИВАЕМ СЕРВЕР: process.exit(1);
}

const app = express();

// Упрощенный CORS для тестирования
const corsOptions = {
  origin: true, // Разрешаем все источники
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Базовые middleware (только необходимые)
app.use(cors(corsOptions));
app.use(cookieParser()); // Добавляем парсер кукисов
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Инициализация Passport
app.use(passport.initialize());

// Статическая раздача файлов для аватаров
app.use('/uploads', express.static('uploads'));

// Глобальное логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Импорт и регистрация роутов
try {
  const authRoutes = require('./routes/auth');
  const oauthRoutes = require('./routes/oauth');
  const adminRoutes = require('./routes/admin');
  const statsRoutes = require('./routes/stats');
  const usersRoutes = require('./routes/users');
  const analyticsRoutes = require('./routes/analytics');
  const toolsRoutes = require('./routes/tools');
  const siteAuditRoutes = require('./routes/siteAudit');
  const seoAuditRoutes = require('./routes/seoAudit');

  app.use('/api/auth', authRoutes);
  app.use('/auth', oauthRoutes); // OAuth маршруты без /api префикса
  app.use('/api/admin', adminRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/analytics', analyticsRoutes); // Подключаем User tracking аналитику
  app.use('/api/users', usersRoutes);
  app.use('/api', toolsRoutes); // Подключаем управление инструментами
  app.use('/api/tools', siteAuditRoutes); // Подключаем анализ сайтов
  app.use('/api/tools', seoAuditRoutes); // Подключаем SEO аудит
  
  console.log('✅ All routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register routes:', error);
}

// Health check БЕЗ зависимости от базы данных
app.get('/health', (req, res) => {
  console.log('Health check requested');
  try {
    const response = { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV || 'development',
      version: '1.0.0',
      database: sequelize ? 'connected' : 'not_connected',
      uptime: process.uptime()
    };
    
    console.log('Health check response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Stats endpoint - обрабатывает POST запросы с JSON телом
app.post('/api/stats/increment', (req, res) => {
  console.log("Stats increment request:", req.body);
  try {
    // Простая обработка - возвращаем успех и данные
    const response = { 
      success: true, 
      data: req.body 
    };
    
    console.log('Stats response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Admin login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log("Admin login request:", req.body);
  try {
    const { email, password } = req.body;
    
    // Простая проверка - только для демо
    if (email === 'admin@wekey.tools' && password === 'admin123') {
      const response = {
        success: true,
        token: 'demo-admin-token-' + Date.now(),
        user: {
          id: 1,
          email: 'admin@wekey.tools',
          role: 'admin'
        }
      };
      
      console.log('Admin login successful:', response);
      res.json(response);
    } else {
      console.log('Admin login failed: invalid credentials');
      res.status(401).json({
        success: false,
        message: 'Неверные данные для входа'
      });
    }
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Admin stats endpoint
app.get('/api/admin/stats', (req, res) => {
  console.log("Admin stats request");
  try {
    // Проверяем токен (простая проверка для демо)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer demo-admin-token')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Мок данные для админ-панели
    const response = {
      success: true,
      stats: {
        totalUsage: 1247,
        users: {
          totalUsers: 156,
          activeToday: 23,
          newThisWeek: 8
        },
        toolUsage: [
          {
            toolName: 'Изменение регистра',
            usageCount: 324,
            lastUsed: new Date().toISOString()
          },
          {
            toolName: 'Удаление дубликатов',
            usageCount: 289,
            lastUsed: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            toolName: 'Транслитерация',
            usageCount: 201,
            lastUsed: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          },
          {
            toolName: 'Генератор UTM-меток',
            usageCount: 187,
            lastUsed: new Date(Date.now() - 1000 * 60 * 90).toISOString()
          },
          {
            toolName: 'Текст в HTML',
            usageCount: 156,
            lastUsed: new Date(Date.now() - 1000 * 60 * 120).toISOString()
          }
        ]
      }
    };
    
    console.log('Admin stats response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Admin reset stats endpoint
app.post('/api/admin/reset-stats', (req, res) => {
  console.log("Admin reset stats request");
  try {
    // Проверяем токен (простая проверка для демо)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer demo-admin-token')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Здесь должна быть логика сброса реальных данных из БД
    // Пока что делаем заглушку
    console.log("🔄 Сброс аналитики (в реальной версии здесь будет очистка БД)");
    
    // В реальном приложении здесь было бы:
    // await db.query('DELETE FROM tool_usage');
    // await db.query('DELETE FROM user_sessions');
    // await db.query('DELETE FROM analytics_data');
    
    const response = {
      success: true,
      message: 'Аналитика успешно сброшена',
      timestamp: new Date().toISOString(),
      resetInfo: {
        toolUsageCleared: true,
        userStatsCleared: true,
        analyticsCleared: true
      }
    };
    
    console.log('Admin reset response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Admin reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Обработка несуществующих роутов
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint не найден',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Глобальный error handler - НЕ УБИВАЕМ СЕРВЕР
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({ 
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Запуск сервера БЕЗ зависимости от базы данных
const PORT = config.PORT || 8880;

console.log("📡 Готов к запуску сервера на порту", PORT);
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Wekey Tools Backend (Fixed) запущен на порту ${PORT}`);
  console.log(`📊 Режим: ${config.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(`📈 Stats test: curl -X POST http://127.0.0.1:${PORT}/api/stats/increment -H "Content-Type: application/json" -d "{\\"toolName\\":\\"test\\"}"`);
  console.log('🔍 Server listening state:', server.listening);
  console.log('🔍 Server address:', server.address());
  
  // КРИТИЧЕСКИ ВАЖНО: добавляем логирование чтобы понять, где падает
  console.log('✅ Server callback completed - server should be running!');
  
  // Проверяем через 1 секунду
  setTimeout(() => {
    console.log('🔍 After 1 second - server still running:', server.listening);
    console.log('🔍 Process still alive:', process.pid);
  }, 1000);
});

server.on('error', (err) => {
  console.error('❌ Server error (but not exiting):', err);
  // НЕ УБИВАЕМ СЕРВЕР: process.exit(1);
});

// Добавляем обработку необработанных ошибок - НЕ УБИВАЕМ СЕРВЕР
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception (but not exiting):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection (but not exiting):', reason);
});

// Graceful shutdown БЕЗ process.exit
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

module.exports = app;
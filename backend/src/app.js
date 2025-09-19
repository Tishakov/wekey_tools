const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Страховка от необработанных ошибок
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Импорт database после обработчиков ошибок
let sequelize;
try {
  const db = require('./config/database');
  sequelize = db.sequelize;
  logger.info('✅ Database connection imported successfully');
} catch (error) {
  logger.error('❌ Failed to import database:', error.message);
  process.exit(1);
}

// Импорт роутов
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// Базовые middleware
app.use(helmet()); // Безопасность
app.use(compression()); // Сжатие ответов
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // Логирование

// CORS
app.use(cors(config.cors));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// Health check с детальной информацией
app.get('/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      version: '1.0.0',
      database: sequelize ? 'connected' : 'disconnected',
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// Обработка несуществующих роутов
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint не найден',
    path: req.originalUrl
  });
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const PORT = config.PORT;

// Инициализация базы данных
async function startServer() {
  try {
    if (!sequelize) {
      throw new Error('Database connection not available');
    }
    
    // Синхронизация базы данных
    await sequelize.sync({ force: false });
    logger.info('✅ База данных синхронизирована');
    
    // Запуск сервера
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Wekey Tools Backend запущен на порту ${PORT}`);
      logger.info(`📊 Режим: ${config.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      
      // Дополнительная проверка
      console.log('🔍 Server listening state:', server.listening);
      console.log('🔍 Server address:', server.address());
    });

    server.on('error', (err) => {
      logger.error('❌ Server error:', err);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });
    
  } catch (error) {
    logger.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
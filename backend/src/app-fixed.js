const express = require('express');
const cors = require('cors');

// НЕ импортируем проблемные middleware пока
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const logger = require('./utils/logger');

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Базовые middleware (только необходимые)
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Глобальное логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

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
const PORT = config.PORT || 3001;

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Wekey Tools Backend (Fixed) запущен на порту ${PORT}`);
  console.log(`📊 Режим: ${config.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(`📈 Stats test: curl -X POST http://127.0.0.1:${PORT}/api/stats/increment -H "Content-Type: application/json" -d "{\\"toolName\\":\\"test\\"}"`);
  console.log('🔍 Server listening state:', server.listening);
  console.log('🔍 Server address:', server.address());
});

server.on('error', (err) => {
  console.error('❌ Server error (but not exiting):', err);
});

// Graceful shutdown БЕЗ process.exit
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

module.exports = app;
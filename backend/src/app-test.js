const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const logger = require('./utils/logger');

const app = express();
const PORT = config.PORT || 3001;

// Простые middleware без блокирующих элементов
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check БЕЗ зависимости от базы данных
app.get('/health', (req, res) => {
  console.log('Health check requested');
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Тестовый endpoint для статистики (без базы данных)
app.post('/api/stats/increment', (req, res) => {
  console.log('Stats increment received:', req.body);
  try {
    res.json({ 
      success: true, 
      message: 'Статистика обновлена (тестовый режим)',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Обработка несуществующих роутов
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint не найден',
    path: req.originalUrl
  });
});

// Простой обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// Запуск сервера БЕЗ базы данных
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Test server running on http://127.0.0.1:${PORT}`);
  console.log(`📋 Health: http://127.0.0.1:${PORT}/health`);
  console.log(`📊 Stats: curl -X POST http://127.0.0.1:${PORT}/api/stats/increment -H "Content-Type: application/json" -d "{\\"toolName\\":\\"test\\"}"`);
  console.log('🔍 Server listening state:', server.listening);
  console.log('🔍 Server address:', server.address());
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// НЕ используем process.exit() - пусть сервер работает даже при ошибках
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception (but continuing):', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection (but continuing):', reason);
});

module.exports = app;
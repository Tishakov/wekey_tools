const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Минимальные middleware
app.use(cors());
app.use(express.json());

// Логирование
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Stats endpoint
app.post('/api/stats/increment', (req, res) => {
  console.log('Stats increment received:', req.body);
  res.json({ 
    success: true, 
    message: 'Статистика обновлена',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not found',
    path: req.url
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Запуск сервера
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Minimal server running on http://127.0.0.1:${PORT}`);
  console.log('📋 Health: http://127.0.0.1:3001/health');
  console.log('🔍 Server address:', server.address());
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

module.exports = app;
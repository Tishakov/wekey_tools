const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Простейшие middleware
app.use(cors());
app.use(express.json());

// Глобальное логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

// Health endpoint в самом начале
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Тестовый endpoint для статистики
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
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found', url: req.url });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Запуск сервера
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Simple server running on http://127.0.0.1:${PORT}`);
  console.log(`📋 Test with: curl http://127.0.0.1:${PORT}/health`);
  console.log(`📊 Stats test: curl -X POST http://127.0.0.1:${PORT}/api/stats/increment -H "Content-Type: application/json" -d "{\\"toolName\\":\\"test\\"}"`);
});

module.exports = app;
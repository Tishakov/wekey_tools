const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: '1.0.0'
  });
});

// Login endpoint (without JWT for simplicity)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@wekey.tools' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Успешный вход в систему',
      token: 'fake_token_for_testing',
      user: {
        id: 1,
        email: 'admin@wekey.tools',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Неверные данные для входа'
    });
  }
});

// Admin stats endpoint - ИСПРАВЛЕННАЯ СТРУКТУРА под фронтенд
app.get('/api/admin/stats', (req, res) => {
  // ВАЖНО: отдаём структуру БЕЗ обёртки success/data
  res.json({
    stats: {
      totalUsage: 1250,
      users: {
        totalUsers: 50,
        activeToday: 15,
        newThisWeek: 5
      },
      toolUsage: [
        { 
          toolName: 'Генератор паролей', 
          usageCount: 150, 
          lastUsed: new Date().toISOString() 
        },
        { 
          toolName: 'Изменение регистра', 
          usageCount: 120, 
          lastUsed: new Date(Date.now() - 24*60*60*1000).toISOString() 
        },
        { 
          toolName: 'Удаление дубликатов', 
          usageCount: 100, 
          lastUsed: new Date(Date.now() - 48*60*60*1000).toISOString() 
        }
      ]
    }
  });
});

// Users endpoint
app.get('/api/admin/users', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        email: 'admin@wekey.tools',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        email: 'user@example.com',
        role: 'user',
        createdAt: '2025-01-02T00:00:00.000Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  });
});

// Tools stats endpoint
app.get('/api/admin/tools-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      timeframe: '30d',
      tools: [
        {
          toolName: 'Генератор паролей',
          usageCount: 150,
          uniqueUsers: 45,
          avgInputLength: 12,
          avgProcessingTime: 50
        },
        {
          toolName: 'Изменение регистра',
          usageCount: 120,
          uniqueUsers: 38,
          avgInputLength: 200,
          avgProcessingTime: 25
        }
      ]
    }
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Тестовый сервер запущен на порту ${PORT}`);
  console.log(`📊 Режим: test`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Admin stats: http://localhost:${PORT}/api/admin/stats`);
});
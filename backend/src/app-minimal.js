const express = require('express');
const cors = require('cors');

// Обработка необработанных ошибок
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error('Stack:', err.stack);
    // НЕ завершаем процесс - логируем и продолжаем
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // НЕ завершаем процесс - логируем и продолжаем
});

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Временное хранилище статистики
let toolStats = {};
let totalUsage = 0;

// Временное хранилище аналитики
let visitors = new Map(); // userId -> VisitorData
let analyticsEvents = []; // массив событий
let dailyStats = new Map(); // date -> { visitors: Set, toolUsers: Set }

// Историческая статистика по дням для графиков
let historicalData = new Map(); // date -> { visitors: number, toolUsers: number, usageCount: number }

// Вспомогательная функция для получения даты в формате YYYY-MM-DD
function getDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Функция для генерации тестовых данных за последние 30 дней
function generateHistoricalData() {
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = getDateKey(date);
    
    // Генерируем случайные, но реалистичные данные
    const baseVisitors = Math.floor(Math.random() * 50) + 10; // 10-60 посетителей
    const baseToolUsers = Math.floor(baseVisitors * (0.3 + Math.random() * 0.4)); // 30-70% конверсия
    const baseUsage = Math.floor(baseToolUsers * (1 + Math.random() * 3)); // 1-4 использования на пользователя
    
    historicalData.set(dateKey, {
      visitors: baseVisitors,
      toolUsers: baseToolUsers,
      usageCount: baseUsage
    });
  }
}

// Генерируем исторические данные при запуске
if (historicalData.size === 0) {
  generateHistoricalData();
  console.log('📊 [ANALYTICS] Generated historical data for', historicalData.size, 'days');
}

// Функция для получения человекочитаемых названий инструментов
function getToolDisplayName(toolKey) {
  const displayNames = {
    'add_symbol_tool': 'Добавление символа',
    'analytics_tool': 'Сквозная аналитика',
    'case_changer_tool': 'Изменения регистра',
    'char_counter_tool': 'Количество символов',
    'duplicate_finder_tool': 'Поиск дубликатов',
    'duplicate_removal_tool': 'Удаление дубликатов',
    'emoji_tool': 'Эмодзи',
    'empty_lines_removal_tool': 'Удаление пустых строк',
    'find_replace_tool': 'Найти и заменить',
    'match_types_tool': 'Типы соответствия',
    'minus_words_tool': 'Обработка минус-слов',
    'number_generator_tool': 'Генератор чисел',
    'password_generator_tool': 'Генератор паролей',
    'remove_line_breaks_tool': 'Удаление переносов',
    'spaces_to_paragraphs_tool': 'Пробелы на абзацы',
    'synonym_generator_tool': 'Генератор синонимов',
    'text_by_columns_tool': 'Текст по столбцам',
    'text_generator_tool': 'Генератор текста',
    'text_optimizer_tool': 'Оптимизатор текста',
    'text_sorting_tool': 'Сортировка слов и строк',
    'text_to_html_tool': 'Текст в HTML',
    'transliteration_tool': 'Транслитерация',
    'utm_generator_tool': 'Генератор UTM-меток',
    'word_gluing_tool': 'Склейка слов',
    'word_inflection_tool': 'Склонение слов',
    'word_mixer_tool': 'Миксация слов',
    // Поддержка старых ID для совместимости
    'udalenie_pustyh_strok': 'Удаление пустых строк',
    'izmeneniya_registra': 'Изменения регистра',
    'udalenie_dublikatov': 'Удаление дубликатов',
    'sortirovka_slov_i_strok': 'Сортировка слов и строк',
    'nayti_i_zamenit': 'Найти и заменить',
    'tekst_v_html': 'Текст в HTML',
    'probeli_na_abzacy': 'Пробелы на абзацы',
    'utm_generator': 'Генератор UTM-меток',
    'duplicate-finder': 'Поиск дубликатов'
  };
  return displayNames[toolKey] || toolKey;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Login endpoint (возвращает mock токен)
app.post('/api/auth/login', (req, res) => {
  console.log('🔑 [LOGIN] Request body:', JSON.stringify(req.body, null, 2));
  
  const { email, password } = req.body;
  console.log('🔑 [LOGIN] Credentials check:', { email, password: '***' });
  
  if (email === 'admin@wekey.tools' && password === 'admin123') {
    const token = `mock-jwt-token-${Date.now()}`;
    console.log('✅ [LOGIN] Authentication successful, token generated:', token);
    return res.json({ token });
  }
  
  console.log('❌ [LOGIN] Authentication failed - invalid credentials');
  res.status(401).json({ message: 'Invalid credentials' });
});

// Middleware авторизации
function authMiddleware(req, res, next) {
  console.log('🔒 [AUTH] Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔒 [AUTH] Request body:', JSON.stringify(req.body, null, 2));
  
  const authHeader = req.headers.authorization;
  console.log('🔒 [AUTH] Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [AUTH] Missing or invalid Bearer header format');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  console.log('🔒 [AUTH] Extracted token:', token);

  const isValid = token === 'demo-admin-token' || token.startsWith('mock-jwt-token-');
  console.log('🔒 [AUTH] Token validation:', { 
    token: token.substring(0, 20) + '...', 
    isDemoToken: token === 'demo-admin-token',
    isMockJwtToken: token.startsWith('mock-jwt-token-'),
    isValid 
  });
  
  if (!isValid) {
    console.log('❌ [AUTH] Token validation failed');
    return res.status(401).json({ success: false, message: 'Unauthorized token' });
  }
  
  console.log('✅ [AUTH] Token validation successful');
  next();
}

// === ANALYTICS API ===

// Обновление данных посетителя
app.post('/api/analytics/visitor', (req, res) => {
  console.log('📊 [ANALYTICS] Visitor data received:', req.body);
  
  try {
    const visitorData = req.body;
    const userId = visitorData.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    // Сохраняем данные посетителя
    visitors.set(userId, visitorData);
    
    // Обновляем дневную статистику
    const dateKey = getDateKey();
    if (!dailyStats.has(dateKey)) {
      dailyStats.set(dateKey, {
        visitors: new Set(),
        toolUsers: new Set()
      });
    }
    
    const todayStats = dailyStats.get(dateKey);
    todayStats.visitors.add(userId);
    
    if (visitorData.hasUsedTools) {
      todayStats.toolUsers.add(userId);
    }
    
    // Обновляем исторические данные для текущего дня
    const currentHistorical = historicalData.get(dateKey) || { visitors: 0, toolUsers: 0, usageCount: 0 };
    historicalData.set(dateKey, {
      visitors: todayStats.visitors.size,
      toolUsers: todayStats.toolUsers.size,
      usageCount: currentHistorical.usageCount // usageCount обновляется в другом месте
    });
    
    console.log('📊 [ANALYTICS] Visitor data saved for user:', userId);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ [ANALYTICS] Error saving visitor data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Обработка событий аналитики
app.post('/api/analytics/event', (req, res) => {
  console.log('📊 [ANALYTICS] Event received:', req.body);
  
  try {
    const eventData = req.body;
    const { userId, event, data } = eventData;
    
    if (!userId || !event || !data) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Сохраняем событие
    analyticsEvents.push({
      ...eventData,
      timestamp: new Date().toISOString()
    });

    // Если это использование инструмента, обновляем статистику
    if (event === 'tool_usage' && data.tool) {
      const dateKey = getDateKey();
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, {
          visitors: new Set(),
          toolUsers: new Set()
        });
      }
      
      const todayStats = dailyStats.get(dateKey);
      todayStats.toolUsers.add(userId);
      
      // Обновляем исторические данные - увеличиваем счетчик использований
      const currentHistorical = historicalData.get(dateKey) || { visitors: 0, toolUsers: 0, usageCount: 0 };
      historicalData.set(dateKey, {
        visitors: currentHistorical.visitors,
        toolUsers: todayStats.toolUsers.size,
        usageCount: currentHistorical.usageCount + 1
      });
    }
    
    console.log('📊 [ANALYTICS] Event saved:', event, 'for user:', userId);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ [ANALYTICS] Error saving event:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Публичный endpoint для статистики (без авторизации)
app.get('/api/analytics/stats', (req, res) => {
  console.log('📊 [PUBLIC] Analytics stats requested');
  
  try {
    // Подсчитываем общую статистику
    const totalVisitors = visitors.size;
    const toolUsers = Array.from(visitors.values()).filter(v => v.hasUsedTools).length;
    const totalEvents = analyticsEvents.length;
    const activeTools = new Set(analyticsEvents.map(e => e.toolId)).size;
    
    // Подсчитываем конверсию
    const conversionRate = totalVisitors > 0 ? (toolUsers / totalVisitors * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        visitors: totalVisitors,
        users: toolUsers,
        usage: totalEvents,
        tools: activeTools,
        conversion: parseFloat(conversionRate),
        tokens: 1250 // Фиксированное значение для демо
      }
    });
  } catch (error) {
    console.error('❌ [PUBLIC] Error getting analytics stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Публичный endpoint для исторических данных (без авторизации)
app.get('/api/analytics/history', (req, res) => {
  console.log('📊 [PUBLIC] Analytics history requested');
  
  try {
    res.json({
      success: true,
      data: historicalData
    });
  } catch (error) {
    console.error('❌ [PUBLIC] Error getting analytics history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Получение аналитики для админ-панели
app.get('/api/admin/analytics', authMiddleware, (req, res) => {
  console.log('📊 [ADMIN] Analytics requested');
  
  try {
    // Подсчитываем общую статистику
    const totalVisitors = visitors.size;
    const toolUsers = Array.from(visitors.values()).filter(v => v.hasUsedTools).length;
    
    // Статистика за сегодня
    const dateKey = getDateKey();
    const todayStats = dailyStats.get(dateKey) || { visitors: new Set(), toolUsers: new Set() };
    
    const analytics = {
      total: {
        visitors: totalVisitors,
        toolUsers: toolUsers,
        conversionRate: totalVisitors > 0 ? ((toolUsers / totalVisitors) * 100).toFixed(1) : 0
      },
      today: {
        visitors: todayStats.visitors.size,
        toolUsers: todayStats.toolUsers.size,
        conversionRate: todayStats.visitors.size > 0 ? 
          ((todayStats.toolUsers.size / todayStats.visitors.size) * 100).toFixed(1) : 0
      },
      events: analyticsEvents.length
    };
    
    console.log('📊 [ADMIN] Returning analytics:', analytics);
    res.json({ success: true, analytics });
    
  } catch (error) {
    console.error('❌ [ADMIN] Error getting analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Получение исторических данных для графиков
app.get('/api/admin/analytics/historical', authMiddleware, (req, res) => {
  console.log('📊 [ADMIN] Historical analytics requested');
  
  try {
    const { startDate, endDate } = req.query;
    
    // Если даты не указаны, возвращаем последние 30 дней
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    
    const result = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateKey = getDateKey(currentDate);
      const data = historicalData.get(dateKey) || { visitors: 0, toolUsers: 0, usageCount: 0 };
      
      result.push({
        date: dateKey,
        visitors: data.visitors,
        toolUsers: data.toolUsers,
        usageCount: data.usageCount,
        conversionRate: data.visitors > 0 ? ((data.toolUsers / data.visitors) * 100).toFixed(1) : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('📊 [ADMIN] Returning historical data:', result.length, 'days');
    res.json({ success: true, data: result });
    
  } catch (error) {
    console.error('❌ [ADMIN] Error getting historical analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === EXISTING ENDPOINTS ===

// Admin stats
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  console.log('📊 [ADMIN] Admin stats requested');
  
  // Преобразуем stats для отображения с человекочитаемыми названиями
  const displayStats = {};
  Object.entries(toolStats).forEach(([toolKey, data]) => {
    const displayName = getToolDisplayName(toolKey);
    displayStats[displayName] = {
      count: data.count,
      lastUsed: data.lastUsed,
      originalKey: toolKey // Сохраняем оригинальный ключ для справки
    };
  });
  
  console.log('📊 [ADMIN] Returning stats with display names:', Object.keys(displayStats));
  
  res.json({ 
    success: true, 
    stats: displayStats, 
    totalUsage 
  });
});

// Reset stats
app.post('/api/admin/reset-stats', authMiddleware, (req, res) => {
  const hasData = Object.keys(toolStats).some(k => toolStats[k].count > 0);
  if (!hasData) {
    return res.json({ success: true, message: 'stats already empty' });
  }

  Object.keys(toolStats).forEach(k => {
    toolStats[k].count = 0;
    toolStats[k].lastUsed = new Date().toISOString();
  });
  totalUsage = 0;

  res.json({
    success: true,
    message: 'stats cleared',
    timestamp: new Date().toISOString()
  });
});

// Stats increment endpoint для инструментов
app.post('/api/stats/increment', (req, res) => {
  console.log('📈 [STATS] Stats increment request:', JSON.stringify(req.body, null, 2));
  
  const { toolName, toolId } = req.body;
  const key = toolId || toolName; // Поддерживаем оба варианта
  
  if (!key) {
    console.log('❌ [STATS] Missing toolName or toolId');
    return res.status(400).json({ 
      success: false, 
      message: 'toolName or toolId is required' 
    });
  }
  
  console.log(`📊 [STATS] Incrementing stats for: ${key}`);
  
  // Инициализируем если не существует
  if (!toolStats[key]) {
    toolStats[key] = { count: 0, lastUsed: new Date().toISOString() };
    console.log(`🆕 [STATS] Created new tool entry: ${key}`);
  }
  
  // Увеличиваем счетчик
  toolStats[key].count += 1;
  toolStats[key].lastUsed = new Date().toISOString();
  totalUsage += 1;
  
  console.log(`✅ [STATS] Updated stats for ${key}:`, {
    count: toolStats[key].count,
    totalUsage,
    lastUsed: toolStats[key].lastUsed
  });
  
  res.json({
    success: true,
    message: 'Статистика обновлена',
    toolName: getToolDisplayName(key),
    count: toolStats[key].count,
    totalUsage,
    timestamp: new Date().toISOString()
  });
});

// Get stats for specific tool
app.get('/api/stats/tool/:toolName', (req, res) => {
  console.log('📊 [STATS] Get tool stats request for:', req.params.toolName);
  
  const toolName = req.params.toolName;
  const stats = toolStats[toolName];
  
  if (!stats) {
    console.log(`📊 [STATS] No stats found for ${toolName}, returning 0`);
    return res.json({
      success: true,
      toolName: toolName,
      displayName: getToolDisplayName(toolName),
      count: 0,
      lastUsed: null
    });
  }
  
  console.log(`📊 [STATS] Found stats for ${toolName}:`, stats);
  
  res.json({
    success: true,
    toolName: toolName,
    displayName: getToolDisplayName(toolName),
    count: stats.count,
    lastUsed: stats.lastUsed
  });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
  console.log(`📍 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(`📊 Admin login: http://127.0.0.1:${PORT}/api/auth/login`);
  
  // Проверяем что сервер действительно работает
  setTimeout(() => {
    console.log('✅ Server is still running after 1 second');
    console.log('🔍 Server address:', server.address());
  }, 1000);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
  process.exit(1);
});

// Предотвращаем завершение процесса
process.stdin.resume();

console.log('🔧 Server setup completed, app.listen() called');
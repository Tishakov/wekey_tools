const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
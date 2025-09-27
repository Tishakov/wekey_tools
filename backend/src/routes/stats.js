const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { optionalAuth, checkApiLimit, incrementApiUsage } = require('../middleware/auth');
// const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Функция нормализации имён инструментов
function normalizeToolName(toolName) {
  if (!toolName) return toolName;
  
  // Преобразуем из формата frontend в формат backend
  return toolName
    .replace(/_tool$/, '') // убираем суффикс _tool
    .replace(/_/g, '-');   // заменяем подчеркивания на дефисы
}

// Простая заглушка для AppError
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
  }
}

const router = express.Router();

// Middleware для валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: `Ошибка валидации: ${errors.array().map(e => e.msg).join(', ')}`,
      errors: errors.array()
    });
  }
  next();
};

// Валидаторы
// Валидаторы
const toolNameValidator = body('toolName')
  .isIn([
    // Форматы с дефисами
    'case-changer', 'remove-duplicates', 'duplicate-finder',
    'text-to-html', 'text-optimizer', 'spaces-to-paragraphs',
    'text-sorting', 'remove-empty-lines', 'transliteration',
    'minus-words', 'utm-generator', 'cross-analytics',
    'word-gluing', 'word-mixer', 'remove-line-breaks',
    'add-symbol', 'find-replace', 'text-generator',
    'synonym-generator', 'word-declension', 'text-by-columns',
    'char-counter', 'match-types', 'number-generator',
    'password-generator', 'emoji', 'site-audit', 'seo-audit', 'seoauditpro',
    'privacy-policy-generator', 'qr-generator',
    // Форматы с подчеркиваниями
    'case_changer_tool', 'remove_duplicates_tool', 'duplicate_finder_tool',
    'text_to_html_tool', 'text_optimizer_tool', 'spaces_to_paragraphs_tool',
    'text_sorting_tool', 'remove_empty_lines_tool', 'transliteration_tool',
    'minus_words_tool', 'utm_generator_tool', 'cross_analytics_tool',
    'word_gluing_tool', 'word_mixer_tool', 'remove_line_breaks_tool',
    'add_symbol_tool', 'find_replace_tool', 'text_generator_tool',
    'synonym_generator_tool', 'word_declension_tool', 'text_by_columns_tool',
    'char_counter_tool', 'match_types_tool', 'number_generator_tool',
    'password_generator_tool', 'emoji_tool', 'site_audit_tool', 'seo_audit_tool', 'seo_audit_pro_tool',
    'seo_audit_pro'
  ])
  .withMessage('Неизвестное название инструмента');

const sessionIdValidator = body('sessionId')
  .optional()
  .isUUID()
  .withMessage('sessionId должен быть валидным UUID');

// POST /api/stats/increment - Увеличить счетчик использования инструмента
router.post('/increment',
  optionalAuth,
  // checkApiLimit,
  [
    toolNameValidator,
    sessionIdValidator,
    body('inputLength').optional().isInt({ min: 0 }).withMessage('inputLength должен быть положительным числом'),
    body('outputLength').optional().isInt({ min: 0 }).withMessage('outputLength должен быть положительным числом'),
    body('processingTime').optional().isInt({ min: 0 }).withMessage('processingTime должен быть положительным числом'),
    body('language').optional().isIn(['ru', 'ua', 'en']).withMessage('Неподдерживаемый язык'),
  ],
  handleValidationErrors,
  // incrementApiUsage,
  async (req, res, next) => {
    try {
      console.log('📊 Stats increment request received:', {
        body: req.body,
        user: req.user ? `ID: ${req.user.id}, email: ${req.user.email}` : 'anonymous',
        ip: req.ip,
        headers: {
          authorization: req.headers.authorization ? 'Bearer token present' : 'No auth header',
          'user-agent': req.get('User-Agent')?.substring(0, 50)
        }
      });
      
      const {
        toolName,
        sessionId,
        inputLength,
        outputLength,
        processingTime,
        language = 'ru'
      } = req.body;

      // Нормализуем имя инструмента
      const normalizedToolName = normalizeToolName(toolName);
      
      // Создание записи об использовании
      const usageData = {
        userId: req.user ? req.user.id : null,
        toolName: normalizedToolName,
        sessionId: sessionId || (req.user ? null : uuidv4()), // Генерируем sessionId для анонимных
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        inputLength,
        outputLength,
        processingTime,
        language,
        wasSuccessful: true
      };

      console.log('💾 Creating ToolUsage record with data:', usageData);

      const usage = await db.ToolUsage.create(usageData);
      
      console.log('✅ ToolUsage record created successfully:', {
        id: usage.id,
        userId: usage.userId,
        toolName: usage.toolName,
        createdAt: usage.createdAt
      });

      // Получение обновленной статистики для инструмента
      const toolStats = await db.ToolUsage.findOne({
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalUsage']
        ],
        where: { toolName: normalizedToolName },
        raw: true
      });

      res.status(201).json({
        success: true,
        message: 'Статистика обновлена',
        data: {
          usageId: usage.id,
          toolName,
          totalUsage: parseInt(toolStats.totalUsage),
          userLimits: req.user ? {
            dailyUsage: req.user.apiRequestsCount,
            dailyLimit: req.user.dailyApiLimit,
            remaining: req.user.dailyApiLimit - req.user.apiRequestsCount
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/stats/tool/:toolName - Получить статистику для конкретного инструмента
router.get('/tool/:toolName',
  [
    param('toolName')
      .notEmpty()
      .withMessage('Название инструмента обязательно')
      .isLength({ min: 1, max: 100 })
      .withMessage('Название инструмента должно быть от 1 до 100 символов')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { toolName } = req.params;
      const normalizedToolName = normalizeToolName(toolName);

      const stats = await db.ToolUsage.findOne({
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalUsage'],
          [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('userId'))), 'uniqueUsers'],
          [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('sessionId'))), 'uniqueSessions'],
          [db.sequelize.fn('AVG', db.sequelize.col('inputLength')), 'avgInputLength'],
          [db.sequelize.fn('AVG', db.sequelize.col('outputLength')), 'avgOutputLength'],
          [db.sequelize.fn('AVG', db.sequelize.col('processingTime')), 'avgProcessingTime']
        ],
        where: { toolName: normalizedToolName },
        raw: true
      });

      // Статистика по дням (последние 30 дней)
      const dailyStats = await db.ToolUsage.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usage']
        ],
        where: {
          toolName: normalizedToolName,
          createdAt: {
            [Op.gte]: db.sequelize.literal("date('now', '-30 days')")
          }
        },
        group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
        order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          toolName,
          totalUsage: parseInt(stats.totalUsage || 0),
          uniqueUsers: parseInt(stats.uniqueUsers || 0),
          uniqueSessions: parseInt(stats.uniqueSessions || 0),
          avgInputLength: parseFloat(stats.avgInputLength || 0),
          avgOutputLength: parseFloat(stats.avgOutputLength || 0),
          avgProcessingTime: parseFloat(stats.avgProcessingTime || 0),
          dailyUsage: dailyStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/stats/overview - Общая статистика по всем инструментам
router.get('/overview',
  async (req, res, next) => {
    try {
      // Общая статистика
      const totalStats = await db.ToolUsage.getTotalUsageStats();

      // Популярные инструменты
      const popularTools = await db.ToolUsage.getPopularTools(10, '30d');

      // Статистика по дням
      const dailyStats = await db.ToolUsage.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usage']
        ],
        where: {
          createdAt: {
            [Op.gte]: db.sequelize.literal("date('now', '-30 days')")
          }
        },
        group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
        order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          totalStats,
          popularTools,
          dailyUsage: dailyStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/stats/user - Личная статистика пользователя (требует авторизации)
router.get('/user',
  // optionalAuth,
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.json({
          success: true,
          data: {
            message: 'Войдите в систему для просмотра личной статистики',
            isGuest: true
          }
        });
      }

      const userStats = await db.ToolUsage.getUserUsageStats(req.user.id);

      const totalUserUsage = await db.ToolUsage.count({
        where: { userId: req.user.id }
      });

      res.json({
        success: true,
        data: {
          totalUsage: totalUserUsage,
          toolsUsed: userStats.length,
          apiLimits: {
            daily: {
              used: req.user.apiRequestsCount,
              limit: req.user.dailyApiLimit,
              remaining: req.user.dailyApiLimit - req.user.apiRequestsCount
            }
          },
          toolStats: userStats,
          isGuest: false
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/analytics/visitor - Синхронизация данных посетителя
router.post('/visitor', async (req, res, next) => {
  try {
    console.log('🔄 Visitor data sync requested:', req.body);
    
    // Заглушка для синхронизации данных посетителя
    const response = {
      success: true,
      message: 'Visitor data synced successfully',
      data: {
        visitorId: req.body.visitorId || uuidv4(),
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('✅ Visitor sync response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Visitor sync error:', error);
    next(error);
  }
});

// GET /api/analytics/visitor - Получение данных посетителя  
router.get('/visitor', async (req, res, next) => {
  try {
    console.log('📊 Visitor data requested');
    
    // Заглушка для данных посетителя
    const response = {
      success: true,
      data: {
        visitorId: req.query.id || uuidv4(),
        sessionStart: new Date().toISOString(),
        toolsUsed: 0,
        currentPage: req.query.page || 'unknown'
      }
    };
    
    console.log('✅ Visitor data response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Visitor data error:', error);
    next(error);
  }
});

// POST /api/analytics/event - События аналитики
router.post('/event', async (req, res, next) => {
  try {
    console.log('📊 Analytics event requested:', req.body);
    
    // Заглушка для обработки событий
    const response = {
      success: true,
      message: 'Event recorded successfully',
      data: {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        event: req.body.event,
        userId: req.body.userId
      }
    };
    
    console.log('✅ Event response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Event error:', error);
    next(error);
  }
});

module.exports = router;
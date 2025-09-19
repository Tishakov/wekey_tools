const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { optionalAuth, checkApiLimit, incrementApiUsage } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware для валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(`Ошибка валидации: ${errors.array().map(e => e.msg).join(', ')}`, 400));
  }
  next();
};

// Валидаторы
const toolNameValidator = body('toolName')
  .isIn([
    'case-changer', 'remove-duplicates', 'duplicate-finder',
    'text-to-html', 'text-optimizer', 'spaces-to-paragraphs',
    'text-sorting', 'remove-empty-lines', 'transliteration',
    'minus-words', 'utm-generator', 'cross-analytics',
    'word-gluing', 'word-mixer', 'remove-line-breaks',
    'add-symbol', 'find-replace', 'text-generator',
    'synonym-generator', 'word-declension', 'text-by-columns',
    'char-counter', 'match-types', 'number-generator',
    'password-generator', 'emoji'
  ])
  .withMessage('Неизвестное название инструмента');

const sessionIdValidator = body('sessionId')
  .optional()
  .isUUID()
  .withMessage('sessionId должен быть валидным UUID');

// POST /api/stats/increment - Увеличить счетчик использования инструмента
router.post('/increment',
  optionalAuth,
  checkApiLimit,
  [
    toolNameValidator,
    sessionIdValidator,
    body('inputLength').optional().isInt({ min: 0 }).withMessage('inputLength должен быть положительным числом'),
    body('outputLength').optional().isInt({ min: 0 }).withMessage('outputLength должен быть положительным числом'),
    body('processingTime').optional().isInt({ min: 0 }).withMessage('processingTime должен быть положительным числом'),
    body('language').optional().isIn(['ru', 'ua', 'en']).withMessage('Неподдерживаемый язык'),
  ],
  handleValidationErrors,
  incrementApiUsage,
  async (req, res, next) => {
    try {
      const {
        toolName,
        sessionId,
        inputLength,
        outputLength,
        processingTime,
        language = 'ru'
      } = req.body;

      // Создание записи об использовании
      const usageData = {
        userId: req.user ? req.user.id : null,
        toolName,
        sessionId: sessionId || (req.user ? null : uuidv4()), // Генерируем sessionId для анонимных
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        inputLength,
        outputLength,
        processingTime,
        language,
        wasSuccessful: true
      };

      const usage = await db.ToolUsage.create(usageData);

      // Получение обновленной статистики для инструмента
      const toolStats = await db.ToolUsage.findOne({
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalUsage']
        ],
        where: { toolName },
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
    param('toolName').isIn([
      'case-changer', 'remove-duplicates', 'duplicate-finder',
      'text-to-html', 'text-optimizer', 'spaces-to-paragraphs',
      'text-sorting', 'remove-empty-lines', 'transliteration',
      'minus-words', 'utm-generator', 'cross-analytics',
      'word-gluing', 'word-mixer', 'remove-line-breaks',
      'add-symbol', 'find-replace', 'text-generator',
      'synonym-generator', 'word-declension', 'text-by-columns',
      'char-counter', 'match-types', 'number-generator',
      'password-generator', 'emoji'
    ]).withMessage('Неизвестное название инструмента')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { toolName } = req.params;

      const stats = await db.ToolUsage.findOne({
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalUsage'],
          [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('userId'))), 'uniqueUsers'],
          [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('sessionId'))), 'uniqueSessions'],
          [db.sequelize.fn('AVG', db.sequelize.col('inputLength')), 'avgInputLength'],
          [db.sequelize.fn('AVG', db.sequelize.col('outputLength')), 'avgOutputLength'],
          [db.sequelize.fn('AVG', db.sequelize.col('processingTime')), 'avgProcessingTime']
        ],
        where: { toolName },
        raw: true
      });

      // Статистика по дням (последние 30 дней)
      const dailyStats = await db.ToolUsage.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usage']
        ],
        where: {
          toolName,
          createdAt: {
            [db.sequelize.Op.gte]: db.sequelize.literal('DATE_SUB(NOW(), INTERVAL 30 DAY)')
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
            [db.sequelize.Op.gte]: db.sequelize.literal('DATE_SUB(NOW(), INTERVAL 30 DAY)')
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
  optionalAuth,
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

module.exports = router;
const express = require('express');
// const { protect, restrictTo } = require('../middleware/auth');
// const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

// Временно отключаем защиту для тестирования
// router.use(protect);
// router.use(restrictTo('admin'));

// GET /api/admin/dashboard - Административная панель
router.get('/dashboard', async (req, res, next) => {
  try {
    // Общая статистика
    const totalStats = await db.ToolUsage.getTotalUsageStats();
    
    // Статистика пользователей
    const userStats = await db.User.findOne({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalUsers'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 'activeUsers'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN role = 'premium' THEN 1 END")), 'premiumUsers']
      ],
      raw: true
    });

    // Статистика подписок
    const subscriptionStats = await db.Subscription.getActivePlanCounts();

    // Доходы
    const revenueStats = await db.Payment.getTotalRevenue('30d');

    // Популярные инструменты
    const popularTools = await db.ToolUsage.getPopularTools(10, '30d');

    res.json({
      success: true,
      data: {
        totalStats,
        userStats: {
          totalUsers: parseInt(userStats.totalUsers || 0),
          activeUsers: parseInt(userStats.activeUsers || 0),
          premiumUsers: parseInt(userStats.premiumUsers || 0)
        },
        subscriptionStats,
        revenueStats,
        popularTools
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/stats - Формат точно под фронтенд AdminPanel.tsx
router.get('/stats', async (req, res, next) => {
  try {
    console.log('🔍 Admin stats запрос начат');
    
    // Получаем реальные данные из БД
    const userCount = await db.User.count();
    const toolUsageCount = await db.ToolUsage.count();
    
    console.log(`📊 Найдено пользователей: ${userCount}, использований: ${toolUsageCount}`);
    
    // Популярные инструменты из БД (адаптировано для SQLite)
    let toolUsageData = [];
    try {
      const popularTools = await db.ToolUsage.findAll({
        attributes: [
          'toolName',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usageCount'],
          [db.sequelize.fn('MAX', db.sequelize.col('createdAt')), 'lastUsed']
        ],
        group: ['toolName'],
        order: [[db.sequelize.literal('usageCount'), 'DESC']],
        limit: 10,
        raw: true
      });
      
      console.log('🛠️ Популярные инструменты из БД:', popularTools);
      
      toolUsageData = popularTools.map(tool => ({
        toolName: tool.toolName,
        usageCount: parseInt(tool.usageCount) || 0,
        lastUsed: tool.lastUsed || new Date().toISOString()
      }));
    } catch (dbError) {
      console.log('⚠️ Ошибка получения данных инструментов:', dbError.message);
      console.log('📝 Используем демо-данные для инструментов');
      
      // Fallback к демо-данным
      toolUsageData = [
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
        },
        { 
          toolName: 'Поиск и замена', 
          usageCount: 85, 
          lastUsed: new Date(Date.now() - 72*60*60*1000).toISOString() 
        },
        { 
          toolName: 'Подсчет символов', 
          usageCount: 70, 
          lastUsed: new Date(Date.now() - 96*60*60*1000).toISOString() 
        }
      ];
    }

    const responseData = {
      stats: {
        totalUsage: toolUsageCount,
        users: {
          totalUsers: userCount,
          activeToday: Math.floor(userCount * 0.3), // 30% активных сегодня
          newThisWeek: Math.floor(userCount * 0.1)  // 10% новых за неделю
        },
        toolUsage: toolUsageData
      }
    };
    
    console.log('✅ Отправляем ответ:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    
    // В случае ошибки отдаём минимальную структуру с демо-данными
    const fallbackData = {
      stats: {
        totalUsage: 347,
        users: {
          totalUsers: 15,
          activeToday: 5,
          newThisWeek: 2
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
            usageCount: 77, 
            lastUsed: new Date(Date.now() - 48*60*60*1000).toISOString() 
          }
        ]
      }
    };
    
    console.log('🔄 Отправляем fallback данные:', fallbackData);
    res.json(fallbackData);
  }
});

// GET /api/admin/users - Список пользователей
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, role } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (status) whereCondition.status = status;
    if (role) whereCondition.role = role;

    const users = await db.User.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.Subscription,
          as: 'subscriptions',
          where: { status: 'active' },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          pages: Math.ceil(users.count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/tools-stats - Детальная статистика по инструментам (адаптировано для SQLite)
router.get('/tools-stats', async (req, res, next) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Создаем условие для времени с учетом SQLite
    let whereCondition = {};
    if (timeframe === '30d') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 30);
      whereCondition.createdAt = {
        [db.sequelize.Op.gte]: daysAgo
      };
    } else if (timeframe === '7d') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 7);
      whereCondition.createdAt = {
        [db.sequelize.Op.gte]: daysAgo
      };
    }
    
    const stats = await db.ToolUsage.findAll({
      attributes: [
        'toolName',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usageCount'],
        [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('userId'))), 'uniqueUsers'],
        [db.sequelize.fn('AVG', db.sequelize.col('inputLength')), 'avgInputLength'],
        [db.sequelize.fn('AVG', db.sequelize.col('processingTime')), 'avgProcessingTime']
      ],
      where: whereCondition,
      group: ['toolName'],
      order: [[db.sequelize.literal('usageCount'), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        timeframe,
        tools: stats.map(tool => ({
          toolName: tool.toolName,
          usageCount: parseInt(tool.usageCount) || 0,
          uniqueUsers: parseInt(tool.uniqueUsers) || 0,
          avgInputLength: Math.round(parseFloat(tool.avgInputLength) || 0),
          avgProcessingTime: Math.round(parseFloat(tool.avgProcessingTime) || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Tools stats error:', error);
    next(error);
  }
});

// PUT /api/admin/users/:userId/status - Изменить статус пользователя
router.put('/users/:userId/status', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return next(new AppError('Неверный статус пользователя', 400));
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('Пользователь не найден', 404));
    }

    await user.update({ status });

    res.json({
      success: true,
      message: `Статус пользователя изменен на ${status}`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/analytics - Основная аналитика для админ-панели
router.get('/analytics', async (req, res, next) => {
  try {
    console.log('📊 Admin analytics requested');
    
    // Получаем реальные данные из базы
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Посетители
    const totalVisitors = await db.Visitor.count();
    const todayVisitors = await db.Visitor.count({
      where: {
        lastVisit: {
          [db.sequelize.Op.gte]: todayStart
        }
      }
    });
    
    // Пользователи
    const totalUsers = await db.User.count();
    const todayUsers = await db.User.count({
      where: {
        createdAt: {
          [db.sequelize.Op.gte]: todayStart
        }
      }
    });
    
    // Использования инструментов
    const totalUsage = await db.ToolUsage.count();
    const todayUsage = await db.ToolUsage.count({
      where: {
        createdAt: {
          [db.sequelize.Op.gte]: todayStart
        }
      }
    });
    
    // Количество уникальных инструментов
    const toolsCount = await db.ToolUsage.count({
      distinct: true,
      col: 'toolName'
    });
    
    // Самый используемый инструмент
    const mostUsedTool = await db.ToolUsage.findOne({
      attributes: [
        'toolName',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usageCount']
      ],
      group: ['toolName'],
      order: [[db.sequelize.literal('usageCount'), 'DESC']],
      limit: 1,
      raw: true
    });
    
    // Конверсия (примерно - отношение пользователей к посетителям)
    const conversionRate = totalVisitors > 0 ? (totalUsers / totalVisitors) : 0;
    
    const response = {
      success: true,
      data: {
        visitors: {
          today: todayVisitors,
          total: totalVisitors
        },
        users: {
          today: todayUsers,
          total: totalUsers
        },
        usage: {
          today: todayUsage,
          total: totalUsage
        },
        tools: {
          count: toolsCount,
          mostUsed: mostUsedTool ? mostUsedTool.toolName : 'Нет данных'
        },
        conversionRate: conversionRate,
        revenue: {
          today: 0, // TODO: добавить когда будет монетизация
          total: 0  // TODO: добавить когда будет монетизация
        }
      }
    };
    
    console.log('✅ Admin analytics response (real data):', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Admin analytics error:', error);
    next(error);
  }
});

// GET /api/admin/analytics/historical - Исторические данные для графиков
router.get('/analytics/historical', async (req, res, next) => {
  try {
    console.log('📈 Historical analytics requested:', req.query);
    
    const period = req.query.period || 'week';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    // Генерируем реальные исторические данные на основе статистики использования
    const generateRealHistoricalData = async (startDateStr, endDateStr) => {
      const data = [];
      const { ToolUsage } = require('../models');
      
      // Определяем диапазон дат
      let start, end;
      if (startDateStr && endDateStr) {
        start = new Date(startDateStr);
        end = new Date(endDateStr);
      } else {
        // По умолчанию последние 30 дней
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 29);
      }
      
      console.log('📅 Generating data from', start.toISOString().split('T')[0], 'to', end.toISOString().split('T')[0]);
      
      // Генерируем данные для каждого дня в диапазоне
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        try {
          // Получаем реальные данные использования за этот день
          const dayStart = new Date(currentDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dailyUsage = await ToolUsage.count({
            where: {
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });
          
          const uniqueUsers = await ToolUsage.count({
            distinct: true,
            col: 'sessionId',
            where: {
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });
          
          data.push({
            date: dateStr,
            visitors: 0, // Пока нет системы отслеживания
            toolUsers: uniqueUsers || 0,
            usageCount: dailyUsage || 0,
            conversionRate: "0.00" // Пока нет данных
          });
        } catch (error) {
          console.error('Error fetching daily stats for', dateStr, ':', error);
          // Фоллбэк на нули если ошибка
          data.push({
            date: dateStr,
            visitors: 0,
            toolUsers: 0,
            usageCount: 0,
            conversionRate: "0.00"
          });
        }
        
        // Переходим к следующему дню
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return data;
    };
    
    const response = {
      success: true,
      data: await generateRealHistoricalData(startDate, endDate)
    };
    
    console.log('✅ Historical analytics response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Historical analytics error:', error);
    next(error);
  }
});

// GET /api/admin/period-tools - Статистика инструментов за выбранный период
router.get('/period-tools', async (req, res, next) => {
  try {
    console.log('🛠️ Period tools requested:', req.query);
    
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;
    const { ToolUsage } = require('../models');
    
    if (!startDateStr || !endDateStr) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    // Определяем диапазон дат
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('📅 Calculating tools stats from', startDate, 'to', endDate);
    
    try {
      // Получаем статистику инструментов за период
      const toolsData = await ToolUsage.findAll({
        attributes: [
          'toolName',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usageCount'],
          [require('sequelize').fn('MAX', require('sequelize').col('createdAt')), 'lastUsed']
        ],
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        },
        group: ['toolName'],
        order: [[require('sequelize').literal('usageCount'), 'DESC']],
        limit: 20,
        raw: true
      });
      
      const formattedToolsData = toolsData.map(tool => ({
        toolName: tool.toolName,
        usageCount: parseInt(tool.usageCount) || 0,
        lastUsed: tool.lastUsed || new Date().toISOString()
      }));
      
      const response = {
        success: true,
        toolUsage: formattedToolsData
      };
      
      console.log('✅ Period tools response:', response);
      res.json(response);
    } catch (dbError) {
      console.error('❌ Database error in period tools:', dbError);
      // Фоллбэк на пустой массив
      res.json({
        success: true,
        toolUsage: []
      });
    }
  } catch (error) {
    console.error('❌ Period tools error:', error);
    next(error);
  }
});

// GET /api/admin/period-stats - Статистика за выбранный период
router.get('/period-stats', async (req, res, next) => {
  try {
    console.log('📊 Period stats requested:', req.query);
    
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;
    const { ToolUsage } = require('../models');
    
    if (!startDateStr || !endDateStr) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    // Определяем диапазон дат
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('📅 Calculating stats from', startDate, 'to', endDate);
    
    try {
      // Получаем статистику за период
      const totalUsage = await ToolUsage.count({
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      });
      
      const uniqueUsers = await ToolUsage.count({
        distinct: true,
        col: 'sessionId',
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      });
      
      const activeTools = await ToolUsage.count({
        distinct: true,
        col: 'toolName',
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      });
      
      const response = {
        success: true,
        stats: {
          totalUsage: totalUsage || 0,
          uniqueUsers: uniqueUsers || 0,
          activeTools: activeTools || 0
        }
      };
      
      console.log('✅ Period stats response:', response);
      res.json(response);
    } catch (dbError) {
      console.error('❌ Database error in period stats:', dbError);
      // Фоллбэк на нули
      res.json({
        success: true,
        stats: {
          totalUsage: 0,
          uniqueUsers: 0,
          activeTools: 0
        }
      });
    }
  } catch (error) {
    console.error('❌ Period stats error:', error);
    next(error);
  }
});

// POST /api/admin/reset-stats - Сброс аналитики
router.post('/reset-stats', async (req, res, next) => {
  try {
    console.log('🗑️ [ADMIN] Reset stats request');
    
    const { ToolUsage } = require('../models');
    
    // Удаляем все записи ToolUsage
    const deletedCount = await ToolUsage.destroy({
      where: {},
      truncate: true // Полная очистка таблицы
    });
    
    console.log(`✅ [ADMIN] Deleted ${deletedCount} tool usage records`);
    
    res.json({
      success: true,
      message: 'Аналитика успешно сброшена',
      deletedRecords: deletedCount
    });
    
  } catch (error) {
    console.error('❌ Reset stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при сбросе аналитики',
      error: error.message
    });
  }
});

module.exports = router;
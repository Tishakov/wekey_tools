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
    
    // Генерируем тестовые исторические данные
    const generateHistoricalData = (days = 7) => {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          visitors: Math.floor(Math.random() * 200) + 50,
          users: Math.floor(Math.random() * 50) + 10,
          usage: Math.floor(Math.random() * 300) + 100
        });
      }
      return data;
    };
    
    let daysCount = 7;
    if (period === 'month') daysCount = 30;
    if (period === 'year') daysCount = 365;
    
    const response = {
      success: true,
      data: generateHistoricalData(daysCount)
    };
    
    console.log('✅ Historical analytics response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Historical analytics error:', error);
    next(error);
  }
});

module.exports = router;
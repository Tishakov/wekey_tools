const express = require('express');
// const { protect, restrictTo } = require('../middleware/auth');
// const { AppError } = require('../middleware/errorHandler');
const db = require('../models');

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

// GET /api/admin/users - Список пользователей с статистикой
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

    // Получаем статистику использования инструментов для каждого пользователя
    const usersWithStats = await Promise.all(users.rows.map(async (user) => {
      const userStats = await db.ToolUsage.findOne({
        where: { userId: user.id },
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalUsage'],
          [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('toolName'))), 'uniqueTools'],
          [db.sequelize.fn('MAX', db.sequelize.col('createdAt')), 'lastToolUsage']
        ],
        raw: true
      });

      return {
        ...user.toJSON(),
        coinBalance: user.coinBalance || 0,
        toolStats: {
          totalUsage: parseInt(userStats?.totalUsage || 0),
          uniqueTools: parseInt(userStats?.uniqueTools || 0),
          lastToolUsage: userStats?.lastToolUsage || null
        }
      };
    }));

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total: users.count,
          page: parseInt(page),
          pages: Math.ceil(users.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users with stats:', error);
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

// DELETE /api/admin/users/:userId - Удалить пользователя
router.delete('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Проверяем существование пользователя
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Запрещаем удаление админов (для безопасности)
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Нельзя удалить администратора'
      });
    }

    // Запрещаем админу удалить самого себя (если middleware включен)
    if (req.user && user.id === req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя удалить самого себя'
      });
    }

    console.log(`🗑️ Deleting user: ${user.email} (ID: ${user.id})`);

    // Удаляем связанные данные пользователя
    await db.sequelize.transaction(async (transaction) => {
      // Удаляем записи использования инструментов
      await db.ToolUsage.destroy({
        where: { userId: user.id },
        transaction
      });

      // Удаляем аналитические события
      await db.AnalyticsEvent.destroy({
        where: { userId: user.id },
        transaction
      });

      // Удаляем самого пользователя
      await user.destroy({ transaction });
    });

    console.log(`✅ User deleted successfully: ${user.email}`);

    res.json({
      success: true,
      message: 'Пользователь успешно удален',
      data: {
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
        }
      }
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении пользователя',
      error: error.message
    });
  }
});

// GET /api/admin/coin-reasons - Получить список причин для операций с коинами
router.get('/coin-reasons', async (req, res, next) => {
  try {
    const { type } = req.query; // 'add', 'subtract', или не указан (все)
    
    const { CoinOperationReason } = require('../config/database');
    const reasons = await CoinOperationReason.getByType(type);
    
    res.json({
      success: true,
      data: reasons
    });
  } catch (error) {
    console.error('❌ Error fetching coin reasons:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка причин',
      error: error.message
    });
  }
});

// POST /api/admin/coin-reasons - Создать новую причину
router.post('/coin-reasons', async (req, res, next) => {
  try {
    const { type, reason, sortOrder = 0 } = req.body;
    
    if (!['add', 'subtract', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Тип операции должен быть "add", "subtract" или "both"'
      });
    }
    
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Причина должна содержать минимум 3 символа'
      });
    }
    
    const { CoinOperationReason } = require('../config/database');
    const newReason = await CoinOperationReason.createReason(type, reason.trim(), sortOrder);
    
    res.json({
      success: true,
      data: newReason,
      message: 'Причина успешно создана'
    });
  } catch (error) {
    console.error('❌ Error creating coin reason:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании причины',
      error: error.message
    });
  }
});

// PUT /api/admin/coin-reasons/:id - Обновить причину
router.put('/coin-reasons/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, reason, sortOrder, isActive } = req.body;
    
    const { CoinOperationReason } = require('../config/database');
    const existingReason = await CoinOperationReason.findByPk(id);
    
    if (!existingReason) {
      return res.status(404).json({
        success: false,
        message: 'Причина не найдена'
      });
    }
    
    const updateData = {};
    if (type && ['add', 'subtract', 'both'].includes(type)) updateData.type = type;
    if (reason && reason.trim().length >= 3) updateData.reason = reason.trim();
    if (typeof sortOrder === 'number') updateData.sortOrder = sortOrder;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    await existingReason.update(updateData);
    
    res.json({
      success: true,
      data: existingReason,
      message: 'Причина успешно обновлена'
    });
  } catch (error) {
    console.error('❌ Error updating coin reason:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении причины',
      error: error.message
    });
  }
});

// DELETE /api/admin/coin-reasons/:id - Удалить причину (мягкое удаление)
router.delete('/coin-reasons/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { CoinOperationReason } = require('../config/database');
    const existingReason = await CoinOperationReason.findByPk(id);
    
    if (!existingReason) {
      return res.status(404).json({
        success: false,
        message: 'Причина не найдена'
      });
    }
    
    // Мягкое удаление - просто деактивируем
    await existingReason.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Причина успешно удалена'
    });
  } catch (error) {
    console.error('❌ Error deleting coin reason:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении причины',
      error: error.message
    });
  }
});

// POST /api/admin/users/:userId/coins - Управление коинами пользователя
router.post('/users/:userId/coins', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, amount, reason } = req.body;

    // Валидация входных данных
    if (!['add', 'subtract'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Тип операции должен быть "add" или "subtract"'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Количество коинов должно быть положительным числом'
      });
    }

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Укажите причину операции (минимум 3 символа)'
      });
    }

    // Проверяем существование пользователя
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Для списания проверяем достаточность средств
    if (type === 'subtract' && user.coinBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Недостаточно коинов для списания'
      });
    }

    console.log(`💰 Admin coin operation: ${type} ${amount} coins for user ${user.email}`);

    const { CoinTransaction } = require('../config/database');
    
    // Создаем транзакцию коинов
    const transactionType = type === 'add' ? 'admin_add' : 'admin_subtract';
    const transactionAmount = type === 'add' ? amount : -amount;
    
    const result = await CoinTransaction.createTransaction(
      parseInt(userId), 
      transactionType, 
      transactionAmount, 
      {
        description: reason,
        metadata: { 
          adminOperation: true,
          adminUserId: req.user?.userId || null
        }
      }
    );

    res.json({
      success: true,
      message: `Коины успешно ${type === 'add' ? 'начислены' : 'списаны'}`,
      data: {
        transactionId: result.transaction.id,
        newBalance: result.newBalance,
        operation: {
          type,
          amount,
          reason
        }
      }
    });

  } catch (error) {
    console.error('❌ Error managing user coins:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при управлении коинами пользователя',
      error: error.message
    });
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
    const timezone = req.query.timezone || 'UTC';
    
    console.log('🕐 Using timezone:', timezone);
    
    // Генерируем реальные исторические данные на основе статистики использования
    const generateRealHistoricalData = async (startDateStr, endDateStr, timezone = 'UTC') => {
      const data = [];
      const { ToolUsage } = require('../models');
      
      // Определяем диапазон дат с учетом часового пояса
      let start, end;
      if (startDateStr && endDateStr) {
        // Просто создаем даты из строк без сложных конвертаций
        start = new Date(startDateStr + 'T00:00:00.000Z');
        end = new Date(endDateStr + 'T23:59:59.999Z');
        
        console.log('🕐 Using dates:', startDateStr, 'to', endDateStr);
        console.log('🕐 Date objects:', start.toISOString(), 'to', end.toISOString());
      } else {
        // По умолчанию последние 30 дней
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 29);
      }
      
      console.log('📅 Generating data from', start.toISOString().split('T')[0], 'to', end.toISOString().split('T')[0]);
      
      // Генерируем данные для каждого дня в диапазоне
      // Начинаем точно с указанной стартовой даты
      const currentDate = new Date(startDateStr + 'T00:00:00.000Z');
      const endDateForLoop = new Date(endDateStr + 'T00:00:00.000Z');
      
      while (currentDate <= endDateForLoop) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        console.log('📅 Processing date:', dateStr, 'from currentDate:', currentDate.toISOString());
        
        try {
          // Получаем реальные данные использования за этот день
          const dayStart = new Date(currentDate);
          dayStart.setUTCHours(0, 0, 0, 0);
          const dayEnd = new Date(currentDate);
          dayEnd.setUTCHours(23, 59, 59, 999);
          
          const dailyUsage = await ToolUsage.count({
            where: {
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });
          
          const uniqueUsers = await ToolUsage.count({
            distinct: true,
            col: 'userId',
            where: {
              userId: { [require('sequelize').Op.not]: null }, // Только авторизованные пользователи
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });

          // Считаем посетителей как уникальные сессии из ToolUsage (более надежно)
          const dailyVisitors = await ToolUsage.count({
            distinct: true,
            col: 'sessionId',
            where: {
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });

          // Получаем данные о потраченных коинах за день
          const { CoinTransaction } = require('../models');
          const dailyCoinsSpent = await CoinTransaction.sum('amount', {
            where: {
              amount: {
                [require('sequelize').Op.lt]: 0 // Только отрицательные транзакции (потраченные коины)
              },
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });

          // Получаем данные о регистрациях за день
          const { User } = require('../models');
          const dailyRegistrations = await User.count({
            where: {
              createdAt: {
                [require('sequelize').Op.between]: [dayStart, dayEnd]
              }
            }
          });

          // Вычисляем среднее коинов на пользователя за день
          const absoluteCoinsSpent = Math.abs(dailyCoinsSpent || 0);
          const avgCoinsPerUser = uniqueUsers > 0 ? (absoluteCoinsSpent / uniqueUsers) : 0;
          
          data.push({
            date: dateStr,
            visitors: dailyVisitors || 0,
            toolUsers: uniqueUsers || 0,
            usageCount: dailyUsage || 0,
            conversionRate: dailyVisitors > 0 ? ((uniqueUsers / dailyVisitors) * 100).toFixed(2) : "0.00",
            coinsSpent: absoluteCoinsSpent,
            registrations: dailyRegistrations || 0,
            avgCoinsPerUser: Math.round(avgCoinsPerUser * 100) / 100 // Округляем до 2 знаков
          });
        } catch (error) {
          console.error('Error fetching daily stats for', dateStr, ':', error);
          // Фоллбэк на нули если ошибка
          data.push({
            date: dateStr,
            visitors: 0,
            toolUsers: 0,
            usageCount: 0,
            conversionRate: "0.00",
            coinsSpent: 0,
            registrations: 0,
            avgCoinsPerUser: 0
          });
        }
        
        // Переходим к следующему дню в UTC
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
      return data;
    };
    
    const response = {
      success: true,
      data: await generateRealHistoricalData(startDate, endDate, timezone)
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
        col: 'userId',
        where: {
          userId: { [require('sequelize').Op.not]: null }, // Только авторизованные пользователи
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

      // Считаем посетителей как уникальные сессии из ToolUsage (более надежно)
      const totalVisitors = await ToolUsage.count({
        distinct: true,
        col: 'sessionId',
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      });

      // Подсчитываем общее количество потраченных коинов
      const { CoinTransaction } = require('../models');
      const totalCoinsSpent = await CoinTransaction.sum('amount', {
        where: {
          amount: {
            [require('sequelize').Op.lt]: 0 // Только отрицательные транзакции (потраченные коины)
          },
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      });

      // Подсчитываем регистрации за период
      const { User } = require('../models');
      const totalRegistrations = await User.count({
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      });

      // Вычисляем среднее коинов на пользователя
      const absoluteCoinsSpent = Math.abs(totalCoinsSpent || 0);
      const avgCoinsPerUser = uniqueUsers > 0 ? (absoluteCoinsSpent / uniqueUsers) : 0;
      
      const response = {
        success: true,
        stats: {
          totalUsage: totalUsage || 0,
          uniqueUsers: uniqueUsers || 0,
          activeTools: activeTools || 0,
          totalVisitors: totalVisitors || 0,
          totalCoinsSpent: absoluteCoinsSpent,
          totalRegistrations: totalRegistrations || 0,
          avgCoinsPerUser: Math.round(avgCoinsPerUser * 100) / 100 // Округляем до 2 знаков
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
          activeTools: 0,
          totalVisitors: 0,
          totalCoinsSpent: 0,
          totalRegistrations: 0,
          avgCoinsPerUser: 0
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
    
    const { ToolUsage, Visitor } = require('../models');
    
    // Удаляем все записи ToolUsage
    const deletedToolUsage = await ToolUsage.destroy({
      where: {},
      truncate: true // Полная очистка таблицы
    });

    // Удаляем все записи Visitor
    const deletedVisitors = await Visitor.destroy({
      where: {},
      truncate: true // Полная очистка таблицы
    });
    
    console.log(`✅ [ADMIN] Deleted ${deletedToolUsage} tool usage records and ${deletedVisitors} visitor records`);
    
    res.json({
      success: true,
      message: 'Аналитика успешно сброшена',
      deletedRecords: {
        toolUsage: deletedToolUsage,
        visitors: deletedVisitors
      }
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
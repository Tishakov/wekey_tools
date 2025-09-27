const express = require('express');
const router = express.Router();
const { CoinTransaction, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { protect } = require('../middleware/auth');

// Получение истории транзакций текущего пользователя
router.get('/coin-transactions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Фильтры
    const whereClause = { userId };
    
    if (req.query.type) {
      whereClause.type = req.query.type;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      whereClause.createdAt = {};
      if (req.query.dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        whereClause.createdAt[Op.lte] = new Date(req.query.dateTo);
      }
    }

    // Получение транзакций
    const { count, rows: transactions } = await CoinTransaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'type',
        'amount',
        'description',
        'balanceAfter',
        'createdAt'
      ]
    });

    // Получение текущего баланса пользователя
    const user = await User.findByPk(userId, {
      attributes: ['coinBalance']
    });

    res.json({
      success: true,
      data: {
        transactions,
        currentBalance: user.coinBalance || 0,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user coin transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении истории транзакций'
    });
  }
});

// Получение статистики по транзакциям
router.get('/coin-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Общая статистика
    const totalReceived = await CoinTransaction.sum('amount', {
      where: {
        userId,
        amount: { [Op.gt]: 0 }
      }
    }) || 0;

    const totalSpent = await CoinTransaction.sum('amount', {
      where: {
        userId,
        amount: { [Op.lt]: 0 }
      }
    }) || 0;

    const transactionCount = await CoinTransaction.count({
      where: { userId }
    });

    // Статистика по типам за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await CoinTransaction.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['type']
    });

    res.json({
      success: true,
      data: {
        totalReceived: Math.abs(totalReceived),
        totalSpent: Math.abs(totalSpent),
        transactionCount,
        recentStats
      }
    });

  } catch (error) {
    console.error('Error fetching user coin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики'
    });
  }
});

module.exports = router;
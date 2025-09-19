const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

// Защита всех роутов - только для авторизованных пользователей
router.use(protect);

// GET /api/users/profile - Получить профиль пользователя
router.get('/profile', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      include: [
        {
          model: db.Subscription,
          as: 'subscriptions',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/usage-history - История использования инструментов
router.get('/usage-history', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const usageHistory = await db.ToolUsage.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        usage: usageHistory.rows,
        pagination: {
          total: usageHistory.count,
          page: parseInt(page),
          pages: Math.ceil(usageHistory.count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/subscription - Информация о подписке
router.get('/subscription', async (req, res, next) => {
  try {
    const subscription = await db.Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: 'active'
      },
      include: [
        {
          model: db.Payment,
          as: 'payments',
          order: [['createdAt', 'DESC']],
          limit: 5
        }
      ]
    });

    if (!subscription) {
      return next(new AppError('Активная подписка не найдена', 404));
    }

    res.json({
      success: true,
      data: {
        subscription,
        features: subscription.getFeatures(),
        isActive: subscription.isActive(),
        daysRemaining: subscription.getDaysRemaining(),
        isExpiringSoon: subscription.isExpiringSoon()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
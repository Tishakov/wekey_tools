const express = require('express');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/auth');
const { avatarUpload, handleMulterError } = require('../middleware/upload');
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

// POST /api/users/avatar - Загрузка аватара
router.post('/avatar', 
  avatarUpload.single('avatar'),
  handleMulterError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next(new AppError('Файл не был загружен', 400));
      }

      console.log('📸 Avatar upload for user:', req.user.id);
      console.log('📁 File details:', {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Удаляем старый аватар если он есть
      if (req.user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(req.user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          console.log('🗑️ Old avatar deleted:', oldAvatarPath);
        }
      }

      // Создаем URL для аватара
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Обновляем пользователя в базе данных
      await req.user.update({ avatar: avatarUrl });
      
      // Перезагружаем пользователя чтобы получить актуальные данные
      await req.user.reload();

      res.json({
        success: true,
        message: 'Аватар успешно обновлен',
        data: {
          avatar: avatarUrl,
          user: req.user
        }
      });
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// DELETE /api/users/avatar - Удаление аватара
router.delete('/avatar', async (req, res, next) => {
  try {
    if (!req.user.avatar) {
      return next(new AppError('У пользователя нет аватара', 404));
    }

    // Удаляем файл аватара
    const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(req.user.avatar));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
      console.log('🗑️ Avatar deleted:', avatarPath);
    }

    // Обновляем пользователя в базе данных
    await req.user.update({ avatar: null });

    res.json({
      success: true,
      message: 'Аватар успешно удален',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
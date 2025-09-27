const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login - Вход в систему
router.post('/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Введите корректный email'),
    body('password')
      .notEmpty()
      .withMessage('Введите пароль')
  ],
  authController.login
);

// POST /api/auth/register - Регистрация пользователя
router.post('/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Введите корректный email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Пароль должен содержать минимум 6 символов'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Имя должно содержать от 1 до 50 символов'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Фамилия должна содержать от 1 до 50 символов')
  ],
  authController.register
);

// GET /api/auth/verify - Проверка токена
router.get('/verify', authController.verifyToken);

// POST /api/auth/admin-login - Админский вход (для админ-панели)
router.post('/admin-login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Введите корректный email'),
    body('password')
      .notEmpty()
      .withMessage('Введите пароль')
  ],
  authController.adminLogin
);

// GET /api/auth/profile - Получение профиля пользователя
router.get('/profile', authController.getProfile);

// GET /api/auth/stats - Получение статистики пользователя
router.get('/stats', authController.getUserStats);

// PUT /api/auth/profile - Обновление профиля пользователя
router.put('/profile',
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Имя должно содержать от 1 до 50 символов'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Фамилия должна содержать от 1 до 50 символов'),
    body('language')
      .optional()
      .isIn(['ru', 'en', 'uk'])
      .withMessage('Поддерживаемые языки: ru, en, uk'),
    body('theme')
      .optional()
      .isIn(['light', 'dark'])
      .withMessage('Поддерживаемые темы: light, dark'),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Новый пароль должен содержать минимум 6 символов'),
    body('currentPassword')
      .if(body('newPassword').exists())
      .notEmpty()
      .withMessage('Укажите текущий пароль для смены пароля')
  ],
  authController.updateProfile
);

// POST /api/auth/change-password - Смена пароля
router.post('/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Введите текущий пароль'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Новый пароль должен содержать минимум 8 символов')
  ],
  authController.changePassword
);

// POST /api/auth/update-settings - Обновление настроек
router.post('/update-settings',
  [
    body('defaultLanguage')
      .optional()
      .isIn(['ru', 'en', 'uk'])
      .withMessage('Поддерживаемые языки: ru, en, uk'),
    body('theme')
      .optional()
      .isIn(['light', 'dark'])
      .withMessage('Поддерживаемые темы: light, dark'),
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('emailNotifications должно быть boolean значением')
  ],
  authController.updateSettings
);

// POST /auth/refresh - Обновление токена
router.post('/refresh', authController.refreshToken);

module.exports = router;
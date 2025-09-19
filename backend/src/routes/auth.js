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

module.exports = router;
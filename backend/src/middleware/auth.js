const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const db = require('../config/database');
const config = require('../config/config');

const signToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

const createSendToken = (user, statusCode, res, message = 'Успешная авторизация') => {
  const token = signToken(user.id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Убираем пароль из ответа
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      user
    }
  });
};

const protect = async (req, res, next) => {
  try {
    // 1) Получение токена
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('Вы не авторизованы! Пожалуйста, войдите в систему.', 401));
    }

    // 2) Верификация токена
    const decoded = jwt.verify(token, config.jwt.secret);

    // 3) Проверка существования пользователя
    const currentUser = await db.User.findByPk(decoded.userId);
    if (!currentUser) {
      return next(new AppError('Пользователь с этим токеном больше не существует.', 401));
    }

    // 4) Проверка статуса пользователя
    if (currentUser.status === 'banned') {
      return next(new AppError('Ваш аккаунт заблокирован. Обратитесь в поддержку.', 403));
    }

    if (currentUser.status === 'inactive') {
      return next(new AppError('Ваш аккаунт неактивен. Подтвердите email.', 403));
    }

    // 5) Предоставление доступа к защищенному роуту
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Неверный токен. Пожалуйста, войдите снова!', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Ваш токен истек! Пожалуйста, войдите снова.', 401));
    }
    return next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('У вас нет прав для выполнения этого действия.', 403));
    }
    next();
  };
};

// Middleware для проверки лимитов API
const checkApiLimit = async (req, res, next) => {
  try {
    // Пропускаем проверку для админов
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Для гостевых пользователей - базовая проверка
    if (!req.user) {
      // TODO: Реализовать лимиты для анонимных пользователей по IP
      return next();
    }

    // Проверка лимитов для авторизованных пользователей
    if (!req.user.canMakeApiRequest()) {
      return next(new AppError(`Превышен дневной лимит API запросов (${req.user.dailyApiLimit}). Обновите подписку для увеличения лимитов.`, 429));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware для инкремента счетчика API
const incrementApiUsage = async (req, res, next) => {
  try {
    if (req.user) {
      await req.user.incrementApiUsage();
    }
    next();
  } catch (error) {
    // Не блокируем запрос если не удалось обновить счетчик
    console.error('Ошибка при обновлении счетчика API:', error);
    next();
  }
};

// Опциональная аутентификация (не блокирует запрос если токена нет)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const currentUser = await db.User.findByPk(decoded.userId);
      
      if (currentUser && currentUser.status === 'active') {
        req.user = currentUser;
      }
    }
    
    next();
  } catch (error) {
    // Игнорируем ошибки токена в optional auth
    next();
  }
};

module.exports = {
  signToken,
  createSendToken,
  protect,
  restrictTo,
  checkApiLimit,
  incrementApiUsage,
  optionalAuth
};
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'wekey-tools-secret-key-2025';

// Простой контроллер входа
exports.login = async (req, res) => {
  try {
    console.log('🔍 Login attempt:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }

    // Импортируем User только когда нужно
    const { User } = require('../config/database');
    
    // Поиск пользователя
    const user = await User.findOne({ 
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверные данные для входа'
      });
    }

    console.log('✅ User found:', user.email, 'role:', user.role);

    // Проверка пароля с помощью метода модели
    const isPasswordValid = await user.checkPassword(password);
    console.log('🔑 Password check:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверные данные для входа'
      });
    }

    // Для обычных пользователей убираем проверку роли админа
    // Проверка роли админа нужна только для админ-панели
    // if (user.role !== 'admin') {
    //   console.log('❌ Insufficient permissions:', email, 'role:', user.role);
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Недостаточно прав доступа'
    //   });
    // }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful:', email);

    // Успешный ответ
    res.json({
      success: true,
      message: 'Успешный вход в систему',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
};

// Регистрация пользователя
exports.register = async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Неверные данные для регистрации',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Импортируем User только когда нужно
    const { User } = require('../config/database');
    
    // Проверка существования пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создание нового пользователя
    const user = await User.create({
      email,
      password, // Пароль будет автоматически захеширован в модели
      firstName,
      lastName,
      role: 'user' // По умолчанию обычный пользователь
    });

    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Новый пользователь зарегистрирован:', email);

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Ошибка при регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Проверка токена
exports.verifyToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Импортируем User только когда нужно
    const { User } = require('../config/database');
    const user = await User.findByPk(decoded.userId); // Исправлено с decoded.id на decoded.userId

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    });
  }
};

// Получение профиля пользователя
exports.getProfile = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { User } = require('../config/database');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Обновляем время последнего входа
    await user.update({ 
      lastLoginAt: new Date(),
      loginCount: user.loginCount + 1
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        language: user.language,
        theme: user.theme,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        apiRequestsCount: user.apiRequestsCount,
        dailyApiLimit: user.dailyApiLimit
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    });
  }
};

// Обновление профиля пользователя
exports.updateProfile = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { firstName, lastName, language, theme, currentPassword, newPassword } = req.body;
    
    const { User } = require('../config/database');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Если требуется смена пароля
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Для смены пароля укажите текущий пароль'
        });
      }

      const isCurrentPasswordValid = await user.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Неверный текущий пароль'
        });
      }

      // Новый пароль будет автоматически захеширован в модели
      await user.update({ password: newPassword });
    }

    // Обновление других полей
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    // Возвращаем обновленные данные
    const updatedUser = await User.findByPk(user.id);

    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        language: updatedUser.language,
        theme: updatedUser.theme,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt,
        loginCount: updatedUser.loginCount
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Админский вход (отдельный endpoint для админ-панели)
exports.adminLogin = async (req, res) => {
  try {
    console.log('🔍 Admin login attempt:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }

    const { User } = require('../config/database');
    
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверные данные для входа'
      });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверные данные для входа'
      });
    }

    // Проверка роли админа (только для админ-панели)
    if (user.role !== 'admin') {
      console.log('❌ Insufficient permissions:', email, 'role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав доступа'
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful:', email);

    res.json({
      success: true,
      message: 'Успешный вход в систему',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
};
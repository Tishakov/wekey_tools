const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const router = express.Router();

// Инициация OAuth с Google
router.get('/google', (req, res, next) => {
  console.log('🚀 OAuth: Initiation request received');
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request URL:', req.url);
  next();
}, passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Callback после OAuth (для обычной авторизации пользователей)
router.get('/google/callback', (req, res, next) => {
  console.log('🔄 OAuth: Callback received from Google');
  console.log('🔍 Callback URL:', req.url);
  console.log('🔍 Callback query:', req.query);
  
  // Проверяем, это GSC авторизация или обычная авторизация пользователя
  if (req.query.state === 'gsc_auth') {
    // Это авторизация для Google Search Console
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`http://localhost:5173/gsc-callback.html?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect(`http://localhost:5173/gsc-callback.html?error=no_code`);
    }

    // Редирект на страницу обработки GSC с кодом
    return res.redirect(`http://localhost:5173/gsc-callback.html?code=${encodeURIComponent(code)}`);
  }
  
  // Проверяем, это подключение Google к существующему аккаунту
  if (req.query.state && req.query.state.startsWith('connect_')) {
    // Это подключение Google аккаунта к существующему пользователю
    return handleGoogleConnect(req, res, next);
  }
  
  // Обычная авторизация пользователя
  next();
}, passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${config.cors.origin}/auth?error=oauth_failed`);
      }

      // Создаем JWT токен (используем userId для совместимости с auth controller)
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Создаем refresh token
      const refreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // Обновляем информацию о последнем входе
      user.lastLogin = new Date();
      await user.save();

      // Подготавливаем данные пользователя для передачи на фронтенд
      const userDataForFrontend = {
        id: user.id,
        email: user.email,
        name: user.name || user.firstName || 'Пользователь',
        avatar: user.avatar || null,
        role: user.role,
        isGoogleUser: user.isGoogleUser
      };

      console.log('🔍 User data for frontend:', userDataForFrontend);

      // Редиректим на frontend с токенами в URL (временное решение)
      const redirectUrl = `${config.cors.origin}/auth/callback?token=${token}&refresh=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userDataForFrontend))}`;

      console.log('🔗 OAuth Callback: Redirecting to:', redirectUrl);
      console.log('🔗 CORS origin:', config.cors.origin);
      console.log('✅ OAuth: User authenticated successfully:', user.email);

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      res.redirect(`${config.cors.origin}/auth?error=callback_error`);
    }
  }
);

// Проверка статуса OAuth
router.get('/status', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      role: req.user.role,
      isGoogleUser: req.user.isGoogleUser
    }
  });
});

// Отвязка Google аккаунта
router.post('/google/unlink', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = req.user;
    
    // Проверяем, что у пользователя есть пароль для входа без Google
    if (!user.password && user.isGoogleUser) {
      return res.status(400).json({
        success: false,
        message: 'Невозможно отвязать Google аккаунт. Сначала установите пароль.'
      });
    }

    // Отвязываем Google
    user.googleId = null;
    user.isGoogleUser = false;
    await user.save();

    res.json({
      success: true,
      message: 'Google аккаунт успешно отвязан'
    });
  } catch (error) {
    console.error('Google Unlink Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отвязке Google аккаунта'
    });
  }
});

// Обработка подключения Google аккаунта к существующему пользователю
const handleGoogleConnect = async (req, res, next) => {
  try {
    const { User } = require('../config/database');
    const userId = req.query.state.replace('connect_', '');
    
    // Проверяем существование пользователя
    const existingUser = await User.findByPk(userId);
    if (!existingUser) {
      return res.redirect(`http://localhost:5173/profile/password?error=${encodeURIComponent('Пользователь не найден')}`);
    }
    
    // Получаем данные Google пользователя через Passport
    passport.authenticate('google', { session: false }, async (err, googleProfile) => {
      try {
        if (err || !googleProfile) {
          return res.redirect(`http://localhost:5173/profile/password?error=${encodeURIComponent('Ошибка авторизации Google')}`);
        }
        
        // Проверяем совпадение email
        if (googleProfile.email !== existingUser.email) {
          return res.redirect(`http://localhost:5173/profile/password?error=${encodeURIComponent('Email аккаунта Google не совпадает с текущим email аккаунта')}`);
        }
        
        // Проверяем, не подключен ли уже этот Google аккаунт к другому пользователю
        const googleUserExists = await User.findOne({ 
          where: { 
            googleId: googleProfile.googleId,
            id: { [require('sequelize').Op.ne]: userId }
          } 
        });
        
        if (googleUserExists) {
          return res.redirect(`http://localhost:5173/profile/password?error=${encodeURIComponent('Этот Google аккаунт уже подключен к другому пользователю')}`);
        }
        
        // Подключаем Google аккаунт к существующему пользователю
        existingUser.googleId = googleProfile.googleId;
        existingUser.isGoogleUser = false; // Остается классическим пользователем, но с подключенным Google
        existingUser.avatar = existingUser.avatar || googleProfile.avatar; // Обновляем аватар если его нет
        await existingUser.save();
        
        console.log('✅ Google account connected successfully to user:', existingUser.email);
        
        // Редиректим обратно на страницу профиля с успехом
        res.redirect(`http://localhost:5173/profile/password?success=${encodeURIComponent('Google аккаунт успешно подключен')}`);
        
      } catch (error) {
        console.error('❌ Error connecting Google account:', error);
        res.redirect(`http://localhost:5173/profile/password?error=${encodeURIComponent('Внутренняя ошибка сервера')}`);
      }
    })(req, res, next);
    
  } catch (error) {
    console.error('❌ Error in handleGoogleConnect:', error);
    res.redirect(`http://localhost:5173/profile/password?error=${encodeURIComponent('Внутренняя ошибка сервера')}`);
  }
};

module.exports = router;
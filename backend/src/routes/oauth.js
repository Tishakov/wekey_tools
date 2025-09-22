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

// Callback после OAuth
router.get('/google/callback', (req, res, next) => {
  console.log('🔄 OAuth: Callback received from Google');
  console.log('🔍 Callback URL:', req.url);
  console.log('🔍 Callback query:', req.query);
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

module.exports = router;
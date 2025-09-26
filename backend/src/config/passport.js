const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models');
const config = require('./config');

// JWT Strategy для защищенных маршрутов
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret
}, async (payload, done) => {
  try {
    // Поддерживаем оба формата токенов для совместимости
    const userId = payload.userId || payload.id;
    const user = await User.findByPk(userId);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
console.log('🔍 Google OAuth Config:');
console.log('  - Client ID:', config.google.clientId ? 'SET' : 'MISSING');
console.log('  - Client Secret:', config.google.clientSecret ? 'SET' : 'MISSING');  
console.log('  - Callback URL:', config.google.redirectUri);

passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.redirectUri,
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/webmasters.readonly']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth Profile received:', {
      id: profile.id,
      displayName: profile.displayName,
      name: profile.name,
      emails: profile.emails,
      photos: profile.photos
    });
    
    console.log('🔍 Detailed name structure:', {
      displayName: profile.displayName,
      givenName: profile.name?.givenName,
      familyName: profile.name?.familyName,
      middleName: profile.name?.middleName
    });
    
    // Проверяем, есть ли пользователь с таким Google ID
    let user = await User.findOne({
      where: { googleId: profile.id }
    });

    if (user) {
      console.log('✅ Found existing user by Google ID:', user.email);
      // Пользователь найден - обновляем токены и avatar
      user.googleAccessToken = accessToken;
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
      // Устанавливаем время истечения токена (обычно 1 час)
      user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000);
      
      // Обновляем аватар от Google только если у пользователя нет локального аватара
      if (profile.photos && profile.photos[0] && 
          (!user.avatar || user.avatar.startsWith('https://lh3.googleusercontent.com'))) {
        user.avatar = profile.photos[0].value;
        console.log('📸 Updated Google avatar for user:', user.email);
      }
      await user.save();
      return done(null, user);
    }

    // Проверяем, есть ли пользователь с таким email
    user = await User.findOne({
      where: { email: profile.emails[0].value }
    });

    if (user) {
      console.log('✅ Found existing user by email, linking to Google:', user.email);
      // Пользователь с таким email уже есть - связываем с Google
      user.googleId = profile.id;
      user.isGoogleUser = true;
      
      // Обновляем имя и фамилию, если они пустые
      if (!user.firstName && profile.name?.givenName) {
        user.firstName = profile.name.givenName;
        console.log('📝 Updated empty firstName to:', user.firstName);
      }
      
      if (!user.lastName && profile.name?.familyName) {
        user.lastName = profile.name.familyName;
        console.log('📝 Updated empty lastName to:', user.lastName);
      }
      
      // Обновляем общее имя, если оно пустое
      if (!user.name || user.name.trim() === '') {
        user.name = profile.displayName || 
                   `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 
                   'Google User';
        console.log('📝 Updated empty user name to:', user.name);
      }
      
      // Устанавливаем аватар от Google только если у пользователя нет локального аватара
      if (profile.photos && profile.photos[0] && 
          (!user.avatar || user.avatar.startsWith('https://lh3.googleusercontent.com'))) {
        user.avatar = profile.photos[0].value;
        console.log('📸 Set Google avatar for linked user:', user.email);
      }
      
      // Сохраняем токены для Search Console API
      user.googleAccessToken = accessToken;
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
      user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000);
      
      await user.save();
      return done(null, user);
    }

    console.log('🆕 Creating new Google user:', profile.emails[0].value);
    
    // Извлекаем имя и фамилию из Google профиля
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    const fullName = profile.displayName || 
                    `${firstName} ${lastName}`.trim() || 
                    'Google User';
    
    // Создаем нового пользователя
    const userData = {
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: firstName,
      lastName: lastName,
      name: fullName,
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      isGoogleUser: true,
      isEmailVerified: true, // Google email уже верифицирован
      role: 'user',
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiry: new Date(Date.now() + 3600 * 1000)
      // НЕ устанавливаем password для Google пользователей
    };
    
    console.log('📝 Creating user with data:', {
      ...userData,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name
    });
    user = await User.create(userData);
    console.log('✅ User created successfully:', user.id);

    return done(null, user);
  } catch (error) {
    console.error('❌ Google OAuth Error:', error);
    console.error('Stack trace:', error.stack);
    return done(error, null);
  }
}));

// Сериализация для сессий (если будем использовать)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
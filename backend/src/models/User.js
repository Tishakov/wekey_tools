const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Разрешаем null для Google пользователей
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 100]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50]
      }
    },
    // Дополнительная информация профиля
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    // Блок "О себе"
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    interests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Социальные сети
    facebook: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    telegram: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'premium'),
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active'
    },
    language: {
      type: DataTypes.ENUM('ru', 'ua', 'en'),
      defaultValue: 'ru'
    },
    theme: {
      type: DataTypes.ENUM('dark', 'light'),
      defaultValue: 'dark'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    // Для отслеживания использования API
    apiRequestsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dailyApiLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 100 // Базовый лимит для бесплатных пользователей
    },
    lastApiReset: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    // Метаданные
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    isGoogleUser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Система подтверждения email кодом
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [6, 6] // Строго 6 символов
      }
    },
    verificationCodeExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verificationAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5 // Максимум 5 попыток
      }
    },
    lastVerificationSent: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Google API токены для Search Console
    googleAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    googleRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    googleTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Система коинов
    coinBalance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'User coin balance for using tools'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  // Методы экземпляра
  User.prototype.checkPassword = async function(candidatePassword) {
    if (!this.password) {
      return false; // Google пользователи не имеют пароля
    }
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.incrementApiUsage = async function() {
    const now = new Date();
    const lastReset = new Date(this.lastApiReset);
    
    // Сброс счетчика раз в день
    if (now.toDateString() !== lastReset.toDateString()) {
      this.apiRequestsCount = 0;
      this.lastApiReset = now;
    }
    
    this.apiRequestsCount += 1;
    await this.save();
    
    return this.apiRequestsCount;
  };

  User.prototype.canMakeApiRequest = function() {
    const now = new Date();
    const lastReset = new Date(this.lastApiReset);
    
    // Если прошел день, разрешаем запрос
    if (now.toDateString() !== lastReset.toDateString()) {
      return true;
    }
    
    return this.apiRequestsCount < this.dailyApiLimit;
  };

  // Методы для email верификации
  User.prototype.generateVerificationCode = function() {
    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = code;
    this.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
    this.verificationAttempts = 0;
    return code;
  };

  User.prototype.isVerificationCodeValid = function(code) {
    return (
      this.verificationCode === code &&
      this.verificationCodeExpires &&
      new Date() < this.verificationCodeExpires &&
      this.verificationAttempts < 5
    );
  };

  User.prototype.canResendVerification = function() {
    if (!this.lastVerificationSent) return true;
    
    const timeSinceLastSend = Date.now() - new Date(this.lastVerificationSent).getTime();
    const oneMinute = 60 * 1000;
    
    return timeSinceLastSend > oneMinute; // Можно отправлить повторно через 1 минуту
  };

  User.prototype.incrementVerificationAttempt = async function() {
    this.verificationAttempts += 1;
    await this.save();
    return this.verificationAttempts;
  };

  User.prototype.clearVerificationCode = async function() {
    this.verificationCode = null;
    this.verificationCodeExpires = null;
    this.verificationAttempts = 0;
    this.isEmailVerified = true;
    await this.save();
  };

  User.prototype.toJSON = function() {
    const user = { ...this.get() };
    delete user.password;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
    delete user.verificationCode; // Не отправляем код на фронтенд
    return user;
  };

  return User;
};
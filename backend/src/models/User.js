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
      allowNull: false,
      validate: {
        len: [6, 100]
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
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
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
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  // Методы экземпляра
  User.prototype.checkPassword = async function(candidatePassword) {
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

  User.prototype.toJSON = function() {
    const user = { ...this.get() };
    delete user.password;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
    return user;
  };

  return User;
};
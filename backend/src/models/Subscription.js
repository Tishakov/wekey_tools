const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    planType: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
      allowNull: false,
      defaultValue: 'free'
    },
    status: {
      type: DataTypes.ENUM('active', 'canceled', 'expired', 'paused'),
      allowNull: false,
      defaultValue: 'active'
    },
    // Ограничения плана
    dailyApiLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    monthlyApiLimit: {
      type: DataTypes.INTEGER,
      allowNull: true // null = без ограничений
    },
    aiToolsAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Доступ к AI инструментам'
    },
    exportFormats: {
      type: DataTypes.JSON,
      defaultValue: ['txt'],
      comment: 'Доступные форматы экспорта: txt, excel, pdf, csv'
    },
    customBranding: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Возможность убрать брендинг Wekey Tools'
    },
    prioritySupport: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Даты
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true // null = бессрочная подписка
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Платежная информация
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
      allowNull: false,
      defaultValue: 'monthly'
    },
    // Внешние ID для интеграции с платежными системами
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Промокоды и скидки
    discountPercent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    promoCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Метаданные
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Внутренние заметки для админов'
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['planType']
      },
      {
        fields: ['endDate']
      },
      {
        fields: ['stripeSubscriptionId'],
        unique: true
      }
    ]
  });

  // Методы экземпляра
  Subscription.prototype.isActive = function() {
    if (this.status !== 'active') return false;
    if (!this.endDate) return true; // Бессрочная подписка
    return new Date() < new Date(this.endDate);
  };

  Subscription.prototype.isExpiringSoon = function(days = 7) {
    if (!this.endDate) return false;
    const expiryDate = new Date(this.endDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expiryDate <= warningDate;
  };

  Subscription.prototype.getDaysRemaining = function() {
    if (!this.endDate) return null;
    const now = new Date();
    const expiry = new Date(this.endDate);
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Subscription.prototype.canUseAiTools = function() {
    return this.isActive() && this.aiToolsAccess;
  };

  Subscription.prototype.getFeatures = function() {
    const features = {
      dailyApiLimit: this.dailyApiLimit,
      monthlyApiLimit: this.monthlyApiLimit,
      aiToolsAccess: this.aiToolsAccess,
      exportFormats: this.exportFormats,
      customBranding: this.customBranding,
      prioritySupport: this.prioritySupport
    };

    return features;
  };

  // Статические методы
  Subscription.getActivePlanCounts = async function() {
    return await this.findAll({
      attributes: [
        'planType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status: 'active' },
      group: ['planType']
    });
  };

  Subscription.getExpiringSubscriptions = async function(days = 7) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);

    return await this.findAll({
      where: {
        status: 'active',
        endDate: {
          [sequelize.Op.lte]: warningDate,
          [sequelize.Op.gte]: new Date()
        }
      },
      include: ['user']
    });
  };

  return Subscription;
};
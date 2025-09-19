const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
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
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Может быть null для разовых платежей
      references: {
        model: 'subscriptions',
        key: 'id'
      }
    },
    // Основная информация о платеже
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'canceled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    type: {
      type: DataTypes.ENUM('subscription', 'one_time', 'refund', 'chargeback'),
      allowNull: false,
      defaultValue: 'subscription'
    },
    // Платежная система
    paymentProvider: {
      type: DataTypes.ENUM('stripe', 'paypal', 'manual'),
      allowNull: false,
      defaultValue: 'stripe'
    },
    externalTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID транзакции в внешней платежной системе'
    },
    paymentMethodType: {
      type: DataTypes.ENUM('card', 'paypal', 'bank_transfer', 'crypto'),
      allowNull: true
    },
    // Детали платежа
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    // Даты
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Метаданные
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Дополнительная информация о платеже'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Налоги и комиссии
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    feeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      comment: 'Комиссия платежной системы'
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Сумма к получению после вычета комиссий'
    },
    // Возвраты
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Дополнительная информация
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Внутренние заметки'
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Причина неудачного платежа'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['subscriptionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['paymentProvider']
      },
      {
        fields: ['externalTransactionId'],
        unique: true
      },
      {
        fields: ['invoiceNumber'],
        unique: true
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeCreate: (payment) => {
        // Автогенерация номера инвойса
        if (!payment.invoiceNumber) {
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          payment.invoiceNumber = `INV-${date}-${random}`;
        }
        
        // Расчет чистой суммы
        if (payment.amount && payment.feeAmount) {
          payment.netAmount = payment.amount - payment.feeAmount - (payment.taxAmount || 0);
        }
      }
    }
  });

  // Методы экземпляра
  Payment.prototype.isSuccessful = function() {
    return this.status === 'completed';
  };

  Payment.prototype.canRefund = function() {
    return this.status === 'completed' && this.refundAmount < this.amount;
  };

  Payment.prototype.getRemainingRefundAmount = function() {
    if (!this.canRefund()) return 0;
    return this.amount - (this.refundAmount || 0);
  };

  // Статические методы
  Payment.getTotalRevenue = async function(period = '30d') {
    const whereCondition = period === '30d' 
      ? sequelize.literal("createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)")
      : sequelize.literal("createdAt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)");

    const result = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averagePayment']
      ],
      where: {
        status: 'completed',
        [sequelize.Op.and]: whereCondition
      },
      raw: true
    });

    return {
      totalRevenue: parseFloat(result.totalRevenue || 0),
      totalPayments: parseInt(result.totalPayments || 0),
      averagePayment: parseFloat(result.averagePayment || 0)
    };
  };

  Payment.getRevenueByPlan = async function() {
    return await this.findAll({
      attributes: [
        'subscription.planType',
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'paymentCount']
      ],
      include: [{
        model: sequelize.models.Subscription,
        as: 'subscription',
        attributes: []
      }],
      where: { status: 'completed' },
      group: ['subscription.planType'],
      raw: true
    });
  };

  Payment.getFailedPayments = async function(days = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return await this.findAll({
      where: {
        status: 'failed',
        createdAt: {
          [sequelize.Op.gte]: fromDate
        }
      },
      include: ['user', 'subscription'],
      order: [['createdAt', 'DESC']]
    });
  };

  return Payment;
};
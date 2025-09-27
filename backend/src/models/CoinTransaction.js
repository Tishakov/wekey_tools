const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoinTransaction = sequelize.define('CoinTransaction', {
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
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['spend', 'earn', 'refund', 'admin_add', 'admin_subtract', 'registration_bonus']]
      },
      comment: 'Type of coin transaction'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Amount of coins (positive for earn, negative for spend)'
    },
    balanceBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'User balance before transaction'
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'User balance after transaction'
    },
    toolName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tool name if transaction related to tool usage'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Description of transaction'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional transaction metadata'
    }
  }, {
    tableName: 'CoinTransactions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['userId', 'createdAt']
      }
    ]
  });

  // Статические методы для удобной работы с транзакциями
  CoinTransaction.createTransaction = async function(userId, type, amount, options = {}) {
    const { User } = require('../config/database');
    const { toolName, description, metadata } = options;
    
    // Получаем пользователя с блокировкой для обновления
    const user = await User.findByPk(userId, { 
      lock: true,
      transaction: options.transaction 
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.coinBalance;
    const balanceAfter = balanceBefore + amount;

    // Проверяем, что баланс не станет отрицательным
    if (balanceAfter < 0) {
      throw new Error('Insufficient coin balance');
    }

    // Создаем транзакцию
    const coinTransaction = await this.create({
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      toolName,
      description,
      metadata
    }, { transaction: options.transaction });

    // Обновляем баланс пользователя
    await user.update({ coinBalance: balanceAfter }, { 
      transaction: options.transaction 
    });

    return {
      transaction: coinTransaction,
      newBalance: balanceAfter,
      user
    };
  };

  // Метод для списания коинов за использование инструмента
  CoinTransaction.spendForTool = async function(userId, toolName, amount = 1, transaction = null) {
    return await this.createTransaction(userId, 'spend', -amount, {
      toolName,
      description: `Tool usage: ${toolName}`,
      metadata: { toolUsage: true },
      transaction
    });
  };

  // Метод для начисления коинов за регистрацию
  CoinTransaction.registrationBonus = async function(userId, amount = 100, transaction = null) {
    return await this.createTransaction(userId, 'registration_bonus', amount, {
      description: 'Registration bonus',
      metadata: { registrationBonus: true },
      transaction
    });
  };

  // Метод для получения истории транзакций пользователя
  CoinTransaction.getUserHistory = async function(userId, limit = 50, offset = 0) {
    return await this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  };

  return CoinTransaction;
};
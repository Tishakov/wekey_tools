const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CoinOperationReasons', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['add', 'subtract', 'both']]
        },
        comment: 'Type of operation: add, subtract, or both'
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Reason text for coin operation'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this reason is active'
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Sort order for display'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем предустановленные причины
    await queryInterface.bulkInsert('CoinOperationReasons', [
      // Причины для начисления
      {
        type: 'add',
        reason: 'Бонус за активность',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'add',
        reason: 'Компенсация за ошибку системы',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'add',
        reason: 'Подарок от администрации',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'add',
        reason: 'Победа в конкурсе',
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Причины для списания
      {
        type: 'subtract',
        reason: 'Нарушение правил платформы',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'subtract',
        reason: 'Возврат по запросу пользователя',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'subtract',
        reason: 'Административное списание',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Общие причины
      {
        type: 'both',
        reason: 'Корректировка баланса',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'both',
        reason: 'Тестовая операция',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CoinOperationReasons');
  }
};
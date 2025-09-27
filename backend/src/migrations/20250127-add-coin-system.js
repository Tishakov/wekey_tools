'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🪙 Adding coin system to database...');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Добавляем поле coinBalance в таблицу Users
      await queryInterface.addColumn('Users', 'coinBalance', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100, // Стартовый баланс для новых пользователей
        comment: 'User coin balance for using tools'
      }, { transaction });

      // Создаем таблицу для истории транзакций коинов
      await queryInterface.createTable('CoinTransactions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        type: {
          type: Sequelize.STRING(20),
          allowNull: false,
          validate: {
            isIn: [['spend', 'earn', 'refund', 'admin_add', 'admin_subtract', 'registration_bonus']]
          },
          comment: 'Type of coin transaction'
        },
        amount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Amount of coins (positive for earn, negative for spend)'
        },
        balanceBefore: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'User balance before transaction'
        },
        balanceAfter: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'User balance after transaction'
        },
        toolName: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'Tool name if transaction related to tool usage'
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Description of transaction'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional transaction metadata'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
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

      // Устанавливаем стартовый баланс для всех существующих пользователей
      await queryInterface.sequelize.query(
        'UPDATE Users SET coinBalance = 100 WHERE coinBalance IS NULL OR coinBalance = 0',
        { transaction }
      );

      await transaction.commit();
      console.log('✅ Coin system added successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding coin system:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing coin system from database...');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Удаляем таблицу транзакций
      await queryInterface.dropTable('CoinTransactions', { transaction });
      
      // Удаляем поле coinBalance
      await queryInterface.removeColumn('Users', 'coinBalance', { transaction });

      await transaction.commit();
      console.log('✅ Coin system removed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing coin system:', error);
      throw error;
    }
  }
};
/**
 * Migration: Add system emails support
 * Date: 2025-10-01
 * 
 * Changes:
 * 1. Add 'type' and 'isSystem' fields to newsletters table
 * 2. Create email_blocks_library table
 * 3. Create email_variables table
 * 4. Insert default system variables
 */

const { Sequelize, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    console.log('🔄 Running migration: add-system-emails-support');
    
    try {
      // 1. Add new columns to newsletters table
      await queryInterface.addColumn('newsletters', 'type', {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'custom',
        comment: 'custom, system_welcome, system_password_reset, system_verification, system_balance_refill'
      });
      
      await queryInterface.addColumn('newsletters', 'isSystem', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Is this a system email that cannot be deleted'
      });
      
      console.log('✅ Added type and isSystem columns to newsletters');
      
      // 2. Create email_blocks_library table
      await queryInterface.createTable('email_blocks_library', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Block name (e.g., "Purple Header", "Footer with Social")'
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: 'header, footer, content, cta, image, etc.'
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'JSON structure of the block'
        },
        htmlContent: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Rendered HTML of the block'
        },
        thumbnail: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Base64 or URL to thumbnail preview'
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        usageCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: 'How many times this block was used'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      
      console.log('✅ Created email_blocks_library table');
      
      // 3. Create email_variables table
      await queryInterface.createTable('email_variables', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        key: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Variable key (e.g., "name", "balance")'
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Human-readable description'
        },
        example: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'Example value (e.g., "Иван", "100")'
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: 'user, system, custom'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      
      console.log('✅ Created email_variables table');
      
      // 4. Insert default variables
      await queryInterface.bulkInsert('email_variables', [
        // User variables
        { key: 'name', description: 'Полное имя пользователя', example: 'Иван Иванов', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'firstName', description: 'Имя', example: 'Иван', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'lastName', description: 'Фамилия', example: 'Иванов', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'email', description: 'Email пользователя', example: 'user@example.com', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'balance', description: 'Баланс коинов', example: '100', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'registrationDate', description: 'Дата регистрации', example: '01.10.2025', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'lastLoginDate', description: 'Последний вход', example: '15.10.2025', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'coinsSpent', description: 'Потрачено коинов', example: '50', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        { key: 'toolsUsed', description: 'Использовано инструментов', example: '5', category: 'user', createdAt: new Date(), updatedAt: new Date() },
        
        // System variables
        { key: 'platformName', description: 'Название платформы', example: 'Wekey Tools', category: 'system', createdAt: new Date(), updatedAt: new Date() },
        { key: 'supportEmail', description: 'Email поддержки', example: 'support@wekey.tools', category: 'system', createdAt: new Date(), updatedAt: new Date() },
        { key: 'currentYear', description: 'Текущий год', example: '2025', category: 'system', createdAt: new Date(), updatedAt: new Date() },
        { key: 'currentDate', description: 'Текущая дата', example: '01.10.2025', category: 'system', createdAt: new Date(), updatedAt: new Date() },
        { key: 'siteUrl', description: 'URL сайта', example: 'https://wekey.tools', category: 'system', createdAt: new Date(), updatedAt: new Date() },
      ]);
      
      console.log('✅ Inserted default email variables');
      
      console.log('✅ Migration completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    console.log('🔄 Rolling back migration: add-system-emails-support');
    
    try {
      // Remove columns from newsletters
      await queryInterface.removeColumn('newsletters', 'type');
      await queryInterface.removeColumn('newsletters', 'isSystem');
      
      // Drop tables
      await queryInterface.dropTable('email_variables');
      await queryInterface.dropTable('email_blocks_library');
      
      console.log('✅ Rollback completed');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

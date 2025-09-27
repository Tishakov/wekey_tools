'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding profile fields to Users table...');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Добавляем новые поля профиля
      await queryInterface.addColumn('Users', 'gender', {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          isIn: [['male', 'female', 'other']]
        }
      }, { transaction });

      await queryInterface.addColumn('Users', 'birthDate', {
        type: Sequelize.DATEONLY,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Users', 'phone', {
        type: Sequelize.STRING(20),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Users', 'country', {
        type: Sequelize.STRING(100),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Users', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Users', 'profession', {
        type: Sequelize.STRING(100),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Users', 'interests', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      // Социальные сети
      await queryInterface.addColumn('Users', 'facebook', {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true
        }
      }, { transaction });

      await queryInterface.addColumn('Users', 'instagram', {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true
        }
      }, { transaction });

      await queryInterface.addColumn('Users', 'linkedin', {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true
        }
      }, { transaction });

      await queryInterface.addColumn('Users', 'telegram', {
        type: Sequelize.STRING(255),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Users', 'website', {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true
        }
      }, { transaction });

      await transaction.commit();
      console.log('✅ Profile fields added successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding profile fields:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing profile fields from Users table...');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Удаляем добавленные поля
      const fieldsToRemove = [
        'gender', 'birthDate', 'phone', 'country', 'bio', 'profession', 
        'interests', 'facebook', 'instagram', 'linkedin', 'telegram', 'website'
      ];

      for (const field of fieldsToRemove) {
        await queryInterface.removeColumn('Users', field, { transaction });
      }

      await transaction.commit();
      console.log('✅ Profile fields removed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing profile fields:', error);
      throw error;
    }
  }
};
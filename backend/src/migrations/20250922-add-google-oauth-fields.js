const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля для Google OAuth
    await queryInterface.addColumn('users', 'googleId', {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('users', 'isGoogleUser', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'isEmailVerified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });

    // Переименуем старое поле emailVerified в isEmailVerified (если существует)
    try {
      await queryInterface.removeColumn('users', 'emailVerified');
    } catch (error) {
      // Поле не существует, продолжаем
    }

    // Добавляем поле name для отображаемого имени
    await queryInterface.addColumn('users', 'name', {
      type: DataTypes.STRING,
      allowNull: true
    });

    // Добавляем поле lastLogin
    await queryInterface.addColumn('users', 'lastLogin', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // Делаем password необязательным для Google пользователей
    await queryInterface.changeColumn('users', 'password', {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [6, 100]
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'googleId');
    await queryInterface.removeColumn('users', 'isGoogleUser');
    await queryInterface.removeColumn('users', 'isEmailVerified');
    await queryInterface.removeColumn('users', 'name');
    await queryInterface.removeColumn('users', 'lastLogin');
    
    // Возвращаем password как обязательное
    await queryInterface.changeColumn('users', 'password', {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    });

    // Восстанавливаем старое поле emailVerified
    await queryInterface.addColumn('users', 'emailVerified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
  }
};
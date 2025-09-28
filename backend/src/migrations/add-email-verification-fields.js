const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля для email верификации кодом
    await queryInterface.addColumn('users', 'verificationCode', {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [6, 6] // Строго 6 символов
      }
    });

    await queryInterface.addColumn('users', 'verificationCodeExpires', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'verificationAttempts', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5 // Максимум 5 попыток
      }
    });

    await queryInterface.addColumn('users', 'lastVerificationSent', {
      type: DataTypes.DATE,
      allowNull: true
    });

    console.log('✅ Поля для email верификации добавлены в таблицу users');
  },

  down: async (queryInterface, Sequelize) => {
    // Откатываем изменения
    await queryInterface.removeColumn('users', 'verificationCode');
    await queryInterface.removeColumn('users', 'verificationCodeExpires');
    await queryInterface.removeColumn('users', 'verificationAttempts');
    await queryInterface.removeColumn('users', 'lastVerificationSent');

    console.log('❌ Поля для email верификации удалены из таблицы users');
  }
};
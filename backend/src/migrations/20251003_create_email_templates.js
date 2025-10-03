const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('email_templates', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      template_data: {
        type: DataTypes.TEXT('long'), // JSON с sections и globalStyles
        allowNull: false
      },
      html_output: {
        type: DataTypes.TEXT('long'), // Сгенерированный HTML
        allowNull: true
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'general'
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Индексы для быстрого поиска
    await queryInterface.addIndex('email_templates', ['created_by']);
    await queryInterface.addIndex('email_templates', ['category']);
    await queryInterface.addIndex('email_templates', ['is_published']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('email_templates');
  }
};

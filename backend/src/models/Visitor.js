const { DataTypes } = require('sequelize');

/**
 * Модель для отслеживания посетителей (User tracking)
 */
function defineVisitor(sequelize) {
  const Visitor = sequelize.define('Visitor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'UUID пользователя из localStorage'
    },
    firstVisit: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Дата первого посещения'
    },
    lastVisit: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Дата последнего посещения'
    },
    sessionsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Количество сессий'
    },
    pagesViewed: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      comment: 'JSON массив просмотренных страниц'
    },
    hasUsedTools: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Использовал ли инструменты'
    },
    toolsUsed: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      comment: 'JSON массив использованных инструментов'
    },
    userAgent: {
      type: DataTypes.TEXT,
      comment: 'User Agent браузера'
    },
    referrer: {
      type: DataTypes.STRING,
      comment: 'Источник перехода'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'visitors',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['firstVisit']
      },
      {
        fields: ['hasUsedTools']
      }
    ]
  });

  // Геттеры для JSON полей
  Visitor.prototype.getPagesViewed = function() {
    try {
      return JSON.parse(this.pagesViewed || '[]');
    } catch (e) {
      return [];
    }
  };

  Visitor.prototype.getToolsUsed = function() {
    try {
      return JSON.parse(this.toolsUsed || '[]');
    } catch (e) {
      return [];
    }
  };

  // Сеттеры для JSON полей
  Visitor.prototype.setPagesViewed = function(pages) {
    this.pagesViewed = JSON.stringify(pages);
  };

  Visitor.prototype.setToolsUsed = function(tools) {
    this.toolsUsed = JSON.stringify(tools);
  };

  return Visitor;
}

module.exports = defineVisitor;
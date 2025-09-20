const { DataTypes } = require('sequelize');

/**
 * Модель для событий аналитики (User events tracking)
 */
function defineAnalyticsEvent(sequelize) {
  const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'UUID пользователя'
    },
    event: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Тип события: page_view, tool_usage, session_start'
    },
    page: {
      type: DataTypes.STRING,
      comment: 'Страница (для page_view)'
    },
    tool: {
      type: DataTypes.STRING,
      comment: 'Инструмент (для tool_usage)'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Время события'
    },
    userAgent: {
      type: DataTypes.TEXT,
      comment: 'User Agent браузера'
    },
    referrer: {
      type: DataTypes.STRING,
      comment: 'Источник перехода'
    },
    sessionId: {
      type: DataTypes.STRING,
      comment: 'ID сессии'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'analytics_events',
    timestamps: false, // Используем собственный timestamp
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['event']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['page']
      },
      {
        fields: ['tool']
      }
    ]
  });

  return AnalyticsEvent;
}

module.exports = defineAnalyticsEvent;
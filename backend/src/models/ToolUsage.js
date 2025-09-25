const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ToolUsage = sequelize.define('ToolUsage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Разрешаем null для анонимных пользователей
      references: {
        model: 'users',
        key: 'id'
      }
    },
    toolName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[ // Валидируем только известные инструменты
          'case-changer', 'remove-duplicates', 'duplicate-finder',
          'text-to-html', 'text-optimizer', 'spaces-to-paragraphs',
          'text-sorting', 'remove-empty-lines', 'transliteration',
          'minus-words', 'utm-generator', 'cross-analytics',
          'word-gluing', 'word-mixer', 'remove-line-breaks',
          'add-symbol', 'find-replace', 'text-generator',
          'synonym-generator', 'word-declension', 'text-by-columns',
          'char-counter', 'match-types', 'number-generator',
          'password-generator', 'emoji', 'site-audit', 'seo-audit', 
          'seo-audit-pro', 'seoauditpro', 'privacy-policy-generator', 'qr-generator'
        ]]
      }
    },
    // Метаданные использования
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true, // Для отслеживания анонимных сессий
      comment: 'UUID сессии для анонимных пользователей'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true // IPv4/IPv6
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Данные о входе
    inputLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Длина входного текста в символах'
    },
    outputLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Длина результата в символах'
    },
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Время обработки в миллисекундах'
    },
    // Дополнительные данные
    toolVersion: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: '1.0'
    },
    language: {
      type: DataTypes.ENUM('ru', 'ua', 'en'),
      allowNull: true,
      defaultValue: 'ru'
    },
    wasSuccessful: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Был ли запрос обработан успешно'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Сообщение об ошибке, если была'
    }
  }, {
    tableName: 'tool_usage',
    timestamps: true,
    indexes: [
      {
        fields: ['toolName']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['toolName', 'createdAt'] // Составной индекс для аналитики
      }
    ]
  });

  // Методы модели (адаптированы для SQLite)
  ToolUsage.getPopularTools = async function(limit = 10, timeframe = '30d') {
    const daysAgo = timeframe === '30d' ? 30 : 7;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

    return await this.findAll({
      attributes: [
        'toolName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers']
      ],
      where: {
        createdAt: {
          [sequelize.Op.gte]: dateThreshold
        }
      },
      group: ['toolName'],
      order: [[sequelize.literal('usageCount'), 'DESC']],
      limit,
      raw: true
    });
  };

  ToolUsage.getTotalUsageStats = async function() {
    const stats = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsage'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('toolName'))), 'toolsUsed'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('sessionId'))), 'uniqueSessions']
      ],
      raw: true
    });

    return {
      totalUsage: parseInt(stats.totalUsage || 0),
      toolsUsed: parseInt(stats.toolsUsed || 0),
      uniqueUsers: parseInt(stats.uniqueUsers || 0),
      uniqueSessions: parseInt(stats.uniqueSessions || 0)
    };
  };

  ToolUsage.getUserUsageStats = async function(userId) {
    return await this.findAll({
      attributes: [
        'toolName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastUsed']
      ],
      where: { userId },
      group: ['toolName'],
      order: [[sequelize.literal('usageCount'), 'DESC']],
      raw: true
    });
  };

  return ToolUsage;
};
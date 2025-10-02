const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Newsletter = sequelize.define('Newsletter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // System email fields
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'custom',
      comment: 'custom, system_welcome, system_password_reset, system_verification, system_balance_refill'
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Is this a system email that cannot be deleted'
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Настройки аудитории
    targetAudience: {
      type: DataTypes.ENUM('all', 'specific', 'segment'),
      defaultValue: 'all',
      allowNull: false
    },
    // JSON с ID конкретных пользователей (если targetAudience = 'specific')
    specificUsers: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('specificUsers');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('specificUsers', JSON.stringify(value || []));
      }
    },
    // JSON с критериями сегментации (если targetAudience = 'segment')
    segmentCriteria: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('segmentCriteria');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('segmentCriteria', JSON.stringify(value || {}));
      }
    },
    // Статистика отправки
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'failed'),
      defaultValue: 'draft',
      allowNull: false
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalRecipients: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    failedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Метаданные
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'newsletters',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['scheduledAt']
      }
    ]
  });

  return Newsletter;
};
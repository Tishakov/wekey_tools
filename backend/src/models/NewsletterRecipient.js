const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NewsletterRecipient = sequelize.define('NewsletterRecipient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    newsletterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'newsletters',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'bounced'),
      defaultValue: 'pending'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Статистика открытий (для будущего функционала)
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clickedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'newsletter_recipients',
    timestamps: true,
    indexes: [
      {
        fields: ['newsletterId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['newsletterId', 'userId']
      }
    ]
  });

  return NewsletterRecipient;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NewsReadStatus = sequelize.define('NewsReadStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'news',
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'news_read_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'newsId']
      },
      {
        fields: ['userId', 'isRead']
      }
    ]
  });

  return NewsReadStatus;
};
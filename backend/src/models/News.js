const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const News = sequelize.define('News', {
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
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 255]
      }
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Изображение
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageAlt: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Теги
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('tags');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      }
    },
    // Статус публикации
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      allowNull: false
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Email уведомления
    sendEmailNotification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailRecipientCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // SEO
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metaKeywords: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Статистика просмотров
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Приоритет (для сортировки)
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Автор
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'news',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['publishedAt']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['priority']
      },
      {
        unique: true,
        fields: ['slug']
      }
    ]
  });

  return News;
};
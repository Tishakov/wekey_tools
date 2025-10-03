const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailTemplate = sequelize.define('EmailTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    templateData: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      field: 'template_data',
      get() {
        const rawValue = this.getDataValue('templateData');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('templateData', JSON.stringify(value));
      }
    },
    htmlOutput: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'html_output'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'general'
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
    }
  }, {
    tableName: 'email_templates',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return EmailTemplate;
};

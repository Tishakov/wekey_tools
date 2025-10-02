const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailVariable = sequelize.define('EmailVariable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Variable key (e.g., "name", "balance")'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description'
    },
    example: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Example value (e.g., "Иван", "100")'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'user, system, custom'
    }
  }, {
    tableName: 'email_variables',
    timestamps: true,
    indexes: [
      {
        fields: ['key'],
        unique: true
      },
      {
        fields: ['category']
      }
    ]
  });

  return EmailVariable;
};

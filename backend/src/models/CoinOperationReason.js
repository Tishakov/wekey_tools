const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoinOperationReason = sequelize.define('CoinOperationReason', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['add', 'subtract', 'both']]
      },
      comment: 'Type of operation: add, subtract, or both'
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Reason text for coin operation'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this reason is active'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Sort order for display'
    }
  }, {
    tableName: 'CoinOperationReasons',
    timestamps: true,
    indexes: [
      {
        fields: ['type', 'isActive']
      },
      {
        fields: ['sortOrder']
      }
    ]
  });

  // Статический метод для получения причин по типу операции
  CoinOperationReason.getByType = async function(operationType) {
    const whereCondition = {
      isActive: true
    };

    // Если тип указан, фильтруем по типу или 'both'
    if (operationType && ['add', 'subtract'].includes(operationType)) {
      whereCondition.type = [operationType, 'both'];
    }

    return await this.findAll({
      where: whereCondition,
      order: [['sortOrder', 'ASC'], ['reason', 'ASC']]
    });
  };

  // Статический метод для создания новой причины
  CoinOperationReason.createReason = async function(type, reason, sortOrder = 0) {
    return await this.create({
      type,
      reason,
      sortOrder,
      isActive: true
    });
  };

  return CoinOperationReason;
};
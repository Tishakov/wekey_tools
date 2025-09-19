const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Инициализация Sequelize
const sequelize = new Sequelize(config.development);

// Импорт моделей
const User = require('./User')(sequelize);
const ToolUsage = require('./ToolUsage')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Payment = require('./Payment')(sequelize);

// Определение ассоциаций
User.hasMany(ToolUsage, { foreignKey: 'userId', as: 'toolUsages' });
ToolUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Subscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

module.exports = {
  sequelize,
  User,
  ToolUsage,
  Subscription,
  Payment
};
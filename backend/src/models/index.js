const { Sequelize } = require('sequelize');
const path = require('path');

// Создаем подключение к SQLite напрямую
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

// Импорт моделей
const User = require('./User')(sequelize);
const ToolUsage = require('./ToolUsage')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Payment = require('./Payment')(sequelize);
const Visitor = require('./Visitor')(sequelize);
const AnalyticsEvent = require('./AnalyticsEvent')(sequelize);

// Определение ассоциаций
User.hasMany(ToolUsage, { foreignKey: 'userId', as: 'toolUsages' });
ToolUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Subscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Ассоциации для аналитики
Visitor.hasMany(AnalyticsEvent, { foreignKey: 'userId', sourceKey: 'userId', as: 'events' });
AnalyticsEvent.belongsTo(Visitor, { foreignKey: 'userId', targetKey: 'userId', as: 'visitor' });

module.exports = {
  sequelize,
  User,
  ToolUsage,
  Subscription,
  Payment,
  Visitor,
  AnalyticsEvent
};
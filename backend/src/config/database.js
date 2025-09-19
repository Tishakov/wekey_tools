const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config.database[env];

// Создание подключения к БД
let sequelize;

if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage || './database.sqlite',
    logging: dbConfig.logging || false
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool || {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Импорт моделей
const User = require('../models/User')(sequelize);
const ToolUsage = require('../models/ToolUsage')(sequelize);
const Subscription = require('../models/Subscription')(sequelize);
const Payment = require('../models/Payment')(sequelize);

// Определение ассоциаций между моделями
const db = {
  sequelize,
  Sequelize,
  User,
  ToolUsage,
  Subscription,
  Payment
};

// Связи между таблицами
User.hasMany(ToolUsage, { foreignKey: 'userId', as: 'toolUsages' });
ToolUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Subscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

module.exports = db;
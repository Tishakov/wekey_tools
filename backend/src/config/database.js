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
const CoinTransaction = require('../models/CoinTransaction')(sequelize);
const CoinOperationReason = require('../models/CoinOperationReason')(sequelize);
const Newsletter = require('../models/Newsletter')(sequelize);
const News = require('../models/News')(sequelize);
const NewsReadStatus = require('../models/NewsReadStatus')(sequelize);
const NewsletterRecipient = require('../models/NewsletterRecipient')(sequelize);
const EmailVariable = require('../models/EmailVariable')(sequelize);

// Определение ассоциаций между моделями
const db = {
  sequelize,
  Sequelize,
  User,
  ToolUsage,
  Subscription,
  Payment,
  CoinTransaction,
  CoinOperationReason,
  Newsletter,
  News,
  NewsReadStatus,
  NewsletterRecipient,
  EmailVariable
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

User.hasMany(CoinTransaction, { foreignKey: 'userId', as: 'coinTransactions' });
CoinTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Связи для Newsletter
User.hasMany(Newsletter, { foreignKey: 'createdBy', as: 'newsletters' });
Newsletter.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Newsletter.hasMany(NewsletterRecipient, { foreignKey: 'newsletterId', as: 'recipients' });
NewsletterRecipient.belongsTo(Newsletter, { foreignKey: 'newsletterId', as: 'newsletter' });

User.hasMany(NewsletterRecipient, { foreignKey: 'userId', as: 'newsletterReceipts' });
NewsletterRecipient.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Связи для News
User.hasMany(News, { foreignKey: 'createdBy', as: 'news' });
News.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(NewsReadStatus, { foreignKey: 'userId', as: 'newsReadStatuses' });
NewsReadStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });

News.hasMany(NewsReadStatus, { foreignKey: 'newsId', as: 'readStatuses' });
NewsReadStatus.belongsTo(News, { foreignKey: 'newsId', as: 'news' });

module.exports = db;
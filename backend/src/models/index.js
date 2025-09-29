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
const Tool = require('./Tool')(sequelize);
const CoinOperationReason = require('./CoinOperationReason')(sequelize);
const CoinTransaction = require('./CoinTransaction')(sequelize);
const Newsletter = require('./Newsletter')(sequelize);
const NewsletterRecipient = require('./NewsletterRecipient')(sequelize);
const News = require('./News')(sequelize);
const NewsReadStatus = require('./NewsReadStatus')(sequelize);

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

// Ассоциации для монет
User.hasMany(CoinTransaction, { foreignKey: 'userId', as: 'coinTransactions' });
CoinTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Ассоциации для newsletters и news
User.hasMany(Newsletter, { foreignKey: 'createdBy', as: 'newsletters' });
Newsletter.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Newsletter.hasMany(NewsletterRecipient, { foreignKey: 'newsletterId', as: 'recipients' });
NewsletterRecipient.belongsTo(Newsletter, { foreignKey: 'newsletterId', as: 'newsletter' });

User.hasMany(NewsletterRecipient, { foreignKey: 'userId', as: 'newsletterRecipients' });
NewsletterRecipient.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(News, { foreignKey: 'createdBy', as: 'createdNews' });
News.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(NewsReadStatus, { foreignKey: 'userId', as: 'newsReadStatuses' });
NewsReadStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });

News.hasMany(NewsReadStatus, { foreignKey: 'newsId', as: 'readStatuses' });
NewsReadStatus.belongsTo(News, { foreignKey: 'newsId', as: 'news' });

module.exports = {
  sequelize,
  User,
  ToolUsage,
  Subscription,
  Payment,
  Visitor,
  AnalyticsEvent,
  Tool,
  CoinOperationReason,
  CoinTransaction,
  Newsletter,
  NewsletterRecipient,
  News,
  NewsReadStatus
};
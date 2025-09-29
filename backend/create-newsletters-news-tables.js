#!/usr/bin/env node

/**
 * Миграция для создания таблиц системы рассылок и новостей
 * Создает таблицы: newsletters, news, news_read_status, newsletter_recipients
 */

const { sequelize } = require('./src/config/database');

async function createNewslettersAndNewsSystem() {
  try {
    console.log('🔄 Начинаем миграцию системы рассылок и новостей...');

    // Создаем таблицу newsletters
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS newsletters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        htmlContent TEXT,
        targetAudience VARCHAR(50) DEFAULT 'all' NOT NULL,
        specificUsers TEXT,
        segmentCriteria TEXT,
        status VARCHAR(50) DEFAULT 'draft' NOT NULL,
        scheduledAt DATETIME,
        sentAt DATETIME,
        totalRecipients INTEGER DEFAULT 0,
        sentCount INTEGER DEFAULT 0,
        failedCount INTEGER DEFAULT 0,
        createdBy INTEGER NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);

    console.log('✅ Таблица newsletters создана');

    // Создаем таблицу news
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        htmlContent TEXT,
        featuredImage VARCHAR(255),
        imageAlt VARCHAR(255),
        tags TEXT,
        status VARCHAR(50) DEFAULT 'draft' NOT NULL,
        publishedAt DATETIME,
        sendEmailNotification BOOLEAN DEFAULT 0,
        emailSentAt DATETIME,
        emailRecipientCount INTEGER DEFAULT 0,
        metaDescription TEXT,
        metaKeywords TEXT,
        viewCount INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        createdBy INTEGER NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);

    console.log('✅ Таблица news создана');

    // Создаем таблицу news_read_status
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS news_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        newsId INTEGER NOT NULL,
        isRead BOOLEAN DEFAULT 0,
        readAt DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (newsId) REFERENCES news(id),
        UNIQUE(userId, newsId)
      )
    `);

    console.log('✅ Таблица news_read_status создана');

    // Создаем таблицу newsletter_recipients
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS newsletter_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        newsletterId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        sentAt DATETIME,
        failureReason TEXT,
        openedAt DATETIME,
        clickedAt DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (newsletterId) REFERENCES newsletters(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        UNIQUE(newsletterId, userId)
      )
    `);

    console.log('✅ Таблица newsletter_recipients создана');

    // Создаем индексы для оптимизации
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_newsletters_created_by ON newsletters(createdBy)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled_at ON newsletters(scheduledAt)');
    
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_status ON news(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(publishedAt)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_created_by ON news(createdBy)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_priority ON news(priority)');
    
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_read_status_user_read ON news_read_status(userId, isRead)');
    
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_newsletter ON newsletter_recipients(newsletterId)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_user ON newsletter_recipients(userId)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_status ON newsletter_recipients(status)');

    console.log('✅ Индексы созданы');

    console.log('🎉 Миграция системы рассылок и новостей завершена успешно!');
    console.log('');
    console.log('📊 Созданные таблицы:');
    console.log('  - newsletters (рассылки)');
    console.log('  - news (новости)');
    console.log('  - news_read_status (статус прочтения новостей)');
    console.log('  - newsletter_recipients (получатели рассылок)');

  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    throw error;
  }
}

// Запуск миграции
if (require.main === module) {
  createNewslettersAndNewsSystem()
    .then(() => {
      console.log('✅ Миграция завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка миграции:', error);
      process.exit(1);
    });
}

module.exports = { createNewslettersAndNewsSystem };
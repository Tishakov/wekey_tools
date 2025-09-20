/**
 * Скрипт для создания таблиц User tracking аналитики
 */

const { sequelize, Visitor, AnalyticsEvent } = require('./src/models');

async function createAnalyticsTables() {
  try {
    console.log('🔧 Creating User tracking tables...');
    
    // Создаем таблицы
    await Visitor.sync({ force: false });
    console.log('✅ Table "visitors" created/verified');
    
    await AnalyticsEvent.sync({ force: false });
    console.log('✅ Table "analytics_events" created/verified');
    
    console.log('🎉 User tracking tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Запускаем только если вызван напрямую
if (require.main === module) {
  createAnalyticsTables()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createAnalyticsTables;
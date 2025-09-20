const db = require('./src/config/database');

async function checkStats() {
  try {
    console.log('🔍 Проверка статистики в БД...');
    
    await db.sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Проверяем все записи в tool_usage
    const allUsage = await db.ToolUsage.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log('\n📊 Последние 10 записей использования инструментов:');
    allUsage.forEach((usage, index) => {
      console.log(`${index + 1}. ${usage.toolName} - ${usage.createdAt} (User: ${usage.userId || 'Anonymous'})`);
    });

    // Статистика по инструментам
    const stats = await db.ToolUsage.findAll({
      attributes: [
        'toolName',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['toolName'],
      order: [[db.sequelize.literal('count'), 'DESC']],
      raw: true
    });

    console.log('\n🎯 Статистика по инструментам:');
    stats.forEach(stat => {
      console.log(`- ${stat.toolName}: ${stat.count} использований`);
    });

    await db.sequelize.close();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkStats();
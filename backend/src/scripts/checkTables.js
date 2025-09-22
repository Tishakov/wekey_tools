const { Sequelize } = require('sequelize');
const path = require('path');

// Настройка подключения к базе данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: console.log
});

async function checkTables() {
  try {
    console.log('📊 Проверяем структуру базы данных...');

    // Получаем список таблиц
    const tables = await sequelize.query(`
      SELECT name FROM sqlite_master WHERE type='table';
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('📋 Найденные таблицы:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    // Проверяем таблицу Visitors
    if (tables.some(t => t.name === 'Visitors')) {
      const visitorsCount = await sequelize.query(`
        SELECT COUNT(*) as count FROM Visitors
      `, { type: Sequelize.QueryTypes.SELECT });
      
      console.log(`\n👥 Посетителей в базе: ${visitorsCount[0].count}`);

      // Находим посетителей с некорректными путями
      const problematicVisitors = await sequelize.query(`
        SELECT COUNT(*) as count FROM Visitors 
        WHERE pagesViewed LIKE '%/ru/ru/%' 
           OR pagesViewed LIKE '%/en/en/%' 
           OR pagesViewed LIKE '%/uk/uk/%'
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`⚠️ Посетителей с некорректными путями: ${problematicVisitors[0].count}`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables();
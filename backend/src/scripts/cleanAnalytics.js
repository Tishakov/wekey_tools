const { Sequelize } = require('sequelize');
const path = require('path');

// Настройка подключения к базе данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: console.log
});

async function cleanAnalytics() {
  try {
    console.log('🧹 Начинаем очистку аналитики...');

    // Очищаем некорректные записи в analytics_events
    const result1 = await sequelize.query(`
      DELETE FROM analytics_events 
      WHERE page LIKE '%/ru/ru/%' 
         OR page LIKE '%/en/en/%' 
         OR page LIKE '%/uk/uk/%'
    `);
    
    console.log(`✅ Удалено ${result1[0].changes || 0} некорректных записей из analytics_events`);

    // Очищаем некорректные записи в visitors
    const visitorsToClean = await sequelize.query(`
      SELECT id, pagesViewed FROM visitors 
      WHERE pagesViewed LIKE '%/ru/ru/%' 
         OR pagesViewed LIKE '%/en/en/%' 
         OR pagesViewed LIKE '%/uk/uk/%'
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`📊 Найдено ${visitorsToClean.length} посетителей с некорректными страницами`);

    for (const visitor of visitorsToClean) {
      // Парсим JSON и очищаем некорректные пути
      let pagesViewed;
      try {
        pagesViewed = JSON.parse(visitor.pagesViewed);
      } catch (e) {
        console.log(`⚠️ Не удалось парсить JSON для посетителя ${visitor.id}`);
        continue;
      }

      // Очищаем некорректные пути
      const cleanedPages = pagesViewed.filter(page => {
        // Убираем пути с множественными языковыми префиксами
        return !page.match(/^\/[a-z]{2}\/[a-z]{2}/) && 
               page !== '/ru/ru/' && 
               page !== '/en/en/' && 
               page !== '/uk/uk/';
      });

      // Обновляем запись
      await sequelize.query(`
        UPDATE visitors 
        SET pagesViewed = ? 
        WHERE id = ?
      `, {
        replacements: [JSON.stringify(cleanedPages), visitor.id],
        type: Sequelize.QueryTypes.UPDATE
      });

      console.log(`✅ Очищен посетитель ${visitor.id}: ${pagesViewed.length} → ${cleanedPages.length} страниц`);
    }

    console.log('🎉 Очистка аналитики завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при очистке аналитики:', error);
  } finally {
    await sequelize.close();
  }
}

cleanAnalytics();
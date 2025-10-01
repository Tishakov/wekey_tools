const { AnalyticsEvent } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function removeDuplicateEvents() {
  try {
    await sequelize.sync();
    
    // Подсчитаем все события за последние 30 минут
    const recentCount = await AnalyticsEvent.count({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    });
    
    console.log('События за последние 30 минут:', recentCount);
    
    // Найдем потенциальные дублирующиеся события
    // События с одинаковыми userId, event=page_view, page, созданные в течение 1 секунды
    const query = `
      SELECT userId, event, page, COUNT(*) as count, 
             MIN(createdAt) as first_created, 
             MAX(createdAt) as last_created,
             MAX(id) - MIN(id) as id_diff
      FROM analytics_events 
      WHERE event = 'page_view' 
        AND createdAt > datetime('now', '-30 minutes')
      GROUP BY userId, event, page, datetime(createdAt, 'start of day', '+' || (strftime('%s', createdAt) / 3600) || ' hours')
      HAVING count > 1 
        AND (julianday(last_created) - julianday(first_created)) * 86400 < 10
      ORDER BY count DESC
    `;
    
    const duplicatesInfo = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Найдено групп дублирующихся событий:', duplicatesInfo.length);
    
    if (duplicatesInfo.length > 0) {
      console.log('Примеры дублирующихся событий:');
      duplicatesInfo.slice(0, 5).forEach(dup => {
        console.log(`- ${dup.page}: ${dup.count} событий, разница ${Math.round((new Date(dup.last_created) - new Date(dup.first_created)) / 1000)}сек`);
      });
    }
    
    // Удаляем дублирующиеся события page_view, оставляя только первое в каждой группе
    let totalDeleted = 0;
    
    for (const dup of duplicatesInfo) {
      if (dup.count <= 1) continue;
      
      // Находим все события этой группы
      const events = await AnalyticsEvent.findAll({
        where: {
          userId: dup.userId,
          event: dup.event,
          page: dup.page,
          createdAt: {
            [require('sequelize').Op.between]: [
              new Date(new Date(dup.first_created).getTime() - 5000),
              new Date(new Date(dup.last_created).getTime() + 5000)
            ]
          }
        },
        order: [['createdAt', 'ASC']]
      });
      
      if (events.length > 1) {
        // Оставляем первое событие, удаляем дублирующиеся
        const toDeleteIds = events.slice(1).map(e => e.id);
        
        const deleted = await AnalyticsEvent.destroy({
          where: {
            id: toDeleteIds
          }
        });
        
        totalDeleted += deleted;
        console.log(`Удалено ${deleted} дублирующихся событий для ${dup.page}`);
      }
    }
    
    console.log(`Всего удалено дублирующихся событий: ${totalDeleted}`);
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

removeDuplicateEvents();
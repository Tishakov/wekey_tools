const { Sequelize, DataTypes } = require('sequelize');

// Подключение к базе данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false // Отключаем логи для чистоты вывода
});

// Модель ToolUsage
const ToolUsage = sequelize.define('ToolUsage', {
  userId: DataTypes.STRING,
  toolName: DataTypes.STRING,
  sessionId: DataTypes.STRING,
  ipAddress: DataTypes.STRING,
  userAgent: DataTypes.TEXT,
  inputLength: DataTypes.INTEGER,
  outputLength: DataTypes.INTEGER,
  processingTime: DataTypes.INTEGER,
  toolVersion: DataTypes.STRING,
  language: DataTypes.STRING,
  wasSuccessful: DataTypes.BOOLEAN,
  errorMessage: DataTypes.TEXT
}, {
  tableName: 'tool_usage'
});

async function checkRemoveDuplicatesStats() {
  try {
    await sequelize.authenticate();
    console.log('🔍 СТАТИСТИКА ДЛЯ remove-duplicates:\n');
    
    // Проверяем новый ID
    const newStats = await ToolUsage.findAll({
      where: { toolName: 'remove-duplicates' },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 Записи с ID "remove-duplicates": ${newStats.length}`);
    
    if (newStats.length > 0) {
      console.log('🕒 Последняя запись:', newStats[0].createdAt);
      console.log('📝 Детали последней записи:');
      console.log('   - Длина входного текста:', newStats[0].inputLength);
      console.log('   - Длина выходного текста:', newStats[0].outputLength);
      console.log('   - Успешно:', newStats[0].wasSuccessful);
    }
    
    // Проверяем старый ID
    const oldStats = await ToolUsage.findAll({
      where: { toolName: 'duplicate_removal_tool' }
    });
    
    console.log(`\n📊 Записи со старым ID "duplicate_removal_tool": ${oldStats.length}`);
    
    if (oldStats.length > 0) {
      console.log('\n⚠️ НАЙДЕНЫ СТАРЫЕ ЗАПИСИ! Их нужно перенести на новый ID');
      
      // Перенос старых записей на новый ID
      await ToolUsage.update(
        { toolName: 'remove-duplicates' },
        { where: { toolName: 'duplicate_removal_tool' } }
      );
      
      console.log('✅ Старые записи перенесены на новый ID');
      
      // Проверяем результат
      const updatedStats = await ToolUsage.findAll({
        where: { toolName: 'remove-duplicates' }
      });
      
      console.log(`📊 Общее количество записей после переноса: ${updatedStats.length}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkRemoveDuplicatesStats();
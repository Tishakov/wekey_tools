const { User, ToolUsage } = require('./src/config/database');

async function addTestToolUsageData() {
  try {
    console.log('🔧 Добавляем тестовые данные использования инструментов...\n');
    
    // Находим пользователя
    const user = await User.findOne({
      where: { email: 'bohdan.tishakov@gmail.com' }
    });

    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }

    console.log(`✅ Пользователь найден: ${user.email} (ID: ${user.id})`);

    // Создаем тестовые данные использования инструментов
    const testUsageData = [
      { toolName: 'case-changer', count: 15 },
      { toolName: 'remove-duplicates', count: 8 },
      { toolName: 'text-to-html', count: 12 },
      { toolName: 'utm-generator', count: 5 },
      { toolName: 'word-mixer', count: 3 },
      { toolName: 'seo-audit', count: 7 },
      { toolName: 'password-generator', count: 2 }
    ];

    let totalRecords = 0;

    for (const tool of testUsageData) {
      for (let i = 0; i < tool.count; i++) {
        await ToolUsage.create({
          userId: user.id,
          toolName: tool.toolName,
          sessionId: `test-session-${Date.now()}-${i}`,
          ipAddress: '127.0.0.1',
          inputLength: Math.floor(Math.random() * 1000) + 50,
          outputLength: Math.floor(Math.random() * 1200) + 60,
          processingTime: Math.floor(Math.random() * 500) + 10,
          wasSuccessful: true,
          language: 'ru'
        });
        totalRecords++;
      }
      console.log(`✅ Добавлено ${tool.count} записей для инструмента: ${tool.toolName}`);
    }

    console.log(`\n🎉 Всего добавлено ${totalRecords} записей использования инструментов!`);
    console.log(`📊 Уникальных инструментов: ${testUsageData.length}`);

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
  } finally {
    process.exit(0);
  }
}

addTestToolUsageData();
const db = require('./src/config/database');

async function testConnection() {
  try {
    console.log('🔍 Тестирование подключения к базе данных...');
    
    await db.sequelize.authenticate();
    console.log('✅ Подключение к базе данных успешно установлено.');
    
    console.log('📋 Синхронизация моделей...');
    await db.sequelize.sync({ force: false });
    console.log('✅ Все модели синхронизированы с базой данных.');
    
    console.log('📊 Проверка моделей...');
    console.log('- User модель:', !!db.User);
    console.log('- ToolUsage модель:', !!db.ToolUsage);
    console.log('- Subscription модель:', !!db.Subscription);
    console.log('- Payment модель:', !!db.Payment);
    
    console.log('🎉 Все проверки пройдены успешно!');
    
    // Создание админа, если его нет
    const adminExists = await db.User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      console.log('👤 Создание админского аккаунта...');
      const admin = await db.User.create({
        email: 'admin@wekey.tools',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        dailyApiLimit: 10000 // Высокий лимит для админа
      });
      
      // Создание админской подписки
      await db.Subscription.create({
        userId: admin.id,
        planType: 'enterprise',
        status: 'active',
        dailyApiLimit: 10000,
        aiToolsAccess: true,
        exportFormats: ['txt', 'excel', 'pdf', 'csv'],
        customBranding: true,
        prioritySupport: true,
        price: 0.00,
        currency: 'USD',
        billingCycle: 'lifetime'
      });
      
      console.log('✅ Админский аккаунт создан:');
      console.log('   Email: admin@wekey.tools');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Админский аккаунт уже существует.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error('Проверьте:');
    console.error('1. Запущен ли MySQL сервер');
    console.error('2. Существует ли база данных wekey_tools_dev');
    console.error('3. Правильные ли параметры в .env файле');
    process.exit(1);
  } finally {
    await db.sequelize.close();
    console.log('🔌 Соединение с базой данных закрыто.');
  }
}

testConnection();
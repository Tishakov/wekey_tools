const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔧 Инициализация базы данных...');
    
    // Подключение к БД
    await db.sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Синхронизация моделей с БД (создание таблиц)
    await db.sequelize.sync({ force: true }); // force: true удаляет и пересоздает таблицы
    console.log('✅ Таблицы созданы');

    // Создаем админа
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await db.User.create({
      email: 'admin@wekey.tools',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Wekey',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      dailyApiLimit: 10000
    });

    console.log('✅ Админ создан:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);

    // Создаем подписку для админа
    await db.Subscription.create({
      userId: admin.id,
      planType: 'admin',
      status: 'active',
      dailyApiLimit: 10000,
      aiToolsAccess: true,
      customBranding: true,
      prioritySupport: true,
      startDate: new Date(),
      price: 0,
      currency: 'USD',
      billingCycle: 'lifetime'
    });

    console.log('✅ Подписка админа создана');

    // Создаем тестового пользователя
    const testUser = await db.User.create({
      email: 'test@example.com',
      password: await bcrypt.hash('test123', 12),
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      status: 'active',
      emailVerified: true,
      dailyApiLimit: 100
    });

    console.log('✅ Тестовый пользователь создан');

    // Создаем тестовую подписку
    await db.Subscription.create({
      userId: testUser.id,
      planType: 'free',
      status: 'active',
      dailyApiLimit: 100,
      aiToolsAccess: false,
      customBranding: false,
      prioritySupport: false,
      startDate: new Date(),
      price: 0,
      currency: 'USD',
      billingCycle: 'monthly'
    });

    console.log('✅ Тестовая подписка создана');

    // Создаем несколько записей использования инструментов
    const toolUsages = [
      { userId: testUser.id, toolName: 'synonym-generator', count: 15 },
      { userId: testUser.id, toolName: 'text-generator', count: 8 },
      { userId: admin.id, toolName: 'case-changer', count: 25 },
      { userId: admin.id, toolName: 'transliteration', count: 12 }
    ];

    for (const usage of toolUsages) {
      await db.ToolUsage.create(usage);
    }

    console.log('✅ Тестовые данные использования инструментов созданы');

    console.log('');
    console.log('🎯 Данные для входа:');
    console.log('   Admin Email: admin@wekey.tools');
    console.log('   Admin Password: admin123');
    console.log('   Test Email: test@example.com');
    console.log('   Test Password: test123');
    
    await db.sequelize.close();
    console.log('✅ База данных инициализирована успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
    console.error(error);
  }
}

initDatabase();
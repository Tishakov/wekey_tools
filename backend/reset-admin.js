const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  try {
    console.log('🔧 Сброс и пересоздание админского аккаунта...');
    
    // Подключение к БД
    await db.sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Удаляем существующего админа
    const deleted = await db.User.destroy({
      where: { email: 'admin@wekey.tools' }
    });
    console.log(`🗑️ Удалено записей: ${deleted}`);

    // Создаем нового админа
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

    console.log('✅ Новый админ создан:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);

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
    console.log('');
    console.log('🎯 Данные для входа:');
    console.log('   Email: admin@wekey.tools');
    console.log('   Password: admin123');
    
    await db.sequelize.close();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

resetAdmin();
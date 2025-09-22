const { sequelize, User } = require('./src/config/database');

async function createTestUser() {
  try {
    // Подключение к базе данных
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Удаляем старых тестовых пользователей если есть
    await User.destroy({ where: { email: 'test@example.com' } });
    await User.destroy({ where: { email: 'premium@example.com' } });
    console.log('🗑️ Removed existing test users');

    // Создаем тестового пользователя
    const testUser = await User.create({
      email: 'test@example.com',
      password: '12345678', // Будет автоматически захеширован
      firstName: 'Тест',
      lastName: 'Пользователь',
      role: 'user',
      language: 'ru',
      theme: 'dark',
      emailVerified: true, // Сразу подтвержденный
      status: 'active'
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: 12345678');
    console.log('👤 Name:', testUser.firstName, testUser.lastName);
    console.log('🎭 Role:', testUser.role);
    console.log('🌍 Language:', testUser.language);
    console.log('💾 ID:', testUser.id);

    // Создаем премиум пользователя
    const premiumUser = await User.create({
      email: 'premium@example.com',
      password: '12345678',
      firstName: 'Премиум',
      lastName: 'Пользователь',
      role: 'premium',
      language: 'en',
      theme: 'light',
      emailVerified: true,
      status: 'active',
      dailyApiLimit: 1000 // Увеличенный лимит для премиум
    });

    console.log('\n✨ Premium user created too!');
    console.log('📧 Email: premium@example.com');
    console.log('🔑 Password: 12345678');
    console.log('👑 Role: premium');
    console.log('🚀 API Limit:', premiumUser.dailyApiLimit);
    console.log('💾 ID:', premiumUser.id);

    // Проверяем пароли сразу после создания
    console.log('\n🧪 Testing passwords:');
    const testCheck = await testUser.checkPassword('12345678');
    const premiumCheck = await premiumUser.checkPassword('12345678');
    console.log(`test@example.com password check: ${testCheck ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`premium@example.com password check: ${premiumCheck ? '✅ VALID' : '❌ INVALID'}`);

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    if (error.name === 'SequelizeValidationError') {
      error.errors.forEach(err => {
        console.error(`   - ${err.path}: ${err.message}`);
      });
    }
  } finally {
    await sequelize.close();
  }
}

// Запуск скрипта
createTestUser();
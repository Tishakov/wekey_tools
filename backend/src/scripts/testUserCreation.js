const { User, sequelize } = require('../config/database');

async function testUserCreation() {
  try {
    await sequelize.sync();
    console.log('✅ База данных синхронизирована');

    // Создаем тестового пользователя
    const testUser = await User.create({
      email: 'test@wekey.tools',
      password: 'testpassword123', // Будет автоматически захеширован
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });

    console.log('✅ Тестовый пользователь создан:');
    console.log('📧 Email: test@wekey.tools');
    console.log('🔑 Пароль: testpassword123');
    console.log('👤 ID:', testUser.id);
    
    // Тестируем проверку пароля
    const isValid = await testUser.checkPassword('testpassword123');
    console.log('🧪 Тест пароля:', isValid ? '✅ Успешно' : '❌ Ошибка');
    
    // Тестируем неправильный пароль
    const isInvalid = await testUser.checkPassword('wrongpassword');
    console.log('🧪 Тест неправильного пароля:', isInvalid ? '❌ Ошибка' : '✅ Корректно отклонен');
    
    process.exit(0);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('⚠️ Тестовый пользователь уже существует');
      
      // Найдем существующего пользователя и протестируем
      const existingUser = await User.findOne({
        where: { email: 'test@wekey.tools' }
      });
      
      const isValid = await existingUser.checkPassword('testpassword123');
      console.log('🧪 Тест пароля существующего пользователя:', isValid ? '✅ Успешно' : '❌ Ошибка');
      
      process.exit(0);
    }
    console.error('❌ Ошибка при создании тестового пользователя:', error);
    process.exit(1);
  }
}

testUserCreation();
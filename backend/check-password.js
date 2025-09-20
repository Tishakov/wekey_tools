const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function checkPassword() {
  try {
    console.log('🔍 Проверка пароля админа...');
    
    // Подключение к БД
    await db.sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Найти админа
    const admin = await db.User.findOne({
      where: { email: 'admin@wekey.tools' }
    });

    if (!admin) {
      console.log('❌ Админ не найден!');
      return;
    }

    console.log('✅ Админ найден:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Password hash:', admin.password.substring(0, 20) + '...');

    // Проверяем пароль разными способами
    const testPassword = 'admin123';
    
    console.log('\n🔑 Тест 1: Прямое сравнение с bcrypt');
    const directCheck = await bcrypt.compare(testPassword, admin.password);
    console.log('   Результат:', directCheck);

    console.log('\n🔑 Тест 2: Через метод модели');
    const modelCheck = await admin.checkPassword(testPassword);
    console.log('   Результат:', modelCheck);

    console.log('\n🔑 Тест 3: Создание нового хеша');
    const newHash = await bcrypt.hash(testPassword, 12);
    const newCheck = await bcrypt.compare(testPassword, newHash);
    console.log('   Новый хеш работает:', newCheck);

    if (!directCheck) {
      console.log('\n🔧 Пароль не совпадает! Создаём новый хеш...');
      const correctHash = await bcrypt.hash(testPassword, 12);
      
      await admin.update({ password: correctHash });
      console.log('✅ Пароль обновлён');
      
      // Повторная проверка
      const finalCheck = await admin.checkPassword(testPassword);
      console.log('🎯 Финальная проверка:', finalCheck);
    }

    await db.sequelize.close();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkPassword();
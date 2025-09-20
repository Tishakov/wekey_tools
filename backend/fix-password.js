const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    console.log('🔧 Исправление пароля админа...');
    
    // Подключение к БД
    await db.sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Создаём правильный хеш
    const correctPassword = 'admin123';
    const correctHash = await bcrypt.hash(correctPassword, 12);
    console.log('🔑 Новый хеш создан');

    // Обновляем напрямую через SQL, минуя хуки модели
    await db.sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      {
        replacements: [correctHash, 'admin@wekey.tools'],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    console.log('✅ Пароль обновлён напрямую в БД');

    // Проверяем результат
    const admin = await db.User.findOne({
      where: { email: 'admin@wekey.tools' }
    });

    const finalCheck = await bcrypt.compare(correctPassword, admin.password);
    console.log('🎯 Финальная проверка:', finalCheck);

    if (finalCheck) {
      console.log('🎉 Пароль исправлен! Теперь можно логиниться.');
    } else {
      console.log('❌ Что-то всё ещё не так...');
    }

    await db.sequelize.close();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

fixPassword();
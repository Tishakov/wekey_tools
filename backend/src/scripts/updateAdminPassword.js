const { User, sequelize } = require('../config/database');

async function updateAdminPassword() {
  try {
    // Синхронизируем базу данных
    await sequelize.sync();
    console.log('✅ База данных подключена');

    // Найдем админ пользователя
    const admin = await User.findOne({ 
      where: { email: 'admin@wekey.tools' } 
    });

    if (!admin) {
      console.log('❌ Админ пользователь не найден');
      process.exit(1);
    }

    // Обновляем пароль (будет автоматически захеширован через hook модели с salt=12)
    admin.password = 'admin123';
    await admin.save();

    console.log('✅ Пароль админа обновлен:');
    console.log('📧 Email: admin@wekey.tools');
    console.log('🔑 Новый пароль: admin123');
    console.log('👤 ID:', admin.id);
    
    // Тестируем новый пароль через метод модели
    const testPassword = await admin.checkPassword('admin123');
    console.log('🧪 Тест пароля через модель:', testPassword ? '✅ Успешно' : '❌ Ошибка');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении пароля:', error);
    process.exit(1);
  }
}

updateAdminPassword();
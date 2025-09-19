const { User, sequelize } = require('../config/database');

async function createAdmin() {
  try {
    // Синхронизируем базу данных (без удаления существующих таблиц)
    await sequelize.sync();
    console.log('✅ База данных создана и синхронизирована');

    // Создаем админ пользователя (пароль будет автоматически захеширован в модели)
    const admin = await User.create({
      email: 'admin@wekey.tools',
      password: 'admin123', // Будет захеширован автоматически с salt=12
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    console.log('✅ Админ пользователь создан:');
    console.log('📧 Email: admin@wekey.tools');
    console.log('🔑 Пароль: admin123');
    console.log('👤 ID:', admin.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при создании админа:', error);
    process.exit(1);
  }
}

createAdmin();
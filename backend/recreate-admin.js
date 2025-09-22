const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function recreateAdmin() {
  try {
    console.log('🔧 Пересоздание администратора...');
    
    // Удаляем старого админа если есть
    const existingAdmin = await User.findOne({
      where: { email: 'admin@wekey.tools' }
    });
    
    if (existingAdmin) {
      await existingAdmin.destroy();
      console.log('🗑️ Старый администратор удален');
    }
    
    // Создаем нового админа (хеширование произойдет автоматически через hook beforeCreate)
    const newAdmin = await User.create({
      email: 'admin@wekey.tools',
      password: 'admin123', // Будет автоматически хеширован
      role: 'admin',
      isGoogleUser: false,
      name: 'Administrator',
      isEmailVerified: true,
      status: 'active'
    });
    
    console.log('✅ Новый администратор создан:');
    console.log('📧 Email:', newAdmin.email);
    console.log('👤 Имя:', newAdmin.name);
    console.log('🔑 Роль:', newAdmin.role);
    console.log('🆔 ID:', newAdmin.id);
    
    // Тестируем новый пароль
    console.log('\n🧪 Тестирование нового пароля...');
    const isPasswordValid = await newAdmin.checkPassword('admin123');
    console.log('✅ Пароль действителен:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('\n🎉 Администратор успешно пересоздан! Можно входить в админ-панель.');
    } else {
      console.log('\n❌ Проблема все еще существует');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при пересоздании администратора:', error.message);
    if (error.name === 'SequelizeValidationError') {
      error.errors.forEach(err => {
        console.error('  -', err.message);
      });
    }
  }
}

recreateAdmin();
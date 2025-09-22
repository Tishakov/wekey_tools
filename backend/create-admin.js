const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createAdmin() {
  try {
    console.log('🔧 Создание администратора...');
    
    // Проверяем, существует ли уже админ с таким email
    const existingAdmin = await User.findOne({
      where: { email: 'admin@wekey.tools' }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Пользователь с email admin@wekey.tools уже существует');
      console.log('Текущая роль:', existingAdmin.role);
      
      if (existingAdmin.role !== 'admin') {
        // Обновляем роль на admin
        await existingAdmin.update({ role: 'admin' });
        console.log('✅ Роль пользователя обновлена на admin');
      } else {
        console.log('✅ Пользователь уже является администратором');
      }
      return;
    }
    
    // Хешируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Создаем админа
    const admin = await User.create({
      email: 'admin@wekey.tools',
      password: hashedPassword,
      role: 'admin',
      isGoogleUser: false,
      name: 'Administrator',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Администратор успешно создан:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Имя:', admin.name);
    console.log('🔑 Роль:', admin.role);
    console.log('🆔 ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error.message);
    if (error.name === 'SequelizeValidationError') {
      error.errors.forEach(err => {
        console.error('  -', err.message);
      });
    }
  }
}

createAdmin();
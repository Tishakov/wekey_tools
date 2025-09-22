const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function testAdminLogin() {
  try {
    console.log('🔍 Тестирование входа администратора...');
    
    // Ищем админа в базе
    const admin = await User.findOne({
      where: { email: 'admin@wekey.tools' }
    });
    
    if (!admin) {
      console.log('❌ Администратор не найден в базе данных');
      return;
    }
    
    console.log('✅ Администратор найден:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Имя:', admin.name);
    console.log('🔑 Роль:', admin.role);
    console.log('🔒 Пароль хеширован:', !!admin.password);
    console.log('🌐 Google пользователь:', admin.isGoogleUser);
    
    // Тестируем пароль
    const testPassword = 'admin123';
    console.log('\n🧪 Тестирование пароля "' + testPassword + '"...');
    
    if (!admin.password) {
      console.log('❌ У администратора нет сохраненного пароля');
      return;
    }
    
    // Тестируем методом модели
    const isValidViaMethod = await admin.checkPassword(testPassword);
    console.log('🔍 Метод checkPassword результат:', isValidViaMethod);
    
    // Тестируем напрямую через bcrypt
    const isValidDirect = await bcrypt.compare(testPassword, admin.password);
    console.log('🔍 Прямое сравнение bcrypt:', isValidDirect);
    
    // Показываем первые символы хеша
    console.log('🔒 Хеш пароля (первые 20 символов):', admin.password.substring(0, 20) + '...');
    
    if (isValidViaMethod && isValidDirect) {
      console.log('\n✅ Пароль корректен! Проблема не в аутентификации пароля.');
    } else {
      console.log('\n❌ Проблема с паролем. Нужно пересоздать администратора.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

testAdminLogin();
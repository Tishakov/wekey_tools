const { User, sequelize } = require('../config/database');

async function checkUserData() {
  try {
    await sequelize.sync();
    console.log('✅ База данных подключена');

    // Получим админ пользователя
    const admin = await User.findOne({ 
      where: { email: 'admin@wekey.tools' } 
    });

    if (!admin) {
      console.log('❌ Админ пользователь не найден');
      process.exit(1);
    }

    console.log('📊 Данные админ пользователя:');
    console.log('ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Password hash:', admin.password);
    console.log('Password hash length:', admin.password ? admin.password.length : 'null');
    console.log('Created at:', admin.createdAt);
    console.log('Updated at:', admin.updatedAt);
    
    // Проверим структуру модели
    console.log('\n🔍 Структура модели User:');
    const attributes = User.getTableName ? User.getTableName() : 'User';
    console.log('Table name:', attributes);
    
    // Проверим все атрибуты модели
    console.log('\n📋 Атрибуты модели:');
    Object.keys(User.rawAttributes).forEach(key => {
      const attr = User.rawAttributes[key];
      console.log(`- ${key}: ${attr.type.constructor.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkUserData();
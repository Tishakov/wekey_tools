const { User } = require('./src/config/database');

async function checkUserProfile() {
  try {
    console.log('🔍 Проверяем профиль пользователя bohdan.tishakov@gmail.com...\n');
    
    const user = await User.findOne({
      where: { email: 'bohdan.tishakov@gmail.com' }
    });

    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }

    console.log('✅ Пользователь найден:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Имя: ${user.firstName || 'НЕ УКАЗАНО'}`);
    console.log(`👤 Фамилия: ${user.lastName || 'НЕ УКАЗАНО'}`);
    console.log(`🎭 Роль: ${user.role}`);
    console.log(`🌍 Язык: ${user.language || 'НЕ УКАЗАНО'}`);
    console.log(`🎨 Тема: ${user.theme || 'НЕ УКАЗАНО'}`);
    console.log('');
    console.log('📋 ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ПРОФИЛЯ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Пол: ${user.gender || 'НЕ УКАЗАНО'}`);
    console.log(`🎂 Дата рождения: ${user.birthDate || 'НЕ УКАЗАНО'}`);
    console.log(`📱 Телефон: ${user.phone || 'НЕ УКАЗАНО'}`);
    console.log(`🌍 Страна: ${user.country || 'НЕ УКАЗАНО'}`);
    console.log(`📝 О себе: ${user.bio || 'НЕ УКАЗАНО'}`);
    console.log(`💼 Профессия: ${user.profession || 'НЕ УКАЗАНО'}`);
    console.log(`🎯 Интересы: ${user.interests || 'НЕ УКАЗАНО'}`);
    console.log('');
    console.log('🔗 СОЦИАЛЬНЫЕ СЕТИ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📘 Facebook: ${user.facebook || 'НЕ УКАЗАНО'}`);
    console.log(`📸 Instagram: ${user.instagram || 'НЕ УКАЗАНО'}`);
    console.log(`💼 LinkedIn: ${user.linkedin || 'НЕ УКАЗАНО'}`);
    console.log(`✈️ Telegram: ${user.telegram || 'НЕ УКАЗАНО'}`);
    console.log(`🌐 Website: ${user.website || 'НЕ УКАЗАНО'}`);
    console.log('');
    console.log('📊 СТАТИСТИКА:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 Создан: ${user.createdAt}`);
    console.log(`🔄 Последний вход: ${user.lastLoginAt || 'НЕ ВХОДИЛ'}`);
    console.log(`🔢 Количество входов: ${user.loginCount || 0}`);
    console.log(`🔧 API запросов: ${user.apiRequestsCount || 0}`);
    console.log(`⚡ Дневной лимит API: ${user.dailyApiLimit || 0}`);

  } catch (error) {
    console.error('❌ Ошибка при проверке профиля:', error);
  } finally {
    process.exit(0);
  }
}

checkUserProfile();
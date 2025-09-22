const { sequelize, User } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function checkTestUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Проверяем тестовых пользователей
    const testEmails = ['test@example.com', 'premium@example.com', 'admin@wekey.tools'];
    
    for (const email of testEmails) {
      console.log(`\n🔍 Checking user: ${email}`);
      
      const user = await User.findOne({ where: { email } });
      
      if (user) {
        console.log(`✅ User exists:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
        
        // Проверяем пароль
        const testPassword = '12345678';
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`   Password check for "${testPassword}": ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (email === 'admin@wekey.tools') {
          const adminPassword = 'admin123';
          const isAdminPasswordValid = await bcrypt.compare(adminPassword, user.password);
          console.log(`   Password check for "${adminPassword}": ${isAdminPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
        }
      } else {
        console.log(`❌ User NOT found`);
      }
    }

    // Тестируем метод checkPassword
    console.log(`\n🧪 Testing checkPassword method:`);
    const testUser = await User.findOne({ where: { email: 'test@example.com' } });
    if (testUser) {
      const methodResult = await testUser.checkPassword('12345678');
      console.log(`   Method result: ${methodResult ? '✅ VALID' : '❌ INVALID'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTestUsers();
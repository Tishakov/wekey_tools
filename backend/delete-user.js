const { sequelize } = require('./src/config/database');

async function deleteUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const email = 'bohdan.tishakov@gmail.com';
    
    // Удаляем пользователя
    const result = await sequelize.query(
      'DELETE FROM users WHERE email = ?',
      {
        replacements: [email],
        type: sequelize.QueryTypes.DELETE
      }
    );
    
    console.log(`✅ User ${email} deleted successfully`);
    console.log('📊 Affected rows:', result);
    
    // Проверяем, что пользователь удален
    const checkUser = await sequelize.query(
      'SELECT * FROM users WHERE email = ?',
      {
        replacements: [email],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (checkUser.length === 0) {
      console.log('🎉 User successfully removed from database');
    } else {
      console.log('⚠️ User still exists in database');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

deleteUser();
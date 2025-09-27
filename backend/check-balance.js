const { sequelize } = require('./src/config/database');
const User = require('./src/models/User')(sequelize);

async function checkBalance() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    const user = await User.findOne({ 
      where: { email: 'bohdan.tishakov@gmail.com' } 
    });
    
    if (user) {
      console.log('💰 Текущий баланс:', user.coinBalance, 'коинов');
    } else {
      console.log('❌ Пользователь не найден');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkBalance();
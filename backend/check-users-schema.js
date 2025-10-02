const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkUsersSchema() {
  try {
    const [results] = await sequelize.query("PRAGMA table_info(Users);");
    
    console.log('📊 Users table schema:');
    console.table(results.map(r => ({ Name: r.name, Type: r.type })));
    
    // Get first user
    const [users] = await sequelize.query("SELECT * FROM Users LIMIT 1;");
    console.log('\n👤 First user:');
    console.log(users[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsersSchema();

const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkUsers() {
  try {
    const [users] = await sequelize.query("SELECT id, username, role FROM Users ORDER BY id LIMIT 5;");
    
    console.log('👥 Users in database:');
    console.table(users);
    
    const [admins] = await sequelize.query("SELECT id, username, role FROM Users WHERE role = 'admin' LIMIT 1;");
    
    if (admins.length > 0) {
      console.log(`\n✅ First admin user ID: ${admins[0].id} (${admins[0].username})`);
    } else {
      console.log('\n⚠️  No admin users found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();

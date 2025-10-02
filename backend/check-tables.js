const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkTables() {
  try {
    const [results] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    
    console.log('📊 Tables in database:');
    results.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name}`);
    });
    
    // Check if newsletters exists
    const newsletterExists = results.some(r => r.name === 'newsletters');
    console.log('\n✅ newsletters table exists:', newsletterExists);
    
    if (!newsletterExists) {
      console.log('\n⚠️  newsletters table does NOT exist!');
      console.log('Run init-db.js or init-tools-table.js first.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();

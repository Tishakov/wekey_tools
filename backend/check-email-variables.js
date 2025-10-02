const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkVariables() {
  try {
    const [variables] = await sequelize.query(`
      SELECT * FROM email_variables 
      ORDER BY category, key;
    `);
    
    console.log(`\n📊 Email Variables in Database: ${variables.length}\n`);
    
    const grouped = {};
    variables.forEach(v => {
      if (!grouped[v.category]) {
        grouped[v.category] = [];
      }
      grouped[v.category].push(v);
    });
    
    Object.entries(grouped).forEach(([category, vars]) => {
      console.log(`\n${category.toUpperCase()}: ${vars.length} variables`);
      vars.forEach(v => {
        console.log(`  {{${v.key}}} - ${v.description}`);
        console.log(`    Example: ${v.example}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVariables();

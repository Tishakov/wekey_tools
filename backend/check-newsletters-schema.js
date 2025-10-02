const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkNewslettersSchema() {
  try {
    const [results] = await sequelize.query(
      "PRAGMA table_info(newsletters);"
    );
    
    console.log('📊 newsletters table schema:');
    console.table(results.map(r => ({
      ID: r.cid,
      Name: r.name,
      Type: r.type,
      NotNull: r.notnull === 1 ? 'YES' : 'NO',
      Default: r.dflt_value || 'NULL'
    })));
    
    // Check for our new columns
    const hasType = results.some(r => r.name === 'type');
    const hasIsSystem = results.some(r => r.name === 'isSystem');
    
    console.log('\n✅ Column "type" exists:', hasType);
    console.log('✅ Column "isSystem" exists:', hasIsSystem);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNewslettersSchema();

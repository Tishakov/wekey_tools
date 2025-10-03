/**
 * Migration Runner
 * Runs migrations manually
 */

const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🚀 Starting migration...\n');
    
    const migration = require('./src/migrations/20251003_create_email_templates.js');
    
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

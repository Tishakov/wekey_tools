const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkSystemEmail() {
  try {
    const [newsletters] = await sequelize.query(`
      SELECT 
        id,
        title,
        subject,
        type,
        isSystem,
        status,
        createdAt
      FROM newsletters
      ORDER BY id DESC
      LIMIT 5;
    `);
    
    console.log('📊 Latest newsletters in database:\n');
    newsletters.forEach(n => {
      console.log(`ID: ${n.id}`);
      console.log(`Title: ${n.title}`);
      console.log(`Subject: ${n.subject}`);
      console.log(`Type: ${n.type}`);
      console.log(`Is System: ${n.isSystem ? '✅ YES' : '❌ NO'}`);
      console.log(`Status: ${n.status}`);
      console.log(`Created: ${n.createdAt}`);
      console.log('---');
    });
    
    const [systemEmails] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM newsletters 
      WHERE isSystem = 1;
    `);
    
    console.log(`\n✅ Total system emails: ${systemEmails[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSystemEmail();

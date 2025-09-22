const { Visitor } = require('./src/models');

async function checkUsers() {
  console.log('🔍 Checking all users with problematic data...');
  
  const users = await Visitor.findAll({
    order: [['sessionsCount', 'DESC']]
  });
  
  console.log('Total users:', users.length);
  
  for (const user of users) {
    const pagesViewed = JSON.parse(user.pagesViewed || '[]');
    const problematicPages = pagesViewed.filter(page => 
      page.includes('/ru/ru/') || page.includes('/en/en/') || page.includes('/uk/uk/')
    );
    
    if (problematicPages.length > 0) {
      console.log('🚨 USER:', user.userId);
      console.log('   Sessions:', user.sessionsCount);
      console.log('   Total pages:', pagesViewed.length);
      console.log('   Problematic pages:', problematicPages.length);
      console.log('   First problematic:', problematicPages[0]);
      console.log('   Last problematic:', problematicPages[problematicPages.length-1]);
      console.log('');
    }
  }
  
  process.exit(0);
}

checkUsers().catch(console.error);
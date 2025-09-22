const { Visitor, AnalyticsEvent } = require('./src/models');

async function finalSystemCheck() {
  console.log('🏥 Final System Health Check');
  console.log('==============================');
  
  // Check all visitors
  const visitors = await Visitor.findAll();
  console.log(`\n📊 Total visitors: ${visitors.length}`);
  
  let totalProblematicPages = 0;
  let totalProblematicUsers = 0;
  
  for (const visitor of visitors) {
    const pagesViewed = JSON.parse(visitor.pagesViewed || '[]');
    const problematicPages = pagesViewed.filter(page => 
      page.includes('/ru/ru/') || page.includes('/en/en/') || page.includes('/uk/uk/')
    );
    
    if (problematicPages.length > 0) {
      totalProblematicUsers++;
      totalProblematicPages += problematicPages.length;
      console.log(`❌ USER ${visitor.userId}: ${problematicPages.length} problematic pages`);
    } else {
      console.log(`✅ USER ${visitor.userId}: Clean (${pagesViewed.length} pages, ${visitor.sessionsCount} sessions)`);
    }
  }
  
  // Check recent analytics events
  const recentEvents = await AnalyticsEvent.findAll({
    order: [['createdAt', 'DESC']],
    limit: 5
  });
  
  console.log(`\n📈 Recent Analytics Events (last 5):`);
  for (const event of recentEvents) {
    const data = JSON.parse(event.data || '{}');
    const page = data.page || 'unknown';
    console.log(`- ${event.userId}: ${event.event} ${page} (${event.createdAt})`);
  }
  
  console.log(`\n🎯 SUMMARY:`);
  console.log(`✅ Total users: ${visitors.length}`);
  console.log(`❌ Problematic users: ${totalProblematicUsers}`);
  console.log(`❌ Total problematic pages: ${totalProblematicPages}`);
  console.log(`✅ Recent events: ${recentEvents.length}`);
  
  if (totalProblematicUsers === 0 && totalProblematicPages === 0) {
    console.log('\n🎉 SYSTEM IS CLEAN! No corrupted data found.');
  } else {
    console.log('\n⚠️  System still has issues!');
  }
  
  process.exit(0);
}

finalSystemCheck().catch(console.error);
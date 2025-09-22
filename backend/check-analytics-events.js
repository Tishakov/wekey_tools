const { AnalyticsEvent } = require('./src/models');

async function checkAnalyticsEvents() {
  console.log('🔍 Checking AnalyticsEvents for problematic data...');
  
  const events = await AnalyticsEvent.findAll({
    where: {
      userId: '48adc040-147d-46cd-a1c7-fd44897125bf'
    },
    order: [['createdAt', 'DESC']],
    limit: 10
  });
  
  console.log(`Found ${events.length} recent events for user 48adc040-147d-46cd-a1c7-fd44897125bf:`);
  
  for (const event of events) {
    const data = JSON.parse(event.data || '{}');
    const page = data.page || 'unknown';
    
    console.log(`- ${event.event}: ${page} (${event.createdAt})`);
    
    if (page.includes('/ru/ru/') || page.includes('/en/en/') || page.includes('/uk/uk/')) {
      console.log('  🚨 PROBLEMATIC EVENT');
    }
  }
  
  // Check total count of events for this user
  const totalCount = await AnalyticsEvent.count({
    where: { userId: '48adc040-147d-46cd-a1c7-fd44897125bf' }
  });
  
  console.log(`\nTotal events for this user: ${totalCount}`);
  
  process.exit(0);
}

checkAnalyticsEvents().catch(console.error);
const { Visitor, AnalyticsEvent } = require('./src/models');

async function completeUserCleanup() {
  const userId = '48adc040-147d-46cd-a1c7-fd44897125bf';
  
  console.log('🧹 COMPLETE CLEANUP for user:', userId);
  
  // Delete all analytics events for this user
  const deletedEvents = await AnalyticsEvent.destroy({ 
    where: { userId } 
  });
  console.log(`✅ Deleted ${deletedEvents} analytics events`);
  
  // Delete the visitor record
  const deletedVisitors = await Visitor.destroy({ 
    where: { userId } 
  });
  console.log(`✅ Deleted ${deletedVisitors} visitor records`);
  
  console.log('🎯 User completely removed from system');
  console.log('⚠️  Note: If frontend still has localStorage, it will recreate the user');
  console.log('🔗 Please clear browser localStorage to prevent recreation');
  
  process.exit(0);
}

completeUserCleanup().catch(console.error);
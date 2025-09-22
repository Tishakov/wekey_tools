const { Visitor } = require('./src/models');

async function resetProblematicUser() {
  const userId = '48adc040-147d-46cd-a1c7-fd44897125bf';
  
  console.log('🧹 Resetting corrupted user:', userId);
  
  // First, check current state
  const user = await Visitor.findOne({ where: { userId } });
  if (user) {
    const pagesViewed = JSON.parse(user.pagesViewed || '[]');
    const problematicPages = pagesViewed.filter(page => 
      page.includes('/ru/ru/') || page.includes('/en/en/') || page.includes('/uk/uk/')
    );
    
    console.log('Current state:');
    console.log('- Sessions:', user.sessionsCount);
    console.log('- Total pages:', pagesViewed.length);
    console.log('- Problematic pages:', problematicPages.length);
    
    // Delete the corrupted user
    await Visitor.destroy({ where: { userId } });
    console.log('✅ Deleted corrupted user');
    
    // Create a clean replacement
    await Visitor.create({
      userId: userId,
      firstVisit: new Date(),
      lastVisit: new Date(),
      sessionsCount: 1,
      pagesViewed: JSON.stringify(['/ru/']),
      hasUsedTools: false,
      toolsUsed: JSON.stringify([]),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      referrer: ''
    });
    console.log('✅ Created clean replacement user');
  } else {
    console.log('❌ User not found');
  }
  
  process.exit(0);
}

resetProblematicUser().catch(console.error);
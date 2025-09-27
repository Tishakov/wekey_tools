const { ToolUsage } = require('./src/config/database');

async function checkSeoAuditTools() {
  try {
    console.log('🔍 Проверяем использование SEO аудит инструментов...\n');
    
    // Проверяем использование seo-audit-pro
    const seoAuditPro = await ToolUsage.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usageCount']
      ],
      where: { toolName: 'seo-audit-pro' },
      raw: true
    });

    // Проверяем использование seoauditpro
    const seoauditpro = await ToolUsage.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usageCount']
      ],
      where: { toolName: 'seoauditpro' },
      raw: true
    });

    console.log('📊 РЕЗУЛЬТАТЫ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔧 seo-audit-pro: ${seoAuditPro[0]?.usageCount || 0} использований`);
    console.log(`🔧 seoauditpro: ${seoauditpro[0]?.usageCount || 0} использований`);

    // Проверим также просто seo-audit
    const seoAudit = await ToolUsage.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usageCount']
      ],
      where: { toolName: 'seo-audit' },
      raw: true
    });

    console.log(`🔧 seo-audit: ${seoAudit[0]?.usageCount || 0} использований`);

    // Получим примеры записей для каждого
    console.log('\n🔍 ПРИМЕРЫ ЗАПИСЕЙ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (parseInt(seoAuditPro[0]?.usageCount) > 0) {
      const examplePro = await ToolUsage.findOne({
        where: { toolName: 'seo-audit-pro' },
        order: [['createdAt', 'DESC']]
      });
      console.log(`📅 seo-audit-pro последний раз: ${examplePro?.createdAt}`);
    }

    if (parseInt(seoauditpro[0]?.usageCount) > 0) {
      const exampleAuditpro = await ToolUsage.findOne({
        where: { toolName: 'seoauditpro' },
        order: [['createdAt', 'DESC']]
      });
      console.log(`📅 seoauditpro последний раз: ${exampleAuditpro?.createdAt}`);
    }

    console.log('\n💡 РЕКОМЕНДАЦИЯ:');
    const proCount = parseInt(seoAuditPro[0]?.usageCount) || 0;
    const auditproCount = parseInt(seoauditpro[0]?.usageCount) || 0;
    
    if (proCount > auditproCount) {
      console.log('✅ Рекомендуется оставить: seo-audit-pro');
      console.log('❌ Удалить: seoauditpro');
    } else if (auditproCount > proCount) {
      console.log('✅ Рекомендуется оставить: seoauditpro');
      console.log('❌ Удалить: seo-audit-pro');
    } else {
      console.log('⚠️ Оба инструмента имеют одинаковое использование');
      console.log('💭 Нужно проверить, какой используется в текущем коде frontend');
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  } finally {
    process.exit(0);
  }
}

checkSeoAuditTools();
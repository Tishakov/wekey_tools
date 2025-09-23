const { Tool } = require('./src/models');

async function reorderTools() {
  try {
    console.log('🔄 Перестраиваем порядок инструментов...');
    
    // Получаем все инструменты, отсортированные по названию
    const tools = await Tool.findAll({
      order: [['name', 'ASC']]
    });
    
    // Присваиваем новые порядковые номера
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      await tool.update({ order: i + 1 });
      console.log(`${i + 1}. ${tool.name}`);
    }
    
    console.log('✅ Порядок инструментов обновлен!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

reorderTools();
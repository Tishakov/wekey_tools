const { CoinOperationReason } = require('./src/models');

async function addTestReasons() {
  try {
    console.log('🔄 Добавление тестовых причин операций...');

    // Причины для начисления коинов
    const addReasons = [
      { reason: 'Бонус за активность', type: 'add', sortOrder: 1 },
      { reason: 'Промо-акция', type: 'add', sortOrder: 2 },
      { reason: 'Компенсация за ошибку', type: 'add', sortOrder: 3 },
      { reason: 'Подарок от администрации', type: 'add', sortOrder: 4 },
      { reason: 'Участие в тестировании', type: 'add', sortOrder: 5 }
    ];

    // Причины для списания коинов
    const subtractReasons = [
      { reason: 'Нарушение правил', type: 'subtract', sortOrder: 1 },
      { reason: 'Спам или злоупотребление', type: 'subtract', sortOrder: 2 },
      { reason: 'Техническая корректировка', type: 'subtract', sortOrder: 3 },
      { reason: 'Возврат ошибочного начисления', type: 'subtract', sortOrder: 4 }
    ];

    // Универсальные причины
    const bothReasons = [
      { reason: 'Ручная корректировка баланса', type: 'both', sortOrder: 1 },
      { reason: 'Миграция данных', type: 'both', sortOrder: 2 }
    ];

    const allReasons = [...addReasons, ...subtractReasons, ...bothReasons];

    for (const reasonData of allReasons) {
      const [reason, created] = await CoinOperationReason.findOrCreate({
        where: { reason: reasonData.reason, type: reasonData.type },
        defaults: reasonData
      });
      
      if (created) {
        console.log(`✅ Добавлена причина: "${reasonData.reason}" (${reasonData.type})`);
      } else {
        console.log(`ℹ️  Причина уже существует: "${reasonData.reason}" (${reasonData.type})`);
      }
    }

    console.log('🎉 Готовые причины операций добавлены успешно!');
    console.log(`📊 Обработано причин: ${allReasons.length}`);
    
    // Показываем общую статистику
    const totalCount = await CoinOperationReason.count();
    const addCount = await CoinOperationReason.count({ where: { type: 'add' } });
    const subtractCount = await CoinOperationReason.count({ where: { type: 'subtract' } });
    const bothCount = await CoinOperationReason.count({ where: { type: 'both' } });
    
    console.log('📈 Статистика причин в базе:');
    console.log(`   - Всего: ${totalCount}`);
    console.log(`   - Для начисления: ${addCount}`);
    console.log(`   - Для списания: ${subtractCount}`);
    console.log(`   - Универсальные: ${bothCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении причин:', error);
  } finally {
    process.exit(0);
  }
}

addTestReasons();
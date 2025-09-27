const { sequelize, CoinTransaction, User } = require('../src/models');

async function initCoinTransactions() {
  try {
    console.log('🔄 Синхронизация таблицы CoinTransactions...');
    
    // Создаем таблицу если не существует
    await CoinTransaction.sync({ force: false });
    console.log('✅ Таблица CoinTransactions создана/проверена');
    
    // Проверяем количество записей
    const count = await CoinTransaction.count();
    console.log(`📊 Количество транзакций в базе: ${count}`);
    
    if (count === 0) {
      console.log('➕ Добавляем тестовые данные...');
      
      // Находим первого пользователя
      const user = await User.findOne();
      if (!user) {
        console.log('❌ Пользователи не найдены');
        return;
      }
      
      console.log(`👤 Найден пользователь: ${user.email} (ID: ${user.id})`);
      
      // Создаем тестовые транзакции
      const testTransactions = [
        {
          userId: user.id,
          type: 'registration_bonus',
          amount: 100,
          balanceBefore: 0,
          balanceAfter: 100,
          reason: 'Бонус за регистрацию',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 дней назад
        },
        {
          userId: user.id,
          type: 'TOOL_USAGE',
          amount: -1,
          balanceBefore: 100,
          balanceAfter: 99,
          reason: 'Использование инструмента "Генератор паролей"',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 дней назад
        },
        {
          userId: user.id,
          type: 'TOOL_USAGE',
          amount: -2,
          balanceBefore: 99,
          balanceAfter: 97,
          reason: 'Использование инструмента "SEO Аудит"',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 дня назад
        },
        {
          userId: user.id,
          type: 'ADMIN_ADJUSTMENT',
          amount: 50,
          balanceBefore: 97,
          balanceAfter: 147,
          reason: 'Бонус от администрации',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 день назад
        }
      ];
      
      for (const transaction of testTransactions) {
        await CoinTransaction.create(transaction);
        console.log(`✅ Создана транзакция: ${transaction.type} (${transaction.amount})`);
      }
      
      // Обновляем баланс пользователя
      await user.update({ coinBalance: 147 });
      console.log('✅ Баланс пользователя обновлен: 147 монет');
    }
    
    console.log('✅ Инициализация завершена');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  } finally {
    await sequelize.close();
  }
}

initCoinTransactions();
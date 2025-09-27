// Импортируем модели через database.js который инициализирует все модели
const database = require('./src/config/database');
const { User, CoinTransaction } = database;

async function addCoinsToUser() {
    try {
        // Подключаемся к базе данных
        await database.sequelize.authenticate();
        console.log('✅ Connected to database');

        const userEmail = 'bohdan.tishakov@gmail.com';
        const coinsToAdd = 100;
        const reason = 'Manual bonus from admin';

        // Находим пользователя
        const user = await User.findOne({ where: { email: userEmail } });
        
        if (!user) {
            console.error(`❌ User with email ${userEmail} not found`);
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name || user.displayName || 'No name'} (${user.email})`);
        console.log(`💰 Current balance: ${user.coinBalance} coins`);

        // Создаем транзакцию в базе данных
        await database.sequelize.transaction(async (t) => {
            const balanceBefore = user.coinBalance;
            
            // Обновляем баланс пользователя
            await user.increment('coinBalance', { 
                by: coinsToAdd, 
                transaction: t 
            });

            // Получаем новый баланс
            await user.reload({ transaction: t });
            const balanceAfter = user.coinBalance;

            // Создаем запись о транзакции
            await CoinTransaction.create({
                userId: user.id,
                toolId: 'admin-bonus',
                amount: coinsToAdd,
                type: 'admin_add',
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                description: reason,
                metadata: {
                    admin_action: true,
                    timestamp: new Date().toISOString()
                }
            }, { transaction: t });

            console.log(`🎉 Successfully added ${coinsToAdd} coins to ${userEmail}`);
        });

        // Получаем обновленные данные пользователя
        await user.reload();
        console.log(`💎 New balance: ${user.coinBalance} coins`);
        console.log(`➕ Added: +${coinsToAdd} coins`);

    } catch (error) {
        console.error('❌ Error adding coins:', error);
    } finally {
        await database.sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Запускаем скрипт
addCoinsToUser();
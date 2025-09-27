const { sequelize } = require('./src/models');

async function addCoinCostColumn() {
    try {
        console.log('Добавляем колонку coin_cost в таблицу tools...');
        
        await sequelize.query(`
            ALTER TABLE tools 
            ADD COLUMN coin_cost INTEGER DEFAULT 1 NOT NULL
        `);
        
        console.log('✅ Колонка coin_cost успешно добавлена');
        console.log('По умолчанию все инструменты стоят 1 коин');
        
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️ Колонка coin_cost уже существует');
        } else {
            console.error('❌ Ошибка при добавлении колонки:', error);
            throw error;
        }
    } finally {
        await sequelize.close();
    }
}

addCoinCostColumn().catch(console.error);
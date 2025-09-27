const fs = require('fs');
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const PAGES_PATH = path.join(FRONTEND_PATH, 'src', 'pages');

console.log('🔄 Finalizing coin integration in all tools...');

// Получаем список всех файлов инструментов
const toolFiles = fs.readdirSync(PAGES_PATH)
    .filter(file => file.endsWith('Tool.tsx') && file !== 'PasswordGeneratorTool.tsx')
    .map(file => path.join(PAGES_PATH, file));

console.log(`📁 Found ${toolFiles.length} tools to finalize`);

let updatedCount = 0;

toolFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Пропускаем уже правильно интегрированные файлы
    if (content.includes('await executeWithCoins(async () => {')) {
        console.log(`✅ ${fileName} - already properly integrated`);
        return;
    }
    
    // Ищем функции handleShowResult с проверкой авторизации
    const handleShowResultMatch = content.match(/(const handleShowResult = async \(\) => {[\s\S]*?requireAuth\(\)[\s\S]*?return;[\s\S]*?}[\s\S]*?)(calculateStats\(\)|[^}]*statsService\.incrementAndGetCount[\s\S]*?});/);
    
    if (handleShowResultMatch) {
        const beforeStats = handleShowResultMatch[1];
        const statsCall = handleShowResultMatch[2];
        
        // Создаем новую версию с executeWithCoins
        let newFunction;
        if (statsCall.includes('calculateStats()')) {
            // Для инструментов с функцией calculateStats
            newFunction = beforeStats + `
        // Выполняем операцию с тратой коинов
        await executeWithCoins(async () => {
            await calculateStats();
        }, {
            inputLength: inputText.length
        });
    };`;
        } else {
            // Для других инструментов - извлекаем логику после проверки авторизации
            const logicMatch = content.match(/requireAuth\(\)[\s\S]*?return;[\s\S]*?}([\s\S]*?)};/);
            if (logicMatch) {
                const toolLogic = logicMatch[1].trim();
                newFunction = beforeStats + `
        // Выполняем операцию с тратой коинов
        await executeWithCoins(async () => {
            ${toolLogic}
        }, {
            inputLength: inputText ? inputText.length : 0
        });
    };`;
            }
        }
        
        if (newFunction) {
            const newContent = content.replace(handleShowResultMatch[0], newFunction);
            
            // Создаем бэкап
            fs.writeFileSync(filePath + '.backup2', content);
            
            // Записываем обновленный файл
            fs.writeFileSync(filePath, newContent);
            
            console.log(`🔧 Updated ${fileName}`);
            updatedCount++;
        } else {
            console.log(`⚠️  ${fileName} - could not extract logic`);
        }
    } else {
        console.log(`⚠️  ${fileName} - no handleShowResult function found`);
    }
});

console.log(`\n🎉 Finalization completed!`);
console.log(`   📄 Files updated: ${updatedCount}`);
console.log(`   📋 Backups created with .backup2 extension`);
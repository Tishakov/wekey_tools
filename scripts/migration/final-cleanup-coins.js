const fs = require('fs');
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const PAGES_PATH = path.join(FRONTEND_PATH, 'src', 'pages');

console.log('🔄 Final cleanup - updating remaining tools with different function names...');

// Инструменты с особыми функциями
const specialTools = [
    { file: 'TextGeneratorTool.tsx', function: 'handleGenerateText' },
    { file: 'SynonymGeneratorTool.tsx', function: 'handleGenerateSynonyms' },
    { file: 'TextOptimizerTool.tsx', function: 'handleOptimizeText' },
    { file: 'PrivacyPolicyGeneratorTool.tsx', function: 'handleGeneratePolicy' },
    { file: 'QRGeneratorTool.tsx', function: 'handleGenerateQR' },
    { file: 'SEOAuditProTool.tsx', function: 'handleAnalyze' },
    { file: 'AnalyticsTool.tsx', function: 'handleAnalyze' },
    { file: 'EmojiTool.tsx', function: 'handleProcess' },
    { file: 'EmptyLinesRemovalTool.tsx', function: 'handleRemoveEmptyLines' },
    { file: 'DuplicateRemovalTool.tsx', function: 'handleRemoveDuplicates' },
    { file: 'TextToHtmlTool.tsx', function: 'handleConvert' },
    { file: 'SpacesToParagraphsTool.tsx', function: 'handleConvert' },
    { file: 'TextSortingTool.tsx', function: 'handleSort' },
    { file: 'WordInflectionTool.tsx', function: 'handleInflect' }
];

let updatedCount = 0;

specialTools.forEach(({ file, function: functionName }) => {
    const filePath = path.join(PAGES_PATH, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${file} - file not found`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Пропускаем уже обновленные файлы
    if (content.includes('await executeWithCoins(async () => {')) {
        console.log(`✅ ${file} - already updated`);
        return;
    }
    
    // Ищем функцию с проверкой авторизации
    const functionRegex = new RegExp(`(const ${functionName} = async \\(\\) => {[\\s\\S]*?requireAuth\\(\\)[\\s\\S]*?return;[\\s\\S]*?}[\\s\\S]*?)([\\s\\S]*?)(};)`, 'm');
    const match = content.match(functionRegex);
    
    if (match) {
        const beforeLogic = match[1];
        const toolLogic = match[2].trim();
        const endBrace = match[3];
        
        // Удаляем statsService.incrementAndGetCount из логики, если есть
        const cleanLogic = toolLogic.replace(/\/\/ Увеличиваем счетчик запусков[\s\S]*?setLaunchCount\(prev => prev \+ 1\);\s*}\s*/g, '');
        
        const newFunction = beforeLogic + `
        // Выполняем операцию с тратой коинов
        await executeWithCoins(async () => {
            ${cleanLogic}
            
            // Увеличиваем счетчик запусков
            const newCount = await statsService.incrementAndGetCount(TOOL_ID);
            setLaunchCount(newCount);
        }, {
            inputLength: inputText ? inputText.length : 0
        });
    ` + endBrace;
        
        const newContent = content.replace(match[0], newFunction);
        
        // Создаем бэкап
        fs.writeFileSync(filePath + '.backup3', content);
        
        // Записываем обновленный файл
        fs.writeFileSync(filePath, newContent);
        
        console.log(`🔧 Updated ${file}`);
        updatedCount++;
    } else {
        console.log(`⚠️  ${file} - could not find ${functionName} function`);
    }
});

console.log(`\n🎉 Final cleanup completed!`);
console.log(`   📄 Files updated: ${updatedCount}`);
console.log(`   📋 Backups created with .backup3 extension`);
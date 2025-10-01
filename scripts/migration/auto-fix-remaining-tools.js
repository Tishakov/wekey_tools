const fs = require('fs');
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const PAGES_PATH = path.join(FRONTEND_PATH, 'src', 'pages');

console.log('🚀 Auto-fixing remaining tools with coin integration...');

// Инструменты которые нужно исправить с их основными функциями
const toolsToFix = [
    { file: 'QRGeneratorTool.tsx', mainFunction: 'handleGenerateQR' },
    { file: 'SEOAuditProTool.tsx', mainFunction: 'handleAnalyze' },
    { file: 'AnalyticsTool.tsx', mainFunction: 'handleAnalyze' },
    { file: 'EmptyLinesRemovalTool.tsx', mainFunction: 'handleRemoveEmptyLines' },
    { file: 'DuplicateRemovalTool.tsx', mainFunction: 'handleRemoveDuplicates' },
    { file: 'TextToHtmlTool.tsx', mainFunction: 'handleConvert' },
    { file: 'SpacesToParagraphsTool.tsx', mainFunction: 'handleConvert' },
    { file: 'TextSortingTool.tsx', mainFunction: 'handleSort' },
    { file: 'WordInflectionTool.tsx', mainFunction: 'handleInflect' },
    { file: 'EmojiTool.tsx', mainFunction: 'handleProcess' },
    { file: 'TextOptimizerTool.tsx', mainFunction: 'handleOptimize' },
    { file: 'PrivacyPolicyGeneratorTool.tsx', mainFunction: 'handleGenerate' }
];

let fixedCount = 0;

toolsToFix.forEach(({ file, mainFunction }) => {
    const filePath = path.join(PAGES_PATH, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${file} - file not found`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли уже интеграция
    if (content.includes('executeWithCoins')) {
        console.log(`✅ ${file} - already integrated`);
        return;
    }
    
    // Добавляем импорт если его нет
    if (!content.includes("import { useToolWithCoins }")) {
        content = content.replace(
            /import { useAuthRequired } from '\.\.\/hooks\/useAuthRequired';/,
            `import { useAuthRequired } from '../hooks/useAuthRequired';\nimport { useToolWithCoins } from '../hooks/useToolWithCoins';`
        );
    }
    
    // Добавляем хук если его нет
    if (!content.includes("executeWithCoins") && content.includes("} = useAuthRequired();")) {
        content = content.replace(
            /(\s*} = useAuthRequired\(\);)/,
            `$1\n    const { executeWithCoins } = useToolWithCoins(TOOL_ID);`
        );
    }
    
    // Ищем основную функцию и пытаемся обернуть её логику
    const patterns = [
        mainFunction,
        'handleShowResult',
        'handleProcess',
        'handleGenerate',
        'handleConvert',
        'handleAnalyze'
    ];
    
    let functionFound = false;
    
    for (const pattern of patterns) {
        const functionRegex = new RegExp(`(const ${pattern} = async \\(\\) => {[\\s\\S]*?requireAuth\\(\\)[\\s\\S]*?return;[\\s\\S]*?}[\\s\\S]*?)([\\s\\S]*?)(\\s*};)`, 'm');
        const match = content.match(functionRegex);
        
        if (match) {
            const beforeLogic = match[1];
            const toolLogic = match[2].trim();
            const endBrace = match[3];
            
            // Удаляем существующие вызовы statsService из логики
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
            
            content = content.replace(match[0], newFunction);
            functionFound = true;
            break;
        }
    }
    
    if (functionFound) {
        // Создаем бэкап
        fs.writeFileSync(filePath + '.backup_auto', fs.readFileSync(filePath, 'utf8'));
        
        // Записываем обновленный файл
        fs.writeFileSync(filePath, content);
        
        console.log(`🔧 Fixed ${file} with ${mainFunction}`);
        fixedCount++;
    } else {
        console.log(`⚠️  ${file} - could not find main function`);
    }
});

console.log(`\n🎉 Auto-fix completed!`);
console.log(`   📄 Files fixed: ${fixedCount}`);
console.log(`   📋 Backups created with .backup_auto extension`);
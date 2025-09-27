const fs = require('fs');
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const PAGES_PATH = path.join(FRONTEND_PATH, 'src', 'pages');

console.log('🔧 Adding missing imports and hooks...');

// Файлы которым нужны импорты и хуки
const filesToFix = [
    'WordMixerTool.tsx',
    'DuplicateFinderTool.tsx', 
    'WordGluingTool.tsx',
    'UtmGeneratorTool.tsx'
];

filesToFix.forEach(fileName => {
    const filePath = path.join(PAGES_PATH, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${fileName} - file not found`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем есть ли уже импорт
    if (content.includes("import { useToolWithCoins }")) {
        console.log(`✅ ${fileName} - import already exists`);
    } else {
        // Добавляем импорт после useAuthRequired
        content = content.replace(
            /import { useAuthRequired } from '\.\.\/hooks\/useAuthRequired';/,
            `import { useAuthRequired } from '../hooks/useAuthRequired';\nimport { useToolWithCoins } from '../hooks/useToolWithCoins';`
        );
        console.log(`📦 ${fileName} - added import`);
    }
    
    // Проверяем есть ли уже хук
    if (content.includes("executeWithCoins") && content.includes("useToolWithCoins(TOOL_ID)")) {
        console.log(`✅ ${fileName} - hook already initialized`);
    } else if (content.includes("} = useAuthRequired();")) {
        // Добавляем хук после useAuthRequired
        content = content.replace(
            /(\s*} = useAuthRequired\(\);)/,
            `$1\n    const { executeWithCoins } = useToolWithCoins(TOOL_ID);`
        );
        console.log(`🔗 ${fileName} - added hook initialization`);
    }
    
    // Сохраняем файл
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${fileName} - updated successfully`);
});

console.log('\n🎉 Import and hook addition completed!');
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для массовой интеграции системы коинов со всеми инструментами
 */

// Путь к папке с инструментами
const TOOLS_DIR = path.join(__dirname, 'frontend', 'src', 'pages');

// Паттерны для поиска и замены
const PATTERNS = {
  // Импорт нового хука
  importHook: {
    search: /import { useAuthRequired } from '\.\.\/hooks\/useAuthRequired';/,
    replace: `import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';`
  },

  // Добавление хука в компонент
  addHook: {
    search: /const { createLink } = useLocalizedLink\(\);/,
    replace: `const { createLink } = useLocalizedLink();
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);`
  },

  // Замена логики выполнения инструмента (вариант 1 - с async function)
  replaceExecution1: {
    search: /const (handle\w+) = async \(\) => \{[\s\S]*?if \(!requireAuth\(\)\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?try \{[\s\S]*?const newCount = await statsService\.incrementAndGetCount\(TOOL_ID.*?\);[\s\S]*?setLaunchCount\(newCount\);[\s\S]*?\} catch \(error\) \{[\s\S]*?console\.error\('Failed to update stats:', error\);[\s\S]*?setLaunchCount\(prev => prev \+ 1\);[\s\S]*?\}/,
    replace: `const $1 = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return;
        }

        const result = await executeWithCoins(async () => {
            // Основная логика инструмента перенесена в executeWithCoins
        });

        if (!result.success) {
            alert(result.error || 'Ошибка при выполнении инструмента');
            return;
        }

        if (result.newLaunchCount !== undefined) {
            setLaunchCount(result.newLaunchCount);
        }`
  }
};

/**
 * Получить список всех файлов инструментов
 */
function getToolFiles() {
  const files = fs.readdirSync(TOOLS_DIR);
  return files
    .filter(file => file.endsWith('Tool.tsx'))
    .map(file => path.join(TOOLS_DIR, file));
}

/**
 * Проанализировать файл инструмента
 */
function analyzeToolFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasAuthRequired = content.includes('useAuthRequired');
  const hasStatsService = content.includes('statsService.incrementAndGetCount');
  const hasRequireAuth = content.includes('if (!requireAuth())');
  const hasToolWithCoins = content.includes('useToolWithCoins');
  
  return {
    fileName,
    filePath,
    hasAuthRequired,
    hasStatsService,
    hasRequireAuth,
    hasToolWithCoins,
    needsUpdate: hasAuthRequired && hasStatsService && hasRequireAuth && !hasToolWithCoins,
    content
  };
}

/**
 * Создать backup файла
 */
function createBackup(filePath) {
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  console.log(`📋 Backup created: ${path.basename(backupPath)}`);
}

/**
 * Обновить файл инструмента
 */
function updateToolFile(analysis) {
  const { filePath, content, fileName } = analysis;
  
  console.log(`\n🔧 Updating ${fileName}...`);
  
  // Создаем backup
  createBackup(filePath);
  
  let updatedContent = content;
  let changes = 0;
  
  // 1. Добавляем импорт хука
  if (!updatedContent.includes('useToolWithCoins')) {
    updatedContent = updatedContent.replace(
      PATTERNS.importHook.search,
      PATTERNS.importHook.replace
    );
    changes++;
    console.log('   ✅ Added useToolWithCoins import');
  }
  
  // 2. Добавляем хук в компонент
  if (!updatedContent.includes('executeWithCoins')) {
    updatedContent = updatedContent.replace(
      PATTERNS.addHook.search,
      PATTERNS.addHook.replace
    );
    changes++;
    console.log('   ✅ Added executeWithCoins hook');
  }
  
  // Сохраняем файл
  if (changes > 0) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`   ✅ Updated ${fileName} (${changes} changes)`);
  } else {
    console.log(`   ⚠️  No changes needed for ${fileName}`);
  }
  
  return changes;
}

/**
 * Главная функция
 */
function main() {
  console.log('🚀 Starting mass coin system integration...\n');
  
  const toolFiles = getToolFiles();
  console.log(`📁 Found ${toolFiles.length} tool files\n`);
  
  const analyses = toolFiles.map(analyzeToolFile);
  
  // Показываем статистику
  const needsUpdate = analyses.filter(a => a.needsUpdate);
  const alreadyUpdated = analyses.filter(a => a.hasToolWithCoins);
  const notReady = analyses.filter(a => !a.hasAuthRequired || !a.hasStatsService);
  
  console.log('📊 Analysis Results:');
  console.log(`   ✅ Ready for update: ${needsUpdate.length}`);
  console.log(`   🔄 Already updated: ${alreadyUpdated.length}`);
  console.log(`   ❌ Not compatible: ${notReady.length}\n`);
  
  if (needsUpdate.length === 0) {
    console.log('🎉 All tools are already up to date!');
    return;
  }
  
  console.log('📝 Tools ready for update:');
  needsUpdate.forEach(analysis => {
    console.log(`   - ${analysis.fileName}`);
  });
  
  console.log('\n🔧 Starting updates...');
  
  let totalChanges = 0;
  needsUpdate.forEach(analysis => {
    const changes = updateToolFile(analysis);
    totalChanges += changes;
  });
  
  console.log(`\n🎉 Mass integration completed!`);
  console.log(`   📄 Files updated: ${needsUpdate.length}`);
  console.log(`   🔧 Total changes: ${totalChanges}`);
  console.log(`\n⚠️  Note: Manual review required for tool execution logic`);
  console.log(`   You need to move the actual tool logic inside executeWithCoins callback`);
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = { analyzeToolFile, updateToolFile };
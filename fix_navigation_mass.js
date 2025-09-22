const fs = require('fs');
const path = require('path');

// Список файлов для исправления
const filesToFix = [
  'frontend/src/pages/FindReplaceTool.tsx',
  'frontend/src/pages/TransliterationTool.tsx', 
  'frontend/src/pages/EmptyLinesRemovalTool.tsx',
  'frontend/src/pages/AddSymbolTool.tsx',
  'frontend/src/pages/WordMixerTool.tsx',
  'frontend/src/pages/WordGluingTool.tsx',
  'frontend/src/pages/TextToHtmlTool.tsx',
  'frontend/src/pages/TextSortingTool.tsx',
  'frontend/src/pages/TextOptimizerTool.tsx',
  'frontend/src/pages/TextByColumnsTool.tsx',
  'frontend/src/pages/TextGeneratorTool.tsx',
  'frontend/src/pages/SpacesToParagraphsTool.tsx',
  'frontend/src/pages/RemoveLineBreaksTool.tsx',
  'frontend/src/pages/PasswordGeneratorTool.tsx',
  'frontend/src/pages/MinusWordsTool.tsx',
  'frontend/src/pages/MatchTypesTool.tsx',
  'frontend/src/pages/EmojiTool.tsx',
  'frontend/src/pages/DuplicateRemovalTool.tsx',
  'frontend/src/pages/CharCounterTool.tsx',
  'frontend/src/pages/AnalyticsTool.tsx'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Добавить импорт useLocalizedLink если его нет
    const hasLocalizedLinkImport = content.includes('useLocalizedLink');
    if (!hasLocalizedLinkImport) {
      // Найти строку с импортом useTranslation
      const translationImportMatch = content.match(/import\s+{\s*([^}]*useTranslation[^}]*)\s*}\s+from\s+['"]react-i18next['"];?/);
      if (translationImportMatch) {
        const translationImportLine = translationImportMatch[0];
        const newImportLine = translationImportLine + '\nimport { useLocalizedLink } from \'../hooks/useLanguageFromUrl\';';
        content = content.replace(translationImportLine, newImportLine);
      }
    }
    
    // 2. Добавить createLink если его нет в компоненте
    const hasCreateLink = content.includes('createLink');
    if (!hasCreateLink) {
      // Найти строку с const { t } = useTranslation();
      const useTranslationMatch = content.match(/const\s+{\s*t\s*}\s*=\s*useTranslation\(\);?/);
      if (useTranslationMatch) {
        const useTranslationLine = useTranslationMatch[0];
        const newUseLine = useTranslationLine + '\n  const { createLink } = useLocalizedLink();';
        content = content.replace(useTranslationLine, newUseLine);
      }
    }
    
    // 3. Заменить to="/" на to={createLink('')}
    content = content.replace(/to=["']\/["']/g, 'to={createLink(\'\')}');
    
    // Записать обновленный файл
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Исправлен: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка при исправлении ${filePath}:`, error.message);
  }
}

// Исправить все файлы
console.log('🔧 Массовое исправление навигационных ссылок...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.log(`⚠️ Файл не найден: ${fullPath}`);
  }
});

console.log('\n✅ Массовое исправление завершено!');
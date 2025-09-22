const fs = require('fs');
const path = require('path');

// Список всех файлов инструментов, которые нужно исправить
const toolFiles = [
  'EmojiTool.tsx',
  'EmptyLinesRemovalTool.tsx',
  'FindReplaceTool.tsx',
  'MatchTypesTool.tsx',
  'MinusWordsTool.tsx',
  'NumberGeneratorTool.tsx',
  'RemoveLineBreaksTool.tsx',
  'SpacesToParagraphsTool.tsx',
  'TextByColumnsTool.tsx',
  'TextGeneratorTool.tsx',
  'TextOptimizerTool.tsx',
  'TextSortingTool.tsx',
  'TextToHtmlTool.tsx',
  'TransliterationTool.tsx',
  'UtmGeneratorTool.tsx',
  'WordGluingTool.tsx',
  'WordMixerTool.tsx'
];

// Модальные окна для добавления
const modalWindowsCode = `
      {/* Модальные окна для авторизации */}
      <AuthRequiredModal
        isOpen={isAuthRequiredModalOpen}
        onClose={closeAuthRequiredModal}
        onLoginClick={openAuthModal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode="login"
      />`;

// Функция для обработки каждого файла
function addModalWindows(fileName) {
  const filePath = path.join('frontend/src/pages', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Файл не найден: ${fileName}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ищем последний закрывающий div перед закрывающим тегом компонента
  // Паттерн: последний </div> перед финальным );
  const pattern = /(\s+<\/div>\s*<\/div>\s*)\s*(\)\s*;\s*)\s*$/;
  
  if (pattern.test(content)) {
    // Добавляем модальные окна перед финальными закрывающими тегами
    content = content.replace(pattern, `$1${modalWindowsCode}
    </div>
$2`);
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Модальные окна добавлены в ${fileName}`);
    return true;
  } else {
    console.log(`⚠️  Не найден подходящий паттерн в ${fileName}`);
    return false;
  }
}

// Обрабатываем все файлы
console.log('🚀 Начинаем добавление модальных окон...\n');

let successCount = 0;
let failCount = 0;

toolFiles.forEach(fileName => {
  if (addModalWindows(fileName)) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\n📊 Результат:`);
console.log(`✅ Успешно обработано: ${successCount} файлов`);
console.log(`❌ Ошибок: ${failCount} файлов`);

if (failCount > 0) {
  console.log('\n🔧 Файлы с ошибками требуют ручной обработки');
}
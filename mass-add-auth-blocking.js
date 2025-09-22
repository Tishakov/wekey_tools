#!/usr/bin/env node

/**
 * Скрипт для массового добавления блокировки авторизации в инструменты
 * Добавляет необходимые импорты, хук и модальные окна
 */

const fs = require('fs');
const path = require('path');

// Список инструментов для обработки
const toolsToUpdate = [
    'CaseChangerTool.tsx',
    'TextSortingTool.tsx', 
    'TextOptimizerTool.tsx',
    'FindReplaceTool.tsx',
    'NumberGeneratorTool.tsx',
    'TextGeneratorTool.tsx',
    'SynonymGeneratorTool.tsx',
    'RemoveLineBreaksTool.tsx',
    'EmptyLinesRemovalTool.tsx',
    'SpacesToParagraphsTool.tsx',
    'EmojiTool.tsx',
    'TransliterationTool.tsx',
    'TextToHtmlTool.tsx',
    'WordGluingTool.tsx',
    'WordMixerTool.tsx',
    'WordInflectionTool.tsx',
    'UtmGeneratorTool.tsx',
    'TextByColumnsTool.tsx',
    'AddSymbolTool.tsx',
    'MatchTypesTool.tsx',
    'MinusWordsTool.tsx'
];

const pagesDir = path.join(__dirname, 'frontend', 'src', 'pages');

// Импорты для добавления
const importsToAdd = `
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';`.trim();

// Хук для добавления в компонент
const hookToAdd = `
    // Auth Required Hook
    const {
        isAuthRequiredModalOpen,
        isAuthModalOpen,
        requireAuth,
        closeAuthRequiredModal,
        closeAuthModal,
        openAuthModal
    } = useAuthRequired();
`.trim();

// Модальные окна для добавления в конец
const modalsToAdd = `
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
            />`.trim();

function updateToolFile(filePath) {
    console.log(`\n🔧 Обрабатываю файл: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ Файл не найден: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Добавляем импорты
    if (!content.includes('useAuthRequired')) {
        const importIndex = content.lastIndexOf("import './");
        if (importIndex !== -1) {
            const beforeImport = content.substring(0, importIndex);
            const afterImport = content.substring(importIndex);
            content = beforeImport + importsToAdd + '\n' + afterImport;
            console.log('✅ Добавлены импорты');
        }
    } else {
        console.log('⚠️ Импорты уже есть');
    }
    
    // 2. Добавляем хук
    if (!content.includes('useAuthRequired()')) {
        // Ищем первый useState или начало компонента
        const componentMatch = content.match(/const \w+Tool: React\.FC = \(\) => \{[\s\S]*?const \{ [^}]+ \} = [^;]+;/);
        if (componentMatch) {
            const hookPosition = componentMatch.index + componentMatch[0].length;
            content = content.substring(0, hookPosition) + '\n\n' + hookToAdd + content.substring(hookPosition);
            console.log('✅ Добавлен хук');
        }
    } else {
        console.log('⚠️ Хук уже есть');
    }
    
    // 3. Добавляем модальные окна в конец
    if (!content.includes('AuthRequiredModal')) {
        const lastDiv = content.lastIndexOf('        </div>\n    );');
        if (lastDiv !== -1) {
            content = content.substring(0, lastDiv) + modalsToAdd + '\n        </div>\n    );' + content.substring(lastDiv + 15);
            console.log('✅ Добавлены модальные окна');
        }
    } else {
        console.log('⚠️ Модальные окна уже есть');
    }
    
    // Записываем обновленный файл
    fs.writeFileSync(filePath, content);
    console.log(`✅ Файл ${path.basename(filePath)} обновлен`);
    return true;
}

// Основная функция
function main() {
    console.log('🚀 Начинаю массовое добавление блокировки авторизации...\n');
    
    let successCount = 0;
    let totalCount = toolsToUpdate.length;
    
    toolsToUpdate.forEach(toolFile => {
        const filePath = path.join(pagesDir, toolFile);
        if (updateToolFile(filePath)) {
            successCount++;
        }
    });
    
    console.log(`\n📊 Результат: ${successCount}/${totalCount} файлов обновлено`);
    console.log('🎉 Готово! Теперь нужно обновить функции обработки в каждом инструменте.');
}

if (require.main === module) {
    main();
}

module.exports = { updateToolFile };
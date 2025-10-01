#!/usr/bin/env node

/**
 * Скрипт для добавления проверки авторизации в функции обработки инструментов
 * Находит главные функции (handle*, process*, generate*) и добавляет requireAuth
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend', 'src', 'pages');

// Список файлов для обработки (те же, что были обновлены ранее)
const toolFiles = [
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

// Паттерны функций, которые нужно защитить
const functionPatterns = [
    /const (handle\w+) = (\([^)]*\))? ?=> ?\{/g,
    /const (process\w+) = (\([^)]*\))? ?=> ?\{/g,
    /const (generate\w+) = (\([^)]*\))? ?=> ?\{/g,
    /const (show\w+) = (\([^)]*\))? ?=> ?\{/g,
    /const (execute\w+) = (\([^)]*\))? ?=> ?\{/g
];

// Код для вставки в начало функции
const authCheckCode = `        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        // Увеличиваем счетчик запусков
        try {
            const newCount = await statsService.incrementAndGetCount(TOOL_ID);
            setLaunchCount(newCount);
        } catch (error) {
            console.error('Failed to update stats:', error);
            setLaunchCount(prev => prev + 1);
        }

`;

function findMainFunction(content) {
    // Ищем наиболее вероятную главную функцию
    const commonNames = [
        'handleShowResult', 'handleShow', 'handleGenerate', 'handleProcess',
        'handleExecute', 'handleConvert', 'handleTransform', 'handleApply'
    ];
    
    for (const name of commonNames) {
        if (content.includes(`const ${name} =`)) {
            return name;
        }
    }
    
    // Если не нашли стандартные, ищем любые handle* функции
    const handleMatch = content.match(/const (handle\w+) = /);
    if (handleMatch) {
        return handleMatch[1];
    }
    
    return null;
}

function addAuthToFunction(content, functionName) {
    // Ищем начало функции
    const funcPattern = new RegExp(`const ${functionName} = (async )?\\([^)]*\\) ?=> ?\\{`);
    const match = content.match(funcPattern);
    
    if (!match) {
        console.log(`❌ Не удалось найти функцию ${functionName}`);
        return content;
    }
    
    // Находим позицию после открывающей скобки
    const funcStart = match.index + match[0].length;
    
    // Проверяем, не добавлена ли уже проверка авторизации
    const afterFunc = content.substring(funcStart, funcStart + 500);
    if (afterFunc.includes('requireAuth()')) {
        console.log(`⚠️ Проверка авторизации уже есть в ${functionName}`);
        return content;
    }
    
    // Если функция не async, делаем её async
    let updatedContent = content;
    if (!match[1]) { // если нет async
        updatedContent = content.replace(
            `const ${functionName} = (`,
            `const ${functionName} = async (`
        );
    }
    
    // Находим новую позицию после обновления
    const newMatch = updatedContent.match(funcPattern);
    const newFuncStart = newMatch.index + newMatch[0].length;
    
    // Вставляем код проверки авторизации
    updatedContent = 
        updatedContent.substring(0, newFuncStart) + 
        '\n' + authCheckCode + 
        updatedContent.substring(newFuncStart);
    
    console.log(`✅ Добавлена проверка авторизации в ${functionName}`);
    return updatedContent;
}

function processToolFile(filePath) {
    console.log(`\n🔧 Обрабатываю: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ Файл не найден: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Находим главную функцию
    const mainFunction = findMainFunction(content);
    if (!mainFunction) {
        console.log(`⚠️ Главная функция не найдена в ${path.basename(filePath)}`);
        return false;
    }
    
    console.log(`🎯 Найдена главная функция: ${mainFunction}`);
    
    // Добавляем проверку авторизации
    const updatedContent = addAuthToFunction(content, mainFunction);
    
    if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ Файл ${path.basename(filePath)} обновлен`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('🚀 Добавление проверки авторизации в функции обработки...\n');
    
    let successCount = 0;
    
    toolFiles.forEach(toolFile => {
        const filePath = path.join(pagesDir, toolFile);
        if (processToolFile(filePath)) {
            successCount++;
        }
    });
    
    console.log(`\n📊 Результат: ${successCount}/${toolFiles.length} файлов обновлено`);
    console.log('🎉 Массовое добавление блокировки авторизации завершено!');
}

if (require.main === module) {
    main();
}
// Тест функций инструмента "Пробелы на абзацы"
const testText = "Привет, мир! Как дела? Отлично. А у тебя? Тоже хорошо. Это тест пробелов на абзацы.";

console.log('Исходный текст:');
console.log(JSON.stringify(testText));
console.log('Визуально:');
console.log(testText);
console.log('\n=== ТЕСТЫ ОБРАБОТКИ ===\n');

// Функция 1: removePunctuation (удаление знаков препинания)
function removePunctuation(text) {
    return text.replace(/[.!?,:;()[\]{}""''«»\-—–]/g, '');
}

console.log('1. Удалить все знаки препинания:');
console.log(JSON.stringify(removePunctuation(testText)));

// Функция 2: removeSpecialChars (удаление спецсимволов)
function removeSpecialChars(text) {
    return text.replace(/[^\w\s\u0400-\u04FF]/g, '');
}

console.log('\n2. Удалить все спецсимволы:');
console.log(JSON.stringify(removeSpecialChars(testText)));

// Функция 3: Заменяем пробелы на переносы (основная логика)
function spacesToParagraphs(text) {
    return text.replace(/\s+/g, '\n');
}

console.log('\n3. Пробелы на абзацы:');
console.log(JSON.stringify(spacesToParagraphs(testText)));

// Функция 4: Нижний регистр
function toLowerCase(text) {
    return text.toLowerCase();
}

console.log('\n4. Результат в нижний регистр:');
console.log(JSON.stringify(toLowerCase(spacesToParagraphs(testText))));

// Функция 5: Каждый абзац с большой буквы
function capitalizeEach(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.charAt(0).toUpperCase() + line.slice(1).toLowerCase())
        .join('\n');
}

console.log('\n5. Каждый абзац с большой буквы:');
console.log(JSON.stringify(capitalizeEach(spacesToParagraphs(testText))));

// Функция 6: Полная обработка с удалением знаков препинания
function fullProcessPunctuation(text) {
    let result = text;
    result = removePunctuation(result);  // удаляем знаки препинания
    result = spacesToParagraphs(result); // пробелы на абзацы
    result = capitalizeEach(result);     // каждый абзац с большой буквы
    return result;
}

console.log('\n6. Полная обработка (удаление знаков препинания + каждый абзац с большой буквы):');
console.log(JSON.stringify(fullProcessPunctuation(testText)));
console.log('Визуально:');
console.log(fullProcessPunctuation(testText));

// Функция 7: Полная обработка с удалением спецсимволов
function fullProcessSpecial(text) {
    let result = text;
    result = removeSpecialChars(result); // удаляем спецсимволы
    result = spacesToParagraphs(result); // пробелы на абзацы
    result = toLowerCase(result);        // в нижний регистр
    return result;
}

console.log('\n7. Полная обработка (удаление спецсимволов + нижний регистр):');
console.log(JSON.stringify(fullProcessSpecial(testText)));
console.log('Визуально:');
console.log(fullProcessSpecial(testText));

console.log('\n8. Без изменения регистра (caseOption = "none"):');
console.log(JSON.stringify(spacesToParagraphs(testText)));
console.log('Визуально:');
console.log(spacesToParagraphs(testText));
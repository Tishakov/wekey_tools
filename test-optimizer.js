// Тест всех функций оптимизации текста
const testText = `   привет,мир!как дела?отлично.    а   у    тебя?
тоже хорошо.
это новая строка(но без пробела перед скобкой)и после скобки тоже нет пробела.`;

console.log('Исходный текст:');
console.log(JSON.stringify(testText));
console.log('Визуально:');
console.log(testText);
console.log('\n=== ТЕСТЫ ОПТИМИЗАЦИИ ===\n');

// Функция 1: removeTrimSpaces (удаление пробелов в начале и конце строк)
function removeTrimSpaces(text) {
    return text.split('\n').map(line => line.trim()).join('\n');
}

console.log('1. Удалить лишние пробелы:');
console.log(JSON.stringify(removeTrimSpaces(testText)));

// Функция 2: addNeededSpaces (добавление пробелов после знаков пунктуации)
function addNeededSpaces(text) {
    return text
        .replace(/([.!?,:;])([а-яёa-zA-ZА-ЯЁ0-9])/g, '$1 $2')
        .replace(/([)])([\wа-яёА-ЯЁ])/g, '$1 $2')
        .replace(/([\wа-яёА-ЯЁ])([(])/g, '$1 $2');
}

console.log('\n2. Добавить нужные пробелы:');
console.log(JSON.stringify(addNeededSpaces(testText)));

// Функция 3: replaceMultipleSpaces (замена множественных пробелов на одинарные)
function replaceMultipleSpaces(text) {
    return text.replace(/[ ]{2,}/g, ' ');
}

console.log('\n3. Двойные пробелы заменить на пробелы:');
console.log(JSON.stringify(replaceMultipleSpaces(testText)));

// Функция 4: fixCapitalization (исправление регистра после знаков препинания)
function fixCapitalization(text) {
    return text
        .replace(/([.!?])\s+([а-яёa-z])/g, (_, punct, letter) => {
            return punct + ' ' + letter.toUpperCase();
        })
        .replace(/^([а-яёa-z])/, (_, letter) => letter.toUpperCase());
}

console.log('\n4. Расставить корректный регистр:');
console.log(JSON.stringify(fixCapitalization(testText)));

// Функция 5: createParagraphs (создание абзацев)
function createParagraphs(text) {
    return text.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
}

console.log('\n5. Сделать абзацы:');
console.log(JSON.stringify(createParagraphs(testText)));

// Функция 6: optimizeAll (все функции вместе)
function optimizeAll(text) {
    let result = text;
    result = removeTrimSpaces(result);
    result = addNeededSpaces(result);
    result = replaceMultipleSpaces(result);
    result = fixCapitalization(result);
    result = createParagraphs(result);
    return result;
}

console.log('\n6. Все вышеперечисленное:');
console.log(JSON.stringify(optimizeAll(testText)));
console.log('Визуально:');
console.log(optimizeAll(testText));
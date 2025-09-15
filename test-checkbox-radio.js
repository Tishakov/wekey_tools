// Тест логики "Удаление пустых строк" с чекбоксом + радио-кнопками
const testText = `Первая строка
Вторая строка

Четвертая строка
Пятая строка с ошибкой

Седьмая строка
Восьмая строка с ошибкой

Десятая строка`;

console.log('Исходный текст:');
console.log(JSON.stringify(testText));
console.log('Визуально:');
console.log('---');
console.log(testText);
console.log('---');

console.log('\n=== ТЕСТЫ С ЧЕКБОКСОМ + РАДИО-КНОПКАМИ ===\n');

// Функция обработки текста (чекбокс + радио-кнопки)
function processText(text, removeEmptyLines, filterOption, containsFilter, notContainsFilter) {
    if (!text.trim()) return '';

    let lines = text.split('\n');

    console.log(`Строк до обработки: ${lines.length}`);
    console.log('Строки до обработки:', lines);
    console.log(`Чекбокс "Удалить пустые строки": ${removeEmptyLines}`);
    console.log(`Радио-фильтр: ${filterOption || 'не выбран'}`);

    // Применяем фильтры
    
    // 1. Удалить пустые строки (чекбокс)
    if (removeEmptyLines) {
        lines = lines.filter(line => line.trim().length > 0);
        console.log(`После удаления пустых строк: ${lines.length} строк`);
        console.log('Строки:', lines);
    }

    // 2. Применяем выбранный радио-фильтр
    if (filterOption === 'removeContains' && containsFilter.trim()) {
        lines = lines.filter(line => !line.includes(containsFilter.trim()));
        console.log(`После удаления строк с "${containsFilter}": ${lines.length} строк`);
        console.log('Строки:', lines);
    } else if (filterOption === 'removeNotContains' && notContainsFilter.trim()) {
        lines = lines.filter(line => line.includes(notContainsFilter.trim()));
        console.log(`После удаления строк, НЕ содержащих "${notContainsFilter}": ${lines.length} строк`);
        console.log('Строки:', lines);
    }

    return lines.join('\n');
}

// Тест 1: Только чекбокс "Удалить пустые строки"
console.log('\n1. Только чекбокс: Удалить пустые строки');
const result1 = processText(testText, true, '', '', '');
console.log('Результат:');
console.log(result1);

// Тест 2: Только радио "Удалить строки, которые содержат"
console.log('\n2. Только радио: Удалить строки, которые содержат "ошибкой"');
const result2 = processText(testText, false, 'removeContains', 'ошибкой', '');
console.log('Результат:');
console.log(result2);

// Тест 3: Комбинация чекбокс + радио
console.log('\n3. Комбинация: Удалить пустые строки + удалить строки с "ошибкой"');
const result3 = processText(testText, true, 'removeContains', 'ошибкой', '');
console.log('Результат:');
console.log(result3);

// Тест 4: Чекбокс + радио "НЕ содержат"
console.log('\n4. Комбинация: Удалить пустые строки + оставить только строки с "строка"');
const result4 = processText(testText, true, 'removeNotContains', '', 'строка');
console.log('Результат:');
console.log(result4);

// Тест 5: Без фильтров
console.log('\n5. Без фильтров (должен вернуть исходный текст)');
const result5 = processText(testText, false, '', '', '');
console.log('Результат:');
console.log(result5);

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
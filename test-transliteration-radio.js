// Тест механики радио-кнопок как в TransliterationTool

let caseOption = ''; // Начальное состояние

function handleRadioClick(currentValue, clickedValue) {
    console.log(`\nКлик на радио-кнопку: ${clickedValue}`);
    console.log(`Текущее состояние до клика: "${currentValue}"`);
    
    // Логика из TransliterationTool
    if (currentValue === clickedValue) {
        caseOption = ''; // Снимаем выбор если кликнули по уже выбранной радиокнопке
    } else {
        caseOption = clickedValue; // Устанавливаем новое значение
    }
    
    console.log(`Новое состояние после клика: "${caseOption}"`);
    console.log(`Радио-кнопка "lowercase" checked: ${caseOption === 'lowercase'}`);
    console.log(`Радио-кнопка "capitalizeEach" checked: ${caseOption === 'capitalizeEach'}`);
    return caseOption;
}

console.log('=== ТЕСТ МЕХАНИКИ ТРАНСЛИТЕРАЦИИ ===');

console.log('\nНачальное состояние:');
console.log(`caseOption: "${caseOption}"`);
console.log(`Радио-кнопка "lowercase" checked: ${caseOption === 'lowercase'}`);
console.log(`Радио-кнопка "capitalizeEach" checked: ${caseOption === 'capitalizeEach'}`);

// Тест 1: Первый клик на "lowercase"
caseOption = handleRadioClick(caseOption, 'lowercase');

// Тест 2: Повторный клик на "lowercase" (должен деактивировать)
caseOption = handleRadioClick(caseOption, 'lowercase');

// Тест 3: Клик на "capitalizeEach"
caseOption = handleRadioClick(caseOption, 'capitalizeEach');

// Тест 4: Клик на "lowercase" (должен переключиться)
caseOption = handleRadioClick(caseOption, 'lowercase');

// Тест 5: Повторный клик на "lowercase" (должен деактивировать)
caseOption = handleRadioClick(caseOption, 'lowercase');

// Тест 6: Клик на "capitalizeEach"
caseOption = handleRadioClick(caseOption, 'capitalizeEach');

// Тест 7: Повторный клик на "capitalizeEach" (должен деактивировать)
caseOption = handleRadioClick(caseOption, 'capitalizeEach');

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
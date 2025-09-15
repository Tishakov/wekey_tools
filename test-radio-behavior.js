// Симуляция поведения радио-кнопок для тестирования логики

let currentState = 'none'; // Начальное состояние

function simulateRadioClick(option) {
    console.log(`\nКлик на радио-кнопку: ${option}`);
    console.log(`Текущее состояние до клика: ${currentState}`);
    
    // Логика из handleRadioChange
    currentState = currentState === option ? 'none' : option;
    
    console.log(`Новое состояние после клика: ${currentState}`);
    console.log(`Радио-кнопка "${option}" активна: ${currentState === option}`);
    console.log(`Радио-кнопка "lowercase" checked: ${currentState === 'lowercase'}`);
    console.log(`Радио-кнопка "capitalizeEach" checked: ${currentState === 'capitalizeEach'}`);
}

console.log('=== ТЕСТ ПОВЕДЕНИЯ РАДИО-КНОПОК ===');

console.log('\nНачальное состояние:');
console.log(`caseOption: ${currentState}`);
console.log(`Радио-кнопка "lowercase" checked: ${currentState === 'lowercase'}`);
console.log(`Радио-кнопка "capitalizeEach" checked: ${currentState === 'capitalizeEach'}`);

// Тест 1: Первый клик на "lowercase"
simulateRadioClick('lowercase');

// Тест 2: Повторный клик на "lowercase" (должен деактивировать)
simulateRadioClick('lowercase');

// Тест 3: Клик на "capitalizeEach"
simulateRadioClick('capitalizeEach');

// Тест 4: Клик на "lowercase" (должен переключиться)
simulateRadioClick('lowercase');

// Тест 5: Повторный клик на "lowercase" (должен деактивировать)
simulateRadioClick('lowercase');

// Тест 6: Клик на "capitalizeEach"
simulateRadioClick('capitalizeEach');

// Тест 7: Повторный клик на "capitalizeEach" (должен деактивировать)
simulateRadioClick('capitalizeEach');

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
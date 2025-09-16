// Тест функции транслитерации UTM генератора

const transliterateText = (text) => {
    return text
        .trim() // убираем пробелы в начале и конце
        .toLowerCase() // приводим к нижнему регистру
        .replace(/[''""«»„"]/g, '') // удаляем апострофы и кавычки (включая разные типы кавычек)
        .replace(/[^\w\s\-\/\.]/g, '') // удаляем все спецсимволы кроме букв, цифр, пробелов, дефисов, слешей и точек
        .replace(/\s+/g, '-') // заменяем все виды пробелов (в том числе множественные) на дефис
        .replace(/-+/g, '-') // заменяем множественные дефисы на один
        .replace(/\/+/g, '/') // заменяем множественные слеши на один
        .replace(/^-+|-+$/g, ''); // убираем дефисы в начале и конце
};

// Тестовые случаи
const testCases = [
    {
        input: '  My Campaign Name  ',
        expected: 'my-campaign-name',
        description: 'Пробелы в начале/конце и между словами'
    },
    {
        input: 'Campaign with "quotes" and \'apostrophes\'',
        expected: 'campaign-with-quotes-and-apostrophes',
        description: 'Кавычки и апострофы'
    },
    {
        input: 'Special @#$% symbols!',
        expected: 'special-symbols',
        description: 'Спецсимволы'
    },
    {
        input: 'Multiple   spaces    between words',
        expected: 'multiple-spaces-between-words',
        description: 'Множественные пробелы'
    },
    {
        input: 'URL//path///page',
        expected: 'url/path/page',
        description: 'Множественные слеши'
    },
    {
        input: '---start-middle---end---',
        expected: 'start-middle-end',
        description: 'Множественные дефисы'
    },
    {
        input: 'example.com/path',
        expected: 'example.com/path',
        description: 'Обычный URL'
    }
];

console.log('🧪 Тестирование функции транслитерации UTM генератора\n');

testCases.forEach((testCase, index) => {
    const result = transliterateText(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`Тест ${index + 1}: ${testCase.description}`);
    console.log(`Входные данные: "${testCase.input}"`);
    console.log(`Ожидается: "${testCase.expected}"`);
    console.log(`Получено: "${result}"`);
    console.log(`Результат: ${passed ? '✅ ПРОШЁЛ' : '❌ НЕ ПРОШЁЛ'}\n`);
});
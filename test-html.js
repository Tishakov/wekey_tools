// Тест логики конвертации текста в HTML
const testText = `Первый абзац
Вторая строка первого абзаца
Третья строка первого абзаца

Второй абзац
Вторая строка второго абзаца

Третий абзац`;

console.log('Исходный текст:');
console.log(testText);
console.log('\n=== ТЕСТЫ HTML КОНВЕРТАЦИИ ===\n');

// 1. Функция для конвертации в теги абзацев <p>
function convertToParagraphs(text) {
    if (!text.trim()) return '';
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => `<p>${line.trim()}</p>`).join('\n');
}

console.log('1. <p> - только тег абзаца:');
console.log(convertToParagraphs(testText));

// 2. Функция для конвертации в теги переносов <br>
function convertToLineBreaks(text) {
    if (!text.trim()) return '';
    
    return text.replace(/\n/g, '<br>');
}

console.log('\n2. <br> - только тег строки:');
console.log(convertToLineBreaks(testText));

// 3. Функция для смешанной конвертации <br> and <p>
function convertToMixed(text) {
    if (!text.trim()) return '';
    
    // Разбиваем текст на абзацы (разделенные пустыми строками)
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs
        .filter(paragraph => paragraph.trim() !== '')
        .map(paragraph => {
            // Внутри каждого абзаца заменяем переносы на <br>, а затем оборачиваем в <p>
            const lines = paragraph.trim().replace(/\n/g, '<br>');
            return `<p>${lines}</p>`;
        })
        .join('\n');
}

console.log('\n3. <br> and <p> - теги строки и абзаца:');
console.log(convertToMixed(testText));
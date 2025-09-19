import fs from 'fs';
import path from 'path';

const emojiFiles = [
    { file: 'baseEmoji.ts', description: 'Базовые (лица, еда, природа, спорт)' },
    { file: 'travelEmoji.ts', description: 'Путешествия' },
    { file: 'activityEmoji.ts', description: 'Активности' },
    { file: 'flagsEmoji.ts', description: 'Флаги' },
    { file: 'techEmoji.ts', description: 'Технологии' },
    { file: 'clothesEmoji.ts', description: 'Одежда' },
    { file: 'jobsEmoji.ts', description: 'Профессии' },
    { file: 'symbolsEmoji.ts', description: 'Символы' },
    { file: 'gesturesEmoji.ts', description: 'Жесты' },
    { file: 'musicEmoji.ts', description: 'Музыка' },
    { file: 'weatherEmoji.ts', description: 'Погода' }
];

let totalEmoji = 0;
console.log('=== АНАЛИЗ РАЗМЕРОВ КАТЕГОРИЙ EMOJI ===\n');

emojiFiles.forEach(({ file, description }) => {
    try {
        const content = fs.readFileSync(path.join('src/data/emoji', file), 'utf8');
        const matches = content.match(/emoji: '/g);
        const count = matches ? matches.length : 0;
        console.log(`${description}: ${count} emoji`);
        totalEmoji += count;
    } catch (error) {
        console.log(`${description}: файл не найден`);
    }
});

console.log(`\nОбщее количество emoji: ${totalEmoji}`);
console.log('\n=== РЕКОМЕНДАЦИИ ДЛЯ РАСШИРЕНИЯ ===');
console.log('Малые категории (нужно расширить):');
console.log('- Погода: 4 emoji (добавить времена года, природные явления)');
console.log('- Технологии: 7 emoji (добавить современные устройства)');
console.log('- Одежда: 7 emoji (добавить обувь, аксессуары)');
console.log('\nВозможные новые категории:');
console.log('- Образование (книги, школа, учеба)');
console.log('- Медицина (здоровье, больница)');
console.log('- Транспорт (машины, поезда)');
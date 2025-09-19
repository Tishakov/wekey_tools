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
    { file: 'weatherEmoji.ts', description: 'Погода' },
    { file: 'educationEmoji.ts', description: 'Образование' }
];

let totalEmoji = 0;
console.log('=== ТЕКУЩИЙ АНАЛИЗ ВСЕХ КАТЕГОРИЙ EMOJI ===\n');

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

console.log('\n=== АНАЛИЗ ДЛЯ ДОБАВЛЕНИЯ 13 НОВЫХ EMOJI ===');
console.log('Малые категории (приоритет для расширения):');
console.log('- Технологии: 7 emoji → можно добавить 3-4');
console.log('- Символы: 7 emoji → можно добавить 2-3');
console.log('- Жесты: 7 emoji → можно добавить 2-3');
console.log('- Погода: 7 emoji → можно добавить 2');

console.log('\nПотенциальные новые категории:');
console.log('- Транспорт (машины, поезда, самолеты) - популярная тема');
console.log('- Медицина (здоровье, больница) - важная тема');
console.log('- Дом/Быт (мебель, предметы интерьера)');

console.log('\nРЕКОМЕНДУЕМАЯ СТРАТЕГИЯ ДЛЯ 13 EMOJI:');
console.log('Создать категорию "Транспорт" (6 emoji) + расширить малые категории (7 emoji)');
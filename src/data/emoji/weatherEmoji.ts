import type { EmojiItem } from './baseEmoji';

// Новые emoji для категории "Погода"
export const weatherEmoji: EmojiItem[] = [
    { emoji: '☀️', keywords: ['sun', 'солнце', 'сонце', 'sunny'], category: 'weather' },
    { emoji: '🌧️', keywords: ['rain', 'дождь', 'дощ', 'rainy'], category: 'weather' },
    { emoji: '❄️', keywords: ['snow', 'снег', 'сніг', 'snowflake'], category: 'weather' },
    { emoji: '⛈️', keywords: ['storm', 'гроза', 'гроза', 'thunder'], category: 'weather' },
    { 
        emoji: '🌤️', 
        keywords: ['cloudy', 'облачно', 'хмарно', 'partly cloudy', 'clouds', 'облака', 'хмари'], 
        category: 'weather' 
    },
    { 
        emoji: '🌈', 
        keywords: ['rainbow', 'радуга', 'веселка', 'colors', 'цвета', 'кольори', 'rain'], 
        category: 'weather' 
    },
    { 
        emoji: '🌪️', 
        keywords: ['tornado', 'торнадо', 'ураган', 'смерч', 'hurricane', 'wind', 'ветер'], 
        category: 'weather' 
    }
];
import type { EmojiItem } from './baseEmoji';

// Новые emoji для категории "Погода"
export const weatherEmoji: EmojiItem[] = [
    { emoji: '☀️', keywords: ['sun', 'солнце', 'сонце', 'sunny'], category: 'weather' },
    { emoji: '🌧️', keywords: ['rain', 'дождь', 'дощ', 'rainy'], category: 'weather' },
    { emoji: '❄️', keywords: ['snow', 'снег', 'сніг', 'snowflake'], category: 'weather' },
    { emoji: '⛈️', keywords: ['storm', 'гроза', 'гроза', 'thunder'], category: 'weather' }
];
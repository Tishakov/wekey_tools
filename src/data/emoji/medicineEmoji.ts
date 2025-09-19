import type { EmojiItem } from './baseEmoji';

// Новые emoji для категории "Медицина"
export const medicineEmoji: EmojiItem[] = [
    { 
        emoji: '💊', 
        keywords: ['pill', 'таблетка', 'лекарство', 'medicine', 'pills', 'ліки', 'таблетки', 'здоровье'], 
        category: 'medicine' 
    },
    { 
        emoji: '🏥', 
        keywords: ['hospital', 'больница', 'лікарня', 'медицина', 'health', 'clinic', 'клиника'], 
        category: 'medicine' 
    },
    { 
        emoji: '🩺', 
        keywords: ['stethoscope', 'стетоскоп', 'врач', 'doctor', 'лікар', 'медицина', 'обследование'], 
        category: 'medicine' 
    },
    { 
        emoji: '💉', 
        keywords: ['syringe', 'шприц', 'укол', 'инъекция', 'прививка', 'injection', 'vaccine'], 
        category: 'medicine' 
    }
];
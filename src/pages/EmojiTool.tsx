import React, { useState, useEffect, useRef } from 'react';
import './EmojiTool.css';
import '../styles/tool-pages.css';
import { EmojiImage } from '../utils/emojiUtils';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { emojiDatabase } from '../data/emoji/index';

const EmojiTool: React.FC = () => {
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [launchCount, setLaunchCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Категории с алфавитной сортировкой (кроме "Все")
    const categories = [
        { id: 'all', name: 'Все', icon: '😀' },
        { id: 'activities', name: 'Активности', icon: '⚽' },
        { id: 'animals', name: 'Животные', icon: '🐶' },
        { id: 'gestures', name: 'Жесты', icon: '👋' },
        { id: 'food', name: 'Еда', icon: '🍎' },
        { id: 'faces', name: 'Лица', icon: '😍' },
        { id: 'medicine', name: 'Медицина', icon: '💊' },
        { id: 'music', name: 'Музыка', icon: '🎵' },
        { id: 'objects', name: 'Объекты', icon: '💎' },
        { id: 'clothes', name: 'Одежда', icon: '👕' },
        { id: 'education', name: 'Образование', icon: '📚' },
        { id: 'weather', name: 'Погода', icon: '☀️' },
        { id: 'nature', name: 'Природа', icon: '🌟' },
        { id: 'jobs', name: 'Профессии', icon: '👩‍💻' },
        { id: 'travel', name: 'Путешествия', icon: '✈️' },
        { id: 'hearts', name: 'Сердца', icon: '❤️' },
        { id: 'symbols', name: 'Символы', icon: '⭐' },
        { id: 'tech', name: 'Технологии', icon: '💻' },
        { id: 'transport', name: 'Транспорт', icon: '🚗' },
        { id: 'flags', name: 'Флаги', icon: '🏁' }
    ];

    // Обновление статистики
    useEffect(() => {
        statsService.incrementLaunchCount('emoji');
        const count = statsService.getLaunchCount('emoji');
        setLaunchCount(count);
    }, []);

    // Фильтрация emoji по поисковому запросу и категории
    const filteredEmojis = emojiDatabase.filter((item: any) => {
        // Фильтр по категории
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
            return false;
        }
        
        // Фильтр по поиску
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return item.keywords.some((keyword: string) => 
            keyword.toLowerCase().includes(query)
        );
    });

    // Функции для работы с текстом
    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            // Fallback: добавляем в конец, если ref недоступен
            setText(prev => prev + emoji);
            return;
        }

        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        setText(prev => {
            const newText = prev.slice(0, startPos) + emoji + prev.slice(endPos);
            
            // Устанавливаем курсор после вставленного эмодзи
            setTimeout(() => {
                textarea.focus();
                const newCursorPos = startPos + emoji.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
            
            return newText;
        });
    };

    // Функция копирования результата
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка копирования:', err);
        }
    };

    return (
        <div className="emoji-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Эмодзи</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title="Счетчик запусков">
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title="Подсказки">
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title="Скриншот">
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область */}
            <div className="main-workspace">
                {/* Левая панель - редактор текста */}
                <div className="emoji-text-editor">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Введите текст или добавьте эмодзи..."
                        className="emoji-textarea"
                    />
                    
                    {/* Кнопка копирования */}
                    <button 
                        className="action-btn secondary icon-left" 
                        style={{ width: '445px' }} 
                        onClick={handleCopy}
                    >
                        <img src="/icons/button_copy.svg" alt="" />
                        {copied ? 'Скопировано!' : 'Скопировать результат'}
                    </button>
                </div>

                {/* Правая панель - библиотека эмодзи */}
                <div className="emoji-library">
                    <div className="emoji-library-header">
                        {/* Поиск эмодзи */}
                        <div className="emoji-search-container">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Поиск эмодзи..."
                                className="emoji-search"
                            />
                        </div>
                        
                        {/* Навигация по категориям */}
                        <div className="emoji-categories">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(category.id)}
                                    title={category.name}
                                >
                                    <EmojiImage emoji={category.icon} size={20} />
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Все эмодзи */}
                    <div className="emoji-all-section">
                        <h4>Все эмодзи ({filteredEmojis.length})</h4>
                        <div className="emoji-grid">
                            {filteredEmojis.map((item: any, index: number) => (
                                <div
                                    key={index}
                                    className="emoji-item"
                                    onClick={() => insertEmoji(item.emoji)}
                                    title={`${item.emoji} - ${item.keywords.slice(0, 3).join(', ')}`}
                                >
                                    <EmojiImage emoji={item.emoji} size={24} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {filteredEmojis.length === 0 && searchQuery && (
                        <div className="no-results">
                            Эмодзи не найдены. Попробуйте другой поисковый запрос.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmojiTool;

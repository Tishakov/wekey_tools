import React, { useState, useEffect } from 'react';
import './EmojiTool.css';
import '../styles/tool-pages.css';
import { EmojiImage } from '../utils/emojiUtils';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { emojiDatabase } from '../data/emoji';

const EmojiTool: React.FC = () => {
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Обновим категории чтобы включить новые
    const categories = [
        { id: 'all', name: 'Все', icon: '😀' },
        { id: 'faces', name: 'Лица', icon: '😀' },
        { id: 'hearts', name: 'Сердца', icon: '❤️' },
        { id: 'animals', name: 'Животные', icon: '🐶' },
        { id: 'food', name: 'Еда', icon: '🍎' },
        { id: 'nature', name: 'Природа', icon: '🌟' },
        { id: 'objects', name: 'Объекты', icon: '🎉' },
        { id: 'travel', name: 'Путешествия', icon: '✈️' },
        { id: 'activities', name: 'Активности', icon: '⚽' },
        { id: 'flags', name: 'Флаги', icon: '🏁' },
        { id: 'tech', name: 'Технологии', icon: '📱' },
        { id: 'clothes', name: 'Одежда', icon: '👕' },
        { id: 'jobs', name: 'Профессии', icon: '👩‍💻' },
        { id: 'symbols', name: 'Символы', icon: '⭐' },
        { id: 'gestures', name: 'Жесты', icon: '👍' },
        { id: 'music', name: 'Музыка', icon: '🎵' },
        { id: 'weather', name: 'Погода', icon: '☀️' },
        { id: 'education', name: 'Образование', icon: '📚' },
        { id: 'transport', name: 'Транспорт', icon: '🚗' },
        { id: 'medicine', name: 'Медицина', icon: '💊' }
    ];

    // Обновление статистики
    useEffect(() => {
        statsService.incrementLaunchCount('emoji');
        const count = statsService.getLaunchCount('emoji');
        setLaunchCount(count);
    }, []);

    // Фильтрация emoji по поисковому запросу и категории
    const filteredEmojis = emojiDatabase.filter(item => {
        // Фильтр по категории
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
            return false;
        }
        
        // Фильтр по поиску
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return item.keywords.some(keyword => 
            keyword.toLowerCase().includes(query)
        );
    });

    // Функции для работы с текстом
    const insertEmoji = (emoji: string) => {
        setText(prev => prev + emoji);
    };

    const clearText = () => {
        setText('');
    };

    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Ошибка копирования:', error);
        }
    };

    const pasteText = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(clipboardText);
        } catch (error) {
            console.error('Ошибка вставки:', error);
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
                    <div className="text-editor-header">
                        <h3>Редактор текста</h3>
                        <div className="text-editor-actions">
                            <button 
                                onClick={copyText} 
                                className={`action-btn copy ${copied ? 'copied' : ''}`}
                                title="Копировать текст"
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                            <button 
                                onClick={pasteText} 
                                className="action-btn paste"
                                title="Вставить из буфера"
                            >
                                📄
                            </button>
                            <button 
                                onClick={clearText} 
                                className="action-btn clear"
                                title="Очистить текст"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Введите текст или добавьте эмодзи..."
                        className="emoji-textarea"
                    />
                    <div className="text-stats">
                        Символов: {text.length}
                    </div>
                </div>

                {/* Правая панель - библиотека эмодзи */}
                <div className="emoji-library">
                    <div className="emoji-library-header">
                        <h3>Библиотека эмодзи</h3>
                        
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
                        
                        <div className="emoji-search-container">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Поиск эмодзи..."
                                className="emoji-search"
                            />
                        </div>
                    </div>

                    {/* Все эмодзи */}
                    <div className="emoji-all-section">
                        <h4>Все эмодзи ({filteredEmojis.length})</h4>
                        <div className="emoji-grid">
                            {filteredEmojis.map((item, index) => (
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

import React, { useState, useEffect } from 'react';
import './EmojiTool.css';
import { EmojiImage } from '../utils/emojiUtils';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { emojiDatabase } from '../data/emoji';

const EmojiTool: React.FC = () => {
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([]);
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
        { id: 'weather', name: 'Погода', icon: '☀️' }
    ];

    // Инициализация избранного
    useEffect(() => {
        const stored = localStorage.getItem('emoji-favorites');
        if (stored) {
            setFavoriteEmojis(JSON.parse(stored));
        }
    }, []);

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

    // Функции для работы с избранным
    const toggleFavorite = (emoji: string) => {
        const newFavorites = favoriteEmojis.includes(emoji)
            ? favoriteEmojis.filter(e => e !== emoji)
            : [...favoriteEmojis, emoji];
        
        setFavoriteEmojis(newFavorites);
        localStorage.setItem('emoji-favorites', JSON.stringify(newFavorites));
    };

    const clearFavorites = () => {
        setFavoriteEmojis([]);
        localStorage.removeItem('emoji-favorites');
    };

    return (
        <div className="tool-page emoji-tool">
            <div className="tool-header">
                <div className="tool-header-icon">
                    <img src="/icons/tool_emoji.svg" alt="Эмодзи" />
                </div>
                <div className="tool-header-content">
                    <h1>Эмодзи</h1>
                    <p>Библиотека эмодзи для копирования и работы с текстом</p>
                    <div className="tool-stats">
                        Запусков: {launchCount}
                    </div>
                </div>
            </div>

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

                    {/* Избранные эмодзи */}
                    {favoriteEmojis.length > 0 && (
                        <div className="emoji-favorites-section">
                            <div className="favorites-header">
                                <h4>Избранные</h4>
                                <button 
                                    onClick={clearFavorites}
                                    className="clear-favorites-btn"
                                    title="Очистить избранное"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="emoji-grid favorites-grid">
                                {favoriteEmojis.map((emoji, index) => (
                                    <div
                                        key={`fav-${index}`}
                                        className="emoji-item favorite"
                                        onClick={() => insertEmoji(emoji)}
                                        title={`Добавить ${emoji} в текст`}
                                    >
                                        <EmojiImage emoji={emoji} size={24} />
                                        <button
                                            className="favorite-btn active"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(emoji);
                                            }}
                                            title="Убрать из избранного"
                                        >
                                            ⭐
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                    <button
                                        className={`favorite-btn ${favoriteEmojis.includes(item.emoji) ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item.emoji);
                                        }}
                                        title={favoriteEmojis.includes(item.emoji) ? 'Убрать из избранного' : 'Добавить в избранное'}
                                    >
                                        {favoriteEmojis.includes(item.emoji) ? '⭐' : '☆'}
                                    </button>
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

            <div className="tool-footer">
                <div className="navigation-hint">
                    ← Назад к <Link to="/">Главной</Link>
                </div>
                <div className="tool-description">
                    <p>
                        <strong>Эмодзи</strong> — инструмент для работы с эмодзи. 
                        Поддерживает поиск на русском, украинском и английском языках, 
                        избранные эмодзи и редактирование текста.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmojiTool;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { toolsService } from '../services/toolsService';
import type { Tool } from '../utils/toolsConfig';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { createLink } = useLocalizedLink();
  const [tools, setTools] = useState<Tool[]>([]);
  
  // Функция для получения переведенного названия инструмента
  const getToolName = (toolId: string, fallbackTitle: string) => {
    const translationKey = `tools.names.${toolId}`;
    const translated = t(translationKey);
    console.log('🔧 [Sidebar] Tool translation:', { toolId, translationKey, translated, fallbackTitle });
    // Если перевод не найден, возвращаем fallback
    return translated !== translationKey ? translated : fallbackTitle;
  };
  
  // Список готовых инструментов (которые мы уже разработали)
  const completedTools = [
    'case-changer',           // Изменения регистра
    'remove-duplicates',      // Удаление дубликатов  
    'duplicate-finder',       // Поиск дубликатов
    'text-to-html',          // Текст в HTML
    'text-optimizer',        // Оптимизатор текста
    'spaces-to-paragraphs',  // Пробелы на абзацы
    'text-sorting',          // Сортировка слов и строк
    'remove-empty-lines',    // Удаление пустых строк
    'transliteration',       // Транслитерация (был готов ранее)
    'minus-words',           // Обработка минус-слов
    'utm-generator',         // Генератор UTM-меток
    'cross-analytics',       // Сквозная аналитика
    'word-gluing',           // Склейка слов
    'word-mixer',           // Миксация слов
    'remove-line-breaks',    // Удаление переносов
    'add-symbol',            // Добавление символа
    'find-replace',          // Найти и заменить
    'text-generator',        // Генератор текста
    'synonym-generator',     // Генератор синонимов
    'word-declension',       // Склонение слов
    'text-by-columns',       // Текст по столбцам
    'char-counter',          // Количество символов
    'match-types',           // Типы соответствия
    'number-generator',      // Генератор чисел
    'password-generator',    // Генератор паролей
    'emoji'                  // Эмодзи
  ];
  
  // Список инструментов с ИИ интеграцией
  const aiTools = [
    'synonym-generator',     // Генератор синонимов
    'text-generator',        // Генератор текста  
    'cross-analytics',       // Сквозная аналитика
    'word-declension'        // Склонение слов
  ];

  useEffect(() => {
    const loadTools = async () => {
      try {
        const activeTools = await toolsService.getActiveTools();
        setTools(activeTools);
      } catch (error) {
        console.error('Ошибка загрузки инструментов в сайдбаре:', error);
      }
    };

    loadTools();
  }, [t]); // Добавляем t в зависимости, чтобы обновлялось при смене языка
  
  // Сортируем инструменты по переведенным названиям
  const sortedTools = [...tools].sort((a, b) => {
    const nameA = getToolName(a.id, a.title);
    const nameB = getToolName(b.id, b.title);
    return nameA.localeCompare(nameB);
  });
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {sortedTools.map((tool) => {
            const isCompleted = completedTools.includes(tool.id);
            // Исправляем проверку активного инструмента - убираем языковой префикс из pathname
            const currentPath = location.pathname.replace(/^\/[a-z]{2}/, '') || '/';
            const isActive = currentPath === tool.path;
            const hasAI = aiTools.includes(tool.id);
            
            return (
              <li key={tool.id} className="sidebar-menu-item">
                <Link 
                  to={createLink(tool.path)} 
                  className={`sidebar-link ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  {getToolName(tool.id, tool.title)}
                  {hasAI && (
                    <img 
                      src="/icons/ai_star.svg" 
                      alt="AI" 
                      className="ai-icon"
                      title={t('navigation.aiTool')}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
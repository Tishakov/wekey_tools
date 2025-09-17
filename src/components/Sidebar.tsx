import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsConfig } from '../utils/toolsConfig';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  // Список готовых инструментов (которые мы уже разработали)
  const completedTools = [
    'case-changer',           // Изменения регистра
    'remove-duplicates',      // Удаление дубликатов  
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
    'find-replace'           // Найти и заменить
  ];
  
  // Сортируем инструменты по алфавиту
  const sortedTools = [...toolsConfig].sort((a, b) => a.title.localeCompare(b.title));
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {sortedTools.map((tool) => {
            const isCompleted = completedTools.includes(tool.id);
            const isActive = location.pathname === tool.path;
            
            return (
              <li key={tool.id} className="sidebar-menu-item">
                <Link 
                  to={tool.path} 
                  className={`sidebar-link ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  {tool.title}
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
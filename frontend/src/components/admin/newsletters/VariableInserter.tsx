import React, { useState, useRef, useEffect } from 'react';
import { useEmailVariables } from '../../../hooks/useEmailVariables';
import type { EmailVariable } from '../../../hooks/useEmailVariables';
import './VariableInserter.css';

interface VariableInserterProps {
  onInsert: (variable: string) => void;
  buttonText?: string;
  buttonIcon?: string;
  position?: 'left' | 'right';
}

const VariableInserter: React.FC<VariableInserterProps> = ({
  onInsert,
  buttonText = 'Переменная',
  buttonIcon = '{{}}',
  position = 'left'
}) => {
  const { grouped, loading } = useEmailVariables();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Фильтрация переменных
  const getFilteredVariables = (): EmailVariable[] => {
    let allVars: EmailVariable[] = [];
    
    if (selectedCategory === 'all') {
      Object.values(grouped).forEach(vars => {
        allVars = [...allVars, ...vars];
      });
    } else {
      allVars = grouped[selectedCategory] || [];
    }

    if (searchTerm) {
      return allVars.filter(v => 
        v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allVars;
  };

  const handleInsert = (variable: EmailVariable) => {
    onInsert(`{{${variable.key}}}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      user: '👤 Пользователь',
      system: '⚙️ Система',
      custom: '🎨 Кастомные'
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      user: '👤',
      system: '⚙️',
      custom: '🎨'
    };
    return icons[category] || '📌';
  };

  const categories = Object.keys(grouped);
  const filteredVariables = getFilteredVariables();

  return (
    <div className="variable-inserter" ref={dropdownRef}>
      <button
        type="button"
        className="variable-inserter-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="btn-icon">{buttonIcon}</span>
        <span className="btn-text">{buttonText}</span>
        <span className={`btn-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className={`variable-dropdown ${position}`}>
          {/* Search */}
          <div className="dropdown-search">
            <input
              type="text"
              placeholder="🔍 Поиск переменной..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Category Tabs */}
          <div className="dropdown-categories">
            <button
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Все
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Variables List */}
          <div className="dropdown-list">
            {loading ? (
              <div className="dropdown-loading">
                <div className="spinner"></div>
                <p>Загрузка...</p>
              </div>
            ) : filteredVariables.length === 0 ? (
              <div className="dropdown-empty">
                <p>Переменные не найдены</p>
              </div>
            ) : (
              filteredVariables.map(variable => (
                <button
                  key={variable.id}
                  className="variable-item"
                  onClick={() => handleInsert(variable)}
                >
                  <div className="variable-header">
                    <span className="variable-icon">
                      {getCategoryIcon(variable.category)}
                    </span>
                    <span className="variable-key">
                      {`{{${variable.key}}}`}
                    </span>
                  </div>
                  <div className="variable-description">
                    {variable.description}
                  </div>
                  {variable.example && (
                    <div className="variable-example">
                      Пример: <span>{variable.example}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="dropdown-footer">
            <span className="footer-hint">
              💡 Переменные автоматически заменяются при отправке
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariableInserter;

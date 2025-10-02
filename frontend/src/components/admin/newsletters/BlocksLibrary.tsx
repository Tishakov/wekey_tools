import React from 'react';
import './BlocksLibrary.css';

const BlocksLibrary: React.FC = () => {
  return (
    <div className="blocks-library-container">
      <div className="coming-soon">
        <div className="coming-soon-icon">📦</div>
        <h2>Библиотека блоков</h2>
        <p>
          Здесь будут храниться переиспользуемые блоки для ваших писем: 
          заголовки, футеры, кнопки призыва к действию и другие элементы.
        </p>
        <div className="features-preview">
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span>Готовые дизайны</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>Drag & Drop</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">♻️</span>
            <span>Переиспользование</span>
          </div>
        </div>
        <span className="badge-coming-soon">🚧 В разработке - ЭТАП 3</span>
      </div>
    </div>
  );
};

export default BlocksLibrary;

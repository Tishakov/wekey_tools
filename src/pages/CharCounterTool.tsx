import React from 'react';

const CharCounterTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_kolichestvo_simvolov.svg" alt="Счетчик символов" />
        </div>
        <h1>Счетчик символов</h1>
        <p>Подсчет символов, слов и строк в тексте</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default CharCounterTool;

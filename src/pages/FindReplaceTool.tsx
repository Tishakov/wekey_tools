import React from 'react';

const FindReplaceTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_nayti_i_zamenit.svg" alt="Найти и заменить" />
        </div>
        <h1>Найти и заменить</h1>
        <p>Поиск и замена текста</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default FindReplaceTool;
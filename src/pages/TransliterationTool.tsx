import React from 'react';

const TransliterationTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_transliteraciya.svg" alt="Транслитерация" />
        </div>
        <h1>Транслитерация</h1>
        <p>Преобразование кириллицы в латиницу и обратно</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default TransliterationTool;

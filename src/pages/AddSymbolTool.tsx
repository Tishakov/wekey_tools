import React from 'react';

const AddSymbolTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_dobavlenie_simvola.svg" alt="Добавление символа" />
        </div>
        <h1>Добавление символа</h1>
        <p>Добавление символов к тексту</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default AddSymbolTool;
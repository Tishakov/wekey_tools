import React from 'react';

const TextGeneratorTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_generator_teksta.svg" alt="Генератор текста" />
        </div>
        <h1>Генератор текста</h1>
        <p>Создание случайного текста</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default TextGeneratorTool;
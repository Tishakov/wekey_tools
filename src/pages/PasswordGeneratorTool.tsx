import React from 'react';

const PasswordGeneratorTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_generator_paroley.svg" alt="Генератор паролей" />
        </div>
        <h1>Генератор паролей</h1>
        <p>Создание надежных паролей</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default PasswordGeneratorTool;
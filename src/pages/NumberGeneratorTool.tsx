import React from 'react';

const NumberGeneratorTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_generator_chisel.svg" alt="Генератор чисел" />
        </div>
        <h1>Генератор чисел</h1>
        <p>Генерация случайных чисел</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default NumberGeneratorTool;
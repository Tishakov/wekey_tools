import React from 'react';

const WordMixerTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_miksaciya_slov.svg" alt="Миксация слов" />
        </div>
        <h1>Миксация слов</h1>
        <p>Перемешивание слов в тексте</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default WordMixerTool;
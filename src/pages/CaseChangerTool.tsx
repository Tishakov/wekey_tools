import React from 'react';

const CaseChangerTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_izmeneniya_registra.svg" alt="Изменения регистра" />
        </div>
        <h1>Изменения регистра</h1>
        <p>Изменение регистра текста</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default CaseChangerTool;
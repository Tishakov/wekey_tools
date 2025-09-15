import React from 'react';

const TextToHtmlTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_tekst_v_html.svg" alt="Текст в HTML" />
        </div>
        <h1>Текст в HTML</h1>
        <p>Конвертация текста в HTML-формат</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default TextToHtmlTool;
